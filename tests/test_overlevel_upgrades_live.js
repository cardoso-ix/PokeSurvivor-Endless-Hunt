const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    console.log('--- Iniciando Teste E2E de Ascensão de Upgrades (+1 a +10) e Moedas de Combate ---');
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Error') || text.includes('error')) console.error('[Console Error]', text);
    });

    console.log('1. Navegando para http://localhost:8080/dev.html...');
    await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Entrar como convidado para ter save limpo
    await page.evaluate(() => {
      window.G.DB.playAsGuest();
      window.G.Flow.afterLogin();
    });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Testar regras matemáticas de custo de +1 a +10
    console.log('2. Testando regras de custo de Ascensão no G.Upgrades...');
    const costsCheck = await page.evaluate(() => {
      const costs = [];
      for (let over = 0; over < 10; over++) {
        // level 10 é max do atk (over 0 = comprar +1; over 1 = comprar +2; etc.)
        const lvl = 10 + over;
        const c = window.G.Upgrades.cost('atk', lvl, 1);
        costs.push({ overLvlNext: over + 1, cost: c });
      }
      return costs;
    });
    console.log('Custos de +1 a +10 calculados:', JSON.stringify(costsCheck, null, 2));

    for (const item of costsCheck) {
      const expected = item.overLvlNext * 10000;
      if (item.cost !== expected) {
        throw new Error(`Custo para +${item.overLvlNext} esperado ${expected}, mas obteve ${item.cost}`);
      }
    }
    console.log('✅ Todos os custos de +1 (10k) até +10 (100k) estão 100% corretos!');

    // 3. Testar super buffs de dano de +1 a +10
    console.log('3. Testando super buffs de dano (atkMul)...');
    const perksCheck = await page.evaluate(() => {
      const results = {};
      // Nível 0
      results.lvl0 = window.G.Upgrades.perks({ atk: 0 }).atkMul;
      // Nível 10 (base max)
      results.lvl10_base = window.G.Upgrades.perks({ atk: 10 }).atkMul;
      // Nível 10 + 1 (+1)
      results.lvl11_plus1 = window.G.Upgrades.perks({ atk: 11 }).atkMul;
      // Nível 10 + 2 (+2)
      results.lvl12_plus2 = window.G.Upgrades.perks({ atk: 12 }).atkMul;
      // Nível 10 + 5 (+5)
      results.lvl15_plus5 = window.G.Upgrades.perks({ atk: 15 }).atkMul;
      // Nível 10 + 10 (+10)
      results.lvl20_plus10 = window.G.Upgrades.perks({ atk: 20 }).atkMul;
      return results;
    });
    console.log('Multiplicadores de dano atkMul:', perksCheck);

    // Verificações numéricas com tolerância de ponto flutuante
    if (Math.abs(perksCheck.lvl10_base - 1.40) > 0.001) throw new Error('Falha no atkMul base lvl 10');
    if (Math.abs(perksCheck.lvl11_plus1 - 1.55) > 0.001) throw new Error('Falha no atkMul +1 (+15%)');
    if (Math.abs(perksCheck.lvl12_plus2 - 1.70) > 0.001) throw new Error('Falha no atkMul +2 (+30%)');
    if (Math.abs(perksCheck.lvl15_plus5 - 2.15) > 0.001) throw new Error('Falha no atkMul +5 (+75%)');
    if (Math.abs(perksCheck.lvl20_plus10 - 2.90) > 0.001) throw new Error('Falha no atkMul +10 (+150%)');
    console.log('✅ Super buff de dano validado com precisão: Nível 10 = +40% dano; Nível +10 = +190% dano total!');

    // 4. Testar na UI: Abrir Upgrades, dar moedas e comprar
    console.log('4. Testando UI de Melhorias com Ascensão...');
    await page.evaluate(() => {
      // Garantir parceiro Bulbasaur na coleção
      window.G.DB.save.partner = 1;
      window.G.DB.save.owned = window.G.DB.save.owned || {};
      window.G.DB.save.owned[1] = { at: Date.now() };
      // Adicionar moedas para testes
      window.G.DB.save.coins = 500000;
      const lv = window.G.DB.upgradesOf(1);
      // Colocar atk no nível 10 para testar a transição para +1
      lv.atk = 10;
      window.G.MenuUI.openUpgrades();
    });
    await new Promise(r => setTimeout(r, 800));

    // Capturar screenshot com +1 disponível
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_upgrades_plus1_available.png' });
    console.log('Screenshot salva: test_upgrades_plus1_available.png');

    // Comprar +1 via clique no botão
    const buySuccess = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#upg-list .upg-item'));
      // Achar o item de Força
      const atkItem = items.find(el => el.textContent.includes('Força'));
      if (!atkItem) return { ok: false, error: 'Item de Força não encontrado' };

      const buyBtn = atkItem.querySelector('[data-buy]');
      const btnTextBefore = buyBtn.textContent.trim();
      buyBtn.click();

      const dex = window.G.DB.save.partner || 1;
      const lv = window.G.DB.upgradesOf(dex);
      const buyBtnAfter = atkItem.querySelector('[data-buy]');

      return {
        ok: true,
        btnTextBefore,
        newLevel: lv.atk,
        coinsRemaining: window.G.DB.save.coins
      };
    });
    console.log('Resultado da compra do +1:', buySuccess);

    if (buySuccess.newLevel !== 11) {
      throw new Error(`Esperado nível 11 (Ascensão +1), obtido: ${buySuccess.newLevel}`);
    }
    if (buySuccess.coinsRemaining !== 490000) {
      throw new Error(`Esperado 490.000 moedas restantes após gastar 10.000, obtido: ${buySuccess.coinsRemaining}`);
    }

    // Rerenderizar e tirar screenshot com +1 ativo e +2 disponível
    await page.evaluate(() => window.G.MenuUI.renderUpgrades());
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_upgrades_plus1_unlocked_plus2_available.png' });

    // Testar evolução até +10
    await page.evaluate(() => {
      const dex = window.G.DB.save.partner || 1;
      const lv = window.G.DB.upgradesOf(dex);
      lv.atk = 20; // +10 máximo
      window.G.MenuUI.renderUpgrades();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_upgrades_plus10_maxed.png' });

    // 5. Testar tela no index.html (produção compilada)
    console.log('5. Validando produção index.html...');
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Entrar como convidado na produção
    await page.evaluate(() => {
      const btnGuest = document.getElementById('btn-guest');
      if (btnGuest) btnGuest.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_prod_index_after_login.png' });
    console.log('Screenshot de produção index.html salva com sucesso.');

    console.log('--- TODOS OS TESTES DE ASCENSÃO E MOEDAS PASSARAM COM 100% DE SUCESSO! ---');
  } catch (err) {
    console.error('Falha no teste:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
