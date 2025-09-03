<?php
class Database
{
  private static ?PDO $pdo = null;

  public static function conn(): PDO
  {
    if (self::$pdo) return self::$pdo;
    $cfg = require __DIR__ . '/../config/config.php';
    $db  = $cfg['db'];
    $dsn = "mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset={$db['charset']}";
    $opt = [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ];
    self::$pdo = new PDO($dsn, $db['user'], $db['pass'], $opt);
    return self::$pdo;
  }

  // --- Helpers que seu TokenService está usando ---
  public static function query(string $sql, array $params = []): PDOStatement
  {
    $st = self::conn()->prepare($sql);
    $st->execute($params);
    return $st;
  }

  public static function fetchOne(string $sql, array $params = []): ?array
  {
    $st = self::query($sql, $params);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
  }

  public static function fetchAll(string $sql, array $params = []): array
  {
    return self::query($sql, $params)->fetchAll(PDO::FETCH_ASSOC);
  }
}
