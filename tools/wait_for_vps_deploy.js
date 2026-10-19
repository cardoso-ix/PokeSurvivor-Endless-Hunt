const http = require('http');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
const PREV_VERSION = 'a67d49e39e';

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
  console.log('⏳ Monitorando progresso do deploy na VPS Coolify...');
  for (let attempt = 1; attempt <= 45; attempt++) {
    const ver = await checkVersion();
    console.log(`[Tentativa ${attempt}/45] Versão atual na VPS:`, ver);
    if (ver && ver.v && ver.v !== PREV_VERSION) {
      console.log(`🎉 NOVO DEPLOY ONLINE DETECTADO COM SUCESSO! Versão: ${ver.v} (${ver.at})`);
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log('⚠️ Tempo limite atingido. O deploy pode ainda estar compilando a imagem Docker.');
  process.exit(1);
})();
