/* ============ regions.js — Mapeamento das 9 Regiões do PokéSurvivor ============
 * Define faixas de IDs da Pokédex, lendários regionais e cores temáticas.
 */
(() => {
  const REGIONS_CONFIG = {
    kanto: {
      id: 'kanto',
      name: "Kanto",
      gen: 1,
      dexRange: [1, 151],
      legendaries: ["articuno", "zapdos", "moltres", "mewtwo", "mew"],
      themeColor: "#e63946",
      desc: "A região clássica onde tudo começou. Pokédex #001 a #151."
    },
    johto: {
      id: 'johto',
      name: "Johto",
      gen: 2,
      dexRange: [152, 251],
      legendaries: ["raikou", "entei", "suicune", "lugia", "ho-oh", "celebi"],
      themeColor: "#ffd166",
      desc: "Terra das torres sagradas e lendas ancestrais. Pokédex #152 a #251."
    },
    hoenn: {
      id: 'hoenn',
      name: "Hoenn",
      gen: 3,
      dexRange: [252, 386],
      legendaries: ["regirock", "regice", "registeel", "latias", "latios", "kyogre", "groudon", "rayquaza", "jirachi", "deoxys"],
      themeColor: "#06d6a0",
      desc: "Região de vasta terra e imensos oceanos. Pokédex #252 a #386."
    },
    sinnoh: {
      id: 'sinnoh',
      name: "Sinnoh",
      gen: 4,
      dexRange: [387, 493],
      legendaries: ["uxie", "mesprit", "azelf", "dialga", "palkia", "heatran", "regigigas", "giratina", "cresselia", "darkrai", "shaymin", "arceus"],
      themeColor: "#118ab2",
      desc: "O berço do tempo, espaço e criação. Pokédex #387 a #493."
    },
    unova: {
      id: 'unova',
      name: "Unova",
      gen: 5,
      dexRange: [494, 649],
      legendaries: ["victini", "cobalion", "terrakion", "virizion", "tornadus", "thundurus", "reshiram", "zekrom", "landorus", "kyurem", "keldeo", "meloetta", "genesect"],
      themeColor: "#8338ec",
      desc: "Metrópoles imponentes e forças da verdade e dos ideais. Pokédex #494 a #649."
    },
    kalos: {
      id: 'kalos',
      name: "Kalos",
      gen: 6,
      dexRange: [650, 721],
      legendaries: ["xerneas", "yveltal", "zygarde", "diancie", "hoopa", "volcanion"],
      themeColor: "#3a86ff",
      desc: "Beleza, luz e a energia da Mega Evolução. Pokédex #650 a #721."
    },
    alola: {
      id: 'alola',
      name: "Alola",
      gen: 7,
      dexRange: [722, 809],
      legendaries: ["tapu koko", "tapu lele", "tapu bulu", "tapu fini", "cosmog", "cosmoem", "solgaleo", "lunala", "nihilego", "buzzwole", "pheromosa", "xurkitree", "celesteela", "kartana", "guzzlord", "necrozma", "magearna", "marshadow", "poipole", "naganadel", "stakataka", "blacephalon", "zeraora", "meltan", "melmetal"],
      themeColor: "#fb5607",
      desc: "Ilhas tropicais paradisíacas e Ultra Criaturas. Pokédex #722 a #809."
    },
    galar: {
      id: 'galar',
      name: "Galar",
      gen: 8,
      dexRange: [810, 905],
      legendaries: ["zacian", "zamazenta", "eternatus", "kubfu", "urshifu", "zarude", "regieleki", "regidrago", "glastrier", "spectrier", "calyrex", "enamorus"],
      themeColor: "#ff006e",
      desc: "Reino de lendas antigas e poder colossal. Pokédex #810 a #905."
    },
    paldea: {
      id: 'paldea',
      name: "Paldea",
      gen: 9,
      dexRange: [906, 1025],
      legendaries: ["wo-chien", "chien-pao", "ting-lu", "chi-yu", "roaring moon", "iron valiant", "koraidon", "miraidon", "walking wake", "iron leaves", "okidogi", "munkidori", "fezandipiti", "ogerpon", "gouging fire", "raging bolt", "iron boulder", "iron crown", "terapagos", "pecharunt"],
      themeColor: "#70e000",
      desc: "Um vasto mundo aberto repleto de mistérios Terastal. Pokédex #906 a #1025."
    }
  };

  function getPokemonRegion(pokedexNumber) {
    const num = Number(pokedexNumber);
    for (const [key, region] of Object.entries(REGIONS_CONFIG)) {
      if (num >= region.dexRange[0] && num <= region.dexRange[1]) {
        return key;
      }
    }
    return 'kanto';
  }

  function getRegionConfig(regionKey) {
    if (!regionKey) return REGIONS_CONFIG.kanto;
    const k = String(regionKey).toLowerCase().trim();
    return REGIONS_CONFIG[k] || REGIONS_CONFIG.kanto;
  }

  function getRegionDexRange(regionKey) {
    const cfg = getRegionConfig(regionKey);
    return cfg ? cfg.dexRange : [1, 151];
  }

  function isLegendaryOfRegion(speciesNameOrDex, regionKey) {
    const cfg = getRegionConfig(regionKey);
    if (!cfg || !cfg.legendaries) return false;
    let name = '';
    if (typeof speciesNameOrDex === 'number') {
      if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[speciesNameOrDex]) {
        name = G.DEX_BY[speciesNameOrDex].name.toLowerCase();
      }
    } else if (typeof speciesNameOrDex === 'string') {
      name = speciesNameOrDex.toLowerCase().trim();
    }
    return cfg.legendaries.includes(name);
  }

  const exportObj = {
    REGIONS_CONFIG,
    getPokemonRegion,
    getRegionConfig,
    getRegionDexRange,
    isLegendaryOfRegion
  };

  if (typeof G === 'object') {
    G.Regions = exportObj;
    G.REGIONS_CONFIG = REGIONS_CONFIG;
    G.getPokemonRegion = getPokemonRegion;
    G.getRegionConfig = getRegionConfig;
    G.getRegionDexRange = getRegionDexRange;
    G.isLegendaryOfRegion = isLegendaryOfRegion;
  }

  if (typeof window !== 'undefined') {
    window.REGIONS_CONFIG = REGIONS_CONFIG;
    window.getPokemonRegion = getPokemonRegion;
    window.getRegionConfig = getRegionConfig;
    window.getRegionDexRange = getRegionDexRange;
    window.isLegendaryOfRegion = isLegendaryOfRegion;
  }

  if (typeof global !== 'undefined') {
    global.REGIONS_CONFIG = REGIONS_CONFIG;
    global.getPokemonRegion = getPokemonRegion;
    global.getRegionConfig = getRegionConfig;
    global.getRegionDexRange = getRegionDexRange;
    global.isLegendaryOfRegion = isLegendaryOfRegion;
    if (global.window) {
      global.window.REGIONS_CONFIG = REGIONS_CONFIG;
      global.window.getPokemonRegion = getPokemonRegion;
      global.window.getRegionConfig = getRegionConfig;
      global.window.getRegionDexRange = getRegionDexRange;
      global.window.isLegendaryOfRegion = isLegendaryOfRegion;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
})();
