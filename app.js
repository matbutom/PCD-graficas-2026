/* =====================================================
   APP.JS — Processing Community Day 2026 Visualizer
   ===================================================== */

/* =====================================================
   CONTENIDO FIJO (no editable desde sidebar)
   ===================================================== */
const TITLE_LINES = ['/*PROCESSING', '/*COMMUNITY', '/*DAY — 2026'];

const INFO_LINES = [
  'Evento: Processing community day, Convocatoria abierta',
  'Lugar: Salvador Sanfuentes 2221',
  'Descripcion: Sé parte del evento que busca visibilizar prácticas emergentes, conectar comunidad, academia e industria y generar un espacio de encuentro en torno al uso creativo del código.',
  'Llamado a: Estudiantes pre/postgrado, Investigadores, Creadores, Equipos interdisciplinarios',
  'Apertura convocatoria: 17.04.2026',
  'Cierre convocatoria: [Por definir]'
];

/* =====================================================
   LAYOUT DEFAULT — posiciones de celdas por defecto
   ===================================================== */
const DEFAULT_LAYOUT = {
  title: { colStart: 0, colSpan: 3, rowStart: 4, rowSpan: 2 },
  info:  { colStart: 0, colSpan: 2, rowStart: 0, rowSpan: 3 }
};

/* =====================================================
   ESTADO GLOBAL
   ===================================================== */
const state = {
  // Colores fijos blanco/negro
  preset: {
    bg:          '#FFFFFF',
    fg:          '#000000',
    animColor:   '#000000',
    animOpacity: 80,
    gridOpacity: 35
  },

  // Tipografía del título
  title: {
    font:          'Space Mono',
    size:          72,
    weight:        'bold',
    letterSpacing: 0,
    lineHeight:    1.1,
    alignH:        'left'
  },

  // Bloque de información
  infoBlock: {
    font:          'Space Mono',
    size:          16,
    weight:        'regular',
    letterSpacing: 0,
    lineHeight:    1.55,
    alignH:        'left'
  },

  // Barras de meta (texto fijo)
  meta: {
    topLeft:     '1080×1350',
    topRight:    'p5.js — v1.9',
    bottomLeft:  'Processing Community Day 2026',
    bottomRight: 'Santiago, Chile'
  },

  // Grilla editorial
  grid: {
    show:   true,
    cols:   3,
    rows:   6,
    weight: 1
  },

  // Layout — posición de bloques en la grilla
  layout: {
    margin: MARGIN,
    blocks: {
      title: { colStart: 0, colSpan: 3, rowStart: 4, rowSpan: 2 },
      info:  { colStart: 0, colSpan: 2, rowStart: 0, rowSpan: 3 }
    }
  },

  // Animación
  anim: {
    current:    'letter-physics',
    speed:      1.0,
    fps:        30,
    opacity:    80,
    seed:       42,
    fullCanvas: true,
    params: {
      'letter-physics': {
        text:       'PROCESSING COMMUNITY DAY',
        circleSize: 38,
        gravity:    0.4,
        friction:   0.985,
        repulsion:  180,
        showLabels: false
      },
      'particle-network': {
        count:     80,
        distance:  150,
        speed:     1.2,
        pointSize: 3
      },
      'flow-field': {
        noiseScale:  0.003,
        trailLength: 120,
        speed:       2.0
      },
      'grid-distortion': {
        density:   28,
        radius:    160,
        force:     120,
        showLines: true
      },
      'bouncing-shapes': {
        count:      16,
        size:       28,
        gravity:    0.5,
        elasticity: 0.82,
        shapes:     { circle: true, square: true, triangle: false }
      },
      'wave-interference': {
        emitters:   2,
        frequency:  0.035,
        amplitude:  45,
        resolution: 4
      },
      'code-rain': {
        dropSpeed: 3.5,
        density:   30,
        charset:   'p5js'
      },
      'constellation': {
        count:     80,
        distance:  160,
        speed:     0.6,
        pointSize: 2
      },
      'elastic-mesh': {
        resX:       12,
        resY:       15,
        stiffness:  0.06,
        damping:    0.92,
        lineWeight: 0.8
      },
      'rotating-typography': {
        text:         'PROCESSING COMMUNITY DAY 2026',
        speed:        1.0,
        letterSize:   44,
        distribution: 'grid'
      }
    }
  },

  showGuides: false,
  playing:    true,
  export: {
    scale:    1,
    duration: 3
  }
};

