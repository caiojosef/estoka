/* =================== OLX-like Directory Logic =================== */
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));
const nf = new Intl.NumberFormat('pt-BR');
const cf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

$('#year').textContent = new Date().getFullYear();

/* ----- Catalogs & Mock Data ----- */
const ESTADOS = [
    { uf: 'AC', nome: 'Acre' }, { uf: 'AL', nome: 'Alagoas' }, { uf: 'AP', nome: 'Amapá' }, { uf: 'AM', nome: 'Amazonas' },
    { uf: 'BA', nome: 'Bahia' }, { uf: 'CE', nome: 'Ceará' }, { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' },
    { uf: 'GO', nome: 'Goiás' }, { uf: 'MA', nome: 'Maranhão' }, { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' }, { uf: 'PB', nome: 'Paraíba' }, { uf: 'PR', nome: 'Paraná' },
    { uf: 'PE', nome: 'Pernambuco' }, { uf: 'PI', nome: 'Piauí' }, { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' },
    { uf: 'RS', nome: 'Rio Grande do Sul' }, { uf: 'RO', nome: 'Rondônia' }, { uf: 'RR', nome: 'Roraima' }, { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'São Paulo' }, { uf: 'SE', nome: 'Sergipe' }, { uf: 'TO', nome: 'Tocantins' }
];

const ICON = (c) => ({
    'Moda': '👗', 'Eletrônicos': '🔌', 'Casa & Decoração': '🛋️', 'Beleza & Cuidados': '💄', 'Esportes': '🏃', 'Pet': '🐾',
    'Beleza & Estética': '💅', 'Tecnologia': '💻', 'Saúde & Bem-estar': '🩺', 'Automotivo': '🚗', 'Educação': '🎓', 'Eventos': '📸'
}[c] || '📌');

const CATS_PROD = ['Moda', 'Eletrônicos', 'Casa & Decoração', 'Beleza & Cuidados', 'Esportes', 'Pet'];
const CATS_SERV = ['Beleza & Estética', 'Tecnologia', 'Saúde & Bem-estar', 'Automotivo', 'Educação', 'Eventos'];

const lojas = [
    { id: 'p1', tipo: 'produto', nome: 'Loja Aurora', slug: 'aurora', cat: 'Moda', estado: 'SP', cidade: 'São Paulo', rating: 4.8, reviews: 87, views7d: 1290, createdAt: daysAgo(20), preco: 149 },
    { id: 'p2', tipo: 'produto', nome: 'TechPrime', slug: 'techprime', cat: 'Eletrônicos', estado: 'PR', cidade: 'Curitiba', rating: 4.6, reviews: 112, views7d: 1150, createdAt: daysAgo(14), preco: 399 },
    { id: 'p3', tipo: 'produto', nome: 'Casa Viva', slug: 'casaviva', cat: 'Casa & Decoração', estado: 'SP', cidade: 'Campinas', rating: 4.7, reviews: 56, views7d: 920, createdAt: daysAgo(30), preco: 89 },
    { id: 'p4', tipo: 'produto', nome: 'Studio Fit', slug: 'studiofit', cat: 'Esportes', estado: 'RS', cidade: 'Porto Alegre', rating: 4.5, reviews: 44, views7d: 740, createdAt: daysAgo(5), preco: 129 },
    { id: 'p5', tipo: 'produto', nome: 'Pet Nobre', slug: 'petnobre', cat: 'Pet', estado: 'SP', cidade: 'Santos', rating: 4.9, reviews: 73, views7d: 880, createdAt: daysAgo(7), preco: 59 },
    { id: 'p6', tipo: 'produto', nome: 'Glow Beauty', slug: 'glowbeauty', cat: 'Beleza & Cuidados', estado: 'MG', cidade: 'Belo Horizonte', rating: 4.4, reviews: 39, views7d: 610, createdAt: daysAgo(2), preco: 79 },
];
const prestadores = [
    { id: 's1', tipo: 'servico', nome: 'Ana Fotografia', slug: 'anafotos', cat: 'Eventos', estado: 'SP', cidade: 'São Paulo', rating: 4.9, reviews: 102, views7d: 990, createdAt: daysAgo(9), preco: null, faixa: 'A combinar' },
    { id: 's2', tipo: 'servico', nome: 'Lucas Dev', slug: 'lucasdev', cat: 'Tecnologia', estado: 'SP', cidade: 'Araraquara', rating: 4.7, reviews: 61, views7d: 770, createdAt: daysAgo(1), preco: null, faixa: 'A partir de R$ 500' },
    { id: 's3', tipo: 'servico', nome: 'Clínica BemViver', slug: 'bemviver', cat: 'Saúde & Bem-estar', estado: 'CE', cidade: 'Fortaleza', rating: 4.8, reviews: 88, views7d: 830, createdAt: daysAgo(25), preco: null, faixa: 'Consulta R$ 120' },
    { id: 's4', tipo: 'servico', nome: 'Mecânica Rápida', slug: 'mec-rapida', cat: 'Automotivo', estado: 'SP', cidade: 'Campinas', rating: 4.6, reviews: 48, views7d: 690, createdAt: daysAgo(11), preco: null, faixa: 'Troca óleo R$ 90' },
    { id: 's5', tipo: 'servico', nome: 'Profa. Marina', slug: 'profa-marina', cat: 'Educação', estado: 'RJ', cidade: 'Rio de Janeiro', rating: 4.9, reviews: 77, views7d: 720, createdAt: daysAgo(3), preco: null, faixa: 'A partir de R$ 70' },
    { id: 's6', tipo: 'servico', nome: 'Studio Glam', slug: 'studioglam', cat: 'Beleza & Estética', estado: 'PR', cidade: 'Curitiba', rating: 4.7, reviews: 64, views7d: 760, createdAt: daysAgo(16), preco: null, faixa: 'Pacotes de R$ 150' },
];
const DATA = [...lojas, ...prestadores];

/* ----- State & URL ----- */
const state = {
    q: qp('q') || '',
    tipo: qp('tipo') || 'all',
    uf: qp('uf') || 'all',
    cidade: qp('cidade') || 'all',
    sort: qp('sort') || 'views',  // views | rating | recent
    view: qp('view') || 'grid',   // grid | list
    page: 1,
    pageSize: 12,
    minRating: Number(qp('minRating') || 0),
    myUF: null
};

/* ----- Elements ----- */
const qInput = $('#q');
const tipoSel = $('#tipo');
const ufSel = $('#estado');
const citySel = $('#cidade');
const infoEl = $('#resultInfo');
const gridEl = $('#resultGrid');
const btnBuscar = $('#btnBuscar');
const btnMais = $('#btnMais');
const btnGeo = $('#btnGeo');
const onlyUFCh = $('#onlyUF');
const geoUFLabel = $('#geoUFLabel');
const sortSel = $('#sort');
const minRating = $('#minRating');
const minRatingVal = $('#minRatingVal');
const openFilters = $('#openFilters');
const closeFilters = $('#closeFilters');
const filtersPanel = $('#filters');
const estadoSide = $('#estadoSide');
const cidadeSide = $('#cidadeSide');
const applyFilters = $('#applyFilters');
const clearFilters = $('#clearFilters');

/* ----- Init UI ----- */
hydrateUFs();
hydrateCities();
hydrateChips();
hydrateCategories();
restoreInputsFromState();
hydrateSegments();
hydrateViewButtons();
renderAll();

/* Listeners */
btnBuscar.addEventListener('click', onSearch);
qInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); onSearch(); } });
tipoSel.addEventListener('change', () => { state.tipo = tipoSel.value; commit(); renderAll(true); });
ufSel.addEventListener('change', () => { state.uf = ufSel.value; hydrateCities(); commit(); renderAll(true); });
citySel.addEventListener('change', () => { state.cidade = citySel.value; commit(); renderAll(true); });
sortSel.addEventListener('change', () => { state.sort = sortSel.value; commit(); renderAll(true); });

