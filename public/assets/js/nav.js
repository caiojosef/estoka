// /public/assets/js/nav.js
(function () {
  function sameOrigin(url) {
    try { return new URL(url).origin === location.origin; } catch { return false; }
  }

  function goBackOr(fallback) {
    if (document.referrer && sameOrigin(document.referrer) && window.history.length > 1) {
      history.back();
      return;
    }
    location.href = fallback;
  }

  // Ativa o comportamento "voltar" no logo
  function wireLogoBack(selector = '.logo-back', fallback = '/public/index.html') {
    document.querySelectorAll(selector).forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        goBackOr(fallback);
      });
    });
  }

  // Define o link contextual "Voltar para ..."
  function setContextBackLink(elOrSelector = '#contextBackLink', opts = {}) {
    const el = typeof elOrSelector === 'string' ? document.querySelector(elOrSelector) : elOrSelector;
    if (!el) return;

    const qp = new URLSearchParams(location.search);
    let from = (qp.get('from') || '').toLowerCase();
    let label = 'Voltar';
    let href = '/public/index.html';

    // 1) Prioriza o ?from=...
    if (from === 'login') { label = 'Voltar para o Login'; href = '/public/login.html'; }
    else if (from === 'index') { label = 'Voltar para a Página Inicial'; href = '/public/index.html'; }
    else if (from === 'forgot') { label = 'Voltar para Recuperar acesso'; href = '/public/forgot.html'; }
    else {
      // 2) Se não tem ?from, tenta deduzir pelo referrer
      const ref = document.referrer || '';
      const path = ref ? new URL(ref).pathname.toLowerCase() : '';
      if (path.endsWith('/public/login.html'))       { label = 'Voltar para o Login'; href = '/public/login.html'; }
      else if (path.endsWith('/public/index.html') || path === '/public/') {
        label = 'Voltar para a Página Inicial'; href = '/public/index.html';
      } else if (path.endsWith('/public/forgot.html')) {
        label = 'Voltar para Recuperar acesso'; href = '/public/forgot.html';
      }
    }

    // Permite sobrescrever via options
    if (opts.label) label = opts.label;
    if (opts.href)  href  = opts.href;

    el.textContent = label;
    el.setAttribute('href', href);

    // Comportamento: tentar voltar; fallback = href
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (document.referrer && sameOrigin(document.referrer) && window.history.length > 1) {
        history.back();
      } else {
        location.href = href;
      }
    });

    // Deixa visível caso esteja hidden
    const wrapper = el.closest('.back-hint');
    if (wrapper) wrapper.hidden = false;
  }

  // Exponho no window para usar nos HTMLs
  window.NavHelpers = { wireLogoBack, setContextBackLink };
})();
