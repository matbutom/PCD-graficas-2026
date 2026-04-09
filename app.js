/* =====================================================
   APP.JS — Lógica principal del editor Instagram Visualizer
   Estado global, bindings de controles, p5.js en modo instance,
   exportación PNG/GIF/WebM
   ===================================================== */

/* =====================================================
   ESTADO GLOBAL — toda la configuración serializable
   ===================================================== */
const state = {
  // Texto
  title: {
    text: 'TÍTULO PRINCIPAL',
    font: 'Bebas Neue',
    size: 72,
    color: '#ffffff',
    weight: '700',
    style: 'normal',
    letterSpacing: 0,
    lineHeight: 1.2,
    transform: 'none',
    shadow: { on: false, color: '#000000', x: 2, y: 2, blur: 4 }
  },
  subtitle: {
    visible: true,
    text: 'Subtítulo de apoyo',
    font: 'Montserrat',
    size: 36,
    color: '#cccccc',
    weight: '400',
    style: 'normal',
    letterSpacing: 2,
    transform: 'none'
  },
  body: {
    visible: false,
    text: 'Texto descriptivo adicional aquí',
    font: 'Poppins',
    size: 24,
    color: '#aaaaaa',
    weight: '400'
  },

  // Layout
  layout: {
    marginAll: 60,
    independentMargins: false,
    margins: { top: 60, right: 60, bottom: 60, left: 60 },
    alignH: 'left',
    alignV: 'middle',
    gapTitleSubtitle: 20,
    gapSubtitleBody: 16
  },

  // Colores de fondo
  bg: {
    color: '#000000',
    gradient: {
      on: false,
      type: 'linear',
      color1: '#000000',
      color2: '#333333',
      angle: 135,
      opacity: 100
    },
    overlay: {
      on: false,
      color: '#000000',
      opacity: 40,
      blendMode: 'normal'
    }
  },

  // Animación
  anim: {
    current: 'particles',
    speed: 1.0,
    fps: 30,
    scale: 1.0,
    opacity: 100,
    color: '#ffffff',
    seed: 42,
    params: {
      particles: { count: 80, size: 3, distance: 120, lineColor: '#ffffff' },
      waves: { count: 4, amplitude: 60, freq: 0.012, weight: 1.5 },
      noiseField: { resolution: 20, vectorLen: 20, noiseScale: 0.003 },
      gridPulse: { cols: 20, rows: 26, elemSize: 8, speed: 1.0 },
      circlesGrow: { count: 8, speed: 1.0, weight: 1, fill: false },
      glitchBars: { count: 12, intensity: 30, color2: '#ff0055' },
      gradientMesh: { points: 5, color1: '#ff006e', color2: '#8338ec', color3: '#3a86ff', smooth: 0.003 },
      starfield: { count: 200, speed: 1.0, depth: 0.5 },
      matrixRain: { density: 0.02, dropSpeed: 15, charset: 'latin' },
      geometricRotation: { shape: 'triangle', count: 10, speed: 1.0, weight: 1 }
    }
  },

  // UI
  showGuides: false,
  playing: true,

  // Exportación
  export: {
    scale: 1,
    duration: 3
  }
};

/* =====================================================
   INSTANCIA p5.js (modo instance)
   ===================================================== */
const CANVAS_W = 1080;
const CANVAS_H = 1350;

let p5Instance = null;
let currentAnimation = null;
let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 0;

const sketch = (p) => {

  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_W, CANVAS_H);
    canvas.parent('canvas-container');
    p.frameRate(state.anim.fps);
    p.colorMode(p.RGB, 255);
    p.pixelDensity(1); // para que sea siempre 1080×1350 exacto
    initAnimation();
  };

  p.draw = () => {
    if (!state.playing) return;

    // FPS counter
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 500) {
      currentFps = Math.round(frameCount / ((now - lastFpsTime) / 1000));
      frameCount = 0;
      lastFpsTime = now;
      const fpsEl = document.getElementById('fps-display');
      if (fpsEl) fpsEl.textContent = currentFps + ' FPS';
    }

    // Fondo base
    const bg = state.bg;
    const [bgR, bgG, bgB] = hexToRgbArr(bg.color);
    p.background(bgR, bgG, bgB);

    // Gradiente de fondo (si activo)
    if (bg.gradient.on) drawGradientBg(p);

    // Animación con escala y opacidad
    p.push();
    const sc = state.anim.scale;
    p.translate(CANVAS_W/2, CANVAS_H/2);
    p.scale(sc);
    p.translate(-CANVAS_W/2, -CANVAS_H/2);
    p.drawingContext.globalAlpha = state.anim.opacity / 100;
    if (currentAnimation) currentAnimation.draw();
    p.drawingContext.globalAlpha = 1.0;
    p.pop();

    // Overlay
    if (bg.overlay.on) drawOverlay(p);

    // Capa de texto
    drawTextLayer(p, state);

    // Guías (si activas)
    if (state.showGuides) drawGuidesOnCanvas(p);
  };
};

