/* =====================================================
   ANIMATIONS-SLIDE4.JS — Processing Community Day 2026
   Fondos abstractos/glitch/pixel para Slide 4 "Hero Visual"
   Cada clase extiende BaseAnimation (definida en animations.js)
   ===================================================== */

/* =====================================================
   1. GLITCH BLOCKS — Bandas horizontales que se desplazan
      con aberración cromática y líneas de escaneo
   ===================================================== */
class GlitchBlocks extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this._frame = 0;
    this._rowH  = 28;
    this._gs    = [];
    this._reset();
  }

  _reset() {
    const p = this.p;
    p.noiseSeed(this.state.anim.seed || 42);
    p.randomSeed(this.state.anim.seed || 42);
    this._frame = 0;
    const rows = Math.ceil(CANVAS_H / this._rowH);
    this._gs = Array.from({ length: rows }, () => ({
      shift:       0,
      active:      false,
      duration:    0,
      maxDuration: Math.floor(p.random(2, 9)),
      maxShift:    p.random(40, 160) * (p.random() > 0.5 ? 1 : -1),
      nextEvent:   Math.floor(p.random(10, 120))
    }));
  }

  advanceState() {
    const p   = this.p;
    const spd = this.state.anim.speed || 2;
    this._frame++;

    for (let i = 0; i < this._gs.length; i++) {
      const gs = this._gs[i];
      if (gs.active) {
        gs.duration++;
        if (gs.duration >= gs.maxDuration) {
          gs.active = false;
          gs.shift  = 0;
          gs.nextEvent    = this._frame + Math.floor(p.random(40, 200));
          gs.maxDuration  = Math.floor(p.random(2, 9));
          gs.maxShift     = p.random(40, 160) * (p.random() > 0.5 ? 1 : -1);
        }
      } else if (this._frame >= gs.nextEvent) {
        const n = p.noise(i * 0.3, this._frame * 0.012 * spd * 0.08);
        if (n > 0.63) {
          gs.active   = true;
          gs.duration = 0;
          gs.shift    = gs.maxShift;
        } else {
          gs.nextEvent = this._frame + Math.floor(p.random(5, 30));
        }
      }
    }
  }

  render() {
    const p   = this.p;
    const [fR, fG, fB] = this.getFg();
    const [aR, aG, aB] = this.getAnimRgb();
    const ctx = p.drawingContext;
    const rowH = this._rowH;
    const f   = this._frame;

    ctx.save();

    // Subtle noise bands behind everything
    for (let i = 0; i < this._gs.length; i++) {
      const n = p.noise(i * 0.06, f * 0.003);
      if (n > 0.62) {
        const a = (n - 0.62) / 0.38 * 0.12;
        ctx.fillStyle = `rgba(${fR},${fG},${fB},${a.toFixed(3)})`;
        ctx.fillRect(0, i * rowH, CANVAS_W, rowH - 1);
      }
    }

    // Glitch rows with chromatic aberration
    for (let i = 0; i < this._gs.length; i++) {
      const gs = this._gs[i];
      if (!gs.active) continue;
      const y  = i * rowH;
      const sh = gs.shift;
      ctx.fillStyle = `rgba(${aR},0,0,0.38)`;
      ctx.fillRect(sh + 4, y, CANVAS_W, rowH);
      ctx.fillStyle = `rgba(0,0,${aB},0.38)`;
      ctx.fillRect(sh - 4, y, CANVAS_W, rowH);
      ctx.fillStyle = `rgba(${fR},${fG},${fB},0.18)`;
      ctx.fillRect(sh, y, CANVAS_W, rowH - 1);
      ctx.fillStyle = `rgba(${fR},${fG},${fB},0.9)`;
      ctx.fillRect(0, y, CANVAS_W, 1);
    }

    // Occasional vertical corruption strip
    const tn = f * 0.05;
    if (p.noise(tn) > 0.79) {
      const x = Math.floor(p.noise(tn + 10) * CANVAS_W);
      const w = 2 + Math.floor(p.noise(tn + 20) * 14);
      ctx.fillStyle = `rgba(${aR},${aG},${aB},0.55)`;
      ctx.fillRect(x, 0, w, CANVAS_H);
    }

    ctx.restore();
  }

  reset() { this._reset(); }
  setParams() {}
}

/* =====================================================
   2. PIXEL MELT — Columnas de píxeles que gotean hacia abajo
      con gradiente y punta brillante
   ===================================================== */
