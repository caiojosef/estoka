<?php
require_once __DIR__ . '/../../core/Database.php';

class TokenService
{
    public static function generate(int $userId, ?string $ip, ?string $ua, int $ttlSeconds = 3600): array
    {
        $pdo = Database::conn();
        $token   = bin2hex(random_bytes(32));
        $expires = (new DateTimeImmutable("+{$ttlSeconds} seconds"))->format('Y-m-d H:i:s');

        $ipBin = null;
        if ($ip) {
            $p = @inet_pton($ip);
            if ($p !== false) $ipBin = $p;
        }

        $st = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at, ip_address, user_agent, is_revoked, created_at)
                         VALUES (?, ?, ?, ?, ?, 0, NOW())');
        $st->execute([$userId, $token, $expires, $ipBin, $ua]);

        return ['token' => $token, 'expires_at' => $expires];
    }

    public static function validateToken(string $token): ?array
    {
        $pdo = Database::conn();
        $st = $pdo->prepare('SELECT t.*, u.id AS uid, u.email
                         FROM auth_tokens t
                         JOIN users u ON u.id = t.user_id
                         WHERE t.token = ? AND t.is_revoked = 0 AND t.expires_at > NOW()
                         LIMIT 1');
        $st->execute([$token]);
        $row = $st->fetch();
        if ($row) $pdo->prepare('UPDATE auth_tokens SET last_used_at = NOW() WHERE id = ?')->execute([$row['id']]);
        return $row ?: null;
    }

    public static function revoke(string $token): void
    {
        Database::conn()->prepare('UPDATE auth_tokens SET is_revoked = 1, last_used_at = NOW() WHERE token = ?')->execute([$token]);
    }
}
