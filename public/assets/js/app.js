// ====== Helpers ======
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const tokenKey = 'estoka_token';

function getToken() { return localStorage.getItem(tokenKey); }
function setLoading(v) { $('#globalLoader').hidden = !v; }

async function apiFetch(path, opts = {}) {
    const token = getToken();
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(path, { ...opts, headers });
    if (res.status === 401) {
        // sessão inválida
        localStorage.removeItem(tokenKey);
        localStorage.removeItem('estoka_token_expires');
        location.href = '/public/login.html';
        return Promise.reject(new Error('Unauthorized'));
    }
    return res;
}

// ====== Auth gate ======
async function ensureSession() {
    const token = getToken();
    if (!token) { location.href = '/public/login.html'; return; }
    try {
        const r = await apiFetch('/api/me');
        const data = await r.json();
        if (data?.ok) {
            $('#userEmail').textContent = data.user.email;
        }
    } catch (e) {
        console.error(e);
    }
}

// ====== Router ======
const routes = {
    '/': renderDashboard,
    '/produtos': renderProdutos,
    '/movimentos': renderMovimentos,
    '/relatorios': renderRelatorios,
    '/config': renderConfig
};
function parseRoute() {
    const h = location.hash || '#/';
    const path = h.replace(/^#/, '');
    return routes[path] ? path : '/';
}
function setActiveLink() {
    const curr = parseRoute();
    $$('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('data-route') === curr));
}
function navigate() {
    const curr = parseRoute();
    setActiveLink();
    const view = $('#view');
    view.innerHTML = routes[curr](); // render string
    // init hooks por rota (se necessário)
}

// ====== Views ======
function renderDashboard() {
    return `
    <h2>Dashboard</h2>
    <div class="grid-kpi">
      <div class="card-kpi"><strong>Produtos</strong><br><span id="kpiProdutos">—</span></div>
      <div class="card-kpi"><strong>Itens em falta</strong><br><span id="kpiBaixo">—</span></div>
      <div class="card-kpi"><strong>Entradas (30d)</strong><br><span id="kpiEnt">—</span></div>
      <div class="card-kpi"><strong>Saídas (30d)</strong><br><span id="kpiSai">—</span></div>
    </div>

    <h3 style="margin-top:16px;">Últimas movimentações</h3>
    <table class="table">
      <thead><tr><th>Data</th><th>Tipo</th><th>Produto</th><th>Qtd</th><th>Usuário</th></tr></thead>
      <tbody id="tbMov">
        <tr><td colspan="5">Sem dados ainda.</td></tr>
      </tbody>
    </table>
  `;
}
function renderProdutos() {
    return `
    <h2>Produtos</h2>
    <div class="card-kpi">Em breve: listagem, busca e criação de produtos.</div>
  `;
}
function renderMovimentos() {
    return `
    <h2>Movimentações</h2>
    <div class="card-kpi">Em breve: registrar entradas/saídas e histórico.</div>
  `;
}
function renderRelatorios() {
    return `
    <h2>Relatórios</h2>
    <div class="card-kpi">Em breve: relatórios de estoque e desempenho.</div>
  `;
}
function renderConfig() {
    return `
    <h2>Configurações</h2>
    <div class="card-kpi">Em breve: perfil, empresa, usuários.</div>
  `;
}

// ====== UI wiring ======
window.addEventListener('hashchange', navigate);
$('#btnToggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#btnLogout').addEventListener('click', async () => {
    try {
        await apiFetch('/api/logout', { method: 'POST' });
    } catch (_) { }
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('estoka_token_expires');
    location.href = '/public/login.html';
});

// Boot
(async function init() {
    setLoading(true);
    await ensureSession();
    navigate();
    setActiveLink();
    setLoading(false);
})();
