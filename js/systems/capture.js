/* ============ capture.js — Sistema de Captura de Pokémon In-Game em Pixel Art ============
 * A captura ocorre 100% DENTRO DO JOGO (Canvas principal, sem modais ou janelas separadas):
 * - Ao derrotar o Guardião do Rift, a Pokébola em Pixel Art é arremessada no mundo do jogo.
 * - A Pokébola paira no ar acima do Pokémon, abre e emana um feixe de energia vermelha.
 * - O Pokémon se transforma em silhueta de energia e sobe suavemente pelo feixe até o núcleo da Pokébola.
 * - A Pokébola fecha no ar com um estalo e cai quicando no solo.
 * - A Pokébola realiza os 3 balanços de tensão no chão com cliques mecânicos e poeira.
 * - Card Lateral de Informações In-Game (posicionado ao lado da Pokébola, sem cobrir a cena):
 *     * Avatar animado do Pokémon com badge ★ SHINY se aplicável.
 *     * Nome do Pokémon em caixa alta.
 *     * Nível do Pokémon (ex: Nv. 35).
 *     * Estágio evolutivo: [ BÁSICO ], [ ESTÁGIO 1 ], [ ESTÁGIO 2 ] ou [ LENDÁRIO ] / [ MÍTICO ].
 *     * Badges dos Tipos elementais com cores oficiais.
 *     * Dificuldade e Taxa de captura.
 *     * Indicador dos 3 balanços em tempo real com status em português.
 */

