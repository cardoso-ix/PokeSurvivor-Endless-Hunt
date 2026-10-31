# GDD — PokéSurvivor: Endless Hunt (Documento de Game Design)

> Documento de design vivo. Reflete o estado **atual e oficial** do jogo, suas regras matemáticas e arquitetura de sistemas.

---

## 1. Conceito Central & Pilares

- **Gênero:** *Bullet-Heaven / Horde Survival* + *Roguelike* + *RPG Colecionável de Pokémon*.
- **Inspirações:** *Survivor.io*, *Vampire Survivors*, *Pokémon Mundo Misterioso*.
- **Estética:** Retrô autêntica de RPG portátil (estilo Nintendo DS / Game Boy Advance) com sprites de *Pokémon Mystery Dungeon*, caixas de diálogo chanfradas, trilhas sonoras orquestradas em chiptune e efeitos visuais em Canvas 2D.
- **Roster Total:** **966 Pokémon** cobrindo todas as 9 Gerações (Kanto até Paldea).
- **Plataformas:** Web Browser (Desktop e Mobile) com suporte a PWA (Progressive Web App) e 60 FPS constantes em Canvas HTML5 puro sem frameworks pesados.

---

## 2. Fluxo de Telas & Progressão

```
Login / Registro / Jogar como Convidado
        │
        ├─ (Primeiro Acesso) Quiz de Personalidade (8 Perguntas) ─> Parceiro Sugerido
        │                                                           ├─ Vamos juntos!
        │                                                           └─ Escolher outro (Starters Estágio 1)
        ▼
Menu Principal (Mundo vivo ao fundo com Pokémon passeando)
   ├─ Jogar           → Seleção de Região (Fase) → Run de Combate → Fim de Jogo (PokéMoedas & Shinies) → Menu
   ├─ Pokémon         → Pokédex e Coleção por Região, seleção de parceiro (Normal ou Shiny)
   ├─ Melhorias       → Upgrades permanentes individuais por Pokémon
   ├─ Gacha           → Sorteios regionais (desativado/alternativo em prol dos Rifts)
   ├─ Missões         → Missões Diárias, Semanais, Conquistas e Perfil Público
   ├─ Amigos          → Apelidos únicos, status online, convites e Sala Cooperativa (até 4 jogadores)
   ├─ Classificação   → Ranking global por tempo de sobrevivência (Solo / Grupo)
   └─ Configurações   → Som, Gráficos, Controles (Mobile/PC), Conta e Sobre
```

---

## 3. Mecânicas de Combate & Sistemas em Partida

### 3.1 Disparos e Cadência
- O Pokémon líder ataca automaticamente. **Combo por nível:** Nv. 1 = 1 ataque, Nv. 5 = 2, Nv. 10 = 3, Nv. 21 = 4 (os primeiros aprendidos, todos juntos). Não há seleção manual de slot nem fusão de ataques.
- **52 Golpes Base e 60 Evoluções:** Divididos em famílias elementais (Projétil, Corpo a Corpo, Raio, Orbes, Nova, Aura, Buff) cobrindo todos os 18 tipos elementais.

### 3.2 Marcos de Evolução Automática (Níveis 5, 12 e 21)
- **Nível 5:** Primeira Evolução Automática das linhas de 3 estágios.
- **Nível 12:** Segunda evolução das linhas de 3 estágios e evolução única das linhas de 2 estágios (Forma Final).
- **Nível 21:** Ascensão Mega / Forma Ápice (+50% de dano definitivo, aura cintilante e burst estelar).
- **Sem cartas ocupadas:** As transformações acontecem automaticamente sem roubar opções de cartas de melhoria.

### 3.3 Mega Overdrive v2 (18 Tipos)
- Barra de energia carregada com abates de monstros (+1.2% comum, +8% elite, +25% chefe, +35% guardião do rift).
- Ao atingir 100%: `[Espaço]`, `[M]` ou botão `#hud-mega-btn`. Cinemática curta (0,9 s) + carga (0,6 s) + **golpe único em tela cheia, em pixel art**, com um golpe assinatura para cada tipo (ver README, seção 4).
- Depois do golpe, 10 segundos de buff (Pokémon gigante, dano ×2,5, dano recebido ×0,2, super ímã) com drenagem linear da barra.

---

## 4. Sistema Diegético de Captura em Rifts

- **Fim dos Modais Invasivos:** A captura acontece fisicamente no solo do Canvas sem pausar o jogo.
- **WorldCaptureBall:**
  - Cai nas coordenadas exatas da derrota do Guardião com física e gravidade.
  - Balança 3 vezes no solo (-28°, +28°, -28°).
  - Sucesso: Trava central, partículas douradas, SFX e registro imediato na Pokédex como jogável.
  - Falha: Abertura da bola com fumaça cinza e fuga do monstro.
- **Tabela de Raridade de Spawns de Guardiões:**
  - 75% Comum/Regional Normal
  - 15% Comum/Regional Shiny
  - 9% Lendário Normal (requer 30+ Rifts concluídos)
  - 1% Lendário Shiny (requer 30+ Rifts concluídos)
- **Mecânica da Gold Ball (Nv. 41+):**
  - 10% de chance de proc raro.
  - 100% de captura garantida + 1.000 PokéMoedas de bônus imediato.

---

## 5. Arquitetura Técnica & Performance

- **Motor Canvas 2D:** Desenhado quadro a quadro em `requestAnimationFrame` a 60 FPS.
- **Zero Frameworks:** Construído em Vanilla JS sem React, Vue ou dependências pesadas de runtime.
- **Sincronização em Nuvem:** Google Firebase Firestore para persistência de conta, apelidos e progresso seguro.
- **Multiplayer P2P WebRTC:** Partidas em grupo de até 4 jogadores com conexão direta sem lag de servidor central.
