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
    this.seed = Math.random() * 99999;
    this._f = 0;
    const isSlide8 = state.posterSlide === 8;
    this._cW = isSlide8 ? 4 : 6; // ancho de celda en px
    this._cH = isSlide8 ? 7 : 10; // alto de celda en px
    this._fSz = isSlide8 ? 7 : 9; // tamaño de fuente
    this._cols = Math.ceil(CANVAS_W / this._cW);
    this._rows = Math.ceil(CANVAS_H / this._cH);
    this._grid = null; // Uint8Array: 1=letra, 0=fondo
    this._on = null; // Uint8Array: celda visible
    this._ch = null; // Uint8Array: índice en charset
    this._timer = null; // Uint8Array: countdown al próximo flip
    this._ci = null; // Uint8Array: índice de color
    this._palette = [];
    this._rowGlitches = [];
    this._blkGlitches = [];
    this._chars = Array.from("@#%*|/\\!?01.:;{}[]<>=^~+-");
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    const cW = this._cW;
    const cH = this._cH;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const bufW = cols * cW;
    const bufH = rows * cH;

    // --- NUEVA LÓGICA INTEGRADA ---
    const isSlide7 = this.state.posterSlide === 7;
    const wordsToSample = isSlide7
      ? [this.state.slide7.fechaNueva]
      : SLIDE4_TITLE;

    const [fR, fG, fB] = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    // Paleta: índice 0 = fg del preset, resto = acentos
    this._palette = [
      [fR, fG, fB],
      [p.random(185, 215), p.random(155, 180), 5],
      [15, p.random(110, 175), p.random(200, 255)],
      [p.random(220, 255), p.random(118, 155), 15],
      [p.random(165, 195), p.random(175, 208), p.random(200, 230)],
      [p.random(215, 255), 15, p.random(148, 195)],
      [p.random(188, 228), p.random(218, 255), 15],
    ];

    // ── Muestrear el título a resolución de celda ──
    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const _font = `'Space Mono', monospace`;
    const leftX = bufW * 0.015;
    const availW = bufW * 0.975;
    const leading = this.state.anim?.slide4Leading ?? 0.74;

    off.drawingContext.textBaseline = "top";
    off.drawingContext.textAlign = "left";

    // 1ª pasada: calcular tamaños
    const sizes = wordsToSample.map((word) => {
      let sz = 40;
      off.drawingContext.font = `900 ${sz}px ${_font}`;
      while (off.drawingContext.measureText(word).width < availW) {
        sz += 2;
        off.drawingContext.font = `900 ${sz}px ${_font}`;
      }
      while (sz > 8 && off.drawingContext.measureText(word).width > availW) {
        sz -= 1;
        off.drawingContext.font = `900 ${sz}px ${_font}`;
      }
      return sz;
    });

    // 2ª pasada: renderizar al buffer
    const logoRes = bufH * 0.13;
    const textAreaH = bufH - logoRes;
    const totalH = sizes.reduce((acc, sz) => acc + Math.round(sz * leading), 0);
    const commIdx = wordsToSample.indexOf("COMM");

    // --- CÁLCULO DE POSICIÓN Y PARA SLIDE 7 ---
    let y;
    if (isSlide7) {
      const fontS7 = "'workfaaad-a', monospace";
      // Usamos el mismo refSize que en app.js para que la proporción sea idéntica
      const refSize = 90;
      off.drawingContext.font = `400 ${refSize}px ${fontS7}`;
      const targetW = off.drawingContext.measureText(
        "Convocatoria PCD 2026",
      ).width;

      const allLines = [
        { text: "Convocatoria PCD 2026", weight: 400 },
        { text: "Extensión", weight: 700 },
        { text: "Plazo", weight: 700 },
        { text: "26", weight: 700 },
        { text: "de Mayo", weight: 400 },
      ];

      let totalBlockH = 0;
      let heightOfFirstThree = 0;

      // Calculamos las alturas exactas de cada línea siguiendo la lógica de app.js
      allLines.forEach((l, idx) => {
        off.drawingContext.font = `${l.weight} 100px ${fontS7}`;
        const scale = targetW / off.drawingContext.measureText(l.text).width;
        const finalSize = 100 * scale;

        totalBlockH += finalSize * 0.9; // Factor de bloque total
        if (idx < 3) heightOfFirstThree += finalSize * 0.85; // Factor de avance Y
      });

      // El punto de inicio vertical para el bloque
      const startY = bufH / 2 - totalBlockH / 2;
      // El "y" para el 26 es el inicio + el alto de las 3 líneas anteriores
      y = startY + heightOfFirstThree;
    } else {
      y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    }

    for (let i = 0; i < wordsToSample.length; i++) {
      // Centrado horizontal si es slide 7
      const xOff = isSlide7
        ? bufW / 2 -
          off.drawingContext.measureText(wordsToSample[i]).width / 2 -
          leftX
        : i === commIdx
          ? -bufW * 0.01
          : 0;

      off.drawingContext.font = `900 ${sizes[i]}px ${_font}`;
      off.drawingContext.fillText(wordsToSample[i], leftX + xOff, y);
      y += Math.round(sizes[i] * leading);
    }
    off.loadPixels();

    this._grid = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = Math.round((c + 0.5) * cW);
        const py = Math.round((r + 0.5) * cH);
        const idx = (py * bufW + px) * 4;
        const d =
          Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB);
        this._grid[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();

    // ── Estado inicial por celda ──
    const nCh = this._chars.length;
    const nPal = this._palette.length;
    this._on = new Uint8Array(N);
    this._ch = new Uint8Array(N);
    this._timer = new Uint8Array(N);
    this._ci = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const isText = this._grid[i] === 1;
      const onRate = this.state.posterSlide === 8 ? 0.98 : 0.92;
      this._on[i] = p.random() < (isText ? onRate : 0.007) ? 1 : 0;
      this._ch[i] = Math.floor(p.random(nCh));
      this._timer[i] = Math.floor(p.random(1, 26));
      this._ci[i] = isText
        ? p.random() < 0.72
          ? 0
          : Math.floor(p.random(1, nPal))
        : Math.floor(p.random(1, nPal));
    }

    this._rowGlitches = [];
    this._blkGlitches = [];
  }

  advanceState() {
    if (!this.state.playing) return;
    this._f++;
    const p = this.p;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const spd = Math.max(0.4, (this.state.anim?.speed || 2) * 0.35);
    const nCh = this._chars.length;
    const nPal = this._palette.length;

    // ── Flip por celda — snap instantáneo ──
    for (let i = 0; i < N; i++) {
      if (this._timer[i] > 0) {
        this._timer[i]--;
        continue;
      }
      const isText = this._grid[i] === 1;
      const onRate = this.state.posterSlide === 8 ? 0.985 : 0.94;
      this._on[i] = p.random() < (isText ? onRate : 0.007) ? 1 : 0;
      this._ch[i] = Math.floor(p.random(nCh));
      this._timer[i] = Math.max(1, Math.floor(p.random(2, 26) / spd));
      if (isText && p.random() < 0.12) {
        this._ci[i] = p.random() < 0.65 ? 0 : Math.floor(p.random(1, nPal));
      }
    }

    // ── Row glitch: fila entera se desplaza horizontalmente ──
    this._rowGlitches = this._rowGlitches.filter((g) => --g.life > 0);
    if (p.random() < 0.035) {
      this._rowGlitches.push({
        row: Math.floor(p.random(rows)),
        dxC: Math.floor(p.random(2, 10)) * (p.random() > 0.5 ? 1 : -1),
        life: Math.floor(p.random(1, 4)),
      });
    }

    // ── Block glitch: rectángulo de color sólido breve ──
    this._blkGlitches = this._blkGlitches.filter((g) => --g.life > 0);
    if (p.random() < 0.04) {
      this._blkGlitches.push({
        c: Math.floor(p.random(cols)),
        r: Math.floor(p.random(rows)),
        cw: Math.floor(p.random(3, 18)),
        rh: Math.floor(p.random(1, 5)),
        ci: Math.floor(p.random(1, nPal)),
        life: Math.floor(p.random(1, 3)),
      });
    }
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const cW = this._cW;
    const cH = this._cH;
    const cols = this._cols;
    const rows = this._rows;
    const nPal = this._palette.length;

    // Sincronizar palette[0] con el fg actual del preset
    const [fR, fG, fB] = this.getFg();
    this._palette[0] = [fR, fG, fB];

    ctx.save();
    ctx.font = `700 ${this._fSz}px 'Space Mono', monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    // Mapa de desplazamiento por fila
    const rowShift = new Map();
    for (const g of this._rowGlitches) {
      rowShift.set(g.row, (rowShift.get(g.row) || 0) + g.dxC * cW);
    }

    // Dos grupos separados: fondo (opacidad muy baja) y letras (opacidad plena)
    const BG_SIZES = [22, 36, 52, 72, 96, 128, 160];
    const bgBatch = { s: [], x: [], y: [], z: [] };
    const txtBatch = Array.from({ length: nPal }, () => ({
      s: [],
      x: [],
      y: [],
    }));

    for (let r = 0; r < rows; r++) {
      const shiftX = rowShift.get(r) || 0;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!this._on[i]) continue;
        const x = c * cW + shiftX;
        if (x < -cW || x > CANVAS_W) continue;
        const ch = this._chars[this._ch[i]];
        const y = r * cH;

        if (this._textOnly && this._grid[i] === 0) continue;

        if (this._grid[i] === 0) {
          // Celda de fondo
          const sz = BG_SIZES[this._ch[i] % BG_SIZES.length];
          bgBatch.s.push(ch);
          bgBatch.x.push(x);
          bgBatch.y.push(y);
          bgBatch.z.push(sz);
        } else {
          // Celda de letra (El "26" o el título)
          const ci = this._ci[i] % nPal;
          const buf = txtBatch[ci];
          buf.s.push(ch);
          buf.x.push(x);
          buf.y.push(y);
        }
      }
    }

    // 1. Ruido de fondo — (Corregido: ahora se dibuja una sola vez)
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
    const mono =
      this.state.posterSlide === 5 ||
      this.state.posterSlide === 7 ||
      this.state.posterSlide === 8;

    // CAMBIO CLAVE: Permitimos dibujar si NO es la slide 7 O si se fuerza desde el overlay (forceProtagonist)
    if (this.state.posterSlide !== 7 || this.forceProtagonist) {
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.8;
      for (let ci = 0; ci < nPal; ci++) {
        const buf = txtBatch[ci];
        if (!buf.s.length) continue;
        const [r, g, b] = mono ? [fR, fG, fB] : this._palette[ci];
        const style =
          mono || ci === 0
            ? `rgb(${r},${g},${b})`
            : `rgba(${r},${g},${b},0.92)`;
        ctx.fillStyle = style;
        ctx.strokeStyle = style;
        for (let k = 0; k < buf.s.length; k++) {
          ctx.strokeText(buf.s[k], buf.x[k], buf.y[k]);
          ctx.fillText(buf.s[k], buf.x[k], buf.y[k]);
        }
      }
    }

    // 3. Block glitches encima
    for (const g of this._blkGlitches) {
      const [r2, g2, b2] = mono ? [fR, fG, fB] : this._palette[g.ci % nPal];
      ctx.fillStyle = `rgba(${r2},${g2},${b2},0.82)`;
      ctx.fillRect(g.c * cW, g.r * cH, g.cw * cW, g.rh * cH);
    }

    ctx.restore();

    // Dibujamos logos solo si no es la Slide 7 para no ensuciar el diseño de bloque
    if (
      typeof drawSlide4Logos === "function" &&
      ![7, 8].includes(this.state.posterSlide)
    )
      drawSlide4Logos(p);
  }

  getPosterAlpha() {
    return 0;
  }
  handleMouse() {}
  reset() {
    this.seed = Math.random() * 99999;
    this._f = 0;
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
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 8 ? 7 : 10;
    this._gap = 1;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._grid = null; // Uint8Array: 1=celda de texto, 0=fondo
    this._on = null; // Uint8Array: estado on/off actual
    this._timer = null; // Uint8Array: frames hasta próximo flip
    this._ci = null; // Uint8Array: índice de color por celda
    this._palette = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    const sz = this._cellSz;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const bufW = cols * sz;
    const bufH = rows * sz;

    const [fR, fG, fB] = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    // Paleta de colores de acento (índice 0 = fg del preset)
    this._palette = [
      [fR, fG, fB], // fg preset
      [p.random(185, 215), p.random(155, 180), 5], // gold
      [15, p.random(110, 175), p.random(200, 255)], // blue
      [p.random(220, 255), p.random(118, 155), 15], // orange
      [p.random(165, 195), p.random(175, 208), p.random(200, 230)], // lavender
      [p.random(215, 255), 15, p.random(148, 195)], // magenta
      [p.random(188, 228), p.random(218, 255), 15], // lime
    ];

    // ── Muestrear el texto a resolución de celda ──
    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const _font = `'Space Mono', monospace`;
    const leftX = bufW * 0.015;
    const availW = bufW * 0.975;
    const leading = this.state.anim?.slide4Leading ?? 0.74;

    off.drawingContext.textBaseline = "top";
    off.drawingContext.textAlign = "left";

    // 1ª pasada: cada palabra escala al ancho del canvas (sin cap de altura)
    const sizes = SLIDE4_TITLE.map((word) => {
      let sz = 40;
      off.drawingContext.font = `900 ${sz}px ${_font}`;
      while (off.drawingContext.measureText(word).width < availW) {
        sz += 2;
        off.drawingContext.font = `900 ${sz}px ${_font}`;
      }
      while (sz > 8 && off.drawingContext.measureText(word).width > availW) {
        sz -= 1;
        off.drawingContext.font = `900 ${sz}px ${_font}`;
      }
      return sz;
    });

    // 2ª pasada: centrar verticalmente en el área de texto (sin pisar logos)
    const logoRes = bufH * 0.13;
    const textAreaH = bufH - logoRes;
    const totalH = sizes.reduce((acc, sz) => acc + Math.round(sz * leading), 0);
    const commIdx = SLIDE4_TITLE.indexOf("COMM");
    let y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    for (let i = 0; i < SLIDE4_TITLE.length; i++) {
      const xOff = i === commIdx ? -bufW * 0.01 : 0;
      off.drawingContext.font = `900 ${sizes[i]}px ${_font}`;
      off.drawingContext.fillText(SLIDE4_TITLE[i], leftX + xOff, y);
      y += Math.round(sizes[i] * leading);
    }
    off.loadPixels();

    this._grid = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = Math.round((c + 0.5) * sz);
        const py = Math.round((r + 0.5) * sz);
        const idx = (py * bufW + px) * 4;
        const d =
          Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB);
        this._grid[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();

    // ── Estado inicial por celda ──
    this._on = new Uint8Array(N);
    this._timer = new Uint8Array(N);
    this._ci = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const isText = this._grid[i] === 1;
      const onRate = this.state.posterSlide === 8 ? 0.98 : 0.92;
      this._on[i] = p.random() < (isText ? onRate : 0.015) ? 1 : 0;
      this._timer[i] = Math.floor(p.random(1, 24));
      this._ci[i] = Math.floor(p.random(this._palette.length));
    }
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const p = this.p;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    // speed controla qué tan rápido parpadean los píxeles
    const spd = Math.max(0.4, (this.state.anim?.speed || 2) * 0.35);

    for (let i = 0; i < N; i++) {
      if (this._timer[i] > 0) {
        this._timer[i]--;
        continue;
      }
      const isText = this._grid[i] === 1;
      // Snap instantáneo: sin interpolación
      const onRate = this.state.posterSlide === 8 ? 0.985 : 0.94;
      this._on[i] = p.random() < (isText ? onRate : 0.015) ? 1 : 0;
      this._timer[i] = Math.max(1, Math.floor(p.random(2, 22) / spd));
      // Cambio de color ocasional
      if (isText && p.random() < 0.1) {
        this._ci[i] = Math.floor(p.random(this._palette.length));
      }
    }
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const gap = this._gap;
    const cols = this._cols;
    const rows = this._rows;
    const draw = sz - gap;
    const [fR, fG, fB] = this.getFg();
    this._palette[0] = [fR, fG, fB];

    const mono = this.state.posterSlide === 5;
    const contrastMode = this.state.anim?.slide4PixelMode === "contrast";
    const useFlat = mono || contrastMode;

    ctx.save();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!this._on[i]) continue;
        if (this._textOnly && this._grid[i] === 0) continue;

        const x = c * sz + gap;
        const y = r * sz + gap;

        if (useFlat) {
          if (this._grid[i]) {
            if (contrastMode) {
              // opacidad según fase del timer: recién activado = brillante, a punto de cambiar = tenue
              const opacity = 0.12 + 0.88 * Math.min(1, this._timer[i] / 20);
              ctx.fillStyle = `rgba(${fR},${fG},${fB},${opacity.toFixed(2)})`;
            } else {
              ctx.fillStyle = `rgb(${fR},${fG},${fB})`;
            }
          } else {
            ctx.fillStyle = `rgba(${fR},${fG},${fB},0.07)`;
          }
        } else {
          const [pr, pg, pb] =
            this._palette[this._ci[i] % this._palette.length];
          ctx.fillStyle = this._grid[i]
            ? `rgb(${pr},${pg},${pb})`
            : `rgba(${pr},${pg},${pb},0.28)`;
        }
        ctx.fillRect(x, y, draw, draw);
      }
    }

    ctx.restore();

    if (
      typeof drawSlide4Logos === "function" &&
      ![7, 8].includes(this.state.posterSlide)
    )
      drawSlide4Logos(p);
  }

  getPosterAlpha() {
    return 0;
  }
  handleMouse() {}
  reset() {
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this.p.randomSeed(this.seed);
    this.p.noiseSeed(this.seed);
    this._init();
  }
  setParams() {}
}

/* =====================================================
   3. DEADLINE FLIP
   Misma técnica que GlitchOverload pero con texto de fecha
   en workfaaad-a. Transiciona entre dos fechas vía el
   mecanismo de celdas glitch.
   ===================================================== */

function drawDeadlineTopBar(p, fR, fG, fB) {
  const ctx = p.drawingContext;
  const tagY = 0;
  const tagH = 55;
  const mx = 12;

  ctx.save();
  ctx.font = `400 20px 'Necto Mono', monospace`;
  ctx.letterSpacing = "2.4px";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = `rgba(${fR},${fG},${fB},0.75)`;
  ctx.fillText("EXTENSIÓN DE PLAZO", mx, tagH / 2);
  ctx.letterSpacing = "0px";
  ctx.restore();
}

class DeadlineFlip extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cW = 6;
    this._cH = 10;
    this._fSz = 9;
    this._cols = Math.ceil(CANVAS_W / this._cW);
    this._rows = Math.ceil(CANVAS_H / this._cH);
    this._gridFrom = null;
    this._gridTo = null;
    this._grid = null;
    this._staticMask = null;
    this._dateWords = null;
    this._on = null;
    this._ch = null;
    this._timer = null;
    this._ci = null;
    this._palette = [];
    this._rowGlitches = [];
    this._blkGlitches = [];
    this._chars = Array.from("@#%*|/\\!?01.:;{}[]<>=^~+-");
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _sampleText(words, centerFirst = false) {
    const p = this.p;
    const cW = this._cW;
    const cH = this._cH;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const bufW = cols * cW;
    const bufH = rows * cH;
    const [fR, fG, fB] = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const font = `'workfaaad-a', sans-serif`;
    const leftX = bufW * 0.02;
    const availW = bufW * 0.96;
    const leading = 0.82;

    off.drawingContext.textBaseline = "top";
    off.drawingContext.textAlign = "left";

    let sizes = words.map((word) => {
      const referenceWord = /^\d+$/.test(word) ? "26" : word;
      let sz = 40;
      off.drawingContext.font = `400 ${sz}px ${font}`;
      while (off.drawingContext.measureText(referenceWord).width < availW) {
        sz += 2;
        off.drawingContext.font = `400 ${sz}px ${font}`;
      }
      while (
        sz > 8 &&
        off.drawingContext.measureText(referenceWord).width > availW
      ) {
        sz -= 1;
        off.drawingContext.font = `400 ${sz}px ${font}`;
      }
      return sz;
    });

    const logoRes = bufH * 0.1;
    const textAreaH = bufH - logoRes;

    // Escalar hacia abajo si el bloque de texto desborda verticalmente
    let totalH = sizes.reduce((a, sz) => a + Math.round(sz * leading), 0);
    if (totalH > textAreaH) {
      const scale = textAreaH / totalH;
      sizes = sizes.map((sz) => Math.max(8, Math.round(sz * scale)));
      totalH = sizes.reduce((a, sz) => a + Math.round(sz * leading), 0);
    }

    let y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    for (let i = 0; i < words.length; i++) {
      const weight = /^\d+$/.test(words[i]) ? 700 : 400;
      off.drawingContext.font = `${weight} ${sizes[i]}px ${font}`;
      if (centerFirst && i === 0) {
        off.drawingContext.textAlign = "center";
        off.drawingContext.fillText(words[i], bufW / 2, y);
      } else {
        off.drawingContext.textAlign = "left";
        off.drawingContext.fillText(words[i], leftX, y);
      }
      y += Math.round(sizes[i] * leading);
    }
    off.loadPixels();

    const grid = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = Math.round((c + 0.5) * cW);
        const py = Math.round((r + 0.5) * cH);
        const idx = (py * bufW + px) * 4;
        const d =
          Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB);
        grid[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();
    return grid;
  }

  _sampleLineMask(words, lineIndex, centerFirst = false) {
    const p = this.p;
    const cW = this._cW;
    const cH = this._cH;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const bufW = cols * cW;
    const bufH = rows * cH;
    const [fR, fG, fB] = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const font = `'workfaaad-a', sans-serif`;
    const leftX = bufW * 0.02;
    const availW = bufW * 0.96;
    const leading = 0.82;

    off.drawingContext.textBaseline = "top";
    off.drawingContext.textAlign = "left";

    let sizes = words.map((word) => {
      const referenceWord = /^\d+$/.test(word) ? "26" : word;
      let sz = 40;
      off.drawingContext.font = `400 ${sz}px ${font}`;
      while (off.drawingContext.measureText(referenceWord).width < availW) {
        sz += 2;
        off.drawingContext.font = `400 ${sz}px ${font}`;
      }
      while (
        sz > 8 &&
        off.drawingContext.measureText(referenceWord).width > availW
      ) {
        sz -= 1;
        off.drawingContext.font = `400 ${sz}px ${font}`;
      }
      return sz;
    });

    const logoRes = bufH * 0.1;
    const textAreaH = bufH - logoRes;

    let totalH = sizes.reduce((a, sz) => a + Math.round(sz * leading), 0);
    if (totalH > textAreaH) {
      const scale = textAreaH / totalH;
      sizes = sizes.map((sz) => Math.max(8, Math.round(sz * scale)));
      totalH = sizes.reduce((a, sz) => a + Math.round(sz * leading), 0);
    }

    let y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    const lineYs = [];
    for (let i = 0; i < words.length; i++) {
      lineYs[i] = y;
      y += Math.round(sizes[i] * leading);
    }

    const line = lineIndex;
    const weight = /^\d+$/.test(words[line]) ? 700 : 400;
    off.drawingContext.font = `${weight} ${sizes[line]}px ${font}`;
    if (centerFirst && line === 0) {
      off.drawingContext.textAlign = "center";
      off.drawingContext.fillText(words[line], bufW / 2, lineYs[line]);
    } else {
      off.drawingContext.textAlign = "left";
      off.drawingContext.fillText(words[line], leftX, lineYs[line]);
    }

    off.loadPixels();

    const mask = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = Math.round((c + 0.5) * cW);
        const py = Math.round((r + 0.5) * cH);
        const idx = (py * bufW + px) * 4;
        const d =
          Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB);
        mask[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();
    return mask;
  }

  _init() {
    const p = this.p;
    const s7 = this.state.slide7 || {};
    const fromDay = (s7.fechaVieja || "12").toUpperCase();
    const toDay = (s7.fechaNueva || "XX").toUpperCase();
    const mes = (s7.mes || "MAYO").toUpperCase();

    this._gridFrom = this._sampleText(
      [fromDay, "de " + mes.charAt(0) + mes.slice(1).toLowerCase()],
      true,
    );
    this._gridTo = this._sampleText(
      [toDay, "de " + mes.charAt(0) + mes.slice(1).toLowerCase()],
      false,
    );
    this._staticMask = this._sampleLineMask(
      [fromDay, "de " + mes.charAt(0) + mes.slice(1).toLowerCase()],
      1,
      false,
    );
    this._grid = new Uint8Array(this._gridFrom);

    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const nCh = this._chars.length;
    const [fR, fG, fB] = this.getFg();

    this._palette = [
      [fR, fG, fB],
      [p.random(185, 215), p.random(155, 180), 5],
      [15, p.random(110, 175), p.random(200, 255)],
      [p.random(220, 255), p.random(118, 155), 15],
      [p.random(165, 195), p.random(175, 208), p.random(200, 230)],
      [p.random(215, 255), 15, p.random(148, 195)],
      [p.random(188, 228), p.random(218, 255), 15],
    ];

    const nPal = this._palette.length;
    this._on = new Uint8Array(N);
    this._ch = new Uint8Array(N);
    this._timer = new Uint8Array(N);
    this._ci = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const isText = this._grid[i] === 1;
      this._on[i] = p.random() < (isText ? 0.92 : 0.007) ? 1 : 0;
      this._ch[i] = Math.floor(p.random(nCh));
      this._timer[i] = Math.floor(p.random(1, 26));
      this._ci[i] = isText
        ? p.random() < 0.72
          ? 0
          : Math.floor(p.random(1, nPal))
        : Math.floor(p.random(1, nPal));
    }
    this._rowGlitches = [];
    this._blkGlitches = [];
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const p = this.p;
    const s7 = this.state.slide7 || {};
    const fps = this.state.anim.fps || 30;

    const holdOld = Math.max(1, s7.holdOld ?? 3) * fps;
    const flipDur = Math.max(1, s7.flipDur ?? 2) * fps;
    const holdNew = Math.max(1, s7.holdNew ?? 5) * fps;
    const loopF = Math.round(holdOld + flipDur + holdNew);
    const f = this._frame % loopF;

    // ── Transición del grid entre fechas ──
    if (f === 0) {
      for (let i = 0; i < this._grid.length; i++)
        this._grid[i] = this._gridFrom[i];
    } else if (f >= holdOld && f < holdOld + flipDur) {
      const progress = (f - holdOld) / flipDur;
      const rate = 0.03 + progress * 0.06;
      const N = this._cols * this._rows;
      for (let i = 0; i < N; i++) {
        if (this._grid[i] !== this._gridTo[i] && p.random() < rate) {
          this._grid[i] = this._gridTo[i];
          this._timer[i] = 0;
        }
      }
    } else if (f === Math.round(holdOld + flipDur)) {
      for (let i = 0; i < this._grid.length; i++)
        this._grid[i] = this._gridTo[i];
    }

    // ── Lógica de celdas (idéntica a GlitchOverload) ──
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const spd = Math.max(0.4, (this.state.anim?.speed || 2) * 0.35);
    const nCh = this._chars.length;
    const nPal = this._palette.length;

    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / cols);
      if (this._staticMask[i]) {
        // "de Mayo" - sin variaciones
        this._on[i] = this._grid[i];
        this._ci[i] = 0;
        this._ch[i] = 0;
        continue;
      }
      if (this._timer[i] > 0) {
        this._timer[i]--;
        continue;
      }
      const isText = this._grid[i] === 1;
      this._on[i] = p.random() < (isText ? 0.94 : 0.007) ? 1 : 0;
      this._ch[i] = Math.floor(p.random(nCh));
      this._timer[i] = Math.max(1, Math.floor(p.random(2, 26) / spd));
      if (isText && p.random() < 0.12) {
        this._ci[i] = p.random() < 0.65 ? 0 : Math.floor(p.random(1, nPal));
      }
    }

    this._rowGlitches = this._rowGlitches.filter((g) => --g.life > 0);
    if (p.random() < 0.035) {
      this._rowGlitches.push({
        row: Math.floor(p.random(rows)),
        dxC: Math.floor(p.random(2, 10)) * (p.random() > 0.5 ? 1 : -1),
        life: Math.floor(p.random(1, 4)),
      });
    }

    this._blkGlitches = this._blkGlitches.filter((g) => --g.life > 0);
    if (p.random() < 0.04) {
      this._blkGlitches.push({
        c: Math.floor(p.random(cols)),
        r: Math.floor(p.random(rows)),
        cw: Math.floor(p.random(3, 18)),
        rh: Math.floor(p.random(1, 5)),
        ci: Math.floor(p.random(1, nPal)),
        life: Math.floor(p.random(1, 3)),
      });
    }
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const cW = this._cW;
    const cH = this._cH;
    const cols = this._cols;
    const rows = this._rows;
    const nPal = this._palette.length;

    const [fR, fG, fB] = this.getFg();
    this._palette[0] = [fR, fG, fB];

    ctx.save();
    ctx.font = `700 ${this._fSz}px 'Space Mono', monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    const rowShift = new Map();
    for (const g of this._rowGlitches) {
      rowShift.set(g.row, (rowShift.get(g.row) || 0) + g.dxC * cW);
    }

    const BG_SIZES = [22, 36, 52, 72, 96, 128, 160];
    const bgBatch = { s: [], x: [], y: [], z: [] };
    const txtBatch = Array.from({ length: nPal }, () => ({
      s: [],
      x: [],
      y: [],
    }));

    for (let r = 0; r < rows; r++) {
      const shiftX = rowShift.get(r) || 0;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!this._on[i]) continue;
        const x = c * cW + shiftX;
        if (x < -cW || x > CANVAS_W) continue;
        const ch = this._chars[this._ch[i]];
        const y = r * cH;

        if (this._grid[i] === 0) {
          const sz = BG_SIZES[this._ch[i] % BG_SIZES.length];
          bgBatch.s.push(ch);
          bgBatch.x.push(x);
          bgBatch.y.push(y);
          bgBatch.z.push(sz);
        } else {
          const ci = this._ci[i] % nPal;
          txtBatch[ci].s.push(ch);
          txtBatch[ci].x.push(x);
          txtBatch[ci].y.push(y);
        }
      }
    }

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

    ctx.lineJoin = "round";
    ctx.lineWidth = 0.8;
    for (let ci = 0; ci < nPal; ci++) {
      const buf = txtBatch[ci];
      if (!buf.s.length) continue;
      const [r, g, b] = this._palette[ci];
      const style =
        ci === 0 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},0.92)`;
      ctx.fillStyle = style;
      ctx.strokeStyle = style;
      for (let k = 0; k < buf.s.length; k++) {
        ctx.strokeText(buf.s[k], buf.x[k], buf.y[k]);
        ctx.fillText(buf.s[k], buf.x[k], buf.y[k]);
      }
    }

    for (const g of this._blkGlitches) {
      const [r2, g2, b2] = this._palette[g.ci % nPal];
      ctx.fillStyle = `rgba(${r2},${g2},${b2},0.82)`;
      ctx.fillRect(g.c * cW, g.r * cH, g.cw * cW, g.rh * cH);
    }

    ctx.restore();
    drawDeadlineTopBar(this.p, fR, fG, fB);
    if (typeof drawSlide4Logos === "function") drawSlide4Logos(this.p);
  }

  getPosterAlpha() {
    return 0;
  }
  handleMouse() {}
  reset() {
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this.p.randomSeed(this.seed);
    this.p.noiseSeed(this.seed);
    this._init();
  }
  setParams() {}
}

/* =====================================================
   4. DEADLINE FLIP PIXEL
   Misma lógica de transición de fecha que DeadlineFlip
   pero renderiza píxeles cuadrados (como PixelExplosion)
   en lugar de caracteres ASCII.
   ===================================================== */
class DeadlineFlipPixel extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 10;
    this._gap = 1;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._gridFrom = null;
    this._gridTo = null;
    this._grid = null;
    this._staticMask = null;
    this._dayNumber = null; // solo el número animado
    this._compositeText = null; // PCD 2026, Extensión, Plazo, de Mayo
    this._on = null;
    this._timer = null;
    this._ci = null;
    this._palette = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _sampleText(words, centerFirst = false) {
    const p = this.p;
    const sz = this._cellSz;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const bufW = cols * sz;
    const bufH = rows * sz;
    const [fR, fG, fB] = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const font = `'workfaaad-a', sans-serif`;
    const leftX = bufW * 0.02;
    const availW = bufW * 0.96;
    const leading = 0.82;

    off.drawingContext.textBaseline = "top";
    off.drawingContext.textAlign = "left";

    let sizes = words.map((word) => {
      const referenceWord = /^\d+$/.test(word) ? "26" : word;
      let s = 40;
      off.drawingContext.font = `400 ${s}px ${font}`;
      while (off.drawingContext.measureText(referenceWord).width < availW) {
        s += 2;
        off.drawingContext.font = `400 ${s}px ${font}`;
      }
      while (
        s > 8 &&
        off.drawingContext.measureText(referenceWord).width > availW
      ) {
        s -= 1;
        off.drawingContext.font = `400 ${s}px ${font}`;
      }
      return s;
    });

    const logoRes = bufH * 0.1;
    const textAreaH = bufH - logoRes;
    let totalH = sizes.reduce((a, s) => a + Math.round(s * leading), 0);
    if (totalH > textAreaH) {
      const scale = textAreaH / totalH;
      sizes = sizes.map((s) => Math.max(8, Math.round(s * scale)));
      totalH = sizes.reduce((a, s) => a + Math.round(s * leading), 0);
    }

    let y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    for (let i = 0; i < words.length; i++) {
      const weight = /^\d+$/.test(words[i]) ? 700 : 400;
      off.drawingContext.font = `${weight} ${sizes[i]}px ${font}`;
      if (centerFirst && i === 0) {
        off.drawingContext.textAlign = "center";
        off.drawingContext.fillText(words[i], bufW / 2, y);
      } else {
        off.drawingContext.textAlign = "left";
        off.drawingContext.fillText(words[i], leftX, y);
      }
      y += Math.round(sizes[i] * leading);
    }
    off.loadPixels();

    const grid = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = Math.round((c + 0.5) * sz);
        const py = Math.round((r + 0.5) * sz);
        const idx = (py * bufW + px) * 4;
        const d =
          Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB);
        grid[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();
    return grid;
  }

  _sampleLineMask(words, lineIndex, centerFirst = false) {
    const p = this.p;
    const sz = this._cellSz;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const bufW = cols * sz;
    const bufH = rows * sz;
    const [fR, fG, fB] = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const font = `'workfaaad-a', sans-serif`;
    const leftX = bufW * 0.02;
    const availW = bufW * 0.96;
    const leading = 0.82;

    off.drawingContext.textBaseline = "top";
    off.drawingContext.textAlign = "left";

    let sizes = words.map((word) => {
      const referenceWord = /^\d+$/.test(word) ? "26" : word;
      let sz = 40;
      off.drawingContext.font = `400 ${sz}px ${font}`;
      while (off.drawingContext.measureText(referenceWord).width < availW) {
        sz += 2;
        off.drawingContext.font = `400 ${sz}px ${font}`;
      }
      while (
        sz > 8 &&
        off.drawingContext.measureText(referenceWord).width > availW
      ) {
        sz -= 1;
        off.drawingContext.font = `400 ${sz}px ${font}`;
      }
      return sz;
    });

    const logoRes = bufH * 0.1;
    const textAreaH = bufH - logoRes;

    let totalH = sizes.reduce((a, sz) => a + Math.round(sz * leading), 0);
    if (totalH > textAreaH) {
      const scale = textAreaH / totalH;
      sizes = sizes.map((sz) => Math.max(8, Math.round(sz * scale)));
      totalH = sizes.reduce((a, sz) => a + Math.round(sz * leading), 0);
    }

    let y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    const lineYs = [];
    for (let i = 0; i < words.length; i++) {
      lineYs[i] = y;
      y += Math.round(sizes[i] * leading);
    }

    const line = lineIndex;
    const weight = /^\d+$/.test(words[line]) ? 700 : 400;
    off.drawingContext.font = `${weight} ${sizes[line]}px ${font}`;
    if (centerFirst && line === 0) {
      off.drawingContext.textAlign = "center";
      off.drawingContext.fillText(words[line], bufW / 2, lineYs[line]);
    } else {
      off.drawingContext.textAlign = "left";
      off.drawingContext.fillText(words[line], leftX, lineYs[line]);
    }

    off.loadPixels();

    const mask = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = Math.round((c + 0.5) * sz);
        const py = Math.round((r + 0.5) * sz);
        const idx = (py * bufW + px) * 4;
        const d =
          Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB);
        mask[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();
    return mask;
  }

  _drawCompositeText(header, section1, section2, dayNumber, dayMonth) {
    const p = this.p;
    const ctx = p.drawingContext;
    const bufW = CANVAS_W;
    const bufH = CANVAS_H;
    const [fR, fG, fB] = this.getFg();

    const font = `'workfaaad-a', sans-serif`;
    const centerX = bufW / 2;
    const leading = 1.2;

    ctx.save();
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.fillStyle = `rgb(${fR},${fG},${fB})`;

    const texts = [
      { text: header, size: 24, weight: 400 },
      { text: section1, size: 32, weight: 400 },
      { text: section2, size: 32, weight: 400 },
      { text: dayMonth, size: 24, weight: 400 },
    ];

    const totalH = texts.reduce((a, t) => a + Math.round(t.size * leading), 0);
    const startY = Math.max(bufH * 0.1, Math.floor((bufH - totalH) / 2));

    let y = startY;
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      ctx.font = `${t.weight} ${t.size}px ${font}`;
      ctx.fillText(t.text, centerX, y);
      y += Math.round(t.size * leading);
    }

    ctx.restore();
  }

  _sampleOnlyNumber(number) {
    const p = this.p;
    const sz = this._cellSz;
    const cols = this._cols;
    const rows = this._rows;
    const N = cols * rows;
    const bufW = cols * sz;
    const bufH = rows * sz;
    const [fR, fG, fB] = this.getFg();
    const [bgR, bgG, bgB] = this.getBg();

    const off = p.createGraphics(bufW, bufH);
    off.pixelDensity(1);
    off.background(bgR, bgG, bgB);
    off.drawingContext.fillStyle = `rgb(${fR},${fG},${fB})`;

    const font = `'workfaaad-a', sans-serif`;
    const leftX = bufW * 0.02;
    const availW = bufW * 0.96;

    let sz_text = 40;
    off.drawingContext.font = `700 ${sz_text}px ${font}`;
    while (off.drawingContext.measureText(number).width < availW) {
      sz_text += 2;
      off.drawingContext.font = `700 ${sz_text}px ${font}`;
    }
    while (
      sz_text > 8 &&
      off.drawingContext.measureText(number).width > availW
    ) {
      sz_text -= 1;
      off.drawingContext.font = `700 ${sz_text}px ${font}`;
    }

    const numberH = Math.round(sz_text * 1.2);
    const y = Math.floor((bufH - numberH) / 2);

    off.drawingContext.textBaseline = "top";
    off.drawingContext.textAlign = "center";
    off.drawingContext.fillText(number, bufW / 2, y);
    off.loadPixels();

    const grid = new Uint8Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = Math.round((c + 0.5) * sz);
        const py = Math.round((r + 0.5) * sz);
        const idx = (py * bufW + px) * 4;
        const d =
          Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB);
        grid[r * cols + c] = d > 45 ? 1 : 0;
      }
    }
    off.remove();
    return grid;
  }

  _init() {
    const p = this.p;
    const s7 = this.state.slide7 || {};
    const fromDay = (s7.fechaVieja || "12").toUpperCase();
    const toDay = (s7.fechaNueva || "XX").toUpperCase();
    const mes = (s7.mes || "MAYO").toUpperCase();
    const mesText = "de " + mes.charAt(0) + mes.slice(1).toLowerCase();

    this._dayNumber = { from: fromDay, to: toDay };
    this._compositeText = {
      header: "PCD 2026",
      section1: "Extensión",
      section2: "Plazo",
      dayMonth: mesText,
    };

    this._gridFrom = this._sampleOnlyNumber(fromDay);
    this._gridTo = this._sampleOnlyNumber(toDay);
    this._staticMask = this._sampleOnlyNumber(fromDay);
    this._grid = new Uint8Array(this._gridFrom);

    const [fR, fG, fB] = this.getFg();
    this._palette = [
      [fR, fG, fB],
      [p.random(185, 215), p.random(155, 180), 5],
      [15, p.random(110, 175), p.random(200, 255)],
      [p.random(220, 255), p.random(118, 155), 15],
      [p.random(165, 195), p.random(175, 208), p.random(200, 230)],
      [p.random(215, 255), 15, p.random(148, 195)],
      [p.random(188, 228), p.random(218, 255), 15],
    ];

    const N = this._cols * this._rows;
    this._on = new Uint8Array(N);
    this._timer = new Uint8Array(N);
    this._ci = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const isText = this._grid[i] === 1;
      this._on[i] = p.random() < (isText ? 0.92 : 0.015) ? 1 : 0;
      this._timer[i] = Math.floor(p.random(1, 24));
      this._ci[i] = Math.floor(p.random(this._palette.length));
    }
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const p = this.p;
    const s7 = this.state.slide7 || {};
    const fps = this.state.anim.fps || 30;

    const holdOld = Math.max(1, s7.holdOld ?? 3) * fps;
    const flipDur = Math.max(1, s7.flipDur ?? 2) * fps;
    const holdNew = Math.max(1, s7.holdNew ?? 5) * fps;
    const loopF = Math.round(holdOld + flipDur + holdNew);
    const f = this._frame % loopF;

    if (f === 0) {
      for (let i = 0; i < this._grid.length; i++)
        this._grid[i] = this._gridFrom[i];
    } else if (f >= holdOld && f < holdOld + flipDur) {
      const progress = (f - holdOld) / flipDur;
      const rate = 0.03 + progress * 0.06;
      const N = this._cols * this._rows;
      for (let i = 0; i < N; i++) {
        if (this._grid[i] !== this._gridTo[i] && p.random() < rate) {
          this._grid[i] = this._gridTo[i];
          this._timer[i] = 0;
        }
      }
    } else if (f === Math.round(holdOld + flipDur)) {
      for (let i = 0; i < this._grid.length; i++)
        this._grid[i] = this._gridTo[i];
    }

    const N = this._cols * this._rows;
    const spd = Math.max(0.4, (this.state.anim?.speed || 2) * 0.35);
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / this._cols);
      if (this._staticMask[i]) {
        // "de Mayo" - sin variaciones
        this._on[i] = this._grid[i];
        this._ci[i] = 0;
        continue;
      }
      if (this._timer[i] > 0) {
        this._timer[i]--;
        continue;
      }
      const isText = this._grid[i] === 1;
      this._on[i] = p.random() < (isText ? 0.94 : 0.015) ? 1 : 0;
      this._timer[i] = Math.max(1, Math.floor(p.random(2, 22) / spd));
      if (isText && p.random() < 0.1) {
        this._ci[i] = Math.floor(p.random(this._palette.length));
      }
    }
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const gap = this._gap;
    const cols = this._cols;
    const rows = this._rows;
    const draw = sz - gap;
    const [fR, fG, fB] = this.getFg();
    this._palette[0] = [fR, fG, fB];

    const contrastMode = this.state.anim?.slide4PixelMode === "contrast";

    ctx.save();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!this._on[i] || this._staticMask?.[i]) continue;
        const x = c * sz + gap;
        const y = r * sz + gap;

        if (contrastMode) {
          if (this._grid[i]) {
            const opacity = 0.12 + 0.88 * Math.min(1, this._timer[i] / 20);
            ctx.fillStyle = `rgba(${fR},${fG},${fB},${opacity.toFixed(2)})`;
          } else {
            ctx.fillStyle = `rgba(${fR},${fG},${fB},0.07)`;
          }
        } else {
          const [pr, pg, pb] =
            this._palette[this._ci[i] % this._palette.length];
          ctx.fillStyle = this._grid[i]
            ? `rgb(${pr},${pg},${pb})`
            : `rgba(${pr},${pg},${pb},0.28)`;
        }
        ctx.fillRect(x, y, draw, draw);
      }
    }
    ctx.restore();

    if (this._compositeText && this._dayNumber) {
      const t = this._compositeText;
      const dayNum = this._dayNumber.from; // current day shown
      this._drawCompositeText(
        t.header,
        t.section1,
        t.section2,
        dayNum,
        t.dayMonth,
      );
    }

    if (typeof drawSlide4Logos === "function") drawSlide4Logos(p);
  }

  getPosterAlpha() {
    return 0;
  }
  handleMouse() {}
  reset() {
    this.seed = Math.random() * 99999;
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
  "glitch-overload": GlitchOverload,
  "pixel-explosion": PixelExplosion,
};

/* =====================================================
   REGISTRO DE ANIMACIONES SLIDE 7
   ===================================================== */
const ANIMATIONS_SLIDE7 = {
  "glitch-overload": GlitchOverload, // Cambiado para usar el Hero Visual
  "pixel-explosion": PixelExplosion, // Cambiado para usar el Hero Visual
};
