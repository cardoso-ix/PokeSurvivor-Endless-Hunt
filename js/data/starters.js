/* ============ starters.js — companheiros iniciais e teste de personalidade ============
 * Como em Pokémon Mystery Dungeon: perguntas definem sua personalidade, e sua
 * personalidade revela seu companheiro inicial ideal. Você também pode escolher livremente.
 */
G.STARTERS = [
  { dex: 1,   start: 'vine-whip',     traits: ['leal', 'paciente'] },
  { dex: 4,   start: 'ember',         traits: ['valiente', 'impulsivo'] },
  { dex: 7,   start: 'water-gun',     traits: ['prudente', 'leal'] },
  { dex: 152, start: 'vine-whip',     traits: ['dulce', 'paciente'] },
  { dex: 155, start: 'ember',         traits: ['tímido', 'impulsivo'] },
  { dex: 158, start: 'water-gun',     traits: ['travieso', 'valiente'] },
  { dex: 252, start: 'razor-leaf',    traits: ['sereno', 'astuto'] },
  { dex: 255, start: 'ember',         traits: ['alegre', 'valiente'] },
  { dex: 258, start: 'water-gun',     traits: ['tenaz', 'leal'] },
  { dex: 387, start: 'vine-whip',     traits: ['paciente', 'tenaz'] },
  { dex: 390, start: 'ember',         traits: ['travieso', 'alegre'] },
  { dex: 393, start: 'bubble',        traits: ['orgulloso', 'prudente'] },
  { dex: 495, start: 'razor-leaf',    traits: ['orgulloso', 'astuto'] },
  { dex: 498, start: 'ember',         traits: ['tenaz', 'alegre'] },
  { dex: 501, start: 'water-gun',     traits: ['valiente', 'travieso'] },
  { dex: 650, start: 'vine-whip',     traits: ['travieso', 'tenaz'] },
  { dex: 653, start: 'ember',         traits: ['astuto', 'sereno'] },
  { dex: 656, start: 'water-gun',     traits: ['sereno', 'astuto'] },
  { dex: 722, start: 'razor-leaf',    traits: ['sereno', 'dulce'] },
  { dex: 725, start: 'ember',         traits: ['solitario', 'orgulloso'] },
  { dex: 728, start: 'bubble',        traits: ['alegre', 'dulce'] },
  { dex: 810, start: 'vine-whip',     traits: ['alegre', 'travieso'] },
  { dex: 813, start: 'ember',         traits: ['impulsivo', 'alegre'] },
  { dex: 816, start: 'water-gun',     traits: ['tímido', 'astuto'] },
  { dex: 906, start: 'razor-leaf',    traits: ['solitario', 'astuto'] },
  { dex: 909, start: 'ember',         traits: ['tranquilo', 'tenaz'] },
  { dex: 912, start: 'water-gun',     traits: ['orgulloso', 'prudente'] },
  { dex: 54,  start: 'confusion',     traits: ['caótico', 'tímido'] },
  { dex: 79,  start: 'confusion',     traits: ['tranquilo', 'paciente'] }
];

G.STARTER_BY = {};
for (const s of G.STARTERS) G.STARTER_BY[s.dex] = s;

/** Movimento inicial de qualquer Pokémon (starter ou de catálogo). */
G.startMoveOf = dex => {
  const s = G.STARTER_BY[dex];
  return s ? s.start : G.Moves.startFor(G.DEX_BY[dex]);
};

/** Nomes amigáveis em português para cada traço de personalidade */
G.TRAIT_NAME = {
  valiente:  'Corajoso',
  impulsivo: 'Impulsivo',
  prudente:  'Prudente',
  leal:      'Leal',
  paciente:  'Paciente',
  dulce:     'Gentil',
  tímido:    'Tímido',
  travieso:  'Travesso',
  sereno:    'Sereno',
  astuto:    'Astuto',
  alegre:    'Alegre',
  tenaz:     'Determinado',
  orgulloso: 'Orgulhoso',
  solitario: 'Solitário',
  tranquilo: 'Tranquilo',
  caótico:   'Imprevisível'
};

/** Descrição detalhada de cada traço para a tela de resultado */
G.TRAIT_TEXT = {
  valiente:  'Você não pensa duas vezes quando alguém precisa de ajuda.',
  impulsivo: 'Você age primeiro e pensa depois. Às vezes dá muito certo!',
  prudente:  'Você calcula e planeja cada passo antes de agir.',
  leal:      'Seus amigos sabem que sempre podem contar com você.',
  paciente:  'Você sabe aguardar pacientemente pelo momento ideal.',
  dulce:     'Sua bondade traz paz e tranquilidade a todos ao seu redor.',
  tímido:    'Dar o primeiro passo pode ser difícil, mas você tem um coração nobre.',
  travieso:  'Você sempre tem uma brincadeira divertida na ponta da língua.',
  sereno:    'Você mantém a calma e o foco mesmo nas situações mais difíceis.',
  astuto:    'Você enxerga saídas brilhantes onde os outros só veem problemas.',
  alegre:    'Você contagia todos com seu entusiasmo e positividade.',
  tenaz:     'Desistir nunca fez nem fará parte dos seus planos.',
  orgulloso: 'Você busca sempre a excelência e quase sempre a alcança.',
  solitario: 'Você trilha seu próprio caminho sem se preocupar com a opinião alheia.',
  tranquilo: 'Nada é capaz de tirar a sua paz interior. Absolutamente nada.',
  caótico:   'Nem você mesmo sabe o que vai aprontar no instante seguinte.'
};