const CaptureSystem = (() => {
  let activeMon = null;
  let activeBoss = null;
  let isShiny = false;
  let onFinishCb = null;
  let unlockResult = null;

  // Configuração Oficial da Gold Ball (100% Captura Garantida + 1.000 Ouro)
  const GOLD_BALL_CONFIG = {
    id: 'goldball',
    name: 'Gold Ball',
    chance: 0.10,
    isGuaranteed: true,
    isGold: true,
    catchRate: 1.00, // 100% Fixo
    bonus: 1.00,
    minLevel: 41,
    maxLevel: Infinity,
    colorTop: '#ffd700',
    accent: '#ffaa00',
    label: '⭐ 100% CAPTURA GARANTIDA!',
    badgeLabel: '⭐ GOLD BALL ATIVA! (100% CAPTURA GARANTIDA + 1.000 OURO)',
    goldReward: 1000,
    coinBonus: 1000,
    icon: '⭐'
  };

  // Tabela Dinâmica de Pokébolas por Nível da Run
  const POKEBALL_TIERS = {
    POKEBALL: {
      id: 'pokeball',
      name: 'Poké Ball',
      minLevel: 1,
      maxLevel: 10,
      bonus: 0.00, // +0%
      colorTop: '#ee1515',
      accent: '#ee1515',
      label: '+0% Chance',
      icon: '🔴'
    },
    GREATBALL: {
      id: 'greatball',
      name: 'Great Ball',
      minLevel: 11,
      maxLevel: 20,
      bonus: 0.05, // +5%
      colorTop: '#0075be',
      accent: '#ee1515',
      label: '+5% Chance',
      icon: '🔵'
    },
    ULTRABALL: {
      id: 'ultraball',
      name: 'Ultra Ball',
      minLevel: 21,
      maxLevel: 30,
      bonus: 0.10, // +10%
      colorTop: '#222224',
      accent: '#ffcb05',
      label: '+10% Chance',
      icon: '🟡'
    },
    ULTIMATEBALL: {
      id: 'ultimateball',
      name: 'Ultimate Ball',
      minLevel: 31,
      maxLevel: Infinity,
      bonus: 0.15, // +15%
      colorTop: '#7b2cbf',
      accent: '#ff007f',
      label: '+15% Chance',
      icon: '🟣'
    },
    GOLDBALL: GOLD_BALL_CONFIG
  };
  POKEBALL_TIERS.MASTERBALL = POKEBALL_TIERS.ULTIMATEBALL;

  function resolveCaptureBall(level = 1, forceGold = false) {
    if (forceGold) {
      return GOLD_BALL_CONFIG;
    }
    const lvl = Math.max(1, Math.floor(level || 1));
    // Nível 41+: 10% de chance de ativar a Gold Ball
    if (lvl >= 41 && Math.random() < 0.10) {
      return GOLD_BALL_CONFIG;
    }
    for (const tier of Object.values(POKEBALL_TIERS)) {
      if (tier.id === 'goldball') continue; // Gold Ball ativada exclusivamente via proc 10% ou forceGold
      if (lvl >= tier.minLevel && lvl <= tier.maxLevel) {
        return tier;
      }
    }
    return POKEBALL_TIERS.ULTIMATEBALL;
  }

  function getBallForPlayerLevel(level = 1, forceGold = false) {
    return resolveCaptureBall(level, forceGold);
  }

  // Estados in-game: 'idle' | 'throw' | 'absorb' | 'drop' | 'wobble' | 'success' | 'escape'
  let state = 'idle';
  let stateT = 0;
  let baseCatchRate = 0.50;
  let captureRate = 0.50;
  let isSuccess = false;
  let shakesDone = 0;
  let pokemonLevel = 1;
  let playerLevel = 1;
  let activeBallTier = POKEBALL_TIERS.POKEBALL;
  let evoStage = 'Básico';

  // Posições no Mundo (Coordenadas do Mapa)
  let targetX = 0, targetY = 0;
  let startX = 0, startY = 0;
  let ballX = 0, ballY = 0, ballZ = 0;
  let ballAngle = 0;
  let ballScale = 1.6;

  // Partículas in-game
  let particles = [];
  let shards = [];

  // Animador de sprite do Pokémon
  let pmdAnimator = null;

  // Cache de sprites pixel art pré-renderizados
  const ballCache = new Map();

  function getEvolutionStage(mon) {
    if (!mon) return 'Básico';
    if (mon.leg) return 'Lendário';
    if (mon.rarity && mon.rarity >= 5) return 'Mítico';

    const name = (mon.name || '').toLowerCase().trim();

    // 1. Tenta via getDevolutionData nativo de evolutions.js
    const devolveFn = (typeof getDevolutionData === 'function')
      ? getDevolutionData
      : (typeof G === 'object' && G.getDevolutionData)
      ? G.getDevolutionData
      : (typeof window !== 'undefined' && window.getDevolutionData)
      ? window.getDevolutionData
      : null;

    if (typeof devolveFn === 'function') {
      const parentData = devolveFn(name);
      if (!parentData) return 'Básico';
      const grandParentData = devolveFn(parentData.prev);
      if (grandParentData) return 'Estágio 2';
      return 'Estágio 1';
    }

    // 2. Fallback direto pela tabela de evolução
    const evoTable = (typeof POKEMON_EVOLUTIONS !== 'undefined')
      ? POKEMON_EVOLUTIONS
      : (typeof G === 'object' && G.POKEMON_EVOLUTIONS)
      ? G.POKEMON_EVOLUTIONS
      : (typeof window !== 'undefined' && window.POKEMON_EVOLUTIONS)
      ? window.POKEMON_EVOLUTIONS
      : {};

    let parent = null;
    for (const prevName in evoTable) {
      const entry = evoTable[prevName];
      if (Array.isArray(entry)) {
        if (entry.some(e => e.next && e.next.toLowerCase() === name)) {
          parent = prevName;
          break;
        }
      } else if (entry && entry.next && entry.next.toLowerCase() === name) {
        parent = prevName;
        break;
      }
    }

    if (!parent) return 'Básico';

    let grandParent = null;
    for (const prevName in evoTable) {
      const entry = evoTable[prevName];
      if (Array.isArray(entry)) {
        if (entry.some(e => e.next && e.next.toLowerCase() === parent.toLowerCase())) {
          grandParent = prevName;
          break;
        }
      } else if (entry && entry.next && entry.next.toLowerCase() === parent.toLowerCase()) {
        grandParent = prevName;
        break;
      }
    }

    if (grandParent) return 'Estágio 2';
    return 'Estágio 1';
  }

  function isLegendaryOrMythical(speciesId) {
    if (!speciesId) return false;
    let mon = null;
    if (typeof speciesId === 'object' && speciesId.dex) {
      mon = speciesId;
    } else if (typeof speciesId === 'number') {
      mon = (typeof G === 'object' && G.DEX_BY && G.DEX_BY[speciesId])
        || (typeof POKEDEX !== 'undefined' && POKEDEX[speciesId]);
    } else if (typeof speciesId === 'string') {
      const s = speciesId.toLowerCase().trim();
      if (typeof G === 'object' && G.DEX && Array.isArray(G.DEX)) {
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

  function getBaseCatchRate(speciesId, isShiny) {
    // Regra 1: Se for Shiny, a taxa base é 15% fixo, independentemente da espécie
    if (isShiny) {
      return 0.15;
    }

    // Regra 2: Se for Lendário ou Mítico, a taxa base é 20%
    if (isLegendaryOrMythical(speciesId)) {
      return 0.20;
    }

    // Regra 3: Pokémon Básico / Padrão recebe 50%
    return 0.50;
  }

  // Alias para manter compatibilidade com códigos legados
  function getCaptureRate(mon, isShiny) {
    return getBaseCatchRate(mon, isShiny);
  }

  function calculatePokemonLevel(mon, boss, pl) {
    if (boss && boss.level) return boss.level;
    const runTime = (typeof G === 'object' && G.Game && G.Game.st) ? G.Game.st.time : 0;
    const playerLvl = pl ? pl.level : 1;
    const stage = getEvolutionStage(mon);
    let baseLevel = 15;
    if (stage === 'Estágio 1') baseLevel = 26;
    if (stage === 'Estágio 2') baseLevel = 42;
    if (stage === 'Lendário' || stage === 'Mítico') baseLevel = 60;
    return Math.max(playerLvl, baseLevel + Math.floor(runTime / 50) * 3);
  }

  // ---------------- Gerador de Sprites da Pokébola em Pixel Art ----------------
  function getPokeballSprite(variant = 'closed', ballTier = null) {
    const tier = ballTier || activeBallTier || POKEBALL_TIERS.POKEBALL;
    const cacheKey = `${tier.id}_${variant}`;
    if (ballCache.has(cacheKey)) return ballCache.get(cacheKey);

    const W = 16, H = variant === 'open' ? 20 : 16;
    const P = 2; // Pixel art nítido com blocos 2x2
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

    const isGold = !!(tier && (tier.isGold || tier.isGuaranteed));
    const PALETTE = {
      '0': '#0f172a', // Contorno escuro sólido
      'R': tier.colorTop || '#ef4444', // Cor principal do hemisfério superior
      'A': tier.accent || tier.colorTop || '#ef4444', // Faixas / detalhes característicos
      'w': isGold ? '#fef08a' : '#cbd5e1', // Sombra na faixa inferior
      'W': isGold ? '#fffbeb' : '#f8fafc', // Branco perolado / brilho dourado
      'B': isGold ? '#b45309' : '#334155', // Anel do botão (bronze dourado se Gold)
      '2': variant === 'locked' ? '#facc15' : (isGold ? '#fef08a' : '#e2e8f0'), // Centro
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
    const overlay = document.getElementById('capture-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.classList.add('hidden');
    }
  }

  /**
   * Inicia a Sequência de Captura (Suporta Modal HTML e Canvas In-Game)
   */
  function startCaptureSequence(opts = {}, maybeLvl, maybeShiny, maybeForceGold) {
    let targetSpec = null;
    let boss = null;
    let shiny = false;
    let pLvl = undefined;
    let forceGold = false;
    let isLegend = false;
    let onComplete = null;

    if (typeof opts === 'string' || typeof opts === 'number') {
      targetSpec = opts;
      pLvl = typeof maybeLvl === 'number' ? maybeLvl : undefined;
      shiny = typeof maybeLvl === 'boolean' ? maybeLvl : !!maybeShiny;
      forceGold = !!maybeForceGold;
    } else if (opts && typeof opts === 'object') {
      targetSpec = opts.speciesId || opts.mon || (opts.boss && opts.boss.dex) || opts.dex;
      boss = opts.boss || null;
      shiny = !!opts.isShiny || !!opts.shiny;
      isLegend = !!opts.isLegendary || !!opts.legend;
      pLvl = opts.level !== undefined ? opts.level : (opts.playerLevel !== undefined ? opts.playerLevel : (typeof maybeLvl === 'number' ? maybeLvl : undefined));
      forceGold = !!opts.forceGold || !!maybeForceGold;
      onComplete = opts.onComplete || null;
    }

    let mon = null;
    if (typeof targetSpec === 'number' && typeof G === 'object' && G.DEX_BY) {
      mon = G.DEX_BY[targetSpec];
    } else if (typeof targetSpec === 'string') {
      const lower = targetSpec.toLowerCase().trim();
      if (typeof G === 'object' && G.DEX) mon = G.DEX.find(p => p.name && p.name.toLowerCase() === lower);
      if (!mon && typeof G === 'object' && G.DEX_BY) mon = G.DEX_BY[parseInt(targetSpec, 10)];
      if (!mon && typeof POKEDEX !== 'undefined') mon = Object.values(POKEDEX).find(p => p.name && p.name.toLowerCase() === lower);
    } else if (targetSpec && typeof targetSpec === 'object' && targetSpec.dex) {
      mon = targetSpec;
    }

    if (!mon && typeof G === 'object' && G.DEX) mon = G.DEX[0];
    if (!mon || !mon.dex) return;

    // Pausa a partida durante a captura
    if (typeof G === 'object' && G.Game) G.Game.isPaused = true;
    if (typeof game !== 'undefined') game.isPaused = true;

    activeMon = mon;
    activeBoss = boss;
    isShiny = shiny;
    onFinishCb = onComplete;

    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof game !== 'undefined' ? game.player : null);
    playerLevel = (pLvl !== undefined) ? pLvl : (pl ? pl.level : 1);
    activeBallTier = resolveCaptureBall(playerLevel, forceGold);

    evoStage = getEvolutionStage(mon);
    const baseRate = getBaseCatchRate(mon, isShiny || isLegend);
    baseCatchRate = baseRate;

    let finalChance;
    if (activeBallTier.isGold || activeBallTier.isGuaranteed) {
      finalChance = 1.00;
      captureRate = 1.00;
      console.log("✨ Gold Ball ativa: Taxa fixada em 100% de captura garantida!");
    } else {
      finalChance = Math.min(1.0, baseRate + (activeBallTier.bonus || 0));
      captureRate = finalChance;
    }

    pokemonLevel = calculatePokemonLevel(mon, activeBoss, pl);

    // Configuração e exibição do modal HTML (#capture-modal ou #capture-overlay) se presente
    const modalEl = document.getElementById('capture-modal') || document.getElementById('capture-overlay');
    if (modalEl) {
      modalEl.style.display = 'flex';
      modalEl.classList.remove('hidden');

      const nameEl = modalEl.querySelector('#cap-name, #cap-mon-name');
      if (nameEl) nameEl.textContent = mon.name.toUpperCase();

      const shinyEl = modalEl.querySelector('#cap-shiny-badge');
      if (shinyEl) shinyEl.classList.toggle('hidden', !isShiny);

      const typesEl = modalEl.querySelector('#cap-types, #cap-mon-types');
      if (typesEl && Array.isArray(mon.types)) {
        typesEl.innerHTML = mon.types.map(t => `<span class="tag-type type-${t}" style="padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;margin:0 2px;">${t.toUpperCase()}</span>`).join('');
      }

      const rateEl = modalEl.querySelector('#cap-rate, #cap-rate-text');
      if (rateEl) {
        if (activeBallTier.isGold || activeBallTier.isGuaranteed) {
          rateEl.innerHTML = `<span style="color:#ffcb05;font-weight:bold;font-size:14px;">✨ 100% DE CHANCE (CAPTURA GARANTIDA!) ✨</span><br><small style="color:#ffd700;font-weight:bold;">⭐ BÔNUS: +1.000 OURO!</small>`;
        } else {
          const basePct = Math.round(baseRate * 100);
          const bonusPct = Math.round((activeBallTier.bonus || 0) * 100);
          rateEl.textContent = `Chance de Captura: ${Math.round(finalChance * 100)}% (${basePct}% Base + ${bonusPct}% ${activeBallTier.name})`;
        }
      }

      const statusEl = modalEl.querySelector('#cap-status, #cap-status-msg');
      if (statusEl) {
        statusEl.innerHTML = `Lançando ${activeBallTier.name}...`;
      }

      const btnThrow = modalEl.querySelector('#btn-throw-ball');
      if (btnThrow) btnThrow.classList.add('hidden');

      const btnCont = modalEl.querySelector('#btn-cap-continue, #cap-continue-btn');
      if (btnCont) {
        btnCont.classList.add('hidden');
        btnCont.onclick = () => {
          modalEl.style.display = 'none';
          modalEl.classList.add('hidden');
          if (typeof G === 'object' && G.Game) G.Game.isPaused = false;
          if (typeof game !== 'undefined') game.isPaused = false;
          if (typeof G === 'object' && G.DB && typeof G.DB.addRiftCleared === 'function') G.DB.addRiftCleared(1);
          if (typeof G === 'object' && G.DB && typeof G.DB.incrementRiftsCleared === 'function') G.DB.incrementRiftsCleared();
          if (typeof onFinishCb === 'function') onFinishCb(isSuccess);
        };
      }

      // Desenha o sprite do Pokémon no canvas do modal se existir
      const capCanvas = modalEl.querySelector('#cap-canvas, #cap-mon-canvas');
      if (capCanvas && typeof G === 'object' && G.UI && typeof G.UI.sprite === 'function') {
        G.UI.sprite(capCanvas, mon.dex, { lively: true, shiny: isShiny, scale: 2.5 });
      }
    }

    // Ponto onde o monstro está no chão para renderização no canvas
    if (activeBoss) {
      activeBoss.dead = true;
      activeBoss.fade = 0;
      activeBoss.flash = 0;
      targetX = activeBoss.x;
      targetY = activeBoss.y;
    } else if (pl) {
      targetX = pl.x + 60;
      targetY = pl.y;
    } else {
      targetX = 0; targetY = 0;
    }

    // Ponto de arremesso da Pokébola
    if (pl) {
      startX = pl.x;
      startY = pl.y - 25;
    } else {
      startX = targetX - 60;
      startY = targetY - 100;
    }

    ballX = startX;
    ballY = startY;
    ballZ = 80;
    ballAngle = -0.5;

    state = 'throw';
    stateT = 0;
    shakesDone = 0;
    isSuccess = false;
    unlockResult = null;
    particles = [];
    shards = [];

    // Instancia o sprite animado do Pokémon
    if (typeof G === 'object' && G.Sprites && G.Sprites.Animator) {
      pmdAnimator = new G.Sprites.Animator(mon.dex, 1.2, isShiny);
      pmdAnimator.loop('Idle');
    }

    // Sons de arremesso
    if (typeof G === 'object' && G.Audio && G.Audio.sfx) {
      G.Audio.sfx('shot', { kind: 'projectile' });
    }
  }

  function update(dt) {
    if (state === 'idle') return;

    stateT += dt;
    if (pmdAnimator) pmdAnimator.update(dt);

    // 1. ESTADO: ARREMESSO PARABÓLICO ATÉ PAIRAR ACIMA DO POKÉMON (0.65s)
    if (state === 'throw') {
      const dur = 0.65;
      const p = Math.min(1, stateT / dur);

      // A Pokébola viaja em arco até pairar 45px acima do Pokémon
      ballX = startX + (targetX - startX) * p;
      ballY = startY + (targetY - startY) * p;
      ballZ = Math.sin(p * Math.PI) * 75 + p * 45;
      ballAngle += 14 * dt;

      if (p >= 1) {
        state = 'absorb';
        stateT = 0;
        ballX = targetX;
        ballY = targetY;
        ballZ = 45; // Paira no ar
        ballAngle = 0;

        if (G.Audio && G.Audio.sfx) {
          G.Audio.sfx('spark');
        }
        if (G.Camera) G.Camera.kick(0.2);

        // Flash de abertura da Pokébola no ar
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 35 + Math.random() * 45;
          particles.push({
            x: targetX, y: targetY - ballZ,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0.35, maxLife: 0.35,
            color: '#ff3366', size: 3
          });
        }
      }
      return;
    }

    // 2. ESTADO: ABSORÇÃO SUAVE (O Pokémon sobe pelo feixe até a Pokébola) (0.80s)
    if (state === 'absorb') {
      const dur = 0.80;
      const p = Math.min(1, stateT / dur);

      // Partículas em espiral subindo pelo feixe em direção à Pokébola
      if (Math.random() < 0.75) {
        const a = Math.random() * Math.PI * 2;
        const rad = (1 - p) * 22;
        particles.push({
          x: targetX + Math.cos(a) * rad,
          y: targetY - p * 45 + Math.sin(a) * 6,
          vx: -Math.cos(a) * 25,
          vy: -55 - Math.random() * 30,
          life: 0.3, maxLife: 0.3,
          color: Math.random() < 0.5 ? '#ff3366' : '#ffffff',
          size: 2
        });
      }

      if (p >= 1) {
        // Pokémon entrou totalmente na Pokébola. Agora fecha e cai!
        state = 'drop';
        stateT = 0;
        if (G.Audio && G.Audio.sfx) G.Audio.sfx('land');
      }
      return;
    }

    // 3. ESTADO: QUEDA E QUIQUES NO SOLO (0.45s)
    if (state === 'drop') {
      const dur = 0.45;
      const p = Math.min(1, stateT / dur);

      // A Pokébola cai de 45px até o chão (0px) e quica
      if (p < 0.5) {
        const dp = p / 0.5;
        ballZ = 45 * (1 - dp * dp); // Aceleração de queda gravitacional
      } else if (p < 0.78) {
        const bp = (p - 0.5) / 0.28;
        ballZ = Math.sin(bp * Math.PI) * 14; // 1º quique
      } else {
        const bp = (p - 0.78) / 0.22;
        ballZ = Math.sin(bp * Math.PI) * 5; // 2º quique suave
      }

      if (p >= 1) {
        ballZ = 0;
        state = 'wobble';
        stateT = 0;
        shakesDone = 0;
      }
      return;
    }

    // 4. ESTADO: 3 BALANÇOS DE TENSÃO NO CHÃO (3.2s)
    if (state === 'wobble') {
      const isGold = !!(activeBallTier && (activeBallTier.isGold || activeBallTier.isGuaranteed));
      if (isGold && Math.random() < 0.5) {
        particles.push({
          x: targetX + (Math.random() - 0.5) * 18,
          y: targetY + 2 + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 20,
          vy: -25 - Math.random() * 25,
          life: 0.45, maxLife: 0.45,
          isStar: true,
          color: Math.random() < 0.6 ? '#ffd700' : '#ffaa00',
          size: 2.5 + Math.random() * 2
        });
      }

      // Balanço 1 aos 0.8s (-22°)
      if (stateT >= 0.8 && shakesDone === 0) {
        shakesDone = 1;
        triggerWobbleShake(-0.38);
      }
      // Balanço 2 aos 1.6s (+22°)
      else if (stateT >= 1.6 && shakesDone === 1) {
        shakesDone = 2;
        triggerWobbleShake(0.38);
      }
      // Balanço 3 aos 2.4s (-18°)
      else if (stateT >= 2.4 && shakesDone === 2) {
        shakesDone = 3;
        triggerWobbleShake(-0.30);
      }

      // Amortecimento suave de volta à vertical
      ballAngle = G.U ? G.U.damp(ballAngle, 0, 9, dt) : ballAngle * 0.85;

      // Resolução aos 3.2s
      if (stateT >= 3.2) {
        stateT = 0;
        let rollSuccess = false;

        if (activeBallTier && (activeBallTier.isGold || activeBallTier.isGuaranteed)) {
          // A Gold Ball ignora qualquer cálculo probabilístico e garante 100% de sucesso
          rollSuccess = true;
          console.log("✨ Gold Ball utilizada: Captura 100% garantida!");
        } else {
          // Fórmula padrão para as demais Pokébolas
          const finalChance = captureRate;
          rollSuccess = Math.random() <= finalChance;
        }

        isSuccess = rollSuccess;

        if (isSuccess) {
          state = 'success';
          ballAngle = 0;

          // Recompensa Extra da Gold Ball (+1.000 Ouro)
          if (activeBallTier && (activeBallTier.isGold || activeBallTier.isGuaranteed)) {
            const reward = activeBallTier.goldReward || 1000;
            const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : null);
            if (dbObj) {
              if (typeof dbObj.addGold === 'function') {
                dbObj.addGold(reward);
              } else if (dbObj.save) {
                dbObj.save.coins = (dbObj.save.coins || 0) + reward;
                if (dbObj.save.stats) dbObj.save.stats.coinsEarned = (dbObj.save.stats.coinsEarned || 0) + reward;
                if (dbObj.commit) dbObj.commit('goldball');
              }
            }
            if (typeof G === 'object' && G.Game && G.Game.player) {
              G.Game.player.coins = (G.Game.player.coins || 0) + reward;
            }
            console.log(`✨ Captura Perfeita com Gold Ball! Recompensa: +${reward} Ouro!`);
            if (typeof G === 'object' && G.Spawner && G.Spawner.say) {
              G.Spawner.say(`⭐ Captura Perfeita com Gold Ball! Recompensa: +${reward} Ouro!`, 4.0, true);
            }
            if (typeof G === 'object' && G.UI && G.UI.toast) {
              G.UI.toast(`⭐ Captura Perfeita com Gold Ball! Recompensa: +${reward} Ouro!`, 4500);
            }
            if (typeof G === 'object' && G.UI && G.UI.refreshCoins) {
              G.UI.refreshCoins();
            }
            const modalEl = document.getElementById('capture-modal') || document.getElementById('capture-overlay');
            if (modalEl) {
              const modalStatus = modalEl.querySelector('#cap-status, .cap-status');
              if (modalStatus) {
                modalStatus.innerHTML = `<span style="color:#ffd700;font-weight:bold;">Captura Perfeita com Gold Ball! Recompensa: +1.000 Ouro!</span>`;
              }
            }
          }

          // Atualiza modal HTML
          const modalElSuccess = document.getElementById('capture-modal') || document.getElementById('capture-overlay');
          if (modalElSuccess) {
            const modalStatus = modalElSuccess.querySelector('#cap-status, .cap-status, #cap-status-msg');
            if (modalStatus) {
              modalStatus.innerHTML = `<span style="color:#4ade80;font-weight:bold;font-size:16px;">✨ ${activeMon.name.toUpperCase()} FOI CAPTURADO COM SUCESSO! ✨</span>`;
            }
            const btnCont = modalElSuccess.querySelector('#btn-cap-continue, #cap-continue-btn');
            if (btnCont) btnCont.classList.remove('hidden');
          }

          if (G.Game && G.Game.flash) G.Game.flash('#ffd700', 0.45);
          if (G.Audio && G.Audio.sfx) {
            G.Audio.sfx('confirm');
            G.Audio.sfx('shinyGet');
          }
          if (G.Camera) G.Camera.kick(0.6);

          // Salva na Pokédex e desbloqueia forma base ancestral
          if (G.DB && activeMon) {
            if (typeof G.DB.unlockPokemon === 'function') {
              unlockResult = G.DB.unlockPokemon(activeMon.dex, isShiny);
            } else {
              if (isShiny && G.DB.grantShiny) G.DB.grantShiny(activeMon.dex, 'rift');
              else if (G.DB.grant) G.DB.grant(activeMon.dex, 'rift');
              if (G.DB.commit) G.DB.commit(true);
            }
          }

          // Notificação de desbloqueio da forma base se for estágio evoluído
          if (unlockResult && unlockResult.baseDex && unlockResult.baseDex !== activeMon.dex) {
            if (typeof G === 'object' && G.Spawner && G.Spawner.say) {
              G.Spawner.say(`${activeMon.name} registrado! ${unlockResult.baseName} liberado para novas partidas!`, 3.5, true);
            }
            if (typeof G === 'object' && G.UI && G.UI.toast) {
              G.UI.toast(`Linhagem Desbloqueada: ${unlockResult.baseName} agora pode iniciar partidas!`, 4000);
            }
          }

          // Explosão de 16 estrelas pixel art
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            const sp = 45 + Math.random() * 55;
            particles.push({
              x: targetX, y: targetY - 8,
              vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 15,
              life: 0.9, maxLife: 0.9,
              isStar: true,
              color: i % 2 === 0 ? '#ffd700' : '#ffffff',
              size: 4 + Math.random() * 3
            });
          }
        } else {
          state = 'escape';
          ballAngle = 0;

          const modalElEscape = document.getElementById('capture-modal') || document.getElementById('capture-overlay');
          if (modalElEscape) {
            const modalStatus = modalElEscape.querySelector('#cap-status, .cap-status, #cap-status-msg');
            if (modalStatus) {
              modalStatus.innerHTML = `<span style="color:#f87171;font-weight:bold;font-size:16px;">💨 ${activeMon.name.toUpperCase()} escapou da bola!</span>`;
            }
            const btnCont = modalElEscape.querySelector('#btn-cap-continue, #cap-continue-btn');
            if (btnCont) btnCont.classList.remove('hidden');
          }

          if (G.Audio && G.Audio.sfx) G.Audio.sfx('break');
          if (G.Camera) G.Camera.kick(0.5);

          // Estilhaços da Pokébola com a cor do hemisfério da bola arremessada
          const shardTopColor = activeBallTier ? activeBallTier.colorTop : '#ef4444';
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const sp = 60 + Math.random() * 70;
            shards.push({
              x: targetX, y: targetY - 6,
              vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50,
              rot: Math.random() * 6.28, vrot: (Math.random() - 0.5) * 15,
              life: 0.8, maxLife: 0.8,
              color: i % 2 === 0 ? shardTopColor : '#f8fafc',
              size: 3 + Math.floor(Math.random() * 3)
            });
          }

          // Fumaça cinza
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: targetX + (Math.random() - 0.5) * 16,
              y: targetY - (Math.random() * 12),
              vx: (Math.random() - 0.5) * 40,
              vy: -35 - Math.random() * 35,
              life: 0.7, maxLife: 0.7,
              color: '#94a3b8',
              size: 4 + Math.random() * 3
            });
          }
        }
      }
      return;
    }

    // 5. ESTADO: CELEBRAÇÃO (1.8s)
    if (state === 'success') {
      if (Math.random() < 0.35) {
        const a = Math.random() * Math.PI * 2;
        const d = 16 + Math.random() * 28;
        particles.push({
          x: targetX + Math.cos(a) * d,
          y: targetY - 8 + Math.sin(a) * d,
          vx: (Math.random() - 0.5) * 10,
          vy: -15 - Math.random() * 20,
          life: 0.5, maxLife: 0.5,
          isStar: true,
          color: '#ffd700',
          size: 3
        });
      }

      if (stateT >= 1.8) {
        const cb = onFinishCb;
        state = 'idle';
        if (typeof cb === 'function') cb(true);
      }
      return;
    }

    // 6. ESTADO: FUGA (1.5s)
    if (state === 'escape') {
      if (stateT >= 1.5) {
        const cb = onFinishCb;
        state = 'idle';
        if (typeof cb === 'function') cb(false);
      }
      return;
    }
  }

  function triggerWobbleShake(angle) {
    ballAngle = angle;
    if (G.Audio && G.Audio.sfx) G.Audio.sfx('select');
    if (G.Camera) G.Camera.kick(0.18);

    const isGold = !!(activeBallTier && (activeBallTier.isGold || activeBallTier.isGuaranteed));
    const dir = angle > 0 ? 1 : -1;
    const count = isGold ? 8 : 3;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: targetX + dir * 10,
        y: targetY + 2,
        vx: dir * (30 + Math.random() * 45),
        vy: -15 - Math.random() * 25,
        life: 0.4, maxLife: 0.4,
        isStar: isGold,
        color: isGold ? (i % 2 === 0 ? '#ffd700' : '#ffaa00') : '#e2e8f0',
        size: isGold ? 3 + Math.random() * 2 : 2
      });
    }
  }

  // ---------------- Renderização no Mundo (drawWorld / drawable) ----------------
  function drawable() {
    if (state === 'idle') return null;
    return {
      y: targetY + 2,
      draw(ctx) {
        drawInWorld(ctx);
      }
    };
  }

  function drawInWorld(ctx) {
    if (state === 'idle') return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 1. Sombra da Pokébola no Solo
    const shadowAlpha = state === 'escape' ? Math.max(0, 1 - stateT / 0.8) : Math.max(0.15, 0.45 - (ballZ / 120) * 0.3);
    const shadowR = Math.max(6, 12 - (ballZ / 90) * 4);
    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(ballX, targetY, shadowR, shadowR * 0.45, 0, 0, Math.PI * 2);
    } else {
      ctx.save();
      ctx.translate(ballX, targetY);
      ctx.scale(1, 0.45);
      ctx.arc(0, 0, shadowR, 0, Math.PI * 2);
      ctx.restore();
    }
    ctx.fill();
    ctx.restore();

    // 2. Renderização do Pokémon sendo sugado no chão
    if (state === 'throw') {
      // Pokémon no chão esperando a Pokébola (renderizado com cores normais, sem silhueta branca)
      if (pmdAnimator) {
        pmdAnimator.draw(ctx, targetX, targetY, { alpha: 1 });
      }
    } else if (state === 'absorb') {
      const dur = 0.80;
      const p = Math.min(1, stateT / dur);
      const absorbScale = Math.max(0.01, 1 - p);

      // Pokébola está suspensa no ar em:
      const ballAirY = ballY - ballZ;

      // Cone de feixe de luz vermelha saindo da Pokébola e cobrindo o chão
      ctx.save();
      const grad = ctx.createLinearGradient(ballX, ballAirY, targetX, targetY);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.2, 'rgba(255, 51, 102, 0.65)');
      grad.addColorStop(1, 'rgba(255, 51, 102, 0.15)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(ballX, ballAirY);
      ctx.lineTo(targetX - 26, targetY + 6);
      ctx.lineTo(targetX + 26, targetY + 6);
      ctx.closePath();
      ctx.fill();

      // Linhas de energia no feixe
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Pokémon com cores naturais subindo pelo feixe até a boca da Pokébola
      if (pmdAnimator) {
        ctx.save();
        const currentPokeY = targetY - p * (targetY - ballAirY);
        ctx.translate(targetX, currentPokeY);
        ctx.scale(absorbScale, absorbScale);
        pmdAnimator.draw(ctx, 0, 0, { alpha: absorbScale });
        ctx.restore();
      }
    } else if (state === 'escape') {
      // Pokémon reaparece brevemente e corre para fora
      const dur = 1.5;
      const p = Math.min(1, stateT / dur);
      const fleeAlpha = Math.max(0, 1 - p * 1.5);
      if (pmdAnimator && fleeAlpha > 0) {
        pmdAnimator.draw(ctx, targetX + p * 80, targetY, { alpha: fleeAlpha });
      }
    }

    // 3. Renderização da Pokébola em Pixel Art
    if (state !== 'escape') {
      const variant = state === 'absorb' ? 'open' : state === 'success' ? 'locked' : 'closed';
      const sprite = getPokeballSprite(variant, activeBallTier);

      if (sprite) {
        ctx.save();
        ctx.translate(ballX, ballY - ballZ);
        ctx.rotate(ballAngle);
        ctx.scale(ballScale, ballScale);

        const sw = sprite.width;
        const sh = sprite.height;
        ctx.drawImage(sprite, -sw / 2, -sh / 2);

        // Brilho pulsante no botão se travada com sucesso
        if (state === 'success') {
          const pulse = 0.5 + Math.sin(stateT * 12) * 0.5;
          ctx.globalAlpha = pulse * 0.85;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // 4. Estilhaços Pixel Art da Pokébola (em caso de quebra)
    if (shards.length) {
      for (let i = shards.length - 1; i >= 0; i--) {
        const sh = shards[i];
        sh.x += sh.vx * (1 / 60);
        sh.y += sh.vy * (1 / 60);
        sh.vy += 220 * (1 / 60);
        sh.rot += sh.vrot * (1 / 60);
        sh.life -= 1 / 60;
        if (sh.life <= 0) { shards.splice(i, 1); continue; }

        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rot);
        ctx.fillStyle = sh.color;
        ctx.fillRect(-sh.size / 2, -sh.size / 2, sh.size, sh.size);
        ctx.restore();
      }
    }

    // 5. Partículas e Estrelas Pixel Art no Mundo
    if (particles.length) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx * (1 / 60);
        pt.y += pt.vy * (1 / 60);
        pt.life -= 1 / 60;
        if (pt.life <= 0) { particles.splice(i, 1); continue; }

        const alpha = Math.max(0, pt.life / pt.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;

        if (pt.isStar) {
          drawPixelStar(ctx, pt.x, pt.y, pt.size, pt.color);
        } else {
          ctx.fillStyle = pt.color;
          ctx.fillRect(Math.round(pt.x - pt.size / 2), Math.round(pt.y - pt.size / 2), pt.size, pt.size);
        }
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ---------------- Card de Informações ao Lado da Pokébola (drawScreen) ----------------
  function drawScreen(ctx, w, h) {
    if (state === 'idle' || !activeMon) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Converte a posição da Pokébola no mundo para coordenadas de tela
    const camLeft = (typeof G === 'object' && G.Camera) ? G.Camera.left() : 0;
    const camTop = (typeof G === 'object' && G.Camera) ? G.Camera.top() : 0;
    const camScale = (typeof G === 'object' && G.Camera && G.Camera.scale) ? G.Camera.scale : 1;
    const camSx = (typeof G === 'object' && G.Camera && G.Camera._sx) ? G.Camera._sx : 0;
    const camSy = (typeof G === 'object' && G.Camera && G.Camera._sy) ? G.Camera._sy : 0;

    const ballScreenX = Math.round((ballX - camLeft + camSx) * camScale);
    const ballScreenY = Math.round((targetY - camTop + camSy) * camScale);

    // Dimensões do Card Lateral
    const isEvoUnlock = state === 'success' && unlockResult && unlockResult.baseDex && unlockResult.baseDex !== activeMon.dex;
    const cardW = 276;
    const cardH = isEvoUnlock ? 198 : 166;

    // Posiciona o card ao lado da Pokébola (prioriza o lado direito; se sair da tela, põe à esquerda)
    let cardX;
    let arrowDir = 'left'; // A seta aponta para a Pokébola
    const spacing = 55;

    if (ballScreenX + spacing + cardW <= w - 16) {
      cardX = ballScreenX + spacing;
      arrowDir = 'left';
    } else if (ballScreenX - spacing - cardW >= 16) {
      cardX = ballScreenX - spacing - cardW;
      arrowDir = 'right';
    } else {
      // Telas muito estreitas: centraliza horizontalmente
      cardX = Math.round((w - cardW) / 2);
      arrowDir = 'none';
    }

    // Centraliza verticalmente com a Pokébola com margem de segurança
    const clampFn = (G.U && G.U.clamp) ? G.U.clamp : (v, min, max) => Math.max(min, Math.min(max, v));
    const cardY = Math.round(clampFn(ballScreenY - cardH / 2, 24, h - cardH - 24));

    // 1. Linha Conectora em Pixel Art ligando a Pokébola ao Card
    if (arrowDir !== 'none') {
      ctx.save();
      ctx.strokeStyle = isShiny ? '#facc15' : '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); // Linha pontilhada tática

      const startLineX = arrowDir === 'left' ? cardX : cardX + cardW;
      const midLineY = cardY + cardH / 2;
      ctx.beginPath();
      ctx.moveTo(startLineX, midLineY);
      ctx.lineTo(ballScreenX, ballScreenY);
      ctx.stroke();
      ctx.setLineDash([]); // Restaura traço contínuo
      ctx.restore();
    }

    // 2. Fundo do Card Estilo Retrô
    ctx.fillStyle = 'rgba(11, 17, 30, 0.95)';
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Borda externa sólida
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 3;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Borda interna brilhante (Dourada se Shiny ou Gold Ball, Ciano se Normal)
    const isGold = !!(activeBallTier && (activeBallTier.isGold || activeBallTier.isGuaranteed));
    const borderColor = (isShiny || isGold) ? '#ffd700' : '#38bdf8';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isGold ? 2 : 1.5;
    ctx.strokeRect(cardX + 2, cardY + 2, cardW - 4, cardH - 4);

    // 3. Avatar / Sprite do Pokémon (Canto Superior Esquerdo)
    const boxSize = 52;
    const boxX = cardX + 10;
    const boxY = cardY + 10;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);

    // Sprite do Pokémon
    if (pmdAnimator) {
      ctx.save();
      pmdAnimator.draw(ctx, boxX + boxSize / 2, boxY + boxSize / 2 + 8);
      ctx.restore();
    }

    // Selo ★ SHINY no topo do avatar
    if (isShiny) {
      ctx.save();
      ctx.fillStyle = '#713f12';
      ctx.fillRect(boxX + 2, boxY + 2, 40, 11);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX + 2, boxY + 2, 40, 11);

      ctx.font = '800 8px Pixelify, monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('★ SHINY', boxX + 4, boxY + 10);
      ctx.restore();
    }

    // 4. Seção Superior Direita (Nome, Nível, Estágio)
    const infoX = boxX + boxSize + 10;

    // LINHA 1: Nome da Espécie
    ctx.font = '800 13px Pixelify, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    const nameText = activeMon.name.toUpperCase();
    ctx.strokeText(nameText, infoX, cardY + 23);
    ctx.fillText(nameText, infoX, cardY + 23);

    // LINHA 2: Nível e Estágio Evolutivo
    const lvlText = `Nv. ${pokemonLevel}`;
    ctx.save();
    ctx.font = '800 10px Pixelify, monospace';
    const lvlW = ctx.measureText(lvlText).width + 6;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(infoX, cardY + 30, lvlW, 14);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(infoX, cardY + 30, lvlW, 14);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(lvlText, infoX + 3, cardY + 41);
    ctx.restore();

    // Badge do Estágio Evolutivo
    const STAGE_CONFIG = {
      'Básico': { bg: '#064e3b', border: '#10b981', text: '#4ade80' },
      'Estágio 1': { bg: '#0c4a6e', border: '#0284c7', text: '#38bdf8' },
      'Estágio 2': { bg: '#4c1d95', border: '#7c3aed', text: '#c084fc' },
      'Lendário': { bg: '#713f12', border: '#d97706', text: '#fde047' },
      'Mítico': { bg: '#701a75', border: '#c026d3', text: '#f0abfc' }
    };
    const sConf = STAGE_CONFIG[evoStage] || STAGE_CONFIG['Básico'];
    const stageLabel = evoStage.toUpperCase();

    const stageX = infoX + lvlW + 6;
    ctx.save();
    ctx.font = '800 9px Pixelify, monospace';
    const sWidth = ctx.measureText(stageLabel).width + 8;
    ctx.fillStyle = sConf.bg;
    ctx.fillRect(stageX, cardY + 30, sWidth, 14);
    ctx.strokeStyle = sConf.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(stageX, cardY + 30, sWidth, 14);
    ctx.fillStyle = sConf.text;
    ctx.fillText(stageLabel, stageX + 4, cardY + 41);
    ctx.restore();

    // LINHA 3: Badges de Tipos
    let typeX = infoX;
    if (activeMon.types && Array.isArray(activeMon.types)) {
      for (const t of activeMon.types) {
        if (typeX + 36 > cardX + cardW - 8) break;
        const col = (G.U && G.U.TYPE_COLOR && G.U.TYPE_COLOR[t]) ? G.U.TYPE_COLOR[t] : '#64748b';
        ctx.save();
        ctx.font = '700 8px Pixelify, sans-serif';
        const tName = t.toUpperCase();
        const tw = ctx.measureText(tName).width + 8;
        ctx.fillStyle = col;
        ctx.fillRect(typeX, cardY + 48, tw, 13);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(typeX, cardY + 48, tw, 13);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(tName, typeX + 4, cardY + 58);
        ctx.restore();
        typeX += tw + 4;
      }
    }

    // 5. Divisória Horizontal Pixel Art
    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cardX + 8, cardY + 68);
    ctx.lineTo(cardX + cardW - 8, cardY + 68);
    ctx.stroke();
    ctx.restore();

    // 6. Badge de Pokébola Equipada e Nível do Jogador
    const ballBadgeY = cardY + 74;
    const ballBadgeH = 18;
    const ballBadgeW = cardW - 20;
    const ballTierColor = isGold ? '#ffd700' : ((activeBallTier && activeBallTier.colorTop) ? activeBallTier.colorTop : '#ee1515');

    ctx.save();
    ctx.fillStyle = isGold ? 'rgba(38, 25, 0, 0.95)' : 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(cardX + 10, ballBadgeY, ballBadgeW, ballBadgeH);
    ctx.strokeStyle = ballTierColor;
    ctx.lineWidth = isGold ? 2 : 1.5;
    ctx.strokeRect(cardX + 10, ballBadgeY, ballBadgeW, ballBadgeH);

    // Texto: [Ícone] [Nome da Bola] (Nv. [playerLevel]) • [Bônus]
    ctx.font = '800 10px Pixelify, "Segoe UI", sans-serif';
    ctx.fillStyle = isGold ? '#ffd700' : '#ffffff';
    const ballBadgeText = isGold
      ? `⭐ GOLD BALL ATIVA! (100% CAPTURA GARANTIDA + 1.000 OURO)`
      : `${activeBallTier.icon} ${activeBallTier.name} (Nv. ${playerLevel}) • ${activeBallTier.label}`;
    ctx.fillText(ballBadgeText, cardX + (isGold ? 12 : 16), ballBadgeY + 13);
    ctx.restore();

    // 7. Seção Central: Dificuldade e Chance Final de Captura
    const basePct = Math.round((baseCatchRate || 0.50) * 100);
    const bonusPct = Math.round((activeBallTier ? activeBallTier.bonus : 0) * 100);
    const finalPct = Math.round(captureRate * 100);
    const diffColor = captureRate <= 0.20 ? '#f87171' : captureRate <= 0.35 ? '#facc15' : '#4ade80';

    ctx.save();
    ctx.font = '700 9.5px Pixelify, "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Chance de Captura: ', cardX + 10, cardY + 107);
    if (isGold) {
      ctx.fillStyle = '#ffcb05';
      ctx.font = '800 9.5px Pixelify, "Segoe UI", sans-serif';
      ctx.fillText('✨ 100% DE CHANCE (CAPTURA GARANTIDA!) ✨', cardX + 96, cardY + 107);
    } else {
      ctx.fillStyle = diffColor;
      const bonusText = bonusPct > 0 ? ` (${basePct}% Base + ${bonusPct}% ${activeBallTier.name})` : ` (${basePct}% Base)`;
      ctx.fillText(`${finalPct}%${bonusText}`, cardX + 96, cardY + 107);
    }
    ctx.restore();

    // 8. Seção Inferior: Indicador dos 3 Balanços e Status
    const rowBottomY = cardY + 120;

    // 3 slots de Pokébola pixel art (14x14px)
    for (let slot = 1; slot <= 3; slot++) {
      const slotX = cardX + 10 + (slot - 1) * 20;
      const isLit = shakesDone >= slot || state === 'success';
      const isFailed = state === 'escape';

      ctx.save();
      ctx.fillStyle = isFailed ? '#450a0a' : isLit ? (state === 'success' ? '#713f12' : '#064e3b') : '#1e293b';
      ctx.fillRect(slotX, rowBottomY, 14, 14);
      ctx.strokeStyle = isFailed ? '#ef4444' : isLit ? (state === 'success' ? '#facc15' : '#10b981') : '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(slotX, rowBottomY, 14, 14);

      if (isFailed) {
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(slotX + 3, rowBottomY + 3); ctx.lineTo(slotX + 11, rowBottomY + 11);
        ctx.moveTo(slotX + 11, rowBottomY + 3); ctx.lineTo(slotX + 3, rowBottomY + 11);
        ctx.stroke();
      } else if (isLit) {
        ctx.fillStyle = state === 'success' ? '#facc15' : '#34d399';
        ctx.beginPath();
        ctx.arc(slotX + 7, rowBottomY + 7, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(slotX + 7, rowBottomY + 7, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Texto de Status em Tempo Real
    let statusText = '';
    let statusColor = '#e2e8f0';

    if (state === 'throw') {
      const bName = activeBallTier ? activeBallTier.name : 'Pokébola';
      statusText = `Arremessando ${bName}...`;
      statusColor = activeBallTier ? activeBallTier.colorTop : '#38bdf8';
    } else if (state === 'absorb') {
      statusText = 'Absorvendo Pokémon...';
      statusColor = '#ff6b8b';
    } else if (state === 'drop') {
      statusText = 'Assentando no solo...';
      statusColor = '#cbd5e1';
    } else if (state === 'wobble') {
      if (shakesDone === 0) {
        statusText = 'Tensão máxima...';
        statusColor = '#ffd23f';
      } else if (shakesDone === 1) {
        statusText = 'Balanço 1 de 3...';
        statusColor = '#ffd23f';
      } else if (shakesDone === 2) {
        statusText = 'Balanço 2 de 3...';
        statusColor = '#ffd23f';
      } else {
        statusText = 'Balanço 3 de 3... Quase!';
        statusColor = '#f59e0b';
      }
    } else if (state === 'success') {
      if (isGold) {
        statusText = '⭐ CAPTURA PERFEITA COM GOLD BALL! (+1.000 OURO)';
        statusColor = '#ffd700';
      } else {
        statusText = '✨ ' + activeMon.name.toUpperCase() + ' CAPTURADO!';
        statusColor = '#4ade80';
      }
    } else if (state === 'escape') {
      statusText = '❌ A POKÉBOLA QUEBROU!';
      statusColor = '#f87171';
    }

    ctx.save();
    ctx.font = '800 11px Pixelify, "Segoe UI", sans-serif';
    ctx.fillStyle = statusColor;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(statusText, cardX + 78, rowBottomY + 11);
    ctx.fillText(statusText, cardX + 78, rowBottomY + 11);
    ctx.restore();

    // Feedback visual de desbloqueio da forma base ancestral
    if (isEvoUnlock) {
      const bannerY = rowBottomY + 22;
      ctx.save();
      // Caixa destacada estilo retrô verde-esmeralda
      ctx.fillStyle = 'rgba(6, 78, 59, 0.95)';
      ctx.fillRect(cardX + 8, bannerY, cardW - 16, 24);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cardX + 8, bannerY, cardW - 16, 24);

      ctx.font = '800 10px Pixelify, "Segoe UI", sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#052e16';
      const msg = `🔓 ${unlockResult.baseName} liberado para novas partidas!`;
      ctx.strokeText(msg, cardX + 16, bannerY + 16);
      ctx.fillText(msg, cardX + 16, bannerY + 16);
      ctx.restore();
    }

    ctx.restore();
  }

  function open(mon, opts = {}) {
    startCaptureSequence({
      mon: mon,
      isShiny: !!opts.isShiny,
      playerLevel: opts.playerLevel,
      onComplete: opts.onComplete
    });
  }

  function getCameraTarget() {
    if (state === 'idle') return null;
    return { x: targetX, y: targetY };
  }

  function debugTestCatchRates() {
    console.log("=== TABELA DE CHANCES DE CAPTURA ===");
    const levels = [5, 15, 25, 35];
    levels.forEach(lvl => {
      const ball = getBallForPlayerLevel(lvl);
      console.log(`\n--- Nível ${lvl} (${ball.name} / ${ball.label}) ---`);
      console.log(`• Básico:   ${Math.round((0.50 + ball.bonus) * 100)}%`);
      console.log(`• Lendário: ${Math.round((0.20 + ball.bonus) * 100)}%`);
      console.log(`• Shiny:    ${Math.round((0.15 + ball.bonus) * 100)}%`);
    });
  }

  const exportObj = {
    init,
    open,
    startCaptureSequence,
    startInWorld: startCaptureSequence,
    update,
    drawable,
    drawWorld: drawInWorld,
    drawScreen,
    getCameraTarget,
    getCaptureRate,
    getBaseCatchRate,
    isLegendaryOrMythical,
    getEvolutionStage,
    getBallForPlayerLevel,
    resolveCaptureBall,
    GOLD_BALL_CONFIG,
    POKEBALL_TIERS,
    debugTestCatchRates,
    get activeBall() { return activeBallTier; },
    get isCapturing() { return state !== 'idle'; }
  };

  return exportObj;
})();

