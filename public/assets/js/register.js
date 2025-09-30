// -----------------------------
// Utilidades de UI
// -----------------------------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const form = $('#formCadastro');
const btn = $('#btnSubmit');
const formMsg = $('#formMsg');

const fields = {
  email: $('#email'),
  password: $('#password'),
  password2: $('#password2'),
  cpf: $('#cpf'),
  cep: $('#cep'),
  logradouro: $('#logradouro'),
  numero: $('#numero'),
  bairro: $('#bairro'),
  cidade: $('#cidade'),
  estado: $('#estado'),
  complemento: $('#complemento'),
};
const cepLoader = $('#cepLoader');

// Bloqueia os campos que o CEP preenche (somente leitura)
function lockAddressFields(lock = true) {
  fields.logradouro.readOnly = lock;
  fields.bairro.readOnly = lock;
  fields.cidade.readOnly = lock;
  // select não tem readOnly — usamos disabled
  fields.estado.disabled = lock;
}
lockAddressFields(true);

$('#year') && ($('#year').textContent = new Date().getFullYear());

// -----------------------------
// Mensagens / erros
// -----------------------------
function showAlert(type, message) {
  formMsg.className = `alert ${type}`;
  formMsg.textContent = message;
  formMsg.hidden = false;
}
function clearAlert() { formMsg.hidden = true; }

function setFieldError(name, message) {
  const el = $(`[data-error-for="${name}"]`);
  if (el) el.textContent = message || '';
}
function clearErrors() {
  Object.keys(fields).forEach(k => setFieldError(k, ''));
  clearAlert();
}

// -----------------------------
// Regras de senha
// -----------------------------
function passwordComplex(pw) {
  if (typeof pw !== 'string') pw = '';
  const hasLen = pw.length >= 6;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasSpecial = /[!@#$*]/.test(pw);
  return { hasLen, hasUpper, hasLower, hasSpecial, ok: hasLen && hasUpper && hasLower && hasSpecial };
}

function updatePwChecklist() {
  const req = passwordComplex(fields.password.value || '');
  const map = {
    len: req.hasLen,
    upper: req.hasUpper,
    lower: req.hasLower,
    special: req.hasSpecial
  };
  Object.entries(map).forEach(([k, v]) => {
    const li = document.querySelector(`.pw-req__item[data-req="${k}"]`);
    if (li) li.classList.toggle('ok', !!v);
  });
}

function setupPasswordEye(inputEl, btnId, imgId) {
  const btn = document.getElementById(btnId);
  const img = document.getElementById(imgId);
  if (!inputEl || !btn || !img) return;

  let visivel = false;
  btn.addEventListener('click', () => {
    visivel = !visivel;
    inputEl.type = visivel ? 'text' : 'password';
    img.src = visivel
      ? '/public/assets/images/olho-aberto.svg'
      : '/public/assets/images/olho-fechado.svg';
    const label = visivel ? 'Ocultar senha' : 'Mostrar senha';
    img.alt = label;
    btn.setAttribute('aria-label', label);
  });
}

// aplica nos dois campos
setupPasswordEye(fields.password, 'toggleSenha', 'eyeIcon');
setupPasswordEye(fields.password2, 'toggleSenha2', 'eyeIcon2');

// -----------------------------
// Máscaras & validações
// -----------------------------
function onlyDigits(v) { return (v || '').replace(/\D/g, ''); }

// máscara CPF
function maskCPF(v) {
  v = onlyDigits(v).slice(0, 11);
  v = v.replace(/^(\d{3})(\d)/, '$1.$2');
  v = v.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/, '.$1-$2');
  return v;
}
function validateCPF(cpf) {
  cpf = onlyDigits(cpf);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += parseInt(cpf[i], 10) * ((t + 1) - i);
    const d = ((10 * sum) % 11) % 10;
    if (parseInt(cpf[t], 10) !== d) return false;
  }
  return true;
}

// máscara CEP
function maskCEP(v) {
  v = onlyDigits(v).slice(0, 8);
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
  return v;
}

// contador complemento
fields.complemento.addEventListener('input', () => {
  const len = fields.complemento.value.length;
  const el = $('#complementoCounter');
  if (el) el.textContent = `${len}/40`;
});

// aplica máscaras durante digitação
fields.cpf.addEventListener('input', e => e.target.value = maskCPF(e.target.value));
fields.password.addEventListener('input', updatePwChecklist);
fields.password.addEventListener('focus', updatePwChecklist);

// -----------------------------
// CEP: máscara + auto-busca ao digitar (com debounce)
// -----------------------------
function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

let lastCepFetched = ''; // evita refetch com o mesmo CEP

