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
| 3. Mega/Espaço | ✅ (aguardando teste do dono) | Cutscene (2 s, Pokémon no centro) + cenário em pixel art por tipo (18 cenas) em `js/systems/mega_scene.js`; ultimate em área, chuva de meteoros (fogo/dragão), hit-stop 0,15 s. Ativa com Espaço, M ou botão. Scanner: `tools/scan/scan_mega.js`. Pendentes: pools reais, reescrever testes antigos do Mega |
| 4. Visual geral ("juice") | ⏳ | Partículas, hit flash, números de dano, sombras, HUD/level up/gacha |

## Varredura: resultado
- 0 erros de JS em 9 telas, 64 ataques (nv 1 e 5), run de 15 min (~144 FPS, memória estável 15–40 MB), 3 Rifts seguidos, 6 casos de captura forçados.
- 966 Pokémon com sprites e animações completos; evolução OK em 11 linhas.
- Causa do FPS baixo/"bugado" do trio: `clearRect` do avatar no canvas do jogo (já removido).

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
