const fs = require('fs');
const https = require('https');
const path = require('path');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Obtendo lista de evolution chains da PokeAPI...');
  const index = await get('https://pokeapi.co/api/v2/evolution-chain?limit=600');
  const chains = index.results;
  console.log(`Total de cadeias encontradas: ${chains.length}`);

  const chainResults = [];
  const CONCURRENCY = 25;
  let cursor = 0;

  async function worker() {
    while (cursor < chains.length) {
      const idx = cursor++;
      const item = chains[idx];
      try {
        const data = await get(item.url);
        chainResults.push(data);
        if (chainResults.length % 50 === 0 || chainResults.length === chains.length) {
          process.stdout.write(`\rBaixadas: ${chainResults.length}/${chains.length}`);
        }
      } catch (err) {
        console.error(`\nErro na URL ${item.url}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  console.log('\nDownload concluído!');

  const cacheDir = path.join(__dirname, 'cache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(path.join(cacheDir, 'evolution_chains.json'), JSON.stringify(chainResults));
  console.log(`Salvo em tools/cache/evolution_chains.json (${chainResults.length} cadeias).`);
}

run().catch(console.error);
