const fs = require('fs');
const path = require('path');

// Palavras espanholas indicativas de texto não traduzido
const spanishMarkers = [
  'daño', 'dañ', 'tiempo de recarga', 'recarga', 'pantalla', 'elegir', 'escoger', 'volver',
  'bloqueado', 'bloqueada', 'desbloqueado', 'desbloqueada', 'victoria', 'derrota', 'compañero',
  'compañeros', 'amigos', 'ajustes', 'habilidad', 'habilidades', 'rango', 'esquivar', 'enemigo',
  'enemigos', 'jefe', 'jefes', 'falla', 'salud', 'recompensa', 'recompensas', 'conseguir',
  'obtener', 'cerrar', 'abrir', 'continuar', 'pausa', 'reanudar', 'reiniciar', 'salir', 'sonido',
  'música', 'efectos', 'apodo', 'contraseña', 'correo', 'iniciar sesión', 'registrarse',
  'mazmorra', 'marea', 'salvaje', 'apareció', 'anda cerca', 'ha caído', 'has caído', '¡', '¿',
  'mejoras', 'mejora', 'monedas', 'oro', 'subir', 'nivel', 'niveles', 'experiencia', 'velocidad',
  'movimiento', 'movimientos', 'ronda', 'rondas', 'jugar', 'comenzar'
];

function checkString(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  if (s.length < 3) return false;
  // Se for apenas um identificador camelCase ou snake_case curto sem espaços
  if (/^[a-zA-Z0-9_\-\.\#\/]+$/.test(s) && !s.includes(' ')) return false;

  const lower = s.toLowerCase();
  for (const m of spanishMarkers) {
    if (m === '¡' || m === '¿') {
      if (s.includes(m)) return m;
    } else {
      // Regex de palavra inteira
      const re = new RegExp(`(^|[^a-záéíóúüñ])${m}([^a-záéíóúüñ]|$)`, 'i');
      if (re.test(lower)) {
        // Verificar se é palavra igual em português (ex: amigos, nivel se for nível, som, etc)
        // Se for idêntica e sem contexto espanhol, filtrar
        if (m === 'amigos' && !lower.includes('añadir') && !lower.includes('jugar con')) continue;
        if (m === 'bloqueado' || m === 'desbloqueado') {
          // pode ser pt-br também!
          continue;
        }
        if (m === 'derrota' || m === 'victoria') {
          if (m === 'derrota') continue; // derrota existe em pt
        }
        if (m === 'pausa' || m === 'continuar' || m === 'abrir' || m === 'cerrar') {
          if (m === 'pausa' || m === 'continuar' || m === 'abrir') continue;
        }
        if (m === 'experiencia' && !lower.includes('nivel') && !lower.includes('daño')) {
          // Em pt é experiência com acento
        }
        return m;
      }
    }
  }
  return false;
}

const results = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Ignorar comentários simples de código
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    
    // Extrair strings literais ou textos HTML
    const strRegex = /(["'`])((?:\\.|[^\\])*?)\1/g;
    let match;
    while ((match = strRegex.exec(line)) !== null) {
      const val = match[2];
      const found = checkString(val);
      if (found) {
        results.push({ file: filePath, line: idx + 1, marker: found, text: val.trim() });
      }
    }

    // Se for HTML, checar texto entre tags >...<
    if (filePath.endsWith('.html')) {
      const htmlTextRegex = />([^<]+)</g;
      let hMatch;
      while ((hMatch = htmlTextRegex.exec(line)) !== null) {
        const val = hMatch[1].trim();
        const found = checkString(val);
        if (found) {
          results.push({ file: filePath, line: idx + 1, marker: found, text: val });
        }
      }
    }
  });
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'brain') {
        walk(fullPath);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) {
        // Ignorar bundles ou bibliotecas de terceiros
        if (!fullPath.includes('min.js') && !fullPath.includes('bundle') && !fullPath.includes('libs') && !fullPath.includes('lang-en.js')) {
          scanFile(fullPath);
        }
      }
    }
  }
}

walk('js');
scanFile('index.html');
scanFile('dev.html');

console.log(`Encontradas ${results.length} ocorrências suspeitas.`);
const grouped = {};
results.forEach(r => {
  if (!grouped[r.file]) grouped[r.file] = [];
  grouped[r.file].push(r);
});

for (const [f, hits] of Object.entries(grouped)) {
  console.log(`\n📄 ${f} (${hits.length}):`);
  hits.forEach(h => {
    console.log(`  L${h.line} [${h.marker}]: "${h.text.substring(0, 80)}"`);
  });
}
