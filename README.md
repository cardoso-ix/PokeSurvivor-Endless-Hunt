# PokéSurvivor: Endless Hunt

[![GitHub License](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue.svg)](LICENSE-NONCOMMERCIAL.md)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%202D-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Docker Ready](https://img.shields.io/badge/Docker-Coolify%20Ready-2496ED.svg)](docs/DEPLOY_COOLIFY.md)
[![Language](https://img.shields.io/badge/Language-Portugu%C3%AAs%20do%20Brasil%20(pt--BR)-green.svg)](#-localização-completa-em-português-do-brasil-pt-br)

*Bullet-heaven* de ação e sobrevivência com Pokémon ao estilo de *Survivor.io* e *Vampire Survivors*, com estética retrô autêntica de RPG portátil (estilo Nintendo DS / Game Boy Advance), **todos os 966 Pokémon das 9 Gerações**, sprites de *Pokémon Mundo Misterioso*, Mega Overdrive Elemental dos 18 tipos, sistema de captura diegética em Rifts, evolução automática e salas cooperativas online.

Construído em **HTML5 Canvas 2D + Vanilla JavaScript moderno**, rodando a 60 FPS estáveis sem frameworks pesados de frontend.

---

> [!WARNING]
> **Aviso sobre Criptomoedas / Crypto Disclaimer**  
> O PokéSurvivor **NÃO possui nenhuma criptomoeda, token ou NFT oficial**, e nenhum foi criado por nós. Qualquer token usando o nome do jogo é criação não autorizada de terceiros. O jogo é gratuito e de código aberto para fins não-comerciais.

---

## 🌐 Acesso Online & Links de Teste

| Ambiente | URL | Descrição |
| :--- | :--- | :--- |
| **Produção Online (VPS Coolify)** | [http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/](http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/) | Versão oficial com deploy contínuo |
| **Versão de Desenvolvimento (VPS)** | [http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html](http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html) | Acesso direto com scripts modulares |
| **Ambiente Local (PC)** | [http://localhost:8080/index.html](http://localhost:8080/index.html) | Servidor local no computador de desenvolvimento |
| **Rede Local Wi-Fi (Mobile/LAN)** | [http://192.168.0.107:8080/index.html](http://192.168.0.107:8080/index.html) | Acesso via smartphone ou tablet na mesma rede |

---

## 🎮 Controles & Como Jogar

| Tecla / Controle | Ação |
| :--- | :--- |
| `W` `A` `S` `D` / Setas | Mover o Treinador e seu Pokémon parceiro |
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
- **Nível 5:** 1ª Evolução Automática garantida (Estágio 2). Cobre tanto evoluções clássicas de 3 estágios quanto Pokémon de estágio único que atingem a forma final (ex: *Pikachu ➔ Raichu*, *Riolu ➔ Lucario*, *Growlithe ➔ Arcanine*, *Eevee ➔ Jolteon*).
- **Nível 12:** 2ª Evolução Automática (Estágio 3 / Forma Final). (ex: *Ivysaur ➔ Venusaur*, *Charmeleon ➔ Charizard*, *Haunter ➔ Gengar*, *Gabite ➔ Garchomp*).
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
- **Balanceamento Rigoroso de Raridade de Spawn:**
  - `roll <= 75%` ➔ Pokémon Comum/Regional Normal.
  - `75% < roll <= 90%` ➔ Pokémon Comum/Regional **Shiny** (15% de chance).
  - `90% < roll <= 99%` ➔ Pokémon **Lendário Normal** (9% de chance; requer 30+ Rifts concluídos).
  - `roll > 99%` ➔ Pokémon **Lendário Shiny** (1% de chance; requer 30+ Rifts concluídos).
- **Tiers Dinâmicos de Pokébola:**
  - Nv. 1 a 10: **Poké Ball** (+0% bônus | Taxa Base: 50% Normal, 20% Lendário, 15% Shiny)
  - Nv. 11 a 20: **Great Ball** (+5% bônus)
  - Nv. 21 a 30: **Ultra Ball** (+10% bônus)
  - Nv. 31+: **Ultimate Ball** (+15% bônus)
  - Nv. 41+ (Evento Raro): **Gold Ball** (10% de chance de substituição, **100% de captura garantida** + 1.000 PokéMoedas de bônus).

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

### 5. 🎴 HUD Inferior Retro Pixel Art & Painel de Status em Tempo Real
- **Design Estilo GBA / Nintendo DS:** Moldura chanfrada de alta definição com relevo e paleta retro.
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

### 6. 🎰 Sistema de Roleta Gacha (5.000 Tickets) & Conversão de Repetidos
O jogo conta com um sistema de Roleta Gacha temático acessível pelo Menu Principal e integrado aos Tickets obtidos nas partidas (em baús especiais, chefes e Guardiões de Fendas):
- **Custo por Giro:** 5.000 Tickets por giro simples (`save.tickets.t1`) ou 25.000 Tickets para giros múltiplos (×5).
- **Pool Global:** Sorteio entre **todos os 966 Pokémon do jogo** (Gerações 1 a 9).
- **Probabilidades Oficiais:**
  - 👑 **5.0% Pokémon Lendário:** Sorteio entre todos os 103 Lendários e Míticos da Pokédex (Mewtwo, Rayquaza, Dialga, Arceus, etc.).
  - ✨ **1.0% Pokémon Shiny:** Versão brilhante ultra-rara com partículas estelares e sprite alternativo.
  - ⚪ **94.0% Pokémon Normal:** Sorteio entre todas as 863 espécies comuns, incomuns e raras.
- **Regra de Bônus de Repetidos na Pokédex:**
  - Se o Pokémon sorteado já constar na Pokédex do jogador: concede instantaneamente **+1.000 PokéMoedas** para usar na aba de Melhorias permanentes!
  - Se for um Pokémon inédito: desbloqueia e registra imediatamente na Pokédex do jogador.
- **Animação Retrô Caça-Níqueis (Pixel Art):** Máquina de slots desenhada em Canvas com alavanca física, rolos com desaceleração em suspense (`👑 LENDÁRIO?!`, `✨ SHINY?!`), efeitos sonoros triunfantes (`legend`, `shiny`, `reveal`, `burst`) e cards holográficos.

---

### 7. 🌌 Sistema de Batalha de Rift & Compensação de Repetidos (+500 Moedas e +500 Tickets)
As Fendas Dimensionais (Rifts) oferecem desafios de alto risco contra chefes e Guardiões Lendários:
- **Captura Diegética no Mapa:** Ao derrotar o Guardião da Fenda, a Pokébola apropriada ao nível do jogador é arremessada no chão do mapa com física e animação de balanço em 3 estágios.
- **Regra de Pokémon Repetido na Pokédex:**
  - Se o jogador capturar um Pokémon que **já possui registrado na Pokédex**:
    - 💰 **+500 PokéMoedas** creditadas imediatamente no save permanente (`save.coins`) e no personagem ativo em jogo (`player.coins`).
    - 🎟️ **+500 Tickets da Roleta Gacha** creditados imediatamente (`save.tickets.t1` e `player.t1`), permitindo acumular giros para concorrer a Lendários e Shinies na Roleta.
  - Se for um Pokémon **inédito**: registra a nova espécie na Pokédex permanente e desbloqueia seu ancestral de Estágio 1 na lista de iniciais jogáveis.
  - Se for uma versão **Shiny repetida na Dex normal**: entrega as 500 moedas e 500 tickets de repetido e também registra a versão brilhante na coleção Shiny (`save.shiny`).
- **Feedback Visual & Sonoro Diegético no Canvas:**
  - Card superior com aviso: `✨ REPETIDO! +500 MOEDAS · +500 TICKETS! ✨`.
  - Textos flutuantes ao redor da Pokébola: `✨ [NOME] REPETIDO! ✨` e `+500 MOEDAS · +500 TICKETS!`.
  - Anúncio do Spawner no topo: `🎉 [NOME] repetido! Você ganhou +500 PokéMoedas e +500 Tickets para a Roleta!`.
  - Atualização instantânea dos contadores de saldo do HUD superior e inferior.

---

## 🚀 Como Colocar Online na VPS com Coolify

O projeto está configurado para deploy contínuo em VPS com **Coolify** ou **Docker Compose**:

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

---

## 🧪 Comandos e Depuração no Console (F12)

- `debugCheckStages()` — Varre e valida os estágios de qualquer Pokémon no console.
- `debugCheckStarter('id')` — Testa se a espécie pode iniciar partida (apenas Estágio 1).
- `debugSetLevel(lvl)` — Altera o nível do jogador e dispara os marcos evolutivos automaticamente.
- `debugFillMega()` — Enche a barra de Mega para 100% imediatamente.
- `debugTriggerGoldBall()` — Força a captura com Gold Ball (100% taxa + 1.000 moedas).
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
```

---

## 📜 Licença e Créditos

- Código sob licença [PolyForm Noncommercial 1.0.0](LICENSE-NONCOMMERCIAL.md) (livre para uso não-comercial, estudo e modificação).
- Sprites de [SpriteCollab](https://github.com/PMDCollab/SpriteCollab) sob licença **CC BY-NC 4.0**.
- Pokémon é marca registrada de Nintendo, Game Freak e Creatures Inc. Projeto de fã sem fins lucrativos.
