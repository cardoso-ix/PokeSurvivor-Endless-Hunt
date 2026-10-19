const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Iniciando teste no navegador Chrome via Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[EVOLUÇÃO') || text.includes('[ASCENSÃO') || text.includes('Error')) {
      console.log('  [BROWSER CONSOLE]', text);
    }
  });

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Remove tela de tapstart e inicia partida com Bulbasaur se necessário
  const setupResult = await page.evaluate(async () => {
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
    return {
      hasGame: !!(window.G && window.G.Game),
      playerSpecies: pl ? pl.species : null,
      playerLevel: pl ? pl.level : null
    };
  });
  console.log('Estado inicial do jogo:', setupResult);
  await new Promise(r => setTimeout(r, 1000));

  // Testa evolução automática no Nível 5
  const stepLv5 = await page.evaluate(() => {
    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { error: 'Jogador não encontrado' };

    // Define nível para 5
    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(5);
    } else {
      pl.level = 5;
      pl.checkEvolutionMilestones();
    }

    const cards = window.G.LevelUp ? window.G.LevelUp.candidates(pl) : [];
    const evoCards = cards.filter(c => c.type === 'EVOLUTION' || (c.key && c.key.startsWith('evo_mon:')));

    return {
      level: pl.level,
      species: pl.species,
      monName: pl.mon.name,
      totalCards: cards.length,
      evoCardsCount: evoCards.length,
      sampleCardTitles: cards.slice(0, 3).map(c => c.title)
    };
  });
  console.log('Resultado Nível 5 (Ivysaur automático):', stepLv5);

  // Testa evolução automática no Nível 12
  const stepLv12 = await page.evaluate(() => {
    const pl = window.G && window.G.Game && window.G.Game.player;
    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(12);
    } else {
      pl.level = 12;
      pl.checkEvolutionMilestones();
    }

    const cards = window.G.LevelUp ? window.G.LevelUp.candidates(pl) : [];
    const evoCards = cards.filter(c => c.type === 'EVOLUTION' || (c.key && c.key.startsWith('evo_mon:')));

    return {
      level: pl.level,
      species: pl.species,
      monName: pl.mon.name,
      totalCards: cards.length,
      evoCardsCount: evoCards.length,
      sampleCardTitles: cards.slice(0, 3).map(c => c.title)
    };
  });
  console.log('Resultado Nível 12 (Venusaur automático):', stepLv12);

  // Testa ascensão no Nível 21
  const stepLv21 = await page.evaluate(() => {
    const pl = window.G && window.G.Game && window.G.Game.player;
    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(21);
    } else {
      pl.level = 21;
      pl.checkEvolutionMilestones();
    }

    return {
      level: pl.level,
      species: pl.species,
      isMegaAscended: pl.isMegaAscended,
      atkMul: pl.atkMul,
      ascensionTitle: pl.ascensionTitle
    };
  });
  console.log('Resultado Nível 21 (Mega Ascensão):', stepLv21);

  // Screenshot de validação visual
  const shotPath = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\gameplay_auto_evolution.png';
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot salvo em: ${shotPath}`);

  await browser.close();

  // Verificações
  if (stepLv5.species !== 'ivysaur') throw new Error(`Esperado ivysaur no nível 5, obteve ${stepLv5.species}`);
  if (stepLv5.evoCardsCount !== 0) throw new Error(`Cartas de evolução encontradas no pool: ${stepLv5.evoCardsCount}`);
  if (stepLv12.species !== 'venusaur') throw new Error(`Esperado venusaur no nível 12, obteve ${stepLv12.species}`);
  if (stepLv12.evoCardsCount !== 0) throw new Error(`Cartas de evolução encontradas no pool: ${stepLv12.evoCardsCount}`);
  if (!stepLv21.isMegaAscended) throw new Error('Mega Ascensão falhou no nível 21');

  console.log('\n✅ TODOS OS TESTES NO NAVEGADOR FORAM APROVADOS COM SUCESSO TOTAL!');
})().catch(err => {
  console.error('❌ Falha no teste do navegador:', err);
  process.exit(1);
});