// Dibuja gradiente sobre el canvas usando 2D context nativo
function drawGradientBg(p) {
  const ctx = p.drawingContext;
  const g = state.bg.gradient;
  const alpha = g.opacity / 100;
  ctx.save();
  ctx.globalAlpha = alpha;

  let grad;
  if (g.type === 'linear') {
    const rad = (g.angle * Math.PI) / 180;
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
    const dx = Math.cos(rad) * CANVAS_W, dy = Math.sin(rad) * CANVAS_H;
    grad = ctx.createLinearGradient(cx - dx/2, cy - dy/2, cx + dx/2, cy + dy/2);
  } else if (g.type === 'radial') {
    grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 0, CANVAS_W/2, CANVAS_H/2, Math.max(CANVAS_W, CANVAS_H)/2);
  } else {
    // conic: aproximar con radial
    grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 0, CANVAS_W/2, CANVAS_H/2, CANVAS_H);
  }

  grad.addColorStop(0, g.color1);
  grad.addColorStop(1, g.color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

// Dibuja overlay de color
function drawOverlay(p) {
  const ctx = p.drawingContext;
  const ov = state.bg.overlay;
  const [r, g, b] = hexToRgbArr(ov.color);
  ctx.save();
  ctx.globalAlpha = ov.opacity / 100;
  ctx.globalCompositeOperation = ov.blendMode;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

// Dibuja guías de márgenes sobre el canvas
function drawGuidesOnCanvas(p) {
  const layout = state.layout;
  const M = layout.independentMargins ? layout.margins : {
    top: layout.marginAll, right: layout.marginAll,
    bottom: layout.marginAll, left: layout.marginAll
  };

  p.push();
  p.noFill();
  p.stroke(255, 80, 80, 150);
  p.strokeWeight(1);
  p.drawingContext.setLineDash([8, 6]);
  p.rect(M.left, M.top, CANVAS_W - M.left - M.right, CANVAS_H - M.top - M.bottom);
  // Cruz central
  p.stroke(80, 150, 255, 120);
  p.line(CANVAS_W/2, 0, CANVAS_W/2, CANVAS_H);
  p.line(0, CANVAS_H/2, CANVAS_W, CANVAS_H/2);
  p.drawingContext.setLineDash([]);
  p.pop();
}

// Inicializa la animación actual
function initAnimation() {
  const AnimClass = ANIMATIONS[state.anim.current];
  if (!AnimClass || !p5Instance) return;
  currentAnimation = new AnimClass(p5Instance, state);
}

/* =====================================================
   HELPERS
   ===================================================== */
function hexToRgbArr(hex) {
  return [
    parseInt(hex.slice(1,3),16),
    parseInt(hex.slice(3,5),16),
    parseInt(hex.slice(5,7),16)
  ];
}

// Notificaciones toast
function showToast(msg, type='info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3000);
}

/* =====================================================
   BINDINGS — conecta controles del sidebar con estado
   ===================================================== */
function bindControls() {

  // Helpers genéricos
  const el = id => document.getElementById(id);
  const onInput = (id, fn) => {
    const e = el(id);
    if (e) e.addEventListener('input', fn);
  };
  const onChange = (id, fn) => {
    const e = el(id);
    if (e) e.addEventListener('change', fn);
  };
  const onCheck = (id, fn) => {
    const e = el(id);
    if (e) e.addEventListener('change', fn);
  };
  const sliderWithDisplay = (sliderId, displayId, fn, multiplier=1, decimals=0) => {
    const s = el(sliderId);
    const d = el(displayId);
    if (!s) return;
    s.addEventListener('input', () => {
      const v = parseFloat(s.value) * multiplier;
      if (d) d.textContent = decimals > 0 ? v.toFixed(decimals) : v;
      fn(v);
    });
  };

  // —— Título ——
  onInput('txt-title', e => { state.title.text = e.target.value; });
  onChange('font-title', e => {
    if (e.target.value === 'custom') {
      el('font-title-custom-row').classList.remove('hidden');
    } else {
      el('font-title-custom-row').classList.add('hidden');
      state.title.font = e.target.value;
    }
  });
  onInput('font-title-custom-url', e => {
    loadCustomFont(e.target.value, 'title-custom');
    state.title.font = 'title-custom';
  });
  sliderWithDisplay('title-size', 'title-size-val', v => { state.title.size = v; });
  onInput('title-color', e => { state.title.color = e.target.value; });
  onChange('title-weight', e => { state.title.weight = e.target.value; });
  onChange('title-style', e => { state.title.style = e.target.value; });
  sliderWithDisplay('title-letter-spacing', 'title-ls-val', v => { state.title.letterSpacing = v; });
  sliderWithDisplay('title-line-height', 'title-lh-val', v => {
    state.title.lineHeight = v;
  }, 0.01, 2);
  onChange('title-transform', e => { state.title.transform = e.target.value; });

  // Sombra del título
  onCheck('title-shadow-on', e => {
    state.title.shadow.on = e.target.checked;
    el('title-shadow-controls').classList.toggle('hidden', !e.target.checked);
  });
  onInput('title-shadow-color', e => { state.title.shadow.color = e.target.value; });
  sliderWithDisplay('title-shadow-x', 'title-sx-val', v => { state.title.shadow.x = v; });
  sliderWithDisplay('title-shadow-y', 'title-sy-val', v => { state.title.shadow.y = v; });
  sliderWithDisplay('title-shadow-blur', 'title-sb-val', v => { state.title.shadow.blur = v; });

  // —— Subtítulo ——
  onCheck('subtitle-visible', e => { state.subtitle.visible = e.target.checked; });
  onInput('txt-subtitle', e => { state.subtitle.text = e.target.value; });
  onChange('font-subtitle', e => { state.subtitle.font = e.target.value; });
  sliderWithDisplay('subtitle-size', 'subtitle-size-val', v => { state.subtitle.size = v; });
  onInput('subtitle-color', e => { state.subtitle.color = e.target.value; });
  onChange('subtitle-weight', e => { state.subtitle.weight = e.target.value; });
  onChange('subtitle-style', e => { state.subtitle.style = e.target.value; });
  sliderWithDisplay('subtitle-letter-spacing', 'subtitle-ls-val', v => { state.subtitle.letterSpacing = v; });
  onChange('subtitle-transform', e => { state.subtitle.transform = e.target.value; });

  // —— Body ——
  onCheck('body-visible', e => { state.body.visible = e.target.checked; });
  onInput('txt-body', e => { state.body.text = e.target.value; });
  onChange('font-body', e => { state.body.font = e.target.value; });
  sliderWithDisplay('body-size', 'body-size-val', v => { state.body.size = v; });
  onInput('body-color', e => { state.body.color = e.target.value; });
  onChange('body-weight', e => { state.body.weight = e.target.value; });

  // —— Layout ——
  onCheck('margins-independent', e => {
    state.layout.independentMargins = e.target.checked;
    el('margin-unified').classList.toggle('hidden', e.target.checked);
    el('margin-individual').classList.toggle('hidden', !e.target.checked);
  });
  sliderWithDisplay('margin-all', 'margin-all-val', v => { state.layout.marginAll = v; });
  sliderWithDisplay('margin-top', 'margin-top-val', v => { state.layout.margins.top = v; });
  sliderWithDisplay('margin-right', 'margin-right-val', v => { state.layout.margins.right = v; });
  sliderWithDisplay('margin-bottom', 'margin-bottom-val', v => { state.layout.margins.bottom = v; });
  sliderWithDisplay('margin-left', 'margin-left-val', v => { state.layout.margins.left = v; });

  // Alineación horizontal
  document.querySelectorAll('.btn-align').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-align').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.layout.alignH = btn.dataset.alignH;
    });
  });

  // Alineación vertical
  document.querySelectorAll('.btn-align-v').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-align-v').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.layout.alignV = btn.dataset.alignV;
    });
  });

  sliderWithDisplay('gap-title-subtitle', 'gap-ts-val', v => { state.layout.gapTitleSubtitle = v; });
  sliderWithDisplay('gap-subtitle-body', 'gap-sb-val', v => { state.layout.gapSubtitleBody = v; });

  // —— Colores y fondo ——
  onInput('bg-color', e => { state.bg.color = e.target.value; });

  onCheck('gradient-on', e => {
    state.bg.gradient.on = e.target.checked;
    el('gradient-controls').classList.toggle('hidden', !e.target.checked);
  });
  onChange('gradient-type', e => {
    state.bg.gradient.type = e.target.value;
    el('gradient-angle-row').classList.toggle('hidden', e.target.value !== 'linear');
  });
  onInput('gradient-color1', e => { state.bg.gradient.color1 = e.target.value; });
  onInput('gradient-color2', e => { state.bg.gradient.color2 = e.target.value; });
  sliderWithDisplay('gradient-angle', 'gradient-angle-val', v => { state.bg.gradient.angle = v; });
  sliderWithDisplay('gradient-opacity', 'gradient-opacity-val', v => { state.bg.gradient.opacity = v; });

  onCheck('overlay-on', e => {
    state.bg.overlay.on = e.target.checked;
    el('overlay-controls').classList.toggle('hidden', !e.target.checked);
  });
  onInput('overlay-color', e => { state.bg.overlay.color = e.target.value; });
  sliderWithDisplay('overlay-opacity', 'overlay-opacity-val', v => { state.bg.overlay.opacity = v; });
  onChange('overlay-blend', e => { state.bg.overlay.blendMode = e.target.value; });

  // —— Animación ——
  onChange('anim-select', e => {
    state.anim.current = e.target.value;
    showAnimParams(e.target.value);
    initAnimation();
  });

  sliderWithDisplay('anim-speed', 'anim-speed-val', v => { state.anim.speed = v; }, 0.1, 1);
  onChange('anim-fps', e => {
    state.anim.fps = parseInt(e.target.value);
    if (p5Instance) p5Instance.frameRate(state.anim.fps);
  });
  sliderWithDisplay('anim-scale', 'anim-scale-val', v => { state.anim.scale = v; }, 0.1, 1);
  sliderWithDisplay('anim-opacity', 'anim-opacity-val', v => { state.anim.opacity = v; });
  onInput('anim-color', e => { state.anim.color = e.target.value; });
  onChange('anim-seed', e => {
    state.anim.seed = parseInt(e.target.value) || 0;
    if (currentAnimation) currentAnimation.reset();
    initAnimation();
  });

  // Parámetros específicos de cada animación
  bindAnimParams();

  // —— Toolbar ——
  el('btn-play-pause').addEventListener('click', () => {
    state.playing = !state.playing;
    const btn = el('btn-play-pause');
    const label = el('play-label');
    btn.classList.toggle('active', state.playing);
    label.textContent = state.playing ? 'Pause' : 'Play';
    const icon = el('play-icon');
    if (state.playing) {
      icon.setAttribute('d', 'M8 5v14l11-7z');
    } else {
      icon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
    }
  });

  el('btn-reset').addEventListener('click', () => {
    if (currentAnimation) currentAnimation.reset();
    initAnimation();
    showToast('Animación reiniciada');
  });

  el('btn-guides').addEventListener('click', () => {
    state.showGuides = !state.showGuides;
    el('btn-guides').classList.toggle('active', state.showGuides);
  });

  // —— Exportación (toolbar) ——
  el('btn-export-png').addEventListener('click', exportPNG);
  el('btn-export-gif').addEventListener('click', () => exportGIF());
  el('btn-export-webm').addEventListener('click', () => exportWebM());

  // —— Exportación (sidebar) ——
  el('btn-capture-png').addEventListener('click', exportPNG);
  el('btn-export-gif-sidebar').addEventListener('click', () => exportGIF());
  el('btn-export-webm-sidebar').addEventListener('click', () => exportWebM());
  onChange('export-scale', e => { state.export.scale = parseInt(e.target.value); });
  sliderWithDisplay('export-duration', 'export-dur-val', v => { state.export.duration = v; });

  // —— Presets ——
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
  });
  el('btn-save-preset').addEventListener('click', saveCustomPreset);
  el('btn-load-preset').addEventListener('click', loadCustomPreset);
  el('btn-delete-preset').addEventListener('click', deleteCustomPreset);
  el('btn-export-config').addEventListener('click', exportConfig);
  el('btn-import-config').addEventListener('click', () => el('import-file').click());
  el('import-file').addEventListener('change', importConfig);

  // —— Redimensionar canvas al cambiar tamaño de ventana ——
  window.addEventListener('resize', resizeCanvasWrapper);
}

