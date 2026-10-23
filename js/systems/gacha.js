/* ============ gacha.js — un banner por generación ============
 * Lógica pura: no toca la interfaz. La pantalla está en ui/gacha-ui.js.
 *
 * 9 banners (Kanto ... Paldea). Cada uno con su propio pity.
 * Probabilidades por tirada:  1★ 45% · 2★ 30% · 3★ 17% · 4★ 6.5% · 5★ 1.5%
 * Garantías:
 *   - la tirada ×10 trae al menos un 4★ o superior
 *   - a las 70 tiradas sin 5★ en ese banner, el siguiente es 5★ seguro
 * Shiny: 1 de cada 100 tiradas sale en su versión shiny.
 * Repetidos: se convierten en Pokémonedas (los shiny repetidos, el triple).
 *
 * Se tira con TICKETS (se consiguen jugando):
 *   ×1   1 ticket
 *   ×10  10 tickets normales, o 1 ticket ×10 (eliges con qué)
 */
G.Gacha = (() => {
  /** ¿Qué gasta una tirada de n? → { t1, t10 } o null si no te llega. */
  /** @param use  't1' (tickets normales) o 't10' (un ticket ×10, sólo para la ×10) */
  function costOf(save, n, use = 't1') {
    const t = save.tickets || { t1: 0, t10: 0 };
    if (n === 10 && use === 't10') return t.t10 >= 1 ? { t1: 0, t10: 1 } : null;
    return t.t1 >= n ? { t1: n, t10: 0 } : null;
  }
  const RATES = [[1, 70], [2, 20], [3, 8], [4, 1.6], [5, 0.4]];
  const PITY_5 = 250;
  const SHINY_RATE = 1 / 250;
  const REFUND = { 1: 15, 2: 30, 3: 60, 4: 120, 5: 300 };
  const ROULETTE_COST = 100;
  const ROULETTE_DUPLICATE_COINS = 250;
  let forceShiny = 0;           // para pruebas y vídeos: las N próximas salen shiny
  let forceLegendary = 0;       // para testes da roleta lendária

  const RARITY_NAME = { 1: 'Comum', 2: 'Incomum', 3: 'Raro', 4: 'Épico', 5: 'Lendário' };
  const RARITY_COLOR = { 1: '#9fb1c9', 2: '#5fe08a', 3: '#4fb4ff', 4: '#c47bff', 5: '#ffcb3d' };

  const BANNERS = [
    { gen: 1, name: 'Kanto',   color: ['#3a1d6e', '#1b2f78', '#0f4d6e'] },
    { gen: 2, name: 'Johto',   color: ['#5a2a1a', '#7a3d1f', '#2d4a6e'] },
    { gen: 3, name: 'Hoenn',   color: ['#0f4d6e', '#1b6a5a', '#2a3d78'] },
    { gen: 4, name: 'Sinnoh',  color: ['#2a2a5e', '#3d3d8a', '#5a2a6e'] },
    { gen: 5, name: 'Unova',   color: ['#1a1a2a', '#3a3a4e', '#2a4a6e'] },
    { gen: 6, name: 'Kalos',   color: ['#4a1a3a', '#2a3a7a', '#1a5a7a'] },
    { gen: 7, name: 'Alola',   color: ['#7a3a1a', '#1a6a6a', '#2a4a8a'] },
    { gen: 8, name: 'Galar',   color: ['#4a1a5a', '#1a3a6a', '#6a1a3a'] },
    { gen: 9, name: 'Paldea',  color: ['#6a2a1a', '#4a1a5a', '#1a4a6a'] }
  ];

  function inBanner(p, gen) { return p.gen === gen && !!G.SPRITE_META[p.dex]; }

  /** Pokémon de una rareza en un banner. */
  function pool(rarity, gen) { return G.DEX.filter(p => inBanner(p, gen) && p.rarity === rarity); }

  /** Pool no vacío más cercano (algunas generaciones tienen rarezas casi vacías). */
  function poolNear(rarity, gen) {
    for (const d of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
      const r = rarity + d;
      if (r < 1 || r > 5) continue;
      const p = pool(r, gen);
      if (p.length) return { rarity: r, list: p };
    }
    return { rarity, list: G.DEX.filter(p => inBanner(p, gen)) };
  }

  function rollRarity(min = 1) {
    const rates = RATES.filter(([r]) => r >= min);
    const total = rates.reduce((a, [, w]) => a + w, 0);
    let x = Math.random() * total;
    for (const [r, w] of rates) { x -= w; if (x <= 0) return r; }
    return rates[rates.length - 1][0];
  }

  /** Los 3 más fuertes de la generación, para el cartel del banner. */
  function featured(gen) {
    return G.DEX.filter(p => inBanner(p, gen) && p.rarity === 5)
      .sort((a, b) => b.bst - a.bst).slice(0, 3).map(p => p.dex);
  }

  /**
   * Hace `n` tiradas en el banner `gen` sobre el guardado `save` (lo modifica).
   * Devuelve null si no hay monedas, o la lista de resultados:
   *   { dex, rarity, shiny, isNew, refund }
   */
  function pull(save, n, gen = 1, use = 't1') {
    const cost = costOf(save, n, use);
    if (!cost) return null;
    save.tickets.t1 -= cost.t1;
    save.tickets.t10 -= cost.t10;
    save.pity = save.pity || {};
    save.shiny = save.shiny || {};
    save.pity[gen] = save.pity[gen] || 0;

    const out = [];
    for (let i = 0; i < n; i++) {
      save.pity[gen]++;
      let want;
      if (save.pity[gen] >= PITY_5) want = 5;
      else if (n === 10 && i === n - 1 && !out.some(r => r.rarity >= 4)) want = rollRarity(4);
      else want = rollRarity();

      const { rarity, list } = poolNear(want, gen);
      if (rarity === 5) save.pity[gen] = 0;
      let mon = G.U.pick(list);
      let shiny = G.Sprites.hasShiny(mon.dex) && (forceShiny > 0 ? (forceShiny--, true) : Math.random() < SHINY_RATE);
      // Los shiny no se repiten: si ya tienes ese, sale otro de la misma rareza
      // cuyo shiny te falte; si los tienes todos, sale normal.
      if (shiny && save.shiny[mon.dex]) {
        const missing = list.filter(p => G.Sprites.hasShiny(p.dex) && !save.shiny[p.dex]);
        if (missing.length) mon = G.U.pick(missing);
        else shiny = false;
      }

      let isNew = false, refund = 0;
      if (shiny) {
        isNew = !save.shiny[mon.dex];
        if (isNew) save.shiny[mon.dex] = { at: Date.now(), from: 'gacha' };
        else refund = REFUND[rarity] * 3;
        if (!save.owned[mon.dex]) save.owned[mon.dex] = { at: Date.now(), from: 'gacha' };
      } else {
        isNew = !save.owned[mon.dex];
        if (isNew) save.owned[mon.dex] = { at: Date.now(), from: 'gacha' };
        else refund = REFUND[rarity];
      }
      save.coins += refund;
      out.push({ dex: mon.dex, rarity, shiny, isNew, refund });
    }
    save.stats.pulls = (save.stats.pulls || 0) + n;
    return out;
  }

  function canAffordRoulette(save, count = 1) {
    const t = (save && save.tickets) || { t1: 0, t10: 0 };
    return (t.t1 || 0) >= ROULETTE_COST * count;
  }

  /**
   * Sorteio Especial da Roleta com 5.000 Tickets.
   * Pool: TODOS os Pokémon do jogo (G.DEX - 966 espécies).
   * Probabilidades:
   *   - 1% Pokémon Shiny aleatório
   *   - 5% Pokémon Lendário aleatório
   *   - 94% Pokémon Normal aleatório (~90%)
   * Regra de Duplicata:
   *   - Se o Pokémon já estiver na Pokédex do jogador: ganha 1.000 PokéMoedas para Melhorias!
   *   - Se for novo: registra e desbloqueia na Pokédex.
   */
  function pullRoulette(save, count = 1, gen = 0) {
    if (!save) return null;
    save.tickets = save.tickets || { t1: 0, t10: 0 };
    const totalCost = ROULETTE_COST * count;
    if ((save.tickets.t1 || 0) < totalCost) return null;

    save.tickets.t1 -= totalCost;
    save.coins = save.coins || 0;
    save.owned = save.owned || {};
    save.shiny = save.shiny || {};
    save.stats = save.stats || {};

    // Filtra exclusivamente pela geração/região selecionada se gen > 0
    let poolSource = G.DEX;
    if (gen > 0) {
      const genMons = G.DEX.filter(p => p.gen === gen);
      if (genMons.length > 0) poolSource = genMons;
    }

    const allLegs = poolSource.filter(p => p.rarity === 5 || p.legendary || p.leg);
    const allNorms = poolSource.filter(p => p.rarity < 5 && !p.legendary && !p.leg);
    const allShinies = poolSource.filter(p => G.Sprites && G.Sprites.hasShiny ? G.Sprites.hasShiny(p.dex) : true);

    const out = [];
    for (let i = 0; i < count; i++) {
      const roll = Math.random() * 100;
      let isShiny = false;
      let mon = null;
      let rarity = 1;

      if (forceShiny > 0) {
        forceShiny--;
        isShiny = true;
        mon = G.U.pick(allShinies.length ? allShinies : poolSource);
        rarity = mon.rarity || (mon.legendary ? 5 : 3);
      } else if (forceLegendary > 0) {
        forceLegendary--;
        mon = G.U.pick(allLegs.length ? allLegs : poolSource);
        rarity = 5;
      } else if (roll < 0.02) {
        // 0.02% Chance: Shiny Lendário (Apex Jackpot - Quase Impossível, 1 em 5.000)
        isShiny = true;
        mon = G.U.pick(allLegs.length ? allLegs : allShinies);
        rarity = 5;
      } else if (roll < 0.52) {
        // 0.50% Chance: Shiny Comum (Raríssimo, 1 em 200)
        isShiny = true;
        mon = G.U.pick(allShinies.length ? allShinies : poolSource);
        rarity = mon.rarity || (mon.legendary ? 5 : 3);
      } else if (roll < 0.92) {
        // 0.40% Chance: Lendário Normal (Raríssimo, 1 em 250)
        mon = G.U.pick(allLegs.length ? allLegs : poolSource);
        rarity = mon.rarity || 5;
      } else {
        // 99.08% Chance: Pokémon Normal (Foco esmagador em Comuns e Estágios Básicos)
        mon = G.U.pick(allNorms.length ? allNorms : poolSource);
        rarity = mon.rarity || 1;
      }

      let isNew = false;
      let refund = 0;

      // Verifica se já possui o Pokémon na Dex
      if (save.owned[mon.dex]) {
        // Já possui na Dex -> Ganha 1.000 PokéMoedas para melhorias!
        save.coins += ROULETTE_DUPLICATE_COINS;
        refund = ROULETTE_DUPLICATE_COINS;
        isNew = false;
        if (isShiny && !save.shiny[mon.dex]) {
          save.shiny[mon.dex] = { at: Date.now(), from: 'gacha' };
        }
      } else {
        // Inédito na Dex -> Registra na coleção
        save.owned[mon.dex] = { at: Date.now(), from: 'gacha' };
        if (isShiny) {
          save.shiny[mon.dex] = { at: Date.now(), from: 'gacha' };
        }
        isNew = true;
        refund = 0;
      }

      // Regra de Liberação Automática do Estágio 1:
      // Se tirar um Pokémon de estágio 2 ou 3 (ex: Charizard), libera o estágio 1 (Charmander) para ser jogável!
      let baseUnlockedDex = null;
      let baseUnlockedName = null;
      const getBase = (typeof G === 'object' && typeof G.getBaseAncestor === 'function')
        ? G.getBaseAncestor
        : (typeof getBaseAncestor === 'function' ? getBaseAncestor : null);

      if (getBase) {
        const rootDex = getBase(mon.dex);
        if (rootDex && Number(rootDex) !== Number(mon.dex)) {
          const rootDexNum = Number(rootDex);
          if (!save.owned[rootDexNum]) {
            save.owned[rootDexNum] = { at: Date.now(), from: 'gacha_base_unlock' };
            baseUnlockedDex = rootDexNum;
            const rootMon = (G.DEX_BY && G.DEX_BY[rootDexNum]) || (G.DEX && G.DEX.find(p => p.dex === rootDexNum));
            baseUnlockedName = rootMon ? rootMon.name : ('#' + rootDexNum);
          }
        }
      }

      save.stats.pulls = (save.stats.pulls || 0) + 1;
      out.push({
        dex: mon.dex,
        rarity,
        shiny: isShiny,
        isNew,
        refund,
        isLegendary: rarity === 5 || !!mon.legendary,
        name: mon.name,
        baseUnlockedDex,
        baseUnlockedName
      });
    }

    return out;
  }

  return {
    debugForceShiny(n = 1) { forceShiny = n; },
    debugForceLegendary(n = 1) { forceLegendary = n; },
    ROULETTE_COST,
    ROULETTE_DUPLICATE_COINS,
    canAffordRoulette,
    pullRoulette,
    costOf,
    RATES,
    PITY_5,
    SHINY_RATE,
    REFUND,
    RARITY_NAME,
    RARITY_COLOR,
    BANNERS,
    pool,
    featured,
    pull
  };
})();