minRating.value = state.minRating;
minRatingVal.textContent = state.minRating.toFixed(1);
minRating.addEventListener('input', () => { minRatingVal.textContent = Number(minRating.value).toFixed(1); });
minRating.addEventListener('change', () => { state.minRating = Number(minRating.value); commit(); renderAll(true); });

btnMais.addEventListener('click', () => { state.page++; renderResults(false); });

btnGeo.addEventListener('click', detectLocation);
onlyUFCh.addEventListener('change', () => renderAll(true));

openFilters.addEventListener('click', () => filtersPanel.classList.add('open'));
closeFilters.addEventListener('click', () => filtersPanel.classList.remove('open'));
applyFilters.addEventListener('click', () => {
    state.uf = estadoSide.value; state.cidade = cidadeSide.value;
    ufSel.value = state.uf; hydrateCities(); citySel.value = state.cidade;
    filtersPanel.classList.remove('open'); commit(); renderAll(true);
});
clearFilters.addEventListener('click', () => {
    state.q = ''; state.tipo = 'all'; state.uf = 'all'; state.cidade = 'all'; state.minRating = 0;
    qInput.value = ''; tipoSel.value = 'all'; ufSel.value = 'all'; hydrateCities(); citySel.value = 'all';
    estadoSide.value = 'all'; cidadeSide.value = 'all'; minRating.value = 0; minRatingVal.textContent = '0.0';
    $$('#chipsFiltro .chip').forEach(c => c.dataset.active = 'false');
    commit(); renderAll(true);
});

