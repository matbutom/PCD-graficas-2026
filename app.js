/* =====================================================
   APP.JS — Processing Community Day 2026 Visualizer
   ===================================================== */

/* =====================================================
   CONSTANTES DE FORMATO
   ===================================================== */
const IG_W     = 1080;
const IG_H     = 1350;
const BANNER_W     = 1600;
const BANNER_H     = 400;
const BANNER_SPLIT = 800;   // x split: left text panel | right pixel grid

// 0=bg, 1=fg, 2=mid(35% fg blend) — 16 cols × 10 rows static grid
const BANNER_GRID_PATTERN = [
  [1,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0, 1,0,1,0],
  [1,1,0,0,1,1,0,1,0,1,0,2,0,1,0,1, 1,1,0,0],
  [0,1,1,1,0,0,1,1,0,0,1,1,2,0,1,0, 0,1,1,0],
  [1,0,0,1,1,0,0,1,1,0,1,0,0,2,1,1, 1,0,0,1],
  [1,0,1,0,1,1,0,1,0,1,0,0,1,1,0,2, 1,0,1,1],
  [0,1,0,1,0,1,1,0,1,0,1,2,1,0,1,1, 0,1,0,0],
  [1,1,0,0,1,0,1,1,0,1,1,0,0,1,0,0, 1,1,0,1],
  [0,0,1,1,0,1,0,2,1,0,0,1,1,0,1,1, 0,1,1,0],
  [1,1,0,1,1,0,1,0,0,1,2,0,1,1,0,0, 1,0,0,1],
  [0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0, 0,1,1,0],
];
let _bannerGridData = null; // null = usa BANNER_GRID_PATTERN

/* =====================================================
   PRESETS DE COLOR
   ===================================================== */
const COLOR_PRESETS = [
  { id: 'blanco',   label: 'B/N', bg: '#FFFFFF', fg: '#000000', anim: '#000000' },
  { id: 'negro',    label: 'N/B', bg: '#000000', fg: '#FFFFFF', anim: '#FFFFFF' },
  { id: 'azul',     label: 'AZ',  bg: '#0033FF', fg: '#FFFFFF', anim: '#FFFFFF' },
  { id: 'rojo',     label: 'RJ',  bg: '#FF2200', fg: '#FFFFFF', anim: '#FFFFFF' },
  { id: 'amarillo', label: 'AM',  bg: '#FFEE00', fg: '#111111', anim: '#111111' },
  { id: 'verde',    label: 'VD',  bg: '#00BB44', fg: '#111111', anim: '#111111' },
  { id: 'cyan',     label: 'CY',  bg: '#00DDFF', fg: '#111111', anim: '#111111' },
  { id: 'violeta',  label: 'VL',  bg: '#6600CC', fg: '#FFFFFF', anim: '#FFFFFF' },
  { id: 'naranja',  label: 'NR',  bg: '#FF6600', fg: '#111111', anim: '#111111' },
  { id: 'rosa',     label: 'RS',  bg: '#FF0066', fg: '#FFFFFF', anim: '#FFFFFF' },
];

/* =====================================================
   PALETAS WCAG AA (bg/fg con ratio >= 4.5:1)
   Verificadas programáticamente — las que fallen se excluyen.
   ===================================================== */
const WCAG_PALETTES_DEF = [
  // ── Clásicos ──
  { name: 'Clásico',         bg: '#FFFFFF', fg: '#000000' },
  { name: 'Invertido',       bg: '#000000', fg: '#FFFFFF' },
  { name: 'Azul Processing', bg: '#0033FF', fg: '#FFFFFF' },
  { name: 'Azul claro',      bg: '#E8F0FF', fg: '#0033FF' },
  { name: 'Verde terminal',  bg: '#000000', fg: '#00FF66' },
  { name: 'Ámbar CRT',       bg: '#1A1A1A', fg: '#FFB000' },
  { name: 'Magenta',         bg: '#FFFFFF', fg: '#C2185B' },
  { name: 'Papel',           bg: '#F5F0E8', fg: '#1A1A1A' },
  { name: 'Rojo alerta',     bg: '#FFE500', fg: '#000000' },
  { name: 'Ciberpunk',       bg: '#0A0A14', fg: '#00FFEE' },
  // ── Fluor ──
  { name: 'Fluor Lima',      bg: '#0D0D0D', fg: '#C6FF00' },
  { name: 'Fluor Cyan',      bg: '#0D0D0D', fg: '#00FFD4' },
  { name: 'Fluor Rosa',      bg: '#0D0D0D', fg: '#FF70E0' },
  { name: 'Fluor Naranja',   bg: '#111111', fg: '#FF9500' },
  { name: 'Fluor Violeta',   bg: '#0D0D0D', fg: '#C280FF' },
  { name: 'Fluor Rojo',      bg: '#0D0D0D', fg: '#FF3C3C' },
  { name: 'Night Neon',      bg: '#050510', fg: '#7FFF00' },
  { name: 'Tokyo Night',     bg: '#13131F', fg: '#40E0FF' },
  // ── Pasteles ──
  { name: 'Lavanda',         bg: '#EDE0FF', fg: '#2E0080' },
  { name: 'Menta',           bg: '#D8FFF0', fg: '#004830' },
  { name: 'Melocotón',       bg: '#FFF0E6', fg: '#6B2500' },
  { name: 'Cielo',           bg: '#D8F0FF', fg: '#003070' },
  { name: 'Rosa polvo',      bg: '#FFE8F5', fg: '#6B0038' },
  { name: 'Crema',           bg: '#FFFBE6', fg: '#3D2B00' },
  { name: 'Sage',            bg: '#E8F5E9', fg: '#1B3A21' },
  { name: 'Coral',           bg: '#FFF0EE', fg: '#7A1A0A' },
];
// Populated after WCAG functions are defined (see bottom of file)
let WCAG_PALETTES = [];

/* =====================================================
   CONTENIDO FIJO
   ===================================================== */
const TITLE_LINES = ['/*Processing', '/*Community', '/*Day — 2026'];

const INFO_LINES = [
  'Evento: Processing Community Day',
  'Postula: Proyectos de programación creativa e interacción digital',
  'Lugar: Salvador Sanfuentes 2221',
  'Descripción: Sé parte del evento que busca visibilizar prácticas emergentes, conectar comunidad, academia e industria y generar un espacio de encuentro en torno al uso creativo del código.',
  'Llamado a: Estudiantes pre/postgrado, Investigadores, Creadores, Equipos interdisciplinarios',
  'Fecha apertura convocatoria: 17 Abril 2026',
  'Fecha cierre convocatoria: 12 Mayo 2026'
];

/* =====================================================
   LAYOUT DEFAULT
   ===================================================== */
const DEFAULT_LAYOUT = {
  title: { colStart: 0, colSpan: 3, rowStart: 4, rowSpan: 2 },
  info:  { colStart: 0, colSpan: 3, rowStart: 0, rowSpan: 3 }
};

