// /public/spa/app.js — SPA com CSS/JS declarados por rota
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ===== Rotas =====
  // css/js aceitam string ou array. São relativos à pasta ./pages/<folder>/
  const routes = {
    '#/inicio': {
      folder: 'dashboard',
      file: 'index',
      title: 'Página Inicial',
      css: ['index.css'],
      js: ['index.js']
    },
    '#/minha-pagina': {
      folder: 'minha-pagina',
      file: 'index',
      title: 'Minha Página',
      css: ['index.css'],
      js: ['index.js']
    },
    '#/minha-pagina/form-loja': {
      folder: 'minha-pagina',
      file: 'form-loja',
      title: 'Loja',
      css: ['index.css'],   // <- compartilhado
      js: ['forms.js']     // <- compartilhado
    },
    '#/minha-pagina/form-prestador': {
      folder: 'minha-pagina',
      file: 'form-prestador',
      title: 'Prestador',
      css: ['index.css'],   // <- compartilhado
      js: ['forms-prestador-render.js']     // <- compartilhado
    },
  };

  let destroyFns = [];     // destroys da página atual
  let styleEls = [];       // <link>s do CSS da página atual

  function setActiveLink() {
    const hash = location.hash || '#/inicio';
    $$('.menu__link').forEach(a => {
      const href = a.getAttribute('href');
      const isMyPage = hash.startsWith('#/minha-pagina') && href === '#/minha-pagina';
      a.classList.toggle('is-active', href === hash || isMyPage);
    });
  }

  function clearCurrent() {
    try { destroyFns.forEach(fn => fn()); } catch (e) { console.error('Erro no destroy:', e); }
    destroyFns = [];
    styleEls.forEach(l => l.remove());
    styleEls = [];
  }

  async function loadHTML(route, view) {
    const url = `./pages/${route.folder}/${route.file}.html`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} (${url})`);
    view.innerHTML = await res.text();
  }

  function toArray(x) { return Array.isArray(x) ? x : (x ? [x] : []); }

  function loadCSS(route) {
    const list = toArray(route.css);
    list.forEach(name => {
      const href = `./pages/${route.folder}/${name}?v=${Date.now()}`;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      styleEls.push(link);
    });
  }

  async function loadJS(route, view, hashKey) {
    const list = toArray(route.js);
    for (const name of list) {
      const url = `./pages/${route.folder}/${name}?v=${Date.now()}`;
      try {
        const mod = await import(url);
        if (typeof mod.init === 'function') {
          const ctx = { el: view, route: { key: hashKey, ...route }, navigate };
          const maybe = mod.init(ctx);
          if (typeof maybe === 'function') destroyFns.push(maybe);
          else if (typeof mod.destroy === 'function') destroyFns.push(() => mod.destroy(ctx));
        }
      } catch (e) {
        console.warn('Falha ao importar', url, e);
      }
    }
  }

  async function loadPage(hash) {
    const route = routes[hash] || routes['#/inicio'];
    const view = $('#view');

    document.title = `Painel — ${route.title}`;
    setActiveLink();
    clearCurrent();

    view.innerHTML = `<section class="card"><p class="muted">Carregando ${route.title}…</p></section>`;

    try {
      await loadHTML(route, view);
      loadCSS(route);
      await loadJS(route, view, hash);
    } catch (err) {
      console.error(err);
      view.innerHTML = `<section class="card"><p class="muted">Não foi possível carregar a página.</p></section>`;
    }
  }

  function navigate(hash) {
    if (location.hash !== hash) location.hash = hash;
    else loadPage(hash); // recarrega mesma rota
  }

  // ===== Sidebar (mobile) =====
  const btnMenu = $('#btnMenu');
  const backdrop = $('#backdrop');
  function toggleSidebar() {
    const open = !document.body.classList.contains('sidebar-open');
    document.body.classList.toggle('sidebar-open', open);
    btnMenu?.setAttribute('aria-expanded', String(open));
    backdrop?.toggleAttribute('hidden', !open);
  }
  btnMenu?.addEventListener('click', toggleSidebar);
  backdrop?.addEventListener('click', toggleSidebar);
  $$('.menu__link').forEach(a => a.addEventListener('click', () => {
    if (matchMedia('(max-width: 980px)').matches) toggleSidebar();
  }));

  // ===== Navegação =====
  window.addEventListener('hashchange', () => loadPage(location.hash || '#/inicio'));
  if (!location.hash) location.hash = '#/inicio';
  loadPage(location.hash);
})();
