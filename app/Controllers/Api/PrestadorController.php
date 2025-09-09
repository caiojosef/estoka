<?php
// app/Controllers/Api/PrestadorController.php
class PrestadorController
{
    public function handle(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            $ROOT = dirname(__DIR__, 3);
            require_once $ROOT . '/core/Database.php';
            require_once $ROOT . '/core/Response.php';
            require_once $ROOT . '/app/Models/User.php';
            require_once $ROOT . '/app/Models/Prestador.php';
            require_once $ROOT . '/app/Services/TokenService.php';

            $db = (new Database())->connect();
            $auth = new TokenService();
            $userId = $auth->getUserIdFromToken();
            if (!$userId) {
                Response::unauthorized();
            }

            $user = new User($db);
            if ($user->getPageType($userId) !== 'prestador') {
                Response::badRequest('Perfil atual não é "prestador".');
            }

            $repo = new Prestador($db);
            $method = $_SERVER['REQUEST_METHOD'];

            if ($method === 'GET') {
                Response::ok(['data' => $repo->getByUserId($userId)]);
            }

            if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
                $payload = json_decode(file_get_contents('php://input'), true) ?: [];
                $out = $repo->upsert($userId, $payload);
                if (empty($out['ok']))
                    Response::error('Falha ao salvar dados do prestador.');
                Response::ok($out);
            }

            Response::methodNotAllowed();

        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Erro interno', 'hint' => $e->getMessage()]);
        }
    }
}
