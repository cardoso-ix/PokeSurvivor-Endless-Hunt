/* ============ stage_select.js — Seleção de Regiões / Fases ============
 * Permite ao jogador escolher a Região onde deseja iniciar a run.
 * Exibe a contagem e porcentagem de Pokédex local capturada.
 */
G.StageSelectUI = (() => {
  const $ = id => document.getElementById(id);

  function getRegionsConfig() {
    if (typeof G === 'object' && G.REGIONS_CONFIG) return G.REGIONS_CONFIG;
    if (typeof window !== 'undefined' && window.REGIONS_CONFIG) return window.REGIONS_CONFIG;
    if (typeof REGIONS_CONFIG !== 'undefined') return REGIONS_CONFIG;
    return {};
  }

  function getModalElement() {
    return document.getElementById('scr-stages') ||
           document.getElementById('region-select-modal') ||
           document.querySelector('.region-modal-container');
  }

  function getGameCanvas() {
    return document.getElementById('gameCanvas') ||
           document.getElementById('game') ||
           document.querySelector('canvas');
  }

  function close() {
    const regionModal = getModalElement();
    if (regionModal) {
      regionModal.style.display = 'none';
      regionModal.classList.add('hidden');
    }
    if (typeof G === 'object' && G.UI && typeof G.UI.hide === 'function') {
      G.UI.hide('scr-stages');
    }

    const isPlaying = (typeof G === 'object' && G.Game && G.Game.state === 'playing');
    if (isPlaying) {
      if (typeof G === 'object' && G.Game) {
        G.Game.isPaused = false;
        if (typeof G.Game.unpause === 'function') G.Game.unpause();
      }
      if (typeof window !== 'undefined' && window.game) {
        window.game.isPaused = false;
        if (typeof window.game.unpause === 'function') window.game.unpause();
      }
      if (typeof game !== 'undefined' && game) {
        game.isPaused = false;
        if (typeof game.unpause === 'function') game.unpause();
      }
      const canvas = getGameCanvas();
      if (canvas && typeof canvas.focus === 'function') canvas.focus();
    } else {
      if (typeof G === 'object' && G.MenuUI && typeof G.MenuUI.open === 'function') {
        G.MenuUI.open();
      } else if (typeof G === 'object' && G.Flow && typeof G.Flow.goMenu === 'function') {
        G.Flow.goMenu();
      }
    }
  }

  function init() {
    const closeBtn = $('stage-close') || document.querySelector('#scr-stages [data-back]') || document.querySelector('#scr-stages .close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        close();
      };
    }
  }

  function open() {
    const config = getRegionsConfig();
    const container = $('stage-cards');
    if (!container) return;

    const currentReg = (typeof G === 'object' && G.Game && G.Game.currentRegion)
      ? G.Game.currentRegion
      : ((typeof window !== 'undefined' && window.game && window.game.currentRegion)
          ? window.game.currentRegion
          : ((typeof localStorage !== 'undefined' && localStorage.getItem('ps_current_region')) || 'kanto'));

    container.innerHTML = '';

    Object.entries(config).forEach(([key, reg]) => {
      const captured = (typeof G === 'object' && G.DB && typeof G.DB.getCapturedCountByRegion === 'function')
        ? G.DB.getCapturedCountByRegion(key)
        : ((typeof window !== 'undefined' && window.db && typeof window.db.getCapturedCountByRegion === 'function')
            ? window.db.getCapturedCountByRegion(key)
            : 0);

      const total = (typeof G === 'object' && G.DB && typeof G.DB.getTotalCountByRegion === 'function')
        ? G.DB.getTotalCountByRegion(key)
        : ((typeof window !== 'undefined' && window.db && typeof window.db.getTotalCountByRegion === 'function')
            ? window.db.getTotalCountByRegion(key)
            : (reg.dexRange[1] - reg.dexRange[0] + 1));

      const pct = total > 0 ? Math.round((captured / total) * 100) : 0;
      const isSelected = (key === currentReg);

      const rawName = (reg && reg.name) ? String(reg.name).trim() : (key === 'kanto' ? 'Kanto' : key);
      const isKanto = (rawName.toLowerCase() === 'kanta' || rawName.toLowerCase() === 'kanto' || key.toLowerCase() === 'kanto' || key.toLowerCase() === 'kanta');
      const cleanTitleName = isKanto ? 'Kanto' : rawName;
      const normalizedDisplayName = isKanto ? 'KANTO' : rawName.toUpperCase();

      const card = document.createElement('div');
      card.className = `box stage-card ${isSelected ? 'selected-stage' : ''}`;
      card.style.cssText = `
        border: 2px solid ${isSelected ? '#ffd166' : 'rgba(255,255,255,0.12)'};
        background: linear-gradient(145deg, rgba(20,28,48,0.95), rgba(10,14,26,0.98));
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        box-shadow: ${isSelected ? '0 0 14px rgba(255, 209, 102, 0.4)' : 'none'};
      `;

      card.innerHTML = `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <h3 style="margin:0;font-size:18px;color:${reg.themeColor};display:flex;align-items:center;gap:6px;">
              <span>🗺️</span> ${cleanTitleName}
            </h3>
            <span style="font-size:11px;background:rgba(255,255,255,0.12);padding:2px 6px;border-radius:4px;color:#cbd5e1;">
              Gen ${reg.gen}
            </span>
          </div>
          <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;line-height:1.3;">${reg.desc || ''}</p>
        </div>

        <div style="margin-top:8px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;margin-bottom:4px;">
            <span style="color:#e2e8f0;">Pokédex Local:</span>
            <span style="color:${pct >= 100 ? '#4ade80' : '#ffd166'};">${captured} / ${total} (${pct}%)</span>
          </div>
          <div style="width:100%;height:8px;background:rgba(0,0,0,0.5);border-radius:4px;overflow:hidden;margin-bottom:10px;border:1px solid rgba(255,255,255,0.08);">
            <div style="width:${pct}%;height:100%;background:${pct >= 100 ? '#4ade80' : reg.themeColor};border-radius:4px;transition:width 0.3s ease;"></div>
          </div>
          <button class="btn ${isSelected ? 'gold' : 'ghost'} small grow" style="width:100%;padding:6px 0;font-size:13px;" data-reg="${key}">
            ${isSelected ? '▶ INICIAR EM ' + normalizedDisplayName : 'SELECIONAR ' + normalizedDisplayName}
          </button>
        </div>
      `;

      const btn = card.querySelector('button');
      btn.onclick = () => {
        onConfirmRegion(key);
      };

      container.appendChild(card);
    });

    const closeBtn = $('stage-close') || document.querySelector('#scr-stages [data-back]');
    if (closeBtn) {
      closeBtn.onclick = () => {
        close();
      };
    }

    const regionModal = getModalElement();
    if (regionModal) {
      regionModal.style.display = '';
      regionModal.classList.remove('hidden');
    }

    if (typeof G === 'object' && G.UI) {
      G.UI.chrome(true);
      G.UI.show('scr-stages');
    }
  }

  function onConfirmRegion(regionKey) {
    try {
      const config = getRegionsConfig();
      let normalizedRegionKey = String(regionKey || '').toLowerCase().trim();
      if (normalizedRegionKey === 'kanta' || !normalizedRegionKey) {
        normalizedRegionKey = 'kanto';
      }
      const finalRegion = (config && config[normalizedRegionKey]) ? normalizedRegionKey : 'kanto';

      // 1. Grava no estado global do jogo
      if (typeof G === 'object' && G.Game) {
        G.Game.currentRegion = finalRegion;
      }
      if (typeof window !== 'undefined') {
        if (!window.game) window.game = (typeof G === 'object' && G.Game) ? G.Game : {};
        window.game.currentRegion = finalRegion;
      }
      if (typeof game !== 'undefined' && game) {
        game.currentRegion = finalRegion;
      }
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('ps_current_region', finalRegion);
        } catch (e) {}
      }

      // 2. Filtra spawns de monstros e Guardiões de Rift
      const spawnerObj = (typeof window !== 'undefined' && window.spawner)
        ? window.spawner
        : ((typeof G === 'object' && G.Spawner) ? G.Spawner : (typeof spawner !== 'undefined' ? spawner : null));
      if (spawnerObj && typeof spawnerObj.setRegion === 'function') {
        spawnerObj.setRegion(finalRegion);
      }

      // 3. Fecha o modal imediatamente
      const regionModal = getModalElement();
      if (regionModal) {
        regionModal.style.display = 'none';
        regionModal.classList.add('hidden');
      }
      if (typeof G === 'object' && G.UI && typeof G.UI.hide === 'function') {
        G.UI.hide('scr-stages');
      }

      // 4. Retoma a física e o controle (unpause)
      if (typeof G === 'object' && G.Game) {
        G.Game.isPaused = false;
        if (typeof G.Game.unpause === 'function') G.Game.unpause();
      }
      if (typeof window !== 'undefined' && window.game) {
        window.game.isPaused = false;
        if (typeof window.game.unpause === 'function') window.game.unpause();
      }
      if (typeof game !== 'undefined' && game) {
        game.isPaused = false;
        if (typeof game.unpause === 'function') game.unpause();
      }

      // Se a partida ainda não estiver em andamento, inicia com a região
      if (typeof G === 'object' && G.Game && G.Game.state !== 'playing') {
        if (typeof G.Game.startRun === 'function') {
          G.Game.startRun(null, finalRegion);
        } else if (typeof G.Flow === 'object' && typeof G.Flow.play === 'function') {
          G.Flow.play();
        }
      }

      // Garante novamente a ocultação do modal pós inicialização
      if (regionModal) {
        regionModal.style.display = 'none';
        regionModal.classList.add('hidden');
      }
      if (typeof G === 'object' && G.UI && typeof G.UI.hide === 'function') {
        G.UI.hide('scr-stages');
      }

      // 5. Devolve o foco imediatamente para a tela de jogo (canvas)
      const canvas = getGameCanvas();
      if (canvas && typeof canvas.focus === 'function') {
        canvas.focus();
      }

      if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') {
        G.Audio.sfx('confirm');
      }
      console.log('✅ Região iniciada com sucesso: ' + finalRegion);
    } catch (err) {
      console.error('❌ Erro crítico ao confirmar região:', err);
    }
  }

  const exportObj = {
    init,
    open,
    close,
    selectRegion: onConfirmRegion,
    onConfirmRegion
  };

  if (typeof window !== 'undefined') {
    window.StageSelectUI = exportObj;
  }
  if (typeof global !== 'undefined') {
    global.StageSelectUI = exportObj;
    if (global.window) global.window.StageSelectUI = exportObj;
  }

  return exportObj;
})();

if (typeof G === 'object') {
  G.StageSelectUI = G.StageSelectUI || window.StageSelectUI;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = G.StageSelectUI;
}
