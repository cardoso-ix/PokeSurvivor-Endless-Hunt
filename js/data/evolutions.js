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
// GENEALOGIA OFICIAL COMPLETA (GENERAÇÕES 1 A 9) & ELEGIBILIDADE DE PARTIDA
// ==========================================

/**
 * Tabela compacta de genealogia para todos os 966 Pokémon oficiais da Pokédex:
 * Mapeamento: dex -> [stage, parentDex, rootDex]
 * - stage: 1 = Base (Estágio 1, elegível para iniciar partida)
 *          2 = Intermediário / 1ª Evolução (Estágio 2, bloqueado para iniciar partida)
 *          3 = Final / 2ª Evolução (Estágio 3, bloqueado para iniciar partida)
 * - parentDex: Número dex do ancestral direto (0 se for Estágio 1)
 * - rootDex: Número dex da forma base da linha evolutiva (Estágio 1)
 */
const POKEMON_GENEALOGY = {"1":[1,0,1],"2":[2,1,1],"3":[3,2,1],"4":[1,0,4],"5":[2,4,4],"6":[3,5,4],"7":[1,0,7],"8":[2,7,7],"9":[3,8,7],"10":[1,0,10],"11":[2,10,10],"12":[3,11,10],"13":[1,0,13],"14":[2,13,13],"15":[3,14,13],"16":[1,0,16],"17":[2,16,16],"18":[3,17,16],"19":[1,0,19],"20":[2,19,19],"21":[1,0,21],"22":[2,21,21],"23":[1,0,23],"24":[2,23,23],"25":[2,172,172],"26":[3,25,172],"27":[1,0,27],"28":[2,27,27],"29":[1,0,29],"30":[2,29,29],"31":[3,30,29],"32":[1,0,32],"33":[2,32,32],"34":[3,33,32],"35":[2,173,173],"36":[3,35,173],"37":[1,0,37],"38":[2,37,37],"39":[2,174,174],"40":[3,39,174],"41":[1,0,41],"42":[2,41,41],"43":[1,0,43],"44":[2,43,43],"45":[3,44,43],"46":[1,0,46],"47":[2,46,46],"48":[1,0,48],"49":[2,48,48],"50":[1,0,50],"51":[2,50,50],"52":[1,0,52],"53":[2,52,52],"54":[1,0,54],"55":[2,54,54],"56":[1,0,56],"57":[2,56,56],"58":[1,0,58],"59":[2,58,58],"60":[1,0,60],"61":[2,60,60],"62":[3,61,60],"63":[1,0,63],"64":[2,63,63],"65":[3,64,63],"66":[1,0,66],"67":[2,66,66],"68":[3,67,66],"69":[1,0,69],"70":[2,69,69],"71":[3,70,69],"72":[1,0,72],"73":[2,72,72],"74":[1,0,74],"75":[2,74,74],"76":[3,75,74],"77":[1,0,77],"78":[2,77,77],"79":[1,0,79],"80":[2,79,79],"81":[1,0,81],"82":[2,81,81],"83":[1,0,83],"84":[1,0,84],"85":[2,84,84],"86":[1,0,86],"87":[2,86,86],"88":[1,0,88],"89":[2,88,88],"90":[1,0,90],"91":[2,90,90],"92":[1,0,92],"93":[2,92,92],"94":[3,93,92],"95":[1,0,95],"96":[1,0,96],"97":[2,96,96],"98":[1,0,98],"99":[2,98,98],"100":[1,0,100],"101":[2,100,100],"102":[1,0,102],"103":[2,102,102],"104":[1,0,104],"105":[2,104,104],"106":[2,236,236],"107":[2,236,236],"108":[1,0,108],"109":[1,0,109],"110":[2,109,109],"111":[1,0,111],"112":[2,111,111],"113":[2,440,440],"114":[1,0,114],"115":[1,0,115],"116":[1,0,116],"117":[2,116,116],"118":[1,0,118],"119":[2,118,118],"120":[1,0,120],"121":[2,120,120],"122":[2,439,439],"123":[1,0,123],"124":[2,238,238],"125":[2,239,239],"126":[2,240,240],"127":[1,0,127],"128":[1,0,128],"129":[1,0,129],"130":[2,129,129],"131":[1,0,131],"132":[1,0,132],"133":[1,0,133],"134":[2,133,133],"135":[2,133,133],"136":[2,133,133],"137":[1,0,137],"138":[1,0,138],"139":[2,138,138],"140":[1,0,140],"141":[2,140,140],"142":[1,0,142],"143":[2,446,446],"144":[1,0,144],"145":[1,0,145],"146":[1,0,146],"147":[1,0,147],"148":[2,147,147],"149":[3,148,147],"150":[1,0,150],"151":[1,0,151],"152":[1,0,152],"153":[2,152,152],"154":[3,153,152],"155":[1,0,155],"156":[2,155,155],"157":[3,156,155],"158":[1,0,158],"159":[2,158,158],"160":[3,159,158],"161":[1,0,161],"162":[2,161,161],"163":[1,0,163],"164":[2,163,163],"165":[1,0,165],"166":[2,165,165],"167":[1,0,167],"168":[2,167,167],"169":[3,42,41],"170":[1,0,170],"171":[2,170,170],"172":[1,0,172],"173":[1,0,173],"174":[1,0,174],"175":[1,0,175],"176":[2,175,175],"177":[1,0,177],"178":[2,177,177],"179":[1,0,179],"180":[2,179,179],"181":[3,180,179],"182":[3,44,43],"183":[2,298,298],"184":[3,183,298],"185":[2,438,438],"186":[3,61,60],"187":[1,0,187],"188":[2,187,187],"189":[3,188,187],"190":[1,0,190],"191":[1,0,191],"192":[2,191,191],"193":[1,0,193],"194":[1,0,194],"195":[2,194,194],"196":[2,133,133],"197":[2,133,133],"198":[1,0,198],"199":[2,79,79],"200":[1,0,200],"201":[1,0,201],"202":[2,360,360],"203":[1,0,203],"204":[1,0,204],"205":[2,204,204],"206":[1,0,206],"207":[1,0,207],"208":[2,95,95],"209":[1,0,209],"210":[2,209,209],"211":[1,0,211],"212":[2,123,123],"213":[1,0,213],"214":[1,0,214],"215":[1,0,215],"216":[1,0,216],"217":[2,216,216],"218":[1,0,218],"219":[2,218,218],"220":[1,0,220],"221":[2,220,220],"222":[1,0,222],"223":[1,0,223],"224":[2,223,223],"225":[1,0,225],"226":[2,458,458],"227":[1,0,227],"228":[1,0,228],"229":[2,228,228],"230":[3,117,116],"231":[1,0,231],"232":[2,231,231],"233":[2,137,137],"234":[1,0,234],"235":[1,0,235],"236":[1,0,236],"237":[2,236,236],"238":[1,0,238],"239":[1,0,239],"240":[1,0,240],"241":[1,0,241],"242":[3,113,440],"243":[1,0,243],"244":[1,0,244],"245":[1,0,245],"246":[1,0,246],"247":[2,246,246],"248":[3,247,246],"249":[1,0,249],"250":[1,0,250],"251":[1,0,251],"252":[1,0,252],"253":[2,252,252],"254":[3,253,252],"255":[1,0,255],"256":[2,255,255],"257":[3,256,255],"258":[1,0,258],"259":[2,258,258],"260":[3,259,258],"261":[1,0,261],"262":[2,261,261],"263":[1,0,263],"264":[2,263,263],"265":[1,0,265],"266":[2,265,265],"267":[3,266,265],"268":[2,265,265],"269":[3,268,265],"270":[1,0,270],"271":[2,270,270],"272":[3,271,270],"273":[1,0,273],"274":[2,273,273],"275":[3,274,273],"276":[1,0,276],"277":[2,276,276],"278":[1,0,278],"279":[2,278,278],"280":[1,0,280],"281":[2,280,280],"282":[3,281,280],"283":[1,0,283],"284":[2,283,283],"285":[1,0,285],"286":[2,285,285],"287":[1,0,287],"288":[2,287,287],"289":[3,288,287],"290":[1,0,290],"291":[2,290,290],"292":[2,290,290],"293":[1,0,293],"294":[2,293,293],"295":[3,294,293],"296":[1,0,296],"297":[2,296,296],"298":[1,0,298],"299":[1,0,299],"300":[1,0,300],"301":[2,300,300],"302":[1,0,302],"303":[1,0,303],"304":[1,0,304],"305":[2,304,304],"306":[3,305,304],"307":[1,0,307],"308":[2,307,307],"309":[1,0,309],"310":[2,309,309],"311":[1,0,311],"312":[1,0,312],"313":[1,0,313],"314":[1,0,314],"315":[2,406,406],"316":[1,0,316],"317":[2,316,316],"318":[1,0,318],"319":[2,318,318],"320":[1,0,320],"321":[2,320,320],"322":[1,0,322],"323":[2,322,322],"324":[1,0,324],"325":[1,0,325],"326":[2,325,325],"327":[1,0,327],"328":[1,0,328],"329":[2,328,328],"330":[3,329,328],"331":[1,0,331],"332":[2,331,331],"333":[1,0,333],"334":[2,333,333],"335":[1,0,335],"336":[1,0,336],"337":[1,0,337],"338":[1,0,338],"339":[1,0,339],"340":[2,339,339],"341":[1,0,341],"342":[2,341,341],"343":[1,0,343],"344":[2,343,343],"345":[1,0,345],"346":[2,345,345],"347":[1,0,347],"348":[2,347,347],"349":[1,0,349],"350":[2,349,349],"351":[1,0,351],"352":[1,0,352],"353":[1,0,353],"354":[2,353,353],"355":[1,0,355],"356":[2,355,355],"357":[1,0,357],"358":[2,433,433],"359":[1,0,359],"360":[1,0,360],"361":[1,0,361],"362":[2,361,361],"363":[1,0,363],"364":[2,363,363],"365":[3,364,363],"366":[1,0,366],"367":[2,366,366],"368":[2,366,366],"369":[1,0,369],"370":[1,0,370],"371":[1,0,371],"372":[2,371,371],"373":[3,372,371],"374":[1,0,374],"375":[2,374,374],"376":[3,375,374],"377":[1,0,377],"378":[1,0,378],"379":[1,0,379],"380":[1,0,380],"381":[1,0,381],"382":[1,0,382],"383":[1,0,383],"384":[1,0,384],"385":[1,0,385],"386":[1,0,386],"387":[1,0,387],"388":[2,387,387],"389":[3,388,387],"390":[1,0,390],"391":[2,390,390],"392":[3,391,390],"393":[1,0,393],"394":[2,393,393],"395":[3,394,393],"396":[1,0,396],"397":[2,396,396],"398":[3,397,396],"399":[1,0,399],"400":[2,399,399],"401":[1,0,401],"402":[2,401,401],"403":[1,0,403],"404":[2,403,403],"405":[3,404,403],"406":[1,0,406],"407":[3,315,406],"408":[1,0,408],"409":[2,408,408],"410":[1,0,410],"411":[2,410,410],"412":[1,0,412],"413":[2,412,412],"414":[2,412,412],"415":[1,0,415],"416":[2,415,415],"417":[1,0,417],"418":[1,0,418],"419":[2,418,418],"420":[1,0,420],"421":[2,420,420],"422":[1,0,422],"423":[2,422,422],"424":[2,190,190],"425":[1,0,425],"426":[2,425,425],"427":[1,0,427],"428":[2,427,427],"429":[2,200,200],"430":[2,198,198],"431":[1,0,431],"432":[2,431,431],"433":[1,0,433],"434":[1,0,434],"435":[2,434,434],"436":[1,0,436],"437":[2,436,436],"438":[1,0,438],"439":[1,0,439],"440":[1,0,440],"441":[1,0,441],"442":[1,0,442],"443":[1,0,443],"444":[2,443,443],"445":[3,444,443],"446":[1,0,446],"447":[1,0,447],"448":[2,447,447],"449":[1,0,449],"450":[2,449,449],"451":[1,0,451],"452":[2,451,451],"453":[1,0,453],"454":[2,453,453],"455":[1,0,455],"456":[1,0,456],"457":[2,456,456],"458":[1,0,458],"459":[1,0,459],"460":[2,459,459],"461":[2,215,215],"462":[3,82,81],"463":[2,108,108],"464":[3,112,111],"465":[2,114,114],"466":[3,125,239],"467":[3,126,240],"468":[3,176,175],"469":[2,193,193],"470":[2,133,133],"471":[2,133,133],"472":[2,207,207],"473":[3,221,220],"474":[3,233,137],"475":[3,281,280],"476":[2,299,299],"477":[3,356,355],"478":[2,361,361],"479":[1,0,479],"480":[1,0,480],"481":[1,0,481],"482":[1,0,482],"483":[1,0,483],"484":[1,0,484],"485":[1,0,485],"486":[1,0,486],"487":[1,0,487],"488":[1,0,488],"489":[1,0,489],"490":[2,489,489],"491":[1,0,491],"492":[1,0,492],"493":[1,0,493],"494":[1,0,494],"495":[1,0,495],"496":[2,495,495],"497":[3,496,495],"498":[1,0,498],"499":[2,498,498],"500":[3,499,498],"501":[1,0,501],"502":[2,501,501],"503":[3,502,501],"504":[1,0,504],"505":[2,504,504],"506":[1,0,506],"507":[2,506,506],"508":[3,507,506],"509":[1,0,509],"510":[2,509,509],"511":[1,0,511],"512":[2,511,511],"513":[1,0,513],"515":[1,0,515],"517":[1,0,517],"518":[2,517,517],"519":[1,0,519],"521":[3,520,519],"524":[1,0,524],"525":[2,524,524],"526":[3,525,524],"527":[1,0,527],"528":[2,527,527],"529":[1,0,529],"530":[2,529,529],"531":[1,0,531],"532":[1,0,532],"533":[2,532,532],"534":[3,533,532],"535":[1,0,535],"536":[2,535,535],"537":[3,536,535],"539":[1,0,539],"540":[1,0,540],"541":[2,540,540],"542":[3,541,540],"543":[1,0,543],"544":[2,543,543],"545":[3,544,543],"546":[1,0,546],"547":[2,546,546],"548":[1,0,548],"549":[2,548,548],"550":[1,0,550],"551":[1,0,551],"552":[2,551,551],"553":[3,552,551],"554":[1,0,554],"555":[2,554,554],"556":[1,0,556],"557":[1,0,557],"559":[1,0,559],"560":[2,559,559],"561":[1,0,561],"562":[1,0,562],"563":[2,562,562],"566":[1,0,566],"567":[2,566,566],"568":[1,0,568],"569":[2,568,568],"570":[1,0,570],"571":[2,570,570],"572":[1,0,572],"573":[2,572,572],"574":[1,0,574],"575":[2,574,574],"576":[3,575,574],"577":[1,0,577],"578":[2,577,577],"579":[3,578,577],"580":[1,0,580],"581":[2,580,580],"582":[1,0,582],"583":[2,582,582],"584":[3,583,582],"585":[1,0,585],"586":[2,585,585],"587":[1,0,587],"588":[1,0,588],"589":[2,588,588],"590":[1,0,590],"594":[1,0,594],"595":[1,0,595],"596":[2,595,595],"597":[1,0,597],"598":[2,597,597],"599":[1,0,599],"600":[2,599,599],"601":[3,600,599],"602":[1,0,602],"603":[2,602,602],"604":[3,603,602],"605":[1,0,605],"606":[2,605,605],"607":[1,0,607],"608":[2,607,607],"609":[3,608,607],"610":[1,0,610],"611":[2,610,610],"612":[3,611,610],"613":[1,0,613],"614":[2,613,613],"615":[1,0,615],"617":[2,616,616],"619":[1,0,619],"620":[2,619,619],"621":[1,0,621],"622":[1,0,622],"623":[2,622,622],"624":[1,0,624],"625":[2,624,624],"627":[1,0,627],"628":[2,627,627],"629":[1,0,629],"630":[2,629,629],"631":[1,0,631],"632":[1,0,632],"633":[1,0,633],"634":[2,633,633],"635":[3,634,633],"636":[1,0,636],"637":[2,636,636],"638":[1,0,638],"639":[1,0,639],"640":[1,0,640],"641":[1,0,641],"642":[1,0,642],"643":[1,0,643],"644":[1,0,644],"645":[1,0,645],"646":[1,0,646],"647":[1,0,647],"648":[1,0,648],"649":[1,0,649],"650":[1,0,650],"651":[2,650,650],"652":[3,651,650],"653":[1,0,653],"654":[2,653,653],"655":[3,654,653],"656":[1,0,656],"657":[2,656,656],"658":[3,657,656],"659":[1,0,659],"660":[2,659,659],"661":[1,0,661],"662":[2,661,661],"663":[3,662,661],"664":[1,0,664],"665":[2,664,664],"666":[3,665,664],"667":[1,0,667],"669":[1,0,669],"670":[2,669,669],"671":[3,670,669],"672":[1,0,672],"673":[2,672,672],"674":[1,0,674],"675":[2,674,674],"676":[1,0,676],"677":[1,0,677],"678":[2,677,677],"679":[1,0,679],"680":[2,679,679],"681":[3,680,679],"682":[1,0,682],"684":[1,0,684],"685":[2,684,684],"686":[1,0,686],"687":[2,686,686],"688":[1,0,688],"689":[2,688,688],"690":[1,0,690],"691":[2,690,690],"692":[1,0,692],"693":[2,692,692],"694":[1,0,694],"695":[2,694,694],"696":[1,0,696],"697":[2,696,696],"698":[1,0,698],"699":[2,698,698],"700":[2,133,133],"701":[1,0,701],"702":[1,0,702],"703":[1,0,703],"704":[1,0,704],"705":[2,704,704],"706":[3,705,704],"707":[1,0,707],"708":[1,0,708],"709":[2,708,708],"710":[1,0,710],"711":[2,710,710],"712":[1,0,712],"713":[2,712,712],"714":[1,0,714],"715":[2,714,714],"716":[1,0,716],"717":[1,0,717],"718":[1,0,718],"719":[1,0,719],"720":[1,0,720],"721":[1,0,721],"722":[1,0,722],"723":[2,722,722],"724":[3,723,722],"725":[1,0,725],"726":[2,725,725],"727":[3,726,725],"728":[1,0,728],"729":[2,728,728],"730":[3,729,728],"731":[1,0,731],"734":[1,0,734],"736":[1,0,736],"737":[2,736,736],"738":[3,737,736],"739":[1,0,739],"740":[2,739,739],"741":[1,0,741],"742":[1,0,742],"743":[2,742,742],"744":[1,0,744],"745":[2,744,744],"746":[1,0,746],"747":[1,0,747],"748":[2,747,747],"749":[1,0,749],"750":[2,749,749],"751":[1,0,751],"752":[2,751,751],"753":[1,0,753],"754":[2,753,753],"755":[1,0,755],"757":[1,0,757],"758":[2,757,757],"759":[1,0,759],"760":[2,759,759],"761":[1,0,761],"762":[2,761,761],"763":[3,762,761],"764":[1,0,764],"766":[1,0,766],"767":[1,0,767],"768":[2,767,767],"769":[1,0,769],"770":[2,769,769],"771":[1,0,771],"772":[1,0,772],"773":[2,772,772],"774":[1,0,774],"775":[1,0,775],"776":[1,0,776],"777":[1,0,777],"778":[1,0,778],"779":[1,0,779],"780":[1,0,780],"781":[1,0,781],"782":[1,0,782],"783":[2,782,782],"784":[3,783,782],"785":[1,0,785],"786":[1,0,786],"787":[1,0,787],"788":[1,0,788],"789":[1,0,789],"790":[2,789,789],"791":[3,790,789],"792":[3,790,789],"793":[1,0,793],"794":[1,0,794],"795":[1,0,795],"796":[1,0,796],"797":[1,0,797],"798":[1,0,798],"799":[1,0,799],"800":[1,0,800],"801":[1,0,801],"802":[1,0,802],"803":[1,0,803],"804":[2,803,803],"805":[1,0,805],"806":[1,0,806],"807":[1,0,807],"808":[1,0,808],"809":[2,808,808],"810":[1,0,810],"811":[2,810,810],"812":[3,811,810],"813":[1,0,813],"814":[2,813,813],"815":[3,814,813],"816":[1,0,816],"817":[2,816,816],"818":[3,817,816],"819":[1,0,819],"820":[2,819,819],"821":[1,0,821],"822":[2,821,821],"823":[3,822,821],"824":[1,0,824],"825":[2,824,824],"826":[3,825,824],"827":[1,0,827],"828":[2,827,827],"829":[1,0,829],"830":[2,829,829],"831":[1,0,831],"832":[2,831,831],"833":[1,0,833],"834":[2,833,833],"835":[1,0,835],"836":[2,835,835],"840":[1,0,840],"841":[2,840,840],"842":[2,840,840],"843":[1,0,843],"844":[2,843,843],"845":[1,0,845],"846":[1,0,846],"847":[2,846,846],"848":[1,0,848],"849":[2,848,848],"850":[1,0,850],"851":[2,850,850],"852":[1,0,852],"853":[2,852,852],"854":[1,0,854],"855":[2,854,854],"856":[1,0,856],"857":[2,856,856],"858":[3,857,856],"859":[1,0,859],"860":[2,859,859],"861":[3,860,859],"862":[3,264,263],"863":[2,52,52],"864":[2,222,222],"867":[2,562,562],"868":[1,0,868],"869":[2,868,868],"871":[1,0,871],"872":[1,0,872],"873":[2,872,872],"874":[1,0,874],"875":[1,0,875],"876":[1,0,876],"877":[1,0,877],"880":[1,0,880],"881":[1,0,881],"882":[1,0,882],"883":[1,0,883],"884":[1,0,884],"885":[1,0,885],"886":[2,885,885],"887":[3,886,885],"888":[1,0,888],"889":[1,0,889],"890":[1,0,890],"891":[1,0,891],"892":[2,891,891],"894":[1,0,894],"895":[1,0,895],"896":[1,0,896],"897":[1,0,897],"898":[1,0,898],"899":[2,234,234],"900":[2,123,123],"901":[3,217,216],"902":[2,550,550],"903":[2,215,215],"904":[2,211,211],"905":[1,0,905],"906":[1,0,906],"907":[2,906,906],"908":[3,907,906],"909":[1,0,909],"910":[2,909,909],"911":[3,910,909],"912":[1,0,912],"913":[2,912,912],"914":[3,913,912],"915":[1,0,915],"916":[2,915,915],"917":[1,0,917],"918":[2,917,917],"919":[1,0,919],"920":[2,919,919],"921":[1,0,921],"922":[2,921,921],"923":[3,922,921],"924":[1,0,924],"925":[2,924,924],"926":[1,0,926],"927":[2,926,926],"928":[1,0,928],"930":[3,929,928],"932":[1,0,932],"933":[2,932,932],"934":[3,933,932],"935":[1,0,935],"936":[2,935,935],"937":[2,935,935],"938":[1,0,938],"939":[2,938,938],"940":[1,0,940],"941":[2,940,940],"946":[1,0,946],"951":[1,0,951],"952":[2,951,951],"953":[1,0,953],"955":[1,0,955],"957":[1,0,957],"958":[2,957,957],"959":[3,958,957],"960":[1,0,960],"961":[2,960,960],"963":[1,0,963],"964":[2,963,963],"965":[1,0,965],"966":[2,965,965],"967":[1,0,967],"968":[1,0,968],"969":[1,0,969],"970":[2,969,969],"971":[1,0,971],"972":[2,971,971],"974":[1,0,974],"975":[2,974,974],"976":[1,0,976],"977":[1,0,977],"978":[1,0,978],"979":[3,57,56],"980":[2,194,194],"981":[2,203,203],"982":[2,206,206],"983":[3,625,624],"984":[1,0,984],"985":[1,0,985],"987":[1,0,987],"988":[1,0,988],"989":[1,0,989],"991":[1,0,991],"992":[1,0,992],"994":[1,0,994],"995":[1,0,995],"996":[1,0,996],"997":[2,996,996],"998":[3,997,996],"1000":[2,999,999],"1004":[1,0,1004],"1005":[1,0,1005],"1006":[1,0,1006],"1007":[1,0,1007],"1009":[1,0,1009],"1010":[1,0,1010],"1011":[2,840,840],"1012":[1,0,1012],"1013":[2,1012,1012],"1015":[1,0,1015],"1016":[1,0,1016],"1017":[1,0,1017],"1018":[2,884,884],"1019":[3,1011,840],"1024":[1,0,1024]};

