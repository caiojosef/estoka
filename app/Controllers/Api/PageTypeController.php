<?php
// app/Controllers/Api/PageTypeController.php
class PageTypeController
{
    public function handle(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            $ROOT = dirname(__DIR__, 3); // <ROOT>
            require_once $ROOT . '/core/Database.php';
            require_once $ROOT . '/core/Response.php';
            require_once $ROOT . '/app/Models/User.php';
            require_once $ROOT . '/app/Services/TokenService.php';

            $db = (new Database())->connect();
            $auth = new TokenService();
            $userId = $auth->getUserIdFromToken();
            if (!$userId) {
                Response::unauthorized();
            }

            $user = new User($db);
            $method = $_SERVER['REQUEST_METHOD'];

            if ($method === 'GET') {
                Response::ok(['page_type' => $user->getPageType($userId)]);
            }

            if ($method === 'POST' || $method === 'PATCH') {
                $data = json_decode(file_get_contents('php://input'), true) ?: [];
                $type = $data['page_type'] ?? null;
                if (!in_array($type, ['loja', 'prestador'], true)) {
                    Response::badRequest('Tipo inválido. Use "loja" ou "prestador".');
                }
                if (!$user->setPageType($userId, $type)) {
                    Response::error('Falha ao atualizar tipo.');
                }
                Response::ok(['message' => 'Tipo atualizado', 'page_type' => $type]);
            }

            Response::methodNotAllowed();

        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'ok' => false,
                'message' => 'Erro interno',
                'hint' => $e->getMessage()  // deixar durante o DEV para enxergar o problema real
            ]);
        }
    }
}
