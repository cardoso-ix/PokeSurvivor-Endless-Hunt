/* ============ intro_creation.js — Tela de Introdução & Criação Estilo Game Boy / DS ============
 * Implementa a experiência clássica de início de jornada dos jogos de Pokémon:
 *   - Etapa 1: Escolha do Treinador com abas [ 👦 Menino ] e [ 👧 Menina ] (8 Treinadores Canônicos).
 *   - Etapa 2: Draft Livre dos 3 Iniciais entre todos os 27 oficiais das 9 Gerações de Pokémon.
 *   - Contador de seleção [ Selecionados: X / 3 ].
 *   - Integração segura com o save do jogador e disparo da jornada sem quebrar o motor central.
 */

window.G = window.G || {};

G.IntroCreationUI = (() => {
  let overlay = null;
  let currentStep = 1; // 1: Treinador, 2: Trio Inicial
  let selectedGender = 'male';
  let selectedTrainer = 'red';
  let selectedSquad = []; // Array de até 3 dex IDs
  let currentGenFilter = 0; // 0: Todas, 1-9: Gerações específicas
  let onCompleteCallback = null;

  // Catálogo dos 8 Treinadores Canônicos das Gerações 1 a 4
  const TRAINERS = {
    male: [
      { id: 'red',     name: 'Red',     gen: 1, region: 'Kanto', desc: 'O lendário campeão da região de Kanto.' },
      { id: 'ethan',   name: 'Ethan',   gen: 2, region: 'Johto', desc: 'Determinado treinador vindo de New Bark Town.' },
      { id: 'brendan', name: 'Brendan', gen: 3, region: 'Hoenn', desc: 'Explorador aventureiro dos climas tropicais de Hoenn.' },
      { id: 'lucas',   name: 'Lucas',   gen: 4, region: 'Sinnoh', desc: 'Estrategista brilhante das montanhas de Sinnoh.' }
    ],
    female: [
      { id: 'leaf', name: 'Leaf', gen: 1, region: 'Kanto', desc: 'Treinadora perspicaz e veloz de Pallet Town.' },
      { id: 'lyra', name: 'Lyra', gen: 2, region: 'Johto', desc: 'Jovem vibrante com espírito indomável de Johto.' },
      { id: 'may',  name: 'May',  gen: 3, region: 'Hoenn', desc: 'Especialista em batalhas e trilhas florestais.' },
      { id: 'dawn', name: 'Dawn', gen: 4, region: 'Sinnoh', desc: 'Coordenadora elegante e campeã perseverante.' }
    ]
  };

  // Tabela Oficial dos 27 Iniciais das 9 Gerações de Pokémon
  const ALL_STARTERS = [
    // Gen 1 (Kanto)
    { dex: 1,   name: 'Bulbasaur',  gen: 1, region: 'Kanto',   types: ['grass', 'poison'] },
    { dex: 4,   name: 'Charmander', gen: 1, region: 'Kanto',   types: ['fire'] },
    { dex: 7,   name: 'Squirtle',   gen: 1, region: 'Kanto',   types: ['water'] },
    // Gen 2 (Johto)
    { dex: 152, name: 'Chikorita',  gen: 2, region: 'Johto',   types: ['grass'] },
    { dex: 155, name: 'Cyndaquil',  gen: 2, region: 'Johto',   types: ['fire'] },
    { dex: 158, name: 'Totodile',   gen: 2, region: 'Johto',   types: ['water'] },
    // Gen 3 (Hoenn)
    { dex: 252, name: 'Treecko',    gen: 3, region: 'Hoenn',   types: ['grass'] },
    { dex: 255, name: 'Torchic',    gen: 3, region: 'Hoenn',   types: ['fire'] },
    { dex: 258, name: 'Mudkip',     gen: 3, region: 'Hoenn',   types: ['water'] },
    // Gen 4 (Sinnoh)
    { dex: 387, name: 'Turtwig',    gen: 4, region: 'Sinnoh',  types: ['grass'] },
    { dex: 390, name: 'Chimchar',   gen: 4, region: 'Sinnoh',  types: ['fire'] },
    { dex: 393, name: 'Piplup',     gen: 4, region: 'Sinnoh',  types: ['water'] },
    // Gen 5 (Unova)
    { dex: 495, name: 'Snivy',      gen: 5, region: 'Unova',   types: ['grass'] },
    { dex: 498, name: 'Tepig',      gen: 5, region: 'Unova',   types: ['fire'] },
    { dex: 501, name: 'Oshawott',   gen: 5, region: 'Unova',   types: ['water'] },
    // Gen 6 (Kalos)
    { dex: 650, name: 'Chespin',    gen: 6, region: 'Kalos',   types: ['grass'] },
    { dex: 653, name: 'Fennekin',   gen: 6, region: 'Kalos',   types: ['fire'] },
    { dex: 656, name: 'Froakie',    gen: 6, region: 'Kalos',   types: ['water'] },
    // Gen 7 (Alola)
    { dex: 722, name: 'Rowlet',     gen: 7, region: 'Alola',   types: ['grass', 'flying'] },
    { dex: 725, name: 'Litten',     gen: 7, region: 'Alola',   types: ['fire'] },
    { dex: 728, name: 'Popplio',    gen: 7, region: 'Alola',   types: ['water'] },
    // Gen 8 (Galar)
    { dex: 810, name: 'Grookey',    gen: 8, region: 'Galar',   types: ['grass'] },
    { dex: 813, name: 'Scorbunny',  gen: 8, region: 'Galar',   types: ['fire'] },
    { dex: 816, name: 'Sobble',     gen: 8, region: 'Galar',   types: ['water'] },
    // Gen 9 (Paldea)
    { dex: 906, name: 'Sprigatito', gen: 9, region: 'Paldea',  types: ['grass'] },
    { dex: 909, name: 'Fuecoco',    gen: 9, region: 'Paldea',  types: ['fire'] },
    { dex: 912, name: 'Quaxly',     gen: 9, region: 'Paldea',  types: ['water'] }
  ];

  function injectStyles() {
    if (document.getElementById('intro-creation-styles')) return;

    const style = document.createElement('style');
    style.id = 'intro-creation-styles';
    style.textContent = `
      .ic-overlay {
        position: fixed;
        inset: 0;
        z-index: 120;
        background: radial-gradient(circle at 50% 50%, rgba(10, 20, 48, 0.96), rgba(3, 7, 18, 0.99));
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
        opacity: 1;
        transition: opacity 0.35s ease-out;
        font-family: 'Pixelify', 'Press Start 2P', monospace;
        color: #f8fafc;
      }
      .ic-overlay.fade-out {
        opacity: 0;
        pointer-events: none;
      }
      .ic-modal {
        width: min(860px, 96vw);
        max-height: 94vh;
        background: #0f172a;
        border: 4px solid #2563eb;
        border-radius: 12px;
        box-shadow: 0 0 0 2px #1e293b, 0 16px 40px rgba(0,0,0,0.85);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .ic-header {
        background: linear-gradient(180deg, #1e3a8a, #0f172a);
        border-bottom: 2px solid #3b82f6;
        padding: 14px 18px;
        text-align: center;
      }
      .ic-title {
        font-size: 1.15rem;
        color: #facc15;
        text-shadow: 2px 2px #000;
        margin: 0;
        letter-spacing: 0.5px;
      }
      .ic-subtitle {
        font-size: 0.72rem;
        color: #94a3b8;
        margin: 4px 0 0 0;
      }
      .ic-body {
        padding: 16px;
        overflow-y: auto;
        flex: 1;
      }
      .ic-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 14px;
        justify-content: center;
      }
      .ic-tab-btn {
        background: #1e293b;
        color: #cbd5e1;
        border: 2px solid #334155;
        border-radius: 6px;
        padding: 8px 18px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
      }
      .ic-tab-btn:hover {
        background: #334155;
        color: #fff;
      }
      .ic-tab-btn.active {
        background: #2563eb;
        color: #fff;
        border-color: #60a5fa;
        box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
      }
      /* Cards de Treinador */
      .ic-trainer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      .ic-trainer-card {
        background: #1e293b;
        border: 2px solid #334155;
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: all 0.18s;
        text-align: center;
      }
      .ic-trainer-card:hover {
        border-color: #60a5fa;
        transform: translateY(-2px);
      }
      .ic-trainer-card.selected {
        background: #1e3a8a;
        border-color: #facc15;
        box-shadow: 0 0 14px rgba(250, 204, 21, 0.35);
      }
      .ic-trainer-name {
        font-size: 0.88rem;
        color: #facc15;
        margin: 8px 0 2px 0;
      }
      .ic-trainer-region {
        font-size: 0.65rem;
        color: #94a3b8;
      }
      .ic-trainer-desc {
        font-size: 0.62rem;
        color: #cbd5e1;
        margin-top: 6px;
        line-height: 1.3;
      }
      /* Slots de Seleção de Iniciais no Topo */
      .ic-squad-slots {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        background: rgba(15, 23, 42, 0.7);
        border: 2px dashed #334155;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 12px;
      }
      .ic-slot-box {
        background: #1e293b;
        border: 2px solid #475569;
        border-radius: 6px;
        padding: 8px;
        text-align: center;
        min-height: 85px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .ic-slot-box.filled {
        border-color: #22c55e;
        background: #064e3b;
      }
      .ic-slot-label {
        font-size: 0.62rem;
        color: #facc15;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .ic-slot-name {
        font-size: 0.78rem;
        font-weight: bold;
        color: #fff;
      }
      .ic-slot-empty {
        font-size: 0.68rem;
        color: #64748b;
      }
      .ic-count-badge {
        display: inline-block;
        background: #2563eb;
        color: #fff;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .ic-count-badge.complete {
        background: #16a34a;
      }
      /* Grade de 27 Iniciais */
      .ic-gen-filters {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding-bottom: 6px;
        margin-bottom: 10px;
      }
      .ic-filter-btn {
        background: #1e293b;
        color: #94a3b8;
        border: 1px solid #334155;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.66rem;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
      }
      .ic-filter-btn.active {
        background: #3b82f6;
        color: #fff;
        border-color: #60a5fa;
      }
      .ic-starters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
        gap: 8px;
        max-height: 40vh;
        overflow-y: auto;
        padding-right: 4px;
      }
      .ic-starter-card {
        background: #1e293b;
        border: 2px solid #334155;
        border-radius: 6px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: all 0.15s;
        position: relative;
      }
      .ic-starter-card:hover {
        border-color: #60a5fa;
      }
      .ic-starter-card.selected {
        background: #1e3a8a;
        border-color: #22c55e;
        box-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
      }
      .ic-starter-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #22c55e;
        color: #000;
        font-size: 0.6rem;
        font-weight: bold;
        padding: 1px 4px;
        border-radius: 4px;
      }
      .ic-starter-name {
        font-size: 0.72rem;
        color: #f1f5f9;
        margin-top: 4px;
        text-align: center;
      }
      .ic-type-badges {
        display: flex;
        gap: 2px;
        margin-top: 3px;
      }
      .ic-type-tag {
        font-size: 0.52rem;
        padding: 1px 4px;
        border-radius: 3px;
        text-transform: uppercase;
        color: #fff;
        font-weight: bold;
      }
      .type-grass { background: #22c55e; }
      .type-fire { background: #f97316; }
      .type-water { background: #38bdf8; }
      .type-poison { background: #a855f7; }
      .type-flying { background: #818cf8; }
      .type-normal { background: #94a3b8; }
      /* Rodapé */
      .ic-footer {
        background: #0b1120;
        border-top: 2px solid #1e293b;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .ic-btn {
        background: #2563eb;
        color: #fff;
        border: 2px solid #3b82f6;
        border-radius: 6px;
        padding: 10px 22px;
        font-size: 0.82rem;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        font-weight: bold;
      }
      .ic-btn:hover:not(:disabled) {
        background: #1d4ed8;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
      }
      .ic-btn:disabled {
        background: #334155;
        border-color: #475569;
        color: #64748b;
        cursor: not-allowed;
      }
      .ic-btn-gold {
        background: #ca8a04;
        border-color: #facc15;
        color: #000;
      }
      .ic-btn-gold:hover:not(:disabled) {
        background: #eab308;
        box-shadow: 0 0 15px rgba(250, 204, 21, 0.6);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Renderiza os 8 avatares de Treinador em Pixel Art de alta fidelidade
   */
  function drawTrainerPixelArt(ctx, trainerId, w = 64, h = 64) {
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;

    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);

    // Sombra nos pés
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 22, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paletas características dos 8 Treinadores
    const pal = {
      red:     { hat: '#dc2626', brim: '#ffffff', hair: '#451a03', skin: '#fed7aa', top: '#dc2626', pants: '#1e3a8a' },
      ethan:   { hat: '#eab308', brim: '#0f172a', hair: '#020617', skin: '#fed7aa', top: '#dc2626', pants: '#0f172a' },
      brendan: { hat: '#f8fafc', brim: '#020617', hair: '#78350f', skin: '#fed7aa', top: '#16a34a', pants: '#1e293b' },
      lucas:   { hat: '#dc2626', brim: '#991b1b', hair: '#1e293b', skin: '#fed7aa', top: '#1e3a8a', pants: '#020617' },
      leaf:    { hat: '#fef08a', brim: '#38bdf8', hair: '#78350f', skin: '#fed7aa', top: '#0284c7', pants: '#f8fafc' },
      lyra:    { hat: '#f8fafc', brim: '#e2e8f0', hair: '#78350f', skin: '#fed7aa', top: '#dc2626', pants: '#1d4ed8' },
      may:     { hat: '#dc2626', brim: '#991b1b', hair: '#78350f', skin: '#fed7aa', top: '#e11d48', pants: '#020617' },
      dawn:    { hat: '#ffffff', brim: '#f43f5e', hair: '#1e3a8a', skin: '#fed7aa', top: '#0f172a', pants: '#f43f5e' }
    }[trainerId] || { hat: '#dc2626', brim: '#ffffff', hair: '#451a03', skin: '#fed7aa', top: '#dc2626', pants: '#1e3a8a' };

    // Pernas / Calça
    ctx.fillStyle = pal.pants;
    ctx.fillRect(cx - 7, cy + 10, 5, 11);
    ctx.fillRect(cx + 2, cy + 10, 5, 11);

    // Calçados
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 8, cy + 19, 6, 3);
    ctx.fillRect(cx + 2, cy + 19, 6, 3);

    // Corpo / Tronco
    ctx.fillStyle = pal.top;
    ctx.fillRect(cx - 8, cy - 2, 16, 13);

    // Braços
    ctx.fillRect(cx - 11, cy - 1, 3, 10);
    ctx.fillRect(cx + 8, cy - 1, 3, 10);
    ctx.fillStyle = pal.skin;
    ctx.fillRect(cx - 11, cy + 7, 3, 3);
    ctx.fillRect(cx + 8, cy + 7, 3, 3);

    // Cabelo
    ctx.fillStyle = pal.hair;
    ctx.fillRect(cx - 9, cy - 14, 18, 14);
    if (trainerId === 'lyra') {
      // Marias-chiquinhas de Lyra
      ctx.fillRect(cx - 14, cy - 10, 5, 8);
      ctx.fillRect(cx + 9, cy - 10, 5, 8);
    } else if (trainerId === 'dawn' || trainerId === 'leaf') {
      // Cabelo longo feminino
      ctx.fillRect(cx - 11, cy - 6, 4, 14);
      ctx.fillRect(cx + 7, cy - 6, 4, 14);
    }

    // Rosto
    ctx.fillStyle = pal.skin;
    ctx.fillRect(cx - 6, cy - 11, 12, 10);

    // Olhos
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 4, cy - 8, 2, 3);
    ctx.fillRect(cx + 2, cy - 8, 2, 3);

    // Chapéu / Bandana / Boina
    ctx.fillStyle = pal.hat;
    ctx.fillRect(cx - 8, cy - 17, 16, 7);
    ctx.fillStyle = pal.brim;
    ctx.fillRect(cx - 10, cy - 11, 20, 2);
  }

  function open(options = {}) {
    onCompleteCallback = options.onComplete || null;
    injectStyles();

    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.className = 'ic-overlay';
    document.body.appendChild(overlay);

    currentStep = 1;
    selectedGender = 'male';
    selectedTrainer = (G.DB && G.DB.save && G.DB.save.trainer) || 'red';
    selectedSquad = (G.DB && G.DB.save && Array.isArray(G.DB.save.squad)) ? [...G.DB.save.squad] : [1, 4, 7];

    render();
  }

  function render() {
    if (!overlay) return;

    if (currentStep === 1) {
      renderStep1();
    } else {
      renderStep2();
    }
  }

  // ================= ETAPA 1: ESCOLHA DO TREINADOR =================
  function renderStep1() {
    const list = TRAINERS[selectedGender] || TRAINERS.male;

    overlay.innerHTML = `
      <div class="ic-modal">
        <div class="ic-header">
          <h2 class="ic-title">★ BEM-VINDO AO MUNDO POKÉMON ★</h2>
          <p class="ic-subtitle">Etapa 1 de 2: Escolha o avatar do Treinador que liderará a sua expedição</p>
        </div>
        <div class="ic-body">
          <div class="ic-tabs">
            <button class="ic-tab-btn ${selectedGender === 'male' ? 'active' : ''}" id="btn-tab-male">👦 Menino</button>
            <button class="ic-tab-btn ${selectedGender === 'female' ? 'active' : ''}" id="btn-tab-female">👧 Menina</button>
          </div>
          <div class="ic-trainer-grid">
            ${list.map(t => `
              <div class="ic-trainer-card ${selectedTrainer === t.id ? 'selected' : ''}" data-trainer="${t.id}">
                <canvas id="cv-trainer-${t.id}" width="64" height="64"></canvas>
                <div class="ic-trainer-name">${t.name}</div>
                <div class="ic-trainer-region">Região de ${t.region} (Gen ${t.gen})</div>
                <div class="ic-trainer-desc">${t.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="ic-footer">
          <span style="font-size:0.75rem; color:#94a3b8">Treinador Selecionado: <b style="color:#facc15" id="txt-selected-trainer">${selectedTrainer.toUpperCase()}</b></span>
          <button class="ic-btn ic-btn-gold" id="btn-step1-next">ESCOLHER TREINADOR ▶</button>
        </div>
      </div>
    `;

    // Renderiza pixel art dos cards
    list.forEach(t => {
      const cv = document.getElementById(`cv-trainer-${t.id}`);
      if (cv) {
        const ctx = cv.getContext('2d');
        drawTrainerPixelArt(ctx, t.id);
      }
    });

    // Listeners das abas de gênero
    const tabMale = document.getElementById('btn-tab-male');
    const tabFemale = document.getElementById('btn-tab-female');
    if (tabMale) tabMale.onclick = () => {
      selectedGender = 'male';
      selectedTrainer = TRAINERS.male[0].id;
      renderStep1();
    };
    if (tabFemale) tabFemale.onclick = () => {
      selectedGender = 'female';
      selectedTrainer = TRAINERS.female[0].id;
      renderStep1();
    };

    // Listeners de seleção de card
    document.querySelectorAll('.ic-trainer-card').forEach(card => {
      card.onclick = () => {
        selectedTrainer = card.dataset.trainer;
        document.querySelectorAll('.ic-trainer-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const txt = document.getElementById('txt-selected-trainer');
        if (txt) txt.textContent = selectedTrainer.toUpperCase();
        if (typeof G === 'object' && G.Audio) G.Audio.sfx('select');
      };
    });

    // Botão de avançar
    const btnNext = document.getElementById('btn-step1-next');
    if (btnNext) {
      btnNext.onclick = () => {
        if (typeof G === 'object' && G.Audio) G.Audio.sfx('confirm');
        currentStep = 2;
        render();
      };
    }
  }

  // ================= ETAPA 2: DRAFT DOS 3 INICIAIS (9 GERAÇÕES) =================
  function renderStep2() {
    const isComplete = selectedSquad.length === 3;
    const filteredStarters = currentGenFilter === 0
      ? ALL_STARTERS
      : ALL_STARTERS.filter(s => s.gen === currentGenFilter);

    // Mapeamento dos 3 slots do topo
    const slots = [0, 1, 2].map(idx => {
      const dex = selectedSquad[idx];
      const mon = dex ? ALL_STARTERS.find(s => s.dex === dex) : null;
      return { idx: idx + 1, mon, dex };
    });

    overlay.innerHTML = `
      <div class="ic-modal">
        <div class="ic-header">
          <h2 class="ic-title">★ MONTE SEU TRIO INICIAL (9 GERAÇÕES) ★</h2>
          <p class="ic-subtitle">Etapa 2 de 2: Escolha livremente 3 Pokémon entre os 27 iniciais oficiais</p>
        </div>
        <div class="ic-body">
          <!-- 3 Slots do Topo -->
          <div class="ic-squad-slots">
            ${slots.map(s => `
              <div class="ic-slot-box ${s.mon ? 'filled' : ''}">
                <div class="ic-slot-label">${s.idx}º Membro ${s.idx === 1 ? '(Vanguarda)' : s.idx === 2 ? '(Esquerda)' : '(Direita)'}</div>
                ${s.mon ? `
                  <canvas id="cv-slot-${s.dex}" width="40" height="40"></canvas>
                  <div class="ic-slot-name">${s.mon.name}</div>
                ` : `
                  <div class="ic-slot-empty">Vazio</div>
                `}
              </div>
            `).join('')}
          </div>

          <div style="text-align:center">
            <span class="ic-count-badge ${isComplete ? 'complete' : ''}">
              [ Selecionados: ${selectedSquad.length} / 3 ]
            </span>
          </div>

          <!-- Filtro de Gerações -->
          <div class="ic-gen-filters">
            <button class="ic-filter-btn ${currentGenFilter === 0 ? 'active' : ''}" data-gen="0">Todas (27)</button>
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => `
              <button class="ic-filter-btn ${currentGenFilter === g ? 'active' : ''}" data-gen="${g}">Gen ${g}</button>
            `).join('')}
          </div>

          <!-- Grade dos 27 Iniciais -->
          <div class="ic-starters-grid">
            ${filteredStarters.map(mon => {
              const selectedIdx = selectedSquad.indexOf(mon.dex);
              const isSelected = selectedIdx !== -1;
              return `
                <div class="ic-starter-card ${isSelected ? 'selected' : ''}" data-dex="${mon.dex}">
                  ${isSelected ? `<span class="ic-starter-badge">#${selectedIdx + 1}</span>` : ''}
                  <canvas id="cv-mon-${mon.dex}" width="48" height="48"></canvas>
                  <div class="ic-starter-name">${mon.name}</div>
                  <div class="ic-type-badges">
                    ${mon.types.map(t => `<span class="ic-type-tag type-${t}">${t}</span>`).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="ic-footer">
          <button class="ic-btn" id="btn-step2-back">◀ VOLTAR</button>
          <button class="ic-btn ic-btn-gold" id="btn-step2-start" ${!isComplete ? 'disabled' : ''}>
            INICIAR JORNADA ▶
          </button>
        </div>
      </div>
    `;

    // Renderiza sprites animados nos slots
    slots.forEach(s => {
      if (s.dex) {
        const cv = document.getElementById(`cv-slot-${s.dex}`);
        if (cv && typeof G === 'object' && G.UI && typeof G.UI.sprite === 'function') {
          G.UI.sprite(cv, s.dex, { lively: true, scale: 2 });
        }
      }
    });

    // Renderiza sprites na grade
    filteredStarters.forEach(mon => {
      const cv = document.getElementById(`cv-mon-${mon.dex}`);
      if (cv && typeof G === 'object' && G.UI && typeof G.UI.sprite === 'function') {
        G.UI.sprite(cv, mon.dex, { lively: true, scale: 2 });
      }
    });

    // Listeners dos filtros por geração
    document.querySelectorAll('.ic-filter-btn').forEach(btn => {
      btn.onclick = () => {
        currentGenFilter = Number(btn.dataset.gen);
        renderStep2();
      };
    });

    // Listeners de clique nos cards de Pokémon
    document.querySelectorAll('.ic-starter-card').forEach(card => {
      card.onclick = () => {
        const dex = Number(card.dataset.dex);
        const idx = selectedSquad.indexOf(dex);

        if (idx !== -1) {
          // Remove da equipe
          selectedSquad.splice(idx, 1);
          if (typeof G === 'object' && G.Audio) G.Audio.sfx('unselect');
        } else {
          // Adiciona se houver vaga
          if (selectedSquad.length < 3) {
            selectedSquad.push(dex);
            if (typeof G === 'object' && G.Audio) G.Audio.sfx('select');
          } else {
            // Substitui o último
            selectedSquad[2] = dex;
            if (typeof G === 'object' && G.Audio) G.Audio.sfx('select');
          }
        }
        renderStep2();
      };
    });

    // Botão Voltar
    const btnBack = document.getElementById('btn-step2-back');
    if (btnBack) {
      btnBack.onclick = () => {
        currentStep = 1;
        render();
      };
    }

    // Botão Iniciar Jornada
    const btnStart = document.getElementById('btn-step2-start');
    if (btnStart) {
      btnStart.onclick = () => {
        if (selectedSquad.length !== 3) return;
        finalizeCreation();
      };
    }
  }

  function finalizeCreation() {
    if (typeof G === 'object' && G.Audio) {
      G.Audio.sfx('confirm');
      G.Audio.sfx('shinyGet');
    }

    // Salva no DB do jogador
    if (typeof G === 'object' && G.DB && G.DB.save) {
      G.DB.save.trainer = selectedTrainer;
      G.DB.save.trainerGender = selectedGender;
      G.DB.save.squad = [...selectedSquad];
      G.DB.save.partner = selectedSquad[0]; // Vanguarda como parceiro principal
      if (typeof G.DB.commit === 'function') {
        G.DB.commit();
      }
    }

    // Transição com fade out
    if (overlay) {
      overlay.classList.add('fade-out');
    }

    setTimeout(() => {
      if (overlay) {
        overlay.remove();
        overlay = null;
      }

      if (typeof onCompleteCallback === 'function') {
        onCompleteCallback({ trainer: selectedTrainer, squad: selectedSquad });
      } else if (typeof G === 'object' && G.Flow && typeof G.Flow.goMenu === 'function') {
        G.Flow.goMenu();
      }
    }, 350);
  }

  return {
    open,
    drawTrainerPixelArt,
    ALL_STARTERS,
    TRAINERS,
    get selectedTrainer() { return selectedTrainer; },
    get selectedSquad() { return selectedSquad; }
  };
})();
