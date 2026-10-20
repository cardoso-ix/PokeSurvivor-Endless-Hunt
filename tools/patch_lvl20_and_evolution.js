const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 1. PATCH NO js/game.js
console.log('--- 1. Aplicando patch em js/game.js ---');
const gamePath = path.join(ROOT, 'js', 'game.js');
let gameContent = fs.readFileSync(gamePath, 'utf8');

const targetLock = `    // A partir do nível 20, os 4 ataques estão definidos e combando juntos.
    // Não abre mais a seleção de cartas para não pausar nem contaminar a tela!
    if (pl && pl.level >= 20) {
      pendingLevels = 0;
      return;
    }`;

// Se tiver \r\n, substitui ambas as variações
if (gameContent.includes(targetLock)) {
  gameContent = gameContent.replace(targetLock, '');
  fs.writeFileSync(gamePath, gameContent, 'utf8');
  console.log('✅ Trava do nível 20 removida com sucesso de js/game.js (LF)!');
} else {
  const targetLockCRLF = targetLock.replace(/\n/g, '\r\n');
  if (gameContent.includes(targetLockCRLF)) {
    gameContent = gameContent.replace(targetLockCRLF, '');
    fs.writeFileSync(gamePath, gameContent, 'utf8');
    console.log('✅ Trava do nível 20 removida com sucesso de js/game.js (CRLF)!');
  } else {
    console.warn('⚠️ Alvo de trava do nível 20 não encontrado em js/game.js. Verifique se já foi removido.');
  }
}

// 2. PATCH NO js/systems/levelup.js
console.log('--- 2. Aplicando patch em js/systems/levelup.js ---');
const levelupPath = path.join(ROOT, 'js', 'systems', 'levelup.js');
let levelupContent = fs.readFileSync(levelupPath, 'utf8');

// Aumenta o teto de atk para passivas infinitas de dano no end-game
levelupContent = levelupContent.replace(
  "apply: pl => pl.atkMul *= 1.10, max: 40",
  "apply: pl => pl.atkMul *= 1.10"
);

// Bloqueia ataques novos a partir do Nível 20 (ou quando já tiver 4 ataques)
levelupContent = levelupContent.replace(
  "if (pl.slots.length < pl.maxMoves) {",
  "// Não oferece mais ataques novos a partir do Nível 20 ou com 4 ataques preenchidos\n    if (pl.slots.length < pl.maxMoves && pl.level < 20) {"
);

// Adiciona as cartas de EVOLUÇÃO do Pokémon dentro de candidates(pl)
const evoCode = `    // --- cartas de evolução de espécie do Pokémon (Prioridade Máxima) ---
    const getEvo = (typeof getEvolutionData === 'function' ? getEvolutionData :
                    (typeof G === 'object' && G.getEvolutionData) ? G.getEvolutionData :
                    (typeof window !== 'undefined' && window.getEvolutionData) ? window.getEvolutionData : null);
    if (getEvo) {
      const currentSpecies = pl.species || (pl.mon && pl.mon.name ? pl.mon.name.toLowerCase() : '');
      const evoRaw = getEvo(currentSpecies);
      if (evoRaw) {
        const evoList = Array.isArray(evoRaw) ? evoRaw : [evoRaw];
        const isSecondEvolution = (pl.currentEvolutionStage >= 2) || (pl.evolutionHistory && pl.evolutionHistory.length >= 2);
        // Permite evolução a partir do Nível 5 (estágio 1->2) e Nível 12 (estágio 2->3)
        const reqLevel = isSecondEvolution ? 12 : 5;

        for (const evo of evoList) {
          const alreadyReached = pl._milestonesReached && pl._milestonesReached.has('evo_' + evo.next.toLowerCase());
          if (pl.level >= reqLevel && !alreadyReached) {
            let nextMon = null;
            if (typeof G === 'object' && Array.isArray(G.DEX)) {
              nextMon = G.DEX.find(p => p.name.toLowerCase() === evo.next.toLowerCase());
            }
            if (!nextMon && typeof G === 'object' && G.DEX_BY && typeof evo.next === 'number') {
              nextMon = G.DEX_BY[evo.next];
            }
            const name = nextMon ? nextMon.name : (evo.next.charAt(0).toUpperCase() + evo.next.slice(1));
            const primaryType = nextMon && nextMon.types ? nextMon.types[0] : 'normal';
            const color = (G.U && G.U.TYPE_COLOR) ? (G.U.TYPE_COLOR[primaryType] || '#ffd23f') : '#ffd23f';

            out.push({
              w: 300,
              type: 'EVOLUTION',
              key: 'evo_mon:' + evo.next.toLowerCase(),
              targetSpeciesId: evo.next,
              dex: nextMon ? nextMon.dex : null,
              icon: 'type:' + primaryType,
              color: '#ffd700',
              tag: '🌟 EVOLUÇÃO',
              title: 'Evolução: ' + name,
              desc: 'Evolua para ' + name + '! Aumenta atributos base e adapta seus tipos elementais.',
              apply: p => {
                p._milestonesReached = p._milestonesReached || new Set();
                p._milestonesReached.add('evo_' + evo.next.toLowerCase());
                p.evolveTo(evo.next);
              }
            });
          }
        }
      }
    }
`;

// Injeta o bloco de evolução antes de `// --- evoluciones: movimiento al máximo`
if (!levelupContent.includes("evo_mon:")) {
  const evoAnchor = "// --- evoluciones: movimiento al máximo";
  if (levelupContent.includes(evoAnchor)) {
    levelupContent = levelupContent.replace(evoAnchor, evoCode + "\n    " + evoAnchor);
    console.log('✅ Cartas de evolução reintroduzidas com sucesso em js/systems/levelup.js!');
  } else {
    console.warn('⚠️ Âncora de evoluções não encontrada em js/systems/levelup.js');
  }
}

// Garante fallback para que offer(pl, 3) sempre tenha cartas suficientes (passivas infinitas)
const fallbackTarget = "while (picked.length < n && pool.length) {";
const fallbackPatch = `// Fallback infinito: se o pool esgotou opções limitadas, alimenta com passivas infinitas (Vigor, Potência, Síntese, Cura)
    if (pool.length === 0 && picked.length < n) {
      const infiniteStats = STATS.filter(s => ['hp', 'atk', 'rgn', 'heal'].includes(s.id));
      for (const s of infiniteStats) {
        pool.push({
          w: 10,
          type: 'stat',
          key: 'stat:' + s.id + ':' + Math.random(),
          icon: s.icon,
          color: '#8fa3c4',
          tag: 'Passiva',
          title: s.title,
          desc: s.desc,
          apply: p => { s.apply(p); p.statsTaken[s.id] = (p.statsTaken[s.id] || 0) + 1; }
        });
      }
    }

    while (picked.length < n && pool.length) {`;

if (!levelupContent.includes("infiniteStats")) {
  levelupContent = levelupContent.replace(fallbackTarget, fallbackPatch);
  console.log('✅ Fallback de passivas infinitas injetado em js/systems/levelup.js!');
}

fs.writeFileSync(levelupPath, levelupContent, 'utf8');
console.log('🎉 Patches aplicados com sucesso em game.js e levelup.js!');