/* =====================================================
   p5.js — INSTANCIA Y SKETCH
   ===================================================== */
let p5Instance       = null;
let currentAnimation = null;
let fpsFrames        = 0;
let fpsLastTime      = performance.now();

// Transición entre animaciones
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
    // Contador de FPS
    fpsFrames++;
    const now = performance.now();
    if (now - fpsLastTime >= 600) {
      const fps = Math.round(fpsFrames / ((now - fpsLastTime) / 1000));
      const el  = document.getElementById('fps-display');
      if (el) el.textContent = fps + ' fps';
      fpsFrames   = 0;
      fpsLastTime = now;
    }

    // Fondo blanco fijo
    p.background(255);

    // Animación de fondo (con fade durante transición)
    if (currentAnimation) {
      p.push();
      const opa = (state.anim.opacity / 100) * fadeOpacity;
      p.drawingContext.globalAlpha = Math.max(0, Math.min(1, opa));
      currentAnimation.draw();
      p.drawingContext.globalAlpha = 1;
      p.pop();
    }

    // Capas editoriales (siempre encima)
    drawEditorialContent(p);

    // Fade overlay para transición
    if (fadingOut || fadingIn) tickFade(p);
  };

  p.mouseMoved    = () => dispatchMouse(p, 'move');
  p.mouseDragged  = () => dispatchMouse(p, 'drag');
  p.mousePressed  = () => dispatchMouse(p, 'press');
  p.mouseReleased = () => dispatchMouse(p, 'release');
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
  const step = 0.06;
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
   SISTEMA DE GRILLA — celdas y clipping
   ===================================================== */

