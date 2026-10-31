/* ============ rift.js — grietas y arena del legendario ============
 *
 * De vez en cuando (pocas veces por partida) se abre una GRIETA cerca de un
 * jugador. Dura GRIETA_TTL segundos; si entras, te lleva (con todo el grupo)
 * a una arena cerrada en el Mundo Distorsión, contra un Pokémon LEGENDARIO.
 *
 *   ganas    el legendario suelta tickets (el ×10, la mitad de las veces) y monedas, y cada uno se lleva un
 *            VÍNCULO (fusiona movimientos, ver Player.fuse); a los pocos
 *            segundos volvéis al mapa donde estabais y se elige la fusión
 *   pierdes  (caéis todos o se acaba el tiempo) volvéis sin premio, con algo
 *            de vida; la partida sigue
 *
 * Mientras dura la arena, los enemigos del mapa se guardan (EnemyMgr.stash) y
 * no aparecen nuevos; al volver todo sigue como estaba.
 *
 * Cooperativo: lo decide el anfitrión. Mensajes (ver coop.js):
 *   'rift' x y ttl · 'riftx' · 'arena' cfg · 'aw' (ganada) · 'al' (perdida)
 *   y del invitado al anfitrión 're' (he entrado en la grieta).
 */
G.Rift = (() => {
  // (0.14 hasta el 11-10-2026: más grietas para que se vean los vínculos)
  // Menos azar (12-10-2026): cada vez que no sale, la siguiente es más
  // probable (20 %, 40 %, 60 %, 80 %, 100 %): como mucho 2,5 min sin grieta.
  // Desde 2 min antes de la Sentencia de Arceus (minuto 30) ya no se abren.
  const CHECK = 30, CHANCE = 0.2, TTL = 45;
  const ARENA_R = 11, ARENA_TIME = 120, FROM = 75;

  // Escalonamento Dinâmico por Nível do Jogador (começa no Nv 10, sobe no 20, 30, ..., até 100)
  const RIFT_TIERS = [
    { tier: 0, minLvl: 1,   name: 'Iniciação',        hpMul: 1.0,  dmgMul: 1.0,  spdBonus: 0,  shotCdMul: 1.0,  minions: 0 },
    { tier: 1, minLvl: 10,  name: 'Grau I (Nv. 10)',   hpMul: 1.45, dmgMul: 1.30, spdBonus: 5,  shotCdMul: 0.95, minions: 0 },
    { tier: 2, minLvl: 20,  name: 'Grau II (Nv. 20)',  hpMul: 2.10, dmgMul: 1.70, spdBonus: 10, shotCdMul: 0.90, minions: 2 },
    { tier: 3, minLvl: 30,  name: 'Grau III (Nv. 30)', hpMul: 2.90, dmgMul: 2.15, spdBonus: 14, shotCdMul: 0.85, minions: 3 },
    { tier: 4, minLvl: 40,  name: 'Grau IV (Nv. 40)',  hpMul: 3.90, dmgMul: 2.70, spdBonus: 18, shotCdMul: 0.80, minions: 3 },
    { tier: 5, minLvl: 50,  name: 'Grau V (Nv. 50)',   hpMul: 5.10, dmgMul: 3.35, spdBonus: 22, shotCdMul: 0.75, minions: 4 },
    { tier: 6, minLvl: 60,  name: 'Grau VI (Nv. 60)',  hpMul: 6.50, dmgMul: 4.10, spdBonus: 26, shotCdMul: 0.70, minions: 4 },
    { tier: 7, minLvl: 70,  name: 'Grau VII (Nv. 70)', hpMul: 8.10, dmgMul: 4.95, spdBonus: 30, shotCdMul: 0.65, minions: 5 },
    { tier: 8, minLvl: 80,  name: 'Grau VIII (Nv. 80)',hpMul: 10.0, dmgMul: 5.90, spdBonus: 34, shotCdMul: 0.60, minions: 5 },
    { tier: 9, minLvl: 90,  name: 'Grau IX (Nv. 90)',  hpMul: 12.2, dmgMul: 7.00, spdBonus: 38, shotCdMul: 0.55, minions: 6 },
    { tier: 10, minLvl: 100, name: 'Grau X Apex (Nv. 100+)', hpMul: 15.0, dmgMul: 8.50, spdBonus: 44, shotCdMul: 0.50, minions: 7 }
  ];

  function getRiftTierData(playerLevel) {
    const lvl = Math.max(1, Number(playerLevel) || 1);
    if (lvl < 10) return RIFT_TIERS[0];
    const tierIdx = Math.min(10, Math.floor(lvl / 10));
    return RIFT_TIERS[tierIdx] || RIFT_TIERS[10];
  }

  function spawnRiftMinions(count, tierData) {
    if (!arena || arena.phase !== 'fight') return;
    const ts = TS();
    const pl = (G.Game && G.Game.player) ? G.Game.player : { x: arena.x, y: arena.y, level: 1 };
    const pLvl = (arena && arena.playerLevel) || pl.level || 1;
    const regKey = (G.Game && G.Game.currentRegion) || 'kanto';
    const getRegionCfg = G.getRegionConfig || (() => ({ dexRange: [1, 151] }));
    const reg = getRegionCfg(regKey);
    const minDex = reg.dexRange ? reg.dexRange[0] : 1;
    const maxDex = reg.dexRange ? reg.dexRange[1] : 151;

    for (let i = 0; i < count; i++) {
      const angle = (i / Math.max(1, count)) * Math.PI * 2 + Math.random() * 0.6;
      const dist = G.U.rand(120, (arena.r - 2.8) * ts);
      const mx = arena.x + Math.cos(angle) * dist;
      const my = arena.y + Math.sin(angle) * dist;

      const randomDex = G.U.randInt(minDex, maxDex);
      const monBase = (G.DEX_BY && G.DEX_BY[randomDex]) || { name: 'Sombra', spd: 80 };

      const minionDef = {
        dex: randomDex,
        name: 'Sombra de ' + (monBase.name || 'Fenda'),
        hp: Math.round((350 + pLvl * 45) * (tierData ? tierData.hpMul * 0.35 : 1)),
        spd: Math.round(G.U.clamp(52 + (tierData ? tierData.spdBonus * 0.4 : 0), 50, 95)),
        dmg: Math.round((16 + pLvl * 1.8) * (tierData ? tierData.dmgMul * 0.4 : 1)),
        xp: Math.round(80 + pLvl * 6),
        behavior: 'charger'
      };

      const minion = new G.Enemy(minionDef, mx, my, { hp: 1, spd: 1, dmg: 1 });
      minion.isRiftMinion = true;
      minion.legend = false;
      minion.boss = false;
      minion.flying = false;
      if (G.EnemyMgr) G.EnemyMgr.add(minion);
      if (G.FX && G.FX.burst) G.FX.burst(mx, my, '#a855f7', 10, 50);
    }
  }
  let rift = null;          // { x, y, ttl, t }
  let arena = null;         // { tx, ty, r, dex, shiny, x, y, back, biome
  let riftsCompleted = 0;   // Contador de Fendas concluídas na partida, t, phase, endT, bossId }
  let checkT = CHECK, asked = false, downT = 0, misses = 0;
  const authority = () => !G.Coop.active || G.Coop.isHost;
  const TS = () => G.Tiles.T * G.Sprites.PX;

  function reset() { rift = null; arena = null; checkT = CHECK; asked = false; downT = 0; misses = 0; riftsCompleted = 0; }

  // ---------------- grieta en el mapa ----------------

  function update(dt, pl, time) {
    if (rift) {
      rift.t += dt;
      rift.ttl -= dt;
      if (rift.ttl <= 0) { rift = null; return; }
      if (!arena && !pl.dead && G.U.dist2(pl.x, pl.y, rift.x, rift.y - 10) < 30 * 30) enter();
    } else if (!arena && authority() && time > FROM) {
      checkT -= dt;
      if (checkT <= 0) {
        checkT = CHECK;
        if (G.EnemyMgr.bossAlive()) return;           // con un jefe vivo no cuenta como intento
        if (Math.random() < CHANCE * (1 + misses)) { misses = 0; open(); }
        else misses++;
      }
    }
    if (arena) arenaTick(dt, pl);
  }

  function open() {
    const alive = G.Game.everyone().filter(p => !p.dead);
    const near = G.U.pick(alive.length ? alive : [G.Game.player]);
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * 6.2832, d = G.U.rand(380, 560);
      const x = near.x + Math.cos(a) * d, y = near.y + Math.sin(a) * d * 0.85;
      if (!G.World.isFree(x, y, 22)) continue;
      show(x, y, TTL);
      if (G.Coop.isHost) G.Coop.broadcast(['rift', Math.round(x), Math.round(y), TTL]);
      return;
    }
  }

  /** Aparece la grieta (también la que manda el anfitrión). */
  function show(x, y, ttl) {
    rift = { x, y, ttl, t: 0 };
    asked = false;
    // (El aviso grande lo dibuja hud.js mientras rift.t < 4,5 s.)
    G.Audio.sfx('rift');
    G.FX.ring(x, y, 6, 80, '#b48aff', 0.7, 5);
  }

  function enter() {
    if (asked) return;
    asked = true;
    if (authority()) start();
    else G.Coop.toHost(['re']);
  }

  // ---------------- arena ----------------

  function isLegendaryOrMythical(species) {
    if (!species) return false;
    let mon = null;
    if (typeof species === 'object' && species.dex) {
      mon = species;
    } else if (typeof species === 'number') {
      mon = (typeof G === 'object' && G.DEX_BY && G.DEX_BY[species])
        || (typeof POKEDEX !== 'undefined' && POKEDEX[species]);
    } else if (typeof species === 'string') {
      const s = species.toLowerCase().trim();
      if (typeof G === 'object' && G.DEX && Array.isArray(G.DEX)) {
        mon = G.DEX.find(p => p.name && p.name.toLowerCase() === s);
      }
      if (!mon && typeof G === 'object' && G.DEX_BY) {
        mon = G.DEX_BY[parseInt(species, 10)];
      }
      if (!mon && typeof POKEDEX !== 'undefined') {
        mon = Object.values(POKEDEX).find(p => p.name && p.name.toLowerCase() === s);
      }
    }
    if (!mon) return false;
    return !!(mon.leg || (mon.rarity && mon.rarity >= 5));
  }

  function getMonStage(monOrDex) {
    if (!monOrDex) return 1;
    if (typeof getPokemonEvolutionStage === 'function') {
      return getPokemonEvolutionStage(monOrDex);
    }
    if (typeof G === 'object' && typeof G.getPokemonEvolutionStage === 'function') {
      return G.getPokemonEvolutionStage(monOrDex);
    }
    if (typeof window !== 'undefined' && typeof window.getPokemonEvolutionStage === 'function') {
      return window.getPokemonEvolutionStage(monOrDex);
    }
    return 1;
  }

  /**
   * Sorteio do Pokémon Guardião do Rift com Deduplicação, Balanceamento e Regra Estrita de Estágios:
   * 1. Regra de Nível do Treinador:
   *    - Até Lv. 20: Apenas Pokémon Estágio 1 (Base / Baby / Inicial).
   *    - Lv. 21 até 41: Apenas Pokémon Estágio 2 (Primeira evolução / intermediário).
   *    - Lv. 42+: Apenas Pokémon Estágio 3 (Segunda evolução / forma final).
    * 2. Rolagem de Raridade de 1 a 100 (taxas calibradas):
    *    - roll <= 94.0 (94.0%): Pokémon Comum/Regional Normal.
    *    - roll > 94.0 && roll <= 97.8 (3.8%): Pokémon Lendário Normal (Se rifts < 30, rebaixa para Comum Normal).
    *    - roll > 97.8 && roll <= 99.8 (2.0%): Pokémon Comum/Regional Shiny.
    *    - roll > 99.8 (0.2%): Pokémon Lendário Shiny (Se rifts < 30, rebaixa para Comum Shiny).
    * 3. Pity dos 500 Rifts: Múltiplo de 500 (total > 0 && total % 500 === 0) garante variante Shiny.
    * 4. Deduplicação Pokedex: Prioriza espécies ainda NÃO capturadas no estágio alvo.
    */
  function selectRiftGuardian(forceType, forceLevel) {
    if (typeof forceType === 'number' && forceLevel === undefined) {
      forceLevel = forceType;
      forceType = null;
    }
    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : null);
    let riftsCleared = 0;
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('poke_total_rifts');
      if (stored != null && stored !== '') riftsCleared = Number(stored) || 0;
    }
    if (!riftsCleared && dbObj) {
      if (typeof dbObj.getRiftsCleared === 'function') riftsCleared = dbObj.getRiftsCleared();
      else if (typeof dbObj.getTotalRiftsCleared === 'function') riftsCleared = dbObj.getTotalRiftsCleared();
    }

    // Identificar Nível do Jogador e Regra Oficial de Estágios:
    let playerLevel = 1;
    if (forceLevel !== undefined && forceLevel !== null) {
      playerLevel = Number(forceLevel);
    } else if (typeof G === 'object' && G.Game && G.Game.player && typeof G.Game.player.level === 'number') {
      playerLevel = G.Game.player.level;
    } else if (typeof window !== 'undefined' && window.game && window.game.player && typeof window.game.player.level === 'number') {
      playerLevel = window.game.player.level;
    }

    let targetStage = 1;
    const stageCfg = (() => {
      const c = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : (typeof G === 'object' ? G.BalanceConfig : null));
      return (c && c.rewards && c.rewards.rift && c.rewards.rift.stageByLevel) || {};
    })();
    const stage3Min = stageCfg.stage3MinLevel != null ? stageCfg.stage3MinLevel : 42;
    const stage2Min = stageCfg.stage2MaxLevel != null ? stageCfg.stage2MaxLevel + 1 : 21;
    if (playerLevel >= stage3Min) {
      targetStage = 3;
    } else if (playerLevel >= stage2Min) {
      targetStage = 2;
    } else {
      targetStage = 1;
    }

    // Identificar a Região Ativa
    const regionKey = (typeof G === 'object' && G.Game && G.Game.currentRegion)
      ? G.Game.currentRegion
      : ((typeof window !== 'undefined' && window.game && window.game.currentRegion)
          ? window.game.currentRegion
          : ((typeof localStorage !== 'undefined' && localStorage.getItem('ps_current_region')) || 'kanto'));

    const getRegionCfg = (typeof G === 'object' && typeof G.getRegionConfig === 'function')
      ? G.getRegionConfig
      : (typeof getRegionConfig === 'function' ? getRegionConfig : () => ({ dexRange: [1, 151], legendaries: [] }));
    const regionCfg = getRegionCfg(regionKey);

    // Pool de Pokémon da Pokédex pertencentes à Região
    let basePool = (typeof G === 'object' && G.DEX) ? G.DEX.slice() : [];
    if (typeof G === 'object' && G.SPRITE_META && basePool.length) {
      const withSprites = basePool.filter(p => G.SPRITE_META[p.dex]);
      if (withSprites.length) basePool = withSprites;
    }
    if (!basePool.length && typeof POKEDEX !== 'undefined') {
      basePool = Array.isArray(POKEDEX) ? POKEDEX.slice() : Object.values(POKEDEX);
    }

    let regionPool = basePool.filter(p => p.dex >= regionCfg.dexRange[0] && p.dex <= regionCfg.dexRange[1]);
    if (!regionPool.length) regionPool = basePool.filter(p => p.dex <= 151); // Fallback Kanto

    if (forceType && regionPool.some(p => p.types && p.types.includes(forceType))) {
      regionPool = regionPool.filter(p => p.types && p.types.includes(forceType));
    }

    // Consulta aos conjuntos de Pokémon e Shinies já capturados
    const rawCaptured = (dbObj && typeof dbObj.getCapturedPokemon === 'function') ? dbObj.getCapturedPokemon() : [];
    const rawShinies = (dbObj && typeof dbObj.getCapturedShinies === 'function') ? dbObj.getCapturedShinies() : [];
    const capturedSet = new Set(rawCaptured.map(x => String(x).toLowerCase().trim()));
    const shinySet = new Set(rawShinies.map(x => String(x).toLowerCase().trim()));

    // Separação entre Comuns e Lendários
    const isRegionalLeg = p => isLegendaryOrMythical(p) || (regionCfg.legendaries && regionCfg.legendaries.includes(p.name.toLowerCase()));
    const commonPool = regionPool.filter(p => !isRegionalLeg(p));
    let legendPool = regionPool.filter(p => isRegionalLeg(p));
    if (!legendPool.length) {
      legendPool = basePool.filter(isRegionalLeg);
    }

    // Rolagem Exata de Raridade (1 a 100) — faixas vêm de BalanceConfig.rewards.rift.rarity
    const roll = Math.random() * 100;
    let targetTier = 'common_normal';

    const riftCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : (typeof G === 'object' ? G.BalanceConfig : null));
    const rarityCfg = (riftCfg && riftCfg.rewards && riftCfg.rewards.rift && riftCfg.rewards.rift.rarity) || {};
    const commonNormalMax = rarityCfg.commonNormalMax != null ? rarityCfg.commonNormalMax : 94.0;
    const legendNormalMax = rarityCfg.legendNormalMax != null ? rarityCfg.legendNormalMax : 97.8;
    const commonShinyMax = rarityCfg.commonShinyMax != null ? rarityCfg.commonShinyMax : 99.8;
    const legendaryUnlock = rarityCfg.legendaryUnlockRifts != null ? rarityCfg.legendaryUnlockRifts : 30;
    const shinyPity = rarityCfg.shinyPityRifts != null ? rarityCfg.shinyPityRifts : 500;

    // Taxas calibradas: Comum Normal (94.0%), Lendário Normal (3.8%), Comum Shiny (2.0%), Lendário Shiny (0.2%)
    if (roll <= commonNormalMax) {
      targetTier = 'common_normal';
    } else if (roll <= legendNormalMax) {
      targetTier = (riftsCleared < legendaryUnlock) ? 'common_normal' : 'legend_normal';
    } else if (roll <= commonShinyMax) {
      targetTier = 'common_shiny';
    } else {
      targetTier = (riftsCleared < legendaryUnlock) ? 'common_shiny' : 'legend_shiny';
    }

    // Pity de 500 Rifts garantido (marco de shiny a cada 500 se rifts > 0)
    if (riftsCleared > 0 && riftsCleared % shinyPity === 0) {
      if (targetTier === 'common_normal') targetTier = 'common_shiny';
      else if (targetTier === 'legend_normal') targetTier = 'legend_shiny';
    }

    let willBeShiny = (targetTier === 'common_shiny' || targetTier === 'legend_shiny');
    const isLegend = (targetTier === 'legend_normal' || targetTier === 'legend_shiny');

    let targetPool = isLegend ? (legendPool.length ? legendPool : commonPool) : (commonPool.length ? commonPool : regionPool);

    // =========================================================================
    // FILTRO ESTRITO POR ESTÁGIO EVOLUTIVO
    // Regra: Nível <= 20: Stg 1 | Nível 21..41: Stg 2 | Nível 42+: Stg 3
    // =========================================================================
    let stagePool = targetPool.filter(p => getMonStage(p.dex || p.name) === targetStage);
    if (!stagePool.length) {
      // Se na targetPool da região não houver espécies deste estágio, busca na basePool global
      stagePool = basePool.filter(p => getMonStage(p.dex || p.name) === targetStage);
    }
    if (!stagePool.length) {
      // Fallback de segurança para não travar
      stagePool = targetPool.slice();
    }

    let candidates = [];
    let isChampionReward = false;

    if (willBeShiny) {
      // Deduplicação Shiny: só exclui se o jogador já possuir sua versão Shiny
      candidates = stagePool.filter(p => !shinySet.has(p.name.toLowerCase()) && !shinySet.has(String(p.dex)));
      if (!candidates.length) {
        // Se já tiver todos os Shinies da categoria, permite re-sorteio
        candidates = stagePool.slice();
      }
    } else {
      // Deduplicação Normal: exclui estritamente todas as espécies já capturadas
      candidates = stagePool.filter(p => !capturedSet.has(p.name.toLowerCase()) && !capturedSet.has(String(p.dex)));
      if (!candidates.length) {
        if (!isLegend) {
          // Se todos os comuns do estágio já foram capturados, verifica se faltam Shinies comuns
          const missingShinies = stagePool.filter(p => !shinySet.has(p.name.toLowerCase()) && !shinySet.has(String(p.dex)));
          if (missingShinies.length > 0 && Math.random() < 0.02) {
            willBeShiny = true;
            candidates = missingShinies;
          } else {
            // Estágio 100% capturado: Caixa de Recompensas de Campeão
            candidates = stagePool.slice();
            isChampionReward = true;
          }
        } else {
          candidates = stagePool.slice();
        }
      }
    }

    if (!candidates.length) {
      candidates = stagePool.length ? stagePool.slice() : [{ dex: 25, name: 'Pikachu', types: ['electric'] }];
    }

    const selectedMon = candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
    const selectedName = selectedMon ? selectedMon.name.toLowerCase() : 'pikachu';
    const selectedDex = selectedMon ? selectedMon.dex : 25;
    const finalIsLegend = isRegionalLeg(selectedMon);
    const finalStage = getMonStage(selectedMon.dex || selectedMon.name) || targetStage;

    return {
      mon: selectedMon,
      dex: selectedDex,
      speciesId: selectedName,
      isShiny: willBeShiny,
      isLegendary: finalIsLegend,
      isChampionReward: isChampionReward,
      stage: finalStage,
      tier: targetTier,
      roll: roll
    };
  }

  /** Quien manda: elige guardian y lugar, y avisa a todos. */
  let nextType = null;          // pruebas/vídeos: tipo de la próxima arena

  function start(forceType, forceSpecies, forceShiny, forceLevel) {
    if (arena) return;
    forceType = forceType || nextType; nextType = null;

    let mon = null;
    let isShiny = false;
    let championReward = false;
    let detectedStage = 1;

    if (forceSpecies !== undefined && forceSpecies !== null) {
      if (typeof forceSpecies === 'number') {
        mon = (typeof G === 'object' && G.DEX_BY) ? G.DEX_BY[forceSpecies] : null;
      } else if (typeof forceSpecies === 'string') {
        const lower = forceSpecies.toLowerCase().trim();
        mon = (typeof G === 'object' && G.DEX) ? G.DEX.find(p => p.name.toLowerCase() === lower) : null;
        if (!mon && typeof G === 'object' && G.DEX_BY) {
          mon = G.DEX_BY[parseInt(forceSpecies, 10)];
        }
      }
      if (forceShiny !== undefined) {
        isShiny = !!forceShiny;
      } else {
        const totalClears = (typeof G === 'object' && G.DB && G.DB.getTotalRiftsCleared) ? G.DB.getTotalRiftsCleared() : 0;
        const cfg2 = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : (typeof G === 'object' ? G.BalanceConfig : null));
        const rc2 = (cfg2 && cfg2.rewards && cfg2.rewards.rift && cfg2.rewards.rift.rarity) || {};
        const pity2 = rc2.shinyPityRifts != null ? rc2.shinyPityRifts : 500;
        isShiny = (totalClears > 0 && totalClears % pity2 === 0) || Math.random() < 0.001;
      }
      detectedStage = mon ? getMonStage(mon.dex || mon.name) : 1;
    } else {
      const guardian = selectRiftGuardian(forceType, forceLevel);
      mon = guardian.mon;
      isShiny = forceShiny !== undefined ? !!forceShiny : guardian.isShiny;
      championReward = !!guardian.isChampionReward;
      detectedStage = guardian.stage || (mon ? getMonStage(mon.dex || mon.name) : 1);
    }

    if (!mon && typeof G === 'object' && G.DEX) {
      mon = G.DEX[0];
      detectedStage = getMonStage(mon.dex || mon.name);
    }

    const pLvl = forceLevel !== undefined && forceLevel !== null
      ? Number(forceLevel)
      : ((typeof G === 'object' && G.Game && G.Game.player) ? G.Game.player.level : 1);

    const cfg = {
      tx: 5000 + Math.floor(Math.random() * 3000), ty: 5000 + Math.floor(Math.random() * 3000), r: ARENA_R,
      dex: mon.dex, shiny: isShiny,
      stage: detectedStage,
      playerLevel: pLvl,
      championReward: championReward,
      // La arena es la de uno de sus tipos, al azar.
      type: forceType || ((G.U && G.U.pick) ? G.U.pick(mon.types) : mon.types[0])
    };
    if (G.Coop && G.Coop.isHost) G.Coop.broadcast(['arena', cfg]);
    begin(cfg);
    spawnLegend();
  }

  /** En cada ordenador: viaje a la arena. */
  function begin(cfg) {
    const pl = (G.Game && G.Game.player) ? G.Game.player : { x: 0, y: 0 };
    const ts = TS();
    arena = Object.assign({}, cfg, {
      x: cfg.tx * ts + ts / 2, y: cfg.ty * ts + ts / 2,
      back: { x: pl.x, y: pl.y }, biome: (G.World && typeof G.World.biome === 'number') ? G.World.biome : 0, t: 0, phase: 'fight', endT: 0, bossId: 0
    });
    rift = null; asked = false; downT = 0;
    if (G.EnemyMgr) {
      if (authority()) G.EnemyMgr.stash(); else G.EnemyMgr.clearRemote();
    }
    if (G.Projectiles) G.Projectiles.clear();
    if (G.Combat) G.Combat.clearFields();
    if (G.Hazards) G.Hazards.clear();
    if (G.World && G.World.setArena) G.World.setArena({ tx: cfg.tx, ty: cfg.ty, r: cfg.r, type: cfg.type });
    if (G.World && G.World.setBiome && G.Tiles && G.Tiles.arenaBiome) G.World.setBiome(G.Tiles.arenaBiome(cfg.type), true);
    // Cada arena trae su clima (el volcán, sol; el glaciar, nieve...).
    if (G.Tiles && G.Tiles.ARENA_THEMES) {
      const th = G.Tiles.ARENA_THEMES[cfg.type];
      if (th && th.weather && G.Weather && G.Weather.force) G.Weather.force(th.weather, ARENA_TIME + 15);
    }
    // Todos al sur de la arena, en fila; el legendario aparece al norte.
    const ps = (G.Game && G.Game.everyone) ? G.Game.everyone() : [pl];
    ps.forEach((p, i) => { p.x = arena.x + (i - (ps.length - 1) / 2) * 34; p.y = arena.y + ts * 3; });
    if (G.Camera) { G.Camera.x = pl.x; G.Camera.y = pl.y; }
    if (G.Game && G.Game.flash) G.Game.flash('#c9a6ff', 0.9);
    if (G.Audio && G.Audio.sfx) G.Audio.sfx('rift');
    if (G.Spawner && G.Spawner.say) G.Spawner.say('Você entrou na fenda dimensional…', 2.4, true);
  }

  function spawnLegend() {
    const mon = G.DEX_BY[arena.dex];
    const stage = arena.stage || getMonStage(mon.dex || mon.name) || 1;
    const t = (G.Game && G.Game.st) ? G.Game.st.time : 0;
    const n = (G.Game && G.Game.everyone) ? G.Game.everyone().length : 1;
    const ts = TS();

    // Nível do Jogador e Fator de Escala da Fenda (Nv 10 até 100 de 10 em 10)
    const pLvl = (arena && typeof arena.playerLevel === 'number')
      ? arena.playerLevel
      : ((G.Game && G.Game.player) ? G.Game.player.level : 1);
    const tierData = getRiftTierData(pLvl);

    let def;
    if (stage === 1) {
      def = {
        dex: mon.dex, name: mon.name, stage: 1,
        hp: Math.round((2600 + t * 9) * G.Coop.scaleHp(n) * (n > 1 ? 1.4 : 1) * 2.2),
        spd: Math.round(G.U.clamp(42 + (mon.spd - 78) * 0.45, 42, 70)),
        dmg: Math.round(22 + t / 25),
        xp: Math.round(380 + t * 0.9),
        behavior: mon.types.some(x => ['psychic', 'electric', 'ghost', 'fairy', 'fire', 'water', 'ice', 'dragon'].includes(x)) ? 'ranged' : 'charger',
        shotDmg: Math.round(14 + t / 45),
        shotCd: 1.25,
        range: 260
      };
    } else if (stage === 2) {
      def = {
        dex: mon.dex, name: mon.name, stage: 2,
        hp: Math.round((4200 + t * 14) * G.Coop.scaleHp(n) * (n > 1 ? 1.4 : 1) * 3.0),
        spd: Math.round(G.U.clamp(55 + (mon.spd - 78) * 0.6, 55, 95)),
        dmg: Math.round(44 + t / 18),
        xp: Math.round(800 + t * 1.5),
        behavior: mon.types.some(x => ['psychic', 'electric', 'ghost', 'fairy', 'fire', 'water', 'ice', 'dragon'].includes(x)) ? 'ranged' : 'charger',
        shotDmg: Math.round(25 + t / 35),
        shotCd: 0.85,
        range: 330
      };
    } else {
      def = {
        dex: mon.dex, name: mon.name, stage: 3,
        hp: Math.round((6800 + t * 22) * G.Coop.scaleHp(n) * (n > 1 ? 1.4 : 1) * 4.0),
        spd: Math.round(G.U.clamp(68 + (mon.spd - 78) * 0.75, 68, 118)),
        dmg: Math.round(68 + t / 14),
        xp: Math.round(1500 + t * 2.2),
        behavior: mon.types.some(x => ['psychic', 'electric', 'ghost', 'fairy', 'fire', 'water', 'ice', 'dragon'].includes(x)) ? 'ranged' : 'charger',
        shotDmg: Math.round(38 + t / 25),
        shotCd: 0.55,
        range: 420
      };
    }

    // Aplicação dos Super Multiplicadores do Rift Tier (Nv 10 até 100 de 10 em 10):
    def.hp = Math.round(def.hp * tierData.hpMul);
    def.dmg = Math.round(def.dmg * tierData.dmgMul);
    def.shotDmg = Math.round(def.shotDmg * tierData.dmgMul);
    def.spd = Math.min(130, def.spd + tierData.spdBonus);
    def.shotCd = Math.max(0.25, Number((def.shotCd * tierData.shotCdMul).toFixed(2)));
    def.xp = Math.round(def.xp * (1 + tierData.tier * 0.35));

    const e = new G.Enemy(def, arena.x, arena.y - ts * 3.5, { hp: 1, spd: 1, dmg: 1 }, true);
    e.legend = true;
    e.isRiftGuardian = true;
    e.stage = stage;
    e.riftTier = tierData.tier;
    e.riftTierName = tierData.name;
    // Choca com as paredes e colunas da arena
    e.flying = false;
    if (arena.shiny) e.makeShiny();

    // Escala e porte físico de acordo com o estágio
    const scaleMul = stage === 3 ? 1.30 : (stage === 2 ? 1.15 : 1.0);
    e.scale *= scaleMul;
    e.r *= (stage === 3 ? 1.25 : (stage === 2 ? 1.12 : 1.0));
    e.bodyH *= (stage === 3 ? 1.25 : (stage === 2 ? 1.12 : 1.0));

    if (G.EnemyMgr) G.EnemyMgr.add(e);
    arena.bossId = e.id;
    arena.bossObj = e;

    // Se o tier do nível trouxer lacaios da fenda (a partir do Lvl 20), invoca a primeira guarda
    if (tierData.minions > 0) {
      spawnRiftMinions(tierData.minions, tierData);
    }

    const stageLabel = stage === 3 ? ' (Estágio 3)' : (stage === 2 ? ' (Estágio 2)' : ' (Estágio 1)');
    const stageStars = stage === 3 ? '⚡⚡⚡ ' : (stage === 2 ? '⚡⚡ ' : '⚡ ');
    const tierText = tierData.tier > 0 ? ` · ${tierData.name} (HP ×${tierData.hpMul.toFixed(1)} | Dano ×${tierData.dmgMul.toFixed(1)})` : '';
    if (G.Spawner && G.Spawner.say) G.Spawner.say(stageStars + e.name + (e.shiny ? ' Shiny' : '') + stageLabel + ' é o Guardião da Fenda!' + tierText, 4.0);
    if (G.Camera && G.Camera.kick) G.Camera.kick(1.1);
    if (G.Audio && G.Audio.sfx) G.Audio.sfx('boss');
  }

  /** Nadie sale del círculo de la arena (por si algo empuja demasiado). */
  function keepInside() {
    const ts = TS(), max = (arena.r - 1.4) * ts;
    for (const e of G.EnemyMgr.all()) {
      if (e.remote) continue;
      const dx = e.x - arena.x, dy = e.y - arena.y, d = Math.hypot(dx, dy);
      if (d > max) { e.x = arena.x + dx / d * max; e.y = arena.y + dy / d * max; }
    }
  }

  function arenaTick(dt, pl) {
    arena.t += dt;
    if (arena.phase === 'fight') {
      if (!authority()) return;
      keepInside();
      const boss = G.EnemyMgr.get(arena.bossId);
      if (boss && !boss.dead) {
        arena.lastBossX = boss.x;
        arena.lastBossY = boss.y;
      }
      if (!boss || boss.dead) {
        G.Coop.isHost && G.Coop.broadcast(['aw']);
        handleGuardianDefeated(boss);
        return;
      }

      // MORTE NO RIFT: Game Over na rodada!
      const allDown = G.Game.everyone().every(p => p.dead);
      if (allDown) {
        // Quando o jogador morre na Fenda, NÃO expulsa de volta com vida:
        // A partida encerra definitivamente em Game Over pelo loop de game.js!
        return;
      }

      // Se o tempo esgotou sem derrotar o Guardião (e sem o jogador morrer)
      if (arena.t > ARENA_TIME) {
        G.Coop.isHost && G.Coop.broadcast(['al']);
        lost();
        return;
      }

      // Reposição periódica de Sombras Dimensionais se o tier for 2+ (Nv. 20+)
      const pLvl = (arena && arena.playerLevel) || (pl ? pl.level : 1);
      const tierData = getRiftTierData(pLvl);
      if (tierData.minions > 0 && G.EnemyMgr && G.EnemyMgr.all) {
        arena.minionTimer = (arena.minionTimer || 0) + dt;
        if (arena.minionTimer >= 10) {
          arena.minionTimer = 0;
          const aliveMinions = G.EnemyMgr.all().filter(e => e.isRiftMinion && !e.dead).length;
          if (aliveMinions < tierData.minions) {
            spawnRiftMinions(tierData.minions - aliveMinions, tierData);
          }
        }
      }
      return;
    }
    if (arena.phase === 'capture') {
      // Captura diegética no chão do mapa em execução.
      // O jogador continua se movendo, atirando e recolhendo itens livremente.
      return;
    }
    arena.endT -= dt;
    if (arena.endT <= 0) finish();
  }

  function handleGuardianDefeated(boss) {
    if (!arena || arena.phase !== 'fight') return;
    arena.phase = 'capture';
    riftsCompleted++;

    // Dissipa instantaneamente todas as Sombras da Fenda Dimensional ativas
    if (G.EnemyMgr && typeof G.EnemyMgr.all === 'function') {
      for (const en of G.EnemyMgr.all()) {
        if (en && en.isRiftMinion && !en.dead) {
          en.hp = 0;
          en.dead = true;
          if (G.FX && G.FX.burst) G.FX.burst(en.x, en.y, '#c084fc', 12, 60);
        }
      }
    }

    // 1. O combate continua ativo no mundo (NÃO pausar o jogo!)
    if (typeof G === 'object' && G.Game) G.Game.isPaused = false;
    if (typeof game !== 'undefined') game.isPaused = false;

    const guardianMon = G.DEX_BY[arena.dex];
    const isShiny = !!arena.shiny;
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : null;

    // Coordenadas precisas do monstro derrotado
    const ts = TS();
    const bossX = (boss && typeof boss.x === 'number') ? boss.x :
                  (typeof arena.lastBossX === 'number' ? arena.lastBossX : arena.x);
    const bossY = (boss && typeof boss.y === 'number') ? boss.y :
                  (typeof arena.lastBossY === 'number' ? arena.lastBossY : (arena.y - ts * 2));
    const fromX = pl ? pl.x : bossX;
    const fromY = pl ? pl.y : bossY;

    // Colapso visual em partículas vermelhas de energia no solo
    if (typeof G === 'object' && G.FX) {
      if (G.FX.burst) G.FX.burst(bossX, bossY, '#ef4444', 36, 180);
      if (G.FX.burst) G.FX.burst(bossX, bossY, '#dc2626', 24, 120);
      if (G.FX.ring) G.FX.ring(bossX, bossY, 14, 110, '#f87171', 0.6, 5);
      if (G.FX.spark) G.FX.spark(bossX, bossY, '#fee2e2', 0, -1, 16);
    }

    // Recompensa de Rift: 100 a 150 tickets distribuídos em 5 orbes dourados (via BalanceConfig)
    const bCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
    const rftCfg = bCfg && bCfg.rewards && bCfg.rewards.rift;
    const minT = (rftCfg && rftCfg.guardianTicketsMin) || 100;
    const maxT = (rftCfg && rftCfg.guardianTicketsMax) || 150;
    const totalRiftTickets = G.U.rand(minT, maxT);
    const rParts = 5;
    const rBaseVal = Math.floor(totalRiftTickets / rParts);
    let rRem = totalRiftTickets % rParts;
    for (let i = 0; i < rParts; i++) {
      const val = rBaseVal + (rRem > 0 ? 1 : 0);
      if (rRem > 0) rRem--;
      if (G.Pickups && typeof G.Pickups.drop === 'function') {
        G.Pickups.drop('ticket', bossX + G.U.rand(-32, 32), bossY + G.U.rand(-24, 24), val);
      }
    }

    const monName = guardianMon ? guardianMon.name : 'Guardião';
    console.log("🌟 Guardião de Rift derrotado:", monName);
    if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
      if (isShiny) {
        G.Spawner.say(`✨ ${monName.toUpperCase()} SHINY DERROTADO! +5.000 TICKETS DE ROLETA!`, 4.5, true);
      } else {
        G.Spawner.say(`⚡ ${monName.toUpperCase()} DERROTADO! ARREMESSANDO POKÉBOLA!`, 2.5, true);
      }
    }

    // Inicia a captura diegética no chão do mapa
    const capSys = (typeof CaptureSystem !== 'undefined' ? CaptureSystem : (typeof window !== 'undefined' ? (window.captureSystem || window.CaptureSystem) : null)) || (typeof G === 'object' ? G.Capture : null);
    if (capSys && typeof capSys.startCaptureSequence === 'function') {
      const bossStage = arena.stage || (guardianMon ? getMonStage(guardianMon.dex || guardianMon.name) : 1);
      capSys.startCaptureSequence({
        speciesId: guardianMon ? guardianMon.name : 'mewtwo',
        mon: guardianMon,
        boss: boss,
        x: bossX,
        y: bossY,
        fromX: fromX,
        fromY: fromY,
        isShiny: isShiny,
        isLegendary: isLegendaryOrMythical(guardianMon),
        stage: bossStage,
        level: pl ? pl.level : 1,
        onComplete: (caught, isDuplicate) => {
          if (arena && arena.championReward) {
            // Se for recompensa de campeão, entrega o bônus adicional
            if (G.DB && G.DB.save) {
              G.DB.save.coins = (G.DB.save.coins || 0) + 5000;
              if (G.DB.save.stats) G.DB.save.stats.coinsEarned = (G.DB.save.stats.coinsEarned || 0) + 5000;
              if (G.DB.commit) G.DB.commit('champion');
            }
            if (pl && typeof pl.gainXp === 'function') pl.gainXp(5000);
            if (G.Spawner && typeof G.Spawner.say === 'function') {
              G.Spawner.say('🏆 Caixa de Recompensas de Campeão! +5.000 Ouro e EXP!', 3.5, true);
            }
          }
          won(caught, isDuplicate);
        }
      });
    } else {
      console.error("❌ captureSystem não está carregado no escopo global!");
      won(false);
    }
  }

  function won(caught, isDuplicate) {
    if (!arena || (arena.phase !== 'fight' && arena.phase !== 'capture')) return;
    arena.phase = 'won';
    arena.endT = 1.4; // Transição suave de volta ao mapa normal
    G.Progress.event('rift', { type: arena.type });
    G.Pickups.pullAll();
    const mon = G.DEX_BY[arena.dex];
    const stage = arena.stage || (mon ? getMonStage(mon.dex || mon.name) : 1);

    // As recompensas de moedas/tickets do Rift são creditadas em capture.js
    // (Gold Bounty por estágio + bônus de duplicata). A mensagem abaixo usa
    // os MESMOS valores para não anunciar números que não são entregues.
    const coinsReward = stage === 3 ? 1000 : (stage === 2 ? 750 : 500);
    const ticketsReward = G.U.rand(100, 150);

    const msg = arena.championReward
      ? ('🏆 ' + mon.name + ' derrotado! Recompensas de Campeão resgatadas!')
      : (caught
          ? (isDuplicate
              ? ('✨ ' + mon.name + ` repetido! +${coinsReward} Moedas e +${ticketsReward} Tickets de bônus!`)
              : ('✨ ' + mon.name + ` capturado! Recompensa de Caçador resgatada!`))
          : (mon.name + ' escapou, mas você concluiu o Rift!'));
    G.Spawner.say(msg, 3.4, true);
    G.Audio.sfx('legend');
    if (typeof G === 'object' && G.UI && typeof G.UI.refreshCoins === 'function') {
      G.UI.refreshCoins();
    }
    const pl = G.Game.player;
    if (pl) {
      pl.bonds++;
      pl.bondHold = false;   // vínculo novo: volta a oferecer a escolha
      G.FX.dmgText(pl.x, pl.y - pl.bodyH - 10, 'Elo de Fusão!', '#ff8ad8', true);
      G.FX.ring(pl.x, pl.y, 8, 90, '#ff8ad8', 0.7, 5);
    }
  }

  function lost() {
    if (!arena || (arena.phase !== 'fight' && arena.phase !== 'capture')) return;
    arena.phase = 'lost';
    arena.endT = 1.2;
    G.Spawner.say('A fenda dimensional expulsou você…', 2.6, true);
    G.Audio.sfx('back');
  }

  /** En cada ordenador: vuelta al mapa. */
  function finish() {
    const pl = G.Game && G.Game.player;
    const a = arena;
    arena = null;
    if (G.World) {
      if (typeof G.World.setArena === 'function') G.World.setArena(null);
      const safeBiome = (a && typeof a.biome === 'number') ? a.biome : 0;
      G.World.setBiome(safeBiome, true);
    }
    if (G.Weather && typeof G.Weather.clear === 'function') G.Weather.clear();
    // Retorna todos os inimigos do mapa principal guardados
    if (authority() && G.EnemyMgr && typeof G.EnemyMgr.restore === 'function') G.EnemyMgr.restore();
    if (G.Projectiles && typeof G.Projectiles.clear === 'function') G.Projectiles.clear();
    if (G.Combat && typeof G.Combat.clearFields === 'function') G.Combat.clearFields();
    if (G.Hazards && typeof G.Hazards.clear === 'function') G.Hazards.clear();
    const backX = (a && a.back && typeof a.back.x === 'number') ? a.back.x : (pl ? pl.x : 0);
    const backY = (a && a.back && typeof a.back.y === 'number') ? a.back.y : (pl ? pl.y : 0);
    if (G.Game && typeof G.Game.everyone === 'function') {
      for (const p of G.Game.everyone()) {
        if (p) { p.x = backX; p.y = backY; }
      }
    }
    if (pl) {
      pl.x = backX;
      pl.y = backY;
      // Morte no Rift dá Game Over na rodada, sem revive indevido
    }
    if (G.Camera && pl) { G.Camera.x = pl.x; G.Camera.y = pl.y; }
    if (G.Game && typeof G.Game.flash === 'function') G.Game.flash('#c9a6ff', 0.8);
    if (G.Spawner && typeof G.Spawner.say === 'function') G.Spawner.say('De volta ao campo de batalha!', 2.2, true);
    // Não abre mais tela de escolher ataques: a partir do Nv. 20 todos os 4 ataques já combam juntos automaticamente!
  }

  // ---------------- dibujo ----------------

  /** La grieta, para ordenarla por Y con el resto de la escena. */
  function drawable() {
    if (!rift) return null;
    return {
      y: rift.y,
      draw(ctx) {
        const P = G.Sprites.PX;
        const img = G.Tiles.propSprite(0, 'rift', Math.floor(rift.t * 8) % 4);
        const w = img.width * P, h = img.height * P;
        const fadeIn = Math.min(1, rift.t * 2), fadeOut = Math.min(1, rift.ttl / 1.5);
        ctx.save();
        ctx.globalAlpha = 0.25 * fadeIn * fadeOut;
        ctx.fillStyle = '#7b3cff';
        ctx.beginPath(); ctx.ellipse(rift.x, rift.y, 34, 12, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = fadeIn * fadeOut;
        ctx.drawImage(img, Math.round(rift.x - w / 2), Math.round(rift.y - h + 4), w, h);
        ctx.restore();
        if (Math.random() < 0.3) G.FX.px(rift.x + G.U.rand(-14, 14), rift.y - G.U.rand(10, 80), '#d9c2ff', { vy: -40, life: 0.6 });
      }
    };
  }

  // ---------------- red ----------------

  function onEvent(ev) {
    switch (ev[0]) {
      case 'rift': show(ev[1], ev[2], ev[3]); break;
      case 'riftx': rift = null; break;
      case 'arena': begin(ev[1]); break;
      case 'aw': won(); break;
      case 'al': lost(); break;
    }
  }

  function debugTestRegionFilter(regionName) {
    const reg = regionName || 'kanto';
    if (typeof G === 'object' && G.Game) G.Game.currentRegion = reg;
    if (typeof window !== 'undefined' && window.game) window.game.currentRegion = reg;
    if (typeof localStorage !== 'undefined') localStorage.setItem('ps_current_region', reg);
    console.log(`=== TESTE DE RIFT EM: ${reg.toUpperCase()} ===`);
    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : null);
    const capturedCount = (dbObj && typeof dbObj.getCapturedCountByRegion === 'function') ? dbObj.getCapturedCountByRegion(reg) : 0;
    console.log("Total capturados nesta região:", capturedCount);
    const guardian = selectRiftGuardian();
    console.log("Guardião Sorteado:", guardian.speciesId);
    const isCaptured = (dbObj && typeof dbObj.isPokemonCaptured === 'function') ? dbObj.isPokemonCaptured(guardian.speciesId) : false;
    console.log("Já estava na Pokedex?", isCaptured ? "ERRO: Já capturado!" : "CORRETO: Espécie inédita!");
    return guardian;
  }

  function debugSimulateRiftSpawn(simulatedRifts) {
    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : null);
    const prevRifts = dbObj && dbObj.getTotalRiftsCleared ? dbObj.getTotalRiftsCleared() : 0;
    if (simulatedRifts !== undefined) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('poke_total_rifts', String(simulatedRifts));
      }
      if (dbObj && dbObj.setTotalRiftsCleared) {
        dbObj.setTotalRiftsCleared(simulatedRifts);
      }
    }
    const guardian = selectRiftGuardian();
    const riftsCount = simulatedRifts !== undefined ? simulatedRifts : prevRifts;
    console.log(`[TESTE RIFT] Rifts Concluídos: ${riftsCount}`);
    console.log(`• Guardião: ${guardian.speciesId.toUpperCase()}`);
    console.log(`• É Lendário? ${guardian.isLegendary ? 'SIM 🌟' : 'Não'}`);
    console.log(`• É Shiny? ${guardian.isShiny ? 'SIM ✨' : 'Não'}`);
    return guardian;
  }

  const exportObj = {
    reset, update, drawable, onEvent, enterRequest() { if (!arena) start(); },
    get rift() { return rift; }, get arena() { return arena; },
    get inArena() { return !!arena; },
    RIFT_TIERS,
    getRiftTierData,
    spawnRiftMinions,
    get timeLeft() { return arena ? Math.max(0, ARENA_TIME - arena.t) : 0; },
    get completedCount() { return riftsCompleted; },
    debugOpen() { open(); },
    start,
    /** Para pruebas: arena de un tipo ya o guardián específico. */
    debugArena(type, species, shiny, level) { start(type, species, shiny, level); },
    /** Forçar entrada imediata contra guardião específico */
    triggerGuardian(species, shiny, level) { start(null, species, shiny, level); },
    /** Para vídeos: la próxima grieta en la que entres será de este tipo. */
    debugNextType(type) { nextType = type; },
    handleGuardianDefeated,
    onGuardianDefeated: handleGuardianDefeated,
    selectRiftGuardian,
    isLegendaryOrMythical,
    debugSimulateRiftSpawn,
    debugTestRegionFilter
  };

  if (typeof window !== 'undefined') {
    window.selectRiftGuardian = selectRiftGuardian;
    window.debugSimulateRiftSpawn = debugSimulateRiftSpawn;
    window.debugTestRegionFilter = debugTestRegionFilter;
    window.riftSystem = {
      forceSpawnRift: (species, shiny, level) => {
        if (typeof G === 'object' && G.Rift) G.Rift.start(null, species, shiny, level);
      },
      start: (type, species, shiny, level) => {
        if (typeof G === 'object' && G.Rift) G.Rift.start(type, species, shiny, level);
      },
      reset: () => {
        if (typeof G === 'object' && G.Rift) G.Rift.reset();
      },
      getArena: () => (typeof G === 'object' && G.Rift) ? G.Rift.arena : null,
      getBoss: () => {
        if (typeof G === 'object' && G.Rift && G.Rift.arena) {
          if (G.EnemyMgr && G.EnemyMgr.get) {
            const b = G.EnemyMgr.get(G.Rift.arena.bossId);
            if (b) return b;
          }
          return G.Rift.arena.bossObj || null;
        }
        return null;
      }
    };
    window.onGuardianDefeated = handleGuardianDefeated;
  }
  if (typeof global !== 'undefined') {
    global.selectRiftGuardian = selectRiftGuardian;
    global.debugSimulateRiftSpawn = debugSimulateRiftSpawn;
    global.debugTestRegionFilter = debugTestRegionFilter;
    if (global.window) {
      global.window.selectRiftGuardian = selectRiftGuardian;
      global.window.debugSimulateRiftSpawn = debugSimulateRiftSpawn;
      global.window.debugTestRegionFilter = debugTestRegionFilter;
    }
  }

  return exportObj;
})();

if (typeof G === 'object') {
  G.selectRiftGuardian = G.Rift.selectRiftGuardian;
  G.debugSimulateRiftSpawn = G.Rift.debugSimulateRiftSpawn;
  G.debugTestRegionFilter = G.Rift.debugTestRegionFilter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = G.Rift;
}
