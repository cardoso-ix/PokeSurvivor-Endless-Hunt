/* ============ evolutions.js — tabelas de evolução de Pokémon ============
 * Mapeia as evoluções lineares e ramificadas das espécies, incluindo
 * todos os iniciais (Gerações 1 a 9) e as espécies mais comuns das Gens 1 a 3.
 */

const POKEMON_EVOLUTIONS = {
  // ==========================================
  // INICIAIS — GERAÇÃO 1
  // ==========================================
  "bulbasaur": {
    next: "ivysaur",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "ivysaur": {
    next: "venusaur",
    level: 32,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "charmander": {
    next: "charmeleon",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "charmeleon": {
    next: "charizard",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "squirtle": {
    next: "wartortle",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "wartortle": {
    next: "blastoise",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "psyduck": {
    next: "golduck",
    level: 33,
    statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.15 }
  },
  "slowpoke": [
    { next: "slowbro", level: 37, statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.05 } },
    { next: "slowking", level: 37, statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.05 } }
  ],

  // ==========================================
  // INICIAIS — GERAÇÃO 2
  // ==========================================
  "chikorita": {
    next: "bayleef",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "bayleef": {
    next: "meganium",
    level: 32,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "cyndaquil": {
    next: "quilava",
    level: 14,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "quilava": {
    next: "typhlosion",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "totodile": {
    next: "croconaw",
    level: 18,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "croconaw": {
    next: "feraligatr",
    level: 30,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },

  // ==========================================
  // INICIAIS — GERAÇÃO 3
  // ==========================================
  "treecko": {
    next: "grovyle",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "grovyle": {
    next: "sceptile",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.20 }
  },
  "torchic": {
    next: "combusken",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "combusken": {
    next: "blaziken",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "mudkip": {
    next: "marshtomp",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "marshtomp": {
    next: "swampert",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },

  // ==========================================
  // INICIAIS — GERAÇÃO 4
  // ==========================================
  "turtwig": {
    next: "grotle",
    level: 18,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.05 }
  },
  "grotle": {
    next: "torterra",
    level: 32,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.10 }
  },
  "chimchar": {
    next: "monferno",
    level: 14,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "monferno": {
    next: "infernape",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.20 }
  },
  "piplup": {
    next: "prinplup",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "prinplup": {
    next: "empoleon",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },

  // ==========================================
  // INICIAIS — GERAÇÃO 5
  // ==========================================
  "snivy": {
    next: "servine",
    level: 17,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "servine": {
    next: "serperior",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.20 }
  },
  "tepig": {
    next: "pignite",
    level: 17,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.05 }
  },
  "pignite": {
    next: "emboar",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.10 }
  },
  "oshawott": {
    next: "dewott",
    level: 17,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "dewott": {
    next: "samurott",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },

  // ==========================================
  // INICIAIS — GERAÇÃO 6
  // ==========================================
  "chespin": {
    next: "quilladin",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.05 }
  },
  "quilladin": {
    next: "chesnaught",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.10 }
  },
  "fennekin": {
    next: "braixen",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "braixen": {
    next: "delphox",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.20 }
  },
  "froakie": {
    next: "frogadier",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.20 }
  },
  "frogadier": {
    next: "greninja",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.25 }
  },

  // ==========================================
  // INICIAIS — GERAÇÃO 7
  // ==========================================
  "rowlet": {
    next: "dartrix",
    level: 17,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "dartrix": {
    next: "decidueye",
    level: 34,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "litten": {
    next: "torracat",
    level: 17,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "torracat": {
    next: "incineroar",
    level: 34,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.10 }
  },
  "popplio": {
    next: "brionne",
    level: 17,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "brionne": {
    next: "primarina",
    level: 34,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },

  // ==========================================
  // INICIAIS — GERAÇÃO 8
  // ==========================================
  "grookey": {
    next: "thwackey",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "thwackey": {
    next: "rillaboom",
    level: 35,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "scorbunny": {
    next: "raboot",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.20 }
  },
  "raboot": {
    next: "cinderace",
    level: 35,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.25 }
  },
  "sobble": {
    next: "drizzile",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "drizzile": {
    next: "inteleon",
    level: 35,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.20 }
  },

  // ==========================================
  // INICIAIS — GERAÇÃO 9
  // ==========================================
  "sprigatito": {
    next: "floragato",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.20 }
  },
  "floragato": {
    next: "meowscarada",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.25 }
  },
  "fuecoco": {
    next: "crocalor",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.05 }
  },
  "crocalor": {
    next: "skeledirge",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.10 }
  },
  "quaxly": {
    next: "quaxwell",
    level: 16,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "quaxwell": {
    next: "quaquaval",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },

  // ==========================================
  // COMUNS — GERAÇÃO 1
  // ==========================================
  "caterpie": {
    next: "metapod",
    level: 7,
    statMultiplier: { hp: 1.15, atk: 1.10, speed: 1.05 }
  },
  "metapod": {
    next: "butterfree",
    level: 10,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.20 }
  },
  "weedle": {
    next: "kakuna",
    level: 7,
    statMultiplier: { hp: 1.15, atk: 1.10, speed: 1.05 }
  },
  "kakuna": {
    next: "beedrill",
    level: 10,
    statMultiplier: { hp: 1.25, atk: 1.35, speed: 1.20 }
  },
  "pidgey": {
    next: "pidgeotto",
    level: 18,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.15 }
  },
  "pidgeotto": {
    next: "pidgeot",
    level: 36,
    statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.20 }
  },
  "rattata": {
    next: "raticate",
    level: 20,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.20 }
  },
  "spearow": {
    next: "fearow",
    level: 20,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.20 }
  },
  "ekans": {
    next: "arbok",
    level: 22,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.15 }
  },
  "pichu": {
    next: "pikachu",
    level: 15,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.20 }
  },
  "pikachu": {
    next: "raichu",
    level: 22,
    statMultiplier: { hp: 1.30, atk: 1.35, speed: 1.20 }
  },
  "sandshrew": {
    next: "sandslash",
    level: 22,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.15 }
  },
  "nidoran♀": {
    next: "nidorina",
    level: 16,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.10 }
  },
  "nidoranf": {
    next: "nidorina",
    level: 16,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.10 }
  },
  "nidorina": {
    next: "nidoqueen",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "nidoran♂": {
    next: "nidorino",
    level: 16,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.10 }
  },
  "nidoranm": {
    next: "nidorino",
    level: 16,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.10 }
  },
  "nidorino": {
    next: "nidoking",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "clefairy": {
    next: "clefable",
    level: 25,
    statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.15 }
  },
  "vulpix": {
    next: "ninetales",
    level: 25,
    statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.25 }
  },
  "jigglypuff": {
    next: "wigglytuff",
    level: 25,
    statMultiplier: { hp: 1.35, atk: 1.25, speed: 1.10 }
  },
  "zubat": {
    next: "golbat",
    level: 22,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.20 }
  },
  "golbat": {
    next: "crobat",
    level: 36,
    statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.30 }
  },
  "oddish": {
    next: "gloom",
    level: 21,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.05 }
  },
  "gloom": [
    { next: "vileplume", level: 36, statMultiplier: { hp: 1.30, atk: 1.35, speed: 1.10 } },
    { next: "bellossom", level: 36, statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.15 } }
  ],
  "paras": {
    next: "parasect",
    level: 24,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.05 }
  },
  "venonat": {
    next: "venomoth",
    level: 31,
    statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.20 }
  },
  "diglett": {
    next: "dugtrio",
    level: 26,
    statMultiplier: { hp: 1.20, atk: 1.30, speed: 1.30 }
  },
  "meowth": {
    next: "persian",
    level: 28,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.25 }
  },
  "mankey": {
    next: "primeape",
    level: 28,
    statMultiplier: { hp: 1.25, atk: 1.35, speed: 1.20 }
  },
  "growlithe": {
    next: "arcanine",
    level: 25,
    statMultiplier: { hp: 1.35, atk: 1.40, speed: 1.25 }
  },
  "poliwag": {
    next: "poliwhirl",
    level: 25,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.15 }
  },
  "poliwhirl": [
    { next: "poliwrath", level: 36, statMultiplier: { hp: 1.30, atk: 1.35, speed: 1.10 } },
    { next: "politoed", level: 36, statMultiplier: { hp: 1.35, atk: 1.30, speed: 1.10 } }
  ],
  "abra": {
    next: "kadabra",
    level: 16,
    statMultiplier: { hp: 1.15, atk: 1.30, speed: 1.25 }
  },
  "kadabra": {
    next: "alakazam",
    level: 36,
    statMultiplier: { hp: 1.25, atk: 1.40, speed: 1.30 }
  },
  "machop": {
    next: "machoke",
    level: 28,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.10 }
  },
  "machoke": {
    next: "machamp",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.40, speed: 1.15 }
  },
  "bellsprout": {
    next: "weepinbell",
    level: 21,
    statMultiplier: { hp: 1.20, atk: 1.25, speed: 1.10 }
  },
  "weepinbell": {
    next: "victreebel",
    level: 36,
    statMultiplier: { hp: 1.30, atk: 1.35, speed: 1.15 }
  },
  "tentacool": {
    next: "tentacruel",
    level: 30,
    statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.25 }
  },
  "geodude": {
    next: "graveler",
    level: 25,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.05 }
  },
  "graveler": {
    next: "golem",
    level: 36,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.10 }
  },
  "ponyta": {
    next: "rapidash",
    level: 40,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.25 }
  },
  "magnemite": {
    next: "magneton",
    level: 30,
    statMultiplier: { hp: 1.25, atk: 1.35, speed: 1.15 }
  },
  "gastly": {
    next: "haunter",
    level: 25,
    statMultiplier: { hp: 1.20, atk: 1.30, speed: 1.25 }
  },
  "haunter": {
    next: "gengar",
    level: 36,
    statMultiplier: { hp: 1.30, atk: 1.40, speed: 1.30 }
  },
  "magikarp": {
    next: "gyarados",
    level: 20,
    statMultiplier: { hp: 1.60, atk: 1.80, speed: 1.30 }
  },
  "eevee": [
    { next: "vaporeon", level: 20, statMultiplier: { hp: 1.30, atk: 1.20, speed: 1.05 } },
    { next: "jolteon", level: 20, statMultiplier: { hp: 1.10, atk: 1.25, speed: 1.35 } },
    { next: "flareon", level: 20, statMultiplier: { hp: 1.15, atk: 1.40, speed: 1.10 } },
    { next: "espeon", level: 20, statMultiplier: { hp: 1.15, atk: 1.35, speed: 1.30 } },
    { next: "umbreon", level: 20, statMultiplier: { hp: 1.35, atk: 1.15, speed: 1.10 } },
    { next: "leafeon", level: 20, statMultiplier: { hp: 1.20, atk: 1.30, speed: 1.20 } },
    { next: "glaceon", level: 20, statMultiplier: { hp: 1.20, atk: 1.35, speed: 1.10 } },
    { next: "sylveon", level: 20, statMultiplier: { hp: 1.30, atk: 1.25, speed: 1.10 } }
  ],
  "dratini": {
    next: "dragonair",
    level: 30,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "dragonair": {
    next: "dragonite",
    level: 55,
    statMultiplier: { hp: 1.40, atk: 1.45, speed: 1.20 }
  },

  // ==========================================
  // COMUNS — GERAÇÃO 2
  // ==========================================
  "sentret": {
    next: "furret",
    level: 15,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.20 }
  },
  "hoothoot": {
    next: "noctowl",
    level: 20,
    statMultiplier: { hp: 1.30, atk: 1.25, speed: 1.15 }
  },
  "ledyba": {
    next: "ledian",
    level: 18,
    statMultiplier: { hp: 1.25, atk: 1.20, speed: 1.20 }
  },
  "spinarak": {
    next: "ariados",
    level: 22,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.10 }
  },
  "mareep": {
    next: "flaaffy",
    level: 15,
    statMultiplier: { hp: 1.20, atk: 1.25, speed: 1.10 }
  },
  "flaaffy": {
    next: "ampharos",
    level: 30,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.15 }
  },
  "marill": {
    next: "azumarill",
    level: 18,
    statMultiplier: { hp: 1.35, atk: 1.30, speed: 1.10 }
  },
  "wooper": {
    next: "quagsire",
    level: 20,
    statMultiplier: { hp: 1.30, atk: 1.25, speed: 1.05 }
  },
  "larvitar": {
    next: "pupitar",
    level: 30,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "pupitar": {
    next: "tyranitar",
    level: 55,
    statMultiplier: { hp: 1.40, atk: 1.45, speed: 1.15 }
  },

  // ==========================================
  // COMUNS — GERAÇÃO 3
  // ==========================================
  "poochyena": {
    next: "mightyena",
    level: 18,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.15 }
  },
  "zigzagoon": {
    next: "linoone",
    level: 20,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.30 }
  },
  "wurmple": [
    { next: "silcoon", level: 7, statMultiplier: { hp: 1.15, atk: 1.10, speed: 1.05 } },
    { next: "cascoon", level: 7, statMultiplier: { hp: 1.15, atk: 1.10, speed: 1.05 } }
  ],
  "silcoon": {
    next: "beautifly",
    level: 10,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.15 }
  },
  "cascoon": {
    next: "dustox",
    level: 10,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "lotad": {
    next: "lombre",
    level: 14,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.10 }
  },
  "lombre": {
    next: "ludicolo",
    level: 30,
    statMultiplier: { hp: 1.30, atk: 1.30, speed: 1.15 }
  },
  "seedot": {
    next: "nuzleaf",
    level: 14,
    statMultiplier: { hp: 1.20, atk: 1.20, speed: 1.10 }
  },
  "nuzleaf": {
    next: "shiftry",
    level: 30,
    statMultiplier: { hp: 1.30, atk: 1.35, speed: 1.20 }
  },
  "taillow": {
    next: "swellow",
    level: 22,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.30 }
  },
  "wingull": {
    next: "pelipper",
    level: 25,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.15 }
  },
  "ralts": {
    next: "kirlia",
    level: 20,
    statMultiplier: { hp: 1.20, atk: 1.25, speed: 1.15 }
  },
  "kirlia": [
    { next: "gardevoir", level: 30, statMultiplier: { hp: 1.25, atk: 1.35, speed: 1.15 } },
    { next: "gallade", level: 30, statMultiplier: { hp: 1.25, atk: 1.35, speed: 1.15 } }
  ],
  "shroomish": {
    next: "breloom",
    level: 23,
    statMultiplier: { hp: 1.25, atk: 1.40, speed: 1.15 }
  },
  "slakoth": {
    next: "vigoroth",
    level: 18,
    statMultiplier: { hp: 1.25, atk: 1.30, speed: 1.30 }
  },
  "vigoroth": {
    next: "slaking",
    level: 36,
    statMultiplier: { hp: 1.50, atk: 1.50, speed: 1.20 }
  },
  "aron": {
    next: "lairon",
    level: 32,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.05 }
  },
  "lairon": {
    next: "aggron",
    level: 42,
    statMultiplier: { hp: 1.35, atk: 1.35, speed: 1.10 }
  },
  "bagon": {
    next: "shelgon",
    level: 30,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "shelgon": {
    next: "salamence",
    level: 50,
    statMultiplier: { hp: 1.40, atk: 1.45, speed: 1.25 }
  },
  "beldum": {
    next: "metang",
    level: 20,
    statMultiplier: { hp: 1.25, atk: 1.25, speed: 1.10 }
  },
  "metang": {
    next: "metagross",
    level: 45,
    statMultiplier: { hp: 1.40, atk: 1.45, speed: 1.15 }
  }
};

