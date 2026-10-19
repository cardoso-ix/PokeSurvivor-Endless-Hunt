# Changelog — PokéSurvivor: Endless Hunt

Todas as alterações notáveis, correções de bugs e novas mecânicas deste projeto são documentadas neste arquivo.

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
