# Changelog — PokéSurvivor: Endless Hunt

Todas as alterações notáveis, correções de bugs e novas mecânicas deste projeto são documentadas neste arquivo.

---

## [Não Lançado] — 31/10/2026 (combo por nível, Mega v2, cenário)

### ⚔️ Combo por nível
- **Nv. 1: 1 ataque · Nv. 5: combo de 2 · Nv. 10: combo de 3 · Nv. 21: combo de 4.** Os ataques do combo são os primeiros aprendidos e disparam todos juntos; os demais ficam guardados e entram quando o combo cresce. HUD mostra o combo atual, os guardados (`ENTRA NO NV. X`) e o próximo marco.
- **Removidos:** a tela de fusão depois de concluir um Rift, o Elo de Fusão (`pl.bonds`), a tecla `B` e a seleção manual de slot (`1`-`4`, `Q`/`E`/`Tab`, clique no card). `BalanceConfig.player.evolution.quadComboLevel` virou `comboLevels: [5, 10, 21]`.

### 🏆 Ranking e evolução
- **Ranking zerado** para o lançamento (tabelas novas com sufixo `k`; as antigas ficam no servidor, intactas).
- **Evolução de linhas com 2 estágios no Nv 12** (antes no 5); linhas de 3 estágios continuam em 5 e 12.

### 🌟 Mega v2
- Cinemática curta (0,9 s) + carga + **golpe único em tela cheia, em pixel art**, com dano em área nos impactos; depois, só o buff de 10 s (sem cenário contínuo). Um golpe assinatura para cada um dos 18 tipos (meteoros, tsunami em 3 ondas, raios, nevasca, espinhos, punho titânico, gêiseres tóxicos, terremoto, furacão, implosão psíquica, enxame, chuva de pedras, orbe espectral, vazio sombrio, dragão, corte de aço, lua rosa, hiper raio).

### 🎨 Cenário
- Chão sem repetição visível, 3 formas por árvore/cristal/pedra em cada bioma, luz e vinheta por bioma e névoa pré-desenhadas (sem gradiente por frame).

---

## [Não Lançado] — 30/10/2026 (varredura geral — etapa 1)

### 🔍 Varredura automatizada + correções
- **Fonte Pixelify:** o **"C" maiúsculo parecia "O"** ("Oonta", "Oonfigurações", "Olassificação") porque a fenda do glifo era de 1 px. Fenda aberta nas fontes 400 e 700. As ligaduras `fi`/`fl`/`fg` renderizavam como "A" ("PerAl" no lugar de "Perfil") e foram removidas das fontes.
- **Textos:** "Novedades" → "Novidades" (pt-BR e tradução inglesa); a regra da Roleta Gacha agora mostra o valor real do bônus de repetido (150 moedas, antes dizia 250).
- **Testes corrigidos (estavam desatualizados, não eram bugs do jogo):** `test_meta_swap` (comparação de ponto flutuante), `test_rift_spawns` e `test_regions_dedup` (liberação de lendários em 30 Rifts conforme BalanceConfig; shiny de espécie já capturada é permitido).
- **HUD no celular (horizontal):** o cartão de status ocupava ~50% da tela; em telas com menos de 520 px de altura ele agora é reduzido a 62%.
- **Inglês:** os subtítulos do menu (Jogar, Missões, Amigos, recompensas, sala, online, solicitações) estavam fixos em português no `menu.js` e passaram a usar o i18n.
- **Vínculo (fusão de ataques) parecia apagar ataques:** os dados estavam corretos (os outros ataques e níveis continuavam), mas o card do HUD mostrava só o primeiro ataque do grupo fundido. Agora o card mostra os ícones, nomes e níveis de todos os ataques do grupo.
- **Adiar o vínculo:** novo botão **"Guardar para depois"** (ou `Esc`) na tela de fusão; o Elo fica guardado e a tela não reabre sozinha. Aperte **`B`** para usar quando quiser.
- **Rifts e captura varridos:** 3 Rifts seguidos e 6 casos forçados (lendário, shiny, repetido) terminam e saem da arena sem erro; o shiny paga 5.000 tickets uma vez só.
- **Resultado da varredura:** 0 erros de JS em 9 telas, nos 64 ataques (níveis 1 e 5) e numa run de 15 min (≈144 FPS, memória estável de 15–40 MB, 68–80 inimigos); todos os 966 Pokémon têm sprites e animações completos.

---

## [Não Lançado] — 30/10/2026 (remoção do trio)

### 🧹 Jogo volta a ter um único personagem
- **Removidos:** criação de personagem, Treinador (8 avatares), draft de 3 iniciais, fila indiana, ataques e cartas do trio (`squad_up`/`squad_evo`) e o item "Equipe e Treinador" do menu. A tela `js/ui/intro_creation.js` e seus 3 testes foram excluídos.
- **Fluxo:** login → teste de personalidade (primeira vez) → menu. Você joga com um Pokémon de Estágio 1 que evolui sozinho nos níveis 5, 12 e 21.
- **Causa-raiz do bug de renderização:** o avatar chamava `clearRect` no canvas do jogo e apagava o mapa em volta do jogador.
- **Saves:** campos `trainer`, `trainerGender` e `squad` deixam de ser criados; em saves que já os tenham, ficam inertes.

