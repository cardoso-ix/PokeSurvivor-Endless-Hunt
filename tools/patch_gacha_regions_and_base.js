const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// =============================================================================
// 1. ATUALIZAR js/systems/gacha.js
// =============================================================================
const gachaJsPath = path.join(ROOT, 'js', 'systems', 'gacha.js');
let gachaJs = fs.readFileSync(gachaJsPath, 'utf8');

const oldPullRouletteSig = `  function pullRoulette(save, count = 1) {
    if (!save) return null;
    save.tickets = save.tickets || { t1: 0, t10: 0 };
    const totalCost = ROULETTE_COST * count;
    if ((save.tickets.t1 || 0) < totalCost) return null;

    save.tickets.t1 -= totalCost;
    save.coins = save.coins || 0;
    save.owned = save.owned || {};
    save.shiny = save.shiny || {};
    save.stats = save.stats || {};

    const allLegs = G.DEX.filter(p => p.rarity === 5 || p.legendary);
    const allNorms = G.DEX.filter(p => p.rarity < 5 && !p.legendary);
    const allShinies = G.DEX.filter(p => G.Sprites && G.Sprites.hasShiny ? G.Sprites.hasShiny(p.dex) : true);`;

const newPullRouletteSig = `  function pullRoulette(save, count = 1, gen = 0) {
    if (!save) return null;
    save.tickets = save.tickets || { t1: 0, t10: 0 };
    const totalCost = ROULETTE_COST * count;
    if ((save.tickets.t1 || 0) < totalCost) return null;

    save.tickets.t1 -= totalCost;
    save.coins = save.coins || 0;
    save.owned = save.owned || {};
    save.shiny = save.shiny || {};
    save.stats = save.stats || {};

    // Filtra exclusivamente pela geração/região selecionada se gen > 0
    let poolSource = G.DEX;
    if (gen > 0) {
      const genMons = G.DEX.filter(p => p.gen === gen);
      if (genMons.length > 0) poolSource = genMons;
    }

    const allLegs = poolSource.filter(p => p.rarity === 5 || p.legendary || p.leg);
    const allNorms = poolSource.filter(p => p.rarity < 5 && !p.legendary && !p.leg);
    const allShinies = poolSource.filter(p => G.Sprites && G.Sprites.hasShiny ? G.Sprites.hasShiny(p.dex) : true);`;

const oldPicks = `      if (forceShiny > 0) {
        forceShiny--;
        isShiny = true;
        mon = G.U.pick(allShinies.length ? allShinies : G.DEX);
        rarity = mon.rarity || (mon.legendary ? 5 : 3);
      } else if (forceLegendary > 0) {
        forceLegendary--;
        mon = G.U.pick(allLegs);
        rarity = 5;
      } else if (roll < 1.0) {
        // 1% Chance: Shiny
        isShiny = true;
        mon = G.U.pick(allShinies.length ? allShinies : G.DEX);
        rarity = mon.rarity || (mon.legendary ? 5 : 3);
      } else if (roll < 6.0) {
        // 5% Chance: Lendário (1.0% a 6.0% = 5.0%)
        mon = G.U.pick(allLegs);
        rarity = 5;
      } else {
        // 94% Chance: Normal
        mon = G.U.pick(allNorms);
        rarity = mon.rarity || 1;
      }`;

const newPicks = `      if (forceShiny > 0) {
        forceShiny--;
        isShiny = true;
        mon = G.U.pick(allShinies.length ? allShinies : poolSource);
        rarity = mon.rarity || (mon.legendary ? 5 : 3);
      } else if (forceLegendary > 0) {
        forceLegendary--;
        mon = G.U.pick(allLegs.length ? allLegs : poolSource);
        rarity = 5;
      } else if (roll < 1.0) {
        // 1% Chance: Shiny
        isShiny = true;
        mon = G.U.pick(allShinies.length ? allShinies : poolSource);
        rarity = mon.rarity || (mon.legendary ? 5 : 3);
      } else if (roll < 6.0) {
        // 5% Chance: Lendário da Região Selecionada
        mon = G.U.pick(allLegs.length ? allLegs : poolSource);
        rarity = mon.rarity || 5;
      } else {
        // 94% Chance: Normal da Região Selecionada
        mon = G.U.pick(allNorms.length ? allNorms : poolSource);
        rarity = mon.rarity || 1;
      }`;

