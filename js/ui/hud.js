
// Listener Global e Infalível para o Botão Retrátil de Status (Mouse e Touch)
if (typeof document !== 'undefined') {
  function handleStatsToggleClick(e) {
    const btn = e.target && e.target.closest('#hud-stats-toggle');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const panel = document.getElementById('stats-rpg-panel');
    const arrow = document.getElementById('hud-stats-arrow');
    if (!panel) return;
    const nowCollapsed = panel.classList.toggle('collapsed');
    if (arrow) arrow.textContent = nowCollapsed ? '▼' : '▲';
    try { localStorage.setItem('ps_stats_panel_expanded', String(!nowCollapsed)); } catch (err) {}
    if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') G.Audio.sfx('click');
  }
  document.addEventListener('click', handleStatsToggleClick, true);
  document.addEventListener('touchend', handleStatsToggleClick, true);
}


  function wireStatsToggle() {
    const btn = document.getElementById('hud-stats-toggle');
    const panel = document.getElementById('stats-rpg-panel');
    const arrow = document.getElementById('hud-stats-arrow');
    if (!btn || !panel || btn._wired) return;
    btn._wired = true;

    // Recupera preferência do usuário (padrão: recolhido para não poluir o mapa)
    const isExpanded = localStorage.getItem('ps_stats_panel_expanded') === 'true';
    if (isExpanded) {
      panel.classList.remove('collapsed');
      if (arrow) arrow.textContent = '▲';
    } else {
      panel.classList.add('collapsed');
      if (arrow) arrow.textContent = '▼';
    }

    btn.onclick = e => {
      e.stopPropagation();
      const nowCollapsed = panel.classList.toggle('collapsed');
      if (arrow) arrow.textContent = nowCollapsed ? '▼' : '▲';
      localStorage.setItem('ps_stats_panel_expanded', String(!nowCollapsed));
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('click');
    };
  }

/* ============ hud.js — interfaz dentro del canvas ============
 * Se dibuja en coordenadas de PANTALLA (sin la transformación de cámara).
 */
