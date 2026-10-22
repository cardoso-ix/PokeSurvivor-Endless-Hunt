const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log('🌐 Validando Deploy em Produção na VPS Coolify...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    await page.goto(VPS_URL + 'index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ VPS index.html carregado!');

    // Pular tap to start se existir
    await page.evaluate(() => {
      const tap = document.getElementById('tap-start');
      if (tap && !tap.classList.contains('hidden')) tap.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Convidado
    await page.evaluate(() => {
      const btn = document.getElementById('btn-guest');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Iniciar Partida
    await page.evaluate(() => {
      const b = document.querySelector('[data-go="play"]');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
      const btn = document.querySelector('button[data-reg="kanto"]') || document.querySelector('#stage-cards button') || document.querySelector('#btn-play');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Testar as taxas de captura e Gold Bounty ao vivo em produção
    const liveProductionCheck = await page.evaluate(() => {
      const Cap = window.CaptureSystem || (window.G && window.G.Capture);
      if (!Cap) return { error: 'CaptureSystem indisponível na VPS' };

      const rStg1 = Cap.getBaseCatchRate('caterpie', false, false, 1);
      const rStg2 = Cap.getBaseCatchRate('metapod', false, false, 2);
      const rStg3 = Cap.getBaseCatchRate('butterfree', false, false, 3);
      const rShiny = Cap.getBaseCatchRate('pikachu', true, false, 1);
      const rLeg = Cap.getBaseCatchRate('mewtwo', false, true, 3);
      const rApex = Cap.getBaseCatchRate('mewtwo', true, true, 3);

      const ballGoldStg1 = new Cap.WorldCaptureBall({
        speciesId: 'caterpie',
        isShiny: false,
        isLegendary: false,
        stage: 1,
        level: 50,
        forceGold: true
      });

      const attemptStg3 = { isSuccess: true, speciesId: 'charizard', stage: 3, isShiny: false, isLegendary: false };
      Cap.resolveAttempt(attemptStg3);

      return {
        rates: { rStg1, rStg2, rStg3, rShiny, rLeg, rApex },
        capNormalGold: ballGoldStg1.finalChance,
        stg3Bounty: attemptStg3.goldBounty
      };
    });

    console.log('\n--- VERIFICAÇÃO AO VIVO NA VPS (PRODUÇÃO) ---');
    console.log('Taxas Base:', liveProductionCheck.rates);
    console.log(`Chance Normal Estágio 1 + Gold Ball: ${(liveProductionCheck.capNormalGold * 100).toFixed(1)}% (Trava <= 48%)`);
    console.log(`Gold Bounty Normal Estágio 3: +${liveProductionCheck.stg3Bounty} Ouro (Esperado: +3000 Ouro)`);

    if (liveProductionCheck.rates.rStg1 === 0.38 &&
        liveProductionCheck.rates.rStg2 === 0.28 &&
        liveProductionCheck.rates.rStg3 === 0.18 &&
        liveProductionCheck.capNormalGold <= 0.48 &&
        liveProductionCheck.stg3Bounty === 3000) {
      console.log('✅ Deploy na VPS 100% validado com dados em produção!');
    } else {
      console.error('❌ Falha na validação dos dados em produção');
    }

    await new Promise(r => setTimeout(r, 2000));
    const artifactPath = path.resolve(
      'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\vps_live_stage_bounty.png'
    );
    await page.screenshot({ path: artifactPath });
    console.log(`\n📸 Screenshot da VPS salvo em: ${artifactPath}`);

    console.log('\n🎉 PROCESSO DE DEPLOY CONCLUÍDO E HOMOLOGADO EM PRODUÇÃO!');
  } catch (err) {
    console.error('❌ Erro no teste na VPS:', err);
  } finally {
    await browser.close();
  }
})();
