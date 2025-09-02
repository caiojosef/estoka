<?php
class Database {
  private static ?PDO $pdo = null;

  public static function conn(): PDO {
    if (self::$pdo) return self::$pdo;

    $cfg = require __DIR__ . '/../config/config.php';
    $db  = $cfg['db'];

    $dsn = "mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset={$db['charset']}";
    $opt = [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
      self::$pdo = new PDO($dsn, $db['user'], $db['pass'], $opt);
      return self::$pdo;
    } catch (Throwable $e) {
      http_response_code(500);
      header('Content-Type: application/json; charset=utf-8');
      echo json_encode(['ok'=>false,'message'=>'Erro ao conectar ao banco','detail'=>$e->getMessage()]);
      exit;
    }
  }
}
