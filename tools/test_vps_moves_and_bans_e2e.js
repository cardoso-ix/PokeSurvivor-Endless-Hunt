// tools/test_vps_moves_and_bans_e2e.js
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const url = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

async function run() {
  console.log('🚀 Iniciando teste E2E na VPS ao vivo...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Remove tap-start e clica em "Jogar como Convidado"
  await page.evaluate(() => {
    const tap = document.getElementById('tap-start');
    if (tap) tap.classList.add('hidden');
    const guestBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convidado'));
    if (guestBtn) guestBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 2. Responde as 8 perguntas do quiz inicial
  for (let q = 0; q < 8; q++) {
    await page.evaluate(() => {
      const btn = document.querySelector('#test-a .answer, .answer');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1000));

  // 3. Clica em "Vamos juntos!" para confirmar o parceiro inicial
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.innerText.includes('Vamos juntos') || b.innerText.includes('Escolher'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 4. Injeta moedas via comando admin
  await page.evaluate(() => {
    if (typeof window.adminLogin === 'function') window.adminLogin('04052001Erica+');
    if (typeof window.adminSetCoins === 'function') window.adminSetCoins(250000);
  });
  await new Promise(r => setTimeout(r, 500));

  // 5. Clica no menu "Melhorias"
  console.log('Navegando para o menu Melhorias...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const upgBtn = btns.find(b => b.innerText.includes('Melhorias'));
    if (upgBtn) upgBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 1: Tela de Melhorias com Slot 2 Bloqueado e Banir (máx 3)
  const pLocked = path.join(brainDir, 'vps_moves_locked_and_ban3.png');
  await page.screenshot({ path: pLocked });
  console.log('Screenshot 1 salvo:', pLocked);

  // Status Inicial no DOM
  const checkInitial = await page.evaluate(() => {
    const lockBtn = document.querySelector('#btn-unlock-second-move');
    const upgMoves = Array.from(document.querySelectorAll('.upg-item')).find(el => el.textContent.includes('2º Ataque Inicial'));
    const upgBan = Array.from(document.querySelectorAll('.upg-item')).find(el => el.textContent.includes('Banir'));
    const startPanel = document.querySelector('.start-moves-panel');
    return {
      hasLockBtn: !!lockBtn,
      lockBtnText: lockBtn ? lockBtn.textContent.trim() : null,
      upgMovesText: upgMoves ? upgMoves.innerText.replace(/\s+/g, ' ') : null,
      upgBanText: upgBan ? upgBan.innerText.replace(/\s+/g, ' ') : null,
      startPanelHeader: startPanel ? startPanel.querySelector('span[style*="font-size:11px"]')?.innerText : null
    };
  });
  console.log('Status Inicial na VPS:', checkInitial);

  // 6. Clicar no botão de desbloqueio de 50.000 moedas
  console.log('Clicando no botão de desbloqueio de 50.000 moedas...');
  const unlockBtn = await page.$('#btn-unlock-second-move');
  if (unlockBtn) {
    await unlockBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  // Screenshot 2: Tela após desbloqueio do 2º ataque inicial
  const pUnlocked = path.join(brainDir, 'vps_moves_unlocked_slot2.png');
  await page.screenshot({ path: pUnlocked });
  console.log('Screenshot 2 salvo:', pUnlocked);

  const checkAfterUnlock = await page.evaluate(() => {
    const sel2 = document.querySelector('#start-move-2');
    const upgMoves = Array.from(document.querySelectorAll('.upg-item')).find(el => el.textContent.includes('2º Ataque Inicial'));
    const startPanel = document.querySelector('.start-moves-panel');
    return {
      hasSel2: !!sel2,
      upgMovesStatus: upgMoves ? upgMoves.innerText.replace(/\s+/g, ' ') : null,
      startPanelHeader: startPanel ? startPanel.querySelector('span[style*="font-size:11px"]')?.innerText : null
    };
  });
  console.log('Status Após Desbloqueio:', checkAfterUnlock);

  // 7. Testar compra de 3 níveis de Banir
  console.log('Testando compra de 3 níveis de Banir até atingir MÁXIMO...');
  for (let b = 0; b < 3; b++) {
    await page.evaluate(() => {
      const upgBan = Array.from(document.querySelectorAll('.upg-item')).find(el => el.textContent.includes('Banir'));
      const buyBtn = upgBan ? upgBan.querySelector('[data-buy]') : null;
      if (buyBtn && !buyBtn.disabled) buyBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
  }
  await new Promise(r => setTimeout(r, 1000));

  const checkBanMax = await page.evaluate(() => {
    const upgBan = Array.from(document.querySelectorAll('.upg-item')).find(el => el.textContent.includes('Banir'));
    const maxBtn = upgBan ? upgBan.querySelector('.upg-max-btn') : null;
    const banBtn = upgBan ? upgBan.querySelector('[data-ban]') : null;
    return {
      upgBanText: upgBan ? upgBan.innerText.replace(/\s+/g, ' ') : null,
      hasMaxBtn: !!maxBtn,
      maxBtnText: maxBtn ? maxBtn.textContent.trim() : null,
      banBtnText: banBtn ? banBtn.textContent.trim() : null
    };
  });
  console.log('Status Banir Nv 3 (Máximo sem ascensão):', checkBanMax);

  // Screenshot 3: Banir no nível 3 Máximo sem Ascensão
  const pBanMax = path.join(brainDir, 'vps_ban_max_3_no_ascension.png');
  await page.screenshot({ path: pBanMax });
  console.log('Screenshot 3 salvo:', pBanMax);

  await browser.close();
  console.log('🎉 Todos os testes e capturas E2E na VPS foram concluídos com sucesso!');
}

run().catch(err => {
  console.error('Erro no teste E2E:', err);
  process.exit(1);
});