/* =====================================================
   PARÁMETROS ESPECÍFICOS DE ANIMACIÓN
   ===================================================== */
function bindAnimParams() {
  const el = id => document.getElementById(id);
  const sliderDisp = (sliderId, displayId, fn, mult=1, dec=0) => {
    const s = el(sliderId);
    const d = el(displayId);
    if (!s) return;
    s.addEventListener('input', () => {
      const v = parseFloat(s.value) * mult;
      if (d) d.textContent = dec > 0 ? v.toFixed(dec) : v;
      fn(v);
    });
  };

  // Particles
  sliderDisp('p-count', 'p-count-val', v => { state.anim.params.particles.count = v; });
  sliderDisp('p-size', 'p-size-val', v => { state.anim.params.particles.size = v; });
  sliderDisp('p-dist', 'p-dist-val', v => { state.anim.params.particles.distance = v; });
  el('p-line-color').addEventListener('input', e => { state.anim.params.particles.lineColor = e.target.value; });

  // Waves
  sliderDisp('w-count', 'w-count-val', v => { state.anim.params.waves.count = v; });
  sliderDisp('w-amplitude', 'w-amplitude-val', v => { state.anim.params.waves.amplitude = v; });
  sliderDisp('w-freq', 'w-freq-val', v => { state.anim.params.waves.freq = v; }, 0.001, 3);
  sliderDisp('w-weight', 'w-weight-val', v => { state.anim.params.waves.weight = v; }, 0.5, 1);

  // Noise field
  sliderDisp('nf-res', 'nf-res-val', v => { state.anim.params.noiseField.resolution = v; });
  sliderDisp('nf-len', 'nf-len-val', v => { state.anim.params.noiseField.vectorLen = v; });
  sliderDisp('nf-noise-scale', 'nf-scale-val', v => { state.anim.params.noiseField.noiseScale = v; }, 0.001, 3);

  // Grid pulse
  sliderDisp('gp-cols', 'gp-cols-val', v => { state.anim.params.gridPulse.cols = v; });
  sliderDisp('gp-rows', 'gp-rows-val', v => { state.anim.params.gridPulse.rows = v; });
  sliderDisp('gp-size', 'gp-size-val', v => { state.anim.params.gridPulse.elemSize = v; });
  sliderDisp('gp-speed', 'gp-speed-val', v => { state.anim.params.gridPulse.speed = v; }, 0.1, 1);

  // Circles grow
  sliderDisp('cg-count', 'cg-count-val', v => { state.anim.params.circlesGrow.count = v; });
  sliderDisp('cg-speed', 'cg-speed-val', v => { state.anim.params.circlesGrow.speed = v; }, 0.1, 1);
  sliderDisp('cg-weight', 'cg-weight-val', v => { state.anim.params.circlesGrow.weight = v; });
  el('cg-fill').addEventListener('change', e => { state.anim.params.circlesGrow.fill = e.target.checked; });

  // Glitch bars
  sliderDisp('gb-count', 'gb-count-val', v => { state.anim.params.glitchBars.count = v; });
  sliderDisp('gb-intensity', 'gb-intensity-val', v => { state.anim.params.glitchBars.intensity = v; });
  el('gb-color2').addEventListener('input', e => { state.anim.params.glitchBars.color2 = e.target.value; });

  // Gradient mesh
  sliderDisp('gm-points', 'gm-points-val', v => { state.anim.params.gradientMesh.points = v; });
  el('gm-c1').addEventListener('input', e => { state.anim.params.gradientMesh.color1 = e.target.value; });
  el('gm-c2').addEventListener('input', e => { state.anim.params.gradientMesh.color2 = e.target.value; });
  el('gm-c3').addEventListener('input', e => { state.anim.params.gradientMesh.color3 = e.target.value; });
  sliderDisp('gm-smooth', 'gm-smooth-val', v => { state.anim.params.gradientMesh.smooth = v; }, 0.001, 3);

  // Starfield
  sliderDisp('sf-count', 'sf-count-val', v => { state.anim.params.starfield.count = v; if(currentAnimation) currentAnimation.reset(); });
  sliderDisp('sf-speed', 'sf-speed-val', v => { state.anim.params.starfield.speed = v; }, 0.1, 1);
  sliderDisp('sf-depth', 'sf-depth-val', v => { state.anim.params.starfield.depth = v; }, 0.1, 1);

  // Matrix rain
  sliderDisp('mr-density', 'mr-density-val', v => { state.anim.params.matrixRain.density = v; }, 0.01, 2);
  sliderDisp('mr-speed', 'mr-speed-val', v => { state.anim.params.matrixRain.dropSpeed = v; });
  el('mr-charset').addEventListener('change', e => { state.anim.params.matrixRain.charset = e.target.value; });

  // Geometric rotation
  el('gr-shape').addEventListener('change', e => { state.anim.params.geometricRotation.shape = e.target.value; });
  sliderDisp('gr-count', 'gr-count-val', v => {
    state.anim.params.geometricRotation.count = v;
    if (currentAnimation) currentAnimation.reset();
    initAnimation();
  });
  sliderDisp('gr-speed', 'gr-speed-val', v => { state.anim.params.geometricRotation.speed = v; }, 0.1, 1);
  sliderDisp('gr-weight', 'gr-weight-val', v => { state.anim.params.geometricRotation.weight = v; });
}

