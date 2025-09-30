/* SPA Shell + Auth Guard (token cifrado) */
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
      window.location.href = '/public/index.html';
      return new Response(null, { status: 401 });
    }
    headers.set('Authorization', 'Bearer ' + auth.token);
  }
  return fetch(url, { ...options, headers });
}

/* =================== Auth guard (toda troca de rota) =================== */
async function ensureAuth() {
  const auth = await getAuth();
  if (!auth || !auth.token) {
    clearStoredTokens();
    window.location.href = '/public/index.html';
    throw new Error('unauthorized');
  }
  // opcional: mostrar email do usuário (se /api/me existir)
  try {
    const r = await apiFetch('/api/me');
    if (r.ok) {
      const j = await r.json();
      const email = j?.user?.email || '';
      if (email) $('#userEmail').textContent = email;
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
  view.setAttribute('aria-busy', 'true');

  // remove assets da página anterior
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

  view.removeAttribute('aria-busy');
}

async function navigate() {
  try {
    await ensureAuth();
    await loadRoute(location.hash || '#/inicio');
  } catch (e) {
    // já redirecionado no ensureAuth
  }
}

/* =================== Logout =================== */
$('#btnLogout').addEventListener('click', () => {
  clearStoredTokens();
  window.location.href = '/public/index.html';
});

/* Boot */
window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

/* Exporta helpers para páginas (se quiser usar) */
window.SPA = { apiFetch };
