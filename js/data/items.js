/* ============ items.js — itens equipáveis (um por partida) ============
 * São encontrados em baús (ocasionalmente nos comuns, frequentemente nos com
 * cadeado) e podem ser largados por chefes derrotados. É permitido carregar apenas UM;
 * se encontrar outro, você escolhe qual manter. Duram a extensão da partida.
 */
G.Items = (() => {
  const LIST = [
    { id: 'leftovers', name: 'Restos', desc: 'Recupera 1,5% dos seus PV máximos por segundo.',
      on: p => { p.regenFlat += p.maxHp * 0.015; p._itemRegen = p.maxHp * 0.015; },
      off: p => { p.regenFlat -= p._itemRegen || 0; } },
    { id: 'choiceband', name: 'Faixa da Escolha', desc: '+40% de dano bônus, mas você não pode trocar de ataque ativo.',
      on: p => { p.atkMul *= 1.4; }, off: p => { p.atkMul /= 1.4; } },
    { id: 'quickclaw', name: 'Garra Rápida', desc: '-20% de tempo de recarga em todas as suas habilidades.',
      on: p => { p.cdMul *= 0.8; }, off: p => { p.cdMul /= 0.8; } },
    { id: 'focussash', name: 'Faixa de Foco', desc: 'Um golpe que causaria nocaute fatal deixa você com 1 de PV (recarga a cada 60s).',
      on: () => {}, off: () => {} },
    { id: 'shellbell', name: 'Sino de Concha', desc: 'Recupera PV proporcionalmente ao dano causado aos inimigos.',
      on: () => {}, off: () => {} },
    { id: 'amuletcoin', name: 'Moeda de Amuleto', desc: '+50% de PokéMoedas adicionais ao concluir a partida.',
      on: p => { p.coinMul *= 1.5; }, off: p => { p.coinMul /= 1.5; } },
    { id: 'luckyegg', name: 'Ovo da Sorte', desc: '+30% de experiência obtida em batalha.',
      on: p => { p.xpMul *= 1.3; }, off: p => { p.xpMul /= 1.3; } },
    { id: 'lifeorb', name: 'Esfera da Vida', desc: '+30% de dano bônus, mas cada ataque consome uma pequena fração de PV.',
      on: p => { p.atkMul *= 1.3; }, off: p => { p.atkMul /= 1.3; } },
    { id: 'choicescarf', name: 'Lenço da Escolha', desc: '+35% de velocidade de movimento.',
      on: p => { p.spdMul *= 1.35; }, off: p => { p.spdMul /= 1.35; } },
    { id: 'rockyhelmet', name: 'Capacete Rígido', desc: 'Inimigos que golpeiam você em combate corpo a corpo sofrem dano de retaliação.',
      on: () => {}, off: () => {} },
    { id: 'assaultvest', name: 'Colete de Assalto', desc: '+20% de redução no dano sofrido.',
      on: p => { p.dmgReduce += 0.2; }, off: p => { p.dmgReduce -= 0.2; } }
  ];
  const BY = {};
  for (const it of LIST) BY[it.id] = it;

  /** Sorteia um item aleatório diferente do atual */
  function roll(except) {
    const pool = LIST.filter(i => i.id !== except);
    return G.U.pick(pool).id;
  }

  return { LIST, BY, roll };
})();