/**
 * Retorna os dados de evolução de uma espécie (objeto de evolução linear,
 * array de evoluções ramificadas, ou null se não houver evolução disponível).
 *
 * @param {string|number} speciesId Nome da espécie (ex: 'charmander') ou ID numérico da Pokédex (ex: 4).
 * @returns {Object|Array|null}
 */
function getEvolutionData(speciesId) {
  if (speciesId == null) return null;

  let key = speciesId;
  // Suporte a resolução direta caso seja passado o número da Pokédex
  if (typeof key === 'number') {
    if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[key]) {
      key = G.DEX_BY[key].name;
    } else if (typeof G === 'object' && Array.isArray(G.DEX)) {
      const found = G.DEX.find(p => p.dex === key);
      if (found) key = found.name;
    }
  }

  if (typeof key !== 'string') return null;

  key = key.toLowerCase().trim();
  return POKEMON_EVOLUTIONS[key] || null;
}

/**
 * Retorna os dados da espécie anterior (devolução) na árvore evolutiva.
 * @param {string|number} speciesId Nome da espécie ou ID numérico
 * @returns {Object|null} { prev: string, level: number } ou null
 */
function getDevolutionData(speciesId) {
  if (speciesId == null) return null;

  let key = speciesId;
  if (typeof key === 'number') {
    if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[key]) {
      key = G.DEX_BY[key].name;
    } else if (typeof G === 'object' && Array.isArray(G.DEX)) {
      const found = G.DEX.find(p => p.dex === key);
      if (found) key = found.name;
    }
  }

  if (typeof key !== 'string') return null;
  key = key.toLowerCase().trim();

  for (const [parent, val] of Object.entries(POKEMON_EVOLUTIONS)) {
    if (Array.isArray(val)) {
      const match = val.find(e => e.next.toLowerCase() === key);
      if (match) return { prev: parent, level: match.level };
    } else if (val && val.next && val.next.toLowerCase() === key) {
      return { prev: parent, level: val.level };
    }
  }
  return null;
}

