// /public/spa/pages/minha-pagina/forms.js
// Objetivo: fazer GET nos endpoints e imprimir/preencher os dados nos forms.
// - Loja:      GET /api/loja
// - Prestador: GET /api/prestador
// Regras:
// 1) Usa o token 'estoka_token' do localStorage/sessionStorage
// 2) Usa window.SPA.fetch se existir (pra mostrar seu loader global)
// 3) Preenche inputs por atributo name=, e elementos de visualização por [data-bind] ou [data-src]
// 4) Não altera IDs. É "básico pra funcionar". Depois refinamos UX/mensagens.

function getToken() {
    return localStorage.getItem('estoka_token') || sessionStorage.getItem('estoka_token');
}

function authFetch(url, opts = {}) {
    const F = (window.SPA && window.SPA.fetch) ? window.SPA.fetch : fetch;
    const token = getToken();
    if (!token) {
        location.href = '/public/login.html?from=app';
        return Promise.reject(new Error('Sem token'));
    }
    const headers = Object.assign(
        { Accept: 'application/json', Authorization: 'Bearer ' + token },
        opts.headers || {}
    );
    return F(url, Object.assign({}, opts, { headers, cache: 'no-store' }));
}

async function getJSON(url) {
    const res = await authFetch(url);
    const raw = await res.text();
    let json = null;
    try { json = JSON.parse(raw); } catch (e) { }
    if (!res.ok) {
        const msg = json?.message || json?.error || `Erro ${res.status}`;
        throw new Error(msg);
    }
    // Compat: alguns controllers retornam { ok, data: {exists, data} } ou { ok, data }
    const payload = json?.data ?? json;
    const exists = (typeof payload?.exists !== 'undefined')
        ? !!payload.exists
        : !!payload?.data;

    const record = (payload && typeof payload === 'object' && 'data' in payload)
        ? payload.data
        : payload;

    return { exists, record: record || null, raw: json };
}

// Preenche inputs/selects/textarea por name, e elementos com data-bind / data-src
function fillForm(root, record) {
    if (!record) return;

    // Inputs, selects e textareas
    Object.entries(record).forEach(([key, val]) => {
        const els = root.querySelectorAll(`[name="${key}"]`);
        els.forEach(el => {
            if (el.type === 'checkbox') {
                el.checked = !!Number(val || 0) || val === true;
            } else if (el.type === 'radio') {
                if (String(el.value) === String(val)) el.checked = true;
            } else {
                el.value = (val ?? '');
            }
        });
    });

    // Texto "readonly" visual
    Object.entries(record).forEach(([key, val]) => {
        const bindEls = root.querySelectorAll(`[data-bind="${key}"]`);
        bindEls.forEach(el => { el.textContent = (val ?? ''); });
    });

    // Imagens
    Object.entries(record).forEach(([key, val]) => {
        const imgEls = root.querySelectorAll(`[data-src="${key}"]`);
        imgEls.forEach(el => { if (val) el.setAttribute('src', val); });
    });
}

// Mostra erro simples na página (ou alert fallback)
function showError(root, message) {
    const box = root.querySelector('.form-alert, [data-alert]');
    if (box) {
        box.textContent = message;
        box.style.display = 'block';
    } else {
        alert(message);
    }
}

// Mostra um estado vazio, se existir (ex.: <div data-empty>…</div>)
function toggleEmptyState(root, on) {
    const empty = root.querySelector('[data-empty]');
    if (empty) empty.style.display = on ? 'block' : 'none';
}

// --------- INITS ---------

export async function initLoja(ctx) {
    const root = ctx?.el || document;
    try {
        const { exists, record, raw } = await getJSON('/api/loja');
        console.group('[forms] GET /api/loja');
        console.log('exists:', exists);
        console.log('record:', record);
        console.log('raw:', raw);
        console.groupEnd();

        toggleEmptyState(root, !exists);
        fillForm(root, record);

        // Se quiser imprimir JSON em algum <pre data-bind="debug">
        const dbg = root.querySelector('pre[data-bind="debug"]');
        if (dbg) dbg.textContent = JSON.stringify(record || {}, null, 2);
    } catch (e) {
        console.error('[forms] loja erro:', e?.message || e);
        showError(root, e?.message || 'Falha ao carregar dados da loja.');
    }
}

export async function initPrestador(ctx) {
    const root = ctx?.el || document;
    try {
        const { exists, record, raw } = await getJSON('/api/prestador');
        console.group('[forms] GET /api/prestador');
        console.log('exists:', exists);
        console.log('record:', record);
        console.log('raw:', raw);
        console.groupEnd();

        toggleEmptyState(root, !exists);
        fillForm(root, record);

        const dbg = root.querySelector('pre[data-bind="debug"]');
        if (dbg) dbg.textContent = JSON.stringify(record || {}, null, 2);
    } catch (e) {
        console.error('[forms] prestador erro:', e?.message || e);
        showError(root, e?.message || 'Falha ao carregar dados do prestador.');
    }
}
