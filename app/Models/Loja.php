<?php
// app/Models/Loja.php
class Loja
{
    private PDO $pdo;
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getByUserId(int $userId): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM lojas WHERE user_id = ?");
        $st->execute([$userId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /** cria se não existir; senão atualiza */
    public function upsert(int $userId, array $d): array
    {
        $exists = $this->getByUserId($userId);
        if ($exists) {
            $sql = "UPDATE lojas SET
                nome_fantasia = :nome,
                descricao = :desc,
                categoria = :cat,
                link_externo = :link,
                whatsapp_contato = :zap,
                cnpj = :cnpj,
                imagem_capa = :capa,
                imagem_logo = :logo,
                cor_destaque = :cor
            WHERE user_id = :uid";
        } else {
            $sql = "INSERT INTO lojas
                (user_id, nome_fantasia, descricao, categoria, link_externo, whatsapp_contato, cnpj, imagem_capa, imagem_logo, cor_destaque)
                VALUES (:uid, :nome, :desc, :cat, :link, :zap, :cnpj, :capa, :logo, :cor)";
        }

        $ok = $this->pdo->prepare($sql)->execute([
            ':uid' => $userId,
            ':nome' => trim($d['nome_fantasia'] ?? ''),
            ':desc' => trim($d['descricao'] ?? ''),
            ':cat' => trim($d['categoria'] ?? ''),
            ':link' => trim($d['link_externo'] ?? ''),
            ':zap' => trim($d['whatsapp_contato'] ?? ''),
            ':cnpj' => trim($d['cnpj'] ?? ''),
            ':capa' => trim($d['imagem_capa'] ?? ''),
            ':logo' => trim($d['imagem_logo'] ?? ''),
            ':cor' => strtoupper(trim($d['cor_destaque'] ?? ''))
        ]);
        return $ok ? ['ok' => true, 'data' => $this->getByUserId($userId)] : ['ok' => false];
    }
}
