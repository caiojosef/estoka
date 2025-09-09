<?php
require_once __DIR__ . '/../../../core/Response.php';
require_once __DIR__ . '/../../../core/Validator.php';
require_once __DIR__ . '/../../../core/Database.php';
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
      return;
    }

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    // validações
    $required = ['email', 'password', 'cpf', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    $errors = Validator::required($payload, $required);
    if (!empty($payload['email']) && !Validator::email($payload['email']))
      $errors['email'] = 'E-mail inválido';
    if (!empty($payload['password'])) {
      $pw = (string) $payload['password'];
      $ok = strlen($pw) >= 6 && preg_match('/[A-Z]/', $pw) && preg_match('/[a-z]/', $pw) && preg_match('/[!@#$*]/', $pw);
      if (!$ok)
        $errors['password'] = 'Senha deve ter 6+ caracteres, 1 maiúscula, 1 minúscula e 1 especial (!@#$*).';
    }
    if (!empty($payload['cpf']) && !Validator::cpf($payload['cpf']))
      $errors['cpf'] = 'CPF inválido';
    if (!empty($payload['cep']) && !Validator::cep($payload['cep']))
      $errors['cep'] = 'CEP inválido';
    if (!empty($payload['estado']) && !Validator::uf($payload['estado']))
      $errors['estado'] = 'UF inválida';

    if ($errors) {
      Response::json(['ok' => false, 'message' => 'Erros de validação', 'errors' => $errors], 422);
      return;
    }

    // unicidade
    if (User::findByEmail($payload['email'])) {
      Response::json(['ok' => false, 'message' => 'E-mail já cadastrado', 'errors' => ['email' => 'Já em uso']], 409);
      return;
    }
    $cpfDig = preg_replace('/\D/', '', $payload['cpf']);
    if (User::findByCPF($cpfDig)) {
      Response::json(['ok' => false, 'message' => 'CPF já cadastrado', 'errors' => ['cpf' => 'Já em uso']], 409);
      return;
    }

    try {
      $id = User::create($payload);
      Response::json(['ok' => true, 'message' => 'Usuário registrado com sucesso', 'user_id' => $id], 201);
    } catch (Throwable $e) {
      Response::json(['ok' => false, 'message' => 'Erro ao salvar usuário', 'detail' => $e->getMessage()], 500);
    }
  }

  public function login(): void
  {
    $this->headers();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
      http_response_code(405);
      return;
    }

    $in = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = trim($in['email'] ?? '');
    $password = (string) ($in['password'] ?? '');
    $remember = !empty($in['remember']);

    $user = User::findByEmail($email);
    if (!$user || !password_verify($password, $user['password_hash'])) {
      Response::json(['ok' => false, 'message' => 'Credenciais inválidas', 'errors' => ['email' => 'ou senha incorretos']], 401);
      return;
    }

    $ttl = $remember ? 60 * 60 * 24 * 30 : 60 * 60 * 2;
    try {
      [$token, $expiresAt] = TokenService::issueToken((int) $user['id'], $ttl, $_SERVER['REMOTE_ADDR'] ?? '', $_SERVER['HTTP_USER_AGENT'] ?? '');
      Response::json(['ok' => true, 'message' => 'Login efetuado', 'token' => $token, 'expires_at' => $expiresAt, 'user' => ['id' => (int) $user['id'], 'email' => $user['email']]]);
    } catch (Throwable $e) {
      Response::json(['ok' => false, 'message' => 'Erro ao gerar token', 'detail' => $e->getMessage()], 500);
    }
  }

  public function forgot(): void
  {
    $this->headers();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
      http_response_code(405);
      return;
    }

    $in = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = trim($in['email'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      Response::json(['ok' => false, 'errors' => ['email' => 'E-mail inválido']], 422);
      return;
    }

    try {
      $user = User::findByEmail($email);
      $devResetUrl = null;

      if ($user) {
        list($token, $expiresAt) = TokenService::issueResetToken((int) $user['id'], 3600);

        // Em DEV, devolvemos um link de teste
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        if ($host === 'localhost' || $host === '127.0.0.1') {
          $devResetUrl = "/public/reset.html?token={$token}&email=" . urlencode($email);
        }
        // FUTURO: enviar e-mail com o link real
      }

      // Resposta sempre genérica (evita enumerar emails)
      Response::json([
        'ok' => true,
        'message' => 'Se existir uma conta para este e-mail, enviaremos um link para redefinir sua senha.',
        'dev_reset_url' => $devResetUrl
      ]);
    } catch (Throwable $e) {
      Response::json(['ok' => false, 'message' => 'Falha interna', 'detail' => $e->getMessage()], 500);
    }
  }
  public function reset(): void
  {
    $this->headers();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
      http_response_code(405);
      return;
    }

    $in = json_decode(file_get_contents('php://input'), true) ?? [];
    $token = (string) ($in['token'] ?? '');
    $password = (string) ($in['password'] ?? '');
    $confirm = (string) ($in['confirm'] ?? '');

    // Simples: 6+ caracteres e confirmação
    $errors = [];
    if (strlen($password) < 6)
      $errors['password'] = 'Mín. 6 caracteres.';
    if ($confirm !== $password)
      $errors['confirm'] = 'Senhas não conferem';
    if ($errors) {
      Response::json(['ok' => false, 'errors' => $errors], 422);
      return;
    }

    try {
      $row = TokenService::validateResetToken($token);
      if (!$row) {
        Response::json(['ok' => false, 'message' => 'Token inválido ou expirado'], 400);
        return;
      }

      $pwdHash = password_hash($password, PASSWORD_DEFAULT);
      Database::query("UPDATE users SET password_hash=?, updated_at=NOW() WHERE id=?", [$pwdHash, (int) $row['user_id']]);

      TokenService::consumeResetToken($token);
      Database::query("UPDATE auth_tokens SET is_revoked=1 WHERE user_id=?", [(int) $row['user_id']]); // força logout

      Response::json(['ok' => true, 'message' => 'Senha alterada com sucesso']);
    } catch (Throwable $e) {
      Response::json(['ok' => false, 'message' => 'Falha interna', 'detail' => $e->getMessage()], 500);
    }
  }




  private function headers(): void
  {
    $cfg = require __DIR__ . '/../../../config/config.php';
    header('Access-Control-Allow-Origin: ' . $cfg['cors_allowed_origin']);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      http_response_code(204);
      exit;
    }
  }

  private function bearerToken(): ?string
  {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$h && function_exists('getallheaders')) {
      $all = getallheaders();
      $h = $all['Authorization'] ?? '';
    }
    if (preg_match('/Bearer\s+(\S+)/i', $h, $m))
      return $m[1];
    return $_SERVER['HTTP_X_AUTH_TOKEN'] ?? null;
  }

  public function me(): void
  {
    $this->headers();
    $token = $this->bearerToken();
    if (!$token) {
      Response::json(['ok' => false, 'message' => 'Não autenticado'], 401);
      return;
    }
    $row = TokenService::validateToken($token);
    if (!$row) {
      Response::json(['ok' => false, 'message' => 'Sessão expirada ou inválida'], 401);
      return;
    }
    Response::json(['ok' => true, 'user' => ['id' => (int) $row['uid'], 'email' => $row['email']], 'expires_at' => $row['expires_at']]);
  }

  public function logout(): void
  {
    $this->headers();
    $token = $this->bearerToken();
    if ($token)
      TokenService::revoke($token);
    Response::json(['ok' => true, 'message' => 'Logout efetuado']);
  }

  public function getPageType(): void
  {
    $this->headers(); // inclui CORS + OPTIONS
    $token = $this->bearerToken();
    if (!$token)
      Response::unauthorized();
    $row = TokenService::validateToken($token);
    if (!$row)
      Response::unauthorized();

    $uid = (int) $row['uid'];
    $pdo = Database::conn();
    $st = $pdo->prepare("SELECT page_type FROM users WHERE id=?");
    $st->execute([$uid]);
    $type = $st->fetchColumn() ?: null;

    Response::ok(['page_type' => $type]);
  }

  public function setPageType(): void
  {
    $this->headers(); // trata OPTIONS também
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      http_response_code(204);
      return;
    }

    $token = $this->bearerToken();
    if (!$token)
      Response::unauthorized();
    $row = TokenService::validateToken($token);
    if (!$row)
      Response::unauthorized();

    $uid = (int) $row['uid'];
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $type = $in['page_type'] ?? null;
    if (!in_array($type, ['loja', 'prestador'], true)) {
      Response::badRequest('Tipo inválido. Use "loja" ou "prestador".');
    }

    $pdo = Database::conn();
    $ok = $pdo->prepare("UPDATE users SET page_type=? WHERE id=?")->execute([$type, $uid]);
    if (!$ok)
      Response::error('Falha ao atualizar tipo');

    Response::ok(['ok' => true, 'page_type' => $type]);
  }

}
