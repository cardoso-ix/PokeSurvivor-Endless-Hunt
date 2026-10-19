/* ============ support-ui.js — "Apoiar o projeto" ============
 * Botão com um coração na barra do menu e janela explicativa sobre
 * os custos de infraestrutura e hospedagem do PokéSurvivor.
 */
G.SupportUI = (() => {
  const $ = G.UI.$;
  const F = G.Funding;
  const val = v => typeof v === 'number'
    ? (Math.round(v * 100) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'EUR' }) + ' / mês'
    : v;

  function init() {
    const b = $('btn-support');
    if (!F.url) return;
    b.classList.remove('hidden');
    b.innerHTML = G.Icons.html('heart', 18) + ' <span>Apoiar</span>';
    b.onclick = open;
    $('sup-close').onclick = close;
  }

  function open() {
    const rows = F.costs.map(([c, v]) => `<tr><td>${c}</td><td class="num">${val(v)}</td></tr>`).join('');
    $('sup-body').innerHTML = `
      <p>PokéSurvivor é e sempre será <b>gratuito</b>, sem anúncios nem microtransações. Se deseja ajudar a mantê-lo online, você pode fazer uma
      <b>doação voluntária</b>: todo o valor arrecadado é destinado exclusivamente para a <b>manutenção dos servidores e domínio</b>.</p>
      <p class="sub">Doações são voluntárias e não concedem vantagens no jogo.</p>
      <h3>Custos de Manutenção</h3>
      <table class="sup-tab">${rows}</table>
      <p class="sub">Quanto mais jogadores ativos, maiores são as despesas de servidores. Qualquer valor excedente é mantido como reserva para os meses seguintes.</p>
      <div class="row wrap" style="gap:8px;justify-content:center;margin-top:10px">
        <a class="btn gold" href="${F.url}" target="_blank" rel="noopener">${G.Icons.html('heart', 18)} Apoiar no Ko-fi</a>
        ${window.PS_PAGES ? `<a class="btn" href="${G.I18n.lang === 'en' ? 'en/support/' : 'apoiar/'}" target="_blank">Mais Informações</a>` : ''}
      </div>`;
    $('scr-support').classList.remove('hidden');
  }
  function close() { $('scr-support').classList.add('hidden'); }

  return { init, open, close };
})();
