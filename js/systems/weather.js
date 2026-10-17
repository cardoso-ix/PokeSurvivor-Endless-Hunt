/* ============ weather.js — Sistema e Ciclo de Clima Dinâmico (Live Weather System) ============
 * PokéSurvivor:
 * - Ciclo contínuo de 60 segundos alternando entre os 7 climas com transição suave.
 * - Pool otimizado de 100 partículas para zero alocações a 60 FPS estáveis.
 * - Sinergias completas com os 18 tipos elementais de Pokémon.
 * - Efeitos ambientais: desgaste de areia, lentidão de neve, raios periódicos em tempestade.
 * - HUD pixel-perfect com contador regressivo e animação de ícone.
 */

const WeatherSystem = (() => {
  const WEATHER_LIST = ['clear', 'harsh_sun', 'rain', 'sandstorm', 'snow', 'thunderstorm', 'fog'];
  const DEFAULT_DURATION = 60.0;
  const TRANSITION_DURATION = 2.0;
  const MAX_PARTICLES = 100;

  // Estado do clima
  let currentWeather = 'clear';
  let weatherTimer = DEFAULT_DURATION;
  let weatherDuration = DEFAULT_DURATION;
  let transitionAlpha = 1.0;
  let elapsedInWeather = 0;

  // Efeitos periódicos de campo
  let fieldTickTimer = 0;
  let lightningTimer = 0;
  let flashAlpha = 0;

  // Pool de partículas pré-alocado (Zero Garbage Collection)
  const particles = new Array(MAX_PARTICLES);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particles[i] = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 2,
      color: '#ffffff',
      alpha: 0.5,
      life: 10,
      maxLife: 10,
      seed: Math.random() * 100,
      active: false
    };
  }

  function getData(weatherId) {
    const table = (typeof WEATHER_TYPES !== 'undefined') ? WEATHER_TYPES : (typeof window !== 'undefined' ? window.WEATHER_TYPES : null);
    if (!table) return null;
    return table[weatherId] || table.clear;
  }

  function getPlayer() {
    return (typeof G === 'object' && G.Game && G.Game.player) ? G.Game.player : null;
  }

  function getPlayerTypes(pl) {
    if (!pl) pl = getPlayer();
    if (!pl) return ['normal'];
    if (pl.mon && Array.isArray(pl.mon.types) && pl.mon.types.length > 0) return pl.mon.types;
    if (Array.isArray(pl.types) && pl.types.length > 0) return pl.types;
    return ['normal'];
  }

  function reset() {
    currentWeather = 'clear';
    weatherDuration = DEFAULT_DURATION;
    weatherTimer = DEFAULT_DURATION;
    transitionAlpha = 1.0;
    elapsedInWeather = 0;
    fieldTickTimer = 0;
    lightningTimer = 0;
    flashAlpha = 0;
    initParticles(window.innerWidth || 1280, window.innerHeight || 720);
  }

  function setWeather(weatherId, duration = DEFAULT_DURATION) {
    if (weatherId === 'sun') weatherId = 'harsh_sun';
    if (weatherId === 'sand') weatherId = 'sandstorm';
    if (!WEATHER_LIST.includes(weatherId)) weatherId = 'clear';

    currentWeather = weatherId;
    weatherDuration = duration;
    weatherTimer = duration;
    transitionAlpha = 0.0; // Inicia fade-in de 2s
    elapsedInWeather = 0;
    lightningTimer = 0;

    const data = getData(weatherId);
    if (data && typeof G === 'object') {
      if (G.Spawner && G.Spawner.say) {
        G.Spawner.say(`${data.icon} ${data.name.toUpperCase()}: ${data.hint}`, 3.5, true);
      }
      if (G.Audio && G.Audio.sfx) {
        G.Audio.sfx('biome');
      }
    }
  }

  function nextWeather() {
    const available = WEATHER_LIST.filter(w => w !== currentWeather);
    const chosen = available[Math.floor(Math.random() * available.length)] || 'clear';
    setWeather(chosen);
  }

  // ---------------- Pool de Partículas ----------------
  function initParticles(w, h) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      spawnParticle(particles[i], w, h, true);
    }
  }

  function spawnParticle(p, w, h, anywhere = false) {
    const kind = getData(currentWeather)?.particleKind || 'clear';
    p.active = true;
    p.seed = Math.random() * 100;

    if (kind === 'rain' || kind === 'thunder') {
      p.x = Math.random() * (w + 300) - 100;
      p.y = anywhere ? Math.random() * h : -20;
      p.vx = -160 - Math.random() * 60;
      p.vy = 700 + Math.random() * 200;
      p.size = 2 + Math.random() * 2;
      p.color = kind === 'thunder' ? '#a5d8ff' : '#85c2ff';
      p.alpha = 0.45 + Math.random() * 0.35;
      p.life = 0;
      p.maxLife = 3.0;
    } else if (kind === 'sun') {
      p.x = Math.random() * w;
      p.y = anywhere ? Math.random() * h : h + 10;
      p.vx = (Math.random() - 0.5) * 30;
      p.vy = -35 - Math.random() * 45;
      p.size = 3 + Math.random() * 3;
      p.color = Math.random() < 0.6 ? '#ffda79' : '#ff9f43';
      p.alpha = 0.35 + Math.random() * 0.45;
      p.life = 0;
      p.maxLife = 6.0;
    } else if (kind === 'sand') {
      p.x = anywhere ? Math.random() * w : w + 20;
      p.y = Math.random() * h;
      p.vx = -480 - Math.random() * 140;
      p.vy = 20 + (Math.random() - 0.5) * 40;
      p.size = 2 + Math.random() * 3;
      p.color = Math.random() < 0.5 ? '#e0bf73' : '#cca052';
      p.alpha = 0.40 + Math.random() * 0.40;
      p.life = 0;
      p.maxLife = 4.0;
    } else if (kind === 'snow') {
      p.x = Math.random() * w;
      p.y = anywhere ? Math.random() * h : -15;
      p.vx = (Math.random() - 0.5) * 20;
      p.vy = 50 + Math.random() * 45;
      p.size = 2 + Math.random() * 3;
      p.color = '#ffffff';
      p.alpha = 0.55 + Math.random() * 0.40;
      p.life = 0;
      p.maxLife = 8.0;
    } else if (kind === 'fog') {
      p.x = Math.random() * w;
      p.y = anywhere ? Math.random() * h : (Math.random() < 0.5 ? -30 : h + 30);
      p.vx = (Math.random() - 0.5) * 25;
      p.vy = (Math.random() - 0.5) * 20;
      p.size = 12 + Math.random() * 16;
      p.color = '#d8ccf0';
      p.alpha = 0.12 + Math.random() * 0.14;
      p.life = 0;
      p.maxLife = 10.0;
    } else {
      // Céu Limpo: pequenas partículas de ar e pólen suave
      p.x = Math.random() * w;
      p.y = anywhere ? Math.random() * h : h + 10;
      p.vx = (Math.random() - 0.5) * 15;
      p.vy = -18 - Math.random() * 20;
      p.size = 2;
      p.color = '#fff6cc';
      p.alpha = 0.25;
      p.life = 0;
      p.maxLife = 8.0;
    }
  }

  // ---------------- Atualização Contínua ----------------
  function update(dt, time, pl) {
    if (!pl) pl = getPlayer();

    // Fade-in suave de transição (2 segundos)
    if (transitionAlpha < 1.0) {
      transitionAlpha = Math.min(1.0, transitionAlpha + dt / TRANSITION_DURATION);
    }

    // Flash de raio decrescente
    if (flashAlpha > 0) {
      flashAlpha = Math.max(0, flashAlpha - dt * 2.5);
    }

    elapsedInWeather += dt;
    weatherTimer -= dt;

    // Fim da duração do clima: sorteia novo clima automaticamente
    if (weatherTimer <= 0) {
      nextWeather();
    }

    const data = getData(currentWeather);
    if (!data) return;

    // 1. Regeneração de Planta no Sol Escaldante (2% do HP max por segundo)
    if (data.id === 'harsh_sun' && pl && !pl.dead) {
      const types = getPlayerTypes(pl);
      if (types.includes('grass')) {
        const healAmt = pl.maxHp * 0.02 * dt;
        if (pl.hp < pl.maxHp) {
          pl.hp = Math.min(pl.maxHp, pl.hp + healAmt);
        }
      }
    }

    // 2. Efeitos periódicos de campo a cada 1 segundo
    fieldTickTimer += dt;
    if (fieldTickTimer >= 1.0) {
      fieldTickTimer -= 1.0;

      // Tempestade de areia: inimigos que não sejam Pedra, Terra ou Aço sofrem 1% de dano por segundo
      if (data.fieldDamage && typeof G === 'object' && G.EnemyMgr) {
        const safeTypes = data.fieldDamage.safe;
        const enemies = G.EnemyMgr.all();
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead || e.boss) continue;
          const eTypes = e.types || [];
          const isSafe = eTypes.some(t => safeTypes.includes(t));
          if (!isSafe) {
            const dmg = Math.max(1, e.maxHp * data.fieldDamage.pctPerSec);
            e.hp -= dmg;
            e.flash = 0.04;
            if (e.hp <= 0) e.die();
          }
        }
      }
    }

    // 3. Raio natural periódico na Tempestade Elétrica (a cada 6 segundos)
    if (data.lightningInterval && pl && !pl.dead && typeof G === 'object' && G.EnemyMgr) {
      lightningTimer += dt;
      if (lightningTimer >= data.lightningInterval) {
        lightningTimer = 0;
        triggerNaturalLightning(pl);
      }
    }
  }

  /**
   * Dispara um raio natural do céu no monstro mais próximo
   */
  function triggerNaturalLightning(pl) {
    if (typeof G !== 'object' || !G.EnemyMgr) return;
    const enemies = G.EnemyMgr.all();
    let nearest = null;
    let minDist2 = 500 * 500;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      const d2 = G.U.dist2(e.x, e.y, pl.x, pl.y);
      if (d2 < minDist2) {
        minDist2 = d2;
        nearest = e;
      }
    }

    if (nearest) {
      flashAlpha = 0.35; // Flash na tela
      const dmg = Math.max(80, (pl.atk || 50) * 3.5);
      nearest.hurt(dmg, '#ffe600', 0, 0, 180, 'super');
      if (typeof G.Audio === 'object' && G.Audio.sfx) G.Audio.sfx('shiny');
      if (typeof G.FX === 'object') {
        G.FX.burst(nearest.x, nearest.y - 10, '#ffff55', 16, 160);
        G.FX.ring(nearest.x, nearest.y, 4, 80, '#ffffff', 0.3, 3);
      }
    }
  }

  // ---------------- Sinergias & Multiplicadores ----------------

  /** Multiplicador de dano baseado nos tipos do jogador ou do ataque */
  function getAtkMul(pl) {
    const data = getData(currentWeather);
    if (!data || !data.atkMult) return 1.0;
    const types = getPlayerTypes(pl);
    let mul = 1.0;

    for (const t of types) {
      if (data.atkMult[t]) {
        mul *= data.atkMult[t];
      }
    }
    return mul;
  }

  /** Multiplicador de velocidade de movimento */
  function getSpdMul(pl) {
    const data = getData(currentWeather);
    if (!data || !data.spdBonus) return 1.0;
    const types = getPlayerTypes(pl);
    let bonus = 0;

    for (const t of types) {
      if (data.spdBonus[t]) {
        bonus = Math.max(bonus, data.spdBonus[t]);
      }
    }
    return 1.0 + bonus;
  }

  /** Bônus de defesa / armadura */
  function getDefBonus(pl) {
    const data = getData(currentWeather);
    if (!data || !data.defBonus) return 0;
    const types = getPlayerTypes(pl);
    let def = 0;

    for (const t of types) {
      if (data.defBonus[t]) {
        def = Math.max(def, data.defBonus[t]);
      }
    }
    return def;
  }

  /** Multiplicador de tempo de recarga (Cooldown) */
  function getCdMul(pl) {
    const data = getData(currentWeather);
    if (!data || !data.cdReduction) return 1.0;
    const types = getPlayerTypes(pl);
    let reduction = 0;

    for (const t of types) {
      if (data.cdReduction[t]) {
        reduction = Math.max(reduction, data.cdReduction[t]);
      }
    }
    return Math.max(0.3, 1.0 - reduction);
  }

  /** Chance de esquiva (Névoa Espessa) */
  function getDodgeChance(pl) {
    const data = getData(currentWeather);
    if (!data || !data.dodgeBonus) return 0;
    const types = getPlayerTypes(pl);
    let dodge = 0;

    for (const t of types) {
      if (data.dodgeBonus[t]) {
        dodge = Math.max(dodge, data.dodgeBonus[t]);
      }
    }
    return dodge;
  }

  /** Bônus de regeneração para o getter de regen do player */
  function getRegenBonus(pl) {
    const data = getData(currentWeather);
    if (!data || !data.regenPct) return 0;
    const types = getPlayerTypes(pl);
    for (const t of types) {
      if (data.regenPct[t]) {
        return (pl.maxHp || 100) * data.regenPct[t];
      }
    }
    return 0;
  }

  /** Hook chamado ao acertar golpes (repulsão, congelamento, raios em cadeia) */
  function onHit(pl, e, dmg, knock, m) {
    const data = getData(currentWeather);
    if (!data) return { dmg, knock };

    const types = getPlayerTypes(pl);
    let finalKnock = knock;
    let finalDmg = dmg;

    // 1. Repulsão extra na Tempestade de Areia (Pedra, Terra, Aço)
    if (data.knockbackMult) {
      for (const t of types) {
        if (data.knockbackMult[t]) {
          finalKnock *= data.knockbackMult[t];
          break;
        }
      }
    }

    // 2. Chance de congelar inimigos por 1.5s na Nevasca (Gelo)
    if (data.freezeChance && types.includes('ice') && Math.random() < data.freezeChance.ice) {
      if (e.applySlow) e.applySlow({ dur: 1.5, factor: 1.0 });
      if (typeof G === 'object' && G.FX) G.FX.dmgText(e.x, e.y - (e.bodyH || 20), 'CONGELADO!', '#a0e7ff', true);
    }

    // 3. Arcos voltaicos em cadeia na Chuva Forte (Elétrico)
    if (data.electricChain && (types.includes('electric') || (m && m.type === 'electric'))) {
      chainLightningToEnemies(e, dmg * 0.5, pl);
    }

    return { dmg: finalDmg, knock: finalKnock };
  }

  /** Dispara faíscas em cadeia para até 3 inimigos próximos */
  function chainLightningToEnemies(origin, chainDmg, pl) {
    if (typeof G !== 'object' || !G.EnemyMgr) return;
    const near = G.EnemyMgr.queryCircle(origin.x, origin.y, 160);
    let hits = 0;
    for (let i = 0; i < near.length && hits < 3; i++) {
      const target = near[i];
      if (target === origin || target.dead) continue;
      target.hurt(chainDmg, '#fff159', target.x - origin.x, target.y - origin.y, 60, 'hit');
      if (G.FX) G.FX.spark(target.x, target.y - (target.bodyH || 15) * 0.5, '#ffff77', 0, -1, 5);
      hits++;
    }
  }

  // ---------------- Compatibilidade com o jogo existente ----------------

  /** Multiplicador de dano de ataques de um determinado tipo */
  function mult(type) {
    const data = getData(currentWeather);
    if (!data || !data.atkMult) return 1.0;
    return data.atkMult[type] || 1.0;
  }

  /** Modificador de velocidade para inimigos (Nevasca reduz 20% de quem não é Gelo) */
  function speedFor(types) {
    const data = getData(currentWeather);
    if (data && data.enemySlowPct && (!types || !types.includes('ice'))) {
      return 1.0 - data.enemySlowPct * transitionAlpha;
    }
    return 1.0;
  }

  function hurts(types) {
    const data = getData(currentWeather);
    if (!data || !data.fieldDamage) return false;
    return !types.some(t => data.fieldDamage.safe.includes(t));
  }

  // ---------------- Renderização Atmosférica no Canvas ----------------

  function draw(ctx, w, h, dt) {
    const data = getData(currentWeather);
    if (!data) return;

    const alpha = transitionAlpha;

    // 1. Overlay tonal atmosférico suave
    if (data.overlay) {
      const [r, g, b, baseA] = data.overlay;
      ctx.save();
      ctx.fillStyle = `rgba(${r},${g},${b},${baseA * alpha})`;
      ctx.fillRect(0, 0, w, h);

      // Flash de relâmpago esporádico na tempestade
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
    }

    // 2. Partículas no Canvas
    ctx.save();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (!p.active) {
        spawnParticle(p, w, h, false);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      // Movimento senoidal suave para neve
      if (data.particleKind === 'snow') {
        p.x += Math.sin(p.seed + p.y * 0.04) * 0.8;
      }

      // Reinício de ciclo ao sair dos limites da tela
      if (p.y > h + 30 || p.x < -60 || p.x > w + 60 || p.life > p.maxLife) {
        spawnParticle(p, w, h, false);
        continue;
      }

      ctx.globalAlpha = p.alpha * alpha;
      ctx.fillStyle = p.color;

      if (data.particleKind === 'rain' || data.particleKind === 'thunder') {
        // Traço linear nítido de chuva em diagonal
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size * 0.6, p.size * 3.5);
      } else if (data.particleKind === 'sand') {
        // Traço horizontal rápido de areia
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size * 3.2, p.size * 0.8);
      } else if (data.particleKind === 'fog') {
        // Blocos suaves translúcidos de névoa
        ctx.beginPath();
        ctx.arc(Math.round(p.x), Math.round(p.y), p.size, 0, 6.283);
        ctx.fill();
      } else {
        // Padrão quadrado Pixel Art para sol e neve
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
    }
    ctx.restore();

    // 3. Renderiza o HUD minimalista de clima no topo
    drawHUD(ctx, w, h);
  }

  // ---------------- HUD Retro Pixel Art de Clima (Estilo DS / GBA) ----------------
  function drawHUD(ctx, w, h) {
    const data = getData(currentWeather);
    if (!data) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const remaining = Math.max(0, Math.ceil(weatherTimer));
    const weatherName = (data.name || 'CLIMA').toUpperCase();

    // Mede largura do texto com tipografia retro pixelada
    ctx.font = '800 11px "Pixelify", "Press Start 2P", "Courier New", monospace';
    const textWidth = ctx.measureText(weatherName).width;

    const boxH = 38;
    const boxW = Math.max(195, Math.round(textWidth + 88));

    // Posicionamento no canto superior direito alinhado à esquerda do radar
    const isMobile = w < 640;
    const x = isMobile ? Math.round((w - boxW) / 2) : Math.round(w - boxW - 180);
    const y = isMobile ? 66 : 14;

    // 1. Moldura Chanfrada Retro Pixel Art (Estilo Nintendo DS / GBA)
    // Fundo principal escuro azulado sólido
    ctx.fillStyle = '#141624';
    ctx.fillRect(x + 2, y, boxW - 4, boxH);
    ctx.fillRect(x, y + 2, boxW, boxH - 4);

    // Borda chanfrada externa (#3a3f58) de 3px
    ctx.strokeStyle = '#3a3f58';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x + 1, y + 1, boxW - 2, boxH - 2);

    // Chanfro interno: Relevo de luz no topo/esquerda e sombra na base/direita
    ctx.fillStyle = '#5c648d'; // Luz
    ctx.fillRect(x + 3, y + 3, boxW - 6, 1);
    ctx.fillRect(x + 3, y + 3, 1, boxH - 6);

    ctx.fillStyle = '#090a10'; // Sombra profunda
    ctx.fillRect(x + 3, y + boxH - 4, boxW - 6, 1);
    ctx.fillRect(x + boxW - 4, y + 3, 1, boxH - 6);

    // Cantoneiras decorativas chanfradas douradas (#f8b800) nos 4 cantos
    ctx.fillStyle = '#f8b800';
    ctx.fillRect(x, y, 3, 3);
    ctx.fillRect(x + boxW - 3, y, 3, 3);
    ctx.fillRect(x, y + boxH - 3, 3, 3);
    ctx.fillRect(x + boxW - 3, y + boxH - 3, 3, 3);

    // 2. Badge / Caixa Embutida do Ícone de Clima (Lado Esquerdo)
    const iconSize = 28;
    const iconX = x + 5;
    const iconY = y + 5;

    ctx.fillStyle = '#090a10';
    ctx.fillRect(iconX, iconY, iconSize, iconSize);

    ctx.strokeStyle = data.color || '#f8b800';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(iconX + 0.5, iconY + 0.5, iconSize - 1, iconSize - 1);

    // Ícone do clima centralizado
    ctx.font = '16px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.icon || '☀️', iconX + iconSize / 2, iconY + iconSize / 2 + 1);

    // 3. Informações de Clima: Nome e Temporizador
    const contentX = iconX + iconSize + 7;
    const nameY = y + 13;

    // Nome do Clima com sombra chanfrada pixelada
    ctx.font = '800 11px "Pixelify", "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Sombra preta sólida de 1px
    ctx.fillStyle = '#000000';
    ctx.fillText(weatherName, contentX + 1, nameY + 1);

    // Cor temática do clima
    ctx.fillStyle = data.color || '#ffffff';
    ctx.fillText(weatherName, contentX, nameY);

    // Badge numérico de tempo restante à direita
    const timeW = 34;
    const timeH = 15;
    const timeX = x + boxW - timeW - 6;
    const timeY = y + 5;

    ctx.fillStyle = '#090a10';
    ctx.fillRect(timeX, timeY, timeW, timeH);
    ctx.strokeStyle = '#2b334d';
    ctx.lineWidth = 1;
    ctx.strokeRect(timeX + 0.5, timeY + 0.5, timeW - 1, timeH - 1);

    ctx.font = '800 9px "Pixelify", "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isUrgent = remaining <= 5;
    const blink = isUrgent && (Math.floor(remaining * 4) % 2 === 0);
    ctx.fillStyle = blink ? '#ef4444' : '#fde047';
    ctx.fillText(`${remaining}s`, timeX + timeW / 2, timeY + timeH / 2);

    // 4. Barra de Progresso RPG (Estilo Barra de Vida / Mega)
    const barX = contentX;
    const barY = y + 24;
    const barW = boxW - (iconSize + 16) - 6;
    const barH = 7;

    // Trilho escuro embutido
    ctx.fillStyle = '#090a10';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#232738';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

    // Preenchimento gradiente e chanfrado proporcional ao tempo restante
    const progress = Math.max(0, Math.min(1, weatherTimer / weatherDuration));
    const fillW = Math.max(0, Math.round((barW - 2) * progress));

    if (fillW > 0) {
      // Base da barra com a cor do clima
      ctx.fillStyle = data.color || '#38bdf8';
      ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);

      // Relevo de luz superior (estilo HP retro)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(barX + 1, barY + 1, fillW, 2);

      // Relevo de sombra inferior
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(barX + 1, barY + barH - 3, fillW, 2);
    }

    ctx.restore();
  }

  return {
    get currentWeather() { return currentWeather; },
    get weatherTimer() { return weatherTimer; },
    get transitionAlpha() { return transitionAlpha; },
    get current() {
      const d = getData(currentWeather);
      return d ? Object.assign({ left: Math.max(0, weatherTimer) }, d) : null;
    },
    get vignette() {
      return currentWeather === 'fog' ? transitionAlpha : 0;
    },
    setWeather,
    nextWeather,
    reset,
    update,
    draw,
    drawHUD,
    getAtkMul,
    getSpdMul,
    getDefBonus,
    getCdMul,
    getDodgeChance,
    getRegenBonus,
    onHit,
    mult,
    speedFor,
    hurts,
    force(kind, dur) { setWeather(kind, dur); },
    clear() { setWeather('clear', DEFAULT_DURATION); }
  };
})();

// Registro global para compatibilidade com o motor
if (typeof G === 'object') {
  G.Weather = WeatherSystem;
}
if (typeof window !== 'undefined') {
  window.WeatherSystem = WeatherSystem;
  window.debugSetWeather = function(id) {
    WeatherSystem.setWeather(id);
    console.log(`[CLIMA] Clima alterado para: ${id}`);
  };
  window.debugNextWeather = function() {
    WeatherSystem.nextWeather();
    console.log(`[CLIMA] Avançado para o próximo clima: ${WeatherSystem.currentWeather}`);
  };
}
