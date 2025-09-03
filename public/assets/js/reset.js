document.addEventListener('DOMContentLoaded', () => {
    // helpers
    const $ = (s, c = document) => c.querySelector(s);

    // pega token da URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token') || '';

    // elementos (com fallback de IDs)
    const form = $('#formReset') || $('form');
    const pw = $('#password') || $('#npw') || $('#new_password');
    const cpw = $('#confirm') || $('#cpw') || $('#confirm_password') || $('#password2');
    const status = $('#status') || $('#formMsg') || $('.alert');

    // se algo essencial faltar, loga e não quebra a página
    if (!form || !pw || !cpw) {
        console.error('reset.js: faltam elementos esperados (#formReset/#password/#confirm). Verifique IDs no HTML.');
        return;
    }

    // --------- mesmas regras do register.js ----------
    function passwordComplex(pwVal) {
        if (!pwVal) return { hasLen: false, hasUpper: false, hasLower: false, hasSpecial: false, ok: false };
        const hasLen = pwVal.length >= 6;
        const hasUpper = /[A-Z]/.test(pwVal);
        const hasLower = /[a-z]/.test(pwVal);
        const hasSpecial = /[!@#$*]/.test(pwVal);
        return { hasLen, hasUpper, hasLower, hasSpecial, ok: hasLen && hasUpper && hasLower && hasSpecial };
    }

    function updatePwChecklist() {
        const req = passwordComplex(pw.value);
        const map = {
            len: req.hasLen,
            upper: req.hasUpper,
            lower: req.hasLower,
            special: req.hasSpecial
        };
        Object.entries(map).forEach(([k, v]) => {
            const li = document.querySelector(`.pw-req__item[data-req="${k}"]`);
            if (li) li.classList.toggle('ok', !!v);
        });
    }

    // ativa checklist ao digitar/focar (igual register.js)
    pw.addEventListener('input', updatePwChecklist);
    pw.addEventListener('focus', updatePwChecklist);

    // UI de mensagem
    function show(type, text) {
        if (!status) return;
        status.className = `alert ${type}`;
        status.textContent = text;
        status.hidden = false;
    }
    function clear() { if (status) status.hidden = true; }

    // submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clear();

        // validação básica (igual fluxo simples)
        const r = passwordComplex(pw.value);
        if (!r.ok) { show('error', 'Senha deve ter 6+ caracteres, 1 maiúscula, 1 minúscula e 1 especial (!@#$*).'); return; }
        if (cpw.value !== pw.value) { show('error', 'Senhas não conferem'); return; }

        try {
            const res = await fetch('/api/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: pw.value, confirm: cpw.value })
            });
            const out = await res.json().catch(() => ({}));

            if (res.ok && out.ok) {
                show('success', 'Senha redefinida com sucesso! Redirecionando…');
                setTimeout(() => location.href = '/public/login.html', 1000);
            } else {
                show('error', out.message || out.detail || 'Erro ao redefinir senha.');
            }
        } catch (err) {
            show('error', 'Falha de comunicação.');
        }
    });
});
