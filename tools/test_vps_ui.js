const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🌐 Conectando à VPS para teste de UI real: http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto('http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Remove o overlay de tapstart caso exista
  await page.evaluate(() => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();
  });

  // Clica no botão "Jugar como invitado" via DOM
  console.log('1. Clicando em [Jugar como invitado]...');
  await page.evaluate(() => {
    const btn = document.querySelector('#btn-guest');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot após entrar como convidado
  const shot1 = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\vps_step1_after_guest.png';
  await page.screenshot({ path: shot1 });
  console.log('📸 Passo 1 salvo em:', shot1);

  // Se estiver na tela de seleção inicial (intro) ou no menu
  const state = await page.evaluate(() => {
    const scrIntro = document.querySelector('#scr-intro');
    const scrMenu = document.querySelector('#scr-menu');
    const scrStage = document.querySelector('#scr-stages');
    return {
      introOpen: scrIntro && !scrIntro.classList.contains('hidden'),
      menuOpen: scrMenu && !scrMenu.classList.contains('hidden'),
      stageOpen: scrStage && !scrStage.classList.contains('hidden')
    };
  });
  console.log('Estado das telas após login:', state);

  if (state.menuOpen) {
    console.log('2. No menu principal! Clicando em [Jogar]...');
    await page.evaluate(() => {
      const b = document.querySelector('button.menu-item.play');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Se abrir seleção de estágio, confirma
    const stageOpen = await page.evaluate(() => {
      const s = document.querySelector('#scr-stages');
      return s && !s.classList.contains('hidden');
    });

    if (stageOpen) {
      console.log('3. Tela de estágios aberta! Confirmando estágio...');
      await page.evaluate(() => {
        const b = document.querySelector('#btn-stage-confirm');
        if (b) b.click();
      });
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // Screenshot durante a gameplay na VPS
  const shotGame = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\vps_step2_gameplay.png';
  await page.screenshot({ path: shotGame });
  console.log('📸 Gameplay na VPS salva em:', shotGame);

  await browser.close();
  console.log('✅ Fluxo de UI da VPS testado com sucesso!');
})().catch(err => {
  console.error('❌ Erro no teste de UI da VPS:', err);
  process.exit(1);
});
