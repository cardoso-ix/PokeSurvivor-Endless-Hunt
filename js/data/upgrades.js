/* ============ upgrades.js — mejoras permanentes entre runs ============
 * Se compran con Pokémonedas en el menú. `per` es lo que da cada nivel.
 */
G.Upgrades = (() => {
  const LIST = [
    { id: 'hp',     icon: 'heart', name: 'Vitalidade',      unit: '+8 PV Máximo',                                  max: 10, base: 60,  grow: 1.35 },
    { id: 'atk',    icon: 'fist',  name: 'Força',           unit: '+4% de dano',                                   max: 10, base: 80,  grow: 1.38 },
    { id: 'spd',    icon: 'boot',  name: 'Agilidade',       unit: '+3% de velocidade de movimento',                max: 8,  base: 70,  grow: 1.4 },
    { id: 'cd',     icon: 'clock', name: 'Recarga',         unit: '-3% de tempo de recarga das habilidades',       max: 8,  base: 90,  grow: 1.42 },
    { id: 'def',    icon: 'shield', name: 'Armadura',       unit: '+2% de defesa (redução de dano)',               max: 8,  base: 80,  grow: 1.4 },
    { id: 'regen',  icon: 'sprout', name: 'Síntese',        unit: '+0,2 PV por segundo',                           max: 5,  base: 120, grow: 1.5 },
    { id: 'magnet', icon: 'magnet', name: 'Ímã',            unit: '+12% de raio de coleta de itens e EXP',         max: 6,  base: 50,  grow: 1.4 },
    { id: 'xp',     icon: 'book',  name: 'Sabedoria',       unit: '+5% de experiência obtida',                     max: 8,  base: 100, grow: 1.42 },
    { id: 'coins',  icon: 'coin',  name: 'Fortuna',         unit: '+8% de PokéMoedas recebidas',                   max: 8,  base: 120, grow: 1.45 },
    { id: 'moves',  icon: 'cards', name: 'Repertório',      unit: 'Comece a partida com 2 ataques ativos',          max: 1, base: 1500, grow: 1 },
    { id: 'crit',   icon: 'star',  name: 'Acerto Crítico',  unit: '+3% de chance de acerto crítico (dano x1,5)',   max: 10, base: 90, grow: 1.4 },
    { id: 'reroll', icon: 'up',    name: 'Trocar Cartas',   unit: '+1 troca de cartas ao subir de nível',          max: 5, base: 150, grow: 1.6 },
    { id: 'ban',    icon: 'ban',   name: 'Banir',           unit: 'Bane 1 ataque da seleção: ele não voltará a aparecer nesta partida', max: 3, base: 300, grow: 1.9 }
  ];
  const OVER_MAX = 10; // Até +10 de Ascensão além do nível base máximo
  const BY = {};
  for (const u of LIST) BY[u.id] = u;

  /** Nível total absoluto suportado para uma melhoria (base + 10). */
  function maxOf(id) {
    const u = BY[id];
    return u ? u.max + OVER_MAX : 20;
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
    const u = BY[id] || LIST[0];
    if (lvl >= u.max) {
      const overLvlNext = (lvl - u.max) + 1; // 1 a 10
      return overLvlNext * 10000;
    }
    return Math.round(u.base * Math.pow(u.grow, lvl) / 10) * 10;
  }

  /**
   * Calcula o custo final de ouro escalonado pelo estágio evolutivo da espécie.
   * Para níveis de Ascensão (+1 a +10), a regra de custo é fixa: (overLvlNext * 10.000).
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

    const u = BY[upgId] || LIST[0];
    if (lvl >= u.max) {
      const overLvlNext = (lvl - u.max) + 1;
      return overLvlNext * 10000;
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
    const u = BY[id] || LIST[0];
    if (lvl >= u.max) {
      const overLvlNext = (lvl - u.max) + 1;
      return overLvlNext * 10000;
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
      const maxTot = u.max + OVER_MAX;
      const total = Math.max(0, Math.min(maxTot, Math.floor(+levels[id] || 0)));
      const baseLvl = Math.min(u.max, total);
      const overLvl = Math.max(0, total - u.max); // 0 a 10
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

    // Super Buffs de Ascensão (+1 a +10):
    // Força: base +4% por nível + 15% POR CADA +1 (+150% extra no +10!) -> Diferencial estrondoso de dano!
    const atkBonus = (atk.baseLvl * 0.04) + (atk.overLvl * 0.15);

    // Vitalidade: base +8 PV + 50 PV por cada +1 (+500 PV extra no +10!)
    const hpBonus = (hp.baseLvl * 8) + (hp.overLvl * 50);

    // Velocidade: base +3% + 5% por cada +1 (+50% extra no +10!)
    const spdBonus = (spd.baseLvl * 0.03) + (spd.overLvl * 0.05);

    // Recarga (CDR): base -3% + -4% por cada +1 (cap seguro de 65% CDR)
    const cdBonus = Math.min(0.65, (cd.baseLvl * 0.03) + (cd.overLvl * 0.04));

    // Defesa: base +2% + 3.5% por cada +1 (+35% extra no +10!)
    const defBonus = Math.min(0.55, (def.baseLvl * 0.02) + (def.overLvl * 0.035));

    // Regeneração: base +0.2 PV/s + 2.0 PV/s por cada +1 (+20 PV/s extra no +10!)
    const regenBonus = (regen.baseLvl * 0.2) + (regen.overLvl * 2.0);

    // Ímã: base +12% + 30% por cada +1 (+300% extra no +10!)
    const magnetBonus = (magnet.baseLvl * 0.12) + (magnet.overLvl * 0.30);

    // Experiência: base +5% + 20% por cada +1 (+200% extra no +10!)
    const xpBonus = (xp.baseLvl * 0.05) + (xp.overLvl * 0.20);

    // Moedas: base +8% + 35% por cada +1 (+350% extra no +10!)
    const coinBonus = (coins.baseLvl * 0.08) + (coins.overLvl * 0.35);

    // Acerto Crítico: base +3% + 5% por cada +1 (+50% extra no +10!)
    const critBonus = (crit.baseLvl * 0.03) + (crit.overLvl * 0.05);

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
      startMoves: 1 + moves.baseLvl,
      crit: critBonus,
      rerolls: reroll.baseLvl + reroll.overLvl,
      bans: ban.baseLvl + ban.overLvl,
      overLevels: {
        hp: hp.overLvl, atk: atk.overLvl, spd: spd.overLvl, cd: cd.overLvl,
        def: def.overLvl, regen: regen.overLvl, magnet: magnet.overLvl,
        xp: xp.overLvl, coins: coins.overLvl, moves: moves.overLvl,
        crit: crit.overLvl, reroll: reroll.overLvl, ban: ban.overLvl
      }
    };
  }

  return { LIST, BY, cost, baseCost, getUpgradeCost, perks, maxOf, OVER_MAX };
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