/* =====================================================
   ESTADO GLOBAL
   ===================================================== */
const state = {
  preset: {
    activeId:    'blanco',
    bg:          '#FFFFFF',
    fg:          '#000000',
    animColor:   '#000000',
    bubbleFg:    '#000000',  // color de texto dentro de animaciones
    animOpacity: 80,
    gridOpacity: 35
  },

  // Tipografía fija — no configurable desde UI
  title: {
    font:          'workfaaad-b',
    size:          146,
    weight:        'bold',
    letterSpacing: 0,
    lineHeight:    0.8,
    alignH:        'right'
  },

  infoBlock: {
    font:          'Necto Mono',
    size:          22,
    weight:        'bold',
    letterSpacing: 0,
    lineHeight:    1.5,
    alignH:        'left'
  },

  meta: {
    topLeft:     '1080×1350',
    topRight:    'p5.js — v1.9',
    bottomLeft:  'Processing Community Day 2026',
    bottomRight: 'Santiago, Chile'
  },

  grid: {
    show:   true,
    cols:   3,
    rows:   6,
    weight: 1
  },

  layout: {
    margin: MARGIN,
    blocks: {
      title: { colStart: 0, colSpan: 3, rowStart: 4, rowSpan: 2 },
      info:  { colStart: 0, colSpan: 3, rowStart: 0, rowSpan: 3 }
    }
  },

  anim: {
    current:     'letter-physics',
    speed:       2.0,
    fps:         30,
    opacity:     80,
    seed:        42,
    textSize:    48,
    fullCanvas:  true,
    font:        'Space Mono',
    fontWeight:  '700',
    blendMode:   'source-over',
    params: {
      'letter-physics': {
        text:       'CONVOCATORIA ABIERTA',
        circleSize: 38,
        gravity:    0,
        friction:   0.992,
        repulsion:  240,
        showLabels: false
      },
      'particle-network': {
        count:     100,
        distance:  130,
        speed:     2.5,
        pointSize: 3
      },
      'flow-field': {
        noiseScale:  0.004,
        trailLength: 60,
        speed:       4.0
      },
      'grid-distortion': {
        density:   28,
        radius:    180,
        force:     180,
        showLines: true
      },
      'bouncing-shapes': {
        count:      20,
        size:       32,
        gravity:    1.2,
        elasticity: 0.92,
        shapes:     { circle: true, square: true, triangle: true }
      },
      'wave-interference': {
        emitters:   3,
        frequency:  0.05,
        amplitude:  70,
        resolution: 4
      },
      'code-rain': {
        dropSpeed: 6.0,
        density:   30,
        charset:   'p5js'
      },
      'constellation': {
        count:     100,
        distance:  150,
        speed:     1.8,
        pointSize: 3
      },
      'elastic-mesh': {
        resX:       12,
        resY:       15,
        stiffness:  0.1,
        damping:    0.88,
        lineWeight: 0.8
      },
      'rotating-typography': {
        text:         'PROCESSING COMMUNITY DAY 2026',
        speed:        3.0,
        letterSize:   44,
        distribution: 'grid'
      },
      'glyph-flow-field': {
        speed:         2.5,
        particleSize:  1.5,
        trailAlpha:    12
      },
      'slot-drum-typography': {
        spinMinHz:  8,
        spinMaxHz:  12,
        overshoot:  0.08,
        pulseScale: 0.03
      }
    }
  },

  showGuides: false,
  playing:    true,
  format:     'ig'
};

// Últimos colores válidos (usados para revertir cambios que rompen WCAG AA)
let lastValidBg = '#FFFFFF';
let lastValidFg = '#000000';

/* =====================================================
   p5.js — INSTANCIA Y SKETCH
   ===================================================== */
let p5Instance       = null;
let currentAnimation = null;
let fpsFrames        = 0;
let fpsLastTime      = performance.now();

let fadeOpacity  = 1;
let fadingOut    = false;
let fadingIn     = false;
let nextAnimName = null;

const sketch = (p) => {

  p.setup = () => {
    const cv = p.createCanvas(CANVAS_W, CANVAS_H);
    cv.parent('canvas-container');
    p.frameRate(state.anim.fps);
    p.pixelDensity(1);
    p.colorMode(p.RGB, 255);
    initAnimation();
  };

  p.draw = () => {
    fpsFrames++;
    const now = performance.now();
    if (now - fpsLastTime >= 600) {
      const fps = Math.round(fpsFrames / ((now - fpsLastTime) / 1000));
      const el  = document.getElementById('fps-display');
      if (el) el.textContent = fps + ' fps';
      fpsFrames   = 0;
      fpsLastTime = now;
    }

    const [bgR, bgG, bgB] = hexRgb(state.preset.bg);
    p.background(bgR, bgG, bgB);

    if (currentAnimation && state.format !== 'banner') {
      p.push();
      const opa = (state.anim.opacity / 100) * fadeOpacity;
      p.drawingContext.globalAlpha = Math.max(0, Math.min(1, opa));
      p.drawingContext.globalCompositeOperation = state.anim.blendMode || 'source-over';
      currentAnimation.draw();
      p.drawingContext.globalCompositeOperation = 'source-over';
      p.drawingContext.globalAlpha = 1;
      p.pop();
    }

    const posterAlpha = currentAnimation?.getPosterAlpha?.() ?? 1;
    if (posterAlpha > 0.004) {
      p.drawingContext.globalAlpha = posterAlpha;
      if (state.format === 'banner') {
        drawBannerContent(p);
      } else {
        drawEditorialContent(p);
      }
      p.drawingContext.globalAlpha = 1;
    }

    if (fadingOut || fadingIn) tickFade(p);
  };

  p.mouseMoved    = () => dispatchMouse(p, 'move');
  p.mouseDragged  = () => dispatchMouse(p, 'drag');
  p.mousePressed  = () => dispatchMouse(p, 'press');
  p.mouseReleased = () => dispatchMouse(p, 'release');

  // Touch — mapea al mismo dispatch, p5 traduce touches[0] a mouseX/mouseY
  p.touchMoved    = () => { dispatchMouse(p, 'drag');    return false; };
  p.touchStarted  = () => { dispatchMouse(p, 'press');   return false; };
  p.touchEnded    = () => { dispatchMouse(p, 'release'); return false; };
};

function dispatchMouse(p, type) {
  if (!currentAnimation) return;
  const canvasEl = document.querySelector('#canvas-container canvas');
  if (!canvasEl) return;
  const scaleX = CANVAS_W / canvasEl.offsetWidth;
  const scaleY = CANVAS_H / canvasEl.offsetHeight;
  currentAnimation.handleMouse(p.mouseX * scaleX, p.mouseY * scaleY, type);
}

function initAnimation() {
  const AnimClass = ANIMATIONS[state.anim.current];
  if (!AnimClass || !p5Instance) return;
  currentAnimation = new AnimClass(p5Instance, state);
}