// ==========================================
// ELEGIBILIDADE PARA INICIAR PARTIDA
// ==========================================

/**
 * Conjunto otimizado de todas as formas evoluídas derivadas (intermediárias e finais).
 * Gerado dinamicamente a partir de POKEMON_EVOLUTIONS.
 */
const EVOLVED_SPECIES_SET = new Set();

/**
 * Mapa reverso onde cada evolução aponta para seu pai imediato.
 * Ex: parentMap['charizard'] = 'charmeleon', parentMap['charmeleon'] = 'charmander'
 */
const EVOLUTION_PARENT_MAP = {};

function buildEvolvedSpeciesSet() {
  EVOLVED_SPECIES_SET.clear();
  for (const k in EVOLUTION_PARENT_MAP) delete EVOLUTION_PARENT_MAP[k];

  for (const [parent, val] of Object.entries(POKEMON_EVOLUTIONS)) {
    const parentKey = parent.toLowerCase().trim();
    if (Array.isArray(val)) {
      for (const e of val) {
        if (e && e.next) {
          const nextKey = e.next.toLowerCase().trim();
          EVOLVED_SPECIES_SET.add(nextKey);
          EVOLUTION_PARENT_MAP[nextKey] = parentKey;
        }
      }
    } else if (val && val.next) {
      const nextKey = val.next.toLowerCase().trim();
      EVOLVED_SPECIES_SET.add(nextKey);
      EVOLUTION_PARENT_MAP[nextKey] = parentKey;
    }
  }
}
buildEvolvedSpeciesSet();