G.HUD = (() => {
  const F = (w, s) => `${w} ${s}px Pixelify,"Segoe UI",system-ui,sans-serif`;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function bar(ctx, x, y, w, h, frac, col, bg = 'rgba(0,0,0,.55)') {
    roundRect(ctx, x, y, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
    if (frac > 0) {
      ctx.save();
      roundRect(ctx, x, y, w, h, h / 2); ctx.clip();
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w * G.U.clamp(frac, 0, 1), h);
      ctx.restore();
    }
  }

  function draw(ctx, w, h, pl, st) {
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    G.Touch.clearButtons();
    const touch = G.Touch.active;

    // Atualiza o HUD Inferior Retro Pixel Art no DOM
    try {
      updateBottomRpgHud(pl, st);
    } catch (eHud) {
      // Ignora erro de mutação DOM para não quebrar a lógica ou o frame
    }

    const bottomRpgHud = (typeof document !== 'undefined') ? document.getElementById('bottom-rpg-hud') : null;
    const hasRpgHud = bottomRpgHud && !bottomRpgHud.classList.contains('hidden');
    const px = 16, py = 20;

    // ---------- barra de experiencia (borde superior) ----------
    const xpF = pl.xp / pl.xpNext;
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(0, 0, w, 7);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#4fd1ff'); g.addColorStop(1, '#a98bff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w * G.U.clamp(xpF, 0, 1), 7);

    // ---------- vida + nivel + mega superior (apenas fallback se não houver o HUD RPG inferior) ----------
    if (!hasRpgHud) {
      ctx.font = F(800, 13);
      ctx.fillStyle = '#eaf2ff';
      ctx.textAlign = 'left';
      let prestigeBadge = '';
      if (pl.rarityMultipliers && pl.rarityMultipliers.isShinyLegend) prestigeBadge = ' ✨👑 +50% ATQ';
      else if (pl.rarityMultipliers && pl.rarityMultipliers.isShiny) prestigeBadge = ' ✨ +25% ATQ';
      else if (pl.rarityMultipliers && pl.rarityMultipliers.isLegend) prestigeBadge = ' 👑 +20% ATQ';
      ctx.fillText(pl.mon.name + prestigeBadge, px, py + 10);

      ctx.font = F(700, 11);
      ctx.fillStyle = '#ffcb3d';
      ctx.fillText('Nv. ' + pl.level, px, py + 26);

      bar(ctx, px + 48, py + 17, 168, 11, pl.hp / pl.maxHp, '#ff5f6d');
      ctx.font = F(700, 10);
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(pl.hp) + ' / ' + Math.round(pl.maxHp), px + 48 + 84, py + 26);

      // ---------- BARRA DO MEGA / SUPER FRENZY ----------
      const mx = px + 48, my = py + 31, mw = 168, mh = 11;
      const isMegaActive = pl.megaMode && pl.megaMode.active;
      const megaEnergy = pl.megaEnergy || 0;
      const megaMaxEnergy = pl.megaMaxEnergy || 100;
      const isMegaReady = !isMegaActive && megaEnergy >= megaMaxEnergy;

      // Rótulo à esquerda alinhado com a barra
      ctx.font = F(800, 10);
      ctx.textAlign = 'left';
      if (isMegaActive) {
        const RAINBOW = ['#ffd700', '#ff3366', '#00e5ff', '#76ff03', '#e040fb', '#ff9100'];
        ctx.fillStyle = RAINBOW[Math.floor(performance.now() / 60) % RAINBOW.length];
        ctx.fillText('⚡ MEGA', px, my + 9);
      } else if (isMegaReady) {
        ctx.fillStyle = Math.sin(performance.now() / 120) > 0 ? '#ffd700' : '#00e5ff';
        ctx.fillText('⚡ MEGA', px, my + 9);
      } else {
        ctx.fillStyle = '#a78bfa';
        ctx.fillText('MEGA', px, my + 9);
      }

      if (isMegaActive) {
        // Mega em funcionamento: barra rainbow drena regressivamente com o tempo restante
        const totalDur = pl.megaMode.maxTimer || 15;
        const remTime = Math.max(0, pl.megaMode.timer || 0);
        const frac = G.U.clamp(remTime / totalDur, 0, 1);
        const RAINBOW = ['#ffd700', '#ff3366', '#00e5ff', '#76ff03', '#e040fb', '#ff9100'];
        const rainbowCol = RAINBOW[Math.floor(performance.now() / 60) % RAINBOW.length];
        bar(ctx, mx, my, mw, mh, frac, rainbowCol, 'rgba(30,10,40,.75)');

        // Borda luminosa pulsante
        roundRect(ctx, mx - 1, my - 1, mw + 2, mh + 2, (mh + 2) / 2);
        ctx.strokeStyle = rainbowCol;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Tempo de funcionamento regressivo no HUD
        ctx.font = F(800, 9);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ FÚRIA: ' + remTime.toFixed(1) + 's', mx + mw / 2, my + 9);
      } else if (isMegaReady) {
        // Carga completa (100%): barra dourada pulsante convidando ativação por ESPAÇO
        const pulseColor = Math.sin(performance.now() / 120) > 0 ? '#ffd700' : '#00f5d4';
        bar(ctx, mx, my, mw, mh, 1.0, pulseColor, 'rgba(0,0,0,.65)');

        roundRect(ctx, mx - 1, my - 1, mw + 2, mh + 2, (mh + 2) / 2);
        ctx.strokeStyle = pulseColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = F(800, 9);
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 100% CARREGADO!', mx + mw / 2, my + 9);

        // Permite clicar na própria barra para ativar (mouse ou toque)
        G.Touch.addButton(mx - 4, my - 4, mw + 8, mh + 8, () => pl.activateMega(15), 6);
      } else {
        // Carregando: barra roxa com porcentagem exata de progresso
        const frac = G.U.clamp(megaEnergy / megaMaxEnergy, 0, 1);
        bar(ctx, mx, my, mw, mh, frac, '#9333ea', 'rgba(0,0,0,.55)');

        ctx.font = F(700, 9);
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.textAlign = 'center';
        ctx.fillText('MEGA: ' + Math.floor(megaEnergy) + '%', mx + mw / 2, my + 9);
      }

      // ---------- BOTÃO DE ACIONAMENTO DO MEGA (CLIQUE / ESPAÇO) ----------
      const btnX = (w < 600) ? (px + 48) : (px + 48 + mw + 10);
      const btnY = (w < 600) ? (py + 46) : (py + 17);
      const btnW = (w < 600) ? mw : 108;
      const btnH = (w < 600) ? 24 : 25;

      ctx.save();
      if (isMegaReady) {
        // Mega Pronto: Botão Dourado e Neon pulsante convidativo
        const pulse = 0.5 + Math.sin(performance.now() / 100) * 0.5;
        const bgCol = pulse > 0.4 ? '#ffcb05' : '#00f5d4';

        roundRect(ctx, btnX, btnY, btnW, btnH, 5);
        ctx.fillStyle = bgCol;
        ctx.fill();

        // Borda grossa em Pixel Art
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.font = F(900, 10);
        ctx.fillStyle = '#090d16';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ MEGA [ESPAÇO]', btnX + btnW / 2, btnY + 16);

        // Registra clique no botão (mouse ou touch)
        G.Touch.addButton(btnX, btnY, btnW, btnH, () => pl.activateMega(15), 6);
      } else if (isMegaActive) {
        // Mega Ativo: Botão Rainbow frenético
        const RAINBOW = ['#ffd700', '#ff3366', '#00e5ff', '#76ff03', '#e040fb', '#ff9100'];
        const rCol = RAINBOW[Math.floor(performance.now() / 60) % RAINBOW.length];

        roundRect(ctx, btnX, btnY, btnW, btnH, 5);
        ctx.fillStyle = 'rgba(20, 10, 35, 0.88)';
        ctx.fill();

        ctx.strokeStyle = rCol;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const remTime = Math.max(0, pl.megaMode.timer || 0);
        ctx.font = F(900, 10);
        ctx.fillStyle = rCol;
        ctx.textAlign = 'center';
        ctx.fillText('⚡ FÚRIA: ' + remTime.toFixed(1) + 's', btnX + btnW / 2, btnY + 16);
      } else {
        // Carregando: Botão Translúcido discreto
        roundRect(ctx, btnX, btnY, btnW, btnH, 5);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = F(700, 9);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ MEGA [SPACE]', btnX + btnW / 2, btnY + 16);

        // Ao clicar enquanto carrega, avisa o progresso
        G.Touch.addButton(btnX, btnY, btnW, btnH, () => {
          if (typeof G === 'object' && G.UI && G.UI.toast) {
            G.UI.toast('⚡ Carga Mega: ' + Math.floor(megaEnergy) + '% (Aperte [ESPAÇO] ao atingir 100%)', 1800);
          }
        }, 6);
      }
      ctx.restore();
    }

    const mega = (typeof G === 'object' && G.Mega) ? G.Mega : null;
    const isMegaActiveGlobal = (mega && mega.isActive) || (pl.megaMode && pl.megaMode.active);
    const megaEnergyGlobal = mega ? mega.gauge : (pl.megaEnergy || 0);
    const megaMaxGlobal = mega ? mega.maxGauge : (pl.megaMaxEnergy || 100);
    const isMegaReadyGlobal = !isMegaActiveGlobal && (megaEnergyGlobal >= megaMaxGlobal);

    // Em telas touch: adiciona também um botão flutuante quando pronto (com posição configurável)
    if (touch && isMegaReadyGlobal) {
      const pm = G.Touch.spot('mega');
      const sa = G.Touch.safeArea();
      const tr = 28;
      const tx = pm ? G.U.clamp(pm[0] * w, tr + 4, w - tr - 4) : w - 70 - Math.min(44, sa.right);
      const ty = pm ? G.U.clamp(pm[1] * h, tr + 4, h - tr - 4) : h - 90 - Math.min(28, sa.bottom);
      ctx.save();
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.font = F(900, 14);
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡MEGA', tx, ty);
      ctx.restore();

      G.Touch.addButton(tx - tr, ty - tr, tr * 2, tr * 2, () => pl.activateMega(15), 8);
    }

    // buffs activos
    const COL = { atk: '#ff6b4d', spd: '#7fe0ff', def: '#b0b8c8', regen: '#5fe08a' };
    const LBL = { atk: 'ATK', spd: 'VEL', def: 'DEF', regen: 'REG' };
    let bx = 16;
    const buffY = hasRpgHud ? 154 : 68;
    ctx.textAlign = 'left';
    for (const k in pl.buffs) {
      const b = pl.buffs[k];
      if (b.n <= 0) continue;
      ctx.font = F(800, 9);
      const txt = LBL[k] + ' ×' + b.n;
      const tw = ctx.measureText(txt).width + 12;
      roundRect(ctx, bx, buffY, tw, 15, 7);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill();
      ctx.fillStyle = COL[k];
      ctx.fillText(txt, bx + 6, buffY + 11);
      bx += tw + 5;
    }

    // ---------- reloj / bioma / kills ----------
    ctx.textAlign = 'center';
    ctx.font = F(800, 26);
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.fillText(G.U.mmss(st.time), w / 2, 42);
    ctx.font = F(600, 10);
    ctx.fillStyle = '#8fa3c4';
    ctx.fillText(G.World.biomeName().toUpperCase() + '  ·  ' + pl.kills + ' DERROTADOS  ·  ' + pl.coins + ' POKÉMOEDAS', w / 2, 58);

    // ---------- clima (gerenciado via WeatherSystem) ----------

    // ---------- barra del jefe ----------
    const boss = G.EnemyMgr.all().find(e => e.boss && !e.dead);
    if (boss) {
      const bw = Math.min(420, w - 80);
      bar(ctx, (w - bw) / 2, 70, bw, 12, boss.hp / boss.maxHp, '#ffcb3d');
      ctx.font = F(800, 10);
      ctx.fillStyle = '#20160a';
      ctx.fillText(boss.name.toUpperCase(), w / 2, 80);
    }

    // ---------- aviso ----------
    // ---------- shinies fuera de pantalla: destello en el borde ----------
    const cam = G.Camera, pulse = 0.6 + Math.sin(performance.now() / 160) * 0.4;
    for (const e of G.EnemyMgr.shinies()) {
      const sx = (e.x - cam.left()) * cam.scale, sy = (e.y - cam.top()) * cam.scale;
      if (sx > 0 && sx < w && sy > 0 && sy < h) continue;
      const M = 34;
      const ex = G.U.clamp(sx, M, w - M), ey = G.U.clamp(sy, M + 60, h - M - 70);
      const a = Math.atan2(sy - ey, sx - ex);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.translate(ex, ey);
      ctx.fillStyle = '#9ae6ff';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.lineTo(Math.cos(a + 2.5) * 12, Math.sin(a + 2.5) * 12);
      ctx.lineTo(Math.cos(a - 2.5) * 12, Math.sin(a - 2.5) * 12);
      ctx.fill();
      ctx.globalAlpha = 1;
      G.Icons.draw(ctx, 'shiny', -12, -12, 24);
      ctx.restore();
    }

    // Poder de altar activo (torres de poder)
    if (pl.power && pl.power.def) {
      try {
        const pw = pl.power, txt = (pw.def.name || 'PODER').toUpperCase() + ' ' + Math.ceil(pw.t) + 's';
        ctx.font = F(800, 9);
        ctx.textAlign = 'left';
        const tw = ctx.measureText(txt).width + 12;
        const powerY = hasRpgHud ? 154 : (py + 48);
        roundRect(ctx, bx, powerY, tw, 15, 7);
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fill();
        ctx.fillStyle = pw.def.color || '#ffd23f';
        ctx.fillText(txt, bx + 6, powerY + 11);
        bx += tw + 5;
      } catch (ePow) {}
    }

    if (G.Coop && G.Coop.active) {
      try {
        drawCoop(ctx, w, h, pl, px, py + (bx > px ? 70 : 54));
      } catch (eCoop) {}
    }

    // Fenda: seta grande pulsando na borda ou acima da fenda; na arena, contagem regressiva.
    const rift = G.Rift.rift;
    if (rift) {
      const sx = (rift.x - cam.left()) * cam.scale, sy = (rift.y - 40 - cam.top()) * cam.scale;
      const now = performance.now() / 1000, beat = 0.5 + Math.sin(now * 7) * 0.5;
      const label = 'FENDA · ' + Math.round(G.U.dist(pl.x, pl.y, rift.x, rift.y) / 32) + ' m · ' + Math.ceil(rift.ttl) + ' s';
      const off = sx < 0 || sx > w || sy < 0 || sy > h;
      ctx.save();
      if (off) {
        const M = 52, ex = G.U.clamp(sx, M, w - M), ey = G.U.clamp(sy, M + 70, h - M - 80);
        const a = Math.atan2(sy - ey, sx - ex), ca = Math.cos(a), sa = Math.sin(a);
        ctx.translate(ex, ey);
        // Halo pulsante
        ctx.globalAlpha = 0.18 + beat * 0.22;
        ctx.fillStyle = '#b48aff';
        ctx.beginPath(); ctx.arc(0, 0, 30 + beat * 8, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
        const tri = (k) => {
          ctx.beginPath();
          ctx.moveTo(ca * 40 * k, sa * 40 * k);
          ctx.lineTo(Math.cos(a + 2.45) * 20 * k, Math.sin(a + 2.45) * 20 * k);
          ctx.lineTo(Math.cos(a - 2.45) * 20 * k, Math.sin(a - 2.45) * 20 * k);
          ctx.closePath();
        };
        tri(1.12); ctx.fillStyle = '#1a0b33'; ctx.fill();
        tri(1); ctx.fillStyle = beat > 0.5 ? '#e2d0ff' : '#a06bff'; ctx.fill();
        ctx.font = F(800, 12);
        ctx.textAlign = ca > 0.3 ? 'right' : ca < -0.3 ? 'left' : 'center';
        const lx = -ca * 34, ly = -sa * 30 + 4;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)';
        ctx.strokeText(label, lx, ly);
        ctx.fillStyle = '#e2d0ff';
        ctx.fillText(label, lx, ly);
      } else {
        // Acima da fenda: seta para baixo saltitante
        const by = sy - 46 - Math.abs(Math.sin(now * 4)) * 10;
        ctx.translate(sx, by);
        ctx.beginPath(); ctx.moveTo(-15, -12); ctx.lineTo(15, -12); ctx.lineTo(0, 8); ctx.closePath();
        ctx.lineWidth = 4; ctx.strokeStyle = '#1a0b33'; ctx.stroke();
        ctx.fillStyle = beat > 0.5 ? '#e2d0ff' : '#a06bff'; ctx.fill();
        ctx.font = F(800, 11); ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)';
        const l2 = 'FENDA · ' + Math.ceil(rift.ttl) + ' s';
        ctx.strokeText(l2, 0, -18); ctx.fillStyle = '#e2d0ff'; ctx.fillText(l2, 0, -18);
      }
      ctx.restore();
    }
    if (G.Rift.inArena) {
      ctx.textAlign = 'center';
      ctx.font = F(800, 12);
      ctx.fillStyle = '#d9c2ff';
      ctx.fillText('FENDA · ' + G.U.mmss(G.Rift.timeLeft), w / 2, boss ? 98 : 76);
    }

    // Eventos: contagem regressiva, seta para Pokémon perdido / marca
    G.Events.drawHud(ctx, w, h, pl, F);

    // Aviso de fenda aberta na tela
    if (rift && rift.t < 4.5) {
      const a = Math.min(1, rift.t * 4, (4.5 - rift.t) * 2), pop = 1 + Math.max(0, 0.25 - rift.t) * 1.6;
      const y0 = h * 0.2;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(w / 2, y0); ctx.scale(pop, pop);
      ctx.font = F(800, 20);
      const t1 = 'UMA FENDA DIMENSIONAL FOI ABERTA!', t2 = 'Siga a seta roxa: lá dentro espera um Guardião de Rift!';
      const bw = Math.min(w - 24, Math.max(ctx.measureText(t1).width, (ctx.font = F(700, 11), ctx.measureText(t2).width)) + 36);
      roundRect(ctx, -bw / 2, -26, bw, 52, 10);
      ctx.fillStyle = 'rgba(26,11,51,.88)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#b48aff'; ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = F(800, 20); ctx.fillStyle = '#e2d0ff'; ctx.fillText(t1, 0, -2);
      ctx.font = F(700, 11); ctx.fillStyle = '#c9b0ff'; ctx.fillText(t2, 0, 16);
      ctx.restore();
    }

    const ban = G.Spawner.banner();
    if (ban) {
      const a = Math.min(1, ban.t * 1.6);
      ctx.save();
      ctx.globalAlpha = a;
      // Siempre centrado (antes heredaba la alineación de lo último dibujado, p.
      // ej. la flecha de un duende del tesoro, y salía descolocado).
      ctx.textAlign = 'center';
      ctx.font = F(800, 22);
      ctx.fillStyle = '#ffcb3d';
      ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 4;
      ctx.strokeText(ban.text, w / 2, h * 0.3);
      ctx.fillText(ban.text, w / 2, h * 0.3);
      ctx.restore();
    }

    // ---------- ranura de movimientos ----------
    if (!hasRpgHud) {
    const S = 54, GAP = 9;
    const n = Math.max(1, pl.slots.length);
    const totalW = n * S + (n - 1) * GAP;
    let sx = (w - totalW) / 2;
    // Por encima de la barra de inicio del iPhone (allí los toques a veces no llegan).
    let sy = h - S - 18 - (touch ? Math.min(28, G.Touch.safeArea().bottom) : 0);
    // En móvil, donde la haya puesto el jugador: el bloque objeto + todos los
    // huecos (aunque aún no estén llenos), por su centro, como en el editor
    // (layout-ui.js); los ataques nuevos van saliendo hacia la derecha.
    const pb = touch && G.Touch.spot('bar');
    if (pb) {
      const nAll = Math.max(n, pl.maxMoves), bw = S + 18 + nAll * S + (nAll - 1) * GAP;
      sx = G.U.clamp(pb[0] * w - bw / 2, 6, Math.max(6, w - bw - 6)) + S + 18;
      sy = G.U.clamp(pb[1] * h - S / 2, 24, h - S - 6);
    }
    const BOND = '#ff8ad8';
    const cdOf = m => m.kind === 'orbit' ? 0 : G.U.clamp(m.t / (m.cd * pl.cdMul), 0, 1);

    for (let i = 0; i < n; i++) {
      const g = pl.slots[i] || [];
      const m = g[0];
      const fused = g.length > 1;
      const isCombo = (pl.level >= 20 || pl.quadComboActive);
      const on = isCombo || (i === pl.active);
      const x = sx + i * (S + GAP);
      const y = on ? sy - 6 : sy;
      // Tocar (o hacer clic en) un icono activa ese movimiento.
      if (m) G.Touch.addButton(x, y, S, S, () => { if (G.Game.state === 'playing' && pl.active !== i) { pl.setActive(i); G.Audio.sfx('click'); } }, GAP / 2 + 3);
      const col = m ? G.U.TYPE_COLOR[m.type] : '#4a5468';

      // fondo
      roundRect(ctx, x, y, S, S, 12);
      ctx.fillStyle = on ? 'rgba(20,30,50,.95)' : 'rgba(10,16,28,.8)';
      ctx.fill();
      ctx.lineWidth = on ? 2.5 : fused || (m && m.evolved) ? 2 : 1.2;
      // Vínculo: borde rosa. Evolucionado: dorado. Combo Nv 20: Dourado cintilante.
      ctx.strokeStyle = isCombo ? '#ffd700' : (fused ? BOND : (m && m.evolved ? '#ffd23f' : (on ? col : 'rgba(140,170,210,.22)')));
      ctx.stroke();

      if (!m) continue;

      if (fused) {
        // Vínculo: los movimientos en una cuadrícula de 2×2, cada uno con su recarga.
        const C = 22, P = (S - C * 2) / 3;
        g.forEach((gm, k) => {
          const cx = x + P + (k % 2) * (C + P), cy = y + P + Math.floor(k / 2) * (C + P);
          G.Icons.draw(ctx, 'move:' + gm.id, cx, cy, C);
          const f = cdOf(gm);
          if (f > 0) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(cx, cy, C, C * f); }
          if (gm.evolved) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1; ctx.strokeRect(cx + 0.5, cy + 0.5, C - 1, C - 1); }
          // Destello al lanzarse.
          const fl = 1 - (performance.now() - (gm.castAt || 0)) / 180;
          if (fl > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (fl * 0.55).toFixed(2) + ')'; ctx.fillRect(cx, cy, C, C); }
        });
      } else {
        // recarga: se vacía de abajo a arriba
        const cdFrac = cdOf(m);
        if (cdFrac > 0) {
          ctx.save();
          roundRect(ctx, x, y, S, S, 12); ctx.clip();
          ctx.fillStyle = 'rgba(0,0,0,.6)';
          ctx.fillRect(x, y, S, S * cdFrac);
          ctx.restore();
        }

        // emblema del tipo + insignia de la familia
        G.Icons.draw(ctx, 'move:' + m.id, x + (S - 32) / 2, y + (S - 32) / 2 - 2, 32);

        // nivel del movimiento (puntitos)
        const dots = m.def.maxLvl;
        const dw = 4, dgap = 2;
        const tw = dots * dw + (dots - 1) * dgap;
        for (let d = 0; d < dots; d++) {
          ctx.fillStyle = d < m.lvl ? col : 'rgba(255,255,255,.18)';
          ctx.fillRect(x + (S - tw) / 2 + d * (dw + dgap), y + S - 9, dw, 3);
        }
      }

      // tecla
      ctx.font = F(800, 9);
      ctx.fillStyle = fused ? BOND : on ? col : 'rgba(180,200,230,.6)';
      ctx.textAlign = 'left';
      ctx.fillText(String(i + 1), x + 3, y + 10);

      // nome e nível acima do ativo ou de todos no modo combo
      if (on) {
        ctx.font = F(800, 10);
        ctx.textAlign = 'center';
        ctx.fillStyle = isCombo ? '#ffd700' : (fused ? BOND : col);
        const prefix = isCombo ? '⚡ ' : '';
        const lvlStr = ' Nv.' + m.lvl;
        ctx.fillText(prefix + (fused ? m.name + ' +' + (g.length - 1) : m.name) + lvlStr, x + S / 2, y - 7);
      }
    }

    // ---------- vínculo guardado (aún no hay dos movimientos sueltos) ----------
    if (pl.bonds > 0) {
      const bx = sx + totalW + 12, by = sy + S / 2 - 12;
      G.Icons.draw(ctx, 'bond', bx, by, 24);
      if (pl.bonds > 1) {
        ctx.font = F(800, 10);
        ctx.textAlign = 'left';
        ctx.fillStyle = BOND;
        ctx.fillText('×' + pl.bonds, bx + 25, by + 20);
      }
    }

    // ---------- objeto equipado (a la izquierda de los movimientos) ----------
    {
      const ix = sx - S - 18, iy = sy;
      roundRect(ctx, ix, iy, S, S, 12);
      ctx.fillStyle = pl.item ? 'rgba(40,30,10,.9)' : 'rgba(10,16,28,.55)';
      ctx.fill();
      ctx.lineWidth = pl.item ? 2 : 1;
      ctx.strokeStyle = pl.item ? '#ffd23f' : 'rgba(140,170,210,.18)';
      ctx.stroke();
      if (pl.item) {
        G.Icons.draw(ctx, pl.item, ix + (S - 36) / 2, iy + (S - 36) / 2, 36);
        ctx.font = F(700, 9);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd23f';
        ctx.fillText(G.Items.BY[pl.item].name, ix + S / 2, iy - 6);
      }
    }
    }

    // ---------- botón de pausa (táctil) ----------
    if (touch) {
      const sa = G.Touch.safeArea();
      const pp = G.Touch.spot('pause');
      const bx = pp ? G.U.clamp(pp[0] * w - 20, 4, w - 44) : w - 52 - Math.min(44, sa.right);
      const by = pp ? G.U.clamp(pp[1] * h - 20, 10, h - 44) : 12 + Math.min(20, sa.top), bs = 40;
      roundRect(ctx, bx, by, bs, bs, 10);
      ctx.fillStyle = 'rgba(10,16,28,.7)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(244,248,255,.8)'; ctx.stroke();
      ctx.fillStyle = '#f4f8ff';
      ctx.fillRect(bx + 13, by + 11, 5, 18); ctx.fillRect(bx + 22, by + 11, 5, 18);
      G.Touch.addButton(bx, by, bs, bs, () => G.Game.togglePause(), 8);
    }

    // pista de controles
    if (st.time < 14) {
      ctx.font = F(600, 10);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(180,200,230,.55)';
      ctx.fillText(touch ? 'Arraste o dedo para mover · toque num ataque para trocar'
                         : 'WASD mover · 1-4 / Q / E ou clique para trocar · [Espaço] Mega · Esc pausa', w / 2, h - 4);
    }

    // ---------- TAREFA 1: Radar / Mini-Mapa de Navegação ----------
    const showRadar = (typeof window !== 'undefined' && window.userSettings)
      ? window.userSettings.showRadar
      : (G.Settings.get('showRadar') !== false);
    if (showRadar) {
      drawRadar(ctx, w, h, pl, touch);
    }

    // ---------- TAREFA 2: Painel de Buffs e Status Ativos ----------
    const showBuffTable = (typeof window !== 'undefined' && window.userSettings)
      ? window.userSettings.showBuffTable
      : (G.Settings.get('showBuffTable') !== false);
    if (showBuffTable) {
      drawBuffsPanel(ctx, w, h, pl);
    }

    ctx.restore();
  }

  // ---------------- TAREFA 1: Bússola & Mini-Mapa Retro Pokégear (Estilo DS / GBA) ----------------
  function drawRadar(ctx, w, h, pl, touch) {
    const rad = 72; // Ampliado e nítido
    const cx = w - rad - 16;
    const cy = (touch ? 64 : 16) + rad;
    const innerRad = rad - 9;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 1. Fundo Base Circular Azul-Noite Profundo
    ctx.fillStyle = '#101422';
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    // 2. Retículo / Grade Náutica de Bússola Retro
    ctx.strokeStyle = 'rgba(65, 85, 125, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, innerRad * 0.5, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerRad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(92, 100, 141, 0.28)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - innerRad); ctx.lineTo(cx, cy + innerRad);
    ctx.moveTo(cx - innerRad, cy); ctx.lineTo(cx + innerRad, cy);
    ctx.stroke();

    // 3. Feixe Suave de Varredura Estilo Pokégear / C-Gear (Azul-Elétrico / Ciano)
    const sweep = (performance.now() / 2400) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweep) * innerRad, cy + Math.sin(sweep) * innerRad);
    ctx.stroke();

    // 4. Área Clipada Circular para Entidades e Marcadores
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerRad, 0, Math.PI * 2);
    ctx.clip();

    const RADAR_RANGE = 1400;
    const scale = innerRad / RADAR_RANGE;

    // 4.1 Baús e Caixas de Loot (Quadrados Dourados Chanfrados)
    if (G.World) {
      if (typeof G.World.propsInCircle === 'function') {
        const props = G.World.propsInCircle(pl.x, pl.y, RADAR_RANGE);
        for (let i = 0; i < props.length; i++) {
          const p = props[i];
          if (p.type === 'chest' && p.hp > 0) {
            const dx = p.x - pl.x, dy = p.y - pl.y;
            if (dx * dx + dy * dy <= RADAR_RANGE * RADAR_RANGE) {
              const px = cx + dx * scale;
              const py = cy + dy * scale;
              ctx.fillStyle = '#fbbf24';
              ctx.fillRect(px - 2.5, py - 2.5, 5, 5);
              ctx.strokeStyle = '#090a10';
              ctx.lineWidth = 1;
              ctx.strokeRect(px - 2.5, py - 2.5, 5, 5);
            }
          }
        }
      }
      if (typeof G.World.specialsNear === 'function') {
        const specials = G.World.specialsNear(pl.x, pl.y, RADAR_RANGE);
        for (let i = 0; i < specials.length; i++) {
          const p = specials[i];
          const dx = p.x - pl.x, dy = p.y - pl.y;
          if (dx * dx + dy * dy > RADAR_RANGE * RADAR_RANGE) continue;
          const spX = cx + dx * scale;
          const spY = cy + dy * scale;

          if (p.type === 'bigchest' && !p.used) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(spX - 3, spY - 3, 6, 6);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(spX - 3, spY - 3, 6, 6);
          } else if (p.type === 'altar' && !p.used) {
            // Torre / Altar de Poder Místico: Marcador losango brilhante
            const pCols = ['#ff5f6d', '#5fd4ff', '#ff8ad8', '#ffd23f'];
            const pCol = pCols[p.kind % 4] || '#38bdf8';
            ctx.fillStyle = pCol;
            ctx.beginPath();
            ctx.moveTo(spX, spY - 3.5);
            ctx.lineTo(spX + 3.5, spY);
            ctx.lineTo(spX, spY + 3.5);
            ctx.lineTo(spX - 3.5, spY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else if (p.type === 'spring' && p.charge > 0.05) {
            // Manancial de Cura: Círculo verde-água brilhante
            ctx.fillStyle = '#2dd4bf';
            ctx.beginPath();
            ctx.arc(spX, spY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    // 4.2 Inimigos Comuns e Chefes
    if (G.EnemyMgr) {
      const enemies = G.EnemyMgr.all();
      const now = performance.now() / 1000;
      const bPulse = 4.2 + Math.sin(now * 8) * 1.5;

      // Inimigos comuns: pontos em vermelho carmim
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead || e.boss) continue;
        const dx = e.x - pl.x, dy = e.y - pl.y;
        if (dx * dx + dy * dy > RADAR_RANGE * RADAR_RANGE) continue;
        const ex = cx + dx * scale;
        const ey = cy + dy * scale;
        ctx.beginPath();
        ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Chefes / Bosses: aura de fogo pulsante e borda branca de alta visibilidade
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead || !e.boss) continue;
        const dx = e.x - pl.x, dy = e.y - pl.y;
        const dist = Math.hypot(dx, dy);
        let bx, by;
        if (dist > RADAR_RANGE) {
          const a = Math.atan2(dy, dx);
          bx = cx + Math.cos(a) * (innerRad - 5);
          by = cy + Math.sin(a) * (innerRad - 5);
        } else {
          bx = cx + dx * scale;
          by = cy + dy * scale;
        }

        // Anel de aviso translúcido
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx, by, bPulse + 2.5, 0, Math.PI * 2);
        ctx.stroke();

        // Ponto central do Boss
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(bx, by, bPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // 4.3 Rift / Portal (Losango Místico Violeta Neon)
    if (G.Rift && G.Rift.rift) {
      const rift = G.Rift.rift;
      const dx = rift.x - pl.x, dy = rift.y - pl.y;
      const dist = Math.hypot(dx, dy);
      const now = performance.now() / 1000;
      const rPulse = 4.8 + Math.sin(now * 7) * 1.5;

      if (dist <= RADAR_RANGE) {
        const rx_p = cx + dx * scale;
        const ry_p = cy + dy * scale;
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.moveTo(rx_p, ry_p - rPulse);
        ctx.lineTo(rx_p + rPulse, ry_p);
        ctx.lineTo(rx_p, ry_p + rPulse);
        ctx.lineTo(rx_p - rPulse, ry_p);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        // Fora do alcance: seta indicadora chanfrada na borda apontando a direção
        const a = Math.atan2(dy, dx);
        const edgeR = innerRad - 5;
        const ax = cx + Math.cos(a) * edgeR;
        const ay = cy + Math.sin(a) * edgeR;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(a);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-1, 0);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4.4 Jogador no Centro (Esmeralda Vibrante com Ponteiro de Bússola)
    const face = pl.attackFace > 0 || !pl.walking ? pl.aim : pl.moveAngle;

    // Halo suave
    ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();

    // Ponteiro de mira / bússola
    const arrowLen = 9;
    const ax = cx + Math.cos(face) * arrowLen;
    const ay = cy + Math.sin(face) * arrowLen;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Ponto central do Treinador
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore(); // Fecha o clip circular

    // 5. Moldura Chanfrada de Bússola Retro (Estilo DS / GBA)
    // Aro externo metálico azul-acinzentado (#3a3f58) de 3.5px
    ctx.strokeStyle = '#3a3f58';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rad - 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // Anel Dourado Chanfrado de Luxo Pokégear (#f8b800)
    // Arco de luz superior/esquerdo
    ctx.strokeStyle = '#ffe868';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, rad - 4.5, -Math.PI * 0.75, Math.PI * 0.25);
    ctx.stroke();

    // Arco de sombra inferior/direito
    ctx.strokeStyle = '#986000';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, rad - 4.5, Math.PI * 0.25, Math.PI * 1.25);
    ctx.stroke();

    // Borda chanfrada interna de profundidade (#090a10)
    ctx.strokeStyle = '#090a10';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, rad - 6.5, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Insígnias Cardeais Clássicas nos 4 Eixos
    // NORTE (N) - Badge de Bússola estilizado no topo
    const northY = cy - rad + 3;
    ctx.fillStyle = '#090a10';
    ctx.fillRect(cx - 7, northY - 4, 14, 11);
    ctx.strokeStyle = '#f8b800';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 6.5, northY - 3.5, 13, 10);

    ctx.font = '900 9px "Pixelify", "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('N', cx, northY + 1.5);

    // Rebites / Losangos Dourados nos eixos Leste, Sul e Oeste
    const drawDiamond = (px, py) => {
      ctx.fillStyle = '#f8b800';
      ctx.beginPath();
      ctx.moveTo(px, py - 3);
      ctx.lineTo(px + 3, py);
      ctx.lineTo(px, py + 3);
      ctx.lineTo(px - 3, py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffe868';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    drawDiamond(cx + rad - 4, cy); // Leste
    drawDiamond(cx, cy + rad - 4); // Sul
    drawDiamond(cx - rad + 4, cy); // Oeste

    ctx.restore();
  }

  // ---------------- TAREFA 2: Painel de Atributos & Status Retro Pixel Art (Estilo DS / GBA) ----------------
  function drawBuffsPanel(ctx, w, h, pl) {
    if (!pl) return;

    // Valores reais percentuais do jogador
    const atkBonus = Math.round((((pl.atk || pl.baseAtk || 1) / (pl.baseAtk || 1)) - 1) * 100);
    const atkVal = (atkBonus >= 0 ? '+' : '') + atkBonus + '%';

    const defVal = (pl.reduction > 0 ? '+' : '') + Math.round((pl.reduction || 0) * 100) + '%';

    const spdBonus = Math.round((((pl.spd || pl.baseSpd || 1) / (pl.baseSpd || 1)) - 1) * 100);
    const spdVal = (spdBonus >= 0 ? '+' : '') + spdBonus + '%';

    const cdrBonus = Math.max(0, Math.round((1 - (pl.cdMul || 1)) * 100));
    const cdrVal = (cdrBonus > 0 ? '-' : '') + cdrBonus + '%';

    const critVal = '+' + Math.round((pl.critChance || 0) * 100) + '%';

    const magBonus = Math.round((((pl.magnet || 78) / 78) - 1) * 100);
    const magVal = (magBonus >= 0 ? '+' : '') + magBonus + '%';

    const aprBonus = Math.round(((pl.xpMul || 1) - 1) * 100);
    const aprVal = (aprBonus >= 0 ? '+' : '') + aprBonus + '%';

    const regVal = '+' + ((pl.regen || 0)).toFixed(1) + '/s';

    // 1. Atualização do Componente DOM Retrô (Estilo DS / GBA idêntico ao de vida)
    try {
      const statsEl = (typeof document !== 'undefined') ? document.getElementById('stats-rpg-panel') : null;
      if (statsEl) {
        const isPlaying = (typeof G === 'object' && G.Game && (G.Game.state === 'playing' || G.Game.state === 'choice' || G.Game.state === 'levelup'));
        if (!isPlaying) {
          if (!statsEl.classList.contains('hidden')) statsEl.classList.add('hidden');
          return;
        }
        wireStatsToggle();

        const setVal = (id, val) => {
          try {
            const el = document.getElementById(id);
            if (el && el.textContent !== val) el.textContent = val;
          } catch (_) {}
        };

        setVal('stat-val-atk', atkVal);
        setVal('stat-val-def', defVal);
        setVal('stat-val-spd', spdVal);
        setVal('stat-val-cda', cdrVal);
        setVal('stat-val-crt', critVal);
        setVal('stat-val-mag', magVal);
        setVal('stat-val-apr', aprVal);
        setVal('stat-val-reg', regVal);
        return; // Elemento DOM cuidou da renderização
      }
    } catch (eStats) {
      // Fallback para renderização no Canvas se o DOM falhar
    }

    // 2. Fallback Canvas Ampliado no Padrão Retro Pixel Art (se o DOM não estiver disponível)
    const pw = 290, ph = 114;
    const px = 16, py = h - ph - 18;

    // Fundo sólido estilo DS / GBA (#141624)
    ctx.fillStyle = '#141624';
    roundRect(ctx, px, py, pw, ph, 8);
    ctx.fill();

    // Chanfro e Borda externa (#3a3f58)
    ctx.strokeStyle = '#3a3f58';
    ctx.lineWidth = 4;
    roundRect(ctx, px, py, pw, ph, 8);
    ctx.stroke();

    // Chanfro interno de luz (#5c648d) e sombra (#090a10)
    ctx.strokeStyle = '#5c648d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + 4, py + ph - 4);
    ctx.lineTo(px + 4, py + 4);
    ctx.lineTo(px + pw - 4, py + 4);
    ctx.stroke();

    ctx.strokeStyle = '#090a10';
    ctx.beginPath();
    ctx.moveTo(px + pw - 4, py + 4);
    ctx.lineTo(px + pw - 4, py + ph - 4);
    ctx.lineTo(px + 4, py + ph - 4);
    ctx.stroke();

    // Cabeçalho / Badge STATUS
    roundRect(ctx, px + 8, py + 7, 54, 16, 4);
    ctx.fillStyle = '#f8b800';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = F(900, 9);
    ctx.fillStyle = '#090a10';
    ctx.textAlign = 'center';
    ctx.fillText('STATUS', px + 35, py + 19);

    ctx.font = F(700, 10);
    ctx.fillStyle = '#8fa3c4';
    ctx.textAlign = 'right';
    ctx.fillText('ATRIBUTOS', px + pw - 10, py + 19);

    // Divisor
    ctx.strokeStyle = '#232738';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 26);
    ctx.lineTo(px + pw - 8, py + 26);
    ctx.stroke();

    // Slots individuais de atributos
    const drawSlot = (label, val, x, y, col) => {
      const sw = 132, sh = 18;
      ctx.fillStyle = '#090a10';
      roundRect(ctx, x, y, sw, sh, 4);
      ctx.fill();
      ctx.strokeStyle = '#282d44';
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, sw, sh, 4);
      ctx.stroke();

      ctx.font = F(700, 10);
      ctx.fillStyle = '#b4c8e6';
      ctx.textAlign = 'left';
      ctx.fillText(label, x + 6, y + 13);

      ctx.font = F(800, 11);
      ctx.fillStyle = col;
      ctx.textAlign = 'right';
      ctx.fillText(val, x + sw - 6, y + 13);
    };

    const col1 = px + 8;
    const col2 = px + 150;
    const row1 = py + 31;
    const row2 = py + 51;
    const row3 = py + 71;
    const row4 = py + 91;

    drawSlot('⚔ ATK', atkVal, col1, row1, '#ff6b4d');
    drawSlot('🛡 DEF', defVal, col2, row1, '#67e8f9');

    drawSlot('👟 SPD', spdVal, col1, row2, '#4ade80');
    drawSlot('⏱ CDA', cdrVal, col2, row2, '#facc15');

    drawSlot('🎯 CRT', critVal, col1, row3, '#f472b6');
    drawSlot('🧲 MAG', magVal, col2, row3, '#c084fc');

    drawSlot('📖 APR', aprVal, col1, row4, '#38bdf8');
    drawSlot('🌿 REG', regVal, col2, row4, '#a3e635');
  }

  // ---------------- cooperativo ----------------

  /**
   * - Vida de cada compañero debajo de la tuya.
   * - Flecha en el borde de la pantalla hacia los que no se ven, con su nombre
   *   y a cuántos metros están (roja y parpadeando si está caído).
   * - Si has caído tú: aviso y barra de "te están levantando".
   */
  function drawCoop(ctx, w, h, pl, px, top) {
    const cam = G.Camera;
    const t = performance.now() / 1000;
    let y = top;
    ctx.textAlign = 'left';
    for (const m of G.Coop.mates) {
      if (!m.connected) continue;
      const o = m.pl;
      ctx.font = F(800, 10);
      ctx.fillStyle = m.color;
      ctx.fillText(m.name, px, y + 9);
      const lx = px + 78;
      bar(ctx, lx, y + 1, 110, 8, o.dead ? 0 : o.hp / o.maxHp, o.dead ? '#ff5f6d' : '#5fe08a');
      if (o.dead) {
        ctx.font = F(800, 9);
        ctx.fillStyle = Math.sin(t * 8) > 0 ? '#ff8a96' : '#ffd0d5';
        ctx.fillText('CAÍDO', lx + 116, y + 9);
      }
      y += 15;
    }

    // Flechas hacia los compañeros fuera de la vista.
    for (const m of G.Coop.mates) {
      if (!m.connected) continue;
      const o = m.pl;
      const sx = (o.x - cam.left()) * cam.scale, sy = (o.y - o.bodyH * 0.5 - cam.top()) * cam.scale;
      if (sx > 0 && sx < w && sy > 0 && sy < h) continue;
      const M = 42;
      const ex = G.U.clamp(sx, M, w - M), ey = G.U.clamp(sy, M + 70, h - M - 80);
      const a = Math.atan2(sy - ey, sx - ex);
      const metres = Math.round(G.U.dist(pl.x, pl.y, o.x, o.y) / 32);
      const col = o.dead ? (Math.sin(t * 8) > 0 ? '#ff5f6d' : '#ffd0d5') : m.color;
      ctx.save();
      ctx.translate(ex, ey);
      // Flecha
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, 6.2832); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
      ctx.lineTo(Math.cos(a + 2.4) * 14, Math.sin(a + 2.4) * 14);
      ctx.lineTo(Math.cos(a - 2.4) * 14, Math.sin(a - 2.4) * 14);
      ctx.closePath(); ctx.fill();
      // Inicial del compañero dentro del círculo
      ctx.font = F(800, 14);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(m.name.charAt(0).toUpperCase(), 0, 5);
      // Nombre y distancia: al lado contrario de la flecha, para que no se salga
      const lx = -Math.cos(a) * 30, ly = -Math.sin(a) * 26 + 4;
      ctx.font = F(800, 12);
      const label = (o.dead ? '¡' + m.name + ' necesita ayuda! ' : m.name + ' ') + '· ' + metres + ' m';
      ctx.textAlign = Math.cos(a) > 0.3 ? 'right' : Math.cos(a) < -0.3 ? 'left' : 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)';
      ctx.strokeText(label, lx, ly);
      ctx.fillStyle = col;
      ctx.fillText(label, lx, ly);
      ctx.restore();
    }

    // Tú, caído.
    if (pl.dead) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = F(800, 20);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.75)';
      const msg = G.Coop.players().every(p => p.dead) ? 'Todos foram derrotados…' : 'Você caiu: um companheiro pode reviver você';
      ctx.strokeText(msg, w / 2, h * 0.62);
      ctx.fillStyle = '#ffb0b8';
      ctx.fillText(msg, w / 2, h * 0.62);
      const f = (pl.reviveT || 0) / G.Player.REVIVE_TIME;
      if (f > 0) bar(ctx, w / 2 - 110, h * 0.62 + 12, 220, 10, f, '#5fe08a');
      ctx.restore();
    }
  }

  let lastMonDex = null;
  let lastSlotsSignature = '';

  function updateBottomRpgHud(pl, st) {
    if (typeof document === 'undefined') return;
    try {
      const el = document.getElementById('bottom-rpg-hud');
      if (!el) return;

      const statsEl = document.getElementById('stats-rpg-panel');
      if (!pl || (typeof G === 'object' && G.Game && G.Game.state !== 'playing' && G.Game.state !== 'choice' && G.Game.state !== 'levelup')) {
        if (!el.classList.contains('hidden')) el.classList.add('hidden');
        if (statsEl && !statsEl.classList.contains('hidden')) statsEl.classList.add('hidden');
        return;
      }
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
      }

      // 1. Avatar Canvas do Líder
      const cvs = document.getElementById('hud-avatar-canvas');
      if (cvs && pl.mon && lastMonDex !== pl.mon.dex) {
        lastMonDex = pl.mon.dex;
        if (typeof G === 'object' && G.UI && typeof G.UI.sprite === 'function') {
          G.UI.sprite(cvs, pl.mon.dex, { scale: 1.15, lively: true, hero: true, shiny: !!pl.shiny });
        }
      }

      // 2. Badge de Nível
      const lvlEl = document.getElementById('hud-level-val');
      if (lvlEl && lvlEl.textContent !== String(pl.level)) {
        lvlEl.textContent = pl.level;
      }

      // 3. Nome do Personagem / Líder / Ascensão com Badge de Poder Real
      const nameEl = document.getElementById('hud-char-name');
      if (nameEl) {
        let badge = '';
        if (pl.rarityMultipliers && pl.rarityMultipliers.isShinyLegend) badge = ' ✨👑 +50% ATQ';
        else if (pl.rarityMultipliers && pl.rarityMultipliers.isShiny) badge = ' ✨ +25% ATQ';
        else if (pl.rarityMultipliers && pl.rarityMultipliers.isLegend) badge = ' 👑 +20% ATQ';
        const charTitle = ((pl.ascensionTitle || (pl.mon && pl.mon.name) || 'TREINADOR') + badge).toUpperCase();
        if (nameEl.textContent !== charTitle) nameEl.textContent = charTitle;
      }

      // 4. Barra de HP & Ghost Bar
      const hp = Math.max(0, pl.hp);
      const maxHp = Math.max(1, pl.maxHp);
      const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
      const hpBar = document.getElementById('hud-hp-bar');
      const hpGhost = document.getElementById('hud-hp-ghost');
      const hpText = document.getElementById('hud-hp-text');

      if (hpText) {
        const hpPrefix = (window.i18n ? window.i18n.t('hud.hp') : 'PV');
        const textVal = `${hpPrefix} ${Math.ceil(hp)} / ${Math.round(maxHp)}`;
        if (hpText.textContent !== textVal) hpText.textContent = textVal;
      }

      if (hpBar) {
        hpBar.style.width = hpPct.toFixed(1) + '%';
        hpBar.classList.remove('high', 'mid', 'low');
        if (hpPct > 50) {
          hpBar.classList.add('high');
        } else if (hpPct >= 20) {
          hpBar.classList.add('mid');
        } else {
          hpBar.classList.add('low');
        }
      }

      if (hpGhost) {
        hpGhost.style.width = hpPct.toFixed(1) + '%';
      }

      // 5. Barra e Botão do Mega Overdrive
      const mega = (typeof G === 'object' && G.Mega) ? G.Mega : null;
      const megaBar = document.getElementById('hud-mega-bar');
      const megaLabel = document.getElementById('hud-mega-label');
      const megaBtn = document.getElementById('hud-mega-btn');
      const megaBtnTxt = document.getElementById('hud-mega-btn-txt');

      const isMegaActive = (mega && mega.isActive) || (pl.megaMode && pl.megaMode.active);
      const megaEnergy = mega ? mega.gauge : (pl.megaEnergy || 0);
      const megaMax = mega ? mega.maxGauge : (pl.megaMaxEnergy || 100);
      const isMegaReady = !isMegaActive && (megaEnergy >= (megaMax - 0.8));

      if (megaBar) {
        if (isMegaActive) {
          const dur = (mega && mega.duration) || (pl.megaMode && pl.megaMode.maxTimer) || 10;
          const timeLeft = mega ? mega.timeLeft : (pl.megaMode && pl.megaMode.timer) || 0;
          const pct = Math.max(0, Math.min(100, (timeLeft / dur) * 100));
          megaBar.style.width = pct.toFixed(1) + '%';
          megaBar.classList.remove('ready');
          megaBar.classList.add('active');
          if (megaLabel) megaLabel.textContent = window.i18n ? window.i18n.t('hud.megaActive', { time: timeLeft.toFixed(1) }) : `MEGA: ${timeLeft.toFixed(1)}s`;
        } else if (isMegaReady) {
          megaBar.style.width = '100%';
          megaBar.classList.add('ready');
          megaBar.classList.remove('active');
          if (megaLabel) megaLabel.textContent = window.i18n ? window.i18n.t('hud.megaReady') : '[ ESPAÇO: MEGA PRONTO ]';
        } else {
          const pct = Math.max(0, Math.min(100, (megaEnergy / megaMax) * 100));
          megaBar.style.width = pct.toFixed(1) + '%';
          megaBar.classList.remove('ready', 'active');
          if (megaLabel) megaLabel.textContent = window.i18n ? window.i18n.t('hud.megaCharging', { pct: Math.floor(pct) }) : `MEGA: ${Math.floor(pct)}%`;
        }
      }

      // Atualiza o estado visual do Botão Físico Retro
      if (megaBtn) {
        if (isMegaActive) {
          const timeLeft = mega ? mega.timeLeft : (pl.megaMode && pl.megaMode.timer) || 0;
          megaBtn.classList.remove('ready');
          megaBtn.classList.add('active');
          if (megaBtnTxt) megaBtnTxt.textContent = `⚡ ${timeLeft.toFixed(1)}s`;
          megaBtn.title = "Mega Ativo!";
        } else if (isMegaReady) {
          megaBtn.classList.add('ready');
          megaBtn.classList.remove('active');
          if (megaBtnTxt) megaBtnTxt.textContent = '⚡ MEGA [ESPAÇO]';
          megaBtn.title = "Mega Pronto! Clique ou aperte [ESPAÇO] para ativar o Poder Supremo!";
        } else {
          const pct = Math.max(0, Math.min(100, (megaEnergy / megaMax) * 100));
          megaBtn.classList.remove('ready', 'active');
          if (megaBtnTxt) megaBtnTxt.textContent = `⚡ MEGA ${Math.floor(pct)}%`;
          megaBtn.title = `Carregando Mega (${Math.floor(pct)}%)`;
        }
      }

      // Fiação de evento para o Botão e para a Barra
      const onMegaAction = () => {
        if (!pl) return;
        const current = Math.max((mega && mega.gauge) || 0, pl.megaEnergy || 0);
        const max = (mega && mega.maxGauge) || pl.megaMaxEnergy || 100;
        if (current >= (max - 0.8) && !isMegaActive) {
          if (typeof pl.activateMega === 'function') {
            pl.activateMega();
          } else if (mega && typeof mega.trigger === 'function') {
            mega.trigger();
          }
        } else if (!isMegaActive) {
          const pct = Math.floor((current / max) * 100);
          if (typeof G === 'object' && G.UI && typeof G.UI.toast === 'function') {
            G.UI.toast(`⚡ Mega carregando: ${pct}% (Pronto ao atingir 100% ou tecla [ESPAÇO])`, 1800);
          }
          if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') {
            G.Audio.sfx('select');
          }
        }
      };

      if (megaBtn && !megaBtn._wired) {
        megaBtn._wired = true;
        megaBtn.addEventListener('click', onMegaAction);
      }

      const megaTrack = document.querySelector('.mega-track');
      if (megaTrack && !megaTrack._wired) {
        megaTrack._wired = true;
        megaTrack.style.cursor = 'pointer';
        megaTrack.addEventListener('click', onMegaAction);
      }

      // 6. Slots e Cards de Ataques Ativos (Disparo Simultâneo Contínuo + Sobrecarga Nv. 20)
      const tray = document.getElementById('hud-skills-tray');
      if (tray && pl.slots) {
        const isOvercharge = pl.level >= 20;
        const isCombo = (pl.level >= 20 || pl.quadComboActive); // Super Combo: todos os slots disparam juntos
        const maxSlots = pl.maxMoves || 4;

        // Atualiza cabeçalho do combo
        const comboContainer = document.querySelector('.hud-combo-container');
        const comboTitle = document.getElementById('hud-combo-title');
        const comboBadge = document.getElementById('hud-combo-badge');

        if (comboContainer) {
          comboContainer.classList.toggle('combo-unlocked', isOvercharge);
        }
        if (comboTitle) {
          comboTitle.textContent = isOvercharge
            ? '⚡ SUPER COMBO ATIVO · 4 ATAQUES JUNTOS ⚡'
            : '⚔️ ATAQUES PARA COMBAR · ESCOLHA O SLOT (1-4)';
        }
        if (comboBadge) {
          comboBadge.textContent = isOvercharge
            ? '🔥 COMBANDO JUNTOS · +20% ÁREA · -15% RECARGA'
            : `NV. ${pl.level}/20`;
        }

        // Assinatura única do estado dos slots
        let sig = `${maxSlots}-${pl.active}-${isCombo ? 'combo' : 'solo'}`;
        for (let i = 0; i < maxSlots; i++) {
          const g = pl.slots[i] || [];
          const m = g[0];
          if (m) sig += `_${m.id}_${m.lvl}_${m.name}`;
          else sig += `_empty`;
        }

        if (sig !== lastSlotsSignature) {
          lastSlotsSignature = sig;
          tray.innerHTML = '';

          for (let i = 0; i < maxSlots; i++) {
            const g = pl.slots[i] || [];
            const m = g[0];

            const cardEl = document.createElement('div');
            cardEl.dataset.slotIdx = String(i);

            if (m) {
              const isMax = m.def && m.lvl >= m.def.maxLvl;
              // No Super Combo (Nv 20+) todos os cards ficam ativos; antes disso,
              // só o slot selecionado fica ativo (a seleção é feita com 1-4/Q/E).
              cardEl.className = `hud-skill-card ${(i === pl.active || isCombo) ? 'active' : ''} ${isCombo ? 'combo-active' : ''} ${g.length > 1 ? 'fused' : ''}`;
              cardEl.title = isCombo ? `⚡ COMBO TOTAL ATIVO: ${m.name} (Nv. ${m.lvl})` : `${m.name} (Nv. ${m.lvl})`;

              // 1. Ícone
              const iconWrap = document.createElement('div');
              iconWrap.className = 'hud-skill-icon-wrap';
              if (typeof G === 'object' && G.Icons && typeof G.Icons.html === 'function') {
                iconWrap.innerHTML = G.Icons.html('move:' + m.id, 24);
              }
              cardEl.appendChild(iconWrap);

              // 2. Informações de Nome e Nível do Ataque
              const infoWrap = document.createElement('div');
              infoWrap.className = 'hud-skill-info';

              const nameEl = document.createElement('div');
              nameEl.className = 'hud-skill-name';
              nameEl.textContent = m.name || m.id;
              if (typeof G === 'object' && G.U && G.U.TYPE_COLOR && G.U.TYPE_COLOR[m.type]) {
                nameEl.style.color = G.U.TYPE_COLOR[m.type];
              }
              infoWrap.appendChild(nameEl);

              const lvlEl = document.createElement('div');
              lvlEl.className = `hud-skill-lvl-tag ${isMax ? 'max' : ''}`;
              lvlEl.textContent = isMax ? `NV. ${m.lvl} MAX` : `NV. ${m.lvl}`;
              infoWrap.appendChild(lvlEl);

              cardEl.appendChild(infoWrap);

              // 3. Cooldown Sweep
              const sweepEl = document.createElement('div');
              sweepEl.className = 'hud-cd-sweep';
              sweepEl.id = `hud-cd-sweep-${i}`;
              sweepEl.style.height = '0%';
              cardEl.appendChild(sweepEl);

              cardEl.addEventListener('click', () => {
                if (typeof G === 'object' && G.Game && G.Game.state === 'playing' && pl.active !== i) {
                  pl.setActive(i);
                  if (G.Audio) G.Audio.sfx('click');
                }
              });
            } else {
              // Slot vazio
              cardEl.className = 'hud-skill-card empty';
              cardEl.title = 'Slot de Ataque Vazio (Obtenha novos ataques ao subir de nível)';

              const iconWrap = document.createElement('div');
              iconWrap.className = 'hud-skill-icon-wrap';
              iconWrap.innerHTML = '<span style="color:#64748b;font-size:16px;font-weight:bold;">+</span>';
              cardEl.appendChild(iconWrap);

              const infoWrap = document.createElement('div');
              infoWrap.className = 'hud-skill-info';

              const nameEl = document.createElement('div');
              nameEl.className = 'hud-skill-name';
              nameEl.style.color = '#64748b';
              nameEl.textContent = `SLOT ${i + 1}`;
              infoWrap.appendChild(nameEl);

              const emptyTxt = document.createElement('div');
              emptyTxt.className = 'hud-skill-empty-txt';
              emptyTxt.textContent = 'Vazio';
              infoWrap.appendChild(emptyTxt);

              cardEl.appendChild(infoWrap);
            }

            tray.appendChild(cardEl);
          }
        }

        // Atualiza altura do cooldown sweep
        for (let i = 0; i < maxSlots; i++) {
          const g = pl.slots[i] || [];
          const m = g[0];
          if (!m) continue;
          const sweep = document.getElementById(`hud-cd-sweep-${i}`);
          if (sweep) {
            const cdFrac = m.kind === 'orbit' ? 0 : Math.max(0, Math.min(1, (m.t || 0) / (m.cd * (pl.cdMul || 1))));
            sweep.style.height = `${(cdFrac * 100).toFixed(0)}%`;
          }
        }
      }
    } catch (eRpgHud) {
      // Ignora falhas de mutação DOM para blindar o loop principal de jogo
    }
  }

  return {
    draw,
    roundRect,
    bar,
    updateBottomRpgHud,
    update: () => {
      const p = (typeof G === 'object' && G.Game) ? G.Game.player : null;
      if (p) updateBottomRpgHud(p, { time: 0 });
    }
  };
})();
