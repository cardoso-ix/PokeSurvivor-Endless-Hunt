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

    // --- CAMADA 2: Meta-Upgrades da Espécie (db.js / localStorage) ---
    const dbObj = (typeof G === 'object' && G.DB) ? G.DB : ((typeof window !== 'undefined' && window.db) ? window.db : ((typeof global !== 'undefined' && global.db) ? global.db : null));
    const getBonusFn = (dbObj && typeof dbObj.getSpeciesUpgradeBonus === 'function')
      ? dbObj.getSpeciesUpgradeBonus
      : (typeof getSpeciesUpgradeBonus === 'function' ? getSpeciesUpgradeBonus : null);

    const metaBonus = (getBonusFn ? getBonusFn(this.pokemonId || mon.dex) : null) || {};

    const calcAtk = Number(((base.atk || 1) + (metaBonus.atk || 0)).toFixed(2));
    const calcDef = Number(((base.def || 0) + (metaBonus.def || 0)).toFixed(2));
    const calcSpd = Number(((base.speed || 100) + (metaBonus.speed || 0)).toFixed(1));

    // --- SOMA OBRIGATÓRIA DOS ATRIBUTOS REAIS ---
    this.maxHp = Math.round((base.hp || 100) + (metaBonus.hp || 0));
    this.currentHp = this.maxHp;
    this.hp = this.maxHp;

    // Amarração direta aos atributos base de combate e movimento
    this.baseAtk = calcAtk;
    this.baseSpd = calcSpd;
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
      spdMul: 1,
      cdMul: 1,
      dmgReduce: 0,
      regenFlat: 0,
      xpMul: 1
    };

    this.anim = new G.Sprites.Animator(mon.dex, 1, this.shiny);
    this.x = 0; this.y = 0;
    this.r = G.Sprites.bodyRadius(mon.dex);
    this.bodyH = G.Sprites.bodyHeight(mon.dex);

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

    // Fila Indiana Segura (Trail Follow) e Esquadrão dos 3 Pokémon
    this.posHistory = [];
    this.maxHistory = 60;
    this.trainerId = (typeof G === 'object' && G.DB && G.DB.save && G.DB.save.trainer) || 'red';
    this.team = [];

    // Monta a equipe a partir da seleção da Intro ou do save
    this.initSquad = function(starterIds) {
      if (!Array.isArray(starterIds) || starterIds.length === 0) return;
      this.team = starterIds.slice(0, 3).map((id, index) => {
        const dex = (typeof G === 'object' && G.POKEDEX && G.POKEDEX[id])
          || (typeof G === 'object' && G.DEX_BY && G.DEX_BY[id])
          || {};
        const pName = dex.name || (typeof id === 'string' ? id : `Pokémon #${id}`);
        const pType = (dex.types && dex.types[0]) ? dex.types[0].toLowerCase() : 'normal';
        const member = {
          id: id,
          dex: dex.dex || (typeof id === 'number' ? id : 1),
          name: pName,
          type: pType,
          types: dex.types ? [...dex.types] : [pType],
          trailDelay: (index + 1) * 12, // 12, 24 e 36 frames atrás
          x: this.x,
          y: this.y,
          facingLeft: false,
          upgrades: 0,
          stage: 1,
          attackTimer: index * 0.35,
          cooldown: 1.2,
          damage: 15,
          projectiles: 1,
          range: 280,
          anim: (typeof G === 'object' && G.Sprites && typeof G.Sprites.Animator === 'function')
            ? new G.Sprites.Animator(dex.dex || id, 1, false)
            : null
        };
        return member;
      });
    };

    const savedSquad = (typeof G === 'object' && G.DB && G.DB.save && G.DB.save.squad);
    if (savedSquad && Array.isArray(savedSquad)) {
      this.initSquad(savedSquad);
    }

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

  // (×2 y luego ×4 el 2026-10-10: se subía de nivel demasiado rápido.)
  static xpFor(level) {
    return Math.floor((8 + level * 6 + Math.pow(level, 1.75) * 1.6) * 4);
  }

  cy() { return this.y; }

  // ---------------- stats efectivos e camadas de atributos ----------------
  get currentHp() { return this.hp; }
  set currentHp(v) { this.hp = v; }

  get atkMul() {
    return this.inRunModifiers ? this.inRunModifiers.atkMul : (this._atkMul || 1);
  }
  set atkMul(v) {
    if (this.inRunModifiers) {
      this.inRunModifiers.atkMul = v;
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
        hpFlat: 0, atkMul: 1, spdMul: 1, cdMul: 1, dmgReduce: 0, regenFlat: 0, xpMul: 1
      };
    }

    const oldMaxHp = this.maxHp || 1;
    const hpRatio = oldMaxHp > 0 ? (this.hp / oldMaxHp) : 1;

    // HP Máximo: Base + Meta + Cartas da run
    const newMaxHp = Math.round(this.basePokedexStats.hp + (this.permanentMetaStats.hpBonus || 0) + (this.inRunModifiers.hpFlat || 0));
    this.maxHp = Math.max(1, newMaxHp);

    if (preserveHpRatio) {
      this.hp = Math.max(1, Math.min(this.maxHp, Math.round(this.maxHp * hpRatio)));
    }

    // Ataque: Base + Meta (multiplicado pelo inRunModifiers.atkMul via getter)
    const metaAtkBonus = this.permanentMetaStats.atkBonus || 0;
    this.baseAtk = this.basePokedexStats.atk * (1 + metaAtkBonus);

    // Velocidade: Base + Meta (multiplicado pelo inRunModifiers.spdMul via getter)
    const metaSpdBonus = this.permanentMetaStats.spdBonus || 0;
    this.baseSpd = this.basePokedexStats.spd * (1 + metaSpdBonus);

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

  get atk() {
    let megaMul = (this.megaMode && this.megaMode.active) ? 2.5 : 1;
    let weatherAtk = (typeof G === 'object' && G.Weather && G.Weather.getAtkMul) ? G.Weather.getAtkMul(this) : 1;
    const bAtk = (this.buffs && this.buffs.atk) ? this.buffs.atk.n * this.buffs.atk.amount : 0;
    return this.baseAtk * this.atkMul * (1 + bAtk) * megaMul * weatherAtk;
  }
  get spd() {
    let megaMul = (this.megaMode && this.megaMode.active) ? 1.75 : 1;
    let weatherSpd = (typeof G === 'object' && G.Weather && G.Weather.getSpdMul) ? G.Weather.getSpdMul(this) : 1;
    const bSpd = (this.buffs && this.buffs.spd) ? this.buffs.spd.n * this.buffs.spd.amount : 0;
    const s = this.baseSpd * this.spdMul * (1 + bSpd) * (this.slowT > 0 ? 0.5 : 1) * megaMul * weatherSpd;
    const w = (typeof G === 'object' && G.Weather && G.Weather.speedFor) ? G.Weather.speedFor(this.mon ? this.mon.types : this.types) : 1;
    const slow = this.inLiquid ? (typeof G === 'object' && G.World && G.World.liquidEffect ? G.World.liquidEffect(this.mon ? this.mon.types : this.types).slow || 1 : 1) : 1;
    return s * slow * w;
  }
  get reduction() {
    let weatherDef = (typeof G === 'object' && G.Weather && G.Weather.getDefBonus) ? G.Weather.getDefBonus(this) : 0;
    const bDef = (this.buffs && this.buffs.def) ? this.buffs.def.n * this.buffs.def.amount : 0;
    return Math.min(0.85, this.dmgReduce + bDef + weatherDef);
  }
  get regen() {
    let weatherRegen = (typeof G === 'object' && G.Weather && G.Weather.getRegenBonus) ? G.Weather.getRegenBonus(this) : 0;
    const bRegen = (this.buffs && this.buffs.regen) ? this.buffs.regen.n * this.buffs.regen.amount : 0;
    return this.regenFlat + bRegen + weatherRegen;
  }

  get cdMul() {
    let base = this._cdMul != null ? this._cdMul : 1;
    if (typeof G === 'object' && G.Weather && G.Weather.getCdMul) {
      base *= G.Weather.getCdMul(this);
    }
    return base;
  }
  set cdMul(val) {
    if (this.inRunModifiers) {
      const metaCd = (this.permanentMetaStats && this.permanentMetaStats.perks && this.permanentMetaStats.perks.cdMul) || 1;
      this.inRunModifiers.cdMul = metaCd > 0 ? (val / metaCd) : val;
    }
    this._cdMul = val;
  }

  get critChance() {
    return this._critChance != null ? this._critChance : 0;
  }
  set critChance(val) {
    this._critChance = val;
  }

  get magnet() {
    return this._magnet != null ? this._magnet : 78;
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

  /** Movimientos que se lanzan ahora (el grupo del hueco activo). */
  activeGroup() { return this.slots[this.active] || []; }

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
    if (type) {
      const k = G.Types.mult(type, this.mon.types);
      eff = G.Types.label(k);
      amount *= k * G.Weather.mult(type);
    }
    // Con un ataque cuerpo a cuerpo activo se recibe un 25 % menos: hay que
    // estar encima de los enemigos para pegar (iban muy por detrás).
    const close = this.activeGroup().some(m => m.kind === 'melee') ? 0.75 : 1;
    const d = pure ? Math.max(1, amount) : Math.max(1, amount * (1 - this.reduction) * close);
    this.hp -= d;
    this.invuln = 0.45;
    this.flash = 0.14;
    G.Audio.sfx('hurt');
    G.Camera.kick(0.28);
    G.FX.dmgText(this.x, this.y - this.bodyH - 4, '-' + Math.round(d), eff === 'super' ? '#ff3048' : eff === 'weak' ? '#c9a0a8' : '#ff6b7a', eff === 'super');
    G.FX.burst(this.x, this.y - this.bodyH * 0.5, '#ff5f6d', 6, 90);
    // Banda Focus: aguanta el golpe con 1 de vida (una vez cada 60 s).
    if (this.hp <= 0 && this.hasItem('focussash') && performance.now() - this.sashT > 60000) {
      this.sashT = performance.now();
      this.hp = 1; this.invuln = 1.2;
      G.FX.dmgText(this.x, this.y - this.bodyH - 16, '¡Banda Focus!', '#ff9a3d', true);
      G.FX.ring(this.x, this.y, 6, 70, '#ff9a3d', 0.5, 4);
    }
    if (this.hp <= 0) {
      this.hp = 0; this.dead = true;
      this.anim.play('Faint', { hold: true });
      G.Projectiles.clearOrbs(this);
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

  // ---------------- Ataque Autônomo e Upgrades do Esquadrão ----------------
  performSquadMemberAttack(member) {
    if (typeof G !== 'object' || !G.EnemyMgr || !G.Projectiles) return;
    const all = G.EnemyMgr.all ? G.EnemyMgr.all() : [];
    if (!all.length) return;

    let closest = null;
    let closestDistSq = (member.range || 280) * (member.range || 280);

    for (const e of all) {
      if (!e || e.dead) continue;
      const d2 = (e.x - member.x) * (e.x - member.x) + (e.y - member.y) * (e.y - member.y);
      if (d2 < closestDistSq) {
        closestDistSq = d2;
        closest = e;
      }
    }
    if (!closest) return;

    const angle = Math.atan2(closest.y - member.y, closest.x - member.x);
    const speed = 330;
    const dmg = Math.round((member.damage || 15) * (this.atkMul || 1));

    const typeColors = {
      fire: '#f97316', water: '#38bdf8', grass: '#22c55e', electric: '#eab308',
      poison: '#a855f7', psychic: '#ec4899', ice: '#06b6d4', ground: '#ca8a04',
      rock: '#a16207', steel: '#94a3b8', normal: '#e2e8f0'
    };
    const pColor = typeColors[member.type] || '#facc15';

    if (typeof G.Projectiles.spawn === 'function') {
      G.Projectiles.spawn({
        x: member.x,
        y: member.y - 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 6,
        dmg: dmg,
        color: pColor,
        life: 0.9,
        source: 'squad',
        pierce: (member.stage || 1) > 1 ? 2 : 1,
        hitKnock: 8
      });
    }
  }

  upgradeSquadMember(slotIndex) {
    if (!this.team || !this.team[slotIndex]) return;
    const mem = this.team[slotIndex];
    mem.upgrades = (mem.upgrades || 0) + 1;
    mem.damage = Math.round((mem.damage || 15) * 1.25);
    mem.cooldown = Math.max(0.55, (mem.cooldown || 1.2) * 0.90);
    mem.range = (mem.range || 280) + 20;
    if (mem.upgrades === 2 || mem.upgrades === 4) {
      mem.projectiles = Math.min(4, (mem.projectiles || 1) + 1);
    }
    if (typeof G === 'object' && G.UI && typeof G.UI.toast === 'function') {
      G.UI.toast(`[${mem.name}] Melhorado para Nível ${mem.upgrades + 1}! (+25% Dano)`, 2000);
    }
    if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('powerup');
  }

  evolveSquadMember(slotIndex, nextDexOrName) {
    if (!this.team || !this.team[slotIndex]) return;
    const mem = this.team[slotIndex];
    const dexData = (typeof G === 'object' && G.POKEDEX && G.POKEDEX[nextDexOrName])
      || (typeof G === 'object' && G.DEX_BY && G.DEX_BY[nextDexOrName])
      || {};

    const oldName = mem.name;
    mem.id = dexData.dex || nextDexOrName;
    mem.dex = dexData.dex || mem.dex;
    mem.name = dexData.name || String(nextDexOrName);
    mem.stage = (mem.stage || 1) + 1;
    mem.damage = Math.round((mem.damage || 15) * 1.35);
    mem.range = (mem.range || 280) + 30;

    if (typeof G === 'object' && G.Sprites && typeof G.Sprites.Animator === 'function') {
      mem.anim = new G.Sprites.Animator(mem.dex, 1, false);
    }

    if (typeof G === 'object') {
      if (G.FX && G.FX.dmgText) G.FX.dmgText(mem.x, mem.y - 28, `★ EVOLUIU: ${mem.name}!`, '#ffd700', true);
      if (G.Audio && G.Audio.sfx) { G.Audio.sfx('shinyGet'); G.Audio.sfx('powerup'); }
      if (G.UI && G.UI.toast) G.UI.toast(`✨ ${oldName} evoluiu para ${mem.name}! (+35% Dano)`, 2500);
    }
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

  // ---------------- Modo Mega / Super Frenzy (Super Mario Star) ----------------
  addMegaEnergy(amount) {
    if (this.dead || this.megaMode.active) return;
    const prev = this.megaEnergy;
    this.megaEnergy = Math.min(this.megaMaxEnergy, this.megaEnergy + amount);
    // Notifica ao atingir 100% de carga
    if (prev < this.megaMaxEnergy && this.megaEnergy >= this.megaMaxEnergy) {
      if (typeof G === 'object') {
        if (G.Audio) G.Audio.sfx('shiny');
        if (G.Spawner) G.Spawner.say('⚡ MEGA PRONTO! Pressione [ESPAÇO] para ativar!', 3.2, true);
        if (G.FX) G.FX.dmgText(this.x, this.y - this.bodyH - 22, '⚡ MEGA PRONTO! [ESPAÇO] ⚡', '#ffd700', true);
      }
    }
  }

  activateMega(dur = 15) {
    this.megaEnergy = 0; // Consome a carga acumulada
    this.megaMode.active = true;
    this.megaMode.timer = dur;
    this.megaMode.maxTimer = dur;
    this.megaMode.ghosts = [];
    this.megaMode.particles = [];
    this.megaMode.ghostTimer = 0;
    this.megaMode.starTimer = 0;
    this.megaMode.touchDmgTimer = 0;

    // Cura total e invulnerabilidade contínua
    this.hp = this.maxHp;
    this.invuln = Math.max(this.invuln, dur);

    // Zera recarga de todos os golpes aprendidos imediatamente
    if (Array.isArray(this.slots)) {
      this.slots.forEach(slot => {
        if (Array.isArray(slot)) slot.forEach(m => { m.t = 0; });
      });
    }

    // Efeitos imediatos audiovisuais e cinemáticos
    if (typeof G === 'object') {
      if (G.Audio) {
        G.Audio.sfx('shiny');
        G.Audio.sfx('legend');
      }
      if (G.Camera) G.Camera.kick(0.65);
      if (G.Game && G.Game.flash) G.Game.flash('#ffd700', 0.55);
      if (G.FX) {
        const cy = this.y - this.bodyH * 0.5;
        G.FX.burst(this.x, cy, '#ffd700', 50, 260);
        G.FX.burst(this.x, cy, '#00e5ff', 40, 220);
        G.FX.burst(this.x, cy, '#ff3366', 35, 180);
        G.FX.ring(this.x, this.y, 6, 160, '#ffd700', 0.6, 8);
        G.FX.ring(this.x, this.y, 10, 230, '#ff3366', 0.8, 10);
        G.FX.dmgText(this.x, this.y - this.bodyH - 26, '⚡ MEGA FRENZY! ⚡', '#ffd700', true);
      }
      if (G.Spawner) {
        G.Spawner.say(`⚡ ${this.mon.name.toUpperCase()} ATIVOU O MODO MEGA FÚRIA! ⚡`, 3.0, true);
      }
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
    if (!this.megaMode.active) return;
    this.megaMode.timer -= dt;

    if (this.megaMode.timer <= 0) {
      this.deactivateMega();
      return;
    }

    // Mantém invulnerável estilo Super Star do Mario
    this.invuln = Math.max(this.invuln, 0.4);

    const RAINBOW = ['#ffd700', '#ff3366', '#00e5ff', '#76ff03', '#ffffff', '#e040fb', '#ff9100'];
    const curColor = RAINBOW[Math.floor(performance.now() / 45) % RAINBOW.length];

    // 1. Gera Afterimages (rastros fantasma coloridos pixel art)
    this.megaMode.ghostTimer -= dt;
    if (this.megaMode.ghostTimer <= 0) {
      this.megaMode.ghostTimer = 0.038;
      this.megaMode.ghosts.push({
        x: this.x,
        y: this.y,
        dir: this.anim.dir,
        animName: this.anim.currentAnim,
        frame: this.anim.frame,
        color: curColor,
        alpha: 0.72,
        life: 0.28
      });
      if (this.megaMode.ghosts.length > 8) this.megaMode.ghosts.shift();
    }

    // Atualiza fade dos fantasmas
    for (let i = this.megaMode.ghosts.length - 1; i >= 0; i--) {
      const g = this.megaMode.ghosts[i];
      g.life -= dt;
      g.alpha = Math.max(0, g.life / 0.28) * 0.72;
      if (g.life <= 0) this.megaMode.ghosts.splice(i, 1);
    }

    // 2. Partículas Contínuas de Estrelas e Faíscas Pixel Art ("brilho para tudo que é lado")
    this.megaMode.starTimer -= dt;
    if (this.megaMode.starTimer <= 0) {
      this.megaMode.starTimer = 0.042; // ~24 emissões por segundo
      for (let k = 0; k < 3; k++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = G.U.rand(6, this.r * 1.5);
        this.megaMode.particles.push({
          x: this.x + Math.cos(ang) * dist,
          y: this.y - this.bodyH * 0.5 + Math.sin(ang) * (dist * 0.7),
          vx: G.U.rand(-45, 45) + (this.svx || 0) * -0.2,
          vy: G.U.rand(-140, -60),
          life: G.U.rand(0.25, 0.45),
          maxLife: 0.45,
          color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)],
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

    // 3. Choque de Contato Mario Star: Inimigos que encostam sofrem dano massivo e knockback violento
    this.megaMode.touchDmgTimer -= dt;
    if (this.megaMode.touchDmgTimer <= 0 && typeof G === 'object' && G.EnemyMgr) {
      this.megaMode.touchDmgTimer = 0.08;
      const touchRadius = this.r + 26;
      const enemies = G.EnemyMgr.near ? G.EnemyMgr.near(this.x, this.y, touchRadius + 50) : G.EnemyMgr.all();
      for (const e of enemies) {
        if (!e.dead && G.U.dist2(this.x, this.y, e.x, e.y) <= touchRadius * touchRadius) {
          const dmg = this.atk * 0.85;
          const kx = (e.x - this.x) || (Math.random() - 0.5);
          const ky = (e.y - this.y) || (Math.random() - 0.5);
          e.hurt(dmg, curColor, kx, ky, 280, 'super');
          if (G.FX) {
            G.FX.spark(e.x, e.y - 10, curColor, kx, ky, 5);
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

    // Ativação do Mega Mode pelo teclado (Barra de Espaço) quando atingir 100% de carga
    if (typeof G === 'object' && G.Input && (G.Input.tap('space') || G.Input.tap(' '))) {
      if (this.megaEnergy >= this.megaMaxEnergy && !this.megaMode.active) {
        this.activateMega(15);
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

    // --- Fila Indiana Segura (Trail Follow) dos 3 Pokémon ---
    this.posHistory.unshift({
      x: this.x,
      y: this.y,
      facingLeft: this.anim.dir === 6 || (this.svx < -0.1),
      walking: this.walking
    });
    if (this.posHistory.length > this.maxHistory) {
      this.posHistory.pop();
    }

    if (Array.isArray(this.team)) {
      for (const member of this.team) {
        const targetIdx = Math.min(member.trailDelay, this.posHistory.length - 1);
        const targetPos = this.posHistory[targetIdx] || { x: this.x, y: this.y, facingLeft: false, walking: false };

        const dx = targetPos.x - member.x;
        const dy = targetPos.y - member.y;
        member.x += dx * Math.min(1, 10.0 * dt);
        member.y += dy * Math.min(1, 10.0 * dt);
        member.facingLeft = targetPos.facingLeft;

        if (member.anim) {
          member.anim.dir = member.facingLeft ? 6 : 2;
          member.anim.loop(targetPos.walking ? 'Walk' : 'Idle');
          if (typeof member.anim.update === 'function') member.anim.update(dt);
        }

        // Combate autônomo individual
        member.attackTimer -= dt;
        if (member.attackTimer <= 0) {
          member.attackTimer = member.cooldown;
          this.performSquadMemberAttack(member);
        }
      }
    }

    // --- terreno líquido ---
    this.inLiquid = G.World.isLiquid(this.x, this.y);
    if (this.inLiquid) {
      const le = G.World.liquidEffect(this.mon.types);
      if (le.dmg) {
        this.lavaTick -= dt;
        if (this.lavaTick <= 0) {
          this.lavaTick = le.every; this.invuln = 0;
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
    G.Sprites.drawShadow(ctx, this.dex, this.x, this.y);

    // Efeito Mega Frenzy: Aura e Rastros Fantasma (Ghost Trails / Afterimages)
    const isMega = this.megaMode && this.megaMode.active && !this.dead;
    const RAINBOW = ['#ffd700', '#ff3366', '#00e5ff', '#76ff03', '#ffffff', '#e040fb', '#ff9100'];
    const curRainbow = RAINBOW[Math.floor(performance.now() / 45) % RAINBOW.length];

    if (isMega) {
      // 1. Ghost Trails / Afterimages coloridos translúcidos
      if (this.megaMode.ghosts && this.megaMode.ghosts.length) {
        for (const g of this.megaMode.ghosts) {
          if (g.alpha <= 0.02) continue;
          ctx.save();
          this.anim.draw(ctx, g.x, g.y, {
            flash: true,
            softFlash: true,
            alpha: g.alpha,
            color: g.color
          });
          ctx.restore();
        }
      }

      // 2. Aura de choque no chão com espinhos giratórios pixel art
      const now = performance.now();
      ctx.save();
      ctx.strokeStyle = curRainbow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r * 2.2 + Math.sin(now / 60) * 3, (this.r * 2.2) * 0.44, 0, 0, Math.PI * 2);
      ctx.stroke();

      const spikes = 8;
      const baseAng = (now / 160);
      for (let s = 0; s < spikes; s++) {
        const a = baseAng + (s / spikes) * Math.PI * 2;
        const rx = Math.cos(a) * (this.r * 2.3);
        const ry = Math.sin(a) * (this.r * 1.0);
        ctx.fillStyle = curRainbow;
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

    // Renderização do Treinador (Menino / Menina) na vanguarda
    if (this.trainerId && typeof G === 'object' && G.IntroCreationUI && typeof G.IntroCreationUI.drawTrainerPixelArt === 'function') {
      ctx.save();
      const cx = Math.round(this.x);
      const cy = Math.round(this.y);
      if (this.anim.dir === 6 || (this.svx < -0.1)) {
        ctx.translate(cx, cy);
        ctx.scale(-1, 1);
        G.IntroCreationUI.drawTrainerPixelArt(ctx, this.trainerId, 48, 48);
      } else {
        ctx.translate(cx - 24, cy - 38);
        G.IntroCreationUI.drawTrainerPixelArt(ctx, this.trainerId, 48, 48);
      }
      ctx.restore();
    } else {
      // Sprite do Pokémon com Rainbow Flash frenético estilo Super Mario Star quando em Mega Mode
      if (isMega) {
        this.anim.draw(ctx, this.x, this.y, { flash: true, softFlash: true, alpha: 1, color: curRainbow });
      } else {
        this.anim.draw(ctx, this.x, this.y, { flash: this.flash > 0, softFlash: true, alpha, color: '#ffcb3d' });
      }
    }

    // Renderização dos 3 Pokémon do Esquadrão em Fila Indiana
    if (Array.isArray(this.team)) {
      for (const member of this.team) {
        const mx = Math.round(member.x);
        const my = Math.round(member.y);

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(mx, my, 10, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (member.anim && typeof member.anim.draw === 'function') {
          member.anim.draw(ctx, mx, my, { alpha });
        }

        if (member.stage > 1) {
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`★${member.stage}`, mx, my - 26);
        }
        ctx.restore();
      }
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
      ctx.fillStyle = curRainbow;
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
    if (typeof getEvolutionData === 'function') {
      const evoData = getEvolutionData(prevSpecies);
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
    this.r = G.Sprites.bodyRadius(nextMon.dex);
    this.bodyH = G.Sprites.bodyHeight(nextMon.dex);

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
        G.DB.grantShiny(nextMon.dex, 'evolution');
      } else {
        G.DB.grant(nextMon.dex, 'evolution');
      }
      if (G.DB.save && G.DB.save.stats) {
        G.DB.save.stats.evolutions = (G.DB.save.stats.evolutions || 0) + 1;
      }
      G.DB.commit('run');
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
      const fn = (typeof getDevolutionData === 'function' ? getDevolutionData : (typeof G === 'object' && G.getDevolutionData));
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
