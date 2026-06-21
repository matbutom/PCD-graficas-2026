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
    const isSlide10 = state.posterSlide === 10;
    // En el A5 del slide 10 usamos una trama más gruesa para que cada
    // carácter que construye las letras sea claramente reconocible.
    this._cW = isSlide8 ? 3 : isSlide10 ? 12 : 6;
    this._cH = isSlide8 ? 5 : isSlide10 ? 20 : 10;
    this._fSz = isSlide8 ? 6 : isSlide10 ? 17 : 9;
    this._textOnly = isSlide10;
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
    const isSlide9 = this.state.posterSlide === 9;
    const wordsToSample = isSlide7
      ? [this.state.slide7.fechaNueva]
      : isSlide9
        ? []
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
    this._palette = getSlide9PaletteList(this.state, [fR, fG, fB]) || this._palette;

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
    if (!this._textOnly && bgBatch.s.length) {
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
      this.state.posterSlide === 8 ||
      this.state.posterSlide === 9;

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
    if (!this._textOnly) {
      for (const g of this._blkGlitches) {
        const [r2, g2, b2] = mono ? [fR, fG, fB] : this._palette[g.ci % nPal];
        ctx.fillStyle = `rgba(${r2},${g2},${b2},0.82)`;
        ctx.fillRect(g.c * cW, g.r * cH, g.cw * cW, g.rh * cH);
      }
    }

    ctx.restore();

    // Dibujamos logos solo si no es la Slide 7 para no ensuciar el diseño de bloque
    if (
      typeof drawSlide4Logos === "function" &&
      ![7, 8, 9, 10].includes(this.state.posterSlide)
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
    this._cellSz =
      state.posterSlide === 8
        ? 5
        : state.posterSlide === 9
          ? 8
          : state.posterSlide === 10
            ? 20
            : 10;
    this._gap = 1;
    this._textOnly = state.posterSlide === 10;
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
    this._palette = getSlide9PaletteList(this.state, [fR, fG, fB]) || this._palette;

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
    const wordsToSample =
      this.state.posterSlide === 9 ? [] : SLIDE4_TITLE;
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

    // 2ª pasada: centrar verticalmente en el área de texto (sin pisar logos)
    const logoRes = bufH * 0.13;
    const textAreaH = bufH - logoRes;
    const totalH = sizes.reduce((acc, sz) => acc + Math.round(sz * leading), 0);
    const commIdx = wordsToSample.indexOf("COMM");
    let y = Math.max(0, Math.floor((textAreaH - totalH) / 2));
    for (let i = 0; i < wordsToSample.length; i++) {
      const xOff = i === commIdx ? -bufW * 0.01 : 0;
      off.drawingContext.font = `900 ${sizes[i]}px ${_font}`;
      off.drawingContext.fillText(wordsToSample[i], leftX + xOff, y);
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

    const mono =
      this.state.posterSlide === 5 || this.state.posterSlide === 10;
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
      ![7, 8, 9, 10].includes(this.state.posterSlide)
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
   5. PIXEL DRIFT
   Campo de píxeles que deriva con ruido suave y parpadeos.
   Diseñado como fondo puro para el slide 9.
   ===================================================== */
function getSlide9PaletteSource() {
  const source =
    typeof WCAG_PALETTES !== "undefined" && WCAG_PALETTES.length
      ? WCAG_PALETTES
      : typeof WCAG_PALETTES_DEF !== "undefined"
        ? WCAG_PALETTES_DEF
        : [];
  return source;
}

function parsePaletteHex(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function getSlide9PaletteList(stateRef, fallbackRgb) {
  if (stateRef.posterSlide !== 9 || !stateRef.slide9?.tintAnimations) {
    return null;
  }
  const source = getSlide9PaletteSource();
  if (!source.length) return null;

  const tint = 0.58;
  return source.map((item) =>
    parsePaletteHex(item.bg).map((v, i) =>
      Math.round(fallbackRgb[i] * (1 - tint) + v * tint),
    ),
  );
}

function getSlide9PaletteRgb(stateRef, key, fallbackRgb) {
  const palette = getSlide9PaletteList(stateRef, fallbackRgb);
  if (!palette) return fallbackRgb;
  return palette[Math.abs(Math.floor(key)) % palette.length];
}

function slide9PaletteFillStyle(stateRef, fallbackRgb, key, alpha) {
  const [r, g, b] =
    stateRef.posterSlide === 9 && stateRef.slide9?.tintAnimations
      ? getSlide9PaletteRgb(stateRef, key, fallbackRgb)
      : fallbackRgb;
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

class PixelDrift extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 12;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    this._frame = 0;
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.012 * speed;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const n = p.noise(c * 0.095 + t, r * 0.095 - t, this.seed);
        const wave = Math.sin((c * 0.28 + r * 0.17) + t * 5);
        const active = n + wave * 0.12 > 0.56;
        if (!active) continue;

        const pulse = 0.18 + 0.54 * Math.max(0, n - 0.45);
        const dx = Math.round(Math.sin(r * 0.21 + t * 7) * 2);
        const dy = Math.round(Math.cos(c * 0.19 + t * 6) * 2);
        const inset = n > 0.72 ? 1 : 3;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 11 + r * 17 + n * 100,
          pulse,
        );
        ctx.fillRect(
          c * sz + inset + dx,
          r * sz + inset + dy,
          sz - inset * 2,
          sz - inset * 2,
        );
      }
    }
    ctx.restore();
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
   6. PIXEL RIGHT ANGLES
   Ángulos monumentales construidos con una retícula de cuadrados.
   Alterna trazos huecos y rellenos, con deriva lenta y revelado por ondas.
   ===================================================== */
class PixelRightAngles extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 12 : 11;
    this._gap = 1.5;
    this._cols = Math.ceil(CANVAS_W / this._cellSz) + 2;
    this._rows = Math.ceil(CANVAS_H / this._cellSz) + 2;
    this._angles = [];
    this._buildAngles();
    p.noiseSeed(this.seed);
  }

  _buildAngles() {
    const p = this.p;
    const minDim = Math.min(CANVAS_W, CANVAS_H);
    const bandsX = 4;
    const bandsY = 3;
    const angles = [];

    p.randomSeed(this.seed);

    // Una pieza por sector garantiza cobertura; el jitter evita una grilla rígida.
    for (let row = 0; row < bandsY; row++) {
      for (let col = 0; col < bandsX; col++) {
        const index = row * bandsX + col;
        const edgePushX =
          col === 0 ? p.random(-0.16, -0.02) :
          col === bandsX - 1 ? p.random(0.02, 0.16) :
          p.random(-0.08, 0.08);
        const edgePushY =
          row === 0 ? p.random(-0.1, 0.03) :
          row === bandsY - 1 ? p.random(0.02, 0.13) :
          p.random(-0.08, 0.08);

        angles.push({
          x:
            CANVAS_W * ((col + 0.5) / bandsX + edgePushX),
          y:
            CANVAS_H * ((row + 0.55) / bandsY + edgePushY),
          rot: p.random(-0.56, -0.25),
          armA: CANVAS_H * p.random(0.42, 0.72),
          armB: CANVAS_W * p.random(0.3, 0.52),
          thick: minDim * p.random(0.08, 0.155),
          outline: index % 2 === 0 ? p.random() > 0.25 : p.random() > 0.68,
          phase: p.random(0, Math.PI * 2),
        });
      }
    }

    // Piezas extra parcialmente fuera del canvas para cerrar huecos en los bordes.
    const edgeAnchors = [
      [-0.12, p.random(0.25, 0.9)],
      [1.12, p.random(0.25, 0.9)],
      [p.random(0.15, 0.85), -0.08],
      [p.random(0.15, 0.85), 1.1],
    ];
    edgeAnchors.forEach(([x, y], index) => {
      angles.push({
        x: CANVAS_W * x,
        y: CANVAS_H * y,
        rot: p.random(-0.58, -0.22),
        armA: CANVAS_H * p.random(0.4, 0.66),
        armB: CANVAS_W * p.random(0.34, 0.5),
        thick: minDim * p.random(0.075, 0.135),
        outline: index % 2 === 0,
        phase: p.random(0, Math.PI * 2),
      });
    });

    this._angles = angles;
  }

  advanceState() {
    if (this.state.playing) this._frame++;
  }

  _insideAngle(lx, ly, armA, armB, thickness) {
    const vertical =
      lx >= -thickness && lx <= 0 && ly >= -armA && ly <= 0;
    const horizontal =
      lx >= -thickness && lx <= armB && ly >= -thickness && ly <= 0;
    return vertical || horizontal;
  }

  _insideInnerAngle(lx, ly, armA, armB, thickness, border) {
    const inner = Math.max(2, thickness - border * 2);
    return this._insideAngle(
      lx + border,
      ly + border,
      Math.max(2, armA - border * 2),
      Math.max(2, armB - border * 2),
      inner,
    );
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.006 * speed;
    const cell = this._cellSz;
    const gap = this._gap;
    const angles = this._angles;

    ctx.save();
    for (let r = -1; r < this._rows; r++) {
      const cy = r * cell + cell * 0.5;
      for (let c = -1; c < this._cols; c++) {
        const cx = c * cell + cell * 0.5;

        for (let i = 0; i < angles.length; i++) {
          const a = angles[i];
          const driftX = Math.sin(t * 0.72 + a.phase) * cell * 3.5;
          const driftY =
            Math.cos(t * 0.54 + a.phase * 0.8) * cell * 4.5 +
            Math.sin(t * 0.18 + a.phase) * CANVAS_H * 0.018;
          const rot = a.rot + Math.sin(t * 0.22 + a.phase) * 0.018;
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          const dx = cx - (a.x + driftX);
          const dy = cy - (a.y + driftY);
          const lx = dx * cos + dy * sin;
          const ly = -dx * sin + dy * cos;

          if (!this._insideAngle(lx, ly, a.armA, a.armB, a.thick)) {
            continue;
          }

          if (
            a.outline &&
            this._insideInnerAngle(lx, ly, a.armA, a.armB, a.thick, cell * 1.35)
          ) {
            continue;
          }

          const progress =
            (lx - ly + a.armA + Math.sin(t + a.phase) * cell * 5) /
            (a.armA + a.armB);
          const reveal = 0.5 + 0.5 * Math.sin(progress * 9 - t * 4 + a.phase);
          const noise = p.noise(
            c * 0.11 + i * 7,
            r * 0.11,
            this.seed + t * 0.12,
          );
          const cut =
            ((c * 13 + r * 7 + i * 5 + Math.floor(t * 8)) % 43 === 0) ||
            (reveal < 0.035 && noise < 0.4);
          if (cut) continue;

          const alpha = a.outline
            ? 0.68 + noise * 0.28
            : 0.34 + reveal * 0.48 + noise * 0.12;
          ctx.fillStyle = slide9PaletteFillStyle(
            this.state,
            [fR, fG, fB],
            i * 101 + c * 7 + r * 17,
            Math.min(0.68, alpha * 0.7),
          );
          ctx.fillRect(
            c * cell + gap,
            r * cell + gap,
            cell - gap * 2,
            cell - gap * 2,
          );
          break;
        }
      }
    }
    ctx.restore();
  }

  getPosterAlpha() {
    return 0;
  }
  handleMouse() {}
  reset() {
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._buildAngles();
    this.p.noiseSeed(this.seed);
  }
  setParams() {}
}

