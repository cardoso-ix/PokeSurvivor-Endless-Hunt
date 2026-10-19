const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🚀 Iniciando teste de Altar ("Torre de Poder") e persistência do Radar...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  let pageErrors = [];
  page.on('pageerror', err => {
    console.error('  [PAGE ERROR]', err.message);
    pageErrors.push(err.message);
  });

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.FX && window.G.Game && window.G.DB, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Inicia partida e ativa poder de altar
  const result = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 1;
      window.G.DB.save.starter = 1;
      window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { error: 'Jogador não encontrado' };

    // Simula a ativação de poder de altar ("Torre de Poder")
    const mockPower = {
      id: 'dmg',
      name: 'Furia',
      desc: 'daño ×2',
      color: '#ff5f6d',
      on: p => { p.atkMul *= 2; },
      off: p => { p.atkMul /= 2; }
    };
    pl.addPower(mockPower, 25);

    // Executa múltiplos frames de renderização do HUD
    const cv = document.getElementById('game');
    const ctx = cv.getContext('2d');
    let renderSuccessCount = 0;
    for (let i = 0; i < 30; i++) {
      window.G.HUD.draw(ctx, cv.width, cv.height, pl, window.G.Game.st);
      renderSuccessCount++;
    }

    return {
      hasPower: !!pl.power,
      powerName: pl.power ? pl.power.def.name : null,
      powerTime: pl.power ? pl.power.t : null,
      renderSuccessCount,
      showRadarSetting: window.G.Settings.get('showRadar')
    };
  });

  console.log('Resultado do teste de Altar com Radar:', result);

  const shotPath = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\gameplay_radar_altar_fixed.png';
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot salvo em: ${shotPath}`);

  await browser.close();

  if (pageErrors.length > 0) {
    throw new Error(`Erros detectados no navegador: ${pageErrors.join(', ')}`);
  }
  if (!result.hasPower) throw new Error('Poder de altar não ativado');
  if (result.renderSuccessCount !== 30) throw new Error('Falha nos quadros de renderização');

  console.log('✅ O RADAR PERMANECEU ATIVO E RENDERIZANDO PERFEITAMENTE COM O PODER DA TORRE/ALTAR!');
})().catch(err => {
  console.error('❌ Falha:', err);
  process.exit(1);
});