// Retorna las coordenadas en canvas de un rango de celdas
function getCellRect(colStart, rowStart, colSpan, rowSpan) {
  const m    = state.layout.margin;
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

// Dibuja con clipping duro al rect de la celda
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

// LCG — genera valores pseudo-aleatorios reproducibles
function seededRandom(seed) {
  let s = (seed ^ 0x12345678) >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function randomizeLayout() {
  const rng  = seededRandom(state.anim.seed);
  const cols = state.grid.cols;
  const rows = state.grid.rows;

  const blocks = [
    { id: 'title', colSpan: Math.min(3, cols), rowSpan: Math.min(2, rows) },
    { id: 'info',  colSpan: Math.min(2, cols), rowSpan: Math.min(3, rows) }
  ];

  const occupied = Array.from({ length: rows }, () => new Array(cols).fill(false));

  for (const block of blocks) {
    const { colSpan, rowSpan } = block;
    const maxCol = cols - colSpan;
    const maxRow = rows - rowSpan;
    let placed = false;

    if (maxCol >= 0 && maxRow >= 0) {
      for (let attempt = 0; attempt < 60; attempt++) {
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

/* =====================================================
   RENDER EDITORIAL
   ===================================================== */
function drawEditorialContent(p) {
  if (state.grid.show) drawGrid(p);
  drawTopBar(p);
  drawBottomBar(p);
  drawInfoBlock(p);
  drawTitle(p);
  if (state.showGuides) drawGuides(p);
}

// —— Grilla editorial ——
function drawGrid(p) {
  const { cols, rows, weight } = state.grid;
  const m    = state.layout.margin;
  const gx   = m;
  const gy   = m;
  const gw   = CANVAS_W - 2 * m;
  const gh   = CANVAS_H - 2 * m;
  const opa  = state.preset.gridOpacity;

  p.push();
  p.stroke(0, 0, 0, (opa / 100) * 255);
  p.strokeWeight(weight);

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

// —— Barra superior ——
function drawTopBar(p) {
  const h = ZONES.topBar.h;
  const m = state.layout.margin;

  p.push();
  p.noStroke();
  p.fill(255, 255, 255, 210);
  p.rect(0, 0, CANVAS_W, h);

  p.stroke(0, 0, 0, 60);
  p.strokeWeight(0.5);
  p.line(m, h - 1, CANVAS_W - m, h - 1);

  p.noStroke();
  p.drawingContext.font         = `400 11px 'Space Mono', monospace`;
  p.drawingContext.fillStyle    = 'rgba(0,0,0,0.6)';
  p.drawingContext.textBaseline = 'middle';
  p.drawingContext.textAlign    = 'left';
  p.drawingContext.fillText(state.meta.topLeft,  m, h / 2);
  p.drawingContext.textAlign = 'right';
  p.drawingContext.fillText(state.meta.topRight, CANVAS_W - m, h / 2);
  p.pop();
}

// —— Barra inferior ——
function drawBottomBar(p) {
  const y = ZONES.bottomBar.y;
  const h = ZONES.bottomBar.h;
  const m = state.layout.margin;

  p.push();
  p.noStroke();
  p.fill(255, 255, 255, 210);
  p.rect(0, y, CANVAS_W, h);

  p.stroke(0, 0, 0, 60);
  p.strokeWeight(0.5);
  p.line(m, y + 1, CANVAS_W - m, y + 1);

  p.noStroke();
  p.drawingContext.font         = `400 11px 'Space Mono', monospace`;
  p.drawingContext.fillStyle    = 'rgba(0,0,0,0.6)';
  p.drawingContext.textBaseline = 'middle';
  p.drawingContext.textAlign    = 'left';
  p.drawingContext.fillText(state.meta.bottomLeft,  m, y + h / 2);
  p.drawingContext.textAlign = 'right';
  p.drawingContext.fillText(state.meta.bottomRight, CANVAS_W - m, y + h / 2);
  p.pop();
}

// —— Título principal (con clipping de celda) ——
function drawTitle(p) {
  const { font, size, weight, letterSpacing, lineHeight, alignH } = state.title;
  const b    = state.layout.blocks.title;
  const cell = getCellRect(b.colStart, b.rowStart, b.colSpan, b.rowSpan);

  drawBlockInCell(p, cell, () => {
    const weightNum = weight === 'black' ? '900' : weight === 'bold' ? '700' : '400';
    const fontStr   = `${weightNum} ${size}px '${font}', monospace`;
    const lh        = size * lineHeight;
    const totalH    = TITLE_LINES.length * lh;

    p.noStroke();
    p.drawingContext.font          = fontStr;
    p.drawingContext.letterSpacing = letterSpacing + 'px';
    p.drawingContext.textBaseline  = 'top';

    // Posición horizontal
    let x, align;
    if (alignH === 'right') {
      x = cell.x + cell.w - 8; align = 'right';
    } else if (alignH === 'center') {
      x = cell.x + cell.w / 2; align = 'center';
    } else {
      x = cell.x + 8; align = 'left';
    }
    p.drawingContext.textAlign = align;

    // Centrar verticalmente en la celda
    const startY = cell.y + Math.max(8, (cell.h - totalH) / 2);

    for (let i = 0; i < TITLE_LINES.length; i++) {
      const line  = TITLE_LINES[i];
      const lineY = startY + i * lh;

      if (alignH === 'left' && line.startsWith('/*')) {
        const prefix = '/*';
        const prefixW = p.drawingContext.measureText(prefix).width;
        p.drawingContext.fillStyle = 'rgba(0,0,0,0.3)';
        p.drawingContext.fillText(prefix, x, lineY);
        p.drawingContext.fillStyle = 'rgba(0,0,0,1)';
        p.drawingContext.fillText(line.slice(2), x + prefixW, lineY);
      } else {
        p.drawingContext.fillStyle = 'rgba(0,0,0,0.9)';
        p.drawingContext.fillText(line, x, lineY);
      }
    }

    p.drawingContext.letterSpacing = '0px';
  });
}

// —— Bloque de información (con clipping de celda) ——
function drawInfoBlock(p) {
  const { font, size, weight, letterSpacing, lineHeight, alignH } = state.infoBlock;
  const b    = state.layout.blocks.info;
  const cell = getCellRect(b.colStart, b.rowStart, b.colSpan, b.rowSpan);

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

    let y = cell.y + size + pad;

    // Corchete de apertura
    p.drawingContext.fillStyle = 'rgba(0,0,0,0.35)';
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

        // Clave en baja opacidad
        p.drawingContext.fillStyle = 'rgba(0,0,0,0.35)';
        if (alignH === 'left') {
          p.drawingContext.fillText(keyStr, x, y);
        }

        // Valor con word wrap
        const valX   = (alignH === 'left') ? x + keyW : x;
        const valMaxW = (alignH === 'left') ? maxW - keyW : maxW;
        const valLines = wrapText(p, valPart, valMaxW);

        p.drawingContext.fillStyle = 'rgba(0,0,0,0.85)';
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
        p.drawingContext.fillStyle = 'rgba(0,0,0,0.85)';
        for (const wl of wrapped) {
          p.drawingContext.fillText(wl, x, y);
          y += lh;
        }
      }
    }

    // Corchete de cierre
    p.drawingContext.fillStyle = 'rgba(0,0,0,0.35)';
    p.drawingContext.fillText(']', x, y);

    p.drawingContext.letterSpacing = '0px';
  });
}

// Word wrap manual usando measureText
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

// —— Guías de centro ——
function drawGuides(p) {
  p.push();
  p.stroke(0, 0, 0, 80);
  p.strokeWeight(0.5);
  p.drawingContext.setLineDash([6, 5]);
  p.line(CANVAS_W / 2, 0, CANVAS_W / 2, CANVAS_H);
  p.line(0, CANVAS_H / 2, CANVAS_W, CANVAS_H / 2);
  p.stroke(0, 0, 0, 35);
  p.drawingContext.setLineDash([2, 4]);
  for (const key in ZONES) {
    const z = ZONES[key];
    p.line(0, z.y, CANVAS_W, z.y);
  }
  p.drawingContext.setLineDash([]);
  p.pop();
}

/* =====================================================
   ESCALADO DEL WRAPPER DEL CANVAS
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
   BINDINGS — sidebar → estado
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

  // ——————————————————————————————
  // SECCIÓN 1: Layout y Grilla
  // ——————————————————————————————
  slider('margin-val', 'margin-disp', v => { state.layout.margin = v; });
  onCheck('grid-show', e => { state.grid.show = e.target.checked; });
  slider('grid-cols', 'grid-cols-val', v => { state.grid.cols = Math.round(v); });
  slider('grid-rows', 'grid-rows-val', v => { state.grid.rows = Math.round(v); });
  slider('grid-weight', 'grid-weight-val', v => { state.grid.weight = v; }, 0.1, 1);
  onCheck('guides-toggle', e => {
    state.showGuides = e.target.checked;
    el('btn-guides').classList.toggle('active', e.target.checked);
  });

  onClick('btn-randomize-layout', () => {
    randomizeLayout();
    showToast('Layout aleatorio');
  });
  onClick('btn-reset-layout', () => {
    resetLayout();
    showToast('Layout reseteado');
  });

  // ——————————————————————————————
  // SECCIÓN 2: Tipografía — Título
  // ——————————————————————————————
  onChange('font-title',   e => { state.title.font   = e.target.value; });
  slider('title-size', 'title-size-val', v => { state.title.size = v; });
  onChange('title-weight', e => { state.title.weight = e.target.value; });
  slider('title-ls', 'title-ls-val', v => { state.title.letterSpacing = v; });
  slider('title-lh', 'title-lh-val', v => { state.title.lineHeight = v; }, 0.01, 2);

  document.querySelectorAll('.btn-align-title').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-align-title').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.title.alignH = btn.dataset.align;
    });
  });

  // ——————————————————————————————
  // SECCIÓN 2: Tipografía — Info
  // ——————————————————————————————
  onChange('info-font',   e => { state.infoBlock.font   = e.target.value; });
  slider('info-size', 'info-size-val', v => { state.infoBlock.size = v; });
  onChange('info-weight', e => { state.infoBlock.weight = e.target.value; });
  slider('info-ls', 'info-ls-val', v => { state.infoBlock.letterSpacing = v; });
  slider('info-lh', 'info-lh-val', v => { state.infoBlock.lineHeight = v; }, 0.01, 2);

  document.querySelectorAll('.btn-align-info').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-align-info').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.infoBlock.alignH = btn.dataset.align;
    });
  });

  // ——————————————————————————————
  // SECCIÓN 3: Animación
  // ——————————————————————————————
  onChange('anim-select', e => {
    switchAnimation(e.target.value);
    showAnimParams(e.target.value);
  });

  slider('anim-speed', 'anim-speed-val', v => { state.anim.speed = v; }, 0.1, 1);
  onChange('anim-fps', e => {
    state.anim.fps = parseInt(e.target.value);
    if (p5Instance) p5Instance.frameRate(state.anim.fps);
  });
  onCheck('anim-full-canvas', e => {
    state.anim.fullCanvas = e.target.checked;
    if (currentAnimation) currentAnimation.reset();
    initAnimation();
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
  });

  bindAnimParams();

  // ——————————————————————————————
  // SECCIÓN 4: Exportación
  // ——————————————————————————————
  slider('export-duration', 'export-dur-val', v => { state.export.duration = v; });
  onChange('export-scale', e => { state.export.scale = parseInt(e.target.value); });
  onClick('btn-export-png',  exportPNG);
  onClick('btn-export-gif',  exportGIF);
  onClick('btn-export-webm', exportWebM);
  onClick('btn-copy-json', () => {
    navigator.clipboard.writeText(JSON.stringify(state, null, 2))
      .then(() => showToast('Config copiada al clipboard', 'success'));
  });

  // ——————————————————————————————
  // SECCIÓN 5: Guardar / Cargar
  // ——————————————————————————————
  onClick('btn-save-preset',   saveCustomPreset);
  onClick('btn-load-preset',   loadCustomPreset);
  onClick('btn-delete-preset', deleteCustomPreset);
  onClick('btn-import-config', () => el('import-file').click());
  el('import-file').addEventListener('change', importConfig);
  onClick('btn-export-config', exportConfig);

  // ——————————————————————————————
  // TOOLBAR
  // ——————————————————————————————
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
   PARÁMETROS ESPECÍFICOS DE ANIMACIÓN
   ===================================================== */
function bindAnimParams() {
  const el       = id => document.getElementById(id);
  const sd = (id, dispId, fn, mult = 1, dec = 0) => {
    const s = el(id), d = el(dispId);
    if (!s) return;
    s.addEventListener('input', () => {
      const v = parseFloat(s.value) * mult;
      if (d) d.textContent = dec > 0 ? v.toFixed(dec) : v;
      fn(v);
    });
  };
  const onInput  = (id, fn) => { const e = el(id); if (e) e.addEventListener('input',  fn); };
  const onChange = (id, fn) => { const e = el(id); if (e) e.addEventListener('change', fn); };
  const onCheck  = (id, fn) => { const e = el(id); if (e) e.addEventListener('change', fn); };

  const lp = () => state.anim.params['letter-physics'];
  const pn = () => state.anim.params['particle-network'];
  const ff = () => state.anim.params['flow-field'];
  const gd = () => state.anim.params['grid-distortion'];
  const bs = () => state.anim.params['bouncing-shapes'];
  const wi = () => state.anim.params['wave-interference'];
  const cr = () => state.anim.params['code-rain'];
  const co = () => state.anim.params['constellation'];
  const em = () => state.anim.params['elastic-mesh'];
  const rt = () => state.anim.params['rotating-typography'];

  onInput('lp-text', e => { lp().text = e.target.value; if (currentAnimation) currentAnimation.reset(); });
  sd('lp-circle-size', 'lp-cs-val',  v => { lp().circleSize = v;  if (currentAnimation) currentAnimation.reset(); });
  sd('lp-gravity',     'lp-g-val',   v => { lp().gravity    = v; }, 0.1, 1);
  sd('lp-friction',    'lp-fr-val',  v => { lp().friction   = v; }, 0.001, 3);
  sd('lp-repulsion',   'lp-rep-val', v => { lp().repulsion  = v; });
  onCheck('lp-labels', e => { lp().showLabels = e.target.checked; });

  sd('pn-count',    'pn-count-val', v => { pn().count     = v; if (currentAnimation) currentAnimation.reset(); });
  sd('pn-distance', 'pn-dist-val',  v => { pn().distance  = v; });
  sd('pn-speed',    'pn-spd-val',   v => { pn().speed     = v; }, 0.1, 1);
  sd('pn-size',     'pn-sz-val',    v => { pn().pointSize = v; });

  sd('ff-noise', 'ff-noise-val', v => { ff().noiseScale  = v; }, 0.001, 3);
  sd('ff-trail', 'ff-trail-val', v => { ff().trailLength = v; });
  sd('ff-speed', 'ff-spd-val',   v => { ff().speed       = v; }, 0.1, 1);

  sd('gd-density', 'gd-dens-val', v => { gd().density   = v; if (currentAnimation) currentAnimation.reset(); });
  sd('gd-radius',  'gd-rad-val',  v => { gd().radius    = v; });
  sd('gd-force',   'gd-frc-val',  v => { gd().force     = v; });
  onCheck('gd-lines', e => { gd().showLines = e.target.checked; });

  sd('bs-count',      'bs-cnt-val', v => { bs().count      = v; if (currentAnimation) currentAnimation.reset(); });
  sd('bs-size',       'bs-sz-val',  v => { bs().size       = v; if (currentAnimation) currentAnimation.reset(); });
  sd('bs-gravity',    'bs-g-val',   v => { bs().gravity    = v; }, 0.1, 1);
  sd('bs-elasticity', 'bs-el-val',  v => { bs().elasticity = v; }, 0.01, 2);
  onCheck('bs-circle',   e => { bs().shapes.circle   = e.target.checked; if (currentAnimation) currentAnimation.reset(); });
  onCheck('bs-square',   e => { bs().shapes.square   = e.target.checked; if (currentAnimation) currentAnimation.reset(); });
  onCheck('bs-triangle', e => { bs().shapes.triangle = e.target.checked; if (currentAnimation) currentAnimation.reset(); });

  sd('wi-emitters',  'wi-em-val',   v => { wi().emitters  = Math.round(v); if (currentAnimation) currentAnimation.reset(); });
  sd('wi-frequency', 'wi-freq-val', v => { wi().frequency = v; }, 0.001, 3);
  sd('wi-amplitude', 'wi-amp-val',  v => { wi().amplitude = v; });
  sd('wi-resolution','wi-res-val',  v => { wi().resolution = v; });

  sd('cr-speed', 'cr-spd-val', v => { cr().dropSpeed = v; }, 0.5, 1);
  onChange('cr-charset', e => { cr().charset = e.target.value; });

  sd('co-count',    'co-cnt-val',  v => { co().count    = v; if (currentAnimation) currentAnimation.reset(); });
  sd('co-distance', 'co-dist-val', v => { co().distance = v; });
  sd('co-speed',    'co-spd-val',  v => { co().speed    = v; }, 0.1, 1);

  sd('em-resx',  'em-rx-val', v => { em().resX      = Math.round(v); if (currentAnimation) currentAnimation.reset(); });
  sd('em-resy',  'em-ry-val', v => { em().resY      = Math.round(v); if (currentAnimation) currentAnimation.reset(); });
  sd('em-stiff', 'em-st-val', v => { em().stiffness = v; }, 0.01, 2);
  sd('em-damp',  'em-dm-val', v => { em().damping   = v; }, 0.01, 2);

  onInput('rt-text', e => { rt().text = e.target.value; if (currentAnimation) currentAnimation.reset(); });
  sd('rt-speed', 'rt-spd-val', v => { rt().speed      = v; }, 0.1, 1);
  sd('rt-size',  'rt-sz-val',  v => { rt().letterSize = v; if (currentAnimation) currentAnimation.reset(); });
  onChange('rt-dist', e => { rt().distribution = e.target.value; if (currentAnimation) currentAnimation.reset(); });
}

function showAnimParams(name) {
  document.querySelectorAll('.anim-params').forEach(e => e.classList.add('hidden'));
  const panel = document.getElementById('params-' + name);
  if (panel) panel.classList.remove('hidden');
}

/* =====================================================
   PRESETS CUSTOM — localStorage
   ===================================================== */
function saveCustomPreset() {
  const name = prompt('Nombre del preset:');
  if (!name || !name.trim()) return;
  const key     = 'pcd_' + name.trim();
  const presets = getCustomPresets();
  presets[key]  = JSON.parse(JSON.stringify(state));
  localStorage.setItem('pcd-visualizer-presets', JSON.stringify(presets));
  updateCustomPresetsList();
  showToast(`Preset "${name}" guardado`, 'success');
}
function loadCustomPreset() {
  const sel = document.getElementById('custom-presets-list');
  if (!sel || !sel.value) return;
  const presets = getCustomPresets();
  const preset  = presets[sel.value];
  if (preset) {
    deepMerge(state, preset);
    syncUIFromState();
    initAnimation();
    showToast(`Preset "${sel.value.replace('pcd_', '')}" cargado`, 'success');
  }
}
function deleteCustomPreset() {
  const sel = document.getElementById('custom-presets-list');
  if (!sel || !sel.value) return;
  const presets = getCustomPresets();
  delete presets[sel.value];
  localStorage.setItem('pcd-visualizer-presets', JSON.stringify(presets));
  updateCustomPresetsList();
  showToast('Preset eliminado');
}
function getCustomPresets() {
  try { return JSON.parse(localStorage.getItem('pcd-visualizer-presets') || '{}'); }
  catch { return {}; }
}
function updateCustomPresetsList() {
  const sel = document.getElementById('custom-presets-list');
  if (!sel) return;
  const presets = getCustomPresets();
  sel.innerHTML = '<option value="">— Seleccionar —</option>';
  Object.keys(presets).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k.replace('pcd_', '');
    sel.appendChild(opt);
  });
}
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

/* =====================================================
   SINCRONIZAR UI DESDE ESTADO
   ===================================================== */
function syncUIFromState() {
  const el  = id => document.getElementById(id);
  const set = (id, v) => { const e = el(id); if (e) e.value = v; };
  const chk = (id, v) => { const e = el(id); if (e) e.checked = v; };
  const dsp = (id, v, d = 0) => { const e = el(id); if (e) e.textContent = d > 0 ? (+v).toFixed(d) : v; };

  // Título
  set('font-title',    state.title.font);
  set('title-size',    state.title.size);    dsp('title-size-val', state.title.size);
  set('title-weight',  state.title.weight);
  set('title-ls',      state.title.letterSpacing); dsp('title-ls-val', state.title.letterSpacing);
  set('title-lh',      state.title.lineHeight * 100); dsp('title-lh-val', state.title.lineHeight, 2);
  document.querySelectorAll('.btn-align-title').forEach(b => {
    b.classList.toggle('active', b.dataset.align === state.title.alignH);
  });

  // Info
  set('info-font',   state.infoBlock.font);
  set('info-size',   state.infoBlock.size);   dsp('info-size-val', state.infoBlock.size);
  set('info-weight', state.infoBlock.weight);
  set('info-ls',     state.infoBlock.letterSpacing); dsp('info-ls-val', state.infoBlock.letterSpacing);
  set('info-lh',     state.infoBlock.lineHeight * 100); dsp('info-lh-val', state.infoBlock.lineHeight, 2);
  document.querySelectorAll('.btn-align-info').forEach(b => {
    b.classList.toggle('active', b.dataset.align === state.infoBlock.alignH);
  });

  // Grid
  chk('grid-show',    state.grid.show);
  set('grid-cols',    state.grid.cols);   dsp('grid-cols-val', state.grid.cols);
  set('grid-rows',    state.grid.rows);   dsp('grid-rows-val', state.grid.rows);
  set('grid-weight',  state.grid.weight * 10); dsp('grid-weight-val', state.grid.weight, 1);
  set('margin-val',   state.layout.margin); dsp('margin-disp', state.layout.margin);

  // Animación
  set('anim-select',     state.anim.current);
  set('anim-speed',      state.anim.speed * 10); dsp('anim-speed-val', state.anim.speed, 1);
  set('anim-fps',        state.anim.fps);
  chk('anim-full-canvas', state.anim.fullCanvas);
  set('anim-seed',       state.anim.seed);

  showAnimParams(state.anim.current);
}

/* =====================================================
   EXPORTACIÓN
   ===================================================== */
function exportPNG() {
  const scale    = state.export.scale;
  const wasPlay  = state.playing;
  state.playing  = false;

  setTimeout(() => {
    const cv = document.querySelector('#canvas-container canvas');
    if (!cv) { showToast('Canvas no encontrado', 'error'); return; }
    if (scale === 1) {
      downloadDataURL(cv.toDataURL('image/png'), 'pcd2026.png');
      showToast('PNG exportado 1080×1350', 'success');
    } else {
      const off = document.createElement('canvas');
      off.width  = CANVAS_W * scale;
      off.height = CANVAS_H * scale;
      off.getContext('2d').drawImage(cv, 0, 0, off.width, off.height);
      downloadDataURL(off.toDataURL('image/png'), `pcd2026_${scale}x.png`);
      showToast(`PNG ${CANVAS_W * scale}×${CANVAS_H * scale} exportado`, 'success');
    }
    state.playing = wasPlay;
  }, 60);
}

function exportGIF() {
  const cv = document.querySelector('#canvas-container canvas');
  if (!cv) { showToast('Canvas no encontrado', 'error'); return; }
  if (typeof GIF === 'undefined') { showToast('gif.js no disponible', 'error'); return; }

  const duration = state.export.duration;
  const fps      = 12;
  const total    = duration * fps;
  const delay    = 1000 / fps;
  const wasPlay  = state.playing;
  state.playing  = true;

  showProgress(true, 'Iniciando GIF...');

  const gif = new GIF({
    workers: 2, quality: 10,
    width: CANVAS_W, height: CANVAS_H,
    workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
  });

  let captured = 0;
  const capture = () => {
    if (captured >= total) { gif.render(); return; }
    gif.addFrame(cv, { delay, copy: true });
    captured++;
    updateProgress(captured / total, `Frame ${captured}/${total}`);
    setTimeout(capture, delay);
  };

  gif.on('finished', blob => {
    downloadURL(URL.createObjectURL(blob), 'pcd2026.gif');
    showProgress(false);
    showToast('GIF exportado', 'success');
    state.playing = wasPlay;
  });
  gif.on('progress', r => updateProgress(r, `Renderizando ${Math.round(r * 100)}%`));
  capture();
}

function exportWebM() {
  const cv = document.querySelector('#canvas-container canvas');
  if (!cv || !window.MediaRecorder) { showToast('MediaRecorder no soportado', 'error'); return; }
  const duration = state.export.duration * 1000;
  const mime     = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
                    .find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
  const rec      = new MediaRecorder(cv.captureStream(state.anim.fps), { mimeType: mime, videoBitsPerSecond: 8e6 });
  const chunks   = [];
  const wasPlay  = state.playing;
  state.playing  = true;

  rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  rec.onstop = () => {
    downloadURL(URL.createObjectURL(new Blob(chunks, { type: mime })), 'pcd2026.webm');
    showProgress(false);
    showToast('WebM exportado', 'success');
    state.playing = wasPlay;
  };

  showProgress(true, 'Grabando...');
  rec.start();
  let elapsed = 0;
  const iv = setInterval(() => {
    elapsed += 100;
    updateProgress(elapsed / duration, `${(elapsed / 1000).toFixed(1)}s / ${duration / 1000}s`);
    if (elapsed >= duration) { clearInterval(iv); rec.stop(); }
  }, 100);
}

function exportConfig() {
  const json = JSON.stringify(state, null, 2);
  downloadDataURL('data:application/json;charset=utf-8,' + encodeURIComponent(json), 'pcd2026-config.json');
  showToast('Config exportada');
}
function importConfig(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      deepMerge(state, JSON.parse(ev.target.result));
      syncUIFromState();
      initAnimation();
      showToast('Config importada', 'success');
    } catch { showToast('Error al importar JSON', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
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
  p5Instance = new p5(sketch);
  setTimeout(resizeCanvasWrapper, 80);
  bindControls();
  showAnimParams(state.anim.current);
  updateCustomPresetsList();
  window.addEventListener('resize', resizeCanvasWrapper);
});
