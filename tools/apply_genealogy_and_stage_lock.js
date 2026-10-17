const fs = require('fs');
const path = require('path');

// 1. Carrega dados pré-computados
const compiled = JSON.parse(fs.readFileSync('tools/cache/compiled_genealogy.json', 'utf8'));

// 2. Lê js/data/evolutions.js atual
const evolutionsPath = path.join(__dirname, '..', 'js', 'data', 'evolutions.js');
const evolutionsContent = fs.readFileSync(evolutionsPath, 'utf8');

const cutMarker = '// ==========================================\n// ELEGIBILIDADE PARA INICIAR PARTIDA';
const cutIndex = evolutionsContent.indexOf(cutMarker);
if (cutIndex === -1) {
  throw new Error('Não foi possível encontrar o marcador de corte em evolutions.js');
}

const baseEvolutionsCode = evolutionsContent.slice(0, cutIndex);

// Constrói o novo bloco
const newBlock = `// ==========================================
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
const POKEMON_GENEALOGY = ${JSON.stringify(compiled.genealogy)};

/**
 * Dicionário rápido O(1) de nomes/slugs canônicos em minúsculas para número dex
 */
const POKEMON_NAME_TO_DEX = ${JSON.stringify(compiled.nameToDex)};

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
  if (/^\\d+$/.test(str)) return Number(str);
  const lower = str.toLowerCase();
  if (POKEMON_NAME_TO_DEX[lower]) return POKEMON_NAME_TO_DEX[lower];
  const clean = lower.replace(/[\\\'’\\.\\s\\-\\:\\;]/g, '').replace('♀','f').replace('♂','m');
  if (POKEMON_NAME_TO_DEX[clean]) return POKEMON_NAME_TO_DEX[clean];
  if (typeof G === 'object' && Array.isArray(G.DEX)) {
    const found = G.DEX.find(p => p.name && (p.name.toLowerCase().trim() === lower || p.name.toLowerCase().replace(/[\\\'’\\.\\s\\-\\:\\;]/g, '') === clean));
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
  const isNum = typeof speciesId === 'number' || /^\\d+$/.test(String(speciesId).trim());
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
  if (typeof pokemonId === 'number' || /^\\d+$/.test(String(pokemonId).trim())) {
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
    console.log(\`[ELEGIBILIDADE] "\${id}" pode iniciar partida? -> \${res ? '✅ SIM (Elegível - Estágio 1)' : '❌ NÃO (Bloqueado - Estágio 2/3)'}\`);
    return res;
  };

  window.debugCheckStages = function() {
    console.log("=== VERIFICAÇÃO DE ESTÁGIOS DA POKÉDEX ===");
    const testCases = ['bulbasaur', 'ivysaur', 'venusaur', 'pichu', 'pikachu', 'raichu', 'magikarp', 'gyarados', 'mewtwo', 'cosmog', 'solgaleo'];
    testCases.forEach(id => {
      console.log(\`\${id.toUpperCase()} -> Estágio \${getPokemonEvolutionStage(id)}: \${isBaseStage(id) ? "✅ LIBERADO (Estágio 1)" : "❌ BLOQUEADO (Estágio 2/3)"}\`);
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
`;

const finalContent = baseEvolutionsCode + newBlock;
fs.writeFileSync(evolutionsPath, finalContent, 'utf8');
console.log('✅ js/data/evolutions.js atualizado com sucesso com toda a genealogia oficial das 9 gerações!');
