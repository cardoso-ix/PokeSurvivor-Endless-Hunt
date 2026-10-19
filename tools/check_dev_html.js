const fs = require('fs');

function checkFile(fileName) {
  const content = fs.readFileSync(fileName, 'utf8');
  const lines = content.split('\n');
  const hits = [];

  lines.forEach((line, idx) => {
    // 1. Textos entre tags
    const textMatches = line.match(/>([^<]+)</g);
    if (textMatches) {
      for (const m of textMatches) {
        const val = m.replace(/[><]/g, '').trim();
        if (val && val.length > 2) {
          if (/\b(daño|tiempo|elegir|escoge|escoger|volver|pantalla|mejora|mejoras|compañero|monedas|jugar|partida|juegos|cerrar|iniciar|ajustes)\b/i.test(val) || /[¿¡]/.test(val)) {
            hits.push({ line: idx + 1, type: 'text', val });
          }
        }
      }
    }

    // 2. Atributos
    const attrRegex = /(placeholder|title|aria-label)="([^"]+)"/g;
    let aMatch;
    while ((aMatch = attrRegex.exec(line)) !== null) {
      const val = aMatch[2].trim();
      if (/\b(daño|tiempo|elegir|escoge|escoger|volver|pantalla|mejora|mejoras|compañero|monedas|jugar|partida|juegos|cerrar|iniciar|ajustes)\b/i.test(val) || /[¿¡]/.test(val)) {
        hits.push({ line: idx + 1, type: aMatch[1], val });
      }
    }
  });

  console.log(`=== ${fileName} (${hits.length} ocorrências) ===`);
  hits.forEach(h => console.log(`  L${h.line} [${h.type}]: ${h.val}`));
}

checkFile('dev.html');
