# PokeSurvivor: Endless Hunt

Bullet-heaven com Pokémon ao estilo de Survivor.io e Vampire Survivors, com sprites de
*Pokémon Mundo Misterioso*, camada roguelike, **966 Pokémon das 9 gerações**,
Mega Evolução / Super Frenzy, shinies, clima dinâmico e gacha por região. Trilha sonora em piano suave e efeitos compostos para o jogo.

HTML5 Canvas 2D + Vanilla JavaScript moderno. Versão 1.0 (20/10/2026).

> **Aviso sobre criptomonedas / Crypto disclaimer**
>
> PokéSurvivor **no tiene ninguna criptomoneda, token ni NFT oficial**, y yo no
> he creado ninguno. Cualquier token que use el nombre del juego lo han creado
> terceros. **No me hago cargo de ninguna compra, venta o inversión** que hagas
> con ellos y nada de lo que hay aquí es una recomendación de inversión. El
> juego es gratis y lo seguirá siendo.

## Controles & Como Jogar

| Tecla / Controle | Ação |
|---|---|
| `W` `A` `S` `D` / Setas | Mover o Pokémon |
| `Espaço` / `Space` | Ativar Modo Mega / Fúria (ao carregar 100%) |
| `1` `2` `3` `4` / Clique no ícone | Selecionar ataque ativo |
| `Q` / `E` / `Tab` | Alternar ataque anterior / próximo |
| `+` / `−` / Menu Ajustes | Zoom da câmera (escala fixa e calibrada) |
| `Esc` / `P` | Pausa / Reanudar partida |
| `1` `2` `3` / Clique na carta | Escolher carta ao subir de nível |
| `R` | Rolar cartas ao subir de nível (Reroll) |
| `F2` / `'` | Painel de Administração / Depuração |

## ✨ Novos Sistemas & Arquitetura de Gameplay

### 1. Trava Rígida de Câmera
- Zoom 100% fixo e calibrado na partida (1.25x), imune a giros acidentais da roda do mouse (`wheel`).
- Prevenção nativa de rolagem da página pelo Canvas (`e.preventDefault()`). Ajuste de zoom disponível via menu de Ajustes ou atalhos `+`/`−`.

### 2. Sistema de Captura de Rifts & Gold Ball
- Ao derrotar o Guardião do Rift, a captura cinemática é iniciada com a Pokébola correspondente ao nível:
  - **Poké Ball** (Nv. 1–10, +0%)
  - **Great Ball** (Nv. 11–20, +5%)
  - **Ultra Ball** (Nv. 21–30, +10%)
  - **Ultimate Ball** (Nv. 31+, +15%)
  - **Gold Ball** (Nv. 41+, 10% de chance de ativação: 100% captura garantida + 1.000 moedas de ouro de recompensa)
- Taxas base balanceadas: 50% para espécies básicas, 20% para lendários, 15% para variantes Shiny.

### 3. Trava Estrutural de Estágio 1 (Base vs Evolução)
- Varredura e validação pura (`isBaseStage`): apenas formas base/iniciais (que não evoluem de ninguém) podem ser escolhidas para iniciar partidas.
- Formas evoluídas (Estágios 2 e 3) ficam travadas para seleção inicial e são desbloqueadas e alcançadas exclusivamente durante a jornada.

### 4. Mega Overdrive Definitivo (10 Segundos Contínuos & 18 Calamidades)
- Ao atingir 100% da barra de Mega e pressionar `[Espaço]`, o modo Overdrive é ativado:
  - Duração de 10.0 segundos com drenagem linear regressiva na barra.
  - Aura Protetora: redução de 80% no dano sofrido (`dmgTakenMul = 0.20`).
  - Ímã Ampliado: +100% de raio de atração de EXP (`magnetMul = 2.0`).
  - Calamidade Elemental Contínua cobrindo a arena a cada 0.25s–0.35s baseada no tipo do Pokémon líder (todos os 18 tipos mapeados).
  - Gerenciamento de partículas e hazards via pooling em `UltimateVFX` a 60 FPS estáveis.

### 5. Novo HUD Inferior Retro Pixel Art (Estilo RPG DS/GBA) & Marcos Evolutivos
- Painel chanfrado ampliado (+30% a 40%) fixado na base da tela:
  - Retrato do Líder com badge de nível [LV X].
  - Barra de Vida (HP) com estágios de cor dinâmicos (Verde >50%, Amarelo 20-50%, Vermelho <20%), indicador numérico e rastro fantasma de dano (*ghost bar*).
  - Barra de Mega com pulso luminoso em 100% e cronômetro regressivo durante o Overdrive.
  - Deck de Ataques Ativos com ícones de tipo, nível [Nv. X] e máscara de recarga (*cooldown sweep*).
