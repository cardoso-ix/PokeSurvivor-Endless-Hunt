/* ============ ranking-ui.js — tela de classificação / ranking ============ */
G.RankingUI = (() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let mode = 's', period = 'w', scope = 'all', dex = null, category = 'time';
  let token = 0;

  function init() {
    const dl = $('rk-dl');
    dl.innerHTML = G.DEX.map(p => `<option value="${esc(p.name)}">`).join('');
    $('rk-poke').onchange = () => {
      const v = $('rk-poke').value.trim().toLowerCase();
      const p = G.DEX.find(x => x.name.toLowerCase() === v);
      if (!v) { setDex(null); return; }
      if (!p) { G.UI.toast('Nenhum Pokémon encontrado com esse nome.'); return; }
      setDex(p.dex);
    };
    $('rk-clear').onclick = () => { $('rk-poke').value = ''; setDex(null); };
    $('rk-mod').onclick = () => G.ModUI.open();
  }

  function setDex(d) {
    dex = d;
    if (d && period !== 'a') period = 'a';
    $('rk-clear').classList.toggle('hidden', !d);
    tabs(); load();
  }

  function open() {
    G.UI.show('scr-rank', true);
    if (G.DB.online && !G.Social.started) G.Social.start();
    $('rk-mod').classList.toggle('hidden', !(G.Ranking && G.Ranking.isAdmin && G.Ranking.isAdmin()));
    tabs();
    load();
  }

  function tabs() {
    const mk = (box, items, cur, set, cls) => {
      box.innerHTML = '';
      for (const [k, label] of items) {
        const b = document.createElement('button');
        b.className = cls + (k === cur ? ' on' : '');
        b.innerHTML = label;
        b.onclick = () => { set(k); tabs(); load(); };
        box.appendChild(b);
      }
    };
    // Seletor de Categoria: Tempo Sobrevivido vs Fendas Feitas
    if ($('rk-cat')) {
      mk($('rk-cat'), [
        ['time', `<b>⏱️ Maior Tempo</b>`],
        ['rifts', `<b>🌀 Mais Fendas</b>`]
      ], category, k => { category = k; }, 'gen-tab');
    }
    mk($('rk-mode'), [['s', `<b>${G.Icons.html('user', 16)} Solo</b>`], ['g', `<b>${G.Icons.html('friends', 16)} Grupo</b>`]],
       mode, k => { mode = k; }, 'gen-tab');
    mk($('rk-period'), [
      ['d', 'Hoje'],
      ['w', 'Semana'],
      ['m', 'Mês'],
      ['y', 'Ano'],
      ['a', 'Todos os Tempos']
    ], period, k => {
      period = k;
      if (k !== 'a' && dex) { dex = null; $('rk-poke').value = ''; $('rk-clear').classList.add('hidden'); }
    }, 'chip');
    mk($('rk-scope'), [['all', 'Todos'], ['friends', 'Apenas Amigos']], scope, k => { scope = k; }, 'chip');
  }

  const fmt = t => t >= 3600 ? Math.floor(t / 3600) + ':' + G.U.mmss(t % 3600).padStart(5, '0') : G.U.mmss(t);

  async function load() {
    const my = ++token;
    const list = $('rk-list');
    list.innerHTML = '<p class="sub">Carregando…</p>';
    $('rk-me').innerHTML = '';
    let rows = [], me = null;
    try {
      [rows, me] = await Promise.all([
        G.Ranking.top(mode, period, dex, scope === 'friends'),
        G.Social.me ? G.Ranking.myRank(mode, period, dex) : Promise.resolve(null)
      ]);
    } catch (e) {
      if (my !== token) return;
      list.innerHTML = '<p class="sub">Não foi possível carregar a classificação (' + esc(e.code || e.message) + ').</p>';
      return;
    }
    if (my !== token) return;
    list.innerHTML = '';
    if (!rows.length) {
      list.innerHTML = G.DB.online
        ? '<p class="sub">Ainda não há recordes aqui. Seja o primeiro!</p>'
        : '<p class="sub">Nenhum recorde registrado ainda. Crie ou acesse sua conta online para registrar e competir na classificação global!</p>';
    }
    const uid = G.Social.uid;
    const b = G.Ranking.board(mode, period, dex), done = G.Ranking.reported();
    if ($('rk-sub')) {
      $('rk-sub').textContent = category === 'rifts' ? '· fendas concluídas' : '· tempo sobrevivido';
    }
    // Ordena conforme a categoria selecionada (Tempo vs Fendas)
    if (category === 'rifts') {
      rows.sort((a, b) => (b.rifts || 0) - (a.rifts || 0) || b.t - a.t);
    } else {
      rows.sort((a, b) => b.t - a.t || (b.rifts || 0) - (a.rifts || 0));
    }
    rows.forEach((r, i) => list.appendChild(rowEl(r, i + 1, r.uids.includes(uid), b, done, category)));

    const en = G.I18n.lang === 'en';
    const pn = en ? { d: 'today', w: 'this week', m: 'this month', y: 'this year', a: 'of all time' }[period]
                  : { d: 'de hoje', w: 'desta semana', m: 'deste mês', y: 'deste ano', a: 'de todos os tempos' }[period];
    const mon = dex ? G.DEX_BY[dex].name : '';
    const where = en ? (mode === 's' ? 'solo' : 'group') + (dex ? ' with ' + mon : '')
                     : (mode === 's' ? 'solo' : 'em grupo') + (dex ? ' com ' + mon : '');
    $('rk-me').innerHTML = G.DB.guest ? 'Você está em modo Convidado. Crie uma conta para registrar recordes na classificação.'
      : !G.Social.me ? 'Defina um apelido (em Amigos) para aparecer na classificação.'
      : me && me.out ? (en ? `<span translate="no">You're not in the top 50 ${where} ${pn} yet. Your exact rank is in All-time.</span>`
                           : `Você ainda não está no top 50 ${pn} ${where}. Sua posição exata está em Todos os Tempos.`)
      : me ? (en ? `<span translate="no">Your best ${where} rank ${pn}: <b class="gold">#${me.pos}</b> · ${fmt(me.t)}</span>`
                 : `Sua melhor colocação ${pn} ${where}: <b class="gold">#${me.pos}</b> · ${fmt(me.t)}`)
      : (en ? `<span translate="no">You don't have a ${where} record ${pn} yet.</span>` : `Você ainda não possui recorde ${pn} ${where}.`);
  }

  function rowEl(r, pos, mine, b, done, cat = 'time') {
    const el = document.createElement('div');
    el.className = 'rk-row' + (mine ? ' mine' : '') + (pos <= 3 ? ' top' + pos : '');
    el.insertAdjacentHTML('beforeend', `<span class="pos">${pos <= 3 ? G.Icons.html('trophy', 20) : ''}${pos}</span>`);
    const mons = document.createElement('span');
    mons.className = 'mons';
    r.dex.forEach((d, i) => { if (G.DEX_BY[d]) mons.appendChild(G.UI.spriteCanvas(d, 44, 40, { scale: 1, shiny: !!r.shiny[i] })); });
    el.appendChild(mons);

    const isRifts = cat === 'rifts';
    const subText = isRifts
      ? `Nv. ${r.lv || 1} · Tempo: ${fmt(r.t)} · ${(r.kills || 0).toLocaleString('pt-BR')} derrotados`
      : `Nv. ${r.lv || 1} · ${(r.kills || 0).toLocaleString('pt-BR')} derrotados · ${(r.rifts || 0)} fendas`;
    const scoreDisplay = isRifts
      ? `<span class="time" style="color:#00ffcc;font-weight:bold">🌀 ${r.rifts || 0} fendas</span>`
      : `<span class="time">${fmt(r.t)}</span>`;

    el.insertAdjacentHTML('beforeend',
      `<span class="who"><b translate="no">${r.names.map((n, i) => `<a href="#" class="plink" data-u="${esc(r.uids[i] || '')}">${esc(n)}</a>`).join(' · ')}</b><small>${subText}</small></span>
       ${scoreDisplay}`);
    el.querySelectorAll('.plink').forEach(a => { a.onclick = e => { e.preventDefault(); G.ProfileUI.show(a.dataset.u); }; });
    if (!mine && G.Social.me) {
      const rep = document.createElement('button');
      const sent = done.has(b + '__' + r.id);
      rep.className = 'rk-rep' + (sent ? ' sent' : '');
      rep.title = sent ? 'Você já denunciou este recorde' : 'Denunciar recorde suspeito';
      rep.innerHTML = G.Icons.html('flag', 16);
      rep.onclick = async () => {
        if (rep.classList.contains('sent')) { G.UI.toast('Você já denunciou este recorde.'); return; }
        if (!confirm('Deseja denunciar o recorde de ' + r.names.join(', ') + ' como suspeito de trapaça?')) return;
        rep.classList.add('sent'); rep.title = 'Você já denunciou este recorde';
        await G.Ranking.report(b, r);
        G.UI.toast('Obrigado: a moderação irá analisar o recorde.');
      };
      el.appendChild(rep);
    } else el.appendChild(document.createElement('span'));
    return el;
  }

  return { init, open };
})();