/* =====================================================
   7. SCANLINE PIXELS
   Barridos horizontales de bloques pixelados con cortes glitch.
   Fondo puro para slide 9 y compatible con el selector full-canvas.
   ===================================================== */
class ScanlinePixels extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 9;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._hits = new Uint8Array(this._cols * this._rows);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    this._hits.fill(0);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const p = this.p;
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const scanY = Math.floor(
      ((this._frame * speed * 0.8) % (this._rows + 24)) - 12,
    );

    for (let i = 0; i < this._hits.length; i++) {
      if (this._hits[i] > 0) this._hits[i]--;
    }

    for (let band = -2; band <= 2; band++) {
      const r = scanY + band;
      if (r < 0 || r >= this._rows) continue;
      for (let c = 0; c < this._cols; c++) {
        const n = p.noise(c * 0.08, r * 0.22, this.seed + this._frame * 0.015);
        if (n > 0.45 || p.random() < 0.025) {
          this._hits[r * this._cols + c] = Math.floor(p.random(10, 32));
        }
      }
    }

    if (p.random() < 0.08) {
      const r = Math.floor(p.random(this._rows));
      const start = Math.floor(p.random(this._cols));
      const len = Math.floor(p.random(8, 34));
      for (let c = start; c < Math.min(this._cols, start + len); c++) {
        this._hits[r * this._cols + c] = Math.floor(p.random(8, 24));
      }
    }
  }

  render() {
    const ctx = this.p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const life = this._hits[r * this._cols + c];
        if (!life) continue;
        const alpha = Math.min(0.8, 0.08 + life / 34);
        const w = life > 18 ? sz * 2 : sz - 1;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 13 + r * 19 + life,
          alpha,
        );
        ctx.fillRect(c * sz, r * sz + 1, w, sz - 2);
      }
    }
    ctx.restore();
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
   7. PIXEL PULSE GRID
   Retícula de cuadrados que respira en ondas y ruido.
   ===================================================== */
