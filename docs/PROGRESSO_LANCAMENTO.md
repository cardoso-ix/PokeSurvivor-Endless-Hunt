# Progresso da Preparação de Lançamento (PokéSurvivor)

Atualizado em **31/10/2026**. Fonte de verdade do que foi feito e do que falta no overhaul de lançamento.
Cada fase é: implementar → testes → commit → push → deploy na VPS → relatório ao dono → só então a próxima.

## Decisões do dono do projeto
- **Um único personagem** (Pokémon de Estágio 1 que evolui sozinho: linhas de 3 estágios nos Nv. 5 e 12, linhas de 2 estágios no Nv. 12; Ascensão Mega no 21). Treinador e trio foram removidos.
- **Sem sprites ripados** de GBA/DS (arte da Nintendo sem licença). Treinador só com PNG fornecido em `assets/trainers/<id>.png` (hoje não há suporte; foi removido junto com o trio).
- Dificuldade **Médio → Difícil**, com corte de economia **suave**.
- Idioma obrigatório: **pt-BR**. Inglês é secundário.
- **Combo por nível** (1/2/3/4 ataques nos Nv. 1/5/10/21), sem fusão de ataques e sem tela depois do Rift.
- **Mega**: cinemática curta + golpe único por tipo, em pixel art (sem tela embaçada/bordas coloridas). Charizard HD foi testado e revertido.
- **Ranking zerado** para o lançamento (sem apagar dados do Firestore).
- Link para testar: http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/ (pokesurvivor.com é outro repositório).

## Fases
| Fase | Estado | Resumo |
|---|---|---|
| 1. Auditoria/diagnóstico | ✅ | Mapa do código e plano (este documento + CHANGELOG) |
| 2. Rebalanceamento | ✅ `265a520` | Economia, upgrades, gacha, XP, inimigos, captura. Detalhes no CHANGELOG |
| Remoção do trio/treinador | ✅ `00b7b8d` | Volta a um personagem; `player.js` pré-trio |
| Varredura geral (etapa 1) | ✅ `86c67ee`, `321a47c`, `37233da` | Fonte, textos, HUD mobile, i18n do menu, vínculo (HUD + adiar) |
| 3. Mega/Espaço | ✅ v2 completo, 18 tipos (aguardando teste do dono) | Ver "Mega v2" abaixo |
| 4. Visual geral ("juice") | 🔶 parte 1 feita (aguardando teste) | **Feito:** chão sem repetição (padrão 256 px com manchas, tufos, pedrinhas), 3 formas de árvore/cristal/árvore morta/pedra por bioma, luz+vinheta por bioma em cache, névoa em cache. **Falta:** água com ondas, clima ligado ao bioma, sombra de contato, partículas/hit flash/números de dano, HUD/level up/gacha |

## Varredura: resultado
- 0 erros de JS em 9 telas, 64 ataques (nv 1 e 5), run de 15 min (~144 FPS, memória estável 15–40 MB), 3 Rifts seguidos, 6 casos de captura forçados.
- 966 Pokémon com sprites e animações completos; evolução OK em 11 linhas.
- Causa do FPS baixo/"bugado" do trio: `clearRect` do avatar no canvas do jogo (já removido).

## Mega: ajuste pedido pelo dono
Removidos tinta/escurecimento/vinheta/bordas do cenário do Mega (e o `darken` do VFX): ficam só os ataques de cada tipo. Cutscene mantida.

## Combo por nível (31/10/2026)
Nv 1 = 1 ataque, Nv 5 = 2, Nv 10 = 3, Nv 21 = 4 (primeiros aprendidos, juntos). Tela de fusão do Rift, Elo de Fusão, tecla B e seleção manual de slot removidos. Scanner: `tools/scan/scan_combo.js`. Testes antigos de vínculo/Nv 20 removidos (`test_slot_selection_and_bonds`, `test_lvl20_combo`, `scan_bond`); `test_full_suite` cobre o combo real.

## Evolução e ranking (31/10/2026)
- **Linhas de 2 estágios evoluem no Nv 12** (antes 5): quando a forma evoluída é a final (Rattata, Growlithe, Eevee). Linhas de 3 estágios seguem 5 e 12. Scanner: `tools/scan/scan_evo_levels.js`.
- **Ranking zerado:** `RESET_GEN = 'k'` em `js/net/ranking.js` acrescenta `k` aos nomes de TODAS as tabelas (diário, semanal, mensal, histórico, por Pokémon). Nada foi apagado do Firestore (projeto compartilhado `pokesurvivor-free`); a outra linha do jogo continua lendo as tabelas antigas. Para zerar de novo, troque a letra; para voltar às marcas antigas, deixe `''`.

## Mega v2 (31/10/2026): cinemática + golpe único
Corte 0,9 s -> carga 0,6 s -> golpe assinatura em tela cheia (pixel art, dano em área nos impactos) -> buff de 10 s sem efeito contínuo.
Código: `js/systems/mega_scene.js` (fases, primitivas, dano) e `js/systems/mega_strike.js` (golpes por tipo).
**Os 18 tipos têm golpe próprio** (Leva 1 + Leva 2: Planta, Lutador, Veneno, Terra, Voador, Psíquico, Inseto, Pedra, Fantasma, Sombrio, Aço, Fada). O de Água foi refeito (3 ondas vistas de cima). Scanner: `tools/scan/scan_mega.js <pasta> [tipos] [pagina]`.