/* ================== UI builders ================== */
function hydrateUFs() {
    ufSel.innerHTML = `<option value="all">Todos os estados</option>`;
    estadoSide.innerHTML = `<option value="all">Todos os estados</option>`;
    ESTADOS.forEach(e => {
        const opt1 = new Option(`${e.uf} — ${e.nome}`, e.uf);
        const opt2 = new Option(`${e.uf} — ${e.nome}`, e.uf);
        ufSel.add(opt1); estadoSide.add(opt2);
    });
}
function hydrateCities() {
    const cities = unique(DATA.filter(x => state.uf === 'all' ? true : x.estado === state.uf).map(x => x.cidade)).sort();
    citySel.innerHTML = `<option value="all">Todas as cidades</option>`;
    cidadeSide.innerHTML = `<option value="all">Todas as cidades</option>`;
    cities.forEach(c => {
        citySel.add(new Option(c, c));
        cidadeSide.add(new Option(c, c));
    });
}
function hydrateChips() {
    const elSug = $('#chipsSugestoes');
    elSug.innerHTML = '';
    ['Moda', 'Eletrônicos', 'Beleza & Estética', 'Tecnologia', 'Automotivo', 'Educação'].forEach(tag => {
        const b = document.createElement('button');
        b.className = 'chip'; b.textContent = `#${tag}`;
        b.addEventListener('click', () => { qInput.value = tag; state.q = tag; commit(); renderAll(true); });
        elSug.appendChild(b);
    });

    const elFilt = $('#chipsFiltro');
    elFilt.innerHTML = '';
    [...CATS_PROD, ...CATS_SERV].forEach(tag => {
        const b = document.createElement('button');
        b.className = 'chip'; b.textContent = tag;
        b.addEventListener('click', () => {
            qInput.value = tag; state.q = tag; commit(); renderAll(true);
            $$('#chipsFiltro .chip').forEach(c => c.dataset.active = 'false'); b.dataset.active = 'true';
        });
        elFilt.appendChild(b);
    });
}
function hydrateCategories() {
    const cats = $('#cats');
    cats.innerHTML = '';
    [...CATS_PROD, ...CATS_SERV].forEach(c => {
        const card = document.createElement('div');
        card.className = 'cat';
        card.innerHTML = `<span class="ic">${ICON(c)}</span><div><b>${c}</b></div>`;
        card.addEventListener('click', () => {
            qInput.value = c; state.q = c; commit(); scrollToResults(); renderAll(true);
        });
        cats.appendChild(card);
    });
}
function hydrateSegments() {
    $$('#segTipo .seg__btn').forEach(btn => {
        const t = btn.dataset.tipo;
        btn.setAttribute('aria-pressed', t === state.tipo ? 'true' : 'false');
        btn.addEventListener('click', () => {
            $$('#segTipo .seg__btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
            btn.setAttribute('aria-pressed', 'true');
            state.tipo = t; tipoSel.value = t; commit(); renderAll(true);
        });
    });
}
function hydrateViewButtons() {
    $$('#viewSeg .seg__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('#viewSeg .seg__btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
            btn.setAttribute('aria-pressed', 'true');
            state.view = btn.dataset.view; commit();
            gridEl.classList.toggle('list', state.view === 'list');
        });
        if (btn.dataset.view === state.view) btn.setAttribute('aria-pressed', 'true');
    });
    gridEl.classList.toggle('list', state.view === 'list');
}
function restoreInputsFromState() {
    qInput.value = state.q;
    tipoSel.value = state.tipo;
    ufSel.value = state.uf;
    hydrateCities();
    citySel.value = state.cidade;
    sortSel.value = state.sort;
}

/* ================== Geolocation ================== */
async function detectLocation() {
    try {
        btnGeo.disabled = true; const old = btnGeo.textContent; btnGeo.textContent = 'Detectando…';
        const pos = await new Promise((res, rej) => {
            if (!navigator.geolocation) return rej(new Error('Indisponível'));
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 12000 });
        });
        const { latitude: lat, longitude: lon } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
        const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const j = await r.json();
        const addr = j.address || {};
        const uf = toUF(addr.state_code || addr.state || '');
        if (uf) { state.myUF = uf; geoUFLabel.textContent = `(${uf})`; if (state.uf === 'all') { state.uf = uf; ufSel.value = uf; hydrateCities(); } onlyUFCh.checked = true; }
        renderAll(true);
        btnGeo.textContent = old; btnGeo.disabled = false;
    } catch (e) {
        alert('Não foi possível detectar sua localização.');
        btnGeo.disabled = false;
    }
}
function toUF(v) {
    const s = String(v).toUpperCase();
    if (s.length === 2) return s;
    const f = ESTADOS.find(e => e.nome.toUpperCase() === s);
    return f ? f.uf : null;
}

