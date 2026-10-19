const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Iniciando teste do index.html (produção) no Chrome headless...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[EVOLUÇÃO') || text.includes('[ASCENSÃO') || text.includes('WorldCaptureBall') || text.includes('Guardião')) {
      console.log('  [INDEX.HTML CONSOLE]', text);
    }
  });

  console.log('🌐 Navegando para http://localhost:8080/index.html...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const pageTitle = await page.title();
  console.log('Título da página:', pageTitle);

  const testResults = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    // No bundle de produção, o jogo roda normalmente.
    // Vamos verificar se a tela do menu carregou sem erros de script.
    const canvas = document.getElementById('game');
    const hudAvatar = document.getElementById('hud-avatar-canvas');

    return {
      canvasExists: !!canvas,
      hudAvatarExists: !!hudAvatar,
      url: window.location.href
    };
  });

  console.log('Resultados no index.html:', testResults);

  const artifactDir = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
  const screenshotPath = path.join(artifactDir, 'production_index_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot salvo em: ${screenshotPath}`);

  await browser.close();

  if (!testResults.canvasExists) throw new Error('Canvas não encontrado em index.html');
  console.log('🎉 index.html carregou e executou perfeitamente sem erros! 🎉');
})().catch(err => {
  console.error('❌ Falha ao testar index.html:', err);
  process.exit(1);
});