## Fase 4, parte 1 (cenário)
FPS medido com `tools/scan/scan_world.js`: 143–145 em 5 biomas, igual ao anterior. Estudo: chão/props/luz/vinheta (`js/world/tiles.js`, `world.js`, `drawFog`).

## Varredura de ataques (31/10/2026)
- 64 ataques x níveis 1 e 5 (128 casos): todos acertam inimigos, 0 erros de JS. `scan_moves.js` agora conta chamadas reais de `Enemy.hurt` (a medição antiga por HP era inconclusiva) e fecha a tela de vínculo que travava a varredura.
- Mega nos 18 tipos (`scan_mega.js`), vínculo, loja/gacha/pausa, Rifts/captura: 0 erros. Espaço no build de produção (`scan_space.js`) OK.

## Painel de admin/testes (31/10/2026)
Revisão completa (ver manual 11.9). Corrigidos: atalhos e funções abertos a qualquer jogador, F2 que não abria, Mega/Captura/+5 Níveis/Ver golpe, rótulos, layout. Chave do admin agora só como hash. **Troque a chave:** o texto antigo continua no histórico do git (comando no comentário de `js/ui/debug_panel.js`).

## Pendências conhecidas
0. **Decidir antes do lançamento:** `window.G` exposto em produção (`game.js`, commit `b68ba36`, para testes E2E) permite mexer no jogo pelo console; o painel de admin também vai no bundle público. Opções: build público sem `window.G`/painel e build de testes com `--expose`. Os scanners de produção (`scan_space`, `scan_combo`, `scan_mega` com `index.html`) dependem de `G` e precisariam do build `--expose`.
1. **Testes do dono pendentes:** os 18 golpes do Mega (principalmente Lutador, Voador, Inseto, Terra, Fantasma, Sombrio e Fada, que só foram vistos em screenshots), combo por nível, evolução no Nv. 12 das linhas de 2 estágios, cenário novo e ranking zerado.
2. **Fase 4, o que falta ("juice"):** água do cenário com ondas, clima ligado ao bioma, sombra de contato, partículas/hit flash/números de dano, HUD/level up/gacha. Medir FPS no celular real (só medimos no PC: ~144 FPS).
3. **Testes antigos do Mega desatualizados:** `test_mega_skills_18_types`, `test_dynamic_mega_ultimates`, `test_mega_slow_cutscene`, `test_live_mega_slow_cutscene_browser`, `test_mega_cutscene_live` (cutscene antiga; `G.MegaCutscene` em `game.js` é referência morta). `MegaSkillVFXManager` (`mega_skill_vfx.js`) hoje só serve de catálogo de cores/nomes; o código dos hazards antigos está sem uso.
4. **Código legado sem uso:** tela de fusão (`#scr-bond`, `RunUI.showBond`), `Settings`/textos de vínculo em `lang-en.js`, `js/systems/ultimate_vfx.js`.
5. **Testes que dependem de fluxo antigo/online:** `test_admin_*`, `test_gameplay_live`, `test_live_*`, `test_vps_*`. `test_upgrade_costs` falha em Mewtwo/Rayquaza (já conhecido).
6. **Inglês incompleto:** modal "Proteger Minha Conta", conquistas e várias mensagens ficam em português em `/en/`; os textos novos de combo/HUD ainda não têm tradução.
7. **Não coberto pela varredura:** salas cooperativas e amigos (exigem conta online), ranking com dados reais, ritmo real de XP, sensação das taxas de captura.
8. PDFs do manual (raiz e `docs/`) ainda citam o trio, o Super Combo e o Mega antigo; regerar a partir do `.md`.
9. **Rotacionar o token do Coolify** (foi colado no chat).
10. **Armadilhas do build:** (a) em produção o bundle roda dentro de uma função e `G` é variável local: arquivo novo não recria `G` nem lê `G.AlgumaCoisa` registrada via UMD (usar `typeof X`); (b) sprites e service worker são cacheados "para sempre": trocar um PNG exige mudar a URL (ver `SHEET_REV` em `js/core/sprites.js`); (c) scripts locais `tools/_dbg_coolify.js` e `tools/trigger_coolify_deploy.js` não vão para o git.

## Próximo passo (amanhã)
Ler os resultados do teste do dono; corrigir o que ele apontar nos golpes do Mega; depois seguir com a **Fase 4** (juice) e a limpeza do código legado (itens 3 e 4 acima).

## Como publicar (resumo)
`node tools/build.js && python tools/make_seo_pages.py` → testes (`test_full_suite`, `test_all_evolution_chains`) → commit/push → deploy:
`curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" "http://108.174.145.77:8000/api/v1/deploy?uuid=zewmdvru0kg4xpqqttxflf7a"` → conferir `version.json` no ar.
`COOLIFY_TOKEN` fica na variável de ambiente do usuário (nunca no repositório). Scanners: `tools/scan/README.md`.
