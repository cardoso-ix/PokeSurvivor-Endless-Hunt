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
    d: '2026-10-27',
    title: [
      'Criação de personagem e trio em fila indiana',
      'Character creation and your trio in a follow line'
    ],
    new: [
      [
        'Criação de personagem: escolha o Treinador (8 protagonistas, abas Menino e Menina) e monte o trio inicial entre os 27 iniciais das 9 gerações, com filtro por geração.',
        'Character creation: pick your trainer (8 protagonists, boy and girl tabs) and draft your trio from the 27 starters across 9 generations, with a generation filter.'
      ],
      [
        'Fila indiana: os 3 companheiros seguem o Treinador em trilha, com atrasos seguros de 12, 24 e 36 frames.',
        'Follow line: your 3 companions trail the trainer with safe 12, 24 and 36 frame delays.'
      ],
      [
        'Ataques autônomos do trio: cada companheiro atira sozinho, com o projétil na cor do seu tipo elementar.',
        'Autonomous squad attacks: each companion fires on its own, with its projectile in its elemental type colour.'
      ]
    ],
    chg: [
      [
        'Cartas de nível do trio: reforço (+25% de dano, −10% de recarga) e evolução de espécie (Charmander ➔ Charmeleon, +35% de dano).',
        'Squad level-up cards: upgrades (+25% damage, −10% cooldown) and species evolution (Charmander ➔ Charmeleon, +35% damage).'
      ],
      [
        'O Treinador, o trio e o gênero escolhido ficam guardados na conta e podem ser trocados em Equipe e Treinador, no menu.',
        'Your trainer, trio and gender are saved to your account and can be changed later under Team and Trainer in the menu.'
      ]
    ]
  }
];