/**
 * Dicionário rápido O(1) de nomes/slugs canônicos em minúsculas para número dex
 */
const POKEMON_NAME_TO_DEX = {"bulbasaur":1,"ivysaur":2,"venusaur":3,"charmander":4,"charmeleon":5,"charizard":6,"squirtle":7,"wartortle":8,"blastoise":9,"caterpie":10,"metapod":11,"butterfree":12,"weedle":13,"kakuna":14,"beedrill":15,"pidgey":16,"pidgeotto":17,"pidgeot":18,"rattata":19,"raticate":20,"spearow":21,"fearow":22,"ekans":23,"arbok":24,"pikachu":25,"raichu":26,"sandshrew":27,"sandslash":28,"nidoran♀":29,"nidoranf":29,"nidorina":30,"nidoqueen":31,"nidoran♂":32,"nidoranm":32,"nidorino":33,"nidoking":34,"clefairy":35,"clefable":36,"vulpix":37,"ninetales":38,"jigglypuff":39,"wigglytuff":40,"zubat":41,"golbat":42,"oddish":43,"gloom":44,"vileplume":45,"paras":46,"parasect":47,"venonat":48,"venomoth":49,"diglett":50,"dugtrio":51,"meowth":52,"persian":53,"psyduck":54,"golduck":55,"mankey":56,"primeape":57,"growlithe":58,"arcanine":59,"poliwag":60,"poliwhirl":61,"poliwrath":62,"abra":63,"kadabra":64,"alakazam":65,"machop":66,"machoke":67,"machamp":68,"bellsprout":69,"weepinbell":70,"victreebel":71,"tentacool":72,"tentacruel":73,"geodude":74,"graveler":75,"golem":76,"ponyta":77,"rapidash":78,"slowpoke":79,"slowbro":80,"magnemite":81,"magneton":82,"farfetch’d":83,"farfetchd":83,"doduo":84,"dodrio":85,"seel":86,"dewgong":87,"grimer":88,"muk":89,"shellder":90,"cloyster":91,"gastly":92,"haunter":93,"gengar":94,"onix":95,"drowzee":96,"hypno":97,"krabby":98,"kingler":99,"voltorb":100,"electrode":101,"exeggcute":102,"exeggutor":103,"cubone":104,"marowak":105,"hitmonlee":106,"hitmonchan":107,"lickitung":108,"koffing":109,"weezing":110,"rhyhorn":111,"rhydon":112,"chansey":113,"tangela":114,"kangaskhan":115,"horsea":116,"seadra":117,"goldeen":118,"seaking":119,"staryu":120,"starmie":121,"mr. mime":122,"mrmime":122,"scyther":123,"jynx":124,"electabuzz":125,"magmar":126,"pinsir":127,"tauros":128,"magikarp":129,"gyarados":130,"lapras":131,"ditto":132,"eevee":133,"vaporeon":134,"jolteon":135,"flareon":136,"porygon":137,"omanyte":138,"omastar":139,"kabuto":140,"kabutops":141,"aerodactyl":142,"snorlax":143,"articuno":144,"zapdos":145,"moltres":146,"dratini":147,"dragonair":148,"dragonite":149,"mewtwo":150,"mew":151,"chikorita":152,"bayleef":153,"meganium":154,"cyndaquil":155,"quilava":156,"typhlosion":157,"totodile":158,"croconaw":159,"feraligatr":160,"sentret":161,"furret":162,"hoothoot":163,"noctowl":164,"ledyba":165,"ledian":166,"spinarak":167,"ariados":168,"crobat":169,"chinchou":170,"lanturn":171,"pichu":172,"cleffa":173,"igglybuff":174,"togepi":175,"togetic":176,"natu":177,"xatu":178,"mareep":179,"flaaffy":180,"ampharos":181,"bellossom":182,"marill":183,"azumarill":184,"sudowoodo":185,"politoed":186,"hoppip":187,"skiploom":188,"jumpluff":189,"aipom":190,"sunkern":191,"sunflora":192,"yanma":193,"wooper":194,"quagsire":195,"espeon":196,"umbreon":197,"murkrow":198,"slowking":199,"misdreavus":200,"unown":201,"wobbuffet":202,"girafarig":203,"pineco":204,"forretress":205,"dunsparce":206,"gligar":207,"steelix":208,"snubbull":209,"granbull":210,"qwilfish":211,"scizor":212,"shuckle":213,"heracross":214,"sneasel":215,"teddiursa":216,"ursaring":217,"slugma":218,"magcargo":219,"swinub":220,"piloswine":221,"corsola":222,"remoraid":223,"octillery":224,"delibird":225,"mantine":226,"skarmory":227,"houndour":228,"houndoom":229,"kingdra":230,"phanpy":231,"donphan":232,"porygon2":233,"stantler":234,"smeargle":235,"tyrogue":236,"hitmontop":237,"smoochum":238,"elekid":239,"magby":240,"miltank":241,"blissey":242,"raikou":243,"entei":244,"suicune":245,"larvitar":246,"pupitar":247,"tyranitar":248,"lugia":249,"ho-oh":250,"hooh":250,"celebi":251,"treecko":252,"grovyle":253,"sceptile":254,"torchic":255,"combusken":256,"blaziken":257,"mudkip":258,"marshtomp":259,"swampert":260,"poochyena":261,"mightyena":262,"zigzagoon":263,"linoone":264,"wurmple":265,"silcoon":266,"beautifly":267,"cascoon":268,"dustox":269,"lotad":270,"lombre":271,"ludicolo":272,"seedot":273,"nuzleaf":274,"shiftry":275,"taillow":276,"swellow":277,"wingull":278,"pelipper":279,"ralts":280,"kirlia":281,"gardevoir":282,"surskit":283,"masquerain":284,"shroomish":285,"breloom":286,"slakoth":287,"vigoroth":288,"slaking":289,"nincada":290,"ninjask":291,"shedinja":292,"whismur":293,"loudred":294,"exploud":295,"makuhita":296,"hariyama":297,"azurill":298,"nosepass":299,"skitty":300,"delcatty":301,"sableye":302,"mawile":303,"aron":304,"lairon":305,"aggron":306,"meditite":307,"medicham":308,"electrike":309,"manectric":310,"plusle":311,"minun":312,"volbeat":313,"illumise":314,"roselia":315,"gulpin":316,"swalot":317,"carvanha":318,"sharpedo":319,"wailmer":320,"wailord":321,"numel":322,"camerupt":323,"torkoal":324,"spoink":325,"grumpig":326,"spinda":327,"trapinch":328,"vibrava":329,"flygon":330,"cacnea":331,"cacturne":332,"swablu":333,"altaria":334,"zangoose":335,"seviper":336,"lunatone":337,"solrock":338,"barboach":339,"whiscash":340,"corphish":341,"crawdaunt":342,"baltoy":343,"claydol":344,"lileep":345,"cradily":346,"anorith":347,"armaldo":348,"feebas":349,"milotic":350,"castform":351,"kecleon":352,"shuppet":353,"banette":354,"duskull":355,"dusclops":356,"tropius":357,"chimecho":358,"absol":359,"wynaut":360,"snorunt":361,"glalie":362,"spheal":363,"sealeo":364,"walrein":365,"clamperl":366,"huntail":367,"gorebyss":368,"relicanth":369,"luvdisc":370,"bagon":371,"shelgon":372,"salamence":373,"beldum":374,"metang":375,"metagross":376,"regirock":377,"regice":378,"registeel":379,"latias":380,"latios":381,"kyogre":382,"groudon":383,"rayquaza":384,"jirachi":385,"deoxys":386,"turtwig":387,"grotle":388,"torterra":389,"chimchar":390,"monferno":391,"infernape":392,"piplup":393,"prinplup":394,"empoleon":395,"starly":396,"staravia":397,"staraptor":398,"bidoof":399,"bibarel":400,"kricketot":401,"kricketune":402,"shinx":403,"luxio":404,"luxray":405,"budew":406,"roserade":407,"cranidos":408,"rampardos":409,"shieldon":410,"bastiodon":411,"burmy":412,"wormadam":413,"mothim":414,"combee":415,"vespiquen":416,"pachirisu":417,"buizel":418,"floatzel":419,"cherubi":420,"cherrim":421,"shellos":422,"gastrodon":423,"ambipom":424,"drifloon":425,"drifblim":426,"buneary":427,"lopunny":428,"mismagius":429,"honchkrow":430,"glameow":431,"purugly":432,"chingling":433,"stunky":434,"skuntank":435,"bronzor":436,"bronzong":437,"bonsly":438,"mime jr.":439,"mimejr":439,"happiny":440,"chatot":441,"spiritomb":442,"gible":443,"gabite":444,"garchomp":445,"munchlax":446,"riolu":447,"lucario":448,"hippopotas":449,"hippowdon":450,"skorupi":451,"drapion":452,"croagunk":453,"toxicroak":454,"carnivine":455,"finneon":456,"lumineon":457,"mantyke":458,"snover":459,"abomasnow":460,"weavile":461,"magnezone":462,"lickilicky":463,"rhyperior":464,"tangrowth":465,"electivire":466,"magmortar":467,"togekiss":468,"yanmega":469,"leafeon":470,"glaceon":471,"gliscor":472,"mamoswine":473,"porygon-z":474,"porygonz":474,"gallade":475,"probopass":476,"dusknoir":477,"froslass":478,"rotom":479,"uxie":480,"mesprit":481,"azelf":482,"dialga":483,"palkia":484,"heatran":485,"regigigas":486,"giratina":487,"cresselia":488,"phione":489,"manaphy":490,"darkrai":491,"shaymin":492,"arceus":493,"victini":494,"snivy":495,"servine":496,"serperior":497,"tepig":498,"pignite":499,"emboar":500,"oshawott":501,"dewott":502,"samurott":503,"patrat":504,"watchog":505,"lillipup":506,"herdier":507,"stoutland":508,"purrloin":509,"liepard":510,"pansage":511,"simisage":512,"pansear":513,"panpour":515,"munna":517,"musharna":518,"pidove":519,"unfezant":521,"roggenrola":524,"boldore":525,"gigalith":526,"woobat":527,"swoobat":528,"drilbur":529,"excadrill":530,"audino":531,"timburr":532,"gurdurr":533,"conkeldurr":534,"tympole":535,"palpitoad":536,"seismitoad":537,"sawk":539,"sewaddle":540,"swadloon":541,"leavanny":542,"venipede":543,"whirlipede":544,"scolipede":545,"cottonee":546,"whimsicott":547,"petilil":548,"lilligant":549,"basculin":550,"sandile":551,"krokorok":552,"krookodile":553,"darumaka":554,"darmanitan":555,"maractus":556,"dwebble":557,"scraggy":559,"scrafty":560,"sigilyph":561,"yamask":562,"cofagrigus":563,"archen":566,"archeops":567,"trubbish":568,"garbodor":569,"zorua":570,"zoroark":571,"minccino":572,"cinccino":573,"gothita":574,"gothorita":575,"gothitelle":576,"solosis":577,"duosion":578,"reuniclus":579,"ducklett":580,"swanna":581,"vanillite":582,"vanillish":583,"vanilluxe":584,"deerling":585,"sawsbuck":586,"emolga":587,"karrablast":588,"escavalier":589,"foongus":590,"alomomola":594,"joltik":595,"galvantula":596,"ferroseed":597,"ferrothorn":598,"klink":599,"klang":600,"klinklang":601,"tynamo":602,"eelektrik":603,"eelektross":604,"elgyem":605,"beheeyem":606,"litwick":607,"lampent":608,"chandelure":609,"axew":610,"fraxure":611,"haxorus":612,"cubchoo":613,"beartic":614,"cryogonal":615,"accelgor":617,"mienfoo":619,"mienshao":620,"druddigon":621,"golett":622,"golurk":623,"pawniard":624,"bisharp":625,"rufflet":627,"braviary":628,"vullaby":629,"mandibuzz":630,"heatmor":631,"durant":632,"deino":633,"zweilous":634,"hydreigon":635,"larvesta":636,"volcarona":637,"cobalion":638,"terrakion":639,"virizion":640,"tornadus":641,"thundurus":642,"reshiram":643,"zekrom":644,"landorus":645,"kyurem":646,"keldeo":647,"meloetta":648,"genesect":649,"chespin":650,"quilladin":651,"chesnaught":652,"fennekin":653,"braixen":654,"delphox":655,"froakie":656,"frogadier":657,"greninja":658,"bunnelby":659,"diggersby":660,"fletchling":661,"fletchinder":662,"talonflame":663,"scatterbug":664,"spewpa":665,"vivillon":666,"litleo":667,"flabébé":669,"floette":670,"florges":671,"skiddo":672,"gogoat":673,"pancham":674,"pangoro":675,"furfrou":676,"espurr":677,"meowstic":678,"honedge":679,"doublade":680,"aegislash":681,"spritzee":682,"swirlix":684,"slurpuff":685,"inkay":686,"malamar":687,"binacle":688,"barbaracle":689,"skrelp":690,"dragalge":691,"clauncher":692,"clawitzer":693,"helioptile":694,"heliolisk":695,"tyrunt":696,"tyrantrum":697,"amaura":698,"aurorus":699,"sylveon":700,"hawlucha":701,"dedenne":702,"carbink":703,"goomy":704,"sliggoo":705,"goodra":706,"klefki":707,"phantump":708,"trevenant":709,"pumpkaboo":710,"gourgeist":711,"bergmite":712,"avalugg":713,"noibat":714,"noivern":715,"xerneas":716,"yveltal":717,"zygarde":718,"diancie":719,"hoopa":720,"volcanion":721,"rowlet":722,"dartrix":723,"decidueye":724,"litten":725,"torracat":726,"incineroar":727,"popplio":728,"brionne":729,"primarina":730,"pikipek":731,"yungoos":734,"grubbin":736,"charjabug":737,"vikavolt":738,"crabrawler":739,"crabominable":740,"oricorio":741,"cutiefly":742,"ribombee":743,"rockruff":744,"lycanroc":745,"wishiwashi":746,"mareanie":747,"toxapex":748,"mudbray":749,"mudsdale":750,"dewpider":751,"araquanid":752,"fomantis":753,"lurantis":754,"morelull":755,"salandit":757,"salazzle":758,"stufful":759,"bewear":760,"bounsweet":761,"steenee":762,"tsareena":763,"comfey":764,"passimian":766,"wimpod":767,"golisopod":768,"sandygast":769,"palossand":770,"pyukumuku":771,"código cero":772,"códigocero":772,"silvally":773,"minior":774,"komala":775,"turtonator":776,"togedemaru":777,"mimikyu":778,"bruxish":779,"drampa":780,"dhelmise":781,"jangmo-o":782,"jangmoo":782,"hakamo-o":783,"hakamoo":783,"kommo-o":784,"kommoo":784,"tapu koko":785,"tapukoko":785,"tapu lele":786,"tapulele":786,"tapu bulu":787,"tapubulu":787,"tapu fini":788,"tapufini":788,"cosmog":789,"cosmoem":790,"solgaleo":791,"lunala":792,"nihilego":793,"buzzwole":794,"pheromosa":795,"xurkitree":796,"celesteela":797,"kartana":798,"guzzlord":799,"necrozma":800,"magearna":801,"marshadow":802,"poipole":803,"naganadel":804,"stakataka":805,"blacephalon":806,"zeraora":807,"meltan":808,"melmetal":809,"grookey":810,"thwackey":811,"rillaboom":812,"scorbunny":813,"raboot":814,"cinderace":815,"sobble":816,"drizzile":817,"inteleon":818,"skwovet":819,"greedent":820,"rookidee":821,"corvisquire":822,"corviknight":823,"blipbug":824,"dottler":825,"orbeetle":826,"nickit":827,"thievul":828,"gossifleur":829,"eldegoss":830,"wooloo":831,"dubwool":832,"chewtle":833,"drednaw":834,"yamper":835,"boltund":836,"applin":840,"flapple":841,"appletun":842,"silicobra":843,"sandaconda":844,"cramorant":845,"arrokuda":846,"barraskewda":847,"toxel":848,"toxtricity":849,"sizzlipede":850,"centiskorch":851,"clobbopus":852,"grapploct":853,"sinistea":854,"polteageist":855,"hatenna":856,"hattrem":857,"hatterene":858,"impidimp":859,"morgrem":860,"grimmsnarl":861,"obstagoon":862,"perrserker":863,"cursola":864,"runerigus":867,"milcery":868,"alcremie":869,"pincurchin":871,"snom":872,"frosmoth":873,"stonjourner":874,"eiscue":875,"indeedee":876,"morpeko":877,"dracozolt":880,"arctozolt":881,"dracovish":882,"arctovish":883,"duraludon":884,"dreepy":885,"drakloak":886,"dragapult":887,"zacian":888,"zamazenta":889,"eternatus":890,"kubfu":891,"urshifu":892,"regieleki":894,"regidrago":895,"glastrier":896,"spectrier":897,"calyrex":898,"wyrdeer":899,"kleavor":900,"ursaluna":901,"basculegion":902,"sneasler":903,"overqwil":904,"enamorus":905,"sprigatito":906,"floragato":907,"meowscarada":908,"fuecoco":909,"crocalor":910,"skeledirge":911,"quaxly":912,"quaxwell":913,"quaquaval":914,"lechonk":915,"oinkologne":916,"tarountula":917,"spidops":918,"nymble":919,"lokix":920,"pawmi":921,"pawmo":922,"pawmot":923,"tandemaus":924,"maushold":925,"fidough":926,"dachsbun":927,"smoliv":928,"arboliva":930,"nacli":932,"naclstack":933,"garganacl":934,"charcadet":935,"armarouge":936,"ceruledge":937,"tadbulb":938,"bellibolt":939,"wattrel":940,"kilowattrel":941,"bramblin":946,"capsakid":951,"scovillain":952,"rellor":953,"flittle":955,"tinkatink":957,"tinkatuff":958,"tinkaton":959,"wiglett":960,"wugtrio":961,"finizen":963,"palafin":964,"varoom":965,"revavroom":966,"cyclizar":967,"orthworm":968,"glimmet":969,"glimmora":970,"greavard":971,"houndstone":972,"cetoddle":974,"cetitan":975,"veluza":976,"dondozo":977,"tatsugiri":978,"annihilape":979,"clodsire":980,"farigiraf":981,"dudunsparce":982,"kingambit":983,"colmilargo":984,"colagrito":985,"melenaleteo":987,"reptalada":988,"pelarena":989,"ferrosaco":991,"ferropalmas":992,"ferropolilla":994,"ferropúas":995,"frigibax":996,"arctibax":997,"baxcalibur":998,"gholdengo":1000,"chi-yu":1004,"chiyu":1004,"bramaluna":1005,"ferropaladín":1006,"koraidon":1007,"ondulagua":1009,"ferroverdor":1010,"dipplin":1011,"poltchageist":1012,"sinistcha":1013,"munkidori":1015,"fezandipiti":1016,"ogerpon":1017,"archaludon":1018,"hydrapple":1019,"terapagos":1024};

