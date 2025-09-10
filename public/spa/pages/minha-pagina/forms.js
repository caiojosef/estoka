// /public/spa/pages/minha-pagina/forms.js
export function init(ctx) {
    const routeKey = ctx?.route?.key || location.hash || '';
    const isLoja = routeKey.includes('/form-loja');
    const tipo = isLoja ? 'loja' : 'prestador';
    const endpoint = `/api/${tipo}`;
    const el = ctx.el;

    const token =
        localStorage.getItem('estoka_token') ||
        sessionStorage.getItem('estoka_token');

    if (!token) { location.href = '/public/login.html?from=app'; return; }

    const F = (window.SPA?.fetch) || fetch;

    // ===== Helpers HTTP e UI =====
    async function debugGet(path) {
        const res = await F(path, {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
            cache: 'no-store'
        });
        const raw = await res.clone().text();
        let json = null; try { json = JSON.parse(raw); } catch { }
        console.group(`[forms] GET ${path}`); console.log('status:', res.status, 'json:', json); console.groupEnd();
        if (!res.ok) throw new Error(json?.message || json?.error || raw || `GET ${path} falhou (${res.status})`);
        return json;
    }

    async function postJSON(url, data) {
        const res = await F(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data || {})
        });
        const raw = await res.text();
        let json = null; try { json = JSON.parse(raw); } catch { }
        console.group(`[forms] POST ${url}`); console.log('payload:', data); console.log('resp:', json || raw); console.groupEnd();
        if (!res.ok) throw new Error(json?.message || json?.error || 'Erro ao salvar');
        return json;
    }

    function showMsg(span, type, text) {
        if (!span) return;
        span.hidden = false;
        span.className = 'form-msg ' + type; // ok | error
        span.textContent = text;
        setTimeout(() => { span.hidden = true; }, 2600);
    }

    // ===== Utils DOM (sem optional chaining em LHS) =====
    const q = (s) => el.querySelector(s);
    const setVal = (sel, val) => { const n = q(sel); if (n) n.value = val ?? ''; };
    const setChk = (sel, on) => { const n = q(sel); if (n) n.checked = !!on; };

    // ===== Prestador: snapshot/fill/watch =====
    function snapshotPrestador() {
        return {
            nome_publico: (q('#pr_nome')?.value || '').trim(),
            bio: (q('#pr_bio')?.value || '').trim(),
            especialidades: (q('#pr_esp')?.value || '').trim(),
            preco_medio: (q('#pr_preco')?.value || '').trim(),
            atendimento_online: !!q('#pr_online')?.checked,
            endereco_atendimento: (q('#pr_end')?.value || '').trim(),
            whatsapp_contato: (q('#pr_zap')?.value || '').trim(),
            link_agendamento: (q('#pr_link')?.value || '').trim(),
            imagem_perfil: (q('#pr_perfil')?.value || '').trim(),
            imagem_capa: (q('#pr_capa')?.value || '').trim(),
            cor_destaque: (q('#pr_cor')?.value || '').trim()
        };
    }

    function fillPrestador(data = {}) {
        setVal('#pr_nome', data.nome_publico);
        setVal('#pr_bio', data.bio);
        setVal('#pr_esp', data.especialidades);
        setVal('#pr_preco', data.preco_medio);
        setChk('#pr_online', data.atendimento_online);
        setVal('#pr_end', data.endereco_atendimento);
        setVal('#pr_zap', data.whatsapp_contato);
        setVal('#pr_link', data.link_agendamento);
        setVal('#pr_perfil', data.imagem_perfil);
        setVal('#pr_capa', data.imagem_capa);
        setVal('#pr_cor', data.cor_destaque);
    }

    function bindDirtyWatcherPrestador() {
        const form = q('#formPrestador');
        if (!form) return;
        const btn = q('#btnPrestSave') || form.querySelector('button[type="submit"]');
        const span = q('#pr_msg');

        let base = JSON.stringify(snapshotPrestador());

        const updateDirty = () => {
            const now = JSON.stringify(snapshotPrestador());
            const dirty = now !== base;
            if (btn) btn.disabled = !dirty;
        };

        form.querySelectorAll('input, textarea, select').forEach(ctrl => {
            ctrl.addEventListener('input', updateDirty);
            ctrl.addEventListener('change', updateDirty);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = snapshotPrestador();
            try {
                if (btn) btn.disabled = true;
                await postJSON('/api/prestador', payload);
                showMsg(span, 'ok', 'Dados salvos!');
                base = JSON.stringify(snapshotPrestador());
                updateDirty();
            } catch (err) {
                const m = String(err?.message || err);
                showMsg(span, 'error', m);
                if (btn) btn.disabled = false;
                if (m.toLowerCase().includes('unauthorized')) {
                    location.href = '/public/login.html?from=app';
                }
            }
        });

        updateDirty();
    }

    // ===== Fluxo principal =====
    (async () => {
        try {
            const out = await debugGet(endpoint);
            const data = out?.data ?? out ?? {};
            console.log(`[forms] ${tipo} extraído =>`, data);

            if (!isLoja) {
                fillPrestador(data);
                bindDirtyWatcherPrestador();
                if (!data || Object.keys(data).length === 0) {
                    console.info('[forms] prestador: sem dados (primeiro acesso).');
                }
            } else {
                console.info('[forms] rota atual é form-loja — form HTML ainda não implementado neste arquivo.');
            }
        } catch (e) {
            console.error(`[forms] erro ao buscar ${tipo}:`, e?.message || e);
            if (!isLoja) {
                fillPrestador({});
                bindDirtyWatcherPrestador();
            }
        }
    })();

    return () => { };
}

export function destroy() { /* noop */ }
