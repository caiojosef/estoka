const $ = (s, c=document)=>c.querySelector(s);
const form = $('#formForgot');
const email = $('#femail');
const msg = $('#msg');
const dev = $('#devLink');
const btn = $('#btnForgot');

function show(type, text){
  msg.className = `alert ${type}`;
  msg.textContent = text;
  msg.hidden = false;
}
function clearUI(){
  msg.hidden = true;
  dev.hidden = true;
  dev.innerHTML = '';
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  clearUI();

  const v = email.value.trim();
  if (!/^\S+@\S+\.\S+$/.test(v)){ show('error','E-mail inválido'); return; }

  btn.disabled = true; btn.textContent = 'Enviando…';
  try{
    const res = await fetch('/api/forgot',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: v })
    });
    const out = await res.json().catch(()=> ({}));
    if (res.ok && out.ok){
      show('success', out.message || 'Se existir conta, enviaremos um link.');
      if (out.dev_reset_url){
        dev.hidden = false;
        dev.innerHTML = `<a class="btn" href="${out.dev_reset_url}">Abrir link de teste</a>`;
      }
    }else{
      show('error', out.message || out.detail || 'Erro ao solicitar reset.');
    }
  }catch(err){
    show('error','Falha de comunicação.');
  }finally{
    btn.disabled = false; btn.textContent = 'Enviar link';
  }
});
