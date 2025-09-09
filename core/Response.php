<?php
final class Response
{
  private static function send($payload, int $status = 200, array $headers = []): void
  {
    if (!headers_sent()) {
      http_response_code($status);
      header('Content-Type: application/json; charset=utf-8');
      foreach ($headers as $k => $v)
        header($k . ': ' . $v);
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
  }

  // ==> o que estava faltando
  public static function ok(array $data = [], int $status = 200): void
  {
    self::send(['ok' => true, 'data' => $data], $status);
  }

  public static function json($data = [], int $status = 200): void
  {
    self::send($data, $status);
  }

  public static function error(string $message, int $status = 400, array $extra = []): void
  {
    self::send(['ok' => false, 'error' => $message] + $extra, $status);
  }
  public static function unauthorized(string $message = 'Unauthorized'): void
  {
    self::error($message, 401);
  }
}
