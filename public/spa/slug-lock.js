// spa/assets/js/slug-lock.js
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// === Helpers de crypto (iguais ao login) ===
const textToBytes = (t) => new TextEncoder().encode(t);
const bytesToBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const base64ToBytes = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

async function decryptAuthFromStorage() {
  // Se existe em localStorage, assume remember=true
  const remember = !!localStorage.getItem('estoka_auth');
  const storage = remember ? localStorage : sessionStorage;
  const keyB64 = storage.getItem('estoka_k');
  const authJson = storage.getItem('estoka_auth');
  if (!keyB64 || !authJson) return null;
  const { iv, cipher } = JSON.parse(authJson);
  const key = await crypto.subtle.importKey('raw', base64ToBytes(keyB64), 'AES-GCM', false, ['decrypt']);
  try {
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(iv) }, key, base64ToBytes(cipher));
    return JSON.parse(new TextDecoder().decode(plainBuf)); // { token, exp }
  } catch { return null; }
}

function readUser() {
  // Info não sensível guardada no login.js
  const raw = localStorage.getItem('estoka_user') || sessionStorage.getItem('estoka_user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveUser(u) {
  const mem = localStorage.getItem('estoka_user') ? localStorage : sessionStorage;
  mem.setItem('estoka_user', JSON.stringify(u));
}

function logoutToLogin() {
  // Limpa tudo e sai pro login
  ['estoka_auth','estoka_k','estoka_user'].forEach(k => {
    sessionStorage.removeItem(k); localStorage.removeItem(k);
  });
  window.location.href = '/public/login.html';
}

function validarSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

const SlugLock = (() => {
  let root, modal, confirmBox, confirmValue, input, errEl, submitBtn, cancelBtn, backBtn, yesBtn;
  let enforcingInterval = null;
  let focusable = [];

  function ensureVisible() {
    // Reforça que o overlay está ativo mesmo se tentarem esconder via CSS
    if (!root) return;
    root.style.display = 'grid';
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('slug-no-scroll');
  }

  function hideAll() {
    if (!root) return;
    root.style.display = 'none';
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('slug-no-scroll');
  }

  function focusTrap(e) {
    if (!root || root.style.display === 'none') return;
    if (e.key === 'Tab') {
      const f = focusable.filter(el => !el.hasAttribute('disabled') && !el.hidden);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); /* não fecha */ }
  }

  function updateFocusable() {
    focusable = $$('#slugLock button, #slugLock input');
  }

  function observeStyleTampering() {
    // Se alguém tentar mudar 'display' ou 'visibility' do overlay, voltamos ao normal.
    const obs = new MutationObserver(() => ensureVisible());
    obs.observe(root, { attributes: true, attributeFilter: ['style','class','hidden'] });
    // Reforço periódico
    enforcingInterval = setInterval(ensureVisible, 800);
  }

  async function checkAvailability(slug) {
    const r = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
    const j = await r.json().catch(() => ({}));
    return !!j?.available;
  }

  async function saveSlug(slug) {
    const auth = await decryptAuthFromStorage();
    if (!auth?.token) { logoutToLogin(); return; }

    const r = await fetch('/api/slug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({ slug })
    });

    if (r.status === 401) { logoutToLogin(); return; }

    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.ok) {
      const u = readUser() || {};
      u.slug = slug;
      u.primeiro_login = 0;
      saveUser(u);
      hideAll();
      // opcional: feedback no SPA
      setTimeout(() => {
        alert?.('Seu link foi definido com sucesso!');
      }, 50);
    } else {
      throw new Error(j?.message || 'Falha ao salvar o slug');
    }
  }

  function wire() {
    root = $('#slugLock');
    modal = $('.slug-lock__modal', root);
    confirmBox = $('#slugConfirm', root);
    confirmValue = $('#slugConfirmValue', root);
    input = $('#slugInput', root);
    errEl = $('#slugError', root);
    submitBtn = $('#slugSubmit', root);
    cancelBtn = $('#slugCancel', root);
    backBtn = $('#slugBack', root);
    yesBtn = $('#slugYes', root);

    // Submit primário → valida e vai pra confirmação
    $('#slugForm', root).addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.textContent = '';

      const slug = (input.value || '').trim();
      if (!validarSlug(slug)) {
        errEl.textContent = 'Use apenas letras minúsculas, números e hífens (sem espaços/acentos).';
        input.focus(); return;
      }

      submitBtn.disabled = true;
      try {
        const available = await checkAvailability(slug);
        if (!available) {
          errEl.textContent = 'Esse nome já está em uso. Tente outro.';
          return;
        }
        // Mostra confirmação
        confirmValue.textContent = slug;
        confirmBox.hidden = false;
        // foca botão de confirmar
        yesBtn.focus();
      } catch {
        errEl.textContent = 'Não foi possível verificar a disponibilidade.';
      } finally {
        submitBtn.disabled = false;
      }
    });

    // Confirm dialog
    backBtn.addEventListener('click', () => {
      confirmBox.hidden = true;
      input.focus();
    });
    yesBtn.addEventListener('click', async () => {
      const slug = confirmValue.textContent.trim();
      yesBtn.disabled = true;
      try {
        await saveSlug(slug);
      } catch (e) {
        errEl.textContent = e.message || 'Falha ao salvar.';
        confirmBox.hidden = true;
        input.focus();
      } finally {
        yesBtn.disabled = false;
      }
    });

    // Cancelar → “não quero agora” = sair para o login
    cancelBtn.addEventListener('click', () => {
      logoutToLogin();
    });

    // Focus trap
    updateFocusable();
    document.addEventListener('keydown', focusTrap);

    // Impede fechar por clique fora
    root.addEventListener('click', (e) => {
      if (e.target === root || e.target.classList.contains('slug-lock__backdrop')) {
        e.stopPropagation();
      }
    });

    // Anti-tampering
    observeStyleTampering();
  }

  function mustShow() {
    const u = readUser();
    return !u || u.primeiro_login === 1 || !u.slug;
  }

  async function enforce() {
    if (!root) wire();
    if (mustShow()) {
      ensureVisible();
      // foco inicial
      setTimeout(() => input?.focus(), 30);
    } else {
      hideAll();
    }
  }

  function init() {
    wire();
    enforce();
    // Reaparece em qualquer navegação dentro do SPA
    window.addEventListener('hashchange', enforce);
  }

  return { init, enforce };
})();

// Inicialize após montar sua SPA:
window.addEventListener('DOMContentLoaded', () => {
  SlugLock.init();
});
