/* ============ player.js — el Pokémon que controlas ============
 * (x, y) son los PIES. Sólo UN movimiento está activo a la vez: se dispara
 * solo y se cambia con 1-4 / Q / E. Cada disparo reproduce la animación de
 * ataque de Mundo Misterioso que le toca (Attack, Shoot o Charge).
 */
G.Player = class Player {
  /**
   * @param mon   entrada de G.DEX
   * @param perks mejoras permanentes ya resueltas (ver data/upgrades.js)
   */
  constructor(mon, perks = {}, shiny = false) {
    this.mon = mon;
    this.dex = mon.dex;
    this.shiny = shiny && G.Sprites.hasShiny(mon.dex);
    this.isShiny = this.shiny;
    this.pokemonId = mon.name ? mon.name.toLowerCase() : String(mon.dex);
    this.species = mon.name ? mon.name.toLowerCase() : String(mon.dex);
    this.types = [...(mon.types || [])];
    this.currentEvolutionStage = 1;
    this.evolutionHistory = [this.pokemonId];
    this.isGodMode = false;

    this.buffs = {
      atk: { n: 0, t: 0, amount: 0 },
      spd: { n: 0, t: 0, amount: 0 },
      def: { n: 0, t: 0, amount: 0 },
      regen: { n: 0, t: 0, amount: 0 }
    };

    // --- CAMADA 1: Dados Base da Pokédex ---
    const basePokedex = (typeof POKEDEX !== 'undefined' && POKEDEX[this.pokemonId])
      || (typeof G === 'object' && G.DEX_BY && G.DEX_BY[mon.dex])
      || mon;

    const base = {
      hp: basePokedex.hp || 100,
      atk: basePokedex.atk != null ? basePokedex.atk : 10,
      def: basePokedex.def != null ? basePokedex.def : 0,
      speed: (basePokedex.speed != null ? basePokedex.speed : (basePokedex.spd != null ? basePokedex.spd : 100))
    };
    this.basePokedexStats = {
      hp: base.hp,
      atk: base.atk,
      spd: base.speed,
      speed: base.speed,
      def: base.def
    };

    // --- PRESTÍGIO DE RARIDADE (Poder Real: Shiny, Lendário e Shiny Lendário) ---
    const isLegend = !!(this.mon && (this.mon.leg === true || (this.mon.rarity && this.mon.rarity >= 5)));
    const isShiny = !!(this.shiny || this.isShiny);
    const isShinyLegend = isLegend && isShiny;

    const bCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
    const rMulti = (bCfg && bCfg.player && bCfg.player.rarityMultipliers) || {
      shinyLegend: { dmg: 1.50, hp: 1.25, spd: 1.10 },
      shiny:       { dmg: 1.25, hp: 1.10, spd: 1.05 },
      legendary:   { dmg: 1.20, hp: 1.15, spd: 1.05 },
      common:      { dmg: 1.00, hp: 1.00, spd: 1.00 }
    };

    let rarityDmgMul = 1.0;
    let rarityHpMul = 1.0;
    let raritySpdMul = 1.0;

    if (isShinyLegend) {
      rarityDmgMul = rMulti.shinyLegend.dmg;
      rarityHpMul = rMulti.shinyLegend.hp;
      raritySpdMul = rMulti.shinyLegend.spd;
    } else if (isShiny) {
      rarityDmgMul = rMulti.shiny.dmg;
      rarityHpMul = rMulti.shiny.hp;
      raritySpdMul = rMulti.shiny.spd;
    } else if (isLegend) {
      rarityDmgMul = rMulti.legendary.dmg;
      rarityHpMul = rMulti.legendary.hp;
      raritySpdMul = rMulti.legendary.spd;
    }

    this.rarityMultipliers = {
      isLegend,
      isShiny,
      isShinyLegend,
      dmg: rarityDmgMul,
      hp: rarityHpMul,
      spd: raritySpdMul
    };

    // --- CAMADA 2: Meta-Upgrades da Espécie (db.js / localStorage) ---
    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : ((typeof global !== 'undefined' && global.db) ? global.db : null));
    const getBonusFn = (dbObj && typeof dbObj.getSpeciesUpgradeBonus === 'function')
      ? dbObj.getSpeciesUpgradeBonus
      : (typeof getSpeciesUpgradeBonus === 'function' ? getSpeciesUpgradeBonus : null);

    const metaBonus = (getBonusFn ? getBonusFn(this.pokemonId || mon.dex) : null) || {};

    const calcAtk = Number(((base.atk || 1) + (metaBonus.atk || 0)).toFixed(2));
    const calcDef = Number(((base.def || 0) + (metaBonus.def || 0)).toFixed(2));
    const calcSpd = Number(((base.speed || 100) + (metaBonus.speed || 0)).toFixed(1));

    // --- SOMA OBRIGATÓRIA DOS ATRIBUTOS REAIS COM MULTIPLICADOR DE PRESTÍGIO ---
    this.maxHp = Math.round(((base.hp || 100) + (metaBonus.hp || 0)) * rarityHpMul);
    this.currentHp = this.maxHp;
    this.hp = this.maxHp;

    // Amarração direta aos atributos base de combate e movimento
    this.baseAtk = Number((calcAtk * rarityDmgMul).toFixed(2));
    this.baseSpd = Number((calcSpd * raritySpdMul).toFixed(1));
    this._dmgReduce = calcDef;

    // Log de diagnóstico e prova real no Console (F12)
    console.group(`%c🎮 [POKÉMON INICIAL CARREGADO] ${String(this.pokemonId).toUpperCase()}`, "color: #ffcb05; font-size: 13px; font-weight: bold;");
    console.log(`❤️ HP:        Base ${base.hp} + Bônus Upgrade ${metaBonus.hp || 0} = ${this.maxHp}`);
    console.log(`⚔️ ATAQUE:    Base ${base.atk} + Bônus Upgrade ${metaBonus.atk || 0} = ${this.attack}`);
    console.log(`🛡️ DEFESA:    Base ${base.def} + Bônus Upgrade ${metaBonus.def || 0} = ${this.defense}`);
    console.log(`👟 VELOCIDADE: Base ${base.speed} + Bônus Upgrade ${metaBonus.speed || 0} = ${this.speed}`);
    console.groupEnd();

    const getUpgrades = (dbObj && typeof dbObj.getSpeciesUpgrades === 'function')
      ? dbObj.getSpeciesUpgrades
      : (typeof getSpeciesUpgrades === 'function' ? getSpeciesUpgrades : null);

    this.permanentMetaStats = getUpgrades ? getUpgrades(this.pokemonId || mon.dex) : {
      species: this.species,
      dex: this.dex,
      level: 0,
      hpBonus: metaBonus.hp || 0,
      atkBonus: metaBonus.atk || 0,
      spdBonus: metaBonus.speed || 0,
      defBonus: metaBonus.def || 0,
      cdBonus: metaBonus.cd || 0,
      regenBonus: metaBonus.regen || 0,
      perks: perks
    };
    this.perks = this.permanentMetaStats.perks || perks;

    // --- CAMADA 3: Modificadores Acumulados In-Run (Cartas e Passivas) ---
    this.inRunModifiers = {
      hpFlat: 0,
      atkMul: 1,
      atkBonusAdditive: 0,
      atkMulIndependent: 1.0,
      spdMul: 1,
      cdMul: 1,
      dmgReduce: 0,
      regenFlat: 0,
      xpMul: 1
    };

    this.anim = new G.Sprites.Animator(mon.dex, 1, this.shiny);
    this.x = 0; this.y = 0;
    this.baseR = G.Sprites.bodyRadius(mon.dex);
    this.baseBodyH = G.Sprites.bodyHeight(mon.dex);
    this.megaVisualScale = 1.0;
    this.r = this.baseR;
    this.bodyH = this.baseBodyH;

    this._atkMul = 1;
    this._spdMul = 1;
    this._cdMul = (this.perks && this.perks.cdMul) || 1;
    this._dmgReduce = (this.perks && this.perks.dmgReduce) || 0;
    this._regenFlat = (this.perks && this.perks.regen) || 0;
    this._magnet = 78 * ((this.perks && this.perks.magnetMul) || 1);
    this.xpMul = (this.perks && this.perks.xpMul) || 1;
    this.coinMul = (this.perks && this.perks.coinMul) || 1;

    this.maxHp = this.basePokedexStats.hp;
    this.hp = this.maxHp;
    this.recalculateTotalStats(false);
    this.hp = this.maxHp;

    if (typeof window !== 'undefined') {
      window.player = this;
    }

    this.moves = [];           // todos los movimientos aprendidos
    this.slots = [];           // huecos: cada uno, una lista de movimientos que se lanzan a la vez
    this.active = 0;           // hueco activo
    this.maxMoves = 4;         // huecos
    this.bonds = 0;            // vínculos por usar (premio de los legendarios)
    this.quadComboActive = false; // Comba os 4 ataques juntos a partir do Nv 20

    this.buffs = {
      atk: { n: 0, t: 0, amount: 0 },
      spd: { n: 0, t: 0, amount: 0 },
      def: { n: 0, t: 0, amount: 0 },
      regen: { n: 0, t: 0, amount: 0 }
    };

    this.level = 1;
    this.xp = 0;
    this.xpNext = Player.xpFor(1);
    this.kills = 0;
    this.bosses = 0;
    this.rerolls = 0;          // veces que ha cambiado las cartas de nivel en esta run
    this.rerollBonus = perks.rerolls || 0;   // cambios comprados en Mejoras (más el gratis)
    this._critChance = perks.crit || 0;       // probabilidad de golpe crítico (Mejoras)
    this.banned = new Set();                 // movimientos vetados (Mejoras → Veto): no salen en las cartas
    this.bind = {};                          // movimiento -> hueco fijo (0-3), elegido en Mejoras
    this.coins = 0;            // monedas recogidas en esta run
    this.t1 = 0; this.t10 = 0; // tickets del gacha recogidos en esta run
    this.dmgDealt = 0;

    this.invuln = 0;
    this.flash = 0;
    this.aim = Math.PI / 2;
    this.moveAngle = Math.PI / 2;
    this.walking = false;
    this.inLiquid = false;
    this.lavaTick = 0;
    this.attackFace = 0;       // tiempo que sigue mirando al objetivo tras atacar
    this.dead = false;
    this.power = null;         // poder de altar activo: { def, t, dur }
    this.slowT = 0;            // pegado por una trampa
    this.item = null;          // objeto equipado (data/items.js), uno por run
    this.sashT = -999;         // última vez que salvó la Banda Focus
    this.bellHeal = 0;         // curación pendiente del Cascabel Concha
    this.statsTaken = {};      // mejoras de stat cogidas (condición de evolución)

    // Modo Mega / Super Frenzy (estilo Super Mario Star)
    this.megaMode = {
      active: false,
      timer: 0,
      maxTimer: 15,
      ghosts: [],         // after-images (rastros fantasma pixel art)
      particles: [],      // faíscas e estrelas pixel art
      ghostTimer: 0,
      starTimer: 0,
      touchDmgTimer: 0
    };
    this.megaEnergy = 0;       // Energia de carga Mega (0 a 100)
    this.megaMaxEnergy = 100;
  }

  /** Segundos que hay que estar junto a un compañero caído para levantarlo. */
  static get REVIVE_TIME() { return 3; }

  // Curva de XP delegada ao BalanceConfig
  static xpFor(level) {
    const bCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
    if (bCfg && bCfg.xp && typeof bCfg.xp.forLevel === 'function') {
      return bCfg.xp.forLevel(level);
    }
    return Math.floor((8 + level * 6 + Math.pow(level, 1.75) * 1.6) * 4);
  }

  cy() { return this.y; }

  // ---------------- stats efectivos e camadas de atributos ----------------
  get currentHp() { return this.hp; }
  set currentHp(v) { this.hp = v; }

  get atkMul() {
    if (!this.inRunModifiers) return this._atkMul || 1;
    const add = this.inRunModifiers.atkBonusAdditive || 0;
    const ind = this.inRunModifiers.atkMulIndependent !== undefined ? this.inRunModifiers.atkMulIndependent : 1;
    return (1 + add) * ind;
  }
  set atkMul(v) {
    if (this.inRunModifiers) {
      this.inRunModifiers.atkMul = v;
      this.inRunModifiers.atkBonusAdditive = Math.max(-0.9, v - 1);
    }
    this._atkMul = v;
  }

  get spdMul() {
    return this.inRunModifiers ? this.inRunModifiers.spdMul : (this._spdMul || 1);
  }
  set spdMul(v) {
    if (this.inRunModifiers) {
      this.inRunModifiers.spdMul = v;
    }
    this._spdMul = v;
  }

  get dmgReduce() {
    return this._dmgReduce || 0;
  }
  set dmgReduce(v) {
    this._dmgReduce = v;
    if (this.inRunModifiers && this.permanentMetaStats) {
      this.inRunModifiers.dmgReduce = Math.max(0, v - (this.permanentMetaStats.defBonus || 0));
    }
  }

  get regenFlat() {
    return this._regenFlat || 0;
  }
  set regenFlat(v) {
    this._regenFlat = v;
    if (this.inRunModifiers && this.permanentMetaStats) {
      this.inRunModifiers.regenFlat = Math.max(0, v - (this.permanentMetaStats.regenBonus || 0));
    }
  }

  get attack() {
    return Math.round(this.atk * 100) / 100;
  }
  set attack(v) {
    this.baseAtk = v;
  }

  get speed() {
    return Math.round(this.spd * 10) / 10;
  }
  set speed(v) {
    this.baseSpd = v;
  }

  get defense() {
    return Math.round(this.reduction * 100) / 100;
  }
  set defense(v) {
    this._dmgReduce = v;
  }

  get stats() {
    return {
      attack: Math.round(this.atk * 100) / 100,
      speed: Math.round(this.spd * 100) / 100,
      maxHp: this.maxHp,
      hp: this.hp,
      defense: Math.round(this.dmgReduce * 100) / 100,
      cdMul: Math.round(this.cdMul * 100) / 100,
      regen: Math.round(this.regen * 100) / 100
    };
  }

  /**
   * Recalcula os atributos totais do jogador combinando as três camadas:
   * Total = (BasePokedex + PermanentMeta) * InRunModifiers
   * Mantém estritamente a proporção de HP atual da barra de vida.
   */
  recalculateTotalStats(preserveHpRatio = true) {
    if (!this.basePokedexStats) {
      this.basePokedexStats = {
        hp: (this.mon && this.mon.hp) || 100,
        atk: (this.mon && this.mon.atk) || 1,
        spd: (this.mon && this.mon.spd) || 100,
        def: 0
      };
    }
    if (!this.permanentMetaStats) {
      const getUpgrades = (typeof G === 'object' && G.DB && typeof G.DB.getSpeciesUpgrades === 'function')
        ? G.DB.getSpeciesUpgrades
        : (typeof getSpeciesUpgrades === 'function' ? getSpeciesUpgrades : null);
      this.permanentMetaStats = getUpgrades ? getUpgrades(this.pokemonId || this.dex || this.species) : {
        hpBonus: 0, atkBonus: 0, spdBonus: 0, defBonus: 0, cdBonus: 0, regenBonus: 0, perks: {}
      };
    }
    if (!this.inRunModifiers) {
      this.inRunModifiers = {
        hpFlat: 0, atkMul: 1, atkBonusAdditive: 0, atkMulIndependent: 1.0, spdMul: 1, cdMul: 1, dmgReduce: 0, regenFlat: 0, xpMul: 1
      };
    }

    // Recalcula multiplicadores de prestígio (Shiny, Lendário, Shiny Lendário)
    const isLegend = !!(this.mon && (this.mon.leg === true || (this.mon.rarity && this.mon.rarity >= 5)));
    const isShiny = !!(this.shiny || this.isShiny);
    const isShinyLegend = isLegend && isShiny;

    let rarityDmgMul = 1.0;
    let rarityHpMul = 1.0;
    let raritySpdMul = 1.0;

    const bCfgRecalc = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : ((typeof G === 'object' && G.BalanceConfig) ? G.BalanceConfig : null));
    const rMultiRecalc = (bCfgRecalc && bCfgRecalc.player && bCfgRecalc.player.rarityMultipliers) || {
      shinyLegend: { dmg: 1.50, hp: 1.25, spd: 1.10 },
      shiny:       { dmg: 1.25, hp: 1.10, spd: 1.05 },
      legendary:   { dmg: 1.20, hp: 1.15, spd: 1.05 },
      common:      { dmg: 1.00, hp: 1.00, spd: 1.00 }
    };

    if (isShinyLegend) {
      rarityDmgMul = rMultiRecalc.shinyLegend.dmg;
      rarityHpMul = rMultiRecalc.shinyLegend.hp;
      raritySpdMul = rMultiRecalc.shinyLegend.spd;
    } else if (isShiny) {
      rarityDmgMul = rMultiRecalc.shiny.dmg;
      rarityHpMul = rMultiRecalc.shiny.hp;
      raritySpdMul = rMultiRecalc.shiny.spd;
    } else if (isLegend) {
      rarityDmgMul = rMultiRecalc.legendary.dmg;
      rarityHpMul = rMultiRecalc.legendary.hp;
      raritySpdMul = rMultiRecalc.legendary.spd;
    }

    this.rarityMultipliers = {
      isLegend,
      isShiny,
      isShinyLegend,
      dmg: rarityDmgMul,
      hp: rarityHpMul,
      spd: raritySpdMul
    };

    const oldMaxHp = this.maxHp || 1;
    const hpRatio = oldMaxHp > 0 ? (this.hp / oldMaxHp) : 1;

    // HP Máximo: (Base + Meta + Cartas da run) escalado por prestígio
    const rawHp = this.basePokedexStats.hp + (this.permanentMetaStats.hpBonus || 0) + (this.inRunModifiers.hpFlat || 0);
    const newMaxHp = Math.round(rawHp * rarityHpMul);
    this.maxHp = Math.max(1, newMaxHp);

    if (preserveHpRatio) {
      this.hp = Math.max(1, Math.min(this.maxHp, Math.round(this.maxHp * hpRatio)));
    }

    // Ataque: Base + Meta (escalado por prestígio e multiplicado por inRunModifiers.atkMul via getter)
    const metaAtkBonus = this.permanentMetaStats.atkBonus || 0;
    this.baseAtk = this.basePokedexStats.atk * (1 + metaAtkBonus) * rarityDmgMul;

    // Velocidade: Base + Meta (escalado por prestígio e multiplicado por inRunModifiers.spdMul via getter)
    const metaSpdBonus = this.permanentMetaStats.spdBonus || 0;
    this.baseSpd = this.basePokedexStats.spd * (1 + metaSpdBonus) * raritySpdMul;

    // Defesa: Meta + InRun
    const metaDefBonus = this.permanentMetaStats.defBonus || 0;
    this._dmgReduce = Math.min(0.7, metaDefBonus + (this.inRunModifiers.dmgReduce || 0));

    // Cooldown: Meta * InRun
    const metaCdMul = (this.permanentMetaStats.perks && this.permanentMetaStats.perks.cdMul) || 1;
    this._cdMul = Math.max(0.2, metaCdMul * (this.inRunModifiers.cdMul || 1));

    // Regeneração: Meta + InRun
    const metaRegen = this.permanentMetaStats.regenBonus || 0;
    this._regenFlat = metaRegen + (this.inRunModifiers.regenFlat || 0);

    // Experiência: Meta * InRun
    const metaXpMul = (this.permanentMetaStats.perks && this.permanentMetaStats.perks.xpMul) || 1;
    this.xpMul = metaXpMul * (this.inRunModifiers.xpMul || 1);

    this.perks = this.permanentMetaStats.perks || this.perks;

    return this;
  }

  addAtkBonus(pct, isIndependent = false) {
    if (!this.inRunModifiers) {
      this.inRunModifiers = {
        hpFlat: 0, atkMul: 1, atkBonusAdditive: 0, atkMulIndependent: 1.0, spdMul: 1, cdMul: 1, dmgReduce: 0, regenFlat: 0, xpMul: 1
      };
    }
    if (this.inRunModifiers.atkBonusAdditive === undefined) this.inRunModifiers.atkBonusAdditive = 0;
    if (this.inRunModifiers.atkMulIndependent === undefined) this.inRunModifiers.atkMulIndependent = 1.0;

    if (isIndependent) {
      this.inRunModifiers.atkMulIndependent *= (1 + pct);
    } else {
      this.inRunModifiers.atkBonusAdditive += pct;
    }
    this.inRunModifiers.atkMul = (1 + this.inRunModifiers.atkBonusAdditive) * this.inRunModifiers.atkMulIndependent;
    this._atkMul = this.inRunModifiers.atkMul;
    return this;
  }

  get atk() {
    const isMega = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive) || (this.megaDmgMul && this.megaDmgMul > 1);
    const megaMul = isMega ? (this.megaDmgMul || 5.0) : 1;
    let weatherAtk = (typeof G === 'object' && G.Weather && G.Weather.getAtkMul) ? G.Weather.getAtkMul(this) : 1;
    const bAtk = (this.buffs && this.buffs.atk) ? this.buffs.atk.n * this.buffs.atk.amount : 0;
    const inRunAdd = (this.inRunModifiers && this.inRunModifiers.atkBonusAdditive !== undefined) ? this.inRunModifiers.atkBonusAdditive : ((this.atkMul || 1) - 1);
    const indepMul = (this.inRunModifiers && this.inRunModifiers.atkMulIndependent !== undefined) ? this.inRunModifiers.atkMulIndependent : 1.0;
    return this.baseAtk * Math.max(0.1, 1 + inRunAdd + bAtk) * indepMul * megaMul * weatherAtk;
  }
  get spd() {
    const isMega = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive);
    let megaMul = isMega ? 2.0 : 1;
    let weatherSpd = (typeof G === 'object' && G.Weather && G.Weather.getSpdMul) ? G.Weather.getSpdMul(this) : 1;
    const bSpd = (this.buffs && this.buffs.spd) ? this.buffs.spd.n * this.buffs.spd.amount : 0;
    const s = this.baseSpd * this.spdMul * (1 + bSpd) * (this.slowT > 0 ? 0.5 : 1) * megaMul * weatherSpd;
    const w = (typeof G === 'object' && G.Weather && G.Weather.speedFor) ? G.Weather.speedFor(this.mon ? this.mon.types : this.types) : 1;
    const slow = this.inLiquid ? (typeof G === 'object' && G.World && G.World.liquidEffect ? G.World.liquidEffect(this.mon ? this.mon.types : this.types).slow || 1 : 1) : 1;
    return s * slow * w;
  }
  get reduction() {
    const isMega = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive);
    let weatherDef = (typeof G === 'object' && G.Weather && G.Weather.getDefBonus) ? G.Weather.getDefBonus(this) : 0;
    const bDef = (this.buffs && this.buffs.def) ? this.buffs.def.n * this.buffs.def.amount : 0;
    const baseRed = (this.dmgReduce + bDef + weatherDef) * (isMega ? 2.0 : 1.0);
    return isMega ? Math.max(0.80, Math.min(0.92, baseRed)) : Math.min(0.85, baseRed);
  }
  get regen() {
    let weatherRegen = (typeof G === 'object' && G.Weather && G.Weather.getRegenBonus) ? G.Weather.getRegenBonus(this) : 0;
    const bRegen = (this.buffs && this.buffs.regen) ? this.buffs.regen.n * this.buffs.regen.amount : 0;
    const baseReg = this.regenFlat + bRegen + weatherRegen;
    const isMega = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive);
    return isMega ? Math.max(12, baseReg * 2.0) : baseReg;
  }

  get cdMul() {
    let base = this._cdMul != null ? this._cdMul : 1;
    if (typeof G === 'object' && G.Weather && G.Weather.getCdMul) {
      base *= G.Weather.getCdMul(this);
    }
    // Sobrecarga de Energia ao atingir Nível 20+: -15% de tempo de recarga global
    if (this.level >= 20) {
      base *= 0.85;
    }
    const isMega = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive);
    if (isMega) {
      base *= 0.5; // Duas vezes mais rápido na cadência de ataque (metade do tempo de recarga)
    }
    return base;
  }

  get areaMul() {
    let base = this._areaMul != null ? this._areaMul : 1;
    // Sobrecarga de Energia ao atingir Nível 20+: +20% de área em todos os ataques
    if (this.level >= 20) {
      base *= 1.20;
    }
    const isMega = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive);
    if (isMega) {
      base *= 1.35;
    }
    return base;
  }
  set areaMul(val) {
    this._areaMul = val;
  }
  set cdMul(val) {
    if (this.inRunModifiers) {
      const metaCd = (this.permanentMetaStats && this.permanentMetaStats.perks && this.permanentMetaStats.perks.cdMul) || 1;
      this.inRunModifiers.cdMul = metaCd > 0 ? (val / metaCd) : val;
    }
    this._cdMul = val;
  }

  get critChance() {
    const base = this._critChance != null ? this._critChance : 0.05;
    const isMega = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive);
    return isMega ? Math.min(1.0, base * 2.0 + 0.30) : base;
  }
  set critChance(val) {
    this._critChance = val;
  }

  get magnet() {
    let base = this._magnet != null ? this._magnet : 78;
    const isMega = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive);
    if (isMega) {
      base *= 2.0; // +100% de alcance de coleta no Mega Overdrive (dobra o ímã)
    }
    return base;
  }
  set magnet(val) {
    this._magnet = val;
  }

  // ---------------- movimientos ----------------
  addMove(id) {
    if (this.slots.length >= this.maxMoves || this.hasMove(id)) return false;
    const m = G.Moves.instance(id, 1);
    this.moves.push(m);
    const group = [m];
    this.slots.push(group);
    this.arrange();
    // Se cambia al nuevo, salvo si estás usando un vínculo (no te quita el grupo).
    if (!(this.slots[this.active] && this.slots[this.active].length > 1)) this.setActive(this.slots.indexOf(group));
    return true;
  }

  /**
   * Huecos fijos (Mejoras → Atajos): cada movimiento con hueco elegido se pone
   * en ese número para la memoria muscular (Confusión siempre en el 1...).
   * Mientras no tengas tantos movimientos, va al más cercano; los demás
   * rellenan los huecos libres en el orden en que los aprendiste.
   */
  arrange() {
    const n = this.slots.length;
    if (n < 2 || !this.bind) return;
    const want = g => { let k = Infinity; for (const m of g) if (this.bind[m.id] != null) k = Math.min(k, this.bind[m.id]); return k; };
    const cur = this.slots[this.active];
    const out = new Array(n).fill(null);
    const bound = this.slots.filter(g => want(g) < Infinity).sort((a, b) => want(a) - want(b));
    for (const g of bound) {
      let p = Math.min(want(g), n - 1);
      while (p >= 0 && out[p]) p--;                          // ocupado: el de antes
      if (p < 0) { p = 0; while (out[p]) p++; }              // o el primero libre
      out[p] = g;
    }
    for (const g of this.slots) if (!out.includes(g)) out[out.indexOf(null)] = g;
    this.slots = out;
    if (cur) this.active = out.indexOf(cur);
  }

  hasMove(id) { return this.moves.some(m => m.id === id); }

  setActive(i) {
    if (i < 0 || i >= this.slots.length || i === this.active) return;
    // Cinta Elección: no se puede cambiar de movimiento.
    if (this.hasItem('choiceband') && this.slots[this.active]) {
      G.FX.dmgText(this.x, this.y - this.bodyH - 8, 'Cinta Elección', '#ff8ad8');
      return;
    }
    this.active = i;
    G.Projectiles.clearOrbs(this);
    G.Audio.sfx('select');
    for (const m of this.slots[i]) m.t = Math.min(m.t, m.cd * 0.35);
    const m = this.slots[i][0];
    G.FX.ring(this.x, this.y - G.LIFT * 0.5, 6, this.r * 3.4, G.U.TYPE_COLOR[m.type], 0.3, 3);
  }

  cycle(dir) {
    if (!this.slots.length) return;
    this.setActive((this.active + dir + this.slots.length) % this.slots.length);
  }

  // ---------------- vínculos (fusiones) ----------------
  // Cada legendario vencido da un vínculo. Con él se juntan movimientos en un
  // solo hueco y se lanzan a la vez. Sólo crece un grupo (hasta BOND_MAX); si
  // no hay ninguno a medias, el vínculo une dos movimientos sueltos.
  static get BOND_MAX() { return 4; }

  /** Lo que se puede hacer ahora con un vínculo: añadir a un grupo o unir dos sueltos. */
  bondOptions() {
    const loose = this.slots.filter(s => s.length === 1).map(s => s[0]);
    const grow = this.slots.find(s => s.length > 1 && s.length < Player.BOND_MAX);
    if (grow) return loose.length ? { mode: 'add', group: grow, loose } : null;
    return loose.length >= 2 ? { mode: 'pair', group: null, loose } : null;
  }

  /** Junta `moves` (sueltos) en el grupo `group` (o en uno nuevo) y gasta un vínculo. */
  fuse(moves, group = null) {
    const target = group || this.slots.find(s => s[0] === moves[0]);
    const cur = this.slots[this.active];
    for (const m of moves) {
      if (target.includes(m)) continue;
      const i = this.slots.findIndex(s => s.length === 1 && s[0] === m);
      if (i < 0) continue;
      this.slots.splice(i, 1);
      target.push(m);
    }
    this.arrange();
    // Se pasa al grupo, salvo con la Cinta Elección (sigues en el hueco que tenías, si queda).
    const a = this.slots.indexOf(cur);
    this.active = this.hasItem('choiceband') && a >= 0 ? a : this.slots.indexOf(target);
    this.bonds = Math.max(0, this.bonds - 1);
    G.Projectiles.clearOrbs(this);
    return target;
  }

  /** Movimientos que se lanzan ahora (el grupo del hueco activo, o todos juntos a partir del nivel 20). */
  activeGroup() {
    if (this.level >= 20 || this.quadComboActive) {
      return this.moves;
    }
    return this.slots[this.active] || [];
  }

  activeMove() { return this.activeGroup()[0]; }

  /**
   * Lo llama combat.js al lanzar un movimiento. Elige la animación de PMD y la
   * acelera si la recarga es más corta que la animación, para que encadene.
   */
  cast(m) {
    // Vidasfera: cada ataque cuesta un poco de vida (nunca te deja KO).
    if (this.hasItem('lifeorb') && m.kind !== 'orbit' && m.kind !== 'trail' && !this.remote) {
      this.hp = Math.max(1, this.hp - Math.max(1, this.maxHp * 0.01));
    }
    const anim = { melee: 'Attack', beam: 'Shoot', projectile: 'Shoot', nova: 'Attack',
                   aura: 'Charge', buff: 'Charge', orbit: 'Charge', boomerang: 'Shoot', chain: 'Shoot',
                   mine: 'Charge', meteor: 'Charge', turret: 'Charge', dash: 'Attack', trail: 'Walk', cone: 'Shoot' }[m.kind] || 'Attack';
    // Las familias nuevas suenan como la parecida de las de siempre.
    const SND = { boomerang: 'projectile', chain: 'beam', mine: 'nova', meteor: 'nova', turret: 'buff', dash: 'melee', trail: 'aura', cone: 'projectile' };
    // El rastro no suena a cada charco (sería un zumbido constante).
    if (m.kind !== 'trail') G.Audio.sfx('shot', { kind: SND[m.kind] || m.kind, type: m.type });
    if (m.kind === 'trail') return;
    // No reinicies una animación que va por la mitad: se vería a tirones.
    if (this.anim.busy() && this.anim.progress() < 0.65) return;
    const meta = G.Sprites.animMeta(this.dex, anim);
    const len = meta ? meta.d.reduce((a, b) => a + b, 0) / 60 : 0.4;
    const cd = Math.max(0.12, m.cd * this.cdMul);
    this.anim.play(anim, { speed: Math.max(1, len / (cd * 0.9)) });
    this.attackFace = 0.35;
  }

  // ---------------- daño y curación ----------------
  /**
   * @param type  tipo del ataque (tabla de tipos y clima); sin tipo, daño tal cual
   * @param pure  daño que no baja con la defensa ni el cuerpo a cuerpo (Arceus)
   */
  takeDamage(amount) {
    if (this.isGodMode || this.godMode) return;
    this.hurt(amount);
  }

  hurt(amount, type = null, pure = false) {
    if (this.isGodMode || this.godMode || this.invuln > 0 || this.dead) return;
    if (!pure && typeof G === 'object' && G.Weather && G.Weather.getDodgeChance) {
      const dodge = G.Weather.getDodgeChance(this);
      if (dodge > 0 && Math.random() < dodge) {
        G.FX.dmgText(this.x, this.y - this.bodyH - 4, 'ESQUIVA', '#b388ff', true);
        this.invuln = 0.2;
        return;
      }
    }
    let eff = null;
    if (type && typeof G === 'object' && G.Types && typeof G.Types.mult === 'function') {
      const monTypes = (this.mon && this.mon.types) ? this.mon.types : (this.types || []);
      const k = G.Types.mult(type, monTypes);
      eff = G.Types.label(k);
      const wMult = (G.Weather && typeof G.Weather.mult === 'function') ? G.Weather.mult(type) : 1;
      amount *= k * wMult;
    }
    // Con un ataque cuerpo a cuerpo activo se recibe un 25 % menos: hay que
    // estar encima de los enemigos para pegar (iban muy por detrás).
    const hasCloseMelee = typeof this.activeGroup === 'function' && this.activeGroup().some(m => m.kind === 'melee');
    const close = hasCloseMelee ? 0.75 : 1;
    // Super Sobrevivência do Mega: multiplicador único de dano recebido (20% = redução de 80%)
    const megaProt = (typeof G === 'object' && G.Mega && G.Mega.isActive)
      ? (this.dmgTakenMul != null ? this.dmgTakenMul : 0.20)
      : 1.0;
    let d = pure ? Math.max(1, amount * megaProt) : Math.max(1, amount * (1 - this.reduction) * close * megaProt);

    // Proteção Anti-One-Shot: monstro comum não pode arrancar mais de 35% de vida num único hit
    if (!pure && this.maxHp > 0 && d > this.maxHp * 0.35) {
      d = Math.max(1, Math.round(this.maxHp * 0.35));
    }

    this.hp -= d;
    const isCrit = (this.hp / (this.maxHp || 1)) < 0.30;
    this.invuln = isCrit ? 0.80 : 0.65;
    this.flash = 0.18;
    if (typeof G === 'object') {
      if (G.Audio && typeof G.Audio.sfx === 'function') G.Audio.sfx('hurt');
      if (G.Camera && typeof G.Camera.kick === 'function') G.Camera.kick(0.28);
      if (G.FX && typeof G.FX.dmgText === 'function') {
        G.FX.dmgText(this.x, this.y - this.bodyH - 4, '-' + Math.round(d), eff === 'super' ? '#ff3048' : eff === 'weak' ? '#c9a0a8' : '#ff6b7a', eff === 'super');
      }
      if (G.FX && typeof G.FX.burst === 'function') {
        G.FX.burst(this.x, this.y - this.bodyH * 0.5, '#ff5f6d', 6, 90);
      }
    }
    // Banda Focus: aguanta el golpe con 1 de vida (una vez cada 60 s).
    if (this.hp <= 0 && typeof this.hasItem === 'function' && this.hasItem('focussash') && (typeof performance !== 'undefined' ? performance.now() : Date.now()) - this.sashT > 60000) {
      this.sashT = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.hp = 1; this.invuln = 1.2;
      if (typeof G === 'object' && G.FX) {
        if (typeof G.FX.dmgText === 'function') G.FX.dmgText(this.x, this.y - this.bodyH - 16, 'Faixa de Foco!', '#ff9a3d', true);
        if (typeof G.FX.ring === 'function') G.FX.ring(this.x, this.y, 6, 70, '#ff9a3d', 0.5, 4);
      }
    }
    if (this.hp <= 0) {
      this.hp = 0; this.dead = true;
      if (this.anim && typeof this.anim.play === 'function') this.anim.play('Faint', { hold: true });
      if (typeof G === 'object' && G.Projectiles && typeof G.Projectiles.clearOrbs === 'function') G.Projectiles.clearOrbs(this);
      this.reviveT = 0;
    }
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const got = Math.round(this.hp - before);
    if (got >= 1) G.FX.dmgText(this.x, this.y - this.bodyH - 6, '+' + got, '#5fe08a');
  }

  addMaxHp(amount) { this.maxHp += amount; this.hp += amount; }

  /** Devuelve cuántos niveles ha subido (pueden ser varios de golpe). */
  gainXp(amount) {
    this.xp += amount * this.xpMul;
    let leveled = 0;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Player.xpFor(this.level);
      leveled++;
      if (typeof this.addMegaEnergy === 'function') {
        this.addMegaEnergy(3.5);
      }
      if (this.level >= 20 && !this._overchargeAnnounced) {
        this._overchargeAnnounced = true;
        if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
          G.Spawner.say('⚡ SOBRECARGA ATIVADA! (+20% Área, -15% Recarga)', 3.5, true);
        }
        if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') {
          G.Audio.sfx('legend');
        }
        if (typeof G === 'object' && G.FX && typeof G.FX.ring === 'function') {
          G.FX.ring(this.x, this.y, 10, 140, '#ffd700', 0.8, 6);
        }
      }
      this.checkEvolutionMilestones();
    }
    return leveled;
  }

  /** Concede experiência e aciona abertura da tela de Level Up caso suba de nível */
  addXp(amount) {
    if (!amount || amount <= 0) return 0;
    const leveled = this.gainXp(amount);
    if (leveled > 0 && typeof G === 'object' && G.Game) {
      if (typeof G.Game.triggerLevelUp === 'function') {
        G.Game.triggerLevelUp(leveled);
      } else if (typeof G.Game.debugLevelUp === 'function') {
        G.Game.debugLevelUp();
      }
    }
    return leveled;
  }

  // ---------------- objeto equipado ----------------
  hasItem(id) { return this.item === id; }

  /** Se pone un objeto (y se quita el que llevara). */
  equip(id) {
    if (this.item) G.Items.BY[this.item].off(this);
    this.item = id;
    if (id) G.Items.BY[id].on(this);
  }

  /** Cascabel Concha: un poco de vida por el daño que haces (tope 4/s). */
  onDealt(dmg) {
    if (this.item === 'shellbell') this.bellHeal = Math.min(4, this.bellHeal + dmg * 0.04);
  }

  /** Poder de un altar (ver systems/interact.js): se aplica y se quita solo. */
  addPower(def, dur) {
    if (this.power) this.power.def.off(this);
    def.on(this);
    this.power = { def, t: dur, dur };
  }

  addBuff(stat, amount, dur, maxStacks) {
    const b = this.buffs[stat];
    if (!b) return;
    b.amount = amount;
    b.n = Math.min(maxStacks, b.n + 1);
    b.t = dur;
  }

  // ---------------- Modo Mega / Super Overdrive ----------------
  addMegaEnergy(amount) {
    if (this.dead) return;
    if (typeof G === 'object' && G.Mega) {
      G.Mega.addEnergy(amount);
      this.megaEnergy = G.Mega.gauge;
      this.megaMaxEnergy = G.Mega.maxGauge;
      return;
    }
    const prev = this.megaEnergy;
    this.megaEnergy = Math.min(this.megaMaxEnergy, this.megaEnergy + amount);
    if (prev < this.megaMaxEnergy && this.megaEnergy >= this.megaMaxEnergy) {
      if (typeof G === 'object') {
        if (G.Audio) G.Audio.sfx('shiny');
        if (G.Spawner) G.Spawner.say('⚡ MEGA PRONTO! Pressione [ESPAÇO] para ativar!', 3.2, true);
        if (G.FX) G.FX.dmgText(this.x, this.y - this.bodyH - 22, '⚡ MEGA PRONTO! [ESPAÇO] ⚡', '#ffd700', true);
      }
    }
  }

  activateMega(dur = 10) {
    if (typeof G === 'object' && G.Mega) {
      const res = G.Mega.trigger();
      this.megaEnergy = G.Mega.gauge;
      this.megaMode.active = G.Mega.isActive;
      this.megaMode.timer = G.Mega.timeLeft;
      this.megaMode.maxTimer = G.Mega.duration;
      return res;
    }
    const current = this.megaEnergy || 0;
    if (current < (this.megaMaxEnergy - 0.8) || this.megaMode.active) return false;
    this.megaEnergy = 0; // Consome a carga acumulada
    this.megaMode.active = true;
    this.megaMode.timer = dur;
    this.megaMode.maxTimer = dur;
    this.megaMode.ghosts = [];
    this.megaMode.particles = [];
    this.megaMode.ghostTimer = 0;
    this.megaMode.starTimer = 0;
    this.megaMode.touchDmgTimer = 0;

    // Cura parcial e invulnerabilidade de início
    this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.3);
    this.invuln = Math.max(this.invuln, 1.0);

    // Zera recarga de todos os golpes aprendidos imediatamente
    if (Array.isArray(this.slots)) {
      this.slots.forEach(slot => {
        if (Array.isArray(slot)) slot.forEach(m => { m.t = 0; });
      });
    }

    if (typeof G === 'object') {
      if (G.Audio) {
        G.Audio.sfx('shiny');
        G.Audio.sfx('legend');
      }
      if (G.Camera) G.Camera.kick(0.65);
      if (G.Game && G.Game.flash) G.Game.flash('#ffd700', 0.55);
    }
  }

  deactivateMega() {
    if (!this.megaMode.active) return;
    this.megaMode.active = false;
    this.megaMode.timer = 0;
    this.megaMode.ghosts = [];
    if (typeof G === 'object' && G.Audio) G.Audio.sfx('select');
  }

  updateMega(dt) {
    if (typeof G === 'object' && G.Mega) {
      G.Mega.update(dt);
      this.megaEnergy = G.Mega.gauge;
      this.megaMode.active = G.Mega.isActive;
      this.megaMode.timer = G.Mega.timeLeft;
      this.megaMode.maxTimer = G.Mega.duration;
      if (!G.Mega.isActive) {
        if (this.megaMode.active) this.deactivateMega();
        return;
      }
    } else {
      if (!this.megaMode.active) return;
      this.megaMode.timer -= dt;
      if (this.megaMode.timer <= 0) {
        this.deactivateMega();
        return;
      }
    }

    // Mantém invulnerável estilo Super Star do Mario
    this.invuln = Math.max(this.invuln, 0.4);

    const RAINBOW = ['#ffd700', '#ff3366', '#00e5ff', '#76ff03', '#ffffff', '#e040fb', '#ff9100'];
    const elem = this.megaAuraElement || (typeof G === 'object' && G.Mega && G.Mega.currentElement) || 'normal';
    const pals = (typeof G === 'object' && G.ELEMENT_PALETTES) || (typeof ELEMENT_PALETTES !== 'undefined' ? ELEMENT_PALETTES : null);
    const pal = (pals && pals[elem]) ? pals[elem] : { color: '#ffd700', accent: '#f59e0b', aura: '#facc15', particle: '#ffffff' };
    const curColor = (Math.floor(performance.now() / 70) % 2 === 0) ? pal.color : pal.accent;

    // 1. Gera Afterimages (rastros fantasma com a cor do elemento do líder)
    this.megaMode.ghostTimer -= dt;
    if (this.megaMode.ghostTimer <= 0) {
      this.megaMode.ghostTimer = 0.045;
      this.megaMode.ghosts.push({
        x: this.x,
        y: this.y,
        dir: this.anim.dir,
        animName: this.anim.currentAnim,
        frame: this.anim.frame,
        color: curColor,
        alpha: 0.65,
        life: 0.26
      });
      if (this.megaMode.ghosts.length > 8) this.megaMode.ghosts.shift();
    }

    // Atualiza fade dos fantasmas
    for (let i = this.megaMode.ghosts.length - 1; i >= 0; i--) {
      const g = this.megaMode.ghosts[i];
      g.life -= dt;
      g.alpha = Math.max(0, g.life / 0.26) * 0.65;
      if (g.life <= 0) this.megaMode.ghosts.splice(i, 1);
    }

    // 2. Partículas Contínuas de Estrelas e Faíscas Pixel Art com a cor do elemento
    this.megaMode.starTimer -= dt;
    if (this.megaMode.starTimer <= 0) {
      this.megaMode.starTimer = 0.045;
      for (let k = 0; k < 3; k++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = G.U.rand(6, this.r * 1.5);
        const pColor = Math.random() < 0.45 ? pal.color : (Math.random() < 0.5 ? pal.accent : pal.particle);
        this.megaMode.particles.push({
          x: this.x + Math.cos(ang) * dist,
          y: this.y - this.bodyH * 0.5 + Math.sin(ang) * (dist * 0.7),
          vx: G.U.rand(-40, 40) + (this.svx || 0) * -0.2,
          vy: G.U.rand(-130, -50),
          life: G.U.rand(0.25, 0.45),
          maxLife: 0.45,
          color: pColor,
          size: Math.random() < 0.5 ? 4 : 2,
          isCross: Math.random() < 0.65
        });
      }
    }

    // Atualiza partículas do mega
    for (let i = this.megaMode.particles.length - 1; i >= 0; i--) {
      const pt = this.megaMode.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.megaMode.particles.splice(i, 1);
    }

    // 3. Barreira de Proteção Elemental: Afasta monstros próximos com knockback
    this.megaMode.touchDmgTimer -= dt;
    if (this.megaMode.touchDmgTimer <= 0 && typeof G === 'object' && G.EnemyMgr) {
      this.megaMode.touchDmgTimer = 0.20;
      const touchRadius = this.r + 22;
      const enemies = G.EnemyMgr.near ? G.EnemyMgr.near(this.x, this.y, touchRadius + 40) : G.EnemyMgr.all();
      for (const e of enemies) {
        if (!e.dead && G.U.dist2(this.x, this.y, e.x, e.y) <= touchRadius * touchRadius) {
          const kx = (e.x - this.x) || (Math.random() - 0.5);
          const ky = (e.y - this.y) || (Math.random() - 0.5);
          if (typeof e.hurt === 'function') e.hurt(this.atk * 0.35, curColor, kx, ky, 220, 'super');
          if (G.FX) {
            G.FX.spark(e.x, e.y - 10, curColor, kx, ky, 4);
          }
        }
      }
    }
  }

  // ---------------- ciclo ----------------
  update(dt) {
    this.anim.update(dt);
    if (this.dead) return;

    this.updateMega(dt);

    // Interpolação suave do crescimento visual do Pokémon no Mega (aumento de tamanho colossal e heróico)
    const isMegaActive = (this.megaMode && this.megaMode.active) || (typeof G === 'object' && G.Mega && G.Mega.isActive) || (this.megaDmgMul && this.megaDmgMul > 1);
    const targetScale = isMegaActive ? 1.85 : 1.0; // Pokémon cresce e fica gigante na tela
    this.megaVisualScale = (this.megaVisualScale || 1.0) + (targetScale - (this.megaVisualScale || 1.0)) * Math.min(1, dt * 8);

    if (this.anim) {
      this.anim.scale = this.megaVisualScale;
    }
    const baseR = this.baseR || G.Sprites.bodyRadius(this.dex);
    const baseBodyH = this.baseBodyH || G.Sprites.bodyHeight(this.dex);
    this.r = baseR * this.megaVisualScale;
    this.bodyH = baseBodyH * this.megaVisualScale;

    // Ativação do Mega Mode pelo teclado (Barra de Espaço) quando atingir 100% de carga
    if (typeof G === 'object' && G.Input && (G.Input.tap('space') || G.Input.tap('Space') || G.Input.tap(' '))) {
      const isReady = (this.megaEnergy >= (this.megaMaxEnergy - 0.8)) || (typeof G === 'object' && G.Mega && G.Mega.gauge >= (G.Mega.maxGauge - 0.8));
      if (isReady && !this.megaMode.active && !(typeof G === 'object' && G.Mega && G.Mega.isActive)) {
        this.activateMega(10);
      }
    }

    // Animação de evolução: partículas, textos e revelação no clímax
    if (this.evolutionAnim) {
      this.evolutionAnim.timer -= dt;
      const evo = this.evolutionAnim;
      const elapsed = evo.duration - evo.timer;

      // Revelação em 0.85s: explosão radial de partículas e segundo anúncio
      if (elapsed >= 0.85 && !evo.revealed) {
        evo.revealed = true;
        if (typeof G === 'object' && G.FX) {
          const cy = this.y - this.bodyH * 0.5;
          G.FX.burst(this.x, cy, '#ffffff', 55, 260);
          G.FX.burst(this.x, cy, '#ffd23f', 40, 220);
          G.FX.burst(this.x, cy, '#7fe0ff', 30, 180);
          G.FX.ring(this.x, this.y, 6, 130, '#ffffff', 0.5, 6);
          G.FX.ring(this.x, this.y, 10, 190, '#ffd23f', 0.7, 8);
          for (let k = 0; k < 12; k++) {
            const ang = (k / 12) * Math.PI * 2;
            const dist = 16 + Math.random() * 28;
            G.FX.twinkle(this.x + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
          }
          G.FX.dmgText(this.x, this.y - this.bodyH - 18, evo.nextName + ' evoluiu!', '#ffd23f', true);
        }
        if (typeof G === 'object' && G.Spawner) {
          G.Spawner.say(evo.nextName + ' evoluiu!', 2.5, true);
        }
      }

      if (evo.timer <= 0) {
        this.evolutionAnim = null;
      }
    }

    if (this.invuln > 0) this.invuln -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.attackFace > 0) this.attackFace -= dt;

    for (const k in this.buffs) {
      const b = this.buffs[k];
      if (b.n > 0) { b.t -= dt; if (b.t <= 0) b.n = 0; }
    }
    if (this.slowT > 0) this.slowT -= dt;
    if (this.bellHeal > 0) { const h = Math.min(this.bellHeal, 4 * dt); this.hp = Math.min(this.maxHp, this.hp + h); this.bellHeal -= h; }
    if (this.power && (this.power.t -= dt) <= 0) { this.power.def.off(this); this.power = null; }
    if (this.regen > 0) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);

    // --- movimiento con colisiones ---
    // (En cooperativo la pausa no para el juego: sólo te quedas quieto.)
    const [ax, ay] = this.frozen ? [0, 0] : G.Input.axis();
    this.walking = ax !== 0 || ay !== 0;
    const s = this.spd;
    // Hielo: resbalas (la velocidad cambia despacio).
    const slide = this.inLiquid && G.World.liquidEffect(this.mon.types).slide;
    this.svx = slide ? G.U.damp(this.svx || 0, ax * s * 1.15, 1.6, dt) : ax * s;
    this.svy = slide ? G.U.damp(this.svy || 0, ay * s * 1.15, 1.6, dt) : ay * s;
    this.x += this.svx * dt;
    this.y += this.svy * dt;
    G.World.collide(this);
    if (this.walking) this.moveAngle = Math.atan2(ay, ax);

    // --- terreno líquido ---
    this.inLiquid = G.World.isLiquid(this.x, this.y);
    if (this.inLiquid) {
      const le = G.World.liquidEffect(this.mon.types);
      if (le.dmg) {
        this.lavaTick -= dt;
        if (this.lavaTick <= 0) {
          this.lavaTick = le.every;
          this.hurt(Math.max(le.flat, this.maxHp * le.dmg * 0.5));
          G.FX.burst(this.x, this.y - 4, le.color, 5, 70);
        }
      } else if (this.walking && Math.random() < dt * 8) {
        G.FX.burst(this.x, this.y, le.slide ? '#ffffff' : '#b3defa', 2, 40);
      }
    }

    // --- apuntado: enemigo más cercano; si no hay, hacia donde caminas ---
    // Prioridad de blanco según el ataque activo:
    //   a distancia (proyectil, rayo): el jefe si está a tiro > lo que te toca > el más cercano
    //   cuerpo a cuerpo y el resto:   lo que te toca > el jefe > el más cercano
    // Con una horda encima casi siempre te toca algo; si eso ganara siempre,
    // los ataques a distancia no le darían nunca al jefe.
    // Sin enemigos, apunta a la roca o cofre más cercano.
    const all = G.EnemyMgr.all();
    const m = this.activeMove();
    const ranged = !!m && (m.kind === 'projectile' || m.kind === 'beam');
    const threat = G.Projectiles.nearest(all, this.x, this.y, this.r + 24);
    const boss = all.find(e => e.boss && !e.dead && G.U.dist(this.x, this.y, e.x, e.y) < 330);
    const tg = (ranged ? boss || threat : threat || boss)
            || G.Projectiles.nearest(all, this.x, this.y, 520)
            || G.World.nearestBreakable(this.x, this.y, 200);
    this.target = tg;
    if (tg) this.aim = Math.atan2(tg.y - this.y, tg.x - this.x);
    else if (this.walking) this.aim = this.moveAngle;

    // --- animación: mira al objetivo al atacar, si no a donde camina ---
    const face = this.attackFace > 0 || !this.walking ? this.aim : this.moveAngle;
    this.anim.dir = G.Sprites.dirFromAngle(face);
    this.anim.loop(this.walking ? 'Walk' : 'Idle', this.walking ? s / 110 : 1);
  }

  /** Vuelve a levantarse (lo revive un compañero en cooperativo). */
  revive(frac = 0.5) {
    this.dead = false;
    this.hp = Math.max(1, this.maxHp * frac);
    this.invuln = 2;
    this.reviveT = 0;
    this.anim._start('Idle', false);
    G.FX.ring(this.x, this.y, 6, 70, '#5fe08a', 0.5, 4);
    G.FX.burst(this.x, this.y - this.bodyH * 0.5, '#9dffb8', 18, 150);
    G.Audio.sfx('heal');
  }

  // ---------------- compañero (cooperativo) ----------------

  /**
   * Un compañero en otro ordenador: su dueño manda su estado (posición, vida,
   * movimiento activo...) y aquí se sigue con suavidad.
   * n = { x, y, ang, walk, hp, maxHp, dead, mv, ml, mag, aim, rev }
   */
  netUpdate(dt) {
    this.anim.update(dt);
    const n = this.net;
    if (!n) return;
    if (this.flash > 0) this.flash -= dt;
    if (this.attackFace > 0) this.attackFace -= dt;
    if (G.U.dist2(this.x, this.y, n.x, n.y) > 300 * 300) { this.x = n.x; this.y = n.y; }
    else { this.x = G.U.damp(this.x, n.x, 14, dt); this.y = G.U.damp(this.y, n.y, 14, dt); }
    if (n.hp < this.hp - 0.5 && !n.dead) this.flash = 0.14;
    this.hp = n.hp; this.maxHp = n.maxHp;
    this.magnet = n.mag || this.magnet;
    this.reviveT = n.rev || 0;
    if (n.dead && !this.dead) { this.dead = true; this.anim.play('Faint', { hold: true }); G.Projectiles.clearOrbs(this); }
    else if (!n.dead && this.dead) this.revive(n.hp / (n.maxHp || 1));
    // Movimiento activo (para el halo, el HUD y los orbes).
    if (n.mv && (!this.moves[0] || this.moves[0].id !== n.mv || this.moves[0].lvl !== n.ml) && G.Moves.BY_ID[n.mv]) {
      this.moves = [G.Moves.instance(n.mv, n.ml || 1)];
      this.slots = [this.moves.slice()];
      this.active = 0;
      G.Projectiles.clearOrbs(this);
    }
    if (this.dead) return;
    this.walking = !!n.walk;
    this.moveAngle = n.ang;
    this.aim = n.aim;
    const face = this.attackFace > 0 || !this.walking ? this.aim : this.moveAngle;
    this.anim.dir = G.Sprites.dirFromAngle(face);
    this.anim.loop(this.walking ? 'Walk' : 'Idle', this.walking ? this.baseSpd / 110 : 1);
  }

  draw(ctx) {
    // Renderiza calamidades e partículas do Mega Overdrive no mundo
    if (typeof G === 'object' && G.UltimateVFX && typeof G.UltimateVFX.draw === 'function') {
      G.UltimateVFX.draw(ctx, G.Camera);
    }

    // Efeito pulsante de silhueta e animação clássica de evolução no Canvas
    if (this.evolutionAnim && this.evolutionAnim.timer > 0) {
      const evo = this.evolutionAnim;
      const elapsed = evo.duration - evo.timer;
      const progress = Math.min(1, elapsed / evo.duration);

      // Alternância de espécies: antes de 0.6s = prevDex; entre 0.6s e 0.85s = pisca alternando; >= 0.85s = nextDex
      let drawDex = evo.nextDex;
      if (elapsed < 0.6) {
        drawDex = evo.prevDex;
      } else if (elapsed < 0.85) {
        drawDex = (Math.floor(elapsed * 24) % 2 === 0) ? evo.prevDex : evo.nextDex;
      }

      // Frequência do pulso branco que acelera simulando a silhueta clássica
      const pulseFreq = 10 + progress * 26;
      const showWhite = elapsed < 0.85 ? (Math.sin(elapsed * pulseFreq) > -0.15) : false;

      // Sombra sob os pés
      if (typeof G === 'object' && G.Sprites && G.Sprites.drawShadow) {
        G.Sprites.drawShadow(ctx, drawDex, this.x, this.y);
      }

      // Desenho dinâmico do sprite com animação viva
      this.anim.draw(ctx, this.x, this.y, {
        flash: showWhite,
        softFlash: !showWhite,
        alpha: 1,
        color: '#ffffff'
      });

      // Brilho / aura pulsante externa quando está na silhueta branca
      if (showWhite) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 + Math.sin(elapsed * pulseFreq) * 0.35;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.r * 1.8, this.r * 0.75, 0, 0, 6.2832);
        ctx.stroke();
        ctx.restore();
      }

      // Renderiza texto clássico de evolução temporário na tela
      ctx.save();
      ctx.font = '700 13px Pixelify,"Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      const textY = this.y - this.bodyH - 22;
      const str = elapsed < 0.85 ? `O que? ${evo.prevName} está evoluindo!` : `${evo.nextName} evoluiu!`;
      ctx.strokeText(str, this.x, textY);
      ctx.fillStyle = elapsed < 0.85 ? '#ffffff' : '#ffd23f';
      ctx.fillText(str, this.x, textY);
      ctx.restore();

      return;
    }

    // Halo del tipo del movimiento activo, en el suelo.
    const m = this.activeMove();
    if (m && !this.dead) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = G.U.TYPE_COLOR[m.type];
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r * 1.5, this.r * 0.6, 0, 0, 6.2832); ctx.stroke();
      ctx.restore();
    }
    G.Sprites.drawShadow(ctx, this.dex, this.x, this.y, this.megaVisualScale || 1);

    // Aura persistente de Ascensão Mega / Forma Ápice (Nível 21+)
    if (this.isMegaAscended && !this.dead && !(this.megaMode && this.megaMode.active)) {
      const now = performance.now();
      ctx.save();
      if (this.megaAuraType === 'gold') {
        const glow = 0.5 + Math.sin(now / 150) * 0.3;
        ctx.strokeStyle = `rgba(255, 215, 0, ${glow.toFixed(2)})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.r * 1.8 + Math.sin(now / 120) * 2, this.r * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
        const count = 4;
        const ang = now / 240;
        for (let i = 0; i < count; i++) {
          const a = ang + (i / count) * Math.PI * 2;
          const sx = Math.cos(a) * (this.r * 1.6);
          const sy = Math.sin(a) * (this.r * 0.7);
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(Math.round(this.x + sx - 1.5), Math.round(this.y + sy - 1.5), 3, 3);
        }
      } else {
        const RAINBOW_COLS = ['#ffd700', '#ff3366', '#00e5ff', '#76ff03', '#e040fb', '#ff9100'];
        const curCol = RAINBOW_COLS[Math.floor(now / 90) % RAINBOW_COLS.length];
        ctx.strokeStyle = curCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.r * 1.8 + Math.sin(now / 120) * 2, this.r * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Efeito Mega Supremo: Aura e Rastros Fantasma Temáticos do Elemento
    const isMega = this.megaMode && this.megaMode.active && !this.dead;
    const elem = this.megaAuraElement || (typeof G === 'object' && G.Mega && G.Mega.currentElement) || 'normal';
    const pals = (typeof G === 'object' && G.ELEMENT_PALETTES) || (typeof ELEMENT_PALETTES !== 'undefined' ? ELEMENT_PALETTES : null);
    const pal = (pals && pals[elem]) ? pals[elem] : { color: '#ffd700', accent: '#f59e0b', aura: '#facc15', particle: '#ffffff' };
    const curColor = (Math.floor(performance.now() / 70) % 2 === 0) ? pal.color : pal.accent;

    if (isMega) {
      // 1. Ghost Trails / Afterimages coloridos translúcidos do elemento
      if (this.megaMode.ghosts && this.megaMode.ghosts.length) {
        for (const g of this.megaMode.ghosts) {
          if (g.alpha <= 0.02) continue;
          ctx.save();
          this.anim.draw(ctx, g.x, g.y, {
            flash: true,
            softFlash: true,
            alpha: g.alpha,
            color: g.color || pal.color
          });
          ctx.restore();
        }
      }

      // 2. Aura luminosa do elemento no chão com anel pulsante e faíscas giratórias
      const now = performance.now();
      ctx.save();
      ctx.strokeStyle = pal.aura || curColor;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r * 2.2 + Math.sin(now / 60) * 3, (this.r * 2.2) * 0.44, 0, 0, Math.PI * 2);
      ctx.stroke();

      const spikes = 8;
      const baseAng = (now / 160);
      for (let s = 0; s < spikes; s++) {
        const a = baseAng + (s / spikes) * Math.PI * 2;
        const rx = Math.cos(a) * (this.r * 2.3);
        const ry = Math.sin(a) * (this.r * 1.0);
        ctx.fillStyle = pal.accent || curColor;
        ctx.fillRect(Math.round(this.x + rx - 2), Math.round(this.y + ry - 2), 4, 4);
      }
      ctx.restore();
    }

    // Poder de altar: aro de su color latiendo bajo los pies.
    if (this.power && !this.dead) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 120) * 0.15;
      ctx.strokeStyle = this.power.def.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r * 2.1, this.r * 0.85, 0, 0, 6.2832); ctx.stroke();
      ctx.restore();
    }

    const alpha = this.invuln > 0 && !this.dead ? (Math.floor(this.invuln * 18) % 2 ? 0.45 : 1) : 1;

    // Efeito visual sutil de Aura e Partículas Estelares para Pokémon Shiny / Shiny Lendário
    if ((this.shiny || this.isShiny) && !this.dead && !isMega) {
      ctx.save();
      const tNow = performance.now();
      const isApex = this.rarityMultipliers && this.rarityMultipliers.isShinyLegend;
      
      // Aro de luz estelar cintilante sob os pés
      ctx.globalAlpha = 0.35 + Math.sin(tNow / 160) * 0.15;
      ctx.strokeStyle = isApex ? '#ffd700' : '#9ae6ff';
      ctx.lineWidth = isApex ? 2.5 : 1.8;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r * 1.6, this.r * 0.65, 0, 0, 6.2832);
      ctx.stroke();

      if (isApex) {
        // Segundo anel concêntrico azul-celeste para Shiny Lendário
        ctx.strokeStyle = '#9ae6ff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.r * 2.0, this.r * 0.82, 0, 0, 6.2832);
        ctx.stroke();
      }

      // 2 a 3 faíscas estelares cintilando sutilmente ao redor do corpo
      for (let s = 0; s < (isApex ? 3 : 2); s++) {
        const ang = (tNow * 0.002 + s * (Math.PI * 2 / (isApex ? 3 : 2))) % (Math.PI * 2);
        const dist = this.r * (1.1 + Math.sin(tNow * 0.003 + s) * 0.3);
        const sx = Math.round(this.x + Math.cos(ang) * dist);
        const sy = Math.round(this.y - this.bodyH * 0.45 + Math.sin(ang) * (dist * 0.5));
        ctx.fillStyle = isApex ? (s % 2 === 0 ? '#ffd700' : '#ffffff') : '#9ae6ff';
        ctx.fillRect(sx - 1, sy - 1, 3, 3);
        ctx.fillRect(sx, sy - 2, 1, 1);
        ctx.fillRect(sx, sy + 2, 1, 1);
        ctx.fillRect(sx - 2, sy, 1, 1);
        ctx.fillRect(sx + 2, sy, 1, 1);
      }
      ctx.restore();
    }

    // Sprite do Pokémon com Brilho do Tipo Elemental quando em Mega Supremo
    if (isMega) {
      this.anim.draw(ctx, this.x, this.y, { flash: true, softFlash: true, alpha: 1, color: pal.color });
    } else {
      this.anim.draw(ctx, this.x, this.y, { flash: this.flash > 0, softFlash: true, alpha, color: '#ffcb3d' });
    }

    // 3. Partículas de Brilho Pixel Art e Ícone de Fúria Bravo 💢
    if (isMega) {
      // Partículas contínuas (estrelas em cruz e faíscas quadradas de 2x2 e 4x4)
      for (const pt of this.megaMode.particles) {
        ctx.save();
        ctx.fillStyle = pt.color;
        if (pt.isCross) {
          // Estrela pixel art 4 pontas
          ctx.fillRect(Math.round(pt.x - 1), Math.round(pt.y - 1), 3, 3);
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y - 3), 1, 1);
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y + 3), 1, 1);
          ctx.fillRect(Math.round(pt.x - 3), Math.round(pt.y), 1, 1);
          ctx.fillRect(Math.round(pt.x + 3), Math.round(pt.y), 1, 1);
        } else {
          ctx.fillRect(Math.round(pt.x - pt.size / 2), Math.round(pt.y - pt.size / 2), pt.size, pt.size);
        }
        ctx.restore();
      }

      // Ícone clássico de fúria / raiva 💢 animado sobre a cabeça
      ctx.save();
      const angerPulse = 1 + Math.sin(performance.now() / 90) * 0.22;
      const angerX = Math.round(this.x + 13);
      const angerY = Math.round(this.y - this.bodyH - 14 + Math.sin(performance.now() / 110) * 2);
      ctx.translate(angerX, angerY);
      ctx.scale(angerPulse, angerPulse);
      ctx.fillStyle = '#dc2626';
      const pts = [
        [-2, -3], [-1, -3], [1, -3], [2, -3],
        [-3, -2], [-2, -2], [2, -2], [3, -2],
        [-3, -1], [3, -1],
        [-3, 1], [3, 1],
        [-3, 2], [-2, 2], [2, 2], [3, 2],
        [-2, 3], [-1, 3], [1, 3], [2, 3],
        [-1, -1], [0, -1], [1, -1],
        [-1, 0], [0, 0], [1, 0],
        [-1, 1], [0, 1], [1, 1]
      ];
      for (const [px, py] of pts) {
        ctx.fillRect(px, py, 1, 1);
      }
      ctx.fillStyle = '#fef08a'; // Brilho interno amarelo
      ctx.fillRect(-1, -1, 1, 1);
      ctx.fillRect(1, 1, 1, 1);
      ctx.restore();

      // Timer numérico flutuante de contagem regressiva sobre o Pokémon
      ctx.save();
      ctx.font = '800 11px Pixelify,"Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      const timerStr = `⚡ ${this.megaMode.timer.toFixed(1)}s`;
      const timeY = Math.round(this.y - this.bodyH - 24);
      ctx.strokeText(timerStr, this.x, timeY);
      ctx.fillStyle = curColor;
      ctx.fillText(timerStr, this.x, timeY);
      ctx.restore();
    }

    // Arcos de buff alrededor de los pies.
    const COL = { atk: '#ff6b4d', spd: '#7fe0ff', def: '#b0b8c8', regen: '#5fe08a' };
    let i = 0;
    for (const k in this.buffs) {
      const b = this.buffs[k];
      if (b.n <= 0) continue;
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = COL[k];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r * 1.8 + i * 5, (this.r * 1.8 + i * 5) * 0.42, 0, 0, 6.2832 * (b.n / 5));
      ctx.stroke();
      ctx.restore();
      i++;
    }

    // Cooperativo: anillo de "reviviendo" y nombre encima.
    if (this.dead && this.reviveT > 0) {
      ctx.save();
      ctx.strokeStyle = '#5fe08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r * 2.4, this.r * 1.0, 0, -Math.PI / 2, -Math.PI / 2 + 6.2832 * Math.min(1, this.reviveT / G.Player.REVIVE_TIME));
      ctx.stroke();
      ctx.restore();
    }
    if (this.tag) {
      ctx.save();
      ctx.font = '700 7px Pixelify,"Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      const y = this.y - this.bodyH - 8;
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,.75)';
      ctx.strokeText(this.tag, this.x, y);
      ctx.fillStyle = this.dead ? '#ff8a96' : this.tagColor || '#fff';
      ctx.fillText(this.tag, this.x, y);
      if (this.dead) {
        ctx.font = '700 6px Pixelify,"Segoe UI",sans-serif';
        ctx.strokeText(this.revLabel || '', this.x, y - 8);
        ctx.fillText(this.revLabel || '', this.x, y - 8);
      }
      ctx.restore();
    }
  }

  // ---------------- evolução de espécie ----------------
  evolveTo(targetSpeciesId) {
    if (!targetSpeciesId) return null;

    // 1. Obter dados da nova espécie a partir da Pokédex global
    let nextMon = null;
    if (typeof targetSpeciesId === 'number') {
      nextMon = (typeof G === 'object' && G.DEX_BY && G.DEX_BY[targetSpeciesId]) ||
                (typeof G === 'object' && Array.isArray(G.DEX) && G.DEX.find(p => p.dex === targetSpeciesId));
    } else if (typeof targetSpeciesId === 'string') {
      const query = targetSpeciesId.toLowerCase().trim();
      if (typeof G === 'object' && Array.isArray(G.DEX)) {
        nextMon = G.DEX.find(p => p.name.toLowerCase() === query);
      }
      if (!nextMon && !isNaN(Number(query)) && typeof G === 'object' && G.DEX_BY) {
        nextMon = G.DEX_BY[Number(query)];
      }
    }

    if (!nextMon) {
      console.warn('[Player.evolveTo] Espécie não encontrada na Pokédex:', targetSpeciesId);
      return null;
    }

    const prevSpecies = this.species || (this.mon && this.mon.name ? this.mon.name.toLowerCase() : '');
    const prevMon = this.mon;

    // 2. Atualizar identificadores da espécie do jogador
    this.mon = nextMon;
    this.dex = nextMon.dex;
    this.pokemonId = nextMon.dex;
    this.species = nextMon.name.toLowerCase();

    // Histórico de evolução na run
    if (!this._isDevolving) {
      this.evolutionHistory = this.evolutionHistory || [];
      if (!this.evolutionHistory.length || this.evolutionHistory[this.evolutionHistory.length - 1] !== this.pokemonId) {
        this.evolutionHistory.push(this.pokemonId);
      }
    }

    // 3. Atualizar lista de tipos elementais do jogador
    this.types = [...(nextMon.types || [])];
    this.mon.types = this.types;

    // 4. Salvar proporção de vida atual
    const hpRatio = (this.maxHp && this.maxHp > 0) ? (this.currentHp / this.maxHp) : 1;

    // 5. Atualizar Base Pokédex Stats da nova espécie (considerando multiplicadores de evolução se houver)
    let mult = null;
    const getEvo = (typeof getEvolutionData === 'function' ? getEvolutionData :
                    (typeof G === 'object' && G.getEvolutionData) ? G.getEvolutionData :
                    (typeof window !== 'undefined' && window.getEvolutionData) ? window.getEvolutionData : null);
    if (getEvo) {
      const evoData = getEvo(prevSpecies);
      if (Array.isArray(evoData)) {
        const match = evoData.find(e => e.next.toLowerCase() === this.species);
        if (match) mult = match.statMultiplier;
      } else if (evoData && evoData.next && evoData.next.toLowerCase() === this.species) {
        mult = evoData.statMultiplier;
      }
    }

    let baseAtk = nextMon.atk;
    let baseSpd = nextMon.spd;
    let baseHp = nextMon.hp;
    if (mult) {
      if (mult.atk) baseAtk = Math.round(baseAtk * mult.atk * 100) / 100;
      if (mult.speed) baseSpd = Math.round(baseSpd * mult.speed);
      if (mult.hp) baseHp = Math.round(baseHp * mult.hp);
    }
    this.basePokedexStats = {
      hp: baseHp,
      atk: baseAtk,
      spd: baseSpd,
      def: nextMon.def || 0
    };

    // 6. SWAP DINÂMICO DE META-UPGRADES:
    // Puxa os upgrades permanentemente salvos para a nova espécie, descartando os da espécie anterior
    const getUpgrades = (typeof G === 'object' && G.DB && typeof G.DB.getSpeciesUpgrades === 'function')
      ? G.DB.getSpeciesUpgrades
      : (typeof getSpeciesUpgrades === 'function' ? getSpeciesUpgrades : null);

    this.permanentMetaStats = getUpgrades ? getUpgrades(nextMon.dex) : {
      species: this.species,
      dex: this.dex,
      level: 0,
      hpBonus: 0,
      atkBonus: 0,
      spdBonus: 0,
      defBonus: 0,
      cdBonus: 0,
      regenBonus: 0,
      perks: {}
    };

    // 7. Recalcular atributos com os novos Meta-Upgrades mantendo todas as cartas in-run
    this.recalculateTotalStats(false);

    // 8. Restaurar HP proporcional com exatidão
    this.currentHp = Math.max(1, Math.round(this.maxHp * hpRatio));
    this.hp = this.currentHp;

    // 9. Recarregar spritesheets/animações no Canvas preservando Shiny
    const isShiny = !!(this.shiny || this.isShiny);
    this.shiny = isShiny && (typeof G === 'object' && G.Sprites ? G.Sprites.hasShiny(nextMon.dex) : isShiny);
    this.isShiny = this.shiny;

    this.anim = new G.Sprites.Animator(nextMon.dex, 1, this.shiny);
    this.anim.scale = this.megaVisualScale || 1.0;
    this.baseR = G.Sprites.bodyRadius(nextMon.dex);
    this.baseBodyH = G.Sprites.bodyHeight(nextMon.dex);
    this.r = this.baseR * (this.megaVisualScale || 1.0);
    this.bodyH = this.baseBodyH * (this.megaVisualScale || 1.0);

    const prevDex = (prevMon && prevMon.dex) || this.dex || nextMon.dex;
    const prevName = (prevMon && prevMon.name) || 'Pokémon';
    const nextName = nextMon.name;

    if (typeof G === 'object' && G.Sprites && G.Sprites.preload) {
      G.Sprites.preload([prevDex, nextMon.dex], 4000, this.shiny);
    }

    // 6. Atualizar estágio de evolução
    this.currentEvolutionStage = (this.currentEvolutionStage || 1) + 1;

    // 7. Pausa momentânea no mundo (padrão 0s para movimentação 100% fluida a 60 FPS)
    const pauseDur = (typeof G === 'object' && G.Game && typeof G.Game.evolutionPauseDuration === 'number')
      ? G.Game.evolutionPauseDuration : 0;
    if (pauseDur > 0 && typeof G === 'object' && G.Game && typeof G.Game.freezeWorld === 'function') {
      G.Game.freezeWorld(pauseDur);
    } else {
      this.frozen = false;
    }
    this.invuln = Math.max(this.invuln || 0, 2.5);

    // 8. Iniciar animação clássica de evolução (silhueta pulsante, textos e revelação)
    this.evolutionAnim = {
      timer: 1.2,
      duration: 1.2,
      prevDex,
      nextDex: nextMon.dex,
      prevName,
      nextName,
      shiny: this.shiny,
      revealed: false
    };

    // 9. Feedback audiovisual e mensagens temporárias na tela
    if (typeof G === 'object') {
      if (G.Audio) {
        G.Audio.sfx('evolve');
      }
      if (G.Spawner) {
        G.Spawner.say('O que? ' + prevName + ' está evoluindo!', 1.5, true);
      }
    }

    // 10. Persistência na Pokédex global da conta / save
    if (typeof G === 'object' && G.DB) {
      if (this.shiny) {
        if (typeof G.DB.grantShiny === 'function') G.DB.grantShiny(nextMon.dex, 'evolution');
      } else {
        if (typeof G.DB.grant === 'function') G.DB.grant(nextMon.dex, 'evolution');
      }
      if (G.DB.save && G.DB.save.stats) {
        G.DB.save.stats.evolutions = (G.DB.save.stats.evolutions || 0) + 1;
      }
      if (typeof G.DB.commit === 'function') {
        G.DB.commit('run');
      }
    }

    return this;
  }

  // ---------------- devolução de espécie (Modo Administrador) ----------------
  devolve() {
    this.evolutionHistory = this.evolutionHistory || [this.pokemonId];
    let previousSpecies = null;

    if (this.evolutionHistory.length > 1) {
      this.evolutionHistory.pop();
      previousSpecies = this.evolutionHistory[this.evolutionHistory.length - 1];
    } else {
      const fn = (typeof getDevolutionData === 'function' ? getDevolutionData :
                  (typeof G === 'object' && G.getDevolutionData) ? G.getDevolutionData :
                  (typeof window !== 'undefined' && window.getDevolutionData) ? window.getDevolutionData : null);
      const prevInfo = fn ? fn(this.species) : null;
      if (prevInfo && prevInfo.prev) {
        previousSpecies = prevInfo.prev;
      }
    }

    if (!previousSpecies) {
      if (typeof G === 'object' && G.UI && G.UI.toast) {
        G.UI.toast((this.mon ? this.mon.name : 'Este Pokémon') + ' já está na sua forma inicial!', 2600);
      }
      return null;
    }

    const prevMonName = this.mon ? this.mon.name : 'Pokémon';
    this._isDevolving = true;
    this.evolveTo(previousSpecies);
    this._isDevolving = false;

    // Ajusta estágio evolutivo e permite que a carta de evolução volte a ser oferecida
    this.currentEvolutionStage = Math.max(1, this.evolutionHistory.length);
    if (this.evolutionOfferedStages) {
      this.evolutionOfferedStages.delete(this.currentEvolutionStage);
    }
    this._lastEvoOfferLevel = 0;

    if (typeof G === 'object' && G.Spawner) {
      G.Spawner.say(prevMonName + ' devoluiu para ' + this.mon.name + '!', 2.5, true);
    }

    return this;
  }

  // ---------------- alternar variante Shiny ----------------
  toggleShiny() {
    this.shiny = !this.shiny;
    this.isShiny = this.shiny;
    this.anim = new G.Sprites.Animator(this.dex, 1, this.shiny);

    if (typeof G === 'object') {
      if (this.shiny && G.Audio) G.Audio.sfx('shiny');
      if (G.FX) {
        const cy = this.y - this.bodyH * 0.5;
        for (let i = 0; i < 10; i++) G.FX.twinkle(this.x + G.U.rand(-25, 25), cy + G.U.rand(-25, 25));
        G.FX.dmgText(this.x, this.y - this.bodyH - 12, this.shiny ? '✨ Shiny Ativado!' : 'Shiny Desativado', '#ffd23f', true);
      }
    }
    return this.shiny;
  }

  // ---------------- Evolução Automática ao Alcançar o Nível e Marcos ----------------
  checkEvolutionMilestones() {
    this._milestonesReached = this._milestonesReached || new Set();

    const getEvo = (typeof getEvolutionData === 'function' ? getEvolutionData :
                    (typeof G === 'object' && G.getEvolutionData) ? G.getEvolutionData :
                    (typeof window !== 'undefined' && window.getEvolutionData) ? window.getEvolutionData : null);

    if (getEvo) {
      let loopGuard = 0;
      while (loopGuard++ < 4) {
        const currentSpecies = this.species || (this.mon && this.mon.name ? this.mon.name.toLowerCase() : '') || String(this.dex);
        const evoRaw = getEvo(currentSpecies);
        if (!evoRaw) break;

        const evoList = Array.isArray(evoRaw) ? evoRaw : [evoRaw];
        const adminEvoMode = (typeof G === 'object' && G.adminTools && G.adminTools.evoMode);

        let targetEvo = null;
        let reqLevel = 5;

        for (const evo of evoList) {
          // No jogo padrão oficial do PokéSurvivor:
          // 1º Salto (Estágio 1 -> 2): Nível 5 (ex: Bulbasaur -> Ivysaur, Pikachu -> Raichu, Gible -> Gabite)
          // 2º Salto (Estágio 2 -> 3): Nível 12 (ex: Ivysaur -> Venusaur, Gabite -> Garchomp)
          // Os níveis vêm de BalanceConfig.player.evolution (fonte única de verdade).
          const evoCfg = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : (typeof G === 'object' ? G.BalanceConfig : null));
          const evoLvl = (evoCfg && evoCfg.player && evoCfg.player.evolution) || {};
          const isSecondEvolution = (this.currentEvolutionStage >= 2) || (this.evolutionHistory && this.evolutionHistory.length >= 2);
          const lvl = adminEvoMode === 'instant' ? 1 :
                      (adminEvoMode === 'official' && evo.level) ? evo.level :
                      (isSecondEvolution ? (evoLvl.stage3Level || 12) : (evoLvl.stage2Level || 5));
          // A evolução é AUTOMÁTICA e dispara exatamente no marco (5, 12 e 21).
          // Não há carta de evolução: os cards de Level Up ficam para ataques e atributos.
          const triggerLvl = adminEvoMode === 'instant' ? 1 : lvl;

          if (this.level >= triggerLvl && !this._milestonesReached.has('evo_' + evo.next.toLowerCase())) {
            targetEvo = evo;
            reqLevel = lvl;
            break;
          }
        }

        if (!targetEvo) break;

        this._milestonesReached.add('evo_' + targetEvo.next.toLowerCase());
        this.triggerMilestoneEvolution(targetEvo.next, reqLevel);
      }
    }

    // Marco Nível 20: Super Combo dos 4 Ataques Ativos juntos
    const evoCfg2 = (typeof BalanceConfig !== 'undefined' ? BalanceConfig : (typeof G === 'object' ? G.BalanceConfig : null));
    const evoLvl2 = (evoCfg2 && evoCfg2.player && evoCfg2.player.evolution) || {};
    const quadLvl = evoLvl2.quadComboLevel || 20;
    const apexLvl = evoLvl2.apexLevel || 21;

    if (this.level >= quadLvl && !this._milestonesReached.has(quadLvl)) {
      this._milestonesReached.add(quadLvl);
      this.triggerQuadComboUnlock();
    }

    // Marco Nível 21: Ascensão Mega / Forma Ápice (+50% de dano)
    if (this.level >= apexLvl && !this._milestonesReached.has(apexLvl)) {
      this._milestonesReached.add(apexLvl);
      this.triggerMegaAscension();
    }
  }

  triggerQuadComboUnlock() {
    this.quadComboActive = true;
    const name = (this.mon && this.mon.name) || this.species;
    console.log(`⚡ [SUPER COMBO NV 20] ${name.toUpperCase()} desbloqueou o Super Combo dos 4 Ataques Simultâneos!`);

    if (typeof G === 'object') {
      if (G.Audio && typeof G.Audio.sfx === 'function') {
        G.Audio.sfx('legend');
        setTimeout(() => { if (G.Audio) G.Audio.sfx('shinyGet'); }, 200);
      }
      if (G.Camera && typeof G.Camera.kick === 'function') {
        G.Camera.kick(1.5);
      }
      if (G.FX) {
        if (typeof G.FX.ring === 'function') {
          G.FX.ring(this.x, this.y, 8, this.r * 5.2, '#ffd700', 0.85, 4);
          G.FX.ring(this.x, this.y, 14, this.r * 3.6, '#38bdf8', 0.65, 3);
        }
        if (typeof G.FX.dmgText === 'function') {
          G.FX.dmgText(this.x, this.y - this.bodyH - 26, '⚡ SUPER COMBO ATIVADO! (4 ATAQUES JUNTOS) ⚡', '#ffd700', true);
        }
      }
      if (G.Spawner && typeof G.Spawner.say === 'function') {
        G.Spawner.say('🌟 NÍVEL 20 ALCANÇADO: TODOS OS 4 ATAQUES AGORA COMBAM JUNTOS!', 4.5, true);
      }
    }
  }

  checkEvolution() {
    return this.checkEvolutionMilestones();
  }

  triggerMilestoneEvolution(nextSpecies, milestoneLevel) {
    const prevName = (this.mon && this.mon.name) || this.species;
    this.evolveTo(nextSpecies);
    const newName = (this.mon && this.mon.name) || this.species;

    if (typeof G === 'object' && G.Game && typeof G.Game.freezeWorld === 'function') {
      G.Game.freezeWorld(0.2);
    }
    if (typeof G === 'object') {
      if (G.Audio && typeof G.Audio.sfx === 'function') G.Audio.sfx('evolve');
      if (G.FX) {
        const cy = this.y - this.bodyH * 0.5;
        G.FX.burst(this.x, cy, '#ffffff', 40, 240);
        G.FX.burst(this.x, cy, '#ffd700', 30, 200);
        G.FX.ring(this.x, this.y, 8, 140, '#ffffff', 0.6, 6);
        G.FX.dmgText(this.x, this.y - this.bodyH - 16, '✨ EVOLUÇÃO! ' + newName.toUpperCase(), '#ffd700', true);
      }
      if (G.Spawner && typeof G.Spawner.say === 'function') {
        G.Spawner.say(`✨ NÍVEL ${this.level}: ${prevName.toUpperCase()} EVOLUIU AUTOMATICAMENTE PARA ${newName.toUpperCase()}! ✨`, 3.0, true);
      }
    }
    console.log(`[EVOLUÇÃO AUTOMÁTICA] Nv. ${this.level}: ${prevName} -> ${newName}`);
  }

  triggerMegaAscension() {
    const MEGA_SPECIES = new Set([
      'venusaur', 'charizard', 'blastoise', 'beedrill', 'pidgeot', 'alakazam', 'slowbro',
      'gengar', 'kangaskhan', 'pinsir', 'gyarados', 'aerodactyl', 'mewtwo', 'ampharos',
      'steelix', 'scizor', 'heracross', 'houndoom', 'tyranitar', 'sceptile', 'blaziken',
      'swampert', 'gardevoir', 'sableye', 'mawile', 'aggron', 'medicham', 'manectric',
      'sharpedo', 'camerupt', 'altaria', 'banette', 'absol', 'glalie', 'salamence',
      'metagross', 'latias', 'latios', 'rayquaza', 'lopunny', 'garchomp', 'lucario',
      'abomasnow', 'gallade', 'audino', 'diancie'
    ]);

    const isMega = MEGA_SPECIES.has(this.species.toLowerCase());
    this.isMegaAscended = true;
    this.megaAuraType = isMega ? 'gold' : 'rainbow';
    this.addAtkBonus(0.50, true);
    const title = isMega ? `Mega ${this.mon.name}` : `Forma Ápice: ${this.mon.name}`;
    this.ascensionTitle = title;

    if (typeof G === 'object') {
      if (G.Game && typeof G.Game.freezeWorld === 'function') G.Game.freezeWorld(0.2);
      if (G.Audio && typeof G.Audio.sfx === 'function') G.Audio.sfx('legend');
      if (G.FX) {
        const cy = this.y - this.bodyH * 0.5;
        const col = isMega ? '#ffd700' : '#e040fb';
        G.FX.burst(this.x, cy, col, 50, 260);
        G.FX.burst(this.x, cy, '#ffffff', 30, 180);
        G.FX.ring(this.x, this.y, 10, 190, col, 0.8, 8);
      }
      if (G.Spawner && typeof G.Spawner.say === 'function') {
        G.Spawner.say(`🌟 MARCO NÍVEL 21: ${title.toUpperCase()}! (+50% DANO)`, 3.5, true);
      }
    }
    console.log(`[ASCENSÃO] Marco Nv. 21 atingido: ${title} (+50% de dano)`);
  }
};

// Hooks globais para validação e testes no console do navegador
if (typeof window !== 'undefined') {
  if (!window.game) {
    try {
      Object.defineProperty(window, 'game', {
        get() { return typeof G === 'object' ? G.Game : undefined; },
        configurable: true
      });
    } catch (e) {
      window.game = typeof G === 'object' ? G.Game : undefined;
    }
  }
  const getPl = () => (window.game && window.game.player) || (typeof G === 'object' && G.Game && G.Game.player);

  window.debugEvolve = id => {
    const p = getPl();
    if (p && typeof p.evolveTo === 'function') return p.evolveTo(id);
    console.warn('[debugEvolve] Nenhum jogador ativo na partida.');
  };
  window.debugDevolve = () => {
    const p = getPl();
    if (p && typeof p.devolve === 'function') return p.devolve();
    console.warn('[debugDevolve] Nenhum jogador ativo na partida.');
  };
  window.debugShiny = () => {
    const p = getPl();
    if (p && typeof p.toggleShiny === 'function') return p.toggleShiny();
  };
  window.debugHeal = () => {
    const p = getPl();
    if (p) { p.hp = p.maxHp; G.Audio && G.Audio.sfx('heal'); }
  };
  window.debugGod = () => {
    const p = getPl();
    if (p) { p.godMode = !p.godMode; return p.godMode; }
  };
  window.debugSetLevel = function(lvl) {
    const p = getPl();
    if (!p) {
      console.warn('[debugSetLevel] Nenhum jogador ativo na partida.');
      return;
    }
    p.level = Math.max(1, parseInt(lvl) || 1);
    p.checkEvolutionMilestones();
    console.log(`⚡ [DEBUG] Nível do jogador definido para ${p.level}`);
    if (typeof G === 'object' && G.HUD && typeof G.HUD.update === 'function') G.HUD.update();
    return p.level;
  };
  window.debugTestHp = function(pct) {
    const p = getPl();
    if (!p) {
      console.warn('[debugTestHp] Nenhum jogador ativo na partida.');
      return;
    }
    let val = parseFloat(pct);
    if (isNaN(val)) val = 0.5;
    if (val > 1) val = val / 100;
    val = Math.max(0.01, Math.min(1.0, val));
    p.hp = Math.round(p.maxHp * val);
    console.log(`🩸 [DEBUG] HP do jogador ajustado para ${(val * 100).toFixed(0)}% (${p.hp} / ${p.maxHp})`);
    if (typeof G === 'object' && G.HUD && typeof G.HUD.update === 'function') G.HUD.update();
    return p.hp;
  };
  window.debugFillMega = function() {
    const p = getPl();
    const mega = (typeof G === 'object' && G.Mega) ? G.Mega : null;
    if (mega) mega.gauge = mega.maxGauge;
    if (p) p.megaEnergy = p.megaMaxEnergy;
    console.log('⚡ [DEBUG] Barra de Mega carregada para 100%! Pressione [ESPAÇO] para ativar.');
    if (typeof G === 'object' && G.HUD && typeof G.HUD.update === 'function') G.HUD.update();
  };
  window.debugTestMetaSwap = function() {
    const pl = window.player || getPl();
    if (!pl) {
      console.warn('[debugTestMetaSwap] Nenhum jogador ativo na partida.');
      return;
    }
    const player = pl;

    console.log("=== ANTES DA EVOLUÇÃO ===");
    console.log("Espécie:", player.pokemonId);
    console.log("Meta Bônus ATK:", player.permanentMetaStats.atkBonus);
    console.log("Dano Total:", player.stats.attack);
    
    console.log("=== EVOLUINDO PARA FORMA SEGUINTE ===");
    player.evolveTo('charmeleon');
    
    console.log("Espécie:", player.pokemonId);
    console.log("Meta Bônus ATK (Deve ser o do Charmeleon):", player.permanentMetaStats.atkBonus);
    console.log("Dano Total Recalculado:", player.stats.attack);
  };
  window.debugCheckStarterStats = function() {
    const g = (typeof G === 'object' && G.Game) ? G.Game : (typeof window !== 'undefined' ? window.game : null);
    const p = (g && g.player) || (typeof window !== 'undefined' ? window.player : null) || (typeof global !== 'undefined' ? global.player : null);
    if (!p) {
      console.warn('[debugCheckStarterStats] Nenhuma partida ativa encontrada.');
      return null;
    }
    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : ((typeof global !== 'undefined' && global.db) ? global.db : null));
    const meta = (dbObj && typeof dbObj.getSpeciesUpgradeBonus === 'function')
      ? (dbObj.getSpeciesUpgradeBonus(p.pokemonId || (p.mon && p.mon.dex)) || {})
      : {};
    const base = p.basePokedexStats || (p.mon ? { hp: p.mon.hp, atk: p.mon.atk, spd: p.mon.spd, def: p.mon.def || 0 } : {});

    const statsTable = {
      "HP": { "Base": base.hp || 0, "Bônus Upgrade": meta.hp || 0, "Total Real": p.maxHp },
      "Ataque": { "Base": base.atk || 0, "Bônus Upgrade": meta.atk || 0, "Total Real": p.attack },
      "Defesa": { "Base": base.def || 0, "Bônus Upgrade": meta.def || 0, "Total Real": p.defense },
      "Velocidade": { "Base": base.spd || base.speed || 0, "Bônus Upgrade": meta.speed || 0, "Total Real": p.speed }
    };
    if (console.table) {
      console.table(statsTable);
    }
    return statsTable;
  };
}

if (typeof global !== 'undefined') {
  global.debugCheckStarterStats = (typeof window !== 'undefined') ? window.debugCheckStarterStats : null;
}