/* ================== Render ================== */
function renderAll(reset = false) {
    if (reset) state.page = 1;
    renderPromos();
    renderResults(true);
}
function renderPromos() {
    // Destaques por score (views + rating)
    const top = [...DATA].sort((a, b) => score(b) - score(a)).slice(0, 3);
    $('#destaques').innerHTML = top.map(x => itemCard(x, true)).join('');
}
function renderResults(reset = false) {
    const arr = sortData(filterData());
    const total = arr.length;
    infoEl.textContent = total ? `${total} resultado(s)` : 'Nenhum resultado para esse filtro';
    const end = state.page * state.pageSize;
    const slice = arr.slice(0, end);
    gridEl.innerHTML = slice.map(x => itemCard(x)).join('');
    btnMais.style.display = end < total ? 'inline-flex' : 'none';
}

/* ================== Search / Filter ================== */
function onSearch() {
    state.q = qInput.value.trim();
    commit(); scrollToResults(); renderAll(true);
}
function filterData() {
    const term = norm(state.q);
    return DATA.filter(x => {
        if (state.tipo !== 'all' && x.tipo !== (state.tipo === 'produtos' ? 'produto' : 'servico')) return false;
        if (state.uf !== 'all' && x.estado !== state.uf) return false;
        if (onlyUFCh.checked && state.myUF && x.estado !== state.myUF) return false;
        if (state.cidade !== 'all' && x.cidade !== state.cidade) return false;
        if (state.minRating > 0 && x.rating < state.minRating) return false;
        if (term) {
            const hay = norm(`${x.nome} ${x.cat} ${x.estado} ${x.cidade}`);
            if (!hay.includes(term)) return false;
        }
        return true;
    });
}
function sortData(arr) {
    if (state.sort === 'views') return arr.sort((a, b) => b.views7d - a.views7d);
    if (state.sort === 'rating') return arr.sort((a, b) => (b.rating - a.rating) || (b.reviews - a.reviews));
    if (state.sort === 'recent') return arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
}

/* ================== Templates ================== */
function itemCard(x, destaque = false) {
    const price = x.preco != null ? `<span class="price">${cf.format(x.preco)}</span>` : `<span class="meta">${x.faixa || ''}</span>`;
    return `
    <article class="item">
      <a class="thumb" href="${link(x.slug)}" aria-label="Abrir ${x.nome}">
        ${x.tipo === 'produto' ? '🛍️' : '🧑‍💼'}
      </a>
      <div class="body">
        <a class="title" href="${link(x.slug)}">${x.nome}</a>
        <div class="row">
          <span class="badge">${x.cat}</span>
          ${destaque ? '<span class="badge">Destaque</span>' : ''}
          ${stars(x.rating)} <span class="meta">(${x.reviews})</span>
        </div>
        <div class="row meta">
          <span>${x.cidade}/${x.estado}</span>
          <span>•</span>
          <span>${nf.format(x.views7d)} acessos/7d</span>
        </div>
        <div class="row">${price}</div>
        <div class="cta">
          <a class="btn" href="${link(x.slug)}">Ver página</a>
          <a class="btn btn--ghost" href="https://wa.me/55" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    </article>`;
}
function stars(r) {
    const full = Math.floor(r), half = (r - full >= .5);
    let out = '';
    for (let i = 0; i < 5; i++) {
        if (i < full) out += star('#ffa726');
        else if (i === full && half) out += star('#ffd29a');
        else out += star('#e3edf5');
    }
    return `<span class="row" aria-label="${r.toFixed(1)} de 5 estrelas">${out}</span>`;
}
function star(fill) { return `<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="${fill}" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>` }
function link(slug) { return `/u/${slug}` } // ajuste para sua rota real

/* ================== Utils ================== */
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d }
function unique(a) { return [...new Set(a)] }
function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') }
function qp(k) { return new URLSearchParams(location.search).get(k) }
function commit() {
    const p = new URLSearchParams({
        q: state.q || '',
        tipo: state.tipo, uf: state.uf, cidade: state.cidade,
        sort: state.sort, view: state.view, minRating: state.minRating
    });
    history.replaceState(null, '', `?${p.toString()}`);
}
function score(x) { return x.views7d * 0.6 + x.rating * 80 + (x.reviews || 0) }

/* Smooth scroll to results */
function scrollToResults() {
    const el = $('#resultados'); if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY - 10;
    window.scrollTo({ top, behavior: 'smooth' });
}
