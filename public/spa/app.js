/* =========
   SPA Shell
   - Navbar + Sidebar fixos
   - Router + Loader com páginas em /public/spa-pages/pages/<rota>/
   - Suporte a init()/destroy() por página
   ========= */

const VERSION = 'v1'; // troque no deploy para bust de cache

// ---- Navbar/Sidebar
const btnSidebar = document.getElementById('btnSidebar');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebarBackdrop');
const view = document.getElementById('view');

function openSidebar() { sidebar.classList.add('is-open'); backdrop.hidden = false; btnSidebar.setAttribute('aria-expanded', 'true'); }
function closeSidebar() { sidebar.classList.remove('is-open'); backdrop.hidden = true; btnSidebar.setAttribute('aria-expanded', 'false'); }
function toggleSidebar() { sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar(); }

btnSidebar.addEventListener('click', toggleSidebar);
backdrop.addEventListener('click', closeSidebar);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

// Chip copiar link
const chipTextEl = document.getElementById('chipLinkText');
document.getElementById('btnCopy').addEventListener('click', async () => {
  const text = chipTextEl.textContent.trim();
  try { await navigator.clipboard.writeText(text); flashCopy(); } catch (_) { }
});
function flashCopy() {
  const btn = document.getElementById('btnCopy');
  const old = btn.textContent; btn.textContent = 'Copiado!';
  setTimeout(() => btn.textContent = old, 900);
}

// Logout simples (integre com sua API depois)
document.getElementById('btnLogout').addEventListener('click', () => {
  sessionStorage.clear(); localStorage.clear();
  location.href = '/public/login.html';
});

// ---- Router config (rota → pasta)
const ROUTES = {
  '/inicio': 'dashboard',
  '/minha-pagina': 'minha-pagina'
};

// ---- Estado simples (ex.: slug para o chip)
const store = {
  user: { email: localStorage.getItem('vl_email') || '', name: localStorage.getItem('vl_name') || '' },
  slug: localStorage.getItem('vl_slug') || 'seunome'
};
updateChipSlug(store.slug);
function updateChipSlug(slug) {
  const s = (slug || 'seunome').toLowerCase();
  const text = `vitrinedoslinks.com.br/${s}`;
  chipTextEl.innerHTML = text.replace(s, `<b>${s}</b>`);
}

// ---- API helper (placeholder; adapte ao seu backend)
const api = {
  async get(path, opts = {}) { return fetch(path, { ...opts, headers: { 'Accept': 'application/json', ...(opts.headers || {}) } }); },
  async post(path, body, opts = {}) { return fetch(path, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } }); }
};

// ---- Loader com init/destroy + AbortController por navegação
let currentCleanup = null;
let currentAbort = null;
const htmlCache = new Map();
const cssLoaded = new Set();

function parseRoute() {
  const h = (location.hash || '#/inicio').replace(/^#/, '');
  return ROUTES[h] ? h : '/inicio';
}
function setActiveLink() {
  const curr = '#' + parseRoute();
  document.querySelectorAll('.side__link').forEach(a => a.classList.toggle('active', a.getAttribute('href') === curr));
}

// injeta CSS da página uma única vez
function ensurePageCSS(dir) {
  const href = `/public/spa/pages/${dir}/index.css`;
  if (cssLoaded.has(href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href + `?${VERSION}`;
  link.onerror = () => link.remove(); // se não existir, segue sem
  document.head.appendChild(link);
  cssLoaded.add(href);
}

// carrega HTML (com cache simples)
async function loadPageHTML(dir, signal) {
  const url = `/public/spa/pages/${dir}/index.html`;
  if (htmlCache.has(url)) return htmlCache.get(url);
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error('HTML not found');
  const html = await res.text();
  htmlCache.set(url, html);
  return html;
}

// importa módulo JS da página
async function loadPageModule(dir) {
  try {
    const mod = await import(`/public/spa/pages/${dir}/index.js?${VERSION}`);
    return mod || {};
  } catch (_) {
    return {}; // sem JS da página, segue só com HTML
  }
}

async function navigate() {
  // limpar rota anterior
  if (typeof currentCleanup === 'function') { try { currentCleanup(); } catch (_) { } }
  if (currentAbort) { currentAbort.abort(); }
  currentAbort = new AbortController();

  // estado de navegação
  setActiveLink();
  view.setAttribute('aria-busy', 'true');

  // descobre pasta da rota
  const route = parseRoute();
  const dir = ROUTES[route];

  // tenta carregar assets
  try {
    ensurePageCSS(dir);
    const [html, mod] = await Promise.all([
      loadPageHTML(dir, currentAbort.signal),
      loadPageModule(dir)
    ]);

    // render e foco
    view.innerHTML = html;
    view.focus({ preventScroll: true });
    view.scrollTo({ top: 0, behavior: 'instant' });

    // init da página
    if (typeof mod.init === 'function') {
      const cleanup = mod.init({
        el: view,
        params: {},          // se precisar ler query/hash, parse aqui
        store,
        api,
        abort: currentAbort
      });
      currentCleanup = (typeof cleanup === 'function') ? cleanup : (mod.destroy || null);
    } else {
      currentCleanup = (typeof mod.destroy === 'function') ? mod.destroy : null;
    }
  } catch (err) {
    // fallback 404 simples
    view.innerHTML = `
      <section class="card">
        <h1 class="h1">Página não encontrada</h1>
        <p class="sub">Crie a pasta <code>/public/spa/pages/${dir}/</code> com <code>index.html</code>.</p>
        <p><a class="btn btn--secondary btn--sm" href="#/minha-pagina">Ir para Minha Página</a></p>
      </section>`;
    currentCleanup = null;
  } finally {
    view.removeAttribute('aria-busy');
    // fecha drawer em telas pequenas
    if (window.matchMedia('(max-width: 980px)').matches) closeSidebar();
  }
}

// click nos links da sidebar fecha drawer (mobile)
document.querySelectorAll('.side__link').forEach(a => {
  a.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 980px)').matches) closeSidebar();
  });
});

window.addEventListener('hashchange', navigate);
if (!location.hash) location.hash = '#/inicio';  // força iniciar no dashboard
setActiveLink();
navigate();
