/* ============ achievements.js — conquistas, medalhas e títulos ============
 * Cada conquista: medalha (bronze 1, prata 2, ouro 3), recompensa ao obter e
 * título cosmético para o perfil. São verificadas em systems/progress.js.
 */
G.AchDefs = (() => {
  const own = s => Object.keys(s.owned || {}).filter(d => G.DEX_BY[d]).length;
  const shinies = s => Object.keys(s.shiny || {}).length;
  const legends = s => Object.keys(s.legends || {}).length;
  const st = k => s => (s.stats && s.stats[k]) || 0;
  const count = k => s => Object.keys(s[k] || {}).length;

  const CATS = [['coleccion', 'Coleção'], ['supervivencia', 'Sobrevivência'], ['combate', 'Combate'],
                ['grietas', 'Fendas (Rifts)'], ['legendarios', 'Lendários'], ['otros', 'Missões e Mais']];

  const LIST = [
    // ---------- coleção ----------
    { id: 'own1', cat: 'coleccion', tier: 1, name: 'Primeiro Companheiro', desc: 'Tenha 1 Pokémon.', value: own, goal: 1, reward: { coins: 100 } },
    { id: 'own10', cat: 'coleccion', tier: 1, name: 'Pequena Equipe', desc: 'Tenha 10 Pokémon.', value: own, goal: 10, reward: { t1: 2 } },
    { id: 'own50', cat: 'coleccion', tier: 2, name: 'Colecionador', desc: 'Tenha 50 Pokémon.', value: own, goal: 50, reward: { t1: 5 }, title: 'Colecionador' },
    { id: 'own100', cat: 'coleccion', tier: 2, name: 'Cem Parceiros', desc: 'Tenha 100 Pokémon.', value: own, goal: 100, reward: { t10: 1 } },
    { id: 'own250', cat: 'coleccion', tier: 3, name: 'Mestre Pokémon', desc: 'Tenha 250 Pokémon.', value: own, goal: 250, reward: { t10: 2 }, title: 'Mestre Pokémon' },
    { id: 'own500', cat: 'coleccion', tier: 3, name: 'Enciclopédia Viva', desc: 'Tenha 500 Pokémon.', value: own, goal: 500, reward: { t10: 3 } },
    { id: 'ownAll', cat: 'coleccion', tier: 3, name: 'Professor Pokémon', desc: 'Tenha todos os Pokémon do jogo.', value: own, goal: 966, reward: { t10: 10 }, title: 'Professor Pokémon' },
    { id: 'shiny1', cat: 'coleccion', tier: 1, name: 'Algo Brilha', desc: 'Consiga 1 Pokémon Shiny.', value: shinies, goal: 1, reward: { t1: 3 }, title: 'Brilhante' },
    { id: 'shiny5', cat: 'coleccion', tier: 2, name: 'Olho de Lince', desc: 'Consiga 5 Pokémon Shinies.', value: shinies, goal: 5, reward: { t10: 1 } },
    { id: 'shiny20', cat: 'coleccion', tier: 3, name: 'Caçador de Shinies', desc: 'Consiga 20 Pokémon Shinies.', value: shinies, goal: 20, reward: { t10: 2 }, title: 'Caçador de Shinies' },
    { id: 'pulls100', cat: 'coleccion', tier: 2, name: 'Afortunado', desc: 'Realize 100 giros no gacha.', value: st('pulls'), goal: 100, reward: { t10: 1 }, title: 'Afortunado' },

    // ---------- sobrevivência ----------
    { id: 'time5', cat: 'supervivencia', tier: 1, name: 'Aquecimento', desc: 'Sobreviva por 5 minutos.', value: s => Math.floor(st('bestTime')(s) / 60), goal: 5, reward: { coins: 200 } },
    { id: 'time10', cat: 'supervivencia', tier: 2, name: 'Osso Duro de Roer', desc: 'Sobreviva por 10 minutos.', value: s => Math.floor(st('bestTime')(s) / 60), goal: 10, reward: { t1: 4 } },
    { id: 'time15', cat: 'supervivencia', tier: 2, name: 'Resistente', desc: 'Sobreviva por 15 minutos.', value: s => Math.floor(st('bestTime')(s) / 60), goal: 15, reward: { t10: 1 } },
    { id: 'time20', cat: 'supervivencia', tier: 3, name: 'Sobrevivente Nato', desc: 'Sobreviva por 20 minutos.', value: s => Math.floor(st('bestTime')(s) / 60), goal: 20, reward: { t10: 2 }, title: 'Sobrevivente' },
    { id: 'lvl20', cat: 'supervivencia', tier: 1, name: 'Em Crescimento', desc: 'Alcance o nível 15 em uma partida.', value: st('bestLevel'), goal: 15, reward: { t1: 2 } },
    { id: 'lvl40', cat: 'supervivencia', tier: 3, name: 'Imparável', desc: 'Alcance o nível 30 em uma partida.', value: st('bestLevel'), goal: 30, reward: { t10: 1 }, title: 'Imparável' },
    // O Julgamento de Arceus (minuto 30, ver systems/judgment.js).
    { id: 'judge', cat: 'supervivencia', tier: 2, name: 'O Julgamento', desc: 'Alcance o Julgamento de Arceus (minuto 30).', value: st('judged'), goal: 1, reward: { t10: 1 }, title: 'Julgado' },
    { id: 'judge60', cat: 'supervivencia', tier: 3, name: 'Perante o Criador', desc: 'Sobreviva por 1 minuto perante Arceus.', value: st('judgeTime'), goal: 60, reward: { t10: 2 }, title: 'Escolhido de Arceus' },
    { id: 'judgeBoss', cat: 'supervivencia', tier: 3, name: 'Desafio Divino', desc: 'Derrote 3 lendários perante Arceus em uma única partida.', value: st('judgeBosses'), goal: 3, reward: { t10: 2 } },
    { id: 'runs50', cat: 'supervivencia', tier: 2, name: 'Explorador', desc: 'Jogue 50 partidas.', value: st('runs'), goal: 50, reward: { t10: 1 }, title: 'Explorador' },

    // ---------- combate ----------
    { id: 'kills1k', cat: 'combate', tier: 1, name: 'Primeiras Batalhas', desc: 'Derrote 1.000 Pokémon.', value: st('totalKills'), goal: 1000, reward: { t1: 2 } },
    { id: 'kills10k', cat: 'combate', tier: 2, name: 'Veterano de Guerra', desc: 'Derrote 10.000 Pokémon.', value: st('totalKills'), goal: 10000, reward: { t10: 1 }, title: 'Veterano' },
    { id: 'kills100k', cat: 'combate', tier: 3, name: 'Lenda Viva', desc: 'Derrote 100.000 Pokémon.', value: st('totalKills'), goal: 100000, reward: { t10: 3 }, title: 'Lenda Viva' },
    { id: 'boss1', cat: 'combate', tier: 1, name: 'Derrubador de Gigantes', desc: 'Derrote um chefe.', value: st('bossesTotal'), goal: 1, reward: { t1: 2 } },
    { id: 'boss25', cat: 'combate', tier: 2, name: 'Caçador de Chefes', desc: 'Derrote 25 chefes.', value: st('bossesTotal'), goal: 25, reward: { t10: 1 }, title: 'Caçador de Chefes' },
    { id: 'boss100', cat: 'combate', tier: 3, name: 'Terror dos Chefes', desc: 'Derrote 100 chefes.', value: st('bossesTotal'), goal: 100, reward: { t10: 2 } },
    { id: 'evo1', cat: 'combate', tier: 1, name: 'Primeira Evolução', desc: 'Evolua uma habilidade na partida.', value: st('evolutions'), goal: 1, reward: { t1: 3 } },
    { id: 'evo25', cat: 'combate', tier: 2, name: 'Evolucionista', desc: 'Evolua 25 habilidades.', value: st('evolutions'), goal: 25, reward: { t10: 1 }, title: 'Evolucionista' },
    { id: 'evoAll', cat: 'combate', tier: 3, name: 'Mestre dos Ataques', desc: 'Evolua os 47 ataques distintos.', value: count('evoMoves'), goal: 47, reward: { t10: 3 }, title: 'Mestre dos Ataques' },
    { id: 'items5', cat: 'combate', tier: 1, name: 'Mochila Cheia', desc: 'Encontre 5 itens distintos.', value: count('itemsFound'), goal: 5, reward: { t1: 3 } },
    { id: 'itemsAll', cat: 'combate', tier: 2, name: 'Colecionador de Relíquias', desc: 'Encontre os 11 itens.', value: count('itemsFound'), goal: 11, reward: { t10: 1 }, title: 'Antiquário' },

    // ---------- fendas (rifts) ----------
    { id: 'rift1', cat: 'grietas', tier: 1, name: 'Do Outro Lado', desc: 'Vença sua primeira batalha em uma fenda (Rift).', value: st('riftWins'), goal: 1, reward: { t1: 3 }, title: 'Corajoso' },
    { id: 'rift10', cat: 'grietas', tier: 2, name: 'Desbravador de Fendas', desc: 'Vença 10 batalhas em fendas.', value: st('riftWins'), goal: 10, reward: { t10: 1 } },
    { id: 'arenas', cat: 'grietas', tier: 3, name: 'Viajante Dimensional', desc: 'Vença nas 18 arenas elementais.', value: count('arenas'), goal: 18, reward: { t10: 2 }, title: 'Viajante das Fendas' },

    // ---------- lendários ----------
    { id: 'leg10', cat: 'legendarios', tier: 2, name: 'Caçador de Lendários', desc: 'Vença 10 lendários distintos.', value: legends, goal: 10, reward: { t10: 1 }, title: 'Caçador de Lendários' },
    { id: 'leg30', cat: 'legendarios', tier: 3, name: 'Domador de Mitos', desc: 'Vença 30 lendários distintos.', value: legends, goal: 30, reward: { t10: 2 } },
    { id: 'legAll', cat: 'legendarios', tier: 3, name: 'Lenda Suprema', desc: 'Vença todos os lendários.', value: legends, goal: 87, reward: { t10: 5 }, title: 'Lenda' },

    // ---------- missões e mais ----------
    { id: 'mis10', cat: 'otros', tier: 1, name: 'Dedicado', desc: 'Complete 10 missões.', value: st('missionsDone'), goal: 10, reward: { t1: 3 } },
    { id: 'mis50', cat: 'otros', tier: 2, name: 'Constante', desc: 'Complete 50 missões.', value: st('missionsDone'), goal: 50, reward: { t10: 1 }, title: 'Constante' },
    { id: 'mis200', cat: 'otros', tier: 3, name: 'Incansável', desc: 'Complete 200 missões.', value: st('missionsDone'), goal: 200, reward: { t10: 3 } },
    { id: 'group1', cat: 'otros', tier: 1, name: 'Em Boa Companhia', desc: 'Jogue uma partida em grupo.', value: st('groupRuns'), goal: 1, reward: { t1: 2 } },
    { id: 'group10', cat: 'otros', tier: 2, name: 'Parceiro Fiel', desc: 'Jogue 10 partidas em grupo.', value: st('groupRuns'), goal: 10, reward: { t10: 1 }, title: 'Parceiro Fiel' }
  ];

  // Conquistas individuais de cada lendário
  for (const p of G.DEX.filter(p => p.leg && G.SPRITE_META[p.dex])) {
    LIST.push({ id: 'leg_' + p.dex, cat: 'legendarios', tier: 2, dex: p.dex, name: 'Derrote ' + p.name,
                desc: 'Derrote ' + p.name + ' em uma fenda (Rift).', value: s => (s.legends && s.legends[p.dex] ? 1 : 0), goal: 1, reward: { t1: 1 } });
  }
  const totalLegends = LIST.filter(a => a.dex).length;
  for (const a of LIST) if (a.id === 'legAll') { a.goal = totalLegends; a.desc = `Vença todos os ${totalLegends} lendários.`; }
  for (const a of LIST) if (a.id === 'ownAll') { a.goal = G.DEX.length; a.desc = `Tenha todos os ${G.DEX.length} Pokémon do jogo.`; }
  const evoTotal = Object.keys(G.Moves.EVO).length;
  for (const a of LIST) if (a.id === 'evoAll') { a.goal = evoTotal; a.desc = `Evolua os ${evoTotal} ataques distintos.`; }

  const BY = {};
  for (const a of LIST) BY[a.id] = a;

  return { CATS, LIST, BY };
})();
