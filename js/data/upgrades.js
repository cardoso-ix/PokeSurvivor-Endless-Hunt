/* ============ upgrades.js — mejoras permanentes entre runs ============
 * Se compran con Pokémonedas en el menú. `per` es lo que da cada nivel.
 */
G.Upgrades = (() => {
  const cfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
  const upgCfg = cfg && cfg.upgrades;
  const ascCfg = upgCfg && upgCfg.ascension;

  const LIST = (upgCfg && upgCfg.list) || [
    { id: 'hp',     icon: 'heart', name: 'Vitalidade',      unit: '+8 PV Máximo',                                  max: 10, base: 60,  grow: 1.35 },
    { id: 'atk',    icon: 'fist',  name: 'Força',           unit: '+4% de dano',                                   max: 10, base: 80,  grow: 1.38 },
    { id: 'spd',    icon: 'boot',  name: 'Agilidade',       unit: '+3% de velocidade de movimento',                max: 8,  base: 70,  grow: 1.4 },
    { id: 'cd',     icon: 'clock', name: 'Recarga',         unit: '-3% de tempo de recarga das habilidades',       max: 8,  base: 90,  grow: 1.42 },
    { id: 'def',    icon: 'shield', name: 'Armadura',       unit: '+2% de defesa (redução de dano)',               max: 8,  base: 80,  grow: 1.4 },
    { id: 'regen',  icon: 'sprout', name: 'Síntese',        unit: '+0,2 PV por segundo',                           max: 5,  base: 120, grow: 1.5 },
    { id: 'magnet', icon: 'magnet', name: 'Ímã',            unit: '+12% de raio de coleta de itens e EXP',         max: 6,  base: 50,  grow: 1.4 },
    { id: 'xp',     icon: 'book',  name: 'Sabedoria',       unit: '+5% de experiência obtida',                     max: 8,  base: 100, grow: 1.42 },
    { id: 'coins',  icon: 'coin',  name: 'Fortuna',         unit: '+8% de PokéMoedas recebidas',                   max: 8,  base: 120, grow: 1.45 },
    { id: 'moves',  icon: 'cards', name: '2º Ataque Inicial', unit: 'Desbloqueia a escolha do 2º ataque inicial para começar a partida', max: 1, base: 50000, grow: 1 },
    { id: 'crit',   icon: 'star',  name: 'Acerto Crítico',  unit: '+3% de chance de acerto crítico (dano x1,5)',   max: 10, base: 90, grow: 1.4 },
    { id: 'reroll', icon: 'up',    name: 'Trocar Cartas',   unit: '+1 troca de cartas ao subir de nível',          max: 5, base: 150, grow: 1.6 },
    { id: 'ban',    icon: 'ban',   name: 'Banir',           unit: 'Bane 1 ataque da seleção (máx. 3 ataques vetados na partida)', max: 3, base: 300, grow: 1.9 }
  ];
  const OVER_MAX = (ascCfg && ascCfg.maxOverLevels) || 10; // Até +10 de Ascensão além do nível base máximo

  /**
   * Custos progressivos exponenciais para a Ascensão (+1 ao +10):
   * Centralizados no BalanceConfig.upgrades.ascension
   */
  const ASCENSION_COSTS = (ascCfg && ascCfg.costs) || [15000, 35000, 70000, 130000, 220000, 350000, 550000, 850000, 1300000, 2000000];

  function getAscensionCost(overLvlNext) {
    if (ascCfg && typeof ascCfg.getCost === 'function') {
      return ascCfg.getCost(overLvlNext);
    }
    const n = Math.max(1, Math.floor(overLvlNext || 1));
    const idx = Math.min(n - 1, ASCENSION_COSTS.length - 1);
    return ASCENSION_COSTS[idx] || ASCENSION_COSTS[ASCENSION_COSTS.length - 1];
  }
  const BY = {};
  for (const u of LIST) BY[u.id] = u;

  /** Nível total absoluto suportado para uma melhoria (base + 10). */
  function maxOf(id) {
    const u = BY[id];
    if (!u) return 20;
    if (id === 'ban' || id === 'moves') return u.max; // ban (máx 3) e moves (máx 1) não têm ascensão
    return u.max + OVER_MAX;
  }

  /**
   * Custo base original de um upgrade para um nível determinado.
   * Ao atingir o nível máximo base (lvl >= u.max):
   * +1 custa 10.000 moedas
   * +2 custa 20.000 moedas
   * ...
   * +10 custa 100.000 moedas
   */
  function baseCost(id, lvl) {
    if (id === 'moves') return 50000; // Desbloqueio fixo de 50.000 moedas
    const u = BY[id] || LIST[0];
    if (id === 'ban' && lvl >= u.max) return 0;
    if (id !== 'ban' && id !== 'moves' && lvl >= u.max) {
      const overLvlNext = (lvl - u.max) + 1; // 1 a 10
      return getAscensionCost(overLvlNext);
    }
    return Math.round(u.base * Math.pow(u.grow, lvl) / 10) * 10;
  }

  /**
   * Calcula o custo final de ouro escalonado pelo estágio evolutivo da espécie.
   * Para níveis de Ascensão (+1 a +10), a regra de custo segue ASCENSION_COSTS.
   */
  function getUpgradeCost(pokemonId, currentLevel, upgradeId = 'hp') {
    let mon = pokemonId;
    let upgId = upgradeId;
    let lvl = currentLevel;

    // Suporta chamada invertida (upgradeId, currentLevel, pokemonId)
    if (BY[pokemonId] && !BY[upgradeId]) {
      upgId = pokemonId;
      mon = upgradeId;
    }

    if (upgId === 'moves') return 50000; // Custo fixo de 50.000 moedas
    const u = BY[upgId] || LIST[0];
    if (upgId === 'ban' && lvl >= u.max) return 0;
    if (upgId !== 'ban' && upgId !== 'moves' && lvl >= u.max) {
      const overLvlNext = (lvl - u.max) + 1;
      return getAscensionCost(overLvlNext);
    }

    const base = Math.round(u.base * Math.pow(u.grow, lvl) / 10) * 10;
    const getStage = (typeof G === 'object' && typeof G.getPokemonEvolutionStage === 'function')
      ? G.getPokemonEvolutionStage
      : (typeof getPokemonEvolutionStage === 'function'
          ? getPokemonEvolutionStage
          : () => 1);

    const stage = mon ? getStage(mon) : 1;

    let multiplier = 1;
    if (stage === 2) multiplier = 2; // Dobra o ouro
    else if (stage >= 3) multiplier = 3; // Triplica o ouro

    const finalUpgradeCost = Math.round(base * multiplier);
    return finalUpgradeCost;
  }

  /**
   * Custo para comprar o próximo nível de um upgrade.
   */
  function cost(id, lvl, pokemonId = null) {
    if (id === 'moves') return 50000;
    const u = BY[id] || LIST[0];
    if (id === 'ban' && lvl >= u.max) return 0;
    if (id !== 'ban' && id !== 'moves' && lvl >= u.max) {
      const overLvlNext = (lvl - u.max) + 1;
      return getAscensionCost(overLvlNext);
    }
    if (pokemonId != null) {
      return getUpgradeCost(pokemonId, lvl, id);
    }
    return baseCost(id, lvl);
  }

  /**
   * Níveis comprados -> modificadores para G.Player.
   * Suporta o Super Buff de Ascensão (+1 até +10) após atingir o nível máximo.
   */
  function perks(levels = {}) {
    const getL = id => {
      const u = BY[id];
      if (!u) return { total: 0, baseLvl: 0, overLvl: 0 };
      const maxOver = (id === 'ban' || id === 'moves') ? 0 : OVER_MAX;
      const maxTot = u.max + maxOver;
      const total = Math.max(0, Math.min(maxTot, Math.floor(+levels[id] || 0)));
      const baseLvl = Math.min(u.max, total);
      const overLvl = (id === 'ban' || id === 'moves') ? 0 : Math.max(0, total - u.max); // 0 a 10
      return { total, baseLvl, overLvl };
    };

    const hp = getL('hp');
    const atk = getL('atk');
    const spd = getL('spd');
    const cd = getL('cd');
    const def = getL('def');
    const regen = getL('regen');
    const magnet = getL('magnet');
    const xp = getL('xp');
    const coins = getL('coins');
    const moves = getL('moves');
    const crit = getL('crit');
    const reroll = getL('reroll');
    const ban = getL('ban');

    // Super Buffs de Ascensão (+1 a +10) Data-Driven via BalanceConfig:
    const pCfg = (ascCfg && ascCfg.perks) || {};
    const atkRate = pCfg.atkPerLevel != null ? pCfg.atkPerLevel : 0.10;
    const hpRate = pCfg.hpPerLevel != null ? pCfg.hpPerLevel : 35;
    const spdRate = pCfg.spdPerLevel != null ? pCfg.spdPerLevel : 0.025;
    const cdRate = pCfg.cdPerLevel != null ? pCfg.cdPerLevel : 0.025;
    const defRate = pCfg.defPerLevel != null ? pCfg.defPerLevel : 0.020;
    const regenRate = pCfg.regenPerLevel != null ? pCfg.regenPerLevel : 1.0;
    const magRate = pCfg.magnetPerLevel != null ? pCfg.magnetPerLevel : 0.15;
    const xpRate = pCfg.xpPerLevel != null ? pCfg.xpPerLevel : 0.05;
    const coinRate = pCfg.coinsPerLevel != null ? pCfg.coinsPerLevel : 0.08;

    const atkBonus = (atk.baseLvl * 0.04) + (atk.overLvl * atkRate);
    const hpBonus = (hp.baseLvl * 8) + (hp.overLvl * hpRate);
    const spdBonus = (spd.baseLvl * 0.03) + (spd.overLvl * spdRate);
    const cdBonus = Math.min(0.50, (cd.baseLvl * 0.03) + (cd.overLvl * cdRate));
    const defBonus = Math.min(0.40, (def.baseLvl * 0.02) + (def.overLvl * defRate));
    const regenBonus = (regen.baseLvl * 0.2) + (regen.overLvl * regenRate);
    const magnetBonus = (magnet.baseLvl * 0.12) + (magnet.overLvl * magRate);
    const xpBonus = (xp.baseLvl * 0.05) + (xp.overLvl * (xpRate || 0.10));
    const coinBonus = (coins.baseLvl * 0.08) + (coins.overLvl * (coinRate || 0.10));
    const critBonus = (crit.baseLvl * 0.03) + (crit.overLvl * 0.025);

    return {
      hp: hpBonus,
      atkMul: 1 + atkBonus,
      spdMul: 1 + spdBonus,
      cdMul: 1 - cdBonus,
      dmgReduce: defBonus,
      regen: regenBonus,
      magnetMul: 1 + magnetBonus,
      xpMul: 1 + xpBonus,
      coinMul: 1 + coinBonus,
      startMoves: moves.baseLvl >= 1 ? 2 : 1,
      crit: critBonus,
      rerolls: reroll.baseLvl + reroll.overLvl,
      bans: Math.min(3, ban.baseLvl),
      overLevels: {
        hp: hp.overLvl, atk: atk.overLvl, spd: spd.overLvl, cd: cd.overLvl,
        def: def.overLvl, regen: regen.overLvl, magnet: magnet.overLvl,
        xp: xp.overLvl, coins: coins.overLvl, moves: 0,
        crit: crit.overLvl, reroll: reroll.overLvl, ban: 0
      }
    };
  }

  return { LIST, BY, cost, baseCost, getUpgradeCost, perks, maxOf, OVER_MAX, ASCENSION_COSTS, getAscensionCost };
})();

// Exportações e helper para testes no console (F12)
if (typeof window !== 'undefined') {
  window.getUpgradeCost = G.Upgrades.getUpgradeCost;
  window.debugTestUpgradeCosts = function(level) {
    const lvl = level || 1;
    console.log("--- TESTE DE CUSTO DE OURO (Nível " + lvl + ") ---");
    console.log("Charmander (Estágio 1):", window.getUpgradeCost('charmander', lvl), "ouro (1x)");
    console.log("Charmeleon (Estágio 2):", window.getUpgradeCost('charmeleon', lvl), "ouro (2x)");
    console.log("Charizard  (Estágio 3):", window.getUpgradeCost('charizard', lvl), "ouro (3x)");
  };
}
if (typeof G === 'object') {
  G.getUpgradeCost = G.Upgrades.getUpgradeCost;
  if (typeof window !== 'undefined') {
    G.debugTestUpgradeCosts = window.debugTestUpgradeCosts;
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = G.Upgrades;
}