G.PERSONALITY_TEST = [
  { q: 'Há uma confusão no centro da cidade! O que você faz?', a: [
    { t: 'Entro para ajudar sem pensar duas vezes.',           p: { valiente: 2, impulsivo: 1 } },
    { t: 'Procuro alguém que possa intervir.',                 p: { prudente: 2, leal: 1 } },
    { t: 'Observo tudo de longe com cautela.',                 p: { sereno: 1, tímido: 1, solitario: 1 } },
    { t: 'Dou risada e incentivo a disputa.',                  p: { travieso: 2, caótico: 1 } } ] },
  { q: 'Você encontra uma carteira caída no chão.', a: [
    { t: 'Levo imediatamente para as autoridades.',            p: { leal: 2, dulce: 1 } },
    { t: 'Procuro pelo dono mesmo que leve horas.',            p: { tenaz: 2, paciente: 1 } },
    { t: 'Primeiro vejo o que tem dentro…',                   p: { astuto: 2, travieso: 1 } },
    { t: 'Nem toco nela, melhor evitar problemas.',            p: { prudente: 1, tímido: 2 } } ] },
  { q: 'O seu dia de folga perfeito é…', a: [
    { t: 'Uma aventura cheia de emoção sem planos definidos.', p: { impulsivo: 2, alegre: 1 } },
    { t: 'Ler, refletir e descansar com calma.',               p: { sereno: 2, tranquilo: 1 } },
    { t: 'Reunir toda a turma de amigos.',                     p: { alegre: 2, leal: 1 } },
    { t: 'Treinar intensamente para superar meus limites.',    p: { tenaz: 2, orgulloso: 1 } } ] },
  { q: 'Amanhã você tem uma prova muito importante.', a: [
    { t: 'Estudo até altas horas da madrugada.',               p: { tenaz: 2, prudente: 1 } },
    { t: 'Reviso apenas o essencial: confio no meu potencial.', p: { orgulloso: 2, sereno: 1 } },
    { t: 'Fico muito ansioso e preocupado.',                   p: { tímido: 2, dulce: 1 } },
    { t: 'Prova? Amanhã eu decido o que fazer!',               p: { caótico: 2, tranquilo: 1 } } ] },
  { q: 'O que seus amigos costumam dizer sobre você?', a: [
    { t: 'Que sou a pessoa mais divertida do grupo.',          p: { alegre: 2, travieso: 1 } },
    { t: 'Que sempre podem contar com meu apoio incondicional.', p: { leal: 2, dulce: 1 } },
    { t: 'Que tenho um ar misterioso e fascinante.',           p: { solitario: 2, astuto: 1 } },
    { t: 'Que tenho uma determinação inabalável.',              p: { valiente: 1, tenaz: 2 } } ] },
  { q: 'O caminho se divide: um atalho sombrio e rápido, ou uma trilha longa e ensolarada.', a: [
    { t: 'O caminho sombrio: adoro pura adrenalina!',          p: { valiente: 2, impulsivo: 1 } },
    { t: 'A trilha longa, com paciência e segurança.',         p: { paciente: 2, prudente: 1 } },
    { t: 'Sento para ponderar com calma qual escolher.',       p: { tranquilo: 2, sereno: 1 } },
    { t: 'Nenhum dos dois: abro uma nova trilha por conta própria.', p: { astuto: 2, caótico: 1 } } ] },
  { q: 'Alguém tenta zombar de você na frente de todos.', a: [
    { t: 'Respondo e confronto na mesma hora.',                p: { orgulloso: 2, impulsivo: 1 } },
    { t: 'Ignoro completamente: não vale o meu tempo.',        p: { sereno: 2, solitario: 1 } },
    { t: 'Fico chateado, embora disfarce por fora.',           p: { tímido: 2, dulce: 1 } },
    { t: 'Devolvo com uma piada ainda mais afiada.',           p: { travieso: 2, astuto: 1 } } ] },
  { q: 'O que é mais precioso para você?', a: [
    { t: 'A verdadeira amizade.',                              p: { leal: 2, alegre: 1 } },
    { t: 'A minha liberdade.',                                 p: { solitario: 2, impulsivo: 1 } },
    { t: 'A paz e a tranquilidade.',                           p: { tranquilo: 2, paciente: 1 } },
    { t: 'Ser o melhor no que faço.',                          p: { orgulloso: 2, tenaz: 1 } } ] }
];

/** Pontuações de traços -> { trait, dex } com o companheiro que melhor combina. */
G.personalityResult = scores => {
  const trait = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
  let best = [], bestScore = -1;
  for (const s of G.STARTERS) {
    const v = (scores[s.traits[0]] || 0) * 2 + (scores[s.traits[1]] || 0);
    if (v > bestScore) { bestScore = v; best = [s]; }
    else if (v === bestScore) best.push(s);
  }
  return { trait, dex: G.U.pick(best).dex };
};
