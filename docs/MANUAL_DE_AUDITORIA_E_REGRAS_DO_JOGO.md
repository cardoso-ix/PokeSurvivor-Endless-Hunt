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
Durante os **10.0 segundos** de Overdrive:
1. 💥 **Dano Dobrado (2.0×):** Todos os ataques, projéteis, feixes e zonas do jogador causam **+100% de dano base**.
2. 🛡️ **Super Defesa:** Redução de **80% do dano recebido** (`dmgTakenMul = 0.20`).
3. 🧲 **Super Ímã:** Dobro de raio de coleta magnética (`magnetMul = 2.0`).
4. 🌪️ **Drenagem Linear Contínua:** A barra do HUD e o botão físico drenam gradualmente de 100% até 0% em exatamente 10 segundos.

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

### 6.2. Feedback Visual no HUD
- O cabeçalho do deck muda para: `⚡ SUPER COMBO ATIVO · 4 ATAQUES JUNTOS ⚡`.
- O badge de status exibe: `🔥 COMBANDO JUNTOS`.
- Todos os 4 cards de ataques ganham uma **borda dourada cintilante animada** com pulso de energia.

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

// 6. Testar Roleta Gacha
G.Gacha.pullRoulette(G.DB.save, 1); // Realiza 1 giro na Roleta (5.000 tickets)
G.Gacha.pullRoulette(G.DB.save, 5); // Realiza 5 giros na Roleta (25.000 tickets)
```

---
*Manual homologado em conformidade com o código-fonte de produção do PokéSurvivor: Endless Hunt.*
