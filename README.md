# Estoka — Autenticação & Onboarding

Aplicação web (PHP + MySQL) que entrega **cadastro**, **login com “lembrar de mim”**, **recuperação e redefinição de senha** com **tokens opacos (HMAC)**, além de **UI responsiva** e validações no cliente/servidor.

> Foco: segurança simples e prática para projetos PHP sem frameworks pesados.

---

## ✨ Recursos

- **Cadastro** com validações (CPF, CEP, UF) e **checklist dinâmico de senha**.
- **Login** com **Lembrar de mim** (2h padrão / 30 dias marcado).
- **Sessão** via **token opaco** (não-JWT) — só o **hash (HMAC-SHA256)** vai para o banco.
- **Revogação** de sessão e `last_used_at` atualizado.
- **Esqueci minha senha**: token único (1h), resposta genérica (anti-enumeração) e **link de teste em `localhost`**.
- **CORS** configurável, respostas JSON padronizadas e **rate limit** simples.
- **UI**: HTML/CSS/JS (Inter), máscaras e **ViaCEP** para endereço.

---

## 🧱 Arquitetura & Stack

- **Backend**: PHP 8+, MySQL 5.7+/8, Apache (mod_rewrite)  
- **Front**: HTML + CSS + JS (sem bundler)

├─ app/
│ ├─ Controllers/Api/AuthController.php
│ ├─ Models/User.php
│ └─ Services/TokenService.php
├─ core/
│ ├─ Database.php
│ ├─ Response.php
│ ├─ Validator.php
│ └─ RateLimiter.php
├─ public/
│ ├─ index.html # landing
│ ├─ login.html # login + lembrar de mim
│ ├─ cadastro.html # registro + checklist de senha
│ ├─ forgot.html # solicitar reset
│ ├─ reset.html # redefinir senha (checklist igual ao cadastro)
│ └─ assets/ # css, js, images
├─ index.php # roteador de /api/*
└─ .htaccess # envia / para public e reescreve /api/*

---

## 🔐 Segurança (resumo)

- **Token opaco**: `random_bytes` → base64url para o cliente; no BD salva **HMAC-SHA256(token, TOKEN_SECRET)**.
- **Segredo**: `TOKEN_SECRET` vem de variável de ambiente. **Nunca** commitar segredos.
- **Senhas**: `password_hash()` / `password_verify()`.
- **Reset**: tabela `password_resets` guarda hash do token, `expires_at`, `used_at`. Ao redefinir, **revoga** sessões antigas.
- **CORS**: origem permitida em `config/config.php`.
- **/api/forgot**: resposta **genérica** (anti-enumeração).

---

## 🚀 Como rodar local

### 1) Requisitos
- PHP 8+ (com PDO/MySQL)
- MySQL 5.7+ / 8
- Apache com **mod_rewrite** (XAMPP/USBWebserver/Laragon também servem)

### 2) Clone e configure
```bash
git clone https://github.com/<seu-usuario>/<seu-repo>.git
cd <seu-repo>

-- usuários
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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- tokens de sessão (salva apenas o hash HMAC do token)
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
  INDEX (user_id), INDEX (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- reset de senha (salva hash do token)
CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (token), INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (opcional) rate limit
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_id VARCHAR(120) NOT NULL,
  hits INT NOT NULL DEFAULT 0,
  period_until DATETIME NOT NULL,
  INDEX (key_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
