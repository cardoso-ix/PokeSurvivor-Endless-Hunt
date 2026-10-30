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
5. **Acionar o deploy da VPS Coolify.** O repositório **não** tem webhook do GitHub registrado, então o push **não** publica sozinho. Escolha um dos caminhos em [`docs/DEPLOY_COOLIFY.md`](docs/DEPLOY_COOLIFY.md):
   - **Painel:** `http://108.174.145.77:8000` → aplicação → botão **Deploy**.
   - **Webhook:** `POST http://108.174.145.77:8000/deploy/webhook/<SEGREDO>`.
   - **API:** `POST http://108.174.145.77:8000/api/v1/deploy?uuid=zewmdvru0kg4xpqqttxflf7a` com `Authorization: Bearer <TOKEN>`.
6. **Confirmar a publicação:**
   ```bash
   node tools/wait_for_vps_deploy.js   # aguarda o version.json novo no ar
   node tools/verify_vps_deploy.js     # valida a aplicação no navegador real
   ```

> O segredo do webhook e o token da API **não** vão para o repositório nem para arquivos
> de texto: use o gerenciador de segredos do GitHub (`gh secret set`) ou variável de ambiente.

### Arquivos gerados — nunca editar à mão
`index.html`, `en/index.html`, `js/app.min.js`, `version.json` e `sitemap.xml` são
**saídas** do build. Alterações neles se perdem no próximo `build.js`. A fonte da verdade
sempre é `dev.html` + `tools/`.

## 🔄 Atualização Automática dos Jogadores
Ao publicar uma nova versão, os jogadores ativos recebem a atualização de forma transparente via `js/core/updater.js` (que verifica `version.json` a cada 5 min):
- **Fora de partida** (menus, sala cooperativa): aviso de 5 s e recarregamento automático da página.
- **Em partida**: o jogo não interrompe o jogador; ao término da partida, o progresso é salvo e o jogo atualiza suavemente ao retornar ao menu.
- Não remover `updater.js` nem a escrita de `version.json` em `tools/build.js`.

## 🌐 Idioma Mandatório
- Toda a interface, menus, textos do Canvas e documentação devem estar em **Português do Brasil (pt-BR)**.

## 📦 Repositórios

Este repositório (`cardoso-ix/PokeSurvivor-Endless-Hunt`) é a linha **pt-BR + inglês**, com
`js/config/balanceConfig.js` como fonte única do balanceamento e Mega Overdrive em
`js/systems/mega.js`.

O domínio `pokesurvivor.com` é servido por **GitHub Pages** a partir de um repositório
**diferente** (`JPTER78/pokesurvivor`), que é a linha multilingue com Firebase e eventos
de Halloween. **As duas linhas não são sincronizadas** — não copie arquivos de uma para a
outra sem conferir as diferenças de base de código.

## 🧪 Testes

Antes de publicar, rode a suíte principal e os testes da feature que tocou:

```bash
node tools/test_full_suite.js              # 12/12 — captura, rifts, mega, evolução, HUD
```

> `node tools/test_upgrade_costs.js` falha nos lendários Mewtwo e Rayquaza desde antes
> desta linha de trabalho (estágio esperado 3, obtido 1). Não é regressão das features
> acima; corrigir é trabalho separado.
