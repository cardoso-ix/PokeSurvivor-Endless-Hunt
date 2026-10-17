/* ============ camera.js — vista y transformación mundo<->pantalla ============
 * Escala equilibrada de câmera moderna (1.25x) para renderização ultra-nítida (Pixel Crisp)
 * no padrão HoloCure e Vampire Survivors. Sprites ocupam área harmoniosa sem distorção.
 */
G.Camera = {
  x: 0, y: 0,
  zoom: 1.25,               // Escala calibrada moderna (entre 1.15x e 1.35x)
  scale: 1.25,
  shake: 0,
  _sx: 0, _sy: 0,
  dpr: 1,
  w: 1200,
  h: 800,

  /** Recalcula a visão da câmera com resolução nativa 1:1 e zoom equilibrado */
  resize(cssW, cssH, dpr = 1) {
    this.dpr = 1; // Resolução nativa 1:1
    if (this.zoom == null) {
      this.zoom = (typeof G === 'object' && G.Settings && G.Settings.get)
        ? (G.Settings.get('cameraZoom') || 1.25)
        : 1.25;
    }
    this.scale = this.zoom;
    this.w = cssW / this.scale;
    this.h = cssH / this.scale;
  },

  /** Ajusta diretamente o zoom da câmera com clamp de segurança */
  setZoom(val, showToast = true) {
    const clampVal = typeof G === 'object' && G.U && G.U.clamp ? G.U.clamp(val, 0.70, 2.50) : Math.min(2.5, Math.max(0.7, val));
    this.zoom = Math.round(clampVal * 100) / 100;
    this.scale = this.zoom;
    const cvW = (typeof window !== 'undefined' ? window.innerWidth : 1200);
    const cvH = (typeof window !== 'undefined' ? window.innerHeight : 800);
    this.w = cvW / this.scale;
    this.h = cvH / this.scale;
    if (typeof G === 'object' && G.Settings && G.Settings.get && G.Settings.get('cameraZoom') !== this.zoom) {
      G.Settings.set('cameraZoom', this.zoom);
    }
    if (showToast && typeof G === 'object' && G.UI && G.UI.toast) {
      G.UI.toast(`Zoom da Câmera: ${this.zoom.toFixed(2)}x`, 1000);
    }
    return this.zoom;
  },

  /** Ajuste rápido de zoom via atalhos (+) e (-) */
  adjustZoom(delta) {
    return this.setZoom((this.zoom || 1.25) + delta);
  },

  follow(tx, ty, dt) {
    const smooth = typeof G === 'object' && G.Settings && G.Settings.get
      ? (G.Settings.get('cameraSmooth') !== false)
      : true;
    if (smooth && dt > 0 && typeof G === 'object' && G.U && G.U.damp) {
      this.x = G.U.damp(this.x, tx, 9, dt);
      this.y = G.U.damp(this.y, ty, 9, dt);
    } else {
      this.x = tx;
      this.y = ty;
    }
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.4);
      const a = this.shake * 7;
      this._sx = (typeof G === 'object' && G.U && G.U.rand) ? G.U.rand(-a, a) : 0;
      this._sy = (typeof G === 'object' && G.U && G.U.rand) ? G.U.rand(-a, a) : 0;
    } else { this._sx = this._sy = 0; }
  },

  kick(amount) {
    const shakeActive = typeof G === 'object' && G.Settings && G.Settings.get
      ? (G.Settings.get('cameraShake') !== false)
      : true;
    if (!shakeActive) return;
    if (typeof G === 'object' && G.Settings && G.Settings.get && G.Settings.get('calm')) amount *= 0.25; // "menos sacudidas"
    this.shake = Math.min(1.2, this.shake + amount);
  },

  /** Aplica la transformación de cámara al contexto en coordenadas 1:1 */
  apply(ctx) {
    ctx.translate(Math.round(-this.left() + this._sx),
                  Math.round(-this.top() + this._sy));
  },

  left() { return this.x - this.w / 2; },
  top() { return this.y - this.h / 2; },

  /** ¿Está el punto dentro de la vista (con margen)? */
  sees(x, y, pad = 60) {
    return x > this.left() - pad && x < this.left() + this.w + pad &&
           y > this.top() - pad && y < this.top() + this.h + pad;
  },

  /** Radio del círculo que envuelve la vista: usado para spawnear fuera */
  outerRadius() { return Math.hypot(this.w, this.h) / 2 + 50; }
};