// Muestra/oculta el panel de parámetros correspondiente a la animación seleccionada
function showAnimParams(animName) {
  document.querySelectorAll('.anim-params').forEach(el => el.classList.add('hidden'));
  const mapName = {
    'particles': 'particles',
    'waves': 'waves',
    'noise-field': 'noise-field',
    'grid-pulse': 'grid-pulse',
    'circles-grow': 'circles-grow',
    'glitch-bars': 'glitch-bars',
    'gradient-mesh': 'gradient-mesh',
    'starfield': 'starfield',
    'matrix-rain': 'matrix-rain',
    'geometric-rotation': 'geometric-rotation'
  };
  const paramId = 'params-' + (mapName[animName] || animName);
  const paramEl = document.getElementById(paramId);
  if (paramEl) paramEl.classList.remove('hidden');
}

/* =====================================================
   ESCALADO DEL CANVAS WRAPPER
   ===================================================== */
function resizeCanvasWrapper() {
  const canvasArea = document.getElementById('canvas-area');
  const wrapper = document.getElementById('canvas-wrapper');
  if (!canvasArea || !wrapper) return;

  const areaW = canvasArea.clientWidth - 40;  // padding
  const areaH = canvasArea.clientHeight - 40;
  const aspect = CANVAS_W / CANVAS_H; // 1080/1350 ≈ 0.8

  let w, h;
  if (areaW / areaH > aspect) {
    h = areaH;
    w = h * aspect;
  } else {
    w = areaW;
    h = w / aspect;
  }

  wrapper.style.width = w + 'px';
  wrapper.style.height = h + 'px';
}