class PixelPulseGrid extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 18;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.018 * speed;
    const cx = this._cols * 0.5;
    const cy = this._rows * 0.5;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const d = Math.hypot(c - cx, r - cy);
        const n = p.noise(c * 0.16, r * 0.16, this.seed + t * 0.45);
        const wave = Math.sin(d * 0.72 - t * 7.5);
        const level = n * 0.62 + (wave + 1) * 0.22;
        if (level < 0.53) continue;

        const alpha = Math.min(0.34, 0.04 + level * 0.24);
        const inset = Math.max(2, Math.round((1 - level) * 10));
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 7 + r * 23 + level * 10,
          alpha,
        );
        ctx.fillRect(c * sz + inset, r * sz + inset, sz - inset * 2, sz - inset * 2);
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   8. BITSTREAM PIXELS
   Columnas de píxeles que caen con colas cortas y cortes.
   ===================================================== */
class BitstreamPixels extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 11;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._heads = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    this._heads = Array.from({ length: this._cols }, () => ({
      y: p.random(-this._rows, this._rows),
      speed: p.random(0.35, 1.55),
      len: Math.floor(p.random(5, 18)),
      phase: p.random(1000),
    }));
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    for (const h of this._heads) {
      h.y += h.speed * speed * 0.34;
      if (h.y - h.len > this._rows + 2) {
        h.y = -Math.random() * this._rows * 0.35;
        h.speed = this.p.random(0.35, 1.55);
        h.len = Math.floor(this.p.random(5, 18));
      }
    }
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const t = this._frame * 0.05;

    ctx.save();
    for (let c = 0; c < this._cols; c++) {
      const h = this._heads[c];
      const skip = p.noise(c * 0.22, h.phase + t) < 0.18;
      if (skip) continue;

      for (let k = 0; k < h.len; k++) {
        const r = Math.floor(h.y - k);
        if (r < 0 || r >= this._rows) continue;
        if (p.noise(c * 0.35, r * 0.35, this.seed + t) < 0.25) continue;

        const alpha = Math.max(0, 0.72 - k / h.len);
        const width = k === 0 ? sz + 2 : sz - 2;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 17 + r * 5 + k,
          alpha,
        );
        ctx.fillRect(c * sz, r * sz + 1, width, sz - 2);
      }
    }
    ctx.restore();
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
   9. PIXEL CLOUDS
   Manchas de píxeles suaves que se abren y cierran.
   ===================================================== */
class PixelClouds extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 14;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.01 * speed;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const n1 = p.noise(c * 0.075 + t, r * 0.075, this.seed);
        const n2 = p.noise(c * 0.18 - t * 1.3, r * 0.18 + t, this.seed + 300);
        const level = n1 * 0.74 + n2 * 0.26;
        if (level < 0.5) continue;

        const alpha = Math.min(0.62, (level - 0.45) * 1.2);
        const jitterX = Math.round((n2 - 0.5) * 5);
        const jitterY = Math.round((n1 - 0.5) * 5);
        const inset = level > 0.68 ? 2 : 4;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 5 + r * 29 + level * 10,
          alpha,
        );
        ctx.fillRect(
          c * sz + inset + jitterX,
          r * sz + inset + jitterY,
          sz - inset * 2,
          sz - inset * 2,
        );
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   10. PIXEL ORBIT RINGS
   Anillos de píxeles que orbitan desde el centro con ruido.
   ===================================================== */