/**
 * Localiza recursivamente a Forma Base (ancestral inicial) daquela linha evolutiva.
 * Se a espécie já for base ou estágio único (ex: Tauros, Lapras, Charmander), retorna ela mesma.
 * Suporta busca por nome ('charizard') ou número dex (6).
 *
 * @param {string|number} speciesId Nome ou número dex do Pokémon
 * @returns {string|number} Espécie raiz correspondente (mantém tipo numérico se passado número)
 */
function getBaseAncestor(speciesId) {
  if (!speciesId) return speciesId;

  const isNumeric = typeof speciesId === 'number' || /^\d+$/.test(String(speciesId).trim());
  let name = '';

  if (isNumeric) {
    const dexNum = Number(speciesId);
    if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[dexNum]) {
      name = G.DEX_BY[dexNum].name.toLowerCase().trim();
    }
  }
  if (!name) {
    name = String(speciesId).toLowerCase().trim();
  }

  // Percorre recursivamente o mapa reverso de pais até a raiz
  let current = name;
  const visited = new Set();
  while (current && EVOLUTION_PARENT_MAP[current] && !visited.has(current)) {
    visited.add(current);
    current = EVOLUTION_PARENT_MAP[current];
  }

  // Se o input foi um número dex, retorna o número dex da forma base correspondente
  if (isNumeric) {
    if (typeof G === 'object' && Array.isArray(G.DEX)) {
      const rootMon = G.DEX.find(p => p.name.toLowerCase().trim() === current);
      if (rootMon) return rootMon.dex;
    }
  }

  return current;
}

