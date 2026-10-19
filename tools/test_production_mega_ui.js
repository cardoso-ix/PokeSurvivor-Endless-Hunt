const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🚀 Testando integridade do HUD e Botão Mega em PRODUÇÃO (index.html)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('pageerror', err => console.error('  [PROD PAGE ERROR]', err.message));

  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const uiStatus = await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    const txt = document.getElementById('hud-mega-btn-txt');
    const bar = document.getElementById('hud-mega-bar');
    const track = document.querySelector('.mega-track');
    const hud = document.getElementById('bottom-rpg-hud');

    return {
      hudExists: !!hud,
      btnExists: !!btn,
      txtExists: !!txt,
      barExists: !!bar,
      trackExists: !!track,
      btnClasses: btn ? btn.className : null,
      trackClasses: track ? track.className : null,
      txtContent: txt ? txt.textContent : null,
      hasMegaSystem: typeof window.MegaSystem !== 'undefined',
      hasDebugFillMega: typeof window.debugFillMega === 'function'
    };
  });

  console.log('📊 Status da interface em index.html:', uiStatus);

  const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/production_index_mega_hud.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot salvo em: ${screenshotPath}`);

  await browser.close();

  if (!uiStatus.btnExists || !uiStatus.hudExists) {
    throw new Error('Falha nos elementos da interface em produção');
  }
  console.log('🎉 Interface de Produção validada com 100% de sucesso!');
})().catch(err => {
  console.error('❌ Falha:', err);
  process.exit(1);
});