if (typeof G === 'object') {
  G.Capture = CaptureSystem;
  G.CaptureSystem = CaptureSystem;
  G.GOLD_BALL_CONFIG = CaptureSystem.GOLD_BALL_CONFIG;
  G.POKEBALL_TIERS = CaptureSystem.POKEBALL_TIERS;
  G.getBallForPlayerLevel = CaptureSystem.getBallForPlayerLevel;
  G.resolveCaptureBall = CaptureSystem.resolveCaptureBall;
  G.getBaseCatchRate = CaptureSystem.getBaseCatchRate;
  G.isLegendaryOrMythical = CaptureSystem.isLegendaryOrMythical;
  G.debugTestCatchRates = CaptureSystem.debugTestCatchRates;
}

if (typeof window !== 'undefined') {
  window.CaptureSystem = CaptureSystem;
  window.captureSystem = CaptureSystem;
  window.GOLD_BALL_CONFIG = CaptureSystem.GOLD_BALL_CONFIG;
  window.POKEBALL_TIERS = CaptureSystem.POKEBALL_TIERS;
  window.getBallForPlayerLevel = CaptureSystem.getBallForPlayerLevel;
  window.resolveCaptureBall = CaptureSystem.resolveCaptureBall;
  window.getBaseCatchRate = CaptureSystem.getBaseCatchRate;
  window.isLegendaryOrMythical = CaptureSystem.isLegendaryOrMythical;

  window.debugTestCatchRates = function() {
    console.log("=== TABELA DE CHANCES DE CAPTURA ===");
    const levels = [5, 15, 25, 35, 45];
    levels.forEach(lvl => {
      const ball = CaptureSystem.getBallForPlayerLevel(lvl);
      console.log(`\n--- Nível ${lvl} (${ball.name} / ${ball.label}) ---`);
      console.log(`• Básico:   ${Math.round((0.50 + ball.bonus) * 100)}%`);
      console.log(`• Lendário: ${Math.round((0.20 + ball.bonus) * 100)}%`);
      console.log(`• Shiny:    ${Math.round((0.15 + ball.bonus) * 100)}%`);
    });
  };

  window.debugTriggerGoldBall = function(speciesId, isShiny) {
    const target = speciesId || 'mewtwo';
    const shiny = isShiny || false;
    console.log(`[TESTE GOLD BALL] Disparando captura garantida para: ${String(target).toUpperCase()} (Shiny: ${shiny})`);
    // Força level 45 e flag forceGold = true
    CaptureSystem.startCaptureSequence(target, 45, shiny, true);
  };

  window.debugTestGoldBallRate = function() {
    const ball = CaptureSystem.resolveCaptureBall(45, true);
    console.log("Status da Bola:", ball.name);
    console.log("Taxa de Captura:", ((ball.catchRate !== undefined ? ball.catchRate : 1.0) * 100) + "%");
    console.log("Captura Garantida?", ball.isGuaranteed ? "SIM (100%)" : "NÃO");
    return ball;
  };

  window.debugTriggerCapture = function(speciesId, simulatedLevel, isShiny) {
    let lvl = undefined;
    let shiny = false;

    if (typeof simulatedLevel === 'boolean') {
      shiny = simulatedLevel;
    } else if (typeof simulatedLevel === 'number') {
      lvl = simulatedLevel;
      shiny = !!isShiny;
    } else {
      shiny = !!isShiny;
    }

    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof window !== 'undefined' ? window.player : null);
    const finalLevel = lvl !== undefined ? lvl : (pl ? pl.level : 1);
    const ball = CaptureSystem.getBallForPlayerLevel(finalLevel);

    console.log(`[TESTE CAPTURA] Nível: ${finalLevel} | Bola Ativa: ${ball.name} (${ball.label})`);

    let mon = null;
    const targetSpec = speciesId || 'charmander';
    if (typeof targetSpec === 'number') {
      mon = (G.DEX_BY && G.DEX_BY[targetSpec]) || (typeof POKEDEX !== 'undefined' && POKEDEX[targetSpec]);
    } else if (typeof targetSpec === 'string') {
      const lower = targetSpec.toLowerCase().trim();
      if (G.DEX && Array.isArray(G.DEX)) {
        mon = G.DEX.find(p => p.name && p.name.toLowerCase() === lower);
      }
      if (!mon && G.DEX_BY) {
        mon = G.DEX_BY[parseInt(targetSpec, 10)];
      }
      if (!mon && typeof POKEDEX !== 'undefined') {
        mon = Object.values(POKEDEX).find(p => p.name && p.name.toLowerCase() === lower);
      }
    }

    if (!mon && G.DEX) {
      mon = G.U ? G.U.pick(G.DEX.filter(p => G.SPRITE_META && G.SPRITE_META[p.dex])) : G.DEX[0];
    }

    if (!mon) {
      console.warn('[Debug] Pokémon não encontrado para teste de captura.');
      return;
    }

    CaptureSystem.startCaptureSequence({
      mon: mon,
      isShiny: shiny,
      playerLevel: finalLevel,
      onComplete: (caught) => {
        console.log(`%c[Debug Capture]%c Captura finalizada. Resultado: ${caught ? 'CAPTURADO! 🏆' : 'Fugiu! 💨'}`, 'color:#38bdf8;font-weight:bold', 'color:#e2e8f0');
      }
    });
  };

  window.debugSpawnRift = function() {
    if (typeof G === 'object' && G.Rift && typeof G.Rift.start === 'function') {
      G.Rift.start();
      console.log("🌀 Rift forçado no mapa!");
    } else if (window.riftSystem && typeof window.riftSystem.forceSpawnRift === 'function') {
      window.riftSystem.forceSpawnRift();
      console.log("🌀 Rift forçado no mapa!");
    }
  };
}

if (typeof global !== 'undefined') {
  global.resolveCaptureBall = CaptureSystem.resolveCaptureBall;
  global.GOLD_BALL_CONFIG = CaptureSystem.GOLD_BALL_CONFIG;
  global.debugTriggerGoldBall = (typeof window !== 'undefined') ? window.debugTriggerGoldBall : null;
  global.debugTestGoldBallRate = (typeof window !== 'undefined') ? window.debugTestGoldBallRate : null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaptureSystem;
}