/**
 * Tabela de Lendários e Míticos oficiais de todas as gerações.
 */
const LEGENDARY_MYTHICAL_SET = new Set([
  // Gen 1
  'articuno', 'zapdos', 'moltres', 'mewtwo', 'mew',
  // Gen 2
  'raikou', 'entei', 'suicune', 'lugia', 'ho-oh', 'celebi',
  // Gen 3
  'regirock', 'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys',
  // Gen 4
  'uxie', 'mesprit', 'azelf', 'dialga', 'palkia', 'heatran', 'regigigas', 'giratina', 'cresselia', 'phione', 'manaphy', 'darkrai', 'shaymin', 'arceus',
  // Gen 5
  'victini', 'cobalion', 'terrakion', 'virizion', 'tornadus', 'thundurus', 'reshiram', 'zekrom', 'landorus', 'kyurem', 'keldeo', 'meloetta', 'genesect',
  // Gen 6
  'xerneas', 'yveltal', 'zygarde', 'diancie', 'hoopa', 'volcanion',
  // Gen 7
  'type: null', 'silvally', 'tapu koko', 'tapu lele', 'tapu bulu', 'tapu fini', 'cosmog', 'cosmoem', 'solgaleo', 'lunala',
  'nihilego', 'buzzwole', 'pheromosa', 'xurkitree', 'celesteela', 'kartana', 'guzzlord', 'necrozma', 'magearna', 'marshadow',
  'poipole', 'naganadel', 'stakataka', 'blacephalon', 'zeraora', 'meltan', 'melmetal',
  // Gen 8
  'zacian', 'zamazenta', 'eternatus', 'kubfu', 'urshifu', 'zarude', 'regieleki', 'regidrago', 'glastrier', 'spectrier', 'calyrex', 'enamorus',
  // Gen 9
  'wo-chien', 'chien-pao', 'ting-lu', 'chi-yu', 'koraidon', 'miraidon', 'okidogi', 'munkidori', 'fezandipiti', 'ogerpon', 'terapagos', 'pecharunt'
]);

