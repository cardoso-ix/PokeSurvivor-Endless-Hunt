const fs = require('fs');
const path = require('path');

const targets = ['js', 'dev.html'];
const spanishKeywords = [
  '¡', '¿', 'daño', 'tiempo de recarga', 'movimiento', 'elegir', 'escoger', 'volver',
  'pantalla', 'jugar', 'comenzar', 'partida', 'ronda', 'monedas', 'enemigos',
  'jefe', 'derrotado', 'pregunta', 'compañero', 'pelea', 'ayudar', 'pueblo',
  'ajustes', 'sonido', 'música', 'habilidades', 'recogida', 'bloqueado', 'desbloqueado',
  'cuenta', 'apodo', 'invitar', 'unirse', 'en línea', 'sala', 'en tu sala',
  'derrotar', 'captura', 'haz clic', 'pulsa', 'presiona'
];

function scanDir(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...scanDir(full));
    } else if (item.endsWith('.js') || item.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = [];
for (const t of targets) {
  if (fs.existsSync(t)) {
    if (fs.statSync(t).isDirectory()) allFiles.push(...scanDir(t));
    else allFiles.push(t);
  }
}

const findings = {};
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    for (const kw of spanishKeywords) {
      if (lower.includes(kw)) {
        if (!findings[file]) findings[file] = [];
        findings[file].push({ line: idx + 1, keyword: kw, text: line.trim() });
        break;
      }
    }
  });
}

console.log('=== RELATÓRIO DE RESÍDUOS DE ESPANHOL ===');
let total = 0;
for (const file in findings) {
  console.log(`\nArquivo: ${file} (${findings[file].length} ocorrências)`);
  total += findings[file].length;
  findings[file].slice(0, 10).forEach(item => {
    console.log(`  L${item.line} [${item.keyword}]: ${item.text.substring(0, 100)}`);
  });
  if (findings[file].length > 10) {
    console.log(`  ... e mais ${findings[file].length - 10} linhas.`);
  }
}
console.log(`\nTOTAL DE LINHAS DETECTADAS: ${total}`);
