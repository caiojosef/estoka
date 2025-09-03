<?php
require_once __DIR__ . '/../../core/Database.php';

class TokenService
{
    /**
     * Emite token opaco e persiste APENAS o hash no BD (coluna `token`).
     * $ttl em segundos (ex.: 2h = 7200, 30d = 2592000).
     */
    public static function issueToken(int $userId, int $ttl, string $ip = '', string $ua = ''): array
    {
        // token opaco retornado ao cliente
        $raw   = random_bytes(32);
        $token = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');

        // hash (HMAC) salvo no banco na coluna `token`
        $secret = $_ENV['TOKEN_SECRET'] ?? 'change-me';
        $hash   = hash_hmac('sha256', $token, $secret);

        $expiresAt = (new DateTimeImmutable("+{$ttl} seconds"))->format('Y-m-d H:i:s');
        $ua = substr((string)$ua, 0, 255);
        $ip = substr((string)$ip, 0, 45); // ipv4/ipv6 textual (sua coluna é `ip_address`)

        Database::query(
            "INSERT INTO auth_tokens (user_id, token, user_agent, ip_address, expires_at, is_revoked, created_at)
       VALUES (?,?,?,?,?,0,NOW())",
            [$userId, $hash, $ua, $ip, $expiresAt]
        );

        return [$token, $expiresAt];
    }

    /** Valida um Bearer token contra o hash salvo. */
    public static function validateBearer(string $maybeToken): ?array
    {
        if (!$maybeToken) return null;

        $secret = $_ENV['TOKEN_SECRET'] ?? 'change-me';
        $hash   = hash_hmac('sha256', $maybeToken, $secret);

        $row = Database::fetchOne(
            "SELECT t.id, t.user_id AS uid, u.email, t.expires_at
         FROM auth_tokens t
         JOIN users u ON u.id = t.user_id
        WHERE t.token = ? AND t.is_revoked = 0 AND t.expires_at > NOW()
        LIMIT 1",
            [$hash]
        );

        if ($row) {
            Database::query("UPDATE auth_tokens SET last_used_at = NOW() WHERE id = ?", [$row['id']]);
            return $row;
        }

        // (Opcional) retrocompatibilidade: se um dia já gravou token em claro,
        // você pode tentar procurar pelo valor não-hash aqui.

        return null;
    }

    /** Revoga um token (marca is_revoked=1 pelo hash). */
    public static function revoke(string $maybeToken): void
    {
        if (!$maybeToken) return;
        $secret = $_ENV['TOKEN_SECRET'] ?? 'change-me';
        $hash   = hash_hmac('sha256', $maybeToken, $secret);
        Database::query(
            "UPDATE auth_tokens SET is_revoked = 1, last_used_at = NOW() WHERE token = ?",
            [$hash]
        );
    }

    // --------- WRAPPERS de compatibilidade com seu AuthController ----------
    public static function generate(int $userId, string $ip, string $ua, int $ttl = 7200): array
    {
        return self::issueToken($userId, $ttl, $ip, $ua);
    }

    public static function validateToken(string $token): ?array
    {
        return self::validateBearer($token);
    }
    // ----- Password reset tokens -----
    public static function issueResetToken(int $userId, int $ttl = 3600): array
    {
        $raw   = random_bytes(32);
        $token = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');

        $secret = $_ENV['TOKEN_SECRET'] ?? 'change-me';
        $hash   = hash_hmac('sha256', $token, $secret);

        $expiresAt = (new DateTimeImmutable("+{$ttl} seconds"))->format('Y-m-d H:i:s');

        Database::query(
            "INSERT INTO password_resets (user_id, token, expires_at, used_at, created_at)
       VALUES (?, ?, ?, NULL, NOW())",
            [$userId, $hash, $expiresAt]
        );

        return [$token, $expiresAt];
    }

    public static function validateResetToken(string $maybeToken): ?array
    {
        if (!$maybeToken) return null;
        $secret = $_ENV['TOKEN_SECRET'] ?? 'change-me';
        $hash   = hash_hmac('sha256', $maybeToken, $secret);

        return Database::fetchOne(
            "SELECT id, user_id, expires_at
         FROM password_resets
        WHERE token = ? AND used_at IS NULL AND expires_at > NOW()
        LIMIT 1",
            [$hash]
        ) ?: null;
    }

    public static function consumeResetToken(string $maybeToken): void
    {
        if (!$maybeToken) return;
        $secret = $_ENV['TOKEN_SECRET'] ?? 'change-me';
        $hash   = hash_hmac('sha256', $maybeToken, $secret);
        Database::query("UPDATE password_resets SET used_at = NOW() WHERE token = ?", [$hash]);
    }
}