---

## [Não Lançado] — 30/10/2026

### ⚖️ Rebalanceamento Médio → Difícil (Fase 2 da preparação de lançamento)
- **Economia:** fim de partida paga 2 moedas/s (era 3), 1,6 por abate (era 2,5) e 550 por chefe (era 800). Run de 15 min ≈ 7 mil moedas (antes ≈ 10 mil+).
- **Upgrades:** crescimento de custo +0,03 em todos os níveis da loja (exceto Segundo Ataque e Banir). Árvore base fica mais lenta, sem mexer em níveis já comprados.
- **Gacha:** taxas dos tickets 71/20/7,2/1,4/0,4 (Comum→Lendário); reembolso de repetidos reduzido em 40% (9/18/36/72/180) e roleta paga 150 por repetido (era 250). Pity e custos intactos.
- **XP:** a partir do nível 12 o custo por nível sobe +3,5% por nível (teto ×1,7). Nv 20: 1.722 → 2.204 XP.
- **Inimigos:** HP `1+t/110` (era `/140`), dano `1+t/480` (era `/600`), velocidade até +45% (era +35%), densidade 0,24 → 0,28, elites com dano ×1,4 (era ×1,25). Chefes: HP `1+t/450`, dano `1+t/420` e +~18% de dano base.
- **Captura:** taxas base 34/24/15% (estágios 1/2/3) e 5% lendário; teto 42% (era 48%) e 14% lendário (era 16%). Novo **bônus de risco** de até +6% quando o jogador captura com pouca vida.
- `src/config/balanceConfig.js` sincronizado com `js/config/balanceConfig.js`; teste de XP atualizado.

---

## [Não Lançado] — 27/10/2026

## [Versão Recente] — 19/10/2026

### 🇧🇷 Localização & Tradução Integral (pt-BR)
- **Varredura Completa de Strings:** 100% dos resíduos em espanhol e termos em "Portunhol" foram erradicados da base de código e interfaces.
- **Quiz de Personalidade:** 8 perguntas completas, todas as respostas e 16 traços de personalidade traduzidos para Português do Brasil.
- **Golpes & Habilidades:** 64 ataques de base e 60 evoluções de ataques com nomenclatura oficial padronizada em pt-BR.
- **Itens Equipáveis:** Tradução dos 11 itens equipáveis e suas descrições mecânicas.
- **Interface & HUD:** Painéis de status, configurações, abas, game over, bússola e textos flutuantes do Canvas em pt-BR.

### 🌀 Captura Diegética no Mapa (World-Space Pokéball)
- **Eliminação de Modais de Pausa:** A captura ocorre fisicamente no chão da arena via `WorldCaptureBall` sem pausar o combate.
- **Física de Lançamento & Balanço:** Queda suave com gravidade e 3 balanços físicos de tensão no solo (-28°, +28°, -28°).
- **Feedback Visual & Sonoro:** SFX clássico de clique com brilho dourado no sucesso, fumaça cinza na falha.
- **Balanceamento Rigoroso de Rifts:** 75% Comum, 15% Shiny, 9% Lendário (com trava de 30+ Rifts), 1% Lendário Shiny.
- **Gold Ball no Nv. 41+:** 10% de chance de proc com 100% de taxa garantida e +1.000 moedas de bônus.

### 🌟 Mega Overdrive Elemental Dinâmico (18 Tipos)
- **Adaptação Dinâmica ao Elemento do Líder:** Leitura automática do tipo primário da equipe, disparando efeitos visuais massivos em área.
- **Catálogo de Ultimates (`MEGA_ULTIMATES_DATA`):** Efeitos exclusivos para os 18 tipos elementais (chuva de meteoros, geysers, raízes vampíricas, nevasca, etc.).
- **Duração de 10 Segundos:** Drenagem linear uniforme sem buffs mecânicos caóticos de cadência de tiro.
- **Botão Físico Retro (`#hud-mega-btn`):** 3 estados reativos (Carregando %, Pronto com pulso dourado e Ativo com cronômetro regressivo).

### ⚡ Marcos de Evolução Automática
- **Evolução Fluida nos Níveis 5, 12 e 21:** Transformação automática das 434 espécies evoluíveis sem poluir as opções de cartas de Level Up.

### 🎴 HUD Inferior Retro & Atributos em Tempo Real
- **Painel de Atributos (`#stats-rpg-panel`):** Exibição em tempo real de ATK, DEF, SPD, CDA, CRT, MAG, APR e REG.
- **Design Retrô GBA/DS:** Molduras chanfradas e responsivas para PC e Mobile.