function switchAnimation(name) {
  if (name === state.anim.current) return;
  nextAnimName = name;
  fadingOut    = true;
  fadingIn     = false;
  fadeOpacity  = 1;
}

function tickFade(p) {
  const step = 0.08;
  if (fadingOut) {
    fadeOpacity -= step;
    if (fadeOpacity <= 0) {
      fadeOpacity        = 0;
      state.anim.current = nextAnimName;
      nextAnimName       = null;
      initAnimation();
      fadingOut = false;
      fadingIn  = true;
    }
  } else if (fadingIn) {
    fadeOpacity += step;
    if (fadeOpacity >= 1) {
      fadeOpacity = 1;
      fadingIn    = false;
    }
  }
}

/* =====================================================
   SISTEMA DE GRILLA
   ===================================================== */
function getCellRect(colStart, rowStart, colSpan, rowSpan) {
  const m     = state.layout.margin;
  const gridX = m;
  const gridY = m;
  const gridW = CANVAS_W - 2 * m;
  const gridH = CANVAS_H - 2 * m;
  const cellW = gridW / state.grid.cols;
  const cellH = gridH / state.grid.rows;
  return {
    x: gridX + colStart * cellW,
    y: gridY + rowStart * cellH,
    w: colSpan  * cellW,
    h: rowSpan  * cellH
  };
}

function drawBlockInCell(p, cellRect, drawFn) {
  p.push();
  p.drawingContext.save();
  p.drawingContext.beginPath();
  p.drawingContext.rect(cellRect.x, cellRect.y, cellRect.w, cellRect.h);
  p.drawingContext.clip();
  drawFn();
  p.drawingContext.restore();
  p.pop();
}

/* =====================================================
   RANDOMIZACIÓN DE LAYOUT
   ===================================================== */
function seededRandom(seed) {
  let s = (seed ^ 0x12345678) >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function randomizeLayout() {
  const rng  = () => Math.random();
  const cols = state.grid.cols;
  const rows = state.grid.rows;

  const titleColSpan = Math.min(cols, 2 + Math.floor(rng() * 2));
  const titleRowSpan = 1 + Math.round(rng());
  const infoColSpan  = Math.min(cols, 1 + Math.floor(rng() * 3));
  const infoRowSpan  = Math.min(rows, 2 + Math.floor(rng() * 3));

  const blocks = [
    { id: 'title', colSpan: titleColSpan, rowSpan: titleRowSpan },
    { id: 'info',  colSpan: infoColSpan,  rowSpan: infoRowSpan  }
  ];

  const occupied = Array.from({ length: rows }, () => new Array(cols).fill(false));

  for (const block of blocks) {
    const { colSpan, rowSpan } = block;
    const maxCol = cols - colSpan;
    const maxRow = rows - rowSpan;
    let placed = false;

    if (maxCol >= 0 && maxRow >= 0) {
      for (let attempt = 0; attempt < 80; attempt++) {
        const colStart = Math.floor(rng() * (maxCol + 1));
        const rowStart = Math.floor(rng() * (maxRow + 1));

        let free = true;
        for (let r = rowStart; r < rowStart + rowSpan && free; r++) {
          for (let c = colStart; c < colStart + colSpan && free; c++) {
            if (occupied[r] && occupied[r][c]) free = false;
          }
        }

        if (free) {
          for (let r = rowStart; r < rowStart + rowSpan; r++) {
            for (let c = colStart; c < colStart + colSpan; c++) {
              if (occupied[r]) occupied[r][c] = true;
            }
          }
          state.layout.blocks[block.id] = { colStart, colSpan, rowStart, rowSpan };
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      state.layout.blocks[block.id] = { ...DEFAULT_LAYOUT[block.id] };
    }
  }
}

function resetLayout() {
  state.layout.blocks.title = { ...DEFAULT_LAYOUT.title };
  state.layout.blocks.info  = { ...DEFAULT_LAYOUT.info };
}

function randomizeBannerGrid() {
  const cols = BANNER_GRID_PATTERN[0].length;
  const rows = BANNER_GRID_PATTERN.length;
  _bannerGridData = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => {
      const r = Math.random();
      return r < 0.44 ? 0 : r < 0.88 ? 1 : 2;
    })
  );
}

/* =====================================================
   LOGOS — Carga y render
   ===================================================== */
const LOGOS_H   = 120;  // altura en px del canvas
const LOGO_ORDER = ['faaad', 'LID', 'crtic', 'processingFoundation'];

let _logosSvgText  = {};
let _logosImgCache = {};

async function initLogos() {
  for (const name of LOGO_ORDER) {
    try {
      const r = await fetch(`assets/${name}.svg`);
      _logosSvgText[name] = await r.text();
    } catch(e) {
      console.warn('Logo no cargado:', name, e);
    }
  }
  const fg = state.preset.fg;
  for (const name of LOGO_ORDER) {
    _buildLogoImg(name, fg);
  }
}

// Colores originales del logo Processing y su luminancia perceptual
const _PROCESSING_COLORS = [
  { from: '#d4b2fe', L: 0.771 },   // cls-1 — lavanda claro
  { from: '#5501a4', L: 0.174 },   // cls-2 — púrpura oscuro
  { from: '#9c4bff', L: 0.469 },   // cls-3 — púrpura medio
];

function _buildLogoImg(name, fillColor) {
  if (!_logosSvgText[name]) return;
  let svg = _logosSvgText[name];

  if (fillColor) {
    if (name === 'processingFoundation') {
      // Mapear cada color original → mezcla de fg/bg preservando luminancia
      // color_nuevo = bg × L + fg × (1 − L)
      // → claro sigue claro, oscuro sigue oscuro, pero con los colores del tema
      const fg = hexRgb(fillColor);
      const bg = hexRgb(state.preset.bg);
      for (const { from, L } of _PROCESSING_COLORS) {
        const r = Math.round(bg[0] * L + fg[0] * (1 - L));
        const g = Math.round(bg[1] * L + fg[1] * (1 - L));
        const b = Math.round(bg[2] * L + fg[2] * (1 - L));
        const to = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        svg = svg.replaceAll(from, to);
      }
    } else {
      svg = svg.replace(/(<svg\b[^>]*)>/, `$1 fill="${fillColor}">`);
    }
  }

  const prev = _logosImgCache[name];
  if (prev && prev._url) URL.revokeObjectURL(prev._url);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img._url   = url;
  img.src    = url;
  _logosImgCache[name] = { img, color: fillColor, bg: state.preset.bg, _url: url };
}

function drawLogos(p) {
  const m   = state.layout.margin;
  const fg  = state.preset.fg;

  // Regenerar logos si cambiaron fg o bg
  const bg = state.preset.bg;
  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    const stale = !c || c.color !== fg || (name === 'processingFoundation' && c.bg !== bg);
    if (stale) _buildLogoImg(name, fg);
  }

  const ctx    = p.drawingContext;
  const pad    = 14;                      // margen vertical arriba y abajo
  const hPad   = -60;                      // margen lateral extra izquierda y derecha
  const logoH  = LOGOS_H - 2 * pad;      // todos los logos a la misma altura
  const totalW = CANVAS_W - 2 * m - 2 * hPad;  // ancho disponible con margen lateral

  // Escala individual por logo (1.0 = altura completa)
  const LOGO_SCALE = {
    faaad:                0.80,
    LID:                  0.80,
    crtic:                1.0,
    processingFoundation: 1.0
  };

  // Calcular dimensiones de cada logo a su altura escalada, centrado verticalmente
  const logoData = LOGO_ORDER.map(name => {
    const c = _logosImgCache[name];
    if (!c || !c.img.complete || c.img.naturalWidth === 0) return { w: 0, h: 0, yOff: 0 };
    const scale  = LOGO_SCALE[name] ?? 1.0;
    const h      = logoH * scale;
    const w      = h * (c.img.naturalWidth / c.img.naturalHeight);
    const yOff   = (logoH - h) / 2;  // centrado vertical dentro del strip
    return { w, h, yOff };
  });

  const totalLogosW = logoData.reduce((a, d) => a + d.w, 0);
  const nGaps = LOGO_ORDER.length + 1;
  const gap   = Math.max(pad, (totalW - totalLogosW) / nGaps);

  const iyBase = m + pad;
  let x = m + hPad + gap;

  for (let i = 0; i < LOGO_ORDER.length; i++) {
    const c = _logosImgCache[LOGO_ORDER[i]];
    const d = logoData[i];
    if (c && c.img.complete && c.img.naturalWidth > 0 && d.w > 0) {
      ctx.drawImage(c.img, x, iyBase + d.yOff, d.w, d.h);
    }
    x += d.w + gap;
  }
}

