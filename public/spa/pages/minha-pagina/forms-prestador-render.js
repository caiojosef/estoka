// /public/spa/pages/minha-pagina/forms-prestador-render.js
export function init(ctx) {
  const el = ctx?.el || document;
  const root = el.querySelector('#prestadorRoot') || el;

  // Helpers
  const F = (window.SPA?.fetch) || fetch;
  const token =
    localStorage.getItem('estoka_token') ||
    sessionStorage.getItem('estoka_token');

  if (!token) { location.href = '/public/login.html?from=app'; return; }

  const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  async function getData() {
    const res = await F('/api/prestador', {
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
      cache: 'no-store'
    });
    let json = {};
    try { json = await res.json(); } catch { }
    if (res.status === 401) { location.href = '/public/login.html?from=app'; return {}; }
    if (!res.ok) return {};
    return (json && typeof json === 'object' && json.data) ? json.data : {};
  }

  async function saveData(payload) {
    const res = await F('/api/prestador', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    let json = {};
    try { json = await res.json(); } catch { }
    return { ok: res.ok, status: res.status, json };
  }

  function msg(text, type = 'ok') {
    const span = root.querySelector('#pr_msg');
    if (!span) return;
    span.hidden = false;
    span.className = 'form-msg ' + type; // ok | error
    span.textContent = text;
    setTimeout(() => { span.hidden = true; }, 2600);
  }

  function view(d = {}) {
    const online = !!d.atende_online;
    return `
      <div class="toolbar"><span id="pr_msg" class="form-msg" hidden></span></div>

      <form id="formPrestador" class="card form-grid" autocomplete="on">
        <fieldset class="group">
          <legend>URL pública</legend>
          <div class="grid-2">
            <div class="form-control">
              <label for="pr_handle">Handle (ex.: <code>caiojosef</code>)</label>
              <input id="pr_handle" type="text" inputmode="latin" minlength="3" maxlength="30"
                     pattern="[a-z0-9]{3,30}" placeholder="apenas letras e números, minúsculas"
                     value="${esc(d.profile_url)}" ${d.profile_url ? 'disabled' : ''}/>
              <small class="muted">
                Aparece em <code>www.vitrinedoslinks.com.br/&lt;handle&gt;</code>.
                Pode ser definido apenas uma vez.
              </small>
            </div>
          </div>
        </fieldset>

        <fieldset class="group">
          <legend>Identidade</legend>
          <div class="grid-2">
            <div class="form-control">
              <label for="pr_nome">Nome público <span class="req">*</span></label>
              <input id="pr_nome" type="text" maxlength="120" required value="${esc(d.nome_publico)}"/>
            </div>
            <div class="form-control">
              <label for="pr_perfil">Imagem do perfil (URL)</label>
              <input id="pr_perfil" type="text" maxlength="255" placeholder="/files/perfis/minha-foto.jpg"
                     value="${esc(d.imagem_perfil)}"/>
              <small class="muted">O sistema guarda apenas o caminho/URL.</small>
            </div>
          </div>

          <div class="form-control">
            <label for="pr_bio">Bio</label>
            <textarea id="pr_bio" rows="3" maxlength="240"
            >${esc(d.bio)}</textarea>
            <small class="muted">Máx. 240 caracteres.</small>
          </div>

          <div class="form-control">
            <label for="pr_esp">Especialidades</label>
            <input id="pr_esp" type="text" maxlength="255" placeholder="Ex.: Tricologia; Laser; Estética"
                   value="${esc(d.especialidades)}"/>
          </div>
        </fieldset>

        <fieldset class="group">
          <legend>Contato</legend>
          <div class="grid-2">
            <div class="form-control">
              <label for="pr_zap">WhatsApp</label>
              <input id="pr_zap" type="tel" inputmode="numeric" maxlength="20"
                     placeholder="(16) 99999-9999" value="${esc(d.whatsapp_contato)}"/>
              <small class="muted">Somente números serão salvos.</small>
            </div>
            <div class="form-control">
              <label for="pr_zap_msg">Mensagem padrão</label>
              <input id="pr_zap_msg" type="text" maxlength="255"
                     placeholder="Olá, vim do seu perfil na Vitrine dos Links!"
                     value="${esc(d.whatsapp_msg)}"/>
            </div>
          </div>
        </fieldset>

        <fieldset class="group">
          <legend>Atendimento</legend>
          <div class="grid-2">
            <div class="form-control">
              <label class="checkbox">
                <input id="pr_online" type="checkbox" ${online ? 'checked' : ''}/>
                Atende online
              </label>
            </div>
            <div class="form-control">
              <label for="pr_local">Local de atendimento</label>
              <input id="pr_local" type="text" maxlength="120"
                     placeholder="Ex.: Clínica Alpha, Sala 3"
                     value="${esc(d.local_atendimento)}"/>
            </div>
          </div>
        </fieldset>

        <fieldset class="group">
          <legend>Endereço</legend>
          <div class="grid-3">
            <div class="form-control">
              <label for="pr_cep">CEP</label>
              <input id="pr_cep" type="text" inputmode="numeric" maxlength="9"
                     placeholder="14840-300" value="${esc(d.cep)}"/>
              <small class="muted">Ao sair do campo, busca o endereço automaticamente.</small>
            </div>
            <div class="form-control">
              <label for="pr_logradouro">Logradouro</label>
              <input id="pr_logradouro" type="text" maxlength="120" value="${esc(d.logradouro)}"/>
            </div>
            <div class="form-control">
              <label for="pr_numero">Número</label>
              <input id="pr_numero" type="text" maxlength="16" value="${esc(d.numero)}"/>
            </div>
          </div>

          <div class="grid-3">
            <div class="form-control">
              <label for="pr_complemento">Complemento</label>
              <input id="pr_complemento" type="text" maxlength="60" value="${esc(d.complemento)}"/>
            </div>
            <div class="form-control">
              <label for="pr_bairro">Bairro</label>
              <input id="pr_bairro" type="text" maxlength="80" value="${esc(d.bairro)}"/>
            </div>
            <div class="form-control">
              <label for="pr_cidade">Cidade</label>
              <input id="pr_cidade" type="text" maxlength="80" value="${esc(d.cidade)}"/>
            </div>
          </div>

          <div class="grid-3">
            <div class="form-control">
              <label for="pr_estado">UF</label>
              <input id="pr_estado" type="text" maxlength="2" placeholder="SP" value="${esc(d.estado)}"/>
            </div>
            <div class="form-control"></div>
            <div class="form-control"></div>
          </div>
        </fieldset>

        <div class="form-actions">
          <button id="btnPrestSave" type="submit" class="btn primary">Salvar alterações</button>
        </div>
      </form>
    `;
  }

  function onlyDigits(s) { return String(s || '').replace(/\D+/g, ''); }

  async function viaCEP(cep) {
    cep = onlyDigits(cep);
    if (!cep || cep.length !== 8) return null;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: 'no-store' });
      const j = await r.json();
      if (j?.erro) return null;
      return { logradouro: j.logradouro || '', bairro: j.bairro || '', cidade: j.localidade || '', estado: j.uf || '' };
    } catch { return null; }
  }

  function snapshot(scope) {
    return {
      profile_url: (scope.querySelector('#pr_handle')?.value || '').trim().toLowerCase() || undefined,
      nome_publico: (scope.querySelector('#pr_nome')?.value || '').trim(),
      bio: (scope.querySelector('#pr_bio')?.value || '').trim(),
      especialidades: (scope.querySelector('#pr_esp')?.value || '').trim(),
      imagem_perfil: (scope.querySelector('#pr_perfil')?.value || '').trim(),
      whatsapp_contato: onlyDigits(scope.querySelector('#pr_zap')?.value),
      whatsapp_msg: (scope.querySelector('#pr_zap_msg')?.value || '').trim(),
      atende_online: !!scope.querySelector('#pr_online')?.checked,
      local_atendimento: (scope.querySelector('#pr_local')?.value || '').trim(),
      cep: onlyDigits(scope.querySelector('#pr_cep')?.value),
      logradouro: (scope.querySelector('#pr_logradouro')?.value || '').trim(),
      numero: (scope.querySelector('#pr_numero')?.value || '').trim(),
      complemento: (scope.querySelector('#pr_complemento')?.value || '').trim(),
      bairro: (scope.querySelector('#pr_bairro')?.value || '').trim(),
      cidade: (scope.querySelector('#pr_cidade')?.value || '').trim(),
      estado: (scope.querySelector('#pr_estado')?.value || '').trim().toUpperCase()
    };
  }

  function bindBehaviors(scope) {
    // CEP auto-fill
    scope.querySelector('#pr_cep')?.addEventListener('blur', async (e) => {
      const data = await viaCEP(e.target.value);
      if (!data) return;
      if (!scope.querySelector('#pr_logradouro')?.value) scope.querySelector('#pr_logradouro').value = data.logradouro;
      if (!scope.querySelector('#pr_bairro')?.value) scope.querySelector('#pr_bairro').value = data.bairro;
      if (!scope.querySelector('#pr_cidade')?.value) scope.querySelector('#pr_cidade').value = data.cidade;
      if (!scope.querySelector('#pr_estado')?.value) scope.querySelector('#pr_estado').value = data.estado;
    });

    // Normalizar handle (apenas a-z0-9)
    scope.querySelector('#pr_handle')?.addEventListener('input', (e) => {
      const v = (e.target.value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (v !== e.target.value) e.target.value = v;
    });

    // Submit
    scope.querySelector('#formPrestador')?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const payload = snapshot(scope);

      if (!payload.nome_publico) { msg('Informe o nome público.', 'error'); return; }
      if (payload.profile_url && !/^[a-z0-9]{3,30}$/.test(payload.profile_url)) {
        msg('Handle inválido. Use 3–30 letras/números minúsculos.', 'error'); return;
      }

      const btn = scope.querySelector('#btnPrestSave');
      if (btn) btn.disabled = true;

      const res = await saveData(payload);

      if (!res.ok) {
        const m = res.json?.message || res.json?.error || `Falha ao salvar (${res.status})`;
        msg(m, 'error');
        if (btn) btn.disabled = false;
        if (res.status === 401) location.href = '/public/login.html?from=app';
        return;
      }

      // Re-render com dados atualizados (garante valores do back)
      const nd = (res.json && res.json.data) ? res.json.data : {};
      root.innerHTML = view(nd);
      bindBehaviors(root);
      msg('Dados salvos!', 'ok');
    });
  }

  (async () => {
    // loading simples
    root.innerHTML = `<div class="card" style="padding:16px">Carregando…</div>`;
    const data = await getData();
    root.innerHTML = view(data);
    bindBehaviors(root);
  })();

  return () => { };
}

export function destroy() { }
