/* ============ settings.js — ajustes de este dispositivo ============
 * Se guardan en el navegador (no en la cuenta): cada PC o móvil tiene los
 * suyos. El volumen lo guarda audio.js aparte.
 *
 *   quality     'auto' | 'high' | 'mid' | 'low'   efectos y partículas
 *   dmgNumbers  true/false                        números de daño
 *   calm        true/false                        menos sacudidas y destellos
 *   fps         true/false                        contador de FPS
 *   stick       0.8 | 1 | 1.25                    tamaño del joystick táctil
 *   stickMode   'float' | 'fixed'                 joystick donde pones el dedo, o siempre en su sitio
 *   pad         { bar, pause, stick } | null      dónde van los botones en móvil (centro, en
 *                                                 proporción a la pantalla); lo pone layout-ui.js
 *
 *   G.Settings.get('quality')  ·  G.Settings.set('fps', true)  ·  G.Settings.on(fn)
 *   G.Settings.fx   nivel efectivo 0 (bajo) .. 2 (alto), ya resuelto el 'auto'
 */
G.Settings = (() => {
  const KEY = 'ps.settings';
  const DEF = {
    quality: 'auto',
    dmgNumbers: true,
    calm: false,
    fps: false,
    stick: 1,
    stickMode: 'float',
    pad: null,
    cameraZoom: typeof localStorage !== 'undefined' && localStorage.getItem('poke_camera_zoom') !== null
      ? parseFloat(localStorage.getItem('poke_camera_zoom')) || 1.25
      : 1.25,
    cameraShake: typeof localStorage !== 'undefined' && localStorage.getItem('poke_camera_shake') !== null
      ? localStorage.getItem('poke_camera_shake') !== 'false'
      : true,
    cameraSmooth: typeof localStorage !== 'undefined' && localStorage.getItem('poke_camera_smooth') !== null
      ? localStorage.getItem('poke_camera_smooth') !== 'false'
      : true,
    showRadar: typeof localStorage !== 'undefined' && localStorage.getItem('poke_show_radar') !== null
      ? localStorage.getItem('poke_show_radar') !== 'false'
      : true,
    showBuffTable: typeof localStorage !== 'undefined' && localStorage.getItem('poke_show_buff_table') !== null
      ? localStorage.getItem('poke_show_buff_table') !== 'false'
      : true
  };
  let s = Object.assign({}, DEF);
  try { Object.assign(s, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* nada */ }

  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem('poke_camera_zoom') !== null) {
      const z = parseFloat(localStorage.getItem('poke_camera_zoom'));
      if (!isNaN(z) && z > 0) s.cameraZoom = z;
    }
    if (localStorage.getItem('poke_camera_shake') !== null) {
      s.cameraShake = localStorage.getItem('poke_camera_shake') !== 'false';
    }
    if (localStorage.getItem('poke_camera_smooth') !== null) {
      s.cameraSmooth = localStorage.getItem('poke_camera_smooth') !== 'false';
    }
    if (localStorage.getItem('poke_show_radar') !== null) {
      s.showRadar = localStorage.getItem('poke_show_radar') !== 'false';
    }
    if (localStorage.getItem('poke_show_buff_table') !== null) {
      s.showBuffTable = localStorage.getItem('poke_show_buff_table') !== 'false';
    }
  }

  const fns = new Set();

  // Calidad automática: empieza alta (media en móvil) y baja si va a tirones.
  const touchy = matchMedia('(pointer: coarse)').matches;
  let autoLevel = touchy ? 1 : 2;
  let acc = 0, frames = 0, slowT = 0, fastT = 0;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* nada */ } }
  function get(k) { return s[k]; }
  function set(k, v) {
    s[k] = v;
    if (k === 'cameraZoom') {
      try { localStorage.setItem('poke_camera_zoom', String(v)); } catch (e) {}
      if (typeof G === 'object' && G.Camera && G.Camera.zoom !== v && G.Camera.setZoom) {
        G.Camera.setZoom(v);
      }
    }
    if (k === 'cameraShake') {
      try { localStorage.setItem('poke_camera_shake', String(v)); } catch (e) {}
    }
    if (k === 'cameraSmooth') {
      try { localStorage.setItem('poke_camera_smooth', String(v)); } catch (e) {}
    }
    if (k === 'showRadar') {
      try { localStorage.setItem('poke_show_radar', String(v)); } catch (e) {}
    }
    if (k === 'showBuffTable') {
      try { localStorage.setItem('poke_show_buff_table', String(v)); } catch (e) {}
    }
    save();
    fns.forEach(fn => { try { fn(k, v); } catch (e) { /* nada */ } });
  }

  // Integração global userSettings
  if (typeof window !== 'undefined') {
    window.userSettings = {
      get cameraZoom() { return get('cameraZoom') || 1.25; },
      set cameraZoom(v) { set('cameraZoom', Number(v) || 1.25); },
      get cameraShake() { return get('cameraShake') !== false; },
      set cameraShake(v) { set('cameraShake', !!v); },
      get cameraSmooth() { return get('cameraSmooth') !== false; },
      set cameraSmooth(v) { set('cameraSmooth', !!v); },
      get showRadar() { return get('showRadar') !== false; },
      set showRadar(v) { set('showRadar', !!v); },
      get showBuffTable() { return get('showBuffTable') !== false; },
      set showBuffTable(v) { set('showBuffTable', !!v); }
    };
  }

  /** Lo llama el bucle del juego en cada fotograma (sólo durante la partida). */
  function sample(dt) {
    if (s.quality !== 'auto' || dt <= 0) return;
    acc += dt; frames++;
    if (acc < 1) return;
    const fps = frames / acc;
    acc = 0; frames = 0;
    // 3 s seguidos por debajo de 45 FPS: baja un nivel; 8 s por encima de 57: sube.
    if (fps < 45) { slowT++; fastT = 0; } else if (fps > 57) { fastT++; slowT = 0; } else { slowT = fastT = 0; }
    if (slowT >= 3 && autoLevel > 0) { autoLevel--; slowT = 0; }
    if (fastT >= 8 && autoLevel < (touchy ? 1 : 2)) { autoLevel++; fastT = 0; }
  }

  return {
    get, set, sample, DEF,
    on(fn) { fns.add(fn); },
    get all() { return Object.assign({}, s); },
    get fx() { return s.quality === 'auto' ? autoLevel : s.quality === 'high' ? 2 : s.quality === 'mid' ? 1 : 0; },
    get autoLevel() { return autoLevel; },
    get touch() { return touchy; }
  };
})();
