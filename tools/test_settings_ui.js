const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Prepara o localStorage antes de navegar para simular save com partner
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ps.settings', JSON.stringify({
      quality: 'auto',
      cameraZoom: 1.25,
      cameraShake: true,
      cameraSmooth: true,
      showRadar: true,
      showBuffTable: true
    }));
  });

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // Remove tapstart se existir
  await page.evaluate(() => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();
    if (window.G && window.G.SettingsUI) {
      window.G.SettingsUI.open('gfx');
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const uiInfo = await page.evaluate(() => {
    const scrSettings = document.querySelector('#scr-settings');
    const zoomVal = document.querySelector('#cam-zoom-val');
    const zoomOut = document.querySelector('#cam-zoom-out');
    const zoomIn = document.querySelector('#cam-zoom-in');
    const shakeBtn = document.querySelector('.switch[data-k="cameraShake"]');
    const smoothBtn = document.querySelector('.switch[data-k="cameraSmooth"]');
    const radarBtn = document.querySelector('.switch[data-k="showRadar"]');
    const buffBtn = document.querySelector('.switch[data-k="showBuffTable"]');
    return {
      settingsOpen: scrSettings ? !scrSettings.classList.contains('hidden') : false,
      zoomDisplay: zoomVal ? zoomVal.textContent : null,
      hasZoomButtons: !!(zoomOut && zoomIn),
      cameraShakeText: shakeBtn ? shakeBtn.textContent : null,
      cameraSmoothText: smoothBtn ? smoothBtn.textContent : null,
      radarText: radarBtn ? radarBtn.textContent : null,
      buffText: buffBtn ? buffBtn.textContent : null
    };
  });
  console.log('UI Info em dev.html:', JSON.stringify(uiInfo, null, 2));

  // Clica para aumentar o zoom (+)
  console.log('Clicando em #cam-zoom-in...');
  await page.click('#cam-zoom-in');
  await new Promise(r => setTimeout(r, 300));

  const afterIn = await page.evaluate(() => {
    const z = document.querySelector('#cam-zoom-val');
    return {
      zoomDisplay: z ? z.textContent : null,
      cameraZoom: window.G && window.G.Camera ? window.G.Camera.zoom : null,
      settingsZoom: window.G && window.G.Settings ? window.G.Settings.get('cameraZoom') : null
    };
  });
  console.log('Zoom após clicar em Aumentar (+):', JSON.stringify(afterIn, null, 2));

  // Clica para diminuir o zoom (-)
  console.log('Clicando em #cam-zoom-out 2 vezes...');
  await page.click('#cam-zoom-out');
  await page.click('#cam-zoom-out');
  await new Promise(r => setTimeout(r, 300));

  const afterOut = await page.evaluate(() => {
    const z = document.querySelector('#cam-zoom-val');
    return {
      zoomDisplay: z ? z.textContent : null,
      cameraZoom: window.G && window.G.Camera ? window.G.Camera.zoom : null,
      settingsZoom: window.G && window.G.Settings ? window.G.Settings.get('cameraZoom') : null
    };
  });
  console.log('Zoom após clicar em Diminuir (-):', JSON.stringify(afterOut, null, 2));

  // Clica no preset de 0.85x
  console.log('Clicando no preset de chip [0.85x Amplo]...');
  await page.click('button[data-cam-zoom="0.85"]');
  await new Promise(r => setTimeout(r, 300));

  const afterPreset = await page.evaluate(() => {
    const z = document.querySelector('#cam-zoom-val');
    return {
      zoomDisplay: z ? z.textContent : null,
      cameraZoom: window.G && window.G.Camera ? window.G.Camera.zoom : null,
      settingsZoom: window.G && window.G.Settings ? window.G.Settings.get('cameraZoom') : null
    };
  });
  console.log('Zoom após preset 0.85x:', JSON.stringify(afterPreset, null, 2));

  // Alterna Trepidação da Câmera
  console.log('Alternando Trepidação da Câmera...');
  await page.click('.switch[data-k="cameraShake"]');
  await new Promise(r => setTimeout(r, 300));
  const afterShake = await page.evaluate(() => {
    const b = document.querySelector('.switch[data-k="cameraShake"]');
    return {
      btnText: b ? b.textContent : null,
      val: window.G && window.G.Settings ? window.G.Settings.get('cameraShake') : null
    };
  });
  console.log('Status Trepidação após toggle:', JSON.stringify(afterShake, null, 2));

  // Alterna Seguimento Suave
  console.log('Alternando Seguimento Suave...');
  await page.click('.switch[data-k="cameraSmooth"]');
  await new Promise(r => setTimeout(r, 300));
  const afterSmooth = await page.evaluate(() => {
    const b = document.querySelector('.switch[data-k="cameraSmooth"]');
    return {
      btnText: b ? b.textContent : null,
      val: window.G && window.G.Settings ? window.G.Settings.get('cameraSmooth') : null
    };
  });
  console.log('Status Seguimento Suave após toggle:', JSON.stringify(afterSmooth, null, 2));

  await page.screenshot({ path: 'settings_camera_preview.png' });
  console.log('Screenshot salva com sucesso em settings_camera_preview.png');
  await browser.close();
})().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
