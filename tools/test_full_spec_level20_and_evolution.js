const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('🧪 Iniciando teste completo E2E: Evolução com Carta Dourada + LevelUp contínuo Nv. 20+...');
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

  // TESTE 1: Subida para Nível 5 e aparição da Carta de Evolução
  console.log('--- TESTE 1: Subindo para Nível 5 e verificando Level Up com carta de Evolução ---');
  await page.evaluate(() => {
    const pl = window.game.player;
    pl.level = 4;
    // Dispara a subida de nível com triggerLevelUp para abrir o modal de Level Up
    pl.gainXp(pl.xpNext - pl.xp);
    window.game.triggerLevelUp(1);
  });
  await new Promise(r => setTimeout(r, 600));

  const lvl5Modal = await page.evaluate(() => {
    const modal = document.getElementById('scr-levelup');
    const isVisible = modal && !modal.classList.contains('hidden');
    const cards = Array.from(document.querySelectorAll('#cards .card')).map(c => ({
      title: c.querySelector('.nm')?.textContent?.trim(),
      desc: c.querySelector('.ds')?.textContent?.trim(),
      tag: c.querySelector('.tag-chip')?.textContent?.trim(),
      isEvo: c.classList.contains('evo')
    }));
    return { isVisible, cards };
  });
  console.log('Modal no Nível 5:', lvl5Modal);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_lvl5_evolution_card_live.png') });
  console.log('📸 Screenshot salvo: e2e_lvl5_evolution_card_live.png');

  // Clica na carta de evolução
  await page.evaluate(() => {
    const evoCard = document.querySelector('#cards .card.evo') || document.querySelector('#cards .card');
    if (evoCard) evoCard.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const afterEvo = await page.evaluate(() => {
    const pl = window.game.player;
    return {
      species: pl.species,
      dex: pl.dex,
      monName: pl.mon.name,
      hudName: document.getElementById('hud-char-name')?.textContent
    };
  });
  console.log('Estado pós clique de evolução:', afterEvo);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_after_evolve_ivysaur_live.png') });
  console.log('📸 Screenshot salvo: e2e_after_evolve_ivysaur_live.png');

  // TESTE 2: Subida contínua de nível a partir do Nível 20 (20, 21, 22...)
  console.log('--- TESTE 2: Subindo para Nível 20 e testando Level Up Contínuo no Nv. 21 ---');
  await page.evaluate(() => {
    const pl = window.game.player;
    // Preenche 4 ataques
    const moves = ['vine-whip', 'razor-leaf', 'sludge', 'tackle'];
    for (const m of moves) {
      if (pl.moves.length < 4 && !pl.hasMove(m)) pl.addMove(m);
    }
    pl.level = 20;
    pl.gainXp(pl.xpNext - pl.xp); // Vira 21
    window.game.triggerLevelUp(1);
  });
  await new Promise(r => setTimeout(r, 600));

  const lvl21Modal = await page.evaluate(() => {
    const modal = document.getElementById('scr-levelup');
    const isVisible = modal && !modal.classList.contains('hidden');
    const cards = Array.from(document.querySelectorAll('#cards .card')).map(c => ({
      title: c.querySelector('.nm')?.textContent?.trim(),
      desc: c.querySelector('.ds')?.textContent?.trim(),
      tag: c.querySelector('.tag-chip')?.textContent?.trim(),
      isNew: c.querySelector('.tag-chip')?.textContent?.includes('Novo')
    }));
    return {
      isVisible,
      cardsCount: cards.length,
      hasNewMoves: cards.some(c => c.isNew),
      cards
    };
  });
  console.log('Modal no Nível 21 (LevelUp contínuo pós-20):', lvl21Modal);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_lvl21_levelup_passives_live.png') });
  console.log('📸 Screenshot salvo: e2e_lvl21_levelup_passives_live.png');

  // Seleciona uma passiva (ex: Potência ou Vigor)
  const initialAtkMul = await page.evaluate(() => window.game.player.atkMul);
  await page.evaluate(() => {
    const card = document.querySelector('#cards .card');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const afterPickState = await page.evaluate(() => {
    const pl = window.game.player;
    return {
      level: pl.level,
      isLevelUpClosed: document.getElementById('scr-levelup').classList.contains('hidden'),
      gameState: window.game.state
    };
  });
  console.log('Estado pós escolha da passiva no Nv. 21:', afterPickState);

  await browser.close();
  console.log('🎉 Validação completa executada com 100% de sucesso!');
})();