- **Marcos de Evolução Automática na Partida:**
  - **Nível 5:** Primeira evolução (Estágio 2).
  - **Nível 12:** Segunda evolução / Estágio Final (Estágio 3).
  - **Nível 21:** Ascensão Mega (+50% de dano e aura dourada cintilante) ou Forma Ápice (+50% de dano e aura arco-íris).
  - Transição clássica com slowdown de 0.2s, flash de partículas e atualização instantânea de sprites e atributos.

### 🛠️ Atalhos de Depuração no Console (F12)
- `debugSetLevel(lvl)` — Define o nível instantaneamente e dispara os marcos evolutivos correspondentes.
- `debugTestHp(pct)` — Simula dano no HP (ex: `0.1` para 10%) para testar cores e a ghost bar do HUD.
- `debugFillMega()` — Enche a barra de Mega para 100% para acionamento imediato com `[Espaço]`.
- `debugTriggerCapture(opts)` — Dispara a sequência de captura para a espécie e nível desejados.
- `debugTriggerGoldBall(opts)` — Força o arremesso da Gold Ball com 100% de captura garantida e bônus de 1.000 ouro.
- `debugSpawnRift()` — Força o surgimento imediato de um Rift com Guardião no mapa.
- `debugCheckStages()` — Audita o ecossistema de espécies identificando estágios base vs evoluções.
- `debugSanitizeSave()` — Purifica o save local expurgando qualquer evolução indevida da lista de jogáveis.

**En móvil o tablet** (en horizontal): pon el dedo en cualquier sitio y arrastra
para moverte (el joystick aparece donde tocas), toca un ataque de abajo para
cambiarlo y el botón de arriba a la derecha para pausar. Se puede instalar como
app ("Añadir a pantalla de inicio"). En **Ajustes** hay sonido, calidad gráfica
(con modo automático), números de daño, menos sacudidas, FPS y la cuenta.

El Pokémon ataca solo con el movimiento activo (o con todos los de un
**vínculo**: cada legendario vencido deja fusionar movimientos para lanzarlos a
la vez desde un solo hueco, hasta 4). Las rocas, cofres y la hierba
alta se rompen; las paredes y los árboles bloquean los disparos enemigos; el
agua frena y la lava quema (también a los enemigos).

En el mapa hay **altares de poder**, **manantiales** que curan, **cofres con
candado** (quédate a su lado unos segundos) y **trampas** que también dañan a
los enemigos. A veces se abre una **grieta**: entra y lucharás contra un
**legendario** en una arena aparte.

Hay **tabla de tipos** (un Rayo Burbuja le quita más a un Charmander) y,
de vez en cuando, **climas** (sol, lluvia, arena, nieve, niebla) que potencian
unos tipos y debilitan otros.

Cada día hay **misiones** (y semanales) que dan tickets y monedas; los
**logros** dan medallas y títulos, y tu **perfil** enseña tus 3 Pokémon
favoritos, tus marcas y tus medallas. En las runs encuentras **objetos** (Restos,
Cinta Elección...) y tus movimientos **evolucionan** al máximo nivel. Los
enemigos tienen personalidad: curan, ponen escudos, llaman a su manada o atacan
con aviso en el suelo.

Las **mejoras** son de cada Pokémon. El **gacha** va con **tickets** que se
ganan jugando (×1 de algunos Pokémon, ×10 de jefes y legendarios), y se tira
en una tragaperras pixel art.

Cada enemigo tiene 1/4096 de salir **shiny**: brilla, una flecha en el borde de
la pantalla te dice dónde está, y si lo derrotas te lo quedas. En el gacha sale
shiny 1 de cada 100 tiradas. En la colección eliges tu compañero en versión
normal o shiny.

La música suena tras el primer clic (los navegadores no dejan reproducir sonido
antes). Volumen y silencio: botón del altavoz arriba a la derecha, o en la pausa.

El guardado vive en el `localStorage` del navegador: si borras los datos del
sitio, se pierde.

En `videos/` hay grabaciones del juego (con su música): un combate contra un
jefe, la captura de un shiny salvaje y un shiny en el gacha.

## Guardado en la nube y publicación

- **Base de datos (Firebase):** cuentas con nombre + contraseña o Google, y la
  partida se sigue en cualquier ordenador. Pasos en [docs/FIREBASE.md](docs/FIREBASE.md).
  Sin configurar, el juego guarda sólo en el navegador, como antes.
- **Jugar con amigos (hasta 4) y ranking:** con cuenta en la nube, menú
  **Amigos** (añadir por apodo, invitar a tu sala) y **Ranking** (tiempo
  aguantado: solo o grupo, de hoy a histórico, amigos, por Pokémon).
- **Publicar gratis en GitHub Pages:** [docs/PUBLICAR.md](docs/PUBLICAR.md).
- Si se juega en dos ordenadores a la vez o sin conexión, las partidas se
  **fusionan**: las colecciones se unen (nunca se pierde un Pokémon ni un
  shiny), mejoras y estadísticas se quedan con el máximo, y monedas y
  compañero con la versión más reciente. Los cambios de otro ordenador llegan
  en directo.

