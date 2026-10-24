/* ============ capture.js — Sistema Diegético de Captura no Mapa & Rifts ============
 * - Captura Diegética Integrada no Canvas (Sem Modal em Tela Cheia durante o combate).
 * - Ao zerar a vida do Guardião, o monstro colapsa em partículas vermelhas de energia.
 * - Uma Pokébola física (WorldCaptureBall) cai em (x, y), quica no chão e balança 3 vezes (-25°, +25°, -25°).
 * - Sucesso: Trava ao centro, emite faíscas estelares, toca SFX clássico de clique e sobe [+ MON CAPTURADO!].
 * - Falha: A bola se abre, emite nuvem de fumaça cinza, SFX de quebra e texto [ESCAPOU!].
 * - O combate NÃO é pausado e o jogador continua se movendo e atacando livremente.
 * - Tiers Dinâmicos: Poké Ball (+0%), Great Ball (+3%), Ultra Ball (+6%), Ultimate Ball (+10%).
 * - Evento Raro Gold Ball (Nv 41+): 10% de chance de proc -> bônus de chance (+14% Normais,
 *   +8% Shinies/Lendários, +4% Shiny Lendário) + 1.000 Ouro. NÃO garante a captura.
 * - Taxas Base (vêm de BalanceConfig.rewards.captureRates): Shiny Lendário 2% · Lendário 6%
 *   · Shiny Comum 10% · Normal Estágio 3 18% · Estágio 2 28% · Estágio 1 38%.
 *   Cap absoluto de 48% (48% comuns, 22% Shiny, 16% Lendário, 8% Shiny Lendário).
 */

