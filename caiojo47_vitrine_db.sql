-- phpMyAdmin SQL Dump
-- version 5.1.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Tempo de geração: 30-Set-2025 às 19:26
-- Versão do servidor: 5.7.36
-- versão do PHP: 8.1.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `caiojo47_vitrine_db`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `auth_tokens`
--

CREATE TABLE `auth_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `last_used_at` datetime DEFAULT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `auth_tokens`
--

INSERT INTO `auth_tokens` (`id`, `user_id`, `token`, `user_agent`, `ip_address`, `expires_at`, `last_used_at`, `is_revoked`, `created_at`) VALUES
(1, 1, 'b462952d4bedbd3e8400014c74c0ffc929d73f95fe33c51d692d9dc409249448', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-29 15:17:05', NULL, 0, '2025-09-29 10:17:05'),
(2, 1, '74c87725bc986e3206df0d1ee7248c509eac02eed78474482c49ad65a076c034', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:16:28', NULL, 0, '2025-09-30 08:16:28'),
(3, 1, '3b3ff4e1c9071533a37ed44dbecefc7a658c157823eaa9ada5a6f6f0cf36ae91', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:17:37', NULL, 0, '2025-09-30 08:17:37'),
(4, 1, 'e9ed955466a5190e19b2fa4732d7be28589e12a329da24f3380b8e3deba818f5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:18:08', NULL, 0, '2025-09-30 08:18:08'),
(5, 1, 'ba1c95f764210592ec80ea65cd664b3c5a2bee8ede5fcf3e0398c89ecfc227fd', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:36:50', NULL, 0, '2025-09-30 08:36:50'),
(6, 1, '5ab7b3abe8cc17607553fc84ad7f818eaa6792b5ce4a55a88f5d95331d9a61de', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-10-30 11:39:11', NULL, 0, '2025-09-30 08:39:11'),
(7, 1, 'a2e9b9ca4064b5373ef9238f11f540425346896cddf7b1e8b5f0be8b1d7003aa', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:42:14', NULL, 0, '2025-09-30 08:42:14'),
(8, 1, '162f8160d03e4af1c8423507d6074fae33eab4eb1c0ff3bd3f31180f1a5c74d3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:42:16', NULL, 0, '2025-09-30 08:42:16'),
(9, 1, '86d2a68df59111dbd9a36fed2aa2354fd7184830aac29d46b2a4cc4c8f74dc7d', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:42:17', NULL, 0, '2025-09-30 08:42:17'),
(10, 1, '39b1901038ef0ae4812971e745bbb42c3f82cd675a2724cc26ae9eb82dd62ee6', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:42:24', NULL, 0, '2025-09-30 08:42:24'),
(11, 1, '29dbba0318a9437dba5e8f0c31e9faf6986a9c147cb0daad24f3c0c9c2aef1f1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 13:43:53', '2025-09-30 09:18:54', 0, '2025-09-30 08:43:53'),
(12, 1, 'a78191c1f10c0ce2f1e3656dbc434effa0d023264debe012bc1e057ce29261be', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-10-30 12:19:17', '2025-09-30 09:19:18', 0, '2025-09-30 09:19:17'),
(13, 1, '55d2fb2da3637ddc9c31458cea6d409775fd1476b940985620720f5c9b165b12', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 14:19:27', '2025-09-30 09:19:28', 0, '2025-09-30 09:19:27'),
(14, 1, '517544bbbe678b7b26db524dddabb37ef7d661348a05f4ba5d29f0d6e30c5959', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 19:52:14', '2025-09-30 15:47:03', 0, '2025-09-30 14:52:14'),
(15, 1, '7450e72d516e78dccf32bffe95ff1b021be2f3453daf19b94e3b2bbac6960773', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 19:55:12', '2025-09-30 14:55:12', 0, '2025-09-30 14:55:12'),
(16, 1, '60934b99429ac6829d6bd753209a47a7298d1b7bd3af58d0c3970cdf95c065ca', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 21:05:22', NULL, 0, '2025-09-30 16:05:22'),
(17, 1, '254b8791b6a30733ce7035f4fb327c957aa4a231091e45915d24f87d0b45b779', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1 Edg/140.0.0.0', '::1', '2025-09-30 21:22:02', NULL, 0, '2025-09-30 16:22:02'),
(18, 1, '0f0fc3f9f3aa0cd88379e8f902543881825f002fe6f6e8eeca4941f57df78b26', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1 Edg/140.0.0.0', '::1', '2025-09-30 21:22:09', NULL, 0, '2025-09-30 16:22:09'),
(19, 1, '49b623d866dcf6b38b263421929b18c302f6df6cf04362557dc8dde2bc125823', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '::1', '2025-09-30 21:25:49', NULL, 0, '2025-09-30 16:25:49');

-- --------------------------------------------------------

--
-- Estrutura da tabela `password_resets`
--

CREATE TABLE `password_resets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(14) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cep` varchar(9) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logradouro` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bairro` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complemento` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `primeiro_login` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `cpf`, `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado`, `complemento`, `whatsapp`, `slug`, `primeiro_login`, `created_at`, `updated_at`) VALUES
(1, 'caioojoseff@gmail.com', '$2y$10$AX5PQ/bORfZZwMH3H.74dOnXS8FUZiWCYuBPnRNo8HuA9VpiV01EK', '41348108843', '14804300', 'Avenida Alberto Benassi', '3290', 'Jardim Bandeirantes', 'Araraquara', 'SP', 'apto 147 bloco 1', NULL, '', 1, '2025-09-29 10:16:49', '2025-09-29 10:16:49');

-- --------------------------------------------------------

--
-- Estrutura da tabela `user_plans`
--

CREATE TABLE `user_plans` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `plan` enum('trial','vip') COLLATE utf8mb4_unicode_ci NOT NULL,
  `started_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_auth_token` (`token`),
  ADD KEY `idx_auth_user` (`user_id`);

--
-- Índices para tabela `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pw_token` (`token`),
  ADD KEY `idx_pw_user` (`user_id`);

--
-- Índices para tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `cpf` (`cpf`);

--
-- Índices para tabela `user_plans`
--
ALTER TABLE `user_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_plan_user` (`user_id`),
  ADD KEY `idx_plan_exp` (`expires_at`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `auth_tokens`
--
ALTER TABLE `auth_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de tabela `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `user_plans`
--
ALTER TABLE `user_plans`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD CONSTRAINT `fk_auth_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `fk_pw_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `user_plans`
--
ALTER TABLE `user_plans`
  ADD CONSTRAINT `fk_plan_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
