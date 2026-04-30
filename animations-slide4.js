/* =====================================================
   ANIMATIONS-SLIDE4.JS — PCD 2026
   3 animaciones generativas full-canvas. Cada una renderiza
   fondo + título + texturas + logos. getPosterAlpha() = 0.
   ===================================================== */

/* =====================================================
   1. GLITCH OVERLOAD
   Grilla de caracteres ASCII que forma las letras.
   Cada celda parpadea de forma independiente (snap instantáneo).
   Row-shifts y bloques de color como glitch orgánico.
   ===================================================== */
class GlitchOverload extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed   = Math.random() * 99999;
    this._f     = 0;
    this._cW    = 6;   // ancho de celda en px
    this._cH    = 10;  // alto de celda en px
    this._fSz   = 9;   // tamaño de fuente
    this._cols  = Math.ceil(CANVAS_W / this._cW);
    this._rows  = Math.ceil(CANVAS_H / this._cH);
    this._grid  = null; // Uint8Array: 1=letra, 0=fondo
    this._on    = null; // Uint8Array: celda visible
    this._ch    = null; // Uint8Array: índice en charset
    this._timer = null; // Uint8Array: countdown al próximo flip
    this._ci    = null; // Uint8Array: índice de color
    this._palette     = [];
    this._rowGlitches = [];
    this._blkGlitches = [];
    this._chars = Array.from('@#%*|/\\!?01.:;{}[]<>=^~+-');
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p    = this.p;
    const cW   = this._cW;
    const cH   = this._cH;
    const cols = this._cols;
    const rows = this._rows;
    const N    = cols * rows;
    const bufW = cols * cW;
    const bufH = rows * cH;

    const [fR, fG, fB]    = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    // Paleta: índice 0 = fg del preset, resto = acentos
    this._palette = [
      [fR, fG, fB],
      [p.random(185,215), p.random(155,180), 5],
      [15, p.random(110,175), p.random(200,255)],
      [p.random(220,255), p.random(118,155), 15],
      [p.random(165,195), p.random(175,208), p.random(200,230)],
      [p.random(215,255), 15, p.random(148,195)],
      [p.random(188,228), p.random(218,255), 15],
    ];

    // ── Muestrear el título a resolución de celda ──
    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const _font    = `'Space Mono', monospace`;
    const leftX    = bufW * 0.015;
    const availW   = bufW * 0.975;
    const leading  = this.state.anim?.slide4Leading ?? 0.74;

    off.drawingContext.textBaseline = 'top';
    off.drawingContext.textAlign    = 'left';

    // 1ª pasada: cada palabra escala al ancho del canvas (sin cap de altura)
    const sizes = SLIDE4_TITLE.map(word => {
      let sz = 40;
      off.drawingContext.font = `900 ${sz}px ${_font}`;
      while (off.drawingContext.measureText(word).width < availW) {
        sz += 2; off.drawingContext.font = `900 ${sz}px ${_font}`;
      }
      while (sz > 8 && off.drawingContext.measureText(word).width > availW) {
        sz -= 1; off.drawingContext.font = `900 ${sz}px ${_font}`;
      }
      return sz;
    });

    // 2ª pasada: centrar verticalmente en el área de texto (sin pisar logos)
    const logoRes  = bufH * 0.13;
    const textAreaH = bufH - logoRes;
    const totalH   = sizes.reduce((acc, sz) => acc + Math.round(sz * leading), 0);
    let y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    for (let i = 0; i < SLIDE4_TITLE.length; i++) {
      off.drawingContext.font = `900 ${sizes[i]}px ${_font}`;
      off.drawingContext.fillText(SLIDE4_TITLE[i], leftX, y);
      y += Math.round(sizes[i] * leading);
    }
    off.loadPixels();

    this._grid = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px  = Math.round((c + 0.5) * cW);
        const py  = Math.round((r + 0.5) * cH);
        const idx = (py * bufW + px) * 4;
        const d   = Math.abs(off.pixels[idx]   - bgR)
                  + Math.abs(off.pixels[idx+1] - bgG)
                  + Math.abs(off.pixels[idx+2] - bgB);
        this._grid[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();

    // ── Estado inicial por celda ──
    const nCh  = this._chars.length;
    const nPal = this._palette.length;
    this._on    = new Uint8Array(N);
    this._ch    = new Uint8Array(N);
    this._timer = new Uint8Array(N);
    this._ci    = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const isText   = this._grid[i] === 1;
      this._on[i]    = (p.random() < (isText ? 0.92 : 0.007)) ? 1 : 0;
      this._ch[i]    = Math.floor(p.random(nCh));
      this._timer[i] = Math.floor(p.random(1, 26));
      this._ci[i]    = isText
        ? (p.random() < 0.72 ? 0 : Math.floor(p.random(1, nPal)))
        : Math.floor(p.random(1, nPal));
    }

    this._rowGlitches = [];
    this._blkGlitches = [];
  }

  advanceState() {
    if (!this.state.playing) return;
    this._f++;
    const p    = this.p;
    const cols = this._cols;
    const rows = this._rows;
    const N    = cols * rows;
    const spd  = Math.max(0.4, (this.state.anim?.speed || 2) * 0.35);
    const nCh  = this._chars.length;
    const nPal = this._palette.length;

    // ── Flip por celda — snap instantáneo ──
    for (let i = 0; i < N; i++) {
      if (this._timer[i] > 0) { this._timer[i]--; continue; }
      const isText   = this._grid[i] === 1;
      this._on[i]    = (p.random() < (isText ? 0.94 : 0.007)) ? 1 : 0;
      this._ch[i]    = Math.floor(p.random(nCh));
      this._timer[i] = Math.max(1, Math.floor(p.random(2, 26) / spd));
      if (isText && p.random() < 0.12) {
        this._ci[i] = p.random() < 0.65 ? 0 : Math.floor(p.random(1, nPal));
      }
    }

    // ── Row glitch: fila entera se desplaza horizontalmente ──
    this._rowGlitches = this._rowGlitches.filter(g => --g.life > 0);
    if (p.random() < 0.035) {
      this._rowGlitches.push({
        row:  Math.floor(p.random(rows)),
        dxC:  Math.floor(p.random(2, 10)) * (p.random() > 0.5 ? 1 : -1),
        life: Math.floor(p.random(1, 4))
      });
    }

    // ── Block glitch: rectángulo de color sólido breve ──
    this._blkGlitches = this._blkGlitches.filter(g => --g.life > 0);
    if (p.random() < 0.04) {
      this._blkGlitches.push({
        c:    Math.floor(p.random(cols)),
        r:    Math.floor(p.random(rows)),
        cw:   Math.floor(p.random(3, 18)),
        rh:   Math.floor(p.random(1, 5)),
        ci:   Math.floor(p.random(1, nPal)),
        life: Math.floor(p.random(1, 3))
      });
    }
  }

  render() {
    const p    = this.p;
    const ctx  = p.drawingContext;
    const cW   = this._cW;
    const cH   = this._cH;
    const cols = this._cols;
    const rows = this._rows;
    const nPal = this._palette.length;

    // Sincronizar palette[0] con el fg actual del preset
    const [fR, fG, fB] = this.getFg();
    this._palette[0] = [fR, fG, fB];

    ctx.save();
    ctx.font         = `700 ${this._fSz}px 'Space Mono', monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';

    // Mapa de desplazamiento por fila
    const rowShift = new Map();
    for (const g of this._rowGlitches) {
      rowShift.set(g.row, (rowShift.get(g.row) || 0) + g.dxC * cW);
    }

    // Dos grupos separados: fondo (opacidad muy baja) y letras (opacidad plena)
    const BG_SIZES  = [22, 36, 52, 72, 96, 128, 160];
    const bgBatch   = { s: [], x: [], y: [], z: [] }; // z = tamaño de fuente
    const txtBatch  = Array.from({length: nPal}, () => ({ s: [], x: [], y: [] }));

    for (let r = 0; r < rows; r++) {
      const shiftX = rowShift.get(r) || 0;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!this._on[i]) continue;
        const x = c * cW + shiftX;
        if (x < -cW || x > CANVAS_W) continue;
        const ch = this._chars[this._ch[i]];
        const y  = r * cH;

        if (this._grid[i] === 0) {
          // Celda de fondo: tamaño aleatorio exagerado derivado del índice de char
          const sz = BG_SIZES[this._ch[i] % BG_SIZES.length];
          bgBatch.s.push(ch); bgBatch.x.push(x); bgBatch.y.push(y); bgBatch.z.push(sz);
        } else {
          // Celda de letra: va al batch de texto por color
          const ci  = this._ci[i] % nPal;
          const buf = txtBatch[ci];
          buf.s.push(ch); buf.x.push(x); buf.y.push(y);
        }
      }
    }

    // 1. Ruido de fondo — tamaños variados y exagerados, muy tenue
    if (bgBatch.s.length) {
      ctx.fillStyle = `rgba(${fR},${fG},${fB},0.10)`;
      let lastSz = -1;
      for (let k = 0; k < bgBatch.s.length; k++) {
        if (bgBatch.z[k] !== lastSz) {
          ctx.font = `700 ${bgBatch.z[k]}px 'Space Mono', monospace`;
          lastSz = bgBatch.z[k];
        }
        ctx.fillText(bgBatch.s[k], bgBatch.x[k], bgBatch.y[k]);
      }
      ctx.font = `700 ${this._fSz}px 'Space Mono', monospace`;
    }

    // 2. Caracteres del título — opacos, protagonistas
    const mono = this.state.posterSlide === 5;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.8;
    for (let ci = 0; ci < nPal; ci++) {
      const buf = txtBatch[ci];
      if (!buf.s.length) continue;
      const [r, g, b] = mono ? [fR, fG, fB] : this._palette[ci];
      const style = (mono || ci === 0)
        ? `rgb(${r},${g},${b})`
        : `rgba(${r},${g},${b},0.92)`;
      ctx.fillStyle   = style;
      ctx.strokeStyle = style;
      for (let k = 0; k < buf.s.length; k++) {
        ctx.strokeText(buf.s[k], buf.x[k], buf.y[k]);
        ctx.fillText(buf.s[k], buf.x[k], buf.y[k]);
      }
    }

    // 3. Block glitches encima
    for (const g of this._blkGlitches) {
      const [r2, g2, b2] = mono ? [fR, fG, fB] : this._palette[g.ci % nPal];
      ctx.fillStyle = `rgba(${r2},${g2},${b2},0.82)`;
      ctx.fillRect(g.c * cW, g.r * cH, g.cw * cW, g.rh * cH);
    }

    ctx.restore();

    if (typeof drawSlide4Logos === 'function') drawSlide4Logos(p);
  }

  getPosterAlpha() { return 0; }
  handleMouse() {}
  reset() {
    this.seed = Math.random() * 99999;
    this._f   = 0;
    this.p.randomSeed(this.seed);
    this.p.noiseSeed(this.seed);
    this._init();
  }
  setParams() {}
}

/* =====================================================
   2. PIXEL EXPLOSION
   Grilla de píxeles grandes. Cada celda parpadea de forma
   independiente y snap instantáneo (sin interpolación).
   El texto se forma por presencia/ausencia de color.
   ===================================================== */
class PixelExplosion extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed    = Math.random() * 99999;
    this._frame  = 0;
    this._cellSz = 10;
    this._gap    = 1;
    this._cols   = Math.ceil(CANVAS_W / this._cellSz);
    this._rows   = Math.ceil(CANVAS_H / this._cellSz);
    this._grid   = null; // Uint8Array: 1=celda de texto, 0=fondo
    this._on     = null; // Uint8Array: estado on/off actual
    this._timer  = null; // Uint8Array: frames hasta próximo flip
    this._ci     = null; // Uint8Array: índice de color por celda
    this._palette = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p    = this.p;
    const sz   = this._cellSz;
    const cols = this._cols;
    const rows = this._rows;
    const N    = cols * rows;
    const bufW = cols * sz;
    const bufH = rows * sz;

    const [fR, fG, fB]    = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    // Paleta de colores de acento (índice 0 = fg del preset)
    this._palette = [
      [fR, fG, fB],                                               // fg preset
      [p.random(185,215), p.random(155,180), 5],                  // gold
      [15, p.random(110,175), p.random(200,255)],                 // blue
      [p.random(220,255), p.random(118,155), 15],                 // orange
      [p.random(165,195), p.random(175,208), p.random(200,230)],  // lavender
      [p.random(215,255), 15, p.random(148,195)],                 // magenta
      [p.random(188,228), p.random(218,255), 15],                 // lime
    ];

    // ── Muestrear el texto a resolución de celda ──
    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const _font    = `'Space Mono', monospace`;
    const leftX    = bufW * 0.015;
    const availW   = bufW * 0.975;
    const leading  = this.state.anim?.slide4Leading ?? 0.74;

    off.drawingContext.textBaseline = 'top';
    off.drawingContext.textAlign    = 'left';

    // 1ª pasada: cada palabra escala al ancho del canvas (sin cap de altura)
    const sizes = SLIDE4_TITLE.map(word => {
      let sz = 40;
      off.drawingContext.font = `900 ${sz}px ${_font}`;
      while (off.drawingContext.measureText(word).width < availW) {
        sz += 2; off.drawingContext.font = `900 ${sz}px ${_font}`;
      }
      while (sz > 8 && off.drawingContext.measureText(word).width > availW) {
        sz -= 1; off.drawingContext.font = `900 ${sz}px ${_font}`;
      }
      return sz;
    });

    // 2ª pasada: centrar verticalmente en el área de texto (sin pisar logos)
    const logoRes  = bufH * 0.13;
    const textAreaH = bufH - logoRes;
    const totalH   = sizes.reduce((acc, sz) => acc + Math.round(sz * leading), 0);
    let y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    for (let i = 0; i < SLIDE4_TITLE.length; i++) {
      off.drawingContext.font = `900 ${sizes[i]}px ${_font}`;
      off.drawingContext.fillText(SLIDE4_TITLE[i], leftX, y);
      y += Math.round(sizes[i] * leading);
    }
    off.loadPixels();

    this._grid = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px  = Math.round((c + 0.5) * sz);
        const py  = Math.round((r + 0.5) * sz);
        const idx = (py * bufW + px) * 4;
        const d   = Math.abs(off.pixels[idx]   - bgR)
                  + Math.abs(off.pixels[idx+1] - bgG)
                  + Math.abs(off.pixels[idx+2] - bgB);
        this._grid[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();

    // ── Estado inicial por celda ──
    this._on    = new Uint8Array(N);
    this._timer = new Uint8Array(N);
    this._ci    = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const isText   = this._grid[i] === 1;
      this._on[i]    = (p.random() < (isText ? 0.92 : 0.015)) ? 1 : 0;
      this._timer[i] = Math.floor(p.random(1, 24));
      this._ci[i]    = Math.floor(p.random(this._palette.length));
    }
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const p    = this.p;
    const cols = this._cols;
    const rows = this._rows;
    const N    = cols * rows;
    // speed controla qué tan rápido parpadean los píxeles
    const spd  = Math.max(0.4, (this.state.anim?.speed || 2) * 0.35);

    for (let i = 0; i < N; i++) {
      if (this._timer[i] > 0) { this._timer[i]--; continue; }
      const isText    = this._grid[i] === 1;
      // Snap instantáneo: sin interpolación
      this._on[i]    = (p.random() < (isText ? 0.94 : 0.015)) ? 1 : 0;
      this._timer[i] = Math.max(1, Math.floor(p.random(2, 22) / spd));
      // Cambio de color ocasional
      if (isText && p.random() < 0.10) {
        this._ci[i] = Math.floor(p.random(this._palette.length));
      }
    }

  }

  render() {
    const p      = this.p;
    const ctx    = p.drawingContext;
    const sz     = this._cellSz;
    const gap    = this._gap;
    const cols   = this._cols;
    const rows   = this._rows;
    const draw   = sz - gap;
    const [fR, fG, fB] = this.getFg();
    const mono = this.state.posterSlide === 5;

    ctx.save();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!this._on[i]) continue;

        const x = c * sz + gap;
        const y = r * sz + gap;
        const [pr, pg, pb] = mono ? [fR, fG, fB] : this._palette[this._ci[i] % this._palette.length];

        if (this._grid[i]) {
          ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        } else {
          ctx.fillStyle = `rgba(${pr},${pg},${pb},0.28)`;
        }
        ctx.fillRect(x, y, draw, draw);
      }
    }

    ctx.restore();

    if (typeof drawSlide4Logos === 'function') drawSlide4Logos(p);
  }

  getPosterAlpha() { return 0; }
  handleMouse() {}
  reset() {
    this.seed   = Math.random() * 99999;
    this._frame = 0;
    this.p.randomSeed(this.seed);
    this.p.noiseSeed(this.seed);
    this._init();
  }
  setParams() {}
}

/* =====================================================
   REGISTRO DE ANIMACIONES SLIDE 4
   ===================================================== */
const ANIMATIONS_SLIDE4 = {
  'glitch-overload': GlitchOverload,
  'pixel-explosion': PixelExplosion,
};
