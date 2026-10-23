/* ============ mega_skill_vfx.js — Engine Procedural de Mega Skills Elementais (AAA Indie) ============
 * 100% Canvas 2D Procedural: Shaders matemáticos, composição aditiva ('lighter'), gradientes dinâmicos,
 * curvas de Bézier, fractais e polígonos. Suporte aos 18 tipos elementais com isolamento de física e 60 FPS cravados.
 */

(function (root, factory) {
  const instance = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = instance;
  }
  if (typeof root === 'object') {
    root.MegaSkillVFXManager = instance;
    if (typeof root.G === 'object') {
      root.G.MegaSkillVFXManager = instance;
      root.G.UltimateVFX = instance;
    }
  }
  if (typeof window !== 'undefined') {
    window.MegaSkillVFXManager = instance;
    if (typeof window.G === 'object') {
      window.G.MegaSkillVFXManager = instance;
      window.G.UltimateVFX = instance;
    }
  }
  if (typeof global !== 'undefined') {
    global.MegaSkillVFXManager = instance;
    if (typeof global.G === 'object') {
      global.G.MegaSkillVFXManager = instance;
      global.G.UltimateVFX = instance;
    }
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Limites rígidos de performance (Zero GC Thrashing / 60 FPS)
  const MAX_HAZARDS = 80;
  const MAX_PARTICLES = 400;
  const MAX_SCREEN_EFFECTS = 8;

  const hazards = [];
  const particles = [];
  const screenEffects = [];

  let _lastDrawFrame = 0;

  // Paleta Canônica dos 18 Tipos com Propriedades Procedurais
  const TYPE_CONFIGS = {
    fire: {
      id: 'fire',
      name: 'Chuva de Meteoros',
      behavior: 'diagonalFall',
      color: '#ff4d00',
      accent: '#ff9a00',
      aura: '#ffe066',
      particle: '#ffffff',
      shake: 0.65,
      sound: 'legend',
      dmgMul: 3.2,
      burnStacks: 4
    },
    water: {
      id: 'water',
      name: 'Tsunami Abissal',
      behavior: 'directionalWave',
      color: '#0055ff',
      accent: '#00d0ff',
      aura: '#66e5ff',
      particle: '#ffffff',
      shake: 0.45,
      sound: 'heal',
      dmgMul: 2.4,
      knockback: 260,
      slow: 0.65,
      slowDur: 4.0
    },
    grass: {
      id: 'grass',
      name: 'Tempestade da Floresta',
      behavior: 'chainsRoots',
      color: '#10b981',
      accent: '#34d399',
      aura: '#f472b6',
      particle: '#a7f3d0',
      shake: 0.35,
      sound: 'heal',
      dmgMul: 2.2,
      healPlayer: 35,
      rootDur: 3.0
    },
    electric: {
      id: 'electric',
      name: 'Julgamento do Trovão',
      behavior: 'celestialBeam',
      color: '#facc15',
      accent: '#38bdf8',
      aura: '#fef08a',
      particle: '#ffffff',
      shake: 0.70,
      sound: 'hit',
      dmgMul: 3.0,
      stunDur: 2.2,
      darkenScreen: 0.4
    },
    ice: {
      id: 'ice',
      name: 'Zero Absoluto',
      behavior: 'iceShatter',
      color: '#38bdf8',
      accent: '#bae6fd',
      aura: '#e0f2fe',
      particle: '#ffffff',
      shake: 0.50,
      sound: 'select',
      dmgMul: 2.5,
      freezeDur: 2.5
    },
    fighting: {
      id: 'fighting',
      name: 'Barragem de Impacto',
      behavior: 'radialBurst',
      color: '#ef4444',
      accent: '#f97316',
      aura: '#fecaca',
      particle: '#ffffff',
      shake: 0.80,
      sound: 'hit',
      dmgMul: 3.5,
      armorBreak: true
    },
    poison: {
      id: 'poison',
      name: 'Nebulosa Tóxica',
      behavior: 'toxicNebula',
      color: '#a855f7',
      accent: '#22c55e',
      aura: '#c084fc',
      particle: '#e9d5ff',
      shake: 0.30,
      sound: 'select',
      dmgMul: 2.0,
      poisonStacks: 6,
      slow: 0.45
    },
    ground: {
      id: 'ground',
      name: 'Cataclismo Sísmico',
      behavior: 'quakeFissure',
      color: '#b45309',
      accent: '#f59e0b',
      aura: '#fbbf24',
      particle: '#fef3c7',
      shake: 0.90,
      sound: 'hit',
      dmgMul: 2.8,
      stunDur: 2.0
    },
    flying: {
      id: 'flying',
      name: 'Furacão Cortante',
      behavior: 'spiralVortex',
      color: '#38bdf8',
      accent: '#e2e8f0',
      aura: '#7dd3fc',
      particle: '#ffffff',
      shake: 0.40,
      sound: 'legend',
      dmgMul: 2.3,
      vortexPull: true
    },
    psychic: {
      id: 'psychic',
      name: 'Singularidade Cósmica',
      behavior: 'cosmicSingularity',
      color: '#ec4899',
      accent: '#8b5cf6',
      aura: '#f472b6',
      particle: '#fdf2f8',
      shake: 0.60,
      sound: 'legend',
      dmgMul: 3.0,
      trueDmg: true,
      implosionPull: true
    },
    bug: {
      id: 'bug',
      name: 'Enxame Voraz',
      behavior: 'orbitalSwarms',
      color: '#84cc16',
      accent: '#eab308',
      aura: '#bef264',
      particle: '#f7fee7',
      shake: 0.35,
      sound: 'hit',
      dmgMul: 2.4,
      lifestealPct: 0.15
    },
    rock: {
      id: 'rock',
      name: 'Avalanche de Monólitos',
      behavior: 'quakeFissure',
      color: '#78350f',
      accent: '#d97706',
      aura: '#fef3c7',
      particle: '#ffffff',
      shake: 0.75,
      sound: 'hit',
      dmgMul: 2.7,
      shieldShield: 60
    },
    ghost: {
      id: 'ghost',
      name: 'Eclipse das Sombras',
      behavior: 'spectralEclipse',
      color: '#6b21a8',
      accent: '#3b82f6',
      aura: '#9333ea',
      particle: '#c084fc',
      shake: 0.50,
      sound: 'legend',
      dmgMul: 2.5,
      pctMaxHpDmg: 0.30,
      fearDur: 2.0
    },
    dragon: {
      id: 'dragon',
      name: 'Fúria Dracônica (Draco Meteor)',
      behavior: 'diagonalFall',
      color: '#4f46e5',
      accent: '#a855f7',
      aura: '#818cf8',
      particle: '#ffffff',
      shake: 0.85,
      sound: 'legend',
      dmgMul: 4.5
    },
    dark: {
      id: 'dark',
      name: 'Buraco Negro Abissal',
      behavior: 'cosmicSingularity',
      color: '#09090b',
      accent: '#e11d48',
      aura: '#71717a',
      particle: '#f43f5e',
      shake: 0.70,
      sound: 'legend',
      dmgMul: 3.2,
      executeThreshold: 0.25
    },
    steel: {
      id: 'steel',
      name: 'Tempestade de Lâminas',
      behavior: 'bladeStorm',
      color: '#94a3b8',
      accent: '#ffffff',
      aura: '#cbd5e1',
      particle: '#f8fafc',
      shake: 0.50,
      sound: 'hit',
      dmgMul: 2.8,
      defBuffDur: 6.0
    },
    fairy: {
      id: 'fairy',
      name: 'Chuva Estelar Lunar',
      behavior: 'celestialBeam',
      color: '#f472b6',
      accent: '#facc15',
      aura: '#67e8f9',
      particle: '#ffffff',
      shake: 0.40,
      sound: 'heal',
      dmgMul: 2.5,
      healPlayer: 40,
      cleanse: true
    },
    normal: {
      id: 'normal',
      name: 'Hiper Raio Nova',
      behavior: 'radialBurst',
      color: '#ffffff',
      accent: '#ffd700',
      aura: '#fef08a',
      particle: '#ffffff',
      shake: 0.95,
      sound: 'legend',
      dmgMul: 3.8,
      knockback: 350
    }
  };

  function normaliseType(t) {
    if (!t) return 'normal';
    const s = String(t).toLowerCase().trim();
    if (TYPE_CONFIGS[s]) return s;
    const aliases = {
      fogo: 'fire', agua: 'water', água: 'water', planta: 'grass',
      eletrico: 'electric', elétrico: 'electric', raio: 'electric',
      gelo: 'ice', lutador: 'fighting', veneno: 'poison', terra: 'ground',
      voador: 'flying', psiquico: 'psychic', psíquico: 'psychic',
      inseto: 'bug', pedra: 'rock', rocha: 'rock', fantasma: 'ghost',
      dragao: 'dragon', dragão: 'dragon', aco: 'steel', aço: 'steel',
      sombrio: 'dark', trevas: 'dark', fada: 'fairy', normal: 'normal'
    };
    return aliases[s] || 'normal';
  }

  function clear() {
    hazards.length = 0;
    particles.length = 0;
    screenEffects.length = 0;
  }

  function addHazard(h) {
    if (hazards.length >= MAX_HAZARDS) hazards.shift();
    hazards.push(h);
  }

  function addParticle(p) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push(p);
  }

  function addScreenEffect(eff) {
    if (screenEffects.length >= MAX_SCREEN_EFFECTS) screenEffects.shift();
    screenEffects.push(eff);
  }

  // -------------------------------------------------------------
  // GATILHO PRINCIPAL: DISPARO DA MEGA SKILL ELEMENTAL
  // -------------------------------------------------------------
  function trigger(rawType, player) {
    const pl = player || (typeof window !== 'undefined' && window.player) || (typeof G === 'object' && G.Game && G.Game.player);
    if (!pl) return false;

    const typeKey = normaliseType(rawType || (pl.mon && pl.mon.types && pl.mon.types[0]) || (pl.types && pl.types[0]));
    const cfg = TYPE_CONFIGS[typeKey] || TYPE_CONFIGS.normal;

    const px = pl.x || 0;
    const py = pl.y || 0;
    const baseDamage = (pl.atk || 10) * (cfg.dmgMul || 2.5);

    // Efeitos Cinematográficos Globais
    if (typeof G === 'object') {
      if (G.Camera && typeof G.Camera.kick === 'function') {
        G.Camera.kick(cfg.shake || 0.5);
      }
      if (G.Audio && typeof G.Audio.sfx === 'function') {
        G.Audio.sfx(cfg.sound || 'mega');
      }
      if (G.Spawner && typeof G.Spawner.say === 'function') {
        const pName = (pl.mon && pl.mon.name) || pl.species || 'POKÉMON';
        G.Spawner.say(`⚡ MEGA SKILL: [${cfg.name.toUpperCase()}]!`, 2.5, true);
      }
    }

    // Aplica cura/buffs imediatos ao jogador se configurado
    if (cfg.healPlayer && typeof pl.heal === 'function') {
      pl.heal(cfg.healPlayer);
    }
    if (cfg.shieldShield && pl) {
      pl.invuln = Math.max(pl.invuln || 0, 2.0);
    }

    // Escurecimento ou flash de tela temático
    if (cfg.darkenScreen) {
      addScreenEffect({
        type: 'darken',
        color: '#050510',
        alpha: 0.65,
        life: cfg.darkenScreen,
        maxLife: cfg.darkenScreen
      });
    }

    // Instanciação Baseada no Comportamento Core de Partículas
    switch (cfg.behavior) {
      case 'diagonalFall':
        spawnDiagonalFall(px, py, cfg, baseDamage, pl);
        break;
      case 'directionalWave':
        spawnDirectionalWave(px, py, cfg, baseDamage, pl);
        break;
      case 'chainsRoots':
        spawnChainsRoots(px, py, cfg, baseDamage, pl);
        break;
      case 'celestialBeam':
        spawnCelestialBeam(px, py, cfg, baseDamage, pl);
        break;
      case 'iceShatter':
        spawnIceShatter(px, py, cfg, baseDamage, pl);
        break;
      case 'radialBurst':
        spawnRadialBurst(px, py, cfg, baseDamage, pl);
        break;
      case 'toxicNebula':
        spawnToxicNebula(px, py, cfg, baseDamage, pl);
        break;
      case 'quakeFissure':
        spawnQuakeFissure(px, py, cfg, baseDamage, pl);
        break;
      case 'spiralVortex':
        spawnSpiralVortex(px, py, cfg, baseDamage, pl);
        break;
      case 'cosmicSingularity':
        spawnCosmicSingularity(px, py, cfg, baseDamage, pl);
        break;
      case 'orbitalSwarms':
        spawnOrbitalSwarms(px, py, cfg, baseDamage, pl);
        break;
      case 'spectralEclipse':
        spawnSpectralEclipse(px, py, cfg, baseDamage, pl);
        break;
      case 'bladeStorm':
        spawnBladeStorm(px, py, cfg, baseDamage, pl);
        break;
      default:
        spawnRadialBurst(px, py, cfg, baseDamage, pl);
        break;
    }

    return true;
  }

  // -------------------------------------------------------------
  // COMPORTAMENTOS CORE PROCEDURAIS (BUILDERS)
  // -------------------------------------------------------------

  // 1. Queda Diagonal (Fogo / Dragão)
  function spawnDiagonalFall(px, py, cfg, dmg, pl) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const targetX = px + (Math.random() - 0.5) * 540;
      const targetY = py + (Math.random() - 0.5) * 420;
      const delay = i * 0.08;
      const travelTime = 0.35;

      addHazard({
        type: 'diagonalFall',
        startX: targetX - 220,
        startY: targetY - 320,
        targetX,
        targetY,
        x: targetX - 220,
        y: targetY - 320,
        radius: 65,
        delay,
        life: delay + travelTime + 0.5,
        maxLife: delay + travelTime + 0.5,
        travelTime,
        dmg,
        cfg,
        hasHit: false,
        onImpact() {
          if (cfg.burnStacks) applyBurnToArea(targetX, targetY, 70, cfg.burnStacks);
          spawnRadialParticles(targetX, targetY, cfg.color, cfg.accent, 25);
        }
      });
    }
  }

  // 2. Onda Direcional / Tsunami (Água)
  function spawnDirectionalWave(px, py, cfg, dmg, pl) {
    const aim = (pl && pl.aim !== undefined) ? pl.aim : 0;
    const waves = 3;
    for (let w = 0; w < waves; w++) {
      addHazard({
        type: 'directionalWave',
        x: px,
        y: py,
        angle: aim,
        speed: 460 + w * 40,
        width: 140 + w * 30,
        radius: 90,
        life: 0.9,
        maxLife: 0.9,
        delay: w * 0.16,
        dmg: dmg * 0.45,
        cfg,
        hitSet: new Set(),
        onTick(h) {
          pushAndSlowEnemiesInArc(h.x, h.y, h.radius, h.angle, Math.PI * 0.7, cfg.knockback, cfg.slow, cfg.slowDur, h.dmg, h.hitSet);
        }
      });
    }
  }

  // 3. Correntes & Raízes (Planta)
  function spawnChainsRoots(px, py, cfg, dmg, pl) {
    const rootsCount = 8;
    for (let i = 0; i < rootsCount; i++) {
      const a = (i / rootsCount) * Math.PI * 2;
      const dist = 60 + Math.random() * 140;
      const rx = px + Math.cos(a) * dist;
      const ry = py + Math.sin(a) * dist;

      addHazard({
        type: 'roots',
        originX: px,
        originY: py,
        x: rx,
        y: ry,
        radius: 55,
        life: 2.2,
        maxLife: 2.2,
        dmg: dmg * 0.35,
        tickCd: 0.25,
        cfg,
        onTick(h) {
          rootEnemiesInCircle(h.x, h.y, h.radius, cfg.rootDur, h.dmg);
        }
      });
    }
    spawnRadialParticles(px, py, cfg.color, '#f472b6', 40);
  }

  // 4. Feixe Celestial & Raios Fractais (Elétrico / Fada)
  function spawnCelestialBeam(px, py, cfg, dmg, pl) {
    // Escurece a tela se for elétrico
    if (cfg.id === 'electric') {
      addScreenEffect({ type: 'darken', color: '#030712', alpha: 0.55, life: 0.4, maxLife: 0.4 });
    }

    addHazard({
      type: 'celestialBeam',
      x: px,
      y: py,
      radius: 110,
      life: 1.1,
      maxLife: 1.1,
      dmg: dmg * 0.8,
      cfg,
      lightningBranches: generateLightningBranches(px, py, 6),
      onTick(h) {
        if (cfg.stunDur) stunEnemiesInCircle(h.x, h.y, h.radius * 1.4, cfg.stunDur, h.dmg);
        else damageEnemiesInCircle(h.x, h.y, h.radius, h.dmg);
      }
    });

    // Chovem raios nos 5 monstros mais distantes/com mais HP
    const enemies = getSortedEnemiesByHP();
    const lightningTargets = enemies.slice(0, 6);
    lightningTargets.forEach((tg, idx) => {
      addHazard({
        type: 'lightningStrike',
        x: tg.x,
        y: tg.y,
        radius: 50,
        delay: idx * 0.05,
        life: 0.35 + idx * 0.05,
        maxLife: 0.4,
        dmg: dmg * 0.6,
        cfg,
        branches: generateLightningBranches(tg.x, tg.y, 3)
      });
    });
  }

  // 5. Zero Absoluto / Nevasca e Estilhaços (Gelo)
  function spawnIceShatter(px, py, cfg, dmg, pl) {
    addHazard({
      type: 'iceField',
      x: px,
      y: py,
      radius: 260,
      life: 2.5,
      maxLife: 2.5,
      dmg,
      cfg,
      hasFrozen: false,
      onTick(h) {
        if (!h.hasFrozen) {
          h.hasFrozen = true;
          freezeAllEnemiesOnScreen(cfg.freezeDur, h.dmg);
        }
      }
    });
    // Espalha 8 cristais hexagonais que brotam do solo
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.2;
      const dist = 70 + Math.random() * 110;
      addHazard({
        type: 'iceCrystal',
        x: px + Math.cos(a) * dist,
        y: py + Math.sin(a) * dist,
        size: 24 + Math.random() * 12,
        rot: Math.random() * Math.PI,
        life: 1.8,
        maxLife: 1.8,
        cfg
      });
    }
  }

  // 6. Explosão Radial / Onda de Choque (Lutador / Normal)
  function spawnRadialBurst(px, py, cfg, dmg, pl) {
    addHazard({
      type: 'radialBurst',
      x: px,
      y: py,
      currentRadius: 10,
      maxRadius: 280,
      life: 0.65,
      maxLife: 0.65,
      dmg,
      cfg,
      hitSet: new Set(),
      onTick(h) {
        expandBurstDamage(h.x, h.y, h.currentRadius, h.dmg, cfg.knockback || 220, h.hitSet);
      }
    });
    spawnRadialParticles(px, py, cfg.color, cfg.accent, 50);
  }

  // 7. Nebulosa Tóxica (Veneno)
  function spawnToxicNebula(px, py, cfg, dmg, pl) {
    const pools = 7;
    for (let i = 0; i < pools; i++) {
      const a = (i / pools) * Math.PI * 2;
      const d = 40 + Math.random() * 120;
      addHazard({
        type: 'poisonCloud',
        x: px + Math.cos(a) * d,
        y: py + Math.sin(a) * d,
        radius: 65,
        life: 3.5,
        maxLife: 3.5,
        dmg: dmg * 0.25,
        cfg,
        onTick(h) {
          applyPoisonAndSlowInCircle(h.x, h.y, h.radius, cfg.poisonStacks, cfg.slow, h.dmg);
        }
      });
    }
  }

  // 8. Cataclismo Sísmico / Terremoto (Terra / Pedra)
  function spawnQuakeFissure(px, py, cfg, dmg, pl) {
    const fissureLines = 6;
    for (let i = 0; i < fissureLines; i++) {
      const angle = (i / fissureLines) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      addHazard({
        type: 'fissure',
        startX: px,
        startY: py,
        angle,
        length: 220,
        width: 18,
        life: 1.6,
        maxLife: 1.6,
        dmg: dmg * 0.6,
        cfg,
        hitSet: new Set(),
        points: generateFractalLine(px, py, angle, 220, 6)
      });
    }
    // Levanta blocos de rocha poligonais flutuantes
    for (let r = 0; r < 10; r++) {
      const a = Math.random() * Math.PI * 2;
      const d = 50 + Math.random() * 150;
      addHazard({
        type: 'rockBlock',
        x: px + Math.cos(a) * d,
        y: py + Math.sin(a) * d,
        elevation: 0,
        maxElev: 35 + Math.random() * 20,
        life: 1.4,
        maxLife: 1.4,
        cfg
      });
    }
    stunEnemiesInCircle(px, py, 200, cfg.stunDur || 1.8, dmg);
  }

  // 9. Furacão Cortante / Ciclone (Voador)
  function spawnSpiralVortex(px, py, cfg, dmg, pl) {
    const tornadoes = 3;
    for (let t = 0; t < tornadoes; t++) {
      const a = (t / tornadoes) * Math.PI * 2;
      addHazard({
        type: 'tornado',
        x: px + Math.cos(a) * 90,
        y: py + Math.sin(a) * 90,
        vx: Math.cos(a + 0.8) * 120,
        vy: Math.sin(a + 0.8) * 120,
        radius: 80,
        life: 2.8,
        maxLife: 2.8,
        dmg: dmg * 0.3,
        cfg,
        spin: 0,
        onTick(h) {
          vortexPullInCircle(h.x, h.y, h.radius * 1.6, 140, h.dmg);
        }
      });
    }
  }

  // 10. Singularidade Cósmica / Buraco Negro (Psíquico / Sombrio)
  function spawnCosmicSingularity(px, py, cfg, dmg, pl) {
    addHazard({
      type: 'blackHole',
      x: px,
      y: py,
      radius: 180,
      life: 2.4,
      maxLife: 2.4,
      dmg,
      cfg,
      pulse: 0,
      onTick(h) {
        gravitationalPullAndDamage(h.x, h.y, h.radius, 190, h.dmg, cfg.trueDmg, cfg.executeThreshold);
      }
    });
  }

  // 11. Enxame Voraz (Inseto)
  function spawnOrbitalSwarms(px, py, cfg, dmg, pl) {
    const bugCount = 36;
    for (let b = 0; b < bugCount; b++) {
      const a = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 120;
      addHazard({
        type: 'swarmBug',
        x: px + Math.cos(a) * dist,
        y: py + Math.sin(a) * dist,
        angle: a,
        dist,
        speed: 4.5 + Math.random() * 2,
        life: 2.6,
        maxLife: 2.6,
        dmg: dmg * 0.12,
        cfg,
        pl
      });
    }
  }

  // 12. Eclipse das Sombras (Fantasma)
  function spawnSpectralEclipse(px, py, cfg, dmg, pl) {
    addScreenEffect({ type: 'vignette', color: '#3b0764', alpha: 0.80, life: 2.2, maxLife: 2.2 });
    damageEnemiesPercentageAndFear(px, py, 320, cfg.pctMaxHpDmg || 0.25, cfg.fearDur || 2.0);
    // Chamas de fogo-fátuo
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 220;
      addHazard({
        type: 'wispFlame',
        x: px + Math.cos(a) * d,
        y: py + Math.sin(a) * d,
        radius: 35,
        life: 2.0,
        maxLife: 2.0,
        cfg
      });
    }
  }

  // 13. Tempestade de Lâminas (Aço)
  function spawnBladeStorm(px, py, cfg, dmg, pl) {
    const blades = 12;
    for (let b = 0; b < blades; b++) {
      const a = (b / blades) * Math.PI * 2;
      addHazard({
        type: 'steelBlade',
        px, py,
        dist: 70,
        angle: a,
        life: 2.5,
        maxLife: 2.5,
        rotSpeed: 5.5,
        dmg: dmg * 0.35,
        cfg
      });
    }
    if (pl && pl.inRunModifiers) {
      pl.inRunModifiers.dmgReduce = Math.min(0.85, (pl.inRunModifiers.dmgReduce || 0) + 0.30);
    }
  }

  // -------------------------------------------------------------
  // ATUALIZAÇÃO (TICK / 60 FPS)
  // -------------------------------------------------------------
  function update(dt, pl) {
    // 1. Screen Effects
    for (let i = screenEffects.length - 1; i >= 0; i--) {
      const eff = screenEffects[i];
      eff.life -= dt;
      if (eff.life <= 0) screenEffects.splice(i, 1);
    }

    // 2. Partículas Rápidas
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += (pt.vx || 0) * dt;
      pt.y += (pt.vy || 0) * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // 3. Hazards e Calamidades Ativas
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      h.life -= dt;

      // Delays de ativação suave
      if (h.delay && h.delay > 0) {
        h.delay -= dt;
        continue;
      }

      // Lógica por comportamento
      if (h.type === 'diagonalFall') {
        const prog = 1 - Math.max(0, (h.life - 0.5) / h.travelTime);
        if (prog < 1) {
          h.x = h.startX + (h.targetX - h.startX) * prog;
          h.y = h.startY + (h.targetY - h.startY) * prog;
          // Deixa rastro de fumaça e faíscas
          if (Math.random() < 0.6) {
            addParticle({
              x: h.x + (Math.random() - 0.5) * 8,
              y: h.y + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 30,
              vy: -20 - Math.random() * 40,
              size: 4 + Math.random() * 4,
              color: h.cfg.accent,
              life: 0.35, maxLife: 0.35
            });
          }
        } else if (!h.hasHit) {
          h.hasHit = true;
          h.x = h.targetX;
          h.y = h.targetY;
          if (typeof h.onImpact === 'function') h.onImpact();
          damageEnemiesInCircle(h.targetX, h.targetY, h.radius, h.dmg);
        }
      } else if (h.type === 'directionalWave') {
        h.x += Math.cos(h.angle) * h.speed * dt;
        h.y += Math.sin(h.angle) * h.speed * dt;
        if (typeof h.onTick === 'function') h.onTick(h);
      } else if (h.type === 'radialBurst') {
        const prog = 1 - (h.life / h.maxLife);
        h.currentRadius = h.maxRadius * prog;
        if (typeof h.onTick === 'function') h.onTick(h);
      } else if (h.type === 'tornado') {
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.spin += dt * 10;
        if (typeof h.onTick === 'function') h.onTick(h);
      } else if (h.type === 'swarmBug') {
        h.angle += h.speed * dt;
        const wave = Math.sin(h.angle * 4) * 20;
        const targetX = (h.pl ? h.pl.x : h.x) + Math.cos(h.angle) * (h.dist + wave);
        const targetY = (h.pl ? h.pl.y : h.y) + Math.sin(h.angle) * (h.dist + wave);
        h.x = targetX;
        h.y = targetY;
        damageEnemiesInCircle(h.x, h.y, 18, h.dmg, true);
      } else if (h.type === 'steelBlade') {
        h.angle += h.rotSpeed * dt;
        h.x = (pl ? pl.x : h.px) + Math.cos(h.angle) * h.dist;
        h.y = (pl ? pl.y : h.py) + Math.sin(h.angle) * h.dist;
        damageEnemiesInCircle(h.x, h.y, 22, h.dmg);
      } else {
        if (typeof h.onTick === 'function') h.onTick(h);
      }

      if (h.life <= 0) hazards.splice(i, 1);
    }
  }

  // -------------------------------------------------------------
  // RENDERIZAÇÃO PROCEDURAL (CANVAS 2D / 60 FPS)
  // -------------------------------------------------------------
  function draw(ctx, camera) {
    if (!ctx) return;
    const now = performance.now();

    // Trava anti-duplicação de renderização no mesmo frame
    if (_lastDrawFrame === now) return;
    _lastDrawFrame = now;

    ctx.save();

    // 1. Renderiza Vinhetas e Escurecimento de Tela
    for (let i = 0; i < screenEffects.length; i++) {
      const eff = screenEffects[i];
      const alpha = Math.max(0, Math.min(1, eff.life / eff.maxLife)) * eff.alpha;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = eff.color;
      ctx.globalAlpha = alpha;
      const w = ctx.canvas ? ctx.canvas.width : 1280;
      const h = ctx.canvas ? ctx.canvas.height : 720;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 2. Renderiza Calamidades e Hazards com Iluminação Aditiva ('lighter')
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (h.delay && h.delay > 0) continue;

      const alpha = Math.max(0, Math.min(1, h.life / (h.maxLife * 0.4)));
      ctx.save();
      ctx.globalAlpha = alpha;

      switch (h.type) {
        case 'diagonalFall': {
          if (!h.hasHit) {
            // Desenha cometa em queda com cauda de gradiente
            const grad = ctx.createLinearGradient(h.x - 70, h.y - 100, h.x, h.y);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.7, h.cfg.accent);
            grad.addColorStop(1, '#ffffff');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(h.x - 80, h.y - 110);
            ctx.lineTo(h.x, h.y);
            ctx.stroke();

            // Núcleo incandescente
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(h.x, h.y, 10, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Anel de impacto no chão
            const hitProg = 1 - (h.life / 0.5);
            const r = h.radius * hitProg;
            ctx.strokeStyle = h.cfg.color;
            ctx.lineWidth = 4 * (1 - hitProg);
            ctx.beginPath();
            ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }

        case 'directionalWave': {
          ctx.strokeStyle = h.cfg.accent;
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius, h.angle - 0.7, h.angle + 0.7);
          ctx.stroke();

          // Espuma branca frontal
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.stroke();
          break;
        }

        case 'radialBurst': {
          const r = h.currentRadius;
          const radGrad = ctx.createRadialGradient(h.x, h.y, r * 0.4, h.x, h.y, r);
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          radGrad.addColorStop(0.5, h.cfg.accent);
          radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'celestialBeam': {
          const bGrad = ctx.createLinearGradient(h.x - 40, h.y, h.x + 40, h.y);
          bGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          bGrad.addColorStop(0.5, '#ffffff');
          bGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = bGrad;
          ctx.fillRect(h.x - h.radius * 0.5, h.y - 600, h.radius, 1200);

          // Raios em zigue-zague
          if (h.lightningBranches) {
            ctx.strokeStyle = h.cfg.color;
            ctx.lineWidth = 3;
            for (const branch of h.lightningBranches) {
              ctx.beginPath();
              ctx.moveTo(branch[0].x, branch[0].y);
              for (let b = 1; b < branch.length; b++) {
                ctx.lineTo(branch[b].x, branch[b].y);
              }
              ctx.stroke();
            }
          }
          break;
        }

        case 'lightningStrike': {
          if (h.branches) {
            ctx.strokeStyle = h.cfg.accent;
            ctx.lineWidth = 4;
            for (const branch of h.branches) {
              ctx.beginPath();
              ctx.moveTo(branch[0].x, branch[0].y);
              for (let b = 1; b < branch.length; b++) ctx.lineTo(branch[b].x, branch[b].y);
              ctx.stroke();
            }
          }
          break;
        }

        case 'iceField': {
          ctx.strokeStyle = h.cfg.accent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius * (h.life / h.maxLife), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case 'iceCrystal': {
          // Hexágono de gelo brilhante
          ctx.save();
          ctx.translate(h.x, h.y);
          ctx.rotate(h.rot);
          ctx.fillStyle = '#bae6fd';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const rad = (s / 6) * Math.PI * 2;
            const cx = Math.cos(rad) * h.size;
            const cy = Math.sin(rad) * h.size;
            if (s === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'roots': {
          ctx.strokeStyle = h.cfg.color;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(h.originX, h.originY);
          ctx.quadraticCurveTo((h.originX + h.x) * 0.5 + 20, (h.originY + h.y) * 0.5 - 20, h.x, h.y);
          ctx.stroke();
          // Flores e esporos
          ctx.fillStyle = h.cfg.aura;
          ctx.beginPath();
          ctx.arc(h.x, h.y, 8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'fissure': {
          if (h.points && h.points.length) {
            ctx.strokeStyle = h.cfg.accent;
            ctx.lineWidth = h.width * (h.life / h.maxLife);
            ctx.beginPath();
            ctx.moveTo(h.points[0].x, h.points[0].y);
            for (let p = 1; p < h.points.length; p++) ctx.lineTo(h.points[p].x, h.points[p].y);
            ctx.stroke();
          }
          break;
        }

        case 'rockBlock': {
          ctx.save();
          ctx.translate(h.x, h.y - h.maxElev * (1 - h.life / h.maxLife));
          ctx.fillStyle = h.cfg.color;
          ctx.strokeStyle = h.cfg.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(-10, -10, 20, 20);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'tornado': {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          for (let layer = 1; layer <= 4; layer++) {
            const r = (h.radius * 0.25) * layer;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y - layer * 15, r, r * 0.45, h.spin, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }

        case 'blackHole': {
          // Borda de acreção brilhante
          ctx.strokeStyle = h.cfg.accent;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius * 0.5, 0, Math.PI * 2);
          ctx.stroke();

          // Horizonte de eventos puro e profundo
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'poisonCloud': {
          ctx.fillStyle = h.cfg.color;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius * (0.6 + 0.4 * Math.sin(now / 200)), 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'swarmBug': {
          ctx.fillStyle = h.cfg.color;
          ctx.beginPath();
          ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'steelBlade': {
          ctx.save();
          ctx.translate(h.x, h.y);
          ctx.rotate(h.angle + Math.PI / 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-3, -16, 6, 32);
          ctx.strokeStyle = h.cfg.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(-3, -16, 6, 32);
          ctx.restore();
          break;
        }

        case 'wispFlame': {
          ctx.fillStyle = h.cfg.color;
          ctx.beginPath();
          ctx.arc(h.x, h.y - Math.sin(now / 150) * 8, 8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();
    }

    // 3. Renderiza Partículas Rápidas com Shaders Alpha Fade
    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color || '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size || 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // UTILITÁRIOS MATEMÁTICOS E FÍSICA DE STATUS EM ÁREA
  // -------------------------------------------------------------
  function spawnRadialParticles(x, y, color1, color2, count = 20) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 160;
      addParticle({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        color: Math.random() > 0.5 ? color1 : color2,
        size: 3 + Math.random() * 3,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8
      });
    }
  }

  function generateLightningBranches(x, y, branches = 4) {
    const res = [];
    for (let b = 0; b < branches; b++) {
      const pts = [{ x, y: y - 500 }];
      let cx = x + (Math.random() - 0.5) * 60;
      let cy = y - 500;
      while (cy < y) {
        cy += 40 + Math.random() * 30;
        cx += (Math.random() - 0.5) * 55;
        pts.push({ x: cx, y: cy });
      }
      pts.push({ x, y });
      res.push(pts);
    }
    return res;
  }

  function generateFractalLine(x, y, angle, length, segments = 5) {
    const pts = [{ x, y }];
    let curX = x;
    let curY = y;
    const step = length / segments;
    for (let s = 1; s <= segments; s++) {
      curX += Math.cos(angle) * step + (Math.random() - 0.5) * 20;
      curY += Math.sin(angle) * step + (Math.random() - 0.5) * 20;
      pts.push({ x: curX, y: curY });
    }
    return pts;
  }

  function getSortedEnemiesByHP() {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return [];
    return G.EnemyMgr.all().filter(e => e && !e.dead).sort((a, b) => (b.hp || 0) - (a.hp || 0));
  }

  function damageEnemiesInCircle(cx, cy, radius, dmg, isLifesteal = false) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.dead) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= r2) {
        if (typeof e.hurt === 'function') e.hurt(dmg, '#ffcb05', dx, dy, 40, 'super');
        if (isLifesteal) {
          const pl = (typeof G === 'object' && G.Game) ? G.Game.player : null;
          if (pl && typeof pl.heal === 'function') pl.heal(dmg * 0.15);
        }
      }
    }
  }

  function applyBurnToArea(cx, cy, radius, stacks) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= r2) {
        if (typeof e.applyBurn === 'function') e.applyBurn(stacks);
      }
    }
  }

  function pushAndSlowEnemiesInArc(cx, cy, radius, angle, spread, knock, slowFactor, dur, dmg, hitSet) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead || hitSet.has(e.id)) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= r2) {
        hitSet.add(e.id);
        if (typeof e.hurt === 'function') e.hurt(dmg, '#00d0ff', dx, dy, knock, 'super');
        if (typeof e.applySlow === 'function') e.applySlow(slowFactor, dur);
      }
    }
  }

  function rootEnemiesInCircle(cx, cy, radius, dur, dmg) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= r2) {
        if (typeof e.hurt === 'function') e.hurt(dmg, '#10b981', 0, 0, 0);
        if (typeof e.applySlow === 'function') e.applySlow(1.0, dur);
      }
    }
  }

  function stunEnemiesInCircle(cx, cy, radius, dur, dmg) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= r2) {
        if (typeof e.hurt === 'function') e.hurt(dmg, '#facc15', 0, 0, 0, 'super');
        if (typeof e.applySlow === 'function') e.applySlow(1.0, dur);
      }
    }
  }

  function freezeAllEnemiesOnScreen(dur, dmg) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead) continue;
      if (typeof e.hurt === 'function') e.hurt(dmg, '#38bdf8', 0, 0, 0, 'super');
      if (typeof e.applySlow === 'function') e.applySlow(1.0, dur);
    }
  }

  function expandBurstDamage(cx, cy, radius, dmg, knock, hitSet) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead || hitSet.has(e.id)) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= r2) {
        hitSet.add(e.id);
        if (typeof e.hurt === 'function') e.hurt(dmg, '#ffffff', dx, dy, knock, 'super');
      }
    }
  }

  function applyPoisonAndSlowInCircle(cx, cy, radius, stacks, slow, dmg) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= r2) {
        if (typeof e.hurt === 'function') e.hurt(dmg, '#a855f7', 0, 0, 0);
        if (typeof e.applyPoison === 'function') e.applyPoison(stacks);
        if (typeof e.applySlow === 'function') e.applySlow(slow, 1.5);
      }
    }
  }

  function vortexPullInCircle(cx, cy, radius, pullForce, dmg) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead) continue;
      const dx = cx - e.x;
      const dy = cy - e.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2 && d2 > 25) {
        const d = Math.sqrt(d2);
        e.kx += (dx / d) * pullForce * 0.05;
        e.ky += (dy / d) * pullForce * 0.05;
        if (typeof e.hurt === 'function') e.hurt(dmg * 0.1, '#38bdf8', 0, 0, 0);
      }
    }
  }

  function gravitationalPullAndDamage(cx, cy, radius, pullForce, dmg, isTrue, executeThreshold) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead) continue;
      const dx = cx - e.x;
      const dy = cy - e.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) {
        const d = Math.sqrt(d2) || 1;
        e.kx += (dx / d) * pullForce * 0.06;
        e.ky += (dy / d) * pullForce * 0.06;
        if (executeThreshold && (e.hp / (e.maxHp || 1)) <= executeThreshold && !e.boss) {
          if (typeof e.hurt === 'function') e.hurt(999999, '#e11d48', 0, 0, 0, 'crit');
        } else {
          if (typeof e.hurt === 'function') e.hurt(dmg * 0.15, isTrue ? '#ffffff' : '#ec4899', 0, 0, 0, isTrue ? 'crit' : 'super');
        }
      }
    }
  }

  function damageEnemiesPercentageAndFear(cx, cy, radius, pctHp, fearDur) {
    if (typeof G !== 'object' || !G.EnemyMgr || typeof G.EnemyMgr.all !== 'function') return;
    const r2 = radius * radius;
    const enemies = G.EnemyMgr.all();
    for (const e of enemies) {
      if (!e || e.dead) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= r2) {
        const dmg = Math.max(10, (e.hp || 100) * pctHp);
        if (typeof e.hurt === 'function') e.hurt(dmg, '#6b21a8', dx, dy, 60, 'super');
        // Efeito de medo: empurra monstro para longe do centro
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        e.kx += (dx / d) * 160;
        e.ky += (dy / d) * 160;
        if (typeof e.applySlow === 'function') e.applySlow(0.5, fearDur);
      }
    }
  }

  return {
    trigger,
    update,
    draw,
    clear,
    addHazard,
    addParticle,
    getTypeConfig: (t) => TYPE_CONFIGS[normaliseType(t)],
    get allTypes() { return Object.keys(TYPE_CONFIGS); },
    get hazardCount() { return hazards.length; },
    get particleCount() { return particles.length; }
  };
}));
