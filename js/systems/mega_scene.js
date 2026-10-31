/* ============ mega_scene.js — Mega v2: cinemática curta + golpe único em pixel art ============
 * Ao ativar o Mega (Espaço/M/botão) o mundo congela e roda uma sequência de ~3 s:
 *   1. corte   (0,9 s)  Pokémon grande no centro, aura em pixels e nome da skill
 *   2. carga   (0,6 s)  energia converge no Pokémon, de volta ao mundo
 *   3. golpe   (~1,5 s) ataque assinatura do tipo, em tela cheia, com dano em área nos instantes de impacto
 * Depois o buff do Mega (10 s) é ativado por G.Mega._activate, sem efeito contínuo na tela.
 *
 * Tudo é desenhado num canvas de baixa resolução (PIX px por pixel) e ampliado sem suavização,
 * só com retângulos/linhas/círculos de 1 px: pixel art de verdade, sem gradientes.
 * Os golpes de cada tipo ficam em mega_strike.js (G.MegaStrikes[tipo]) e usam as primitivas de MegaScene.P.
 * O dano real é aplicado aqui (hurtCircle/hurtRect/hurtLine/hurtAll), nos eventos que cada golpe agenda.
 */
(function () {
  // G vem do escopo externo: global no dev.html, variável do bundle (função) no build de produção.
  // Não recriar G aqui (window.G || {}): em produção seria um objeto separado do jogo.
  const INTRO = 0.9, CHARGE = 0.6;
  const MAX_P = 200;
  const FONT = "'Pixelify', 'Press Start 2P', monospace";

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const R = (a, b) => a + Math.random() * (b - a);

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
  function ramp(base, accent) { return [mix(base, 0, 0.55), base, accent || mix(base, 255, 0.4), '#ffffff']; }

  // ---------- estado ----------
  const S = {
    phase: 'idle', t: 0, st: 0, id: 0, flash: 0,
    type: 'normal', cfg: null, pal: ramp('#ffffff'), strike: null, sd: null,
    pl: null, onDone: null, events: [], evI: 0, name: 'POKÉMON',
    lo: null, lctx: null, lw: 0, lh: 0, pix: 4,
    px: 0, py: 0, aim: 0, enemies: []
  };

  function ensureLow(w, h) {
    const pix = w < 700 ? 3 : 4;
    const lw = Math.ceil(w / pix), lh = Math.ceil(h / pix);
    if (S.lo && S.lw === lw && S.lh === lh && S.pix === pix) return;
    S.lo = document.createElement('canvas');
    S.lo.width = lw; S.lo.height = lh;
    S.lctx = S.lo.getContext('2d');
    S.lw = lw; S.lh = lh; S.pix = pix;
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
    while (n++ < 900) {
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
    if (r < 1) { px(c, cx, cy, col); return; }
    c.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const hw = Math.floor(Math.sqrt(r * r - y * y));
      if (!dither) { c.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); continue; }
      for (let x = -hw; x <= hw; x++) if (((x + y + cx + cy) & 1) === 0) c.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  /** Bola de energia com 3 tons e núcleo branco. */
  function ball(c, x, y, r) {
    disc(c, x, y, r, S.pal[1]);
    disc(c, x, y, r * 0.72, S.pal[2]);
    disc(c, x, y, r * 0.38, '#ffffff');
  }
  /** Bitmap em strings: '.' vazio; demais caracteres mapeados em `map`. k = ampliação em pixels. */
  function bitmap(c, rows, map, x, y, k, flip) {
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[flip ? row.length - 1 - i : i];
        if (ch === '.') continue;
        const col = map[ch];
        if (col) rect(c, x + i * k, y + j * k, k, k, col);
      }
    }
  }
  /** Hash determinístico 0..1 (para posições fixas por índice, sem estado). */
  function hash(i, s) { const v = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return v - Math.floor(v); }
  const ease = { out: u => 1 - (1 - u) * (1 - u), in: u => u * u, inout: u => u * u * (3 - 2 * u) };

  // ---------- partículas de impacto (pool fixo) ----------
  const pool = Array.from({ length: MAX_P }, () => ({ a: false }));
  function newP() { for (let i = 0; i < MAX_P; i++) if (!pool[i].a) return pool[i]; return null; }
  function burst(x, y, n, ci, speed, grav) {
    for (let i = 0; i < n; i++) {
      const p = newP(); if (!p) return;
      const a = R(0, 6.283), v = R(0.3, 1) * (speed || 60);
      p.a = true; p.k = 'spark'; p.ci = ci == null ? 2 : ci; p.x = x; p.y = y;
      p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - (grav ? 20 : 0); p.g = grav == null ? 120 : grav;
      p.s = Math.random() < 0.3 ? 2 : 1; p.life = p.max = R(0.3, 0.8);
    }
  }
  function ring(x, y, r, ci, life) {
    const p = newP(); if (!p) return;
    p.a = true; p.k = 'ring'; p.ci = ci == null ? 2 : ci; p.x = x; p.y = y; p.vx = p.vy = p.g = 0;
    p.s = r; p.life = p.max = life || 0.45;
  }
  function tickParticles(dt) {
    for (let i = 0; i < MAX_P; i++) {
      const p = pool[i]; if (!p.a) continue;
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) p.a = false;
    }
  }
  function drawParticles(c) {
    for (let i = 0; i < MAX_P; i++) {
      const p = pool[i]; if (!p.a) continue;
      const f = p.life / p.max, col = f > 0.5 ? S.pal[p.ci] : S.pal[Math.max(0, p.ci - 1)];
      if (p.k === 'ring') circle(c, p.x, p.y, p.s * (1 - f) + 1, f > 0.5 ? '#fff' : col);
      else rect(c, p.x, p.y, p.s, p.s, col);
    }
  }

  // ---------- conversão e dano ----------
  function lowToWorld(lx, ly) {
    const cam = G.Camera, k = S.pix / (cam.scale || 1);
    return [cam.left() + lx * k, cam.top() + ly * k];
  }
  const lowLen = l => l * S.pix / ((G.Camera && G.Camera.scale) || 1);

  function strikeHit(e, mul, wx, wy) {
    if (!e || e.dead || typeof e.hurt !== 'function') return;
    const pl = S.pl, atk = (pl && pl.atk) || 10;
    if (e._msId !== S.id) { e._msId = S.id; e._ms = 0; }
    let d;
    if (e.boss) {              // chefe: no máximo 25% da vida máxima por golpe
      const room = 0.25 * (e.maxHp || e.hp) - e._ms;
      if (room <= 0) return;
      d = Math.min(atk * 8 * mul, room);
      e._ms += d;
    } else d = Math.max(atk * 8, (e.maxHp || e.hp) * 0.9) * mul;
    e.hurt(d, S.pal[2], e.x - wx, e.y - wy, 220, 'super');
  }
  function eachEnemy(fn) {
    const all = (G.EnemyMgr && G.EnemyMgr.all) ? G.EnemyMgr.all() : [];
    for (let i = 0; i < all.length; i++) { const e = all[i]; if (e && !e.dead) fn(e); }
  }
  function hurtCircle(lx, ly, lr, mul) {
    const [wx, wy] = lowToWorld(lx, ly), wr = lowLen(lr);
    eachEnemy(e => { const dx = e.x - wx, dy = e.y - wy, rr = wr + (e.r || 10); if (dx * dx + dy * dy <= rr * rr) strikeHit(e, mul, wx, wy); });
  }
  function hurtRect(lx0, ly0, lx1, ly1, mul) {
    const [x0, y0] = lowToWorld(lx0, ly0), [x1, y1] = lowToWorld(lx1, ly1);
    eachEnemy(e => { if (e.x >= x0 && e.x <= x1 && e.y >= y0 && e.y <= y1) strikeHit(e, mul, (x0 + x1) / 2, (y0 + y1) / 2); });
  }
  function hurtLine(lx0, ly0, lx1, ly1, lhalf, mul) {
    const [ax, ay] = lowToWorld(lx0, ly0), [bx, by] = lowToWorld(lx1, ly1), hw = lowLen(lhalf);
    const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
    eachEnemy(e => {
      const t = clamp01(((e.x - ax) * vx + (e.y - ay) * vy) / L2);
      const dx = e.x - (ax + vx * t), dy = e.y - (ay + vy * t), rr = hw + (e.r || 10);
      if (dx * dx + dy * dy <= rr * rr) strikeHit(e, mul, ax, ay);
    });
  }
  function hurtAll(mul) {
    const cam = G.Camera, [wx, wy] = lowToWorld(S.px, S.py);
    eachEnemy(e => { if (cam.sees(e.x, e.y, 30)) strikeHit(e, mul, wx, wy); });
  }
  function kick(a) { if (G.Camera && G.Camera.kick) G.Camera.kick(a); }
  function flash(a) { S.flash = Math.max(S.flash, a); }

  /** Posições dos inimigos na tela (em coordenadas de baixa resolução), para mirar os golpes. */
  function visibleEnemies() {
    const cam = G.Camera, k = (cam.scale || 1) / S.pix, out = [];
    eachEnemy(e => {
      const lx = (e.x - cam.left()) * k, ly = (e.y - cam.top()) * k;
      if (lx > 4 && lx < S.lw - 4 && ly > 6 && ly < S.lh - 4) out.push({ x: lx, y: ly });
    });
    return out;
  }
  function refreshPlayer() {
    const pl = S.pl, cam = G.Camera;
    if (!pl || !cam) return;
    const k = (cam.scale || 1) / S.pix;
    S.px = (pl.x - cam.left()) * k;
    S.py = (pl.y - cam.top()) * k - 10;     // um pouco acima dos pés
    S.aim = pl.aim || 0;
  }

  const P = {
    px, rect, line, circle, disc, ball, bitmap, hash, ease, burst, ring, clamp01,
    hurtCircle, hurtRect, hurtLine, hurtAll, kick, flash, R
  };

  function fontPx(n) { return `700 ${n}px ${FONT}`; }

  // ---------- desenho das fases ----------
  function drawCut(ctx, w, h, c) {
    const t = S.t, e = clamp01(t / 0.25), lw = S.lw, lh = S.lh;
    c.fillStyle = '#05040c'; c.globalAlpha = 0.72 * e; c.fillRect(0, 0, lw, lh); c.globalAlpha = 1;
    const cx = lw / 2, cy = lh * 0.55;
    // aura: faíscas orbitando o Pokémon
    for (let i = 0; i < 30; i++) {
      const a = i * 0.209 + t * (1.5 + (i % 3) * 0.4), r = 22 + (i % 5) * 4 + Math.sin(t * 5 + i) * 3;
      rect(c, cx + Math.cos(a) * r, cy - 8 + Math.sin(a) * r * 0.7, i % 4 ? 1 : 2, i % 4 ? 1 : 2, i % 3 ? S.pal[2] : '#fff');
    }
    const bar = Math.round(lh * 0.12 * e);
    rect(c, 0, 0, lw, bar, '#000'); rect(c, 0, lh - bar, lw, bar, '#000');
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(S.lo, 0, 0, lw, lh, 0, 0, lw * S.pix, lh * S.pix);

    const pl = S.pl;
    if (pl && pl.anim) {
      const prev = pl.anim.scale;
      pl.anim.scale = (prev || 1) * (2.2 + 0.9 * clamp01((t - 0.1) / 0.7));
      pl.anim.draw(ctx, w / 2, h * 0.64 + Math.round(Math.sin(t * 6) * 3), { flash: t < 0.25, softFlash: false, alpha: e, color: '#ffffff' });
      pl.anim.scale = prev;
    }
    if (t > 0.3) {
      const a = clamp01((t - 0.3) / 0.2), sz = Math.max(22, Math.round(Math.min(w, h) * 0.07));
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = a;
      ctx.font = fontPx(sz);
      const ty = h * 0.80, title = 'MEGA ' + S.name;
      ctx.fillStyle = '#000'; ctx.fillText(title, w / 2 + 3, ty + 3);
      ctx.fillStyle = S.pal[2]; ctx.fillText(title, w / 2, ty);
      ctx.font = fontPx(Math.round(sz * 0.5));
      const sub = ((S.strike && S.strike.name) || (S.cfg && S.cfg.name) || '').toUpperCase();
      ctx.fillStyle = '#000'; ctx.fillText(sub, w / 2 + 2, ty + sz * 0.85 + 2);
      ctx.fillStyle = '#ffffff'; ctx.fillText(sub, w / 2, ty + sz * 0.85);
      ctx.globalAlpha = 1;
    }
    const fl = clamp01((t - (INTRO - 0.15)) / 0.15);
    if (fl > 0) { ctx.fillStyle = '#fff'; ctx.globalAlpha = fl; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
    ctx.restore();
  }

  function drawCharge(ctx, w, h, c) {
    const u = clamp01(S.t / CHARGE), lw = S.lw, lh = S.lh;
    refreshPlayer();
    for (let i = 0; i < 46; i++) {                     // energia convergindo
      const a = hash(i, 5) * 6.283 + u * 2.2, r0 = 70 + hash(i, 9) * 50, r = r0 * (1 - ease.in(u)) + 4;
      const x = S.px + Math.cos(a) * r, y = S.py + Math.sin(a) * r * 0.75;
      rect(c, x, y, i % 3 ? 1 : 2, i % 3 ? 1 : 2, i % 2 ? S.pal[2] : '#fff');
    }
    disc(c, S.px, S.py, 3 + u * 9, S.pal[1], true);
    circle(c, S.px, S.py, 6 + u * 14, S.pal[2]);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(S.lo, 0, 0, lw, lh, 0, 0, lw * S.pix, lh * S.pix);
    ctx.restore();
  }

  function drawStrike(ctx, w, h, c) {
    refreshPlayer();
    if (S.strike && S.strike.draw) S.strike.draw(S.st, c, S, P, S.sd);
    drawParticles(c);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(S.lo, 0, 0, S.lw, S.lh, 0, 0, S.lw * S.pix, S.lh * S.pix);
    ctx.restore();
  }

  // ---------- API ----------
  const MegaScene = {
    get phase() { return S.phase; },
    get active() { return S.phase !== 'idle'; },
    /** Mundo congelado durante o corte, a carga e o golpe. */
    get introActive() { return S.phase !== 'idle'; },
    P, S,

    canPlay() { return typeof document !== 'undefined' && typeof document.createElement === 'function'; },

    start(type, pl, onDone) {
      const vfx = (typeof MegaSkillVFXManager !== 'undefined') ? MegaSkillVFXManager : G.MegaSkillVFXManager;
      S.type = type || 'normal';
      S.cfg = (vfx && vfx.getTypeConfig) ? vfx.getTypeConfig(S.type) : null;
      const base = (S.cfg && S.cfg.color) || '#ffffff', acc = (S.cfg && S.cfg.accent) || '#ffe066';
      const strikes = G.MegaStrikes || {};
      S.strike = strikes[S.type] || strikes.normal || null;
      // paleta do golpe (se o golpe definir uma própria, tipo Dragão) ou a do tipo
      S.pal = ramp((S.strike && S.strike.color) || base, (S.strike && S.strike.accent) || acc);
      S.pl = pl; S.onDone = onDone; S.id++;
      S.name = String((pl && pl.mon && pl.mon.name) || (pl && pl.species) || 'POKÉMON').toUpperCase();
      S.phase = 'cut'; S.t = 0; S.st = 0; S.flash = 0; S.events = []; S.evI = 0; S.sd = null;
      for (const p of pool) p.a = false;
      if (G.Audio && G.Audio.sfx) G.Audio.sfx('mega');
    },

    stop() { S.phase = 'idle'; S.onDone = null; for (const p of pool) p.a = false; },

    tick(dt) {
      if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 2.2);
      if (S.phase === 'cut') {
        S.t += dt;
        if (S.t >= INTRO) { S.phase = 'charge'; S.t = 0; kick(0.25); if (G.Audio && G.Audio.sfx) G.Audio.sfx('select'); }
      } else if (S.phase === 'charge') {
        S.t += dt;
        if (S.t >= CHARGE) {
          S.phase = 'strike'; S.st = 0;
          refreshPlayer();
          S.enemies = visibleEnemies();
          const def = S.strike;
          S.events = [];
          if (def && def.init) { const r = def.init(S, P) || {}; S.sd = r.data || null; S.events = (r.events || []).slice().sort((a, b) => a.t - b.t); }
          S.evI = 0;
          flash(0.5); kick(0.4);
        }
      } else if (S.phase === 'strike') {
        S.st += dt;
        tickParticles(dt);
        while (S.evI < S.events.length && S.events[S.evI].t <= S.st) {
          try { S.events[S.evI].fn(); } catch (e) { console.warn('[MegaScene] evento do golpe falhou:', e); }
          S.evI++;
        }
        if (S.st >= ((S.strike && S.strike.len) || 1.5)) {
          S.phase = 'idle';
          for (const p of pool) p.a = false;
          const cb = S.onDone; S.onDone = null;
          if (cb) cb();
        }
      }
    },

    drawScreen(ctx, w, h) {
      if (S.phase === 'idle') return;
      ensureLow(w, h);
      const c = S.lctx;
      c.clearRect(0, 0, S.lw, S.lh);
      if (S.phase === 'cut') drawCut(ctx, w, h, c);
      else if (S.phase === 'charge') drawCharge(ctx, w, h, c);
      else drawStrike(ctx, w, h, c);
      if (S.flash > 0 && S.phase !== 'cut') {
        ctx.save(); ctx.fillStyle = '#fff'; ctx.globalAlpha = clamp01(S.flash) * 0.85; ctx.fillRect(0, 0, w, h); ctx.restore();
      }
    }
  };

  G.MegaScene = MegaScene;
  G.MegaStrikes = G.MegaStrikes || {};
})();
