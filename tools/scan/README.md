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
node tools/scan/scan_bond.js shots          # vínculo: adiar (Esc), B, fusão
node tools/scan/scan_flows.js shots         # loja, gacha, pausa
node tools/scan/scan_mobile.js shots        # celular horizontal/vertical e /en/
```

Notas: o caminho do `puppeteer` e do Chrome é o da máquina do projeto (`md-to-pdf` global). Os scanners usam
`G.Game.player.godMode`, `G.Game.debugSpeed` e `G.Game.st.time`. A "medição de dano" de `scan_moves.js` é
inconclusiva (inimigos morrem e saem da contagem); o que vale é "0 erros de JS".
