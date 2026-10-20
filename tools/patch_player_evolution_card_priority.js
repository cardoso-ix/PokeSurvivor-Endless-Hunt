const fs = require('fs');
const path = require('path');

const playerPath = path.join(__dirname, '..', 'js', 'entities', 'player.js');
let content = fs.readFileSync(playerPath, 'utf8');

const target = `          const lvl = adminEvoMode === 'instant' ? 1 :
                      (adminEvoMode === 'official' && evo.level) ? evo.level :
                      (isSecondEvolution ? 12 : 5);

          if (this.level >= lvl && !this._milestonesReached.has('evo_' + evo.next.toLowerCase())) {
            targetEvo = evo;
            reqLevel = lvl;
            break;
          }`;

const replacement = `          const lvl = adminEvoMode === 'instant' ? 1 :
                      (adminEvoMode === 'official' && evo.level) ? evo.level :
                      (isSecondEvolution ? 12 : 5);
          // Permite que a carta de evolução seja oferecida no LevelUp do nível exato (5 e 12),
          // e se o jogador passar sem escolher, a evolução automática assume no nível seguinte.
          const triggerLvl = adminEvoMode === 'instant' ? 1 : (lvl + 1);

          if (this.level >= triggerLvl && !this._milestonesReached.has('evo_' + evo.next.toLowerCase())) {
            targetEvo = evo;
            reqLevel = lvl;
            break;
          }`;

const targetCRLF = target.replace(/\n/g, '\r\n');
const replacementCRLF = replacement.replace(/\n/g, '\r\n');

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(playerPath, content, 'utf8');
  console.log('✅ Patch aplicado em player.js (LF)!');
} else if (content.includes(targetCRLF)) {
  content = content.replace(targetCRLF, replacementCRLF);
  fs.writeFileSync(playerPath, content, 'utf8');
  console.log('✅ Patch aplicado em player.js (CRLF)!');
} else {
  console.warn('⚠️ Target não encontrado em player.js');
}
