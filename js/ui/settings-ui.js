/* ============ settings-ui.js — tela de Configurações (PC e mobile) ============
 * Abre sobre a tela atual (menu ou pausa) e ao fechar retorna ao mesmo local.
 * Abas: Som · Gráficos · Controles · Conta · Sobre.
 */
G.SettingsUI = (() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VERSION = '1.0 · 2026-10-20';
  const REPO = 'https://github.com/cardoso-ix/PokeSurvivor-Endless-Hunt';
  let tab = 'sound';

  function init() {
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => { b.onclick = () => { tab = b.dataset.t; render(); }; });
    $('set-close').onclick = close;
    $('btn-settings').innerHTML = G.Icons.html('gear', 20);
    $('btn-settings').onclick = () => open();
    $('btn-pause-settings').onclick = () => open('sound');
    if (canFull() || iosTip()) {
      $('btn-full').classList.remove('hidden');
      $('btn-full').innerHTML = G.Icons.html('full', 20);
      $('btn-full').onclick = toggleFull;
    }
    window.addEventListener('languageChanged', () => {
      if (isOpen()) render();
    });
  }

  function open(t) {
    if (t) tab = t;
    $('scr-settings').classList.remove('hidden');
    render();
  }
  function close() { $('scr-settings').classList.add('hidden'); }
  const isOpen = () => !$('scr-settings').classList.contains('hidden');

  function canFull() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => !!navigator.standalone || (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches);
  function iosTip() { return IOS && !canFull() && !standalone(); }
  const IOS_TIP = 'No iPhone, o Safari não permite tela cheia direta. Toque em Compartilhar e selecione "Adicionar à Tela de Início" para jogar em tela cheia.';
  function toggleFull() {
    if (!canFull()) { if (iosTip()) G.UI.toast(IOS_TIP, 9000); return; }
    if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const el = document.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
    }
    setTimeout(() => { if (isOpen()) render(); }, 300);
  }

  function section(title, sub) { return `<h3 class="set-h">${esc(title)}</h3>${sub ? `<p class="sub">${sub}</p>` : ''}`; }
  function toggle(key, label, desc, onText = 'Ativado', offText = 'Desativado') {
    const on = !!G.Settings.get(key);
    return `<div class="set-row"><div class="grow"><b>${esc(label)}</b><small>${esc(desc)}</small></div>
      <button class="btn small switch ${on ? 'gold' : ''}" data-k="${key}">${on ? onText : offText}</button></div>`;
  }
  function choice(key, opts) {
    const cur = G.Settings.get(key);
    return `<div class="chips set-chips">${opts.map(([v, l]) => `<button class="chip ${v === cur ? 'on' : ''}" data-k="${key}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
  }

  function zoomControl() {
    const curLang = (window.i18n && window.i18n.currentLang) || (G.I18n && G.I18n.currentLang) || 'pt-BR';
    const isPT = curLang === 'pt-BR';
    const curZoom = (typeof G === 'object' && G.Camera && G.Camera.zoom)
      ? G.Camera.zoom
      : (G.Settings.get('cameraZoom') || 1.25);
    const presets = isPT
      ? [[0.85, '0.85x Amplo'], [1.0, '1.0x Padrão'], [1.25, '1.25x Focado'], [1.5, '1.5x Próximo'], [1.75, '1.75x Detalhe']]
      : [[0.85, '0.85x Wide'], [1.0, '1.0x Standard'], [1.25, '1.25x Focused'], [1.5, '1.5x Close'], [1.75, '1.75x Detail']];
    return `
      <div class="set-row">
        <div class="grow">
          <b>${isPT ? 'Zoom da Câmera' : 'Camera Zoom'}</b>
          <small>${isPT ? 'Aumenta ou diminui o campo de visão da arena (zoom atual:' : 'Increase or decrease arena field of view (current zoom:'} <b class="gold">${curZoom.toFixed(2)}x</b>).</small>
        </div>
        <div class="row" style="gap:6px">
          <button class="btn small" id="cam-zoom-out" style="min-width:38px;font-weight:900" title="${isPT ? 'Diminuir Zoom (-)' : 'Zoom Out (-)'}">−</button>
          <span style="min-width:54px;text-align:center;font-weight:700;font-size:15px;color:var(--gold)" id="cam-zoom-val">${curZoom.toFixed(2)}x</span>
          <button class="btn small" id="cam-zoom-in" style="min-width:38px;font-weight:900" title="${isPT ? 'Aumentar Zoom (+)' : 'Zoom In (+)'}">+</button>
        </div>
      </div>
      <div class="chips set-chips" style="margin-top:6px;gap:6px">
        ${presets.map(([v, l]) => `<button class="chip ${Math.abs(v - curZoom) < 0.05 ? 'on' : ''}" data-cam-zoom="${v}">${l}</button>`).join('')}
      </div>
    `;
  }

  function render() {
    const curLang = (window.i18n && window.i18n.currentLang) || (G.I18n && G.I18n.currentLang) || 'pt-BR';
    const isPT = curLang === 'pt-BR';

    const tabLabels = {
      sound: window.i18n ? window.i18n.t('settings.tabs.sound') : 'Som',
      gfx: window.i18n ? window.i18n.t('settings.tabs.gfx') : 'Gráficos',
      ctl: window.i18n ? window.i18n.t('settings.tabs.ctl') : 'Controles',
      acc: window.i18n ? window.i18n.t('settings.tabs.acc') : 'Conta',
      about: window.i18n ? window.i18n.t('settings.tabs.about') : 'Sobre'
    };
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => {
      b.classList.toggle('on', b.dataset.t === tab);
      if (tabLabels[b.dataset.t]) b.textContent = tabLabels[b.dataset.t];
    });
    const modalTitle = document.querySelector('#scr-settings h2');
    if (modalTitle) modalTitle.textContent = window.i18n ? window.i18n.t('settings.title') : 'Configurações';
    const closeBtn = $('set-close');
    if (closeBtn) closeBtn.textContent = window.i18n ? window.i18n.t('common.close') : 'Fechar';
    const box = $('set-body');
    box.scrollTop = 0;
    if (tab === 'sound') {
      box.innerHTML = section(window.i18n ? window.i18n.t('settings.tabs.sound') : 'Som') + '<div id="set-sound" class="sound-inline"></div>';
      G.UI.soundControls($('set-sound'));
    } else if (tab === 'gfx') {
      const langOptions = [
        ['pt-BR', '🇧🇷 Português (BR)'],
        ['en-US', '🇺🇸 English']
      ];
      const langNotice = isPT
        ? 'A interface atualiza instantaneamente sem necessidade de recarregar.'
        : 'The interface updates instantly without reloading.';
      box.innerHTML = section(window.i18n ? window.i18n.t('settings.language') : 'Idioma / Language', langNotice)
        + `<div class="chips set-chips" translate="no" style="gap:8px">${langOptions.map(([v, l]) =>
             `<button class="chip ${curLang === v ? 'on' : ''}" data-lang="${v}" style="font-weight:bold;padding:6px 14px;">${l}</button>`).join('')}</div>`
        + section(isPT ? 'Qualidade Gráfica' : 'Quality', isPT ? 'Quantidade de efeitos e partículas desenhadas.' : 'Amount of effects and particles drawn.')
        + choice('quality', [['auto', isPT ? 'Automático' : 'Auto'], ['high', isPT ? 'Alta' : 'High'], ['mid', isPT ? 'Média' : 'Medium'], ['low', isPT ? 'Baixa' : 'Low']])
        + section(isPT ? 'Câmera & Visão' : 'Camera & View')
        + zoomControl()
        + toggle('cameraShake', isPT ? 'Trepidação da Câmera' : 'Camera Shake', isPT ? 'Ativa ou desativa sacudidas de tela ao receber dano ou explosões.' : 'Enable or disable screen shake on damage/explosions.', isPT ? 'Ativado' : 'Enabled', isPT ? 'Desativado' : 'Disabled')
        + toggle('cameraSmooth', isPT ? 'Seguimento Suave' : 'Smooth Follow', isPT ? 'Movimento suave e dinâmico da câmera acompanhando o Pokémon.' : 'Smooth camera tracking following the Pokémon.', isPT ? 'Ativado' : 'Enabled', isPT ? 'Desativado' : 'Disabled')
        + section(isPT ? 'Tela' : 'Screen')
        + toggle('dmgNumbers', isPT ? 'Números de Dano' : 'Damage Numbers', isPT ? 'Exibir números de dano ao acertar ou receber ataques.' : 'Show damage numbers on hits.', isPT ? 'Sim' : 'Yes', isPT ? 'Não' : 'No')
        + toggle('calm', isPT ? 'Modo Visual Calmo' : 'Calm Visual Mode', isPT ? 'Menos clarões e tremores de tela intensos.' : 'Fewer flashes and screen shakes.', isPT ? 'Sim' : 'Yes', isPT ? 'Não' : 'No')
        + toggle('fps', isPT ? 'Exibir FPS' : 'Show FPS', isPT ? 'Contador de quadros por segundo no canto inferior.' : 'Frames per second counter in the corner.', isPT ? 'Sim' : 'Yes', isPT ? 'Não' : 'No')
        + section('Interface / HUD')
        + toggle('showRadar', isPT ? 'Exibir Radar' : 'Show Radar', isPT ? 'Mostra o radar/mini-mapa de navegação no canto superior.' : 'Shows navigation mini-map in top corner.', isPT ? 'Ativado' : 'Enabled', isPT ? 'Desativado' : 'Disabled')
        + toggle('showBuffTable', isPT ? 'Exibir Tabela de Atributos' : 'Show Attributes Table', isPT ? 'Mostra a tabela de atributos e buffs no canto inferior.' : 'Shows stat attributes table in bottom corner.', isPT ? 'Ativado' : 'Enabled', isPT ? 'Desativado' : 'Disabled')
        + (canFull() ? `<div class="set-row"><div class="grow"><b>${isPT ? 'Tela Cheia' : 'Fullscreen'}</b><small>${isPT ? 'Sem barras do navegador.' : 'Without browser bars.'}</small></div>
             <button class="btn small" id="set-full">${isFull() ? (isPT ? 'Sair' : 'Exit') : (isPT ? 'Ativar' : 'Enable')}</button></div>`
           : iosTip() ? `<div class="set-row"><div class="grow"><b>${isPT ? 'Tela Cheia' : 'Fullscreen'}</b><small>${esc(IOS_TIP)}</small></div></div>` : '');
    } else if (tab === 'ctl') {
      box.innerHTML = section(isPT ? 'No Celular ou Tablet' : 'On Mobile or Tablet')
        + `<p class="sub">${isPT ? 'Toque e arraste em qualquer parte para se mover: o joystick surge onde você tocar. Toque em um ataque abaixo para selecioná-lo, use o botão ⚡ MEGA para ativar o Supremo e o botão superior direito para pausar. Jogue na horizontal.' : 'Touch and drag anywhere to move: the virtual joystick appears where you touch. Tap an attack below to switch, tap ⚡ MEGA to unleash Ultimate, and top-right to pause. Play in landscape mode.'}</p>`
        + `<div class="set-row"><div class="grow"><b>${isPT ? 'Tamanho do Joystick' : 'Joystick Size'}</b><small>${isPT ? 'Distância necessária para arrastar o dedo.' : 'Finger drag sensitivity distance.'}</small></div></div>`
        + choice('stick', [[0.8, isPT ? 'Pequeno' : 'Small'], [1, isPT ? 'Normal' : 'Normal'], [1.25, isPT ? 'Grande' : 'Large']])
        + `<div class="set-row"><div class="grow"><b>${isPT ? 'Posicionamento de Botões' : 'Button Layout'}</b><small>${isPT ? 'Ajuste os ataques, pausa, botão MEGA e joystick livremente pela tela.' : 'Position attack slots, pause, MEGA button and joystick anywhere on screen.'}</small></div>
             <button class="btn small" id="set-layout">${isPT ? 'Ajustar Layout' : 'Customize'}</button></div>`
        + section(isPT ? 'No Computador (PC)' : 'On PC')
        + `<div class="keys">
             <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / setas</div><span>${isPT ? 'mover-se' : 'move'}</span>
             <div><kbd>Espaço</kbd> / <kbd>Space</kbd></div><span>${isPT ? 'ativar Modo Mega / Supremo (com 100%)' : 'activate Mega / Ultimate mode (at 100%)'}</span>
             <div><kbd>1</kbd>–<kbd>4</kbd> / clique no ícone</div><span>${isPT ? 'selecionar ataque' : 'select attack'}</span>
             <div><kbd>Q</kbd> / <kbd>E</kbd> / <kbd>Tab</kbd></div><span>${isPT ? 'ataque anterior / próximo' : 'previous / next attack'}</span>
             <div><kbd>+</kbd> / <kbd>−</kbd> / roda do mouse</div><span>${isPT ? 'zoom da câmera (aproximar / afastar)' : 'camera zoom (in / out)'}</span>
             <div><kbd>Esc</kbd> / <kbd>P</kbd></div><span>${isPT ? 'pausar / continuar' : 'pause / resume'}</span>
             <div><kbd>1</kbd>–<kbd>3</kbd> / clique na carta</div><span>${isPT ? 'escolher carta ao subir de nível' : 'choose level-up card'}</span>
             <div><kbd>R</kbd></div><span>${isPT ? 'trocar cartas ao subir de nível (reroll)' : 'reroll cards on level up'}</span>
             <div><kbd>F2</kbd> / <kbd>'</kbd></div><span>${isPT ? 'painel de depuração / admin' : 'debug / admin panel'}</span>
           </div>`;
    } else if (tab === 'acc') {
      renderAccount(box, isPT);
    } else {
      box.innerHTML = `<div class="about-logo" translate="no">PokéRift: Endless Hunt</div><p class="sub center">${isPT ? 'Versão' : 'Version'} ${esc(VERSION)}</p>`
        + `<p class="sub">${isPT ? 'Jogo feito por fãs <b>gratuito e sem fins lucrativos</b>: sem anúncios nem microtransações. Pokémon e seus personagens são marcas registradas de Nintendo, Creatures e GAME FREAK. Este projeto não possui afiliação oficial.' : 'Free and non-profit fan-made game: no ads, no in-app purchases. Pokémon and its characters are trademarks of Nintendo, Creatures and GAME FREAK.'}</p>`
        + section(isPT ? 'Créditos' : 'Credits')
        + `<ul class="credits">
             <li><b>Sprites:</b> PMD SpriteCollab e artistas participantes (CC BY-NC 4.0).</li>
             <li><b>Dados dos Pokémon:</b> PokéAPI.</li>
             <li><b>Música e efeitos sonoros:</b> originais gerados pelo próprio jogo.</li>
             <li><b>Fonte:</b> Pixelify Sans (OFL).</li>
           </ul>`
        + `<div class="row wrap" style="justify-content:center;gap:8px">
             ${window.PS_PAGES ? `<a class="btn small" href="${G.I18n.lang === 'en' ? 'en/guide/' : 'guia/'}" target="_blank">${isPT ? 'Guia e Dúvidas' : 'Guide & FAQ'}</a>
             <a class="btn small" href="${G.I18n.lang === 'en' ? 'en/pokedex/' : 'pokedex/'}" target="_blank">Pokédex</a>` : ''}
             <button class="btn small" data-legal>${isPT ? 'Aviso Legal e Privacidade' : 'Legal Notice & Privacy'}</button>
             <a class="btn small" href="contacto/" target="_blank" rel="noopener">${isPT ? 'Contato' : 'Contact'}</a>
             <a class="btn small" href="${REPO}" target="_blank" rel="noopener">${isPT ? 'Código Fonte (GitHub)' : 'Source Code (GitHub)'}</a>
           </div>`;
    }
    wire(box);
  }

  function renderAccount(box, isPT = true) {
    const st = G.DB.guest ? 'guest' : G.DB.syncState;
    const SYNC = isPT ? {
      ok: 'Salvo na nuvem',
      syncing: 'Salvando…',
      pending: 'Pendente de envio (salvo ao sair)',
      offline: 'Sem conexão: enviará ao reconectar',
      local: 'Salvo neste navegador',
      guest: 'Convidado: não salvo na nuvem'
    } : {
      ok: 'Saved to cloud',
      syncing: 'Saving…',
      pending: 'Pending upload (saved on exit)',
      offline: 'Offline: will upload on return',
      local: 'Saved in this browser only',
      guest: 'Guest: not saved to cloud'
    };
    if (G.DB.guest) {
      box.innerHTML = section(isPT ? 'Conta' : 'Account', isPT ? 'Você está jogando como <b>convidado</b>: seu progresso não é salvo na nuvem ao sair.' : 'You are playing as <b>guest</b>: progress is not saved to cloud on exit.')
        + `<button class="btn gold" id="set-login">${isPT ? 'Criar conta ou entrar' : 'Create account or login'}</button>`;
      return;
    }
    const nick = G.Social.me ? G.Social.me.name : (G.DB.user || '');
    const email = G.DB.currentEmail ? G.DB.currentEmail : '';
    const isCloud = G.DB.mode === 'cloud';
    const kind = !isCloud
      ? (isPT ? 'Conta local deste navegador' : 'Local browser account')
      : G.DB.hasGoogle
        ? 'Google OAuth'
        : email
          ? (isPT ? 'E-mail e Senha' : 'Email and Password')
          : (isPT ? 'Nome de Usuário e Senha' : 'Username and Password');

    let emailRow = '';
    if (isCloud) {
      if (email) {
        emailRow = `<div class="set-row"><div class="grow"><b>${isPT ? 'E-mail Vinculado' : 'Linked Email'}</b><small>${isPT ? 'Sua conta está protegida com este e-mail.' : 'Your account is secured with this email.'}</small></div><span class="gold">${esc(email)}</span></div>`;
      } else if (!G.DB.hasGoogle) {
        emailRow = `<div class="set-row"><div class="grow"><b>${isPT ? 'Vincular E-mail' : 'Link Email'}</b><small>${isPT ? 'Proteja seu progresso para acessar de qualquer aparelho.' : 'Secure your progress to access from any device.'}</small></div><button class="btn gold small" id="set-link-email">${isPT ? 'Proteger Conta' : 'Protect Account'}</button></div>`;
      }
    }

    box.innerHTML = section(isPT ? 'Conta' : 'Account')
      + `<div class="set-row"><div class="grow"><b>${isPT ? 'Apelido de Treinador' : 'Trainer Nickname'}</b><small>${isPT ? 'Identificador único da sua conta.' : 'Unique identifier for your account.'}</small></div><span class="gold" translate="no">${esc(nick)}</span></div>`
      + `<div class="set-row"><div class="grow"><b>${isPT ? 'Tipo de Conta' : 'Account Type'}</b></div><span>${esc(kind)}</span></div>`
      + emailRow
      + `<div class="set-row"><div class="grow"><b>${isPT ? 'Sincronização da Partida' : 'Save Synchronization'}</b></div><span>${esc(SYNC[st] || st)}</span></div>`
      + `<div class="row wrap" style="gap:8px;margin-top:12px">
           <button class="btn" id="set-logout">${isPT ? 'Encerrar Sessão' : 'Log Out'}</button>
           <button class="btn danger" id="set-delete">${isPT ? 'Excluir Conta' : 'Delete Account'}</button>
         </div><p class="note" id="set-msg"></p>`;
  }

  function wire(box) {
    box.querySelectorAll('.switch[data-k]').forEach(b => { b.onclick = () => { G.Settings.set(b.dataset.k, !G.Settings.get(b.dataset.k)); render(); }; });
    box.querySelectorAll('.chip[data-k]').forEach(b => {
      b.onclick = () => { const v = b.dataset.v; G.Settings.set(b.dataset.k, isNaN(+v) ? v : +v); render(); };
    });
    const zOut = $('cam-zoom-out');
    if (zOut) zOut.onclick = () => {
      const cur = (G.Camera && G.Camera.zoom) ? G.Camera.zoom : (G.Settings.get('cameraZoom') || 1.25);
      const next = Math.max(0.70, Math.round((cur - 0.10) * 100) / 100);
      if (G.Camera) G.Camera.setZoom(next);
      G.Settings.set('cameraZoom', next);
      render();
    };
    const zIn = $('cam-zoom-in');
    if (zIn) zIn.onclick = () => {
      const cur = (G.Camera && G.Camera.zoom) ? G.Camera.zoom : (G.Settings.get('cameraZoom') || 1.25);
      const next = Math.min(2.50, Math.round((cur + 0.10) * 100) / 100);
      if (G.Camera) G.Camera.setZoom(next);
      G.Settings.set('cameraZoom', next);
      render();
    };
    box.querySelectorAll('[data-cam-zoom]').forEach(b => {
      b.onclick = () => {
        const v = parseFloat(b.dataset.camZoom);
        if (!isNaN(v)) {
          if (G.Camera) G.Camera.setZoom(v);
          G.Settings.set('cameraZoom', v);
          render();
        }
      };
    });
    const full = $('set-full'); if (full) full.onclick = toggleFull;
    const lay = $('set-layout'); if (lay) lay.onclick = () => G.LayoutUI.open();
    box.querySelectorAll('[data-lang]').forEach(b => {
      b.onclick = () => {
        const targetLang = b.dataset.lang;
        if (window.i18n && typeof window.i18n.setLanguage === 'function') {
          window.i18n.setLanguage(targetLang);
        } else if (G.I18n && typeof G.I18n.set === 'function') {
          G.I18n.set(targetLang);
        }
        render();
      };
    });
    const lo = $('set-login'); if (lo) lo.onclick = () => { close(); leave(); };
    const lnk = $('set-link-email');
    if (lnk) {
      lnk.onclick = () => {
        close();
        const sc = $('scr-recover');
        if (sc) {
          $('rec-err').textContent = '';
          sc.classList.remove('hidden');
        }
      };
    }
    const out = $('set-logout'); if (out) out.onclick = () => { close(); leave(); };
    const del = $('set-delete');
    if (del) del.onclick = async () => {
      const ok = await G.UI.confirmDelete();
      if (!ok) return;
      del.disabled = true;
      const r = await G.DB.deleteAccount(ok.pass);
      if (!r.ok) { $('set-msg').textContent = r.error; del.disabled = false; return; }
      close();
      G.UI.toast('Conta excluída com sucesso.');
      G.Audio.music(null);
      G.Flow.toLogin();
    };
  }

  function leave() {
    if (G.DB.guest && !confirm('Você está como convidado: todo o progresso não salvo será perdido. Deseja sair?')) return;
    if (G.Game.state !== 'ui') G.Game.quit && G.Game.quit();
    G.Audio.music(null);
    G.DB.logout().then(() => G.Flow.toLogin());
  }

  return { init, open, close, get isOpen() { return isOpen(); } };
})();
