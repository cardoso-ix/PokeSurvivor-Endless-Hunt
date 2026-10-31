# 📖 MANUAL TÉCNICO DE AUDITORIA & REGRAS DO JOGO
## PokéSurvivor: Endless Hunt — Especificação Matemática e Regras Oficiais

Este documento é a referência técnica oficial e absoluta para **auditoria, balanceamento, testes de QA e parametrização matemática** de todos os sistemas de jogo integrados ao PokéSurvivor.

---

## 📑 ÍNDICE GERAL
1. [Arquitetura & Ciclo Fundamental da Partida](#1-arquitetura--ciclo-fundamental-da-partida)
2. [Sistema Diegético de Captura & Tabela Matricial de Porcentagens](#2-sistema-diegético-de-captura--tabela-matricial-de-porcentagens)
3. [Fendas Dimensionais (Rifts) & Regras de Estágios dos Chefes](#3-fendas-dimensionais-rifts--regras-de-estágios-dos-chefes)
4. [Sistema de Roleta Gacha (5.000 Tickets) & Conversões](#4-sistema-de-roleta-gacha-5000-tickets--conversões)
5. [Sistema de Mega Evolução (Overdrive Cósmico & 18 Ultimates)](#5-sistema-de-mega-evolução-overdrive-cósmico--18-ultimates)
6. [Mecânica do Super Combo de Nível 20 (4 Ataques Simultâneos)](#6-mecânica-do-super-combo-de-nível-20-4-ataques-simultâneos)
7. [HUD Retro Pixel Art Superior Esquerdo & Os 8 Atributos RPG](#7-hud-retro-pixel-art-superior-esquerdo--os-8-atributos-rpg)
8. [Árvore de Melhorias Permanentes & Multiplicador de Estágio](#8-árvore-de-melhorias-permanentes--multiplicador-de-estágio)
9. [Geração de Inimigos, Hordas e Cronograma dos Grandes Chefes](#9-geração-de-inimigos-hordas-e-cronograma-dos-grandes-chefes)
10. [Comandos de Auditoria e Depuração no Console (F12)](#10-comandos-de-auditoria-e-depuração-no-console-f12)
11. [Menu Admin: Gestão de Tickets, Roleta Gacha & Pokédex](#11-menu-admin-gestão-de-tickets-roleta-gacha--pokédex)
12. [Atualizações Mestres: Gameplay Contínua, Ranking Duplo & Atributos Oficiais](#12-atualizações-mestres-gameplay-contínua-ranking-duplo--atributos-oficiais)

---

## 1. Arquitetura & Ciclo Fundamental da Partida

- **Motor Gráfico:** Canvas 2D nativo em 60 FPS com pixel art nítido (`imageSmoothingEnabled = false`).
- **Sistema de Coordenadas:** Grid em tiles (`TS = 16px * 2 = 32px`).
- **Ciclo de Sobrevivência:**
  - Partida padrão dura até **30 minutos (1.800 segundos)**.
  - Aos 30 minutos, inicia a **Sentença de Arceus**, que encerra a run com juízo cósmico implacável.
- **Persistência de Dados:**
  - Save armazenado em `localStorage['pokesurvivor_save']` com fallback em IndexedDB.
  - Campos vitais: `owned` (Pokédex normal), `shiny` (Pokédex brilhante), `coins` (PokéMoedas), `tickets` (t1 normais e t10 multiplicadores), `upgrades` (níveis de melhoria comprados).

---

## 2. Sistema Diegético de Captura & Tabela Matricial de Porcentagens

A captura no PokéSurvivor é **100% diegética e em tempo real**: ocorre diretamente no mapa através de uma Pokébola física arremessada no chão com física de balanço, sem pausar o combate nem abrir menus intrusivos.

### 2.1. Taxas Base por Categoria de Pokémon
As taxas base de captura (`BaseRate`) são definidas pela raridade do monstro:
- ⚪ **Pokémon Comum / Normal / Incomum / Raro:** `50%` (`0.50`)
- 👑 **Pokémon Lendário / Mítico (Raridade 5):** `20%` (`0.20`)
- ✨ **Variante Shiny (Prioridade Máxima):** `15%` (`0.15`)
  *(Nota de Auditoria: Se um Pokémon for Lendário E Shiny, prevalece a taxa Shiny de 15%).*

### 2.2. Tiers de Pokébolas por Nível do Jogador
A Pokébola concedida na partida escala automaticamente conforme o **nível de experiência atual do Treinador**:

| Pokébola | Nível Requerido | Bônus Adicional | Cor do Topo / Acento | Ícone |
| :--- | :--- | :--- | :--- | :---: |
| 🔴 **Poké Ball** | Nv. 1 a 10 | `+0%` (`+0.00`) | `#ef4444` / `#dc2626` | 🔴 |
| 🔵 **Great Ball** | Nv. 11 a 20 | `+5%` (`+0.05`) | `#2563eb` / `#ef4444` | 🔵 |
| 🟡 **Ultra Ball** | Nv. 21 a 30 | `+10%` (`+0.10`) | `#1e293b` / `#facc15` | 🟡 |
| 🟣 **Ultimate Ball** | Nv. 31 em diante | `+15%` (`+0.15`) | `#7c3aed` / `#ec4899` | 🟣 |
| ⭐ **Gold Ball (Rara)** | Nv. 41+ (10% chance) | **Garantido (100%)** | `#ffd700` / `#ffaa00` | ⭐ |

### 2.3. Evento Especial: Gold Ball (Nv. 41+)
- **Condição de Proc:** Ao derrotar o Guardião do Rift com nível $\ge 41$, existe **10% de chance estocástica** de a bola se transformar na lendária **Gold Ball**.
- **Efeitos da Gold Ball:**
  1. Taxa de Captura: **100.0% Absoluto** (ignora teto e raridade do alvo).
  2. Bônus Monetário Imediato: **+1.000 PokéMoedas** creditadas no save do jogador.

### 2.4. Fórmula Matemática da Chance Final de Captura
$$\text{FinalChance} = \min\Big(0.95, \; \text{BaseRate} + \text{BallBonus}\Big)$$
*(Exceto Gold Ball, onde $\text{FinalChance} = 1.00$ sem teto de 95%).*

### 2.5. Matriz Completa de Probabilidades de Captura (%)

| Categoria do Alvo | 🔴 Poké Ball (Nv 1-10) | 🔵 Great Ball (Nv 11-20) | 🟡 Ultra Ball (Nv 21-30) | 🟣 Ultimate Ball (Nv 31+) | ⭐ Gold Ball (Nv 41+ · 10%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| ⚪ **Pokémon Comum** | **50.0%** | **55.0%** | **60.0%** | **65.0%** | **100.0%** (+1.000 Moedas) |
| 👑 **Pokémon Lendário** | **20.0%** | **25.0%** | **30.0%** | **35.0%** | **100.0%** (+1.000 Moedas) |
| ✨ **Pokémon Shiny** | **15.0%** | **20.0%** | **25.0%** | **30.0%** | **100.0%** (+1.000 Moedas) |

### 2.6. Comportamento da Física da Pokébola no Canvas
1. **Arremesso:** Arco balístico parabólico saindo do Treinador até o Guardião com duração de $0.35\text{s}$ a $0.60\text{s}$ ($v_z = 90$, rotação de $18\text{ rad/s}$).
2. **Impacto e Quiques:** Gravidade $g = 980\text{ px/s}^2$ com 2 quiques de desaceleração.
3. **Ciclo de Balanço (3 Estágios):**
   - Balanço 1: Inclinação para a esquerda ($-25^\circ$).
   - Balanço 2: Inclinação para a direita ($+25^\circ$).
   - Balanço 3: Inclinação para a esquerda ($-25^\circ$).
4. **Resolução:**
   - **Sucesso:** A bola centraliza em $0^\circ$, trava com brilho dourado (`locked`), faíscas estelares sobem e o registro é salvo.
   - **Falha:** A Pokébola abre (`open`), solta nuvem de fumaça cinza e o Pokémon foge da fenda.

---

## 3. Fendas Dimensionais (Rifts) & Regras de Estágios dos Chefes

As Fendas Dimensionais se abrem periodicamente pelo mapa a cada $\sim 2.5$ minutos ou com 20% a 100% de chance progressiva.

### 3.1. Regra de Nível para Aparição dos Guardiões
A pool de Pokémon selecionados como Guardião da Fenda obedece estritamente ao nível do jogador no momento da abertura:
- 🐣 **Nível 1 até 20:** Apenas Pokémon de **Estágio 1** (forma base / bebê / inicial).
- ⚡ **Nível 21 até 41:** Apenas Pokémon de **Estágio 2** (primeira evolução / intermediário).
- 👑 **Nível 42 em diante:** Apenas Pokémon de **Estágio 3** (segunda evolução / forma final suprema).

### 3.2. Escalonamento Completo de Características ($\text{Stg 1} < \text{Stg 2} < \text{Stg 3}$)
O chefe de Estágio 1 é calibrado como o mais fraco, o Estágio 2 é mais forte que o 1, e o Estágio 3 supera ambos em todas as características:

| Característica / Atributo | 🐣 Estágio 1 (Até Nv 20) | ⚡ Estágio 2 (Nv 21 a 41) | 👑 Estágio 3 (Nv 42+) |
| :--- | :--- | :--- | :--- |
| **Fórmula de HP Base** | `(2600 + t * 9) * 2.2 * scaleHp` | `(4200 + t * 14) * 3.0 * scaleHp` | `(7500 + t * 24) * 3.8 * scaleHp` |
| **HP Típico na Arena** | $\sim 5.700\text{ a }7.500\text{ PV}$ | $\sim 12.600\text{ a }16.500\text{ PV}$ | $\sim 27.000\text{ a }35.000\text{ PV}$ |
| **Dano de Colisão Base** | $22 + \lfloor t/25 \rfloor$ ($\sim 22\text{--}26$) | $44 + \lfloor t/18 \rfloor$ ($\sim 44\text{--}50$) | $68 + \lfloor t/12 \rfloor$ ($\sim 68\text{--}78$) |
| **Dano dos Projéteis (`shotDmg`)**| $14 + \lfloor t/45 \rfloor$ ($\sim 14\text{--}17$) | $25 + \lfloor t/35 \rfloor$ ($\sim 25\text{--}30$) | $38 + \lfloor t/25 \rfloor$ ($\sim 38\text{--}46$) |
| **Cadência de Disparo (`shotCd`)**| $1.25\text{s}$ (lento) | $0.85\text{s}$ (moderado) | $0.55\text{s}$ (rajada agressiva) |
| **Velocidade de Movimento (`spd`)**| $42\text{ a }70\text{ px/s}$ | $55\text{ a }95\text{ px/s}$ | $68\text{ a }118\text{ px/s}$ |
| **Raio de Detecção (`range`)** | $260\text{ px}$ | $330\text{ px}$ | $420\text{ px}$ |
| **Escala Visual no Canvas** | $1.00\times$ (porte padrão) | $1.15\times$ (porte ampliado) | $1.30\times$ (colosso imponente) |
| **EXP Concedida por Derrota** | $380 + 0.9t$ ($\sim 380\text{--}650$) | $800 + 1.5t$ ($\sim 800\text{--}1.250$) | $1.500 + 2.5t$ ($\sim 1.500\text{--}2.500$) |
| **Recompensa de Repetido na Dex** | 💰 $+500$ Moedas · 🎟️ $+500$ Tickets | 💰 $+750$ Moedas · 🎟️ $+750$ Tickets | 💰 $+1.000$ Moedas · 🎟️ $+1.000$ Tickets |

### 3.3. Rolagem de Raridade do Guardião (1 a 100)
- $\le 75$ ($75\%$): Pokémon Comum Normal.
- $76\text{ a }90$ ($15\%$): Pokémon Comum Shiny.
- $91\text{ a }99$ ($9\%$): Pokémon Lendário Normal *(Rebaixado para Comum Normal se o jogador tiver menos de 30 rifts concluídos)*.
- $100$ ($1\%$): Pokémon Lendário Shiny *(Rebaixado para Comum Shiny se rifts < 30)*.
- **Pity Garantido dos 500 Rifts:** A cada 500 rifts concluídos no save (`totalRifts % 500 === 0`), a variante Shiny é **100% garantida**.

---

## 4. Sistema de Roleta Gacha (5.000 Tickets) & Conversões

O jogo possui uma máquina de Roleta Gacha caça-níqueis retrô acessível pelo Menu Principal:

### 4.1. Economia de Ingressos (Tickets)
- **Custo do Giro Simples (×1):** `5.000 Tickets` normais (`t1`).
- **Custo do Giro Múltiplo (×5):** `25.000 Tickets` normais (`t1`).
- **Como Obter Tickets:** Abate de Guardiões de Rift, captura de duplicatas em Rifts ($+500$ a $+1.000$ tickets), baús lendários e conquistas de sobrevivência.

### 4.2. Probabilidades da Roleta Global (966 Pokémon)
A roleta sorteia entre **todas as 966 espécies** da Pokédex (Gerações 1 a 9):

| Categoria | Probabilidade Oficial | Observações |
| :--- | :---: | :--- |
| ✨ **Pokémon Shiny** | **1.0%** | Sorteia variante brilhante com faíscas estelares e sprite alternativo |
| 👑 **Pokémon Lendário / Mítico** | **5.0%** | Sorteia entre os 103 Lendários oficiais (Mewtwo, Arceus, Rayquaza, etc.) |
| ⚪ **Pokémon Normal** | **94.0%** | Sorteia entre as 863 espécies comuns, incomuns e raras |

### 4.3. Regra de Conversão de Pokémon Repetido na Roleta
- **Pokémon Inédito:** Desbloqueado e registrado imediatamente na Pokédex do save permanente.
- **Pokémon Repetido:** O jogador recebe instantaneamente **+1.000 PokéMoedas** por cópia duplicada para investir na árvore de melhorias permanentes!

---

## 5. Sistema de Mega Evolução (Overdrive Cósmico & 18 Ultimates)

A Mega Evolução é o ápice ofensivo e defensivo da batalha, ativada ao carregar a barra em 100% e pressionar a tecla `Espaço` ou clicar no botão físico do HUD.

### 5.1. Regras de Carregamento & Acúmulo
- **Capacidade Máxima:** `100 de Energia Mega`.
- **Taxa de Carga:** Orbes de energia dropadas por inimigos derrotados (+0.5% a +3.0% por abate, escalonado pela força do inimigo).
- **Aviso de Prontidão:** Ao atingir 100%, emite SFX especial e anúncio: `⚡ MEGA PRONTO! Pressione [ESPAÇO] para ativar!`.

### 5.2. Cutscene Cinematográfica Estendida de Anime (2.8s)
- **Duração Total:** `2.8 segundos` de slow-motion cinematográfico.
- **Fases Temporais:**
  1. *Entrada Suave (0.0s – 0.65s):* Curva cúbica suave (ease-out cubic) com entrada do card e sprite animado ampliado do Pokémon.
  2. *Sustentação Heroica (0.65s – 2.30s):* Foco total no Pokémon, nome da espécie, badge `⚡ MEGA OVERDRIVE ATIVADO! ⚡` e anúncio do poder elemental.
  3. *Saída Fluida (2.30s – 2.80s):* Desvanecimento gradual e transição para a tempestade de habilidades.
- **Efeitos Visuais:** 26 speedlines em slow motion com alfa variável e vibração de tela suave (`Camera.kick(1.8)`).

### 5.3. Efeitos do Estado de Overdrive (Duração: 10.0s)
Durante os **10.0 segundos** de Overdrive, o personagem entra em estado de transcendência heroica com os seguintes efeitos:
1. 📏 **Gigantismo Heroico & Crescimento Visual:** O Pokémon cresce fisicamente no Canvas, transicionando suavemente para **1.55× do seu tamanho original**, escalando sua silhueta, colisão corporal (`this.r` e `this.bodyH`) e projeção de sombra no solo.
2. 🥊 **Força & Dano Dobrados (2.0× ATK):** Todos os ataques, projéteis, feixes e zonas do jogador causam **+100% de dano base** ($2.0\times$).
3. 👟 **Velocidade Dobrada (2.0× SPD):** A velocidade de locomoção base e em corrida é duplicada ($2.0\times$, $+100\%$), permitindo reposicionamento tático instantâneo.
4. 🛡️ **Super Defesa & Armadura Inabalável (DEF):** Absorção direta de impacto reduzida para apenas 15% (`dmgTakenMul = 0.15`), com piso mínimo de **80% a 92% de redução de dano** calculada no HUD.
5. ⏱️ **Cadência de Ataque Duplicada (CDA):** O cooldown de todos os ataques do deck é cortado pela metade (`cdMul × 0.5`), disparando habilidades com o dobro da frequência.
6. 🌿 **Regeneração Duplicada (REG):** Regeneração de PV por segundo dobrada ($2.0\times$), com garantia mínima de $+12.0\text{ PV/s}$.
7. ⭐ **Chance Crítica Ampliada (CRT):** Chance de dano crítico duplicada com bônus de $+30\%$.
8. 🧲 **Super Ímã Magnético (MAG):** Raio de atração de gemas de EXP e PokéMoedas duplicado para $156\text{px}$ ($+100\%$).
9. 🌪️ **Drenagem Linear Contínua:** A barra do HUD e o botão físico drenam gradualmente de 100% até 0% em exatamente 10 segundos.

### 5.4. Catálogo dos 18 Poderes Supremos Elementais (`MEGA_ULTIMATES_DATA`)

| Elemento | Nome do Poder | Mecânica e Efeitos no Campo |
| :--- | :--- | :--- |
| 🔥 `fire` | **Cataclismo de Meteoros** | Chuva diagonal contínua de meteoros de fogo que abrem crateras e poças de brasa no solo. |
| 💧 `water` | **Dilúvio Primordial** | Gêiseres de água de alta pressão e chuva torrencial com 40% de lentidão nos monstros. |
| 🌿 `grass` | **Frenesi da Floresta Viva** | Vinhas espinhosas perfurantes que convertem 15% do dano causado em cura de PV ao jogador. |
| ⚡ `electric` | **Tempestade de Raios do Trovão** | Arcos voltaicos e relâmpagos verticais que pulam em cadeia entre monstros da horda. |
| ❄️ `ice` | **Era Glacial Absoluta** | Nevasca contínua com estalactites caindo e congelamento total de monstros por 2.5s. |
| 🐉 `dragon` | **Cometa do Dragão Astral** | Bombardeio massivo de esferas cósmicas que geram ondas de choque explosivas. |
| 👻 `ghost` | **Pesadelo do Purgatório** | Fissuras espectrais roxas no chão que drenam a vitalidade dos inimigos em área. |
| 🔮 `psychic` | **Colapso Cinético Dimensional** | Pulso gravitacional que comprime todos os inimigos da tela no centro e explode. |
| 🌍 `ground` | **Fissura Tectônica Continental** | Terremoto em zigue-zague que racha o solo e pulveriza inimigos terrestres. |
| 🪨 `rock` | **Desabamento de Megálitos** | Queda de blocos de pedra gigantes com atordoamento garantido de 1.5s. |
| 🌪️ `flying` | **Tornado Ciclônico Furioso** | Vórtices de ar em alta velocidade que sugam inimigos e disparam lâminas de vácuo. |
| 🐛 `bug` | **Enxame Voraz Esmeralda** | Nuvem de milhares de gafanhotos vorazes que corroem defesas inimigas. |
| ☠️ `poison` | **Dilúvio de Chuva Ácida** | Gotas tóxicas contínuas que aplicam acúmulos de veneno e geram poças ácidas. |
| 🥊 `fighting` | **Impacto Sísmico de 1.000 Golpes** | Ondas de choque em forma de punhos titânicos com knockback devastador. |
| ⚙️ `steel` | **Tempestade de Lâminas de Aço** | Chuva cortante de lanças e espadas metálicas giratórias. |
| 🌑 `dark` | **Vórtice do Buraco Negro** | Esfera de escuridão que engole projéteis inimigos e causa dano de colapso. |
| ✨ `fairy` | **Julgamento Prismático Estelar** | Feixes de luz mágica multicolorida com faíscas que encantam e desorientam monstros. |
| ⚪ `normal` | **Hiper-Raio da Força Cósmica** | Feixe massivo e contínuo de energia pura que varre horizontalmente a arena. |

---

## 6. Mecânica do Super Combo de Nível 20 (4 Ataques Simultâneos)

Antes do Nível 20, o jogador dispara o grupo de ataques ativo selecionado nas teclas `1`, `2`, `3` ou `4`.

### 6.1. A Regra do Nível 20
Assim que o jogador atinge o **Nível 20 na partida** (`pl.level >= 20`):
- O sistema desbloqueia automaticamente o **Super Combo Quádruplo** (`quadComboActive = true`).
- Todos os **4 ataques alocados nos slots da barra inferior disparam juntos e simultaneamente**!
- Cada habilidade mantém seu próprio temporizador de cooldown (`m.cd * pl.cdMul`), disparando assim que estiver pronta de forma 100% paralela.

### 6.1.1. Fonte dos ataques no Super Combo
O Super Combo percorre os **slots** (`pl.slots`), não a lista de ataques aprendidos (`pl.moves`).
A diferença importa: um ataque **fundido** (ver 6.3) sai do slot mas continua registrado em `moves`.
Usar `moves` faria o ataque fundido disparar duas vezes — uma no grupo, outra avulsa.

### 6.2. Feedback Visual no HUD
- O cabeçalho do deck muda para: `⚡ SUPER COMBO ATIVO · 4 ATAQUES JUNTOS ⚡`.
- O badge de status exibe: `🔥 COMBANDO JUNTOS · +20% ÁREA · -15% RECARGA`.
- Todos os 4 cards de ataques ganham uma **borda dourada cintilante animada** com pulso de energia.

### 6.3. Elo de Fusão (Bonds)
- Cada **Rift concluído** concede **1 Elo de Fusão** ao jogador (`pl.bonds++` em `js/systems/rift.js`).
- O Elo abre a tela `scr-bond`, onde o jogador escolhe:
  - **Unir dois ataques soltos** (`mode: 'pair'`): os dois passam a ocupar **um único slot**, liberando espaço na barra.
  - **Adicionar um ataque a um grupo já formado** (`mode: 'add'`): o grupo cresce até o limite de `Player.BOND_MAX` (4 ataques).
- Se não houver dois ataques soltos disponíveis, o Elo fica guardado até o jogador aprender outro ataque.
- Os ataques de um slot fundido **disparam juntos** quando aquele slot está ativo. Os demais ataques **não são apagados**: continuam nos outros slots, com seus níveis, e são selecionados com `1`-`4`/`Q`/`E` (antes do Nv 20).
- **Adiar o vínculo:** na tela de fusão, **"Guardar para depois"** (ou `Esc`) mantém o Elo guardado (`pl.bondHold`) e o jogo continua. A tela não reabre sozinha; aperte **`B`** para usar o Elo guardado. Um Elo novo (próximo Rift) volta a oferecer a escolha.
- **HUD:** o card de um slot fundido mostra o ícone, o nome e o nível de **cada** ataque do grupo (`VÍNCULO · NV. a/b`).

---

## 7. HUD Retro Pixel Art Superior Esquerdo & Os 8 Atributos RPG

O HUD do jogo foi projetado seguindo a estética de cartuchos de Game Boy Advance e Nintendo DS, posicionado estrategicamente no **canto superior esquerdo** da tela.

### 7.1. Componentes do Bloco Superior Esquerdo
1. **Card de Perfil & Vida:** Avatar do Pokémon com sprite pixel art, badge do nível atual, nome da espécie, barra de vida com contagem numérica exata (`PV atual / PV máx`) e transição tricolor:
   - Verde: $> 50\%$ PV
   - Amarelo: $20\% \text{ a } 50\%$ PV
   - Vermelho piscante: $< 20\%$ PV
2. **Barra de Overdrive & Botão Mega:** Barra gradiente roxa/dourada com porcentagem em tempo real e botão interativo.
3. **Deck de Ataques do Super Combo:** Lista vertical com os 4 ataques ativos, ícone temático, nome da habilidade e badge de nível (ex: `NV. 1`, `NV. 3`, `NV. 5 MAX`).

### 7.2. Painel com os 8 Atributos RPG em Tempo Real (`#stats-rpg-panel`)
Localizado no canto inferior esquerdo para consulta tática imediata:

| Ícone & Sigla | Nome do Atributo | O Que Controla no Jogo |
| :---: | :--- | :--- |
| ⚔️ **ATK** | Força Ofensiva | Multiplicador de dano de todos os ataques (`pl.atkMul`) |
| 🛡️ **DEF** | Armadura e Proteção | Porcentagem direta de redução de dano recebido (`pl.dmgReduce`) |
| 👟 **SPD** | Agilidade de Movimento | Velocidade de corrida em pixels por segundo (`pl.spdMul`) |
| ⏱️ **CDA** | Aceleração de Recarga | Redução percentual do tempo de cooldown dos golpes (`pl.cdMul`) |
| 🎯 **CRT** | Taxa de Acerto Crítico | Chance percentual de desferir acerto crítico com dano $1.5\times$ (`pl.critChance`) |
| 🧲 **MAG** | Magnetismo e Raio de Coleta | Distância em pixels para puxar orbes de EXP e moedas (`pl.magnetMul`) |
| 📖 **APR** | Sabedoria e Aprendizado | Bônus percentual na experiência ganha por monstro (`pl.xpMul`) |
| 🌿 **REG** | Regeneração Vital | Pontos de vida recuperados automaticamente a cada segundo (`pl.regen`) |

### 7.3. Classificação Global (Ranking) & Sistema Social de Amigos
1. **Classificação Pública (Top 50 Global):**
   - O Ranking lê diretamente do Firestore em tempo real (`lbs/{board}`), permitindo a consulta dos 50 melhores recordes mundiais individuais e em grupo.
   - Filtros instantâneos por período: **Hoje**, **Semana**, **Mês**, **Ano** e **Histórico de Todos os Tempos**.
   - Integração completa com domínios de VPS (`*.sslip.io` e IPs de produção) com validação dinâmica de host.
2. **Sistema de Amigos e Salas Cooperativas:**
   - Gerenciamento de amizades através do **Apelido de Treinador** único.
   - Criação de salas multijogador em tempo real (`LobbyUI`) para sobrevivência cooperativa.
   - Salvamento contínuo com resolução automática de pendências na nuvem.

---

## 8. Árvore de Melhorias Permanentes & Multiplicador de Estágio

As melhorias são compradas no menu com PokéMoedas acumuladas nas partidas e na roleta.

### 8.1. Tabela Geral de Upgrades

| ID | Nome | Ícone | Efeito por Nível | Nível Máx | Custo Base | Fator de Crescimento |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| `hp` | Vitalidade | ❤️ | `+8 PV Máximo` | 10 | 60 | $1.35$ |
| `atk` | Força | 🥊 | `+4% de Dano Base` | 10 | 80 | $1.38$ |
| `spd` | Agilidade | 👟 | `+3% de Velocidade` | 8 | 70 | $1.40$ |
| `cd` | Recarga | ⏱️ | `-3% no Tempo de Cooldown` | 8 | 90 | $1.42$ |
| `def` | Armadura | 🛡️ | `+2% de Redução de Dano` | 8 | 80 | $1.40$ |
| `regen` | Síntese | 🌿 | `+0.2 PV por Segundo` | 5 | 120 | $1.50$ |
| `magnet` | Ímã | 🧲 | `+12% no Raio de Coleta` | 6 | 50 | $1.40$ |
| `xp` | Sabedoria | 📖 | `+5% de Experiência Obtida` | 8 | 100 | $1.42$ |
| `coins` | Fortuna | 🪙 | `+8% de PokéMoedas Ganhas` | 8 | 120 | $1.45$ |
| `moves` | Repertório | 🎴 | `Inicia a Partida com 2 Ataques` | 1 | 1.500 | $1.00$ |
| `crit` | Crítico | ⭐ | `+3% de Chance Crítica (1.5x)` | 10 | 90 | $1.40$ |
| `reroll` | Trocar Cartas | 🔄 | `+1 Troca de Cartas por Level Up` | 5 | 150 | $1.60$ |
| `ban` | Banir Ataque | 🚫 | `Permite Banir 1 Ataque por Run` | 3 | 300 | $1.90$ |

### 8.2. Fórmula do Custo Base por Nível
$$\text{BaseCost}(\text{id}, \text{lvl}) = \text{round}\left( \frac{\text{base} \times \text{grow}^{\text{lvl}}}{10} \right) \times 10$$

### 8.3. Multiplicador de Custo por Estágio Evolutivo da Espécie
Para balancear espécies base contra formas evoluídas e lendárias, o custo final em PokéMoedas escala de acordo com a linhagem genealógica:
- 🐣 **Estágio 1 (Base / Bebê / Inicial):** Multiplicador `1.0×` (custo base original).
- ⚡ **Estágio 2 (Primeira Evolução intermediária):** Multiplicador `2.0×` (dobro de ouro).
- 👑 **Estágio 3 (Segunda Evolução / Forma Suprema / Lendário):** Multiplicador `3.0×` (triplo de ouro).

$$\text{CustoFinal} = \text{BaseCost} \times \text{MultiplicadorEstágio}$$

---

## 9. Geração de Inimigos, Hordas e Cronograma dos Grandes Chefes

### 9.1. Regras do Spawner
- **Anel de Invocação:** Os monstros surgem em um anel circular fora do campo visual da câmera (`outerRadius() + 10 a 70px`), garantindo que nunca apareçam na frente do jogador.
- **Densidade & Cap:** Teto de 64 monstros simultâneos. Acima de 85% do teto ($54$ monstros), os novos monstros nascem na categoria **Elite** (+60% PV, +25% Dano, +60% EXP).
- **Taxa de Inimigos Shiny no Mapa:** $1 \text{ em } 4.096$ monstros normais nasce na versão Shiny selvagem com aviso sonoro e visual.

### 9.2. Cronograma dos Grandes Chefes da Sobrevivência

| Tempo de Jogo | Minuto | BST do Chefe | PV Base | Dano Base | EXP Recompensa |
| :---: | :---: | :---: | :---: | :---: | :---: |
| $180\text{s}$ | **03:00** | $490\text{ a }545$ | $1.400\text{ PV}$ | 34 | $+220\text{ EXP}$ |
| $360\text{s}$ | **06:00** | $520\text{ a }580$ | $3.200\text{ PV}$ | 42 | $+420\text{ EXP}$ |
| $540\text{s}$ | **09:00** | $540\text{ a }600$ | $5.600\text{ PV}$ | 48 | $+680\text{ EXP}$ |
| $720\text{s}$ | **12:00** | $580\text{ a }700$ | $9.000\text{ PV}$ | 56 | $+1.000\text{ EXP}$ |
| $900\text{s}$ | **15:00** | $600\text{ a }700$ | $16.000\text{ PV}$ | 68 | $+1.800\text{ EXP}$ |
| $1.800\text{s}$ | **30:00** | **Sentença de Arceus** | $\infty$ | Devastador | **Fim da Run Roguelike** |

---

## 10. Comandos de Auditoria e Depuração no Console (F12)

Para auditoria rápida e testes imediatos no console do navegador:

```javascript
// 1. Simular e Inspecionar Seleção de Guardiões por Nível
window.selectRiftGuardian(15);  // Testa Nível 15 -> Retorna Estágio 1
window.selectRiftGuardian(30);  // Testa Nível 30 -> Retorna Estágio 2
window.selectRiftGuardian(50);  // Testa Nível 50 -> Retorna Estágio 3

// 2. Disparar Fenda Dimensional Imediata
window.riftSystem.start(null, null, false, 15); // Abre arena Estágio 1
window.riftSystem.start(null, null, false, 30); // Abre arena Estágio 2
window.riftSystem.start(null, null, false, 50); // Abre arena Estágio 3
window.riftSystem.reset();                     // Reseta arena do Rift

// 3. Testar Captura Diegética
G.CaptureSystem.spawnCaptureBall({ speciesId: 'Mewtwo', isLegendary: true, level: 35 });
G.CaptureSystem.spawnCaptureBall({ speciesId: 'Pikachu', isShiny: true, forceGold: true }); // Testa Gold Ball 100%

// 4. Testar Mega Evolução & Overdrive
G.MegaSystem.addEnergy(100); // Enche a barra em 100%
G.MegaSystem.trigger();       // Dispara cutscene e 10s de Overdrive com Dano 2x

// 5. Testar Ativação do Super Combo de Nível 20
G.Game.player.level = 20;     // Ativa instantaneamente o Super Combo dos 4 ataques juntos

// 6. Testar Roleta Gacha & Injeção de Tickets
admin.setTickets(50000);            // Define saldo de tickets para 50.000
admin.addTickets(10000);            // Adiciona +10.000 tickets
admin.getTickets();                 // Consulta saldo atual { t1, t10 }
admin.forceLegendary(1);            // Força próximo giro a ser Lendário garantido (5%)
admin.forceShiny(1);                // Força próximo giro a ser Shiny garantido (1%)
admin.resetForces();                // Retorna às probabilidades normais aleatórias
admin.spin(1);                      // Gira a roleta 1x no console
admin.simulate(100);                // Executa simulação estatística de 100 giros e exibe relatório
admin.openGacha();                  // Abre a tela oficial da Roleta Gacha
```

---

## 11. Menu Admin: Gestão de Tickets, Roleta Gacha & Pokédex

O PokéSurvivor conta com um **Menu Admin e Painel de Depuração** flutuante em tempo real, desenvolvido para auditorias imediatas sem necessidade de comandos complexos de terminal.

### 11.1. Como Acessar o Menu Admin
- **Teclado:** Pressione `F2` ou a tecla de Aspas / Tilde (`'` ou `~`) a qualquer momento da partida ou nos menus.
- **Botão Flutuante:** Clique na pílula retrô **`🛠️ Admin [F2]`** fixada no canto inferior direito da tela (visível em desktop e mobile).
- **Console do Desenvolvedor (F12):** Digite `admin.open()` ou utilize os comandos `admin.*`.

### 11.2. Recursos da Seção: Tickets & Roleta Gacha
1. **Visualizador de Saldo em Tempo Real:** Exibe os saldos ativos de `🎟️ Tickets de Roleta` e `🪙 PokéMoedas` sincronizados com o banco de dados.
2. **Definição e Injeção Customizada:** Campo numérico de entrada para definir ou somar **qualquer quantidade desejada de tickets** (ex: `5.000`, `25.000`, `100.000`).
3. **Botões Rápidos de Tickets:**
   - `+5k (1x)`: Injeta instantaneamente 5.000 tickets (1 giro de Roleta).
   - `+25k (5x)`: Injeta 25.000 tickets (5 giros de Roleta).
   - `+50k (10x)`: Injeta 50.000 tickets (10 giros de Roleta).
   - `Zerar`: Zera todos os tickets do save para testes de saldo insuficiente.
4. **Testes Diretos de Sorteio:** Botões `🎲 Girar Roleta 1x` e `🌟 Girar Roleta 5x` realizam o sorteio completo, registram na Pokédex e calculam o reembolso de 1.000 moedas por duplicata.
5. **Forçador de Probabilidades (Debug Hooks):**
   - `✨ Forçar Shiny`: Força a Roleta a entregar uma variante Shiny no próximo giro.
   - `👑 Forçar Lendário`: Força a Roleta a entregar uma espécie Lendária no próximo giro.
   - `🔄 Resetar Forçamento`: Restaura os pesos matemáticos estocásticos oficiais (1% Shiny, 5% Lendário, 94% Normal).
6. **Auditoria Estatística em Lote:** Permite simular qualquer volume de giros (ex: 50, 100, 500) em milissegundos, gerando uma tabela comparativa com a taxa teórica versus taxa obtida de Lendários, Shinies, Normais e Moedas acumuladas.

---

## 12. Atualizações Mestres: Gameplay Contínua, Ranking Duplo & Atributos Oficiais

### 12.1. Super Combo Contínuo no Nível 20
- Ao atingir o **Nível 20**, os 4 slots da barra passam a **combar simultaneamente de forma contínua** (`quadComboActive = true`), sem interrupções nem pausas de jogo.
- A tela de Level Up **continua ativa** após o Nv 20: as cartas seguem sendo oferecidas e podem ocupar slots vazios, aplicar melhorias de atributos ou oferecer fusões de golpes.
- O que muda no Nv 20 é apenas **quem dispara**: antes o jogador escolhe o slot; a partir daí, todos disparam juntos (ver seção 6).

### 12.2. Calibração Rara de Shinies e Lendários nos Rifts
- **Comum Normal:** 94.0% das aparições de guardiões em fendas dimensionais.
- **Lendário Normal:** 3.8% de probabilidade.
- **Comum Shiny (Brilhante):** 2.0% de probabilidade (aparições eventuais e raras).
- **Lendário Shiny:** 0.2% de probabilidade (evento ultrarraro).
- O fallback de dex completa para variantes shiny foi reduzido de 25% para 2%, garantindo a fidelidade às probabilidades da franquia.
- **Fonte única:** `BalanceConfig.rewards.rift.rarity` (`js/config/balanceConfig.js`). O sorteio do guardião lê esses valores — não há números fixos duplicados no código.
- **Trava de progressão:** o Lendário Shiny só passa a aparecer a partir de **30 Rifts** concluídos (`legendaryUnlockRifts`), e o pity de Shiny Comum dispara em **500 Rifts** (`shinyPityRifts`).

### 12.3. Roleta Gacha Regional e Regra de Desbloqueio do Estágio 1
- **Filtro Rigoroso por Região:** A seleção de abas na Roleta (Kanto, Johto, Hoenn, etc.) restringe o sorteio exclusivamente à geração correspondente (`gen 1 = Kanto`, `gen 2 = Johto`, etc.).
- **Desbloqueio Base Obrigatório:** Caso o jogador obtenha uma forma evoluída de Estágio 2 ou 3 (ex: Charizard), o jogo libera automaticamente a forma base de Estágio 1 (ex: Charmander) na Pokédex, garantindo que o Pokémon seja jogável como companheiro de partida.

### 12.4. Painel de Status RPG Retrátil (HUD Canto Superior Esquerdo)
- O painel `#stats-rpg-panel` foi reposicionado diretamente abaixo do deck de ataques e vida do Pokémon no canto superior esquerdo.
- Conta com uma **flagzinha sanfona retrátil** (`#hud-stats-toggle`) com indicador de setinha (`▼` / `▲`).
- Inicia recolhido por padrão para evitar contaminação visual da arena de batalha e memoriza a preferência do usuário no `localStorage`.

### 12.5. Sobrevivência Infinita e Ranking Duplo
- A barreira de tempo da Sentença de Arceus (30 minutos) foi removida (`AT = Infinity`). As partidas agora possuem tempo teoricamente infinito, permitindo sessões de 1h, 2h ou mais.
- **Ranking Duplo com Abas:**
  - **⏱️ Maior Tempo:** Classifica os jogadores pelo tempo total sobrevivido.
  - **🌀 Mais Fendas:** Classifica os jogadores pelo número de Fendas Dimensionais concluídas com sucesso na partida.
  - Ambas as modalidades contam com filtros por período: **Hoje (Diário)**, **Semana (Semanal)**, **Mês (Mensal)**, **Ano (Anual)** e **Todos os Tempos (Geral)**.

### 12.6. Atributos Base Oficiais da Pokémon Company
- A Pokédex (`showDetail`) exibe os **6 Base Stats oficiais** da franquia para todos os 1.025 Pokémon (HP, ATK, DEF, SP. ATK, SP. DEF, SPEED e BST) extraídos diretamente dos padrões da Pokémon Company, além dos parâmetros de Crítico (+5% base) e Aceleração de Recarga (CDA).

### 12.7. Seleção de Ataques Iniciais e Veto (Banimento) de Ataques
- **1º Ataque Inicial (Principal):** Escolha livre entre qualquer golpe aprendido pela espécie do Pokémon (com fallback para o padrão nativo).
- **2º Ataque Inicial (Opcional):** Inicia bloqueado por padrão (o jogador começa com 1 ataque). O segundo slot é desbloqueado permanentemente para o Pokémon mediante a compra por **🪙 50.000 moedas**, permitindo iniciar a partida com 2 ataques ativos simultâneos. Não possui níveis de ascensão.
- **Sistema de Banir Ataques (Veto):** Permite banir até **3 ataques indesejados** da seleção de cartas ao subir de nível. Não possui Ascensão (+1 a +10), sendo travado rigorosamente no teto máximo de 3 ataques banidos por partida.

### 12.8. Otimização Gráfica e Desempenho 60 FPS
- Canvas com aceleração de hardware por GPU (`transform: translateZ(0); will-change: transform; backface-visibility: hidden;`).
- Renderização pixelada cirúrgica (`image-rendering: pixelated; crisp-edges;`), eliminando borrões bilineares e garantindo 60 FPS fluidos mesmo em resoluções 4K e dispositivos móveis.

### 12.9. Pokémons Shiny no Mapa (Mega Jackpot de 5.000 Tickets & Não Capturáveis)
- **Não Capturáveis:** Pokémons Shiny encontrados selvagens pelo mapa ou em fendas não são capturáveis (não abrem sequência de captura nem são adicionados à Pokédex por abate).
- **Jackpot de 5.000 Tickets:** Ao derrotar qualquer Pokémon Shiny no mapa, o jogador recebe imediatamente **5.000 Tickets da Roleta Gacha** (`pl.t1 += 5000`), persistidos automaticamente no banco de dados com anúncio e celebração na tela.
- **Valorização da Roleta Gacha:** A coleção de Shinies e Lendários é valorizada e centralizada na Roleta da Sorte, tornando os Shinies do mapa no maior evento de obtenção de tickets de todo o jogo.

---

---
*Manual homologado em conformidade com o código-fonte de produção do PokéSurvivor: Endless Hunt.*
