<?php
// app/Models/Prestador.php
class Prestador
{
    private PDO $pdo;
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getByUserId(int $userId): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM prestadores WHERE user_id = ?");
        $st->execute([$userId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function upsert(int $userId, array $d): array
    {
        $exists = $this->getByUserId($userId);
        if ($exists) {
            $sql = "UPDATE prestadores SET
                nome_publico = :nome,
                bio = :bio,
                especialidades = :esp,
                preco_medio = :preco,
                atendimento_online = :online,
                endereco_atendimento = :end,
                whatsapp_contato = :zap,
                link_agendamento = :link,
                imagem_perfil = :perfil,
                imagem_capa = :capa,
                cor_destaque = :cor
            WHERE user_id = :uid";
        } else {
            $sql = "INSERT INTO prestadores
                (user_id, nome_publico, bio, especialidades, preco_medio, atendimento_online, endereco_atendimento, whatsapp_contato, link_agendamento, imagem_perfil, imagem_capa, cor_destaque)
                VALUES (:uid, :nome, :bio, :esp, :preco, :online, :end, :zap, :link, :perfil, :capa, :cor)";
        }

        $ok = $this->pdo->prepare($sql)->execute([
            ':uid' => $userId,
            ':nome' => trim($d['nome_publico'] ?? ''),
            ':bio' => trim($d['bio'] ?? ''),
            ':esp' => trim($d['especialidades'] ?? ''),
            ':preco' => trim($d['preco_medio'] ?? ''),
            ':online' => !empty($d['atendimento_online']) ? 1 : 0,
            ':end' => trim($d['endereco_atendimento'] ?? ''),
            ':zap' => trim($d['whatsapp_contato'] ?? ''),
            ':link' => trim($d['link_agendamento'] ?? ''),
            ':perfil' => trim($d['imagem_perfil'] ?? ''),
            ':capa' => trim($d['imagem_capa'] ?? ''),
            ':cor' => strtoupper(trim($d['cor_destaque'] ?? ''))
        ]);
        return $ok ? ['ok' => true, 'data' => $this->getByUserId($userId)] : ['ok' => false];
    }
}
