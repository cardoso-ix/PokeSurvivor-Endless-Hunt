/* ============ changelog.js — novidades do jogo ============
 * O conteúdo de novidades será integrado diretamente de forma online.
 *
 * Formato de cada entrada:
 *   d: 'AAAA-MM-DD'                data da entrada
 *   title: [idioma padrão, inglês]  título
 *   new / chg / fix: [[texto padrão, texto inglês], ...]
 *
 * A entrada mais recente fica no índice 0 (é a que acende o ponto de
 * "novidades" no menu, comparado com a data guardada em localStorage).
 */
G.CHANGELOG = [
  {
    d: '2026-10-30',
    title: [
      'Mais difícil e mais estratégico',
      'Harder and more strategic'
    ],
    chg: [
      [
        'Dificuldade: inimigos e chefes ficam mais fortes e mais rápidos com o tempo, e as hordas são mais densas.',
        'Difficulty: enemies and bosses get stronger and faster over time, and hordes are denser.'
      ],
      [
        'Economia: menos moedas por partida e upgrades mais caros. Gacha com taxas mais raras e menos moedas por repetido.',
        'Economy: fewer coins per run and pricier upgrades. Gacha has rarer rates and fewer coins per duplicate.'
      ],
      [
        'Captura: chances menores. Capturar com pouca vida dá um bônus de até +6%.',
        'Capture: lower odds. Capturing at low health gives a bonus of up to +6%.'
      ],
      [
        'Experiência: a partir do nível 12 cada nível exige mais XP.',
        'Experience: from level 12 on, each level needs more XP.'
      ]
    ]
  }
];
