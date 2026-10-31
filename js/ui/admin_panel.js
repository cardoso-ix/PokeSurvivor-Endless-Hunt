/* ============ admin_panel.js — Painel Admin & Ferramentas de Desenvolvimento ============
 * Atalho de teclado global [F2] ou [~] / Aspas para abrir/fechar o modal de administração (#admin-debug-panel).
 * Permite desbloqueio instantâneo de espécies na Pokédex, shinies e iniciais jogáveis.
 * Comandos rápidos no console (F12): adminUnlock, adminUnlockAll, adminResetDex, admin.*
 */
(() => {
  const ADMIN_EMAILS = ['eduardoocardosoo@gmail.com'];
  const ADMIN_USERS = ['eduardo', 'cardoso', 'admin', 'eduardocardoso'];
  const ADMIN_UIDS = ['rshaa5gKD3fXw6lE4PPXITbowaG2'];

  function isUserAdmin() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ps_admin_authenticated') === 'true') {
      return true;
    }
    const db = (typeof G === 'object' && G.DB) || (typeof window !== 'undefined' && window.db);
    if (!db) return false;
    if (db.guest) return false;

    const email = (typeof db.currentEmail === 'string' ? db.currentEmail : '').toLowerCase();
    if (email && ADMIN_EMAILS.includes(email)) return true;

    const username = (typeof db.user === 'string' ? db.user : '').toLowerCase().trim();
    if (username && ADMIN_USERS.includes(username)) return true;

    if (typeof db.fb === 'object' && db.fb && db.fb.uid && ADMIN_UIDS.includes(db.fb.uid)) return true;

    return false;
  }

  const getDB = () => {
    return (typeof G === 'object' && G.DB) ||
           (typeof window !== 'undefined' && window.db) ||
           (typeof global !== 'undefined' && global.db) ||
           null;
  };

  const getPokedexList = () => {
    if (typeof G === 'object' && Array.isArray(G.DEX)) return G.DEX;
    if (typeof POKEDEX !== 'undefined') {
      const seen = new Set();
      const list = [];
      Object.values(POKEDEX).forEach(p => {
        if (p && p.dex && !seen.has(p.dex)) {
          seen.add(p.dex);
          list.push(p);
        }
      });
      return list.sort((a, b) => a.dex - b.dex);
    }
    return [];
  };

  const AdminPanel = {
    isOpen: false,

    toggle() {
      if (!isUserAdmin()) return false;
      const panel = document.getElementById('admin-debug-panel');
      if (!panel) {
        this.initDOM();
        return this.open();
      }
      const isCurrentlyOpen = panel.style.display !== 'none';
      if (isCurrentlyOpen) {
        return this.close();
      } else {
        return this.open();
      }
    },

    open() {
      if (!isUserAdmin()) return false;
      let panel = document.getElementById('admin-debug-panel');
      if (!panel) {
        this.initDOM();
        panel = document.getElementById('admin-debug-panel');
      }
      if (panel) {
        panel.style.display = 'block';
        this.isOpen = true;
        this.updateStats();
        const searchInput = document.getElementById('admin-dex-search');
        if (searchInput) searchInput.focus();
      }
      return true;
    },

    close() {
      const panel = document.getElementById('admin-debug-panel');
      if (panel) {
        panel.style.display = 'none';
        this.isOpen = false;
      }
      return false;
    },

    setFeedback(text, isError = false) {
      const el = document.getElementById('admin-unlock-feedback');
      if (!el) return;
      el.style.display = 'block';
      el.style.color = isError ? '#f87171' : '#4ade80';
      el.style.backgroundColor = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)';
      el.style.borderColor = isError ? '#ef4444' : '#22c55e';
      el.textContent = text;
      clearTimeout(this._feedbackTimer);
      this._feedbackTimer = setTimeout(() => {
        if (el) el.style.display = 'none';
      }, 4500);
    },

    updateStats() {
      const db = getDB();
      const dexList = getPokedexList();
      const totalDex = dexList.length || 1025;

      const capturedList = db && typeof db.getCapturedPokemon === 'function' ? db.getCapturedPokemon() : [];
      // Filtra apenas nomes ou números únicos para contar
      const capturedDex = new Set();
      capturedList.forEach(item => {
        if (/^\d+$/.test(String(item))) capturedDex.add(Number(item));
      });
      const capturedCount = capturedDex.size;

      const shinyList = db && typeof db.getCapturedShinies === 'function' ? db.getCapturedShinies() : [];
      const shinyDex = new Set();
      shinyList.forEach(item => {
        if (/^\d+$/.test(String(item))) shinyDex.add(Number(item));
      });
      const shinyCount = shinyDex.size;

      const playableList = db && typeof db.getUnlockedPlayable === 'function' ? db.getUnlockedPlayable() : [];
      const playableCount = Array.isArray(playableList) ? playableList.length : 0;

      const statsEl = document.getElementById('admin-stats-summary');
      if (statsEl) {
        const pctNormal = Math.round((capturedCount / totalDex) * 100);
        const pctShiny = Math.round((shinyCount / totalDex) * 100);
        statsEl.innerHTML = `
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span>📖 Pokédex Normal:</span>
            <span style="font-weight:bold; color:#4ade80;">${capturedCount} / ${totalDex} (${pctNormal}%)</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span>✨ Shinies Obtidos:</span>
            <span style="font-weight:bold; color:#facc15;">${shinyCount} / ${totalDex} (${pctShiny}%)</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>🎮 Iniciais Jogáveis:</span>
            <span style="font-weight:bold; color:#38bdf8;">${playableCount} espécies</span>
          </div>
        `;
      }
      this.updateGachaStats();
    },

    unlockSpecies(speciesQuery, isShiny = false) {
      if (!speciesQuery || !speciesQuery.trim()) {
        this.setFeedback('⚠️ Digite o nome ou número da espécie!', true);
        return false;
      }
      let q = speciesQuery.trim();
      // Remove prefixos como "#006 - " se selecionado da datalist
      const match = q.match(/^#?(\d+)/);
      if (match && !isNaN(Number(match[1]))) {
        q = match[1];
      } else {
        q = q.replace(/^[#\d\s\-]+/, '').trim().toLowerCase();
      }

      const db = getDB();
      if (!db || typeof db.adminUnlock !== 'function') {
        this.setFeedback('❌ Erro: db.adminUnlock não disponível!', true);
        return false;
      }

      const ok = db.adminUnlock(q, isShiny);
      if (ok) {
        const label = isShiny ? '✨ Shiny' : 'Normal';
        this.setFeedback(`✅ Desbloqueado com sucesso: ${q.toUpperCase()} (${label})!`);
        this.updateStats();
        // Limpa input
        const input = document.getElementById('admin-dex-search');
        if (input) input.value = '';
      } else {
        this.setFeedback(`❌ Espécie "${q}" não encontrada na Pokédex!`, true);
      }
      return ok;
    },

    unlockAll(isShiny = false) {
      const db = getDB();
      if (!db || typeof db.adminUnlockAll !== 'function') {
        this.setFeedback('❌ Erro: db.adminUnlockAll não disponível!', true);
        return false;
      }
      const count = db.adminUnlockAll(isShiny);
      const label = isShiny ? '✨ Todos os Shinies' : '🔓 Toda a Pokédex (Normais)';
      this.setFeedback(`🎉 ${label} liberada (${count} espécies)!`);
      this.updateStats();
      return true;
    },

    resetDex() {
      const db = getDB();
      if (!db || typeof db.adminResetDex !== 'function') {
        this.setFeedback('❌ Erro: db.adminResetDex não disponível!', true);
        return false;
      }
      db.adminResetDex();
      this.setFeedback('🗑️ Progresso da Pokédex resetado com sucesso!');
      this.updateStats();
      return true;
    },

    getTickets() {
      const db = getDB();
      if (!db || !db.save) return { t1: 0, t10: 0 };
      const t = db.save.tickets || { t1: 0, t10: 0 };
      return { t1: Number(t.t1) || 0, t10: Number(t.t10) || 0 };
    },

    setTickets(amount, type = 't1') {
      const db = getDB();
      const val = Math.max(0, Math.floor(Number(amount) || 0));
      if (db && typeof db.adminSetTickets === 'function') {
        db.adminSetTickets(val, type);
      } else if (db && db.save) {
        db.save.tickets = db.save.tickets || { t1: 0, t10: 0 };
        db.save.tickets[type] = val;
        if (typeof db.commit === 'function') db.commit('tickets');
        if (typeof G === 'object' && G.GachaUI && typeof G.GachaUI.refresh === 'function') G.GachaUI.refresh();
      }
      this.setFeedback(`🎟️ Tickets (${type}) definidos para: ${val.toLocaleString('pt-BR')}`);
      this.updateStats();
      return val;
    },

    addTickets(amount, type = 't1') {
      const db = getDB();
      const add = Math.floor(Number(amount) || 0);
      let val = 0;
      if (db && typeof db.adminAddTickets === 'function') {
        val = db.adminAddTickets(add, type);
      } else if (db && db.save) {
        db.save.tickets = db.save.tickets || { t1: 0, t10: 0 };
        const cur = Number(db.save.tickets[type]) || 0;
        val = Math.max(0, cur + add);
        db.save.tickets[type] = val;
        if (typeof db.commit === 'function') db.commit('tickets');
        if (typeof G === 'object' && G.GachaUI && typeof G.GachaUI.refresh === 'function') G.GachaUI.refresh();
      }
      const signal = add >= 0 ? '+' : '';
      this.setFeedback(`🎟️ ${signal}${add.toLocaleString('pt-BR')} Tickets! Novo saldo: ${val.toLocaleString('pt-BR')}`);
      this.updateStats();
      return val;
    },

    openGacha() {
      if (typeof G === 'object' && G.GachaUI && typeof G.GachaUI.open === 'function') {
        G.GachaUI.open(0);
        this.setFeedback('🎰 Tela da Roleta Gacha aberta!');
        return true;
      }
      this.setFeedback('❌ Interface GachaUI não carregada no momento!', true);
      return false;
    },

    spinRoulette(count = 1) {
      const db = getDB();
      if (!db || !db.save) {
        this.setFeedback('❌ Save do jogador não encontrado!', true);
        return null;
      }
      if (typeof G !== 'object' || !G.Gacha || typeof G.Gacha.pullRoulette !== 'function') {
        this.setFeedback('❌ Sistema G.Gacha não carregado!', true);
        return null;
      }

      const cost = (G.Gacha.ROULETTE_COST || 5000) * count;
      const curTickets = (db.save.tickets && db.save.tickets.t1) || 0;
      if (curTickets < cost) {
        this.setFeedback(`⚠️ Tickets insuficientes (${curTickets.toLocaleString('pt-BR')} de ${cost.toLocaleString('pt-BR')})! Digite uma quantidade e adicione no painel.`, true);
        return null;
      }

      const results = G.Gacha.pullRoulette(db.save, count);
      if (!results || !results.length) {
        this.setFeedback('❌ Erro ao sortear na Roleta!', true);
        return null;
      }

      if (typeof db.commit === 'function') db.commit('gacha');
      if (typeof G.GachaUI === 'object' && typeof G.GachaUI.refresh === 'function') G.GachaUI.refresh();
      if (typeof G.UI === 'object' && typeof G.UI.refreshCoins === 'function') G.UI.refreshCoins();

      const summary = results.map(r => {
        const star = r.isLegendary ? '👑 LENDÁRIO' : (r.shiny ? '✨ SHINY' : 'Normal');
        const dup = !r.isNew ? ' (Repetido: +1.000 moedas)' : ' (NOVO!)';
        return `${r.name} [${star}]${dup}`;
      }).join(', ');

      this.setFeedback(`🎰 Giro (${count}x): ${summary}`);
      this.updateStats();
      return results;
    },

    forceShiny(n = 1) {
      if (typeof G === 'object' && G.Gacha && typeof G.Gacha.debugForceShiny === 'function') {
        G.Gacha.debugForceShiny(n);
        this.setFeedback(`✨ Próximo(s) ${n} giro(s) da Roleta serão SHINY garantido!`);
        return true;
      }
      this.setFeedback('❌ G.Gacha.debugForceShiny não disponível!', true);
      return false;
    },

    forceLegendary(n = 1) {
      if (typeof G === 'object' && G.Gacha && typeof G.Gacha.debugForceLegendary === 'function') {
        G.Gacha.debugForceLegendary(n);
        this.setFeedback(`👑 Próximo(s) ${n} giro(s) da Roleta serão LENDÁRIO garantido!`);
        return true;
      }
      this.setFeedback('❌ G.Gacha.debugForceLegendary não disponível!', true);
      return false;
    },

    resetForces() {
      if (typeof G === 'object' && G.Gacha) {
        if (typeof G.Gacha.debugForceShiny === 'function') G.Gacha.debugForceShiny(0);
        if (typeof G.Gacha.debugForceLegendary === 'function') G.Gacha.debugForceLegendary(0);
        this.setFeedback('🔄 Forçamento resetado! Roleta 100% aleatória (1% Shiny, 5% Lendário, 94% Normal).');
        return true;
      }
      return false;
    },

    simulateRoulette(count = 50) {
      if (typeof G !== 'object' || !G.DEX || !Array.isArray(G.DEX)) {
        this.setFeedback('❌ Pokédex G.DEX não carregada!', true);
        return null;
      }

      const db = getDB();
      const owned = (db && db.save && db.save.owned) ? Object.assign({}, db.save.owned) : {};
      const allLegs = G.DEX.filter(p => p.rarity === 5 || p.legendary);
      const allNorms = G.DEX.filter(p => p.rarity < 5 && !p.legendary);
      const allShinies = G.DEX.filter(p => G.Sprites && G.Sprites.hasShiny ? G.Sprites.hasShiny(p.dex) : true);

      let shinyCount = 0;
      let legendCount = 0;
      let normalCount = 0;
      let newCount = 0;
      let dupCount = 0;
      let coinsEarned = 0;

      for (let i = 0; i < count; i++) {
        const roll = Math.random() * 100;
        let mon = null;
        let isShiny = false;

        if (roll < 1.0) {
          isShiny = true;
          mon = G.U.pick(allShinies.length ? allShinies : G.DEX);
          shinyCount++;
          if (mon.rarity === 5 || mon.legendary) legendCount++;
        } else if (roll < 6.0) {
          mon = G.U.pick(allLegs);
          legendCount++;
        } else {
          mon = G.U.pick(allNorms);
          normalCount++;
        }

        if (owned[mon.dex]) {
          dupCount++;
          coinsEarned += 1000;
        } else {
          newCount++;
          owned[mon.dex] = true;
        }
      }

      const pctShiny = ((shinyCount / count) * 100).toFixed(1);
      const pctLegend = ((legendCount / count) * 100).toFixed(1);
      const pctNormal = ((normalCount / count) * 100).toFixed(1);

      const resBox = document.getElementById('admin-sim-results');
      if (resBox) {
        resBox.style.display = 'block';
        resBox.innerHTML = `
          <div style="font-weight:bold; color:#a5b4fc; margin-bottom:3px;">📊 Resultado de ${count} Giros Simulados:</div>
          <div>👑 Lendários: <b style="color:#fbbf24">${legendCount}</b> (${pctLegend}% - Esperado: 5%)</div>
          <div>✨ Shinies: <b style="color:#facc15">${shinyCount}</b> (${pctShiny}% - Esperado: 1%)</div>
          <div>📦 Normais: <b style="color:#38bdf8">${normalCount}</b> (${pctNormal}% - Esperado: 94%)</div>
          <div>🆕 Inéditos: <b style="color:#4ade80">${newCount}</b> | 🔁 Repetidos: <b style="color:#f87171">${dupCount}</b></div>
          <div>🪙 Moedas Geradas: <b style="color:#facc15">+${coinsEarned.toLocaleString('pt-BR')}</b></div>
        `;
      }

      this.setFeedback(`🧪 Simulação de ${count} giros concluída! ${legendCount} Lendários, ${shinyCount} Shinies.`);
      return { count, legendCount, shinyCount, normalCount, newCount, dupCount, coinsEarned };
    },

    updateGachaStats() {
      const db = getDB();
      const s = (db && db.save) || {};
      const t1 = (s.tickets && s.tickets.t1) || 0;
      const coins = s.coins || 0;

      const tEl = document.getElementById('admin-tickets-display');
      if (tEl) tEl.textContent = t1.toLocaleString('pt-BR');

      const cEl = document.getElementById('admin-coins-display');
      if (cEl) cEl.textContent = coins.toLocaleString('pt-BR');

      const coinStatus = document.getElementById('admin-coins-status');
      if (coinStatus) {
        coinStatus.textContent = `🪙 Banco: ${coins.toLocaleString('pt-BR')}`;
      }
    },

    initDOM() {
      if (typeof document === 'undefined') return;

      // 1. Injetar Datalist global com todos os Pokémon
      if (!document.getElementById('admin-species-datalist')) {
        const datalist = document.createElement('datalist');
        datalist.id = 'admin-species-datalist';
        const list = getPokedexList();
        list.forEach(p => {
          const opt = document.createElement('option');
          const num = String(p.dex).padStart(3, '0');
          opt.value = `${p.name} (#${num})`;
          datalist.appendChild(opt);
        });
        document.body.appendChild(datalist);
      }

      // 2. Localiza ou cria o container #admin-debug-panel
      let panel = document.getElementById('admin-debug-panel');
      const isNewPanel = !panel;

      if (isNewPanel) {
        panel = document.createElement('div');
        panel.id = 'admin-debug-panel';
        panel.style.cssText = `
          position: fixed;
          top: 12px;
          right: 12px;
          width: 320px;
          max-height: calc(100vh - 24px);
          overflow-y: auto;
          background: rgba(13, 17, 23, 0.96);
          border: 2px solid #ffd166;
          color: #f1f5f9;
          padding: 12px;
          border-radius: 10px;
          font-family: monospace, "Segoe UI", sans-serif;
          font-size: 12px;
          z-index: 999999;
          display: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 209, 102, 0.25);
          user-select: text;
        `;
        document.body.appendChild(panel);
      }

      // 3. Montar seção de Desbloqueio da Pokédex
      const dexSectionHTML = `
        <div id="admin-dex-section" style="border: 1px solid rgba(255, 209, 102, 0.35); background: rgba(30, 41, 59, 0.7); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:bold; color:#ffd166; font-size:12px; display:flex; align-items:center; gap:5px;">
              <span>🎮</span> DESBLOQUEIO DE POKÉMON
            </span>
            <span style="font-size:10px; color:#94a3b8; background:rgba(0,0,0,0.4); padding:2px 5px; border-radius:4px;">[F2 / ~]</span>
          </div>

          <!-- Busca e Desbloqueio Individual -->
          <div style="margin-bottom:8px;">
            <input id="admin-dex-search" list="admin-species-datalist" type="text" placeholder="Buscar espécie (ex: charizard, 150)..."
              style="width: 100%; min-width:0; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #f8fafc; padding: 6px 8px; border-radius: 5px; font-size: 11px; margin-bottom: 6px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
              <button id="admin-btn-unlock-normal" class="admin-action-btn" style="background:#2563eb; color:#ffffff; font-weight:bold;">
                + Desbloquear Normal
              </button>
              <button id="admin-btn-unlock-shiny" class="admin-action-btn" style="background:#d97706; color:#fef08a; font-weight:bold;">
                ✨ Desbloquear Shiny
              </button>
            </div>
          </div>

          <!-- Feedback Visual Dinâmico -->
          <div id="admin-unlock-feedback" style="display:none; padding:6px 8px; border-radius:5px; font-size:11px; margin-bottom:8px; border:1px solid; line-height:1.3; text-align:center;"></div>

          <!-- Ações em Massa -->
          <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:8px; margin-top:8px;">
            <div style="font-weight:bold; color:#cbd5e1; font-size:11px; margin-bottom:6px;">📦 Ações em Massa</div>
            <div style="display:flex; flex-direction:column; gap:5px;">
              <button id="admin-btn-unlock-all-normal" class="admin-action-btn" style="background:#1e293b; color:#38bdf8; border:1px solid #0284c7;">
                🔓 Liberar Toda a Dex (Normais)
              </button>
              <button id="admin-btn-unlock-all-shiny" class="admin-action-btn" style="background:#1e293b; color:#fbbf24; border:1px solid #d97706;">
                ✨ Liberar Todos os Shinies
              </button>
              <button id="admin-btn-reset-progress" class="admin-action-btn" style="background:#450a0a; color:#fca5a5; border:1px solid #dc2626;">
                🗑️ Resetar Progresso da Dex
              </button>
            </div>
          </div>

          <!-- Resumo de Coleção -->
          <div id="admin-stats-summary" style="background:rgba(0,0,0,0.45); border-radius:6px; padding:6px 8px; font-size:11px; margin-top:8px; border:1px solid rgba(255,255,255,0.06);">
            Carregando estatísticas...
          </div>
        </div>
      `;

      // 3.1 Montar seção de Tickets e Roleta Gacha
      const gachaSectionHTML = `
        <div id="admin-gacha-section" style="border: 1px solid rgba(245, 158, 11, 0.45); background: rgba(30, 41, 59, 0.75); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:bold; color:#f59e0b; font-size:12px; display:flex; align-items:center; gap:5px;">
              <span>🎰</span> TICKETS & ROLETA GACHA
            </span>
            <button id="admin-btn-open-gacha-ui" class="admin-action-btn" style="background:#7c3aed; color:#fff; font-size:10px; padding:3px 7px;">
              Abrir Roleta ↗
            </button>
          </div>

          <!-- Saldo Atual -->
          <div id="admin-gacha-balance-box" style="background:rgba(0,0,0,0.45); border-radius:6px; padding:6px 8px; font-size:11px; margin-bottom:8px; border:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
              <span>🎟️ Seus Tickets:</span>
              <span id="admin-tickets-display" style="font-weight:bold; color:#38bdf8;">0</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>🪙 Suas PokéMoedas:</span>
              <span id="admin-coins-display" style="font-weight:bold; color:#facc15;">0</span>
            </div>
          </div>

          <!-- Injeção Customizada de Tickets -->
          <div style="margin-bottom:8px;">
            <div style="font-weight:bold; color:#cbd5e1; font-size:11px; margin-bottom:4px;">🎟️ Quantidade de Tickets:</div>
            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:6px;">
              <input id="admin-tickets-input" type="number" min="0" step="1000" placeholder="Qtd (ex: 5000)"
                style="flex:1 1 100%; min-width:0; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #f8fafc; padding: 6px 8px; border-radius: 5px; font-size: 11px;">
              <button id="admin-btn-set-tickets" class="admin-action-btn" style="flex:1; background:#0284c7; color:#fff; font-weight:bold; white-space:nowrap;" title="Define o saldo exato de tickets">
                Definir
              </button>
              <button id="admin-btn-add-tickets" class="admin-action-btn" style="flex:1; background:#16a34a; color:#fff; font-weight:bold; white-space:nowrap;" title="Soma a quantidade ao saldo atual">
                + Somar
              </button>
            </div>
            <!-- Botões Rápidos de Tickets -->
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:4px; margin-bottom:6px;">
              <button id="admin-btn-t-5k" class="admin-action-btn" style="background:#1e293b; color:#38bdf8; border:1px solid #0284c7; font-size:10px; padding:4px 2px;" title="+100 tickets (1 giro de Roleta)">
                +100 (1x)
              </button>
              <button id="admin-btn-t-25k" class="admin-action-btn" style="background:#1e293b; color:#38bdf8; border:1px solid #0284c7; font-size:10px; padding:4px 2px;" title="+500 tickets (5 giros de Roleta)">
                +500 (5x)
              </button>
              <button id="admin-btn-t-50k" class="admin-action-btn" style="background:#1e293b; color:#38bdf8; border:1px solid #0284c7; font-size:10px; padding:4px 2px;" title="+1.000 tickets (10 giros de Roleta)">
                +1.000 (10x)
              </button>
              <button id="admin-btn-t-zero" class="admin-action-btn" style="background:#450a0a; color:#fca5a5; border:1px solid #dc2626; font-size:10px; padding:4px 2px;" title="Zerar todos os tickets">
                Zerar
              </button>
            </div>
          </div>

          <!-- Ações de Giro da Roleta -->
          <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:8px; margin-top:8px; margin-bottom:8px;">
            <div style="font-weight:bold; color:#cbd5e1; font-size:11px; margin-bottom:5px;">🎯 Teste Direto de Roleta (100 tickets / giro)</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:6px;">
              <button id="admin-btn-spin-1" class="admin-action-btn" style="background:#d97706; color:#fff; font-weight:bold;">
                🎲 Girar Roleta 1x
              </button>
              <button id="admin-btn-spin-5" class="admin-action-btn" style="background:#b45309; color:#fef08a; font-weight:bold;">
                🌟 Girar Roleta 5x
              </button>
            </div>
          </div>

          <!-- Forçar Resultados para Testes de Animação e Regras -->
          <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:8px; margin-top:8px; margin-bottom:8px;">
            <div style="font-weight:bold; color:#cbd5e1; font-size:11px; margin-bottom:5px;">🔮 Forçar Próximo Resultado (Debug)</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; margin-bottom:4px;">
              <button id="admin-btn-force-shiny" class="admin-action-btn" style="background:#1e293b; color:#facc15; border:1px solid #eab308; font-size:10px;">
                ✨ Forçar Shiny (1%)
              </button>
              <button id="admin-btn-force-legend" class="admin-action-btn" style="background:#1e293b; color:#fb923c; border:1px solid #f97316; font-size:10px;">
                👑 Forçar Lendário (5%)
              </button>
            </div>
            <button id="admin-btn-reset-forces" class="admin-action-btn" style="width:100%; background:#1e293b; color:#94a3b8; border:1px solid #475569; font-size:10px;">
              🔄 Resetar Forçamento (Aleatório)
            </button>
          </div>

          <!-- Auditoria / Simulação em Lote -->
          <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:8px; margin-top:8px;">
            <div style="font-weight:bold; color:#cbd5e1; font-size:11px; margin-bottom:4px;">🧪 Simulação Estatística em Lote</div>
            <div style="display:flex; gap:5px; margin-bottom:6px;">
              <input id="admin-sim-count-input" type="number" min="1" max="1000" value="50" placeholder="Qtd (ex: 50)"
                style="width:80px; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #f8fafc; padding: 5px 6px; border-radius: 5px; font-size: 11px;">
              <button id="admin-btn-run-simulation" class="admin-action-btn" style="flex:1; background:#4f46e5; color:#fff; font-weight:bold;">
                Simular Giros
              </button>
            </div>
            <div id="admin-sim-results" style="display:none; background:rgba(0,0,0,0.55); border-radius:5px; padding:6px 8px; font-size:10px; line-height:1.4; border:1px solid rgba(255,255,255,0.08);"></div>
          </div>
        </div>
      `;

      if (isNewPanel) {
        panel.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #475569; padding-bottom:6px; margin-bottom:10px;">
            <div>
              <span style="font-weight:bold; color:#ffd166; font-size:13px;">🛠️ Painel Admin / Debug</span>
              <div style="font-size:10px; color:#94a3b8;">Atalhos: [F2] ou [~] / Aspas</div>
            </div>
            <button id="admin-panel-close-btn" style="background:#dc2626; border:none; color:white; border-radius:4px; cursor:pointer; font-weight:bold; padding:4px 8px; font-size:11px;">✕</button>
          </div>
          ${gachaSectionHTML}
          ${dexSectionHTML}
          <div style="font-size:10px; color:#64748b; text-align:center; padding-top:4px;">
            Console: <code>admin.setTickets(50000)</code> | <code>admin.spin(5)</code>
          </div>
        `;
      } else {
        // Se o painel já existe (ex: debug_panel.js), injeta a seção de Roleta e Pokédex no topo
        if (!document.getElementById('admin-gacha-section')) {
          // depois do status (que vem logo após o menu de seções), para o menu ficar no topo
          const header = document.getElementById('admin-status-text') || panel.firstElementChild;
          if (header && typeof header.insertAdjacentHTML === 'function') {
            header.insertAdjacentHTML('afterend', gachaSectionHTML);
          } else if (typeof panel.insertAdjacentHTML === 'function') {
            panel.insertAdjacentHTML('afterbegin', gachaSectionHTML);
          } else {
            panel.innerHTML = gachaSectionHTML + panel.innerHTML;
          }
        }
        if (!document.getElementById('admin-dex-section')) {
          const gachaSec = document.getElementById('admin-gacha-section');
          if (gachaSec && typeof gachaSec.insertAdjacentHTML === 'function') {
            gachaSec.insertAdjacentHTML('afterend', dexSectionHTML);
          } else if (typeof panel.insertAdjacentHTML === 'function') {
            panel.insertAdjacentHTML('afterbegin', dexSectionHTML);
          } else {
            panel.innerHTML = dexSectionHTML + panel.innerHTML;
          }
        }
      }

      // 4. Injetar Estilos CSS dos botões admin
      if (!document.getElementById('admin-panel-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-panel-styles';
        style.textContent = `
          .admin-action-btn {
            border: none;
            padding: 6px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 11px;
            font-family: inherit;
            transition: all 0.15s ease;
            text-align: center;
            white-space: normal;
            overflow-wrap: anywhere;
            box-sizing: border-box;
            min-width: 0;
          }
          .admin-action-btn:hover {
            filter: brightness(1.15);
            transform: translateY(-1px);
          }
          .admin-action-btn:active {
            transform: translateY(1px);
          }
          #admin-float-pill {
            position: fixed;
            bottom: 12px;
            left: 12px;
            z-index: 99999;
            background: linear-gradient(180deg, #1e3a8a, #0f172a);
            border: 2px solid #ffd166;
            color: #ffd166;
            font-weight: bold;
            font-size: 11px;
            font-family: monospace, sans-serif;
            padding: 6px 12px;
            border-radius: 20px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            cursor: pointer;
            transition: transform 0.15s ease;
          }
          #admin-float-pill:hover {
            transform: scale(1.05);
            filter: brightness(1.2);
          }
        `;
        document.head.appendChild(style);
      }

      // 5. Botão flutuante na tela (se ainda não existir)
      let pill = document.getElementById('admin-float-pill');
      if (!pill) {
        pill = document.createElement('button');
        pill.id = 'admin-float-pill';
        pill.innerHTML = '🛠️ Admin <span style="opacity:0.8; font-size:10px;">[F2]</span>';
        pill.style.display = isUserAdmin() ? 'block' : 'none';
        document.body.appendChild(pill);
      }
      pill.onclick = () => AdminPanel.toggle();

      // 6. Vincular Eventos dos botões
      const bind = (id, fn) => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = fn;
      };

      bind('admin-panel-close-btn', () => AdminPanel.close());
      bind('admin-close-btn', () => AdminPanel.close());

      const handleUnlock = (isShiny) => {
        const input = document.getElementById('admin-dex-search');
        if (input) AdminPanel.unlockSpecies(input.value, isShiny);
      };

      bind('admin-btn-unlock-normal', () => handleUnlock(false));
      bind('admin-btn-unlock-shiny', () => handleUnlock(true));
      bind('admin-btn-unlock-all-normal', () => AdminPanel.unlockAll(false));
      bind('admin-btn-unlock-all-shiny', () => AdminPanel.unlockAll(true));
      bind('admin-btn-reset-progress', () => {
        if (typeof confirm === 'function' && !confirm('Tem certeza que deseja resetar o progresso da Pokédex?')) {
          return;
        }
        AdminPanel.resetDex();
      });

      const searchInput = document.getElementById('admin-dex-search');
      if (searchInput) {
        searchInput.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleUnlock(false);
          }
          e.stopPropagation();
        };
      }

      // Binds da Seção de Gacha e Tickets
      bind('admin-btn-open-gacha-ui', () => AdminPanel.openGacha());
      bind('admin-btn-set-tickets', () => {
        const inp = document.getElementById('admin-tickets-input');
        if (inp && inp.value !== '') AdminPanel.setTickets(inp.value);
      });
      bind('admin-btn-add-tickets', () => {
        const inp = document.getElementById('admin-tickets-input');
        if (inp && inp.value !== '') AdminPanel.addTickets(inp.value);
      });
      bind('admin-btn-t-5k', () => AdminPanel.addTickets(100));
      bind('admin-btn-t-25k', () => AdminPanel.addTickets(500));
      bind('admin-btn-t-50k', () => AdminPanel.addTickets(1000));
      bind('admin-btn-t-zero', () => AdminPanel.setTickets(0));

      bind('admin-btn-spin-1', () => AdminPanel.spinRoulette(1));
      bind('admin-btn-spin-5', () => AdminPanel.spinRoulette(5));
      bind('admin-btn-force-shiny', () => AdminPanel.forceShiny(1));
      bind('admin-btn-force-legend', () => AdminPanel.forceLegendary(1));
      bind('admin-btn-reset-forces', () => AdminPanel.resetForces());
      bind('admin-btn-run-simulation', () => {
        const inp = document.getElementById('admin-sim-count-input');
        const count = inp ? (parseInt(inp.value, 10) || 50) : 50;
        AdminPanel.simulateRoulette(count);
      });

      const ticketsInput = document.getElementById('admin-tickets-input');
      if (ticketsInput) {
        ticketsInput.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            AdminPanel.setTickets(ticketsInput.value);
          }
          e.stopPropagation();
        };
      }

      this.updateStats();
    },

    initKeyboard() {
      if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

      window.addEventListener('keydown', (e) => {
        // F2, F1 e ~ ficam só no debug_panel.js (antes os dois scripts alternavam o painel e ele abria e fechava).

        // Tecla Escape fecha o painel se estiver aberto
        if (e.key === 'Escape') {
          const panel = document.getElementById('admin-debug-panel');
          if (panel && panel.style.display !== 'none') {
            e.preventDefault();
            AdminPanel.close();
          }
        }
      });
    }
  };

  // Inicialização no DOM
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        AdminPanel.initDOM();
        AdminPanel.initKeyboard();
      });
    } else {
      AdminPanel.initDOM();
      AdminPanel.initKeyboard();
    }
  }

  // Só admin executa: window.AdminPanel, window.admin e window.admin* ficam acessíveis pelo console.
  const PUBLIC_PANEL_FNS = ['close', 'setFeedback', 'updateStats', 'updateGachaStats', 'initDOM', 'initKeyboard'];
  for (const k of Object.keys(AdminPanel)) {
    const f = AdminPanel[k];
    if (typeof f === 'function' && !PUBLIC_PANEL_FNS.includes(k)) {
      AdminPanel[k] = function (...a) { return isUserAdmin() ? f.apply(this, a) : false; };
    }
  }

  // Atalhos e Comandos Globais de Console (F12)
  const adminOnly = fn => (...a) => (isUserAdmin() ? fn(...a) : false);
  const globalObj = {
    unlock: (id, isShiny = false) => {
      const db = getDB();
      return db && typeof db.adminUnlock === 'function' ? db.adminUnlock(id, isShiny) : false;
    },
    unlockAll: (isShiny = false) => {
      const db = getDB();
      return db && typeof db.adminUnlockAll === 'function' ? db.adminUnlockAll(isShiny) : 0;
    },
    resetDex: () => {
      const db = getDB();
      return db && typeof db.adminResetDex === 'function' ? db.adminResetDex() : false;
    },
    setTickets: (amount, type = 't1') => AdminPanel.setTickets(amount, type),
    addTickets: (amount, type = 't1') => AdminPanel.addTickets(amount, type),
    getTickets: () => AdminPanel.getTickets(),
    spin: (count = 1) => AdminPanel.spinRoulette(count),
    simulate: (count = 50) => AdminPanel.simulateRoulette(count),
    forceShiny: (n = 1) => AdminPanel.forceShiny(n),
    forceLegendary: (n = 1) => AdminPanel.forceLegendary(n),
    resetForces: () => AdminPanel.resetForces(),
    openGacha: () => AdminPanel.openGacha(),
    open: () => AdminPanel.open(),
    close: () => AdminPanel.close(),
    toggle: () => AdminPanel.toggle()
  };
  for (const k of Object.keys(globalObj)) globalObj[k] = adminOnly(globalObj[k]);

  if (typeof window !== 'undefined') {
    window.AdminPanel = AdminPanel;
    window.adminPanel = AdminPanel;
    window.admin = globalObj;
    window.adminUnlock = (id, shiny) => globalObj.unlock(id, shiny);
    window.adminUnlockAll = (shiny) => globalObj.unlockAll(shiny);
    window.adminResetDex = () => globalObj.resetDex();
    window.adminSetTickets = (n, t) => AdminPanel.setTickets(n, t);
    window.adminAddTickets = (n, t) => AdminPanel.addTickets(n, t);
    window.adminGetTickets = () => AdminPanel.getTickets();
    window.adminSpin = (n) => AdminPanel.spinRoulette(n);
    window.adminSimulate = (n) => AdminPanel.simulateRoulette(n);
    window.adminForceShiny = (n) => AdminPanel.forceShiny(n);
    window.adminForceLegendary = (n) => AdminPanel.forceLegendary(n);
    window.adminOpenGacha = () => AdminPanel.openGacha();
  }

  if (typeof G === 'object') {
    G.AdminPanel = AdminPanel;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
  }
})();
