const fs = require('fs');

const SPANISH_WORDS = [
  'tiempo', 'daño', 'daños', 'movimiento', 'movimientos', 'monedas', 'pantalla', 
  'volver', 'ronda', 'elegir', 'escoger', 'comenzar', 'jugar', 'velocidad', 
  'experiencia', 'enemigo', 'enemigos', 'compañero', 'compañeros', 'objetos',
  'apodo', 'cerrar', 'contraseña', 'nombre', 'olvidaste', 'unirme', 'apoyar'
];

['index.html', 'dev.html'].forEach(file => {
  console.log(`\n=== VERIFICANDO ${file} ===`);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((l, idx) => {
    // ignora head inicial e footer de scripts
    if (idx < 50 || idx > 678) return;
    if (l.includes('class="credits-line"') || l.includes('scr-legal') || l.includes('Aviso legal')) return;
    SPANISH_WORDS.forEach(w => {
      const re = new RegExp(`\\b${w}\\b`, 'i');
      if (re.test(l)) {
        console.log(`L${idx+1} [${w}]: ${l.trim()}`);
      }
    });
  });
});
