const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// =============================================================================
// 1. ATUALIZAR js/game.js: Trava de escolha no Level 20+
// =============================================================================
const gameJsPath = path.join(ROOT, 'js', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

const oldMaybe = `  function maybeLevelUp() {
    if (pendingLevels <= 0 || state !== 'playing') return;
    if (pl && typeof pl.checkEvolutionMilestones === 'function') {
      pl.checkEvolutionMilestones();
    }`;

const newMaybe = `  function maybeLevelUp() {
    if (pendingLevels <= 0 || state !== 'playing') return;
    if (pl && typeof pl.checkEvolutionMilestones === 'function') {
      pl.checkEvolutionMilestones();
    }
    // A partir do nível 20, os 4 ataques estão definidos e combando juntos.
    // Não abre mais a seleção de cartas para não pausar nem contaminar a tela!
    if (pl && pl.level >= 20) {
      pendingLevels = 0;
      return;
    }`;

if (gameJs.includes(oldMaybe)) {
  gameJs = gameJs.replace(oldMaybe, newMaybe);
  console.log('✅ js/game.js: maybeLevelUp() atualizado para nível 20+');
} else {
  // Tenta com \r\n
  const oldMaybeCRLF = oldMaybe.replace(/\n/g, '\r\n');
  const newMaybeCRLF = newMaybe.replace(/\n/g, '\r\n');
  if (gameJs.includes(oldMaybeCRLF)) {
    gameJs = gameJs.replace(oldMaybeCRLF, newMaybeCRLF);
    console.log('✅ js/game.js: maybeLevelUp() atualizado (CRLF)');
  } else {
    console.error('⚠️ js/game.js: padrão oldMaybe não encontrado!');
  }
}

// Atualiza triggerLevelUp
const oldTrig = `    triggerLevelUp(n = 1) {
      pendingLevels += n;
      if (pl && typeof pl.checkEvolutionMilestones === 'function') pl.checkEvolutionMilestones();`;

const newTrig = `    triggerLevelUp(n = 1) {
      if (pl && pl.level >= 20) {
        pendingLevels = 0;
        if (pl && typeof pl.checkEvolutionMilestones === 'function') pl.checkEvolutionMilestones();
        return;
      }
      pendingLevels += n;
      if (pl && typeof pl.checkEvolutionMilestones === 'function') pl.checkEvolutionMilestones();`;

if (gameJs.includes(oldTrig)) {
  gameJs = gameJs.replace(oldTrig, newTrig);
  console.log('✅ js/game.js: triggerLevelUp() atualizado');
} else {
  const oldTrigCRLF = oldTrig.replace(/\n/g, '\r\n');
  const newTrigCRLF = newTrig.replace(/\n/g, '\r\n');
  if (gameJs.includes(oldTrigCRLF)) {
    gameJs = gameJs.replace(oldTrigCRLF, newTrigCRLF);
    console.log('✅ js/game.js: triggerLevelUp() atualizado (CRLF)');
  }
}
fs.writeFileSync(gameJsPath, gameJs, 'utf8');

// =============================================================================
// 2. ATUALIZAR js/systems/rift.js: Redução drástica de Shinies e Lendários
// =============================================================================
const riftJsPath = path.join(ROOT, 'js', 'systems', 'rift.js');
let riftJs = fs.readFileSync(riftJsPath, 'utf8');

// Rolagem de raridade:
// 96.0% Comum Normal, 2.5% Lendário Normal, 1.3% Comum Shiny, 0.2% Lendário Shiny
const oldRollBlock = `    if (roll <= 75) {
      targetTier = 'common_normal';
    } else if (roll <= 90) {
      targetTier = 'common_shiny';
    } else if (roll <= 99) {
      targetTier = (riftsCleared < 30) ? 'common_normal' : 'legend_normal';
    } else {
      targetTier = (riftsCleared < 30) ? 'common_shiny' : 'legend_shiny';
    }`;

const newRollBlock = `    // Taxas calibradas: Comum Normal (96%), Lendário Normal (2.5%), Comum Shiny (1.3%), Lendário Shiny (0.2%)
    if (roll <= 96.0) {
      targetTier = 'common_normal';
    } else if (roll <= 98.5) {
      targetTier = (riftsCleared < 30) ? 'common_normal' : 'legend_normal';
    } else if (roll <= 99.8) {
      targetTier = 'common_shiny';
    } else {
      targetTier = (riftsCleared < 30) ? 'common_shiny' : 'legend_shiny';
    }`;

if (riftJs.includes(oldRollBlock)) {
  riftJs = riftJs.replace(oldRollBlock, newRollBlock);
  console.log('✅ js/systems/rift.js: Rolagem de raridade calibrada para Shinies/Lendários baixos e eventuais');
} else {
  const oldRollCRLF = oldRollBlock.replace(/\n/g, '\r\n');
  const newRollCRLF = newRollBlock.replace(/\n/g, '\r\n');
  if (riftJs.includes(oldRollCRLF)) {
    riftJs = riftJs.replace(oldRollCRLF, newRollCRLF);
    console.log('✅ js/systems/rift.js: Rolagem de raridade calibrada (CRLF)');
  }
}

// Fallback de Pokédex Completa: Math.random() < 0.25 -> Math.random() < 0.02
riftJs = riftJs.replace('Math.random() < 0.25', 'Math.random() < 0.02');
console.log('✅ js/systems/rift.js: Fallback de Shiny reduzido de 25% para 2%');

// Remoção do limite de 28 minutos para abertura de Rifts
// time < G.Judgment.AT - 120 -> time > FROM
riftJs = riftJs.replace('time > FROM && time < G.Judgment.AT - 120', 'time > FROM');
console.log('✅ js/systems/rift.js: Rifts agora abrem indefinidamente durante toda a sobrevivência');

fs.writeFileSync(riftJsPath, riftJs, 'utf8');

// =============================================================================
// 3. ATUALIZAR js/systems/judgment.js: Fim do Game Over aos 30 minutos (Sobrevivência Infinita)
// =============================================================================
const judgmentJsPath = path.join(ROOT, 'js', 'systems', 'judgment.js');
let judgmentJs = fs.readFileSync(judgmentJsPath, 'utf8');

judgmentJs = judgmentJs.replace('const AT = 30 * 60;', 'const AT = Infinity; // Sobrevivência infinita');
console.log('✅ js/systems/judgment.js: AT configurado como Infinity para permitir partidas infinitas');

fs.writeFileSync(judgmentJsPath, judgmentJs, 'utf8');

console.log('🏁 Patch de Level 20, Rifts e Sobrevivência Infinita aplicado com sucesso!');
