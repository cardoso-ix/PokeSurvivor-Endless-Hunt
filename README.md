# PokéSurvivor: Endless Hunt

[![GitHub License](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue.svg)](LICENSE-NONCOMMERCIAL.md)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%202D-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Docker Ready](https://img.shields.io/badge/Docker-Coolify%20Ready-2496ED.svg)](docs/DEPLOY_COOLIFY.md)

*Bullet-heaven* de ação e sobrevivência com Pokémon ao estilo de *Survivor.io* e *Vampire Survivors*, com estética retrô autêntica de RPG portátil (estilo Nintendo DS / Game Boy Advance), **todos os 966 Pokémon das 9 Gerações**, sprites de *Pokémon Mundo Misterioso*, Mega Overdrive de 10 segundos, sistema de captura em Rifts, clima dinâmico e salas cooperativas online.

Construído em **HTML5 Canvas 2D + Vanilla JavaScript moderno**, rodando a 60 FPS estáveis sem dependências pesadas de frontend.

---

> [!WARNING]
> **Aviso sobre Criptomoedas / Crypto Disclaimer**  
> O PokéSurvivor **NÃO possui nenhuma criptomoeda, token ou NFT oficial**, e nenhum foi criado por nós. Qualquer token usando o nome do jogo é criação não autorizada de terceiros. O jogo é gratuito e de código aberto para fins não-comerciais.

---

## 🎮 Controles & Como Jogar

| Tecla / Controle | Ação |
| :--- | :--- |
| `W` `A` `S` `D` / Setas | Mover o Treinador e seu Pokémon |
| `Espaço` / `Space` | Ativar **Mega Overdrive** (ao atingir 100% da barra) |
| `1` `2` `3` `4` / Clique no slot | Selecionar ataque ativo |
| `Q` / `E` / `Tab` | Alternar entre ataques anterior / próximo |
| `+` / `−` | Ajustar escala da câmera (zoom calibrado) |
| `Esc` / `P` | Pausar / Continuar partida |
| `1` `2` `3` / Clique na carta | Escolher melhoria ao subir de nível |
| `R` | Rolar cartas de nível (Reroll) |
| `F2` / `'` | Abrir Painel de Administração / Depuração |

**No Celular ou Tablet (Modo Paisagem/Horizontal):**  
Arraste o dedo em qualquer lugar da tela para mover o personagem com o joystick dinâmico, toque nos slots inferiores para trocar de habilidade e pause pelo botão no topo. Pode ser instalado diretamente como **PWA** ("Adicionar à Tela de Início").

---

## ✨ Novos Sistemas & Arquitetura de Gameplay

### 1. 🧬 Censo Oficial & Trava Estrutural dos 966 Pokémon (Gerações 1 a 9)
O ecossistema do jogo possui uma árvore genealógica completa baseada nas **540 cadeias evolutivas oficiais da PokeAPI**:
- **507 Pokémon de Estágio 1 (Base / Iniciais):** Únicos elegíveis para seleção inicial de partida (ex: Bulbasaur, Charmander, Pichu, Magikarp, Riolu, Gastly, Dreepy, Lapras, Heracross, Mewtwo, Cosmog, Kubfu).
- **459 Pokémon de Estágios 2 e 3 (Evoluções):** Bloqueados com 100% de rigor para seleção inicial. São obtidos exclusivamente via evolução durante a partida ou enfrentados como Guardiões de Rifts.
- **Sanitização de Saves:** Se o jogador possuir formas evoluídas em saves antigos, o sistema migra automaticamente para a forma base correspondente via `getBaseAncestor()` sem travar o motor.

---

### 2. 🌀 Sistema de Captura de Rifts & Mecânica da Gold Ball
Ao derrotar o Guardião do Rift dimensional, o minigame de captura com animação de arremesso é iniciado:
- **Escala Dinâmica de Pokébolas por Nível:**
  - Nv. 1 a 10: **Poké Ball** (+0% de bônus)
  - Nv. 11 a 20: **Great Ball** (+5% de bônus)
  - Nv. 21 a 30: **Ultra Ball** (+10% de bônus)
  - Nv. 31+: **Ultimate Ball** (+15% de bônus)
- **Mecânica da Gold Ball (Evento Raro Nv. 41+):**
  - Ao atingir o nível 41 ou superior, há **10% de chance** de a Ultimate Ball ser substituída pela lendária **Gold Ball**.
  - **Efeito:** **100% de captura garantida** (sem fuga) + **bônus imediato de 1.000 moedas de ouro**.
- **Regras de Spawn do Guardião:**
  - *Anti-Duplicação:* Não gera espécies já capturadas na Pokédex do jogador.
  - *Marco dos Lendários:* Lendários e Míticos só surgem a partir de 300+ Rifts concluídos.
  - *Pity de Shiny:* A cada 500 Rifts concluídos, o Guardião gerado é 100% garantido Shiny.

---

### 3. 🌟 Mega Overdrive Definitivo & Botão Retro Interativo
Ao atingir 100% de energia de Mega, o Treinador pode acionar o Poder Supremo Elemental tanto pela **tecla `[Espaço]`** quanto pelo **Botão Físico Retro (`#hud-mega-btn`)** integrado ao HUD inferior:
- **Botão Físico Retro com 3 Estados Reativos:**
  - *Carregando (`0% a 99%`):* Estilo chanfrado roxo translúcido com porcentagem em tempo real (`⚡ MEGA 45%`). Cliques prematuros disparam feedback com som suave e aviso em toast: `⚡ Mega carregando: X% (Pronto ao atingir 100% ou tecla [ESPAÇO])`.
  - *Pronto (`100%`):* O botão entra em animação de **pulso luminoso dourado e neon** (`⚡ MEGA [ESPAÇO]`), com borda chanfrada brilhante e cursor pointer convidativo.
  - *Ativo / Em Execução:* Transição para estilo de chamas neon com **cronômetro regressivo decrescente em tempo real** (`⚡ 9.4s`).
- **Acúmulo Dinâmico e Balanceado de Carga:**
  - Inimigos Comuns: **+1.20% de carga** (~83 abates para carga total).
  - Inimigos Elites: **+8.0% de carga**.
  - Chefes Normais: **+25.0% de carga**.
  - Guardiões de Rift: **+35.0% de carga**.
  - Subida de Nível (Level Up): Bônus imediato de **+3.5% de carga**.
- **Duração de 10.0 Segundos com Drenagem Linear Suave:** A barra drena uniformemente atuando como cronômetro visual.
- **Cadência Padrão sem Metralhadora:** A aceleração mecânica frenética de tiros básicos foi completamente expurgada; as habilidades normais mantêm cadência natural enquanto o elemento do líder devasta o campo.
- **Aura Protetora & Super Ímã:** Redução de 80% em todo dano recebido e dobro de raio de atração de gemas (+100%).
- **Catálogo Modular dos 18 Poderes Supremos Elementais (`MEGA_ULTIMATES_DATA`):**
  Identifica dinamicamente o tipo primário do Pokémon líder da equipe (`pl.types[0]`, `pl.mon.types[0]` ou `pl.species`) e dispara calamidades contínuas a cada 0.25s:
  - `fire`: Chuva de meteoros diagonais abrindo crateras de chamas e poças de lava no solo.
  - `water`: Chuva torrencial que desacelera inimigos em 40% com gêiseres e maelstrom explosivo.
  - `grass`: Vinhas espinhosas e raízes que convertem 15% do dano causado em cura de HP.
  - `electric`: Tempestade de relâmpagos verticais com arcos voltaicos em cadeia.
  - `ice`: Nevasca contínua com congelamento em área e estalactites pontiagudas.
  - `dragon`: Bombardeio de meteoros dracônicos cósmicos de energia ancestral.
  - `ghost`: Aparição de espectros sombrios e névoa etérea de dano necrótico.
  - `psychic`: Ondas psíquicas de distorção gravitacional que repelem e esmagam monstros.
  - `ground`: Fissuras tectônicas e terremotos que quebram o solo.
  - `rock`: Avalanche de rochas pontiagudas em cascata.
  - `flying`: Furacões e tornados velozes que arrastam hordas inimigas.
  - `bug`: Enxame voraz de gafanhotos de energia e teias venenosas.
  - `poison`: Gêiseres de lodo tóxico com nuvens de veneno corrosivo persistente.
  - `fighting`: Ondas de choque de impacto sísmico e socos de alta pressão.
  - `steel`: Lâminas metálicas e espinhos de aço perfurantes.
  - `dark`: Vórtice de escuridão profunda que suga monstros para o núcleo negro.
  - `fairy`: Chuva de brilhos estelares mágicos com explosões prismáticas.
  - `normal`: Hiper-raio radial de energia pura com empurrão massivo.

---

### 4. 🎴 Novo HUD Inferior Retro Pixel Art (Estilo DS / GBA)
- **Moldura Chanfrada:** Design sólido em `#141624` com chanfros de relevo em `#3a3f58`, `#5c648d` e dourado `#f8b800`.
- **Barra de Vida (HP):** Indicador numérico preciso (`HP 320 / 320`), cores dinâmicas (Verde >50%, Amarelo 25-50%, Vermelho <25%) e efeito de dano recebido com rastro suave (*ghost bar*).
- **Linha do Mega:** Barra com gradiente de energia + **Botão Dedicado de Mega** (`#hud-mega-btn`) ao lado da barra, perfeitamente alinhados e responsivos para teclado, mouse e touch.
- **Bandeja de Ataques:** Slots ampliados com marcador de nível (`Nv. 3`) e máscara translúcida de recarga (*cooldown sweep*).

---

### 5. 📊 Painel Retro de Atributos & Status (`#stats-rpg-panel`)
Localizado no canto inferior esquerdo, exibe os atributos em tempo real com ícones temáticos e valores precisos:
- ⚔️ **ATK:** Multiplicador de dano | 🛡️ **DEF:** Redução de dano
- 👟 **VEL:** Velocidade de movimento | ⏱️ **CD:** Redução de recarga
- 🎯 **CRT:** Chance crítica | 🔮 **MAG:** Raio de atração de EXP
- 📐 **APR:** Área dos projéteis | 💖 **REG:** Regeneração por segundo

---

### 6. ☀️ Widget de Clima Retro (`js/systems/weather.js`)
- Localizado no topo direito com moldura chanfrada de RPG de 38px de altura.
- Badge embutido de 28x28px com o ícone elemental do clima (Sol, Chuva, Neve, Tempestade de Areia, etc.).
- Temporizador digital embutido com alerta piscante nos últimos 5 segundos.
- Barra de progresso chanfrada em relevo acompanhando a estética da barra de HP.

---

### 7. 🧭 Bússola & Mini-Mapa Retro Pokégear (`js/ui/hud.js`)
- Raio expandido para 72px (+20% de visibilidade).
- Aro de bússola chanfrado com relevos metálicos e filete em ouro nobre `#f8b800`.
- Insígnias cardeais clássicas: Badge de Norte (**N**) no topo e losangos dourados nos eixos Leste, Sul e Oeste.
- Fundo azul-noite profundo (`#101422`), feixe de varredura suave em ciano e marcadores de alta legibilidade (jogador em verde esmeralda com ponteiro de mira, chefes em fogo pulsante e rifts em violeta).

---

### 8. ⚡ Marcos de Evolução Automática das 9 Gerações (100% Cobertas)
Todas as **434 espécies evoluíveis** cadastradas nas 9 gerações possuem resolução automática em tempo de execução:
- **Nível 5:** 1ª Evolução Automática garantida (Estágio 2). Cobre tanto evoluções clássicas de 3 estágios quanto Pokémon de estágio único que atingem a forma final (ex: Pikachu ➔ Raichu, Riolu ➔ Lucario, Growlithe ➔ Arcanine, Eevee ➔ Jolteon).
- **Nível 12:** 2ª Evolução Automática (Estágio 3 / Forma Final). (ex: Ivysaur ➔ Venusaur, Charmeleon ➔ Charizard, Haunter ➔ Gengar, Gabite ➔ Garchomp).
- **Nível 21:** Ascensão Mega / Forma Ápice (+50% de dano definitivo, aura luminosa permanente e burst estelar de partículas).
- **Sem poluição de cartas de Level Up:** As opções de cartas de melhoria continuam dedicadas exclusivamente a novos golpes e fusões de ataques, enquanto a transformação corporal do Pokémon ocorre de forma limpa e automática na arena.

---

## 🚀 Como Colocar Online na VPS com Coolify

O projeto está 100% preparado para deploy contínuo em VPS com **Coolify** ou **Docker Compose**:

### Opção 1: Deploy com 1 Clique no Coolify
1. No painel do Coolify, adicione um novo recurso: **+ New Resource** ➔ **Public Repository**.
2. Cole a URL do repositório:
   ```
   https://github.com/cardoso-ix/PokeSurvivor-Endless-Hunt.git
   ```
3. O Coolify detectará automaticamente o `Dockerfile` e o `docker-compose.yml`.
4. Defina o seu domínio em **Domains** (ex: `https://jogar.meudominio.com`).
5. Clique em **Deploy**. O Nginx Alpine e os certificados SSL serão configurados automaticamente!

📄 Consulte o guia detalhado em: [`docs/DEPLOY_COOLIFY.md`](docs/DEPLOY_COOLIFY.md).

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
- `debugSetLevel(lvl)` — Altera o nível do jogador e dispara os marcos evolutivos.
- `debugFillMega()` — Enche a barra de Mega para 100% imediatamente.
- `debugTriggerGoldBall()` — Força a captura com Gold Ball (100% taxa + 1.000 ouro).
- `debugSpawnRift()` — Abre um Rift com Guardião na arena.

---

## 📁 Estrutura do Repositório

```
index.html              # Interface do jogo e ordem de carregamento em produção
dev.html                # Ambiente de desenvolvimento local com scripts modulares
Dockerfile              # Imagem Nginx Alpine ultra-leve para Coolify/VPS
docker-compose.yml      # Configuração para deploy direto com 1 clique
nginx.conf              # Configuração Nginx com Gzip e cache inteligente
assets/                 # Sprites PMD, áudio e fontes
css/
  hud.css               # Estilos do novo HUD inferior retro e painel de atributos
  style.css             # Estilos gerais da interface
js/
  core/                 # db, audio, input, camera, sprites, util
  data/                 # evolutions (árvore genealógica das 9 gens), pokedex, moves, mega_ultimates
  entities/             # player, enemy, projectile, vfx, fx, pickup
  systems/              # capture, rift, mega, combat, spawner, levelup, weather
  ui/                   # hud (bússola e canvas), menu, test, run-ui, gacha-ui
tools/                  # Scripts de teste automatizado e build de produção
```

---

## 📜 Licença e Créditos

- Código sob licença [PolyForm Noncommercial 1.0.0](LICENSE-NONCOMMERCIAL.md) (livre para uso não-comercial, estudo e modificação).
- Sprites de [SpriteCollab](https://github.com/PMDCollab/SpriteCollab) sob licença **CC BY-NC 4.0**.
- Pokémon é marca registrada de Nintendo, Game Freak e Creatures Inc. Projeto de fã sem fins lucrativos.
