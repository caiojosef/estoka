// Minha Página — Simulação de backend com sessionStorage
// - Salva SOMENTE o tipo da página (produtos/servicos) em sessionStorage
// - Restante dos campos continuam no localStorage (MVP)

export function init(ctx) {
    var el = ctx.el;

    // ===== Passo de ESCOLHA
    var stepChoice = el.querySelector('#mpStepChoice');
    var stepForm = el.querySelector('#mpStepForm') || el.querySelector('#mpForm'); // compat
    var btnChoiceProdutos = el.querySelector('#btnChoiceProdutos');
    var btnChoiceServicos = el.querySelector('#btnChoiceServicos');
    var choiceMsg = el.querySelector('#choiceMsg');

    // ===== Segmented control dentro do formulário
    var segBtns = el.querySelectorAll('.seg__btn');

    // ===== Campos comuns
    var form = el.querySelector('#mpForm') || el.querySelector('#mpStepForm') || stepForm;
    var nameEl = el.querySelector('#mpName');
    var slugEl = el.querySelector('#mpSlug');
    var bioEl = el.querySelector('#mpBio');
    var bioCount = el.querySelector('#mpBioCount');
    var colorEl = el.querySelector('#mpColor');
    var avatarInput = el.querySelector('#mpAvatar');
    var avatarRemove = el.querySelector('#mpAvatarRemove');
    var avatarPreview = el.querySelector('#mpAvatarPreview');

    var whatsEl = el.querySelector('#mpWhats');
    var instaEl = el.querySelector('#mpInstagram');
    var siteEl = el.querySelector('#mpSite');
    var emailEl = el.querySelector('#mpEmail');
    var cityEl = el.querySelector('#mpCity');
    var catEl = el.querySelector('#mpCategory');
    var msgEl = el.querySelector('#mpMsg');

    // ===== Campos modo PRODUTOS
    var modeProdutos = el.querySelector('#modeProdutos');
    var storeNameEl = el.querySelector('#mpStoreName');
    var hoursEl = el.querySelector('#mpHours');
    var opChecks = Array.prototype.slice.call(el.querySelectorAll('input[name="op"]'));
    var payChecks = Array.prototype.slice.call(el.querySelectorAll('input[name="pay"]'));

    // ===== Campos modo SERVIÇOS
    var modeServicos = el.querySelector('#modeServicos');
    var profEl = el.querySelector('#mpProfession');
    var modRadios = Array.prototype.slice.call(el.querySelectorAll('input[name="mod"]'));
    var priceEl = el.querySelector('#mpPrice');
    var agendaEl = el.querySelector('#mpAgenda');

    // ===== Prévia
    var prevName = el.querySelector('#prevName');
    var prevLink = el.querySelector('#prevLink');
    var prevBio = el.querySelector('#prevBio');
    var prevMeta = el.querySelector('#prevMeta');
    var prevLogo = el.querySelector('#prevAvatar');
    var prevWrap = el.querySelector('#mpPreview');

    var btnWhats = el.querySelector('#prevWhats');
    var btnInsta = el.querySelector('#prevInsta');
    var btnSite = el.querySelector('#prevSite');
    var btnEmail = el.querySelector('#prevEmail');

    // chip do topo do shell
    var chipTextEl = document.getElementById('chipLinkText');

    // ===== Estado (tipo vem da "API" simulada; o resto fica local)
    var state = {
        mode: null, // 'produtos' | 'servicos' (pego do sessionStorage)

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

    // ===== “API” simulada usando sessionStorage
    function apiGetPageType() {
        return new Promise(function (resolve) {
            // simula pequena latência
            setTimeout(function () {
                var t = sessionStorage.getItem('vl_page_type');
                if (t !== 'produtos' && t !== 'servicos') t = null;
                resolve({ page_type: t });
            }, 120);
        });
    }
    function apiSavePageType(type) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                sessionStorage.setItem('vl_page_type', type);
                resolve({ ok: true, page_type: type });
            }, 120);
        });
    }

    // ===== Helpers de UI e preview
    function showChoice() { if (stepChoice) stepChoice.hidden = false; if (stepForm) stepForm.hidden = true; }
    function showForm() { if (stepChoice) stepChoice.hidden = true; if (stepForm) stepForm.hidden = false; }

    function fmtLink(slug) { return 'vitrinedoslinks.com.br/' + (slug || 'seunome'); }
    function listChecked(nodes) {
        var out = [];
        for (var i = 0; i < nodes.length; i++) if (nodes[i].checked) out.push(nodes[i].value);
        return out;
    }
    function getSelectedRadioValue(nodes) {
        for (var i = 0; i < nodes.length; i++) if (nodes[i].checked) return nodes[i].value;
        return '';
    }

    function setMode(mode, persistToSession) {
        state.mode = (mode === 'servicos') ? 'servicos' : 'produtos';

        // UI: segmented + fieldsets
        for (var i = 0; i < segBtns.length; i++) {
            var b = segBtns[i];
            var on = b.getAttribute('data-mode') === state.mode;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
        }
        if (modeProdutos) modeProdutos.hidden = (state.mode !== 'produtos');
        if (modeServicos) modeServicos.hidden = (state.mode !== 'servicos');

        if (persistToSession === true) {
            apiSavePageType(state.mode).catch(function () { /* silencia */ });
        }
        updatePreview();
    }

    function updatePreview() {
        var name = (nameEl && nameEl.value ? nameEl.value.trim() : '') || 'Seu Nome';
        var slug = (slugEl && slugEl.value ? slugEl.value.trim() : '') || 'seunome';
        var bio = (bioEl && bioEl.value ? bioEl.value.trim() : '') || 'Sua descrição aparece aqui.';
        var city = (cityEl && cityEl.value ? cityEl.value.trim() : '');
        var cat = (catEl && catEl.value ? catEl.value.trim() : '');

        if (prevName) prevName.textContent = name;
        if (prevLink) prevLink.textContent = fmtLink(slug);
        if (prevBio) prevBio.textContent = bio;

        if (prevMeta) {
            if (state.mode === 'produtos') {
                var ops = listChecked(opChecks).join(' / ');
                var pays = listChecked(payChecks).join(', ');
                var left = cat || 'Loja';
                var right = city || '';
                var extra = [];
                if (ops) extra.push(ops);
                if (pays) extra.push(pays);
                var txt = [];
                if (left) txt.push(left);
                if (right) txt.push(right);
                if (extra.length) txt.push(extra.join(' • '));
                prevMeta.textContent = txt.join(' • ') || 'Loja • Cidade';
            } else {
                var prof = (profEl && profEl.value ? profEl.value.trim() : '') || 'Profissional';
                var mod = getSelectedRadioValue(modRadios);
                var left2 = [];
                if (prof) left2.push(prof);
                if (mod) left2.push(mod);
                var txt2 = [];
                if (left2.length) txt2.push(left2.join(' • '));
                if (city) txt2.push(city);
                prevMeta.textContent = txt2.join(' • ') || 'Profissional • Cidade';
            }
        }

        if (prevWrap) {
            var color = (colorEl && colorEl.value) ? colorEl.value : '#179FDA';
            prevWrap.style.setProperty('--accent', color);
            prevWrap.setAttribute('data-accent', color);
        }

        if (chipTextEl && slugEl) {
            var s = slug.toLowerCase();
            chipTextEl.innerHTML = fmtLink(s).replace(s, '<b>' + s + '</b>');
        }

        // contatos
        var w = whatsEl && whatsEl.value ? whatsEl.value.replace(/\D/g, '') : '';
        if (btnWhats) {
            if (w.length >= 10) { btnWhats.hidden = false; btnWhats.href = 'https://wa.me/55' + w; }
            else { btnWhats.hidden = true; btnWhats.removeAttribute('href'); }
        }
        var ig = (instaEl && instaEl.value) ? instaEl.value.trim() : '';
        if (btnInsta) { btnInsta.hidden = !ig; if (ig) btnInsta.href = ig; else btnInsta.removeAttribute('href'); }
        var st = (siteEl && siteEl.value) ? siteEl.value.trim() : '';
        if (btnSite) { btnSite.hidden = !st; if (st) btnSite.href = st; else btnSite.removeAttribute('href'); }
        var em = (emailEl && emailEl.value) ? emailEl.value.trim() : '';
        if (btnEmail) { btnEmail.hidden = !em; if (em) btnEmail.href = 'mailto:' + em; else btnEmail.removeAttribute('href'); }

        if (bioCount && bioEl) bioCount.textContent = String(bioEl.value.length || 0);
    }

    // ===== Preenche formulário com o estado salvo (MVP local)
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
    for (var i = 0; i < opChecks.length; i++)  opChecks[i].checked = state.ops.indexOf(opChecks[i].value) !== -1;
    for (var j = 0; j < payChecks.length; j++) payChecks[j].checked = state.pays.indexOf(payChecks[j].value) !== -1;

    if (profEl) profEl.value = state.prof;
    if (priceEl) priceEl.value = state.price;
    if (agendaEl) agendaEl.value = state.agenda;
    for (var k = 0; k < modRadios.length; k++) modRadios[k].checked = (modRadios[k].value === state.mod);

    if (state.avatar && avatarPreview) {
        avatarPreview.src = state.avatar;
        if (prevLogo) prevLogo.innerHTML = '<img src="' + state.avatar + '" alt="">';
    }

    // ===== Listeners
    for (var s = 0; s < segBtns.length; s++) {
        (function (b) {
            b.addEventListener('click', function () {
                setMode(b.getAttribute('data-mode'), true);
            });
        })(segBtns[s]);
    }

    function onBasic() { updatePreview(); }
    if (nameEl) nameEl.addEventListener('input', onBasic);
    if (bioEl) bioEl.addEventListener('input', onBasic);
    if (colorEl) colorEl.addEventListener('input', updatePreview);

    [whatsEl, instaEl, siteEl, emailEl, cityEl, catEl].forEach(function (i) {
        if (i) i.addEventListener('input', updatePreview);
    });
    [storeNameEl, hoursEl, priceEl, agendaEl].forEach(function (i) {
        if (i) i.addEventListener('input', updatePreview);
    });
    opChecks.forEach(function (c) { c.addEventListener('change', updatePreview); });
    payChecks.forEach(function (c) { c.addEventListener('change', updatePreview); });
    modRadios.forEach(function (r) { r.addEventListener('change', updatePreview); });

    if (slugEl) {
        slugEl.addEventListener('input', function (e) {
            var v = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/--+/g, '-');
            if (v !== e.target.value) e.target.value = v;
            updatePreview();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', function () {
            var f = avatarInput.files && avatarInput.files[0] ? avatarInput.files[0] : null;
            if (!f) return;
            var r = new FileReader();
            r.onload = function () {
                if (avatarPreview) avatarPreview.src = r.result;
                if (prevLogo) prevLogo.innerHTML = '<img src="' + r.result + '" alt="">';
            };
            r.readAsDataURL(f);
        });
    }
    if (avatarRemove) {
        avatarRemove.addEventListener('click', function () {
            if (avatarInput) avatarInput.value = '';
            if (avatarPreview) avatarPreview.removeAttribute('src');
            if (prevLogo) prevLogo.textContent = 'VL';
        });
    }

    var clearBtn = el.querySelector('#mpClear');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            if (!form) return;
            form.reset();
            if (avatarInput) avatarInput.value = '';
            if (avatarPreview) avatarPreview.removeAttribute('src');
            if (prevLogo) prevLogo.textContent = 'VL';
            if (colorEl) colorEl.value = '#179FDA';
            for (var i = 0; i < opChecks.length; i++) opChecks[i].checked = false;
            for (var j = 0; j < payChecks.length; j++) payChecks[j].checked = false;
            for (var k = 0; k < modRadios.length; k++) modRadios[k].checked = false;
            updatePreview();
            flash('Formulário limpo.');
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            // mantém MVP local; depois trocamos para API real
            localStorage.setItem('vl_name', nameEl && nameEl.value ? nameEl.value.trim() : '');
            localStorage.setItem('vl_slug', slugEl && slugEl.value ? (slugEl.value.trim() || 'seunome') : 'seunome');
            localStorage.setItem('vl_bio', bioEl && bioEl.value ? bioEl.value.trim() : '');
            localStorage.setItem('vl_color', colorEl && colorEl.value ? colorEl.value : '#179FDA');
            localStorage.setItem('vl_whats', whatsEl && whatsEl.value ? whatsEl.value.trim() : '');
            localStorage.setItem('vl_insta', instaEl && instaEl.value ? instaEl.value.trim() : '');
            localStorage.setItem('vl_site', siteEl && siteEl.value ? siteEl.value.trim() : '');
            localStorage.setItem('vl_email', emailEl && emailEl.value ? emailEl.value.trim() : '');
            localStorage.setItem('vl_city', cityEl && cityEl.value ? cityEl.value.trim() : '');
            localStorage.setItem('vl_cat', catEl && catEl.value ? catEl.value.trim() : '');
            if (avatarPreview && avatarPreview.src) localStorage.setItem('vl_avatar', avatarPreview.src);
            else localStorage.removeItem('vl_avatar');

            if (state.mode === 'produtos') {
                localStorage.setItem('vl_store', storeNameEl && storeNameEl.value ? storeNameEl.value.trim() : '');
                localStorage.setItem('vl_hours', hoursEl && hoursEl.value ? hoursEl.value.trim() : '');
                localStorage.setItem('vl_ops', listChecked(opChecks).join(','));
                localStorage.setItem('vl_pays', listChecked(payChecks).join(','));
            } else {
                localStorage.setItem('vl_prof', profEl && profEl.value ? profEl.value.trim() : '');
                localStorage.setItem('vl_mod', getSelectedRadioValue(modRadios));
                localStorage.setItem('vl_price', priceEl && priceEl.value ? priceEl.value.trim() : '');
                localStorage.setItem('vl_agenda', agendaEl && agendaEl.value ? agendaEl.value.trim() : '');
            }
            flash('Informações salvas!');
        });
    }

    function flash(t) {
        if (!msgEl) return;
        msgEl.textContent = t;
        setTimeout(function () { msgEl.textContent = ''; }, 1300);
    }

    // ===== Boot: lê "do servidor" (sessionStorage) e decide
    (function bootstrap() {
        apiGetPageType().then(function (me) {
            var t = me && me.page_type ? me.page_type : null;
            if (t === 'produtos' || t === 'servicos') {
                showForm();
                setMode(t, false);
            } else {
                showChoice();
            }
        });

        // listeners da escolha
        if (btnChoiceProdutos) btnChoiceProdutos.addEventListener('click', function () {
            choiceMsg && (choiceMsg.textContent = 'Salvando…');
            disableChoices(true);
            apiSavePageType('produtos').then(function () {
                choiceMsg && (choiceMsg.textContent = '');
                showForm();
                setMode('produtos', false);
            }).catch(function () {
                choiceMsg && (choiceMsg.textContent = 'Não foi possível salvar. Tente novamente.');
                disableChoices(false);
            });
        });

        if (btnChoiceServicos) btnChoiceServicos.addEventListener('click', function () {
            choiceMsg && (choiceMsg.textContent = 'Salvando…');
            disableChoices(true);
            apiSavePageType('servicos').then(function () {
                choiceMsg && (choiceMsg.textContent = '');
                showForm();
                setMode('servicos', false);
            }).catch(function () {
                choiceMsg && (choiceMsg.textContent = 'Não foi possível salvar. Tente novamente.');
                disableChoices(false);
            });
        });
    })();

    function disableChoices(disabled) {
        if (btnChoiceProdutos) btnChoiceProdutos.disabled = !!disabled;
        if (btnChoiceServicos) btnChoiceServicos.disabled = !!disabled;
    }

    // ===== Cleanup mínimo
    return function destroy() {
        // trocar botões por clones remove listeners de forma simples
        if (btnChoiceProdutos) btnChoiceProdutos.replaceWith(btnChoiceProdutos.cloneNode(true));
        if (btnChoiceServicos) btnChoiceServicos.replaceWith(btnChoiceServicos.cloneNode(true));
        for (var i = 0; i < segBtns.length; i++) {
            segBtns[i].replaceWith(segBtns[i].cloneNode(true));
        }
    };
}

export function destroy() { /* noop */ }
