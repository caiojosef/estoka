<?php
// app/Controllers/Api/PrestadorController.php
require_once __DIR__ . '/../../../core/Response.php';
require_once __DIR__ . '/../../../core/Validator.php';
require_once __DIR__ . '/../../../core/Database.php';
require_once __DIR__ . '/../../../app/Models/User.php';
require_once __DIR__ . '/../../../app/Services/TokenService.php';

class PrestadorController
{
    private $db;
    private $model;
    private $tokens;

    public function __construct()
    {
        $this->db = new Database();
        $this->tokens = new TokenService();

        // se o model aceitar $db no construtor usa; senão tenta sem
        try {
            $this->model = new \Prestador($this->db);
        } catch (\ArgumentCountError $e) {
            $this->model = new \Prestador();
        }
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

    // GET /api/prestador
    public function get(): void
    {
        $userId = $this->authUserId();
        $row = $this->model->getByUser($userId); // null ou array/obj

        // Quando não houver dados, devolve 200 com objeto vazio
        Response::ok(['data' => $row ?: new \stdClass()]);
    }

    // POST /api/prestador
    private function save(): void
    {
        $uid = $this->authUserId();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $data = [
            'nome_publico' => trim((string) ($body['nome_publico'] ?? '')),
            'bio' => trim((string) ($body['bio'] ?? '')),
            'especialidades' => trim((string) ($body['especialidades'] ?? '')),
            'preco_medio' => trim((string) ($body['preco_medio'] ?? '')),
            'atendimento_online' => !empty($body['atendimento_online']) ? 1 : 0,
            'endereco_atendimento' => trim((string) ($body['endereco_atendimento'] ?? '')),
            'whatsapp_contato' => trim((string) ($body['whatsapp_contato'] ?? '')),
            'link_agendamento' => trim((string) ($body['link_agendamento'] ?? '')),
            'imagem_perfil' => trim((string) ($body['imagem_perfil'] ?? '')),
            'imagem_capa' => trim((string) ($body['imagem_capa'] ?? '')),
            'cor_destaque' => trim((string) ($body['cor_destaque'] ?? '')),
        ];

        if (strlen($data['nome_publico']) > 120) {
            Response::error('nome_publico muito longo (máx 120)', 422);
            return;
        }

        try {
            $ok = $this->model->upsertByUser($uid, $data);
            if (!$ok) {
                Response::error('Falha ao salvar', 500);
                return;
            }
            $this->model->upsertByUser($uid, $data);
            $fresh = $this->model->getByUser($uid) ?: new stdClass();
            Response::ok($fresh);
        } catch (Throwable $e) {
            Response::error('Erro ao salvar', 500, ['detail' => $e->getMessage()]);
        }
    }
}
