/* ============ mega_strike.js — golpes assinatura do Mega (um por tipo), em pixel art ============
 * Cada golpe: { name, len, color?, accent?, init(S, P) -> { events, data }, draw(t, c, S, P, data) }
 *   - t: segundos desde o início do golpe; c: contexto do canvas de baixa resolução (S.lw x S.lh)
 *   - S: estado do MegaScene (lw, lh, px/py = posição do Pokémon, aim, enemies, pal = rampa de 4 tons)
 *   - P: primitivas e dano (rect, line, circle, disc, ball, bitmap, hash, ease, burst, ring, hurt*, kick, flash)
 *   - events: [{ t, fn }] — dano e efeitos nos instantes de impacto (dano real vem de P.hurt*)
 * draw() é função pura de t (posições por P.hash), sem estado entre quadros.
 * Tipos sem golpe próprio (nenhum hoje) usam o 'normal' (Hiper Raio) com as cores do tipo.
 * Não recriar G aqui: em produção G é variável do bundle.
 */
(function () {
  const ST = G.MegaStrikes = G.MegaStrikes || {};

  /** n alvos na tela: metade mira inimigos visíveis, o resto cai em posições espalhadas. */
  function pickTargets(S, P, n, seed) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (S.enemies.length && i % 2 === 0) {
        const e = S.enemies[(i >> 1) % S.enemies.length];
        out.push({ x: e.x + (P.hash(i, seed) - 0.5) * 8, y: e.y + (P.hash(i, seed + 1) - 0.5) * 6 });
      } else {
        out.push({ x: 14 + P.hash(i, seed + 2) * (S.lw - 28), y: S.lh * 0.28 + P.hash(i, seed + 3) * (S.lh * 0.66) });
      }
    }
    return out;
  }

  // ---------- meteoros (Fogo e Dragão) ----------
  function makeMeteors(S, P, n, seed, t0, gap, fall, r0, rVar, dmgR) {
    const tg = pickTargets(S, P, n, seed), m = [], ev = [];
    tg.forEach((a, i) => {
      const L = t0 + i * gap, r = r0 + (i % rVar);
      m.push({ tx: a.x, ty: a.y, L, r, sx: a.x + 80, sy: a.y - 135, i });
      ev.push({ t: L, fn() { P.hurtCircle(a.x, a.y, dmgR, 1); P.kick(0.16); P.burst(a.x, a.y, 8, 2, 70); P.ring(a.x, a.y, dmgR * 0.85, 2, 0.4); } });
    });
    return { m, ev, fall };
  }
  function drawMeteors(t, c, S, P, M, big) {
    for (const q of M.m) {
      const ph = t - (q.L - M.fall);
      if (ph < 0) continue;
      if (ph < M.fall) {                                 // em queda, com cauda longa
        const u = ph / M.fall, e = u * u * 0.6 + u * 0.4;
        const x = q.sx + (q.tx - q.sx) * e, y = q.sy + (q.ty - q.sy) * e;
        const dx = q.sx - q.tx, dy = q.sy - q.ty, m = Math.hypot(dx, dy), ux = dx / m, uy = dy / m;
        for (let k = 24; k >= 1; k--) {
          const f = 1 - k / 25;
          P.disc(c, x + ux * k * 2.4, y + uy * k * 2.4, q.r * f * 0.9, k < 6 ? S.pal[2] : k < 13 ? S.pal[1] : S.pal[0], k > 13);
        }
        P.ball(c, x, y, q.r);
        continue;
      }
      const a = t - q.L, R = big;                        // impacto
      P.disc(c, q.tx, q.ty + 2, 7, '#24100a');           // cratera
      P.disc(c, q.tx, q.ty + 2, 4, '#12080a');
      if (a < 0.9) {
        if (a < 0.14) {                                  // clarão curto do impacto
          const re = R * P.ease.out(a / 0.14);
          P.disc(c, q.tx, q.ty, re, S.pal[2]); P.disc(c, q.tx, q.ty, re * 0.55, '#fff');
        } else if (a < 0.5) P.circle(c, q.tx, q.ty, R * (1 + (a - 0.14) * 0.9), a < 0.3 ? S.pal[2] : S.pal[1]);
        for (let j = 0; j < 7; j++) {                    // colunas de fogo que sobem e morrem
          const hh = Math.max(0, (1 - a / 0.9) * (10 + P.hash(j + q.i * 7, 4) * 16)), x = q.tx + (j - 3) * 3.5;
          P.rect(c, x, q.ty - hh, 3, hh, j % 2 ? S.pal[2] : S.pal[1]);
          if (hh > 2) P.rect(c, x, q.ty - hh, 3, 1, '#fff');
        }
      }
    }
  }

  ST.fire = {
    name: 'Chuva de Meteoros', len: 2.0,
    init(S, P) {
      const M = makeMeteors(S, P, 26, 11, 0.55, 0.045, 0.42, 5, 3, 20);
      M.ev.push({ t: 1.75, fn() { P.flash(0.55); P.hurtAll(0.4); P.kick(0.5); } });
      return { events: M.ev, data: M };
    },
    draw(t, c, S, P, M) { drawMeteors(t, c, S, P, M, 16); }
  };

  ST.dragon = {
    name: 'Fúria do Dragão', len: 2.2, color: '#7038f8', accent: '#ff8a2a',
    // cabeça de dragão virada para a direita (22x11); o=contorno, a=corpo, b=luz, w=dente, e=olho
    HEAD: [
      '....oo..oo..............',
      '...oaaooaao.............',
      '..oaaaaaaaaooo..........',
      '.oaabbaaaaaaaaooo.......',
      'oaabbbaaaaaaaaaaaooo....',
      'oaaabaaaaaeeaaaaaaaaoo..',
      '.oaaaaaaaaeeaaaaaaaaaaoo',
      '..ooaaaaaaaaaaaaaaaaaaao',
      '....oooooooooaaaaaaaaaoo',
      '.........owowowowowooo..',
      '..........oaaaaaaaaaoo..',
      '...........ooooooooooo..'
    ],
    init(S, P) {
      const ev = [];
      const hx = t => -50 + (S.lw + 120) * P.ease.inout(P.clamp01((t - 0.25) / 0.95));
      const hy = t => S.lh * 0.5 + Math.sin(t * 6) * 10;
      for (let k = 0; k < 14; k++) {                    // a cabeça varre a tela
        const tt = 0.3 + k * 0.065;
        ev.push({ t: tt, fn() { P.hurtCircle(hx(tt), hy(tt), 30, 0.8); if (k % 3 === 0) P.kick(0.18); } });
      }
      const M = makeMeteors(S, P, 7, 23, 1.05, 0.11, 0.5, 8, 2, 24);
      ev.push(...M.ev);
      ev.push({ t: 1.95, fn() { P.flash(0.6); P.hurtAll(0.4); P.kick(0.55); } });
      return { events: ev, data: { M, hx, hy } };
    },
    draw(t, c, S, P, d) {
      if (t >= 0.25 && t < 1.3) {
        const x = d.hx(t), y = d.hy(t);
        for (let k = 40; k >= 1; k--) {                 // corpo/rastro de energia
          const f = 1 - k / 42, yy = y + Math.sin(t * 8 - k * 0.32) * 10;
          P.disc(c, x - k * 3.3, yy, 3 + f * 8, k < 10 ? S.pal[2] : k < 24 ? S.pal[1] : S.pal[0], k > 24);
        }
        const map = { o: S.pal[0], a: S.pal[1], b: S.pal[2], w: '#fff', e: '#ffe14d' };
        P.bitmap(c, this.HEAD, map, x - 24, y - 12, 2);
        P.ball(c, x + 30, y + 8, 7 + Math.sin(t * 30) * 1.5);           // sopro de fogo
      }
      drawMeteors(t, c, S, P, d.M, 22);
    }
  };

  // ---------- Água: Tsunami ----------
  // Três ondas varrem a tela da esquerda para a direita, vistas de cima: espuma irregular na frente,
  // corpo de água com correntes, cauda translúcida (tracejada) e respingos. O chão aparece entre as ondas.
  const WAVES = [{ s: 0.25, body: 60 }, { s: 0.6, body: 46 }, { s: 0.95, body: 36 }];
  ST.water = {
    name: 'Tsunami', len: 2.5,
    front(S, P, w, t) { return -24 + (S.lw + 90) * P.ease.inout(P.clamp01((t - w.s) / 1.15)); },
    init(S, P) {
      const ev = [], self = this;
      WAVES.forEach((w, wi) => {
        for (let k = 0; k < 8; k++) {
          const tt = w.s + 0.05 + k * 0.14;
          ev.push({ t: tt, fn() { const f = self.front(S, P, w, tt); P.hurtRect(f - w.body, 0, f + 12, S.lh, 0.55); if (k % 3 === 0) P.kick(0.16); } });
        }
        ev.push({ t: w.s + 1.15, fn() { P.kick(0.35); P.flash(wi === 2 ? 0.45 : 0.15); } });
      });
      ev.push({ t: 2.15, fn() { P.hurtAll(0.3); } });
      return { events: ev };
    },
    draw(t, c, S, P) {
      const lw = S.lw, lh = S.lh;
      for (let wi = 0; wi < WAVES.length; wi++) {
        const w = WAVES[wi];
        if (t < w.s) continue;
        const f = this.front(S, P, w, t), done = P.clamp01((t - (w.s + 1.15)) / 0.5), alive = 1 - done;
        if (alive <= 0) continue;
        const tail = 150;
        for (let y = 0; y < lh; y++) {
          // borda de ataque irregular (varia por linha e no tempo)
          const fx = f + Math.sin(y * 0.13 + t * 9 + wi) * 5 + Math.sin(y * 0.37 - t * 6) * 3 + (P.hash(y, wi + 3) - 0.5) * 3;
          const x0 = Math.max(0, Math.floor(fx - w.body - tail)), x1 = Math.min(lw, Math.ceil(fx + 3));
          if (x1 <= x0) continue;
          for (let x = x0; x < x1; x++) {
            const d = fx - x;
            if (d < 0) { if (d > -3) P.px(c, x, y, '#fff'); continue; }
            let col = null;
            if (d < 3) col = '#ffffff';                                           // espuma
            else if (d < 6 + (y & 1) * 2) col = S.pal[2];                         // brilho da crista
            else if (d < w.body) {                                                // corpo: correntes diagonais claras e escuras
              const s2 = (x + y * 0.7 + t * 80 * (1 + wi * 0.3)) % 30;
              col = s2 < 6 ? S.pal[2] : (s2 > 24 ? S.pal[0] : S.pal[1]);
              if (d < 12 && ((x + y) & 3) === 0) col = '#ffffff';                 // espuma interna
            } else {                                                              // cauda translúcida: xadrez que rareia
              const u = (d - w.body) / tail;
              const on = u < 0.4 ? ((x + y) & 1) === 0 : (u < 0.8 ? ((x & 1) === 0 && (y & 1) === 0) : false);
              if (on && alive > 0.3) col = (((y + (x >> 3)) % 12) < 1) ? S.pal[2] : S.pal[1];
            }
            if (col) P.px(c, x, y, col);
          }
        }
        // respingos voando à frente da crista
        if (t < w.s + 1.2) {
          const fr = Math.floor(t * 22);
          for (let i = 0; i < 46; i++) {
            const x = f + 2 + P.hash(i, fr + wi) * 20, y = P.hash(i, fr + 40 + wi) * lh - P.hash(i, fr + 80) * 6;
            if (x < lw) P.rect(c, x, y, 1 + (i % 3 === 0 ? 1 : 0), 1, i % 2 ? '#fff' : S.pal[2]);
          }
        }
      }
      if (t > 1.4) {                                                              // marolas onde as ondas passaram
        const a = P.clamp01((t - 1.4) / 0.4) * (1 - P.clamp01((t - 2.1) / 0.4));
        if (a > 0) for (let i = 0; i < 10; i++) {
          const x = P.hash(i, 5) * lw, y = lh * 0.15 + P.hash(i, 9) * lh * 0.8, r = ((t * 9 + i * 5) % 12) + 2;
          if (r < 11) P.circle(c, x, y, r, r < 6 ? '#fff' : S.pal[2]);
        }
      }
    }
  };

  // ---------- Elétrico: Tempestade ----------
  function makeBolt(P, tx, ty, seed) {
    const pts = []; let x = tx + (P.hash(seed, 1) - 0.5) * 50, y = -4;
    const steps = Math.max(4, Math.round((ty + 4) / 11));
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      pts.push([x, y]);
      x += (tx - x) * (0.25 + u * 0.5) + (P.hash(seed * 31 + i, 2) - 0.5) * 16 * (1 - u);
      y = -4 + (ty + 4) * (i + 1) / steps;
    }
    pts[pts.length - 1] = [tx, ty];
    return pts;
  }
  ST.electric = {
    name: 'Tempestade de Raios', len: 2.0,
    init(S, P) {
      const N = 10, tg = pickTargets(S, P, N - 1, 31), bolts = [], ev = [];
      tg.push({ x: S.px, y: S.py + 8 });                 // o último cai no Pokémon
      tg.forEach((a, i) => {
        const T = 0.5 + i * 0.13, last = i === N - 1;
        bolts.push({ T, pts: makeBolt(P, a.x, a.y, i + 3), x: a.x, y: a.y, last });
        ev.push({ t: T, fn() {
          P.hurtCircle(a.x, a.y, last ? 40 : 26, 1); P.kick(last ? 0.6 : 0.2); P.flash(last ? 0.9 : 0.3);
          P.burst(a.x, a.y, last ? 18 : 8, 2, 90);
        } });
      });
      ev.push({ t: 0.5 + (N - 1) * 0.13 + 0.05, fn() { P.hurtAll(0.4); } });
      return { events: ev, data: { bolts } };
    },
    draw(t, c, S, P, d) {
      for (const b of d.bolts) {
        const a = t - b.T;
        if (a < 0 || a > 0.3) continue;
        if (a > 0.16 && Math.floor(t * 60) % 2) continue;  // pisca no fim
        const th = a < 0.1 ? 5 : 3;
        P.disc(c, b.x, b.y, 16 * (1 - a / 0.3) + 4, S.pal[1], true);
        for (let j = 1; j < b.pts.length; j++) {
          const p0 = b.pts[j - 1], p1 = b.pts[j];
          P.line(c, p0[0], p0[1], p1[0], p1[1], S.pal[1], th + 4);
          P.line(c, p0[0], p0[1], p1[0], p1[1], S.pal[2], th + 2);
          P.line(c, p0[0] + 1, p0[1], p1[0] + 1, p1[1], '#fff', 2);
        }
        for (let k = 2; k < b.pts.length - 2; k += 3) {                // ramificações
          const p0 = b.pts[k], dir = k % 2 ? 1 : -1;
          P.line(c, p0[0], p0[1], p0[0] + dir * 22, p0[1] + 14, S.pal[2], 2);
          P.line(c, p0[0] + dir * 22, p0[1] + 14, p0[0] + dir * 30, p0[1] + 32, S.pal[2], 1);
        }
        if (b.last) {                                                  // anel de choque
          const r = P.ease.out(P.clamp01(a / 0.3)) * 90;
          for (let k = 0; k < 4; k++) P.circle(c, b.x, b.y, r - k, k < 2 ? '#fff' : S.pal[2]);
        }
      }
    }
  };

  // ---------- Gelo: Nevasca ----------
  function crystal(c, S, P, x, y, bw, hh, grow) {
    const h = Math.round(hh * P.ease.out(P.clamp01(grow)));
    if (h < 2) return;
    for (let j = 0; j < h; j++) {
      const w = Math.max(1, Math.round(bw * (j / h) * 0.5 + 1));
      const yy = y - h + j;
      P.rect(c, x - w, yy, w, 1, S.pal[2]);
      P.rect(c, x, yy, w, 1, S.pal[1]);
      P.px(c, x - 1, yy, j % 7 === 0 ? '#fff' : S.pal[3]);
      if (j === h - 1) P.rect(c, x - w, yy, w * 2, 1, S.pal[0]);
    }
    P.px(c, x, y - h, '#fff');
  }
  ST.ice = {
    name: 'Nevasca Eterna', len: 2.0,
    init(S, P) {
      const N = 13, tg = pickTargets(S, P, N, 41), cr = [], ev = [], SH = 1.1;
      tg.forEach((a, i) => {
        const E = 0.5 + i * 0.045, bw = 10 + (i % 3) * 4, hh = 34 + (i % 4) * 9;
        cr.push({ x: a.x, y: a.y + 8, E, bw, hh });
        ev.push({ t: E + 0.1, fn() { P.hurtCircle(a.x, a.y, 22, 1); P.kick(0.12); P.burst(a.x, a.y + 6, 5, 3, 60); } });
      });
      ev.push({ t: SH, fn() {
        cr.forEach(q => P.burst(q.x, q.y - q.hh / 2, 8, 3, 100, 70));
        P.flash(0.7); P.kick(0.55); P.hurtAll(0.8);
      } });
      return { events: ev, data: { cr, SH } };
    },
    draw(t, c, S, P, d) {
      if (t < d.SH) {
        for (const q of d.cr) {
          if (t < q.E) continue;
          P.disc(c, q.x, q.y, 6, S.pal[0], true);                        // montinho de gelo na base
          crystal(c, S, P, q.x, q.y, q.bw, q.hh, (t - q.E) / 0.2);
          crystal(c, S, P, q.x + q.bw * 0.6, q.y + 2, q.bw * 0.7, q.hh * 0.6, (t - q.E - 0.04) / 0.2);
        }
      } else {
        const r = P.ease.out(P.clamp01((t - d.SH) / 0.5)) * S.lw * 0.85;
        for (let k = 0; k < 10; k++) P.circle(c, S.px, S.py, r - k, k < 3 ? '#fff' : S.pal[2]);
        for (let i = 0; i < 80; i++) {                                   // neve
          const x = P.hash(i, 3) * S.lw, y = ((P.hash(i, 8) * S.lh + (t - d.SH) * (30 + (i % 5) * 12)) % S.lh);
          P.px(c, x, y, i % 3 ? '#fff' : S.pal[2]);
        }
      }
    }
  };

  // ---------- Normal: Hiper Raio (também o padrão dos tipos sem golpe próprio) ----------
  ST.normal = {
    name: 'Hiper Raio', len: 1.9,
    init(S, P) {
      const ev = [], a0 = S.aim - Math.PI / 2, L = Math.max(S.lw, S.lh) * 1.6, ox = S.px, oy = S.py;
      const ang = tt => a0 + Math.PI * P.ease.inout(P.clamp01((tt - 0.45) / 0.95));
      for (let k = 0; k < 16; k++) {
        const tt = 0.45 + k * 0.06, a = ang(tt);
        ev.push({ t: tt, fn() { P.hurtLine(ox, oy, ox + Math.cos(a) * L, oy + Math.sin(a) * L, 11, 1); if (k % 4 === 0) P.kick(0.25); } });
      }
      ev.push({ t: 1.5, fn() { P.flash(0.6); P.kick(0.5); P.ring(ox, oy, 60, 2, 0.5); P.hurtCircle(ox, oy, 60, 0.5); } });
      return { events: ev, data: { a0, L, ang, ox, oy } };
    },
    draw(t, c, S, P, d) {
      const { ox, oy } = d;
      if (t < 0.45) {                                                    // orbe de carga
        const u = t / 0.45;
        P.ball(c, ox, oy, 3 + u * 10);
        for (let i = 0; i < 30; i++) {
          const a = P.hash(i, 2) * 6.283 + t * 3, r = (1 - u) * (40 + P.hash(i, 6) * 40) + 6;
          P.px(c, ox + Math.cos(a) * r, oy + Math.sin(a) * r, i % 2 ? S.pal[2] : '#fff');
        }
        return;
      }
      if (t < 1.5) {
        const a = d.ang(t), ex = ox + Math.cos(a) * d.L, ey = oy + Math.sin(a) * d.L;
        const px_ = -Math.sin(a), py_ = Math.cos(a), grow = P.clamp01((t - 0.45) / 0.1);
        const hw = Math.round(8 * grow + 2);
        for (let k = -hw; k <= hw; k++) {
          const ak = Math.abs(k), col = ak < 2 ? '#fff' : ak < hw * 0.6 ? S.pal[2] : S.pal[1];
          P.line(c, ox + px_ * k, oy + py_ * k, ex + px_ * k, ey + py_ * k, col);
        }
        P.ball(c, ox, oy, 10 + Math.sin(t * 40) * 1.5);
      } else P.ball(c, ox, oy, 10 * (1 - P.clamp01((t - 1.5) / 0.3)));
    }
  };

  // =====================================================================================
  // LEVA 2 — os outros 12 tipos
  // =====================================================================================

  // ---------- Planta: Erupção de Espinhos ----------
  ST.grass = {
    name: 'Erupção de Espinhos', len: 2.1,
    init(S, P) {
      const ev = [], rings = [];
      for (let k = 0; k < 6; k++) {
        const r = 22 + k * 36, n = 8 + k * 4, E = 0.45 + k * 0.17, sp = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.283 + P.hash(i, k + 7) * 0.4, rr = r + (P.hash(i, k + 9) - 0.5) * 12;
          sp.push({ x: S.px + Math.cos(a) * rr * 1.25, y: S.py + 10 + Math.sin(a) * rr * 0.8, h: 24 + P.hash(i, k + 3) * 18, w: 5 + (i % 3) });
        }
        rings.push({ E, sp });
        ev.push({ t: E + 0.08, fn() { P.hurtCircle(S.px, S.py + 10, r * 1.25 + 22, 0.5); P.kick(0.14); P.burst(S.px, S.py, 6, 2, 70); } });
      }
      ev.push({ t: 1.55, fn() { P.flash(0.4); P.hurtAll(0.4); P.kick(0.4); } });
      return { events: ev, data: { rings } };
    },
    draw(t, c, S, P, d) {
      const out = P.clamp01((t - 1.65) / 0.4);                       // os espinhos recolhem no fim
      for (const rg of d.rings) for (const s of rg.sp) {
        const h = Math.round(s.h * P.ease.out(P.clamp01((t - rg.E) / 0.16)) * (1 - out));
        if (h < 2) continue;
        for (let j = 0; j < h; j++) {
          const w = Math.max(1, Math.round(s.w * (1 - j / h)));
          P.rect(c, s.x - w, s.y - j, w, 1, S.pal[2]);
          P.rect(c, s.x, s.y - j, w, 1, S.pal[1]);
          if (j < 3) P.rect(c, s.x - w - 1, s.y - j, w * 2 + 2, 1, S.pal[0]);
        }
        P.px(c, s.x, s.y - h, '#fff');
      }
    }
  };

  // ---------- Lutador: Punho Titânico ----------
  ST.fighting = {
    name: 'Punho Titânico', len: 2.0,
    // punho virado para baixo (14x11): o=contorno, a=pele, b=luz
    FIST: [
      '....oooooo....',
      '...oaaaaaao...',
      '...oaaaaaao...',
      '..oaaaaaaaao..',
      '.oaaaabaaaaao.',
      'oaabaaaaaaaaao',
      'oaaaaaaaaaaaao',
      'oabaabaabaabao',
      'oaaaaaaaaaaaao',
      'oaabbaabbaabbo',
      '.oooooooooooo.'
    ],
    init(S, P) {
      const ix = S.px, iy = S.py + 14;
      return {
        events: [
          { t: 0.78, fn() { P.flash(0.9); P.kick(0.9); P.hurtCircle(ix, iy, 70, 1); P.hurtAll(0.6); P.ring(ix, iy, 64, 2, 0.5); P.burst(ix, iy, 26, 2, 120, 160); } },
          { t: 0.92, fn() { P.ring(ix, iy, 110, 1, 0.55); P.kick(0.4); } }
        ],
        data: { ix, iy }
      };
    },
    draw(t, c, S, P, d) {
      const { ix, iy } = d, k = 4, fw = 14 * k, fh = 11 * k;
      if (t < 0.78) P.disc(c, ix, iy, 6 + 26 * (t / 0.78), '#000', true);                 // sombra crescendo no chão
      if (t >= 0.78) {                                                                   // rachaduras
        const g = P.ease.out(P.clamp01((t - 0.78) / 0.3));
        for (let j = 0; j < 10; j++) {
          let x = ix, y = iy, a = j * 0.628 + P.hash(j, 4) * 0.3;
          const L = g * (55 + P.hash(j, 8) * 45);
          for (let s = 0; s < L; s += 6) {
            const nx = x + Math.cos(a) * 6 + (P.hash(j * 17 + s, 2) - 0.5) * 5, ny = y + Math.sin(a) * 6 * 0.8 + (P.hash(j * 17 + s, 3) - 0.5) * 4;
            P.line(c, x, y, nx, ny, '#1b1410', 3); P.line(c, x, y, nx, ny, S.pal[2], 1);
            x = nx; y = ny;
          }
        }
      }
      if (t >= 0.3) {                                                                    // o punho
        let fy;
        if (t < 0.78) fy = -fh + (iy + fh) * P.ease.in(P.clamp01((t - 0.3) / 0.48));
        else if (t < 1.4) fy = iy;
        else fy = iy - P.ease.out(P.clamp01((t - 1.4) / 0.4)) * (fh * 1.4);
        const map = { o: '#2a1208', a: S.pal[1], b: S.pal[2] };
        P.bitmap(c, this.FIST, map, ix - fw / 2, fy - fh, k);
      }
    }
  };

  // ---------- Veneno: Erupção Tóxica ----------
  ST.poison = {
    name: 'Erupção Tóxica', len: 2.1,
    init(S, P) {
      const tg = pickTargets(S, P, 14, 51), gz = [], ev = [];
      tg.forEach((a, i) => {
        const E = 0.4 + i * 0.07;
        gz.push({ x: a.x, y: a.y + 6, E, h: 40 + P.hash(i, 2) * 30 });
        ev.push({ t: E + 0.06, fn() { P.hurtCircle(a.x, a.y, 22, 1); P.kick(0.12); P.burst(a.x, a.y, 6, 2, 70); } });
      });
      ev.push({ t: 1.5, fn() { P.flash(0.5); P.hurtAll(0.5); P.kick(0.5); } });
      return { events: ev, data: { gz } };
    },
    draw(t, c, S, P, d) {
      for (const g of d.gz) {
        const a = t - g.E;
        if (a < 0 || a > 0.9) continue;
        const up = P.ease.out(P.clamp01(a / 0.18)), fade = 1 - P.clamp01((a - 0.5) / 0.4), h = Math.round(g.h * up * fade);
        if (h > 1) {
          P.rect(c, g.x - 5, g.y - h, 10, h, S.pal[1]);
          P.rect(c, g.x - 5, g.y - h, 3, h, S.pal[2]);
          P.rect(c, g.x + 2, g.y - h, 3, h, S.pal[0]);
          P.disc(c, g.x, g.y - h, 8, S.pal[1]); P.disc(c, g.x - 2, g.y - h - 2, 4, S.pal[2]);
        }
        for (let k = 0; k < 5; k++) P.px(c, g.x + (P.hash(k, 3) - 0.5) * 26, g.y - h - (a * 40 * (0.5 + P.hash(k, 6))) % 26, S.pal[2]);   // bolhas
      }
      if (t > 1.5) {                                                                     // nuvem tóxica que estoura
        const u = P.ease.out(P.clamp01((t - 1.5) / 0.5)), fade = 1 - P.clamp01((t - 1.8) / 0.3);
        if (fade > 0) for (let i = 0; i < 4; i++) P.disc(c, S.px + (i - 1.5) * 50, S.py + (i % 2 ? 10 : -10), 42 * u * fade, S.pal[1], true);
      }
    }
  };

  // ---------- Terra: Terremoto ----------
  ST.ground = {
    name: 'Terremoto', len: 2.3,
    init(S, P) {
      const ev = [], rocks = [], cracks = [];
      for (let j = 0; j < 9; j++) cracks.push({ a: j * 0.698 + P.hash(j, 5) * 0.3, L: 90 + P.hash(j, 9) * 110 });
      for (let i = 0; i < 18; i++) {
        const cr = cracks[i % 9], rr = cr.L * (0.45 + P.hash(i, 3) * 0.55);
        const x = S.px + Math.cos(cr.a) * rr * 1.25, y = S.py + Math.sin(cr.a) * rr * 0.8, T = 0.55 + P.hash(i, 6) * 0.5;
        rocks.push({ x, y, T, up: 26 + P.hash(i, 8) * 30, s: 4 + (i % 3) });
        ev.push({ t: T + 0.55, fn() { P.hurtCircle(x, y, 16, 0.7); P.burst(x, y, 4, 1, 50); } });
      }
      for (let k = 0; k < 14; k++) ev.push({ t: 0.35 + k * 0.12, fn() { P.kick(0.3); } });
      [0.5, 1.0, 1.5].forEach(tt => ev.push({ t: tt, fn() { P.hurtAll(0.4); } }));
      ev.push({ t: 1.8, fn() { P.flash(0.4); } });
      return { events: ev, data: { cracks, rocks } };
    },
    draw(t, c, S, P, d) {
      const g = P.ease.out(P.clamp01((t - 0.35) / 0.5)), fade = 1 - P.clamp01((t - 1.9) / 0.4);
      if (fade <= 0) return;
      for (const cr of d.cracks) {
        let x = S.px, y = S.py + 8;
        const L = cr.L * g;
        for (let s = 0; s < L; s += 7) {
          const nx = x + Math.cos(cr.a) * 7 * 1.25 + (P.hash(s + cr.L, 2) - 0.5) * 6, ny = y + Math.sin(cr.a) * 7 * 0.8 + (P.hash(s + cr.L, 3) - 0.5) * 5;
          P.line(c, x, y, nx, ny, '#120a06', 4); P.line(c, x, y, nx, ny, S.pal[1], 1);
          x = nx; y = ny;
        }
      }
      for (const r of d.rocks) {                                   // pedras sobem e caem
        const a = t - r.T;
        if (a < 0 || a > 1.0) continue;
        const u = a / 1.0, y = r.y - Math.sin(u * Math.PI) * r.up;
        P.disc(c, r.x, r.y + 2, 4, '#000', true);
        P.rect(c, r.x - r.s, y - r.s, r.s * 2, r.s * 2, '#6b6258');
        P.rect(c, r.x - r.s, y - r.s, r.s * 2 - 1, 1, '#a39a8c'); P.rect(c, r.x + r.s - 1, y - r.s + 1, 1, r.s * 2 - 1, '#3b352e');
      }
    }
  };

  // ---------- Voador: Furacão ----------
  ST.flying = {
    name: 'Furacão', len: 2.1,
    front(S, P, t) { return -40 + (S.lw + 80) * P.ease.inout(P.clamp01((t - 0.3) / 1.3)); },
    init(S, P) {
      const ev = [], self = this;
      for (let k = 0; k < 16; k++) {
        const tt = 0.32 + k * 0.08;
        ev.push({ t: tt, fn() { const f = self.front(S, P, tt); P.hurtRect(f - 38, 0, f + 38, S.lh, 0.6); if (k % 3 === 0) P.kick(0.2); } });
      }
      ev.push({ t: 1.7, fn() { P.flash(0.3); P.hurtAll(0.3); } });
      return { events: ev };
    },
    draw(t, c, S, P) {
      const lw = S.lw, lh = S.lh, fade = 1 - P.clamp01((t - 1.75) / 0.3);
      if (fade <= 0) return;
      for (let i = 0; i < 46; i++) {                                // rajadas de vento
        const y = P.hash(i, 3) * lh, x = ((P.hash(i, 7) * (lw + 160) + t * (260 + (i % 5) * 70)) % (lw + 160)) - 80;
        P.line(c, x, y, x - 20 - (i % 4) * 8, y, i % 3 ? S.pal[2] : '#fff');
      }
      if (t < 0.3 || t > 1.75) return;
      const f = this.front(S, P, t);
      for (let y = 0; y < lh; y += 3) {                             // funil: cresce para cima
        const u = 1 - y / lh, w = 14 + u * 70, cx = f + Math.sin(y * 0.09 + t * 11) * 7;
        for (let k = 0; k < 4; k++) {
          const off = ((y * 1.7 + t * 90 + k * w / 2) % (w * 2)) - w;
          P.rect(c, cx + off - 6, y, 12 + (k % 2) * 6, 2, k % 2 ? S.pal[2] : S.pal[1]);
        }
        P.rect(c, cx - w, y, 2, 2, S.pal[0]); P.rect(c, cx + w - 2, y, 2, 2, S.pal[0]);
      }
    }
  };

  // ---------- Psíquico: Implosão Psíquica ----------
  ST.psychic = {
    name: 'Implosão Psíquica', len: 2.2,
    init(S, P) {
      const ev = [];
      [0.25, 0.45, 0.65, 0.85].forEach(tt => ev.push({ t: tt, fn() { P.pullEnemies(0.28, 50); P.kick(0.15); } }));
      ev.push({ t: 1.15, fn() { P.flash(1); P.kick(1); P.hurtAll(1); P.ring(S.px, S.py, 140, 2, 0.6); P.burst(S.px, S.py, 30, 3, 140, 0); } });
      ev.push({ t: 1.3, fn() { P.ring(S.px, S.py, 90, 1, 0.5); } });
      return { events: ev };
    },
    draw(t, c, S, P) {
      const cx = S.px, cy = S.py;
      if (t < 1.15) {
        const u = t / 1.15;
        for (let arm = 0; arm < 4; arm++) for (let i = 2; i < 46; i++) {      // espiral que fecha
          const r = (i * 3.4) * (1 - u * 0.85), a = t * 4 + arm * 1.571 + i * 0.2;
          P.rect(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75, 2, 2, i % 6 === 0 ? '#fff' : S.pal[i > 24 ? 1 : 2]);
        }
        for (let k = 0; k < 3; k++) P.circle(c, cx, cy, (1 - ((u + k / 3) % 1)) * 90 + 4, S.pal[2]);   // anéis puxando para dentro
        P.ball(c, cx, cy, 5 + u * 16);
      } else {
        const a = t - 1.15, u = P.ease.out(P.clamp01(a / 0.55)), fade = 1 - P.clamp01((a - 0.5) / 0.4);
        if (fade <= 0) return;
        for (let k = 0; k < 8; k++) P.circle(c, cx, cy, u * 190 - k * 3, k < 2 ? '#fff' : k % 2 ? S.pal[2] : S.pal[1]);
        P.disc(c, cx, cy, 14 * (1 - u) * fade, '#fff');
      }
    }
  };

  // ---------- Inseto: Enxame ----------
  ST.bug = {
    name: 'Enxame Voraz', len: 2.5,
    pos(S, P, t) {
      // passada 1: direita -> esquerda; passada 2: esquerda -> direita
      if (t < 1.35) return S.lw + 30 - (S.lw + 160) * P.ease.inout(P.clamp01((t - 0.3) / 1.0));
      return -30 + (S.lw + 160) * P.ease.inout(P.clamp01((t - 1.25) / 0.95));
    },
    init(S, P) {
      const ev = [], self = this;
      for (let k = 0; k < 22; k++) {
        const tt = 0.34 + k * 0.095;
        ev.push({ t: tt, fn() { const f = self.pos(S, P, tt), dir = tt < 1.3 ? 1 : -1; P.hurtRect(Math.min(f, f + dir * 100), 0, Math.max(f, f + dir * 100), S.lh, 0.5); if (k % 4 === 0) P.kick(0.15); } });
      }
      ev.push({ t: 2.15, fn() { P.flash(0.3); P.hurtAll(0.3); } });
      return { events: ev };
    },
    draw(t, c, S, P) {
      if (t < 0.3 || t > 2.3) return;
      const f = this.pos(S, P, t), dir = t < 1.3 ? 1 : -1, fade = 1 - P.clamp01((t - 2.1) / 0.2);
      if (fade <= 0) return;
      const fr = Math.floor(t * 30);
      for (let i = 0; i < 360; i++) {
        const back = P.hash(i, 3) * 120, x = f + dir * back + (P.hash(i, fr) - 0.5) * 6, y = P.hash(i, 8) * S.lh + (P.hash(i, fr + 5) - 0.5) * 6;
        if (x < -4 || x > S.lw + 4) continue;
        const col = i % 4 === 0 ? S.pal[2] : i % 4 === 1 ? S.pal[1] : i % 4 === 2 ? S.pal[0] : '#fff';
        P.rect(c, x, y, 2, 2, col);
        if (i % 3 === 0) P.px(c, x + (fr % 2 ? -1 : 2), y - 1, '#fff');                 // asinhas batendo
      }
    }
  };

  // ---------- Pedra: Chuva de Pedras ----------
  ST.rock = {
    name: 'Chuva de Pedras', len: 2.1,
    init(S, P) {
      const tg = pickTargets(S, P, 16, 61), b = [], ev = [], FALL = 0.4;
      tg.forEach((a, i) => {
        const L = 0.5 + i * 0.075;
        b.push({ tx: a.x, ty: a.y, L, r: 6 + (i % 3), sx: a.x + 40, sy: a.y - 130, i });
        ev.push({ t: L, fn() { P.hurtCircle(a.x, a.y, 22, 1); P.kick(0.2); P.burst(a.x, a.y, 7, 1, 70, 140); P.ring(a.x, a.y, 20, 2, 0.4); } });
      });
      ev.push({ t: 1.8, fn() { P.flash(0.4); P.hurtAll(0.4); P.kick(0.5); } });
      return { events: ev, data: { b, FALL } };
    },
    draw(t, c, S, P, d) {
      for (const q of d.b) {
        const ph = t - (q.L - d.FALL);
        if (ph < 0) continue;
        if (ph < d.FALL) {                                        // pedra caindo com rastro de poeira
          const u = ph / d.FALL, e = u * u, x = q.sx + (q.tx - q.sx) * e, y = q.sy + (q.ty - q.sy) * e;
          for (let k = 12; k >= 1; k--) P.disc(c, x + k * 1.6, y - k * 3.2, q.r * (1 - k / 14) * 0.8, '#8a8176', true);
          P.disc(c, x, y, q.r, '#3b352e'); P.disc(c, x - 1, y - 1, q.r - 1.5, '#6b6258'); P.disc(c, x - 2, y - 2, q.r * 0.4, '#a39a8c');
          continue;
        }
        const a = t - q.L;
        if (a > 1.0) continue;
        P.disc(c, q.tx, q.ty + 2, 6, '#24201a');                  // cratera
        if (a < 0.4) P.circle(c, q.tx, q.ty, 22 * P.ease.out(a / 0.4), '#a39a8c');          // onda de poeira
        for (let j = 0; j < 5; j++) {                             // espetos de pedra que brotam
          const h = Math.round((8 + P.hash(j + q.i * 5, 2) * 10) * Math.sin(P.clamp01(a / 0.9) * Math.PI)), x = q.tx + (j - 2) * 5;
          for (let r = 0; r < h; r++) P.rect(c, x - Math.max(0, 2 - (r >> 2)), q.ty - r, Math.max(1, 5 - (r >> 1)), 1, r % 5 ? '#6b6258' : '#a39a8c');
        }
      }
    }
  };

  // ---------- Fantasma: Orbe Espectral ----------
  ST.ghost = {
    name: 'Orbe Espectral', len: 2.2,
    FACE: ['.ooooo.', 'oaaaaao', 'oeaaaeo', 'oaaaaao', 'oaoooao', '.oaaao.', '..o.o..'],
    rad(S, P, t) {
      if (t < 1.4) return 6 + P.ease.out(P.clamp01((t - 0.2) / 1.1)) * S.lw * 0.85;
      return Math.max(0, S.lw * 0.85 * (1 - P.ease.in(P.clamp01((t - 1.4) / 0.35))));
    },
    init(S, P) {
      const ev = [], self = this;
      for (let k = 0; k < 6; k++) { const tt = 0.35 + k * 0.17; ev.push({ t: tt, fn() { P.hurtCircle(S.px, S.py, self.rad(S, P, tt), 0.45); P.kick(0.2); } }); }
      ev.push({ t: 1.6, fn() { P.flash(0.8); P.kick(0.8); P.hurtAll(0.6); P.burst(S.px, S.py, 24, 2, 130, 0); P.ring(S.px, S.py, 120, 2, 0.5); } });
      return { events: ev };
    },
    draw(t, c, S, P) {
      if (t < 0.2 || t > 1.8) return;
      const r = this.rad(S, P, t), cx = S.px, cy = S.py;
      if (r < 2) return;
      c.globalAlpha = 0.88; P.disc(c, cx, cy, r, '#150a26'); c.globalAlpha = 1;               // orbe de sombra
      for (let k = 0; k < 4; k++) P.circle(c, cx, cy, r - k, k < 2 ? S.pal[2] : S.pal[1]);
      const map = { o: '#05020a', a: S.pal[2], e: '#ff3b5c' };
      for (let i = 0; i < 9; i++) {                                                           // rostos fantasmas dentro do orbe
        const a = P.hash(i, 4) * 6.283, d = P.hash(i, 9) * (r - 12);
        const x = cx + Math.cos(a) * d * 1.1, y = cy + Math.sin(a) * d * 0.9 - Math.sin(t * 3 + i) * 3;
        if (d > r - 10) continue;
        P.bitmap(c, this.FACE, map, x - 7, y - 7, 2);
      }
    }
  };

  // ---------- Sombrio: Vazio ----------
  ST.dark = {
    name: 'Vazio Sombrio', len: 2.2,
    rad(S, P, t) {
      if (t < 1.25) return 4 + P.ease.in(P.clamp01((t - 0.2) / 1.0)) * S.lw * 0.9;
      return 0;
    },
    init(S, P) {
      const ev = [], self = this;
      for (let k = 0; k < 5; k++) { const tt = 0.4 + k * 0.17; ev.push({ t: tt, fn() { P.hurtCircle(S.px, S.py, self.rad(S, P, tt), 0.4); P.kick(0.15); } }); }
      ev.push({ t: 1.25, fn() { P.flash(1); P.kick(1); P.hurtAll(0.8); P.burst(S.px, S.py, 30, 2, 150, 0); P.ring(S.px, S.py, 130, 2, 0.5); } });
      return { events: ev };
    },
    draw(t, c, S, P) {
      const cx = S.px, cy = S.py;
      if (t >= 0.2 && t < 1.25) {
        const r = this.rad(S, P, t);
        c.globalAlpha = 0.93; P.disc(c, cx, cy, r, '#030208'); c.globalAlpha = 1;
        for (let k = 0; k < 3; k++) P.circle(c, cx, cy, r - k, k ? S.pal[1] : S.pal[2]);
        for (let i = 0; i < 14; i++) {                                   // olhos vermelhos piscando no vazio
          if (Math.sin(t * 6 + i * 2.3) < -0.2) continue;
          const a = P.hash(i, 3) * 6.283, d = P.hash(i, 8) * (r - 10), x = cx + Math.cos(a) * d * 1.1, y = cy + Math.sin(a) * d * 0.9;
          if (d > r - 8) continue;
          P.rect(c, x, y, 3, 2, '#ff2040'); P.rect(c, x + 7, y, 3, 2, '#ff2040'); P.px(c, x + 1, y, '#fff'); P.px(c, x + 8, y, '#fff');
        }
      } else if (t >= 1.25 && t < 1.8) {                                    // explosão de raios sombrios
        const a = t - 1.25, u = P.ease.out(P.clamp01(a / 0.3)), fade = 1 - P.clamp01((a - 0.3) / 0.25);
        for (let i = 0; i < 28; i++) {
          const ang = i * 0.2244 + P.hash(i, 2) * 0.1, L = u * (S.lw * 0.7) * (0.6 + P.hash(i, 5) * 0.4);
          const x1 = cx + Math.cos(ang) * L, y1 = cy + Math.sin(ang) * L;
          if (fade > 0.3 || i % 2) { P.line(c, cx, cy, x1, y1, i % 2 ? '#05030a' : S.pal[2], i % 2 ? 4 : 1); }
        }
        P.disc(c, cx, cy, 16 * (1 - u), '#fff');
      }
    }
  };

  // ---------- Aço: Corte de Aço ----------
  ST.steel = {
    name: 'Corte de Aço', len: 1.9,
    init(S, P) {
      const tg = pickTargets(S, P, 11, 71), sl = [], ev = [];
      tg.forEach((a, i) => {
        const T = 0.4 + i * 0.075, dir = i % 2 ? 1 : -1;
        sl.push({ x: a.x, y: a.y, T, dir });
        ev.push({ t: T, fn() { P.hurtCircle(a.x, a.y, 20, 1); P.kick(0.14); P.burst(a.x, a.y, 7, 3, 90, 60); } });
      });
      ev.push({ t: 1.3, fn() {
        P.flash(0.9); P.kick(0.9); P.hurtAll(0.6);
        P.hurtLine(0, 0, S.lw, S.lh, 24, 0.6); P.hurtLine(S.lw, 0, 0, S.lh, 24, 0.6);
        P.burst(S.lw / 2, S.lh / 2, 30, 3, 160, 0);
      } });
      return { events: ev, data: { sl } };
    },
    draw(t, c, S, P, d) {
      for (const s of d.sl) {
        const a = t - s.T;
        if (a < 0 || a > 0.45) continue;
        const g = P.ease.out(P.clamp01(a / 0.1)), L = 34 * g, th = a < 0.2 ? 4 : 2;
        const x0 = s.x - s.dir * L, y0 = s.y - L, x1 = s.x + s.dir * L, y1 = s.y + L;
        P.line(c, x0, y0, x1, y1, S.pal[1], th + 2); P.line(c, x0, y0, x1, y1, S.pal[2], th); P.line(c, x0, y0, x1, y1, '#fff', 1);
      }
      if (t >= 1.2 && t < 1.8) {                                           // corte final em X, tela cheia
        const a = t - 1.2, g = P.ease.out(P.clamp01(a / 0.12)), fade = 1 - P.clamp01((a - 0.25) / 0.35);
        if (fade > 0) {
          const th = Math.max(2, Math.round(10 * fade));
          for (const [ax, ay, bx, by] of [[0, 0, S.lw, S.lh], [S.lw, 0, 0, S.lh]]) {
            const mx = S.lw / 2, my = S.lh / 2, ex = mx + (bx - mx) * g, ey = my + (by - my) * g, sx = mx + (ax - mx) * g, sy = my + (ay - my) * g;
            P.line(c, sx, sy, ex, ey, S.pal[1], th + 4); P.line(c, sx, sy, ex, ey, S.pal[2], th); P.line(c, sx, sy, ex, ey, '#fff', Math.max(1, th - 4));
          }
        }
      }
    }
  };

  // ---------- Fada: Lua Rosa ----------
  ST.fairy = {
    name: 'Lua Rosa', len: 2.3,
    mp(S, P, t) { return { x: S.px, y: -40 + (S.lh * 0.4 + 40) * P.ease.out(P.clamp01((t - 0.2) / 1.0)) }; },
    init(S, P) {
      const ev = [], self = this;
      ev.push({ t: 1.25, fn() {
        const m = self.mp(S, P, 1.25);
        P.flash(1); P.kick(1); P.hurtAll(1); P.hurtCircle(m.x, m.y, 90, 0.5);
        P.ring(m.x, m.y, 150, 2, 0.6); P.burst(m.x, m.y, 36, 3, 150, 0);
      } });
      ev.push({ t: 1.4, fn() { P.ring(S.px, S.py, 100, 1, 0.5); } });
      return { events: ev };
    },
    draw(t, c, S, P) {
      const star = (x, y, r, col) => { for (let k = -r; k <= r; k++) { P.px(c, x + k, y, col); P.px(c, x, y + k, col); } P.px(c, x, y, '#fff'); };
      if (t < 1.25) {
        const m = this.mp(S, P, t), R0 = 30;
        for (let k = 0; k < 4; k++) P.circle(c, m.x, m.y, R0 + 3 + k * 2, k < 2 ? S.pal[1] : S.pal[2]);
        P.disc(c, m.x, m.y, R0, S.pal[2]); P.disc(c, m.x - 3, m.y - 3, R0 - 4, '#ffe3f1');
        [[-9, -6, 6], [8, 5, 7], [-4, 12, 4], [12, -10, 4]].forEach(([dx, dy, r]) => P.disc(c, m.x + dx, m.y + dy, r, S.pal[1], true));   // crateras
        for (let i = 0; i < 30; i++) star(m.x + (P.hash(i, 3) - 0.5) * 110, m.y + 20 + ((P.hash(i, 6) * 90 + t * 60) % 90), 1, i % 2 ? S.pal[2] : '#fff');
      } else {
        const m = this.mp(S, P, 1.25), a = t - 1.25, u = P.ease.out(P.clamp01(a / 0.8)), fade = 1 - P.clamp01((a - 0.7) / 0.5);
        if (fade <= 0) return;
        for (let i = 0; i < 56; i++) {                                    // lua vira chuva de estrelas
          const ang = i * 0.1122 + P.hash(i, 2) * 0.1, sp = 40 + P.hash(i, 5) * 150;
          star(m.x + Math.cos(ang) * sp * u * 1.3, m.y + Math.sin(ang) * sp * u * 0.9 + a * a * 30, 1 + (i % 3 === 0 ? 1 : 0), i % 3 ? S.pal[2] : '#fff');
        }
        for (let k = 0; k < 4; k++) P.circle(c, m.x, m.y, u * 160 - k * 3, k < 2 ? '#fff' : S.pal[2]);
      }
    }
  };
})();