/**
 * Conjunto otimizado de todas as formas evoluídas derivadas (Estágios 2 e 3).
 * Contém nomes, slugs e números dex de todas as 459 espécies evoluídas das 9 gerações.
 */
const EVOLVED_SPECIES_SET = new Set();

/**
 * Mapa reverso onde cada evolução aponta para seu ancestral imediato (nome e dex).
 */
const EVOLUTION_PARENT_MAP = {};

function buildEvolvedSpeciesSet() {
  EVOLVED_SPECIES_SET.clear();
  for (const k in EVOLUTION_PARENT_MAP) delete EVOLUTION_PARENT_MAP[k];

  // 1. Popula a partir da Genealogia Oficial das 9 Gerações
  for (const dexStr in POKEMON_GENEALOGY) {
    const dex = Number(dexStr);
    const data = POKEMON_GENEALOGY[dexStr];
    const stage = data[0];
    const parentDex = data[1];

    if (stage > 1) {
      EVOLVED_SPECIES_SET.add(dex);
      EVOLVED_SPECIES_SET.add(String(dex));

      if (parentDex > 0) {
        EVOLUTION_PARENT_MAP[dex] = parentDex;
      }
    }
  }

  // Mapeia também por nomes a partir do POKEMON_NAME_TO_DEX
  for (const name in POKEMON_NAME_TO_DEX) {
    const dex = POKEMON_NAME_TO_DEX[name];
    const data = POKEMON_GENEALOGY[dex];
    if (data && data[0] > 1) {
      const lower = name.toLowerCase().trim();
      EVOLVED_SPECIES_SET.add(lower);
      const parentDex = data[1];
      if (parentDex > 0) {
        for (const pName in POKEMON_NAME_TO_DEX) {
          if (POKEMON_NAME_TO_DEX[pName] === parentDex) {
            EVOLUTION_PARENT_MAP[lower] = pName.toLowerCase().trim();
            break;
          }
        }
      }
    }
  }

  // 2. Mapeia também as evoluções manuais em POKEMON_EVOLUTIONS
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
 * Resolve o número dex de uma espécie dada por número, string ou objeto
 */
function resolvePokemonDex(speciesId) {
  if (speciesId == null) return null;
  if (typeof speciesId === 'number') return speciesId;
  if (typeof speciesId === 'object' && speciesId.dex) return speciesId.dex;
  const str = String(speciesId).trim();
  if (/^\d+$/.test(str)) return Number(str);
  const lower = str.toLowerCase();
  if (POKEMON_NAME_TO_DEX[lower]) return POKEMON_NAME_TO_DEX[lower];
  const clean = lower.replace(/[\'’\.\s\-\:\;]/g, '').replace('♀','f').replace('♂','m');
  if (POKEMON_NAME_TO_DEX[clean]) return POKEMON_NAME_TO_DEX[clean];
  if (typeof G === 'object' && Array.isArray(G.DEX)) {
    const found = G.DEX.find(p => p.name && (p.name.toLowerCase().trim() === lower || p.name.toLowerCase().replace(/[\'’\.\s\-\:\;]/g, '') === clean));
    if (found) return found.dex;
  }
  return null;
}

/**
 * Retorna a Forma Base (ancestral inicial Estágio 1) daquela linha evolutiva.
 * Se a espécie já for base ou estágio único (ex: Tauros, Lapras, Charmander), retorna ela mesma.
 * Suporta busca por nome ('charizard') ou número dex (6).
 *
 * @param {string|number} speciesId Nome ou número dex do Pokémon
 * @returns {string|number} Espécie raiz correspondente (mantém tipo numérico se passado número)
 */
function getBaseAncestor(speciesId) {
  if (!speciesId) return speciesId;
  const isNum = typeof speciesId === 'number' || /^\d+$/.test(String(speciesId).trim());
  const dex = resolvePokemonDex(speciesId);
  if (dex && POKEMON_GENEALOGY[dex]) {
    const rootDex = POKEMON_GENEALOGY[dex][2] || dex;
    if (isNum) return rootDex;
    if (typeof G === 'object' && G.DEX_BY && G.DEX_BY[rootDex]) {
      return G.DEX_BY[rootDex].name.toLowerCase().trim();
    }
    for (const nm in POKEMON_NAME_TO_DEX) {
      if (POKEMON_NAME_TO_DEX[nm] === rootDex) return nm;
    }
    return rootDex;
  }
  return speciesId;
}

/**
 * Retorna o estágio evolutivo da espécie:
 * - 1: Espécie Base (1º estágio) ou Estágio Único
 * - 2: Forma Intermediária ou 1ª Evolução direta
 * - 3: Forma Final (3º elo da cadeia)
 *
 * @param {string|number} speciesId Nome ou número dex do Pokémon
 * @returns {number} 1, 2 ou 3
 */
function getPokemonEvolutionStage(speciesId) {
  if (!speciesId) return 1;
  const dex = resolvePokemonDex(speciesId);
  if (dex && POKEMON_GENEALOGY[dex]) {
    return POKEMON_GENEALOGY[dex][0];
  }
  const id = String(speciesId).toLowerCase().trim();
  if (EVOLVED_SPECIES_SET.has(id)) return 2;
  return 1;
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
  if (name && LEGENDARY_MYTHICAL_SET.has(name)) return true;
  if (typeof G === 'object' && Array.isArray(G.DEX)) {
    const found = G.DEX.find(p => p.name.toLowerCase().trim() === name || p.dex === Number(pokemonId));
    if (found && found.leg) return true;
  }
  return false;
}

/**
 * Verifica se a espécie é Estágio 1 (Base / Inicial), ou seja,
 * NÃO descende nem evolui de nenhuma outra espécie anterior.
 * Formas de Estágio 2 e Estágio 3 retornam ESTRITAMENTE false.
 *
 * @param {string|number} speciesId Nome ou dex do Pokémon
 * @returns {boolean} true se for Estágio 1 Base, false se for evolução (Estágio 2/3)
 */
function isBaseStage(speciesId) {
  if (!speciesId) return false;
  const dex = resolvePokemonDex(speciesId);
  if (dex && POKEMON_GENEALOGY[dex]) {
    return POKEMON_GENEALOGY[dex][0] === 1;
  }
  const id = String(speciesId).toLowerCase().trim();
  if (EVOLVED_SPECIES_SET.has(id)) return false;
  if (EVOLUTION_PARENT_MAP[id]) return false;
  return true;
}

/**
 * Validador estrito de elegibilidade para iniciar partidas no PokéSurvivor.
 * REGRA OFICIAL: APENAS ESPÉCIES DE ESTÁGIO 1 (BASE) PODEM SER SELECIONADAS.
 * Qualquer espécie de Estágio 2 ou Estágio 3 é 100% bloqueada.
 *
 * @param {string|number} pokemonId Nome ou número dex do Pokémon
 * @returns {boolean} true se for Estágio 1 (elegível), false se for Estágio 2 ou 3 (bloqueado)
 */
function isEligibleToStartRun(pokemonId) {
  return isBaseStage(pokemonId);
}

// Exportação no escopo global e no namespace G do jogo
if (typeof window !== 'undefined') {
  window.POKEMON_EVOLUTIONS = POKEMON_EVOLUTIONS;
  window.POKEMON_GENEALOGY = POKEMON_GENEALOGY;
  window.POKEMON_NAME_TO_DEX = POKEMON_NAME_TO_DEX;
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
    console.log(`[ELEGIBILIDADE] "${id}" pode iniciar partida? -> ${res ? '✅ SIM (Elegível - Estágio 1)' : '❌ NÃO (Bloqueado - Estágio 2/3)'}`);
    return res;
  };

  window.debugCheckStages = function() {
    console.log("=== VERIFICAÇÃO DE ESTÁGIOS DA POKÉDEX ===");
    const testCases = ['bulbasaur', 'ivysaur', 'venusaur', 'pichu', 'pikachu', 'raichu', 'magikarp', 'gyarados', 'mewtwo', 'cosmog', 'solgaleo'];
    testCases.forEach(id => {
      console.log(`${id.toUpperCase()} -> Estágio ${getPokemonEvolutionStage(id)}: ${isBaseStage(id) ? "✅ LIBERADO (Estágio 1)" : "❌ BLOQUEADO (Estágio 2/3)"}`);
    });
  };
}
if (typeof G === 'object') {
  G.POKEMON_EVOLUTIONS = POKEMON_EVOLUTIONS;
  G.POKEMON_GENEALOGY = POKEMON_GENEALOGY;
  G.POKEMON_NAME_TO_DEX = POKEMON_NAME_TO_DEX;
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
    POKEMON_GENEALOGY,
    POKEMON_NAME_TO_DEX,
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
