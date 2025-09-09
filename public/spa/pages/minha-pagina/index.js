// /public/spa/pages/minha-pagina/index.js
export function init(ctx) {
    const { el } = ctx;

    // Ajuste se seu router usar outro prefixo de hash
    const ROUTE_BASE = '#/minha-pagina';

    // Descobre modo pela hash
    const hash = (location.hash || '').toLowerCase();
    const isChooser = !hash.includes('/form-');
    const isLoja = hash.includes('/form-loja');
    const isPrestador = hash.includes('/form-prestador');

    // Token obrigatório
    const token =
        localStorage.getItem('estoka_token') ||
        sessionStorage.getItem('estoka_token');
    if (!token) {
        location.href = '/public/login.html?from=app';
        return;
    }

    // Helpers API
    const api = {
        async get(path) {
            const r = await fetch(path, {
                headers: { Accept: 'application/json', Authorization: 'Bearer ' + token }
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j.message || 'Erro');
            return j;
        },
        async post(path, data) {
            const r = await fetch(path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify(data || {})
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j.message || 'Erro');
            return j;
        }
    };

    // Mensagens rápidas
    function showMsg(span, type, text) {
        if (!span) return;
        span.hidden = false;
        span.className = `form-msg ${type}`;
        span.textContent = text;
        setTimeout(() => { span.hidden = true; }, 2600);
    }

    // Guardião de rota: garante que a rota bate com o tipo salvo no banco
    async function guardByType() {
        const { page_type } = await api.get('/api/page-type'); // null | 'loja' | 'prestador'

        // Sem tipo: sempre vai para a tela de escolha
        if (page_type == null && !isChooser) {
            location.hash = ROUTE_BASE;
            return { redirected: true };
        }

        // Com tipo definido: força ir ao form correspondente
        if (page_type === 'loja' && !isLoja) {
            location.hash = `${ROUTE_BASE}/form-loja`;
            return { redirected: true };
        }
        if (page_type === 'prestador' && !isPrestador) {
            location.hash = `${ROUTE_BASE}/form-prestador`;
            return { redirected: true };
        }

        return { redirected: false, page_type };
    }

    // Executa o guard antes de montar a UI
    (async () => {
        try {
            const g = await guardByType();
            if (g.redirected) return; // já redirecionou; SPA deve recarregar a página correspondente
            // Se não redirecionou, segue montando a tela atual
            mount();
        } catch (e) {
            console.warn(e);
            // Em caso de erro de rede, segue para chooser
            if (isChooser) mount();
        }
    })();

    function mount() {
        // =========================
        //       TELA DE ESCOLHA
        // =========================
        if (isChooser) {
            const chooser = el.querySelector('#typeChooser');
            const actions = el.querySelector('#chooseActions');
            const btnConfirm = el.querySelector('#btnConfirm');
            const btnCancel = el.querySelector('#btnCancel');
            const choices = chooser ? chooser.querySelectorAll('.choice') : [];

            let selected = null;

            choices.forEach(btn => {
                btn.addEventListener('click', () => {
                    selected = btn.dataset.type; // 'loja' | 'prestador'
                    choices.forEach(b => b.classList.toggle('selected', b === btn));
                    if (actions) actions.hidden = false;
                });
            });

            if (btnCancel) {
                btnCancel.addEventListener('click', () => {
                    selected = null;
                    choices.forEach(b => b.classList.remove('selected'));
                    if (actions) actions.hidden = true;
                });
            }

            if (btnConfirm) {
                btnConfirm.addEventListener('click', async () => {
                    if (!selected) return;
                    const label = selected === 'prestador' ? 'Prestador de Serviço' : 'Loja';
                    const ok = confirm(`Tem certeza que gostaria de selecionar sua página como ${label}? Essa ação não pode ser revertida.`);
                    if (!ok) return;

                    try {
                        await api.post('/api/page-type/set', { page_type: selected });
                        location.hash = selected === 'loja'
                            ? `${ROUTE_BASE}/form-loja`
                            : `${ROUTE_BASE}/form-prestador`;
                    } catch (e) {
                        alert(e.message || 'Falha ao salvar. Tente novamente.');
                    }
                });
            }

            return; // não monta os forms neste modo
        }

        // =========================
        //       FORMULÁRIO LOJA
        // =========================
        if (isLoja) {
            const form = el.querySelector('#formLoja');
            const msg = el.querySelector('#lj_msg');

            if (form) {
                // Carregar dados existentes
                (async () => {
                    try {
                        const out = await api.get('/api/loja');
                        const d = out.data || {};
                        el.querySelector('#lj_nome').value = d.nome_fantasia || '';
                        el.querySelector('#lj_desc').value = d.descricao || '';
                        el.querySelector('#lj_cat').value = d.categoria || '';
                        el.querySelector('#lj_link').value = d.link_externo || '';
                        el.querySelector('#lj_zap').value = d.whatsapp_contato || '';
                        el.querySelector('#lj_cnpj').value = d.cnpj || '';
                        el.querySelector('#lj_capa').value = d.imagem_capa || '';
                        el.querySelector('#lj_logo').value = d.imagem_logo || '';
                        el.querySelector('#lj_cor').value = d.cor_destaque || '';
                    } catch (_) { }
                })();

                // Salvar
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const payload = {
                        nome_fantasia: el.querySelector('#lj_nome').value.trim(),
                        descricao: el.querySelector('#lj_desc').value.trim(),
                        categoria: el.querySelector('#lj_cat').value.trim(),
                        link_externo: el.querySelector('#lj_link').value.trim(),
                        whatsapp_contato: el.querySelector('#lj_zap').value.trim(),
                        cnpj: el.querySelector('#lj_cnpj').value.trim(),
                        imagem_capa: el.querySelector('#lj_capa').value.trim(),
                        imagem_logo: el.querySelector('#lj_logo').value.trim(),
                        cor_destaque: el.querySelector('#lj_cor').value.trim()
                    };
                    try {
                        await api.post('/api/loja', payload);
                        showMsg(msg, 'ok', 'Dados salvos!');
                    } catch (err) {
                        showMsg(msg, 'error', err.message || 'Erro ao salvar.');
                    }
                });
            }
        }

        // =========================
        //    FORMULÁRIO PRESTADOR
        // =========================
        if (isPrestador) {
            const form = el.querySelector('#formPrestador');
            const msg = el.querySelector('#pr_msg');

            if (form) {
                // Carregar dados existentes
                (async () => {
                    try {
                        const out = await api.get('/api/prestador');
                        const d = out.data || {};
                        el.querySelector('#pr_nome').value = d.nome_publico || '';
                        el.querySelector('#pr_bio').value = d.bio || '';
                        el.querySelector('#pr_esp').value = d.especialidades || '';
                        el.querySelector('#pr_preco').value = d.preco_medio || '';
                        el.querySelector('#pr_online').checked = !!d.atendimento_online;
                        el.querySelector('#pr_end').value = d.endereco_atendimento || '';
                        el.querySelector('#pr_zap').value = d.whatsapp_contato || '';
                        el.querySelector('#pr_link').value = d.link_agendamento || '';
                        el.querySelector('#pr_perfil').value = d.imagem_perfil || '';
                        el.querySelector('#pr_capa').value = d.imagem_capa || '';
                        el.querySelector('#pr_cor').value = d.cor_destaque || '';
                    } catch (_) { }
                })();

                // Salvar
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const payload = {
                        nome_publico: el.querySelector('#pr_nome').value.trim(),
                        bio: el.querySelector('#pr_bio').value.trim(),
                        especialidades: el.querySelector('#pr_esp').value.trim(),
                        preco_medio: el.querySelector('#pr_preco').value.trim(),
                        atendimento_online: el.querySelector('#pr_online').checked,
                        endereco_atendimento: el.querySelector('#pr_end').value.trim(),
                        whatsapp_contato: el.querySelector('#pr_zap').value.trim(),
                        link_agendamento: el.querySelector('#pr_link').value.trim(),
                        imagem_perfil: el.querySelector('#pr_perfil').value.trim(),
                        imagem_capa: el.querySelector('#pr_capa').value.trim(),
                        cor_destaque: el.querySelector('#pr_cor').value.trim()
                    };
                    try {
                        await api.post('/api/prestador', payload);
                        showMsg(msg, 'ok', 'Dados salvos!');
                    } catch (err) {
                        showMsg(msg, 'error', err.message || 'Erro ao salvar.');
                    }
                });
            }
        }
    }
}

export function destroy() { /* noop */ }
