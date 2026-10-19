/* ============ run-ui.js — cartas de nivel, pausa y fin de run ============ */
G.RunUI = (() => {
  const $ = G.UI.$;
  let offers = null, offerCb = null, coopMode = false;

  /** @param coop  en grupo: tras elegir, se queda esperando a los demás */
  function showLevelUp(level, list, cb, coop = false) {
    offerCb = cb; coopMode = coop;
    $('lvl-num').textContent = level;
    $('lvl-wait').textContent = '';
    $('lvl-wait').classList.toggle('hidden', !coop);
    $('cards').classList.remove('done');
    renderCards(list);
    $('lvl-reroll').onclick = reroll;
    G.UI.show('scr-levelup');
  }

  /**
   * Cambiar las cartas: 1 vez gratis por partida y 1 más por cada jefe
   * derrotado (en grupo cuentan los jefes del equipo; cada uno tiene los suyos).
   */
  function rerollsLeft() {
    const p = G.Game.player;
    // 1 gratis + los comprados en Mejoras (antes, 1 más por cada jefe).
    return p ? Math.max(0, 1 + (p.rerollBonus || 0) - (p.rerolls || 0)) : 0;
  }

  function reroll() {
    if (!offers || rerollsLeft() <= 0) return;
    const p = G.Game.player;
    p.rerolls = (p.rerolls || 0) + 1;
    G.Audio.sfx('select');
    renderCards(G.LevelUp.offer(p));
  }

  function renderCards(list) {
    offers = list;
    const left = rerollsLeft();
    $('lvl-rr-n').textContent = left;
    $('lvl-reroll').classList.toggle('hidden', left <= 0);
    const box = $('cards');
    box.innerHTML = '';
    list.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'card';
      const tag = c.type === 'new'
        ? `<span class="tag-chip" style="background:${c.color}">Novo · ${c.tag}</span>`
        : c.type === 'up' || c.type === 'evo' || c.type === 'EVOLUTION'
          ? `<span class="tag-chip" style="background:${c.color}">${c.tag}</span>`
          : `<span class="tag-chip" style="background:${c.color === '#ffd23f' ? '#ffd23f' : '#9fb1c9'}">${c.tag}</span>`;
      if (c.type === 'evo' || c.type === 'EVOLUTION') el.classList.add('evo');
      let icoHtml = G.Icons.html(c.icon, 32);
      if (c.type === 'EVOLUTION' && c.dex && typeof G === 'object' && G.UI && G.UI.sprite) {
        icoHtml = `<canvas class="evo-ico-cv" width="36" height="36" style="vertical-align:middle"></canvas>`;
      }
      el.innerHTML =
        `<div class="ico" style="background:${c.color}33">${icoHtml}</div>
         <div class="txt"><div class="nm">${c.title} ${tag}</div><div class="ds">${c.desc}</div></div>
         <div class="key">${i + 1}</div>`;
      if (c.type === 'EVOLUTION' && c.dex && typeof G === 'object' && G.UI && G.UI.sprite) {
        const cv = el.querySelector('.evo-ico-cv');
        if (cv) G.UI.sprite(cv, c.dex, { scale: 1.5, lively: true, hero: true, shiny: !!(G.Game && G.Game.player && (G.Game.player.isShiny || G.Game.player.shiny)) });
      }
      el.dataset.sfx = 'none';
      el.onclick = () => pick(i);
      box.appendChild(el);
    });
  }

  function pick(i) {
    if (!offers || !offers[i]) return;
    const c = offers[i], cb = offerCb;
    offers = null; offerCb = null;
    $('lvl-reroll').classList.add('hidden');
    if (coopMode) {
      $('cards').querySelectorAll('.card').forEach((el, j) => el.classList.toggle('picked', j === i));
      $('cards').classList.add('done');
    } else G.UI.hide('scr-levelup');
    cb(c);
  }

  /** Cooperativo: quem falta escolher. */
  function setWaiting(names) {
    const me = G.Social.me ? G.Social.me.name : '';
    const others = names.filter(n => n !== me);
    const list = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0];
    $('lvl-wait').textContent = !names.length ? ''
      : !others.length ? 'Escolha sua carta'
      : names.includes(me) ? 'Faltam escolher: ' + list([...others, 'você'])
      : 'Esperando por ' + list(others) + '…';
  }

  function closeLevelUp() {
    offers = null; offerCb = null;
    $('cards').classList.remove('done');
    G.UI.hide('scr-levelup');
  }

  /**
   * Mensaje de apoyo (Ko-fi) al acabar: tras un récord o cada 10 partidas,
   * nunca en la primera y como mucho una vez al día. Se cierra con la X.
   */
  function askSupport(r) {
    if (!G.Funding || !G.Funding.url) return false;
    const runs = (G.DB.save && G.DB.save.stats && G.DB.save.stats.runs) || 0;
    if (runs < 2 || !(r.record || runs % 10 === 0)) return false;
    const today = new Date().toISOString().slice(0, 10);
    try { if (localStorage.getItem('ps.ask') === today) return false; localStorage.setItem('ps.ask', today); } catch (e) { return false; }
    return true;
  }

  function showOver(r, onBack) {
    $('over-title').textContent = r.dead ? 'Você foi derrotado…' : 'Partida Concluída!';
    $('over-stats').innerHTML = `
      <div><span>Tempo</span><b>${G.U.mmss(r.time)}</b></div>
      <div><span>Nível</span><b>${r.level}</b></div>
      <div><span>Inimigos Derrotados</span><b>${r.kills}</b></div>
      <div><span>Chefes</span><b>${r.bosses}</b></div>
      ${r.judge ? `<div style="grid-column:1/-1"><span>Perante Arceus</span><b class="gold">${G.U.mmss(r.judge.time)} · ${r.judge.bosses} ${r.judge.bosses === 1 ? 'lendário' : 'lendários'}</b></div>` : ''}
      <div style="grid-column:1/-1"><span>PokéMoedas recebidas</span>
        <b class="gold"><span class="coin"></span> +${r.coins}</b>
        <div style="font-size:12px;color:var(--muted)">${r.breakdown}</div></div>
      ${r.t1 || r.t10 ? `<div style="grid-column:1/-1"><span>Tickets do Gacha</span><b>
        ${r.t1 ? G.Icons.html('ticket', 22) + ' +' + r.t1 + ' ' : ''}${r.t10 ? G.Icons.html('ticket10', 22) + ' +' + r.t10 + ' ×10' : ''}</b></div>` : ''}
      <div style="grid-column:1/-1"><span>Ataques</span><b style="font-size:15px">
        ${r.moves.map(m => `${G.Icons.html('move:' + m.id, 16)} ${m.name} Nv.${m.lvl}`).join(' · ') || '—'}</b></div>
      ${r.caught && r.caught.length ? `<div style="grid-column:1/-1" class="caught"><span>${G.Icons.html('shiny', 12)} Shinies capturados</span>
        <div class="caught-row" id="over-caught"></div></div>` : ''}
      ${r.record ? '<div style="grid-column:1/-1;text-align:center" class="gold">🎉 Novo Recorde de Sobrevivência!</div>' : ''}
      ${askSupport(r) ? `<div class="support-ask" id="over-ask" style="grid-column:1/-1">
        <button class="x" type="button" aria-label="Fechar">×</button>
        <p>Está gostando do PokéSurvivor? Ajude nosso projeto para mantermos os servidores ativos!</p>
        <a class="btn small gold" href="${G.Funding.url}" target="_blank" rel="noopener">${G.Icons.html('heart', 14)} Apoiar no Ko-fi</a>
      </div>` : ''}`;
    const ask = $('over-ask');
    if (ask) ask.querySelector('.x').onclick = () => ask.remove();
    $('btn-again').onclick = onBack;
    if (r.caught && r.caught.length) {
      const row = $('over-caught');
      for (const c of r.caught) {
        const w = document.createElement('div');
        w.appendChild(G.UI.spriteCanvas(c.dex, 90, 72, { shiny: true, lively: true, scale: 2 }));
        w.insertAdjacentHTML('beforeend', `<small>${G.DEX_BY[c.dex].name}${c.isNew ? ' · Novo!' : ''}</small>`);
        row.appendChild(w);
      }
    }
    G.UI.show('scr-over');
  }

  /** Você encontrou um item já carregando outro: com qual deseja ficar? */
  function showItemChoice(cur, next, cb) {
    const box = $('item-cards');
    box.innerHTML = '';
    [[cur, 'Manter'], [next, 'Trocar por']].forEach(([id, verb], i) => {
      const it = G.Items.BY[id];
      const el = document.createElement('div');
      el.className = 'card' + (i === 1 ? ' evo' : '');
      el.innerHTML = `<div class="ico">${G.Icons.html(id, 36)}</div>
        <div class="txt"><div class="nm">${verb} ${it.name}</div><div class="ds">${it.desc}</div></div>
        <div class="key">${i + 1}</div>`;
      el.onclick = () => { G.UI.hide('scr-item'); cb(id); };
      box.appendChild(el);
    });
    G.UI.show('scr-item');
  }

  // ---------------- vínculo / fusão: quais ataques se unem ----------------

  let bond = null;          // { opt, cb, first, list }

  function showBond(opt, cb) {
    bond = { opt, cb, first: null, list: [] };
    $('bond-back').onclick = bondBack;
    renderBond();
    G.UI.show('scr-bond');
  }

  function renderBond() {
    const { opt, first } = bond;
    const names = ms => ms.map(m => m.name).join(' + ');
    const step2 = opt.mode === 'pair' && first;
    $('bond-sub').textContent = opt.mode === 'add' ? 'Escolha qual ataque vai se unir a ' + names(opt.group)
      : step2 ? 'Com qual ataque você une ' + first.name + '?' : 'Escolha o primeiro ataque que deseja unir';
    $('bond-back').classList.toggle('hidden', !step2);
    bond.list = step2 ? opt.loose.filter(m => m !== first) : opt.loose;
    const box = $('bond-cards');
    box.innerHTML = '';
    bond.list.forEach((m, i) => {
      const col = G.U.TYPE_COLOR[m.type];
      const desc = opt.mode === 'add' ? 'Será disparado junto com ' + names(opt.group) + '.'
        : step2 ? 'Será disparado junto com ' + first.name + '. Libera um espaço na barra.'
        : m.desc || '';
      const el = document.createElement('div');
      el.className = 'card' + (opt.mode === 'add' || step2 ? ' bond' : '');
      el.innerHTML =
        `<div class="ico" style="background:${col}33">${G.Icons.html('move:' + m.id, 32)}</div>
         <div class="txt"><div class="nm">${m.name} <span class="tag-chip" style="background:${col}">Nv.${m.lvl}</span></div><div class="ds">${desc}</div></div>
         <div class="key">${i + 1}</div>`;
      el.dataset.sfx = 'none';
      el.onclick = () => pickBond(i);
      box.appendChild(el);
    });
  }

  function pickBond(i) {
    if (!bond || !bond.list[i]) return;
    const m = bond.list[i];
    if (bond.opt.mode === 'pair' && !bond.first) {
      bond.first = m;
      G.Audio.sfx('select');
      renderBond();
      return;
    }
    const picked = bond.opt.mode === 'add' ? [m] : [bond.first, m];
    const cb = bond.cb;
    bond = null;
    G.UI.hide('scr-bond');
    cb(picked);
  }

  function bondBack() {
    if (!bond) return;
    bond.first = null;
    renderBond();
  }

  function showPause(coop = false) {
    G.UI.soundControls($('pause-sound'));
    $('pause-coop').classList.toggle('hidden', !coop);
    $('btn-quit').textContent = coop ? 'Sair da Partida' : 'Abandonar Partida';
    G.UI.show('scr-pause');
  }

  function wirePause(onResume, onQuit) {
    $('btn-resume').onclick = onResume;
    $('btn-quit').onclick = onQuit;
  }

  return { showLevelUp, reroll, showItemChoice, showBond, pickBond, bondBack, pick, setWaiting, closeLevelUp, showOver, wirePause, showPause };
})();
