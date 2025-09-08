const $ = (s, c = document) => c.querySelector(s);
const form = $('#formLogin');
const btn = $('#btnLogin');
const msg = $('#loginMsg');
$('#year').textContent = new Date().getFullYear();

function setErr(name, message) {
    const el = document.querySelector(`[data-error-for="${name}"]`);
    if (el) el.textContent = message || '';
}
function clearErrors() {
    ['email', 'password'].forEach(f => setErr(f, ''));
    msg.hidden = true;
}
function alertMsg(type, text) {
    msg.className = `alert ${type}`;
    msg.textContent = text;
    msg.hidden = false;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = $('#lemail').value.trim();
    const password = $('#lpassword').value;
    const remember = $('#remember').checked; // << NOVO

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { setErr('email', 'E-mail inválido'); return; }
    if (!password) { setErr('password', 'Informe sua senha'); return; }

    btn.disabled = true; btn.textContent = 'Entrando…';
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, remember }) // << NOVO
        });

        let out = null, raw = null;
        try { out = await res.json(); } catch (_) { raw = await res.text(); }

        if (res.ok && out?.ok) {
            // limpa qualquer resquício para evitar conflito
            sessionStorage.removeItem('estoka_token');
            sessionStorage.removeItem('estoka_token_expires');
            localStorage.removeItem('estoka_token');
            localStorage.removeItem('estoka_token_expires');

            const storage = remember ? localStorage : sessionStorage; // << NOVO
            storage.setItem('estoka_token', out.token);
            storage.setItem('estoka_token_expires', out.expires_at);

            alertMsg('success', 'Login efetuado! Redirecionando…');
            setTimeout(() => window.location.href = './spa/app.html', 600);
        } else {
            if (out?.errors) Object.entries(out.errors).forEach(([k, v]) => setErr(k, v));
            const msg = out?.message || `Erro HTTP ${res.status} — ${String(raw || '').slice(0, 200)}`;
            alertMsg('error', msg);
        }
    } catch (err) {
        alertMsg('error', 'Falha de comunicação. Tente novamente.');
    } finally {
        btn.disabled = false; btn.textContent = 'Entrar';
    }
});


