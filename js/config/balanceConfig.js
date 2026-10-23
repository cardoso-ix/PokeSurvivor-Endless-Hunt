/* ============ balanceConfig.js — Configuração Central Data-Driven ============
 * Centraliza TODAS as constantes de balanceamento do PokéSurvivor:
 * - Status de unidades, prestígio (Shiny/Lendário) e caps do jogador
 * - Ondas de inimigos, densidade, limites (CAP=64) e tiers
 * - Escalonamento de chefes e hordas (marés)
 * - Curva de XP e marcos de nível (Sobrecarga Nível 20+)
 * - Economia: Drops, Captura, Loja de Upgrades e Ascensão (+1 ao +10)
 * ==============================================================================
 */

const BalanceConfig = {
  // ---------------------------------------------------------
  // 1. STATUS DE UNIDADES & JOGADOR (Player & Combat Base)
  // ---------------------------------------------------------
  player: {
    defaults: {
      baseHp: 100,
      baseAtk: 10,
      baseDef: 0,
      baseSpeed: 100,
      maxMoves: 4,
      critChance: 0.05,
      reviveTime: 3
    },
    // Multiplicadores de Prestígio de Raridade (Shiny, Lendário e Shiny Lendário)
    rarityMultipliers: {
      shinyLegend: {
        dmg: 1.50, // +50% Dano Base
        hp: 1.25,  // +25% HP Máximo
        spd: 1.10  // +10% Velocidade
      },
      shiny: {
        dmg: 1.25, // +25% Dano Base
        hp: 1.10,  // +10% HP Máximo
        spd: 1.05  // +5% Velocidade
      },
      legendary: {
        dmg: 1.20, // +20% Dano Base
        hp: 1.15,  // +15% HP Máximo
        spd: 1.05  // +5% Velocidade
      },
      common: {
        dmg: 1.00,
        hp: 1.00,
        spd: 1.00
      }
    },
    // Sobrecarga de Energia ao atingir Nível 20+
    energyOvercharge: {
      levelRequired: 20,
      areaBonus: 1.20,      // +20% área em todos os ataques
      cdReduction: 0.85     // -15% tempo de recarga global
    },
    // Parâmetros do Mega Overdrive
    megaMode: {
      duration: 10.0,
      dmgMul: 2.5,
      dmgTakenMul: 0.45,
      passiveProtMul: 0.70,
      speedMul: 2.0,
      cdMul: 0.5,
      areaMul: 1.35,
      critBonus: 0.30,
      critMultiplier: 2.0,
      minReduction: 0.80,
      maxReduction: 0.92
    },
    // Travas e limites máximos de segurança
    caps: {
      minCdMul: 0.20,       // -80% de recarga máxima
      maxReduction: 0.85,   // 85% de redução de dano fora de Mega
      maxReductionMega: 0.92
    }
  },

  // ---------------------------------------------------------
  // 2. CURVA DE EXPERIÊNCIA & PROGRESSÃO (Level Up)
  // ---------------------------------------------------------
  xp: {
    // Fórmula oficial: Math.floor((8 + lvl * 6 + Math.pow(lvl, 1.75) * 1.6) * 4)
    forLevel: function(level) {
      const lvl = Math.max(1, Math.floor(level || 1));
      return Math.floor((8 + lvl * 6 + Math.pow(lvl, 1.75) * 1.6) * 4);
    }
  },

  // ---------------------------------------------------------
  // 3. SPAWNER & ONDAS DE INIMIGOS
  // ---------------------------------------------------------
  spawner: {
    cap: 64,               // Teto de inimigos simultâneos na tela
    eliteThreshold: 0.85,  // Quando count >= 64 * 0.85 (54+), viram Elites
    eliteMultiplier: {
      hp: 1.6,
      dmg: 1.25,
      xp: 1.6
    },
    density: 0.24,
    dmgK: 2.4,
    xpK: 3.4,
    shinyRate: 1 / 4096,
    surgeIntervalMin: 38,
    surgeIntervalMax: 56,
    // Taxa de nascimento de monstros por segundo em função do tempo t (em segundos)
    rate: function(t, density = 0.24) {
      return (3.2 + t * 0.025 + Math.pow(t / 60, 1.45) * 0.45) * density;
    },
    // Fator de resistência composto dos monstros normais
    hpK: function(t) {
      return 1.8 + Math.min(1.4, t / 300);
    }
  },

  // ---------------------------------------------------------
  // 4. TIERS DE INIMIGOS SELVAGENS & CHEFES (Enemies Data)
  // ---------------------------------------------------------
  enemies: {
    tiers: [
      { from: 0,   bst: [180, 330], hp: 17,  spd: 56, dmg: 6,   xp: 3.5, cast: 7 },
      { from: 70,  bst: [300, 405], hp: 32,  spd: 62, dmg: 8.5, xp: 5,   cast: 7 },
      { from: 160, bst: [385, 465], hp: 52,  spd: 60, dmg: 11,  xp: 8,   cast: 7 },
      { from: 260, bst: [445, 515], hp: 88,  spd: 70, dmg: 14,  xp: 13,  cast: 7 },
      { from: 380, bst: [495, 560], hp: 115, spd: 66, dmg: 17,  xp: 20,  cast: 7 },
      { from: 500, bst: [530, 620], hp: 170, spd: 72, dmg: 21,  xp: 28,  cast: 7 }
    ],
    // Escala progressiva de atributos com o tempo t (segundos)
    scale: function(t) {
      return {
        hp: 1 + t / 140,
        dmg: 1 + t / 600,
        spd: 1 + Math.min(0.35, t / 1400)
      };
    },
    // Escala de chefes programados
    bossScale: function(t) {
      return {
        hp: 1 + t / 600,
        dmg: 1 + t / 600,
        spd: 1
      };
    },
    // Chefes de marco nos minutos 3, 6, 9, 12, 15
    bossSlots: [
      { at: 180, hp: 1400,  dmg: 34, xp: 220,  bst: [490, 545] },
      { at: 360, hp: 3200,  dmg: 42, xp: 420,  bst: [520, 580] },
      { at: 540, hp: 5600,  dmg: 48, xp: 680,  bst: [540, 600] },
      { at: 720, hp: 9000,  dmg: 56, xp: 1000, bst: [580, 700] },
      { at: 900, hp: 16000, dmg: 68, xp: 1800, bst: [600, 700] }
    ],
    // Carga de energia Mega concedida ao derrotar inimigos
    megaEnergyGains: {
      guardian: 35.0,
      boss: 25.0,
      elite: 8.0,
      normal: 0.65,
      onLevelUp: 3.5
    }
  },

  // ---------------------------------------------------------
  // 5. ECONOMIA DE MOEDAS, LOJA & ASCENSÃO (Upgrades & Ascension)
  // ---------------------------------------------------------
  upgrades: {
    // 13 Melhorias Permanentes da Loja
    list: [
      { id: 'hp',     icon: 'heart',  name: 'Vitalidade',        unit: '+8 PV Máximo',                                  max: 10, base: 60,  grow: 1.35 },
      { id: 'atk',    icon: 'fist',   name: 'Força',             unit: '+4% de dano',                                   max: 10, base: 80,  grow: 1.38 },
      { id: 'spd',    icon: 'boot',   name: 'Agilidade',         unit: '+3% de velocidade de movimento',                max: 8,  base: 70,  grow: 1.4 },
      { id: 'cd',     icon: 'clock',  name: 'Recarga',           unit: '-3% de tempo de recarga das habilidades',       max: 8,  base: 90,  grow: 1.42 },
      { id: 'def',    icon: 'shield', name: 'Armadura',          unit: '+2% de defesa (redução de dano)',               max: 8,  base: 80,  grow: 1.4 },
      { id: 'regen',  icon: 'sprout', name: 'Síntese',           unit: '+0,2 PV por segundo',                           max: 5,  base: 120, grow: 1.5 },
      { id: 'magnet', icon: 'magnet', name: 'Ímã',              unit: '+12% de raio de coleta de itens e EXP',         max: 6,  base: 50,  grow: 1.4 },
      { id: 'xp',     icon: 'book',   name: 'Sabedoria',         unit: '+5% de experiência obtida',                     max: 8,  base: 100, grow: 1.42 },
      { id: 'coins',  icon: 'coin',   name: 'Fortuna',           unit: '+8% de PokéMoedas recebidas',                   max: 8,  base: 120, grow: 1.45 },
      { id: 'moves',  icon: 'cards',  name: '2º Ataque Inicial', unit: 'Desbloqueia a escolha do 2º ataque inicial para começar a partida', max: 1, base: 50000, grow: 1 },
      { id: 'crit',   icon: 'star',   name: 'Acerto Crítico',    unit: '+3% de chance de acerto crítico (dano x1,5)',   max: 10, base: 90,  grow: 1.4 },
      { id: 'reroll', icon: 'up',     name: 'Trocar Cartas',     unit: '+1 troca de cartas ao subir de nível',          max: 5,  base: 150, grow: 1.6 },
      { id: 'ban',    icon: 'ban',    name: 'Banir',             unit: 'Bane 1 ataque da seleção (máx. 3 ataques vetados na partida)', max: 3, base: 300, grow: 1.9 }
    ],
    // Multiplicador de Estágio nos custos de upgrades normais
    stageMultipliers: {
      1: 1,
      2: 2,
      3: 3
    },
    // Sistema Exponencial de Ascensão (+1 ao +10)
    ascension: {
      maxOverLevels: 10,
      costs: [15000, 35000, 70000, 130000, 220000, 350000, 550000, 850000, 1300000, 2000000],
      totalCost: 5520000,
      getCost: function(overLvlNext) {
        const n = Math.max(1, Math.floor(overLvlNext || 1));
        const idx = Math.min(n - 1, BalanceConfig.upgrades.ascension.costs.length - 1);
        return BalanceConfig.upgrades.ascension.costs[idx] || 2000000;
      },
      // Ganhos calibrados por nível de Ascensão (+1 a +10)
      perks: {
        atkPerLevel: 0.10,     // +10% de dano por nível (+100% no +10)
        hpPerLevel: 35,        // +35 PV máximo por nível (+350 PV no +10)
        spdPerLevel: 0.025,    // +2.5% de velocidade por nível (+25% no +10)
        cdPerLevel: 0.025,     // -2.5% de recarga por nível (-25% no +10)
        defPerLevel: 0.02,     // +2.0% de defesa por nível (+20% no +10)
        regenPerLevel: 1.0,    // +1.0 PV/s por nível (+10 PV/s no +10)
        magnetPerLevel: 0.15,  // +15% de raio por nível (+150% no +10)
        xpPerLevel: 0.05,      // +5% de EXP por nível (+50% no +10)
        coinsPerLevel: 0.08    // +8% de moedas por nível (+80% no +10)
      }
    }
  },

  // ---------------------------------------------------------
  // 6. RECOMPENSAS DE RECURSOS, CAPTURA & GACHA
  // ---------------------------------------------------------
  rewards: {
    // Recompensa em moedas e tickets na captura de Pokémon
    capture: {
      stage1: { coins: 50, tickets: 0 },
      stage2: { coins: 120, tickets: 0 },
      stage3: { coins: 300, tickets: 0 },
      legendary: { coins: 1000, tickets: 0 },
      shiny: { coins: 2500, tickets: 5000 },
      shinyLegendary: { coins: 10000, tickets: 5000 },
      mapWildShinyKill: { tickets: 5000 } // Ao abater Shiny selvagem no mapa
    },
    // Fendas Dimensionais (Rifts)
    rift: {
      guardianCoins: 1000,
      guardianTicketsMin: 100,
      guardianTicketsMax: 150,
      championCoins: 5000,
      championXp: 5000
    },
    // Taxas Base de Captura
    captureRates: {
      shinyLegendary: 0.02, // 2%
      legendary: 0.06,      // 6%
      shinyCommon: 0.10,    // 10%
      stage3: 0.18,         // 18%
      stage2: 0.28,         // 28%
      stage1: 0.38,         // 38%
      maxCap: 0.48          // Trava máxima absoluta (nenhum Pokémon comum passa de 48%)
    },
    // Roleta Gacha Hardcore
    gacha: {
      costPerRoll: 100,
      rates: {
        shinyLegendary: 0.0005, // 0.05%
        shinyCommon: 0.005,     // 0.5%
        normalLegendary: 0.015, // 1.5%
        normalStage3: 0.08,     // 8.0%
        normalStage2: 0.25,     // 25.0%
        normalStage1: 0.6495    // 64.95%
      }
    }
  }
};

// Exportações para todos os ambientes (Browser IIFE, Window Global e Node.js)
if (typeof window !== 'undefined') {
  window.BalanceConfig = BalanceConfig;
}
if (typeof G === 'object') {
  G.BalanceConfig = BalanceConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BalanceConfig;
}