/* =====================================================
   RENDER EDITORIAL
   ===================================================== */
function drawEditorialContent(p) {
  if (state.grid.show) drawGrid(p);
  drawLogos(p);
  drawInfoBlock(p);
  drawTitle(p);
  if (state.showGuides) drawGuides(p);
}

/* =====================================================
   BANNER CONTENT
   ===================================================== */
function drawBannerContent(p) {
  drawBannerPixelGrid(p);
  drawBannerDecorations(p);
  drawBannerTitle(p);
  drawBannerLogos(p);
  if (state.showGuides) drawGuides(p);
}

function drawBannerPixelGrid(p) {
  const [bgR, bgG, bgB] = hexRgb(state.preset.bg);
  const [fgR, fgG, fgB] = hexRgb(state.preset.fg);
  const MID = 0.35;
  const midR = Math.round(bgR * (1 - MID) + fgR * MID);
  const midG = Math.round(bgG * (1 - MID) + fgG * MID);
  const midB = Math.round(bgB * (1 - MID) + fgB * MID);

  const grid      = _bannerGridData || BANNER_GRID_PATTERN;
  const cols      = grid[0].length;
  const rows      = grid.length;
  const cell      = CANVAS_H / rows; // square cells
  const skipRows  = 3; // bottom rows reserved for logos

  p.push();
  p.noStroke();
  for (let r = 0; r < rows - skipRows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (val === 1) p.fill(fgR, fgG, fgB);
      else           p.fill(midR, midG, midB);
      p.rect(BANNER_SPLIT + c * cell, r * cell, cell + 0.5, cell + 0.5);
    }
  }
  p.pop();
}

function drawBannerDecorations(p) {
  const [fR, fG, fB] = hexRgb(state.preset.fg);
  const fontSize = 120;
  const lh       = fontSize * state.title.lineHeight * 1.4;
  const stripH   = 85;
  const totalH   = 3 * lh;
  const startY   = Math.max(20, (CANVAS_H - stripH - totalH) / 2);
  const decSize  = 75;

  p.push();
  p.noStroke();
  p.drawingContext.font          = `700 ${decSize}px '${state.title.font}', monospace`;
  p.drawingContext.letterSpacing = '0px';
  p.drawingContext.textBaseline  = 'top';
  p.drawingContext.textAlign     = 'left';
  p.drawingContext.fillStyle     = `rgba(${fR},${fG},${fB},0.3)`;

  for (let i = 0; i < 3; i++) {
    p.drawingContext.fillText('/*', 10, startY + i * lh);
  }
  p.pop();
}

function drawBannerLogos(p) {
  const m  = state.layout.margin;
  const fg = state.preset.fg;
  const bg = state.preset.bg;

  for (const name of LOGO_ORDER) {
    const c     = _logosImgCache[name];
    const stale = !c || c.color !== fg || (name === 'processingFoundation' && c.bg !== bg);
    if (stale) _buildLogoImg(name, fg);
  }

  const ctx    = p.drawingContext;
  const grid   = _bannerGridData || BANNER_GRID_PATTERN;
  const cellH  = CANVAS_H / grid.length;
  const stripH = 3 * cellH;
  const y0     = CANVAS_H - stripH;
  const pad    = 16;
  const logoH  = stripH * 0.6;
  const xStart = BANNER_SPLIT;
  const availW = CANVAS_W - xStart - m - pad;

  const LOGO_SCALE = { faaad: 0.80, LID: 0.80, crtic: 1.0, processingFoundation: 1.0 };

  const logoData = LOGO_ORDER.map(name => {
    const c = _logosImgCache[name];
    if (!c || !c.img.complete || c.img.naturalWidth === 0) return { w: 0, h: 0, yOff: 0 };
    const scale = LOGO_SCALE[name] ?? 1.0;
    const h     = logoH * scale;
    const w     = h * (c.img.naturalWidth / c.img.naturalHeight);
    const yOff  = (logoH - h) / 2;
    return { w, h, yOff };
  });

  const totalLogosW = logoData.reduce((a, d) => a + d.w, 0);
  const gap         = Math.max(pad, (availW - totalLogosW) / (LOGO_ORDER.length - 1));

  let x = xStart;
  for (let i = 0; i < LOGO_ORDER.length; i++) {
    const c = _logosImgCache[LOGO_ORDER[i]];
    const d = logoData[i];
    if (c && c.img.complete && c.img.naturalWidth > 0 && d.w > 0) {
      ctx.drawImage(c.img, x, y0 + pad + d.yOff + 10, d.w, d.h);
    }
    x += d.w + gap;
  }
}

function drawBannerTitle(p) {
  const [fR, fG, fB] = hexRgb(state.preset.fg);
  const m        = state.layout.margin;
  const fontSize = 115;
  const lh       = fontSize * state.title.lineHeight * 1.4;
  const stripH   = 85;
  const totalH   = 3 * lh;
  const startY   = Math.max(20, (CANVAS_H - stripH - totalH) / 2);
  const x        = 110;
  const lines    = ['Processing', 'Community', 'Day \u2014 2026'];

  p.noStroke();
  p.drawingContext.font          = `700 ${fontSize}px '${state.title.font}', monospace`;
  p.drawingContext.letterSpacing = '0px';
  p.drawingContext.textBaseline  = 'top';
  p.drawingContext.textAlign     = 'left';
  p.drawingContext.fillStyle     = `rgba(${fR},${fG},${fB},1)`;

  for (let i = 0; i < lines.length; i++) {
    p.drawingContext.fillText(lines[i], x, startY + i * lh);
  }
  p.drawingContext.letterSpacing = '0px';
}

