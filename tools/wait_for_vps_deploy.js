const http = require('http');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
const TARGET_VERSION = process.argv[2] || 'cf7e176a72';

function checkVersion() {
  return new Promise((resolve) => {
    http.get(VPS_URL + 'version.json?t=' + Date.now(), res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  console.log(`⏳ Monitorando deploy na VPS Coolify até a versão ${TARGET_VERSION}...`);
  for (let attempt = 1; attempt <= 60; attempt++) {
    const ver = await checkVersion();
    console.log(`[Tentativa ${attempt}/60] Versão atual na VPS:`, ver);
    if (ver && ver.v === TARGET_VERSION) {
      console.log(`🎉 VERSÃO ALVO ${TARGET_VERSION} ONLINE NA VPS COM SUCESSO! (${ver.at})`);
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log('⚠️ Tempo limite atingido. O deploy pode ainda estar compilando a imagem Docker.');
  process.exit(1);
})();
