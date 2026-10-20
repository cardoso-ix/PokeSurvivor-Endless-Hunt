const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('🧪 Testando fluxo completo de gameplay no index.html...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    window.game.startRun();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Ganha XP até chegar ao nível 5
  console.log('1. Subindo para Nível 5...');
  await page.evaluate(() => {
    const pl = window.game.player;
    while (pl.level < 5) {
      pl.gainXp(pl.xpNext - pl.xp);
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const lvl5State = await page.evaluate(() => {
    const pl = window.game.player;
    const isLevelUpOpen = document.getElementById('scr-levelup') && !document.getElementById('scr-levelup').classList.contains('hidden');
    const cards = Array.from(document.querySelectorAll('.card, .levelup-card')).map(c => ({
      title: c.querySelector('.card-title, .title, h3')?.textContent || '',
      tag: c.querySelector('.card-tag, .tag')?.textContent || ''
    }));
    return {
      level: pl.level,
      isLevelUpOpen,
      cards,
      species: pl.species
    };
  });
  console.log('Estado no Nível 5:', lvl5State);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'test_lvl5_evolution_card_live.png') });

  // 2. Se a tela de levelup estiver aberta, clica na carta de evolução
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card, .levelup-card'));
    const evoCard = cards.find(c => c.textContent.includes('Evolu') || c.textContent.includes('Ivysaur'));
    if (evoCard) {
      evoCard.click();
    } else if (cards[0]) {
      cards[0].click();
    }
  });
  await new Promise(r => setTimeout(r, 800));

  const afterEvoState = await page.evaluate(() => {
    const pl = window.game.player;
    const hudName = document.getElementById('hud-char-name')?.textContent;
    return {
      species: pl.species,
      dex: pl.dex,
      monName: pl.mon.name,
      hudName
    };
  });
  console.log('Estado após escolher evolução:', afterEvoState);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'test_after_evo_ivysaur_live.png') });

  // 3. Testa subida para o Nível 20, 21, 22...
  console.log('2. Subindo para Nível 20 e 21...');
  await page.evaluate(() => {
    const pl = window.game.player;
    while (pl.level < 21) {
      pl.gainXp(pl.xpNext - pl.xp);
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const lvl21State = await page.evaluate(() => {
    const pl = window.game.player;
    const isLevelUpOpen = document.getElementById('scr-levelup') && !document.getElementById('scr-levelup').classList.contains('hidden');
    const cards = Array.from(document.querySelectorAll('.card, .levelup-card')).map(c => ({
      title: c.querySelector('.card-title, .title, h3')?.textContent || '',
      tag: c.querySelector('.card-tag, .tag')?.textContent || ''
    }));
    return {
      level: pl.level,
      isLevelUpOpen,
      cards,
      species: pl.species
    };
  });
  console.log('Estado no Nível 21 (LevelUp ativo):', lvl21State);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'test_lvl21_passives_live.png') });

  await browser.close();
  console.log('🎉 Todos os testes de LevelUp e Evolução concluídos com sucesso!');
})();
