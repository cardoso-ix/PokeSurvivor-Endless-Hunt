const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    console.log('--- Iniciando Teste E2E de Missões Diárias e Semanais Expandidas ---');
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

    // Entrar como convidado
    await page.evaluate(() => {
      window.G.DB.playAsGuest();
      window.G.Flow.afterLogin();
      // Garantir parceiro
      window.G.DB.save.partner = 1;
      window.G.DB.save.owned = window.G.DB.save.owned || {};
      window.G.DB.save.owned[1] = { at: Date.now() };
    });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Verificar geração de missões via G.Progress.ensure
    console.log('2. Verificando quantidade e valores das missões...');
    const missionsData = await page.evaluate(() => {
      window.G.Progress.ensure(window.G.DB.save);
      const M = window.G.DB.save.missions;
      const defs = window.G.MissionDefs;

      const dailyDetails = M.daily.map(m => {
        const d = defs.BY[m.id];
        return {
          id: m.id,
          text: window.G.Progress.text(m),
          reward: d.reward
        };
      });

      const weeklyDetails = M.weekly.map(m => {
        const d = defs.BY[m.id];
        return {
          id: m.id,
          text: window.G.Progress.text(m),
          reward: d.reward
        };
      });

      return {
        dailyCount: M.daily.length,
        weeklyCount: M.weekly.length,
        dailyDetails,
        weeklyDetails
      };
    });

    console.log('Quantidade de diárias:', missionsData.dailyCount);
    console.log('Quantidade de semanais:', missionsData.weeklyCount);
    console.log('Exemplos de diárias:', JSON.stringify(missionsData.dailyDetails.slice(0, 3), null, 2));
    console.log('Exemplos de semanais:', JSON.stringify(missionsData.weeklyDetails.slice(0, 3), null, 2));

    if (missionsData.dailyCount !== 6) {
      throw new Error(`Esperado 6 missões diárias, obtido: ${missionsData.dailyCount}`);
    }
    if (missionsData.weeklyCount !== 5) {
      throw new Error(`Esperado 5 missões semanais, obtido: ${missionsData.weeklyCount}`);
    }

    // Verificar se as moedas das diárias estão altas (>= 3000)
    for (const d of missionsData.dailyDetails) {
      if (d.reward.coins < 3000) {
        throw new Error(`Recompensa da diária ${d.id} muito baixa: ${d.reward.coins}`);
      }
    }
    // Verificar se as moedas das semanais estão altas (>= 20000)
    for (const w of missionsData.weeklyDetails) {
      if (w.reward.coins < 20000) {
        throw new Error(`Recompensa da semanal ${w.id} muito baixa: ${w.reward.coins}`);
      }
    }
    console.log('✅ Validação de quantidades (6 diárias / 5 semanais) e recompensas massivas de moedas aprovada!');

    // 3. Testar a tela GoalsUI (Missões)
    console.log('3. Testando abertura e renderização da UI de Missões...');
    await page.evaluate(() => {
      window.G.GoalsUI.open('missions');
    });
    await new Promise(r => setTimeout(r, 800));

    const renderedCheck = await page.evaluate(() => {
      const allMissions = Array.from(document.querySelectorAll('#goals-body .mission'));
      const dailyTitles = Array.from(document.querySelectorAll('#goals-body .goals-h'));
      return {
        totalMissionElements: allMissions.length,
        sectionTitles: dailyTitles.map(el => el.innerText.replace(/\n+/g, ' · '))
      };
    });
    console.log('Renderização de Missões na UI:', renderedCheck);

    if (renderedCheck.totalMissionElements !== 11) { // 6 diárias + 5 semanais = 11 missões totais
      throw new Error(`Esperado 11 elementos de missão renderizados (6 diárias + 5 semanais), obtido: ${renderedCheck.totalMissionElements}`);
    }

    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_expanded_missions_ui.png' });
    console.log('Screenshot salva: test_expanded_missions_ui.png');

    // 4. Testar resgate de missão
    console.log('4. Testando resgate de recompensa de missão com moedas turbinadas...');
    const claimCheck = await page.evaluate(() => {
      const s = window.G.DB.save;
      const initialCoins = s.coins;
      const m = s.missions.daily[0];
      // Completar a missão artificialmente para testar o claim
      m.prog = m.goal;
      const def = window.G.MissionDefs.BY[m.id];
      const expectedRewardCoins = def.reward.coins;

      const ok = window.G.Progress.claim(m, false);
      return {
        claimed: ok,
        initialCoins,
        expectedRewardCoins,
        finalCoins: s.coins,
        diff: s.coins - initialCoins
      };
    });
    console.log('Resultado do claim:', claimCheck);

    if (!claimCheck.claimed || claimCheck.diff !== claimCheck.expectedRewardCoins) {
      throw new Error(`Falha no resgate de recompensa da missão: esperado ganho de ${claimCheck.expectedRewardCoins}, obtido: ${claimCheck.diff}`);
    }
    console.log(`✅ Resgate validado: +${claimCheck.diff} moedas creditadas instantaneamente!`);

    console.log('--- TODOS OS TESTES DE MISSÕES EXPANDIDAS PASSARAM COM SUCESSO! ---');
  } catch (err) {
    console.error('Falha no teste:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
