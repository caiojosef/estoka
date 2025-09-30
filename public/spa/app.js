/* =================== SPA Shell + Auth Guard (token cifrado) =================== */
const routes = {
  '#/inicio': {
    folder: 'dashboard',
    file: 'index',
    title: 'Página Inicial',
    css: ['index.css'],
    js: ['index.js']
  },
  '#/minha-pagina': {
    folder: 'minha-pagina',
    file: 'index',
    title: 'Minha Página',
    css: ['index.css'],
    js: ['index.js']
  },
  '#/cadastrar-produto': {
    folder: 'cadastrar-produto',
    file: 'index',
    title: 'Cadastrar Produto',
    css: ['index.css'],
    js: ['index.js']
  }
};

const $ = (s, c = document) => c.querySelector(s);
const view = $('#view');
const pageTitle = $('#pageTitle');

/* =================== CRYPTO (AES-GCM) — leitura do pacote cifrado =================== */
const textToBytes = (txt) => new TextEncoder().encode(txt);
const bytesToBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const base64ToBytes = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

function clearStoredTokens() {
  sessionStorage.removeItem('estoka_token');
  sessionStorage.removeItem('estoka_token_expires');
  localStorage.removeItem('estoka_token');
  localStorage.removeItem('estoka_token_expires');
  sessionStorage.removeItem('estoka_k');
  sessionStorage.removeItem('estoka_auth');
  localStorage.removeItem('estoka_k');
  localStorage.removeItem('estoka_auth');
  sessionStorage.removeItem('estoka_user');
  localStorage.removeItem('estoka_user');
}
function hasRemembered() { return !!localStorage.getItem('estoka_auth'); }

async function decryptAuth(remember) {
  const storage = remember ? localStorage : sessionStorage;
  const keyB64 = storage.getItem('estoka_k');
  const authJson = storage.getItem('estoka_auth');
  if (!keyB64 || !authJson) return null;

  const { iv, cipher } = JSON.parse(authJson);
  const key = await crypto.subtle.importKey('raw', base64ToBytes(keyB64), 'AES-GCM', false, ['decrypt']);
  try {
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(iv) }, key, base64ToBytes(cipher));
    return JSON.parse(new TextDecoder().decode(plainBuf)); // { token, exp }
  } catch { return null; }
}

async function getAuth() { return await decryptAuth(hasRemembered()); }

/* =================== API helper: anexa Bearer se existir =================== */
async function apiFetch(url, options = {}) {
  const auth = await getAuth(); // { token, exp } ou null
  const headers = new Headers(options.headers || {});
  if (auth?.token) {
    const tNow = Date.now();
    const tExp = Date.parse(auth.exp);
    if (Number.isFinite(tExp) && tNow > tExp - 10_000) {
      // expirado ou perto de expirar: limpa e volta pro login
      clearStoredTokens();
      window.location.href = '/public/login.html';
      return new Response(null, { status: 401 });
    }
    headers.set('Authorization', 'Bearer ' + auth.token);
  }
  return fetch(url, { ...options, headers });
}