const CaptureSystem = (() => {
  // Configuração da Gold Ball (Nv 41+, 10% de chance de proc, bônus dinâmico e +1000 ouro)
  // A Gold Ball NÃO garante a captura: ela concede um bônus de chance (menor para
  // alvos mais raros, respeitando o cap de 48%) e uma recompensa em ouro.
  const GOLD_BALL_CONFIG = {
    id: 'gold_ball',
    name: 'Gold Ball',
    chance: 0.10,
    isGuaranteed: false,   // A garantia foi removida para preservar o mérito da captura
    isGold: true,
    bonus: 0.14,      // +14% para Normais
    bonusRare: 0.08,  // +8% para Shinies / Lendários
    bonusApex: 0.04,  // +4% para Shiny Lendário
    minLevel: 41,
    maxLevel: Infinity,
    colorTop: '#ffd700',
    accent: '#ffaa00',
    label: '⭐ +14% CHANCE & OURO',
    goldReward: 1000,
    coinBonus: 1000,
    icon: '⭐'
  };

  // Tabela Dinâmica de Pokébolas escalonadas pelo nível da partida (Bônus Rebalanceados)
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
      bonus: 0.03, // +3%
      colorTop: '#2563eb',
      accent: '#ef4444',
      label: '+3% Chance',
      icon: '🔵'
    },
    ULTRABALL: {
      id: 'ultra_ball',
      name: 'Ultra Ball',
      minLevel: 21,
      maxLevel: 30,
      bonus: 0.06, // +6%
      colorTop: '#1e293b',
      accent: '#facc15',
      label: '+6% Chance',
      icon: '🟡'
    },
    ULTIMATEBALL: {
      id: 'ultimate_ball',
      name: 'Ultimate Ball',
      minLevel: 31,
      maxLevel: Infinity,
      bonus: 0.10, // +10%
      colorTop: '#7c3aed',
      accent: '#ec4899',
      label: '+10% Chance',
      icon: '🟣'
    },
    GOLDBALL: GOLD_BALL_CONFIG
  };

  // Estado e Instância Ativa da Bola no Mundo
  let activeBall = null;
  let activeData = null;

  // Cache de sprites pixel art das Pokébolas
  const ballCache = new Map();

  function resolveCaptureBall(level = 1, forceGold = false) {
    const lvl = Math.max(1, Math.floor(level || 1));
    // forceGold é um override explícito (admin/debug): ativa a Gold Ball em qualquer nível.
    if (forceGold) return GOLD_BALL_CONFIG;
    if (lvl >= 41 && Math.random() < 0.10) {
      return GOLD_BALL_CONFIG;
    }
    if (lvl >= 31) return POKEBALL_TIERS.ULTIMATEBALL;
    if (lvl >= 21) return POKEBALL_TIERS.ULTRABALL;
    if (lvl >= 11) return POKEBALL_TIERS.GREATBALL;
    return POKEBALL_TIERS.POKEBALL;
  }

  function getMonStage(monOrDex) {
    if (!monOrDex) return 1;
    if (typeof getPokemonEvolutionStage === 'function') return getPokemonEvolutionStage(monOrDex);
    if (typeof G === 'object' && typeof G.getPokemonEvolutionStage === 'function') return G.getPokemonEvolutionStage(monOrDex);
    if (typeof window !== 'undefined' && typeof window.getPokemonEvolutionStage === 'function') return window.getPokemonEvolutionStage(monOrDex);
    return 1;
  }

  function getBaseCatchRate(speciesId, isShiny = false, isLegendary = false, stage = 1) {
    const bCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
    const cr = (bCfg && bCfg.rewards && bCfg.rewards.captureRates) || {
      shinyLegendary: 0.02,
      legendary: 0.06,
      shinyCommon: 0.10,
      stage3: 0.18,
      stage2: 0.28,
      stage1: 0.38
    };

    const isLeg = !!(isLegendary || isLegendaryOrMythical(speciesId));
    
    // 1º Shiny Lendário (Apex)
    if (isShiny && isLeg) {
      return cr.shinyLegendary;
    }
    // 2º Lendário Normal
    if (isLeg) {
      return cr.legendary;
    }
    // 3º Shiny Comum
    if (isShiny) {
      return cr.shinyCommon;
    }
    // 4º a 6º Normais por estágio evolutivo:
    const stg = Number(stage) || (speciesId ? getMonStage(speciesId) : 1);
    if (stg === 3 || stg >= 3) return cr.stage3;
    if (stg === 2) return cr.stage2;
    return cr.stage1;
  }

  function isLegendaryOrMythical(speciesId) {
    if (!speciesId) return false;
    let mon = null;
    if (typeof speciesId === 'object' && speciesId.dex) {
      mon = speciesId;
    } else if (typeof speciesId === 'number') {
      if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[speciesId]) {
        mon = G.DEX_BY[speciesId];
      } else if (typeof POKEDEX !== 'undefined' && POKEDEX[speciesId]) {
        mon = POKEDEX[speciesId];
      } else if (typeof global !== 'undefined' && global.POKEDEX && global.POKEDEX[speciesId]) {
        mon = global.POKEDEX[speciesId];
      }
    } else if (typeof speciesId === 'string') {
      const s = speciesId.toLowerCase().trim();
      if (typeof G === 'object' && Array.isArray(G.DEX)) {
        mon = G.DEX.find(p => p.name && p.name.toLowerCase() === s);
      }
      if (!mon && typeof G === 'object' && G.DEX_BY) {
        mon = G.DEX_BY[parseInt(speciesId, 10)];
      }
      if (!mon && typeof POKEDEX !== 'undefined') {
        mon = POKEDEX[s] || POKEDEX[speciesId] || Object.values(POKEDEX).find(p => p.name && p.name.toLowerCase() === s);
      }
      if (!mon && typeof global !== 'undefined' && global.POKEDEX) {
        mon = global.POKEDEX[s] || global.POKEDEX[speciesId];
      }
    }
    if (!mon) return false;
    return !!(mon.leg || (mon.rarity && mon.rarity >= 5));
  }

  // ---------------- Gerador de Sprites Pixel Art da Pokébola ----------------
  function getPokeballSprite(variant = 'closed', ballTier = null) {
    const tier = ballTier || (activeBall && activeBall.ballTier) || POKEBALL_TIERS.POKEBALL;
    const cacheKey = `${tier.id}_${variant}`;
    if (ballCache.has(cacheKey)) return ballCache.get(cacheKey);

    if (typeof document === 'undefined' || !document.createElement) {
      return null;
    }

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

  /**
   * Constantes de Recompensa de Duplicata no Rift
   */
  const RIFT_DUPLICATE_COINS = 500;
  const RIFT_DUPLICATE_TICKETS = 500;

  /**
   * Resolução de Persistência no Save Permanente (Pokédex, Moedas & Tickets)
   */
  function resolveAttempt(data) {
    if (data.isShiny) {
      data.isSuccess = false;
      return data;
    }
    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && (window.db || window.DB)) ? (window.db || window.DB) : null);

    if (data.isSuccess && dbObj) {
      // 1. Identificar dex do Pokémon alvo
      let targetDex = null;
      if (data.mon && data.mon.dex != null) {
        targetDex = Number(data.mon.dex);
      } else if (data.speciesId) {
        if (typeof data.speciesId === 'number' || /^\d+$/.test(String(data.speciesId).trim())) {
          targetDex = Number(data.speciesId);
        } else if (typeof data.speciesId === 'string') {
          const rawId = data.speciesId.toLowerCase().trim();
          if (typeof G === 'object' && Array.isArray(G.DEX)) {
            const p = G.DEX.find(m => m.name.toLowerCase() === rawId);
            if (p) targetDex = Number(p.dex);
          }
          if (targetDex == null && typeof POKEDEX !== 'undefined' && POKEDEX[rawId]) {
            targetDex = Number(POKEDEX[rawId].dex);
          }
        }
      }

      // 2. CALCULAR RECOMPENSA DE CAÇADOR EM OURO (GOLD BOUNTY)
      // Shiny nunca chega aqui (não é capturável): a recompensa de Shiny é em Tickets.
      const stg = Number(data.stage) || (data.speciesId ? getMonStage(data.speciesId) : 1);
      const isLeg = !!(data.isLegendary || isLegendaryOrMythical(data.speciesId));

      let goldBounty;
      if (isLeg) {
        goldBounty = 8000;  // Lendário Normal: +8.000 Ouro
      } else {
        // Normal: +250 (Estágio 1) · +1.200 (Estágio 2) · +3.000 (Estágio 3)
        goldBounty = (stg === 3 || stg >= 3) ? 3000 : (stg === 2 ? 1200 : 250);
      }

      data.goldBounty = goldBounty;

      // Creditar Gold Bounty no saldo persistente
      if (dbObj.save) {
        dbObj.save.coins = (dbObj.save.coins || 0) + goldBounty;
        if (dbObj.save.stats) {
          dbObj.save.stats.coinsEarned = (dbObj.save.stats.coinsEarned || 0) + goldBounty;
        }
      }

      // Atualizar o ouro da partida atual em tempo real
      const pl = (typeof G === 'object' && G.Game && G.Game.player) || (typeof game !== 'undefined' && game && game.player) || null;
      if (pl) {
        pl.coins = (pl.coins || 0) + goldBounty;
      }

      // 3. Checar se o Pokémon já está registrado na Pokédex
      const isAlreadyCaptured = (targetDex != null && dbObj.save && dbObj.save.owned && !!dbObj.save.owned[targetDex]) ||
                                (typeof dbObj.isPokemonCaptured === 'function' && dbObj.isPokemonCaptured(targetDex != null ? targetDex : data.speciesId)) ||
                                (typeof dbObj.owns === 'function' && targetDex != null && dbObj.owns(targetDex));

      data.isDuplicate = !!isAlreadyCaptured;

      if (isAlreadyCaptured) {
        // RECOMPENSA ADICIONAL DE DUPLICATA ESCALONADA:
        const stage = data.stage || 1;
        const duplicateCoins = stage === 3 ? 1000 : (stage === 2 ? 750 : 500);
        const duplicateTickets = stage === 3 ? 1000 : (stage === 2 ? 750 : 500);
        data.rewardCoins = duplicateCoins;
        data.rewardTickets = duplicateTickets;

        if (dbObj.save) {
          dbObj.save.coins = (dbObj.save.coins || 0) + duplicateCoins;
          if (dbObj.save.stats) {
            dbObj.save.stats.coinsEarned = (dbObj.save.stats.coinsEarned || 0) + duplicateCoins;
          }
          dbObj.save.tickets = dbObj.save.tickets || { t1: 0, t10: 0 };
          dbObj.save.tickets.t1 = (dbObj.save.tickets.t1 || 0) + duplicateTickets;
        }

        if (pl) {
          pl.coins = (pl.coins || 0) + duplicateCoins;
          pl.t1 = (pl.t1 || 0) + duplicateTickets;
        }

        if (data.isShiny) {
          if (typeof dbObj.grantShiny === 'function' && targetDex != null) {
            dbObj.grantShiny(targetDex, 'rift');
          } else if (typeof dbObj.registerCaptured === 'function') {
            dbObj.registerCaptured(data.speciesId, true);
          }
        }

        if (typeof dbObj.commit === 'function') {
          dbObj.commit('rift_duplicate');
        }
      } else {
        // Pokémon Inédito: registra normalmente na Pokédex e desbloqueia o ancestral de Estágio 1
        if (typeof dbObj.registerCaptured === 'function') {
          dbObj.registerCaptured(data.speciesId, data.isShiny);
        } else if (typeof dbObj.unlockPokemon === 'function') {
          dbObj.unlockPokemon(data.speciesId, data.isShiny);
        }
      }

      // Se for Gold Ball, adiciona o bônus imediato de +1.000 moedas
      if (data.isGoldBall) {
        if (typeof dbObj.addGold === 'function') {
          dbObj.addGold(1000);
        } else if (dbObj.save) {
          dbObj.save.coins = (dbObj.save.coins || 0) + 1000;
          if (dbObj.commit) dbObj.commit('gold');
        }
        if (pl) {
          pl.coins = (pl.coins || 0) + 1000;
        }
      }

      if (typeof G === 'object' && G.UI && typeof G.UI.refreshCoins === 'function') {
        G.UI.refreshCoins();
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

    return data.isSuccess;
  }

  // =========================================================================
  // CLASSE WorldCaptureBall — Entidade Diegética no Chão do Canvas
  // =========================================================================
  class WorldCaptureBall {
    constructor(params = {}) {
      this.speciesId = params.speciesId || params.mon || 'pikachu';
      this.mon = params.mon || null;
      this.isShiny = !!params.isShiny;
      this.isLegendary = !!params.isLegendary;
      this.level = params.level !== undefined ? params.level : (params.playerLevel !== undefined ? params.playerLevel : 1);
      this.forceGold = !!params.forceGold;
      this.onComplete = params.onComplete || null;
      this.isDuplicate = false;

      // Resolução do Pokémon
      if (!this.mon && typeof G === 'object' && G.DEX_BY) {
        if (typeof this.speciesId === 'number') this.mon = G.DEX_BY[this.speciesId];
        else if (typeof this.speciesId === 'string' && G.DEX) {
          const lower = this.speciesId.toLowerCase().trim();
          this.mon = G.DEX.find(p => p.name && p.name.toLowerCase() === lower);
        }
      }
      if (this.mon) {
        this.speciesId = this.mon.name;
        if (this.mon.leg || (this.mon.rarity && this.mon.rarity >= 5)) this.isLegendary = true;
      }

      // Tiers de Bola
      this.ballTier = params.ballTier || resolveCaptureBall(this.level, this.forceGold);
      this.isGoldBall = !!(this.ballTier && this.ballTier.isGold);

      // Identificação e Estágio Evolutivo
      this.stage = params.stage || (this.mon ? getMonStage(this.mon.dex || this.mon.name) : 1);
      this.isShinyLegend = !!(this.isShiny && this.isLegendary);

      // Taxas Base (Pokémons Shiny não são capturáveis)
      if (this.isShiny) {
        this.baseRate = 0;
        this.finalChance = 0;
      } else {
        this.baseRate = getBaseCatchRate(this.speciesId, this.isShiny, this.isLegendary, this.stage);
      }

      // Bônus da Pokébola (Gold Ball dinâmica por raridade)
      let effectiveBallBonus = this.ballTier.bonus || 0;
      if (this.isGoldBall) {
        if (this.isShinyLegend) {
          effectiveBallBonus = this.ballTier.bonusApex || 0.04;
        } else if (this.isShiny || this.isLegendary) {
          effectiveBallBonus = this.ballTier.bonusRare || 0.08;
        } else {
          effectiveBallBonus = this.ballTier.bonus || 0.14;
        }
      }
      this.ballBonus = effectiveBallBonus;

      // TRAVA MÁXIMA RIGOROSA (CAP DE MÉRITO < 50%):
      // - Normais: MÁXIMO ABSOLUTO DE 0.48 (48% - NUNCA atinge ou passa de 50%!)
      // - Shiny Comum: máximo de 0.22 (22%)
      // - Lendário Normal: máximo de 0.16 (16%)
      // - Shiny Lendário: máximo de 0.08 (8%)
      let maxCap = 0.48;
      if (this.isShinyLegend) maxCap = 0.08;
      else if (this.isLegendary) maxCap = 0.16;
      else if (this.isShiny) maxCap = 0.22;

      // Shiny NÃO é capturável: a chance final precisa permanecer 0 mesmo
      // com bônus de bola (a soma base + bônus reescreveria o zero).
      this.finalChance = this.isShiny ? 0 : Math.min(maxCap, this.baseRate + this.ballBonus);

      // RNG da Captura
      this.roll = Math.random();
      this.isSuccess = (this.roll <= this.finalChance);

      // Coordenadas de origem e destino para o arremesso balístico
      this.targetX = params.x || 0;
      this.targetY = params.y || 0;
      this.fromX = params.fromX !== undefined ? params.fromX : this.targetX;
      this.fromY = params.fromY !== undefined ? params.fromY : this.targetY;

      const dist = Math.hypot(this.targetX - this.fromX, this.targetY - this.fromY);
      if (dist > 20) {
        // Arremesso balístico parabólico saindo do jogador até o guardião
        this.state = 'FLYING';
        this.flightDuration = Math.min(0.60, Math.max(0.35, dist / 550));
        this.x = this.fromX;
        this.y = this.fromY;
        this.ballZ = 20;
        if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('shoot');
      } else {
        // Queda vertical direta
        this.state = 'DROPPING';
        this.x = this.targetX;
        this.y = this.targetY;
        this.ballZ = 120;
      }

      // Física da Queda
      this.vz = 0;
      this.gravity = 980;
      this.bounces = 0;
      this.maxBounces = 2;

      // Rotação & Visual
      this.ballAngle = 0;
      this.variant = 'closed';

      this.stateTimer = 0;
      this.resolved = false;
      this.finished = false;

      console.log(`[WorldCaptureBall] Spawn em (${Math.round(this.targetX)}, ${Math.round(this.targetY)}) para ${this.speciesId} | Bola: ${this.ballTier.name} | Taxa: ${Math.round(this.finalChance * 100)}% | Sucesso: ${this.isSuccess}`);
    }

    update(dt) {
      if (this.finished) return;
      this.stateTimer += dt;

      switch (this.state) {
        case 'FLYING': {
          const t = Math.min(1, this.stateTimer / this.flightDuration);
          this.x = this.fromX + (this.targetX - this.fromX) * t;
          this.y = this.fromY + (this.targetY - this.fromY) * t;
          this.ballZ = Math.sin(t * Math.PI) * 90; // arco parabólico no ar
          this.ballAngle += dt * 18; // rotação no ar

          // Rastro cintilante de partículas coloridas da bola
          if (typeof G === 'object' && G.FX && G.FX.spark && Math.random() < 0.6) {
            G.FX.spark(this.x, this.y - this.ballZ, this.ballTier.colorTop || '#ef4444', 0, 0, 2);
          }

          if (t >= 1) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.ballZ = 0;
            this.state = 'BOUNCE';
            this.stateTimer = 0;
            this.vz = -320;
            if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('ball');
            if (typeof G === 'object' && G.FX) {
              if (G.FX.burst) G.FX.burst(this.x, this.y, '#ffffff', 20, 140);
              if (G.FX.ring) G.FX.ring(this.x, this.y, 8, 90, this.ballTier.colorTop || '#ef4444', 0.5, 4);
              if (G.FX.dmgText) G.FX.dmgText(this.x, this.y - 36, this.ballTier.name.toUpperCase() + '!', this.ballTier.colorTop || '#ef4444', true);
            }
          }
          break;
        }

        case 'DROPPING': {
          this.vz += this.gravity * dt;
          this.ballZ -= this.vz * dt;
          if (this.ballZ <= 0) {
            this.ballZ = 0;
            this.bounces++;
            if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('ball');
            if (typeof G === 'object' && G.FX && G.FX.burst) G.FX.burst(this.x, this.y, '#e2e8f0', 8, 45);

            if (this.bounces <= this.maxBounces) {
              this.vz = -this.vz * 0.42;
              this.state = 'BOUNCE';
              this.stateTimer = 0;
            } else {
              this.vz = 0;
              this.ballZ = 0;
              this.state = 'PAUSE_1';
              this.stateTimer = 0;
            }
          }
          break;
        }

        case 'BOUNCE': {
          this.vz += this.gravity * dt;
          this.ballZ -= this.vz * dt;
          if (this.ballZ <= 0) {
            this.ballZ = 0;
            this.bounces++;
            if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('ball');
            if (this.bounces <= this.maxBounces) {
              this.vz = -this.vz * 0.40;
            } else {
              this.vz = 0;
              this.ballZ = 0;
              this.state = 'PAUSE_1';
              this.stateTimer = 0;
            }
          }
          break;
        }

        case 'PAUSE_1': {
          this.ballAngle = 0;
          if (this.stateTimer >= 0.4) {
            this.state = 'SHAKE_1';
            this.stateTimer = 0;
            if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('shake');
            if (typeof G === 'object' && G.FX && G.FX.dmgText) G.FX.dmgText(this.x, this.y - 28, '⚡ 1...', '#facc15', true);
            if (typeof G === 'object' && G.FX && G.FX.spark) G.FX.spark(this.x, this.y, '#facc15', 0, -1, 4);
          }
          break;
        }

        case 'SHAKE_1': {
          // Balanço 1: para a esquerda até -28° e retorna
          const dur = 0.4;
          const progress = Math.min(1, this.stateTimer / dur);
          this.ballAngle = -Math.sin(progress * Math.PI) * (28 * Math.PI / 180);
          if (this.stateTimer >= dur) {
            this.ballAngle = 0;
            this.state = 'PAUSE_2';
            this.stateTimer = 0;
          }
          break;
        }

        case 'PAUSE_2': {
          this.ballAngle = 0;
          if (this.stateTimer >= 0.35) {
            this.state = 'SHAKE_2';
            this.stateTimer = 0;
            if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('shake');
            if (typeof G === 'object' && G.FX && G.FX.dmgText) G.FX.dmgText(this.x, this.y - 28, '⚡ 2...', '#facc15', true);
            if (typeof G === 'object' && G.FX && G.FX.spark) G.FX.spark(this.x, this.y, '#facc15', 0, -1, 4);
          }
          break;
        }

        case 'SHAKE_2': {
          // Balanço 2: para a direita até +28° e retorna
          const dur = 0.4;
          const progress = Math.min(1, this.stateTimer / dur);
          this.ballAngle = Math.sin(progress * Math.PI) * (28 * Math.PI / 180);
          if (this.stateTimer >= dur) {
            this.ballAngle = 0;
            this.state = 'PAUSE_3';
            this.stateTimer = 0;
          }
          break;
        }

        case 'PAUSE_3': {
          this.ballAngle = 0;
          if (this.stateTimer >= 0.35) {
            this.state = 'SHAKE_3';
            this.stateTimer = 0;
            if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('shake');
            if (typeof G === 'object' && G.FX && G.FX.dmgText) G.FX.dmgText(this.x, this.y - 28, '⚡ 3...', '#facc15', true);
            if (typeof G === 'object' && G.FX && G.FX.spark) G.FX.spark(this.x, this.y, '#facc15', 0, -1, 4);
          }
          break;
        }

        case 'SHAKE_3': {
          // Balanço 3: para a esquerda até -28° e retorna
          const dur = 0.4;
          const progress = Math.min(1, this.stateTimer / dur);
          this.ballAngle = -Math.sin(progress * Math.PI) * (28 * Math.PI / 180);
          if (this.stateTimer >= dur) {
            this.ballAngle = 0;
            this.state = 'RESOLVE';
            this.stateTimer = 0;
          }
          break;
        }

        case 'RESOLVE': {
          if (!this.resolved) {
            this.resolved = true;
            resolveAttempt(this);
            const monName = (this.mon ? this.mon.name : this.speciesId).toUpperCase();

            if (this.isSuccess) {
              // SUCESSO: Trava ao centro, luz estelar dourada, SFX de clique e fanfare
              this.variant = 'locked';
              this.ballAngle = 0;
              if (typeof G === 'object' && G.Audio && G.Audio.sfx) {
                G.Audio.sfx('click');
                G.Audio.sfx('shinyGet');
              }
              if (typeof G === 'object' && G.FX) {
                if (G.FX.burst) G.FX.burst(this.x, this.y, '#facc15', 36, 160);
                if (G.FX.burst) G.FX.burst(this.x, this.y, '#ffffff', 24, 110);
                if (G.FX.ring) G.FX.ring(this.x, this.y, 8, 140, '#ffd700', 0.8, 6);
                if (G.FX.twinkle) {
                  for (let k = 0; k < 8; k++) {
                    G.FX.twinkle(this.x + (Math.random() * 50 - 25), this.y + (Math.random() * 50 - 25));
                  }
                }
                if (G.FX.dmgText) {
                  const bountyStr = `💰 +${(this.goldBounty || 250).toLocaleString('pt-BR')} OURO!`;
                  if (this.isDuplicate) {
                    const c = this.rewardCoins || 500;
                    const tk = this.rewardTickets || 500;
                    G.FX.dmgText(this.x, this.y - 50, `✨ ${monName} REPETIDO! ✨`, '#ffd23f', true);
                    G.FX.dmgText(this.x, this.y - 28, bountyStr, '#4ade80', true);
                    G.FX.dmgText(this.x, this.y - 6, `+${c} BÔNUS · +${tk} TICKETS!`, '#38bdf8', true);
                  } else {
                    G.FX.dmgText(this.x, this.y - 44, `✨ ${monName} CAPTURADO! ✨`, '#4ade80', true);
                    G.FX.dmgText(this.x, this.y - 20, bountyStr, '#ffd23f', true);
                  }
                }
              }
              if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
                const bountyStr = `+${(this.goldBounty || 250).toLocaleString('pt-BR')} PokéMoedas`;
                if (this.isDuplicate) {
                  const c = this.rewardCoins || 500;
                  const tk = this.rewardTickets || 500;
                  G.Spawner.say(`🎉 ${monName} repetido! Recompensa de Caçador: ${bountyStr} (+${c} bônus e +${tk} Tickets)!`, 4.5, true);
                } else {
                  G.Spawner.say(`🎉 ${monName} capturado! Recompensa de Caçador: ${bountyStr}!`, 4.0, true);
                }
              }
            } else {
              // FALHA: Abre a Pokébola, fumaça cinza expansiva e SFX de break
              this.variant = 'open';
              this.ballAngle = 0;
              if (typeof G === 'object' && G.Audio && G.Audio.sfx) {
                G.Audio.sfx('break');
              }
              if (typeof G === 'object' && G.FX) {
                if (G.FX.burst) G.FX.burst(this.x, this.y, '#94a3b8', 26, 120);
                if (G.FX.burst) G.FX.burst(this.x, this.y, '#ef4444', 16, 85);
                if (G.FX.dmgText) {
                  G.FX.dmgText(this.x, this.y - 32, '💨 O POKÉMON ESCAPOU!', '#f87171', true);
                }
              }
              if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
                G.Spawner.say(`💨 ${monName} escapou da Pokébola!`, 3.0, true);
              }
              const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : null);
              if (dbObj && typeof dbObj.incrementRiftsCleared === 'function') {
                dbObj.incrementRiftsCleared();
              }
            }
          }

          if (this.stateTimer >= 1.4) {
            this.state = 'DONE';
            this.finished = true;
            if (typeof this.onComplete === 'function') {
              this.onComplete(this.isSuccess, this.isDuplicate);
            }
          }
          break;
        }
      }
    }

    draw(ctx) {
      if (this.finished) return;

      ctx.save();

      // 1. Sombra circular realista no chão
      const shadowScale = Math.max(0.2, 1 - (this.ballZ / 150));
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 4, 14 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Aura mágica pulsante no solo embaixo da Pokébola
      if (this.state !== 'FLYING') {
        ctx.save();
        const auraPulse = 1 + Math.sin(Date.now() / 220) * 0.15;
        const ballColor = this.ballTier.colorTop || '#ef4444';
        const aura = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, 36 * auraPulse);
        aura.addColorStop(0, ballColor + 'aa');
        aura.addColorStop(0.5, ballColor + '33');
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 36 * auraPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Sprite da Pokébola em escala 1.5x para visibilidade máxima
      const spr = getPokeballSprite(this.variant, this.ballTier);
      if (spr) {
        const renderY = this.y - this.ballZ;
        ctx.save();
        ctx.translate(this.x, renderY);
        ctx.scale(1.5, 1.5);
        if (this.ballAngle !== 0) {
          ctx.rotate(this.ballAngle);
        }
        ctx.drawImage(spr, -spr.width / 2, -spr.height + 4);

        // Estrelas cintilantes se for Gold Ball ou Shiny
        if (this.isGoldBall && Math.random() < 0.35) {
          drawPixelStar(ctx, (Math.random() - 0.5) * 36, -spr.height / 2 + (Math.random() - 0.5) * 24, 6, '#ffd700');
        } else if (this.isShiny && Math.random() < 0.30) {
          drawPixelStar(ctx, (Math.random() - 0.5) * 32, -spr.height / 2 + (Math.random() - 0.5) * 20, 5, '#ffffff');
        }

        ctx.restore();
      }

      ctx.restore();
    }
  }

  /**
   * Gatilho de Captura Diegética no Mapa:
   * Instancia uma WorldCaptureBall no chão sem abrir modal HTML e sem pausar o jogo.
   */
  function startCaptureSequence(params = {}) {
    // Garante que o jogo permaneça ativo e despausado
    if (typeof G === 'object' && G.Game) G.Game.isPaused = false;
    if (typeof game !== 'undefined') game.isPaused = false;

    // Garante que o modal HTML permaneça oculto
    const modalEl = (typeof document !== 'undefined') ? (document.getElementById('capture-modal') || document.getElementById('capture-overlay')) : null;
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
    }

    // Regra Hardcore: Pokémons Shiny NÃO são capturáveis! Ao derrotá-los, entrega 5.000 Tickets de Roleta!
    if (params.isShiny) {
      if (params.boss && params.boss._shinyRewarded) {
        if (typeof params.onComplete === 'function') {
          params.onComplete(false, false);
        }
        return null;
      }
      if (params.boss) params.boss._shinyRewarded = true;

      const pl = (typeof G === 'object' && G.Game && G.Game.player) || (typeof game !== 'undefined' && game && game.player) || null;
      let banked = false;
      if (pl) {
        pl.t1 = (pl.t1 || 0) + 5000;
        if (typeof G === 'object' && G.Game && typeof G.Game.bankTickets === 'function') {
          G.Game.bankTickets(true);
          banked = true;
        }
      }
      if (typeof G === 'object' && G.DB && G.DB.save) {
        G.DB.save.tickets = G.DB.save.tickets || { t1: 0, t10: 0 };
        if (!banked) {
          G.DB.save.tickets.t1 = (G.DB.save.tickets.t1 || 0) + 5000;
        }
        if (G.DB.save.stats) G.DB.save.stats.shiniesDefeated = (G.DB.save.stats.shiniesDefeated || 0) + 1;
        if (G.DB.commit) G.DB.commit(true);
      }
      const monName = (params.mon && params.mon.name) || params.speciesId || 'Pokémon';
      if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
        G.Spawner.say(`✨ ${monName.toUpperCase()} BRILHANTE DERROTADO! +5.000 TICKETS DE ROLETA!`, 4.5, true);
      }
      if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') {
        G.Audio.sfx('shinyGet');
      }
      if (typeof params.onComplete === 'function') {
        params.onComplete(false, false);
      }
      return null;
    }

    // Determina coordenadas seguras
    if (params.x === undefined || params.y === undefined) {
      if (params.boss && typeof params.boss.x === 'number') {
        params.x = params.boss.x;
        params.y = params.boss.y;
      } else if (typeof G === 'object' && G.Game && G.Game.player) {
        params.x = G.Game.player.x + 30;
        params.y = G.Game.player.y;
      } else {
        params.x = 0;
        params.y = 0;
      }
    }

    activeBall = new WorldCaptureBall(params);
    activeData = activeBall;

    return activeBall;
  }

  function spawnWorldBall(params = {}) {
    return startCaptureSequence(params);
  }

  function update(dt) {
    if (activeBall) {
      activeBall.update(dt);
      if (activeBall.finished) {
        activeBall = null;
      }
    }
  }

  function drawable() {
    return (activeBall && !activeBall.finished) ? activeBall : null;
  }

  function init() {
    const modalEl = (typeof document !== 'undefined') ? document.getElementById('capture-modal') : null;
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
    }
  }

  function drawScreen(ctx, w, h) {
    if (!activeBall || activeBall.finished) return;
    const b = activeBall;
    const monName = (b.mon ? b.mon.name : b.speciesId).toUpperCase();
    const tierName = b.ballTier.name;
    const chancePct = Math.round(b.finalChance * 100);

    ctx.save();
    // Card centralizado no topo com cantos arredondados
    const cardW = 360, cardH = 50;
    const cardX = (w - cardW) / 2, cardY = 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeStyle = b.ballTier.colorTop || '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.fill();
    ctx.stroke();

    // Texto de cabeçalho da Pokébola e monstro
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px monospace, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${b.ballTier.icon || '🔴'} ${tierName} · ${monName} (${chancePct}%)`, w / 2, cardY + 16);

    // Texto dinâmico de status
    let statusText = 'Lançando...';
    let statusColor = '#facc15';
    if (b.state === 'FLYING' || b.state === 'DROPPING') {
      statusText = 'Arremessando Pokébola no Guardião...';
      statusColor = '#93c5fd';
    } else if (b.state === 'BOUNCE' || b.state === 'PAUSE_1') {
      statusText = '⚡ Contendo Pokémon...';
      statusColor = '#facc15';
    } else if (b.state === 'SHAKE_1') {
      statusText = '⚡ Balanço 1/3...';
      statusColor = '#fbbf24';
    } else if (b.state === 'SHAKE_2') {
      statusText = '⚡⚡ Balanço 2/3...';
      statusColor = '#f59e0b';
    } else if (b.state === 'SHAKE_3') {
      statusText = '⚡⚡⚡ Balanço 3/3...';
      statusColor = '#ea580c';
    } else if (b.state === 'RESOLVE' || b.state === 'DONE') {
      if (b.isSuccess) {
        const c = b.rewardCoins || 500;
        const tk = b.rewardTickets || 500;
        statusText = b.isDuplicate ? `✨ REPETIDO! +${c} MOEDAS · +${tk} TICKETS! ✨` : '✨ POKÉMON CAPTURADO COM SUCESSO! ✨';
        statusColor = b.isDuplicate ? '#ffd23f' : '#4ade80';
      } else {
        statusText = '💨 O POKÉMON ESCAPOU!';
        statusColor = '#f87171';
      }
    }

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 12px monospace, sans-serif';
    ctx.fillText(statusText, w / 2, cardY + 34);

    ctx.restore();
  }

  function renderModal(data) {
    console.log('[CaptureSystem] Modal desativado em prol da captura diegética no mapa.');
  }

  const exportObj = {
    startCaptureSequence,
    spawnWorldBall,
    resolveAttempt,
    renderModal,
    resolveCaptureBall,
    getBaseCatchRate,
    isLegendaryOrMythical,
    getBallForPlayerLevel: (lvl, forceGold) => resolveCaptureBall(lvl, forceGold),
    init,
    update,
    drawable,
    drawScreen,
    draw: (ctx, w, h) => drawScreen(ctx, w, h),
    POKEBALL_TIERS,
    GOLD_BALL_CONFIG,
    WorldCaptureBall,
    RIFT_DUPLICATE_COINS,
    RIFT_DUPLICATE_TICKETS,
    get isCapturing() { return !!activeBall && !activeBall.finished; },
    getCameraTarget: () => null,
    get state() { return activeBall ? activeBall.state : 'idle'; },
    get activeData() { return activeBall || activeData; }
  };

  return exportObj;
})();

// Exportações Globais
if (typeof window !== 'undefined') {
  window.CaptureSystem = CaptureSystem;
  window.captureSystem = CaptureSystem;
  window.POKEBALL_TIERS = CaptureSystem.POKEBALL_TIERS;
  window.GOLD_BALL_CONFIG = CaptureSystem.GOLD_BALL_CONFIG;
  window.RIFT_DUPLICATE_COINS = CaptureSystem.RIFT_DUPLICATE_COINS;
  window.RIFT_DUPLICATE_TICKETS = CaptureSystem.RIFT_DUPLICATE_TICKETS;
  window.resolveCaptureBall = CaptureSystem.resolveCaptureBall;
  window.getBaseCatchRate = CaptureSystem.getBaseCatchRate;
  window.getBallForPlayerLevel = CaptureSystem.getBallForPlayerLevel;
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
  global.POKEBALL_TIERS = CaptureSystem.POKEBALL_TIERS;
  global.GOLD_BALL_CONFIG = CaptureSystem.GOLD_BALL_CONFIG;
  global.RIFT_DUPLICATE_COINS = CaptureSystem.RIFT_DUPLICATE_COINS;
  global.RIFT_DUPLICATE_TICKETS = CaptureSystem.RIFT_DUPLICATE_TICKETS;
  global.resolveCaptureBall = CaptureSystem.resolveCaptureBall;
  global.getBaseCatchRate = CaptureSystem.getBaseCatchRate;
  global.getBallForPlayerLevel = CaptureSystem.getBallForPlayerLevel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaptureSystem;
}
