/* ============ missions.js — modelos de missões diárias e semanais ============
 * A cada dia surgem 3 diárias e a cada semana 2 semanais com
 * objetivos e tipos sorteados. São completadas jogando e a recompensa
 * é resgatada no menu de Missões. A lógica reside em systems/progress.js.
 */
G.MissionDefs = (() => {
  const T = t => G.U.TYPE_NAME[t];
  const min = d => Math.floor(d.time / 60);

  const daily = [
    { id: 'kill', ev: 'kill', goals: [300, 500, 800], reward: { t1: 2, coins: 150 },
      text: n => `Derrote ${n} Pokémon` },
    { id: 'killType', ev: 'kill', param: 'type', goals: [30, 50, 80], reward: { t1: 2, coins: 200 },
      match: (d, t) => d.types.includes(t), text: (n, t) => `Derrote ${n} Pokémon do tipo ${T(t)}` },
    { id: 'survive', ev: 'runEnd', mode: 'max', value: min, goals: [5, 7, 9], reward: { t1: 3, coins: 200 },
      text: n => `Sobreviva por ${n} minutos em uma partida` },
    { id: 'level', ev: 'runEnd', mode: 'max', value: d => d.level, goals: [8, 12, 15], reward: { t1: 2, coins: 200 },
      text: n => `Alcance o nível ${n} em uma partida` },
    { id: 'boss', ev: 'kill', match: d => d.boss, goals: [1, 2], reward: { t1: 3, coins: 250 },
      text: n => (n === 1 ? 'Derrote um chefe' : `Derrote ${n} chefes`) },
    { id: 'chest', ev: 'chest', goals: [1, 2], reward: { t1: 2, coins: 200 },
      text: n => (n === 1 ? 'Abra um baú com cadeado' : `Abra ${n} baús com cadeado`) },
    { id: 'coins', ev: 'runEnd', value: d => d.coins, goals: [100, 200, 300], reward: { t1: 2, coins: 150 },
      text: n => `Colete ${n} PokéMoedas em suas partidas` },
    { id: 'playType', ev: 'runEnd', param: 'type', mode: 'max', value: min, goals: [3], reward: { t1: 3, coins: 200 },
      match: (d, t) => d.types.includes(t), text: (n, t) => `Sobreviva por ${n} minutos com um Pokémon do tipo ${T(t)}` },
    { id: 'item', ev: 'item', goals: [1], reward: { t1: 2, coins: 150 },
      text: () => 'Encontre um item equipável' },
    { id: 'evolve', ev: 'evolve', goals: [1], reward: { t1: 3, coins: 250 },
      text: () => 'Evolua uma habilidade' }
  ];

  const weekly = [
    { id: 'wkill', ev: 'kill', goals: [4000, 6000], reward: { t10: 1, coins: 800 },
      text: n => `Derrote ${n.toLocaleString('pt-BR')} Pokémon` },
    { id: 'wrift', ev: 'rift', goals: [1, 2], reward: { t10: 1, coins: 1000 },
      text: n => (n === 1 ? 'Vença uma batalha em uma fenda (Rift)' : `Vença ${n} batalhas em fendas (Rift)`) },
    { id: 'wboss', ev: 'kill', match: d => d.boss, goals: [4, 6], reward: { t10: 1, coins: 900 },
      text: n => `Derrote ${n} chefes` },
    { id: 'wsurvive', ev: 'runEnd', mode: 'max', value: min, goals: [12, 15], reward: { t10: 1, coins: 1000 },
      text: n => `Sobreviva por ${n} minutos em uma partida` },
    { id: 'wevolve', ev: 'evolve', goals: [3, 5], reward: { t10: 1, coins: 900 },
      text: n => `Evolua ${n} habilidades` },
    { id: 'wdaily', ev: 'missionDone', match: d => d.daily, goals: [8, 12], reward: { t10: 1, coins: 800 },
      text: n => `Complete ${n} missões diárias` }
  ];

  const BY = {};
  for (const m of daily.concat(weekly)) BY[m.id] = m;

  return { daily, weekly, BY };
})();
