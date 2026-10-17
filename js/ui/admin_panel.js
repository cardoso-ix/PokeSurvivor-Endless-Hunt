/* ============ admin_panel.js — Painel Admin & Ferramentas de Desenvolvimento ============
 * Atalho de teclado global [F2] ou [~] / Aspas para abrir/fechar o modal de administração (#admin-debug-panel).
 * Permite desbloqueio instantâneo de espécies na Pokédex, shinies e iniciais jogáveis.
 * Comandos rápidos no console (F12): adminUnlock, adminUnlockAll, adminResetDex, admin.*
 */
(() => {
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
              style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #f8fafc; padding: 6px 8px; border-radius: 5px; font-size: 11px; margin-bottom: 6px;">
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

      if (isNewPanel) {
        panel.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #475569; padding-bottom:6px; margin-bottom:10px;">
            <div>
              <span style="font-weight:bold; color:#ffd166; font-size:13px;">🛠️ Painel Admin / Debug</span>
              <div style="font-size:10px; color:#94a3b8;">Atalhos: [F2] ou [~] / Aspas</div>
            </div>
            <button id="admin-panel-close-btn" style="background:#dc2626; border:none; color:white; border-radius:4px; cursor:pointer; font-weight:bold; padding:4px 8px; font-size:11px;">✕</button>
          </div>
          ${dexSectionHTML}
          <div style="font-size:10px; color:#64748b; text-align:center; padding-top:4px;">
            Console: <code>adminUnlock("charizard", true)</code> | <code>adminUnlockAll()</code>
          </div>
        `;
      } else {
        // Se o painel já existe (ex: debug_panel.js), injeta a seção de Pokédex no topo
        if (!document.getElementById('admin-dex-section')) {
          const header = panel.firstElementChild;
          if (header && typeof header.insertAdjacentHTML === 'function') {
            header.insertAdjacentHTML('afterend', dexSectionHTML);
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
            right: 12px;
            z-index: 999998;
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

      this.updateStats();
    },

    initKeyboard() {
      if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

      window.addEventListener('keydown', (e) => {
        const isF2 = (e.key === 'F2');
        const isTildeOrQuote = (e.key === '`' || e.key === '~' || e.code === 'Backquote' || e.key === "'" || e.key === '"');
        const target = e.target;
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

        // F2 abre/fecha o painel em qualquer situação
        if (isF2) {
          e.preventDefault();
          AdminPanel.toggle();
          return;
        }

        // Tecla ~ / Aspas abre/fecha se não estiver digitando em campo de texto
        if (isTildeOrQuote && !isInput) {
          e.preventDefault();
          AdminPanel.toggle();
          return;
        }

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

  // Atalhos e Comandos Globais de Console (F12)
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
    open: () => AdminPanel.open(),
    close: () => AdminPanel.close(),
    toggle: () => AdminPanel.toggle()
  };

  if (typeof window !== 'undefined') {
    window.AdminPanel = AdminPanel;
    window.adminPanel = AdminPanel;
    window.admin = globalObj;
    window.adminUnlock = (id, shiny) => globalObj.unlock(id, shiny);
    window.adminUnlockAll = (shiny) => globalObj.unlockAll(shiny);
    window.adminResetDex = () => globalObj.resetDex();
  }

  if (typeof G === 'object') {
    G.AdminPanel = AdminPanel;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
  }
})();
