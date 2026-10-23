# ⚖️ Auditoria de Balanceamento & Arquitetura do Sistema (BALANCE_AUDIT.md)

**Projeto:** PokéSurvivor: Endless Hunt  
**Data:** 23 de Outubro de 2026  
**Status do Repositório:** Apenas Leitura e Diagnóstico Arquitetural (Nenhum código de gameplay alterado)  

---

## 📑 Sumário Executivo

Esta auditoria mapeia com exatidão a localização de código, fórmulas matemáticas, parâmetros de escalonamento e fluxos dos 3 pilares vitais de jogabilidade do PokéSurvivor:
1. **Atributos dos Personagens e Evoluções** (HP, Dano, Cooldown, Área e Velocidade).
2. **Sistema de Spawn e Inimigos** (Taxa de nascimento, escalonamento de HP, limites e chefes).
3. **Curva de Progressão e Economia** (Curva de EXP, Level Up, Ganho de Moedas e Custos de Upgrades/Ascensão).

---

## 1. Atributos Base dos Personagens & Evoluções

### 📍 Arquivos Mapeados
- [`js/data/base_stats.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/base_stats.js): Tabela oficial dos 1025 Pokémon com os stats canônicos (`hp`, `atk`, `def`, `spa`, `spd`, `spe`).
- [`js/data/pokedex.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/pokedex.js): Definições das espécies para o jogo, tipos elementais, raridade (`rarity`), e estágio inicial.
- [`js/data/evolutions.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/evolutions.js): Árvore de evolução de cada espécie, nível de gatilho e multiplicadores específicos (`statMultiplier`).
- [`js/entities/player.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/entities/player.js): Centraliza a instanciação, o cálculo de camadas de atributos, os getters de combate e o método `evolveTo()`.
- [`js/data/moves.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/moves.js): Parâmetros intrínsecos de cada ataque (dano base `dmg`, tempo de recarga `cd`, raio `radius`, projéteis `count`).

---

### ⚙️ Como os Atributos são Calculados (As 3 Camadas)

O jogador (`G.Player`) consolida seus atributos através de três camadas sucessivas executadas em `recalculateTotalStats(preserveHpRatio)` ([`player.js:350-411`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/entities/player.js#L350-L411)):

1. **Camada 1 — Base da Espécie & Prestígio de Raridade:**
   - Multiplicadores de prestígio ([`player.js:58-70`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/entities/player.js#L58-L70)):
     * **Comum Normal:** Dano `×1.0`, HP `×1.0`, Velocidade `×1.0`
     * **Lendário Normal:** Dano `×1.20` (+20%), HP `×1.15` (+15%), Velocidade `×1.05` (+5%)
     * **Shiny Comum:** Dano `×1.25` (+25%), HP `×1.10` (+10%), Velocidade `×1.05` (+5%)
     * **Shiny Lendário (Apex):** Dano `×1.50` (+50%), HP `×1.25` (+25%), Velocidade `×1.10` (+10%)
2. **Camada 2 — Meta-Upgrades da Espécie (Save Permanente):**
   - Bônus comprados na Loja de Melhorias aplicados diretamente à espécie (`permanentMetaStats`).
3. **Camada 3 — Modificadores In-Run (Cartas de Level Up & Passivas):**
   - Bônus temporários acumulados durante a partida (`inRunModifiers`).

#### Fórmulas de Atributos Efetivos:
- **❤️ Vida Máxima (`pl.maxHp`):**  
  `maxHp = Math.round((baseHp + metaHp + inRunHp) * rarityHpMul)`
- **⚔️ Dano / Ataque (`pl.atk`):**  
  `pl.atk = baseAtk * inRunAtkMul * (1 + buffsAtk) * megaMul * weatherAtk`  
  *(Onde `baseAtk = basePokedexAtk * (1 + metaAtkBonus) * rarityDmgMul`)*
- **👟 Velocidade (`pl.spd`):**  
  `pl.spd = baseSpd * inRunSpdMul * (1 + buffsSpd) * terrainSlow * megaMul * weatherSpd`  
  *(Onde `baseSpd = basePokedexSpd * (1 + metaSpdBonus) * raritySpdMul`)*
- **⏱️ Cooldown / Recarga (`pl.cdMul`):**  
  `cdMul = Math.max(0.20, metaCdMul * inRunCdMul * weatherCdMul * (level >= 20 ? 0.85 : 1.0) * (isMega ? 0.50 : 1.0))`  
  *(Trava mínima de segurança: 0.20 = 80% de redução máxima)*
- **💥 Área de Efeito (`pl.areaMul`):**  
  `areaMul = baseArea * (level >= 20 ? 1.20 : 1.0) * (isMega ? 1.35 : 1.0)`
- **🛡️ Armadura / Redução de Dano (`pl.reduction`):**  
  `reduction = Math.min(0.85, metaDefBonus + inRunDmgReduce + buffsDef + weatherDef)`  
  *(Durante Mega Overdrive: `Math.max(0.80, Math.min(0.92, baseRed))`)*

---

### 🧬 Lógica de Evolução (`player.evolveTo`)
Quando o Pokémon atinge o marco evolutivo ([`player.js:1438-1550`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/entities/player.js#L1438-L1550)):
1. Substitui a espécie atual pela nova forma na Pokédex global (`G.DEX_BY`).
2. Preserva a proporção exata da vida atual (`hpRatio = currentHp / maxHp`).
3. Aplica os multiplicadores de evolução (`statMultiplier`) da tabela `evolutions.js`.
4. Executa o **Swap Dinâmico de Meta-Upgrades**: carrega as melhorias permanentes específicas da nova espécie.
5. Recalcula todos os atributos totais via `recalculateTotalStats(false)`.
6. Recarrega as animações e spritesheets no Canvas mantendo a condição de Shiny.

---

## 2. Lógica de Spawn de Inimigos & Escalonamento de Pressão

### 📍 Arquivos Mapeados
- [`js/systems/spawner.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/systems/spawner.js): Loop de nascimento de inimigos, ondas periódicas, hordas direcionais e regras de Shiny/Elites.
- [`js/data/enemies.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/enemies.js): Tiers de inimigos por tempo, definição de comportamentos e tabelas de chefes.
- [`js/entities/enemy.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/entities/enemy.js): Entidade física do inimigo, colisão, IA comportamental e drops de abate.

