/* ============ mega_scene.js — Cutscene + cenário em pixel art do Mega ============
 * Ao ativar o Mega (Espaço/M/botão): o mundo congela, entra uma cutscene com o Pokémon no centro
 * e, ao terminar, o cenário da tela inteira muda conforme o tipo (18 cenas: meteoros, ondas, raios...).
 * Tudo é desenhado em um canvas de baixa resolução (PIX px por pixel) e ampliado sem suavização,
 * só com retângulos/linhas de 1 px: nada de gradientes, para manter a essência pixel art do jogo.
 * O dano real continua em mega_skill_vfx.js; aqui é só a parte visual.
 */
(function () {
  // G vem do escopo externo: global no dev.html, variável do bundle (função) no build de produção
  const INTRO = 2.0;
  const MAX_P = 220;
  const FONT = "'Pixelify', 'Press Start 2P', monospace";

  const R = (a, b) => a + Math.random() * (b - a);
  const clamp01 = v => Math.max(0, Math.min(1, v));

  // ---------- cores ----------
  function hexRgb(h) {
    h = String(h || '#ffffff').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(h, to, f) {
    const a = hexRgb(h);
    return 'rgb(' + a.map(v => Math.round(v + (to - v) * f)).join(',') + ')';
  }
  // rampa de 4 tons: escuro, base, claro, branco
  function ramp(base, accent) {
    return [mix(base, 0, 0.55), base, accent || mix(base, 255, 0.4), '#ffffff'];
  }

  // ---------- definição das 18 cenas ----------
  // emit: [tipo da partícula, taxa/s, modo de nascimento, índice de cor na rampa]
  const DEFS = {
    fire:     { tint: 0.30, dark: 0.20, emit: [['ember', 70, 'rise', 2], ['meteor', 5, 'meteor', 1]] },
    water:    { tint: 0.28, dark: 0.10, emit: [['bubble', 14, 'rise', 3], ['streak', 34, 'rain', 2]], sp: 'waves' },
    grass:    { tint: 0.24, dark: 0.10, emit: [['leaf', 30, 'gust', 1], ['leaf', 9, 'fall', 2]], sp: 'vines' },
    electric: { tint: 0.14, dark: 0.45, emit: [['spark', 60, 'burst', 2]], sp: 'bolts' },
    ice:      { tint: 0.30, dark: 0.08, emit: [['flake', 50, 'snow', 3], ['shard', 2.6, 'meteor', 2]], sp: 'frost' },
    fighting: { tint: 0.28, dark: 0.30, emit: [['rock', 11, 'upward', 1], ['spark', 30, 'burst', 2]], sp: 'rings' },
    poison:   { tint: 0.30, dark: 0.30, emit: [['bubble', 24, 'rise', 1], ['wisp', 3.2, 'fog', 0]] },
    ground:   { tint: 0.28, dark: 0.25, emit: [['wisp', 6, 'dust', 1], ['rock', 12, 'upward', 0], ['boulder', 1.6, 'meteor', 0]], sp: 'quake' },
    flying:   { tint: 0.20, dark: 0.00, emit: [['streak', 80, 'wind', 3], ['leaf', 8, 'gust', 2]] },
    psychic:  { tint: 0.30, dark: 0.35, emit: [['sparkle', 26, 'float', 2]], sp: 'spiral' },
    bug:      { tint: 0.25, dark: 0.25, emit: [['spark', 60, 'swarm', 2]] },
    rock:     { tint: 0.30, dark: 0.30, emit: [['boulder', 3.2, 'meteor', 1], ['wisp', 6, 'dust', 2]], sp: 'quake' },
    ghost:    { tint: 0.34, dark: 0.60, emit: [['wisp', 5, 'float', 1], ['sparkle', 12, 'float', 2]], sp: 'eyes' },
    dragon:   { tint: 0.30, dark: 0.35, emit: [['streak', 34, 'diag', 2], ['ember', 30, 'rise', 1]], sp: 'rays' },
    dark:     { tint: 0.40, dark: 0.55, emit: [], sp: 'tendrils' },
    steel:    { tint: 0.24, dark: 0.20, emit: [['blade', 5.5, 'diag', 3], ['spark', 26, 'burst', 3]] },
    fairy:    { tint: 0.28, dark: 0.00, emit: [['sparkle', 48, 'float', 3], ['sparkle', 16, 'float', 2]], sp: 'rays' },
    normal:   { tint: 0.22, dark: 0.20, emit: [['spark', 30, 'burst', 2]], sp: 'rays' }
  };

  // ---------- estado ----------
  const pool = Array.from({ length: MAX_P }, () => ({ a: false }));
  const S = {
    phase: 'idle', t: 0, st: 0, flash: 0,
    type: 'normal', def: DEFS.normal, cfg: null, pal: ramp('#ffffff'),
    pl: null, onDone: null, acc: [], bolts: [], ringT: 0, kickT: 0, boltT: 0,
    name: 'POKÉMON',
    lo: null, lctx: null, lw: 0, lh: 0, pix: 4, tintPat: null, darkPat: null
  };

  function newP() { for (let i = 0; i < MAX_P; i++) if (!pool[i].a) return pool[i]; return null; }

  function ensureLow(w, h) {
    const pix = w < 700 ? 3 : 4;
    const lw = Math.ceil(w / pix), lh = Math.ceil(h / pix);
    if (S.lo && S.lw === lw && S.lh === lh && S.pix === pix) return;
    S.lo = document.createElement('canvas');
    S.lo.width = lw; S.lo.height = lh;
    S.lctx = S.lo.getContext('2d');
    S.lw = lw; S.lh = lh; S.pix = pix;
  }

  // padrão xadrez 2x2 (dithering): metade dos pixels pintados
  function checker(color) {
    const c = document.createElement('canvas'); c.width = 2; c.height = 2;
    const x = c.getContext('2d'); x.fillStyle = color;
    x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1);
    return x.createPattern(c, 'repeat');
  }

  // ---------- primitivas de pixel ----------
  function px(c, x, y, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
  function line(c, x0, y0, x1, y1, col, th) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, n = 0;
    c.fillStyle = col;
    while (n++ < 600) {
      c.fillRect(x0, y0, th || 1, th || 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function circle(c, cx, cy, r, col) { // contorno por ponto-médio
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    if (r < 1) { px(c, cx, cy, col); return; }
    c.fillStyle = col;
    let x = r, y = 0, err = 1 - r;
    while (x >= y) {
      c.fillRect(cx + x, cy + y, 1, 1); c.fillRect(cx - x, cy + y, 1, 1);
      c.fillRect(cx + x, cy - y, 1, 1); c.fillRect(cx - x, cy - y, 1, 1);
      c.fillRect(cx + y, cy + x, 1, 1); c.fillRect(cx - y, cy + x, 1, 1);
      c.fillRect(cx + y, cy - x, 1, 1); c.fillRect(cx - y, cy - x, 1, 1);
      y++;
      if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
    }
  }
  function disc(c, cx, cy, r, col, dither) { // preenchido (com xadrez opcional)
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    c.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const hw = Math.floor(Math.sqrt(r * r - y * y));
      if (!dither) { c.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); continue; }
      for (let x = -hw; x <= hw; x++) if (((x + y + cx + cy) & 1) === 0) c.fillRect(cx + x, cy + y, 1, 1);
    }
  }

  // ---------- nascimento das partículas ----------
  function spawn(kind, mode, ci) {
    const p = newP(); if (!p) return;
    const lw = S.lw, lh = S.lh;
    p.a = true; p.k = kind; p.ci = ci; p.s = 1; p.g = 0; p.wob = 0; p.land = 0; p.rot = 0;
    switch (mode) {
      case 'rise':   p.x = R(0, lw); p.y = lh + 2; p.vx = R(-8, 8); p.vy = -R(25, 60); p.s = R(1, 2.2); p.life = R(1, 2.2); break;
      case 'meteor': p.x = R(lw * 0.2, lw * 1.2); p.y = -6; p.vx = -R(40, 70); p.vy = R(120, 170); p.ty = R(lh * 0.35, lh * 0.95); p.land = 1; p.s = R(2, 3); p.life = 6; break;
      case 'rain':   p.x = R(0, lw * 1.2); p.y = -4; p.vx = -22; p.vy = R(120, 180); p.life = 3; break;
      case 'gust':   p.x = -3; p.y = R(0, lh); p.vx = R(60, 110); p.vy = R(-15, 15); p.wob = 1; p.life = 4; break;
      case 'fall':   p.x = R(0, lw); p.y = -3; p.vx = R(-10, 10); p.vy = R(15, 30); p.wob = 1; p.life = 6; break;
      case 'burst':  p.x = R(0, lw); p.y = R(0, lh); p.vx = R(-30, 30); p.vy = R(-30, 30); p.life = R(0.3, 0.7); break;
      case 'snow':   p.x = R(0, lw); p.y = -2; p.vx = R(-8, 8); p.vy = R(15, 35); p.life = 7; break;
      case 'upward': p.x = R(0, lw); p.y = lh + 2; p.vx = R(-20, 20); p.vy = -R(60, 110); p.g = 130; p.s = R(1, 2.5); p.life = 3; break;
      case 'fog':    p.x = R(0, lw); p.y = R(lh * 0.4, lh); p.vx = R(-6, 6); p.vy = R(-6, 0); p.s = R(8, 16); p.life = R(2, 3.5); break;
      case 'dust':   p.x = R(0, lw); p.y = R(lh * 0.6, lh); p.vx = R(-12, 12); p.vy = R(-12, -2); p.s = R(5, 11); p.life = R(1.2, 2.2); break;
      case 'wind':   p.x = lw + 3; p.y = R(0, lh); p.vx = -R(160, 260); p.vy = R(-4, 4); p.s = R(6, 14); p.life = 2; break;
      case 'float':  p.x = R(0, lw); p.y = R(0, lh); p.vx = R(-4, 4); p.vy = -R(2, 10); p.s = R(3, 7); p.life = R(1, 2.5); break;
      case 'swarm':  p.x = R(0, lw); p.y = R(0, lh); p.vx = R(-25, 25); p.vy = R(-25, 25); p.wob = 2; p.life = R(1.5, 3); break;
      case 'diag':   p.x = R(0, lw * 1.3); p.y = -5; p.vx = -R(60, 90); p.vy = R(60, 90); p.s = R(8, 16); p.life = 3; break;
    }
    p.max = p.life;
    p.rot = R(0, 6.28);
  }

  function impact(x, y) {
    const p = newP();
    if (p) { p.a = true; p.k = 'ring'; p.ci = 2; p.x = x; p.y = y; p.vx = p.vy = p.g = 0; p.wob = 0; p.land = 0; p.s = 14; p.life = p.max = 0.45; }
    for (let i = 0; i < 5; i++) {
      const q = newP(); if (!q) break;
      q.a = true; q.k = 'spark'; q.ci = 2; q.x = x; q.y = y; q.vx = R(-45, 45); q.vy = -R(20, 70); q.g = 160;
      q.s = 1; q.wob = 0; q.land = 0; q.life = q.max = R(0.3, 0.7);
    }
    if (S.kickT <= 0 && G.Camera && G.Camera.kick) { G.Camera.kick(0.10); S.kickT = 0.25; }
  }

  function updateParticles(dt) {
    for (let i = 0; i < MAX_P; i++) {
      const p = pool[i]; if (!p.a) continue;
      if (p.wob) {
        const j = p.wob === 2 ? 900 : 60;
        p.vx += R(-j, j) * dt; p.vy += R(-j, j) * dt;
        if (p.wob === 2) { p.vx = Math.max(-40, Math.min(40, p.vx)); p.vy = Math.max(-40, Math.min(40, p.vy)); }
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.land && p.y >= p.ty) { p.a = false; impact(p.x, p.y); continue; }
      if (p.life <= 0 || p.x > S.lw + 24 || p.x < -24 || p.y > S.lh + 14 || p.y < -30) p.a = false;
    }
  }

  // ---------- desenho das partículas ----------
  function drawParticle(c, p) {
    const col = S.pal[p.ci] || '#fff';
    const f = p.life / p.max;
    const x = p.x, y = p.y;
    switch (p.k) {
      case 'ember': case 'spark':
        rect(c, x, y, p.s > 1.6 ? 2 : 1, p.s > 1.6 ? 2 : 1, f > 0.5 ? col : S.pal[Math.max(0, p.ci - 1)]); break;
      case 'bubble': circle(c, x, y, p.s + 1, col); px(c, x - 1, y - 1, '#fff'); break;
      case 'flake': px(c, x, y, col); px(c, x - 1, y, col); px(c, x + 1, y, col); px(c, x, y - 1, col); px(c, x, y + 1, col); break;
      case 'sparkle':
        if (((p.life * 8) | 0) % 2 === 0 || f > 0.7) {
          const r = Math.max(1, Math.round(p.s / 2.5));
          for (let k = -r; k <= r; k++) { px(c, x + k, y, col); px(c, x, y + k, col); }
          px(c, x, y, '#fff');
        } break;
      case 'leaf': rect(c, x, y, 3, 2, col); px(c, x + (p.vx > 0 ? 3 : -1), y + 1, S.pal[0]); break;
      case 'streak': {
        const L = p.s, m = Math.hypot(p.vx, p.vy) || 1;
        line(c, x, y, x - p.vx / m * L, y - p.vy / m * L, col); px(c, x, y, '#fff'); break;
      }
      case 'blade': {
        const m = Math.hypot(p.vx, p.vy) || 1;
        line(c, x, y, x - p.vx / m * p.s, y - p.vy / m * p.s, S.pal[2], 2); px(c, x, y, '#fff'); break;
      }
      case 'meteor': case 'shard': {
        const m = Math.hypot(p.vx, p.vy) || 1, ux = p.vx / m, uy = p.vy / m;
        for (let k = 1; k <= 14; k++) px(c, x - ux * k, y - uy * k, k < 5 ? S.pal[2] : k < 10 ? S.pal[1] : S.pal[0]);
        const sz = Math.round(p.s) + 1;
        rect(c, x - sz / 2, y - sz / 2, sz, sz, S.pal[1]);
        rect(c, x - sz / 2 + 1, y - sz / 2 + 1, sz - 2 > 0 ? sz - 2 : 1, sz - 2 > 0 ? sz - 2 : 1, '#fff');
        break;
      }
      case 'rock': case 'boulder': {
        const sz = p.k === 'boulder' ? 5 : Math.round(p.s) + 1;
        rect(c, x, y, sz, sz, '#6b6258'); rect(c, x, y, sz - 1, 1, '#a39a8c'); rect(c, x + sz - 1, y + 1, 1, sz - 1, '#3b352e');
        break;
      }
      case 'wisp': disc(c, x, y, p.s * (0.6 + 0.4 * f), S.pal[p.ci], true); break;
      case 'ring': circle(c, x, y, p.s * (1 - f) + 1, f > 0.5 ? '#fff' : S.pal[p.ci]); break;
    }
  }

  // ---------- cenários especiais ----------
  function spWaves(c, k, t) {
    const lw = S.lw, lh = S.lh;
    const lvl = lh * (1 - 0.40 * k * (0.65 + 0.35 * Math.sin(t * 1.3)));
    for (let L = 0; L < 3; L++) {
      const base = lvl + L * 9, amp = 5 - L, ph = t * (2.2 + L * 0.7) * (L % 2 ? -1 : 1);
      const colr = S.pal[L === 0 ? 2 : 1];
      c.fillStyle = L === 2 ? S.pal[0] : colr;
      for (let x = 0; x < lw; x++) {
        const y = Math.round(base + Math.sin(x * 0.11 + ph) * amp + Math.sin(x * 0.27 - ph * 1.3) * 1.5);
        c.fillRect(x, y, 1, lh - y);
        if (L < 2) { c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 1); c.fillStyle = colr; }
      }
    }
  }
  function spVines(c, k, t) {
    const lw = S.lw, lh = S.lh;
    for (let i = 0; i < 9; i++) {
      const x0 = (i + 0.5) * lw / 9, len = lh * 0.55 * k * (0.7 + 0.3 * Math.sin(i * 1.7 + t));
      for (let y = 0; y < len; y++) {
        const x = x0 + Math.sin(y * 0.12 + i + t * 1.2) * 5;
        px(c, x, lh - y, S.pal[1]); px(c, x + 1, lh - y, S.pal[0]);
        if (y % 11 === 5) { rect(c, x + 2, lh - y - 1, 3, 2, S.pal[2]); rect(c, x - 4, lh - y - 2, 3, 2, S.pal[2]); }
      }
    }
  }
  function spBolts(c, dt, k) {
    S.boltT -= dt;
    if (S.boltT <= 0 && k > 0.5) {
      S.boltT = R(0.3, 0.7);
      const pts = []; let x = R(S.lw * 0.1, S.lw * 0.9), y = 0;
      const endY = R(S.lh * 0.5, S.lh * 0.95);
      while (y < endY) { pts.push([x, y]); x += R(-9, 9); y += R(7, 14); }
      pts.push([x, endY]);
      S.bolts.push({ pts, life: 0.28 });
      S.flash = Math.max(S.flash, 0.22);
      if (G.Camera && G.Camera.kick) G.Camera.kick(0.15);
      impact(x, endY);
    }
    for (let i = S.bolts.length - 1; i >= 0; i--) {
      const b = S.bolts[i]; b.life -= dt;
      if (b.life <= 0) { S.bolts.splice(i, 1); continue; }
      for (let j = 1; j < b.pts.length; j++) {
        line(c, b.pts[j - 1][0], b.pts[j - 1][1], b.pts[j][0], b.pts[j][1], S.pal[2], 3);
        line(c, b.pts[j - 1][0] + 1, b.pts[j - 1][1], b.pts[j][0] + 1, b.pts[j][1], '#fff', 1);
      }
    }
  }
  function spFrost(c, k) {
    const lw = S.lw, lh = S.lh, d = 10 * k;
    for (let x = 0; x < lw; x++) {
      const h1 = d * (0.5 + 0.5 * Math.sin(x * 0.7) * Math.sin(x * 0.31 + 1));
      rect(c, x, 0, 1, Math.round(h1), x % 3 ? S.pal[2] : '#fff');
      rect(c, x, lh - Math.round(h1), 1, Math.round(h1), x % 3 ? S.pal[2] : '#fff');
    }
    for (let y = 0; y < lh; y++) {
      const h1 = d * (0.5 + 0.5 * Math.sin(y * 0.6 + 2));
      rect(c, 0, y, Math.round(h1), 1, y % 3 ? S.pal[2] : '#fff');
      rect(c, lw - Math.round(h1), y, Math.round(h1), 1, y % 3 ? S.pal[2] : '#fff');
    }
  }
  function spRings(c, dt, k, period) {
    S.ringT -= dt;
    if (S.ringT <= 0 && k > 0.4) {
      S.ringT = period;
      const p = newP();
      if (p) { p.a = true; p.k = 'ring'; p.ci = 2; p.x = S.lw / 2; p.y = S.lh / 2; p.vx = p.vy = p.g = 0; p.wob = 0; p.land = 0; p.s = S.lw * 0.5; p.life = p.max = 0.9; }
    }
  }
  function spSpiral(c, k, t) {
    const cx = S.lw / 2, cy = S.lh / 2;
    for (let arm = 0; arm < 4; arm++) {
      for (let i = 2; i < 60; i++) {
        const r = i * 3.2 * k, a = t * 1.8 + arm * 1.571 + i * 0.22;
        rect(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75, 2, 2, i % 6 === 0 ? '#fff' : S.pal[i > 30 ? 1 : 2]);
      }
    }
  }
  function spRays(c, k, t) {
    const cx = S.lw / 2, cy = S.lh / 2, L = Math.max(S.lw, S.lh);
    for (let i = 0; i < 14; i++) {
      const a = t * 0.5 + i * (6.283 / 14);
      line(c, cx + Math.cos(a) * 24, cy + Math.sin(a) * 18, cx + Math.cos(a) * L * k, cy + Math.sin(a) * L * k, i % 2 ? S.pal[1] : S.pal[2]);
    }
  }
  function spQuake(dt, k) {
    S.kickT -= dt;
    if (k > 0.6 && S.kickT <= 0 && G.Camera && G.Camera.kick) { G.Camera.kick(0.22); S.kickT = 0.6; }
  }
  function spTendrils(c, k, t) {
    const lw = S.lw, lh = S.lh;
    for (let i = 0; i < 14; i++) {
      const side = i % 4, off = (i * 0.0711 + 0.05) % 1;
      let x = side === 0 ? 0 : side === 1 ? lw : off * lw, y = side === 2 ? 0 : side === 3 ? lh : off * lh;
      const tx = lw / 2 + Math.sin(t + i) * 8, ty = lh / 2 + Math.cos(t * 1.1 + i) * 6;
      const steps = Math.round(34 * k * (0.6 + 0.4 * Math.sin(t * 1.5 + i)));
      for (let s = 0; s < steps; s++) {
        x += (tx - x) * 0.045 + Math.sin(s * 0.5 + i + t * 2) * 1.2;
        y += (ty - y) * 0.045 + Math.cos(s * 0.45 + i + t * 2) * 1.2;
        rect(c, x, y, 2, 2, s % 5 === 0 ? '#2a1140' : '#07030c');
      }
    }
  }
  function spEyes(c, k, t) {
    for (let i = 0; i < 7; i++) {
      if (Math.sin(t * 1.3 + i * 2.1) < 0.2) continue;
      const x = (i * 0.137 + 0.08) * S.lw * 1.05 % S.lw, y = ((i * 0.291 + 0.1) % 0.8 + 0.08) * S.lh;
      rect(c, x, y, 2, 1, '#ff3b5c'); rect(c, x + 5, y, 2, 1, '#ff3b5c');
    }
  }

  // ---------- API ----------
  function tryFont(px) { return `700 ${px}px ${FONT}`; }

  const MegaScene = {
    get phase() { return S.phase; },
    get active() { return S.phase !== 'idle'; },
    get introActive() { return S.phase === 'intro'; },
    DEFS,

    canPlay() { return typeof document !== 'undefined' && typeof document.createElement === 'function'; },

    start(type, pl, onDone) {
      const vfx = (typeof MegaSkillVFXManager !== 'undefined') ? MegaSkillVFXManager : G.MegaSkillVFXManager;
      S.type = DEFS[type] ? type : 'normal';
      S.def = DEFS[S.type];
      S.cfg = (vfx && vfx.getTypeConfig) ? vfx.getTypeConfig(S.type) : null;
      const base = (S.cfg && S.cfg.color) || '#ffffff', acc = (S.cfg && S.cfg.accent) || '#ffe066';
      S.pal = ramp(base, acc);
      S.tintPat = null; S.darkPat = null;
      S.pl = pl; S.onDone = onDone;
      S.name = String((pl && pl.mon && pl.mon.name) || (pl && pl.species) || 'POKÉMON').toUpperCase();
      S.phase = 'intro'; S.t = 0; S.st = 0; S.flash = 0;
      S.acc = S.def.emit.map(() => 0); S.bolts.length = 0; S.ringT = 0; S.kickT = 0; S.boltT = 0.4;
      for (const p of pool) p.a = false;
      if (G.Audio && G.Audio.sfx) G.Audio.sfx('mega');
    },

    stop() { S.phase = 'idle'; S.onDone = null; for (const p of pool) p.a = false; },

    tick(dt) {
      if (S.flash > 0) S.flash -= dt;
      if (S.kickT > 0) S.kickT -= dt;
      if (S.phase === 'intro') {
        S.t += dt;
        if (S.t >= INTRO) {
          S.phase = 'scene'; S.st = 0; S.flash = 0.5;
          const cb = S.onDone; S.onDone = null;
          if (cb) cb();
        }
      } else if (S.phase === 'scene') {
        const mega = G.Mega;
        if (!mega || !mega.isActive) { this.stop(); return; }
        S.st += dt;
        const k = this.intensity();
        S.def.emit.forEach((e, i) => {
          S.acc[i] += e[1] * dt * k;
          while (S.acc[i] >= 1) { S.acc[i] -= 1; spawn(e[0], e[2], e[3]); }
        });
        updateParticles(dt);
        if (S.def.sp === 'quake') spQuake(dt, k);
      }
    },

    intensity() {
      const mega = G.Mega;
      const left = mega ? mega.timeLeft : 0;
      return clamp01(Math.min(S.st / 0.7, left / 1.0));
    },

    drawScreen(ctx, w, h) {
      if (S.phase === 'idle') return;
      ensureLow(w, h);
      const c = S.lctx, lw = S.lw, lh = S.lh;
      c.clearRect(0, 0, lw, lh);
      const dt = 1 / 60;

      if (S.phase === 'intro') {
        const t = S.t, e = clamp01(t / 0.35);
        // escurece em xadrez
        c.fillStyle = '#05040c'; c.globalAlpha = 0.78 * e;
        c.fillRect(0, 0, lw, lh); c.globalAlpha = 1;
        // linhas de velocidade giratórias
        const cx = lw / 2, cy = lh / 2, Lm = Math.max(lw, lh);
        for (let i = 0; i < 28; i++) {
          const a = i * (6.283 / 28) + t * 0.6, r0 = 26 + ((i * 7 + t * 90) % 30);
          line(c, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.8, cx + Math.cos(a) * Lm, cy + Math.sin(a) * Lm, i % 3 ? S.pal[1] : S.pal[2]);
        }
        // anéis expandindo
        for (let i = 0; i < 3; i++) circle(c, cx, cy, ((t * 60 + i * 28) % 84) + 6, S.pal[2]);
        // faixas de cinema
        const bar = Math.round(lh * 0.13 * e);
        rect(c, 0, 0, lw, bar, '#000'); rect(c, 0, lh - bar, lw, bar, '#000');
        ctx.save(); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(S.lo, 0, 0, lw, lh, 0, 0, lw * S.pix, lh * S.pix);

        // Pokémon no centro (sprite pixel art original, ampliado)
        const pl = S.pl;
        if (pl && pl.anim) {
          const prev = pl.anim.scale;
          const sc = (prev || 1) * (2.2 + 1.1 * clamp01((t - 0.2) / 1.2));
          pl.anim.scale = sc;
          const bob = Math.round(Math.sin(t * 6) * 3);
          const glowR = Math.round(70 + 8 * Math.sin(t * 9));
          ctx.fillStyle = S.pal[1]; ctx.globalAlpha = 0.35 * e;
          const gc = Math.round(h * 0.52);
          for (let yy = -glowR; yy <= glowR; yy += S.pix) {
            const hw = Math.floor(Math.sqrt(glowR * glowR - yy * yy));
            ctx.fillRect(Math.round(w / 2) - hw, gc + yy, hw * 2, S.pix);
          }
          ctx.globalAlpha = 1;
          pl.anim.draw(ctx, w / 2, h * 0.62 + bob, { flash: t < 0.5, softFlash: false, alpha: e, color: '#ffffff' });
          pl.anim.scale = prev;
        }
        // título
        if (t > 0.5) {
          const a = clamp01((t - 0.5) / 0.3);
          const sz = Math.max(22, Math.round(Math.min(w, h) * 0.075));
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.globalAlpha = a;
          ctx.font = tryFont(sz);
          const ty = h * 0.76;
          ctx.fillStyle = '#000'; ctx.fillText('MEGA ' + S.name, w / 2 + 3, ty + 3);
          ctx.fillStyle = S.pal[2]; ctx.fillText('MEGA ' + S.name, w / 2, ty);
          ctx.font = tryFont(Math.round(sz * 0.5));
          const sub = (S.cfg && S.cfg.name) ? S.cfg.name.toUpperCase() : '';
          ctx.fillStyle = '#000'; ctx.fillText(sub, w / 2 + 2, ty + sz * 0.9 + 2);
          ctx.fillStyle = '#ffffff'; ctx.fillText(sub, w / 2, ty + sz * 0.9);
          ctx.globalAlpha = 1;
        }
        // flash branco final
        const fl = clamp01((t - (INTRO - 0.25)) / 0.25);
        if (fl > 0) { ctx.fillStyle = '#fff'; ctx.globalAlpha = fl; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
        ctx.restore();
        return;
      }

      // ----- cenário durante o Mega -----
      const k = this.intensity(), t = S.st, def = S.def;
      if (!S.tintPat) {
        S.tintPat = checker((S.cfg && S.cfg.color) || '#fff');
        S.darkPat = checker('#05030a');
      }
      if (def.dark > 0) { c.globalAlpha = def.dark * k * 1.6; c.fillStyle = S.darkPat; c.fillRect(0, 0, lw, lh); }
      c.globalAlpha = def.tint * k * 1.6; c.fillStyle = S.tintPat; c.fillRect(0, 0, lw, lh);
      c.globalAlpha = 1;
      // abre um buraco na tinta ao redor do jogador para o sprite não ficar quadriculado
      const pl = S.pl, cam = G.Camera;
      if (pl && cam && cam.left) {
        const sc = cam.scale || 1, vs = pl.megaVisualScale || 1;
        const cx = Math.round((pl.x - cam.left()) * sc / S.pix);
        const cy = Math.round((pl.y - cam.top()) * sc / S.pix - 14 * sc * vs / S.pix);
        const rx = Math.round(40 * sc * vs / S.pix), ry = Math.round(46 * sc * vs / S.pix);
        c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
        for (let y = -ry; y <= ry; y++) {
          const hw = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
          c.fillRect(cx - hw, cy + y, hw * 2 + 1, 1);
        }
        c.globalCompositeOperation = 'source-over';
      }

      switch (def.sp) {
        case 'waves': spWaves(c, k, t); break;
        case 'vines': spVines(c, k, t); break;
        case 'bolts': spBolts(c, dt, k); break;
        case 'frost': spFrost(c, k); break;
        case 'rings': spRings(c, dt, k, 0.7); break;
        case 'spiral': spSpiral(c, k, t); break;
        case 'rays': spRays(c, k, t); break;
        case 'tendrils': spTendrils(c, k, t); break;
        case 'eyes': spEyes(c, k, t); break;
      }
      for (let i = 0; i < MAX_P; i++) if (pool[i].a) drawParticle(c, pool[i]);

      // vinheta de bordas em xadrez
      c.fillStyle = S.pal[1];
      const vd = Math.round(6 * k);
      for (let d = 0; d < vd; d++) {
        for (let x = d; x < lw - d; x++) if (((x + d) & 1) === 0 || d < 2) {
          c.fillRect(x, d, 1, 1); c.fillRect(x, lh - 1 - d, 1, 1);
        }
        for (let y = d; y < lh - d; y++) if (((y + d) & 1) === 0 || d < 2) {
          c.fillRect(d, y, 1, 1); c.fillRect(lw - 1 - d, y, 1, 1);
        }
      }

      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(S.lo, 0, 0, lw, lh, 0, 0, lw * S.pix, lh * S.pix);
      ctx.globalAlpha = 1;
      if (S.flash > 0) { ctx.fillStyle = '#fff'; ctx.globalAlpha = clamp01(S.flash / 0.5) * 0.8; ctx.fillRect(0, 0, w, h); }
      ctx.restore();
    }
  };

  G.MegaScene = MegaScene;
})();