const oldEndLoop = `      save.stats.pulls = (save.stats.pulls || 0) + 1;
      out.push({
        dex: mon.dex,
        rarity,
        shiny: isShiny,
        isNew,
        refund,
        isLegendary: rarity === 5 || !!mon.legendary,
        name: mon.name
      });`;

const newEndLoop = `      // Regra de Liberação Automática do Estágio 1:
      // Se tirar um Pokémon de estágio 2 ou 3 (ex: Charizard), libera o estágio 1 (Charmander) para ser jogável!
      let baseUnlockedDex = null;
      let baseUnlockedName = null;
      const getBase = (typeof G === 'object' && typeof G.getBaseAncestor === 'function')
        ? G.getBaseAncestor
        : (typeof getBaseAncestor === 'function' ? getBaseAncestor : null);

      if (getBase) {
        const rootDex = getBase(mon.dex);
        if (rootDex && Number(rootDex) !== Number(mon.dex)) {
          const rootDexNum = Number(rootDex);
          if (!save.owned[rootDexNum]) {
            save.owned[rootDexNum] = { at: Date.now(), from: 'gacha_base_unlock' };
            baseUnlockedDex = rootDexNum;
            const rootMon = (G.DEX_BY && G.DEX_BY[rootDexNum]) || (G.DEX && G.DEX.find(p => p.dex === rootDexNum));
            baseUnlockedName = rootMon ? rootMon.name : ('#' + rootDexNum);
          }
        }
      }

      save.stats.pulls = (save.stats.pulls || 0) + 1;
      out.push({
        dex: mon.dex,
        rarity,
        shiny: isShiny,
        isNew,
        refund,
        isLegendary: rarity === 5 || !!mon.legendary,
        name: mon.name,
        baseUnlockedDex,
        baseUnlockedName
      });`;

// Aplicação
const replaceBoth = (str, target, replacement) => {
  if (str.includes(target)) return str.replace(target, replacement);
  const targetCRLF = target.replace(/\n/g, '\r\n');
  const replacementCRLF = replacement.replace(/\n/g, '\r\n');
  if (str.includes(targetCRLF)) return str.replace(targetCRLF, replacementCRLF);
  return str;
};

gachaJs = replaceBoth(gachaJs, oldPullRouletteSig, newPullRouletteSig);
gachaJs = replaceBoth(gachaJs, oldPicks, newPicks);
gachaJs = replaceBoth(gachaJs, oldEndLoop, newEndLoop);
fs.writeFileSync(gachaJsPath, gachaJs, 'utf8');
console.log('✅ js/systems/gacha.js atualizado com sucesso.');

// =============================================================================
// 2. ATUALIZAR js/ui/gacha-ui.js
// =============================================================================
const gachaUiPath = path.join(ROOT, 'js', 'ui', 'gacha-ui.js');
let gachaUi = fs.readFileSync(gachaUiPath, 'utf8');

gachaUi = replaceBoth(gachaUi,
  `const res = G.Gacha.pullRoulette(s, count);`,
  `const res = G.Gacha.pullRoulette(s, count, gen);`
);

const oldCardTag = `      c.insertAdjacentHTML('beforeend', \`<b>\${r.shiny ? G.Icons.html('shiny', 12) + ' ' : ''}\${mon.name}</b><div class="tag">\${tagHtml}</div>\`);`;
const newCardTag = `      let baseTag = r.baseUnlockedName ? \`<div class="base-unlock-note" style="color:#4ade80;font-size:11px;font-weight:bold;margin-top:4px;">🐣 Estágio 1 Desbloqueado: \${r.baseUnlockedName} (Jogável!)</div>\` : '';
      c.insertAdjacentHTML('beforeend', \`<b>\${r.shiny ? G.Icons.html('shiny', 12) + ' ' : ''}\${mon.name}</b><div class="tag">\${tagHtml}</div>\${baseTag}\`);`;

gachaUi = replaceBoth(gachaUi, oldCardTag, newCardTag);
fs.writeFileSync(gachaUiPath, gachaUi, 'utf8');
console.log('✅ js/ui/gacha-ui.js atualizado com sucesso.');
