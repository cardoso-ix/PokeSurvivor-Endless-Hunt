# PokéSurvivor — Diretrizes de Engenharia e Publicação

Normas de engenharia e publicação do projeto PokéSurvivor: Endless Hunt.

## 🚀 Publicação de Nova Versão
1. Sempre editar `dev.html` (nunca `index.html`, que é gerado automaticamente pelo build).
2. Executar o pipeline de build e páginas SEO:
   ```bash
   node tools/build.js && python tools/make_seo_pages.py
   ```
   - `build.js` gera o bundle minificado e ofuscado `js/app.min.js`, o `index.html` de produção e o `version.json` com o hash da versão.
3. Executar os testes automatizados para garantir conformidade:
   ```bash
   node tools/test_full_suite.js
   node tools/test_all_evolution_chains.js
   ```
4. Commit claro no Git e `git push origin main`.
5. Acionar o webhook de deploy da VPS Coolify.

## 🔄 Atualização Automática dos Jogadores
Ao publicar uma nova versão, os jogadores ativos recebem a atualização de forma transparente via `js/core/updater.js` (que verifica `version.json` a cada 5 min):
- **Fora de partida** (menus, sala cooperativa): aviso de 5 s e recarregamento automático da página.
- **Em partida**: o jogo não interrompe o jogador; ao término da partida, o progresso é salvo e o jogo atualiza suavemente ao retornar ao menu.
- Não remover `updater.js` nem a escrita de `version.json` em `tools/build.js`.

## 🌐 Idioma Mandatório
- Toda a interface, menus, textos do Canvas e documentação devem estar em **Português do Brasil (pt-BR)**.
