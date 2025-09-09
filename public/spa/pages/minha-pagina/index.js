// /public/spa/pages/minha-pagina/index.js
export function init(ctx) {
    const ROUTE_BASE = '#/minha-pagina';
    const hash = (location.hash || '').toLowerCase();
    const isChooser = !hash.includes('/form-');        // #/minha-pagina
    const isLoja = hash.includes('/form-loja');     // #/minha-pagina/form-loja
    const isPrestador = hash.includes('/form-prestador');// #/minha-pagina/form-prestador

    const token =
        localStorage.getItem('estoka_token') ||
        sessionStorage.getItem('estoka_token');

    if (!token) {
        location.href = '/public/login.html?from=app';
        return;
    }

    // ===== helpers =====
    const F = (window.SPA?.fetch) || fetch; // usa loader global se existir

    function isMobile() {
        return matchMedia('(max-width: 640px)').matches ||
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    // Confirmação: no mobile usa alert(); no desktop mostra modal central personalizado
    function confirmSmart(message) {
        if (isMobile()) {
            alert(message);        // apenas informa e segue
            return Promise.resolve(true);
        }
        // Modal central
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText =
                'position:fixed;inset:0;z-index:200;display:grid;place-items:center;' +
                'background:rgba(15,23,42,.45)';
            const box = document.createElement('div');
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            box.style.cssText =
                'width:min(92vw,440px);background:var(--bg-elev,#fff);color:var(--text,#0f172a);' +
                'border-radius:14px;border:1px solid var(--border,#e6ebf3);' +
                'box-shadow:0 20px 60px rgba(2,6,23,.2);padding:16px';

            box.innerHTML = `
  <h3 style="margin:0 0 8px;font:600 16px/1.3 Inter,system-ui">Confirmar</h3>
  <p style="margin:0 0 14px;color:var(--text-2,#475569)">${message}</p>
  <div style="display:flex;gap:8px;justify-content:flex-end">
    <button data-act="cancel"
      style="cursor:pointer;padding:8px 12px;border-radius:10px;border:1px solid var(--border,#e6ebf3);background:#fff">
      Cancelar
    </button>
    <button data-act="ok"
      style="cursor:pointer;padding:8px 12px;border-radius:10px;border:1px solid color-mix(in oklab,var(--brand,#2563eb) 35%, #e6ebf3);background:linear-gradient(180deg,color-mix(in oklab,var(--brand,#2563eb) 12%,#fff 88%),#fff);color:color-mix(in oklab,var(--brand,#2563eb) 60%,#000)">
      Salvar
    </button>
  </div>
`;

            overlay.appendChild(box);
            document.body.appendChild(overlay);

            const cleanup = () => overlay.remove();
            box.querySelector('[data-act="cancel"]').addEventListener('click', () => { cleanup(); resolve(false); }, { once: true });
            box.querySelector('[data-act="ok"]').addEventListener('click', () => { cleanup(); resolve(true); }, { once: true });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); resolve(false); } });
            const onEsc = (e) => { if (e.key === 'Escape') { cleanup(); resolve(false); document.removeEventListener('keydown', onEsc); } };
            document.addEventListener('keydown', onEsc);
        });
    }

    async function debugGet(path) {
        const res = await F(path, {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
            cache: 'no-store'
        });
        const ct = res.headers.get('content-type') || '';
        const raw = await res.clone().text();

        console.group(`[minha-pagina] GET ${path}`);
        console.log('ok:', res.ok, 'status:', res.status, 'content-type:', ct);
        console.log('raw preview:', raw.slice(0, 300));
        let json = null; try { json = JSON.parse(raw); } catch { }
        console.log('parsed JSON:', json);
        console.groupEnd();

        if (!res.ok) throw new Error((json && (json.message || json.error)) || raw || `GET ${path} falhou (${res.status})`);
        return json;
    }

    async function postJSON(url, data) {
        const res = await F(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify(data || {})
        });
        const raw = await res.text();
        let json = null; try { json = JSON.parse(raw); } catch { }
        console.group(`[minha-pagina] POST ${url}`);
        console.log('payload:', data);
        console.log('parsed JSON:', json);
        console.groupEnd();
        if (!res.ok) throw new Error(json?.message || json?.error || 'Erro');
        return json;
    }

    // --- ciclo de vida / limpeza ---
    const cleanups = [];
    const on = (el, ev, fn) => { el?.addEventListener(ev, fn); cleanups.push(() => el?.removeEventListener(ev, fn)); };

    (async () => {
        try {
            if (isChooser) {
                // 1) Se já existe page_type, redireciona
                try {
                    const out = await debugGet('/api/page-type');
                    const pageType = out?.page_type ?? out?.data?.page_type ?? null;
                    console.log('page_type extraído =>', pageType);
                    if (pageType === 'loja') { ctx.navigate(`${ROUTE_BASE}/form-loja`); return; }
                    if (pageType === 'prestador') { ctx.navigate(`${ROUTE_BASE}/form-prestador`); return; }
                } catch (e) {
                    console.warn('[minha-pagina] falha ao checar page-type — mantendo chooser:', e?.message || e);
                }

                // 2) Monta seleção + salvar (page_type == null)
                const root = ctx.el;
                const choices = root.querySelectorAll('.choice');
                const btnSalvar = root.querySelector('#btnSalvar');
                let selected = null;

                const setSelected = (type) => {
                    selected = type;
                    choices.forEach(btn => {
                        const onSel = btn.dataset.type === type;
                        btn.classList.toggle('selected', onSel);
                        btn.setAttribute('aria-pressed', onSel ? 'true' : 'false');
                    });
                    if (btnSalvar) btnSalvar.disabled = !selected;
                };

                choices.forEach(btn => on(btn, 'click', () => setSelected(btn.dataset.type)));

                if (btnSalvar) {
                    on(btnSalvar, 'click', async () => {
                        if (!selected) return;
                        const ok = await confirmSmart('Deseja mesmo salvar? Não há como trocar depois.');
                        if (!ok) return;
                        try {
                            await postJSON('/api/page-type/set', { page_type: selected });
                            ctx.navigate(selected === 'loja' ? `${ROUTE_BASE}/form-loja`
                                : `${ROUTE_BASE}/form-prestador`);
                        } catch (e) {
                            console.error('[minha-pagina] erro ao salvar:', e?.message || e);
                        }
                    });
                }

            } else if (isLoja) {
                const out = await debugGet('/api/loja');
                console.log('loja extraído =>', out?.data ?? out);

            } else if (isPrestador) {
                const out = await debugGet('/api/prestador');
                console.log('prestador extraído =>', out?.data ?? out);

            } else {
                console.warn('subrota desconhecida — redirecionando…');
                ctx.navigate(ROUTE_BASE);
            }
        } catch (e) {
            console.error('[minha-pagina] erro:', e?.message || e);
        }
    })();

    return () => cleanups.forEach(fn => fn());
}

export function destroy() { /* noop */ }
