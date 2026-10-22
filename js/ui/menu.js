/* ============ menu.js — menú principal, colección y mejoras ============ */
G.MenuUI = (() => {
  const $ = G.UI.$;
  const GEN_NAMES = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];
  let dexFilter = 'all', dexGen = 1, dexSel = null;

  function ensureEligiblePartner(s) {
    if (!s || !s.partner) return;
    if (typeof G.isEligibleToStartRun === 'function' && !G.isEligibleToStartRun(s.partner)) {
      let curDex = s.partner;
      let dev = typeof G.getDevolutionData === 'function' ? G.getDevolutionData(curDex) : null;
      while (dev && dev.prev) {
        const baseMon = G.DEX.find(m => m.name.toLowerCase() === dev.prev.toLowerCase());
        if (baseMon) {
          curDex = baseMon.dex;
          dev = G.getDevolutionData(curDex);
        } else break;
      }
      s.partner = curDex;
      if (G.DB && G.DB.commit) G.DB.commit();
    }
  }

  function init() {
    const ICON = { play: 'ball', dex: 'book', upgrades: 'up', gacha: 'ball4', goals: 'medal3', friends: 'friends', rank: 'trophy', settings: 'gear' };
    document.querySelectorAll('#scr-menu [data-go]').forEach(b => {
      b.insertAdjacentHTML('afterbegin', `<span class="mi-ico">${G.Icons.html(ICON[b.dataset.go], 26)}</span>`);
      b.dataset.sfx = b.dataset.go === 'play' ? 'confirm' : 'click';
      b.onclick = () => {
        const go = b.dataset.go;
        if (go === 'play') {
          ensureEligiblePartner(G.DB.save);
          if (G.Social.room) G.LobbyUI.open();
          else if (G.StageSelectUI && G.StageSelectUI.open) G.StageSelectUI.open();
          else G.Flow.play();
        }
        else if (go === 'dex') openDex();
        else if (go === 'upgrades') openUpgrades();
        else if (go === 'gacha') {
          if (G.GachaUI && G.GachaUI.open) G.GachaUI.open();
        }
        else if (go === 'goals') G.GoalsUI.open();
        else if (go === 'friends') G.FriendsUI.open();
        else if (go === 'rank') G.RankingUI.open();
        else if (go === 'settings') G.SettingsUI.open();
      };
    });
    document.querySelectorAll('[data-back]').forEach(b => { b.onclick = open; });
    G.Social.on(() => { if (G.UI.isOpen('scr-menu')) socialLine(); });
    $('btn-logout').onclick = () => {
      if (G.DB.guest && !confirm('Você está como convidado: todo o progresso não salvo será perdido. Deseja sair?')) return;
      G.Audio.music(null);
      G.DB.logout().then(() => G.Flow.toLogin());
    };
  }

  // ---------------- menú principal ----------------

  function open() {
    const s = G.DB.save;
    if (!s) return;
    if (!s.partner || !G.DEX_BY[s.partner]) {
      s.partner = 1; // Inicial padrão caso não definido
      s.owned = s.owned || {};
      s.owned[1] = 1;
      if (G.DB.commit) G.DB.commit();
    }
    ensureEligiblePartner(s);
    const mon = G.DEX_BY[s.partner] || G.DEX[0];
    const shiny = !!s.partnerShiny && G.DB.ownsShiny(mon.dex);
    G.UI.chrome(true);
    G.UI.show('scr-menu');
    G.UI.sprite($('menu-partner'), mon.dex, { lively: true, scale: 4, hero: true, shiny });
    $('menu-partner').style.setProperty('--stage-c', shiny ? '#9ae6ff' : G.U.TYPE_COLOR[mon.types[0]]);
    $('menu-partner').classList.toggle('shiny', shiny);
    const isLeg = mon.leg || mon.rarity >= 5;
    let badge = '';
    if (shiny && isLeg) badge = ' <span class="badge-gold" style="font-size:11px; color:#ffd700; font-weight:bold;">✨👑 +50% ATQ</span>';
    else if (shiny) badge = ' <span class="badge-shiny" style="font-size:11px; color:#9ae6ff; font-weight:bold;">✨ +25% ATQ</span>';
    else if (isLeg) badge = ' <span class="badge-leg" style="font-size:11px; color:#f59e0b; font-weight:bold;">👑 +20% ATQ</span>';
    $('menu-partner-name').innerHTML = mon.name + badge;
    $('menu-partner-info').innerHTML = G.UI.typeChips(mon.types) + ' ' + G.UI.stars(mon.rarity);
    // Normal / shiny a mano, aquí mismo (en el móvil no se encontraba en la ficha).
    const seg = $('menu-shiny');
    seg.classList.toggle('hidden', !G.DB.ownsShiny(mon.dex));
    seg.lastChild.innerHTML = G.Icons.html('shiny', 12) + ' Shiny';
    seg.querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', (b.dataset.v === '1') === shiny);
      b.onclick = () => {
        if ((b.dataset.v === '1') === shiny) return;
        s.partnerShiny = b.dataset.v === '1';
        G.DB.commit();
        G.Audio.sfx('confirm');
        open();
      };
    });

    const owned = Object.keys(s.owned).filter(d => G.DEX_BY[d]).length;
    const shinies = Object.keys(s.shiny || {}).length;
    $('menu-dex-count').textContent = `${owned} / ${G.DEX.length}` + (shinies ? ` · ${shinies} shiny` : '');

    const st = s.stats;
    $('menu-stats').innerHTML =
      `Partidas <b style="color:#fff">${st.runs}</b> · Melhor Tempo <b style="color:#fff">${G.U.mmss(st.bestTime)}</b><br>` +
      `Maior Nível <b style="color:#fff">${st.bestLevel}</b> · Derrotados <b style="color:#fff">${st.totalKills.toLocaleString('pt-BR')}</b>` +
      (G.DB.guest ? '<br><span style="color:#ffb0b8">Modo Convidado: o progresso não é salvo na nuvem</span>' : '');

    socialLine();
    // Premios de misiones por recoger.
    G.Progress.checkAch();
    const pend = G.Progress.pending();
    $('menu-goals-sub').textContent = pend ? pend + (pend === 1 ? ' recompensa para resgatar' : ' recompensas para resgatar') : 'Missões, conquistas e perfil';
    $('menu-goals-sub').classList.toggle('gold', pend > 0);
    // Con cuenta en la nube: amigos en línea, invitaciones y (una vez) el apodo.
    if (G.DB.online && !G.Social.started) {
      G.Social.start().then(r => {
        if (r === 'need-nick' && !G.NickUI.skipped && G.UI.isOpen('scr-menu')) G.NickUI.open();
        socialLine();
      });
    }
    G.InvitePop.refresh();
  }

  /** Texto sob "Amigos" e "Jogar": quem está online, solicitações, sala. */
  function socialLine() {
    const room = G.Social.room;
    const play = document.querySelector('#scr-menu [data-go=play] small');
    if (play) play.textContent = room ? 'Voltar para a sala (' + room.members.length + '/' + G.Social.MAX_PLAYERS + ')' : 'Entrar na Masmorra';
    const fr = G.Social.friends;
    const on = fr.filter(f => f.status === 'ok' && f.online).length;
    const req = fr.filter(f => f.status === 'in').length;
    const parts = [];
    if (on) parts.push(on + ' online');
    if (req) parts.push(req + (req === 1 ? ' solicitação' : ' solicitações'));
    $('menu-friends-sub').textContent = parts.length ? parts.join(' · ') : 'Jogue em grupo, até 4 jogadores';
    $('menu-friends-sub').classList.toggle('gold', req > 0);
  }

  // ---------------- coleção ----------------

  function openDex() {
    G.UI.show('scr-dex', true);
    const s = G.DB.save;
    if (dexSel == null) { dexSel = s.partner; dexGen = G.DEX_BY[s.partner].gen; }
    const owned = Object.keys(s.owned).filter(d => G.DEX_BY[d]).length;
    $('dex-total').textContent = `${owned} / ${G.DEX.length}`;

    // Pestañas de generación, con cuántos tienes de cada una.
    const tabs = $('dex-gens');
    tabs.innerHTML = '';
    GEN_NAMES.forEach((name, i) => {
      const g = i + 1;
      const total = G.DEX.filter(p => p.gen === g).length;
      const have = G.DEX.filter(p => p.gen === g && s.owned[p.dex]).length;
      const b = document.createElement('button');
      b.className = 'gen-tab' + (g === dexGen ? ' on' : '');
      b.innerHTML = `<b>${name}</b><small>${have}/${total}</small>`;
      b.onclick = () => { dexGen = g; openDex(); };
      tabs.appendChild(b);
    });

    const F = [['all', 'Todos'], ['own', 'Tenho'], ['miss', 'Faltam'], ['shiny', 'Shiny'],
               ['5', 5], ['4', 4], ['3', 3], ['2', 2], ['1', 1]];
    const fb = $('dex-filters');
    fb.innerHTML = '';
    for (const [k, label] of F) {
      const c = document.createElement('button');
      c.className = 'chip' + (k === dexFilter ? ' on' : '');
      c.innerHTML = k === 'shiny' ? G.Icons.html('shiny', 12) + ' Shiny'
                  : typeof label === 'number' ? G.Icons.rarity(label, 12) + ' ' + G.Gacha.RARITY_NAME[label] : label;
      c.onclick = () => { dexFilter = k; openDex(); };
      fb.appendChild(c);
    }
    renderGrid();
    showDetail(dexSel);
  }

  function renderGrid() {
    const s = G.DB.save;
    const grid = $('dex-grid');
    grid.innerHTML = '';
    for (const p of G.DEX) {
      if (p.gen !== dexGen) continue;
      const own = !!s.owned[p.dex], sh = !!(s.shiny && s.shiny[p.dex]);
      const eligible = typeof G.isEligibleToStartRun === 'function' ? G.isEligibleToStartRun(p.dex) : true;
      if (dexFilter === 'own' && !own) continue;
      if (dexFilter === 'miss' && own) continue;
      if (dexFilter === 'shiny' && !sh) continue;
      if (/^\d$/.test(dexFilter) && p.rarity !== +dexFilter) continue;

      const cell = document.createElement('div');
      cell.className = 'cell' + (own ? '' : ' locked') + (p.dex === dexSel ? ' on' : '');
      cell.insertAdjacentHTML('beforeend', `<span class="no">${String(p.dex).padStart(3, '0')}</span>`);
      if (p.dex === s.partner) cell.insertAdjacentHTML('beforeend', `<span class="badge-r" title="Companheiro">${G.Icons.html('crown', 14)}</span>`);
      else if (sh) cell.insertAdjacentHTML('beforeend', `<span class="badge-r" title="Você possui a versão Shiny">${G.Icons.html('shiny', 12)}</span>`);
      if (own && !eligible) cell.insertAdjacentHTML('beforeend', `<span class="badge-l" title="Obtido apenas evoluindo na partida!" style="position:absolute;bottom:4px;right:4px;background:rgba(20,20,20,0.85);color:#ffa726;font-size:10px;padding:2px 5px;border-radius:4px;font-weight:bold;z-index:2;border:1px solid rgba(255,167,38,0.4)">🔒 Evo</span>`);
      const useShiny = sh && p.dex === s.partner && s.partnerShiny;
      cell.appendChild(G.UI.spriteCanvas(p.dex, 92, 80, { scale: 2, silhouette: !own, shadow: own, shiny: useShiny }));
      cell.insertAdjacentHTML('beforeend', `<b>${own ? p.name : '???'}</b>${G.UI.stars(p.rarity, 9)}`);
      cell.onclick = () => {
        dexSel = p.dex;
        grid.querySelectorAll('.cell').forEach(c => c.classList.remove('on'));
        cell.classList.add('on');
        showDetail(p.dex);
      };
      grid.appendChild(cell);
    }
    if (!grid.children.length) grid.innerHTML = '<p class="sub" style="grid-column:1/-1">Nenhum Pokémon encontrado com este filtro.</p>';
  }

  // Variante que se está viendo en la ficha (normal o shiny).
  let viewShiny = false;

  function showDetail(dex) {
    const s = G.DB.save;
    const p = G.DEX_BY[dex];
    const own = !!s.owned[dex];
    const hasSh = G.DB.ownsShiny(dex);
    const isPartner = dex === s.partner;
    if (!hasSh) viewShiny = false;
    else if (isPartner && dex !== showDetail.last) viewShiny = !!s.partnerShiny;
    showDetail.last = dex;

    const max = { hp: 183, atk: 1.55, spd: 137 };
    const bar = (label, v, m, txt) =>
      `<div class="stat"><span>${label}</span><div class="bar"><i style="width:${Math.min(100, v / m * 100)}%"></i></div><span>${txt}</span></div>`;
    const usingThis = isPartner && (!hasSh || !!s.partnerShiny === viewShiny);
    const eligible = typeof G.isEligibleToStartRun === 'function' ? G.isEligibleToStartRun(dex) : true;

    const actionButton = usingThis
      ? '<button class="btn grow" disabled style="width:100%">É o seu companheiro</button>'
      : !eligible
        ? `<button id="dex-pick" class="btn" disabled style="width:100%;background:#3a3a40;color:#999;cursor:not-allowed;border:1px solid #555" title="Obtido apenas evoluindo na partida!">🔒 Apenas via Evolução na Run</button>
           <p style="font-size:12px;color:#ffa726;margin:6px 0 0;text-align:center">Formas evoluídas não podem iniciar partidas. Evolua a forma base durante a run!</p>`
        : `<button id="dex-pick" class="btn gold" data-sfx="confirm" style="width:100%">Escolher como companheiro${viewShiny ? ' (shiny)' : ''}</button>`;

    const box = $('dex-detail');
    box.innerHTML = `
      <canvas id="dex-big" class="stage" width="220" height="190"></canvas>
      ${hasSh ? `<div class="seg">
          <button class="${viewShiny ? '' : 'on'}" data-v="0">Normal</button>
          <button class="${viewShiny ? 'on' : ''}" data-v="1">${G.Icons.html('shiny', 12)} Shiny</button></div>` : ''}
      <div class="center">
        <div style="color:var(--muted);font-size:13px">Nº ${String(p.dex).padStart(3, '0')} · ${GEN_NAMES[p.gen - 1]}</div>
        <h3>${own ? p.name : '???'}</h3>
        <div style="color:${G.Gacha.RARITY_COLOR[p.rarity]}">${G.UI.stars(p.rarity, 24)} ${G.Gacha.RARITY_NAME[p.rarity]}</div>
        <div style="margin:6px 0">${own ? G.UI.typeChips(p.types) : ''}</div>
        ${(() => {
          const isL = p.leg || p.rarity >= 5;
          const isS = viewShiny;
          if (isL && isS) {
            return '<div style="margin:6px 0;padding:6px;background:rgba(255,215,0,0.15);border:1px solid #ffd700;border-radius:4px;font-size:11px;color:#ffd700;font-weight:bold;text-align:center">✨👑 PRESTÍGIO APEX: +50% DANO · +25% HP · +10% VEL</div>';
          } else if (isS) {
            return '<div style="margin:6px 0;padding:6px;background:rgba(154,230,255,0.15);border:1px solid #9ae6ff;border-radius:4px;font-size:11px;color:#9ae6ff;font-weight:bold;text-align:center">✨ PRESTÍGIO SHINY: +25% DANO · +10% HP · +5% VEL</div>';
          } else if (isL) {
            return '<div style="margin:6px 0;padding:6px;background:rgba(245,158,11,0.15);border:1px solid #f59e0b;border-radius:4px;font-size:11px;color:#f59e0b;font-weight:bold;text-align:center">👑 PRESTÍGIO LENDÁRIO: +20% DANO · +15% HP · +5% VEL</div>';
          }
          return '';
        })()}
      </div>
      ${own ? `
        ${bar('Vida In-game', p.hp, max.hp, p.hp)}
        ${bar('Ataque In-game', p.atk, max.atk, '×' + p.atk.toFixed(2))}
        ${bar('Velocidade In-game', p.spd, max.spd, p.spd)}
        
        <!-- Painel de Status Oficiais The Pokémon Company -->
        ${(() => {
          const bs = (typeof G.getBaseStats === 'function') ? G.getBaseStats(dex) : { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50, bst: 300 };
          return `
          <div class="poke-official-stats-box" style="margin:10px 0;background:#141624;border:2px solid #3a3f58;border-radius:6px;padding:8px 10px;font-family:'Pixelify','Press Start 2P',monospace;box-shadow:inset 0 0 8px rgba(0,0,0,0.5)">
            <div style="font-size:11px;font-weight:bold;color:#ffd23f;margin-bottom:6px;display:flex;justify-content:space-between;border-bottom:1px solid #3a3f58;padding-bottom:4px">
              <span>📊 ATRIBUTOS BASE OFICIAIS</span>
              <span style="color:#00ffcc">BST: ${bs.bst}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:6px;font-size:11px">
              <div>💖 HP: <b style="color:#ff7777">${bs.hp}</b></div>
              <div>⚔️ ATK: <b style="color:#ff9f43">${bs.atk}</b></div>
              <div>🛡️ DEF: <b style="color:#54a0ff">${bs.def}</b></div>
              <div>✨ S.ATK: <b style="color:#f368e0">${bs.spa}</b></div>
              <div>🔮 S.DEF: <b style="color:#1dd1a1">${bs.spd}</b></div>
              <div>👟 SPEED: <b style="color:#00d2d3">${bs.spe}</b></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:4px;border-top:1px dashed #3a3f58;font-size:10px;color:#aaa">
              <span>🎯 Crítico: <b style="color:#ffd23f">+5%</b></span>
              <span>⏱️ Recarga (CDA): <b style="color:#00ffcc">0%</b></span>
              <span>⚡ Ataques Simultâneos: <b style="color:#fff">Até 4</b></span>
            </div>
          </div>`;
        })()}

        <p style="font-size:14px;margin:10px 0 4px">Começa com <b class="gold">${G.Moves.BY_ID[G.startMoveOf(dex)].name}</b></p>
        <p class="move-icons" title="Ataques que pode aprender">
          ${G.Moves.poolFor(p).map(id => `<span title="${G.Moves.BY_ID[id].name}">${G.Icons.html('move:' + id, 16)}</span>`).join('')}</p>
        ${actionButton}
      ` : `<p class="center" style="color:var(--muted)">Ainda não capturado.<br>Derrote o Guardião na <b class="gold">Fenda Dimensional (Rift)</b> para capturá-lo.</p>`}
    `;
    $('dex-big').style.setProperty('--stage-c', !own ? '#5b83d6' : viewShiny ? '#9ae6ff' : G.U.TYPE_COLOR[p.types[0]]);
    $('dex-big').classList.toggle('shiny', own && viewShiny);
    G.UI.sprite($('dex-big'), dex, { lively: own, spin: own, silhouette: !own, scale: 3, hero: true, shiny: own && viewShiny });
    box.querySelectorAll('.seg button').forEach(b => {
      b.onclick = () => { viewShiny = b.dataset.v === '1'; showDetail(dex); };
    });
    const pick = $('dex-pick');
    if (pick && eligible) pick.onclick = () => {
      if (typeof G.isEligibleToStartRun === 'function' && !G.isEligibleToStartRun(dex)) {
        if (G.UI && G.UI.toast) G.UI.toast('Este Pokémon só pode ser obtido evoluindo durante a run!');
        return;
      }
      s.partner = dex;
      s.partnerShiny = hasSh && viewShiny;
      G.DB.commit();
      G.UI.toast(p.name + (s.partnerShiny ? ' shiny' : '') + ' agora é seu companheiro!');
      renderGrid(); showDetail(dex);
    };
  }

  // ---------------- melhorias ----------------

  let upgDex = null;

  function openUpgrades() {
    G.UI.show('scr-upgrades', true);
    const s = G.DB.save;
    if (!upgDex || !s.owned[upgDex]) upgDex = s.partner;
    // Seletor com seus Pokémon: o parceiro primeiro, depois os que já têm melhorias.
    const sel = $('upg-mon');
    const lv = d => Object.values(s.pupg[d] || {}).reduce((a, b) => a + b, 0);
    const mons = Object.keys(s.owned).map(Number).filter(d => G.DEX_BY[d])
      .sort((a, b) => (b === s.partner) - (a === s.partner) || lv(b) - lv(a) || a - b);
    sel.innerHTML = mons.map(d => `<option value="${d}">${G.DEX_BY[d].name}${d === s.partner ? ' (companheiro)' : ''}${lv(d) ? ' · ' + lv(d) + ' níveis' : ''}</option>`).join('');
    sel.value = upgDex;
    sel.onchange = () => { upgDex = +sel.value; G.Audio.sfx('select'); renderUpgrades(); };
    renderUpgrades();
  }

  function renderUpgrades() {
    const s = G.DB.save;
    const levels = G.DB.upgradesOf(upgDex);
    const mon = G.DEX_BY[upgDex];
    const shiny = upgDex === s.partner && !!s.partnerShiny && G.DB.ownsShiny(upgDex);
    G.UI.sprite($('upg-stage'), upgDex, { lively: true, scale: 2, hero: true, shiny });
    $('upg-stage').style.setProperty('--stage-c', shiny ? '#9ae6ff' : G.U.TYPE_COLOR[mon.types[0]]);

    const box = $('upg-list');
    box.innerHTML = '';
    for (const u of G.Upgrades.LIST) {
      const lvl = levels[u.id] || 0;
      const baseMaxed = lvl >= u.max;
      const overLvl = Math.max(0, lvl - u.max); // 0 a 10
      const nextOverLvl = overLvl + 1; // 1 a 10
      const supremeMaxed = overLvl >= 10;
      const cost = supremeMaxed ? 0 : G.Upgrades.cost(u.id, lvl, upgDex);
      const canAfford = s.coins >= cost;
      const rawName = window.i18n ? window.i18n.t(`upgrades.${u.id}`) : null;
      const upgName = (rawName && rawName !== `upgrades.${u.id}` && !rawName.startsWith('upgrades.')) ? rawName : u.name;
      const rawDesc = window.i18n ? window.i18n.t(`upgrades.${u.id}Desc`) : null;
      let upgDesc = (rawDesc && rawDesc !== `upgrades.${u.id}Desc` && !rawDesc.startsWith('upgrades.')) ? rawDesc : u.unit;

      // Descrições de super buff quando em Ascensão (+1 a +10)
      if (baseMaxed && !supremeMaxed) {
        const BUFF_TIPS = {
          atk: `+10% de Dano Supremo (+100% no +10)`,
          crit: `+2,5% de Chance Crítica (+25% no +10)`,
          hp: `+35 PV Máximo (+350 PV no +10)`,
          def: `+2,0% de Defesa Absoluta (+20% no +10)`,
          cd: `-2,5% de Tempo de Recarga (-25% no +10)`,
          spd: `+2,5% de Velocidade de Movimento (+25% no +10)`,
          regen: `+1,0 PV por segundo (+10 PV/s no +10)`,
          magnet: `+15% de Raio de Coleta de Ímã (+150% no +10)`,
          xp: `+10% de Experiência Obtida (+100% no +10)`,
          coins: `+10% de PokéMoedas Recebidas (+100% no +10)`,
          reroll: `+1 Troca de Cartas por Nível`,
          ban: `+1 Veto de Ataque por Nível`,
          moves: `+10% de Dano das Habilidades Iniciais`
        };
        upgDesc = `Ascensão +${nextOverLvl}: ${BUFF_TIPS[u.id] || '+Super Bônus de Atributos'}`;
      } else if (supremeMaxed) {
        upgDesc = 'Ascensão Suprema +10 Concluída (Poder Máximo)';
      }

      const chooseText = (window.i18n ? window.i18n.t('upgrades.choose') : null) || 'Escolher';
      const el = document.createElement('div');
      el.className = 'panel upg-item';

      // Badge visual de Ascensão (+1..+10)
      const plusBadge = overLvl > 0
        ? `<span style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:bold;margin-left:4px;box-shadow:0 0 6px rgba(245,158,11,0.6);">+${overLvl}</span>`
        : '';

      // Pips: pips base se lvl < u.max, ou pips dourados de Ascensão se baseMaxed
      let pipsHtml = '';
      if (!baseMaxed) {
        pipsHtml = `<div class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>`;
      } else {
        pipsHtml = `<div class="pips" style="margin-top:4px;" title="Níveis de Ascensão (+1 a +10)">
          <span style="font-size:10px;color:#fbbf24;font-weight:bold;margin-right:4px;">ASCENSÃO:</span>
          ${Array.from({ length: 10 }, (_, i) => `<i class="${i < overLvl ? 'on' : ''}" style="${i < overLvl ? 'background:#f59e0b;box-shadow:0 0 5px #fbbf24;border-color:#fbbf24;' : 'border-color:#78350f;background:rgba(0,0,0,0.5);'}"></i>`).join('')}
        </div>`;
      }

      // Botão de compra
      let buyBtnHtml = '';
      if (supremeMaxed) {
        buyBtnHtml = `<button class="btn small upg-max-btn" disabled style="background:#1e293b;color:#f59e0b;border:1px solid #d97706;font-weight:bold;letter-spacing:0.5px;">+10 MÁXIMO</button>`;
      } else if (baseMaxed) {
        buyBtnHtml = `<button class="btn small ${canAfford ? 'gold' : ''}" data-buy data-sfx="none"
          ${!canAfford ? 'disabled' : ''}
          style="${!canAfford ? 'background:#2a2a30;color:#ff7777;border:1px solid #772222;cursor:not-allowed;' : 'background:linear-gradient(180deg,#f59e0b,#b45309);color:#fff;font-weight:bold;border:1px solid #fbbf24;box-shadow:0 0 8px rgba(245,158,11,0.5);'} white-space:nowrap; padding:4px 8px;"
          title="${!canAfford ? 'PokéMoedas insuficientes para Ascensão' : `Liberar Ascensão +${nextOverLvl}`}">
          +${nextOverLvl} &nbsp;<span class="coin"></span> ${cost.toLocaleString('pt-BR')}
        </button>`;
      } else {
        buyBtnHtml = `<button class="btn small ${canAfford ? 'gold' : ''}" data-buy data-sfx="none"
          ${!canAfford ? 'disabled' : ''}
          style="${!canAfford ? 'background:#2a2a30;color:#ff7777;border:1px solid #772222;cursor:not-allowed;' : ''}"
          title="${!canAfford ? (window.i18n && window.i18n.currentLang === 'en-US' ? 'Insufficient PokéCoins' : 'PokéMoedas insuficientes') : ''}">
          <span class="coin"></span> ${cost.toLocaleString('pt-BR')}
        </button>`;
      }

      el.innerHTML = `
        <div class="ic">${G.Icons.html(u.icon, 32)}</div>
        <div style="min-width:0">
          <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap">
            <b style="font-size:14px;white-space:nowrap">${upgName}</b>${plusBadge}
            <span style="color:${baseMaxed ? '#fbbf24' : 'var(--muted)'};font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${upgDesc}</span>
          </div>
          ${pipsHtml}
        </div>
        <div class="upg-btns">
          ${u.id === 'ban' && lvl > 0 ? `<button class="btn small" data-ban>${chooseText} (${banList().length}/${lvl})</button>` : ''}
          ${buyBtnHtml}
        </div>`;

      if (u.id === 'ban' && lvl > 0) {
        const banBtn = el.querySelector('[data-ban]');
        if (banBtn) banBtn.onclick = () => { banOpen = !banOpen; renderUpgrades(); };
      }
      const buyBtn = el.querySelector('[data-buy]');
      if (buyBtn) buyBtn.onclick = () => {
        const sv = G.DB.save, lv = G.DB.upgradesOf(upgDex), now = lv[u.id] || 0;
        const maxTot = u.max + 10;
        if (now >= maxTot) { renderUpgrades(); return; }
        const price = G.Upgrades.cost(u.id, now, upgDex);
        if (sv.coins < price) {
          if (G.UI && G.UI.toast) G.UI.toast('PokéMoedas insuficientes!');
          renderUpgrades();
          return;
        }
        sv.coins -= price;
        lv[u.id] = now + 1;
        G.DB.commit(true);
        G.Audio.sfx('buy');
        G.UI.refreshCoins();
        if (now >= u.max) {
          const nextPlus = (now - u.max) + 1;
          G.UI.toast(`🔥 ${mon.name} · ${upgName} ASCENSÃO +${nextPlus} DESBLOQUEADA!`, 4500);
        } else {
          G.UI.toast(`${mon.name} · ${upgName}: nível ${now + 1}`);
        }
        renderUpgrades();
      };
      box.appendChild(el);
      if (u.id === 'ban' && lvl > 0 && banOpen) box.appendChild(banPicker(lvl));
    }
    box.appendChild(startMovesPanel());
    box.appendChild(bindPanel());
  }

  // ---------------- atajos: hueco fijo para cada movimiento ----------------
  // save.pbind[dex] = [movimiento del hueco 1, del 2, del 3, del 4] (o null).
  
  // ---------------- escolha de ataques iniciais ----------------
  function startMovesPanel() {
    const s = G.DB.save;
    s.customStartMoves = s.customStartMoves || {};
    const defaultStart = G.startMoveOf(upgDex);
    const custom = s.customStartMoves[upgDex] || [defaultStart];
    const mon = G.DEX_BY[upgDex];
    const allMoves = G.Moves.poolFor(mon).concat([defaultStart]).filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'pt-BR'));

    const move1 = custom[0] || defaultStart;
    const move2 = custom[1] || '';

    const el = document.createElement('div');
    el.className = 'panel start-moves-panel';
    el.style.cssText = 'background:#141624;border:2px solid #3a3f58;border-radius:8px;padding:12px;margin:10px 0;box-shadow:0 4px 12px rgba(0,0,0,0.6)';
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <b style="color:#ffd23f;font-size:14px;display:flex;align-items:center;gap:6px">
          <span>🎯</span> ATAQUES INICIAIS DA PARTIDA
        </b>
        <span style="font-size:11px;color:#00ffcc;font-weight:bold">${move2 ? '2 Ataques Selecionados' : '1 Ataque Selecionado'}</span>
      </div>
      <p class="sub" style="margin:0 0 10px;font-size:12px;color:#bbb">
        Escolha até 2 ataques para <b>${mon.name}</b> iniciar a partida. Até o Nível 20 você escolhe mais poderes e, a partir do Nv. 20, todos os 4 ataques permanecem combando juntos sem interrupções!
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <label style="flex:1;min-width:200px">
          <span style="display:block;font-size:11px;font-weight:bold;color:#ffd23f;margin-bottom:4px">1º Ataque Inicial (Principal):</span>
          <select id="start-move-1" class="field" style="width:100%;background:#1e2238;color:#fff;border:1px solid #4a5170;padding:6px;border-radius:4px">
            ${allMoves.map(id => `<option value="${id}" ${id === move1 ? 'selected' : ''}>${G.Moves.BY_ID[id].name}</option>`).join('')}
          </select>
        </label>
        <label style="flex:1;min-width:200px">
          <span style="display:block;font-size:11px;font-weight:bold;color:#ffd23f;margin-bottom:4px">2º Ataque Inicial (Opcional):</span>
          <select id="start-move-2" class="field" style="width:100%;background:#1e2238;color:#fff;border:1px solid #4a5170;padding:6px;border-radius:4px">
            <option value="">Nenhum (Começar com apenas 1 ataque)</option>
            ${allMoves.filter(id => id !== move1).map(id => `<option value="${id}" ${id === move2 ? 'selected' : ''}>${G.Moves.BY_ID[id].name}</option>`).join('')}
          </select>
        </label>
      </div>
    `;

    const sel1 = el.querySelector('#start-move-1');
    const sel2 = el.querySelector('#start-move-2');

    const saveChanges = () => {
      const v1 = sel1.value;
      const v2 = sel2.value;
      const chosen = [v1];
      if (v2 && v2 !== v1) chosen.push(v2);
      s.customStartMoves[upgDex] = chosen;
      G.DB.commit();
      G.Audio.sfx('select');
      G.UI.toast(`Ataques iniciais de ${mon.name} configurados!`);
      renderUpgrades();
    };

    sel1.onchange = saveChanges;
    sel2.onchange = saveChanges;

    return el;
  }

  function bindPanel() {
    const s = G.DB.save;
    s.pbind = s.pbind || {};
    const list = s.pbind[upgDex] || [null, null, null, null];
    const mon = G.DEX_BY[upgDex];
    const ids = G.Moves.poolFor(mon).concat([G.startMoveOf(upgDex)]).filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'es'));
    const el = document.createElement('div');
    el.className = 'panel bind-panel';
    el.innerHTML = `<b>Atalhos de ataques</b>
      <p class="sub" style="margin:2px 0 8px">Escolha qual ataque vai sempre em cada espaço (teclas 1-4 ou os ícones abaixo), para a memória muscular. Se ainda não tiver tantos ataques, vai para o espaço mais próximo.</p>
      <div class="bind-slots">${[0, 1, 2, 3].map(i => `<label class="bind-slot"><span>${i + 1}</span>
        <select class="field" data-slot="${i}"><option value="">Livre</option>${ids.map(id =>
          `<option value="${id}" ${list[i] === id ? 'selected' : ''}>${G.Moves.BY_ID[id].name}</option>`).join('')}</select></label>`).join('')}</div>`;
    el.querySelectorAll('select[data-slot]').forEach(sel => {
      sel.onchange = () => {
        const l = (s.pbind[upgDex] || [null, null, null, null]).slice(0, 4);
        while (l.length < 4) l.push(null);
        const i = +sel.dataset.slot, id = sel.value || null;
        for (let j = 0; j < 4; j++) if (id && l[j] === id) l[j] = null;
        l[i] = id;
        s.pbind[upgDex] = l;
        G.DB.commit();
        G.Audio.sfx('select');
        renderUpgrades();
      };
    });
    return el;
  }

  // ---------------- veto / banimento: ataques bloqueados ----------------
  let banOpen = false;
  function banList() {
    const s = G.DB.save;
    s.pban = s.pban || {};
    return s.pban[upgDex] || (s.pban[upgDex] = []);
  }
  function banPicker(max) {
    const mon = G.DEX_BY[upgDex];
    const start = G.startMoveOf(upgDex);
    const ids = G.Moves.poolFor(mon).filter(id => id !== start)
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'pt-BR'));
    const list = banList();
    const el = document.createElement('div');
    el.className = 'panel ban-picker';
    el.innerHTML = `<p class="sub" style="margin:0 0 8px">Toque nos ataques que você não quer que apareçam nas cartas (${list.length}/${max}). O ataque inicial não pode ser banido.</p>
      <div class="ban-moves">${ids.map(id => { const d = G.Moves.BY_ID[id]; const on = list.includes(id);
        return `<button class="chip ${on ? 'on ban' : ''}" data-id="${id}">${G.Icons.html('move:' + id, 16)} ${d.name}${on ? ' ' + G.Icons.html('ban', 14) : ''}</button>`; }).join('')}</div>`;
    el.querySelectorAll('[data-id]').forEach(b => {
      b.onclick = () => {
        const l = banList(), id = b.dataset.id, i = l.indexOf(id);
        if (i >= 0) l.splice(i, 1);
        else if (l.length >= max) { G.UI.toast(`Você já baniu ${max} ataques: remova um primeiro.`); return; }
        else l.push(id);
        G.DB.commit();
        G.Audio.sfx('select');
        renderUpgrades();
      };
    });
    return el;
  }

  return { init, open, openDex, showDetail, openUpgrades, renderUpgrades, GEN_NAMES };
})();
