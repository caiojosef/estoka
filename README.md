# Estoka — Cadastro, Login e Recuperação de Senha

Projeto simples em **PHP + MySQL** para gerenciar usuários: **cadastro**, **login com “lembrar de mim”**, **esqueci a senha** e **redefinição**. Tentei deixar o código direto e a interface limpa, para qualquer pessoa conseguir usar e entender.

---

## ✅ O que tem aqui

- Cadastro com validações (CPF, CEP, UF) e **checklist da senha** enquanto digita.
- Login com opção **Lembrar de mim** (2h padrão / 30 dias marcado).
- Sessão com **token opaco** (o valor real fica só no cliente; no banco eu salvo o **hash HMAC**).
- **Logout** e **revogação** de tokens.
- **Esqueci minha senha** com token de 1h e fluxo de redefinição.
- Interface responsiva (HTML, CSS e JS puro) e **ViaCEP** para buscar endereço.

---

## 🛠️ Tecnologias

- PHP 8+
- MySQL 5.7/8
- HTML + CSS + JavaScript
- ViaCEP (consulta CEP)

---

## 📁 Estrutura resumida

```text
.
├─ app/
│  ├─ Controllers/Api/AuthController.php
│  ├─ Models/User.php
│  └─ Services/TokenService.php
├─ core/
│  ├─ Database.php
│  ├─ Response.php
│  ├─ Validator.php
│  └─ RateLimiter.php
├─ public/
│  ├─ index.html       # landing
│  ├─ login.html       # login
│  ├─ cadastro.html    # registro
│  ├─ forgot.html      # pedir reset
│  ├─ reset.html       # redefinir senha
│  └─ assets/          # css, js, images
├─ index.php           # roteia /api/*
└─ .htaccess           # envia / → public e /api → index.php
```

---

## ⚙️ Como rodar

1. Tenha PHP e MySQL (pode ser XAMPP/Laragon/USBWebserver).
2. Crie o banco **`estoka`** e rode os **SQLs** abaixo (tem a seção “Banco de dados” com tudo pronto).
3. Crie `config/config.php` com suas credenciais:
   ```php
   <?php
   return [
     'db' => [
       'host' => '127.0.0.1',
       'dbname' => 'estoka',
       'user' => 'root',
       'pass' => '',
       'charset' => 'utf8mb4',
     ],
     'cors_allowed_origin' => 'http://localhost',
   ];
   ```
4. Defina a variável de ambiente `TOKEN_SECRET` (um valor aleatório grande):
   - **Windows (PowerShell)**  
     ```powershell
     [System.Environment]::SetEnvironmentVariable('TOKEN_SECRET','troque-por-um-valor-seguro','User')
     ```
   - **Linux/macOS**  
     ```bash
     export TOKEN_SECRET="troque-por-um-valor-seguro"
     ```
5. Inicie seu servidor e acesse `http://localhost/`.

---

## 🔐 Como funciona a segurança (bem simples)

- O login gera um **token opaco** com `random_bytes`.  
  No navegador fica o token “em claro”.  
  No banco eu salvo **só o hash** (`HMAC-SHA256(token, TOKEN_SECRET)`).
- Senha de usuário: `password_hash()` / `password_verify()`.
- **Reset de senha**: salvo o **hash do token** com validade de 1h; ao usar, **marco usado** e **revogo** sessões antigas.
- **CORS**: controlado por `config/config.php`.

---

## 💻 Front-end (o que a pessoa vê)

- Telas: **cadastro**, **login**, **esqueci senha** e **redefinir**.
- **Checklist da senha** (fica verde quando a regra passa):  
  mínimo 6, 1 maiúscula, 1 minúscula, 1 especial (`!@#$*`).
- Máscara de **CPF** e **CEP** e preenchimento automático pelo **ViaCEP**.

---

## 📦 Banco de dados (SQL)

> Observação: deixei **sem chave estrangeira** por padrão para evitar erro 1215 em ambientes mais antigos.  
> Se quiser, tem uma versão **opcional** com FKs logo abaixo.

### Tabelas principais

```sql
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
  INDEX idx_user_id (user_id),
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_pw_token (token),
  INDEX idx_pw_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_id VARCHAR(120) NOT NULL,
  hits INT NOT NULL DEFAULT 0,
  period_until DATETIME NOT NULL,
  INDEX idx_key (key_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Chaves estrangeiras (opcional)

```sql
ALTER TABLE auth_tokens
  ADD CONSTRAINT fk_auth_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE password_resets
  ADD CONSTRAINT fk_pw_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;
```

### Criando um usuário de teste

```bash
php -r "echo password_hash('Aa@123*', PASSWORD_DEFAULT), PHP_EOL;"
```

```sql
INSERT INTO users (email, password_hash, cpf, cep, logradouro, numero, bairro, cidade, estado, complemento)
VALUES (
  'teste@estoka.com',
  '<COLE_AQUI_O_HASH_GERADO>',
  '00000000000',
  '00000-000',
  'Rua Exemplo',
  '123',
  'Centro',
  'Araraquara',
  'SP',
  'Apto 1'
);
```

---

## 🧪 Rotas principais (API)

- **POST `/api/register`** — cria usuário
- **POST `/api/login`** — autentica e retorna token
- **GET `/api/me`** — retorna dados do usuário autenticado
- **POST `/api/logout`** — faz logout e revoga token
- **POST `/api/forgot`** — inicia processo de redefinir senha
- **POST `/api/reset`** — redefine senha com token

---

## 🚧 Ideias para próximas versões

- Envio real de e-mail (SMTP/serviço de e-mail).
- Migrations e seeds.
- Testes (PHPUnit).
- Docker Compose para subir ambiente rápido.
- Algumas melhorias de segurança de headers e CSRF em rotas de formulário.

---

Feito com dedicação ❤️  
Se algo não rodar no seu PC, abre uma issue que eu tento ajudar!
