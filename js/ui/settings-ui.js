/* ============ settings-ui.js — pantalla de Ajustes (PC y móvil) ============
 * Se abre por encima de lo que haya (menú o pausa) y al cerrar vuelve ahí.
 * Pestañas: Sonido · Gráficos · Controles · Cuenta · Acerca de.
 * Los ajustes son de este dispositivo (G.Settings / G.Audio en el navegador).
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
    // Pantalla completa (si el navegador la permite; en iPhone, cómo conseguirla).
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

  // ---------------- pantalla completa ----------------
  function canFull() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  // iPhone: Safari no deja poner una web a pantalla completa (por eso a veces
  // no salía la opción). Sí se puede abriéndola desde la pantalla de inicio.
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => !!navigator.standalone || (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches);
  function iosTip() { return IOS && !canFull() && !standalone(); }
  const IOS_TIP = 'En iPhone, Safari no deja poner las webs a pantalla completa. Pulsa Compartir y luego "Añadir a pantalla de inicio": abriendo el juego desde ese icono se juega a pantalla completa.';
  function toggleFull() {
    if (!canFull()) { if (iosTip()) G.UI.toast(IOS_TIP, 9000); return; }
    if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const el = document.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      // En móvil, además se intenta fijar la pantalla en horizontal.
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* nada */ } }).catch(() => {});
    }
    setTimeout(() => { if (isOpen()) render(); }, 300);
  }

  // ---------------- piezas ----------------
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
      const curLang = (window.i18n && window.i18n.currentLang) || (G.I18n && G.I18n.currentLang) || 'pt-BR';
      const isPT = curLang === 'pt-BR';
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
      box.innerHTML = section('En móvil o tablet')
        + `<p class="sub">Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de abajo para cambiarlo, el botón ⚡ MEGA para activar la furia y el botón de arriba a la derecha para pausar. Se juega en horizontal.</p>`
        + `<div class="set-row"><div class="grow"><b>Tamaño del joystick</b><small>Cuánto hay que arrastrar el dedo.</small></div></div>`
        + choice('stick', [[0.8, 'Pequeño'], [1, 'Normal'], [1.25, 'Grande']])
        + `<div class="set-row"><div class="grow"><b>Colocar los botones</b><small>Pon los ataques, la pausa, el botón MEGA y el joystick (fijo, si quieres) donde quieras de la pantalla.</small></div>
             <button class="btn small" id="set-layout">Colocar</button></div>`
        + section('En PC')
        + `<div class="keys">
             <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / flechas</div><span>moverse</span>
             <div><kbd>Espacio</kbd> / <kbd>Space</kbd></div><span>activar modo Mega / Furia (al 100%)</span>
             <div><kbd>1</kbd>–<kbd>4</kbd> / clic en icono</div><span>elegir ataque</span>
             <div><kbd>Q</kbd> / <kbd>E</kbd> / <kbd>Tab</kbd></div><span>ataque anterior / siguiente</span>
             <div><kbd>+</kbd> / <kbd>−</kbd> / rueda ratón</div><span>zoom de la cámara (ampliar / reducir)</span>
             <div><kbd>Esc</kbd> / <kbd>P</kbd></div><span>pausa / reanudar</span>
             <div><kbd>1</kbd>–<kbd>3</kbd> / clic carta</div><span>elegir carta al subir de nivel</span>
             <div><kbd>R</kbd></div><span>cambiar cartas al subir de nivel (reroll)</span>
             <div><kbd>F2</kbd> / <kbd>'</kbd></div><span>panel de administración / depuración</span>
           </div>`;
    } else if (tab === 'acc') {
      renderAccount(box);
    } else {
      box.innerHTML = `<div class="about-logo" translate="no">PokéRift: Endless Hunt</div><p class="sub center">Versión ${esc(VERSION)}</p>`
        + `<p class="sub">Juego de fans <b>gratuito y sin ánimo de lucro</b>: sin anuncios ni compras. Pokémon y sus personajes son propiedad de Nintendo, Creatures y GAME FREAK; este proyecto no está afiliado a ellos.</p>`
        + section('Créditos')
        + `<ul class="credits">
             <li><b>Sprites:</b> PMD SpriteCollab y sus artistas (CC BY-NC 4.0).</li>
             <li><b>Datos de los Pokémon:</b> PokéAPI.</li>
             <li><b>Música y sonidos:</b> originales, generados por el propio juego.</li>
             <li><b>Fuente:</b> Pixelify Sans (OFL).</li>
           </ul>`
        + `<div class="row wrap" style="justify-content:center;gap:8px">
             ${window.PS_PAGES ? `<a class="btn small" href="${G.I18n.lang === 'en' ? 'en/guide/' : 'guia/'}" target="_blank">Guía y preguntas</a>
             <a class="btn small" href="${G.I18n.lang === 'en' ? 'en/pokedex/' : 'pokedex/'}" target="_blank">Pokédex</a>` : ''}
             <button class="btn small" data-legal>Aviso legal y privacidad</button>
             <a class="btn small" href="contacto/" target="_blank" rel="noopener">Contacto</a>
             <a class="btn small" href="${REPO}" target="_blank" rel="noopener">Código (GitHub)</a>
           </div>`;
    }
    wire(box);
  }

  function renderAccount(box) {
    const st = G.DB.guest ? 'guest' : G.DB.syncState;
    const SYNC = { ok: 'Guardado en la nube', syncing: 'Guardando…', pending: 'Pendiente de subir (se sube al salir del juego)',
                   offline: 'Sin conexión: se subirá al volver', local: 'Guardado sólo en este navegador', guest: 'Invitado: no se guarda' };
    if (G.DB.guest) {
      box.innerHTML = section('Cuenta', 'Estás jugando como <b>invitado</b>: tu progreso no se guarda al salir.')
        + `<button class="btn gold" id="set-login">Crear cuenta o entrar</button>`;
      return;
    }
    const nick = G.Social.me ? G.Social.me.name : (G.DB.user || '');
    const kind = G.DB.mode === 'local' ? 'Cuenta de este navegador' : G.DB.nameAccount ? 'Nombre y contraseña' : 'Google';
    box.innerHTML = section('Cuenta')
      + `<div class="set-row"><div class="grow"><b>Apodo</b><small>Es único y no se puede cambiar.</small></div><span class="gold" translate="no">${esc(nick)}</span></div>`
      + `<div class="set-row"><div class="grow"><b>Tipo de cuenta</b></div><span>${esc(kind)}</span></div>`
      + `<div class="set-row"><div class="grow"><b>Partida</b></div><span>${esc(SYNC[st] || st)}</span></div>`
      + `<div class="row wrap" style="gap:8px;margin-top:12px">
           <button class="btn" id="set-logout">Cerrar sesión</button>
           <button class="btn danger" id="set-delete">Borrar cuenta</button>
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
    const out = $('set-logout'); if (out) out.onclick = () => { close(); leave(); };
    const del = $('set-delete');
    if (del) del.onclick = async () => {
      const ok = await G.UI.confirmDelete();
      if (!ok) return;
      del.disabled = true;
      const r = await G.DB.deleteAccount(ok.pass);
      if (!r.ok) { $('set-msg').textContent = r.error; del.disabled = false; return; }
      close();
      G.UI.toast('Cuenta borrada');
      G.Audio.music(null);
      G.Flow.toLogin();
    };
  }

  /** Cerrar sesión (si estás en una partida, se abandona). */
  function leave() {
    if (G.DB.guest && !confirm('Eres invitado: se perderá todo el progreso. ¿Salir?')) return;
    if (G.Game.state !== 'ui') G.Game.quit && G.Game.quit();
    G.Audio.music(null);
    G.DB.logout().then(() => G.Flow.toLogin());
  }

  return { init, open, close, get isOpen() { return isOpen(); } };
})();
