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

// ====== CRYPTO HELPERS (AES-GCM 256) ======
const textToBytes = (txt) => new TextEncoder().encode(txt);
const bytesToBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const base64ToBytes = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

async function importOrCreateKey(storage, keyName) {
    const existing = storage.getItem(keyName);
    if (existing) {
        const raw = base64ToBytes(existing);
        return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
    }
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const raw = await crypto.subtle.exportKey('raw', key);
    storage.setItem(keyName, bytesToBase64(raw));
    return key;
}

// Cifra um OBJETO { token, exp } e devolve { iv, cipher } em base64
async function encryptAuth(authObj, remember) {
    const storage = remember ? localStorage : sessionStorage;
    const key = await importOrCreateKey(storage, 'estoka_k');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = textToBytes(JSON.stringify(authObj));
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    return { iv: bytesToBase64(iv), cipher: bytesToBase64(cipherBuf) };
}

// Descriptografa e devolve OBJETO { token, exp } ou null
async function decryptAuth(remember) {
    const storage = remember ? localStorage : sessionStorage;
    const keyB64 = storage.getItem('estoka_k');
    const authJson = storage.getItem('estoka_auth');
    if (!keyB64 || !authJson) return null;

    const { iv, cipher } = JSON.parse(authJson);
    const key = await crypto.subtle.importKey('raw', base64ToBytes(keyB64), 'AES-GCM', false, ['encrypt', 'decrypt']);
    try {
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(iv) }, key, base64ToBytes(cipher));
        return JSON.parse(new TextDecoder().decode(plainBuf));
    } catch {
        return null;
    }
}

// Mostrar/ocultar senha com ícone reutilizável
function setupPasswordEye(inputEl, btnId, imgId) {
    const btn = document.getElementById(btnId);
    const img = document.getElementById(imgId);
    if (!inputEl || !btn || !img) return;

    let visivel = false;
    btn.addEventListener('click', () => {
        visivel = !visivel;
        inputEl.type = visivel ? 'text' : 'password';
        img.src = visivel
            ? '/public/assets/images/olho-aberto.svg'
            : '/public/assets/images/olho-fechado.svg';
        const label = visivel ? 'Ocultar senha' : 'Mostrar senha';
        img.alt = label;
        btn.setAttribute('aria-label', label);
    });
}

// aplica no campo de login
setupPasswordEye(document.getElementById('lpassword'), 'toggleSenhaLogin', 'eyeIconLogin');


// Limpa qualquer formato antigo e o novo
function clearStoredTokens() {
    // antigos (texto puro)
    sessionStorage.removeItem('estoka_token');
    sessionStorage.removeItem('estoka_token_expires');
    localStorage.removeItem('estoka_token');
    localStorage.removeItem('estoka_token_expires');
    // novos (cifrado)
    sessionStorage.removeItem('estoka_k');
    sessionStorage.removeItem('estoka_auth');
    localStorage.removeItem('estoka_k');
    localStorage.removeItem('estoka_auth');
}

// helpers para detectar onde está salvo
function hasRemembered() {
    return !!localStorage.getItem('estoka_auth');
}
async function getAuth() {
    const remember = hasRemembered();
    return await decryptAuth(remember); // { token, exp } ou null
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
            body: JSON.stringify({ email, password, remember })
        });

        let out = null, raw = null;
        try { out = await res.json(); } catch (_) { raw = await res.text(); }

        if (res.ok && out?.ok) {
            // limpeza
            clearStoredTokens();

            const storage = remember ? localStorage : sessionStorage;

            // cifra token + exp (AES-GCM)
            const enc = await encryptAuth(
                { token: out.token, exp: out.expires_at },
                remember
            );
            storage.setItem('estoka_auth', JSON.stringify(enc));

            // guarda dados não sensíveis para o SPA decidir o fluxo
            const user = {
                id: out.user?.id ?? null,
                email: out.user?.email ?? null,
                slug: out.user?.slug ?? null,
                primeiro_login: Number(out.user?.primeiro_login ?? 0),
            };
            storage.setItem('estoka_user', JSON.stringify(user));

            // 🔸 Importante: SEM redirecionar para outra página no primeiro login.
            // O SPA (app.html) vai ler estoka_user.primeiro_login === 1 e abrir o onboarding
            // para escolher o slug. Depois o SPA fará o POST /api/slug e marcará primeiro_login = 0.
            alertMsg('success', 'Login efetuado! Redirecionando…');
            setTimeout(() => { window.location.href = './spa/app.html#/inicio'; }, 600);

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


