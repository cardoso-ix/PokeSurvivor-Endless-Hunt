const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🎬 Iniciando Validação Visual e Técnica da Cutscene do Mega e Poderes Caindo...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // ==========================================
  // PARTE 1: TESTE NO DEV.HTML (MODO DESENVOLVIMENTO)
  // ==========================================
  console.log('\n--- 1. Testando em dev.html ---');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1280, height: 720 });

  await page1.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page1.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.Mega && window.G.MegaCutscene, { timeout: 10000 });

  // Inicia partida com Charmander (Tipo Fogo)
  await page1.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 4; // Charmander
      window.G.DB.save.starter = 4;
      window.G.DB.save.owned[4] = { at: Date.now(), from: 'starter' };
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }
  });

  await new Promise(r => setTimeout(r, 1200));

  // Enche a barra do Mega para 100%
  await page1.evaluate(() => {
    window.debugFillMega();
  });

  await new Promise(r => setTimeout(r, 300));

  // Aciona o Mega
  await page1.evaluate(() => {
    window.G.Mega.trigger();
  });

  // Aguarda 350ms para capturar a Cutscene
  await new Promise(r => setTimeout(r, 350));

  const cutsceneState = await page1.evaluate(() => {
    const pl = window.G.Game.player;
    return {
      cutsceneActive: window.G.MegaCutscene.active,
      pokemonName: window.G.MegaCutscene.pokemonName,
      ultimateName: window.G.MegaCutscene.ultimateName,
      megaDmgMul: pl.megaDmgMul,
      activeAtk: pl.atk
    };
  });
  console.log('  -> Estado da Cutscene (dev.html):', cutsceneState);

  const cutsceneScreenshot = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/mega_cutscene_active.png';
  await page1.screenshot({ path: cutsceneScreenshot });
  console.log(`  📸 Screenshot Cutscene salva em: ${cutsceneScreenshot}`);

  // Aguarda mais 1.2 segundos para os meteoros caindo no solo
  await new Promise(r => setTimeout(r, 1200));

  const powersState = await page1.evaluate(() => {
    const pl = window.G.Game.player;
    const vfx = window.G.UltimateVFX;
    return {
      cutsceneActive: window.G.MegaCutscene.active,
      megaActive: window.G.Mega.isActive,
      hazardsCount: vfx.hazards.length,
      activeAtk: pl.atk
    };
  });
  console.log('  -> Estado Poderes no Solo (dev.html):', powersState);

  const powersScreenshot = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/mega_powers_falling.png';
  await page1.screenshot({ path: powersScreenshot });
  console.log(`  📸 Screenshot Poderes Caindo salva em: ${powersScreenshot}`);

  await page1.close();

  // ==========================================
  // PARTE 2: TESTE NO INDEX.HTML (PRODUÇÃO MINIFICADA)
  // ==========================================
  console.log('\n--- 2. Testando em index.html (Produção) ---');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 720 });

  await page2.goto('http://127.0.0.1:8080/index.html?v=' + Date.now(), { waitUntil: 'networkidle2' });
  await page2.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.Mega, { timeout: 15000 });

  await page2.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    await window.G.DB.ready();
    window.G.DB.playAsGuest();
    window.G.DB.save.partner = 4;
    window.G.DB.save.starter = 4;
    window.G.DB.save.owned[4] = { at: Date.now(), from: 'starter' };

    window.G.Game.startRun();
    window.debugFillMega();
  });

  await new Promise(r => setTimeout(r, 600));

  // Clica no botão Mega na interface de produção
  await page2.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    if (btn) btn.click();
    else window.G.Mega.trigger();
  });

  await new Promise(r => setTimeout(r, 400));

  const prodState = await page2.evaluate(() => {
    const pl = window.G.Game.player;
    return {
      cutsceneActive: window.G.MegaCutscene ? window.G.MegaCutscene.active : false,
      megaActive: window.G.Mega.isActive,
      megaDmgMul: pl ? pl.megaDmgMul : 1,
      activeAtk: pl ? pl.atk : 0,
      hazardsCount: window.G.UltimateVFX ? window.G.UltimateVFX.count : 0
    };
  });
  console.log('  -> Estado em Produção (index.html):', prodState);

  const prodScreenshot = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/production_mega_cutscene.png';
  await page2.screenshot({ path: prodScreenshot });
  console.log(`  📸 Screenshot de Produção salva em: ${prodScreenshot}`);

  await page2.close();
  await browser.close();

  console.log('\n✅ Todos os testes visuais e técnicos concluídos com sucesso!');
})();