/**
 * Verifica se um Pokémon é Lendário ou Mítico
 * @param {string|number} pokemonId Nome ou número dex do Pokémon
 * @returns {boolean}
 */
function isLegendaryOrMythical(pokemonId) {
  if (pokemonId == null) return false;

  let name = '';
  if (typeof pokemonId === 'number' || /^\d+$/.test(String(pokemonId).trim())) {
    const dexNum = Number(pokemonId);
    if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[dexNum]) {
      const mon = G.DEX_BY[dexNum];
      if (mon.leg) return true;
      name = mon.name.toLowerCase().trim();
    }
  } else {
    name = String(pokemonId).toLowerCase().trim();
  }

  // Verifica no conjunto explícito de lendários e míticos
  if (name && LEGENDARY_MYTHICAL_SET.has(name)) return true;

  // Verifica no G.DEX se possui a flag leg
  if (typeof G === 'object' && Array.isArray(G.DEX)) {
    const found = G.DEX.find(p => p.name.toLowerCase().trim() === name || p.dex === Number(pokemonId));
    if (found && found.leg) return true;
  }

  return false;
}

/**
 * Validador de elegibilidade para iniciar partidas no PokéSurvivor.
 * Permite apenas:
 * 1. Formas Base (1º estágio).
 * 2. Pokémon de Estágio Único (Tauros, Lapras, etc.).
 * 3. Lendários e Míticos.
 * Bloqueia:
 * - Formas intermediárias e finais (ex: Charmeleon, Charizard, Gyarados).
 * @param {string|number} pokemonId Nome ou número dex do Pokémon
 * @returns {boolean}
 */
function isEligibleToStartRun(pokemonId) {
  if (!pokemonId) return false;

  let name = '';
  let mon = null;

  if (typeof pokemonId === 'number' || /^\d+$/.test(String(pokemonId).trim())) {
    const dexNum = Number(pokemonId);
    if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[dexNum]) {
      mon = G.DEX_BY[dexNum];
      name = mon.name.toLowerCase().trim();
    }
  }
  if (!name) {
    name = String(pokemonId).toLowerCase().trim();
    if (typeof G === 'object' && Array.isArray(G.DEX)) {
      mon = G.DEX.find(p => p.name.toLowerCase().trim() === name);
    }
  }

  // Regra 1: Lendários e Míticos SEMPRE podem iniciar a partida
  if (isLegendaryOrMythical(pokemonId) || (mon && mon.leg)) {
    return true;
  }

  // Regra 2: Se o Pokémon for evolução derivada de outro, NÃO pode iniciar
  if (EVOLVED_SPECIES_SET.has(name)) {
    return false;
  }

  // Regra 3: É forma base (1º estágio) OU estágio único (Tauros, Lapras, Heracross, etc.)
  return true;
}

