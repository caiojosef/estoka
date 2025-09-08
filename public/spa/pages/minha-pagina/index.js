// Minha Página — backend real: salva SOMENTE o tipo (produtos/servicos) no banco.
// O restante continua no localStorage (MVP), igual antes.

export function init(ctx) {
    const el = ctx.el;

    // ===== Passo de ESCOLHA & Form
    const stepChoice = el.querySelector('#mpStepChoice');
    const stepForm = el.querySelector('#mpStepForm') || el.querySelector('#mpForm');
    const btnChoiceProdutos = el.querySelector('#btnChoiceProdutos');
    const btnChoiceServicos = el.querySelector('#btnChoiceServicos');
    const choiceMsg = el.querySelector('#choiceMsg');

    // ===== Segmented control
    const segBtns = el.querySelectorAll('.seg__btn');

    // ===== Campos comuns
    const form = el.querySelector('#mpForm') || el.querySelector('#mpStepForm') || stepForm;
    const nameEl = el.querySelector('#mpName');
    const slugEl = el.querySelector('#mpSlug');
    const bioEl = el.querySelector('#mpBio');
    const bioCount = el.querySelector('#mpBioCount');
    const colorEl = el.querySelector('#mpColor');
    const avatarInput = el.querySelector('#mpAvatar');
    const avatarRemove = el.querySelector('#mpAvatarRemove');
    const avatarPreview = el.querySelector('#mpAvatarPreview');

    const whatsEl = el.querySelector('#mpWhats');
    const instaEl = el.querySelector('#mpInstagram');
    const siteEl = el.querySelector('#mpSite');
    const emailEl = el.querySelector('#mpEmail');
    const cityEl = el.querySelector('#mpCity');
    const catEl = el.querySelector('#mpCategory');
    const msgEl = el.querySelector('#mpMsg');

    // ===== Campos modo PRODUTOS
    const modeProdutos = el.querySelector('#modeProdutos');
    const storeNameEl = el.querySelector('#mpStoreName');
    const hoursEl = el.querySelector('#mpHours');
    const opChecks = Array.from(el.querySelectorAll('input[name="op"]'));
    const payChecks = Array.from(el.querySelectorAll('input[name="pay"]'));

    // ===== Campos modo SERVIÇOS
    const modeServicos = el.querySelector('#modeServicos');
    const profEl = el.querySelector('#mpProfession');
    const modRadios = Array.from(el.querySelectorAll('input[name="mod"]'));
    const priceEl = el.querySelector('#mpPrice');
    const agendaEl = el.querySelector('#mpAgenda');

    // ===== Prévia
    const prevName = el.querySelector('#prevName');
    const prevLink = el.querySelector('#prevLink');
    const prevBio = el.querySelector('#prevBio');
    const prevMeta = el.querySelector('#prevMeta');
    const prevLogo = el.querySelector('#prevAvatar');
    const prevWrap = el.querySelector('#mpPreview');

    const btnWhats = el.querySelector('#prevWhats');
    const btnInsta = el.querySelector('#prevInsta');
    const btnSite = el.querySelector('#prevSite');
    const btnEmail = el.querySelector('#prevEmail');

    // chip do topo
    const chipTextEl = document.getElementById('chipLinkText');

    // ===== Estado (MVP local para os demais campos)
    const state = {
        mode: null, // backend devolve

        name: localStorage.getItem('vl_name') || '',
        slug: localStorage.getItem('vl_slug') || 'seunome',
        bio: localStorage.getItem('vl_bio') || '',
        color: localStorage.getItem('vl_color') || '#179FDA',
        avatar: localStorage.getItem('vl_avatar') || '',

        whats: localStorage.getItem('vl_whats') || '',
        insta: localStorage.getItem('vl_insta') || '',
        site: localStorage.getItem('vl_site') || '',
        email: localStorage.getItem('vl_email') || '',
        city: localStorage.getItem('vl_city') || '',
        cat: localStorage.getItem('vl_cat') || '',

        // produtos
        store: localStorage.getItem('vl_store') || '',
        hours: localStorage.getItem('vl_hours') || '',
        ops: (localStorage.getItem('vl_ops') || '').split(',').filter(Boolean),
        pays: (localStorage.getItem('vl_pays') || '').split(',').filter(Boolean),

        // serviços
        prof: localStorage.getItem('vl_prof') || '',
        mod: localStorage.getItem('vl_mod') || '',
        price: localStorage.getItem('vl_price') || '',
        agenda: localStorage.getItem('vl_agenda') || ''
    };

    // ===== API real
    function getToken() {
        return localStorage.getItem('estoka_token') || sessionStorage.getItem('estoka_token') || '';
    }
    async function apiGetPage() {
        const res = await fetch('/api/minha-pagina', {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        if (res.status === 401) { location.href = '/public/login.html?from=app'; return null; }
        const out = await res.json().catch(() => ({}));
        return out;
    }
    async function apiSavePageType(type) {
        const res = await fetch('/api/minha-pagina/tipo', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify({ page_type: type })
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.ok) throw new Error(out.message || 'Falha ao salvar tipo');
        return out;
    }

    // ===== UI helpers
    function showChoice() { if (stepChoice) stepChoice.hidden = false; if (stepForm) stepForm.hidden = true; }
    function showForm() { if (stepChoice) stepChoice.hidden = true; if (stepForm) stepForm.hidden = false; }

    function fmtLink(slug) { return 'vitrinedoslinks.com.br/' + (slug || 'seunome'); }
    function listChecked(nodes) { return nodes.filter(n => n.checked).map(n => n.value); }
    function getRadio(nodes) { const r = nodes.find(n => n.checked); return r ? r.value : ''; }

    function setMode(mode, persistToAPI) {
        state.mode = (mode === 'servicos') ? 'servicos' : 'produtos';
        segBtns.forEach(b => {
            const on = b.dataset.mode === state.mode;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        if (modeProdutos) modeProdutos.hidden = (state.mode !== 'produtos');
        if (modeServicos) modeServicos.hidden = (state.mode !== 'servicos');

        if (persistToAPI === true) {
            apiSavePageType(state.mode).catch(() => {/* silencia */ });
        }
        updatePreview();
    }

    function updatePreview() {
        const name = (nameEl?.value?.trim() || 'Seu Nome');
        const slug = (slugEl?.value?.trim() || 'seunome');
        const bio = (bioEl?.value?.trim() || 'Sua descrição aparece aqui.');
        const city = (cityEl?.value?.trim() || '');
        const cat = (catEl?.value?.trim() || '');

        if (prevName) prevName.textContent = name;
        if (prevLink) prevLink.textContent = fmtLink(slug);
        if (prevBio) prevBio.textContent = bio;

        if (prevMeta) {
            if (state.mode === 'produtos') {
                const ops = listChecked(opChecks).join(' / ');
                const pays = listChecked(payChecks).join(', ');
                const parts = [cat || 'Loja', city].filter(Boolean);
                const extra = [ops, pays].filter(Boolean).join(' • ');
                if (extra) parts.push(extra);
                prevMeta.textContent = parts.join(' • ') || 'Loja • Cidade';
            } else {
                const prof = (profEl?.value?.trim() || 'Profissional');
                const mod = getRadio(modRadios);
                const parts = [[prof, mod].filter(Boolean).join(' • '), city].filter(Boolean);
                prevMeta.textContent = parts.join(' • ') || 'Profissional • Cidade';
            }
        }

        if (prevWrap) {
            const color = (colorEl?.value || '#179FDA');
            prevWrap.style.setProperty('--accent', color);
            prevWrap.setAttribute('data-accent', color);
        }

        if (chipTextEl && slugEl) {
            const s = slug.toLowerCase();
            chipTextEl.innerHTML = fmtLink(s).replace(s, '<b>' + s + '</b>');
        }

        // contatos
        const w = whatsEl?.value ? whatsEl.value.replace(/\D/g, '') : '';
        if (btnWhats) {
            if (w.length >= 10) { btnWhats.hidden = false; btnWhats.href = 'https://wa.me/55' + w; }
            else { btnWhats.hidden = true; btnWhats.removeAttribute('href'); }
        }
        const ig = instaEl?.value?.trim() || '';
        if (btnInsta) { btnInsta.hidden = !ig; if (ig) btnInsta.href = ig; else btnInsta.removeAttribute('href'); }
        const st = siteEl?.value?.trim() || '';
        if (btnSite) { btnSite.hidden = !st; if (st) btnSite.href = st; else btnSite.removeAttribute('href'); }
        const em = emailEl?.value?.trim() || '';
        if (btnEmail) { btnEmail.hidden = !em; if (em) btnEmail.href = 'mailto:' + em; else btnEmail.removeAttribute('href'); }

        if (bioCount && bioEl) bioCount.textContent = String(bioEl.value.length || 0);
    }

    // ===== Preenche com estado local
    if (nameEl) nameEl.value = state.name;
    if (slugEl) slugEl.value = state.slug;
    if (bioEl) bioEl.value = state.bio;
    if (colorEl) colorEl.value = state.color;
    if (bioCount && bioEl) bioCount.textContent = String(bioEl.value.length);

    if (whatsEl) whatsEl.value = state.whats;
    if (instaEl) instaEl.value = state.insta;
    if (siteEl) siteEl.value = state.site;
    if (emailEl) emailEl.value = state.email;
    if (cityEl) cityEl.value = state.city;
    if (catEl) catEl.value = state.cat;

    if (storeNameEl) storeNameEl.value = state.store;
    if (hoursEl) hoursEl.value = state.hours;
    opChecks.forEach(c => c.checked = state.ops.includes(c.value));
    payChecks.forEach(c => c.checked = state.pays.includes(c.value));

    if (profEl) profEl.value = state.prof;
    if (priceEl) priceEl.value = state.price;
    if (agendaEl) agendaEl.value = state.agenda;
    modRadios.forEach(r => r.checked = (r.value === state.mod));

    if (state.avatar && avatarPreview) {
        avatarPreview.src = state.avatar;
        if (prevLogo) prevLogo.innerHTML = `<img src="${state.avatar}" alt="">`;
    }

    // ===== Listeners
    segBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode, true)));

    const onBasic = () => updatePreview();
    nameEl?.addEventListener('input', onBasic);
    bioEl?.addEventListener('input', onBasic);
    colorEl?.addEventListener('input', updatePreview);

    [whatsEl, instaEl, siteEl, emailEl, cityEl, catEl].forEach(i => i?.addEventListener('input', updatePreview));
    [storeNameEl, hoursEl, priceEl, agendaEl].forEach(i => i?.addEventListener('input', updatePreview));
    opChecks.forEach(c => c.addEventListener('change', updatePreview));
    payChecks.forEach(c => c.addEventListener('change', updatePreview));
    modRadios.forEach(r => r.addEventListener('change', updatePreview));

    if (slugEl) {
        slugEl.addEventListener('input', (e) => {
            const v = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/--+/g, '-');
            if (v !== e.target.value) e.target.value = v;
            updatePreview();
        });
    }
    if (avatarInput) {
        avatarInput.addEventListener('change', () => {
            const f = avatarInput.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => {
                avatarPreview && (avatarPreview.src = r.result);
                prevLogo && (prevLogo.innerHTML = `<img src="${r.result}" alt="">`);
            };
            r.readAsDataURL(f);
        });
    }
    if (avatarRemove) {
        avatarRemove.addEventListener('click', () => {
            if (avatarInput) avatarInput.value = '';
            avatarPreview?.removeAttribute('src');
            if (prevLogo) prevLogo.textContent = 'VL';
        });
    }

    const clearBtn = el.querySelector('#mpClear');
    clearBtn?.addEventListener('click', () => {
        form?.reset();
        if (avatarInput) avatarInput.value = '';
        avatarPreview?.removeAttribute('src');
        if (prevLogo) prevLogo.textContent = 'VL';
        if (colorEl) colorEl.value = '#179FDA';
        opChecks.forEach(c => (c.checked = false));
        payChecks.forEach(c => (c.checked = false));
        modRadios.forEach(r => (r.checked = false));
        updatePreview(); flash('Formulário limpo.');
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        // MVP — manter local por enquanto
        localStorage.setItem('vl_name', nameEl?.value?.trim() || '');
        localStorage.setItem('vl_slug', slugEl?.value?.trim() || 'seunome');
        localStorage.setItem('vl_bio', bioEl?.value?.trim() || '');
        localStorage.setItem('vl_color', colorEl?.value || '#179FDA');
        localStorage.setItem('vl_whats', whatsEl?.value?.trim() || '');
        localStorage.setItem('vl_insta', instaEl?.value?.trim() || '');
        localStorage.setItem('vl_site', siteEl?.value?.trim() || '');
        localStorage.setItem('vl_email', emailEl?.value?.trim() || '');
        localStorage.setItem('vl_city', cityEl?.value?.trim() || '');
        localStorage.setItem('vl_cat', catEl?.value?.trim() || '');
        if (avatarPreview?.src) localStorage.setItem('vl_avatar', avatarPreview.src);
        else localStorage.removeItem('vl_avatar');

        if (state.mode === 'produtos') {
            localStorage.setItem('vl_store', storeNameEl?.value?.trim() || '');
            localStorage.setItem('vl_hours', hoursEl?.value?.trim() || '');
            localStorage.setItem('vl_ops', listChecked(opChecks).join(','));
            localStorage.setItem('vl_pays', listChecked(payChecks).join(','));
        } else {
            localStorage.setItem('vl_prof', profEl?.value?.trim() || '');
            localStorage.setItem('vl_mod', getRadio(modRadios));
            localStorage.setItem('vl_price', priceEl?.value?.trim() || '');
            localStorage.setItem('vl_agenda', agendaEl?.value?.trim() || '');
        }
        flash('Informações salvas!');
    });

    function flash(t) {
        if (!msgEl) return;
        msgEl.textContent = t;
        setTimeout(() => { msgEl.textContent = ''; }, 1300);
    }
    function disableChoices(disabled) {
        if (btnChoiceProdutos) btnChoiceProdutos.disabled = !!disabled;
        if (btnChoiceServicos) btnChoiceServicos.disabled = !!disabled;
    }

    // ===== Boot: chama API real
    (async function bootstrap() {
        const out = await apiGetPage();
        if (!out) return; // redirecionado se 401

        const t = out.page_type;
        if (t === 'produtos' || t === 'servicos') {
            showForm(); setMode(t, false);
        } else {
            showChoice();
        }

        // listeners de escolha
        btnChoiceProdutos?.addEventListener('click', async () => {
            try {
                choiceMsg && (choiceMsg.textContent = 'Salvando…'); disableChoices(true);
                await apiSavePageType('produtos');
                choiceMsg && (choiceMsg.textContent = '');
                showForm(); setMode('produtos', false);
            } catch {
                choiceMsg && (choiceMsg.textContent = 'Não foi possível salvar. Tente novamente.');
                disableChoices(false);
            }
        });
        btnChoiceServicos?.addEventListener('click', async () => {
            try {
                choiceMsg && (choiceMsg.textContent = 'Salvando…'); disableChoices(true);
                await apiSavePageType('servicos');
                choiceMsg && (choiceMsg.textContent = '');
                showForm(); setMode('servicos', false);
            } catch {
                choiceMsg && (choiceMsg.textContent = 'Não foi possível salvar. Tente novamente.');
                disableChoices(false);
            }
        });
    })();

    // ===== Cleanup
    return function destroy() {
        btnChoiceProdutos && btnChoiceProdutos.replaceWith(btnChoiceProdutos.cloneNode(true));
        btnChoiceServicos && btnChoiceServicos.replaceWith(btnChoiceServicos.cloneNode(true));
        segBtns.forEach(b => b.replaceWith(b.cloneNode(true)));
    };
}

export function destroy() { /* noop */ }
