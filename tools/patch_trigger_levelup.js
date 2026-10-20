const fs = require('fs');
const path = require('path');

const gamePath = path.join(__dirname, '..', 'js', 'game.js');
let content = fs.readFileSync(gamePath, 'utf8');

const target = `    triggerLevelUp(n = 1) {
      if (pl && pl.level >= 20) {
        pendingLevels = 0;
        if (pl && typeof pl.checkEvolutionMilestones === 'function') pl.checkEvolutionMilestones();
        return;
      }
      pendingLevels += n;`;

const replacement = `    triggerLevelUp(n = 1) {
      pendingLevels += n;`;

const targetCRLF = target.replace(/\n/g, '\r\n');
const replacementCRLF = replacement.replace(/\n/g, '\r\n');

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(gamePath, content, 'utf8');
  console.log('✅ Trava de triggerLevelUp removida com sucesso (LF)!');
} else if (content.includes(targetCRLF)) {
  content = content.replace(targetCRLF, replacementCRLF);
  fs.writeFileSync(gamePath, content, 'utf8');
  console.log('✅ Trava de triggerLevelUp removida com sucesso (CRLF)!');
} else {
  console.warn('⚠️ Target não encontrado em game.js');
}
