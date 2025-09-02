<?php
require_once __DIR__ . '/../../../core/Response.php';
require_once __DIR__ . '/../../../core/Validator.php';
require_once __DIR__ . '/../../../app/Models/User.php';
require_once __DIR__ . '/../../../app/Services/TokenService.php';

class AuthController
{
  public function register(): void
  {
    $cfg = require __DIR__ . '/../../../config/config.php';
    header('Access-Control-Allow-Origin: ' . $cfg['cors_allowed_origin']);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      http_response_code(204);
      exit;
    }

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    // campos esperados (seguindo a sua tabela do print)
    $required = ['email', 'password', 'cpf', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    $errors = Validator::required($payload, $required);

    if (!empty($payload['email']) && !Validator::email($payload['email'])) {
      $errors['email'] = 'E-mail inválido';
    }
    // ...
    if (!empty($payload['password'])) {
      $pw = (string)$payload['password'];
      $hasLen     = strlen($pw) >= 6;
      $hasUpper   = preg_match('/[A-Z]/', $pw);
      $hasLower   = preg_match('/[a-z]/', $pw);
      $hasSpecial = preg_match('/[!@#$*]/', $pw); // mesmo conjunto do front
      if (!($hasLen && $hasUpper && $hasLower && $hasSpecial)) {
        $errors['password'] = 'Senha deve ter 6+ caracteres, 1 maiúscula, 1 minúscula e 1 especial (!@#$*).';
      }
    }

    if (!empty($payload['cpf']) && !Validator::cpf($payload['cpf'])) {
      $errors['cpf'] = 'CPF inválido';
    }
    if (!empty($payload['cep']) && !Validator::cep($payload['cep'])) {
      $errors['cep'] = 'CEP inválido';
    }
    if (!empty($payload['estado']) && !Validator::uf($payload['estado'])) {
      $errors['estado'] = 'UF inválida';
    }

    if ($errors) {
      Response::json(['ok' => false, 'message' => 'Erros de validação', 'errors' => $errors], 422);
    }

    // unicidade
    if (User::findByEmail($payload['email'])) {
      Response::json(['ok' => false, 'message' => 'E-mail já cadastrado', 'errors' => ['email' => 'Já em uso']], 409);
    }
    $cpfDig = preg_replace('/\D/', '', $payload['cpf']);
    if (User::findByCPF($cpfDig)) {
      Response::json(['ok' => false, 'message' => 'CPF já cadastrado', 'errors' => ['cpf' => 'Já em uso']], 409);
    }

    try {
      $id = User::create($payload);
      Response::json(['ok' => true, 'message' => 'Usuário registrado com sucesso', 'user_id' => $id], 201);
    } catch (Throwable $e) {
      // Pode violar UNIQUE do banco também
      Response::json(['ok' => false, 'message' => 'Erro ao salvar usuário', 'detail' => $e->getMessage()], 500);
    }
  }

  public function login(): void
  {
    $cfg = require __DIR__ . '/../../../config/config.php';
    header('Access-Control-Allow-Origin: ' . $cfg['cors_allowed_origin']);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      http_response_code(204);
      exit;
    }

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = trim($payload['email'] ?? '');
    $password = (string)($payload['password'] ?? '');

    $errors = [];
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'E-mail inválido';
    if ($password === '') $errors['password'] = 'Informe sua senha';

    if ($errors) Response::json(['ok' => false, 'message' => 'Erros de validação', 'errors' => $errors], 422);

    $user = User::findByEmail($email);
    if (!$user || !password_verify($password, $user['password_hash'])) {
      Response::json(['ok' => false, 'message' => 'Credenciais inválidas', 'errors' => ['email' => 'ou senha incorretos']], 401);
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
    try {
      $tok = TokenService::generate((int)$user['id'], $ip, $ua, 3600);
    } catch (Throwable $e) {
      Response::json(['ok' => false, 'message' => 'Erro ao gerar token', 'detail' => $e->getMessage()], 500);
    }

    Response::json([
      'ok' => true,
      'message' => 'Login efetuado',
      'token' => $tok['token'],
      'expires_at' => $tok['expires_at'],
      'user' => ['id' => (int)$user['id'], 'email' => $user['email']]
    ], 200);
  }

  private function headers(): void
  {
    $cfg = require __DIR__ . '/../../../config/config.php';
    header('Access-Control-Allow-Origin: ' . $cfg['cors_allowed_origin']);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
  }
  private function bearerToken(): ?string
  {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$h && function_exists('getallheaders')) {
      $all = getallheaders();
      $h = $all['Authorization'] ?? '';
    }
    if (preg_match('/Bearer\s+(\S+)/i', $h, $m)) return $m[1];
    return $_SERVER['HTTP_X_AUTH_TOKEN'] ?? null;
  }

  public function me(): void
  {
    $this->headers();
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      http_response_code(204);
      exit;
    }

    $token = $this->bearerToken();
    if (!$token) Response::json(['ok' => false, 'message' => 'Não autenticado'], 401);

    $row = TokenService::validateToken($token);
    if (!$row) Response::json(['ok' => false, 'message' => 'Sessão expirada ou inválida'], 401);

    Response::json([
      'ok' => true,
      'user' => ['id' => (int)$row['uid'], 'email' => $row['email']],
      'expires_at' => $row['expires_at']
    ]);
  }

  public function logout(): void
  {
    $this->headers();
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      http_response_code(204);
      exit;
    }

    $token = $this->bearerToken();
    if ($token) TokenService::revoke($token);
    Response::json(['ok' => true, 'message' => 'Logout efetuado']);
  }
}