class PixelOrbitRings extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 12;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.018 * speed;
    const cx = this._cols * 0.5;
    const cy = this._rows * 0.5;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const dx = c - cx;
        const dy = r - cy;
        const dist = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        const ring = Math.sin(dist * 0.92 - t * 7 + Math.sin(ang * 5 + t) * 0.8);
        const n = p.noise(c * 0.12, r * 0.12, this.seed + t * 0.5);
        const level = ring * 0.5 + n * 0.58;
        if (level < 0.58) continue;

        const alpha = Math.min(0.58, 0.08 + level * 0.44);
        const inset = level > 0.78 ? 2 : 4;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 31 + r * 3 + level * 10,
          alpha,
        );
        ctx.fillRect(c * sz + inset, r * sz + inset, sz - inset * 2, sz - inset * 2);
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   11. DIAGONAL PIXEL WAVES
   Bandas diagonales pixeladas que cruzan el canvas.
   ===================================================== */
class DiagonalPixelWaves extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 10;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.022 * speed;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const waveA = Math.sin((c + r) * 0.23 - t * 8);
        const waveB = Math.sin((c - r) * 0.17 + t * 5.5);
        const n = p.noise(c * 0.11 + t, r * 0.11 - t, this.seed);
        const level = waveA * 0.33 + waveB * 0.22 + n * 0.6;
        if (level < 0.52) continue;

        const alpha = Math.min(0.52, 0.06 + level * 0.38);
        const h = level > 0.72 ? sz - 1 : Math.max(3, Math.round(sz * 0.45));
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 19 + r * 11 + level * 10,
          alpha,
        );
        ctx.fillRect(c * sz + 1, r * sz + Math.floor((sz - h) / 2), sz - 2, h);
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   12. MOSAIC PIXEL SHIFT
   Bloques grandes que se desplazan y mutan por ventanas.
   ===================================================== */
class MosaicPixelShift extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 16;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._tiles = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    this._tiles = [];
    for (let i = 0; i < 42; i++) {
      this._tiles.push({
        c: Math.floor(p.random(this._cols)),
        r: Math.floor(p.random(this._rows)),
        w: Math.floor(p.random(3, 12)),
        h: Math.floor(p.random(2, 9)),
        phase: p.random(1000),
      });
    }
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const p = this.p;
    if (this._frame % 18 === 0) {
      const tile = this._tiles[Math.floor(p.random(this._tiles.length))];
      tile.c = Math.floor(p.random(this._cols));
      tile.r = Math.floor(p.random(this._rows));
      tile.w = Math.floor(p.random(3, 12));
      tile.h = Math.floor(p.random(2, 9));
    }
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.015 * speed;

    ctx.save();
    for (const tile of this._tiles) {
      const flicker = p.noise(tile.phase, t * 2.4);
      if (flicker < 0.2) continue;

      const dx = Math.round(Math.sin(tile.phase + t * 5) * 2);
      const dy = Math.round(Math.cos(tile.phase * 0.7 + t * 4) * 2);
      const alpha = Math.min(0.48, 0.06 + flicker * 0.36);
      ctx.fillStyle = slide9PaletteFillStyle(
        this.state,
        [fR, fG, fB],
        tile.c * 13 + tile.r * 7 + tile.phase,
        alpha,
      );

      for (let rr = 0; rr < tile.h; rr++) {
        for (let cc = 0; cc < tile.w; cc++) {
          if (p.noise(cc * 0.5, rr * 0.5, tile.phase + t) < 0.28) continue;
          const x = (tile.c + cc) * sz + 2 + dx;
          const y = (tile.r + rr) * sz + 2 + dy;
          if (x < 0 || y < 0 || x > CANVAS_W || y > CANVAS_H) continue;
          ctx.fillRect(x, y, sz - 4, sz - 4);
        }
      }
    }
    ctx.restore();
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
   13. PIXEL SPARK FIELD
   Puntos pixelados que aparecen, tiemblan y se apagan.
   ===================================================== */
