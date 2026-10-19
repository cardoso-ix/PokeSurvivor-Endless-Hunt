/* ============ debug_panel.js — Modo Administrador / Painel de Depuração ============
 * Interface visual flutuante para testes de evolução, devolução, progressão e combate.
 * Acesso via interface (botão flutuante), atalhos de teclado (F1 ou `) e window.adminTools.
 */
(() => {
  const getPlayer = () => {
    return (typeof window !== 'undefined' && window.game && window.game.player) ||
           (typeof G === 'object' && G.Game && G.Game.player) ||
           null;
  };

  // ---------------- Funções de Administração ----------------
  const adminTools = {
    toggle() {
      const panel = document.getElementById('admin-debug-panel');
      if (!panel) return false;
      const isOpen = panel.style.display !== 'none';
      panel.style.display = isOpen ? 'none' : 'block';
      this.updateStatus();
      return !isOpen;
    },

    open() {
      const panel = document.getElementById('admin-debug-panel');
      if (panel) { panel.style.display = 'block'; this.updateStatus(); }
    },

    close() {
      const panel = document.getElementById('admin-debug-panel');
      if (panel) panel.style.display = 'none';
    },

    forceEvolve() {
      const p = getPlayer();
      if (!p) { this.toast('Nenhuma partida em andamento!'); return; }

      let target = null;
      if (typeof getEvolutionData === 'function') {
        const evoRaw = getEvolutionData(p.species);
        if (Array.isArray(evoRaw)) target = evoRaw[0] && evoRaw[0].next;
        else if (evoRaw && evoRaw.next) target = evoRaw.next;
      }

      if (!target) {
        this.toast(p.mon.name + ' não possui próxima evolução cadastrada!');
        return;
      }

      p.evolveTo(target);
      this.updateStatus();
    },

    devolve() {
      const p = getPlayer();
      if (!p) { this.toast('Nenhuma partida em andamento!'); return; }
      if (typeof p.devolve === 'function') {
        p.devolve();
      } else {
        this.toast('Função devolve não encontrada no jogador.');
      }
      this.updateStatus();
    },

    transformTo(name) {
      const p = getPlayer();
      if (!p) { this.toast('Nenhuma partida em andamento!'); return; }
      if (!name || !name.trim()) return;
      const res = p.evolveTo(name.trim());
      if (!res) {
        this.toast('Espécie "' + name + '" não encontrada na Pokédex!');
      } else {
        this.updateStatus();
      }
    },

    evoMode: 'fast', // 'fast' (Nv 5/10), 'official' (Nv 16/36), 'instant' (Nv 1)
    toggleEvoMode() {
      if (this.evoMode === 'fast') this.evoMode = 'official';
      else if (this.evoMode === 'official') this.evoMode = 'instant';
      else this.evoMode = 'fast';

      const labels = {
        official: 'Oficial (Nv. 16/36)',
        fast: 'Rápido (Nv. 5/10)',
        instant: 'Livre (A partir do Nv. 1)'
      };
      this.toast('Progresso de Evolução: ' + labels[this.evoMode]);
      this.updateStatus();
    },

    freezeMode: 'fluid', // 'fluid' (0s), 'quick' (0.3s), 'classic' (1.5s)
    toggleFreezeMode() {
      if (this.freezeMode === 'fluid') {
        this.freezeMode = 'quick';
        if (typeof G === 'object' && G.Game) G.Game.evolutionPauseDuration = 0.3;
        this.toast('Pausa na Evolução: Rápida (0.3s)');
      } else if (this.freezeMode === 'quick') {
        this.freezeMode = 'classic';
        if (typeof G === 'object' && G.Game) G.Game.evolutionPauseDuration = 1.5;
        this.toast('Pausa na Evolução: Clássica (1.5s Congelado)');
      } else {
        this.freezeMode = 'fluid';
        if (typeof G === 'object' && G.Game) G.Game.evolutionPauseDuration = 0;
        this.toast('Pausa na Evolução: Fluida (0s - 60 FPS Sem Travar)');
      }
      this.updateStatus();
    },

    addLevel(n = 1) {
      const p = getPlayer();
      if (!p) { this.toast('Nenhuma partida em andamento!'); return; }

      if (n === 1) {
        if (typeof G === 'object' && G.Game && typeof G.Game.triggerLevelUp === 'function') {
          p.level++;
          p.xpNext = G.Player ? G.Player.xpFor(p.level) : 100;
          G.Game.triggerLevelUp(1);
        } else if (typeof p.addXp === 'function') {
          const needed = Math.max(1, (p.xpNext || 100) - (p.xp || 0));
          p.addXp(needed);
        } else if (typeof G === 'object' && G.Game && typeof G.Game.debugLevelUp === 'function') {
          G.Game.debugLevelUp();
        }
        this.toast('Subiu de nível! Abrindo cartas...');
      } else {
        // Sobe múltiplos níveis diretos para testes de escala
        for (let i = 0; i < n; i++) {
          p.level++;
          p.maxHp += 8;
          p.hp = Math.min(p.maxHp, p.hp + 8);
        }
        if (typeof G === 'object' && G.Player && G.Player.xpFor) {
          p.xpNext = G.Player.xpFor(p.level);
        }
        if (typeof G === 'object' && G.Audio) G.Audio.sfx('levelup');
        this.toast('+' + n + ' Níveis adicionados! Nv. atual: ' + p.level);
      }
      this.updateStatus();
    },

    addExp(amount = 1000) {
      const p = getPlayer();
      if (!p) { this.toast('Nenhuma partida em andamento!'); return; }
      p.xp = (p.xp || 0) + amount;
      if (typeof G === 'object' && G.Audio) G.Audio.sfx('xp');
      this.toast('+' + amount + ' EXP concedida!');
      this.updateStatus();
    },

    addCoins(amount = 1000) {
      amount = Math.max(1, Math.floor(Number(amount) || 0));

      // 1. Salva no banco de dados persistente (save.coins)
      if (typeof G === 'object' && G.DB && G.DB.save) {
        G.DB.save.coins = (G.DB.save.coins || 0) + amount;
        if (G.DB.save.stats) {
          G.DB.save.stats.coinsEarned = (G.DB.save.stats.coinsEarned || 0) + amount;
        }
        if (typeof G.DB.commit === 'function') G.DB.commit();
        if (typeof G.UI === 'object' && typeof G.UI.refreshCoins === 'function') {
          G.UI.refreshCoins();
        }
      }

      // 2. Adiciona ao jogador na run atual se houver partida em andamento
      const p = getPlayer();
      if (p) {
        p.coins = (p.coins || 0) + amount;
      }

      // Feedback audiovisual
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) {
        G.Audio.sfx('coin');
      }

      const totalCoins = (typeof G === 'object' && G.DB && G.DB.save) ? G.DB.save.coins : (p ? p.coins : amount);
      this.toast(`🪙 +${amount.toLocaleString('pt-BR')} moedas geradas! (Total: ${totalCoins.toLocaleString('pt-BR')})`);
      this.updateStatus();
      return totalCoins;
    },

    addTickets(amount = 5000) {
      amount = Math.floor(Number(amount) || 0);
      let total = 0;
      if (typeof G === 'object' && G.DB && typeof G.DB.adminAddTickets === 'function') {
        total = G.DB.adminAddTickets(amount);
      } else if (typeof AdminPanel !== 'undefined' && typeof AdminPanel.addTickets === 'function') {
        total = AdminPanel.addTickets(amount);
      }
      this.toast(`🎟️ +${amount.toLocaleString('pt-BR')} Tickets de Roleta! (Total: ${total.toLocaleString('pt-BR')})`);
      this.updateStatus();
      return total;
    },

    setTickets(amount = 5000) {
      amount = Math.max(0, Math.floor(Number(amount) || 0));
      let total = 0;
      if (typeof G === 'object' && G.DB && typeof G.DB.adminSetTickets === 'function') {
        total = G.DB.adminSetTickets(amount);
      } else if (typeof AdminPanel !== 'undefined' && typeof AdminPanel.setTickets === 'function') {
        total = AdminPanel.setTickets(amount);
      }
      this.toast(`🎟️ Saldo de Tickets definido para: ${total.toLocaleString('pt-BR')}`);
      this.updateStatus();
      return total;
    },

    spinRoulette(count = 1) {
      if (typeof AdminPanel !== 'undefined' && typeof AdminPanel.spinRoulette === 'function') {
        return AdminPanel.spinRoulette(count);
      } else if (typeof G === 'object' && G.Gacha && G.DB && G.DB.save) {
        const res = G.Gacha.pullRoulette(G.DB.save, count);
        this.updateStatus();
        return res;
      }
      return null;
    },

    openGacha() {
      if (typeof G === 'object' && G.GachaUI && typeof G.GachaUI.open === 'function') {
        G.GachaUI.open(0);
        this.toast('🎰 Roleta Gacha aberta!');
      }
    },

    toggleGodMode() {
      const p = getPlayer();
      if (!p) { this.toast('Nenhuma partida em andamento!'); return; }
      p.isGodMode = !p.isGodMode;
      p.godMode = p.isGodMode;
      if (p.isGodMode) p.hp = p.maxHp;
      this.toast('Modo Deus: ' + (p.isGodMode ? 'ATIVADO 🛡️' : 'DESATIVADO'));
      this.updateStatus();
      return p.isGodMode;
    },

    fillSpecial() {
      const p = getPlayer();
      if (!p) { this.toast('Nenhuma partida em andamento!'); return; }

      if (typeof p.activateMega === 'function') {
        p.activateMega(15);
      } else {
        p.hp = p.maxHp;
        if (typeof p.addBuff === 'function') {
          p.addBuff('atk', 1.5, 30, 5);
          p.addBuff('spd', 0.75, 30, 5);
        }
        p.invuln = Math.max(p.invuln || 0, 10);
      }
      this.toast('⭐ MODO MEGA FÚRIA ATIVADO! (Super Star Frenzy)');
      this.updateStatus();
    },

    killAll() {
      if (typeof G !== 'object' || !G.EnemyMgr) return;
      const all = G.EnemyMgr.all ? G.EnemyMgr.all().slice() : [];
      let count = 0;
      for (const e of all) {
        if (!e.dead) {
          e.hurt(999999, '#ffffff', 0, 0, 0, 'super');
          count++;
        }
      }
      this.toast('💥 ' + count + ' inimigos eliminados!');
    },

    toggleSpawn() {
      if (typeof G !== 'object' || !G.Spawner) return;
      G.Spawner.disabled = !G.Spawner.disabled;
      this.toast('Spawn de monstros: ' + (G.Spawner.disabled ? 'PAUSADO ⏸️' : 'ATIVO ▶️'));
      this.updateStatus();
      return !G.Spawner.disabled;
    },

    healFull() {
      const p = getPlayer();
      if (!p) return;
      p.hp = p.maxHp;
      if (typeof G === 'object' && G.Audio) G.Audio.sfx('heal');
      this.toast('Vida 100% restaurada!');
      this.updateStatus();
    },

    toggleShiny() {
      const p = getPlayer();
      if (!p) return;
      if (typeof p.toggleShiny === 'function') p.toggleShiny();
      this.updateStatus();
    },

    triggerRift(species, isShiny) {
      if (typeof G === 'object' && G.Rift && G.Rift.triggerGuardian) {
        G.Rift.triggerGuardian(species, isShiny);
        this.toast(`🌀 Rift disparado com ${species || 'aleatório'}!`);
      } else {
        this.toast('Rift disponível apenas durante a partida!');
      }
    },

    addRifts(amount = 1) {
      if (typeof G === 'object' && G.DB && G.DB.addRiftCleared) {
        const total = G.DB.addRiftCleared(amount);
        if (G.UI && G.UI.refreshCoins) G.UI.refreshCoins();
        this.toast(`🌀 +${amount} Rifts! Total: ${total}`);
        this.updateStatus();
        return total;
      }
      this.toast('Banco de dados não carregado.');
    },

    testCapture(species, isShiny = false) {
      if (typeof G !== 'object' || !G.Capture || !G.Capture.open) {
        this.toast('Sistema de captura não inicializado!');
        return;
      }
      let mon = null;
      if (typeof species === 'number') mon = G.DEX_BY[species];
      else if (typeof species === 'string' && species.trim()) {
        const query = species.trim().toLowerCase();
        mon = G.DEX.find(p => p.name.toLowerCase() === query) || G.DEX_BY[parseInt(query, 10)];
      } else {
        mon = G.DEX_BY[25]; // Pikachu por padrão
      }
      if (!mon) {
        this.toast(`Espécie não encontrada: ${species}`);
        return;
      }
      G.Capture.open(mon, {
        isShiny: !!isShiny,
        onComplete: (caught) => {
          this.toast(caught ? `🎉 ${mon.name} capturado com sucesso!` : `💨 ${mon.name} escapou!`);
          this.updateStatus();
        }
      });
    },

    zoomIn() {
      if (typeof G === 'object' && G.Camera && G.Camera.adjustZoom) {
        G.Camera.adjustZoom(0.05);
        this.updateStatus();
      }
    },

    zoomOut() {
      if (typeof G === 'object' && G.Camera && G.Camera.adjustZoom) {
        G.Camera.adjustZoom(-0.05);
        this.updateStatus();
      }
    },

    resetZoom() {
      if (typeof G === 'object' && G.Camera && G.Camera.setZoom) {
        G.Camera.setZoom(1.25);
        this.updateStatus();
      }
    },

    setWeather(weatherId) {
      if (typeof window !== 'undefined' && window.WeatherSystem) {
        window.WeatherSystem.setWeather(weatherId);
        const data = window.WEATHER_TYPES ? window.WEATHER_TYPES[weatherId] : null;
        this.toast(`🌤️ Clima alterado para: ${data ? (data.icon + ' ' + data.name) : weatherId}`);
        this.updateStatus();
      } else if (typeof G === 'object' && G.Weather && G.Weather.setWeather) {
        G.Weather.setWeather(weatherId);
        this.toast(`🌤️ Clima alterado para: ${weatherId}`);
        this.updateStatus();
      } else {
        this.toast('Sistema de clima não inicializado!');
      }
    },

    nextWeather() {
      if (typeof window !== 'undefined' && window.WeatherSystem) {
        window.WeatherSystem.nextWeather();
        const cur = window.WeatherSystem.currentWeather;
        const data = window.WEATHER_TYPES ? window.WEATHER_TYPES[cur] : null;
        this.toast(`⏭️ Avançado para: ${data ? (data.icon + ' ' + data.name) : cur}`);
        this.updateStatus();
      } else {
        this.toast('Sistema de clima não inicializado!');
      }
    },

    toast(msg) {
      if (typeof G === 'object' && G.UI && G.UI.toast) {
        G.UI.toast(msg, 2400);
      } else {
        console.log('[AdminPanel]', msg);
      }
    },

    updateStatus() {
      const p = getPlayer();
      const statusEl = document.getElementById('admin-status-text');
      const godBtn = document.getElementById('admin-btn-god');
      const spawnBtn = document.getElementById('admin-btn-spawn');
      const rifts = (typeof G === 'object' && G.DB && G.DB.getTotalRiftsCleared) ? G.DB.getTotalRiftsCleared() : 0;
      const nextPity = 500 - (rifts % 500 || 500);

      const zoomText = (typeof G === 'object' && G.Camera && G.Camera.zoom) ? (Math.round(G.Camera.zoom * 100) / 100).toFixed(2) + 'x' : '1.25x';
      const zoomEl = document.getElementById('admin-btn-zoom-status');
      if (zoomEl) {
        zoomEl.textContent = `🔍 Zoom Atual: ${zoomText}`;
      }

      const wxEl = document.getElementById('admin-weather-status');
      if (wxEl) {
        const wx = (typeof window !== 'undefined' && window.WeatherSystem) ? window.WeatherSystem.current : null;
        if (wx) {
          wxEl.innerHTML = `🌤️ Clima: <b style="color:${wx.color || '#ffe066'}">${wx.icon} ${wx.name}</b> (${Math.ceil(wx.left || 0)}s)`;
        } else {
          wxEl.textContent = '🌤️ Clima: Aguardando partida...';
        }
      }

      const coinsEl = document.getElementById('admin-coins-status');
      if (coinsEl) {
        const saveCoins = (typeof G === 'object' && G.DB && G.DB.save) ? (G.DB.save.coins || 0) : 0;
        const runCoins = p ? (p.coins || 0) : 0;
        coinsEl.innerHTML = `🪙 Banco: <b style="color:#ffd700">${saveCoins.toLocaleString('pt-BR')}</b>` + (p ? ` | Run: <b style="color:#f59e0b">${runCoins.toLocaleString('pt-BR')}</b>` : '');
      }

      const ticketsEl = document.getElementById('admin-tickets-status');
      if (ticketsEl) {
        const s = (typeof G === 'object' && G.DB && G.DB.save) || {};
        const t1 = (s.tickets && s.tickets.t1) || 0;
        ticketsEl.innerHTML = `🎟️ Tickets Roleta: <b style="color:#38bdf8">${t1.toLocaleString('pt-BR')}</b>`;
      }
      if (typeof AdminPanel !== 'undefined' && typeof AdminPanel.updateGachaStats === 'function') {
        AdminPanel.updateGachaStats();
      }

      if (statusEl) {
        if (p) {
          statusEl.innerHTML = `Pokémon: <b style="color:#ffcb05">${p.mon.name}</b> (Nv. ${p.level})<br>HP: ${Math.ceil(p.hp)}/${Math.round(p.maxHp)} | Histórico: [${(p.evolutionHistory || [p.pokemonId]).join(' ➔ ')}]<br>🌀 Rifts: <b style="color:#38bdf8">${rifts}</b> (Pity Shiny em: <b>${nextPity === 0 ? 'PRÓXIMO!' : nextPity}</b>)`;
        } else {
          statusEl.innerHTML = `<span style="color:#aaa;">Aguardando partida...</span><br>🌀 Rifts Concluídos: <b style="color:#38bdf8">${rifts}</b> (Pity: ${nextPity})`;
        }
      }

      if (godBtn && p) {
        godBtn.textContent = p.isGodMode ? '🛡️ Modo Deus: ON' : '🛡️ Modo Deus: OFF';
        godBtn.style.background = p.isGodMode ? '#1e7e34' : '#2b2b36';
      }

      const evoBtn = document.getElementById('admin-btn-evomode');
      if (evoBtn) {
        const labels = {
          official: '🎯 Requisito: Oficial (Nv 16/36)',
          fast: '🎯 Requisito: Rápido (Nv 5/10)',
          instant: '🎯 Requisito: Livre (A partir do Nv 1)'
        };
        evoBtn.textContent = labels[this.evoMode] || labels.fast;
      }

      const freezeBtn = document.getElementById('admin-btn-freeze');
      if (freezeBtn) {
        const labels = {
          fluid: '❄️ Pausa na Evolução: Fluida (0s - Sem travar)',
          quick: '❄️ Pausa na Evolução: Rápida (0.3s)',
          classic: '❄️ Pausa na Evolução: Clássica (1.5s Congelado)'
        };
        freezeBtn.textContent = labels[this.freezeMode] || labels.fluid;
      }

      if (spawnBtn) {
        const isPaused = typeof G === 'object' && G.Spawner && G.Spawner.disabled;
        spawnBtn.textContent = isPaused ? '⏱️ Spawn: PAUSADO' : '⏱️ Spawn: ATIVO';
        spawnBtn.style.background = isPaused ? '#bd2130' : '#2b2b36';
      }
    }
  };

  // ---------------- Injeção da Interface no DOM ----------------
  function initDOM() {
    if (document.getElementById('admin-debug-panel')) return;

    // 1. Container do Painel
    const panel = document.createElement('div');
    panel.id = 'admin-debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 12px;
      right: 12px;
      width: 280px;
      max-height: calc(100vh - 24px);
      overflow-y: auto;
      background: rgba(15, 15, 20, 0.94);
      border: 1px solid #ffcb05;
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-family: monospace, "Segoe UI", sans-serif;
      font-size: 12px;
      z-index: 10000;
      display: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      user-select: text;
    `;

    // 2. Conteúdo HTML
    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #444; padding-bottom:6px; margin-bottom:8px;">
        <span style="font-weight:bold; color:#ffcb05; font-size:13px;">🛠️ PAINEL DE TESTES / ADMIN</span>
        <button id="admin-close-btn" style="background:#d9534f; border:none; color:white; border-radius:4px; cursor:pointer; font-weight:bold; padding:2px 6px;">✕</button>
      </div>

      <div id="admin-status-text" style="background:#222; padding:6px; border-radius:4px; margin-bottom:10px; font-size:11px; line-height:1.4;">
        Carregando status...
      </div>

      <!-- SEÇÃO 1: EVOLUÇÃO -->
      <div style="font-weight:bold; color:#7fe0ff; margin-bottom:4px; font-size:11px;">🧬 SEÇÃO 1: EVOLUÇÃO</div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
        <button id="admin-btn-evomode" class="admin-btn" title="Alternar entre Oficial (Nv 16/36), Rápido (Nv 5/10) e Livre (Nv 1)">[ 🎯 Requisito: Rápido (Nv 5/10) ]</button>
        <button id="admin-btn-freeze" class="admin-btn" title="Alternar entre Fluida (0s), Rápida (0.3s) e Clássica (1.5s)">[ ❄️ Pausa na Evolução: Fluida (0s - Sem travar) ]</button>
        <button id="admin-btn-evolve" class="admin-btn" title="[E] Forçar evolução direta">[ 🔼 Forçar Próxima Evolução ] (E)</button>
        <button id="admin-btn-devolve" class="admin-btn" title="[R] Reverter para estágio anterior">[ 🔽 Devoluir Estágio ] (R)</button>
        <button id="admin-btn-shiny" class="admin-btn">[ ✨ Alternar Shiny ]</button>
        <div style="display:flex; gap:4px; margin-top:2px;">
          <input id="admin-species-input" type="text" placeholder="Nome (ex: charizard)" style="flex:1; background:#111; border:1px solid #555; color:#fff; padding:4px; border-radius:4px; font-size:11px;">
          <button id="admin-btn-transform" class="admin-btn" style="width:auto; padding:4px 8px;">Mudar</button>
        </div>
      </div>

      <!-- SEÇÃO 2: PROGRESSÃO -->
      <div style="font-weight:bold; color:#ffcb3d; margin-bottom:4px; font-size:11px;">📈 SEÇÃO 2: PROGRESSÃO</div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
        <button id="admin-btn-lvl1" class="admin-btn" title="[L] Abre a tela de escolha de cartas">[ +1 Nível (Level Up) ] (L)</button>
        <button id="admin-btn-lvl5" class="admin-btn">[ +5 Níveis Diretos ]</button>
        <button id="admin-btn-xp1000" class="admin-btn">[ +1000 EXP ]</button>
      </div>

      <!-- SEÇÃO 3: GERADOR DE MOEDAS -->
      <div style="font-weight:bold; color:#ffd700; margin-bottom:4px; font-size:11px;">💰 SEÇÃO 3: GERADOR DE MOEDAS</div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
        <div id="admin-coins-status" style="background:#1e1e24; color:#ffd700; padding:4px 8px; border-radius:4px; text-align:center; font-weight:bold; font-size:11px; border:1px solid #7c6812;">
          🪙 Banco: 0 | Run: 0
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
          <button id="admin-btn-coins-1k" class="admin-btn" style="color:#fde047;" title="Adicionar 1.000 moedas">[ +1.000 🪙 ]</button>
          <button id="admin-btn-coins-10k" class="admin-btn" style="color:#facc15;" title="Adicionar 10.000 moedas">[ +10.000 🪙 ]</button>
          <button id="admin-btn-coins-50k" class="admin-btn" style="color:#eab308;" title="Adicionar 50.000 moedas">[ +50.000 🪙 ]</button>
          <button id="admin-btn-coins-100k" class="admin-btn" style="color:#ca8a04; font-weight:bold;" title="Adicionar 100.000 moedas">[ +100.000 🪙 ]</button>
        </div>
        <div style="display:flex; gap:4px; margin-top:2px;">
          <input id="admin-coins-input" type="number" placeholder="Qtd (ex: 50000)" style="flex:1; background:#111; border:1px solid #7c6812; color:#ffd700; padding:4px; border-radius:4px; font-size:11px;">
          <button id="admin-btn-coins-custom" class="admin-btn" style="width:auto; padding:4px 8px; font-weight:bold; color:#ffd700;">+ Injetar</button>
        </div>
      </div>

      <!-- SEÇÃO GACHA: TICKETS & ROLETA -->
      <div style="font-weight:bold; color:#f59e0b; margin-bottom:4px; font-size:11px;">🎰 SEÇÃO GACHA: TICKETS & ROLETA</div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
        <div id="admin-tickets-status" style="background:#1e1e24; color:#38bdf8; padding:4px 8px; border-radius:4px; text-align:center; font-weight:bold; font-size:11px; border:1px solid #0369a1;">
          🎟️ Tickets Roleta: 0
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
          <button id="admin-btn-tickets-5k" class="admin-btn" style="color:#38bdf8;" title="+5.000 Tickets">[ +5.000 🎟️ (1x) ]</button>
          <button id="admin-btn-tickets-25k" class="admin-btn" style="color:#60a5fa;" title="+25.000 Tickets">[ +25.000 🎟️ (5x) ]</button>
          <button id="admin-btn-tickets-50k" class="admin-btn" style="color:#93c5fd;" title="+50.000 Tickets">[ +50.000 🎟️ (10x) ]</button>
          <button id="admin-btn-tickets-zero" class="admin-btn" style="color:#fca5a5;" title="Zerar Tickets">[ Zerar 🎟️ ]</button>
        </div>
        <div style="display:flex; gap:4px; margin-top:2px;">
          <input id="admin-tickets-debug-input" type="number" placeholder="Qtd Tickets (ex: 5000)" style="flex:1; background:#111; border:1px solid #0369a1; color:#38bdf8; padding:4px; border-radius:4px; font-size:11px;">
          <button id="admin-btn-tickets-set" class="admin-btn" style="width:auto; padding:4px 8px; font-weight:bold; color:#38bdf8;">Definir</button>
          <button id="admin-btn-tickets-add" class="admin-btn" style="width:auto; padding:4px 8px; font-weight:bold; color:#4ade80;">+ Somar</button>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px; margin-top:2px;">
          <button id="admin-btn-debug-spin1" class="admin-btn" style="color:#f59e0b; font-weight:bold;">[ 🎲 Girar Roleta 1x ]</button>
          <button id="admin-btn-debug-spin5" class="admin-btn" style="color:#fbbf24; font-weight:bold;">[ 🌟 Girar Roleta 5x ]</button>
        </div>
        <button id="admin-btn-debug-opengacha" class="admin-btn" style="color:#c084fc; font-weight:bold; text-align:center;">[ 🎰 Abrir Tela da Roleta Gacha ]</button>
      </div>

      <!-- SEÇÃO 4: SOBREVIVÊNCIA E COMBATE -->
      <div style="font-weight:bold; color:#ff5f6d; margin-bottom:4px; font-size:11px;">⚔️ SEÇÃO 4: COMBATE & CHEATS</div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
        <button id="admin-btn-god" class="admin-btn" title="[G] Invulnerabilidade">[ 🛡️ Modo Deus: OFF ] (G)</button>
        <button id="admin-btn-heal" class="admin-btn">[ 💖 Curar 100% HP ]</button>
        <button id="admin-btn-special" class="admin-btn" title="[M] Ativa o modo Mega Fúria estelar (Super Star Mario)">[ ⚡ Especial: Mega Fúria ] (M)</button>
        <button id="admin-btn-killall" class="admin-btn" title="[K] Limpa a tela">[ 💥 Limpar Inimigos (Kill All) ] (K)</button>
        <button id="admin-btn-spawn" class="admin-btn">[ ⏱️ Spawn: ATIVO ]</button>
      </div>

      <!-- SEÇÃO 5: RIFTS & CAPTURA -->
      <div style="font-weight:bold; color:#38bdf8; margin-bottom:4px; font-size:11px;">🌀 SEÇÃO 5: RIFTS & CAPTURA</div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
        <button id="admin-btn-trigger-rift" class="admin-btn" title="Força início imediato de Rift Guardian">[ 🌀 Forçar Rift Guardian ]</button>
        <button id="admin-btn-test-capture" class="admin-btn" title="Abre tela de captura direta">[ 🎯 Testar Tela de Captura ]</button>
        <div style="display:flex; gap:4px;">
          <button id="admin-btn-addrifts50" class="admin-btn" style="flex:1;">[ +50 Rifts ]</button>
          <button id="admin-btn-addrifts499" class="admin-btn" style="flex:1;" title="Coloca em 499 rifts para testar pity no próximo">[ Pity 499 ]</button>
        </div>
      </div>

      <!-- SEÇÃO 6: CÂMERA & VIEWPORT -->
      <div style="font-weight:bold; color:#a78bfa; margin-bottom:4px; font-size:11px;">🎥 SEÇÃO 6: CÂMERA & ZOOM</div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
        <div id="admin-btn-zoom-status" style="background:#1e1e24; color:#a78bfa; padding:4px 8px; border-radius:4px; text-align:center; font-weight:bold; font-size:11px; border:1px solid #4a4a5a;">
          🔍 Zoom Atual: 1.25x
        </div>
        <div style="display:flex; gap:4px;">
          <button id="admin-btn-zoom-in" class="admin-btn" style="flex:1;" title="[+] Aproxima a câmera">[ ➕ Zoom In ] (+)</button>
          <button id="admin-btn-zoom-out" class="admin-btn" style="flex:1;" title="[-] Afasta a câmera">[ ➖ Zoom Out ] (-)</button>
        </div>
        <button id="admin-btn-zoom-reset" class="admin-btn" title="Restaura zoom recomendado 1.25x">[ 🎯 Reset Zoom (1.25x) ]</button>
      </div>

      <!-- SEÇÃO 7: CLIMA DINÂMICO (LIVE WEATHER) -->
      <div style="font-weight:bold; color:#ffe066; margin-bottom:4px; font-size:11px;">🌤️ SEÇÃO 7: CLIMA DINÂMICO</div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
        <div id="admin-weather-status" style="background:#1e1e24; color:#ffe066; padding:4px 8px; border-radius:4px; text-align:center; font-weight:bold; font-size:11px; border:1px solid #4a4a5a;">
          🌤️ Clima Atual: ☀️ Céu Limpo
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
          <button id="admin-btn-wx-clear" class="admin-btn" title="Céu Limpo">[ ☀️ Céu Limpo ]</button>
          <button id="admin-btn-wx-sun" class="admin-btn" style="color:#ff8800;" title="Sol Escaldante">[ 🔥 Sol Forte ]</button>
          <button id="admin-btn-wx-rain" class="admin-btn" style="color:#4fa3ff;" title="Chuva Forte">[ 🌧️ Chuva ]</button>
          <button id="admin-btn-wx-sand" class="admin-btn" style="color:#d4af37;" title="Tempestade de Areia">[ 🌪️ Areia ]</button>
          <button id="admin-btn-wx-snow" class="admin-btn" style="color:#9de0ff;" title="Nevasca Glacial">[ ❄️ Nevasca ]</button>
          <button id="admin-btn-wx-thunder" class="admin-btn" style="color:#ffd000;" title="Tempestade com Raios">[ ⚡ Raios ]</button>
        </div>
        <button id="admin-btn-wx-fog" class="admin-btn" style="color:#bfa7e6;" title="Névoa Espessa">[ 🌫️ Névoa Espessa ]</button>
        <button id="admin-btn-wx-next" class="admin-btn" style="background:#374151; font-weight:bold;" title="Sorteia novo clima">[ ⏭️ Próximo Clima Aleatório ]</button>
      </div>

      <div style="font-size:10px; color:#888; text-align:center; border-top:1px solid #333; padding-top:6px;">
        Atalhos: [F1] Painel | [M] Mega | [G] Deus | [L] Nível | [K] Kill | [E] Evo | [R] Devol | [+][-] Zoom
      </div>
    `;

    // 3. Estilos dos botões do painel
    const style = document.createElement('style');
    style.textContent = `
      .admin-btn {
        background: #2b2b36;
        border: 1px solid #4a4a5a;
        color: #eee;
        padding: 5px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-family: inherit;
        text-align: left;
        transition: background .1s, border-color .1s;
      }
      .admin-btn:hover {
        background: #3b3b4f;
        border-color: #ffcb05;
        color: #fff;
      }
      .admin-btn:active {
        transform: scale(0.98);
      }
      #admin-float-pill:hover {
        filter: brightness(1.15);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(panel);

    // 4. Botão flutuante no canto inferior direito para acesso rápido
    const pill = document.createElement('button');
    pill.id = 'admin-float-pill';
    pill.textContent = '🛠️ Admin [F2]';
    pill.style.cssText = `
      position: fixed;
      bottom: 12px;
      right: 12px;
      z-index: 9999;
      background: linear-gradient(180deg, #3d67c0, #1b3573);
      border: 2px solid #ffd23f;
      color: #ffd23f;
      font-weight: bold;
      font-size: 12px;
      font-family: monospace, sans-serif;
      padding: 6px 12px;
      border-radius: 20px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.55);
      cursor: pointer;
    `;
    pill.onclick = () => adminTools.toggle();
    document.body.appendChild(pill);

    // 5. Vincular eventos dos botões com segurança
    const bind = (id, fn) => {
      const el = document.getElementById(id) || panel.querySelector('#' + id);
      if (el) el.onclick = fn;
    };

    bind('admin-close-btn', () => adminTools.close());
    bind('admin-btn-evomode', () => adminTools.toggleEvoMode());
    bind('admin-btn-freeze', () => adminTools.toggleFreezeMode());
    bind('admin-btn-evolve', () => adminTools.forceEvolve());
    bind('admin-btn-devolve', () => adminTools.devolve());
    bind('admin-btn-shiny', () => adminTools.toggleShiny());
    bind('admin-btn-lvl1', () => adminTools.addLevel(1));
    bind('admin-btn-lvl5', () => adminTools.addLevel(5));
    bind('admin-btn-xp1000', () => adminTools.addExp(1000));

    bind('admin-btn-coins-1k', () => adminTools.addCoins(1000));
    bind('admin-btn-coins-10k', () => adminTools.addCoins(10000));
    bind('admin-btn-coins-50k', () => adminTools.addCoins(50000));
    bind('admin-btn-coins-100k', () => adminTools.addCoins(100000));

    const injectCustomCoins = () => {
      const input = document.getElementById('admin-coins-input') || panel.querySelector('#admin-coins-input');
      if (input && input.value) {
        const val = parseInt(input.value, 10);
        if (val > 0) {
          adminTools.addCoins(val);
          input.value = '';
        }
      }
    };
    bind('admin-btn-coins-custom', injectCustomCoins);
    const coinsInputEl = document.getElementById('admin-coins-input') || panel.querySelector('#admin-coins-input');
    if (coinsInputEl) {
      coinsInputEl.onkeydown = e => {
        if (e.key === 'Enter') injectCustomCoins();
        e.stopPropagation();
      };
    }

    bind('admin-btn-tickets-5k', () => adminTools.addTickets(5000));
    bind('admin-btn-tickets-25k', () => adminTools.addTickets(25000));
    bind('admin-btn-tickets-50k', () => adminTools.addTickets(50000));
    bind('admin-btn-tickets-zero', () => adminTools.setTickets(0));

    const injectCustomTickets = (isAdd = false) => {
      const input = document.getElementById('admin-tickets-debug-input') || panel.querySelector('#admin-tickets-debug-input');
      if (input && input.value !== '') {
        const val = parseInt(input.value, 10);
        if (!isNaN(val)) {
          if (isAdd) adminTools.addTickets(val);
          else adminTools.setTickets(val);
          input.value = '';
        }
      }
    };
    bind('admin-btn-tickets-set', () => injectCustomTickets(false));
    bind('admin-btn-tickets-add', () => injectCustomTickets(true));
    const ticketsInputEl = document.getElementById('admin-tickets-debug-input') || panel.querySelector('#admin-tickets-debug-input');
    if (ticketsInputEl) {
      ticketsInputEl.onkeydown = e => {
        if (e.key === 'Enter') injectCustomTickets(false);
        e.stopPropagation();
      };
    }
    bind('admin-btn-debug-spin1', () => adminTools.spinRoulette(1));
    bind('admin-btn-debug-spin5', () => adminTools.spinRoulette(5));
    bind('admin-btn-debug-opengacha', () => adminTools.openGacha());

    bind('admin-btn-god', () => adminTools.toggleGodMode());
    bind('admin-btn-heal', () => adminTools.healFull());
    bind('admin-btn-special', () => adminTools.fillSpecial());
    bind('admin-btn-killall', () => adminTools.killAll());
    bind('admin-btn-spawn', () => adminTools.toggleSpawn());

    bind('admin-btn-trigger-rift', () => {
      const input = document.getElementById('admin-species-input') || panel.querySelector('#admin-species-input');
      const val = input && input.value ? input.value.trim() : null;
      adminTools.triggerRift(val);
    });
    bind('admin-btn-test-capture', () => {
      const input = document.getElementById('admin-species-input') || panel.querySelector('#admin-species-input');
      const val = input && input.value ? input.value.trim() : null;
      adminTools.testCapture(val);
    });
    bind('admin-btn-addrifts50', () => adminTools.addRifts(50));
    bind('admin-btn-addrifts499', () => {
      const cur = (typeof G === 'object' && G.DB && G.DB.getTotalRiftsCleared) ? G.DB.getTotalRiftsCleared() : 0;
      const rem = cur % 500;
      const target = 499;
      const diff = rem <= 499 ? (499 - rem) : (999 - rem);
      adminTools.addRifts(diff > 0 ? diff : 499);
    });

    bind('admin-btn-zoom-in', () => adminTools.zoomIn());
    bind('admin-btn-zoom-out', () => adminTools.zoomOut());
    bind('admin-btn-zoom-reset', () => adminTools.resetZoom());

    bind('admin-btn-wx-clear', () => adminTools.setWeather('clear'));
    bind('admin-btn-wx-sun', () => adminTools.setWeather('harsh_sun'));
    bind('admin-btn-wx-rain', () => adminTools.setWeather('rain'));
    bind('admin-btn-wx-sand', () => adminTools.setWeather('sandstorm'));
    bind('admin-btn-wx-snow', () => adminTools.setWeather('snow'));
    bind('admin-btn-wx-thunder', () => adminTools.setWeather('thunderstorm'));
    bind('admin-btn-wx-fog', () => adminTools.setWeather('fog'));
    bind('admin-btn-wx-next', () => adminTools.nextWeather());

    const transform = () => {
      const input = document.getElementById('admin-species-input') || panel.querySelector('#admin-species-input');
      if (input && input.value) {
        adminTools.transformTo(input.value);
        input.value = '';
      }
    };
    bind('admin-btn-transform', transform);

    const inputEl = document.getElementById('admin-species-input') || panel.querySelector('#admin-species-input');
    if (inputEl) {
      inputEl.onkeydown = e => {
        if (e.key === 'Enter') transform();
        e.stopPropagation(); // Evita atalhos globais enquanto digita
      };
    }
  }

  // ---------------- Atalhos Globais de Teclado ----------------
  function initKeyboard() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    window.addEventListener('keydown', e => {
      const target = e.target;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // F1, F2 ou Crase (`) / Aspas / Til abre/fecha o painel sempre
      if (e.key === 'F1' || e.key === 'F2' || e.key === '`' || e.key === '~' || e.code === 'Backquote' || e.key === "'" || e.key === '"') {
        e.preventDefault();
        adminTools.toggle();
        return;
      }

      // Atalhos diretos de depuração (somente quando não estiver digitando)
      if (isInput) return;

      const key = e.key.toUpperCase();
      if (key === 'M') {
        adminTools.fillSpecial();
      } else if (key === 'G') {
        adminTools.toggleGodMode();
      } else if (key === 'L') {
        adminTools.addLevel(1);
      } else if (key === 'K') {
        adminTools.killAll();
      } else if (key === 'E') {
        adminTools.forceEvolve();
      } else if (key === 'R') {
        adminTools.devolve();
      }
    });
  }

  // Inicialização quando o DOM estiver pronto
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      if (typeof document.addEventListener === 'function') {
        document.addEventListener('DOMContentLoaded', () => { initDOM(); initKeyboard(); });
      }
    } else {
      initDOM();
      initKeyboard();
    }
  }

  // Comandos Rápidos Globais no Console
  if (typeof window !== 'undefined') {
    window.debugTriggerRift = (speciesId, isShiny) => adminTools.triggerRift(speciesId, isShiny);
    window.debugAddRifts = (amount) => adminTools.addRifts(amount);
    window.debugTestCapture = (speciesId, isShiny) => adminTools.testCapture(speciesId, isShiny);
    window.debugAddCoins = (amount) => adminTools.addCoins(amount);
  }

  // Exportação no escopo global
  window.adminTools = adminTools;
  if (typeof G === 'object') G.adminTools = adminTools;
})();
