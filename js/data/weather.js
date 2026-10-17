/* ============ weather.js — Definições de Clima & Sinergias Elementais ============
 * Live Weather System do PokéSurvivor:
 * Mapeia os 7 climas com sinergias diretas para os 18 tipos de Pokémon.
 */

const WEATHER_TYPES = {
  clear: {
    id: 'clear',
    name: 'Céu Limpo',
    icon: '☀️',
    color: '#ffe066',
    overlay: [255, 235, 170, 0.04],
    hint: 'Clima neutro e estável. Tipos Normal e Planta ganham +10% de velocidade.',
    spdBonus: { normal: 0.10, grass: 0.10 },
    atkMult: {},
    defBonus: {},
    cdReduction: {},
    dodgeBonus: {},
    particleKind: 'clear'
  },
  harsh_sun: {
    id: 'harsh_sun',
    name: 'Sol Escaldante',
    icon: '🔥',
    color: '#ff8800',
    overlay: [255, 140, 0, 0.12],
    hint: 'Fogo ganha +40% dano e chamas no chão; Planta ganha +25% velocidade e regeneração; Água perde 20% dano.',
    atkMult: { fire: 1.40, water: 0.80 },
    spdBonus: { grass: 0.25 },
    defBonus: {},
    cdReduction: {},
    dodgeBonus: {},
    regenPct: { grass: 0.02 }, // 2% max HP por segundo
    fireTrail: true, // Projéteis de fogo soltam chamas
    particleKind: 'sun'
  },
  rain: {
    id: 'rain',
    name: 'Chuva Forte',
    icon: '🌧️',
    color: '#4fa3ff',
    overlay: [0, 80, 180, 0.15],
    hint: 'Água ganha +40% dano e +30% área; Elétrico ganha arcos voltaicos em cadeia; Fogo perde 25% dano.',
    atkMult: { water: 1.40, fire: 0.75 },
    spdBonus: {},
    defBonus: {},
    cdReduction: {},
    dodgeBonus: {},
    waterAoEBonus: 0.30, // +30% tamanho do projétil de água
    electricChain: true, // Elétrico ganha arcos em cadeia
    particleKind: 'rain'
  },
  sandstorm: {
    id: 'sandstorm',
    name: 'Tempestade de Areia',
    icon: '🌪️',
    color: '#d4af37',
    overlay: [190, 140, 60, 0.20],
    hint: 'Pedra, Terra e Aço ganham +40% Defesa e Repulsão extra; Inimigos sofrem desgaste contínuo de 1% HP/s.',
    atkMult: {},
    spdBonus: {},
    defBonus: { rock: 0.40, ground: 0.40, steel: 0.40 },
    cdReduction: {},
    dodgeBonus: {},
    knockbackMult: { rock: 1.6, ground: 1.6, steel: 1.6 },
    fieldDamage: { safe: ['rock', 'ground', 'steel'], pctPerSec: 0.01 },
    particleKind: 'sand'
  },
  snow: {
    id: 'snow',
    name: 'Nevasca Glacial',
    icon: '❄️',
    color: '#9de0ff',
    overlay: [180, 230, 255, 0.15],
    hint: 'Gelo ganha +50% Defesa e 25% de chance de congelar inimigos; Inimigos comuns perdem 20% de velocidade.',
    atkMult: {},
    spdBonus: {},
    defBonus: { ice: 0.50 },
    cdReduction: {},
    dodgeBonus: {},
    freezeChance: { ice: 0.25 }, // 25% de chance de congelar por 1.5s
    enemySlowPct: 0.20, // Inimigos 20% mais lentos
    particleKind: 'snow'
  },
  thunderstorm: {
    id: 'thunderstorm',
    name: 'Tempestade com Raios',
    icon: '⚡',
    color: '#ffd000',
    overlay: [20, 30, 80, 0.20],
    hint: 'Elétrico, Dragão e Voador ganham -35% Cooldown; Raios caem a cada 6s no monstro mais próximo.',
    atkMult: {},
    spdBonus: {},
    defBonus: {},
    cdReduction: { electric: 0.35, dragon: 0.35, flying: 0.35 },
    dodgeBonus: {},
    lightningInterval: 6.0, // Raio cai a cada 6 segundos
    particleKind: 'thunder'
  },
  fog: {
    id: 'fog',
    name: 'Névoa Espessa',
    icon: '🌫️',
    color: '#bfa7e6',
    overlay: [160, 140, 200, 0.16],
    hint: 'Fantasma, Sombrio, Psíquico e Veneno ganham +30% Dano e +25% de Chance de Esquiva.',
    atkMult: { ghost: 1.30, dark: 1.30, psychic: 1.30, poison: 1.30 },
    spdBonus: {},
    defBonus: {},
    cdReduction: {},
    dodgeBonus: { ghost: 0.25, dark: 0.25, psychic: 0.25, poison: 0.25 },
    particleKind: 'fog'
  }
};

// Aliases para compatibilidade legada com rifts/eventos antigos
WEATHER_TYPES.sun = WEATHER_TYPES.harsh_sun;
WEATHER_TYPES.sand = WEATHER_TYPES.sandstorm;

if (typeof window !== 'undefined') {
  window.WEATHER_TYPES = WEATHER_TYPES;
}