class PixelSparkField extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = 8;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._sparks = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    this._sparks = Array.from({ length: 180 }, () => ({
      c: Math.floor(p.random(this._cols)),
      r: Math.floor(p.random(this._rows)),
      life: Math.floor(p.random(8, 46)),
      maxLife: Math.floor(p.random(28, 62)),
      phase: p.random(1000),
    }));
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const p = this.p;
    const speed = Math.max(0.2, this.state.anim?.speed || 2);

    for (const s of this._sparks) {
      s.life -= speed * 0.4;
      if (s.life <= 0) {
        s.c = Math.floor(p.random(this._cols));
        s.r = Math.floor(p.random(this._rows));
        s.maxLife = Math.floor(p.random(28, 62));
        s.life = s.maxLife;
        s.phase = p.random(1000);
      }
    }
  }

  render() {
    const ctx = this.p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const t = this._frame * 0.08;

    ctx.save();
    for (const s of this._sparks) {
      const age = s.life / s.maxLife;
      const pulse = Math.sin(s.phase + t) * 0.5 + 0.5;
      const alpha = Math.min(0.66, Math.max(0, age * (0.22 + pulse * 0.54)));
      const jitterX = Math.round(Math.sin(s.phase + t * 1.7) * 3);
      const jitterY = Math.round(Math.cos(s.phase * 0.8 + t * 1.3) * 3);
      const scale = pulse > 0.72 ? 2 : 1;
      ctx.fillStyle = slide9PaletteFillStyle(
        this.state,
        [fR, fG, fB],
        s.c * 11 + s.r * 17 + s.phase,
        alpha,
      );
      ctx.fillRect(s.c * sz + jitterX, s.r * sz + jitterY, sz * scale, sz * scale);
    }
    ctx.restore();
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
   14. ORGANIC PIXEL FLOW
   Corrientes orgánicas renderizadas como bloques pixelados.
   ===================================================== */
class OrganicPixelFlow extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 18 : 14;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._particles = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    this._particles = Array.from({ length: 150 }, (_, i) => ({
      x: p.random(CANVAS_W),
      y: p.random(CANVAS_H),
      age: p.random(1000),
      size: Math.floor(p.random(1, 4)),
      phase: p.random(1000) + i * 23,
    }));
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const p = this.p;
    const drift = 0.55 + speed * 0.42;
    for (const particle of this._particles) {
      const n = p.noise(
        particle.x * 0.0028,
        particle.y * 0.0028,
        this.seed + this._frame * 0.004 * speed,
      );
      const angle =
        n * Math.PI * 4 +
        Math.sin(this._frame * 0.01 * speed + particle.phase) * 0.75;
      particle.x += Math.cos(angle) * drift * this._cellSz * 0.42;
      particle.y += Math.sin(angle) * drift * this._cellSz * 0.42;
      particle.age += speed;

      if (
        particle.x < -this._cellSz ||
        particle.y < -this._cellSz ||
        particle.x > CANVAS_W + this._cellSz ||
        particle.y > CANVAS_H + this._cellSz ||
        particle.age > 1200
      ) {
        particle.x = p.random(CANVAS_W);
        particle.y = p.random(CANVAS_H);
        particle.age = 0;
      }
    }
  }

  render() {
    const ctx = this.p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.012 * speed;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (const particle of this._particles) {
      const gx = Math.round(particle.x / sz) * sz;
      const gy = Math.round(particle.y / sz) * sz;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4 + particle.phase);
      const alpha = 0.07 + pulse * 0.28;
      const blocks = particle.size + (pulse > 0.72 ? 1 : 0);
      ctx.fillStyle = slide9PaletteFillStyle(
        this.state,
        [fR, fG, fB],
        particle.phase + this._frame,
        alpha,
      );
      ctx.fillRect(
        gx - Math.floor(blocks / 2) * sz,
        gy - Math.floor(blocks / 2) * sz,
        blocks * sz,
        blocks * sz,
      );
    }
    ctx.restore();
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
   15. CELLULAR PIXEL BLOOM
   Colonias pixeladas que crecen, se contraen y migran lentamente.
   ===================================================== */
class CellularPixelBloom extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 22 : 18;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._blooms = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    this._blooms = Array.from({ length: 26 }, (_, i) => ({
      cx: p.random(this._cols),
      cy: p.random(this._rows),
      radius: p.random(2.2, 7.5),
      density: p.random(0.36, 0.72),
      phase: p.random(1000) + i * 31,
      vx: p.random(-0.012, 0.012),
      vy: p.random(-0.012, 0.012),
    }));
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    for (const bloom of this._blooms) {
      bloom.cx += bloom.vx * speed;
      bloom.cy += bloom.vy * speed;
      if (bloom.cx < -bloom.radius) bloom.cx = this._cols + bloom.radius;
      if (bloom.cy < -bloom.radius) bloom.cy = this._rows + bloom.radius;
      if (bloom.cx > this._cols + bloom.radius) bloom.cx = -bloom.radius;
      if (bloom.cy > this._rows + bloom.radius) bloom.cy = -bloom.radius;
    }
  }

  render() {
    const p = this.p;
    const ctx = this.p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.018 * speed;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (const bloom of this._blooms) {
      const breathing =
        bloom.radius * (0.78 + 0.28 * Math.sin(t * 2.2 + bloom.phase));
      const minC = Math.max(0, Math.floor(bloom.cx - breathing - 1));
      const maxC = Math.min(this._cols - 1, Math.ceil(bloom.cx + breathing + 1));
      const minR = Math.max(0, Math.floor(bloom.cy - breathing - 1));
      const maxR = Math.min(this._rows - 1, Math.ceil(bloom.cy + breathing + 1));

      ctx.fillStyle = slide9PaletteFillStyle(
        this.state,
        [fR, fG, fB],
        bloom.phase,
        0.2,
      );

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const dx = c - bloom.cx;
          const dy = r - bloom.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > breathing) continue;

          const edge = 1 - dist / breathing;
          const n = p.noise(c * 0.18, r * 0.18, bloom.phase + t);
          const alive = n + edge * bloom.density > 0.58;
          if (!alive) continue;

          const alpha = Math.min(0.5, 0.08 + edge * 0.34 + n * 0.08);
          ctx.fillStyle = slide9PaletteFillStyle(
            this.state,
            [fR, fG, fB],
            bloom.phase + c * 13 + r * 17,
            alpha,
          );
          ctx.fillRect(c * sz + 1, r * sz + 1, sz - 2, sz - 2);
        }
      }
    }
    ctx.restore();
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
   16. RIPPLE BIT RAIN
   Gotas verticales que dejan ondas pixeladas al tocar el fondo.
   ===================================================== */
