<?php
namespace App\Models;

use PDO;

// app/Prestador.php  (apenas os métodos que importam)
class Prestador
{
    private PDO $pdo;

    public function __construct(Database $db)
    {
        $this->pdo = $db->pdo();
    }

    public function getByUser(int $userId): ?array
    {
        $sql = "SELECT id, user_id, nome_publico, bio, especialidades, preco_medio, atendimento_online,
                       endereco_atendimento, whatsapp_contato, link_agendamento,
                       imagem_perfil, imagem_capa, cor_destaque, criado_em
                  FROM prestadores
                 WHERE user_id = :uid
                 LIMIT 1";
        $st = $this->pdo->prepare($sql);
        $st->execute([':uid' => $userId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // ← AQUI acontece o INSERT/UPDATE
    public function upsertByUser(int $userId, array $d): bool
    {
        $exists = $this->getByUser($userId) !== null;

        if ($exists) {
            // UPDATE (colunas iguais às que você mostrou no phpMyAdmin)
            $sql = "UPDATE prestadores SET
                        nome_publico         = :nome_publico,
                        bio                  = :bio,
                        especialidades       = :especialidades,
                        preco_medio          = :preco_medio,
                        atendimento_online   = :atendimento_online,
                        endereco_atendimento = :endereco_atendimento,
                        whatsapp_contato     = :whatsapp_contato,
                        link_agendamento     = :link_agendamento,
                        imagem_perfil        = :imagem_perfil,
                        imagem_capa          = :imagem_capa,
                        cor_destaque         = :cor_destaque
                    WHERE user_id = :uid";
        } else {
            // INSERT (sua tabela tem `criado_em`; não há `updated_at`)
            $sql = "INSERT INTO prestadores (
                        user_id, nome_publico, bio, especialidades, preco_medio, atendimento_online,
                        endereco_atendimento, whatsapp_contato, link_agendamento,
                        imagem_perfil, imagem_capa, cor_destaque, criado_em
                    ) VALUES (
                        :uid, :nome_publico, :bio, :especialidades, :preco_medio, :atendimento_online,
                        :endereco_atendimento, :whatsapp_contato, :link_agendamento,
                        :imagem_perfil, :imagem_capa, :cor_destaque, NOW()
                    )";
        }

        $st = $this->pdo->prepare($sql);
        return $st->execute([
            ':uid' => $userId,
            ':nome_publico' => $d['nome_publico'] ?? null,
            ':bio' => $d['bio'] ?? null,
            ':especialidades' => $d['especialidades'] ?? null,
            ':preco_medio' => $d['preco_medio'] ?? null,
            ':atendimento_online' => isset($d['atendimento_online']) ? (int) !!$d['atendimento_online'] : 0,
            ':endereco_atendimento' => $d['endereco_atendimento'] ?? null,
            ':whatsapp_contato' => $d['whatsapp_contato'] ?? null,
            ':link_agendamento' => $d['link_agendamento'] ?? null,
            ':imagem_perfil' => $d['imagem_perfil'] ?? null,
            ':imagem_capa' => $d['imagem_capa'] ?? null,
            ':cor_destaque' => $d['cor_destaque'] ?? null,
        ]);
    }
}
