# Scanners de varredura (navegador real)

Scripts Puppeteer usados na varredura geral de 30/10/2026. Precisam do servidor local e do Chrome:

```bash
node tools/serve.js &                       # http://127.0.0.1:8080
mkdir -p shots
node tools/scan/scan_screens.js shots       # telas do menu, erros JS/HTTP
node tools/scan/scan_moves.js shots/m.json  # 64 ataques x níveis 1 e 5 (opcional 2º arg: id inicial)
node tools/scan/scan_run.js 1 6 900 shots/run.png   # run longa: espécie, velocidade, segundos de jogo
node tools/scan/scan_evo.js shots           # evolução 5/12/21 e Mega (Espaço)
node tools/scan/scan_rift.js shots          # Rifts + captura (casos forçados)
node tools/scan/scan_combo.js shots [pagina] # combo por nível (1/2/3/4 ataques em Nv 1/5/10/21)
node tools/scan/scan_mega.js shots [tipos|-] [pagina]   # golpe do Mega por tipo (screenshots + inimigos atingidos)
node tools/scan/scan_space.js shots 78 index.html       # Espaço de verdade no build de produção
node tools/scan/scan_evo_levels.js [pagina]  # linhas de 2 estágios evoluem no 12; de 3, no 5 e 12
node tools/scan/scan_world.js shots [pagina]  # cenário dos biomas + FPS
node tools/scan/scan_flows.js shots         # loja, gacha, pausa
node tools/scan/scan_mobile.js shots        # celular horizontal/vertical e /en/
```

Notas: o caminho do `puppeteer` e do Chrome é o da máquina do projeto (`md-to-pdf` global). Os scanners usam
`G.Game.player.godMode`, `G.Game.debugSpeed` e `G.Game.st.time`. `scan_moves.js` conta chamadas reais de `Enemy.hurt` (suspeito = 0 chamadas ou erro).
**Sempre rode também contra `index.html`** (build de produção): lá o bundle fica dentro de uma função e `G` não existe no `window`;
vários bugs só aparecem nesse modo. Para scanners que usam `G` no build de produção, passe a lista de tipos/valores explicitamente.