/* =====================================================
   CARGA DE FUENTES PERSONALIZADAS
   ===================================================== */
function loadCustomFont(url, familyName) {
  if (!url || url.length < 10) return;
  const existing = document.getElementById('custom-font-link');
  if (existing) existing.remove();
  const link = document.createElement('link');
  link.id = 'custom-font-link';
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

/* =====================================================
   EXPORTACIÓN
   ===================================================== */

// Exportar PNG del frame actual a resolución completa
function exportPNG() {
  const scale = state.export.scale;
  const wasPlaying = state.playing;

  // Pausar brevemente para capturar frame limpio
  state.playing = false;

  setTimeout(() => {
    const canvasEl = document.querySelector('#canvas-container canvas');
    if (!canvasEl) { showToast('Canvas no encontrado', 'error'); return; }

    if (scale === 1) {
      // Captura directa
      const dataURL = canvasEl.toDataURL('image/png');
      downloadDataURL(dataURL, 'instagram-frame.png');
      showToast('PNG exportado (1080×1350)', 'success');
    } else {
      // Renderizar a escala superior
      const offCanvas = document.createElement('canvas');
      offCanvas.width = CANVAS_W * scale;
      offCanvas.height = CANVAS_H * scale;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(canvasEl, 0, 0, offCanvas.width, offCanvas.height);
      const dataURL = offCanvas.toDataURL('image/png');
      downloadDataURL(dataURL, `instagram-frame-${scale}x.png`);
      showToast(`PNG exportado (${CANVAS_W*scale}×${CANVAS_H*scale})`, 'success');
    }

    state.playing = wasPlaying;
  }, 50);
}

// Exportar GIF usando gif.js
function exportGIF() {
  const duration = state.export.duration;
  const fps = Math.min(state.anim.fps, 15); // GIF limitado a ~15fps para tamaño
  const totalFrames = duration * fps;
  const frameDelay = 1000 / fps;

  const canvasEl = document.querySelector('#canvas-container canvas');
  if (!canvasEl) { showToast('Canvas no encontrado', 'error'); return; }

  if (typeof GIF === 'undefined') {
    showToast('gif.js no disponible. Usa WebM.', 'error');
    return;
  }

  showProgress(true, 'Iniciando GIF...');

  const gif = new GIF({
    workers: 2,
    quality: 8,
    width: CANVAS_W,
    height: CANVAS_H,
    workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
  });

  const wasPlaying = state.playing;
  state.playing = true;

  let captured = 0;

  const captureFrame = () => {
    if (captured >= totalFrames) {
      gif.render();
      return;
    }

    gif.addFrame(canvasEl, { delay: frameDelay, copy: true });
    captured++;
    updateProgress(captured / totalFrames, `Capturando frame ${captured}/${totalFrames}`);
    setTimeout(captureFrame, frameDelay);
  };

  gif.on('finished', blob => {
    const url = URL.createObjectURL(blob);
    downloadURL(url, 'instagram-animation.gif');
    URL.revokeObjectURL(url);
    showProgress(false);
    showToast('GIF exportado exitosamente', 'success');
    state.playing = wasPlaying;
  });

  gif.on('progress', p => {
    updateProgress(p, `Renderizando GIF... ${Math.round(p*100)}%`);
  });

  captureFrame();
}

// Exportar WebM usando MediaRecorder
function exportWebM() {
  const canvasEl = document.querySelector('#canvas-container canvas');
  if (!canvasEl) { showToast('Canvas no encontrado', 'error'); return; }

  if (!window.MediaRecorder) {
    showToast('MediaRecorder no soportado en este navegador', 'error');
    return;
  }

  const duration = state.export.duration * 1000;
  const stream = canvasEl.captureStream(state.anim.fps);

  // Determinar MIME soportado
  const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  let mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
  const chunks = [];

  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    downloadURL(url, 'instagram-animation.webm');
    URL.revokeObjectURL(url);
    showProgress(false);
    showToast('WebM exportado exitosamente', 'success');
  };

  showProgress(true, 'Grabando WebM...');
  const wasPlaying = state.playing;
  state.playing = true;
  recorder.start();

  let elapsed = 0;
  const interval = setInterval(() => {
    elapsed += 100;
    updateProgress(elapsed / duration, `Grabando... ${(elapsed/1000).toFixed(1)}s / ${duration/1000}s`);
    if (elapsed >= duration) {
      clearInterval(interval);
      recorder.stop();
      state.playing = wasPlaying;
    }
  }, 100);
}