/* =================== estoka_user helpers =================== */
function readUser() {
  const raw = localStorage.getItem('estoka_user') || sessionStorage.getItem('estoka_user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveUser(u) {
  const mem = localStorage.getItem('estoka_user') ? localStorage : sessionStorage;
  mem.setItem('estoka_user', JSON.stringify(u));
}

/* =================== Auth guard (toda troca de rota) =================== */
async function ensureAuth() {
  const auth = await getAuth();
  if (!auth || !auth.token) {
    clearStoredTokens();
    window.location.href = '/public/login.html';
    throw new Error('unauthorized');
  }
  // (Opcional) preencher email exibido
  try {
    const r = await apiFetch('/api/me');
    if (r.ok) {
      const j = await r.json();
      const email = j?.user?.email || '';
      if (email) $('#userEmail')?.textContent = email;
      // Se /api/me também devolver slug/primeiro_login, mescla:
      if (j?.user?.slug !== undefined || j?.user?.primeiro_login !== undefined) {
        const u = readUser() || {};
        if (j.user.slug !== undefined) u.slug = j.user.slug;
        if (j.user.primeiro_login !== undefined) u.primeiro_login = Number(j.user.primeiro_login);
        if (j.user.email) u.email = j.user.email;
        saveUser(u);
      }
    }
  } catch { }
}

/* =================== Router =================== */
let currentLinks = []; // para remover CSS/JS da página anterior

function removeCurrentAssets() {
  currentLinks.forEach(el => el.remove());
  currentLinks = [];
}

async function loadRoute(hash) {
  const r = routes[hash] || routes['#/inicio'];
  pageTitle.textContent = r.title;
  view?.setAttribute?.('aria-busy', 'true');

  removeCurrentAssets();

  // CSS da rota
  for (const css of (r.css || [])) {
    const href = `./pages/${r.folder}/${css}`;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; link.dataset.pageAsset = '1';
    document.head.appendChild(link);
    currentLinks.push(link);
  }

  // HTML da rota
  try {
    const htmlUrl = `./pages/${r.folder}/${r.file}.html`;
    const resp = await fetch(htmlUrl, { cache: 'no-store' });
    const html = await resp.text();
    view.innerHTML = html;
  } catch {
    view.innerHTML = `<div class="card">Falha ao carregar a rota.</div>`;
  }

  // JS da rota (como módulo para isolar escopo)
  for (const js of (r.js || [])) {
    const src = `./pages/${r.folder}/${js}`;
    const s = document.createElement('script');
    s.type = 'module'; s.src = src + `?t=${Date.now()}`; // bust cache no dev
    s.dataset.pageAsset = '1';
    document.body.appendChild(s);
    currentLinks.push(s);
  }

  // marca item ativo
  document.querySelectorAll('.menu-link').forEach(a => {
    a.setAttribute('aria-current', a.getAttribute('href') === hash ? 'page' : 'false');
  });

  view?.removeAttribute?.('aria-busy');
}

async function navigate() {
  try {
    await ensureAuth();
    await loadRoute(location.hash || '#/inicio');
    // 🔒 aplica o gate de slug após cada navegação
    SlugGate.enforce();
  } catch (e) {
    // já redirecionado no ensureAuth
  }
}

/* =================== Logout =================== */
$('#btnLogout')?.addEventListener('click', () => {
  clearStoredTokens();
  window.location.href = '/public/login.html';
});

/* Boot */
window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', () => {
  navigate();
  // inicia o SlugGate (injeta HTML/CSS e arma watchers)
  SlugGate.init();
});

/* Exporta helpers para páginas (se quiser usar) */
window.SPA = { apiFetch };