class RippleBitRain extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 12 : 10;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._drops = [];
    this._ripples = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    this._drops = Array.from({ length: 52 }, (_, i) => ({
      c: Math.floor(p.random(this._cols)),
      y: p.random(-this._rows, this._rows),
      speed: p.random(0.45, 1.7),
      len: Math.floor(p.random(3, 11)),
      phase: p.random(1000) + i * 19,
    }));
    this._ripples = [];
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    const p = this.p;
    const speed = Math.max(0.2, this.state.anim?.speed || 2);

    for (const drop of this._drops) {
      drop.y += drop.speed * speed * 0.42;
      if (drop.y > this._rows + drop.len) {
        this._ripples.push({
          c: drop.c,
          r: this._rows - Math.floor(p.random(4, 18)),
          age: 0,
          maxAge: Math.floor(p.random(26, 58)),
          phase: drop.phase,
        });
        drop.c = Math.floor(p.random(this._cols));
        drop.y = -p.random(3, this._rows * 0.45);
        drop.speed = p.random(0.45, 1.7);
        drop.len = Math.floor(p.random(3, 11));
      }
    }

    this._ripples = this._ripples.filter((r) => {
      r.age += speed * 0.38;
      return r.age < r.maxAge;
    });
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();

    ctx.save();
    for (const drop of this._drops) {
      for (let k = 0; k < drop.len; k++) {
        const r = Math.floor(drop.y - k);
        if (r < 0 || r >= this._rows) continue;
        const wobble = Math.round(
          Math.sin(drop.phase + this._frame * 0.08 + k) * 1.5,
        );
        const alpha = Math.max(0.06, 0.62 - k / drop.len);
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          drop.phase + drop.c * 13 + r,
          alpha,
        );
        ctx.fillRect((drop.c + wobble) * sz + 2, r * sz + 2, sz - 4, sz - 4);
      }
    }

    for (const ripple of this._ripples) {
      const progress = ripple.age / ripple.maxAge;
      const radius = 2 + progress * 15;
      const alpha = Math.max(0, (1 - progress) * 0.42);
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
        const c = Math.round(ripple.c + Math.cos(a) * radius * 1.45);
        const r = Math.round(ripple.r + Math.sin(a) * radius * 0.42);
        if (c < 0 || r < 0 || c >= this._cols || r >= this._rows) continue;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          ripple.phase + c * 7 + r * 23,
          alpha,
        );
        ctx.fillRect(c * sz + 1, r * sz + 1, sz - 2, sz - 2);
      }
    }
    ctx.restore();
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
   17. CIRCUIT TRACE PIXELS
   Trazos ortogonales que se encienden como pistas de placa.
   ===================================================== */
class CircuitTracePixels extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 18 : 14;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    this._traces = [];
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
    this._init();
  }

  _init() {
    const p = this.p;
    this._traces = Array.from({ length: 34 }, (_, i) => {
      const horizontal = p.random() > 0.5;
      return {
        c: Math.floor(p.random(this._cols)),
        r: Math.floor(p.random(this._rows)),
        len: Math.floor(p.random(5, 22)),
        horizontal,
        phase: p.random(1000) + i * 37,
        branch: Math.floor(p.random(2, 9)),
      };
    });
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
    if (this._frame % 96 === 0) this._init();
  }

  render() {
    const ctx = this.p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.035 * speed;

    ctx.save();
    for (const trace of this._traces) {
      const head = Math.floor(((t + trace.phase) % 1) * (trace.len + 8));
      for (let i = 0; i < trace.len; i++) {
        const lit = Math.max(0, 1 - Math.abs(i - head) / 7);
        const ghost = 0.06 + 0.12 * Math.sin(t * 3 + trace.phase + i);
        const alpha = Math.min(0.64, Math.max(ghost, lit * 0.58));
        if (alpha < 0.08) continue;
        const c = trace.horizontal ? trace.c + i : trace.c;
        const r = trace.horizontal ? trace.r : trace.r + i;
        if (c < 0 || r < 0 || c >= this._cols || r >= this._rows) continue;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          trace.phase + i,
          alpha,
        );
        ctx.fillRect(c * sz + 3, r * sz + 3, sz - 6, sz - 6);

        if (i === trace.branch) {
          const dir = trace.phase % 2 > 1 ? 1 : -1;
          for (let b = 1; b < 6; b++) {
            const bc = trace.horizontal ? c : c + b * dir;
            const br = trace.horizontal ? r + b * dir : r;
            if (bc < 0 || br < 0 || bc >= this._cols || br >= this._rows)
              continue;
            ctx.fillStyle = slide9PaletteFillStyle(
              this.state,
              [fR, fG, fB],
              trace.phase + b * 17,
              alpha * (1 - b / 7),
            );
            ctx.fillRect(bc * sz + 4, br * sz + 4, sz - 8, sz - 8);
          }
        }
      }
    }
    ctx.restore();
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
   18. DATA TIDE BLOCKS
   Franjas de bloques que suben y bajan como una marea digital.
   ===================================================== */
