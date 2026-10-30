# Changelog — PokéSurvivor: Endless Hunt

Todas as alterações notáveis, correções de bugs e novas mecânicas deste projeto são documentadas neste arquivo.

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

### 🎮 Criação de Personagem & Fila Indiana dos 3 Iniciais (Gerações 1 a 9)
- **Tela de Criação (`js/ui/intro_creation.js`):** escolha do Treinador (8 protagonistas, abas Menino/Menina) e draft livre de 3 iniciais entre os 27 oficiais das 9 gerações, com filtro por geração e contador de seleção.
- **Fila Indiana Segura:** o Treinador mantém toda a física nativa; os 3 companheiros escoltam em trilha com atrasos de histórico de 12, 24 e 36 frames.
- **Ataques autônomos e evolução do trio:** projéteis na cor do tipo elementar de cada membro, cartas de reforço (`squad_up`) e de evolução de espécie (`squad_evo`) ao subir de nível.
- **Persistência:** `trainer`, `trainerGender` e `squad` gravados no save, editáveis em **Equipe e Treinador** no menu principal.
- **Correções de integração:** `hitKnock` → `knock` (o knockback era descartado), SFX `powerup`/`unselect` adicionados ao mapa de áudio, campos do trio incluídos em `newSave()` (migração de saves antigos) e tela de login escondida antes da criação de personagem.

---

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
