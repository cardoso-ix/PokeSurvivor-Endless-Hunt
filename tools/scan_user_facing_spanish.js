const fs = require('fs');
const path = require('path');

const targets = ['js', 'dev.html', 'index.html'];
const spanishRegexes = [
  /¡/, /¿/,
  /\b(daño|tiempo de recarga|movimiento|movimientos|elegir|escoger|volver|pantalla|jugar|comenzar|ronda|monedas|enemigos|jefe|derrotado|pregunta|compañero|pelea|ayudar|pueblo|ajustes|sonido|música|habilidades|recogida|bloqueado|desbloqueado|cuenta|apodo|invitar|unirse|en línea|sala|en tu sala|derrotar|haz clic|pulsa|presiona|todavía|esperando|partidas|seguro|guardar|cancelar|atrás|adelante|ganaste|perdiste|siguiente|anterior|nivel|niveles|puntos|oro|tienda|comprar|vendido|precio|coste|costo|vida|fuerza|defensa|suerte|velocidad|gratis|selecciona|seleccionar|elige|nombre|escribe|crear)\b/i
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

const userFacingFindings = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Pular comentários puros
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    
    // Verificar se tem string literal com texto espanhol
    // Checar padrões como toast, innerHTML, textContent, confirm, alert, ou tags HTML
    const isUserFacingCandidate = 
      trimmed.includes('toast(') ||
      trimmed.includes('innerHTML') ||
      trimmed.includes('textContent') ||
      trimmed.includes('confirm(') ||
      trimmed.includes('alert(') ||
      trimmed.includes('prompt(') ||
      trimmed.includes('data-i18n') ||
      trimmed.includes('<button') ||
      trimmed.includes('<p') ||
      trimmed.includes('<span') ||
      trimmed.includes('<div') ||
      trimmed.includes('<h1') ||
      trimmed.includes('<h2') ||
      trimmed.includes('<h3') ||
      trimmed.includes('<h4') ||
      trimmed.includes('<label') ||
      trimmed.includes('<option') ||
      trimmed.includes('Q =') ||
      file.includes('starters.js') ||
      file.includes('i18n.js');

    if (isUserFacingCandidate) {
      for (const rx of spanishRegexes) {
        if (rx.test(trimmed)) {
          userFacingFindings.push({
            file,
            line: idx + 1,
            text: trimmed
          });
          break;
        }
      }
    }
  });
}

console.log(`Encontradas ${userFacingFindings.length} linhas com potenciais textos em espanhol voltados ao usuário:`);
const byFile = {};
userFacingFindings.forEach(f => {
  if (!byFile[f.file]) byFile[f.file] = [];
  byFile[f.file].push(f);
});

for (const f in byFile) {
  console.log(`\n--- ${f} (${byFile[f].length} itens) ---`);
  byFile[f].forEach(item => {
    console.log(`  [${item.line}] ${item.text.substring(0, 120)}`);
  });
}
