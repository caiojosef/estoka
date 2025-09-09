<?php
require_once __DIR__ . '/../../core/Database.php';

class User
{
  private $pdo;

  public function __construct(PDO $pdo)
  {
    $this->pdo = $pdo;
  }
  public static function findByEmail(string $email): ?array
  {
    $pdo = Database::conn();
    $st = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $r = $st->fetch();
    return $r ?: null;
  }

  public static function findByCPF(string $cpf): ?array
  {
    $pdo = Database::conn();
    $st = $pdo->prepare('SELECT * FROM users WHERE cpf = ? LIMIT 1');
    $st->execute([$cpf]);
    $r = $st->fetch();
    return $r ?: null;
  }

  public static function create(array $data): int
  {
    $pdo = Database::conn();
    $sql = 'INSERT INTO users (email, cpf, cep, logradouro, numero, bairro, cidade, estado, complemento, password_hash, created_at, updated_at)
            VALUES (:email, :cpf, :cep, :logradouro, :numero, :bairro, :cidade, :estado, :complemento, :password_hash, NOW(), NOW())';
    $st = $pdo->prepare($sql);
    $st->execute([
      ':email' => $data['email'],
      ':cpf' => preg_replace('/\D/', '', $data['cpf']),
      ':cep' => preg_replace('/\D/', '', $data['cep']),
      ':logradouro' => $data['logradouro'],
      ':numero' => $data['numero'],
      ':bairro' => $data['bairro'],
      ':cidade' => $data['cidade'],
      ':estado' => strtoupper($data['estado']),
      ':complemento' => $data['complemento'] ?? null,
      ':password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
    ]);
    return (int) $pdo->lastInsertId();
  }

  // app/Models/User.php
  public function getPageType($userId): ?string
  {
    $stmt = $this->pdo->prepare("SELECT page_type FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetchColumn() ?: null;
  }

  public function setPageType($userId, $type): bool
  {
    $stmt = $this->pdo->prepare("UPDATE users SET page_type = ? WHERE id = ?");
    return $stmt->execute([$type, $userId]);
  }

}
