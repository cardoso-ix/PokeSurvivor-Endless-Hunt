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
  let rift = null;          // { x, y, ttl, t }
  let arena = null;         // { tx, ty, r, dex, shiny, x, y, back, biome, t, phase, endT, bossId }
  let checkT = CHECK, asked = false, downT = 0, misses = 0;
  const authority = () => !G.Coop.active || G.Coop.isHost;
  const TS = () => G.Tiles.T * G.Sprites.PX;

  function reset() { rift = null; arena = null; checkT = CHECK; asked = false; downT = 0; misses = 0; }

  // ---------------- grieta en el mapa ----------------

  function update(dt, pl, time) {
    if (rift) {
      rift.t += dt;
      rift.ttl -= dt;
      if (rift.ttl <= 0) { rift = null; return; }
      if (!arena && !pl.dead && G.U.dist2(pl.x, pl.y, rift.x, rift.y - 10) < 30 * 30) enter();
    } else if (!arena && authority() && time > FROM && time < G.Judgment.AT - 120) {
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

  /**
   * Sorteio do Pokémon Guardião do Rift com Deduplicação e Balanceamento Matemático Rigoroso:
   * 1. Rolagem de Raridade de 1 a 100:
   *    - roll <= 75 (75%): Pokémon Comum/Regional Normal.
   *    - roll > 75 && roll <= 90 (15%): Pokémon Comum/Regional Shiny.
   *    - roll > 90 && roll <= 99 (9%): Pokémon Lendário Normal (Se rifts < 30, rebaixa para Comum Normal).
   *    - roll > 99 (1%): Pokémon Lendário Shiny (Se rifts < 30, rebaixa para Comum Shiny).
   * 2. Pity dos 500 Rifts: Múltiplo de 500 (total > 0 && total % 500 === 0) garante variante Shiny.
   * 3. Deduplicação Pokedex:
   *    - Comum Normal: prioriza espécies da região ainda NÃO capturadas.
   *    - Comum Shiny: prioriza espécies da região ainda sem versão Shiny.
   *    - Lendários: prioriza lendários ainda NÃO capturados / sem versão Shiny.
   * 4. Região 100% Concluída: Caso todas as espécies normais tenham sido capturadas, concede a Caixa de Recompensas de Campeão (+5.000 Ouro e EXP).
   */
  function selectRiftGuardian(forceType) {
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

    // Rolagem Exata de Raridade (1 a 100)
    const roll = Math.random() * 100;
    let targetTier = 'common_normal';

    if (roll <= 75) {
      targetTier = 'common_normal';
    } else if (roll <= 90) {
      targetTier = 'common_shiny';
    } else if (roll <= 99) {
      targetTier = (riftsCleared < 30) ? 'common_normal' : 'legend_normal';
    } else {
      targetTier = (riftsCleared < 30) ? 'common_shiny' : 'legend_shiny';
    }

    // Pity de 500 Rifts garantido (marco de shiny a cada 500 se rifts > 0)
    if (riftsCleared > 0 && riftsCleared % 500 === 0) {
      if (targetTier === 'common_normal') targetTier = 'common_shiny';
      else if (targetTier === 'legend_normal') targetTier = 'legend_shiny';
    }

    let willBeShiny = (targetTier === 'common_shiny' || targetTier === 'legend_shiny');
    const isLegend = (targetTier === 'legend_normal' || targetTier === 'legend_shiny');

    const targetPool = isLegend ? (legendPool.length ? legendPool : commonPool) : (commonPool.length ? commonPool : regionPool);
    let candidates = [];
    let isChampionReward = false;

    if (willBeShiny) {
      // Deduplicação Shiny: só exclui se o jogador já possuir sua versão Shiny
      candidates = targetPool.filter(p => !shinySet.has(p.name.toLowerCase()) && !shinySet.has(String(p.dex)));
      if (!candidates.length) {
        // Se já tiver todos os Shinies da categoria, permite re-sorteio
        candidates = targetPool.slice();
      }
    } else {
      // Deduplicação Normal: exclui estritamente todas as espécies já capturadas
      candidates = targetPool.filter(p => !capturedSet.has(p.name.toLowerCase()) && !capturedSet.has(String(p.dex)));
      if (!candidates.length) {
        if (!isLegend) {
          // Se todos os comuns já foram capturados, verifica se faltam Shinies comuns
          const missingShinies = targetPool.filter(p => !shinySet.has(p.name.toLowerCase()) && !shinySet.has(String(p.dex)));
          if (missingShinies.length > 0 && Math.random() < 0.25) {
            willBeShiny = true;
            candidates = missingShinies;
          } else {
            // Região 100% capturada: Caixa de Recompensas de Campeão
            candidates = targetPool.slice();
            isChampionReward = true;
          }
        } else {
          candidates = targetPool.slice();
        }
      }
    }

    if (!candidates.length) {
      candidates = targetPool.length ? targetPool.slice() : (basePool.length ? basePool.slice() : [{ dex: 25, name: 'Pikachu', types: ['electric'] }]);
    }

    const selectedMon = candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
    const selectedName = selectedMon ? selectedMon.name.toLowerCase() : 'pikachu';
    const selectedDex = selectedMon ? selectedMon.dex : 25;
    const finalIsLegend = isRegionalLeg(selectedMon);

    return {
      mon: selectedMon,
      dex: selectedDex,
      speciesId: selectedName,
      isShiny: willBeShiny,
      isLegendary: finalIsLegend,
      isChampionReward: isChampionReward,
      tier: targetTier,
      roll: roll
    };
  }

  /** Quien manda: elige guardian y lugar, y avisa a todos. */
  let nextType = null;          // pruebas/vídeos: tipo de la próxima arena

  function start(forceType, forceSpecies, forceShiny) {
    if (arena) return;
    forceType = forceType || nextType; nextType = null;

    let mon = null;
    let isShiny = false;
    let championReward = false;

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
        isShiny = (totalClears > 0 && totalClears % 500 === 0) || Math.random() < 0.001;
      }
    } else {
      const guardian = selectRiftGuardian(forceType);
      mon = guardian.mon;
      isShiny = forceShiny !== undefined ? !!forceShiny : guardian.isShiny;
      championReward = !!guardian.isChampionReward;
    }

    if (!mon && typeof G === 'object' && G.DEX) {
      mon = G.DEX[0];
    }

    const cfg = {
      tx: 5000 + Math.floor(Math.random() * 3000), ty: 5000 + Math.floor(Math.random() * 3000), r: ARENA_R,
      dex: mon.dex, shiny: isShiny,
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
    const pl = G.Game.player;
    const ts = TS();
    arena = Object.assign({}, cfg, {
      x: cfg.tx * ts + ts / 2, y: cfg.ty * ts + ts / 2,
      back: { x: pl.x, y: pl.y }, biome: G.World.biome, t: 0, phase: 'fight', endT: 0, bossId: 0
    });
    rift = null; asked = false; downT = 0;
    if (authority()) G.EnemyMgr.stash(); else G.EnemyMgr.clearRemote();
    G.Projectiles.clear();
    G.Combat.clearFields();
    G.Hazards.clear();
    G.World.setArena({ tx: cfg.tx, ty: cfg.ty, r: cfg.r, type: cfg.type });
    G.World.setBiome(G.Tiles.arenaBiome(cfg.type), true);
    // Cada arena trae su clima (el volcán, sol; el glaciar, nieve...).
    const th = G.Tiles.ARENA_THEMES[cfg.type];
    if (th && th.weather) G.Weather.force(th.weather, ARENA_TIME + 15);
    // Todos al sur de la arena, en fila; el legendario aparece al norte.
    const ps = G.Game.everyone();
    ps.forEach((p, i) => { p.x = arena.x + (i - (ps.length - 1) / 2) * 34; p.y = arena.y + ts * 3; });
    G.Camera.x = pl.x; G.Camera.y = pl.y;
    G.Game.flash('#c9a6ff', 0.9);
    G.Audio.sfx('rift');
    G.Spawner.say('Você entrou na fenda dimensional…', 2.4, true);
  }

  function spawnLegend() {
    const mon = G.DEX_BY[arena.dex];
    const t = G.Game.st.time;
    const n = G.Game.everyone().length;
    const ts = TS();
    const def = {
      dex: mon.dex, name: mon.name,
      hp: Math.round((3800 + t * 12) * G.Coop.scaleHp(n) * (n > 1 ? 1.4 : 1) * 3), // Status aumentado: 3x HP de elite
      spd: Math.round(G.U.clamp(48 + (mon.spd - 78) * 0.6, 48, 105)),
      dmg: Math.round(36 + t / 20), xp: Math.round(500 + t * 1.2),
      behavior: mon.types.some(x => ['psychic', 'electric', 'ghost', 'fairy', 'fire', 'water', 'ice', 'dragon'].includes(x)) ? 'ranged' : 'charger',
      shotDmg: Math.round(18 + t / 40), shotCd: 0.9, range: 300
    };
    const e = new G.Enemy(def, arena.x, arena.y - ts * 3.5, { hp: 1, spd: 1, dmg: 1 }, true);
    e.legend = true;
    e.isRiftGuardian = true;
    // Choca con las paredes y columnas como tú: si volara por encima de las
    // rocas, tus disparos no podrían alcanzarle (bug de Celebi).
    e.flying = false;
    if (arena.shiny) e.makeShiny();
    G.EnemyMgr.add(e);
    arena.bossId = e.id;
    G.Spawner.say('⚡ ' + e.name + (e.shiny ? ' Shiny' : '') + ' é o Guardião da Fenda!', 3.2);
    G.Camera.kick(1.1);
    G.Audio.sfx('boss');
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
      const allDown = G.Game.everyone().every(p => p.dead);
      downT = allDown ? downT + dt : 0;
      if (downT > 1.4 || arena.t > ARENA_TIME) { G.Coop.isHost && G.Coop.broadcast(['al']); lost(); }
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

    const monName = guardianMon ? guardianMon.name : 'Guardião';
    console.log("🌟 Guardião de Rift derrotado:", monName);
    if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
      G.Spawner.say(`⚡ ${monName.toUpperCase()} DERROTADO! ARREMESSANDO POKÉBOLA!`, 2.5, true);
    }

    // Inicia a captura diegética no chão do mapa
    const capSys = (typeof CaptureSystem !== 'undefined' ? CaptureSystem : (typeof window !== 'undefined' ? (window.captureSystem || window.CaptureSystem) : null)) || (typeof G === 'object' ? G.Capture : null);
    if (capSys && typeof capSys.startCaptureSequence === 'function') {
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
        level: pl ? pl.level : 1,
        onComplete: (caught) => {
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
          won(caught);
        }
      });
    } else {
      console.error("❌ captureSystem não está carregado no escopo global!");
      won(false);
    }
  }

  function won(caught) {
    if (!arena || (arena.phase !== 'fight' && arena.phase !== 'capture')) return;
    arena.phase = 'won';
    arena.endT = 1.4; // Transição suave de volta ao mapa normal
    G.Progress.event('rift', { type: arena.type });
    G.Pickups.pullAll();
    const mon = G.DEX_BY[arena.dex];
    const msg = arena.championReward
      ? ('🏆 ' + mon.name + ' derrotado! Recompensas de Campeão resgatadas!')
      : (caught ? ('✨ ' + mon.name + ' foi capturado com sucesso!') : (mon.name + ' escapou, mas você concluiu o Rift!'));
    G.Spawner.say(msg, 3.4, true);
    G.Audio.sfx('legend');
    const pl = G.Game.player;
    if (pl) {
      pl.bonds++;
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
    const pl = G.Game.player;
    const a = arena;
    arena = null;
    G.World.setBiome(a.biome, true);
    G.Weather.clear();
    // Retorna todos os inimigos do mapa principal guardados
    if (authority()) G.EnemyMgr.restore();
    G.Projectiles.clear();
    G.Combat.clearFields();
    G.Hazards.clear();
    for (const p of G.Game.everyone()) { p.x = a.back.x; p.y = a.back.y; }
    pl.x = a.back.x; pl.y = a.back.y;
    if (pl.dead) pl.revive(0.3);
    G.Camera.x = pl.x; G.Camera.y = pl.y;
    G.Game.flash('#c9a6ff', 0.8);
    G.Spawner.say('De volta ao campo de batalha!', 2.2, true);
    if (pl.bonds > 0) G.Game.offerBond();
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
    get timeLeft() { return arena ? Math.max(0, ARENA_TIME - arena.t) : 0; },
    debugOpen() { open(); },
    /** Para pruebas: arena de un tipo ya o guardián específico. */
    debugArena(type, species, shiny) { start(type, species, shiny); },
    /** Forçar entrada imediata contra guardião específico */
    triggerGuardian(species, shiny) { start(null, species, shiny); },
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
      forceSpawnRift: (species, shiny) => {
        if (typeof G === 'object' && G.Rift) G.Rift.start(null, species, shiny);
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
