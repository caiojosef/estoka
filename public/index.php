<?php
require_once __DIR__ . '/../app/Controllers/Api/AuthController.php';
require_once __DIR__ . '/../app/Controllers/Api/PrestadorController.php';

ini_set('display_errors', 1);
error_reporting(E_ALL);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (str_starts_with(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/api/')) {
  set_exception_handler(function ($e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error', 'detail' => $e->getMessage()]);
    exit;
  });
  set_error_handler(function ($severity, $message, $file, $line) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error', 'detail' => "$message ($file:$line)"]);
    exit;
  });
}
switch ($path) {
  case '/api/login':
    (new AuthController)->login();
    break;
  case '/api/register':
    (new AuthController)->register();
    break;
  case '/api/me':
    (new AuthController)->me();
    break;
  case '/api/logout':
    (new AuthController)->logout();
    break;
  case '/api/forgot':
    (new AuthController)->forgot();
    break;
  case '/api/reset':
    (new AuthController)->reset();
    break;
  case '/api/page-type':
    (new AuthController)->getPageType();
    break;

  case '/api/page-type/set':
    (new AuthController)->setPageType();
    break;
  case '/api/prestador':
    (new PrestadorController())->handle();
    break;

  
  // FALTANDO: /api/forgot e /api/reset

  default:
    if (str_starts_with($path, '/api/')) {
      header('Content-Type: application/json; charset=utf-8');
      http_response_code(404);
      echo json_encode(['ok' => false, 'message' => 'Rota não encontrada']);
      exit;
    }
    require __DIR__ . '/public/index.html';
}