/**
 * Retorna o estágio evolutivo da espécie:
 * - 1: Espécie Base (1º estágio) ou Estágio Único (Tauros, Lapras, etc.)
 * - 2: Forma Intermediária ou 1ª Evolução direta (Charmeleon, Ivysaur, Gyarados)
 * - 3: Forma Final (3º elo, ex: Charizard, Venusaur) ou Lendários/Míticos
 *
 * @param {string|number} speciesId Nome ou número dex do Pokémon
 * @returns {number} 1, 2 ou 3
 */
function getPokemonEvolutionStage(speciesId) {
  if (!speciesId) return 1;

  let name = '';
  let mon = null;

  if (typeof speciesId === 'number' || /^\d+$/.test(String(speciesId).trim())) {
    const dexNum = Number(speciesId);
    if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[dexNum]) {
      mon = G.DEX_BY[dexNum];
      name = mon.name.toLowerCase().trim();
    }
  }
  if (!name) {
    name = String(speciesId).toLowerCase().trim();
    if (typeof G === 'object' && Array.isArray(G.DEX)) {
      mon = G.DEX.find(p => p.name.toLowerCase().trim() === name);
    }
  }

  // Lendários e Míticos: Retornam 3 (custo máximo por serem tier topo de linha)
  if (isLegendaryOrMythical(speciesId) || (mon && mon.leg)) {
    return 3;
  }

  // Rastrear ancestrais na cadeia evolutiva
  let current = name;
  let ancestors = 0;
  const visited = new Set();

  while (current && ancestors < 5) {
    const dev = getDevolutionData(current);
    if (dev && dev.prev && !visited.has(dev.prev.toLowerCase())) {
      visited.add(dev.prev.toLowerCase());
      ancestors++;
      current = dev.prev.toLowerCase();
    } else {
      break;
    }
  }

  // Se a espécie NÃO for evolução de ninguém: Estágio 1 (base ou único)
  if (ancestors === 0) {
    return 1;
  }

  // Se for o 3º elo da cadeia (ou superior): Estágio 3
  if (ancestors >= 2) {
    return 3;
  }

  // Se ancestors === 1 (veio direto de uma base):
  // Se ainda puder evoluir mais uma vez (ex: Charmeleon tem 'charizard' no next): Estágio 2
  // Se for a forma final de uma linha de 2 estágios (ex: Gyarados, Raichu): Estágio 2
  return 2;
}

/**
 * Verifica se a espécie é Estágio 1 (Base / Inicial), ou seja,
 * NÃO descende nem evolui de nenhuma outra espécie anterior.
 * Espécies de Estágio 2 ou 3 retornam false.
 *
 * @param {string|number} speciesId Nome ou dex do Pokémon
 * @returns {boolean} true se for Estágio 1 Base, false se for evolução (Estágio 2/3)
 */