class DataTideBlocks extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 15 : 12;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.018 * speed;
    const tides = [
      { base: 0.18, ampA: 0.075, ampB: 0.045, width: 8, phase: 0.6, alpha: 0.36 },
      { base: 0.38, ampA: 0.105, ampB: 0.07, width: 11, phase: 2.1, alpha: 0.44 },
      { base: 0.62, ampA: 0.12, ampB: 0.065, width: 12, phase: 4.4, alpha: 0.48 },
      { base: 0.82, ampA: 0.085, ampB: 0.052, width: 9, phase: 6.2, alpha: 0.38 },
    ];

    ctx.save();
    for (let c = 0; c < this._cols; c++) {
      const tideRows = tides.map((wave) => ({
        ...wave,
        row:
          this._rows * wave.base +
          Math.sin(c * 0.19 + t * 3.2 + wave.phase) *
            this._rows *
            wave.ampA +
          Math.sin(c * 0.047 - t * 1.7 + wave.phase * 1.7) *
            this._rows *
            wave.ampB,
      }));

      for (let r = 0; r < this._rows; r++) {
        const n = p.noise(c * 0.12, r * 0.18, this.seed + t);
        let waveLevel = 0;
        let waveAlpha = 0;
        let waveKey = 0;
        for (let i = 0; i < tideRows.length; i++) {
          const wave = tideRows[i];
          const d = Math.abs(r - wave.row);
          const local = Math.max(0, 1 - d / wave.width);
          if (local <= 0) continue;
          const shimmer =
            0.78 +
            0.22 * Math.sin(t * 4.6 + c * 0.31 + r * 0.17 + wave.phase);
          const contribution = local * wave.alpha * shimmer;
          waveLevel += contribution;
          if (contribution > waveAlpha) {
            waveAlpha = contribution;
            waveKey = i * 101;
          }
        }

        const level = waveLevel * 1.65 + n * 0.28;
        if (level < 0.48) continue;
        const alpha = Math.min(0.58, 0.04 + level * 0.38);
        const h = level > 0.78 ? sz - 2 : Math.max(3, Math.round(sz * 0.45));
        const yOffset = Math.floor((sz - h) / 2);
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          waveKey + c * 29 + r * 31 + Math.floor(t * 10),
          alpha,
        );
        ctx.fillRect(c * sz + 1, r * sz + yOffset, sz - 2, h);
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   19. CHROMATIC BIT FOG
   Nubes pixeladas con capas lentas y profundidad suave.
   ===================================================== */
class ChromaticBitFog extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 20 : 16;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.008 * speed;

    ctx.save();
    for (let layer = 0; layer < 3; layer++) {
      const scale = 0.045 + layer * 0.028;
      const threshold = 0.48 + layer * 0.055;
      for (let r = 0; r < this._rows; r++) {
        for (let c = 0; c < this._cols; c++) {
          const n = p.noise(
            c * scale + t * (layer + 1.2),
            r * scale - t * (layer + 0.7),
            this.seed + layer * 200,
          );
          if (n < threshold) continue;
          const alpha = Math.min(0.34, (n - threshold) * (1.15 - layer * 0.16));
          const grow = layer === 0 && n > 0.7 ? 1 : 0;
          const inset = 3 - Math.min(2, layer);
          ctx.fillStyle = slide9PaletteFillStyle(
            this.state,
            [fR, fG, fB],
            layer * 97 + c * 5 + r * 11,
            alpha,
          );
          ctx.fillRect(
            c * sz + inset,
            r * sz + inset,
            sz - inset * 2 + grow * sz,
            sz - inset * 2 + grow * sz,
          );
        }
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   20. DITHER WEAVE TEXTURE
   Trama cruzada con dithering que se desplaza muy lentamente.
   ===================================================== */
class DitherWeaveTexture extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 9 : 7;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.01 * speed;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const diagonalA = (c + r + Math.floor(t * 18)) % 7;
        const diagonalB = (c - r + 900 + Math.floor(t * 11)) % 9;
        const weave = diagonalA === 0 || diagonalB === 0;
        const n = p.noise(c * 0.18, r * 0.18, this.seed + t * 0.6);
        const checker = (c + r + Math.floor(n * 4)) % 2 === 0;
        if (!weave && (!checker || n < 0.62)) continue;

        const alpha = weave ? 0.14 + n * 0.18 : 0.05 + n * 0.12;
        const inset = weave ? 1 : 3;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 3 + r * 17 + diagonalA * 31,
          alpha,
        );
        ctx.fillRect(c * sz + inset, r * sz + inset, sz - inset * 2, sz - inset * 2);
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   21. HALFTONE PIXEL GRAIN
   Grano tipo semitono con clusters cuadrados de tamaño variable.
   ===================================================== */
class HalftonePixelGrain extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 14 : 11;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.006 * speed;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const radial =
          Math.sin(c * 0.16 + t * 2.1) * 0.18 +
          Math.cos(r * 0.13 - t * 1.8) * 0.16;
        const n = p.noise(c * 0.105 + t, r * 0.105 - t, this.seed);
        const level = n + radial;
        if (level < 0.43) continue;

        const size = Math.max(3, Math.round(sz * Math.min(0.95, level)));
        const x = c * sz + Math.floor((sz - size) / 2);
        const y = r * sz + Math.floor((sz - size) / 2);
        const alpha = Math.min(0.42, 0.04 + (level - 0.35) * 0.38);
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 37 + r * 7 + Math.floor(level * 100),
          alpha,
        );
        ctx.fillRect(x, y, size, size);
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   22. MOIRE PIXEL STATIC
   Interferencia de dos tramas pixeladas con estática fina.
   ===================================================== */
class MoirePixelStatic extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 8 : 6;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.014 * speed;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const a = Math.sin(c * 0.28 + r * 0.05 + t * 3.4);
        const b = Math.sin(c * 0.07 - r * 0.24 - t * 2.7);
        const interference = Math.abs(a - b);
        const n = p.noise(c * 0.45, r * 0.45, this.seed + this._frame * 0.04);
        if (interference < 0.22 && n < 0.78) continue;

        const alpha = Math.min(0.34, 0.035 + interference * 0.16 + n * 0.12);
        const wide = interference > 1.3;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 41 + r * 13 + Math.floor(interference * 20),
          alpha,
        );
        ctx.fillRect(c * sz, r * sz, wide ? sz * 2 : sz - 1, sz - 1);
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   23. ERODED PIXEL PAPER
   Manchas planas erosionadas como tinta en papel risográfico.
   ===================================================== */
