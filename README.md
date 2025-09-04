# Estoka — Gestão de Estoque com Login, Cadastro e Vitrine Pública

Projeto completo para gerenciar estoques, com sistema de autenticação (cadastro, login, redefinição de senha), painel administrativo e agora com **vitrine pública personalizada + envio via WhatsApp**.

Desenvolvido com foco em clareza, simplicidade e usabilidade — ideal para quem está aprendendo ou quer um sistema funcional direto ao ponto.

---

## ✅ O que está incluído

- Cadastro com validações (CPF, CEP via API, senha com checklist visual).
- Login com **Lembrar de mim** (2h padrão ou 30 dias se marcado).
- Sessão segura com **token opaco** e hash HMAC no backend.
- **Logout automático** ao revogar token ou redefinir senha.
- Esqueci minha senha + redefinição com token de 1h.
- Vitrine pública no formato `estoka.com.br/seunome`, com:
  - Todos os produtos cadastrados.
  - Carrinho de compras com múltiplos itens.
  - Geração de link para envio via **WhatsApp**.
- Layout responsivo, leve e elegante.
- Footer profissional e navbar com visual melhorado.
- Códigos e estilo centralizados para reutilização (CSS e JS).

---

## 🖼️ Interface visual

- Totalmente responsivo (mobile, tablet e desktop).
- Design limpo com componentes reutilizáveis.
- Páginas de login, cadastro, recuperação e redefinição com estilo unificado.
- Novo visual da **vitrine pública da loja** incluído no `index.html`.

---

## 💡 Novidade: Página da loja + WhatsApp

No plano Estoka (R$ 50/mês), cada lojista tem:

- Link exclusivo: `estoka.com.br/sualoja`
- Lista de produtos formatados (ícone, preço, botão de adicionar).
- Carrinho de compras que gera automaticamente uma mensagem:
  - Exemplo:
    ```
    Olá! Tenho interesse nos produtos do meu carrinho:
    - Pulseira Pérolas (1x)
    - Anel Prata 925 (1x)
    Total estimado: R$ 199,80
    ```
- Link de envio direto para o número da loja via WhatsApp.

---

## 📁 Estrutura de pastas

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
│  ├─ index.html         # landing + vitrine pública
│  ├─ login.html         # login
│  ├─ cadastro.html      # registro
│  ├─ forgot.html        # pedir reset
│  ├─ reset.html         # redefinir senha
│  ├─ assets/            # css, js, imagens
│  └─ style.css          # principal do layout
├─ index.php             # roteador principal das APIs
└─ .htaccess             # envia / → public e roteia /api
```

---

## 📦 Banco de dados (SQL)

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
  whatsapp VARCHAR(20),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token CHAR(64) NOT NULL,
  user_agent VARCHAR(255),
  ip_address VARCHAR(45),
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME NULL,
  is_revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔒 Segurança e tokens

- **Tokens opacos** gerados com `random_bytes()`.
- Salvos com **hash HMAC-SHA256** no backend.
- `password_hash` e `password_verify` para senhas.
- Tokens de redefinição de senha são descartados após o uso.

---

## 📨 API e rotas

| Método | Rota           | Descrição                       |
|--------|----------------|----------------------------------|
| POST   | /api/register  | Cadastra um novo usuário         |
| POST   | /api/login     | Login + geração de token         |
| GET    | /api/me        | Retorna dados do usuário logado  |
| POST   | /api/logout    | Revoga o token atual             |
| POST   | /api/forgot    | Inicia recuperação de senha      |
| POST   | /api/reset     | Redefine a senha com token       |

---

## 📑 Páginas legais (LGPD e afins)

- **Política de Privacidade**
- **Termos de Uso**
- **Política de Cookies**

Essas páginas estão disponíveis com layout unificado e responsivo.

---

## 💡 Ideias futuras

- Editor visual da vitrine
- Pagamento integrado (via Pix)
- Upload de imagem por produto
- Integração com Instagram Shopping
- Estatísticas de visualização de catálogo
- Envio automático de lembretes de carrinho

---

## 🙌 Créditos

Feito com ❤️ por um dev júnior apaixonado por organização e usabilidade.