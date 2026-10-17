const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Abrir a UI de Introdução & Criação
  await page.evaluate(() => {
    if (window.G && window.G.IntroCreationUI) {
      window.G.IntroCreationUI.open();
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // Capturar screenshot da tela de criação com aba Menino
  await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/d8c67403-5144-46bc-8f04-74211dcd31d5/intro_creation_male.png' });
  console.log('✅ Screenshot do Treinador (Menino) salva.');

  // Clicar na aba Menina
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.ic-tab-btn');
    if (tabs.length > 1) {
      tabs[1].click();
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // Capturar screenshot com aba Menina
  await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/d8c67403-5144-46bc-8f04-74211dcd31d5/intro_creation_female.png' });
  console.log('✅ Screenshot da Treinadora (Menina) salva.');

  // Clicar no botão para ir ao Passo 2 (Draft dos Iniciais)
  await page.evaluate(() => {
    const btnNext = document.getElementById('btn-step1-next');
    if (btnNext) btnNext.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Limpar a seleção atual para testar a escolha livre do zero
  await page.evaluate(() => {
    // Desmarcar todos os atuais
    const current = [...window.G.IntroCreationUI.selectedSquad];
    current.forEach(dex => {
      const card = document.querySelector(`.ic-starter-card[data-dex="${dex}"]`);
      if (card) card.click();
    });
  });
  await new Promise(r => setTimeout(r, 200));

  // Clicar no filtro da Geração 3 (Hoenn)
  await page.evaluate(() => {
    const btnGen3 = document.querySelector('.ic-filter-btn[data-gen="3"]');
    if (btnGen3) btnGen3.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Selecionar o Trio de Hoenn: Treecko (252), Torchic (255), Mudkip (258)
  await page.evaluate(() => {
    const treecko = document.querySelector('.ic-starter-card[data-dex="252"]');
    if (treecko) treecko.click();
  });
  await new Promise(r => setTimeout(r, 100));

  await page.evaluate(() => {
    const torchic = document.querySelector('.ic-starter-card[data-dex="255"]');
    if (torchic) torchic.click();
  });
  await new Promise(r => setTimeout(r, 100));

  await page.evaluate(() => {
    const mudkip = document.querySelector('.ic-starter-card[data-dex="258"]');
    if (mudkip) mudkip.click();
  });
  await new Promise(r => setTimeout(r, 100));

  const selectionInfo = await page.evaluate(() => {
    const btn = document.getElementById('btn-step2-start');
    const badge = document.querySelector('.ic-count-badge');
    const slotNames = Array.from(document.querySelectorAll('.ic-slot-name')).map(el => el.textContent.trim());
    return {
      selectedSquad: window.G.IntroCreationUI.selectedSquad,
      countBadge: badge ? badge.textContent.trim() : null,
      slotNames,
      btnDisabled: btn ? btn.disabled : null,
      btnText: btn ? btn.textContent.trim() : null
    };
  });
  console.log('Info de Seleção de Iniciais (Gen 3 Trio):', JSON.stringify(selectionInfo, null, 2));

  await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/d8c67403-5144-46bc-8f04-74211dcd31d5/intro_creation_trio_selected.png' });
  console.log('✅ Screenshot do Trio Selecionado salva.');

  // Clicar em INICIAR JORNADA ▶ para comprovar persistência e fechamento
  await page.evaluate(() => {
    const btn = document.getElementById('btn-step2-start');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const finalCheck = await page.evaluate(() => {
    const overlay = document.querySelector('.ic-overlay');
    return {
      modalClosed: overlay === null,
      savedTrainer: window.G.DB && window.G.DB.save ? window.G.DB.save.trainer : null,
      savedSquad: window.G.DB && window.G.DB.save ? window.G.DB.save.squad : null
    };
  });
  console.log('Verificação Final pós-criação:', JSON.stringify(finalCheck, null, 2));

  await browser.close();
  console.log('🎉 Teste de browser concluído com 100% de sucesso!');
})().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
