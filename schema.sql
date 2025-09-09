
/* =========================================================
   PATCH + NOVAS TABELAS — MySQL 5.7 (USBWebserver)
   Alinha engines/tipos e cria tabelas com FKs válidas.
   ========================================================= */

-- Use o banco correto
CREATE DATABASE IF NOT EXISTS caiojo47_vitrine_db
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE caiojo47_vitrine_db;

-- 1) PATCH: garantir que 'users' existe e está compatível
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  cep VARCHAR(9),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  bairro VARCHAR(120),
  cidade VARCHAR(120),
  estado CHAR(2),
  complemento VARCHAR(40),
  whatsapp VARCHAR(20),
  page_type ENUM('loja', 'prestador') DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Caso a tabela já existisse com engine/tipos diferentes, alinhar:
ALTER TABLE users
  MODIFY id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ENGINE=InnoDB;

-- 2) auth_tokens (sempre InnoDB e com FK)
CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token CHAR(64) NOT NULL,
  user_agent VARCHAR(255),
  ip_address VARCHAR(45),
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME NULL,
  is_revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_user (user_id),
  UNIQUE KEY uq_auth_token (token),
  CONSTRAINT fk_auth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) password_resets (sempre InnoDB e com FK)
CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pw_user (user_id),
  UNIQUE KEY uq_pw_token (token),
  CONSTRAINT fk_pw_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) lojas (perfil de loja, 1:1 com user — se quiser 1:N, remova UNIQUE)
CREATE TABLE IF NOT EXISTS lojas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  nome_fantasia VARCHAR(100) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(80),
  link_externo VARCHAR(255),
  whatsapp_contato VARCHAR(20),
  cnpj VARCHAR(20),
  imagem_capa TEXT,
  imagem_logo TEXT,
  cor_destaque VARCHAR(7),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_loja_user (user_id),
  CONSTRAINT fk_loja_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) produtos (pertencem à loja)
CREATE TABLE IF NOT EXISTS produtos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  loja_id INT UNSIGNED NOT NULL,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2),
  imagem TEXT,
  link_compra TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prod_loja (loja_id),
  CONSTRAINT fk_prod_loja FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) prestadores (perfil de serviço, 1:1 com user — se quiser 1:N, remova UNIQUE)
CREATE TABLE IF NOT EXISTS prestadores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  nome_publico VARCHAR(100) NOT NULL,
  bio TEXT,
  especialidades TEXT,
  preco_medio VARCHAR(50),
  atendimento_online TINYINT(1) NOT NULL DEFAULT 0,
  endereco_atendimento TEXT,
  whatsapp_contato VARCHAR(20),
  link_agendamento VARCHAR(255),
  imagem_perfil TEXT,
  imagem_capa TEXT,
  cor_destaque VARCHAR(7),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_prest_user (user_id),
  CONSTRAINT fk_prest_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