---

### ⚙️ Parâmetros Populacionais & Taxas

- **Cap de População (`CAP`):** Máximo de **64 inimigos simultâneos** na tela ([`spawner.js:17`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/systems/spawner.js#L17)).
- **Mecânica de Elites:** Quando a contagem atinge **85% do CAP** (≥ 54 monstros), novos monstros nascem como **Elites** ([`spawner.js:87`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/systems/spawner.js#L87)):
  * HP: `×1.6`
  * Dano: `×1.25`
  * Experiência: `×1.6`
- **Taxa de Nascimento por Segundo (`rate(t)`):**
  $$\text{rate}(t) = \left(3.2 + 0.025 \cdot t + 0.45 \cdot \left(\frac{t}{60}\right)^{1.45}\right) \cdot \text{DENSITY}$$
  *(Com $\text{DENSITY} = 0.24$)*
  * **$t = 0$ s (Início):** $\approx 0.77$ inimigos/segundo.
  * **$t = 300$ s (5 min):** $\approx 4.41$ inimigos/segundo.
  * **$t = 600$ s (10 min):** $\approx 8.78$ inimigos/segundo.
  * **$t = 900$ s (15 min):** $\approx 14.12$ inimigos/segundo.

---

### 📈 Escalonamento de Vida e Poder dos Monstros
A vida do monstro gerado é calculada combinando a tabela de Tiers com a função de tempo `scale(t)` e `hpK(t)`:

$$\text{HP}_{\text{efetivo}} = \text{Tier.hp} \cdot \text{scale}(t).\text{hp} \cdot \text{hpK}(t)$$

- **`scale(t).hp`** ([`enemies.js:221-223`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/enemies.js#L221-L223)):  
  $$\text{scale}(t).\text{hp} = 1 + \frac{t}{140}$$
- **`hpK(t)`** ([`spawner.js:23`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/systems/spawner.js#L23)):  
  $$\text{hpK}(t) = 1.8 + \min\left(1.4, \frac{t}{300}\right)$$
- **Multiplicadores Globais:** Dano `DMG_K = 2.4`, Experiência `XP_K = 3.4`.

#### Tabela de Tiers de Monstros Selvagens ([`enemies.js:34-41`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/enemies.js#L34-L41)):
| Tier | Tempo Inicial | BST Faixa | HP Base | Vel. Base | Dano Base | EXP Base |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | 0s (0 min) | 180 – 330 | 17 | 56 | 6.0 | 3.5 |
| **1** | 70s (1m10s) | 300 – 405 | 32 | 62 | 8.5 | 5.0 |
| **2** | 160s (2m40s) | 385 – 465 | 52 | 60 | 11.0 | 8.0 |
| **3** | 260s (4m20s) | 445 – 515 | 88 | 70 | 14.0 | 13.0 |
| **4** | 380s (6m20s) | 495 – 560 | 115 | 66 | 17.0 | 20.0 |
| **5** | 500s (8m20s) | 530 – 620 | 170 | 72 | 21.0 | 28.0 |

#### Tabela de Chefes Programados ([`enemies.js:44-50`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/enemies.js#L44-L50)):
Os chefes possuem escala própria de resistência: $\text{bossScale}(t) = 1 + \frac{t}{600}$.

| Chefe | Minuto | HP Base | Dano Base | EXP Concedida | BST Faixa |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Boss 1** | Minuto 3 (180s) | 1.400 PV | 34 | 220 XP | 490 – 545 |
| **Boss 2** | Minuto 6 (360s) | 3.200 PV | 42 | 420 XP | 520 – 580 |
| **Boss 3** | Minuto 9 (540s) | 5.600 PV | 48 | 680 XP | 540 – 600 |
| **Boss 4** | Minuto 12 (720s) | 9.000 PV | 56 | 1.000 XP | 580 – 700 |
| **Boss 5** | Minuto 15 (900s) | 16.000 PV | 68 | 1.800 XP | 600 – 700 |

- **Hordas Direcionais ("Marés"):** Disparam a cada 38 a 56 segundos ([`spawner.js:140`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/systems/spawner.js#L140)), trazendo uma enxurrada de $\min(64 - \text{count}, (14 + \lfloor t/22 \rfloor) \cdot 0.4)$ monstros concentrados em um único ângulo.

---

## 3. Curva de XP, Economia de Moedas & Upgrades

### 📍 Arquivos Mapeados
- [`js/entities/player.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/entities/player.js#L229-L231): Fórmula de EXP necessária para cada nível (`Player.xpFor`).
- [`js/systems/levelup.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/systems/levelup.js): Lógica de oferta de cartas, evolução e balanceamento de raridades in-run.
- [`js/data/upgrades.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/upgrades.js): Configuração das 13 melhorias permanentes e tabela exponencial de Ascensão (+1 ao +10).
- [`js/systems/capture.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/systems/capture.js#L290-L315): Recompensas diretas de moedas por captura com base no estágio evolutivo.
- [`js/db.js`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/db.js): Persistência das PokéMoedas (`save.coins`), Tickets (`save.tickets`) e níveis de upgrades (`save.upgrades`).

---

### 🎓 Curva de EXP para Level Up (`Player.xpFor`)
Definida estaticamente em [`player.js:229-231`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/entities/player.js#L229-L231):

$$\text{xpFor}(L) = \left\lfloor \left(8 + 6 \cdot L + 1.6 \cdot L^{1.75}\right) \cdot 4 \right\rfloor$$

#### Progressão Amostral de EXP Necessária por Nível:
- **Nível 1:** 62 EXP
- **Nível 5:** 258 EXP
- **Nível 10:** 634 EXP
- **Nível 15:** 1.130 EXP
- **Nível 20 (Sobrecarga de Energia):** 1.728 EXP
- **Nível 30:** 3.220 EXP
- **Nível 40:** 5.044 EXP
- **Nível 50:** 7.188 EXP

*(Nota de Balanceamento: Ao atingir o Nível 20, o jogador desbloqueia passivamente a **Sobrecarga de Energia**: +20% Área e -15% Tempo de Recarga).*

---

### 💰 Economia de Moedas (Fontes de Renda)
1. **Drops de Monstros em Combate:**
   - Inimigos normais possuem chance de drop de moedas no solo.
   - Inimigo Ladrão (`Meowth`/`Gholdengo`): Solta de 8 a 25 sacos de moedas (valor 25 cada = até 625 moedas).
   - Abate de Lendários: 15 drops de moedas (valor 35 cada = 525 moedas).
2. **Recompensas de Fendas Dimensionais (Rifts):**
   - Eliminação de Guardião de Rift: +1.000 moedas + 100 a 150 Tickets.
   - Caixa de Recompensa de Campeão: +5.000 moedas e +5.000 EXP.
3. **Recompensa por Captura de Pokémon (Bounty por Estágio):**
   - Normal Estágio 1: **50 moedas**
   - Normal Estágio 2: **120 moedas**
   - Normal Estágio 3: **300 moedas**
   - Lendário Normal: **1.000 moedas**
   - Shiny Comum: **2.500 moedas** + **5.000 Tickets**
   - Shiny Lendário: **10.000 moedas** + **5.000 Tickets**
4. **Pokémons Shiny no Mapa:**
   - Não capturáveis; concedem **5.000 Tickets de Roleta Gacha** imediatamente ao serem derrotados.

---

### 🏛️ Custos de Upgrades & Tabela Exponencial de Ascensão (+1 ao +10)

#### 1. Melhorias Base (Níveis 1 ao Nível Máximo Base):
Em [`upgrades.js:5-19`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/upgrades.js#L5-L19), o custo base escala por potência geométrica:  
$$\text{custoBase}(L) = \text{Math.round}\left(\frac{\text{base} \cdot \text{grow}^L}{10}\right) \cdot 10$$
*Multiplicado pelo estágio evolutivo da espécie: Estágio 1 ($\times 1$), Estágio 2 ($\times 2$), Estágio 3 ($\times 3$).*
- **Travas especiais:**
  * `ban`: Máximo absoluto de 3 bans sem ascensão.
  * `moves`: Desbloqueio único do 2º ataque inicial por 50.000 moedas fixas.

#### 2. Tabela Exponencial da Ascensão (+1 até +10):
Atingindo o nível máximo base, as melhorias entram na **Ascensão** ([`upgrades.js:28`](file:///c:/Users/eduar/OneDrive/Documentos/pokesurvivor-main/js/data/upgrades.js#L28)), seguindo custos progressivos fixos em ouro:

$$\text{ASCENSION\_COSTS} = [15.000,\ 35.000,\ 70.000,\ 130.000,\ 220.000,\ 350.000,\ 550.000,\ 850.000,\ 1.300.000,\ 2.000.000]$$

| Nível de Ascensão | Custo Unitário em Moedas | Custo Acumulado da Ascensão |
| :---: | :---: | :---: |
| **+1** | 15.000 | 15.000 |
| **+2** | 35.000 | 50.000 |
| **+3** | 70.000 | 120.000 |
| **+4** | 130.000 | 250.000 |
| **+5** | 220.000 | 470.000 |
| **+6** | 350.000 | 820.000 |
| **+7** | 550.000 | 1.370.000 |
| **+8** | 850.000 | 2.220.000 |
| **+9** | 1.300.000 | 3.520.000 |
| **+10 (Max)** | 2.000.000 | **5.520.000 moedas** |

#### Ganhos por Nível de Ascensão (+1 ao +10):
- **Força (`atk`):** +10% de dano por nível (+100% no +10).
- **Vitalidade (`hp`):** +35 PV máximo por nível (+350 PV no +10).
- **Agilidade (`spd`):** +2.5% de velocidade por nível (+25% no +10).
- **Recarga (`cd`):** -2.5% de recarga por nível (-25% no +10, respeitando o cap global de 50%).
- **Armadura (`def`):** +2.0% de defesa por nível (+20% no +10).
- **Síntese (`regen`):** +1.0 PV/s por nível (+10 PV/s no +10).
- **Ímã (`magnet`):** +15% de raio por nível (+150% no +10).
- **Sabedoria (`xp`):** +5% de EXP por nível (+50% no +10).
- **Fortuna (`coins`):** +8% de moedas por nível (+80% no +10).

---

## 4. Conclusão & Próximos Passos Sugeridos

O código apresenta alta modularidade e separação nítida entre **Dados** (`js/data/`), **Entidades** (`js/entities/`) e **Sistemas Globais** (`js/systems/`).  
Os valores estão perfeitamente ajustados em um padrão roguelite hardcore, com escalonamento exponencial de endgame e barreiras anti-trivialização.

Qualquer ajuste futuro de balanceamento pode ser realizado com extrema precisão alterando apenas as constantes nos arquivos acima catalogados.