async function fetchCEP(cepDigits) {
  if (cepDigits.length !== 8) return;

  if (cepDigits === lastCepFetched) return; // mesma consulta, ignora
  lastCepFetched = cepDigits;

  try {
    cepLoader.hidden = false;
    const r = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
    const j = await r.json();

    if (j.erro) {
      setFieldError('cep', 'CEP não encontrado');
      fields.logradouro.value = '';
      fields.bairro.value = '';
      fields.cidade.value = '';
      fields.estado.value = '';
      return;
    }

    fields.logradouro.value = j.logradouro || '';
    fields.bairro.value = j.bairro || '';
    fields.cidade.value = j.localidade || '';
    fields.estado.value = j.uf || '';

    setFieldError('cep', '');
  } catch (err) {
    setFieldError('cep', 'Falha ao consultar CEP');
  } finally {
    cepLoader.hidden = true;
  }
}

const debouncedCepFetch = debounce(fetchCEP, 250);

// um único listener de input: mascara + dispara busca quando completar 8 dígitos
fields.cep.addEventListener('input', e => {
  const masked = maskCEP(e.target.value);
  if (e.target.value !== masked) e.target.value = masked;

  const digits = onlyDigits(masked);
  if (digits.length === 8) {
    debouncedCepFetch(digits);
  } else {
    lastCepFetched = '';
    fields.logradouro.value = '';
    fields.bairro.value = '';
    fields.cidade.value = '';
    fields.estado.value = '';
  }
});

// também dispara ao colar ou alterar programaticamente
fields.cep.addEventListener('change', () => {
  const digits = onlyDigits(fields.cep.value);
  if (digits.length === 8) debouncedCepFetch(digits);
});

// -----------------------------
// Redirect overlay
// -----------------------------
function startRedirect(seconds = 4, url = '/public/login.html') {
  const overlay = document.getElementById('redirectOverlay');
  const bar = document.getElementById('redirBar');
  const count = document.getElementById('redirCount');
  overlay.hidden = false;

  let elapsed = 0;
  const total = seconds * 1000;
  const step = 100;

  const timer = setInterval(() => {
    elapsed += step;
    const pct = Math.min(100, Math.round((elapsed / total) * 100));
    if (bar) bar.style.width = pct + '%';
    if (count) {
      const left = Math.ceil((total - elapsed) / 1000);
      count.textContent = left < 0 ? 0 : left;
    }
    if (elapsed >= total) {
      clearInterval(timer);
      window.location.href = url;
    }
  }, step);
}

// -----------------------------
// Validação no submit
// -----------------------------
function clientValidate() {
  const data = {
    email: fields.email.value.trim(),
    password: fields.password.value,
    password2: fields.password2.value,
    cpf: fields.cpf.value.trim(),
    cep: fields.cep.value.trim(),
    logradouro: fields.logradouro.value.trim(),
    numero: fields.numero.value.trim(),
    bairro: fields.bairro.value.trim(),
    cidade: fields.cidade.value.trim(),
    estado: (fields.estado.value || '').toUpperCase(),
    complemento: fields.complemento.value.trim(),
  };

  const errors = {};

  if (!data.email) errors.email = 'Informe o e-mail';
  else if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.email = 'E-mail inválido';

  const r = passwordComplex(data.password || '');
  if (!data.password) errors.password = 'Informe a senha';
  else if (!r.ok) errors.password = 'Senha deve ter 6+ caracteres, 1 maiúscula, 1 minúscula e 1 especial (!@#$*).';

  if (!data.password2) errors.password2 = 'Confirme a senha';
  else if (data.password2 !== data.password) errors.password2 = 'Senhas não conferem';

  if (!data.cpf) errors.cpf = 'Informe o CPF';
  else if (!validateCPF(data.cpf)) errors.cpf = 'CPF inválido';

  if (!data.cep) errors.cep = 'Informe o CEP';
  else if (onlyDigits(data.cep).length !== 8) errors.cep = 'CEP inválido';

  ['logradouro', 'numero', 'bairro', 'cidade', 'estado'].forEach(f => {
    if (!data[f]) errors[f] = 'Campo obrigatório';
  });

  if (data.complemento.length > 40) errors.complemento = 'Máx. 40 caracteres';

  return { data, errors };
}

// -----------------------------
// Submit
// -----------------------------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const { data, errors } = clientValidate();
  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([k, v]) => setFieldError(k, v));
    showAlert('error', 'Corrija os campos destacados.');
    return;
  }

  btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    const payload = {
      email: data.email,
      password: data.password,
      cpf: data.cpf,
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      complemento: data.complemento
    };

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let out = null, raw = null;
    try { out = await res.json(); } catch (_) { raw = await res.text(); }

    if (res.ok && out?.ok) {
      form.reset();
      const cc = $('#complementoCounter'); if (cc) cc.textContent = '0/40';
      startRedirect(4, '/public/login.html');
      return;
    } else {
      if (out?.errors) Object.entries(out.errors).forEach(([k, v]) => setFieldError(k, v));
      const msg = out?.message || `Erro HTTP ${res.status} — ${String(raw || '').slice(0, 200)}`;
      showAlert('error', msg);
    }
  } catch (err) {
    showAlert('error', 'Falha de comunicação. Verifique sua conexão e tente novamente.');
  } finally {
    btn.disabled = false; btn.textContent = 'Criar conta';
  }
});
