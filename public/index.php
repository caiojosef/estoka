<?php
require_once __DIR__ . '/../app/Controllers/Api/AuthController.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($uri === '/api/register' && in_array($method, ['POST', 'OPTIONS'], true)) {
  (new AuthController())->register();
  exit;
}
if ($uri === '/api/login'    && in_array($method, ['POST', 'OPTIONS'], true)) {
  (new AuthController())->login();
  exit;
}
if ($uri === '/api/me'       && in_array($method, ['GET', 'OPTIONS'], true)) {
  (new AuthController())->me();
  exit;
}
if ($uri === '/api/logout'   && in_array($method, ['POST', 'OPTIONS'], true)) {
  (new AuthController())->logout();
  exit;
}

// Se quiser servir SPA raiz em /, pode redirecionar para /public/app.html aqui.
// 404 padrão:
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => false, 'message' => 'Rota não encontrada']);
