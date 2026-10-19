const fs = require('fs');

const SPANISH_TERMS = [
  'tiempo', 'daño', 'movimiento', 'movimientos', 'monedas', 'pantalla', 'volver', 
  'ronda', 'elegir', 'escoger', 'mejora ', 'mejoras ', 'comenzar', 'jugar',
  'velocidad', 'experiencia', 'enemigo', 'enemigos', 'partida actual', 
  'reiniciar partida', 'cada pokemon tiene', 'recompensa', 'desbloqueado', 
  'compañero', 'compañeros', 'daños', 'objetos', 'subir de nivel'
];

// Carrega o arquivo
const content = fs.readFileSync('js/core/i18n.js', 'utf8');

// Extrai o bloco TRANSLATIONS['pt-BR']
const ptBrBlockMatch = content.match(/'pt-BR':\s*\{([\s\S]*?)\n\s*\},?\s*'en-US'/);
if (!ptBrBlockMatch) {
  console.error("Não foi possível isolar TRANSLATIONS['pt-BR']");
  process.exit(1);
}

const ptContent = ptBrBlockMatch[1];
const lines = ptContent.split('\n');

console.log("=== AUDITORIA CIRÚRGICA DE ESPANHOL EM TRANSLATIONS['pt-BR'] ===");
let count = 0;
lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
  SPANISH_TERMS.forEach(term => {
    // Regex com word boundary
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(trimmed)) {
      // Exceções válidas em PT se houver
      console.log(`[L${idx + 1}] Detectado '${term}': ${trimmed}`);
      count++;
    }
  });
});

console.log(`Total de ocorrências suspeitas: ${count}`);