## Licencia

Código bajo [PolyForm Noncommercial 1.0.0](LICENSE-NONCOMMERCIAL.md) desde el
14-10-2026: se puede usar, estudiar y modificar, pero **no con fines
comerciales** (ni vender el juego ni cobrar nada dentro de él). Las versiones
hasta el commit `b297089` se publicaron bajo MIT. Los sprites (CC BY-NC 4.0),
la fuente (OFL) y las marcas de Pokémon tienen sus propias condiciones: ver
[LICENSE](LICENSE) y [CREDITS.md](CREDITS.md). Proyecto de fan sin ánimo de
lucro.

**La única web oficial es [pokesurvivor.com](https://pokesurvivor.com).** El
juego es y será gratis: si alguien te pide pagar, no somos nosotros.

## Estructura

```
index.html              pantallas + orden de carga
css/style.css           interfaz estilo Mundo Misterioso
assets/pokemon/{dex}/   hojas de sprites PMD (Idle, Walk, Attack, Shoot, Charge, Hurt, Faint)
assets/pokemon/{dex}/s/ las mismas en versión shiny
assets/fonts/           Pixelify Sans (OFL) y su versión con números redibujados (tools/make_font.py)
js/
  net/      social (apodo, amigos, salas), net (WebRTC + relé),
            coop (partida en grupo), ranking
  core/     util, db (guardado), audio (sintetizador + efectos), input,
            sprites (animador PMD), camera
  data/     pokedex*, sprites-meta*, moves, starters (+ test), enemies,
            upgrades, music (partituras)
  world/    tiles (pixel art en código), world (terreno, objetos, colisiones)
  entities/ player, enemy, projectile, pickup, fx
  systems/  combat, spawner, levelup, gacha
  ui/       icons (pixel art), ui, hud, login, test, menu, gacha-ui, run-ui,
            social-ui, ranking-ui
  game.js   flujo y bucle principal
tools/      scripts que regeneran los ficheros marcados con *
```

`*` = generado. Para rehacerlos (necesita Python 3 + Pillow e internet, sólo esa vez):

```
python tools/fetch_sprites.py    # sprites normal y shiny + js/data/sprites-meta.js
                                 # (~20 min; se puede cortar y relanzar: usa tools/cache/)
python tools/fetch_pokedex.py    # js/data/pokedex.js
python tools/fetch_credits.py    # CREDITS.md
```

## Notas de implementación

- **Sprites PMD.** Columnas = fotogramas, filas = 8 direcciones (Down, DownRight,
  Right, UpRight, Up, UpLeft, Left, DownLeft — verificado con los `-Offsets.png`).
  Cada animación tiene su propio tamaño de fotograma, así que se alinean por el
  **ancla al suelo** sacada del `-Shadow.png`; sin eso el sprite saltaría al atacar.
- **Coordenadas.** `(x, y)` de una entidad son sus **pies**. Las colisiones
  ocurren en el plano del suelo; los proyectiles vuelan en ese plano y se dibujan
  elevados con su sombra debajo.
- **Mundo.** Chunks de 16×16 tiles: los *datos* (terreno, objetos) son baratos y
  se generan siempre; la *imagen* se hornea a resolución de arte escribiendo en un
  `ImageData` (~4 ms por chunk en Chrome) y sólo para los visibles.
- **Rendimiento.** Rejilla espacial de enemigos reconstruida cada frame. Con 420
  enemigos, simulación + render completo ≈ 3 ms por frame en Chrome.
- **Metadatos en `.js`, no `.json`**, porque `fetch()` está bloqueado en `file://`.
- **Shiny.** Los shiny de SpriteCollab son el mismo dibujo con otra paleta; están
  en `s/` y sólo 30 tienen geometría distinta (campo `sa` en los metadatos).
  Las hojas se guardan como PNG con paleta exacta: misma imagen, la mitad de peso.
- **Audio.** Sintetizador Web Audio con planificador anticipado (programa las
  notas 150 ms por delante) y reverb por convolución con un impulso generado.
  Las partituras están en `js/data/music.js` en un formato de texto propio.
  Los efectos tienen separación mínima entre repeticiones y un tope de voces,
  para que 400 enemigos golpeados a la vez no saturen.
- **Iconos.** Mapas de caracteres convertidos a canvas y data URLs; siempre a
  múltiplos enteros de su tamaño para que el píxel quede limpio.

## Créditos y licencia

Sprites de [SpriteCollab](https://github.com/PMDCollab/SpriteCollab) bajo
**CC BY-NC 4.0** — uso **no comercial** y con atribución; la lista de artistas
está en [`CREDITS.md`](CREDITS.md). Pokémon es propiedad de Nintendo, Creatures
Inc. y GAME FREAK. Proyecto de fan sin ánimo de lucro.
