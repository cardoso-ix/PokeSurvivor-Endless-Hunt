/* ============ mega_strike.js — golpes assinatura do Mega (um por tipo), em pixel art ============
 * Cada golpe: { name, len, color?, accent?, init(S, P) -> { events, data }, draw(t, c, S, P, data) }
 *   - t: segundos desde o início do golpe; c: contexto do canvas de baixa resolução (S.lw x S.lh)
 *   - S: estado do MegaScene (lw, lh, px/py = posição do Pokémon, aim, enemies, pal = rampa de 4 tons)
 *   - P: primitivas e dano (rect, line, circle, disc, ball, bitmap, hash, ease, burst, ring, hurt*, kick, flash)
 *   - events: [{ t, fn }] — dano e efeitos nos instantes de impacto (dano real vem de P.hurt*)
 * draw() é função pura de t (posições por P.hash), sem estado entre quadros.
 * Tipos sem golpe próprio usam o 'normal' (Hiper Raio) com as cores do tipo.
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
  ST.water = {
    name: 'Tsunami', len: 1.8,
    front(S, P, t) { return -30 + (S.lw + 70) * P.ease.inout(P.clamp01(t / 1.15)); },
    init(S, P) {
      const ev = [], self = this;
      for (let i = 0; i < 10; i++) {
        const tt = 0.08 + i * 0.1;
        ev.push({ t: tt, fn() { const f = self.front(S, P, tt); P.hurtRect(f - 28, 0, f + 16, S.lh, 0.6); if (i % 3 === 0) P.kick(0.15); } });
      }
      ev.push({ t: 1.2, fn() { P.flash(0.3); P.kick(0.4); } });
      return { events: ev };
    },
    draw(t, c, S, P) {
      const lw = S.lw, lh = S.lh, f = this.front(S, P, t);
      const drain = t > 1.2 ? P.ease.in(P.clamp01((t - 1.2) / 0.55)) : 0;
      for (let x = 0; x < lw; x++) {
        if (x > f + 2) break;
        const d = f - x, hf = d > 46 ? 1.2 : 0.12 + (d / 46) * 1.08;
        let top = lh * (1 - hf) + Math.sin(x * 0.2 + t * 9) * 1.5;
        top = Math.max(top, drain * lh);
        if (top >= lh) continue;
        const y0 = Math.round(top);
        P.rect(c, x, y0, 1, 2, '#ffffff');                // espuma
        // faixas contíguas (sem buracos): corpo azul, fundo escuro e uma linha clara entre as ondas
        let yp = y0 + 2;
        for (let b = 0; yp < lh; b++) {
          const yb = Math.min(lh, y0 + 2 + (b + 1) * 9 + Math.round(Math.sin(x * 0.16 + t * 7 + b) * 2));
          const depth = (yp - y0) / lh;
          P.rect(c, x, yp, 1, yb - yp, depth < 0.1 ? S.pal[2] : depth < 0.5 ? S.pal[1] : S.pal[0]);
          if (yb < lh) P.px(c, x, yb - 1, S.pal[2]);
          yp = yb;
        }
      }
      if (t < 1.25) {                                      // respingos na crista
        const fr = Math.floor(t * 24);
        for (let i = 0; i < 36; i++) {
          const x = f - P.hash(i, fr) * 28, y = lh * (0.1 + P.hash(i, fr + 7) * 0.7);
          if (x > 0) P.rect(c, x, y, 1 + (i % 3 === 0), 1, i % 2 ? '#fff' : S.pal[2]);
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
})();