function isBaseStage(speciesId) {
  if (!speciesId) return false;
  let id = '';
  let mon = null;

  if (typeof speciesId === 'number' || /^\d+$/.test(String(speciesId).trim())) {
    const dexNum = Number(speciesId);
    if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[dexNum]) {
      mon = G.DEX_BY[dexNum];
      id = mon.name.toLowerCase().trim();
    }
  }
  if (!id) {
    id = String(speciesId).toLowerCase().trim();
    if (typeof G === 'object' && Array.isArray(G.DEX)) {
      mon = G.DEX.find(p => p.name && p.name.toLowerCase().trim() === id);
    }
  }

  // 1. Se o objeto POKEDEX tiver propriedade indicando ancestral (ex: evolvesFrom / preEvolution)
  if (typeof POKEDEX !== 'undefined' && POKEDEX[id]) {
    const entry = POKEDEX[id];
    if (entry.evolvesFrom || entry.preEvolution) return false;
  }

  // 2. Se está no EVOLVED_SPECIES_SET ou EVOLUTION_PARENT_MAP (já computados)
  if (typeof EVOLVED_SPECIES_SET !== 'undefined' && EVOLVED_SPECIES_SET.has(id)) {
    return false;
  }
  if (typeof EVOLUTION_PARENT_MAP !== 'undefined' && EVOLUTION_PARENT_MAP[id]) {
    return false;
  }

  // 3. Verificação reversa na tabela POKEMON_EVOLUTIONS:
  // Se o ID aparece como DESTINO de evolução de qualquer outro Pokémon, ele NÃO é estágio base.
  for (const baseKey in POKEMON_EVOLUTIONS) {
    const evo = POKEMON_EVOLUTIONS[baseKey];
    if (!evo) continue;
    if (Array.isArray(evo)) {
      if (evo.some(item => (item.next && item.next.toLowerCase() === id))) return false;
    } else if (typeof evo === 'object') {
      if (evo.next && evo.next.toLowerCase() === id) return false;
      if (evo.nextId && evo.nextId.toLowerCase() === id) return false;
      if (evo.stage2 && evo.stage2.toLowerCase() === id) return false;
      if (evo.stage3 && evo.stage3.toLowerCase() === id) return false;
    } else if (typeof evo === 'string' && evo.toLowerCase() === id) {
      return false;
    }
  }

  return true; // Não descende de ninguém -> É Estágio 1 (Base)!
}

// Exportação no escopo global e no namespace G do jogo
if (typeof window !== 'undefined') {
  window.POKEMON_EVOLUTIONS = POKEMON_EVOLUTIONS;
  window.EVOLVED_SPECIES_SET = EVOLVED_SPECIES_SET;
  window.EVOLUTION_PARENT_MAP = EVOLUTION_PARENT_MAP;
  window.getEvolutionData = getEvolutionData;
  window.getDevolutionData = getDevolutionData;
  window.isLegendaryOrMythical = isLegendaryOrMythical;
  window.isEligibleToStartRun = isEligibleToStartRun;
  window.getPokemonEvolutionStage = getPokemonEvolutionStage;
  window.getBaseAncestor = getBaseAncestor;
  window.isBaseStage = isBaseStage;

  window.debugCheckStarter = function(id) {
    const res = isEligibleToStartRun(id);
    console.log(`[ELEGIBILIDADE] "${id}" pode iniciar partida? -> ${res ? '✅ SIM (Elegível)' : '❌ NÃO (Apenas via Evolução)'}`);
    return res;
  };

  window.debugCheckStages = function() {
    console.log("=== VERIFICAÇÃO DE ESTÁGIOS DA POKÉDEX ===");
    const testCases = ['bulbasaur', 'ivysaur', 'venusaur', 'pichu', 'pikachu', 'raichu', 'mewtwo'];
    testCases.forEach(id => {
      console.log(`${id.toUpperCase()} -> É Estágio 1 Base?`, isBaseStage(id) ? "✅ SIM (Liberado)" : "❌ NÃO (Travado)");
    });
  };
}
if (typeof G === 'object') {
  G.POKEMON_EVOLUTIONS = POKEMON_EVOLUTIONS;
  G.EVOLVED_SPECIES_SET = EVOLVED_SPECIES_SET;
  G.EVOLUTION_PARENT_MAP = EVOLUTION_PARENT_MAP;
  G.getEvolutionData = getEvolutionData;
  G.getDevolutionData = getDevolutionData;
  G.isLegendaryOrMythical = isLegendaryOrMythical;
  G.isEligibleToStartRun = isEligibleToStartRun;
  G.getPokemonEvolutionStage = getPokemonEvolutionStage;
  G.getBaseAncestor = getBaseAncestor;
  G.isBaseStage = isBaseStage;
  G.debugCheckStages = (typeof window !== 'undefined') ? window.debugCheckStages : null;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    POKEMON_EVOLUTIONS,
    EVOLVED_SPECIES_SET,
    EVOLUTION_PARENT_MAP,
    getEvolutionData,
    getDevolutionData,
    isLegendaryOrMythical,
    isEligibleToStartRun,
    getPokemonEvolutionStage,
    getBaseAncestor,
    isBaseStage
  };
}
