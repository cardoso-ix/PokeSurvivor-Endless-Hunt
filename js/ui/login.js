/* ============ login.js — início: entrar, criar conta ou jogar como convidado ============ */
G.LoginUI = (() => {
  const $ = G.UI.$;
  let mode = 'login';

  function init() {
    document.querySelectorAll('#scr-login .tab').forEach(t => {
      t.onclick = () => setMode(t.dataset.tab);
    });
    $('login-form').onsubmit = async e => {
      e.preventDefault();
      $('login-err').textContent = '';
      $('btn-auth').disabled = true;
      const fn = mode === 'login' ? G.DB.login : G.DB.register;
      const r = await fn($('f-user').value, $('f-pass').value);
      $('btn-auth').disabled = false;
      if (!r.ok) { $('login-err').textContent = r.error; return; }
      $('f-pass').value = '';
      G.Flow.afterLogin();
    };
    $('btn-guest').onclick = () => { G.DB.playAsGuest(); G.Flow.afterLogin(); };
    $('f-forgot').onclick = e => {
      e.preventDefault();
      $('login-err').textContent = '';
      const fb = $('forgot-box');
      if (fb) fb.classList.toggle('hidden');
    };
    const btnReset = $('btn-reset-pass');
    if (btnReset) {
      btnReset.onclick = async () => {
        $('login-err').textContent = '';
        $('login-err').style.color = '';
        const email = ($('f-user').value || '').trim();
        if (!email) {
          $('login-err').textContent = 'Digite seu e-mail no campo "Nome de Usuário ou E-mail" acima.';
          return;
        }
        btnReset.disabled = true;
        const r = await G.DB.sendPasswordReset(email);
        btnReset.disabled = false;
        if (!r.ok) {
          $('login-err').textContent = r.error;
        } else {
          $('login-err').style.color = '#4ade80';
          $('login-err').textContent = r.msg;
          G.UI.toast(r.msg, 5000);
        }
      };
    }
    // Vincular E-mail e Senha para recuperar e proteger a conta
    const recForm = $('rec-form');
    if (recForm) {
      recForm.onsubmit = async e => {
        e.preventDefault();
        $('rec-err').textContent = '';
        $('rec-email-btn').disabled = true;
        const email = $('rec-email').value;
        const pass = $('rec-pass').value;
        const r = await G.DB.linkEmail(email, pass);
        $('rec-email-btn').disabled = false;
        if (!r.ok) { $('rec-err').textContent = r.error; return; }
        $('scr-recover').classList.add('hidden');
        G.UI.toast('Conta vinculada ao e-mail ' + email + ' com sucesso! Agora você pode acessar com ele em qualquer dispositivo.', 5000);
      };
    }
    // Vincular Google/Gmail para recuperar a conta
    $('rec-link').onclick = async () => {
      $('rec-err').textContent = '';
      $('rec-link').disabled = true;
      const r = await G.DB.linkGoogle();
      $('rec-link').disabled = false;
      if (!r.ok) { $('rec-err').textContent = r.error; return; }
      $('scr-recover').classList.add('hidden');
      G.UI.toast('Conta Google vinculada com sucesso! Caso esqueça sua senha, entre com o Google.', 4500);
    };
    $('rec-later').onclick = () => $('scr-recover').classList.add('hidden');
    $('rec-never').onclick = () => {
      try { localStorage.setItem('ps.recover.no.' + G.DB.fb.uid, '1'); } catch (e) {}
      $('scr-recover').classList.add('hidden');
    };
    $('btn-google').onclick = async () => {
      $('login-err').textContent = '';
      $('btn-google').disabled = true;
      const r = await G.DB.loginWithGoogle();
      $('btn-google').disabled = false;
      if (!r.ok) { $('login-err').textContent = r.error; return; }
      G.Flow.afterLogin();
    };
  }

  let offered = false;
  function offerRecovery() {
    if (offered || G.DB.mode !== 'cloud' || !G.DB.fb || G.DB.hasEmail || G.DB.hasGoogle) return;
    try { if (localStorage.getItem('ps.recover.no.' + G.DB.fb.uid)) return; } catch (e) {}
    offered = true;
    $('rec-err').textContent = '';
    $('scr-recover').classList.remove('hidden');
  }

  function modeNote() {
    if (G.DB.mode === 'cloud') return 'Sua partida é salva na nuvem: acesse de qualquer dispositivo. Como convidado, o progresso não é salvo.';
    const why = G.DB.localReason === 'file'
      ? 'Aberto localmente: a partida só é salva neste navegador.'
      : G.DB.localReason === 'host'
        ? 'A partida é salva localmente neste navegador.'
      : G.DB.localReason === 'config'
        ? 'Nuvem não configurada: a partida é salva localmente neste navegador.'
        : 'Não foi possível conectar com a nuvem: a partida será salva neste navegador.';
    return why;
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('#scr-login .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === m));
    $('btn-auth').textContent = m === 'login' ? 'Entrar' : 'Criar Conta';
    $('f-pass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('login-err').textContent = '';
    const fb = $('forgot-box');
    if (fb) fb.classList.add('hidden');
    $('f-user').placeholder = m === 'login' ? 'Usuário ou seu@email.com' : 'Nome de usuário ou seu@email.com';
  }

  function open() {
    G.UI.chrome(false);
    G.UI.show('scr-login');
    if (!G.DB.storageOk) $('login-err').textContent = 'Este navegador bloqueou o armazenamento local: jogue como convidado.';
    $('btn-google').classList.toggle('hidden', G.DB.mode !== 'cloud');
    $('login-mode').textContent = modeNote();
    setTimeout(() => $('f-user').focus(), 50);
  }

  return { init, open, offerRecovery };
})();