/* =====================================================
   FORMATO — Cambio IG ↔ Banner
   ===================================================== */
function switchFormat(fmt) {
  if (fmt === state.format) return;
  state.format = fmt;
  const w = fmt === 'banner' ? BANNER_W : IG_W;
  const h = fmt === 'banner' ? BANNER_H : IG_H;
  setCanvasSize(w, h);
  if (p5Instance) p5Instance.resizeCanvas(w, h);
  state.meta.topLeft = `${w}×${h}`;
  const resBadge = document.getElementById('res-badge');
  if (resBadge) resBadge.textContent = `${w} × ${h} px`;
  resizeCanvasWrapper();
  if (currentAnimation) currentAnimation.reset();
}

function drawGrid(p) {
  const { cols, rows, weight } = state.grid;
  const m    = state.layout.margin;
  const gx   = m;
  const gy   = m;
  const gw   = CANVAS_W - 2 * m;
  const gh   = CANVAS_H - 2 * m;
  const opa  = state.preset.gridOpacity;
  const [fR, fG, fB] = hexRgb(state.preset.fg);

  p.push();
  p.stroke(fR, fG, fB, (opa / 100) * 255);
  p.strokeWeight(weight);
  p.noFill();
  for (let i = 0; i <= cols; i++) {
    const x = gx + (gw / cols) * i;
    p.line(x, gy, x, gy + gh);
  }
  for (let i = 0; i <= rows; i++) {
    const y = gy + (gh / rows) * i;
    p.line(gx, y, gx + gw, y);
  }
  p.pop();
}

function drawTopBar(p) {
  const h = ZONES.topBar.h;
  const m = state.layout.margin;
  const [bR, bG, bB] = hexRgb(state.preset.bg);
  const [fR, fG, fB] = hexRgb(state.preset.fg);

  p.push();
  p.noStroke();
  p.fill(bR, bG, bB, 220);
  p.rect(0, 0, CANVAS_W, h);

  p.stroke(fR, fG, fB, 60);
  p.strokeWeight(0.5);
  p.line(m, h - 1, CANVAS_W - m, h - 1);

  p.noStroke();
  p.drawingContext.font         = `400 11px 'Necto Mono', monospace`;
  p.drawingContext.fillStyle    = `rgba(${fR},${fG},${fB},0.6)`;
  p.drawingContext.textBaseline = 'middle';
  p.drawingContext.textAlign    = 'left';
  p.drawingContext.fillText(state.meta.topLeft,  m, h / 2);
  p.drawingContext.textAlign = 'right';
  p.drawingContext.fillText(state.meta.topRight, CANVAS_W - m, h / 2);
  p.pop();
}

function drawBottomBar(p) {
  const y = ZONES.bottomBar.y;
  const h = ZONES.bottomBar.h;
  const m = state.layout.margin;
  const [bR, bG, bB] = hexRgb(state.preset.bg);
  const [fR, fG, fB] = hexRgb(state.preset.fg);

  p.push();
  p.noStroke();
  p.fill(bR, bG, bB, 220);
  p.rect(0, y, CANVAS_W, h);

  p.stroke(fR, fG, fB, 60);
  p.strokeWeight(0.5);
  p.line(m, y + 1, CANVAS_W - m, y + 1);

  p.noStroke();
  p.drawingContext.font         = `400 11px 'Necto Mono', monospace`;
  p.drawingContext.fillStyle    = `rgba(${fR},${fG},${fB},0.6)`;
  p.drawingContext.textBaseline = 'middle';
  p.drawingContext.textAlign    = 'left';
  p.drawingContext.fillText(state.meta.bottomLeft,  m, y + h / 2);
  p.drawingContext.textAlign = 'right';
  p.drawingContext.fillText(state.meta.bottomRight, CANVAS_W - m, y + h / 2);
  p.pop();
}

function drawTitle(p) {
  const { font, size, weight, lineHeight, alignH } = state.title;
  const b    = state.layout.blocks.title;
  const cell = getCellRect(b.colStart, b.rowStart, b.colSpan, b.rowSpan);
  const [fR, fG, fB] = hexRgb(state.preset.fg);

  drawBlockInCell(p, cell, () => {
    const weightNum = weight === 'black' ? '900' : weight === 'bold' ? '700' : '400';
    const fontStr   = `${weightNum} ${size}px '${font}', monospace`;
    const lh        = size * lineHeight * 1.2;
    const totalH    = TITLE_LINES.length * lh;
    const x         = cell.x + 8;
    const maxW      = cell.w - 16;

    p.noStroke();
    p.drawingContext.font          = fontStr;
    p.drawingContext.letterSpacing = '0px';
    p.drawingContext.textBaseline  = 'top';
    p.drawingContext.textAlign     = 'left';

    const startY = cell.y + Math.max(8, (cell.h - totalH) / 2) - 10;

    for (let i = 0; i < TITLE_LINES.length; i++) {
      const line  = TITLE_LINES[i];
      const lineY = startY + i * lh;

      if (line.startsWith('/*')) {
        const prefix  = '/*';
        const prefixW = p.drawingContext.measureText(prefix).width;
        p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.3)`;
        p.drawingContext.fillText(prefix, x, lineY);
        p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1)`;
        p.drawingContext.fillText(line.slice(2), x + prefixW, lineY);
      } else {
        p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.9)`;
        p.drawingContext.fillText(line, x, lineY);
      }
    }
  });
}

function drawInfoBlock(p) {
  const { font, size, weight, letterSpacing, lineHeight, alignH } = state.infoBlock;
  const b    = state.layout.blocks.info;
  const cell = getCellRect(b.colStart, b.rowStart, b.colSpan, b.rowSpan);
  const [fR, fG, fB] = hexRgb(state.preset.fg);

  drawBlockInCell(p, cell, () => {
    const weightNum = weight === 'black' ? '900' : weight === 'bold' ? '700' : '400';
    const fontStr   = `${weightNum} ${size}px '${font}', monospace`;
    const lh        = size * lineHeight;
    const pad       = 8;
    const maxW      = cell.w - pad * 2;

    p.noStroke();
    p.drawingContext.font          = fontStr;
    p.drawingContext.letterSpacing = letterSpacing + 'px';
    p.drawingContext.textBaseline  = 'alphabetic';

    let x, align;
    if (alignH === 'right') {
      x = cell.x + cell.w - pad; align = 'right';
    } else if (alignH === 'center') {
      x = cell.x + cell.w / 2; align = 'center';
    } else {
      x = cell.x + pad; align = 'left';
    }
    p.drawingContext.textAlign = align;

    let y = cell.y + LOGOS_H + pad + size;

    p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.55)`;
    p.drawingContext.fillText('[', x, y);
    y += lh;

    for (let i = 0; i < INFO_LINES.length; i++) {
      const line   = INFO_LINES[i];
      const colon  = line.indexOf(':');
      const isLast = i === INFO_LINES.length - 1;

      if (colon > -1) {
        const keyPart = '"' + line.slice(0, colon).trim() + '": ';
        const valPart = '"' + line.slice(colon + 1).trim() + '"' + (isLast ? '' : ',');
        const keyStr  = '  ' + keyPart;
        const keyW    = p.drawingContext.measureText(keyStr).width;

        p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.65)`;
        if (alignH === 'left') {
          p.drawingContext.fillText(keyStr, x, y);
        }

        const valX    = (alignH === 'left') ? x + keyW : x;
        const valMaxW = (alignH === 'left') ? maxW - keyW : maxW;
        const valLines = wrapText(p, valPart, valMaxW);

        p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1.0)`;
        for (let li = 0; li < valLines.length; li++) {
          if (li === 0 && alignH === 'left') {
            p.drawingContext.fillText(valLines[li], valX, y);
          } else {
            p.drawingContext.fillText(valLines[li], x + (alignH === 'left' ? pad * 2 : 0), y + li * lh);
          }
        }
        y += Math.max(1, valLines.length) * lh;
      } else {
        const fullLine = '  "' + line + '"' + (isLast ? '' : ',');
        const wrapped  = wrapText(p, fullLine, maxW);
        p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1.0)`;
        for (const wl of wrapped) {
          p.drawingContext.fillText(wl, x, y);
          y += lh;
        }
      }
    }

    p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.55)`;
    p.drawingContext.fillText(']', x, y);

    p.drawingContext.letterSpacing = '0px';
  });
}