/* =================== SlugGate: bloqueio obrigatório até definir o slug =================== */
const SlugGate = (() => {
  // injeta HTML do modal na página (uma vez)
  function injectHtmlOnce() {
    if (document.getElementById('slugLock')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
<div id="slugLock" class="slug-lock" aria-hidden="true">
  <div class="slug-lock__backdrop"></div>
  <section class="slug-lock__modal" role="dialog" aria-modal="true" aria-labelledby="slugLockTitle">
    <header class="slug-lock__header">
      <img src="/public/assets/images/logo.png" alt="Vitrine dos Links" class="slug-lock__logo" />
      <h2 id="slugLockTitle">Bem-vindo! Defina o link da sua página</h2>
      <p class="slug-lock__subtitle">Este nome será parte do seu endereço e <strong>não poderá ser alterado</strong> depois.</p>
    </header>
    <form id="slugForm" class="slug-lock__form" novalidate>
      <label for="slugInput" class="slug-lock__label">Escolha seu nome (apenas minúsculas, números e “-”)</label>
      <div class="slug-lock__inputrow">
        <span class="slug-lock__prefix">vitrinedoslinks.com.br/</span>
        <input id="slugInput" name="slug" inputmode="lowercase" placeholder="seu-nome" autocomplete="off" required />
      </div>
      <small id="slugHint" class="slug-lock__hint">Ex.: <code>loja-do-joao</code>, <code>maria-doces</code></small>
      <small id="slugError" class="slug-lock__error" aria-live="polite"></small>
      <div class="slug-lock__actions">
        <button type="button" id="slugCancel" class="btn btn--ghost">Agora não</button>
        <button type="submit" id="slugSubmit" class="btn btn--primary">Confirmar</button>
      </div>
    </form>
  </section>
  <section id="slugConfirm" class="slug-confirm" role="dialog" aria-modal="true" aria-labelledby="slugConfirmTitle" hidden>
    <div class="slug-confirm__card">
      <h3 id="slugConfirmTitle">Confirmar nome da página?</h3>
      <p>Deseja usar <strong id="slugConfirmValue"></strong> como o nome permanente da sua página?</p>
      <div class="slug-confirm__actions">
        <button type="button" id="slugBack" class="btn btn--ghost">Voltar</button>
        <button type="button" id="slugYes" class="btn btn--primary">Sim, confirmar</button>
      </div>
    </div>
  </section>
</div>`;
    document.body.appendChild(wrap.firstElementChild);
  }

  // injeta CSS mínimo (pode mover para seu app.css)
  function injectCssOnce() {
    if (document.getElementById('slugLockCSS')) return;
    const style = document.createElement('style');
    style.id = 'slugLockCSS';
    style.textContent = `
.slug-lock{position:fixed;inset:0;display:none;place-items:center;z-index:99999}
.slug-lock__backdrop{position:absolute;inset:0;background:rgba(5,16,26,.45);backdrop-filter:blur(4px)}
.slug-lock__modal{position:relative;width:min(640px,92vw);background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;box-shadow:0 18px 48px rgba(15,54,90,.22);z-index:1}
.slug-lock__header{text-align:center;margin-bottom:12px}
.slug-lock__logo{height:38px;margin-bottom:6px}
.slug-lock__subtitle{color:var(--text-2);margin:6px 0 0}
.slug-lock__form{display:grid;gap:10px;margin-top:8px}
.slug-lock__label{font-weight:600}
.slug-lock__inputrow{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:#fff}
.slug-lock__prefix{color:var(--text-2);font-size:14px;white-space:nowrap}
#slugInput{border:none;outline:none;padding:8px 6px;font-size:15px}
.slug-lock__hint{color:var(--text-2)}
.slug-lock__error{color:var(--error);min-height:16px;display:block}
.slug-lock__actions{display:flex;justify-content:space-between;gap:12px;margin-top:6px}
.slug-confirm{position:fixed;inset:0;display:grid;place-items:center;z-index:100000}
.slug-confirm__card{width:min(520px,92vw);background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;box-shadow:0 18px 48px rgba(15,54,90,.22)}
.slug-confirm__actions{display:flex;justify-content:flex-end;gap:10px;margin-top:10px}
body.slug-no-scroll{overflow:hidden}
`;
    document.head.appendChild(style);
  }

  let root, confirmBox, confirmValue, input, errEl, submitBtn, cancelBtn, backBtn, yesBtn;
  let focusable = [];
  let tamperObs, keepAliveTimer;

  function validarSlug(slug) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug); }

  function mustShow() {
    const u = readUser();
    // se não houver user no storage, ou é primeiro login, ou não há slug -> mostrar
    return !u || u.primeiro_login === 1 || !u.slug;
  }

  function ensureVisible() {
    root.style.display = 'grid';
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('slug-no-scroll');
  }
  function hideAll() {
    root.style.display = 'none';
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('slug-no-scroll');
  }

  function logoutToLogin() {
    clearStoredTokens();
    window.location.href = '/public/login.html';
  }

  async function checkAvailability(slug) {
    const r = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
    const j = await r.json().catch(() => ({}));
    // caso backend responda {ok:false, available:false} para inválido, tratamos no front mesmo
    return !!j?.available;
  }

  async function saveSlug(slug) {
    const r = await apiFetch('/api/slug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    });
    if (r.status === 401) { logoutToLogin(); return false; }
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.ok) {
      const u = readUser() || {};
      u.slug = slug; u.primeiro_login = 0;
      saveUser(u);
      return true;
    }
    throw new Error(j?.message || 'Falha ao salvar o slug');
  }

  function updateFocusable() {
    focusable = Array.from(root.querySelectorAll('button, input'));
  }
  function focusTrap(e) {
    if (root.style.display === 'none') return;
    if (e.key === 'Tab') {
      const f = focusable.filter(el => !el.disabled && !el.hidden);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); }
  }
  function antiTamper() {
    tamperObs?.disconnect?.();
    tamperObs = new MutationObserver(() => ensureVisible());
    tamperObs.observe(root, { attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
    clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(ensureVisible, 800);
  }

  function wire() {
    root = document.getElementById('slugLock');
    confirmBox = document.getElementById('slugConfirm');
    confirmValue = document.getElementById('slugConfirmValue');
    input = document.getElementById('slugInput');
    errEl = document.getElementById('slugError');
    submitBtn = document.getElementById('slugSubmit');
    cancelBtn = document.getElementById('slugCancel');
    backBtn = document.getElementById('slugBack');
    yesBtn = document.getElementById('slugYes');

    // Submit → valida + checa disponibilidade + abre confirmação
    document.getElementById('slugForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      const slug = (input.value || '').trim();
      if (!validarSlug(slug)) {
        errEl.textContent = 'Use apenas letras minúsculas, números e hífens (sem espaços/acentos).';
        input.focus(); return;
      }
      submitBtn.disabled = true;
      try {
        const ok = await checkAvailability(slug);
        if (!ok) { errEl.textContent = 'Esse nome já está em uso. Tente outro.'; return; }
        confirmValue.textContent = slug;
        confirmBox.hidden = false;
        yesBtn.focus();
      } catch {
        errEl.textContent = 'Não foi possível verificar a disponibilidade.';
      } finally {
        submitBtn.disabled = false;
      }
    });

    backBtn.addEventListener('click', () => {
      confirmBox.hidden = true;
      input.focus();
    });
    yesBtn.addEventListener('click', async () => {
      yesBtn.disabled = true;
      try {
        const slug = confirmValue.textContent.trim();
        const ok = await saveSlug(slug);
        if (ok) { hideAll(); setTimeout(() => alert?.('Seu link foi definido!'), 50); }
      } catch (e) {
        errEl.textContent = e.message || 'Falha ao salvar.';
        confirmBox.hidden = true;
        input.focus();
      } finally {
        yesBtn.disabled = false;
      }
    });

    // “Agora não” → logout suave
    cancelBtn.addEventListener('click', logoutToLogin);

    // não fecha clicando fora
    root.addEventListener('click', (e) => {
      if (e.target === root || e.target.classList.contains('slug-lock__backdrop')) {
        e.stopPropagation();
      }
    });

    updateFocusable();
    document.addEventListener('keydown', focusTrap);
    antiTamper();
  }

  function enforce() {
    if (!mustShow()) { hideAll(); return; }
    ensureVisible();
    setTimeout(() => input?.focus(), 30);
  }

  function init() {
    injectCssOnce();
    injectHtmlOnce();
    wire();
    // força status inicial
    enforce();
    // reaplicar a cada troca de hash (o router já chama enforce, isto aqui é redundância segura)
    window.addEventListener('hashchange', enforce);
  }

  return { init, enforce };
})();
