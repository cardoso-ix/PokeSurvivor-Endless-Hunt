# PokéSurvivor: Endless Hunt

[![GitHub License](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue.svg)](LICENSE-NONCOMMERCIAL.md)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%202D-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Docker Ready](https://img.shields.io/badge/Docker-Coolify%20Ready-2496ED.svg)](docs/DEPLOY_COOLIFY.md)
[![Language](https://img.shields.io/badge/Language-Portugu%C3%AAs%20do%20Brasil%20(pt--BR)-green.svg)](#-localização-completa-em-português-do-brasil-pt-br)

*Bullet-heaven* de ação e sobrevivência com Pokémon ao estilo de *Survivor.io* e *Vampire Survivors*, com estética retrô autêntica de RPG portátil (estilo Nintendo DS / Game Boy Advance), **todos os 966 Pokémon das 9 Gerações**, sprites de *Pokémon Mundo Misterioso*, Mega Overdrive Elemental dos 18 tipos, sistema de captura diegética em Rifts, evolução automática, salas cooperativas online.

Construído em **HTML5 Canvas 2D + Vanilla JavaScript moderno**, rodando a 60 FPS estáveis sem frameworks pesados de frontend.

---

> [!WARNING]
> **Aviso sobre Criptomoedas / Crypto Disclaimer**  
> O PokéSurvivor **NÃO possui nenhuma criptomoeda, token ou NFT oficial**, e nenhum foi criado por nós. Qualquer token usando o nome do jogo é criação não autorizada de terceiros. O jogo é gratuito e de código aberto para fins não-comerciais.

---

## 🌐 Acesso Online & Links de Teste

| Ambiente | URL | Descrição |
| :--- | :--- | :--- |
| **Produção Online (VPS Coolify)** | [http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/](http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/) | Versão oficial na VPS. **O deploy é manual** (sem webhook do GitHub): ver [`docs/DEPLOY_COOLIFY.md`](docs/DEPLOY_COOLIFY.md) |
| **Versão de Desenvolvimento (VPS)** | [http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html](http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html) | Acesso direto com scripts modulares |
| **Ambiente Local (PC)** | [http://localhost:8080/index.html](http://localhost:8080/index.html) | Servidor local no computador de desenvolvimento (`node tools/serve.js`) |
| **Painel do Coolify** | [http://108.174.145.77:8000](http://108.174.145.77:8000) | Controle de deploy da VPS |

> **Duas linhas de código, dois endereços.** Este repositório é a linha **pt-BR + inglês**.
> O domínio [`pokesurvivor.com`](https://pokesurvivor.com/) é servido por **GitHub Pages**
> a partir de um repositório **diferente** (`JPTER78/pokesurvivor`), que é a linha
> multilingue com Firebase e eventos especiais. As duas **não** são sincronizadas.

---

## 🎮 Controles & Como Jogar

| Tecla / Controle | Ação |
| :--- | :--- |
| `W` `A` `S` `D` / Setas | Mover o seu Pokémon |
| `Espaço` / `Space` | Ativar **Mega Overdrive Elemental** (ao atingir 100% da barra) |
| `1` `2` `3` `4` / Clique no slot | Selecionar ataque ativo |
| `Q` / `E` / `Tab` | Alternar entre ataques anterior / próximo |
| `+` / `−` | Ajustar escala da câmera (zoom calibrado) |
| `Esc` / `P` | Pausar / Continuar partida |
| `1` `2` `3` / Clique na carta | Escolher melhoria ao subir de nível |
| `R` | Trocar opções de cartas de nível (Reroll) |
| `F2` / `'` | Abrir Painel de Administração / Depuração |

**No Celular ou Tablet (Modo Paisagem/Horizontal):**  
Arraste o dedo em qualquer lugar da tela para mover o personagem com o joystick dinâmico, toque no botão circular do Mega no canto inferior para acionar o poder supremo, use a bandeja inferior para alternar ataques e acesse a pausa pelo topo. O jogo pode ser instalado diretamente como **PWA** ("Adicionar à Tela de Início").

---

## 🇧🇷 Localização Completa em Português do Brasil (pt-BR)

O jogo conta com suporte nativo integral ao **Português do Brasil**, sem termos em espanhol ou construções em "Portunhol":
- **100% dos Menus & Interfaces:** Tela de Login, Seleção de Starters, Quiz de Personalidade (8 perguntas completas e 16 traços), Configurações, Pokédex, Upgrades, Missões, Conquistas e Game Over.
- **Catálogo de Habilidades e Golpes:** Todos os 64 ataques de base e 60 evoluções de ataques (`js/data/moves.js`) traduzidos com nomenclatura oficial de Pokémon em português.
- **Equipamentos e Itens:** Todos os 11 itens equipáveis (`Restos`, `Faixa da Escolha`, `Faixa de Foco`, `Garra Rápida`, `Sino de Concha`, etc.) com descrições mecânicas claras.
- **Textos Flutuantes e Canvas VFX:** Notificações de dano, status, clima, anúncios de horda, resgates de Pokémon perdidos e mensagens diegéticas de captura em português.

---

## ✨ Novos Sistemas & Arquitetura de Gameplay

### 1. 🧬 Censo Oficial & Trava Estrutural dos 966 Pokémon (Gerações 1 a 9)
O ecossistema do jogo possui uma árvore genealógica completa baseada nas **540 cadeias evolutivas oficiais da PokeAPI**:
- **507 Pokémon de Estágio 1 (Base / Iniciais):** Únicos elegíveis para seleção inicial de partida (ex: Bulbasaur, Charmander, Pichu, Magikarp, Riolu, Gastly, Dreepy, Lapras, Heracross, Mewtwo, Cosmog, Kubfu).
- **459 Pokémon de Estágios 2 e 3 (Evoluções):** Bloqueados para seleção inicial. São obtidos exclusivamente via evolução automática durante a partida ou enfrentados como Guardiões de Rifts.
- **Sanitização Automática de Saves:** Saves antigos contendo formas evoluídas são sanitizados de forma transparente, convertendo para a forma base ancestral via `getBaseAncestor()`.

---

### 2. ⚡ Marcos de Evolução Automática (Níveis 5, 12 e 21)
Todas as **434 espécies evoluíveis** das 9 gerações possuem resolução automática em tempo de execução:
- **Nível 5:** 1ª Evolução Automática de linhas de **3 estágios** (ex: *Bulbasaur ➔ Ivysaur*, *Charmander ➔ Charmeleon*). Linhas de **só 2 estágios** (ex: *Rattata ➔ Raticate*, *Growlithe ➔ Arcanine*, *Eevee ➔ Jolteon*) **não evoluem no Nv. 5**: a única evolução delas vem no Nv. 12.
- **Nível 12:** 2ª Evolução Automática das linhas de 3 estágios e evolução única das linhas de 2 estágios (Forma Final). (ex: *Ivysaur ➔ Venusaur*, *Charmeleon ➔ Charizard*, *Haunter ➔ Gengar*, *Gabite ➔ Garchomp*).
- **Nível 21:** Ascensão Mega / Forma Ápice (+50% de dano definitivo, aura luminosa permanente e burst estelar de partículas).
- **Cartas de Level Up Desobstruídas:** As evoluções ocorrem automaticamente no campo de batalha, deixando os 3 cards de Level Up 100% dedicados a ataques, fusões de golpes e melhorias de atributos.

---

### 3. 🌀 Captura Diegética no Mapa (World-Space Pokéball) & Rifts
A mecânica de captura foi reformulada para ocorrer diretamente no chão do Canvas, sem modais ou pausas invasivas:
- **Resolução Física no Solo:** Ao zerar a vida do Guardião do Rift dimensional, o monstro colapsa em partículas vermelhas de energia e uma Pokébola física (`WorldCaptureBall`) é instanciada nas coordenadas exatas.
- **Animação Física de Tensão:**
  1. *Queda & Quique:* A Pokébola cai do alto (`y - 120`), quica no solo com gravidade e absorve a essência do monstro.
  2. *Três Balanços Físicos:* Pausa de 0.35s ➔ Balanço 1 (-28°) ➔ Pausa ➔ Balanço 2 (+28°) ➔ Pausa ➔ Balanço 3 (-28°).
  3. *Sucesso:* A trava central se fixa, emite faíscas estelares douradas, toca o som clássico de clique e sobe o texto flutuante verde: `✨ + [NOME] CAPTURADO COM SUCESSO! ✨`. A espécie é registrada na Pokédex e desbloqueada como jogável.
  4. *Falha:* A Pokébola se abre, emite nuvem de fumaça cinza expansiva e sobe o texto: `💨 O POKÉMON ESCAPOU!`.
- **Combate Contínuo:** O jogador continua se movendo, atirando e recolhendo gemas livremente enquanto a Pokébola balança no solo.
- **Balanceamento Rigoroso de Raridade de Spawn (Rift):**
  - `roll <= 94.0%` ➔ Pokémon Comum/Regional Normal.
  - `94.0% < roll <= 97.8%` ➔ Pokémon **Lendário Normal** (3.8% de chance; requer 30+ Rifts concluídos, senão rebaixa para Comum Normal).
  - `97.8% < roll <= 99.8%` ➔ Pokémon Comum/Regional **Shiny** (2.0% de chance).
  - `roll > 99.8%` ➔ Pokémon **Lendário Shiny** (0.2% de chance; requer 30+ Rifts concluídos, senão rebaixa para Comum Shiny).
  - **Pity:** a cada 500 Rifts concluídos, o próximo_guardião é garantidamente Shiny.
- **Tiers Dinâmicos de Pokébola:**
  - Nv. 1 a 10: **Poké Ball** (+0% bônus)
  - Nv. 11 a 20: **Great Ball** (+3% bônus)
  - Nv. 21 a 30: **Ultra Ball** (+6% bônus)
  - Nv. 31+: **Ultimate Ball** (+10% bônus)
  - Nv. 41+ (Evento Raro): **Gold Ball** (10% de chance de substituição, **+14% de chance** para Normais, +8% para Shinies/Lendários e +4% para Shiny Lendário, **+1.000 PokéMoedas**). A Gold Ball **não** garante a captura: o bônus respeita o teto rígido de 42%.
- **Taxas Base de Captura (por estágio evolutivo e raridade):**
  - Normal: Estágio 1 **34%** · Estágio 2 **24%** · Estágio 3 **15%**
  - Shiny Comum **10%** · Lendário **5%** · Shiny Lendário **2%**
  - **Teto rígido de 42%** em qualquer combinação (42% comuns, 22% Shiny, 14% Lendário, 8% Shiny Lendário).
  - **Bônus de risco:** até **+6%** quando o jogador captura com pouca vida (0% acima de 75% de PV, máximo abaixo de 25%). Shiny não é capturável.

---

### 4. 🌟 Mega Overdrive Elemental Dinâmico & Cutscene Cinematográfica Prolongada
Ao atingir 100% de energia de Mega e pressionar [ESPAÇO] ou o botão no HUD, o jogador dispara o Poder Supremo correspondente ao elemento primário do líder da equipe:
- **Cutscene Cinematográfica Prolongada (2.8 Segundos):**
  - **Entrada Lenta & Suave (Slow-Motion Ease-in):** Transição desacelerada com escurecimento de foco (*Focus Dim*), aproximação cinematográfica lenta de câmera (*Zoom-in* suave de 3.1x para 3.8x) e deslizamento lateral do banner angular.
  - **Sustentação Heroica:** Exibição prolongada do Pokémon líder em tamanho ampliado com olhos em fúria, aura elemental elíptica em pulso contínuo, speedlines compassadas e tipografia épica (*Nome do Pokémon* + *Poder Supremo* + *DANO 2X ATIVO*).
  - **Slow-Motion Cinematográfico no Mundo:** Hordas inimigas e projéteis desaceleram durante a cutscene, garantindo foco total no herói sem risco de atropelamentos.
  - **Preservação dos 10 Segundos Úteis:** Durante os 2.8s da cutscene, a barra e o tempo do Mega permanecem intactos em 10.0s cheios. Os 10 segundos inteiros de tempestade cósmica e dano dobrado começam a contar apenas após o término da cutscene!
- **Duração de 10.0 Segundos de Tempestade Cósmica:** Drenagem linear contínua atuando como temporizador na barra e no botão do HUD logo após a cutscene.
- **Dano Dobrado (2x) & Super Sobrevivência:** +100% de dano base em todos os golpes, redução de 80% do dano recebido e dobro de raio de coleta (+100%).
- **Catálogo dos 18 Poderes Supremos (`MEGA_ULTIMATES_DATA`):**
  - 🔥 `fire`: Chuva diagonal de meteoros que abre crateras de fogo e poças de brasa no solo.
  - 💧 `water`: Gêiseres de alta pressão e chuva torrencial que arremessam inimigos e causam lentidão de 40%.
  - 🌿 `grass`: Vinhas espinhosas perfurantes que convertem 15% do dano causado em cura de PV para o Treinador.
  - ⚡ `electric`: Tempestade de raios verticais com arcos voltaicos em cadeia pela horda.
  - ❄️ `ice`: Nevasca polar contínua com estalactites caindo e chance de congelamento.
  - 🐉 `dragon`: Bombardeio astral de meteoros cósmicos com dano massivo em área.
  - 👻 `ghost`: Fissuras do submundo com espectros sombrios e drenagem vital contínua.
  - 🔮 `psychic`: Ondas gravitacionais e distorções cinéticas que empurram e comprimem monstros.
  - 🌍 `ground`: Fissuras tectônicas que racham o chão em zigue-zague.
  - 🪨 `rock`: Desabamento de megálitos e rochas pontiagudas com atordoamento.
  - 🌪️ `flying`: Tufões e vórtices velozes que sugam hordas e disparam lâminas de vento.
  - 🐛 `bug`: Enxame voraz de gafanhotos de energia que corroem alvos.
  - ☠️ `poison`: Chuva ácida corrosiva e poças tóxicas borbulhantes.
  - 🥊 `fighting`: Ondas de choque de punhos sônicos gigantes com knockback devastador.
  - ⚙️ `steel`: Chuva de lanças metálicas e lâminas giratórias de aço.
  - 🌑 `dark`: Vórtice de escuridão profunda que colapsa e explode em área.
  - ✨ `fairy`: Pulso prismático com faíscas estelares mágicas que cegam e desorientam inimigos.
  - ⚪ `normal`: Hiper-raio radial de pura energia concentrada com empurrão massivo.

---

### 5. 🎴 HUD Superior Esquerdo Retro Pixel Art & Deck de Ataques do Combo por Nível
- **Design Estilo GBA / Nintendo DS:** Moldura chanfrada sólida com relevo pixel art posicionada no **canto superior esquerdo da tela**, integrando Perfil, Vida, Mega e Deck de Habilidades em um único bloco organizado sem obstruir a visão da arena ou o cronômetro central.
- **Card de Perfil & Vida:** Avatar com sprite do Pokémon e badge de nível, nome do herói, barra de HP com indicador numérico (`PV 85 / 100`) e transição tricromática (verde/amarelo/vermelho), além da barra de Overdrive Mega.
- **Deck de Ataques do Combo (`.hud-combo-container`):**
  - **Combo por nível:** Nv. 1 = 1 ataque · Nv. 5 = combo de 2 · Nv. 10 = combo de 3 · Nv. 21 = combo de 4. Os ataques do combo são os **primeiros aprendidos** (ordem dos slots) e disparam **todos juntos**.
  - **Cartões:** os ataques dentro do combo ficam com borda dourada; os já aprendidos mas ainda fora do combo aparecem apagados com `ENTRA NO NV. X`. Slots vazios mostram `Combo Nv. X` quando ainda não estão liberados.
  - **Cabeçalho:** `⚡ COMBO DE N · N ATAQUES JUNTOS ⚡` e o badge `PRÓXIMO COMBO: NV. X` (no Nv. 21: `🔥 COMBO MÁXIMO · +20% ÁREA · -15% RECARGA`).
- **Botão Mega Físico (`#hud-mega-btn`):** 3 estados reativos (Carregando com porcentagem, Pronto com pulso dourado pulsante e Ativo com cronômetro regressivo).
- **Painel de Atributos (`#stats-rpg-panel`):** Exibe no canto da tela os 8 status matemáticos da partida em tempo real:
  - ⚔️ **ATK:** Dano ofensivo
  - 🛡️ **DEF:** Defesa e redução de dano
  - 👟 **SPD:** Velocidade de movimento
  - ⏱️ **CDA:** Aceleração de recarga de ataques
  - 🎯 **CRT:** Taxa de acerto crítico
  - 🧲 **MAG:** Raio magnético de coleta
  - 📖 **APR:** Sabedoria e ganho de EXP
  - 🌿 **REG:** Regeneração contínua de PV/s

---

### 6. 🎰 Sistema de Roleta Gacha (100 Tickets) & Conversão de Repetidos
O jogo conta com um sistema de Roleta Gacha temático acessível pelo Menu Principal e integrado aos Tickets obtidos nas partidas (em baús especiais, chefes e Guardiões de Fendas):
- **Custo por Giro:** 100 Tickets por giro simples (`save.tickets.t1`) ou 500 Tickets para giros múltiplos (×5).
- **Pool Global:** Sorteio entre **todos os 966 Pokémon do jogo** (Gerações 1 a 9).
- **Probabilidades Oficiais (Roleta Especial):**
  - 👑✨ **0.02% Shiny Lendário (Apex Jackpot):** 1 em 5.000 — versão brilhante de um Lendário ou Mítico.
  - ✨ **0.50% Shiny Comum:** 1 em 200 — versão brilhante ultra-rara com partículas estelares e sprite alternativo.
  - 👑 **0.40% Lendário Normal:** 1 em 250 — sorteio entre todos os 103 Lendários e Míticos da Pokédex (Mewtwo, Rayquaza, Dialga, Arceus, etc.).
  - ⚪ **99.08% Pokémon Normal:** sorteio entre as espécies comuns, incomuns e raras.
- **Pity por banner:** a cada **250 giros** sem um 5★, o próximo é 5★ garantido.
- **Regra de Bônus de Repetidos na Pokédex:**
  - Se o Pokémon sorteado já constar na Pokédex do jogador: concede instantaneamente **+250 PokéMoedas** para usar na aba de Melhorias permanentes!
  - Se for um Pokémon inédito: desbloqueia e registra imediatamente na Pokédex do jogador.
- **Animação Retrô Caça-Níqueis (Pixel Art):** Máquina de slots desenhada em Canvas com alavanca física, rolos com desaceleração em suspense (`👑 LENDÁRIO?!`, `✨ SHINY?!`), efeitos sonoros triunfantes (`legend`, `shiny`, `reveal`, `burst`) e cards holográficos.

---

### 7. 🌌 Sistema de Batalha de Rift & Regras de Estágios por Nível
As Fendas Dimensionais (Rifts) oferecem desafios épicos em arenas dimensionais fechadas contra Guardiões e Chefes Pokémon, com geração estritamente atrelada ao nível atual do Treinador na partida:

- **Regra de Seleção de Estágio do Chefe por Nível:**
  - 🐣 **Até Nível 20 (Lv 1 a 20) ➔ Apenas Pokémon de Estágio 1:** Aparecem exclusivamente Pokémon na forma base / inicial / bebê (ex: *Charmander, Bulbasaur, Slowpoke, Pichu, Gastly*).
  - ⚡ **Nível 21 até 41 (Lv 21 a 41) ➔ Apenas Pokémon de Estágio 2:** Aparecem exclusivamente Pokémon no primeiro estágio de evolução intermediário (ex: *Charmeleon, Ivysaur, Magneton, Haunter, Pikachu*).
  - 👑 **Nível 42+ (Lv 42 em diante) ➔ Apenas Pokémon de Estágio 3:** Aparecem exclusivamente Pokémon em sua forma final suprema e ápice evolutivo (ex: *Charizard, Venusaur, Nidoqueen, Gengar, Raichu, Alakazam*).

- **Escalonamento Matemático de Características por Estágio (`Stg 1 < Stg 2 < Stg 3`):**
  O Chefe de Estágio 1 é calibrado como o mais fraco, o Estágio 2 é balanceado para ser substancialmente mais forte que o Estágio 1, e o Estágio 3 é o monstro supremo, superando ambos em todas as características:

  | Característica / Atributo | 🐣 Estágio 1 (Até Lv 20) | ⚡ Estágio 2 (Lv 21 até 41) | 👑 Estágio 3 (Lv 42+) |
  | :--- | :--- | :--- | :--- |
  | **Multiplicador de HP Base** | `0.65×` (~5.7k – 7.5k HP) | `1.15×` (~13k – 16.5k HP) | `1.85×` (~28k – 35k HP) |
  | **Dano de Colisão Base** | ~22 a 26 de dano | ~44 a 50 de dano | ~68 a 78 de dano |
  | **Dano dos Projéteis** | ~13 a 17 de dano | ~25 a 30 de dano | ~38 a 46 de dano |
  | **Cadência de Disparo (`shotCd`)** | `1.25s` (disparos espaçados) | `0.85s` (ritmo constante) | `0.55s` (rajadas agressivas) |
  | **Velocidade de Movimento (`spd`)** | `42 a 70 px/s` (lento/moderado) | `55 a 95 px/s` (rápido) | `68 a 118 px/s` (feroz/implacável) |
  | **Raio de Perseguição (`range`)** | `260 px` | `330 px` | `420 px` |
  | **Escala Visual no Canvas** | `1.00×` (tamanho padrão) | `1.15×` (porte ampliado) | `1.30×` (colosso imponente) |
  | **EXP de Recompensa** | `+380 a 650 EXP` | `+800 a 1.250 EXP` | `+1.500 a 2.500 EXP` |
  | **Recompensa de Repetido na Dex** | 💰 `+500 Moedas` · 🎟️ `+500 Tickets` | 💰 `+750 Moedas` · 🎟️ `+750 Tickets` | 💰 `+1.000 Moedas` · 🎟️ `+1.000 Tickets` |

- **Captura Diegética no Mapa:** Ao derrotar o Guardião da Fenda, a Pokébola apropriada ao nível do jogador é arremessada no chão do mapa com física e animação de balanço em 3 estágios.
- **Regra de Compensação por Pokémon Repetido:**
  - Se o jogador capturar um Pokémon que **já possui registrado na Pokédex**, recebe a bonificação escalonada de **Moedas** (para Melhorias permanentes) e **Tickets** (para a Roleta Gacha) conforme o estágio do monstro capturado.
  - Toda captura bem-sucedida também concede a **Recompensa de Caçador (Gold Bounty)**, que SOMA com a bonificação de repetido: Normal `+250` (Estágio 1) · `+1.200` (Estágio 2) · `+3.000` (Estágio 3) · Lendário `+8.000`.
  - Se for um Pokémon **inédito**, registra a nova espécie na Pokédex permanente e desbloqueia seu ancestral de Estágio 1 na lista de iniciais jogáveis.
  - Se for uma versão **Shiny**, não é capturável: ao abater, concede **+5.000 Tickets de Roleta**.
- **Transição Contínua & Retorno Seguro ao Mapa Principal:**
  - Ao concluir a batalha e a sequência diegética da Pokébola, a arena dimensional é encerrada de forma fluida (`World.setArena(null)`), restaurando com precisão o bioma original, reposicionando o Treinador em suas coordenadas anteriores e devolvendo a horda de monstros sem interrupção do loop de combate.

---

---

## 🚀 Como Colocar Online na VPS com Coolify

O projeto está configurado para deploy em VPS com **Coolify** ou **Docker Compose**.

> [!IMPORTANT]
> **O deploy desta aplicação é MANUAL.** O repositório **não** tem webhook do GitHub registrado (`gh api repos/cardoso-ix/PokeSurvivor-Endless-Hunt/hooks` devolve `[]`), então um `git push` para `main` **não** publica sozinho. É preciso acionar o deploy no painel do Coolify ou pelo webhook de deploy. Ver [docs/DEPLOY_COOLIFY.md](docs/DEPLOY_COOLIFY.md) para os três caminhos (painel, webhook e API).

### Opção 1: Deploy com 1 Clique no Coolify
1. No painel do Coolify, crie um novo recurso: **+ New Resource** ➔ **Public Repository**.
2. Cole a URL do repositório:
   ```
   https://github.com/cardoso-ix/PokeSurvivor-Endless-Hunt.git
   ```
3. O Coolify detectará automaticamente o `Dockerfile` e o `docker-compose.yml`.
4. Defina o seu domínio em **Domains** (ex: `https://jogar.meudominio.com`).
5. Clique em **Deploy**. O Nginx Alpine e os certificados SSL gratuitos (Let's Encrypt) serão configurados automaticamente!

📄 Consulte o guia completo em: [`docs/DEPLOY_COOLIFY.md`](docs/DEPLOY_COOLIFY.md).

### Opção 2: Deploy Direto via Terminal (Docker Compose)
```bash
git clone https://github.com/cardoso-ix/PokeSurvivor-Endless-Hunt.git
cd PokeSurvivor-Endless-Hunt
docker compose up -d --build
```
O jogo estará ativo na porta `80` com Nginx otimizado e compressão Gzip.

### Verificação do deploy
```bash
# 1. Confere a versão publicada (deve bater com o version.json local)
node tools/wait_for_vps_deploy.js

# 2. Valida a aplicação completa no navegador real
node tools/verify_vps_deploy.js
```

---

## 🛠️ Menu Admin & Blindagem de Segurança (Exclusivo Administrador)

> [!IMPORTANT]
> **Privacidade & Segurança em Produção:**  
> O botão flutuante **`🛠️ Admin [F2]`**, os atalhos de depuração (`F2`, `F1`, `'`) e os comandos de trapaça/injeção ficam **completamente ocultos e inativos para o público geral, amigos e visitantes**.  
> Eles são carregados e exibidos **exclusivamente na conta autenticada do Administrador** (`eduardoocardosoo@gmail.com` ou usuário mestre).  
> Para autenticação do administrador em novos dispositivos: utilize `Ctrl + Shift + Alt + A` ou `Ctrl + F2` com a chave mestra, ou o comando `adminLogin('senha')` no console.

O Painel de Administração oferece controle total sobre todos os subsistemas do jogo:
- **🎟️ Gestão de Tickets de Roleta:** Adicionar, definir ou zerar tickets da Roleta (`+100`, `+500`, `+1.000` ou valores customizados).
- **🎰 Roleta Gacha & Auditoria:**
  - `Girar Roleta 1x / 5x`: Executa sorteios com as novas probabilidades hardcore (0.40% Lendário, 0.50% Shiny, 0.02% Apex).
  - `Forçar Shiny` / `Forçar Lendário`: Testes pontuais de renderização e animações especiais.
  - `Simulação Estatística em Lote`: Executa 50 a 50.000 giros em lote com relatório de variância.
- **📖 Desbloqueio da Pokédex:** Busca por espécie (nome ou Dex) para desbloqueio Normal ou Shiny, liberação em massa e reset de progresso.
- **🧬 Evoluções & Combate:** Forçar próxima evolução, de-evoluir, modo deus, cura total e injeção de PokéMoedas.

---

## ⚖️ Sistema de Balanceamento & Economia Hardcore

O PokéSurvivor opera sob uma filosofia **Hardcore Roguelite** (desafiador, punitivo, balanceado e recompensador):
- **Combo por nível:** Nv. 1 dispara 1 ataque; Nv. 5, combo de 2; Nv. 10, combo de 3; Nv. 21, combo de 4 (`BalanceConfig.player.evolution.comboLevels`). O combo usa os primeiros ataques aprendidos e todos disparam juntos, cada um com seu próprio tempo de recarga; os que sobram ficam guardados e entram quando o combo cresce. Não há seleção manual de slot.
- **Sobrecarga no Nível 20:** +20% de área e -15% de tempo de recarga.
- **Rift:** concluir um Rift não abre mais tela de fusão (o sistema de Elo de Fusão foi removido).
- **Poder Real de Prestígio:** Pokémons Shiny recebem **+25% Dano / +10% HP / +5% Velocidade**; Lendários recebem **+20% Dano / +15% HP / +5% Velocidade**; Shiny Lendários (Apex) recebem **+50% Dano / +25% HP / +10% Velocidade** com aura cósmica exclusiva.
- **Captura Estratégica por Estágios:** Taxas base decrescentes (Estágio 1: 34%, Estágio 2: 24%, Estágio 3: 15%, Shiny: 10%, Lendário: 5%, Shiny Lendário: 2%) com teto rígido de 42% e altas recompensas de Gold Bounty.
- **Ascensão Exponencial (+1 ao +10):** Custos que escalam de 15.000 até 2.000.000 de moedas nos 9 atributos globais.
- **Ataques Iniciais Customizados:** O jogador inicia com 1 ataque selecionável por padrão. O **2º Ataque Inicial** pode ser desbloqueado para o Pokémon por **🪙 50.000 moedas**, permitindo iniciar a partida com 2 ataques ativos simultâneos.
- **Veto de Ataques (Banir):** Permite banir até **3 ataques indesejados** da seleção ao subir de nível, travado sem Ascensão para preservar a integridade tática da partida.
- **Economia Gacha Justa:** Cada Boss de mapa ou Guardião de Fenda derrotado dropa **100 a 150 Tickets**, financiando 1 giro completo da Roleta da Sorte (100 tickets por giro). As taxas de obtenção de Lendários e Shinies foram calibradas para raridade real de colecionador (0.40% Lendário, 0.50% Shiny Comum e 0.02% Shiny Lendário Apex).

---

## 🧪 Comandos e Depuração no Console (F12)

- `admin.setTickets(amount)` — Define o saldo exato de tickets de roleta no save.
- `admin.addTickets(amount)` — Adiciona quantidade de tickets ao saldo atual.
- `admin.forceShiny(1)` — Garante que o próximo giro da roleta seja Shiny (1%).
- `admin.forceLegendary(1)` — Garante que o próximo giro seja Lendário (5%).
- `admin.spin(count)` — Executa giros da roleta diretamente pelo console.
- `admin.simulate(count)` — Executa simulação estocástica de giros em lote com relatório.
- `debugCheckStages()` — Varre e valida os estágios de qualquer Pokémon no console.
- `debugCheckStarter('id')` — Testa se a espécie pode iniciar partida (apenas Estágio 1).
- `debugSetLevel(lvl)` — Altera o nível do jogador e dispara os marcos evolutivos automaticamente.
- `debugFillMega()` — Enche a barra de Mega para 100% imediatamente.
- `debugSpawnRift()` — Abre um Rift com Guardião na arena.

---

## 📁 Estrutura do Repositório

```
index.html              # Interface de produção otimizada gerada por build.js
dev.html                # Ambiente de desenvolvimento modular com scripts separados
Dockerfile              # Imagem Nginx Alpine ultra-leve para Coolify/VPS
docker-compose.yml      # Configuração para deploy direto com 1 clique
nginx.conf              # Configuração Nginx com Gzip e cache inteligente
assets/                 # Sprites PMD, áudios e fontes pixel art
css/
  hud.css               # Estilos do novo HUD inferior retro e painel de atributos
  style.css             # Estilos gerais da interface do jogo
js/
  core/                 # db, audio, input, camera, sprites, i18n, updater, util
  data/                 # evolutions (árvore genealógica das 9 gens), pokedex, moves, mega_ultimates
  entities/             # player, enemy, projectile, vfx, fx, pickup
  systems/              # capture, rift, mega, combat, spawner, levelup, weather, interact, judgment
  ui/                   # hud, menu, test, run-ui, gacha-ui, settings-ui, goals-ui, social-ui
tools/                  # Bateria de testes automatizados e scripts de build
docs/                   # Guias de deploy, domínio, SEO, Firebase e auditoria das regras
```

---

## 📜 Licença e Créditos

- Código sob licença [PolyForm Noncommercial 1.0.0](LICENSE-NONCOMMERCIAL.md) (livre para uso não-comercial, estudo e modificação).
- Sprites de [SpriteCollab](https://github.com/PMDCollab/SpriteCollab) sob licença **CC BY-NC 4.0**.
- Pokémon é marca registrada de Nintendo, Game Freak e Creatures Inc. Projeto de fã sem fins lucrativos.
