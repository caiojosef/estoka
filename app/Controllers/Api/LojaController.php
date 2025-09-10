<?php
require_once __DIR__ . '/../../../bootstrap.php';

class LojaController
{
    private $db;
    private $model;
    private $tokens;

    public function __construct()
    {
        $this->db = new Database();
        $this->model = new Loja($this->db);   // ajuste se seu model não recebe $db
        $this->tokens = new TokenService();
    }

    public function handle(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'GET') {
            $this->get();
            return;
        }
        if ($method === 'POST') {
            $this->save();
            return;
        }

        Response::error('Method Not Allowed', 405);
    }

    private function getAuthHeader(): ?string
    {
        if (!empty($_SERVER['HTTP_AUTHORIZATION']))
            return $_SERVER['HTTP_AUTHORIZATION'];
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']))
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        if (function_exists('getallheaders')) {
            foreach (getallheaders() as $k => $v) {
                if (strcasecmp($k, 'Authorization') === 0)
                    return $v;
            }
        }
        return null;
    }

    private function authUserId(): int
    {
        $hdr = $this->getAuthHeader();
        if (!$hdr || !preg_match('/Bearer\s+(.+)/i', $hdr, $m)) {
            Response::error('Unauthorized', 401);
            exit;
        }

        $payload = $this->tokens->validate($m[1]);
        if (empty($payload['user_id'])) {
            Response::error('Unauthorized', 401);
            exit;
        }
        return (int) $payload['user_id'];
    }

    // GET /api/loja
    public function get(): void
    {
        $userId = $this->authUserId();
        $row = $this->model->getByUser($userId);
        Response::ok(['data' => $row ?: new \stdClass()]);
    }

    // POST /api/loja
    private function save(): void
    {
        $uid = $this->authUserId();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $data = [
            'nome_fantasia' => trim((string) ($body['nome_fantasia'] ?? '')),
            'descricao' => trim((string) ($body['descricao'] ?? '')),
            'categoria' => trim((string) ($body['categoria'] ?? '')),
            'link_externo' => trim((string) ($body['link_externo'] ?? '')),
            'whatsapp_contato' => trim((string) ($body['whatsapp_contato'] ?? '')),
            'cnpj' => trim((string) ($body['cnpj'] ?? '')),
            'imagem_capa' => trim((string) ($body['imagem_capa'] ?? '')),
            'imagem_logo' => trim((string) ($body['imagem_logo'] ?? '')),
            'cor_destaque' => trim((string) ($body['cor_destaque'] ?? '')),
        ];

        if (strlen($data['nome_fantasia']) > 120) {
            Response::error('nome_fantasia muito longo (máx 120)', 422);
            return;
        }

        try {
            $ok = $this->model->upsertByUser($uid, $data);
            if (!$ok) {
                Response::error('Falha ao salvar', 500);
                return;
            }

            $fresh = $this->model->getByUser($uid) ?: new stdClass();
            Response::ok($fresh);
        } catch (Throwable $e) {
            Response::error('Erro ao salvar', 500, ['detail' => $e->getMessage()]);
        }
    }
}
