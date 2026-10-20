/* ============ missions.js — modelos de missões diárias e semanais ============
 * 6 diárias a cada dia e 5 semanais a cada semana com objetivos e tipos sorteados.
 * Concedem grande quantidade de PokéMoedas e Tickets para incentivar a realização das missões.
 */
G.MissionDefs = (() => {
  const T = t => G.U.TYPE_NAME[t];
  const min = d => Math.floor(d.time / 60);

  const daily = [
    { id: 'kill', ev: 'kill', goals: [300, 500, 800], reward: { t1: 3, coins: 3000 },
      text: n => `Derrote ${n} Pokémon` },
    { id: 'killType', ev: 'kill', param: 'type', goals: [30, 50, 80], reward: { t1: 3, coins: 3500 },
      match: (d, t) => d.types.includes(t), text: (n, t) => `Derrote ${n} Pokémon do tipo ${T(t)}` },
    { id: 'survive', ev: 'runEnd', mode: 'max', value: min, goals: [5, 7, 10], reward: { t1: 4, coins: 4000 },
      text: n => `Sobreviva por ${n} minutos em uma partida` },
    { id: 'level', ev: 'runEnd', mode: 'max', value: d => d.level, goals: [10, 15, 20], reward: { t1: 3, coins: 3500 },
      text: n => `Alcance o nível ${n} em uma partida` },
    { id: 'boss', ev: 'kill', match: d => d.boss, goals: [1, 2, 3], reward: { t1: 5, coins: 5000 },
      text: n => (n === 1 ? 'Derrote 1 chefe' : `Derrote ${n} chefes`) },
    { id: 'chest', ev: 'chest', goals: [1, 2], reward: { t1: 3, coins: 3000 },
      text: n => (n === 1 ? 'Abra 1 baú com cadeado' : `Abra ${n} baús com cadeado`) },
    { id: 'coins', ev: 'runEnd', value: d => d.coins, goals: [500, 1000, 2000], reward: { t1: 4, coins: 4500 },
      text: n => `Colete ${n.toLocaleString('pt-BR')} PokéMoedas em partidas` },
    { id: 'playType', ev: 'runEnd', param: 'type', mode: 'max', value: min, goals: [4], reward: { t1: 4, coins: 4000 },
      match: (d, t) => d.types.includes(t), text: (n, t) => `Sobreviva por ${n} minutos com um Pokémon do tipo ${T(t)}` },
    { id: 'item', ev: 'item', goals: [1, 2], reward: { t1: 3, coins: 3000 },
      text: n => (n === 1 ? 'Encontre 1 item equipável' : `Encontre ${n} itens equipáveis`) },
    { id: 'evolve', ev: 'evolve', goals: [1, 2], reward: { t1: 4, coins: 4500 },
      text: n => (n === 1 ? 'Evolua 1 habilidade' : `Evolua ${n} habilidades`) },
    { id: 'riftDaily', ev: 'rift', goals: [1], reward: { t1: 5, coins: 5000 },
      text: () => 'Vença 1 batalha em uma fenda (Rift)' },
    { id: 'killsElite', ev: 'kill', match: d => d.golden || d.boss, goals: [2, 4], reward: { t1: 4, coins: 4000 },
      text: n => `Derrote ${n} Pokémon raros ou chefes` }
  ];

  const weekly = [
    { id: 'wkill', ev: 'kill', goals: [3000, 5000, 8000], reward: { t10: 1, coins: 20000 },
      text: n => `Derrote ${n.toLocaleString('pt-BR')} Pokémon` },
    { id: 'wrift', ev: 'rift', goals: [2, 3, 5], reward: { t10: 1, coins: 25000 },
      text: n => `Vença ${n} batalhas em fendas (Rift)` },
    { id: 'wboss', ev: 'kill', match: d => d.boss, goals: [5, 8, 12], reward: { t10: 1, coins: 22000 },
      text: n => `Derrote ${n} chefes` },
    { id: 'wsurvive', ev: 'runEnd', mode: 'max', value: min, goals: [12, 15, 20], reward: { t10: 1, coins: 25000 },
      text: n => `Sobreviva por ${n} minutos em uma partida` },
    { id: 'wevolve', ev: 'evolve', goals: [4, 6, 10], reward: { t10: 1, coins: 20000 },
      text: n => `Evolua ${n} habilidades` },
    { id: 'wdaily', ev: 'missionDone', match: d => d.daily, goals: [10, 15, 20], reward: { t10: 2, coins: 30000 },
      text: n => `Complete ${n} missões diárias` },
    { id: 'wcoins', ev: 'runEnd', value: d => d.coins, goals: [10000, 20000], reward: { t10: 1, coins: 25000 },
      text: n => `Colete ${n.toLocaleString('pt-BR')} PokéMoedas em combate` },
    { id: 'witems', ev: 'item', goals: [4, 6], reward: { t10: 1, coins: 20000 },
      text: n => `Encontre ${n} itens equipáveis` }
  ];

  const BY = {};
  for (const m of daily.concat(weekly)) BY[m.id] = m;

  return { daily, weekly, BY };
})();