function wrapText(p, text, maxWidth) {
  if (maxWidth <= 0) return [text];
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (p.drawingContext.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function drawGuides(p) {
  const [fR, fG, fB] = hexRgb(state.preset.fg);
  p.push();
  p.stroke(fR, fG, fB, 80);
  p.strokeWeight(0.5);
  p.drawingContext.setLineDash([6, 5]);
  p.line(CANVAS_W / 2, 0, CANVAS_W / 2, CANVAS_H);
  p.line(0, CANVAS_H / 2, CANVAS_W, CANVAS_H / 2);
  p.stroke(fR, fG, fB, 35);
  p.drawingContext.setLineDash([2, 4]);
  for (const key in ZONES) {
    const z = ZONES[key];
    p.line(0, z.y, CANVAS_W, z.y);
  }
  p.drawingContext.setLineDash([]);
  p.pop();
}

/* =====================================================
   ESCALADO DEL WRAPPER
   ===================================================== */
function resizeCanvasWrapper() {
  const area    = document.getElementById('canvas-area');
  const wrapper = document.getElementById('canvas-wrapper');
  if (!area || !wrapper) return;
  const aw  = area.clientWidth  - 48;
  const ah  = area.clientHeight - 48;
  const asp = CANVAS_W / CANVAS_H;
  let w, h;
  if (aw / ah > asp) { h = ah; w = h * asp; }
  else               { w = aw; h = w / asp; }
  wrapper.style.width  = w + 'px';
  wrapper.style.height = h + 'px';
}

/* =====================================================
   HELPERS
   ===================================================== */
function hexRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* =====================================================
   WCAG 2.1 — CÁLCULO DE CONTRASTE
   ===================================================== */
function hexToRgbNorm(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255
  };
}

function relativeLuminance({ r, g, b }) {
  const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1, hex2) {
  const L1 = relativeLuminance(hexToRgbNorm(hex1));
  const L2 = relativeLuminance(hexToRgbNorm(hex2));
  const lighter = Math.max(L1, L2);
  const darker  = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function meetsAA(hex1, hex2) {
  return contrastRatio(hex1, hex2) >= 4.5;
}

function hexToHsl(hex) {
  let { r, g, b } = hexToRgbNorm(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = x => Math.round(Math.max(0, Math.min(255, x * 255))).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function adjustColorForContrast(targetColor, fixedColor, minRatio = 4.5) {
  const fixedLum     = relativeLuminance(hexToRgbNorm(fixedColor));
  const shouldBeDark = fixedLum > 0.5;
  const hsl          = hexToHsl(targetColor);
  const step         = shouldBeDark ? -1 : 1;
  while (contrastRatio(hslToHex(hsl), fixedColor) < minRatio) {
    hsl.l += step;
    if (hsl.l <= 0 || hsl.l >= 100) break;
  }
  return hslToHex(hsl);
}

/* =====================================================
   WCAG UI — indicador y paletas
   ===================================================== */
function updateContrastUI() {
  const ratio    = contrastRatio(state.preset.bg, state.preset.fg);
  const pass     = ratio >= 4.5;
  const ratioStr = ratio.toFixed(1) + ':1';

  const ratioEl = document.getElementById('contrast-ratio-val');
  const badgeEl = document.getElementById('contrast-badge');
  if (ratioEl) ratioEl.textContent = ratioStr;
  if (badgeEl) {
    badgeEl.textContent = pass ? '✓ AA' : '✗ AA';
    badgeEl.className   = 'contrast-badge ' + (pass ? 'pass' : 'fail');
  }

  const tbEl = document.getElementById('toolbar-contrast');
  if (tbEl) {
    tbEl.textContent = '[AA ' + (pass ? '✓' : '✗') + '] ' + ratioStr;
    tbEl.className   = 'toolbar-contrast ' + (pass ? 'pass' : 'fail');
  }
}

function buildWcagSwatches() {
  const container = document.getElementById('wcag-swatches');
  if (!container) return;
  container.innerHTML = '';
  WCAG_PALETTES.forEach(palette => {
    const btn = document.createElement('button');
    btn.className = 'wcag-swatch';
    btn.style.setProperty('--ws-bg', palette.bg);
    btn.style.setProperty('--ws-fg', palette.fg);
    btn.title     = `${palette.name} — ${contrastRatio(palette.bg, palette.fg).toFixed(1)}:1`;
    btn.textContent = 'Aa';
    btn.addEventListener('click', () => applyWcagPalette(palette));
    container.appendChild(btn);
  });
}

function applyWcagPalette(palette) {
  state.preset.bg        = palette.bg;
  state.preset.fg        = palette.fg;
  state.preset.animColor = palette.fg;   // animaciones usan el fg de la paleta
  lastValidBg            = palette.bg;
  lastValidFg            = palette.fg;
  const posterBg  = document.getElementById('poster-bg');
  const posterFg  = document.getElementById('poster-fg');
  const bgPicker  = document.getElementById('bg-color');
  const animPicker = document.getElementById('bubble-bg-color');
  if (posterBg)  posterBg.value  = palette.bg;
  if (posterFg)  posterFg.value  = palette.fg;
  if (bgPicker)  bgPicker.value  = palette.bg;
  if (animPicker) animPicker.value = palette.fg;
  updateContrastUI();
  if (['flow-field', 'code-rain', 'glyph-flow-field'].includes(state.anim.current) && currentAnimation) {
    currentAnimation.reset();
  }
}

function flashPicker(el) {
  el.classList.add('picker-error-flash');
  setTimeout(() => el.classList.remove('picker-error-flash'), 400);
}

function showContrastError(ratio) {
  const el = document.getElementById('contrast-error');
  if (!el) return;
  el.textContent = `Contraste insuficiente: ${ratio.toFixed(1)}:1. Mínimo requerido: 4.5:1`;
  el.classList.remove('hidden');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

function hideContrastError() {
  const el = document.getElementById('contrast-error');
  if (el) {
    clearTimeout(el._hideTimer);
    el.classList.add('hidden');
  }
}

/* =====================================================
   PRESETS DE COLOR
   ===================================================== */
function buildColorSwatches() {
  const container = document.getElementById('color-swatches');
  if (!container) return;
  container.innerHTML = '';
  COLOR_PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.className = 'swatch-btn' + (preset.id === state.preset.activeId ? ' active' : '');
    btn.dataset.preset = preset.id;
    btn.style.setProperty('--sb-bg', preset.bg);
    btn.style.setProperty('--sb-fg', preset.fg);
    btn.textContent = preset.label;
    btn.title = preset.id;
    btn.addEventListener('click', () => applyColorPreset(preset.id));
    container.appendChild(btn);
  });
}

function applyColorPreset(id) {
  const preset = COLOR_PRESETS.find(p => p.id === id);
  if (!preset) return;
  state.preset.bg        = preset.bg;
  state.preset.fg        = preset.fg;
  state.preset.animColor = preset.anim;
  state.preset.activeId  = id;
  document.querySelectorAll('.swatch-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.preset === id);
  });
  // Sync color pickers con el preset
  state.preset.bubbleFg = preset.fg;
  const fgPicker      = document.getElementById('fg-color');
  const animPicker    = document.getElementById('bubble-bg-color');
  const bgPicker      = document.getElementById('bg-color');
  if (fgPicker)   fgPicker.value   = preset.fg;
  if (animPicker) animPicker.value = preset.anim;
  if (bgPicker)   bgPicker.value   = preset.bg;
  // Sync WCAG pickers
  const posterBg = document.getElementById('poster-bg');
  const posterFg = document.getElementById('poster-fg');
  if (posterBg) posterBg.value = preset.bg;
  if (posterFg) posterFg.value = preset.fg;
  lastValidBg = preset.bg;
  lastValidFg = preset.fg;
  updateContrastUI();
  // Reset buffer-based animations so they repaint with new bg color
  if (['flow-field', 'code-rain', 'glyph-flow-field'].includes(state.anim.current) && currentAnimation) {
    currentAnimation.reset();
  }
}

/* =====================================================
   BINDINGS
   ===================================================== */
function bindControls() {
  const el       = id => document.getElementById(id);
  const onInput  = (id, fn) => { const e = el(id); if (e) e.addEventListener('input',  fn); };
  const onChange = (id, fn) => { const e = el(id); if (e) e.addEventListener('change', fn); };
  const onCheck  = (id, fn) => { const e = el(id); if (e) e.addEventListener('change', fn); };
  const onClick  = (id, fn) => { const e = el(id); if (e) e.addEventListener('click',  fn); };

  const slider = (id, dispId, fn, mult = 1, dec = 0) => {
    const s = el(id), d = el(dispId);
    if (!s) return;
    s.addEventListener('input', () => {
      const v = parseFloat(s.value) * mult;
      if (d) d.textContent = dec > 0 ? v.toFixed(dec) : v;
      fn(v);
    });
  };

  // ——— Formato ———
  onChange('format-select', e => {
    switchFormat(e.target.value);
    const bc = document.getElementById('banner-controls');
    if (bc) bc.style.display = e.target.value === 'banner' ? '' : 'none';
  });
  onClick('btn-randomize-banner', () => { randomizeBannerGrid(); showToast('Banner aleatorio'); });

  // ——— Layout y Grilla ———
  slider('margin-val',   'margin-disp',    v => { state.layout.margin = v; });
  onCheck('grid-show',   e => { state.grid.show = e.target.checked; });
  slider('grid-cols',    'grid-cols-val',   v => { state.grid.cols   = Math.round(v); });
  slider('grid-rows',    'grid-rows-val',   v => { state.grid.rows   = Math.round(v); });
  slider('grid-weight',  'grid-weight-val', v => { state.grid.weight = v; }, 0.1, 1);
  onCheck('guides-toggle', e => {
    state.showGuides = e.target.checked;
    el('btn-guides').classList.toggle('active', e.target.checked);
  });
  onClick('btn-randomize-layout', () => { randomizeLayout(); showToast('Layout aleatorio'); });
  onClick('btn-reset-layout',     () => { resetLayout();     showToast('Layout reseteado'); });

  // ——— Paleta ———
  buildColorSwatches();
  onInput('fg-color', e => {
    state.preset.bubbleFg = e.target.value;
  });
  onInput('bubble-bg-color', e => {
    // Afecta animColor → todas las animaciones usan getAnimRgb() → animColor
    state.preset.animColor = e.target.value;
  });
  onInput('bg-color', e => {
    state.preset.bg = e.target.value;
    lastValidBg = e.target.value;
    const posterBg = document.getElementById('poster-bg');
    if (posterBg) posterBg.value = e.target.value;
    updateContrastUI();
    if (['flow-field', 'code-rain', 'glyph-flow-field'].includes(state.anim.current) && currentAnimation) currentAnimation.reset();
  });
  slider('anim-opacity', 'anim-opacity-val', v => { state.anim.opacity        = v; });
  slider('grid-opacity', 'grid-opacity-val', v => { state.preset.gridOpacity  = v; });

  // ——— Colores del afiche (WCAG) ———
  onInput('poster-bg', e => {
    const newBg       = e.target.value;
    const autoAdjust  = document.getElementById('auto-contrast')?.checked;
    if (meetsAA(newBg, state.preset.fg)) {
      state.preset.bg = newBg;
      lastValidBg     = newBg;
      const bgPicker = document.getElementById('bg-color');
      if (bgPicker) bgPicker.value = newBg;
      hideContrastError();
      if (['flow-field', 'code-rain', 'glyph-flow-field'].includes(state.anim.current) && currentAnimation) currentAnimation.reset();
    } else if (autoAdjust) {
      const adjustedFg = adjustColorForContrast(state.preset.fg, newBg);
      state.preset.bg  = newBg;
      state.preset.fg  = adjustedFg;
      lastValidBg      = newBg;
      lastValidFg      = adjustedFg;
      const posterFg = document.getElementById('poster-fg');
      const bgPicker = document.getElementById('bg-color');
      if (posterFg) posterFg.value = adjustedFg;
      if (bgPicker) bgPicker.value = newBg;
      hideContrastError();
      if (['flow-field', 'code-rain', 'glyph-flow-field'].includes(state.anim.current) && currentAnimation) currentAnimation.reset();
    } else {
      e.target.value = lastValidBg;
      flashPicker(e.target);
      showContrastError(contrastRatio(newBg, state.preset.fg));
    }
    updateContrastUI();
  });

  onInput('poster-fg', e => {
    const newFg      = e.target.value;
    const autoAdjust = document.getElementById('auto-contrast')?.checked;
    if (meetsAA(state.preset.bg, newFg)) {
      state.preset.fg        = newFg;
      state.preset.animColor = newFg;   // sync animaciones con nuevo fg
      lastValidFg            = newFg;
      const animPicker = document.getElementById('bubble-bg-color');
      if (animPicker) animPicker.value = newFg;
      hideContrastError();
    } else if (autoAdjust) {
      const adjustedBg = adjustColorForContrast(state.preset.bg, newFg);
      state.preset.fg  = newFg;
      state.preset.bg  = adjustedBg;
      lastValidFg      = newFg;
      lastValidBg      = adjustedBg;
      const posterBg = document.getElementById('poster-bg');
      const bgPicker = document.getElementById('bg-color');
      if (posterBg) posterBg.value = adjustedBg;
      if (bgPicker) bgPicker.value = adjustedBg;
      hideContrastError();
      if (['flow-field', 'code-rain', 'glyph-flow-field'].includes(state.anim.current) && currentAnimation) currentAnimation.reset();
    } else {
      e.target.value = lastValidFg;
      flashPicker(e.target);
      showContrastError(contrastRatio(state.preset.bg, newFg));
    }
    updateContrastUI();
  });

  // ——— Animación ———
  onChange('anim-select', e => { switchAnimation(e.target.value); });
  onChange('anim-blend',  e => { state.anim.blendMode = e.target.value; });
  onChange('anim-font',   e => {
    state.anim.font = e.target.value;
    if (currentAnimation) currentAnimation.reset();
  });
  slider('anim-speed', 'anim-speed-val', v => { state.anim.speed = v; }, 0.1, 1);
  slider('anim-text-size', 'anim-text-size-val', v => {
    state.anim.textSize = Math.round(v);
    if (currentAnimation) currentAnimation.reset();
  });
  onChange('anim-seed', e => {
    state.anim.seed = parseInt(e.target.value) || 0;
    initAnimation();
  });
  onClick('btn-randomize-anim', () => {
    const seed = Math.floor(Math.random() * 99999);
    state.anim.seed = seed;
    el('anim-seed').value = seed;
    initAnimation();
    showToast('Nueva semilla: ' + seed);
  });

  // ——— Exportación ———
  onClick('btn-export-png',         exportPNG);
  onClick('btn-export-mp4',         exportVideo);
  onClick('btn-export-png-sidebar', exportPNG);
  onClick('btn-export-mp4-sidebar', exportVideo);

  // ——— Toolbar ———
  onClick('btn-play-pause', () => {
    state.playing = !state.playing;
    const btn   = el('btn-play-pause');
    const label = el('play-label');
    btn.classList.toggle('active', state.playing);
    if (label) label.textContent = state.playing ? 'Pause' : 'Play';
    const icon = el('play-icon');
    if (icon) icon.setAttribute('d', state.playing
      ? 'M8 5v14l11-7z'
      : 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
  });

  onClick('btn-reset', () => {
    if (currentAnimation) currentAnimation.reset();
    showToast('Animación reiniciada');
  });

  onClick('btn-guides', () => {
    state.showGuides = !state.showGuides;
    el('btn-guides').classList.toggle('active', state.showGuides);
    const toggle = el('guides-toggle');
    if (toggle) toggle.checked = state.showGuides;
  });

  window.addEventListener('resize', resizeCanvasWrapper);
}

/* =====================================================
   EXPORTACIÓN
   ===================================================== */
function exportPNG() {
  const wasPlay = state.playing;
  state.playing = false;

  setTimeout(() => {
    const cv = document.querySelector('#canvas-container canvas');
    if (!cv) { showToast('Canvas no encontrado', 'error'); state.playing = wasPlay; return; }
    downloadDataURL(cv.toDataURL('image/png'), 'pcd2026.png');
    showToast(`PNG exportado ${CANVAS_W}×${CANVAS_H}`, 'success');
    state.playing = wasPlay;
  }, 60);
}

function exportVideo() {
  const cv = document.querySelector('#canvas-container canvas');
  if (!cv) { showToast('Canvas no encontrado', 'error'); return; }
  if (!window.MediaRecorder) { showToast('MediaRecorder no soportado', 'error'); return; }

  const fps      = state.anim.fps || 30;
  const duration = 10000; // 10 segundos fijos

  const mp4Types = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm'
  ];
  const mime = mp4Types.find(t => {
    try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; }
  }) || 'video/webm';
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';

  let stream;
  try { stream = cv.captureStream(fps); } catch (e) {
    showToast('captureStream no soportado', 'error'); return;
  }

  const rec    = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  const wasPlay = state.playing;
  state.playing = true;

  rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  rec.onstop = () => {
    downloadURL(URL.createObjectURL(new Blob(chunks, { type: mime })), `pcd2026.${ext}`);
    showProgress(false);
    showToast(`Video exportado (10s · ${ext.toUpperCase()})`, 'success');
    state.playing = wasPlay;
  };

  // Reiniciar animación desde el principio antes de grabar
  if (currentAnimation) currentAnimation.reset();

  showProgress(true, 'Grabando...');
  rec.start();
  let elapsed = 0;
  const iv = setInterval(() => {
    elapsed += 100;
    updateProgress(elapsed / duration, `${(elapsed / 1000).toFixed(1)}s / 10s`);
    if (elapsed >= duration) { clearInterval(iv); rec.stop(); }
  }, 100);
}

function downloadDataURL(url, name) {
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
}
function downloadURL(url, name) {
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
}
function showProgress(show, msg = '') {
  const el = document.getElementById('export-progress');
  if (el) el.classList.toggle('hidden', !show);
  if (show && msg) { const t = document.getElementById('progress-text'); if (t) t.textContent = msg; }
}
function updateProgress(ratio, msg) {
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  if (fill) fill.style.width = (ratio * 100) + '%';
  if (text && msg) text.textContent = msg;
}

/* =====================================================
   INICIALIZACIÓN
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Filtrar paletas WCAG programáticamente (excluye cualquiera que no cumpla 4.5:1)
  WCAG_PALETTES = WCAG_PALETTES_DEF.filter(p => meetsAA(p.bg, p.fg));

  initLogos();
  p5Instance = new p5(sketch);
  setTimeout(resizeCanvasWrapper, 80);
  bindControls();
  buildWcagSwatches();
  updateContrastUI();
  window.addEventListener('resize', resizeCanvasWrapper);
});
