/* ============ capture.js — Sistema Completo e Definitivo de Captura de Rifts ============
 * - Gatilho de Ativação: Ao zerar a vida do Guardião, o combate é pausado imediatamente.
 * - Tiers Dinâmicos: Poké Ball (+0%), Great Ball (+5%), Ultra Ball (+10%), Ultimate Ball (+15%).
 * - Evento Raro Gold Ball (Nv. 41+): 10% de chance de proc -> 100% Captura Garantida + 1.000 Ouro.
 * - Taxas Base: Normal (50%), Lendário (20%), Shiny (15% prioridade máxima).
 * - Animação Retrô: Lançamento parabólico, feixe de sucção, queda e 3 balanços mecânicos.
 * - Integração: Salva na Pokédex, libera a forma base como jogável e despausa ao continuar.
 */

const CaptureSystem = (() => {
  // Configuração Oficial da Gold Ball
  const GOLD_BALL_CONFIG = {
    id: 'gold_ball',
    name: 'Gold Ball',
    chance: 0.10,
    isGuaranteed: true,
    isGold: true,
    catchRate: 1.00,
    bonus: 1.00,
    minLevel: 41,
    maxLevel: Infinity,
    colorTop: '#ffd700',
    accent: '#ffaa00',
    label: '⭐ 100% GARANTIDO',
    goldReward: 1000,
    icon: '⭐'
  };

  // Tabela Dinâmica de Pokébolas escalonadas pelo nível da partida
  const POKEBALL_TIERS = {
    POKEBALL: {
      id: 'poke_ball',
      name: 'Poké Ball',
      minLevel: 1,
      maxLevel: 10,
      bonus: 0.00,
      colorTop: '#ef4444',
      accent: '#dc2626',
      label: '+0% Chance',
      icon: '🔴'
    },
    GREATBALL: {
      id: 'great_ball',
      name: 'Great Ball',
      minLevel: 11,
      maxLevel: 20,
      bonus: 0.05,
      colorTop: '#2563eb',
      accent: '#ef4444',
      label: '+5% Chance',
      icon: '🔵'
    },
    ULTRABALL: {
      id: 'ultra_ball',
      name: 'Ultra Ball',
      minLevel: 21,
      maxLevel: 30,
      bonus: 0.10,
      colorTop: '#1e293b',
      accent: '#facc15',
      label: '+10% Chance',
      icon: '🟡'
    },
    ULTIMATEBALL: {
      id: 'ultimate_ball',
      name: 'Ultimate Ball',
      minLevel: 31,
      maxLevel: Infinity,
      bonus: 0.15,
      colorTop: '#7c3aed',
      accent: '#ec4899',
      label: '+15% Chance',
      icon: '🟣'
    },
    GOLDBALL: GOLD_BALL_CONFIG
  };

  // Estados da Animação: 'idle' | 'throw' | 'absorb' | 'drop' | 'wobble' | 'success' | 'escape'
  let state = 'idle';
  let stateT = 0;
  let shakesDone = 0;
  let activeData = null;
  let modalAnimId = null;

  // Variáveis Físicas da Pokébola no Canvas do Modal
  let ballX = 60, ballY = 40, ballZ = 0, ballAngle = 0;
  let targetX = 170, targetY = 135;
  let particles = [];
  let shards = [];

  // Cache de sprites pixel art das Pokébolas
  const ballCache = new Map();

  function resolveCaptureBall(level = 1, forceGold = false) {
    const lvl = Math.max(1, Math.floor(level || 1));
    if (lvl >= 41 && (forceGold || Math.random() < 0.10)) {
      return GOLD_BALL_CONFIG;
    }
    if (lvl >= 31) return POKEBALL_TIERS.ULTIMATEBALL;
    if (lvl >= 21) return POKEBALL_TIERS.ULTRABALL;
    if (lvl >= 11) return POKEBALL_TIERS.GREATBALL;
    return POKEBALL_TIERS.POKEBALL;
  }

  function getBaseCatchRate(speciesId, isShiny = false, isLegendary = false) {
    // 1. Variante Shiny tem prioridade máxima: 15% fixo
    if (isShiny) return 0.15;
    // 2. Lendário / Mítico: 20%
    if (isLegendary || isLegendaryOrMythical(speciesId)) return 0.20;
    // 3. Normal / Básico: 50%
    return 0.50;
  }

  function isLegendaryOrMythical(speciesId) {
    if (!speciesId) return false;
    let mon = null;
    if (typeof speciesId === 'object' && speciesId.dex) {
      mon = speciesId;
    } else if (typeof speciesId === 'number' && typeof G === 'object' && G.DEX_BY) {
      mon = G.DEX_BY[speciesId];
    } else if (typeof speciesId === 'string') {
      const s = speciesId.toLowerCase().trim();
      if (typeof G === 'object' && Array.isArray(G.DEX)) {
        mon = G.DEX.find(p => p.name && p.name.toLowerCase() === s);
      }
      if (!mon && typeof G === 'object' && G.DEX_BY) {
        mon = G.DEX_BY[parseInt(speciesId, 10)];
      }
      if (!mon && typeof POKEDEX !== 'undefined') {
        mon = Object.values(POKEDEX).find(p => p.name && p.name.toLowerCase() === s);
      }
    }
    if (!mon) return false;
    return !!(mon.leg || (mon.rarity && mon.rarity >= 5));
  }

  // ---------------- Gerador de Sprites Pixel Art da Pokébola ----------------
  function getPokeballSprite(variant = 'closed', ballTier = null) {
    const tier = ballTier || (activeData && activeData.ballTier) || POKEBALL_TIERS.POKEBALL;
    const cacheKey = `${tier.id}_${variant}`;
    if (ballCache.has(cacheKey)) return ballCache.get(cacheKey);

    const W = 16, H = variant === 'open' ? 20 : 16;
    const P = 2; // Blocos 2x2 para pixel art nítido
    const cv = document.createElement('canvas');
    cv.width = W * P; cv.height = H * P;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;

    let grid;
    if (variant === 'open') {
      grid = [
        "....00000000....",
        "..00AARRRRAA00..",
        ".0AAAARRRRAAAA0.",
        "0AARRWWWWWWRRAA0",
        "0RRRWWWWWWWWWRR0",
        ".0RRRRWWWWWWRR0.",
        "..00RRRRRRRR00..",
        "....00000000....",
        "................",
        "....00000000....",
        "..00WWWWWWWW00..",
        ".0WWWWWWWWWWWW0.",
        "0WWWWWWWWWWWWWW0",
        "0WWWWWWWWWWWWWW0",
        ".0WWWWWWWWWWWW0.",
        "..00WWWWWWWW00..",
        "....00000000...."
      ];
    } else {
      grid = [
        "....00000000....",
        "..00AARRRRAA00..",
        ".0AAAARRRRAAAA0.",
        ".0AARRRRRRRRAA0.",
        "0RRRRRRRRRRRRRR0",
        "0RRRRR0000RRRRR0",
        "0000000BB0000000",
        "000000B22B000000",
        "000000B22B000000",
        "0000000BB0000000",
        "0WWWWw0000WWWWW0",
        "0WWWWWWWWWWWWWW0",
        ".0WWWWWWWWWWWW0.",
        ".0WWWWWWWWWWWW0.",
        "..00WWWWWWWW00..",
        "....00000000...."
      ];
    }

    const isGold = !!(tier && tier.isGold);
    const PALETTE = {
      '0': '#0f172a',
      'R': tier.colorTop || '#ef4444',
      'A': tier.accent || tier.colorTop || '#ef4444',
      'w': isGold ? '#fef08a' : '#cbd5e1',
      'W': isGold ? '#fffbeb' : '#f8fafc',
      'B': isGold ? '#b45309' : '#334155',
      '2': variant === 'locked' ? '#facc15' : (isGold ? '#fef08a' : '#e2e8f0'),
      '.': null
    };

    for (let y = 0; y < grid.length; y++) {
      const line = grid[y];
      for (let x = 0; x < line.length; x++) {
        const col = PALETTE[line[x]];
        if (col) {
          c.fillStyle = col;
          c.fillRect(x * P, y * P, P, P);
        }
      }
    }

    ballCache.set(cacheKey, cv);
    return cv;
  }

  /**
   * 1. Gatilho e Máquina de Cálculo da Captura
   */
  function startCaptureSequence(params = {}) {
    let speciesId = params.speciesId || params.mon || params.dex;
    let isShiny = !!params.isShiny;
    let isLegendary = !!params.isLegendary;
    let level = params.level !== undefined ? params.level : (params.playerLevel !== undefined ? params.playerLevel : 1);
    let forceGold = !!params.forceGold;
    let onComplete = params.onComplete || null;

    // Pausa o combate imediatamente
    if (typeof G === 'object' && G.Game) G.Game.isPaused = true;
    if (typeof game !== 'undefined') game.isPaused = true;

    // Resolução do Pokémon da Pokédex
    let mon = null;
    if (typeof speciesId === 'object' && speciesId.dex) {
      mon = speciesId;
      speciesId = mon.name;
    } else if (typeof speciesId === 'number' && typeof G === 'object' && G.DEX_BY) {
      mon = G.DEX_BY[speciesId];
      if (mon) speciesId = mon.name;
    } else if (typeof speciesId === 'string') {
      const lower = speciesId.toLowerCase().trim();
      if (typeof G === 'object' && Array.isArray(G.DEX)) mon = G.DEX.find(p => p.name && p.name.toLowerCase() === lower);
      if (!mon && typeof G === 'object' && G.DEX_BY) mon = G.DEX_BY[parseInt(speciesId, 10)];
      if (!mon && typeof POKEDEX !== 'undefined') mon = Object.values(POKEDEX).find(p => p.name && p.name.toLowerCase() === lower);
    }

    if (!mon && typeof G === 'object' && G.DEX) mon = G.DEX[0];
    if (mon) {
      speciesId = mon.name;
      if (mon.leg || (mon.rarity && mon.rarity >= 5)) isLegendary = true;
    }

    // 1. Determina a Pokébola pelo nível ou proc de Gold Ball
    let ballType = 'poke_ball';
    let ballBonus = 0;
    let isGoldBall = false;

    if (level >= 41 && (forceGold || Math.random() < 0.10)) {
      ballType = 'gold_ball';
      isGoldBall = true;
    } else if (level >= 31) {
      ballType = 'ultimate_ball';
      ballBonus = 0.15;
    } else if (level >= 21) {
      ballType = 'ultra_ball';
      ballBonus = 0.10;
    } else if (level >= 11) {
      ballType = 'great_ball';
      ballBonus = 0.05;
    }

    const ballTier = isGoldBall ? GOLD_BALL_CONFIG : (
      ballType === 'ultimate_ball' ? POKEBALL_TIERS.ULTIMATEBALL :
      ballType === 'ultra_ball' ? POKEBALL_TIERS.ULTRABALL :
      ballType === 'great_ball' ? POKEBALL_TIERS.GREATBALL :
      POKEBALL_TIERS.POKEBALL
    );

    // 2. Determina a taxa base
    let baseRate = 0.50; // Normal
    if (isShiny) {
      baseRate = 0.15; // Prioridade máxima
    } else if (isLegendary) {
      baseRate = 0.20;
    }

    // 3. Taxa Final
    const finalChance = isGoldBall ? 1.0 : Math.min(0.95, baseRate + ballBonus);

    console.log(`[CaptureSystem] Iniciando sequência para ${speciesId} | Bola: ${ballTier.name} | Taxa: ${Math.round(finalChance * 100)}% | Gold: ${isGoldBall}`);

    const captureData = {
      speciesId,
      mon,
      isShiny,
      isLegendary,
      level,
      ballType,
      ballTier,
      ballBonus,
      isGoldBall,
      baseRate,
      finalChance,
      onComplete
    };

    activeData = captureData;
    renderModal(captureData);
  }

  /**
   * 2. Resolução do RNG e Salvamento na Pokédex
   */
  function resolveAttempt(data) {
    const roll = Math.random();
    const isSuccess = data.isGoldBall || (roll <= data.finalChance);

    console.log(`[CaptureSystem] Resolução: Roll=${roll.toFixed(3)} vs Chance=${data.finalChance.toFixed(3)} -> ${isSuccess ? 'SUCESSO 🏆' : 'FALHA 💨'}`);

    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : null);

    if (isSuccess && dbObj) {
      // Registra na Pokédex permanente e desbloqueia a linhagem base como personagem jogável
      if (typeof dbObj.registerCaptured === 'function') {
        dbObj.registerCaptured(data.speciesId, data.isShiny);
      } else if (typeof dbObj.unlockPokemon === 'function') {
        dbObj.unlockPokemon(data.speciesId, data.isShiny);
      }

      // Se for Gold Ball, adiciona o bônus imediato de +1.000 moedas
      if (data.isGoldBall) {
        if (typeof dbObj.addGold === 'function') {
          dbObj.addGold(1000);
        } else if (dbObj.save) {
          dbObj.save.coins = (dbObj.save.coins || 0) + 1000;
          if (dbObj.commit) dbObj.commit('gold');
        }
        if (typeof G === 'object' && G.UI && typeof G.UI.refreshCoins === 'function') {
          G.UI.refreshCoins();
        }
      }
    }

    // Incrementa o contador total de Rifts concluídos
    if (dbObj) {
      if (typeof dbObj.incrementRiftsCleared === 'function') {
        dbObj.incrementRiftsCleared();
      } else if (typeof dbObj.addRiftCleared === 'function') {
        dbObj.addRiftCleared(1);
      }
    }

    return isSuccess;
  }

  /**
   * 3. Experiência Visual e Animação no Modal Retrô
   */
  function renderModal(data) {
    const modalEl = document.getElementById('capture-modal') || document.getElementById('capture-overlay');
    if (!modalEl) {
      console.warn('[CaptureSystem] Modal HTML não encontrado. Executando resolução direta.');
      const success = resolveAttempt(data);
      if (typeof G === 'object' && G.Game) G.Game.isPaused = false;
      if (typeof game !== 'undefined') game.isPaused = false;
      if (typeof data.onComplete === 'function') data.onComplete(success);
      return;
    }

    modalEl.style.display = 'flex';
    modalEl.classList.remove('hidden');

    const boxEl = modalEl.querySelector('.capture-box');
    if (boxEl) {
      boxEl.classList.toggle('gold-mode', data.isGoldBall);
    }

    const tr = (k, vars, fallback) => (window.i18n ? window.i18n.t(k, vars, fallback) : (fallback || k));

    // Título Superior
    const titleEl = modalEl.querySelector('#cap-title-bar');
    if (titleEl) {
      titleEl.textContent = data.isGoldBall ? tr('capture.goldTitle', {}, '⭐ EVENTO RARO: GOLD BALL! ⭐') : tr('capture.title', {}, '🎯 GUARDIÃO DO RIFT DERROTADO!');
    }

    // Nome
    const nameEl = modalEl.querySelector('#cap-name, #cap-mon-name');
    if (nameEl) nameEl.textContent = (data.mon ? data.mon.name : data.speciesId).toUpperCase();

    // Badges Shiny e Lendário
    const shinyEl = modalEl.querySelector('#cap-shiny-badge');
    if (shinyEl) {
      shinyEl.textContent = tr('capture.shinyBadge', {}, '✨ SHINY');
      shinyEl.classList.toggle('hidden', !data.isShiny);
    }

    const legendEl = modalEl.querySelector('#cap-legend-badge');
    if (legendEl) {
      legendEl.textContent = tr('capture.legendBadge', {}, '👑 LENDÁRIO');
      legendEl.classList.toggle('hidden', !data.isLegendary);
    }

    // Tipos Elementais
    const typesEl = modalEl.querySelector('#cap-types, #cap-mon-types');
    if (typesEl && data.mon && Array.isArray(data.mon.types)) {
      typesEl.innerHTML = data.mon.types.map(t => `<span class="tag-type type-${t}" style="padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;margin:0 2px;">${t.toUpperCase()}</span>`).join('');
    }

    // Taxa e Informações da Pokébola
    const ballName = tr(`capture.balls.${data.ballTier.id}`, {}, data.ballTier.name);
    const rateEl = modalEl.querySelector('#cap-rate, #cap-rate-text');
    if (rateEl) {
      if (data.isGoldBall) {
        rateEl.innerHTML = `<span style="color:#ffd700;font-weight:900;font-size:14px;">${tr('capture.goldGuaranteedNotice', {}, '⭐ 100% CAPTURA GARANTIDA! ⭐')}</span><br><small style="color:#fef08a;font-weight:bold;">${tr('capture.goldGuaranteedSub', {}, 'BÔNUS ESPECIAL: +1.000 POKÉMOEDAS!')}</small>`;
      } else {
        const basePct = Math.round(data.baseRate * 100);
        const bonusPct = Math.round(data.ballBonus * 100);
        const totalPct = Math.round(data.finalChance * 100);
        const bonusLabel = tr('capture.rateBallBonus', {}, 'Bola');
        rateEl.innerHTML = `<span style="color:#ffffff;font-weight:bold;">${data.ballTier.icon} ${ballName}</span>: <b>${totalPct}%</b> <small style="color:#94a3b8">(${basePct}% Base + ${bonusPct}% ${bonusLabel})</small>`;
      }
    }

    // Status inicial
    const statusEl = modalEl.querySelector('#cap-status, #cap-status-msg');
    if (statusEl) {
      statusEl.className = 'cap-status';
      statusEl.textContent = tr('capture.throwing', { ball: ballName }, `Lançando ${ballName}...`);
    }

    // Botão Lançar / Continuar
    const btnThrow = modalEl.querySelector('#btn-throw-ball');
    if (btnThrow) {
      btnThrow.textContent = tr('capture.btnThrow', {}, '[ LANÇAR POKÉBOLA ]');
      btnThrow.classList.add('hidden'); // Inicia a animação automaticamente para experiência fluida
    }

    const btnCont = modalEl.querySelector('#btn-cap-continue, #cap-continue-btn');
    if (btnCont) {
      btnCont.textContent = tr('capture.btnContinue', {}, '[ CONTINUAR JORNADA ▶ ]');
      btnCont.classList.add('hidden');
      btnCont.onclick = () => {
        closeModal(data);
      };
    }

    // Inicializa a física e o canvas da cena no modal
    startModalAnimation(data);
  }

  function closeModal(data) {
    if (modalAnimId) {
      cancelAnimationFrame(modalAnimId);
      modalAnimId = null;
    }
    const modalEl = document.getElementById('capture-modal') || document.getElementById('capture-overlay');
    if (modalEl) {
      modalEl.style.display = 'none';
      modalEl.classList.add('hidden');
    }

    // Despausa o combate
    if (typeof G === 'object' && G.Game) G.Game.isPaused = false;
    if (typeof game !== 'undefined') game.isPaused = false;

    state = 'idle';

    if (data && typeof data.onComplete === 'function') {
      data.onComplete(data.capturedResult);
    }
  }

  function startModalAnimation(data) {
    if (modalAnimId) cancelAnimationFrame(modalAnimId);

    const canvas = document.getElementById('cap-canvas');
    if (!canvas) return;

    // Reset de estado da cena no modal
    state = 'throw';
    stateT = 0;
    shakesDone = 0;
    particles = [];
    shards = [];

    ballX = 40;
    ballY = 40;
    ballZ = 50;
    ballAngle = -0.6;
    targetX = canvas.width / 2;
    targetY = canvas.height * 0.72;

    if (typeof G === 'object' && G.Audio && G.Audio.sfx) {
      G.Audio.sfx('shot');
    }

    let lastTime = performance.now();

    function modalLoop(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      updateModalState(dt, data);
      drawModalScene(canvas, data);

      if (state !== 'idle') {
        modalAnimId = requestAnimationFrame(modalLoop);
      }
    }

    modalAnimId = requestAnimationFrame(modalLoop);
  }

  function updateModalState(dt, data) {
    stateT += dt;

    // Atualiza partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Atualiza estilhaços
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 220 * dt; // gravidade
      s.rot += s.vrot * dt;
      s.life -= dt;
      if (s.life <= 0) shards.splice(i, 1);
    }

    // 1. ARREMESSO PARABÓLICO (0.6s)
    if (state === 'throw') {
      const dur = 0.6;
      const p = Math.min(1, stateT / dur);

      ballX = 40 + (targetX - 40) * p;
      ballY = 40 + (targetY - 40) * p;
      ballZ = Math.sin(p * Math.PI) * 60 + p * 40;
      ballAngle += 15 * dt;

      if (p >= 1) {
        state = 'absorb';
        stateT = 0;
        ballX = targetX;
        ballY = targetY;
        ballZ = 40;
        ballAngle = 0;

        if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('spark');

        // Partículas de abertura
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 40 + Math.random() * 40;
          particles.push({
            x: targetX, y: targetY - ballZ,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0.3, maxLife: 0.3,
            color: '#ef4444', size: 3
          });
        }
      }
      return;
    }

    // 2. ABSORÇÃO (O Pokémon vira energia e sobe até a bola) (0.75s)
    if (state === 'absorb') {
      const dur = 0.75;
      const p = Math.min(1, stateT / dur);

      if (Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2;
        const rad = (1 - p) * 20;
        particles.push({
          x: targetX + Math.cos(a) * rad,
          y: targetY - p * 40 + Math.sin(a) * 4,
          vx: -Math.cos(a) * 20,
          vy: -60 - Math.random() * 20,
          life: 0.25, maxLife: 0.25,
          color: Math.random() < 0.5 ? '#ff3366' : '#ffffff',
          size: 2
        });
      }

      if (p >= 1) {
        state = 'drop';
        stateT = 0;
        if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('land');
      }
      return;
    }

    // 3. QUEDA E QUIQUES NO SOLO (0.4s)
    if (state === 'drop') {
      const dur = 0.4;
      const p = Math.min(1, stateT / dur);

      if (p < 0.5) {
        const dp = p / 0.5;
        ballZ = 40 * (1 - dp * dp);
      } else if (p < 0.8) {
        const bp = (p - 0.5) / 0.3;
        ballZ = Math.sin(bp * Math.PI) * 12;
      } else {
        const bp = (p - 0.8) / 0.2;
        ballZ = Math.sin(bp * Math.PI) * 4;
      }

      if (p >= 1) {
        ballZ = 0;
        state = 'wobble';
        stateT = 0;
        shakesDone = 0;
      }
      return;
    }

    // 4. BALANÇOS DE TENSÃO (Tilt 1 aos 0.8s, Tilt 2 aos 1.6s, Tilt 3 aos 2.4s)
    if (state === 'wobble') {
      if (data.isGoldBall && Math.random() < 0.4) {
        particles.push({
          x: targetX + (Math.random() - 0.5) * 16,
          y: targetY + 2,
          vx: (Math.random() - 0.5) * 15,
          vy: -20 - Math.random() * 20,
          life: 0.4, maxLife: 0.4,
          isStar: true,
          color: '#ffd700',
          size: 2.5
        });
      }

      // Tilt 1 aos 0.8s (-22°)
      if (stateT >= 0.8 && shakesDone === 0) {
        shakesDone = 1;
        ballAngle = -0.38;
        if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('click');
        const st = document.getElementById('cap-status');
        if (st) st.textContent = window.i18n ? window.i18n.t('capture.shake1') : '1... (A Pokébola balança!)';
      }
      // Tilt 2 aos 1.6s (+22°)
      else if (stateT >= 1.6 && shakesDone === 1) {
        shakesDone = 2;
        ballAngle = 0.38;
        if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('click');
        const st = document.getElementById('cap-status');
        if (st) st.textContent = window.i18n ? window.i18n.t('capture.shake2') : '2... (Tensão aumenta!)';
      }
      // Tilt 3 aos 2.4s (-18°)
      else if (stateT >= 2.4 && shakesDone === 2) {
        shakesDone = 3;
        ballAngle = -0.30;
        if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('click');
        const st = document.getElementById('cap-status');
        if (st) st.textContent = window.i18n ? window.i18n.t('capture.shake3') : '3... Quase lá!';
      }

      // Amortecimento
      ballAngle *= Math.exp(-8 * dt);

      // Resolução aos 3.2s
      if (stateT >= 3.2) {
        stateT = 0;
        const success = resolveAttempt(data);
        data.capturedResult = success;

        const st = document.getElementById('cap-status');
        const btnCont = document.getElementById('btn-cap-continue');
        const speciesName = (data.mon ? data.mon.name : data.speciesId).toUpperCase();

        if (success) {
          state = 'success';
          ballAngle = 0;

          if (st) {
            st.className = 'cap-status success';
            const successMsg = window.i18n ? window.i18n.t('capture.success', { species: speciesName }) : `✨ ${speciesName} FOI CAPTURADO COM SUCESSO! ✨`;
            const bonusMsg = window.i18n ? window.i18n.t('capture.goldBonusNotice') : '⭐ BÔNUS RESGATADO: +1.000 POKÉMOEDAS DE OURO!';
            st.innerHTML = `<span style="color:#4ade80;font-weight:900;font-size:15px;">${successMsg}</span>` +
              (data.isGoldBall ? `<br><small style="color:#ffd700;font-weight:bold;">${bonusMsg}</small>` : '');
          }

          if (typeof G === 'object' && G.Audio && G.Audio.sfx) {
            G.Audio.sfx('confirm');
            G.Audio.sfx('shinyGet');
          }

          // Partículas de celebração
          for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2;
            const sp = 40 + Math.random() * 50;
            particles.push({
              x: targetX, y: targetY - 6,
              vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 15,
              life: 0.9, maxLife: 0.9,
              isStar: true,
              color: i % 2 === 0 ? '#ffd700' : '#ffffff',
              size: 3.5
            });
          }
        } else {
          state = 'escape';
          ballAngle = 0;

          if (st) {
            st.className = 'cap-status escape';
            const escapeMsg = window.i18n ? window.i18n.t('capture.escape', { species: speciesName }) : `💨 ${speciesName} escapou da Pokébola!`;
            st.innerHTML = `<span style="color:#f87171;font-weight:bold;font-size:15px;">${escapeMsg}</span>`;
          }

          if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('break');

          // Estilhaços e fumaça
          const shardCol = data.ballTier ? data.ballTier.colorTop : '#ef4444';
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const sp = 50 + Math.random() * 60;
            shards.push({
              x: targetX, y: targetY - 6,
              vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 45,
              rot: Math.random() * 6.28, vrot: (Math.random() - 0.5) * 12,
              life: 0.8, maxLife: 0.8,
              color: i % 2 === 0 ? shardCol : '#f8fafc',
              size: 3
            });
          }
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: targetX + (Math.random() - 0.5) * 14,
              y: targetY - 4,
              vx: (Math.random() - 0.5) * 35,
              vy: -25 - Math.random() * 25,
              life: 0.65, maxLife: 0.65,
              color: '#94a3b8',
              size: 4
            });
          }
        }

        if (btnCont) btnCont.classList.remove('hidden');
      }
    }
  }

  function drawModalScene(canvas, data) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    // 1. Fundo de Arena em Pixel Art Retrô
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a0f1d');
    g.addColorStop(0.65, '#141d33');
    g.addColorStop(1, '#0e1628');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Plataforma / Elipse do solo
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(targetX, targetY + 4, 75, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = data.isGoldBall ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 2. Sombra da Pokébola
    if (state !== 'escape') {
      const shadowAlpha = Math.max(0.15, 0.45 - (ballZ / 80) * 0.3);
      const shadowR = Math.max(5, 10 - (ballZ / 60) * 3);
      ctx.save();
      ctx.globalAlpha = shadowAlpha;
      ctx.fillStyle = '#050811';
      ctx.beginPath();
      ctx.ellipse(ballX, targetY + 2, shadowR, shadowR * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Renderização do Pokémon
    const mon = data.mon;
    if (mon && mon.dex) {
      if (state === 'throw') {
        // Pokémon inteiro no chão
        drawMonSprite(ctx, mon, targetX, targetY - 4, 1.0, data.isShiny);
      } else if (state === 'absorb') {
        const dur = 0.75;
        const p = Math.min(1, stateT / dur);
        const absorbScale = Math.max(0.01, 1 - p);
        const ballAirY = ballY - ballZ;

        // Feixe Cônico Vermelho
        ctx.save();
        const beamGrad = ctx.createLinearGradient(ballX, ballAirY, targetX, targetY);
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        beamGrad.addColorStop(0.25, data.isGoldBall ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 51, 102, 0.65)');
        beamGrad.addColorStop(1, data.isGoldBall ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 51, 102, 0.15)');
        ctx.fillStyle = beamGrad;

        ctx.beginPath();
        ctx.moveTo(ballX, ballAirY);
        ctx.lineTo(targetX - 22, targetY);
        ctx.lineTo(targetX + 22, targetY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Pokémon subindo e encolhendo pelo feixe
        const curY = targetY - p * (targetY - ballAirY);
        ctx.save();
        ctx.translate(targetX, curY);
        ctx.scale(absorbScale, absorbScale);
        drawMonSprite(ctx, mon, 0, 0, absorbScale, data.isShiny);
        ctx.restore();
      } else if (state === 'escape') {
        // Pokémon escapou e corre para a direita
        const dur = 1.0;
        const p = Math.min(1, stateT / dur);
        const alpha = Math.max(0, 1 - p * 1.2);
        drawMonSprite(ctx, mon, targetX + p * 60, targetY - 4, alpha, data.isShiny);
      }
    }

    // 4. Renderização da Pokébola
    if (state !== 'escape') {
      const variant = state === 'absorb' ? 'open' : state === 'success' ? 'locked' : 'closed';
      const sprite = getPokeballSprite(variant, data.ballTier);

      if (sprite) {
        ctx.save();
        ctx.translate(ballX, ballY - ballZ);
        ctx.rotate(ballAngle);
        const scale = 1.6;
        ctx.scale(scale, scale);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
      }
    }

    // 5. Partículas e Estrelas
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      if (p.isStar) {
        drawPixelStar(ctx, p.x, p.y, p.size, p.color);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
      }
      ctx.restore();
    }

    // 6. Estilhaços da Pokébola
    for (const s of shards) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.color;
      ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size * 1.5);
      ctx.restore();
    }
  }

  function drawMonSprite(ctx, mon, x, y, alpha = 1.0, shiny = false) {
    if (!mon || !mon.dex) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Se houver spriteCanvas do motor UI
    if (typeof G === 'object' && G.UI && typeof G.UI.spriteCanvas === 'function') {
      const sp = G.UI.spriteCanvas(mon.dex, 64, 64, { scale: 1.8, shiny });
      if (sp) {
        ctx.drawImage(sp, Math.round(x - sp.width / 2), Math.round(y - sp.height + 10));
        ctx.restore();
        return;
      }
    }

    // Fallback: avatar/ícone
    ctx.fillStyle = '#ffcb05';
    ctx.font = '900 16px Pixelify, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(mon.name, x, y);
    ctx.restore();
  }

  function drawPixelStar(context, cx, cy, size, color) {
    const s = Math.max(2, Math.round(size / 2) * 2);
    context.save();
    context.fillStyle = color;
    context.fillRect(Math.round(cx - s / 2), Math.round(cy - s / 2), s, s);
    const arm = Math.round(s * 1.5);
    const thick = Math.max(1, Math.round(s / 3));
    context.fillRect(Math.round(cx - arm), Math.round(cy - thick / 2), arm * 2, thick);
    context.fillRect(Math.round(cx - thick / 2), Math.round(cy - arm), thick, arm * 2);
    context.fillStyle = '#ffffff';
    context.fillRect(Math.round(cx - 1), Math.round(cy - 1), 2, 2);
    context.restore();
  }

  function init() {
    const modalEl = document.getElementById('capture-modal');
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
    }
  }

  const exportObj = {
    startCaptureSequence,
    resolveAttempt,
    renderModal,
    resolveCaptureBall,
    getBaseCatchRate,
    isLegendaryOrMythical,
    getBallForPlayerLevel: (lvl, forceGold) => resolveCaptureBall(lvl, forceGold),
    init,
    update: (dt) => {},
    draw: (ctx, w, h) => {},
    POKEBALL_TIERS,
    GOLD_BALL_CONFIG,
    get state() { return state; },
    get activeData() { return activeData; }
  };

  return exportObj;
})();

// Exportações Globais
if (typeof window !== 'undefined') {
  window.CaptureSystem = CaptureSystem;
  window.captureSystem = CaptureSystem;
  if (typeof G === 'object') {
    G.Capture = CaptureSystem;
  }
}
if (typeof G === 'object') {
  G.Capture = CaptureSystem;
}
if (typeof global !== 'undefined') {
  global.CaptureSystem = CaptureSystem;
  global.captureSystem = CaptureSystem;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaptureSystem;
}
