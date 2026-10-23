/**
 * tools/refactor_data_driven.js
 * Normaliza CRLF/LF, aplica substituições Data-Driven com BalanceConfig e preserva integridade.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function patchFile(relPath, targetsAndReplacements) {
  const fullPath = path.join(root, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const isCrlf = content.includes('\r\n');
  let normalized = content.replace(/\r\n/g, '\n');

  let modified = false;
  for (const { target, replacement } of targetsAndReplacements) {
    const normTarget = target.replace(/\r\n/g, '\n');
    const normRep = replacement.replace(/\r\n/g, '\n');
    if (normalized.includes(normTarget)) {
      normalized = normalized.replace(normTarget, normRep);
      modified = true;
      console.log(`  ✓ Match encontrado e substituído em ${relPath}`);
    } else {
      console.warn(`  ⚠️ Alvo NÃO encontrado em ${relPath}:`, normTarget.slice(0, 40) + '...');
    }
  }

  if (modified) {
    const finalContent = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
    fs.writeFileSync(fullPath, finalContent, 'utf8');
    console.log(`✅ ${relPath} salvo com sucesso.`);
  } else {
    console.log(`ℹ️ ${relPath} não precisou de modificações.`);
  }
}

console.log('🔄 Executando refatoração Data-Driven cirúrgica...');

// 1. js/data/enemies.js
patchFile('js/data/enemies.js', [
  {
    target: `G.Enemies = (() => {
  const TIERS = [
    { from: 0,   bst: [180, 330], hp: 17,  spd: 56, dmg: 6,  xp: 3.5, cast: 7 },
    { from: 70,  bst: [300, 405], hp: 32,  spd: 62, dmg: 8.5, xp: 5,  cast: 7 },
    { from: 160, bst: [385, 465], hp: 52,  spd: 60, dmg: 11, xp: 8,  cast: 7 },
    { from: 260, bst: [445, 515], hp: 88,  spd: 70, dmg: 14, xp: 13, cast: 7 },
    { from: 380, bst: [495, 560], hp: 115, spd: 66, dmg: 17, xp: 20, cast: 7 },
    { from: 500, bst: [530, 620], hp: 170, spd: 72, dmg: 21, xp: 28, cast: 7 }
  ];

  // Franjas de jefe: minuto en que salen, PV base y franja de BST.
  const BOSS_SLOTS = [
    { at: 180, hp: 1400,  dmg: 34, xp: 220,  bst: [490, 545] },
    { at: 360, hp: 3200,  dmg: 42, xp: 420,  bst: [520, 580] },
    { at: 540, hp: 5600,  dmg: 48, xp: 680,  bst: [540, 600] },
    { at: 720, hp: 9000,  dmg: 56, xp: 1000, bst: [580, 700] },
    { at: 900, hp: 16000, dmg: 68, xp: 1800, bst: [600, 700] }
  ];`,
    replacement: `G.Enemies = (() => {
  const bCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
  const eCfg = bCfg && bCfg.enemies;

  const TIERS = (eCfg && eCfg.tiers) || [
    { from: 0,   bst: [180, 330], hp: 17,  spd: 56, dmg: 6,  xp: 3.5, cast: 7 },
    { from: 70,  bst: [300, 405], hp: 32,  spd: 62, dmg: 8.5, xp: 5,  cast: 7 },
    { from: 160, bst: [385, 465], hp: 52,  spd: 60, dmg: 11, xp: 8,  cast: 7 },
    { from: 260, bst: [445, 515], hp: 88,  spd: 70, dmg: 14, xp: 13, cast: 7 },
    { from: 380, bst: [495, 560], hp: 115, spd: 66, dmg: 17, xp: 20, cast: 7 },
    { from: 500, bst: [530, 620], hp: 170, spd: 72, dmg: 21, xp: 28, cast: 7 }
  ];

  // Franjas de jefe: minuto en que salen, PV base y franja de BST.
  const BOSS_SLOTS = (eCfg && eCfg.bossSlots) || [
    { at: 180, hp: 1400,  dmg: 34, xp: 220,  bst: [490, 545] },
    { at: 360, hp: 3200,  dmg: 42, xp: 420,  bst: [520, 580] },
    { at: 540, hp: 5600,  dmg: 48, xp: 680,  bst: [540, 600] },
    { at: 720, hp: 9000,  dmg: 56, xp: 1000, bst: [580, 700] },
    { at: 900, hp: 16000, dmg: 68, xp: 1800, bst: [600, 700] }
  ];`
  },
  {
    target: `  function scale(t) {
    return { hp: 1 + t / 140, dmg: 1 + t / 600, spd: 1 + Math.min(0.35, t / 1400) };
  }

  /**
   * Los jefes ya traen su vida base creciente (1.400 ... 16.000), así que
   * escalan mucho más suave: con la curva normal el último llegaba a 168.000 PV.
   */
  function bossScale(t) { return { hp: 1 + t / 600, dmg: 1 + t / 600, spd: 1 }; }`,
    replacement: `  function scale(t) {
    if (eCfg && typeof eCfg.scale === 'function') return eCfg.scale(t);
    return { hp: 1 + t / 140, dmg: 1 + t / 600, spd: 1 + Math.min(0.35, t / 1400) };
  }

  /**
   * Los jefes ya traen su vida base creciente (1.400 ... 16.000), así que
   * escalan mucho más suave: con la curva normal el último llegaba a 168.000 PV.
   */
  function bossScale(t) {
    if (eCfg && typeof eCfg.bossScale === 'function') return eCfg.bossScale(t);
    return { hp: 1 + t / 600, dmg: 1 + t / 600, spd: 1 };
  }`
  }
]);

// 2. js/systems/capture.js
patchFile('js/systems/capture.js', [
  {
    target: `  function getBaseCatchRate(speciesId, isShiny = false, isLegendary = false, stage = 1) {
    const isLeg = !!(isLegendary || isLegendaryOrMythical(speciesId));
    
    // 1º Shiny Lendário: 2% base (0.02)
    if (isShiny && isLeg) {
      return 0.02;
    }
    // 2º Lendário Normal: 6% base (0.06)
    if (isLeg) {
      return 0.06;
    }
    // 3º Shiny Comum: 10% base (0.10)
    if (isShiny) {
      return 0.10;
    }
    // 4º a 6º Normais por estágio evolutivo:
    const stg = Number(stage) || (speciesId ? getMonStage(speciesId) : 1);
    if (stg === 3 || stg >= 3) return 0.18; // 4º Normal Estágio 3: 18% base
    if (stg === 2) return 0.28;             // 5º Normal Estágio 2: 28% base
    return 0.38;                           // 6º Normal Estágio 1: 38% base (default)
  }`,
    replacement: `  function getBaseCatchRate(speciesId, isShiny = false, isLegendary = false, stage = 1) {
    const bCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
    const cr = (bCfg && bCfg.rewards && bCfg.rewards.captureRates) || {
      shinyLegendary: 0.02,
      legendary: 0.06,
      shinyCommon: 0.10,
      stage3: 0.18,
      stage2: 0.28,
      stage1: 0.38
    };

    const isLeg = !!(isLegendary || isLegendaryOrMythical(speciesId));
    
    // 1º Shiny Lendário (Apex)
    if (isShiny && isLeg) {
      return cr.shinyLegendary;
    }
    // 2º Lendário Normal
    if (isLeg) {
      return cr.legendary;
    }
    // 3º Shiny Comum
    if (isShiny) {
      return cr.shinyCommon;
    }
    // 4º a 6º Normais por estágio evolutivo:
    const stg = Number(stage) || (speciesId ? getMonStage(speciesId) : 1);
    if (stg === 3 || stg >= 3) return cr.stage3;
    if (stg === 2) return cr.stage2;
    return cr.stage1;
  }`
  }
]);

// 3. js/entities/enemy.js (Mega Energy Gain)
patchFile('js/entities/enemy.js', [
  {
    target: `      const gain = (e.isGuardian || e.isRiftGuardian) ? 35.0 : (e.boss ? 25.0 : (e.elite ? 8.0 : 0.65));`,
    replacement: `      const bCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
      const mGain = (bCfg && bCfg.enemies && bCfg.enemies.megaEnergyGains) || { guardian: 35.0, boss: 25.0, elite: 8.0, normal: 0.65 };
      const gain = (e.isGuardian || e.isRiftGuardian) ? mGain.guardian : (e.boss ? mGain.boss : (e.elite ? mGain.elite : mGain.normal));`
  }
]);

// 4. js/systems/rift.js (Rift Rewards)
patchFile('js/systems/rift.js', [
  {
    target: `    // Recompensa de Rift: 100 a 150 tickets distribuídos em 5 orbes dourados
    const totalRiftTickets = G.U.rand(100, 150);`,
    replacement: `    // Recompensa de Rift: 100 a 150 tickets distribuídos em 5 orbes dourados (via BalanceConfig)
    const bCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
    const rftCfg = bCfg && bCfg.rewards && bCfg.rewards.rift;
    const minT = (rftCfg && rftCfg.guardianTicketsMin) || 100;
    const maxT = (rftCfg && rftCfg.guardianTicketsMax) || 150;
    const totalRiftTickets = G.U.rand(minT, maxT);`
  }
]);

console.log('🎉 REFACTOR COMPLETO CONCLUÍDO!');
