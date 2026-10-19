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
  const BY = {};
  for (const u of LIST) BY[u.id] = u;

  /**
   * Custo base original de um upgrade para um nível determinado.
   */
  function baseCost(id, lvl) {
    const u = BY[id] || LIST[0];
    return Math.round(u.base * Math.pow(u.grow, lvl) / 10) * 10;
  }

  /**
   * Calcula o custo final de ouro escalonado pelo estágio evolutivo da espécie.
   * - Estágio 1 (Base / Inicial / Único): Multiplicador 1x
   * - Estágio 2 (Intermediário / 1ª Evo): Multiplicador 2x
   * - Estágio 3 (Final / Lendário): Multiplicador 3x
   *
   * @param {string|number} pokemonId Nome ou dex do Pokémon
   * @param {number} currentLevel Nível atual do upgrade (0 para o primeiro nível)
   * @param {string} [upgradeId='hp'] ID do upgrade
   * @returns {number} Custo final em ouro
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

    const base = baseCost(upgId, lvl);
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
   * Se pokemonId for fornecido, aplica o multiplicador pelo estágio evolutivo.
   */
  function cost(id, lvl, pokemonId = null) {
    if (pokemonId != null) {
      return getUpgradeCost(pokemonId, lvl, id);
    }
    return baseCost(id, lvl);
  }

  /** Niveles comprados -> modificadores para G.Player. */
  function perks(levels = {}) {
    // Nunca por encima del máximo (una partida editada a mano no da más poder).
    const L = id => Math.max(0, Math.min(BY[id].max, Math.floor(+levels[id] || 0)));
    return {
      hp: L('hp') * 8,
      atkMul: 1 + L('atk') * 0.04,
      spdMul: 1 + L('spd') * 0.03,
      cdMul: 1 - L('cd') * 0.03,
      dmgReduce: L('def') * 0.02,
      regen: L('regen') * 0.2,
      magnetMul: 1 + L('magnet') * 0.12,
      xpMul: 1 + L('xp') * 0.05,
      coinMul: 1 + L('coins') * 0.08,
      startMoves: 1 + L('moves'),
      crit: L('crit') * 0.03,
      rerolls: L('reroll'),
      bans: L('ban')
    };
  }

  return { LIST, BY, cost, baseCost, getUpgradeCost, perks };
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
