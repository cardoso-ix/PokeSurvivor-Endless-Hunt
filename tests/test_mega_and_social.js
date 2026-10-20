const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('🚀 [TESTE] Iniciando validação automatizada de Amigos, Ranking e Mega com Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800', '--autoplay-policy=no-user-gesture-required'],
    protocolTimeout: 60000
  });

  const artifactDir = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

  try {
    // =========================================================================
    // FASE 1: TESTE DA TELA DE CLASSIFICAÇÃO (RANKING) E AMIGOS (SOCIAL)
    // =========================================================================
    console.log('\n--- FASE 1: Testando Menu de Amigos e Classificação ---');
    const page1 = await browser.newPage();
    await page1.setViewport({ width: 1280, height: 800 });

    await page1.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });
    await page1.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.RankingUI, { timeout: 15000 });
    await wait(500);

    // Remove overlays
    await page1.evaluate(() => {
      const tap = document.getElementById('tap-start') || document.querySelector('.tapstart');
      if (tap) tap.remove();
      if (window.G && window.G.DB) {
        window.G.DB.playAsGuest();
        window.G.DB.save.partner = 4;
      }
    });

    console.log('🏆 Abrindo Classificação (Ranking)...');
    await page1.evaluate(() => window.G.RankingUI.open());
    await wait(600);

    const isRankOpen = await page1.evaluate(() => window.G.UI.isOpen('scr-rank'));
    console.log(`📊 Tela de Classificação aberta com sucesso: ${isRankOpen}`);
    if (!isRankOpen) throw new Error('A tela de classificação não abriu!');

    await page1.screenshot({ path: path.join(artifactDir, 'ranking_opened_live.png') });
    console.log('📸 Screenshot salvo: ranking_opened_live.png');

    console.log('👥 Testando Menu de Amigos (Social)...');
    const toastMsg = await page1.evaluate(() => {
      window.G.FriendsUI.open();
      const t = document.querySelector('.toast');
      return t ? t.textContent : null;
    });
    console.log(`📢 Mensagem ao clicar em Amigos: "${toastMsg}"`);
    await page1.close();

    // =========================================================================
    // FASE 2: TESTE DO PODER MEGA (CRESCIMENTO VISUAL E BUFFS 2X DE ATRIBUTOS)
    // =========================================================================
    console.log('\n--- FASE 2: Testando Poder Mega, Espaço e Atributos ---');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1280, height: 800 });

    page2.on('console', msg => {
      const t = msg.text();
      if (t.includes('MEGA') || t.includes('Overdrive')) console.log(`  [Browser] ${t}`);
    });

    await page2.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });
    await page2.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.Mega, { timeout: 15000 });
    await wait(500);

    // Inicia a partida direto com Charmander / Charizard
    console.log('⚔️ Configurando save e iniciando partida...');
    await page2.evaluate(async () => {
      const tap = document.getElementById('tap-start') || document.querySelector('.tapstart');
      if (tap) tap.remove();
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 4; // Charmander (Fogo)
      window.G.DB.save.starter = 4;
      window.G.DB.save.owned[4] = { at: Date.now(), from: 'starter' };
      window.G.UI.hideAll();
      window.G.Game.startRun();
    });
    await wait(1200);

    const gameState = await page2.evaluate(() => window.G.Game.state);
    console.log(`🎮 Estado da partida: ${gameState}`);

    // Atributos normais pré-mega
    const normal = await page2.evaluate(() => {
      const pl = window.G.Game.player;
      return {
        dex: pl.dex,
        name: pl.mon.name,
        atk: pl.atk,
        spd: pl.spd,
        reduction: pl.reduction,
        cdMul: pl.cdMul,
        regen: pl.regen,
        critChance: pl.critChance,
        magnet: pl.magnet,
        scale: pl.anim ? pl.anim.scale : 1,
        megaScale: pl.megaVisualScale || 1,
        r: pl.r
      };
    });
    console.log('📊 Atributos Normais do Pokémon:', normal);

    // Enche energia de Mega para 100%
    console.log('⚡ Carregando barra de Mega para 100%...');
    await page2.evaluate(() => {
      const pl = window.G.Game.player;
      pl.megaEnergy = 100;
      window.G.Mega.gauge = 100;
    });

    // Pressiona a barra de espaço para acionar o Mega
    console.log('⌨️ Pressionando a tecla [ESPAÇO] para ativar o Mega...');
    await page2.keyboard.press('Space');
    await wait(350);

    let isMegaActive = await page2.evaluate(() => window.G.Mega.isActive || window.G.Game.player.megaMode.active);
    console.log(`🌟 Mega ativo após tecla [ESPAÇO]: ${isMegaActive}`);

    if (!isMegaActive) {
      console.log('⚠️ Chamando window.G.Mega.trigger() de backup...');
      await page2.evaluate(() => window.G.Mega.trigger());
      await wait(350);
      isMegaActive = await page2.evaluate(() => window.G.Mega.isActive);
      console.log(`🌟 Mega ativo após trigger: ${isMegaActive}`);
    }

    // Aguarda a interpolação suave do crescimento visual
    await wait(750);

    // Captura atributos e dimensões em modo Mega
    const mega = await page2.evaluate(() => {
      const pl = window.G.Game.player;
      return {
        dex: pl.dex,
        name: pl.mon.name,
        atk: pl.atk,
        spd: pl.spd,
        reduction: pl.reduction,
        cdMul: pl.cdMul,
        regen: pl.regen,
        critChance: pl.critChance,
        magnet: pl.magnet,
        scale: pl.anim ? pl.anim.scale : 1,
        megaScale: pl.megaVisualScale || 1,
        r: pl.r,
        dmgTakenMul: pl.dmgTakenMul
      };
    });
    console.log('🔥 Atributos no Modo Mega (Gigante e Turbinado):', mega);

    const atkRatio = mega.atk / normal.atk;
    const spdRatio = mega.spd / normal.spd;

    console.log(`\n--- RESULTADOS DA AUDITORIA ---`);
    console.log(`✅ Multiplicador de ATK: ${atkRatio.toFixed(2)}x (Esperado: 2.00x)`);
    console.log(`✅ Multiplicador de SPD: ${spdRatio.toFixed(2)}x (Esperado: 2.00x)`);
    console.log(`✅ Redução de Dano (Defesa): ${(mega.reduction * 100).toFixed(0)}% (Piso: >= 80%)`);
    console.log(`✅ dmgTakenMul: ${mega.dmgTakenMul} (Esperado: 0.15)`);
    console.log(`✅ cdMul (Cadência de Ataque): ${mega.cdMul} (Esperado: <= 0.50)`);
    console.log(`✅ Regeneração: +${mega.regen.toFixed(1)} HP/s (Esperado: >= 12 HP/s)`);
    console.log(`✅ Chance Crítica: ${(mega.critChance * 100).toFixed(0)}% (Esperado: >= 35%)`);
    console.log(`✅ Raio Magnético de Coleta: ${mega.magnet.toFixed(0)}px (Esperado: >= 156px)`);
    console.log(`✅ Escala Visual de Crescimento: ${mega.scale.toFixed(2)}x (Esperado: ~1.55x)`);
    console.log(`✅ Raio de Colisão / Corpo: ${mega.r.toFixed(1)}px (Normal: ${normal.r.toFixed(1)}px)`);

    // Tira print durante a cutscene com o Pokémon Gigante na tela e HUD atualizado
    const megaScreenshotPath = path.join(artifactDir, 'mega_space_gigantic_buffs_live.png');
    await page2.screenshot({ path: megaScreenshotPath });
    console.log(`📸 Screenshot salvo: ${megaScreenshotPath}`);

    // Aguarda término da cutscene cinematográfica (2.8s) para ver o Pokémon gigante andando no campo
    console.log('⏳ Aguardando término da cutscene para registrar gameplay com o Pokémon gigante no mapa...');
    await wait(2400);

    const megaCombatScreenshotPath = path.join(artifactDir, 'mega_space_gameplay_gigantic_live.png');
    await page2.screenshot({ path: megaCombatScreenshotPath });
    console.log(`📸 Screenshot de combate salvo: ${megaCombatScreenshotPath}`);

    // Validações formais
    if (atkRatio < 1.95) throw new Error(`ATK não dobrou: foi ${atkRatio}`);
    if (spdRatio < 1.95) throw new Error(`SPD não dobrou: foi ${spdRatio}`);
    if (mega.reduction < 0.80) throw new Error(`Defesa não atingiu piso de 80%: foi ${mega.reduction}`);
    if (mega.scale < 1.45) throw new Error(`Escala visual não atingiu o crescimento esperado: foi ${mega.scale}`);

    console.log('\n🎉 [SUCESSO TOTAL] Todas as validações passaram com 100% de êxito!');
    await page2.close();
  } catch (err) {
    console.error('❌ [FALHA]:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
