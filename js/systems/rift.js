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
   * Sorteio do Pokémon Guardião do Rift com Deduplicação e Filtro Regional:
   * 1. Ambientação Regional: Restrito à região ativa (game.currentRegion).
   * 2. Deduplicação Pokedex: Pokémon normais já capturados NÃO reaparecem no Rift.
   * 3. Se for sorteio Shiny: Pokémon só é removido se o jogador já tiver sua versão Shiny.
   * 4. Regra dos 300 Rifts: Lendários daquela região só desbloqueiam a partir de 300 rifts totais (15% ponderado).
   * 5. Pity dos 500 Rifts: Gera um Shiny garantido daquela região (100%).
   * 6. Região 100% Concluída: Caso todas as espécies normais tenham sido capturadas, foca em Shinies restantes ou concede a Caixa de Recompensas de Campeão (+5.000 Ouro e EXP).
   */
  function selectRiftGuardian(forceType) {
    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : null);
    let riftsCleared = 0;
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('poke_total_rifts');
      if (stored != null && stored !== '') riftsCleared = Number(stored) || 0;
    }
    if (!riftsCleared && dbObj && typeof dbObj.getTotalRiftsCleared === 'function') {
      riftsCleared = dbObj.getTotalRiftsCleared();
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

    // Regra de Shiny: Pity garantido no múltiplo de 500 ou 0.1% natural
    let willBeShiny = false;
    if (riftsCleared > 0 && riftsCleared % 500 === 0) {
      willBeShiny = true;
    } else if (Math.random() < 0.001) {
      willBeShiny = true;
    }

    // Regra dos 300 Rifts: Bloqueio ou Liberação de Lendários
    const allowLegendaries = riftsCleared >= 300;
    const isRegionalLeg = p => isLegendaryOrMythical(p) || (regionCfg.legendaries && regionCfg.legendaries.includes(p.name.toLowerCase()));

    let eligiblePool = regionPool.slice();
    if (!allowLegendaries) {
      eligiblePool = eligiblePool.filter(p => !isRegionalLeg(p));
    }

    // DEDUPLICAÇÃO DE POKÉDEX:
    let candidates = [];
    let isChampionReward = false;

    if (willBeShiny) {
      // Se for sorteio Shiny, o monstro só é excluído se o jogador já possuir sua versão Shiny!
      candidates = eligiblePool.filter(p => !shinySet.has(p.name.toLowerCase()) && !shinySet.has(String(p.dex)));
      if (!candidates.length) {
        // Se já tiver todos os shinies da região, permite re-sorteio de shinies
        candidates = eligiblePool.slice();
      }
    } else {
      // Se for sorteio Normal, exclui estritamente todas as espécies já capturadas na Pokédex
      candidates = eligiblePool.filter(p => !capturedSet.has(p.name.toLowerCase()) && !capturedSet.has(String(p.dex)));

      // TRATAMENTO DE REGIÃO 100% COMPLETA (Fallback):
      if (!candidates.length) {
        // Verifica se ainda faltam Shinies para completar a região
        const missingShinies = eligiblePool.filter(p => !shinySet.has(p.name.toLowerCase()) && !shinySet.has(String(p.dex)));
        if (missingShinies.length > 0 && Math.random() < 0.25) {
          // Foco em Shinies restantes!
          willBeShiny = true;
          candidates = missingShinies;
        } else {
          // Região 100% capturada: Sorteia entre os já capturados e ativa Caixa de Recompensas de Campeão
          candidates = eligiblePool.length ? eligiblePool.slice() : regionPool.slice();
          isChampionReward = true;
        }
      }
    }

    if (!candidates.length) {
      candidates = regionPool.length ? regionPool.slice() : [basePool[0]];
    }

    // Sorteio com taxa ponderada para Lendários (15%) a partir dos 300 Rifts
    let selectedMon = null;
    if (allowLegendaries) {
      const legCandidates = candidates.filter(isRegionalLeg);
      const nonLegCandidates = candidates.filter(p => !isRegionalLeg(p));
      if (legCandidates.length && Math.random() < 0.15) {
        selectedMon = legCandidates[Math.floor(Math.random() * legCandidates.length)];
      } else if (nonLegCandidates.length) {
        selectedMon = nonLegCandidates[Math.floor(Math.random() * nonLegCandidates.length)];
      } else {
        selectedMon = candidates[Math.floor(Math.random() * candidates.length)];
      }
    } else {
      selectedMon = candidates[Math.floor(Math.random() * candidates.length)];
    }

    if (!selectedMon) {
      selectedMon = candidates[0] || basePool[0];
    }

    const selectedName = selectedMon ? selectedMon.name.toLowerCase() : 'pikachu';
    const selectedDex = selectedMon ? selectedMon.dex : 25;
    const isLegend = isRegionalLeg(selectedMon);

    return {
      mon: selectedMon,
      dex: selectedDex,
      speciesId: selectedName,
      isShiny: willBeShiny,
      isLegendary: isLegend,
      isChampionReward: isChampionReward
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
      // Modal cinematográfico de captura em execução
      return;
    }
    arena.endT -= dt;
    if (arena.endT <= 0) finish();
  }

  function handleGuardianDefeated(boss) {
    if (!arena || arena.phase !== 'fight') return;
    arena.phase = 'capture';

    // Incremento global do contador de Rifts (por captura ou fuga)
    if (G.DB && G.DB.addRiftCleared) G.DB.addRiftCleared(1);

    const guardianMon = G.DEX_BY[arena.dex];
    const isShiny = !!arena.shiny;
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : null;

    if (arena.championReward) {
      // Região 100% concluída: Caixa de Recompensas de Campeão (+5.000 Ouro e EXP)
      if (G.DB && G.DB.save) {
        G.DB.save.coins = (G.DB.save.coins || 0) + 5000;
        if (G.DB.save.stats) G.DB.save.stats.coinsEarned = (G.DB.save.stats.coinsEarned || 0) + 5000;
        if (G.DB.commit) G.DB.commit('champion');
      }
      if (pl && typeof pl.gainXp === 'function') pl.gainXp(5000);
      G.Spawner.say('🏆 Caixa de Recompensas de Campeão! +5.000 Ouro e EXP!', 4.2, true);
      G.Audio.sfx('shiny');
      setTimeout(() => won(true), 800);
      return;
    }

    // Inicia a sequência de captura 100% in-game (sem telas externas)
    if (G.Capture && G.Capture.startCaptureSequence) {
      G.Capture.startCaptureSequence({
        boss: boss,
        mon: guardianMon,
        isShiny: isShiny,
        playerLevel: pl ? pl.level : 1,
        onComplete: (caught) => {
          won(caught);
        }
      });
    } else {
      won(false);
    }
  }

  function won(caught) {
    if (!arena || (arena.phase !== 'fight' && arena.phase !== 'capture')) return;
    arena.phase = 'won';
    arena.endT = 0.8; // Retorna para a fase normal rapidamente após o término da captura
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
    selectRiftGuardian,
    isLegendaryOrMythical,
    debugSimulateRiftSpawn,
    debugTestRegionFilter
  };

  if (typeof window !== 'undefined') {
    window.selectRiftGuardian = selectRiftGuardian;
    window.debugSimulateRiftSpawn = debugSimulateRiftSpawn;
    window.debugTestRegionFilter = debugTestRegionFilter;
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
