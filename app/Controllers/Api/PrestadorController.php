<?php
// app/Controllers/Api/PrestadorController.php

require_once __DIR__ . '/../../../core/Response.php';
require_once __DIR__ . '/../../../core/Validator.php';
require_once __DIR__ . '/../../../core/Database.php';
require_once __DIR__ . '/../../../app/Services/TokenService.php';

final class PrestadorController
{
    /* ---------- Infra (CORS + Auth) ---------- */
    private function headers($methods = ['GET', 'POST', 'OPTIONS'])
    {
        $cfgPath = __DIR__ . '/../../../config/config.php';
        $cfg = file_exists($cfgPath) ? require $cfgPath : ['cors_allowed_origin' => '*'];
        header('Access-Control-Allow-Origin: ' . ($cfg['cors_allowed_origin'] ?? '*'));
        header('Access-Control-Allow-Methods: ' . implode(', ', $methods));
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Access-Control-Max-Age: 86400');
    }

    private function bearerToken()
    {
        $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$hdr && function_exists('getallheaders')) {
            foreach (getallheaders() as $k => $v) {
                if (strcasecmp($k, 'Authorization') === 0) {
                    $hdr = $v;
                    break;
                }
            }
        }
        if ($hdr && preg_match('/Bearer\s+(.+)/i', $hdr, $m))
            return trim($m[1]);
        return null;
    }

    private function authUserId()
    {
        $token = $this->bearerToken();
        if (!$token)
            Response::unauthorized('Missing bearer token');

        $row = TokenService::validateBearer($token);
        if (!$row || empty($row['uid']))
            Response::unauthorized('Invalid/expired token');

        return (int) $row['uid'];
    }

    /* ---------- Roteamento ---------- */
    public function handle()
    {
        $this->headers();

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        switch ($method) {
            case 'GET':
                $this->get();
                break;
            case 'POST':
                $this->save();
                break;
            default:
                Response::error('Method Not Allowed', 405);
        }
    }

    /* ---------- GET /api/prestador ---------- */
    public function get()
    {
        $uid = $this->authUserId();
        $pdo = Database::conn();

        $st = $pdo->prepare("
      SELECT
        p.user_id,
        u.profile_url,
        p.nome_publico, p.bio, p.imagem_perfil,
        p.whatsapp_contato, p.whatsapp_msg, p.atende_online, p.local_atendimento,
        p.cep, p.logradouro, p.numero, p.complemento, p.bairro, p.cidade, p.estado,
        p.especialidades
      FROM prestadores p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ?
      LIMIT 1
    ");
        $st->execute([$uid]);
        $row = $st->fetch(PDO::FETCH_ASSOC);

        Response::ok(['data' => $row ?: (object) []]);
    }

    /* ---------- POST /api/prestador ---------- */
    private function save()
    {
        $uid = $this->authUserId();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo = Database::conn();

        /* --- 1) profile_url (no users) --- */
        if (isset($body['profile_url'])) {
            $handle = strtolower(trim((string) $body['profile_url']));
            if ($handle !== '') {
                if (!preg_match('/^[a-z0-9]{3,30}$/', $handle)) {
                    Response::error('profile_url inválido (use 3-30 chars a-z0-9, minúsculo)', 422);
                }

                $row = $pdo->prepare('SELECT profile_url FROM users WHERE id = ? LIMIT 1');
                $row->execute([$uid]);
                $cur = $row->fetch(PDO::FETCH_ASSOC);

                if (!empty($cur['profile_url']) && $cur['profile_url'] !== $handle) {
                    Response::error('profile_url já definido e não pode ser alterado', 409);
                }

                $ck = $pdo->prepare('SELECT 1 FROM users WHERE profile_url = ? AND id <> ? LIMIT 1');
                $ck->execute([$handle, $uid]);
                if ($ck->fetch()) {
                    Response::error('profile_url indisponível', 409);
                }

                if (empty($cur['profile_url'])) {
                    $up = $pdo->prepare('UPDATE users SET profile_url = ? WHERE id = ?');
                    $up->execute([$handle, $uid]);
                }
            }
        }

        /* --- 2) Campos do prestador --- */
        $d = [
            'nome_publico' => trim((string) ($body['nome_publico'] ?? '')),
            'bio' => trim((string) ($body['bio'] ?? '')),
            'imagem_perfil' => trim((string) ($body['imagem_perfil'] ?? '')),
            'whatsapp_contato' => preg_replace('/\D+/', '', (string) ($body['whatsapp_contato'] ?? '')),
            'whatsapp_msg' => trim((string) ($body['whatsapp_msg'] ?? '')),
            'atende_online' => !empty($body['atende_online']) ? 1 : 0,
            'local_atendimento' => trim((string) ($body['local_atendimento'] ?? '')),
            'cep' => preg_replace('/\D+/', '', (string) ($body['cep'] ?? '')),
            'logradouro' => trim((string) ($body['logradouro'] ?? '')),
            'numero' => trim((string) ($body['numero'] ?? '')),
            'complemento' => trim((string) ($body['complemento'] ?? '')),
            'bairro' => trim((string) ($body['bairro'] ?? '')),
            'cidade' => trim((string) ($body['cidade'] ?? '')),
            'estado' => strtoupper(trim((string) ($body['estado'] ?? ''))),
            'especialidades' => trim((string) ($body['especialidades'] ?? '')),
        ];

        // Validações
        if ($d['nome_publico'] === '')
            Response::error('nome_publico é obrigatório', 422);
        if (mb_strlen($d['nome_publico']) > 120)
            Response::error('nome_publico muito longo (máx 120)', 422);
        if ($d['bio'] !== '' && mb_strlen($d['bio']) > 240)
            Response::error('bio muito longa (máx 240)', 422);
        if ($d['imagem_perfil'] !== '' && mb_strlen($d['imagem_perfil']) > 255)
            Response::error('imagem_perfil muito longa (máx 255)', 422);
        if ($d['whatsapp_contato'] !== '' && mb_strlen($d['whatsapp_contato']) > 20)
            Response::error('whatsapp_contato muito longo', 422);
        if ($d['local_atendimento'] !== '' && mb_strlen($d['local_atendimento']) > 120)
            Response::error('local_atendimento muito longo (máx 120)', 422);
        if ($d['cep'] !== '' && !Validator::cep($d['cep']))
            Response::error('CEP inválido', 422);
        if ($d['estado'] !== '' && !Validator::uf($d['estado']))
            Response::error('UF inválida', 422);

        // UPSERT
        $sql = "
      INSERT INTO prestadores
        (user_id, nome_publico, bio, imagem_perfil, whatsapp_contato, whatsapp_msg,
         atende_online, local_atendimento, cep, logradouro, numero, complemento,
         bairro, cidade, estado, especialidades, created_at, updated_at)
      VALUES
        (:uid, :nome_publico, :bio, :imagem_perfil, :whatsapp_contato, :whatsapp_msg,
         :atende_online, :local_atendimento, :cep, :logradouro, :numero, :complemento,
         :bairro, :cidade, :estado, :especialidades, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        nome_publico      = VALUES(nome_publico),
        bio               = VALUES(bio),
        imagem_perfil     = VALUES(imagem_perfil),
        whatsapp_contato  = VALUES(whatsapp_contato),
        whatsapp_msg      = VALUES(whatsapp_msg),
        atende_online     = VALUES(atende_online),
        local_atendimento = VALUES(local_atendimento),
        cep               = VALUES(cep),
        logradouro        = VALUES(logradouro),
        numero            = VALUES(numero),
        complemento       = VALUES(complemento),
        bairro            = VALUES(bairro),
        cidade            = VALUES(cidade),
        estado            = VALUES(estado),
        especialidades    = VALUES(especialidades),
        updated_at        = NOW()
    ";

        $ok = $pdo->prepare($sql)->execute([
            ':uid' => $uid,
            ':nome_publico' => $d['nome_publico'],
            ':bio' => $d['bio'] ?: null,
            ':imagem_perfil' => $d['imagem_perfil'] ?: null,
            ':whatsapp_contato' => $d['whatsapp_contato'] ?: null,
            ':whatsapp_msg' => $d['whatsapp_msg'] ?: null,
            ':atende_online' => (int) $d['atende_online'],
            ':local_atendimento' => $d['local_atendimento'] ?: null,
            ':cep' => $d['cep'] ?: null,
            ':logradouro' => $d['logradouro'] ?: null,
            ':numero' => $d['numero'] ?: null,
            ':complemento' => $d['complemento'] ?: null,
            ':bairro' => $d['bairro'] ?: null,
            ':cidade' => $d['cidade'] ?: null,
            ':estado' => $d['estado'] ?: null,
            ':especialidades' => $d['especialidades'] ?: null,
        ]);

        if (!$ok)
            Response::error('Falha ao salvar', 500);

        // Retorna estado atualizado
        $st = $pdo->prepare("
      SELECT
        p.user_id,
        u.profile_url,
        p.nome_publico, p.bio, p.imagem_perfil,
        p.whatsapp_contato, p.whatsapp_msg, p.atende_online, p.local_atendimento,
        p.cep, p.logradouro, p.numero, p.complemento, p.bairro, p.cidade, p.estado,
        p.especialidades
      FROM prestadores p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ?
      LIMIT 1
    ");
        $st->execute([$uid]);
        $row = $st->fetch(PDO::FETCH_ASSOC) ?: (object) [];

        Response::ok(['data' => $row]);
    }
}