class PixelMelt extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this._drops = [];
    this._colW  = 14;
    this._reset();
  }

  _reset() {
    const p = this.p;
    p.randomSeed(this.state.anim.seed || 42);
    const cols = Math.ceil(CANVAS_W / this._colW);
    this._drops = Array.from({ length: cols }, () => ({
      y:       p.random(-CANVAS_H, 0),
      speed:   p.random(0.8, 3.5),
      len:     30 + Math.floor(p.random(40, 170)),
      alpha:   p.random(0.3, 0.85),
      useAnim: p.random() > 0.5
    }));
  }

  advanceState() {
    const p   = this.p;
    const spd = (this.state.anim.speed || 2) * 0.4;
    for (const d of this._drops) {
      d.y += d.speed * spd;
      if (d.y - d.len > CANVAS_H) {
        d.y       = -p.random(10, 220);
        d.speed   = p.random(0.8, 3.5);
        d.len     = 30 + Math.floor(p.random(40, 170));
        d.alpha   = p.random(0.3, 0.85);
        d.useAnim = p.random() > 0.5;
      }
    }
  }

  render() {
    const p   = this.p;
    const [fR, fG, fB] = this.getFg();
    const [aR, aG, aB] = this.getAnimRgb();
    const ctx = p.drawingContext;
    const colW = this._colW;

    ctx.save();
    for (let i = 0; i < this._drops.length; i++) {
      const d = this._drops[i];
      const x = i * colW;
      const [tR, tG, tB] = d.useAnim ? [aR, aG, aB] : [fR, fG, fB];
      const grad = ctx.createLinearGradient(0, d.y - d.len, 0, d.y);
      grad.addColorStop(0,   `rgba(${tR},${tG},${tB},0)`);
      grad.addColorStop(0.3, `rgba(${tR},${tG},${tB},${d.alpha.toFixed(3)})`);
      grad.addColorStop(0.8, `rgba(${fR},${fG},${fB},${(d.alpha * 0.55).toFixed(3)})`);
      grad.addColorStop(1,   `rgba(${fR},${fG},${fB},0.92)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, d.y - d.len, colW - 1, d.len);
      // Bright tip
      ctx.fillStyle = `rgba(${fR},${fG},${fB},0.96)`;
      ctx.fillRect(x, d.y - 2, colW - 1, 3);
    }
    ctx.restore();
  }

  reset() { this._reset(); }
  setParams() {}
}

/* =====================================================
   3. NOISE CORRUPTION — Bloques de ruido Perlin con
      mezcla cromática y ráfagas de alta intensidad
   ===================================================== */
class NoiseCorruption extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this._t = 0;
    this._reset();
  }

  _reset() {
    this._t = 0;
    this.p.noiseSeed(this.state.anim.seed || 42);
  }

  advanceState() {
    this._t += (this.state.anim.speed || 2) * 0.008;
  }

  render() {
    const p   = this.p;
    const [fR, fG, fB] = this.getFg();
    const [aR, aG, aB] = this.getAnimRgb();
    const ctx = p.drawingContext;
    const step = 12;
    const t   = this._t;

    ctx.save();
    for (let y = 0; y < CANVAS_H; y += step) {
      for (let x = 0; x < CANVAS_W; x += step) {
        const n1  = p.noise(x * 0.004, y * 0.004, t);
        const n2  = p.noise(x * 0.018 + 100, y * 0.018, t * 1.6);
        const val = n1 * n2;
        if (val > 0.34) {
          const a   = (val - 0.34) / 0.66;
          const mix = n2;
          const r   = Math.round(fR * (1 - mix) + aR * mix);
          const g   = Math.round(fG * (1 - mix) + aG * mix);
          const b   = Math.round(fB * (1 - mix) + aB * mix);
          ctx.fillStyle = `rgba(${r},${g},${b},${(a * 0.42).toFixed(3)})`;
          ctx.fillRect(x, y, step, step);
        }
        if (val > 0.7) {
          const hi = Math.min(1, (val - 0.7) * 3.3);
          ctx.fillStyle = `rgba(${fR},${fG},${fB},${hi.toFixed(3)})`;
          ctx.fillRect(x, y, step, step);
        }
      }
    }
    ctx.restore();
  }

  reset() { this._reset(); }
  setParams() {}
}

/* =====================================================
   4. SCANLINE DRIFT — Líneas horizontales que se desplazan
      pulsando en brillo como una pantalla CRT
   ===================================================== */
class ScanlineDrift extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this._lines = [];
    this._t = 0;
    this._reset();
  }

  _reset() {
    const p = this.p;
    p.randomSeed(this.state.anim.seed || 42);
    this._t = 0;
    this._lines = Array.from({ length: 40 }, () => ({
      y:       p.random(0, CANVAS_H),
      speed:   p.random(-1.4, 1.4),
      h:       p.random(1, 7),
      alpha:   p.random(0.1, 0.6),
      phase:   p.random(0, Math.PI * 2),
      freq:    p.random(0.002, 0.012),
      useAnim: p.random() > 0.5
    }));
  }

  advanceState() {
    const spd = (this.state.anim.speed || 2) * 0.25;
    this._t += spd;
    for (const ln of this._lines) {
      ln.y += ln.speed * spd;
      if (ln.y > CANVAS_H + 10) ln.y = -ln.h;
      if (ln.y < -ln.h - 10)   ln.y = CANVAS_H;
    }
  }

  render() {
    const p   = this.p;
    const [fR, fG, fB] = this.getFg();
    const [aR, aG, aB] = this.getAnimRgb();
    const ctx = p.drawingContext;
    const t   = this._t;

    ctx.save();
    for (const ln of this._lines) {
      const pulse = 0.5 + 0.5 * Math.sin(t * ln.freq + ln.phase);
      const eff   = ln.alpha * pulse;
      if (eff < 0.01) continue;
      const [r, g, b] = ln.useAnim ? [aR, aG, aB] : [fR, fG, fB];
      ctx.fillStyle = `rgba(${r},${g},${b},${eff.toFixed(3)})`;
      ctx.fillRect(0, ln.y, CANVAS_W, ln.h);
    }
    // Sweep pulse across canvas
    const sweep = ((t * 0.8) % CANVAS_H);
    ctx.fillStyle = `rgba(${fR},${fG},${fB},0.045)`;
    ctx.fillRect(0, sweep - 35, CANVAS_W, 70);
    ctx.restore();
  }

  reset() { this._reset(); }
  setParams() {}
}

/* =====================================================
   5. DATA MOSHING — Macroblocks de codec de video que
      aparecen y desaparecen como artefactos de compresión
   ===================================================== */
class DataMoshing extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this._blocks = [];
    this._frame  = 0;
    this._reset();
  }

  _reset() {
    const p = this.p;
    p.randomSeed(this.state.anim.seed || 42);
    this._frame = 0;
    const bW   = 64;
    const bH   = 64;
    const cols = Math.ceil(CANVAS_W / bW);
    const rows = Math.ceil(CANVAS_H / bH);
    this._blocks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this._blocks.push({
          x:       c * bW,
          y:       r * bH,
          w:       bW,
          h:       bH,
          alpha:   0,
          target:  p.random() > 0.65 ? p.random(0.07, 0.42) : 0,
          useAnim: p.random() > 0.45,
          timer:   Math.floor(p.random(0, 80)),
          interval: 15 + Math.floor(p.random(10, 55))
        });
      }
    }
  }

  advanceState() {
    const p   = this.p;
    const spd = (this.state.anim.speed || 2) * 0.5;
    this._frame++;
    for (const blk of this._blocks) {
      blk.timer--;
      if (blk.timer <= 0) {
        blk.timer    = Math.max(1, Math.floor(blk.interval / spd));
        blk.target   = p.random() > 0.6 ? p.random(0.06, 0.4) : 0;
        blk.useAnim  = p.random() > 0.45;
        blk.interval = 15 + Math.floor(p.random(10, 55));
      }
      blk.alpha += (blk.target - blk.alpha) * 0.1;
    }
  }

  render() {
    const p   = this.p;
    const [fR, fG, fB] = this.getFg();
    const [aR, aG, aB] = this.getAnimRgb();
    const ctx = p.drawingContext;

    ctx.save();
    for (const blk of this._blocks) {
      if (blk.alpha < 0.006) continue;
      const [r, g, b] = blk.useAnim ? [aR, aG, aB] : [fR, fG, fB];
      ctx.fillStyle = `rgba(${r},${g},${b},${blk.alpha.toFixed(3)})`;
      ctx.fillRect(blk.x, blk.y, blk.w - 1, blk.h - 1);
    }
    // Occasional smear line
    if (this._frame % 20 < 2) {
      const yLine = Math.floor(p.noise(this._frame * 0.06) * CANVAS_H);
      ctx.fillStyle = `rgba(${fR},${fG},${fB},0.55)`;
      ctx.fillRect(0, yLine, CANVAS_W, 1);
    }
    ctx.restore();
  }

  reset() { this._reset(); }
  setParams() {}
}

/* =====================================================
   REGISTRO DE ANIMACIONES SLIDE 4
   ===================================================== */
const ANIMATIONS_SLIDE4 = {
  'glitch-blocks':    GlitchBlocks,
  'pixel-melt':       PixelMelt,
  'noise-corruption': NoiseCorruption,
  'scanline-drift':   ScanlineDrift,
  'data-moshing':     DataMoshing
};
