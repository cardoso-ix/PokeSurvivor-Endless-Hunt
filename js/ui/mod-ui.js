/* ============ mod-ui.js — moderação da classificação (painel restrito) ============ */
G.ModUI = (() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tab = 'rep';

  function init() {
    $('mod-back').onclick = () => G.RankingUI.open();
    $('mod-purge').onclick = async () => {
      if (!confirm('Remover da classificação TODOS os recordes com mais de 1 hora? Esta ação é irreversível.')) return;
      const b = $('mod-purge');
      b.disabled = true;
      try {
        const r = await G.Ranking.purgeAbove(3600, (i, n) => { b.textContent = 'Verificando ' + i + ' / ' + n + '…'; });
        G.UI.toast('Removidos ' + r.rows + ' recordes com mais de 1 hora (' + r.boards + ' tabelas)', 5000);
      } catch (e) { G.UI.toast('Erro ao executar: ' + (e.code || e.message), 5000); }
      b.disabled = false; b.textContent = 'Remover recordes acima de 1 hora';
      render();
    };
    document.querySelectorAll('#mod-tabs .tab').forEach(t => { t.onclick = () => { tab = t.dataset.tab; render(); }; });
  }

  function open() {
    if (!G.Ranking.isAdmin()) return;
    G.UI.show('scr-mod', true);
    render();
  }

  const fmt = t => G.U.mmss(t || 0);
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'btn small ' + cls; b.textContent = label; b.onclick = fn; return b; };

  async function render() {
    document.querySelectorAll('#mod-tabs .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
    const list = $('mod-list');
    list.innerHTML = '<p class="sub">Carregando…</p>';
    try {
      if (tab === 'rep') await renderReports(list);
      else await renderMarked(list);
    } catch (e) {
      list.innerHTML = '<p class="sub">Não foi possível carregar (' + esc(e.code || e.message) + ').</p>';
    }
  }

  function boardName(b) {
    const [m, p] = b.split('_');
    const mode = m === 'g' ? 'Grupo' : 'Solo';
    const per = p.startsWith('d') ? 'Hoje' : p.startsWith('w') ? 'Semana' : p.startsWith('m') ? 'Mês' : 'Histórico';
    const dex = (b.match(/_p(\d+)$/) || [])[1];
    return mode + ' · ' + per + (dex && G.DEX_BY[dex] ? ' · apenas ' + G.DEX_BY[dex].name : '');
  }
  const SUSPECT_T = 33 * 60;

  async function renderReports(list) {
    const groups = await G.Ranking.reports();
    list.innerHTML = groups.length ? '' : '<p class="sub">Nenhum relatório pendente.</p>';
    for (const g of groups) {
      const row = document.createElement('div');
      row.className = 'rk-row mod-row rep';
      const mode = g.board.startsWith('g_') ? 'g' : 's';
      const info = await G.Ranking.entryInfo(g.board, g.e).catch(() => null);
      const t = info ? info.t : g.t;
      const sus = t > SUSPECT_T;
      const mons = document.createElement('span');
      mons.className = 'mons';
      if (info) info.dex.forEach((d, i) => { if (G.DEX_BY[d]) mons.appendChild(G.UI.spriteCanvas(d, 44, 40, { scale: 1, shiny: !!(info.shiny || [])[i] })); });
      row.innerHTML = `<span class="pos" title="vezes reportado">${g.n}×</span>`;
      row.appendChild(mons);
      row.insertAdjacentHTML('beforeend', `<span class="who"><b translate="no">${g.names.map(esc).join(' · ')}</b>
          <small>${esc(boardName(g.board))}${info ? ' · Nv. ' + (info.lv || 1) + ' · ' + (info.kills || 0).toLocaleString('pt-BR') + ' derrotados' : ' · já não está no top 50'}</small>
          ${sus ? '<small class="mod-warn">Mais de 33 min: improvável no Julgamento de Arceus</small>' : ''}</span>
        <span class="time${sus ? ' mod-warn' : ''}">${fmt(t)}</span>`);
      const acts = document.createElement('span');
      acts.className = 'mod-acts';
      const busy = async (fn, msg) => {
        acts.querySelectorAll('button').forEach(b => { b.disabled = true; });
        try { await fn(); G.UI.toast(msg); row.remove(); }
        catch (e) { G.UI.toast('Erro: ' + (e.code || e.message)); acts.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
      };
      acts.append(
        btn('Excluir recorde', 'ghost', () => busy(async () => {
          await G.Ranking.removeEverywhere(g.e, mode, [], g.board);
          await G.Ranking.dismiss(g.ids);
        }, 'Recorde excluído com sucesso')),
        btn('Banir', 'danger', () => {
          if (!confirm('Deseja banir ' + g.names.join(', ') + '? As contas serão impedidas de enviar novos recordes.')) return;
          busy(async () => {
            const uids = g.e.split('_');
            for (const u of uids) await G.Ranking.setMarked(u, true).catch(() => {});
            await G.Ranking.removeEverywhere(g.e, mode, [], g.board);
            await G.Ranking.dismiss(g.ids);
          }, 'Conta banida com sucesso');
        }),
        btn('Descartar', 'ghost', () => busy(() => G.Ranking.dismiss(g.ids), 'Denúncia descartada'))
      );
      row.appendChild(acts);
      list.appendChild(row);
    }
  }

  async function renderMarked(list) {
    const accs = await G.Ranking.markedAccounts();
    list.innerHTML = accs.length ? '' : '<p class="sub">Nenhuma conta banida.</p>';
    for (const a of accs) {
      const row = document.createElement('div');
      row.className = 'rk-row mod-row';
      row.innerHTML = `<span class="pos"></span>
        <span class="who"><b translate="no">${esc(a.name)}</b><small translate="no">${a.coins.toLocaleString('pt-BR')} moedas · ${a.t1} tickets · ${a.t10} ×10 · ${a.owned} Pokémon · ${esc(a.uid)}</small></span>`;
      const acts = document.createElement('span');
      acts.className = 'mod-acts';
      acts.append(btn('Desbanir', 'ghost', async () => {
        try { await G.Ranking.setMarked(a.uid, false); G.UI.toast('Conta desbanida'); row.remove(); }
        catch (e) { G.UI.toast('Erro: ' + (e.code || e.message)); }
      }));
      row.appendChild(acts);
      list.appendChild(row);
    }
  }

  return { init, open };
})();
