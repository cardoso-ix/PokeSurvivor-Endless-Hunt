# Progresso da Preparação de Lançamento (PokéSurvivor)

Atualizado em **30/10/2026**. Fonte de verdade do que foi feito e do que falta no overhaul de lançamento.
Cada fase é: implementar → testes → commit → push → deploy na VPS → relatório ao dono → só então a próxima.

## Decisões do dono do projeto
- **Um único personagem** (Pokémon de Estágio 1 que evolui sozinho nos níveis 5, 12 e 21). Treinador e trio foram removidos.
- **Sem sprites ripados** de GBA/DS (arte da Nintendo sem licença). Treinador só com PNG fornecido em `assets/trainers/<id>.png` (hoje não há suporte; foi removido junto com o trio).
- Dificuldade **Médio → Difícil**, com corte de economia **suave**.
- Idioma obrigatório: **pt-BR**. Inglês é secundário.
- Link para testar: http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/ (pokesurvivor.com é outro repositório).

## Fases
| Fase | Estado | Resumo |
|---|---|---|
| 1. Auditoria/diagnóstico | ✅ | Mapa do código e plano (este documento + CHANGELOG) |
| 2. Rebalanceamento | ✅ `265a520` | Economia, upgrades, gacha, XP, inimigos, captura. Detalhes no CHANGELOG |
| Remoção do trio/treinador | ✅ `00b7b8d` | Volta a um personagem; `player.js` pré-trio |
| Varredura geral (etapa 1) | ✅ `86c67ee`, `321a47c`, `37233da` | Fonte, textos, HUD mobile, i18n do menu, vínculo (HUD + adiar) |
| 3. Mega/Espaço | ✅ v2 completo, 18 tipos (aguardando teste do dono) | Cutscene (2 s, Pokémon no centro) + cenário em pixel art por tipo (18 cenas) em `js/systems/mega_scene.js`; ultimate em área, chuva de meteoros (fogo/dragão), hit-stop 0,15 s. Ativa com Espaço, M ou botão. Scanner: `tools/scan/scan_mega.js`. Pendentes: pools reais, reescrever testes antigos do Mega |
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

## Pendências conhecidas
0. **Charizard HD:** testado e **revertido** a pedido do dono (sprite PMD original restaurado). Fonte e gerador seguem em `tools/hd_src/charizard/` e `tools/make_hd_sprites.py` caso queira retomar.
1. **Armadilha do build:** em produção o bundle roda dentro de uma função e `G` é variável local, não `window.G`. Arquivos novos não devem recriar `G` (`window.G = window.G || {}`) nem ler `G.AlgumVFX` registrado via UMD: usar o global (`typeof X`) como em `game.js`. Sempre testar com `index.html` (`tools/scan/scan_space.js`).
1. **Fase 3 e 4** (acima).
2. **Testes desatualizados do Mega:** `test_mega_skills_18_types`, `test_dynamic_mega_ultimates`, `test_mega_slow_cutscene`, `test_live_mega_slow_cutscene_browser`, `test_mega_cutscene_live` (cutscene não existe mais; refs mortas a `G.MegaCutscene` em `game.js`). Reescrever na Fase 3.
3. **Testes que dependem de fluxo antigo/online:** `test_admin_*`, `test_gameplay_live`, `test_live_*`, `test_vps_*` (seletores ou servidor). `test_upgrade_costs` falha em Mewtwo/Rayquaza (já conhecido).
4. **Inglês incompleto:** modal "Proteger Minha Conta", conquistas e várias mensagens ficam em português em `/en/`.
5. **Não coberto pela varredura:** salas cooperativas e amigos (exigem conta online), ranking com dados, ritmo real de XP (o scanner usa personagem parado), sensação das taxas de captura (34/24/15%, lendário 5%).
6. PDFs do manual (raiz e `docs/`) ainda citam o trio; regerar a partir do `.md`.
7. **Rotacionar o token do Coolify** (foi colado no chat).

## Como publicar (resumo)
`node tools/build.js && python tools/make_seo_pages.py` → testes (`test_full_suite`, `test_all_evolution_chains`) → commit/push → deploy:
`curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" "http://108.174.145.77:8000/api/v1/deploy?uuid=zewmdvru0kg4xpqqttxflf7a"` → conferir `version.json` no ar.
`COOLIFY_TOKEN` fica na variável de ambiente do usuário (nunca no repositório). Scanners: `tools/scan/README.md`.