// Helpers de descarga
function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  a.click();
}
function downloadURL(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

// Progreso
function showProgress(show, msg='') {
  const el = document.getElementById('export-progress');
  if (!el) return;
  el.classList.toggle('hidden', !show);
  if (show && msg) document.getElementById('progress-text').textContent = msg;
}
function updateProgress(ratio, msg) {
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  if (fill) fill.style.width = (ratio * 100) + '%';
  if (text && msg) text.textContent = msg;
}

/* =====================================================
   PRESETS
   ===================================================== */
const BUILTIN_PRESETS = {
  'minimal-dark': {
    title: { text: 'MINIMAL', font: 'Bebas Neue', size: 120, color: '#ffffff', weight: '400', style: 'normal', letterSpacing: 8, lineHeight: 1.0, transform: 'uppercase', shadow: { on: false, color: '#000000', x: 0, y: 0, blur: 0 } },
    subtitle: { visible: true, text: 'menos es más', font: 'Montserrat', size: 28, color: '#888888', weight: '300', style: 'normal', letterSpacing: 6, transform: 'lowercase' },
    body: { visible: false, text: '', font: 'Poppins', size: 20, color: '#666666', weight: '300' },
    layout: { marginAll: 80, independentMargins: false, margins: {top:80,right:80,bottom:80,left:80}, alignH: 'center', alignV: 'middle', gapTitleSubtitle: 20, gapSubtitleBody: 16 },
    bg: { color: '#000000', gradient: { on: false, type: 'linear', color1: '#000', color2: '#111', angle: 135, opacity: 100 }, overlay: { on: false, color: '#000', opacity: 30, blendMode: 'normal' } },
    anim: { current: 'particles', speed: 0.4, fps: 30, scale: 1.0, opacity: 30, color: '#ffffff', seed: 42 }
  },
  'neon-glow': {
    title: { text: 'NEON', font: 'Bebas Neue', size: 140, color: '#ff006e', weight: '400', style: 'normal', letterSpacing: 10, lineHeight: 1.0, transform: 'uppercase', shadow: { on: true, color: '#ff006e', x: 0, y: 0, blur: 20 } },
    subtitle: { visible: true, text: 'VIBES ONLY', font: 'Space Mono', size: 32, color: '#8338ec', weight: '700', style: 'normal', letterSpacing: 8, transform: 'uppercase' },
    body: { visible: false, text: '', font: 'Inter', size: 20, color: '#aaa', weight: '300' },
    layout: { marginAll: 60, independentMargins: false, margins: {top:60,right:60,bottom:60,left:60}, alignH: 'center', alignV: 'middle', gapTitleSubtitle: 24, gapSubtitleBody: 16 },
    bg: { color: '#05001a', gradient: { on: true, type: 'linear', color1: '#05001a', color2: '#1a0033', angle: 135, opacity: 100 }, overlay: { on: false, color: '#000', opacity: 30, blendMode: 'normal' } },
    anim: { current: 'waves', speed: 0.8, fps: 30, scale: 1.0, opacity: 60, color: '#8338ec', seed: 7 }
  },
  'editorial-clean': {
    title: { text: 'Editorial', font: 'Playfair Display', size: 96, color: '#111111', weight: '700', style: 'italic', letterSpacing: -2, lineHeight: 1.1, transform: 'none', shadow: { on: false, color: '#000', x: 0, y: 0, blur: 0 } },
    subtitle: { visible: true, text: 'Design & Culture', font: 'Inter', size: 28, color: '#444444', weight: '300', style: 'normal', letterSpacing: 4, transform: 'none' },
    body: { visible: true, text: 'Una publicación sobre diseño y tendencias contemporáneas.', font: 'Inter', size: 18, color: '#777777', weight: '300' },
    layout: { marginAll: 80, independentMargins: false, margins: {top:80,right:80,bottom:80,left:80}, alignH: 'left', alignV: 'bottom', gapTitleSubtitle: 24, gapSubtitleBody: 20 },
    bg: { color: '#f5f0eb', gradient: { on: false, type: 'linear', color1: '#f5f0eb', color2: '#ede8e3', angle: 180, opacity: 100 }, overlay: { on: false, color: '#fff', opacity: 0, blendMode: 'normal' } },
    anim: { current: 'particles', speed: 0.1, fps: 30, scale: 1.0, opacity: 0, color: '#ccbbaa', seed: 1 }
  },
  'retro-grid': {
    title: { text: 'RETRO\nGRID', font: 'Space Mono', size: 80, color: '#ff6b35', weight: '700', style: 'normal', letterSpacing: 4, lineHeight: 1.2, transform: 'uppercase', shadow: { on: false, color: '#000', x: 0, y: 0, blur: 0 } },
    subtitle: { visible: true, text: '// 1984 →', font: 'Space Mono', size: 24, color: '#ffbe0b', weight: '400', style: 'normal', letterSpacing: 2, transform: 'none' },
    body: { visible: false, text: '', font: 'Space Mono', size: 16, color: '#888', weight: '400' },
    layout: { marginAll: 60, independentMargins: false, margins: {top:60,right:60,bottom:60,left:60}, alignH: 'left', alignV: 'middle', gapTitleSubtitle: 20, gapSubtitleBody: 12 },
    bg: { color: '#0d0d1a', gradient: { on: true, type: 'linear', color1: '#0d0d1a', color2: '#1a0d2e', angle: 180, opacity: 100 }, overlay: { on: false, color: '#000', opacity: 30, blendMode: 'normal' } },
    anim: { current: 'grid-pulse', speed: 1.2, fps: 30, scale: 1.0, opacity: 80, color: '#ff6b35', seed: 13 }
  },
  'cosmic': {
    title: { text: 'COSMIC', font: 'Bebas Neue', size: 130, color: '#ffffff', weight: '400', style: 'normal', letterSpacing: 12, lineHeight: 1.0, transform: 'uppercase', shadow: { on: true, color: '#3a86ff', x: 0, y: 0, blur: 30 } },
    subtitle: { visible: true, text: 'EXPLORE THE UNIVERSE', font: 'Montserrat', size: 26, color: '#aaaaff', weight: '300', style: 'normal', letterSpacing: 6, transform: 'uppercase' },
    body: { visible: false, text: '', font: 'Inter', size: 20, color: '#8888cc', weight: '300' },
    layout: { marginAll: 70, independentMargins: false, margins: {top:70,right:70,bottom:70,left:70}, alignH: 'center', alignV: 'middle', gapTitleSubtitle: 28, gapSubtitleBody: 16 },
    bg: { color: '#000010', gradient: { on: true, type: 'radial', color1: '#08085a', color2: '#000010', angle: 180, opacity: 100 }, overlay: { on: false, color: '#000', opacity: 20, blendMode: 'normal' } },
    anim: { current: 'starfield', speed: 1.5, fps: 30, scale: 1.0, opacity: 100, color: '#aaaaff', seed: 99 }
  }
};

function loadPreset(name) {
  const preset = BUILTIN_PRESETS[name];
  if (!preset) return;
  applyPreset(preset);
  showToast(`Preset "${name}" aplicado`, 'success');
}

// Aplica un preset al estado y actualiza todos los controles del UI
function applyPreset(preset) {
  // Fusionar preset en estado
  deepMerge(state, preset);

  // Actualizar controles del DOM para reflejar el estado
  syncUIFromState();

  // Reiniciar animación
  initAnimation();
  showAnimParams(state.anim.current);
}

// Fusión profunda de objetos
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

// Sincroniza el DOM con el estado actual (para cargar presets)
function syncUIFromState() {
  const el = id => document.getElementById(id);
  const set = (id, val) => { const e = el(id); if (e) e.value = val; };
  const setCheck = (id, val) => { const e = el(id); if (e) e.checked = val; };
  const setDisp = (id, val, decimals=0) => { const e = el(id); if (e) e.textContent = decimals > 0 ? val.toFixed(decimals) : val; };

  // Título
  set('txt-title', state.title.text);
  set('font-title', state.title.font);
  set('title-size', state.title.size); setDisp('title-size-val', state.title.size);
  set('title-color', state.title.color);
  set('title-weight', state.title.weight);
  set('title-style', state.title.style);
  set('title-letter-spacing', state.title.letterSpacing); setDisp('title-ls-val', state.title.letterSpacing);
  set('title-line-height', state.title.lineHeight * 100); setDisp('title-lh-val', state.title.lineHeight, 2);
  set('title-transform', state.title.transform);
  setCheck('title-shadow-on', state.title.shadow.on);
  el('title-shadow-controls').classList.toggle('hidden', !state.title.shadow.on);

  // Subtítulo
  setCheck('subtitle-visible', state.subtitle.visible);
  set('txt-subtitle', state.subtitle.text);
  set('font-subtitle', state.subtitle.font);
  set('subtitle-size', state.subtitle.size); setDisp('subtitle-size-val', state.subtitle.size);
  set('subtitle-color', state.subtitle.color);
  set('subtitle-weight', state.subtitle.weight);
  set('subtitle-style', state.subtitle.style);
  set('subtitle-letter-spacing', state.subtitle.letterSpacing); setDisp('subtitle-ls-val', state.subtitle.letterSpacing);
  set('subtitle-transform', state.subtitle.transform);

  // Body
  setCheck('body-visible', state.body.visible);
  set('txt-body', state.body.text);
  set('font-body', state.body.font);
  set('body-size', state.body.size); setDisp('body-size-val', state.body.size);
  set('body-color', state.body.color);
  set('body-weight', state.body.weight);

  // Layout
  set('margin-all', state.layout.marginAll); setDisp('margin-all-val', state.layout.marginAll);
  setCheck('margins-independent', state.layout.independentMargins);
  el('margin-unified').classList.toggle('hidden', state.layout.independentMargins);
  el('margin-individual').classList.toggle('hidden', !state.layout.independentMargins);
  set('gap-title-subtitle', state.layout.gapTitleSubtitle); setDisp('gap-ts-val', state.layout.gapTitleSubtitle);
  set('gap-subtitle-body', state.layout.gapSubtitleBody); setDisp('gap-sb-val', state.layout.gapSubtitleBody);

  // Botones de alineación
  document.querySelectorAll('.btn-align').forEach(b => b.classList.toggle('active', b.dataset.alignH === state.layout.alignH));
  document.querySelectorAll('.btn-align-v').forEach(b => b.classList.toggle('active', b.dataset.alignV === state.layout.alignV));

  // Fondo
  set('bg-color', state.bg.color);
  setCheck('gradient-on', state.bg.gradient.on);
  el('gradient-controls').classList.toggle('hidden', !state.bg.gradient.on);
  set('gradient-type', state.bg.gradient.type);
  set('gradient-color1', state.bg.gradient.color1);
  set('gradient-color2', state.bg.gradient.color2);
  set('gradient-angle', state.bg.gradient.angle); setDisp('gradient-angle-val', state.bg.gradient.angle);
  set('gradient-opacity', state.bg.gradient.opacity); setDisp('gradient-opacity-val', state.bg.gradient.opacity);
  setCheck('overlay-on', state.bg.overlay.on);
  el('overlay-controls').classList.toggle('hidden', !state.bg.overlay.on);
  set('overlay-color', state.bg.overlay.color);
  set('overlay-opacity', state.bg.overlay.opacity); setDisp('overlay-opacity-val', state.bg.overlay.opacity);
  set('overlay-blend', state.bg.overlay.blendMode);

  // Animación
  set('anim-select', state.anim.current);
  set('anim-speed', state.anim.speed * 10); setDisp('anim-speed-val', state.anim.speed, 1);
  set('anim-fps', state.anim.fps);
  set('anim-scale', state.anim.scale * 10); setDisp('anim-scale-val', state.anim.scale, 1);
  set('anim-opacity', state.anim.opacity); setDisp('anim-opacity-val', state.anim.opacity);
  set('anim-color', state.anim.color);
  set('anim-seed', state.anim.seed);

  showAnimParams(state.anim.current);
}

// Presets personalizados (localStorage)
function saveCustomPreset() {
  const name = prompt('Nombre del preset:');
  if (!name || !name.trim()) return;
  const key = 'preset_' + name.trim();
  const presets = getCustomPresets();
  presets[key] = JSON.parse(JSON.stringify(state));
  localStorage.setItem('ig-visualizer-presets', JSON.stringify(presets));
  updateCustomPresetsList();
  showToast(`Preset "${name}" guardado`, 'success');
}

function loadCustomPreset() {
  const sel = document.getElementById('custom-presets-list');
  if (!sel || !sel.value) return;
  const presets = getCustomPresets();
  const preset = presets[sel.value];
  if (preset) {
    applyPreset(preset);
    showToast(`Preset "${sel.value}" cargado`, 'success');
  }
}

function deleteCustomPreset() {
  const sel = document.getElementById('custom-presets-list');
  if (!sel || !sel.value) return;
  const presets = getCustomPresets();
  delete presets[sel.value];
  localStorage.setItem('ig-visualizer-presets', JSON.stringify(presets));
  updateCustomPresetsList();
  showToast('Preset eliminado');
}

function getCustomPresets() {
  try { return JSON.parse(localStorage.getItem('ig-visualizer-presets') || '{}'); }
  catch { return {}; }
}

function updateCustomPresetsList() {
  const sel = document.getElementById('custom-presets-list');
  if (!sel) return;
  const presets = getCustomPresets();
  sel.innerHTML = '<option value="">— Seleccionar preset —</option>';
  Object.keys(presets).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k.replace('preset_', '');
    sel.appendChild(opt);
  });
}

// Exportar/importar configuración JSON
function exportConfig() {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadURL(url, 'ig-visualizer-config.json');
  URL.revokeObjectURL(url);
  showToast('Configuración exportada');
}

function importConfig(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      applyPreset(imported);
      showToast('Configuración importada', 'success');
    } catch {
      showToast('Error al leer el archivo JSON', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/* =====================================================
   INICIALIZACIÓN
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Crear instancia p5
  p5Instance = new p5(sketch);

  // Ajustar wrapper del canvas
  setTimeout(resizeCanvasWrapper, 100);

  // Vincular controles
  bindControls();

  // Mostrar parámetros de animación por defecto
  showAnimParams(state.anim.current);

  // Cargar lista de presets custom
  updateCustomPresetsList();

  // Escuchar resize
  window.addEventListener('resize', resizeCanvasWrapper);
});