class ErodedPixelPaper extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 16 : 13;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.004 * speed;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const body = p.noise(c * 0.055 + t, r * 0.055 - t, this.seed);
        const erosion = p.noise(c * 0.38, r * 0.38, this.seed + 400 + t * 3);
        const edge = p.noise(c * 0.12 - t, r * 0.12 + t, this.seed + 900);
        const alive = body > 0.5 && erosion > 0.28;
        const fleck = !alive && body > 0.44 && erosion > 0.78;
        if (!alive && !fleck) continue;

        const alpha = fleck
          ? 0.07 + erosion * 0.12
          : Math.min(0.4, 0.08 + body * 0.22 + edge * 0.08);
        const inset = fleck ? 5 : erosion > 0.55 ? 2 : 4;
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 23 + r * 19 + Math.floor(body * 100),
          alpha,
        );
        ctx.fillRect(c * sz + inset, r * sz + inset, sz - inset * 2, sz - inset * 2);
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   24. WOVEN CODE NOISE
   Hebras horizontales y verticales hechas de bits pixelados.
   ===================================================== */
class WovenCodeNoise extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.seed = Math.random() * 99999;
    this._frame = 0;
    this._cellSz = state.posterSlide === 9 ? 10 : 8;
    this._cols = Math.ceil(CANVAS_W / this._cellSz);
    this._rows = Math.ceil(CANVAS_H / this._cellSz);
    p.randomSeed(this.seed);
    p.noiseSeed(this.seed);
  }

  advanceState() {
    if (!this.state.playing) return;
    this._frame++;
  }

  render() {
    const p = this.p;
    const ctx = p.drawingContext;
    const sz = this._cellSz;
    const [fR, fG, fB] = this.getFg();
    const speed = Math.max(0.2, this.state.anim?.speed || 2);
    const t = this._frame * 0.012 * speed;

    ctx.save();
    for (let r = 0; r < this._rows; r++) {
      const rowThread = Math.sin(r * 0.52 + t * 3.1) > 0.62;
      for (let c = 0; c < this._cols; c++) {
        const colThread = Math.cos(c * 0.47 - t * 2.6) > 0.68;
        const n = p.noise(c * 0.22, r * 0.22, this.seed + t);
        const crossing = rowThread && colThread;
        const bit = ((c * 17 + r * 31 + Math.floor(t * 12)) % 11) < 5;
        if (!crossing && !(bit && (rowThread || colThread) && n > 0.42)) continue;

        const alpha = crossing ? 0.38 + n * 0.16 : 0.08 + n * 0.16;
        const w = rowThread ? sz - 1 : Math.max(3, Math.round(sz * 0.48));
        const h = colThread ? sz - 1 : Math.max(3, Math.round(sz * 0.48));
        ctx.fillStyle = slide9PaletteFillStyle(
          this.state,
          [fR, fG, fB],
          c * 43 + r * 2 + (crossing ? 700 : 0),
          Math.min(0.52, alpha),
        );
        ctx.fillRect(
          c * sz + Math.floor((sz - w) / 2),
          r * sz + Math.floor((sz - h) / 2),
          w,
          h,
        );
      }
    }
    ctx.restore();
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
  }
  setParams() {}
}

/* =====================================================
   REGISTRO DE ANIMACIONES SLIDE 4
   ===================================================== */
const ANIMATIONS_SLIDE4 = {
  "glitch-overload": GlitchOverload,
  "pixel-right-angles": PixelRightAngles,
  "pixel-explosion": PixelExplosion,
  "pixel-drift": PixelDrift,
  "scanline-pixels": ScanlinePixels,
  "pixel-pulse-grid": PixelPulseGrid,
  "bitstream-pixels": BitstreamPixels,
  "pixel-clouds": PixelClouds,
  "pixel-orbit-rings": PixelOrbitRings,
  "diagonal-pixel-waves": DiagonalPixelWaves,
  "mosaic-pixel-shift": MosaicPixelShift,
  "pixel-spark-field": PixelSparkField,
  "organic-pixel-flow": OrganicPixelFlow,
  "cellular-pixel-bloom": CellularPixelBloom,
  "ripple-bit-rain": RippleBitRain,
  "circuit-trace-pixels": CircuitTracePixels,
  "data-tide-blocks": DataTideBlocks,
  "chromatic-bit-fog": ChromaticBitFog,
  "dither-weave-texture": DitherWeaveTexture,
  "halftone-pixel-grain": HalftonePixelGrain,
  "moire-pixel-static": MoirePixelStatic,
  "eroded-pixel-paper": ErodedPixelPaper,
  "woven-code-noise": WovenCodeNoise,
};

/* =====================================================
   REGISTRO DE ANIMACIONES SLIDE 7
   ===================================================== */
const ANIMATIONS_SLIDE7 = {
  "glitch-overload": GlitchOverload, // Cambiado para usar el Hero Visual
  "pixel-right-angles": PixelRightAngles,
  "pixel-explosion": PixelExplosion, // Cambiado para usar el Hero Visual
  "pixel-drift": PixelDrift,
  "scanline-pixels": ScanlinePixels,
  "pixel-pulse-grid": PixelPulseGrid,
  "bitstream-pixels": BitstreamPixels,
  "pixel-clouds": PixelClouds,
  "pixel-orbit-rings": PixelOrbitRings,
  "diagonal-pixel-waves": DiagonalPixelWaves,
  "mosaic-pixel-shift": MosaicPixelShift,
  "pixel-spark-field": PixelSparkField,
  "organic-pixel-flow": OrganicPixelFlow,
  "cellular-pixel-bloom": CellularPixelBloom,
  "ripple-bit-rain": RippleBitRain,
  "circuit-trace-pixels": CircuitTracePixels,
  "data-tide-blocks": DataTideBlocks,
  "chromatic-bit-fog": ChromaticBitFog,
  "dither-weave-texture": DitherWeaveTexture,
  "halftone-pixel-grain": HalftonePixelGrain,
  "moire-pixel-static": MoirePixelStatic,
  "eroded-pixel-paper": ErodedPixelPaper,
  "woven-code-noise": WovenCodeNoise,
};
