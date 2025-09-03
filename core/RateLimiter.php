<?php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/../../../core/RateLimiter.php';

class RateLimiter {
  public static function allow(string $action, string $key, int $limit, int $windowSeconds): array {
    $pdo = Database::conn();
    $now = time();
    $winStartTs = $now - ($now % $windowSeconds);
    $winStart   = date('Y-m-d H:i:s', $winStartTs);
    $keyHash    = hash('sha256', $key);

    $pdo->prepare('INSERT INTO rate_limits (action,key_hash,window_start,count)
                   VALUES (?,?,?,1)
                   ON DUPLICATE KEY UPDATE count = count + 1')
        ->execute([$action,$keyHash,$winStart]);

    $st = $pdo->prepare('SELECT count FROM rate_limits WHERE action=? AND key_hash=? AND window_start=?');
    $st->execute([$action,$keyHash,$winStart]);
    $count = (int)($st->fetchColumn() ?: 0);

    $allowed    = $count <= $limit;
    $retryAfter = $allowed ? 0 : ($winStartTs + $windowSeconds - $now);

    return ['allowed'=>$allowed, 'remaining'=>max(0,$limit-$count), 'retry_after'=>$retryAfter];
  }
}
