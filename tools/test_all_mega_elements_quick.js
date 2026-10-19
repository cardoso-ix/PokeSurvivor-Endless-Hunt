const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🧪 Testando identificação dinâmica de múltiplos elementos no Mega...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.Mega, { timeout: 10000 });

  const starters = [
    { dex: 1, name: 'Bulbasaur', expected: 'grass' },
    { dex: 7, name: 'Squirtle', expected: 'water' },
    { dex: 25, name: 'Pikachu', expected: 'electric' },
    { dex: 92, name: 'Gastly', expected: 'ghost' }
  ];

  for (const s of starters) {
    const result = await page.evaluate(async (mon) => {
      document.querySelector('.tapstart')?.remove();
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = mon.dex;
      window.G.DB.save.starter = mon.dex;
      window.G.DB.save.owned[mon.dex] = { at: Date.now(), from: 'starter' };

      window.G.Game.startRun();
      window.debugFillMega();

      const btn = document.getElementById('hud-mega-btn');
      if (btn) btn.click();

      const mega = window.G.Mega;
      const pl = window.G.Game.player;

      return {
        starter: mon.name,
        activeElement: mega.currentElement,
        isActive: mega.isActive,
        playerSpecies: pl.species,
        playerTypes: pl.types
      };
    }, s);

    console.log(`  -> ${s.name} (Dex ${s.dex}):`, result);
    if (result.activeElement !== s.expected) {
      console.error(`❌ ERRO: Elemento esperado '${s.expected}', obtido: '${result.activeElement}'`);
      process.exit(1);
    }
    // Pausa rápida entre testes
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('✅ TODOS OS ELEMENTOS TESTADOS FORAM IDENTIFICADOS CORRETAMENTE!');
  await browser.close();
})();
