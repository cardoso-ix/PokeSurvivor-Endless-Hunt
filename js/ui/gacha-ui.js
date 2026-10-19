/* ============ gacha-ui.js — sorteio / roleta gacha de Pokémon ============ */
G.GachaUI = (() => {
  const $ = G.UI.$;
  let gen = 0, busy = false; // 0 = Roleta Geral (Todos os Pokémon)

  function init() {
    const tabsContainer = $('gacha-gens');
    if (tabsContainer) {
      tabsContainer.innerHTML = `
        <button class="gen-tab on" data-gen="0">🎰 Roleta Geral (Todos)</button>
        ${G.Gacha.BANNERS.map(b => `<button class="gen-tab" data-gen="${b.gen}">${b.name}</button>`).join('')}
      `;
      tabsContainer.querySelectorAll('.gen-tab').forEach(t => {
        t.onclick = () => { gen = +t.dataset.gen; refresh(); };
      });
    }

    if ($('pull-roulette-1')) $('pull-roulette-1').onclick = () => spin(1);
    if ($('pull-roulette-5')) $('pull-roulette-5').onclick = () => spin(5);

    // Fallbacks legados se existirem
    if ($('pull-1')) $('pull-1').onclick = () => spin(1);
    if ($('pull-10')) $('pull-10').onclick = () => spin(5);
    if ($('pull-10b')) $('pull-10b').onclick = () => spin(1);
    if ($('pull-close')) $('pull-close').onclick = close;
  }

  function open(g = 0) {
    gen = g;
    G.UI.show('scr-gacha', true);
    refresh();
  }

  function refresh() {
    const s = G.DB.save || { owned: {}, shiny: {}, tickets: { t1: 0, t10: 0 }, coins: 0 };
    s.owned = s.owned || {};
    s.shiny = s.shiny || {};
    s.tickets = s.tickets || { t1: 0, t10: 0 };
    s.coins = s.coins || 0;

    document.querySelectorAll('#gacha-gens .gen-tab').forEach(t => t.classList.toggle('on', +t.dataset.gen === gen));

    const t1 = s.tickets.t1 || 0;
    const coins = s.coins || 0;

    if ($('gacha-balance-tickets')) {
      $('gacha-balance-tickets').innerHTML = `${G.Icons.html('ticket', 18)} Seus Tickets: <b>${t1.toLocaleString('pt-BR')}</b>`;
    }
    if ($('gacha-balance-coins')) {
      $('gacha-balance-coins').innerHTML = `${G.Icons.html('ball', 16)} Suas PokéMoedas: <b>${coins.toLocaleString('pt-BR')}</b>`;
    }
    if ($('gacha-tickets')) {
      $('gacha-tickets').innerHTML = `Giro da Roleta: <b>${G.Gacha.ROULETTE_COST.toLocaleString('pt-BR')}</b> Tickets · Seus Tickets: <b>${t1.toLocaleString('pt-BR')}</b>`;
    }

    if ($('pull-roulette-1')) $('pull-roulette-1').disabled = t1 < G.Gacha.ROULETTE_COST;
    if ($('pull-roulette-5')) $('pull-roulette-5').disabled = t1 < G.Gacha.ROULETTE_COST * 5;

    const feat = $('gacha-feat');
    feat.innerHTML = '';

    if (gen === 0) {
      // Roleta Geral (Todos os Pokémon)
      const all = G.DEX;
      const owned = all.filter(p => s.owned[p.dex]).length;
      const shinies = all.filter(p => s.shiny && s.shiny[p.dex]).length;

      $('banner').style.background =
        `radial-gradient(circle at 80% 30%, rgba(255,210,63,.38), transparent 45%),
         radial-gradient(circle at 15% 80%, rgba(196,123,255,.38), transparent 50%),
         linear-gradient(135deg, #2d134d, #142852 55%, #0b3c56)`;
      $('banner-title').textContent = '🎰 Roleta da Sorte Pokémon';
      $('banner-desc').textContent = 'Gire por 5.000 tickets para concorrer a TODOS os 966 Pokémon do jogo! Lendários e Shinies aguardam!';
      $('gacha-owned').innerHTML = `Coleção Global: <b>${owned}</b> de <b>${all.length}</b> Pokémon` +
        (shinies ? ` · ${G.Icons.html('shiny', 12)} <b>${shinies}</b> shiny` : '');

      // Vitrine da Roleta Geral: Rayquaza (#384), Mewtwo (#150), Arceus (#493)
      const featuredDex = [384, 150, 493];
      for (const dex of featuredDex) {
        if (G.DEX_BY && G.DEX_BY[dex]) {
          feat.appendChild(G.UI.spriteCanvas(dex, 170, 190, { lively: true, scale: 2, dir: 1 }));
        }
      }
    } else {
      // Região Específica
      const banner = G.Gacha.BANNERS[gen - 1];
      const all = G.DEX.filter(p => p.gen === gen);
      const owned = all.filter(p => s.owned[p.dex]).length;
      const shinies = all.filter(p => s.shiny && s.shiny[p.dex]).length;
      const [c1, c2, c3] = banner.color;

      $('banner').style.background =
        `radial-gradient(circle at 80% 30%, rgba(255,210,63,.3), transparent 45%),
         radial-gradient(circle at 15% 80%, rgba(196,123,255,.3), transparent 50%),
         linear-gradient(135deg, ${c1}, ${c2} 55%, ${c3})`;
      $('banner-title').textContent = banner.name + ' Misterioso';
      $('banner-desc').textContent = `Os ${all.length} Pokémon da região de ${banner.name}. Gire a Roleta para conquistá-los!`;
      $('gacha-owned').innerHTML = `Você tem <b>${owned}</b> de <b>${all.length}</b> Pokémon da região` +
        (shinies ? ` · ${G.Icons.html('shiny', 12)} <b>${shinies}</b> shiny` : '');

      for (const dex of G.Gacha.featured(gen)) {
        feat.appendChild(G.UI.spriteCanvas(dex, 170, 190, { lively: true, scale: 2, dir: 1 }));
      }
    }

    // Painel de Probabilidades da Roleta
    $('gacha-rates').innerHTML = `
      <h3 style="margin-top:0;font-size:18px;color:var(--gold);">Probabilidades da Roleta</h3>
      <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed rgba(244,248,255,.15);">
        <span style="color:#ffd23f;font-weight:bold;">👑 Pokémon Lendário</span>
        <b style="color:#ffd23f;">5.0%</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed rgba(244,248,255,.15);">
        <span style="color:#9ae6ff;font-weight:bold;">✨ Pokémon Shiny</span>
        <b style="color:#9ae6ff;">1.0%</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed rgba(244,248,255,.15);">
        <span style="color:#c47bff;font-weight:bold;">⚪ Pokémon Normal</span>
        <b style="color:#c47bff;">94.0%</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed rgba(244,248,255,.15);">
        <span style="color:#5fe08a;font-weight:bold;">🎯 Pool Sorteado</span>
        <b style="color:#5fe08a;">Todos os 966 Pokémon</b>
      </div>
      <div class="gacha-rules-note">
        <b style="color:#ffd23f;">🪙 Bônus de Repetido:</b> Se o Pokémon sorteado já estiver na sua Pokédex, você ganha <b>1.000 PokéMoedas</b> para gastar na aba de Melhorias!<br><br>
        <b style="color:#9ae6ff;">✨ Novo na Pokédex:</b> Se for um Pokémon inédito, ele é desbloqueado e registrado imediatamente na sua coleção!
      </div>
    `;

    G.UI.refreshCoins();
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function spin(count = 1) {
    if (busy) return;
    const s = G.DB.save;
    if (!G.Gacha.canAffordRoulette(s, count)) {
      G.Audio.sfx('error');
      const needed = (G.Gacha.ROULETTE_COST * count).toLocaleString('pt-BR');
      G.UI.toast(`Você precisa de ${needed} Tickets para girar a Roleta! Jogue partidas para obter mais tickets.`, 3000);
      return;
    }

    const res = G.Gacha.pullRoulette(s, count);
    if (!res) {
      G.Audio.sfx('error');
      G.UI.toast('Saldo de tickets insuficiente.', 3000);
      return;
    }

    if (G.Progress && G.Progress.checkAch) G.Progress.checkAch();
    G.DB.commit(true);
    G.UI.refreshCoins();
    busy = true;

    const best = Math.max(...res.map(r => r.rarity));
    const fx = $('pull-fx'), slot = $('slot'), out = $('pull-results');
    out.innerHTML = '';
    $('pull-close').classList.add('hidden');
    slot.style.display = '';
    fx.classList.remove('hidden');

    await G.Slots.play(slot, res);
    G.Audio.sfx('burst', { rarity: best });
    slot.style.display = 'none';

    for (const r of res) {
      const mon = G.DEX_BY[r.dex] || { name: r.name || 'Pokémon #' + r.dex };
      const c = document.createElement('div');
      c.className = 'pcard r' + r.rarity + (r.shiny ? ' shiny' : '');
      c.style.setProperty('--rc', r.shiny ? '#9ae6ff' : G.Gacha.RARITY_COLOR[r.rarity]);
      c.innerHTML = `<div class="stars">${G.UI.stars(r.rarity, 24)}</div>`;
      c.appendChild(G.UI.spriteCanvas(r.dex, 132, 120, { lively: r.rarity >= 4 || r.shiny, scale: 2, shiny: r.shiny }));

      let tagHtml = '';
      if (r.isNew) {
        tagHtml = `<span class="new">${r.shiny ? '✨ NOVO SHINY!' : '✨ NOVO NA POKÉDEX!'}</span>`;
      } else {
        tagHtml = `<span class="refund" style="color:#ffd23f;font-weight:bold;font-size:12px;background:rgba(255,210,63,0.18);padding:3px 8px;border-radius:6px;border:1px solid #ffd23f;">🪙 REPETIDO · +1.000 MOEDAS</span>`;
      }

      c.insertAdjacentHTML('beforeend', `<b>${r.shiny ? G.Icons.html('shiny', 12) + ' ' : ''}${mon.name}</b><div class="tag">${tagHtml}</div>`);
      out.appendChild(c);
      G.Audio.sfx('reveal', { rarity: r.rarity });
      if (r.rarity === 5) G.Audio.sfx('legend');
      if (r.shiny) G.Audio.sfx('shiny');
      await wait(count > 1 ? 150 : 0);
    }

    $('pull-close').classList.remove('hidden');
    busy = false;
    refresh();
  }

  function close() {
    $('pull-fx').classList.add('hidden');
    refresh();
  }

  return { init, open, spin, refresh, get open_() { return !$('pull-fx').classList.contains('hidden'); } };
})();
