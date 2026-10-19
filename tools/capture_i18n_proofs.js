const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const brainDir = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  console.log('Acessando dev.html: http://localhost:8080/dev.html');
  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 1000));

  // 1. Screenshot: Tela de Login / Início
  const p1 = path.join(brainDir, 'proof_i18n_login.png');
  await page.screenshot({ path: p1 });
  console.log('Salvo:', p1);

  // Inicializar dados de teste como convidado
  await page.evaluate(() => {
    const boot = document.getElementById('boot');
    if (boot) boot.remove();
    const tap = document.getElementById('tap-start');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      window.G.DB.playAsGuest();
      window.G.DB.save.coins = 99999;
      window.G.DB.save.partner = 1;
      window.G.DB.save.starter = 1;
      window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };
    }
  });

  await new Promise(r => setTimeout(r, 800));

  // 2. Abrir Tela de Quiz / Teste de Personalidade
  await page.evaluate(() => {
    if (window.G && window.G.UI) {
      window.G.UI.show('scr-test');
      if (window.G.PersonalityTest && window.G.PersonalityTest.start) {
        window.G.PersonalityTest.start();
      }
    }
  });
  await new Promise(r => setTimeout(r, 800));

  const p2 = path.join(brainDir, 'proof_i18n_quiz.png');
  await page.screenshot({ path: p2 });
  console.log('Salvo:', p2);

  // 3. Abrir Tela de Configurações
  await page.evaluate(() => {
    if (window.G && window.G.UI) {
      window.G.UI.show('scr-settings');
      if (window.G.SettingsUI && window.G.SettingsUI.show) {
        window.G.SettingsUI.show('ctl');
      }
    }
  });
  await new Promise(r => setTimeout(r, 800));

  const p3 = path.join(brainDir, 'proof_i18n_settings_ctl.png');
  await page.screenshot({ path: p3 });
  console.log('Salvo:', p3);

  // 4. Abrir Tela de Upgrades / Melhorias
  await page.evaluate(() => {
    if (window.G && window.G.UI) {
      window.G.UI.show('scr-upgrades');
    }
  });
  await new Promise(r => setTimeout(r, 800));

  const p4 = path.join(brainDir, 'proof_i18n_upgrades.png');
  await page.screenshot({ path: p4 });
  console.log('Salvo:', p4);

  // 5. Abrir Tela de Coleção / Pokédex
  await page.evaluate(() => {
    if (window.G && window.G.UI) {
      window.G.UI.show('scr-dex');
    }
  });
  await new Promise(r => setTimeout(r, 800));

  const p5 = path.join(brainDir, 'proof_i18n_dex.png');
  await page.screenshot({ path: p5 });
  console.log('Salvo:', p5);

  // 6. Abrir Tela de Game Over
  await page.evaluate(() => {
    if (window.G && window.G.RunUI) {
      window.G.RunUI.showOver({
        dead: true,
        time: 145,
        level: 8,
        kills: 82,
        bosses: 1,
        coins: 240,
        breakdown: '82 inimigos + 1 chefe',
        moves: [{ id: 'tackle', name: 'Investida', lvl: 3 }],
        caught: []
      }, () => {});
    }
  });
  await new Promise(r => setTimeout(r, 800));

  const p6 = path.join(brainDir, 'proof_i18n_gameover.png');
  await page.screenshot({ path: p6 });
  console.log('Salvo:', p6);

  await browser.close();
  console.log('✅ Todas as capturas em pt-BR foram salvas com sucesso!');
}

run().catch(err => {
  console.error('Erro na captura:', err);
  process.exit(1);
});
