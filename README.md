# Estoka — Sistema de Cadastro, Login e Recuperação de Senha

Esse projeto é uma aplicação simples em PHP com MySQL feita para ajudar no controle de acesso de usuários. Aqui você pode se cadastrar, fazer login, lembrar sua conta e até recuperar sua senha caso esqueça. Tudo isso com uma interface moderna, responsiva e fácil de usar.

---

## ✅ O que esse projeto faz

- Cadastro de novos usuários com validação de CPF, CEP, UF e senha segura.
- Login com opção de “Lembrar de mim” (pra manter logado por mais tempo).
- Recuperação de senha por e-mail com link de redefinição.
- Tokens seguros e únicos para cada sessão (com hash e expiração).
- Sistema simples de redefinir senha com checklist de regras.
- Layout responsivo feito com HTML, CSS e JavaScript puro.

---

## 🛠️ Tecnologias utilizadas

- **PHP 8+**
- **MySQL**
- **HTML5**
- **CSS3**
- **JavaScript (puro)**
- **ViaCEP API** (para buscar endereço pelo CEP)

---

## 📁 Estrutura do Projeto

```text
.
├─ app/
│  ├─ Controllers/
│  ├─ Models/
│  └─ Services/
├─ core/
├─ public/
│  ├─ cadastro.html
│  ├─ login.html
│  ├─ forgot.html
│  ├─ reset.html
│  ├─ assets/
│  └─ index.html
├─ config/
│  └─ config.php
└─ index.php
```

---

## ⚙️ Como rodar o projeto localmente

1. Instale o PHP e MySQL localmente ou use o XAMPP/Laragon/USBWebserver.
2. Crie um banco chamado `estoka` e importe as tabelas do SQL.
3. Defina sua configuração do banco em `config/config.php`.
4. Inicie o servidor e acesse via navegador: `http://localhost/`.

---

## 💻 Funcionalidades no Front-end

- Interface limpa, moderna e compatível com dispositivos móveis.
- Checklist de senha ao digitar (mín. 6 caracteres, 1 maiúscula, 1 minúscula, 1 caractere especial).
- Máscara de CPF e CEP.
- Preenchimento automático do endereço via ViaCEP.
- Validação de formulário antes do envio.

---

## 🔒 Segurança

- Tokens de sessão são gerados com `random_bytes` e salvos como hash (HMAC SHA256).
- Tokens têm data de expiração e podem ser revogados.
- Senhas são criptografadas com `password_hash()`.
- Recuperação de senha usa token único, com tempo limitado e validação.

---

## 📧 Recuperar Senha

- O usuário informa o e-mail em `forgot.html`.
- Um link é gerado com um token (válido por 1 hora).
- A nova senha é validada e, se tudo estiver certo, o sistema redefine.

---

## 🚧 Em breve

- Sistema de envio real de e-mail (atualmente link só aparece em localhost).
- Painel de usuário logado.
- Controle de sessões ativas.
- Página de dashboard protegida por login.

---

Feito com dedicação ❤️  
_03/09/2025_
