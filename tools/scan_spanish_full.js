const fs = require('fs');
const path = require('path');

const dirs = ['js', 'css'];
const files = ['index.html', 'dev.html'];

// Palavras espanholas distintas do português
const spanishPatterns = [
  /\bdaño\b/i,
  /\bdaños\b/i,
  /\btiempo\b/i,
  /\btiempos\b/i,
  /\bpantalla\b/i,
  /\bpantallas\b/i,
  /\belegir\b/i,
  /\belegido\b/i,
  /\bescoge\b/i,
  /\bescoger\b/i,
  /\bañadir\b/i,
  /\bvolver\b/i,
  /\bmejora\b/i,
  /\bmejoras\b/i,
  /\bderrota\b/i,
  /\bderrotado\b/i,
  /\bderrotados\b/i,
  /\bhueco\b/i,
  /\bhuecos\b/i,
  /\bbloqueado\b/i,
  /\bbloqueada\b/i,
  /\bdesbloqueada\b/i,
  /\bdesbloqueado\b/i,
  /\bconseguir\b/i,
  /\bconseguido\b/i,
  /\bronda\b/i,
  /\brondas\b/i,
  /\besquivar\b/i,
  /\benfriamiento\b/i,
  /\bvelocidad\b/i,
  /\bmovimiento\b/i,
  /\bmovimientos\b/i,
  /\bnivel\b/i,
  /\bniveles\b/i,
  /\bmoneda\b/i,
  /\bmonedas\b/i,
  /\bajustes\b/i,
  /\bjugar\b/i,
  /\bcomenzar\b/i,
  /\bexperiencia\b/i,
  /\bcompañero\b/i,
  /\bcompañeros\b/i,
  /\bárea de efecto\b/i,
  /¿/,
  /¡/
];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.css'))) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const hits = [];

  lines.forEach((line, idx) => {
    // ignorar imports técnicos ou bibliotecas externas minificadas se houver
    if (line.includes('firebase') && line.length > 500) return;
    if (filePath.includes('libs') || filePath.includes('bundle')) return;

    // Verificar se alguma das regexes dá match
    for (const pat of spanishPatterns) {
      if (pat.test(line)) {
        // Verificar se é apenas código identificador ou texto legível
        // Ignorar coisas como: const level = ..., entity.level, etc se não for espanhol específico
        if (pat.source.includes('nivel') && (line.includes('this.level') || line.includes('p.level') || line.includes('level:') || line.includes('level =') || line.includes('level,'))) {
          // pode ser código, mas vamos checar se tem string na linha
        }
        hits.push({ line: idx + 1, text: line.trim() });
        break;
      }
    }
  });

  if (hits.length > 0) {
    console.log(`=== ${filePath} (${hits.length} ocorrências) ===`);
    hits.slice(0, 10).forEach(h => console.log(`  L${h.line}: ${h.text}`));
    if (hits.length > 10) console.log(`  ... e mais ${hits.length - 10} linhas.`);
  }
}

dirs.forEach(scanDir);
files.forEach(f => { if (fs.existsSync(f)) scanFile(f); });
