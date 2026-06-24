/* =====================================================
   APP.JS — Processing Community Day 2026 Visualizer
   ===================================================== */

/* =====================================================
   CONSTANTES DE FORMATO
   ===================================================== */
const IG_W = 1080;
const IG_H = 1350;
const A5_W = 1748;
const A5_H = 2480;
const SLIDE11_W = 1000;
const SLIDE11_H = 1700;
const SLIDE12_W = 1920;
const SLIDE12_H = 1080;
const BANNER_W = 1600;
const BANNER_H = 400;
const BANNER_SPLIT = 800; // x split: left text panel | right pixel grid

// 0=bg, 1=fg, 2=mid(35% fg blend) — 16 cols × 10 rows static grid
const BANNER_GRID_PATTERN = [
  [1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 0, 1, 0, 0, 1, 1, 0],
  [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 2, 1, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 2, 1, 0, 1, 1],
  [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 2, 1, 0, 1, 1, 0, 1, 0, 0],
  [1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1],
  [0, 0, 1, 1, 0, 1, 0, 2, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
  [1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 2, 0, 1, 1, 0, 0, 1, 0, 0, 1],
  [0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0],
];
let _bannerGridData = null; // null = usa BANNER_GRID_PATTERN

/* =====================================================
   PRESETS DE COLOR
   ===================================================== */
const COLOR_PRESETS = [
  { id: "blanco", label: "B/N", bg: "#FFFFFF", fg: "#000000", anim: "#000000" },
  { id: "negro", label: "N/B", bg: "#000000", fg: "#FFFFFF", anim: "#FFFFFF" },
  { id: "azul", label: "AZ", bg: "#0033FF", fg: "#FFFFFF", anim: "#FFFFFF" },
  { id: "rojo", label: "RJ", bg: "#FF2200", fg: "#FFFFFF", anim: "#FFFFFF" },
  {
    id: "amarillo",
    label: "AM",
    bg: "#FFEE00",
    fg: "#111111",
    anim: "#111111",
  },
  { id: "verde", label: "VD", bg: "#00BB44", fg: "#111111", anim: "#111111" },
  { id: "cyan", label: "CY", bg: "#00DDFF", fg: "#111111", anim: "#111111" },
  { id: "violeta", label: "VL", bg: "#6600CC", fg: "#FFFFFF", anim: "#FFFFFF" },
  { id: "naranja", label: "NR", bg: "#FF6600", fg: "#111111", anim: "#111111" },
  { id: "rosa", label: "RS", bg: "#FF0066", fg: "#FFFFFF", anim: "#FFFFFF" },
];

/* =====================================================
   PALETAS WCAG AA (bg/fg con ratio >= 4.5:1)
   Verificadas programáticamente — las que fallen se excluyen.
   ===================================================== */
const WCAG_PALETTES_DEF = [
  { name: "Negro", bg: "#000000", fg: "#FFFFFF" },
  { name: "Amarillo brillo", bg: "#FEF852", fg: "#000000" },
  { name: "Coral", bg: "#ED745D", fg: "#000000" },
  { name: "Gris claro", bg: "#E5E5E5", fg: "#000000" },
  { name: "Azul", bg: "#3D5B92", fg: "#FFFFFF" },
  { name: "Azul gris", bg: "#9DAFC7", fg: "#000000" },
  { name: "Rojo", bg: "#C03E2A", fg: "#FFFFFF" },
  { name: "Verde claro", bg: "#A2D9AA", fg: "#000000" },
  { name: "Verde oscuro", bg: "#49715B", fg: "#FFFFFF" },
  { name: "Amarillo tierra", bg: "#E8D24D", fg: "#000000" },
];

// Paletas fluorescentes recuperadas de la versión original del visualizador.
const SLIDE10_PALETTES_DEF = [
  { name: "Fluor Rosa", bg: "#0D0D0D", fg: "#FF70E0" },
  { name: "Fluor Cyan", bg: "#0D0D0D", fg: "#00FFD4" },
  { name: "Fluor Lima", bg: "#0D0D0D", fg: "#C6FF00" },
  { name: "Fluor Violeta", bg: "#0D0D0D", fg: "#C280FF" },
  { name: "Fluor Naranja", bg: "#111111", fg: "#FF9500" },
  { name: "Fluor Rojo", bg: "#0D0D0D", fg: "#FF3C3C" },
  { name: "Night Neon", bg: "#050510", fg: "#7FFF00" },
  { name: "Tokyo Night", bg: "#13131F", fg: "#40E0FF" },
  { name: "Rosa fondo", bg: "#FF70E0", fg: "#000000" },
  { name: "Cyan fondo", bg: "#00FFD4", fg: "#000000" },
  { name: "Lima fondo", bg: "#C6FF00", fg: "#000000" },
  { name: "Violeta fondo", bg: "#C280FF", fg: "#000000" },
  { name: "Naranja fondo", bg: "#FF9500", fg: "#000000" },
  { name: "Rojo fondo", bg: "#FF3C3C", fg: "#000000" },
  { name: "Azul referencia / blanco", bg: "#2D50F4", fg: "#FFFFFF" },
  { name: "Azul referencia / negro", bg: "#2D50F4", fg: "#000000" },
  { name: "Azul Processing / blanco", bg: "#0033FF", fg: "#FFFFFF" },
  { name: "Azul Processing / negro", bg: "#0033FF", fg: "#000000" },
];
// Populated after WCAG functions are defined (see bottom of file)
let WCAG_PALETTES = [];

/* =====================================================
   CONTENIDO FIJO
   ===================================================== */
const TITLE_LINES = ["/*Processing", "/*Community", "/*Day — 2026"];
const SLIDE4_TITLE = ["PROCE", "SSING", "COMM", "UNITY", "DAY"];

const SLIDE6_MEMBERS = [
  {
    name: "MÓNICA BATE",
    desc: "Artista visual y Directora del Magíster de Artes Mediales - UCH",
  },
  { name: "DIEGO LÓPEZ", desc: "Maker y Creador de Contenido." },
  {
    name: "AARÓN MONTOYA",
    desc: "Investigadore, Artista medial y Directore del LID - UDP",
  },
  {
    name: "ANTEA SAAVEDRA",
    desc: "Artista visual y Encargada de Comunidades - CRTIC",
  },
  { name: "NICOLÁS MLADINIC", desc: "Asesor de Enconomía Creativa - CORFO" },
];

const INFO_LINES = [
  "Evento: Processing Community Day",
  "Postula: Proyectos de programación creativa e interacción digital",
  "Lugar: Salvador Sanfuentes 2221",
  "Descripción: Sé parte del evento que busca visibilizar prácticas emergentes, conectar comunidad, academia e industria y generar un espacio de encuentro en torno al uso creativo del código.",
  "Llamado a: Estudiantes pre/postgrado, Investigadores, Creadores, Equipos interdisciplinarios",
  "Fecha apertura convocatoria: 23 Abril 2026",
  "Fecha cierre convocatoria: 12 Mayo 2026",
];

const SLIDE11_TITLE = "PROCESSING COMMUNITY DAY 2026";
const SLIDE11_DESCRIPTION =
  "Dos días de programación creativa, interacción digital, charlas, clínicas y exhibición de proyectos. El encuentro entre comunidad, academia e industria creativa.";
const SLIDE11_DATES = ["26.06.2026", "27.06.2026"];
const SLIDE11_PEOPLE = [
  "Mónica Bate",
  "Aarón Montoya-Moraga",
  "Design Systems International",
  "CumaSystem",
  "ShuffleShuffle",
  "voodoochild/:",
];
const SLIDE11_PROJECTS = [
  "VI(H)SIBLES",
  "Retratos en el Viento",
  "Antes todo esto era campo",
  "Relaciones tecno-humanas: la televisión de mi abuelita",
  "Frontera invisible",
  "Gustavo Lita",
  "inter/ferencia",
  "Avarion",
  "La Odisea de una AI",
  "W.E.B.O",
  "MAL DE OJO",
  "APRUEBO",
  "reiteración",
  "La máquina asombrosa",
  "THE ROAD",
  "Umbral",
  "Tres Señales / Three Signals",
  "Quaternions Series",
];

const ANIM_OPTIONS_POSTER = [
  { value: "letter-physics", label: "Letter Physics" },
  { value: "particle-network", label: "Particle Network" },
  { value: "flow-field", label: "Flow Field" },
  { value: "grid-distortion", label: "Grid Distortion" },
  { value: "bouncing-shapes", label: "Bouncing Shapes" },
  { value: "wave-interference", label: "Wave Interference" },
  { value: "code-rain", label: "Code Rain" },
  { value: "constellation", label: "Constellation" },
  { value: "elastic-mesh", label: "Elastic Mesh" },
  { value: "rotating-typography", label: "Rotating Typography" },
  { value: "pixel-texture", label: "Pixel Texture" },
  { value: "glyph-flow-field", label: "Glyph Flow Field" },
  { value: "slot-drum-typography", label: "Slot Drum Typography" },
];

const ANIM_OPTIONS_SLIDE4 = [
  { value: "glitch-overload", label: "Glitch Overload" },
  { value: "pixel-right-angles", label: "Pixel Right Angles" },
  { value: "pixel-explosion", label: "Pixel Explosion" },
  { value: "pixel-drift", label: "Pixel Drift" },
  { value: "scanline-pixels", label: "Scanline Pixels" },
  { value: "pixel-pulse-grid", label: "Pixel Pulse Grid" },
  { value: "bitstream-pixels", label: "Bitstream Pixels" },
  { value: "pixel-clouds", label: "Pixel Clouds" },
  { value: "pixel-orbit-rings", label: "Pixel Orbit Rings" },
  { value: "diagonal-pixel-waves", label: "Diagonal Pixel Waves" },
  { value: "mosaic-pixel-shift", label: "Mosaic Pixel Shift" },
  { value: "pixel-spark-field", label: "Pixel Spark Field" },
  { value: "organic-pixel-flow", label: "Organic Pixel Flow" },
  { value: "cellular-pixel-bloom", label: "Cellular Pixel Bloom" },
  { value: "ripple-bit-rain", label: "Ripple Bit Rain" },
  { value: "circuit-trace-pixels", label: "Circuit Trace Pixels" },
  { value: "data-tide-blocks", label: "Data Tide Blocks" },
  { value: "chromatic-bit-fog", label: "Chromatic Bit Fog" },
  { value: "dither-weave-texture", label: "Dither Weave Texture" },
  { value: "halftone-pixel-grain", label: "Halftone Pixel Grain" },
  { value: "moire-pixel-static", label: "Moiré Pixel Static" },
  { value: "eroded-pixel-paper", label: "Eroded Pixel Paper" },
  { value: "woven-code-noise", label: "Woven Code Noise" },
];

const ANIM_OPTIONS_SLIDE11 = [
  { value: "ascii-zine-poster", label: "ASCII Zine Poster" },
  { value: "bitmap-fragments", label: "Bitmap Fragments" },
  { value: "call-strip-stairs", label: "Call Strip Stairs" },
  { value: "vertical-glyph-walls", label: "Vertical Glyph Walls" },
  { value: "moire-research-field", label: "Moiré Research Field" },
  { value: "neon-atlas-blocks", label: "Neon Atlas Blocks" },
  { value: "modular-poster-tiles", label: "Modular Poster Tiles" },
  { value: "symmetric-weave", label: "Symmetric Weave" },
  { value: "topographic-halftone", label: "Topographic Halftone" },
  { value: "ascii-checker-field", label: "ASCII Checker Field" },
];

const PROJECT_CATEGORIES = [
  "Instalaciones interactivas",
  "Visualización de datos",
  "Arte generativo",
  "Sonido y música con código",
  "Wearables y e-textiles",
  "Proyectos con IA creativa",
  "Experiencias inmersivas (AR/VR)",
  "Hardware y physical computing",
  "Diseño paramétrico y fabricación",
  "Narrativas interactivas",
];

/* =====================================================
   LAYOUT DEFAULT
   ===================================================== */
const DEFAULT_LAYOUT = {
  title: { colStart: 0, colSpan: 3, rowStart: 4, rowSpan: 2 },
  info: { colStart: 0, colSpan: 3, rowStart: 0, rowSpan: 3 },
};

/* =====================================================
   ESTADO GLOBAL
   ===================================================== */
const state = {
  preset: {
    activeId: "blanco",
    bg: "#FFFFFF",
    fg: "#000000",
    animColor: "#000000",
    bubbleFg: "#000000", // color de texto dentro de animaciones
    animOpacity: 35,
    gridOpacity: 35,
  },

  // Tipografía fija — no configurable desde UI
  title: {
    font: "workfaaad-b",
    size: 146,
    weight: "bold",
    letterSpacing: 0,
    lineHeight: 0.8,
    alignH: "right",
  },

  infoBlock: {
    font: "Necto Mono",
    size: 22,
    weight: "bold",
    letterSpacing: 0,
    lineHeight: 1.5,
    alignH: "left",
  },

  meta: {
    topLeft: "1080×1350",
    topRight: "p5.js — v1.9",
    bottomLeft: "Processing Community Day 2026",
    bottomRight: "Santiago, Chile",
  },

  grid: {
    show: true,
    cols: 3,
    rows: 6,
    weight: 1,
  },

  layout: {
    margin: MARGIN,
    marginX: 62,
    marginY: 40,
    blocks: {
      title: { colStart: 0, colSpan: 3, rowStart: 4, rowSpan: 2 },
      info: { colStart: 0, colSpan: 3, rowStart: 0, rowSpan: 3 },
    },
  },

  anim: {
    current: "letter-physics",
    speed: 2.0,
    fps: 30,
    opacity: 35,
    seed: 42,
    textSize: 48,
    fullCanvas: true,
    font: "Space Mono",
    fontWeight: "700",
    blendMode: "source-over",
    slide4Anim: "glitch-overload",
    slide4Leading: 0.74,
    slide4PixelMode: "multi",
    slide7Anim: "glitch-overload",
    slide9Anim: "pixel-right-angles",
    slide10BgAnim: "pixel-drift",
    slide11Anim: "ascii-zine-poster",
    params: {
      "letter-physics": {
        text: "CONVOCATORIA ABIERTA",
        circleSize: 58,
        gravity: 0,
        friction: 0.992,
        repulsion: 240,
        showLabels: false,
      },
      "particle-network": {
        count: 100,
        distance: 130,
        speed: 2.5,
        pointSize: 3,
      },
      "flow-field": {
        noiseScale: 0.004,
        trailLength: 60,
        speed: 4.0,
      },
      "grid-distortion": {
        density: 28,
        radius: 180,
        force: 180,
        showLines: true,
      },
      "bouncing-shapes": {
        count: 20,
        size: 32,
        gravity: 1.2,
        elasticity: 0.92,
        shapes: { circle: true, square: true, triangle: true },
      },
      "wave-interference": {
        emitters: 3,
        frequency: 0.05,
        amplitude: 70,
        resolution: 4,
      },
      "code-rain": {
        dropSpeed: 6.0,
        density: 30,
        charset: "p5js",
      },
      constellation: {
        count: 100,
        distance: 150,
        speed: 1.8,
        pointSize: 3,
      },
      "elastic-mesh": {
        resX: 12,
        resY: 15,
        stiffness: 0.1,
        damping: 0.88,
        lineWeight: 0.8,
      },
      "rotating-typography": {
        text: "PROCESSING COMMUNITY DAY 2026",
        speed: 3.0,
        letterSize: 44,
        distribution: "grid",
      },
      "glyph-flow-field": {
        speed: 2.5,
        particleSize: 1.5,
        trailAlpha: 12,
      },
      "slot-drum-typography": {
        spinMinHz: 8,
        spinMaxHz: 12,
        overshoot: 0.08,
        pulseScale: 0.03,
      },
    },
  },

  showGuides: false,
  playing: true,
  format: "ig",
  posterSlide: 0,
  showExtraLogos: true,
  showConvocatoriaTag: true,
  slide3Slide9Bg: false,

  slide7: {
    fechaVieja: "21",
    fechaNueva: "26",
    mes: "Mayo",
    holdOld: 1.5,
    flipDur: 0.8,
    hideEditorial: false, // <--- Asegúrate de que esta línea esté presente
  },

  slide8: {
    splitConvocatoria: false,
    finalizaSize: 136,
    convocatoriaSize: 125,
    abiertaSize: 140,
    pcdSize: 140,
    leading: 0.96,
    boldness: 0.4,
  },

  slide9: {
    layoutImage: null,
    layoutUrl: null,
    layoutName: "",
    layouts: [],
    activeLayoutIndex: 0,
    tintAnimations: false,
  },

  slide10: {
    showHero: true,
  },
};

const APP_STATE_STORAGE_KEY = "pcd2026-visualizer-state-v2";
const SLIDE9_LAYOUT_DB_NAME = "pcd2026-slide9-layouts";
const SLIDE9_LAYOUT_STORE = "layouts";
let persistStateTimer = null;

function cloneStateValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeState(target, source) {
  if (!source || typeof source !== "object") return;
  Object.keys(source).forEach((key) => {
    if (!(key in target)) return;
    const sourceValue = source[key];
    const targetValue = target[key];
    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      mergeState(targetValue, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });
}

function getPersistableState() {
  const persisted = cloneStateValue({
    ...state,
    slide9: {
      ...state.slide9,
      layoutImage: null,
      layoutUrl: null,
      layoutName: "",
      layouts: [],
    },
  });
  persisted.playing = true;
  return persisted;
}

function savePersistentState() {
  try {
    localStorage.setItem(
      APP_STATE_STORAGE_KEY,
      JSON.stringify(getPersistableState()),
    );
  } catch (e) {
    // localStorage can fail in private browsing or quota-limited contexts.
  }
}

function schedulePersistentStateSave() {
  clearTimeout(persistStateTimer);
  persistStateTimer = setTimeout(savePersistentState, 80);
}

function restorePersistentState() {
  try {
    const raw = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    mergeState(state, saved);
  } catch (e) {
    localStorage.removeItem(APP_STATE_STORAGE_KEY);
  }
}

function setupPersistentStateAutosave() {
  ["input", "change", "click"].forEach((eventName) => {
    document.addEventListener(eventName, schedulePersistentStateSave);
  });
  window.addEventListener("beforeunload", savePersistentState);
}

function openSlide9LayoutDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }
    const req = indexedDB.open(SLIDE9_LAYOUT_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SLIDE9_LAYOUT_STORE)) {
        db.createObjectStore(SLIDE9_LAYOUT_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSlide9LayoutFiles(files) {
  try {
    const db = await openSlide9LayoutDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SLIDE9_LAYOUT_STORE, "readwrite");
      const store = tx.objectStore(SLIDE9_LAYOUT_STORE);
      store.clear();
      Array.from(files || []).forEach((file, index) => {
        store.put({
          id: index,
          index,
          name: file.name,
          type: file.type || "image/png",
          blob: file,
        });
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    // Persisting uploaded files is best-effort; UI state still persists.
  }
}

async function clearStoredSlide9LayoutFiles() {
  try {
    const db = await openSlide9LayoutDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SLIDE9_LAYOUT_STORE, "readwrite");
      tx.objectStore(SLIDE9_LAYOUT_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {}
}

function imageFromStoredSlide9File(item) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(item.blob);
    const img = new Image();
    img.onload = () => resolve({ img, url, name: item.name });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

async function restoreSlide9LayoutFiles() {
  try {
    const db = await openSlide9LayoutDb();
    const items = await new Promise((resolve, reject) => {
      const tx = db.transaction(SLIDE9_LAYOUT_STORE, "readonly");
      const req = tx.objectStore(SLIDE9_LAYOUT_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!items.length) return;

    items.sort((a, b) => a.index - b.index);
    const layouts = (await Promise.all(items.map(imageFromStoredSlide9File)))
      .filter(Boolean);
    if (!layouts.length) return;
    state.slide9.layouts = layouts;
    state.slide9.activeLayoutIndex = Math.min(
      state.slide9.activeLayoutIndex || 0,
      layouts.length - 1,
    );
    syncSlide9LegacyLayout();
  } catch (e) {
    // If browser storage is unavailable, users can upload the PNGs again.
  }
}

// Últimos colores válidos (usados para revertir cambios que rompen WCAG AA)
let lastValidBg = "#FFFFFF";
let lastValidFg = "#000000";

/* =====================================================
   p5.js — INSTANCIA Y SKETCH
   ===================================================== */
let p5Instance = null;
let currentAnimation = null;
let slide4Animation = null;
let slide10HeroAnimation = null;
let fpsFrames = 0;
let fpsLastTime = performance.now();

let fadeOpacity = 1;
let fadingOut = false;
let fadingIn = false;
let nextAnimName = null;
let slide9BackgroundCanvas = null;
let slide9PreviewFramePending = false;
let slide9PreviewKey = "";
let formatBeforeSlide10 = null;

function isSlide3Slide9BgActive(slide = state.posterSlide) {
  return slide === 3 && state.slide3Slide9Bg;
}

function isSlide9Like(slide = state.posterSlide) {
  return slide === 9 || slide === 12;
}

function getPosterAnimMode(slide = state.posterSlide) {
  if (slide === 10) return "slide10";
  if (slide === 11) return "slide11";
  if ([4, 5].includes(slide)) return "slide45";
  if (isSlide9Like(slide) || isSlide3Slide9BgActive(slide)) return "slide9";
  if ([7, 8].includes(slide)) {
    return "slide7";
  }
  return "poster";
}

function withSlide9PosterContext(fn) {
  const prev = state.posterSlide;
  const prevSource = state.slide9ContextSource;
  state.slide9ContextSource = prev;
  state.posterSlide = 9;
  try {
    return fn();
  } finally {
    state.posterSlide = prev;
    if (prevSource === undefined) {
      delete state.slide9ContextSource;
    } else {
      state.slide9ContextSource = prevSource;
    }
  }
}

const sketch = (p) => {
  p.setup = () => {
    const cv = p.createCanvas(CANVAS_W, CANVAS_H);
    cv.parent("canvas-container");
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
      const el = document.getElementById("fps-display");
      if (el) el.textContent = fps + " fps";
      fpsFrames = 0;
      fpsLastTime = now;
    }

    const [bgR, bgG, bgB] = hexRgb(state.preset.bg);
    p.background(bgR, bgG, bgB);

    if ([4, 5, 9, 10, 12].includes(state.posterSlide) || isSlide3Slide9BgActive()) {
      if (!slide4Animation) initSlide4Animation();
      if (slide4Animation) {
        p.push();
        if (
          isSlide9Like() ||
          state.posterSlide === 10 ||
          isSlide3Slide9BgActive()
        ) {
          p.drawingContext.globalAlpha =
            state.posterSlide === 12
              ? Math.max(0.82, state.anim.opacity / 100)
              : state.anim.opacity / 100;
        }
        if (isSlide3Slide9BgActive()) {
          withSlide9PosterContext(() => slide4Animation.draw());
        } else if (state.posterSlide === 10 || state.posterSlide === 12) {
          withSlide9PosterContext(() => slide4Animation.draw());
        } else {
          slide4Animation.draw();
        }
        p.drawingContext.globalAlpha = 1;
        p.pop();
      }
      if (
        state.posterSlide === 10 &&
        state.slide10.showHero &&
        slide10HeroAnimation
      ) {
        p.push();
        slide10HeroAnimation.draw();
        p.pop();
      }
    } else {
      if (
        currentAnimation &&
        state.format !== "banner" &&
        [0, 1].includes(state.posterSlide)
      ) {
        p.push();
        const opa = (state.anim.opacity / 100) * fadeOpacity;
        p.drawingContext.globalAlpha = Math.max(0, Math.min(1, opa));
        p.drawingContext.globalCompositeOperation =
          state.anim.blendMode || "source-over";
        currentAnimation.draw();
        p.drawingContext.globalCompositeOperation = "source-over";
        p.drawingContext.globalAlpha = 1;
        p.pop();
      }
    }

    const posterAlpha = [4, 10].includes(state.posterSlide)
      ? (slide4Animation?.getPosterAlpha?.() ?? 0)
      : [5, 6, 7, 8].includes(state.posterSlide)
        ? 1
        : isSlide9Like() || state.posterSlide === 11 || isSlide3Slide9BgActive()
          ? 1
          : (currentAnimation?.getPosterAlpha?.() ?? 1);
    if (posterAlpha > 0.004) {
      p.drawingContext.globalAlpha = posterAlpha;
      if (state.format === "banner") {
        drawBannerContent(p);
      } else {
        drawEditorialContent(p);
      }
      p.drawingContext.globalAlpha = 1;
    }

    if (state.posterSlide === 7) {
      drawSlide7Overlay(p);
    } else if (state.posterSlide === 8) {
      drawSlide8Overlay(p);
    }

    if (fadingOut || fadingIn) tickFade(p);
  };

  p.mouseMoved = () => dispatchMouse(p, "move");
  p.mouseDragged = () => dispatchMouse(p, "drag");
  p.mousePressed = () => dispatchMouse(p, "press");
  p.mouseReleased = () => dispatchMouse(p, "release");

  // Touch — mapea al mismo dispatch, p5 traduce touches[0] a mouseX/mouseY
  p.touchMoved = () => {
    dispatchMouse(p, "drag");
    return false;
  };
  p.touchStarted = () => {
    dispatchMouse(p, "press");
    return false;
  };
  p.touchEnded = () => {
    dispatchMouse(p, "release");
    return false;
  };
};

function dispatchMouse(p, type) {
  const anim = [4, 5, 9, 10, 12].includes(state.posterSlide) || isSlide3Slide9BgActive()
    ? slide4Animation
    : currentAnimation;
  if (!anim) return;
  const canvasEl = document.querySelector("#canvas-container canvas");
  if (!canvasEl) return;
  const scaleX = CANVAS_W / canvasEl.offsetWidth;
  const scaleY = CANVAS_H / canvasEl.offsetHeight;
  anim.handleMouse(p.mouseX * scaleX, p.mouseY * scaleY, type);
}

function initAnimation() {
  const AnimClass = ANIMATIONS[state.anim.current];
  if (!AnimClass || !p5Instance) return;
  currentAnimation = new AnimClass(p5Instance, state);
}

function initSlide4Animation() {
  if (!p5Instance) return;
  if (state.posterSlide === 10) {
    if (
      typeof ANIMATIONS_SLIDE4 === "undefined" ||
      typeof ANIMATIONS_SLIDE7 === "undefined"
    )
      return;
    const BgClass = ANIMATIONS_SLIDE7[state.anim.slide10BgAnim];
    const HeroClass = ANIMATIONS_SLIDE4["pixel-explosion"];
    if (!BgClass || !HeroClass) return;
    slide4Animation = withSlide9PosterContext(
      () => new BgClass(p5Instance, state),
    );
    slide4Animation._isSlide10Background = true;
    if (slide4Animation instanceof ANIMATIONS_SLIDE7["pixel-drift"]) {
      slide4Animation._cellSz = 72;
      slide4Animation._cols = Math.ceil(CANVAS_W / slide4Animation._cellSz);
      slide4Animation._rows = Math.ceil(CANVAS_H / slide4Animation._cellSz);
      slide4Animation.reset();
    }
    slide10HeroAnimation = new HeroClass(p5Instance, state);
  } else if ([7, 8, 9, 12].includes(state.posterSlide) || isSlide3Slide9BgActive()) {
    slide10HeroAnimation = null;
    if (typeof ANIMATIONS_SLIDE7 === "undefined") return;
    const animName =
      isSlide9Like() || isSlide3Slide9BgActive()
        ? state.anim.slide9Anim
        : state.anim.slide7Anim;
    const AnimClass = ANIMATIONS_SLIDE7[animName];
    if (!AnimClass) return;
    slide4Animation = isSlide3Slide9BgActive() || state.posterSlide === 12
      ? withSlide9PosterContext(() => new AnimClass(p5Instance, state))
      : new AnimClass(p5Instance, state);
  } else {
    slide10HeroAnimation = null;
    if (typeof ANIMATIONS_SLIDE4 === "undefined") return;
    const AnimClass = ANIMATIONS_SLIDE4[state.anim.slide4Anim];
    if (!AnimClass) return;
    slide4Animation = new AnimClass(p5Instance, state);
  }
}

function resetSlide4AnimationInstance() {
  if (!slide4Animation) return;
  if (state.posterSlide === 10) {
    withSlide9PosterContext(() => slide4Animation.reset());
  } else {
    slide4Animation.reset();
  }
}

function switchAnimation(name) {
  if (name === state.anim.current) return;
  nextAnimName = name;
  fadingOut = true;
  fadingIn = false;
  fadeOpacity = 1;
}

function tickFade(p) {
  const step = 0.08;
  if (fadingOut) {
    fadeOpacity -= step;
    if (fadeOpacity <= 0) {
      fadeOpacity = 0;
      state.anim.current = nextAnimName;
      nextAnimName = null;
      initAnimation();
      fadingOut = false;
      fadingIn = true;
    }
  } else if (fadingIn) {
    fadeOpacity += step;
    if (fadeOpacity >= 1) {
      fadeOpacity = 1;
      fadingIn = false;
    }
  }
}

/* =====================================================
   SISTEMA DE GRILLA
   ===================================================== */
function getCellRect(colStart, rowStart, colSpan, rowSpan) {
  const m = state.layout.margin;
  const gridX = m;
  const gridY = m;
  const gridW = CANVAS_W - 2 * m;
  const gridH = CANVAS_H - 2 * m;
  const cellW = gridW / state.grid.cols;
  const cellH = gridH / state.grid.rows;
  return {
    x: gridX + colStart * cellW,
    y: gridY + rowStart * cellH,
    w: colSpan * cellW,
    h: rowSpan * cellH,
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
  const rng = () => Math.random();
  const cols = state.grid.cols;
  const rows = state.grid.rows;

  const titleColSpan = Math.min(cols, 2 + Math.floor(rng() * 2));
  const titleRowSpan = 1 + Math.round(rng());
  const infoColSpan = Math.min(cols, 1 + Math.floor(rng() * 3));
  const infoRowSpan = Math.min(rows, 2 + Math.floor(rng() * 3));

  const blocks = [
    { id: "title", colSpan: titleColSpan, rowSpan: titleRowSpan },
    { id: "info", colSpan: infoColSpan, rowSpan: infoRowSpan },
  ];

  const occupied = Array.from({ length: rows }, () =>
    new Array(cols).fill(false),
  );

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
          state.layout.blocks[block.id] = {
            colStart,
            colSpan,
            rowStart,
            rowSpan,
          };
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
  state.layout.blocks.info = { ...DEFAULT_LAYOUT.info };
}

function randomizeBannerGrid() {
  const cols = BANNER_GRID_PATTERN[0].length;
  const rows = BANNER_GRID_PATTERN.length;
  _bannerGridData = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => {
      const r = Math.random();
      return r < 0.44 ? 0 : r < 0.88 ? 1 : 2;
    }),
  );
}

/* =====================================================
   LOGOS — Carga y render
   ===================================================== */
const LOGOS_H = 120; // altura en px del canvas
const LOGO_ORDER = [
  "faad_lockup-principal",
  "LID",
  "crtic",
  "processingFoundation",
];

let _logosSvgText = {};
let _logosImgCache = {};

async function initLogos() {
  for (const name of LOGO_ORDER) {
    try {
      const r = await fetch(`assets/${name}.svg`);
      _logosSvgText[name] = await r.text();
    } catch (e) {
      console.warn("Logo no cargado:", name, e);
    }
  }
  const fg = state.preset.fg;
  for (const name of LOGO_ORDER) {
    _buildLogoImg(name, fg);
  }
}

// Colores originales del logo Processing y su luminancia perceptual
const _PROCESSING_COLORS = [
  { from: "#d4b2fe", L: 0.771 }, // cls-1 — lavanda claro
  { from: "#5501a4", L: 0.174 }, // cls-2 — púrpura oscuro
  { from: "#9c4bff", L: 0.469 }, // cls-3 — púrpura medio
];

function _buildLogoImg(name, fillColor) {
  if (!_logosSvgText[name]) return;
  let svg = _logosSvgText[name];

  if (fillColor) {
    if (name === "processingFoundation") {
      // Mapear cada color original → mezcla de fg/bg preservando luminancia
      // color_nuevo = bg × L + fg × (1 − L)
      // → claro sigue claro, oscuro sigue oscuro, pero con los colores del tema
      const fg = hexRgb(fillColor);
      const bg = hexRgb(state.preset.bg);
      for (const { from, L } of _PROCESSING_COLORS) {
        const r = Math.round(bg[0] * L + fg[0] * (1 - L));
        const g = Math.round(bg[1] * L + fg[1] * (1 - L));
        const b = Math.round(bg[2] * L + fg[2] * (1 - L));
        const to =
          "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
        svg = svg.replaceAll(from, to);
      }
    } else {
      svg = svg.replace(/(<svg\b[^>]*)>/, `$1 fill="${fillColor}">`);
    }
  }

  const prev = _logosImgCache[name];
  if (prev && prev._url) URL.revokeObjectURL(prev._url);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img._url = url;
  img.src = url;
  _logosImgCache[name] = {
    img,
    color: fillColor,
    bg: state.preset.bg,
    _url: url,
  };
}

function drawLogos(p) {
  const m = state.layout.margin;
  const fg = state.preset.fg;

  // Regenerar logos si cambiaron fg o bg
  const bg = state.preset.bg;
  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    const stale =
      !c || c.color !== fg || (name === "processingFoundation" && c.bg !== bg);
    if (stale) _buildLogoImg(name, fg);
  }

  const ctx = p.drawingContext;
  const pad = 14; // margen vertical arriba y abajo
  const hPad = -60; // margen lateral extra izquierda y derecha
  const logoH = LOGOS_H - 2 * pad; // todos los logos a la misma altura
  const totalW = CANVAS_W - 2 * m - 2 * hPad; // ancho disponible con margen lateral

  // Escala individual por logo (1.0 = altura completa)
  const LOGO_SCALE = {
    "faad_lockup-principal": 0.8,
    LID: 0.8,
    crtic: 1.0,
    processingFoundation: 1.0,
  };

  // Calcular dimensiones de cada logo a su altura escalada, centrado verticalmente
  const logoData = LOGO_ORDER.map((name) => {
    const c = _logosImgCache[name];
    if (!c || !c.img.complete || c.img.naturalWidth === 0)
      return { w: 0, h: 0, yOff: 0 };
    const scale = LOGO_SCALE[name] ?? 1.0;
    const h = logoH * scale;
    const w = h * (c.img.naturalWidth / c.img.naturalHeight);
    const yOff = (logoH - h) / 2; // centrado vertical dentro del strip
    return { w, h, yOff };
  });

  const totalLogosW = logoData.reduce((a, d) => a + d.w, 0);
  const nGaps = LOGO_ORDER.length + 1;
  const gap = Math.max(pad, (totalW - totalLogosW) / nGaps);

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
  if (![4, 5, 6, 7, 8, 9, 10, 11, 12].includes(state.posterSlide) && state.grid.show)
    drawGrid(p);
  if (state.posterSlide === 0) {
    drawSlide0(p);
  } else if (state.posterSlide === 1) {
    drawSlide1(p);
  } else if (state.posterSlide === 2) {
    drawInfoBlock(p);
  } else if (state.posterSlide === 3) {
    drawLogosCentered(p);
  } else if (state.posterSlide === 4) {
    drawSlide4(p);
  } else if (state.posterSlide === 5) {
    drawSlide5(p);
  } else if (state.posterSlide === 6) {
    drawSlide6(p);
  } else if (state.posterSlide === 7) {
    drawSlide7(p);
  } else if (state.posterSlide === 8) {
    drawSlide8(p);
  } else if (state.posterSlide === 9) {
    drawSlide9(p);
  } else if (state.posterSlide === 11) {
    drawSlide11(p);
  } else if (state.posterSlide === 12) {
    drawSlide12(p);
  }
  if (state.showGuides) drawGuides(p);
}

function drawSlide7Overlay(p) {
  if (!slide4Animation) initSlide4Animation();
  if (!slide4Animation) return;

  ensureSlide7TextGrid(slide4Animation, p, "26");

  const overlay = p.createGraphics(CANVAS_W, CANVAS_H);
  overlay.pixelDensity(1);
  overlay.clear();

  const oldP = slide4Animation.p;
  slide4Animation.p = overlay;
  slide4Animation.draw();
  slide4Animation.p = oldP;

  p.image(overlay, 0, 0);
  overlay.remove();
}

function getSlide8Lines(ctx, font) {
  const s8 = state.slide8 || {};
  const finalizaSize = s8.finalizaSize ?? 172;
  const convocatoriaSize = s8.convocatoriaSize ?? 125;
  const abiertaSize = s8.abiertaSize ?? 140;
  const pcdSize = s8.pcdSize ?? 140;
  const convocatoriaLines = s8.splitConvocatoria
    ? [
        { text: "convo", size: convocatoriaSize, weight: 900, animated: true },
        { text: "catoria", size: convocatoriaSize, weight: 900, animated: true },
      ]
    : [
        {
          text: "CONVOCATORIA",
          size: convocatoriaSize,
          weight: 900,
          animated: true,
        },
      ];
  const lines = [
    ...convocatoriaLines,
    { text: "CERRADA", size: abiertaSize, weight: 900, animated: true },
    { text: "Nos vemos en", size: finalizaSize, weight: 400 },
    { text: "PCD-2026!", size: pcdSize, weight: 400 },
  ];
  const availW = CANVAS_W * 0.88;

  const reference = lines[lines.length - 1];
  ctx.font = `${reference.weight} ${reference.size}px ${font}`;
  while (reference.size > 24 && ctx.measureText(reference.text).width > availW) {
    reference.size -= 4;
    ctx.font = `${reference.weight} ${reference.size}px ${font}`;
  }

  const targetW = ctx.measureText(reference.text).width;
  for (const line of lines.filter((line) => line.fitToReference)) {
    ctx.font = `${line.weight} ${line.size}px ${font}`;
    const currentW = ctx.measureText(line.text).width;
    if (currentW > 0) line.size *= targetW / currentW;
  }

  return lines;
}

function drawSlide8TextBlock(p, maskOnly = false) {
  const fg = state.preset.fg;
  const [fR, fG, fB] = hexRgb(fg);
  const ctx = p.drawingContext;
  const font = "'workfaaad-a', monospace";
  const lines = getSlide8Lines(ctx, font);
  const inter = state.slide8.leading ?? 0.96;
  const totalH = lines.reduce((acc, l) => acc + l.size * inter, 0);
  let currentY = CANVAS_H / 2 - totalH / 2;

  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillStyle = maskOnly ? "black" : `rgb(${fR},${fG},${fB})`;
  if (maskOnly) {
    ctx.strokeStyle = "black";
    ctx.lineJoin = "round";
  }

  for (const line of lines) {
    if (!maskOnly && line.animated) {
      currentY += line.size * inter;
      continue;
    }
    if (maskOnly && !line.animated) {
      currentY += line.size * inter;
      continue;
    }
    ctx.font = `${line.weight} ${line.size}px ${font}`;
    if (maskOnly && line.animated && state.slide8.boldness > 0) {
      ctx.lineWidth = state.slide8.boldness;
      ctx.strokeText(line.text, CANVAS_W / 2 + (line.offsetX || 0), currentY);
    }
    ctx.fillText(line.text, CANVAS_W / 2 + (line.offsetX || 0), currentY);
    currentY += line.size * inter;
  }

  ctx.restore();
}

function drawSlide8Overlay(p) {
  if (!slide4Animation) initSlide4Animation();
  if (!slide4Animation) return;

  ensureSlide8TextGrid(slide4Animation, p);

  const overlay = p.createGraphics(CANVAS_W, CANVAS_H);
  overlay.pixelDensity(1);
  overlay.clear();

  const oldP = slide4Animation.p;
  slide4Animation.p = overlay;
  slide4Animation.draw();
  slide4Animation.p = oldP;

  p.image(overlay, 0, 0);
  overlay.remove();
}

function ensureSlide8TextGrid(anim, p) {
  const s8 = state.slide8 || {};
  const key = [
    "slide8",
    state.preset.bg,
    s8.splitConvocatoria ? "split" : "single",
    s8.finalizaSize,
    s8.convocatoriaSize,
    s8.abiertaSize,
    s8.pcdSize,
    s8.leading,
    s8.boldness,
  ].join(":");
  if (
    anim._slide8TextKey === key &&
    anim._slide8GridReady &&
    anim._grid === anim._slide8Grid
  )
    return;
  anim._slide8TextKey = key;
  anim._slide8GridReady = false;

  const cols = anim._cols,
    rows = anim._rows;
  const cW = anim._cW || anim._cellSz || 10,
    cH = anim._cH || anim._cellSz || 10;
  const [bgR, bgG, bgB] = anim.getBg();
  const off = p.createGraphics(cols * cW, rows * cH);
  off.pixelDensity(1);
  off.background(bgR, bgG, bgB);
  drawSlide8TextBlock(off, true);

  off.loadPixels();
  const grid = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx =
        (Math.round((r + 0.5) * cH) * off.width + Math.round((c + 0.5) * cW)) *
        4;
      grid[r * cols + c] =
        Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB) >
        45
          ? 1
          : 0;
    }
  }
  off.remove();

  anim._grid = grid;
  anim._slide8Grid = grid;
  anim._slide7GridReady = false;
  anim._textOnly = true;
  anim._on = new Uint8Array(grid.length).map((_, i) =>
    p.random() < (grid[i] ? 0.98 : 0) ? 1 : 0,
  );
  anim._timer = new Uint8Array(grid.length).map(() =>
    Math.floor(p.random(1, 26)),
  );
  anim._ci = new Uint8Array(grid.length).map((_, i) =>
    grid[i]
      ? p.random() < 0.72
        ? 0
        : Math.floor(p.random(1, 7))
      : 0,
  );
  if (anim.constructor.name === "GlitchOverload")
    anim._ch = new Uint8Array(grid.length).map(() => Math.floor(p.random(25)));
  anim._slide8GridReady = true;
}

function ensureSlide7TextGrid(anim, p, text) {
  if (anim._slide7Text === text && anim._slide7GridReady) return;
  anim._slide7Text = text;
  anim._slide7GridReady = false;

  const cols = anim._cols,
    rows = anim._rows;
  const cW = anim._cW || 10,
    cH = anim._cH || 10;
  const [bgR, bgG, bgB] = anim.getBg();
  const off = p.createGraphics(cols * cW, rows * cH);
  off.pixelDensity(1);
  off.background(bgR, bgG, bgB);
  const ctx = off.drawingContext;
  const font = "'workfaaad-a', monospace";

  // Configuración idéntica al SVG
  const lines = [
    { text: "Convocatoria PCD — 2026", size: 52, weight: 400 },
    { text: "Extensión Plazo", size: 186, weight: 700 },
    { text: "26", size: 720, weight: 700 },
    { text: "de Mayo", size: 186, weight: 400 },
  ];

  const availW = CANVAS_W * 0.9;
  ctx.font = `700 ${lines[2].size}px ${font}`;
  while (ctx.measureText(lines[2].text).width > availW) {
    lines[2].size -= 10;
    ctx.font = `700 ${lines[2].size}px ${font}`;
  }

  const inter = 0.92;
  const totalH = lines.reduce((acc, l) => acc + l.size * inter, 0);
  let curY = CANVAS_H / 2 - totalH / 2;

  let finalSize26 = 0;
  for (const line of lines) {
    if (line.text === text) {
      finalSize26 = line.size;
      break;
    }
    curY += line.size * inter;
  }

  ctx.font = `700 ${finalSize26}px ${font}`;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(text, (cols * cW) / 2, curY);

  off.loadPixels();
  const grid = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx =
        (Math.round((r + 0.5) * cH) * off.width + Math.round((c + 0.5) * cW)) *
        4;
      grid[r * cols + c] =
        Math.abs(off.pixels[idx] - bgR) +
          Math.abs(off.pixels[idx + 1] - bgG) +
          Math.abs(off.pixels[idx + 2] - bgB) >
        45
          ? 1
          : 0;
    }
  }
  off.remove();

  anim._grid = grid;
  anim._slide8GridReady = false;
  anim._on = new Uint8Array(grid.length).map((_, i) =>
    p.random() < (grid[i] ? 0.92 : 0.007) ? 1 : 0,
  );
  anim._timer = new Uint8Array(grid.length).map(() =>
    Math.floor(p.random(1, 26)),
  );
  anim._ci = new Uint8Array(grid.length).map((_, i) =>
    grid[i]
      ? p.random() < 0.72
        ? 0
        : Math.floor(p.random(1, 7))
      : Math.floor(p.random(1, 7)),
  );
  if (anim.constructor.name === "GlitchOverload")
    anim._ch = new Uint8Array(grid.length).map(() => Math.floor(p.random(25)));
  anim._slide7GridReady = true;
}

function drawSlide0(p) {
  const mx = state.layout.marginX;
  const my = state.layout.marginY;
  const fg = state.preset.fg;
  const bg = state.preset.bg;
  const animColor = state.preset.animColor;

  const [fR, fG, fB] = hexRgb(fg);
  const [aR, aG, aB] = hexRgb(animColor);
  const [bR, bG, bB] = hexRgb(bg); // Obtenemos componentes del color de fondo

  // Actualizar/Refrescar logos según el color actual
  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    if (
      !c ||
      c.color !== fg ||
      (name === "processingFoundation" && c.bg !== bg)
    )
      _buildLogoImg(name, fg);
  }

  p.drawingContext.save();
  p.drawingContext.globalAlpha = 1;

  // ── Tag strip (Franja superior) ──
  const tagY = 0;
  const tagH = 55;
  p.push();
  p.noStroke();

  // Fondo del banner: usamos el color principal (foreground) con opacidad
  p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.70)`;
  p.drawingContext.fillRect(0, tagY, CANVAS_W, tagH);

  p.drawingContext.font = `400 20px 'Necto Mono', monospace`;
  p.drawingContext.letterSpacing = "2.4px";
  p.drawingContext.textBaseline = "middle";
  p.drawingContext.textAlign = "left";

  // CAMBIO SOLICITADO: El texto ahora usa el color de FONDO para contrastar con la franja
  p.drawingContext.fillStyle = `rgb(${bR},${bG},${bB})`;
  p.drawingContext.fillText("EXTENSIÓN DE PLAZO", mx + 12, tagH / 2);
  p.drawingContext.letterSpacing = "0px";

  // Línea decorativa inferior de la franja
  p.drawingContext.strokeStyle = "rgba(255, 255, 255, 0.35)";
  p.drawingContext.lineWidth = 2;
  p.drawingContext.beginPath();
  p.drawingContext.moveTo(0, tagH);
  p.drawingContext.lineTo(CANVAS_W, tagH);
  p.drawingContext.stroke();

  p.pop();

  // ── Título (Processing Community Day) ──
  const titleY = my + 40;
  const fontSize = 118;
  const lh = 110;
  p.noStroke();
  p.drawingContext.font = `700 ${fontSize}px 'workfaaad-a', monospace`;
  p.drawingContext.textBaseline = "top";
  p.drawingContext.textAlign = "left";

  for (let i = 0; i < TITLE_LINES.length; i++) {
    const line = TITLE_LINES[i];
    const lineY = titleY + i * lh;
    if (line.startsWith("/*")) {
      const prefix = "/*";
      const prefixW = p.drawingContext.measureText(prefix).width;
      p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.22)`;
      p.drawingContext.fillText(prefix, mx, lineY);
      p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1)`;
      p.drawingContext.fillText(line.slice(2), mx + prefixW, lineY);
    } else {
      p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1)`;
      p.drawingContext.fillText(line, mx, lineY);
    }
  }

  // ── Bloque de información JSON-style ──
  const infoSize = 24;
  const infoLh = infoSize * 1.55;
  const indent = mx + infoSize * 1.2;
  const valW = CANVAS_W - indent - mx;
  let y = titleY + TITLE_LINES.length * lh + 36;

  p.drawingContext.textBaseline = "alphabetic";
  p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1)`;

  p.drawingContext.font = `normal ${infoSize}px 'Necto Mono', monospace`;
  p.drawingContext.fillText("{", mx, y);
  y += infoLh;

  for (let i = 0; i < INFO_LINES.length; i++) {
    const line = INFO_LINES[i];
    const colon = line.indexOf(":");
    const isLast = i === INFO_LINES.length - 1;
    if (colon > -1) {
      const key = '"' + line.slice(0, colon).trim() + '": ';
      const val =
        '"' + line.slice(colon + 1).trim() + '"' + (isLast ? "" : ",");
      p.drawingContext.font = `700 ${infoSize}px 'Necto Mono', monospace`;
      const keyW = p.drawingContext.measureText(key).width;
      p.drawingContext.fillText(key, indent, y);
      p.drawingContext.font = `normal ${infoSize}px 'Necto Mono', monospace`;
      const wrapped = wrapText(p, val, valW - keyW);
      p.drawingContext.fillText(wrapped[0], indent + keyW, y);
      y += infoLh;
      for (let li = 1; li < wrapped.length; li++) {
        p.drawingContext.fillText(wrapped[li], indent + keyW, y);
        y += infoLh;
      }
    } else {
      const wrapped = wrapText(p, '"' + line + '"' + (isLast ? "" : ","), valW);
      for (const wl of wrapped) {
        p.drawingContext.fillText(wl, indent, y);
        y += infoLh;
      }
    }
  }
  p.drawingContext.fillText("}", mx, y);

  p.drawingContext.restore();

  // ── Logos inferiores ──
  if (state.showExtraLogos) {
    const logoH = 90;
    const logoY = CANVAS_H - my - logoH;
    const ctx = p.drawingContext;

    const cFaad = _logosImgCache["faad_lockup-principal"];
    const faadW =
      cFaad && cFaad.img.naturalWidth
        ? logoH * (cFaad.img.naturalWidth / cFaad.img.naturalHeight)
        : 0;
    if (cFaad && cFaad.img.complete && faadW > 0) {
      ctx.drawImage(cFaad.img, 40, CANVAS_H - 10 - logoH, faadW, logoH);
    }

    const extraLogos = ["LID", "crtic", "processingFoundation"];
    const extraScales = { LID: 0.72, crtic: 1.0, processingFoundation: 1.0 };
    const extraWidths = extraLogos.map((name) => {
      const c = _logosImgCache[name];
      return c && c.img.complete
        ? logoH * extraScales[name] * (c.img.naturalWidth / c.img.naturalHeight)
        : 0;
    });

    const totalExtraW = extraWidths.reduce((a, w) => a + w, 0);
    const spaceAfter = CANVAS_W - mx - (mx + faadW);
    const gap = (spaceAfter - totalExtraW) / extraLogos.length;
    let x = mx + faadW + gap;

    for (let i = 0; i < extraLogos.length; i++) {
      const c = _logosImgCache[extraLogos[i]];
      const h = logoH * extraScales[extraLogos[i]];
      if (c && c.img.complete && extraWidths[i] > 0) {
        ctx.drawImage(c.img, x, logoY + (logoH - h), extraWidths[i], h);
      }
      x += extraWidths[i] + gap;
    }
  }
}

function drawSlide1(p) {
  const mx = state.layout.marginX;
  const my = state.layout.marginY;
  const fg = state.preset.fg;
  const bg = state.preset.bg;
  const [fR, fG, fB] = hexRgb(fg);

  // refresh logos
  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    if (
      !c ||
      c.color !== fg ||
      (name === "processingFoundation" && c.bg !== bg)
    )
      _buildLogoImg(name, fg);
  }

  // ── Tag strip ──
  const tagY = 0;
  const tagH = 55;
  if (state.showConvocatoriaTag) {
    p.push();
    p.noStroke();
    p.drawingContext.font = `400 20px 'Necto Mono', monospace`;
    p.drawingContext.letterSpacing = "2.4px";
    p.drawingContext.textBaseline = "middle";
    p.drawingContext.textAlign = "left";
    p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.75)`;
    p.drawingContext.fillText("CONVOCATORIA ABIERTA", mx + 12, tagH / 2);
    p.drawingContext.letterSpacing = "0px";
    p.pop();
  }

  // ── Título ──
  const titleX = mx;
  const titleStartY = tagY + tagH + 56;
  const availW = CANVAS_W - 2 * mx;

  const fontSize = 140;
  const lh = 132;
  const kerning = "0px";

  p.noStroke();
  p.drawingContext.font = `700 ${fontSize}px 'workfaaad-a', monospace`;
  p.drawingContext.textBaseline = "top";
  p.drawingContext.textAlign = "left";
  p.drawingContext.letterSpacing = kerning;

  for (let i = 0; i < TITLE_LINES.length; i++) {
    const line = TITLE_LINES[i];
    const lineY = titleStartY + i * lh;
    if (line.startsWith("/*")) {
      const prefix = "/*";
      const prefixW = p.drawingContext.measureText(prefix).width;
      p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.25)`;
      p.drawingContext.fillText(prefix, titleX, lineY);
      p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1)`;
      p.drawingContext.fillText(line.slice(2), titleX + prefixW, lineY);
    } else {
      p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1)`;
      p.drawingContext.fillText(line, titleX, lineY);
    }
  }

  // ── Logos en la parte inferior ──
  const logoH = 90;
  const gridBottom = CANVAS_H - my;
  const logoY = gridBottom - logoH;
  const ctx = p.drawingContext;

  if (state.showExtraLogos) {
    const cFaad = _logosImgCache["faad_lockup-principal"];
    const faadW =
      cFaad && cFaad.img.naturalWidth
        ? logoH * (cFaad.img.naturalWidth / cFaad.img.naturalHeight)
        : 0;
    if (cFaad && cFaad.img.complete && faadW > 0) {
      ctx.drawImage(cFaad.img, 40, CANVAS_H - 10 - logoH, faadW, logoH);
    }

    const extraLogos = ["LID", "crtic", "processingFoundation"];
    const extraScales = { LID: 0.9, crtic: 1.0, processingFoundation: 1.0 };
    const extraWidths = extraLogos.map((name) => {
      const c = _logosImgCache[name];
      if (!c || !c.img.complete || c.img.naturalWidth === 0) return 0;
      return (
        logoH * extraScales[name] * (c.img.naturalWidth / c.img.naturalHeight)
      );
    });
    const totalExtraW = extraWidths.reduce((a, w) => a + w, 0);
    const rightEdge = CANVAS_W - mx;
    const spaceAfter = rightEdge - (mx + faadW);
    const gap = (spaceAfter - totalExtraW) / extraLogos.length;
    let x = mx + faadW + gap;
    for (let i = 0; i < extraLogos.length; i++) {
      const name = extraLogos[i];
      const c = _logosImgCache[name];
      const h = logoH * extraScales[name];
      const w = extraWidths[i];
      if (c && c.img.complete && c.img.naturalWidth > 0 && w > 0) {
        ctx.drawImage(c.img, x, logoY + (logoH - h), w, h);
      }
      x += w + gap;
    }
  }
}

function drawLogosCentered(p) {
  const fg = state.preset.fg;
  const bg = state.preset.bg;
  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    const stale =
      !c || c.color !== fg || (name === "processingFoundation" && c.bg !== bg);
    if (stale) _buildLogoImg(name, fg);
  }

  const ctx = p.drawingContext;
  const logoH = 120;
  const minGap = 40;

  // Contar logos válidos
  const validLogos = [];
  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    if (c && c.img.complete && c.img.naturalWidth > 0) {
      validLogos.push({ name, cache: c });
    }
  }

  const nLogos = validLogos.length;
  const totalH = nLogos * logoH + (nLogos - 1) * minGap;
  let y = (CANVAS_H - totalH) / 2;

  for (let i = 0; i < validLogos.length; i++) {
    const item = validLogos[i];
    const c = item.cache;
    const w = logoH * (c.img.naturalWidth / c.img.naturalHeight);
    const x = (CANVAS_W - w) / 2;

    // Reducir espacio entre FaAAD y LID subiendo LID
    let yOffset = 0;
    if (item.name === "LID") {
      yOffset = -20;
    }

    ctx.drawImage(c.img, x, y + yOffset, w, logoH);
    y += logoH + minGap;
  }
}

/* =====================================================
   SLIDES 4 Y 5 — Segundo visualizador "Convocatoria Visual"
   ===================================================== */
function drawTextBlock(p, text, x, y, fontSize, opts = {}) {
  const ctx = p.drawingContext;
  const [bgR, bgG, bgB] = hexRgb(state.preset.bg);
  const [fgR, fgG, fgB] = hexRgb(state.preset.fg);
  const fontStr =
    opts.font || `700 ${fontSize}px '${state.title.font}', monospace`;
  const padding = opts.padding !== undefined ? opts.padding : 16;
  const bgAlpha = opts.bgAlpha !== undefined ? opts.bgAlpha : 220;
  const align = opts.align || "left";

  ctx.save();
  ctx.font = fontStr;
  ctx.textBaseline = "top";
  ctx.textAlign = align;

  const textW = ctx.measureText(text).width;
  const textH = fontSize * 1.2;
  const bx = align === "left" ? x - padding : x - textW / 2 - padding;
  const by = y - padding;

  ctx.fillStyle = `rgba(${bgR},${bgG},${bgB},${(bgAlpha / 255).toFixed(3)})`;
  ctx.fillRect(bx, by, textW + padding * 2, textH + padding * 2);
  ctx.fillStyle = `rgb(${fgR},${fgG},${fgB})`;
  ctx.fillText(text, x, y);
  ctx.restore();

  return textH + padding * 2;
}

function _drawLogosAt(p, yBase, logoH) {
  const fg = state.preset.fg;
  const bg = state.preset.bg;
  const m = state.layout.marginX;

  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    if (
      !c ||
      c.color !== fg ||
      (name === "processingFoundation" && c.bg !== bg)
    )
      _buildLogoImg(name, fg);
  }

  const LOGO_SCALE = {
    "faad_lockup-principal": 0.8,
    LID: 0.8,
    crtic: 1.0,
    processingFoundation: 1.0,
  };
  const ctx = p.drawingContext;
  const availW = CANVAS_W - 2 * m;

  const logoData = LOGO_ORDER.map((name) => {
    const c = _logosImgCache[name];
    if (!c || !c.img.complete || c.img.naturalWidth === 0)
      return { w: 0, h: 0 };
    const scale = LOGO_SCALE[name] ?? 1.0;
    const h = logoH * scale;
    const w = h * (c.img.naturalWidth / c.img.naturalHeight);
    return { w, h };
  });

  const totalLogosW = logoData.reduce((a, d) => a + d.w, 0);
  const gap = Math.max(12, (availW - totalLogosW) / (LOGO_ORDER.length + 1));

  let x = m + gap;
  for (let i = 0; i < LOGO_ORDER.length; i++) {
    const c = _logosImgCache[LOGO_ORDER[i]];
    const d = logoData[i];
    if (c && c.img.complete && c.img.naturalWidth > 0 && d.w > 0) {
      ctx.drawImage(c.img, x, yBase + (logoH - d.h) / 2, d.w, d.h);
    }
    x += d.w + gap;
  }
}

function drawSlide4Logos(p) {
  // El slide 10 es un hero visual limpio: sin logos ni gradiente inferior.
  if (state.posterSlide === 10) return;

  const mx = state.layout.marginX;
  const my = state.layout.marginY;
  const fg = state.preset.fg;
  const bg = state.preset.bg;
  const logoH = 90;
  const logoY = CANVAS_H - my - logoH;
  const ctx = p.drawingContext;

  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    const stale =
      !c || c.color !== fg || (name === "processingFoundation" && c.bg !== bg);
    if (stale) _buildLogoImg(name, fg);
  }

  // ── Gradiente fondo → transparente (realza logos) ──
  if (![6, 7, 8].includes(state.posterSlide)) {
    const [bgR, bgG, bgB] = hexRgb(bg);
    const lum = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) / 255;
    let gR, gG, gB;
    if (lum > 0.5) {
      gR = Math.round(bgR * 0.4);
      gG = Math.round(bgG * 0.4);
      gB = Math.round(bgB * 0.4);
    } else {
      gR = Math.min(255, bgR + 55);
      gG = Math.min(255, bgG + 55);
      gB = Math.min(255, bgB + 55);
    }
    const gradH = 380;
    const grad = ctx.createLinearGradient(0, CANVAS_H, 0, CANVAS_H - gradH);
    grad.addColorStop(0, `rgba(${gR},${gG},${gB},0.88)`);
    grad.addColorStop(0.55, `rgba(${gR},${gG},${gB},0.40)`);
    grad.addColorStop(1, `rgba(${gR},${gG},${gB},0)`);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, CANVAS_H - gradH, CANVAS_W, gradH);
    ctx.restore();
  }

  if (!state.showExtraLogos) return;

  const cFaad = _logosImgCache["faad_lockup-principal"];
  const faadW =
    cFaad && cFaad.img.naturalWidth
      ? logoH * (cFaad.img.naturalWidth / cFaad.img.naturalHeight)
      : 0;
  if (cFaad && cFaad.img.complete && faadW > 0) {
    ctx.drawImage(cFaad.img, 40, CANVAS_H - 10 - logoH, faadW, logoH);
  }

  const extraLogos = ["LID", "crtic", "processingFoundation"];
  const extraScales = { LID: 0.9, crtic: 1.0, processingFoundation: 1.0 };
  const extraWidths = extraLogos.map((name) => {
    const c = _logosImgCache[name];
    if (!c || !c.img.complete || c.img.naturalWidth === 0) return 0;
    return (
      logoH * extraScales[name] * (c.img.naturalWidth / c.img.naturalHeight)
    );
  });
  const totalExtraW = extraWidths.reduce((a, w) => a + w, 0);
  const rightEdge = CANVAS_W - mx;
  const spaceAfter = rightEdge - (mx + faadW);
  const gap = (spaceAfter - totalExtraW) / extraLogos.length;
  let x = mx + faadW + gap;
  for (let i = 0; i < extraLogos.length; i++) {
    const name = extraLogos[i];
    const c = _logosImgCache[name];
    const h = logoH * extraScales[name];
    const w = extraWidths[i];
    if (c && c.img.complete && c.img.naturalWidth > 0 && w > 0) {
      ctx.drawImage(c.img, x, logoY + (logoH - h), w, h);
    }
    x += w + gap;
  }
}

function drawSlide4(p) {
  const mx = state.layout.marginX;
  const fg = state.preset.fg;
  const bg = state.preset.bg;
  const [fR, fG, fB] = hexRgb(fg);
  const [bgR, bgG, bgB] = hexRgb(bg);
  const ctx = p.drawingContext;
  const pad = 20;

  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    if (
      !c ||
      c.color !== fg ||
      (name === "processingFoundation" && c.bg !== bg)
    )
      _buildLogoImg(name, fg);
  }

  // ── Bloque título ──
  const titleLines4 = ["PROCESSING", "COMMUNITY", "DAY — 2026"];
  const tSz = 100;
  const tLh = 102;
  const tY = 640;
  const tFont = `700 ${tSz}px 'workfaaad-a', monospace`;

  ctx.save();
  ctx.font = tFont;
  const tMaxW = Math.max(...titleLines4.map((l) => ctx.measureText(l).width));
  ctx.fillStyle = `rgba(${bgR},${bgG},${bgB},0.87)`;
  ctx.fillRect(
    mx - pad,
    tY - pad,
    tMaxW + pad * 2,
    titleLines4.length * tLh + pad * 2,
  );
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = `rgb(${fR},${fG},${fB})`;
  for (let i = 0; i < titleLines4.length; i++)
    ctx.fillText(titleLines4[i], mx, tY + i * tLh);
  ctx.restore();

  // ── CONVOCATORIA ABIERTA ──
  let cY = tY + titleLines4.length * tLh + 34;
  const convH = drawTextBlock(p, "CONVOCATORIA ABIERTA", mx, cY, 54, {
    font: `700 54px 'workfaaad-a', monospace`,
    padding: 16,
    bgAlpha: 222,
  });

  // ── Fecha ──
  cY += convH + 10;
  drawTextBlock(p, "23 Abril — 12 Mayo 2026", mx, cY, 28, {
    font: `normal 28px 'Necto Mono', monospace`,
    padding: 14,
    bgAlpha: 210,
  });

  // ── Bottom strip: logos + ubicación ──
  const logoH = 80;
  const stripH = 95;
  const stripY = CANVAS_H - 10 - stripH;

  p.push();
  p.noStroke();
  p.fill(bgR, bgG, bgB, 210);
  p.rect(0, stripY, CANVAS_W, stripH + 10);
  p.pop();

  ctx.save();
  ctx.font = `normal 20px 'Necto Mono', monospace`;
  ctx.fillStyle = `rgb(${fR},${fG},${fB})`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText(
    "Salvador Sanfuentes 2221, Santiago",
    CANVAS_W - mx,
    stripY + stripH / 2,
  );
  ctx.restore();

  if (state.showExtraLogos)
    _drawLogosAt(p, stripY + (stripH - logoH) / 2, logoH);
}

function drawSlide5(p) {
  const mx = state.layout.marginX;
  const fg = state.preset.fg;
  const bg = state.preset.bg;
  const [fR, fG, fB] = hexRgb(fg);
  const [bgR, bgG, bgB] = hexRgb(bg);
  const ctx = p.drawingContext;
  const pad = 20;

  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    if (
      !c ||
      c.color !== fg ||
      (name === "processingFoundation" && c.bg !== bg)
    )
      _buildLogoImg(name, fg);
  }

  // ── Contenido slide 5 ──
  const titleLines5 = ["¿QUÉ PROYECTOS", "BUSCAMOS?"];
  const tSz = 80;
  const tLh = 82;
  const tY = 70;
  const tFont = `700 ${tSz}px 'workfaaad-a', monospace`;
  const titleH = titleLines5.length * tLh;

  const sections = [
    {
      header: "LOS PROYECTOS DEBERÁN:",
      items: [
        "→ Estar orientados a la programación creativa y/o interacción digital",
        "→ Incorporar lógica computacional y uso de código como elemento central",
        "→ Explorar relaciones entre personas, datos, sistemas o entornos",
      ],
    },
    {
      header: "FORMATOS POSIBLES:",
      items: [
        "→ Visualización de datos · Experiencias interactivas · Instalaciones",
        "→ Prototipos tecnológicos · Aplicaciones experimentales · Proyectos afines",
      ],
    },
    {
      header: "HERRAMIENTAS:",
      items: [
        "→ Processing · p5.js · Otras tecnologías (abiertas o propietarias)",
        "→ En tecnologías no abiertas, se valorará el enfoque en acceso,",
        "   inclusión y experimentación.",
      ],
    },
  ];

  const sHdrLh = 50;
  const sItemLh = 42;
  const sGap = 26;
  const sFontSz = 22;
  const hdrFont = `700 ${sFontSz}px 'Necto Mono', monospace`;
  const itemFont = `normal ${sFontSz}px 'Necto Mono', monospace`;
  const textMaxW = CANVAS_W - mx - pad;

  const wrapText = (text, font) => {
    ctx.font = font;
    const words = text.split(" ");
    const lines = [];
    let ln = "";
    for (const w of words) {
      const t = ln ? ln + " " + w : w;
      if (ctx.measureText(t).width > textMaxW && ln) {
        lines.push(ln);
        ln = w;
      } else ln = t;
    }
    if (ln) lines.push(ln);
    return lines;
  };

  // Pre-calcular líneas con wrap para sizing y render
  const introFont = `normal 29px 'Necto Mono', monospace`;
  const introText =
    "Propuestas donde el uso creativo del código y/o tecnologías digitales sea el eje central, explorando dimensiones expresivas, experimentales o culturales.";
  const introLines = wrapText(introText, introFont);
  const introH = introLines.length * sItemLh + sGap;

  const wrapped = sections.map((sec) => ({
    hLines: wrapText(sec.header, hdrFont),
    iLines: sec.items.map((item) => wrapText(item, itemFont)),
  }));

  let sectionsH = introH;
  for (const w of wrapped) {
    sectionsH += w.hLines.length * sHdrLh;
    for (const il of w.iLines) sectionsH += il.length * sItemLh;
  }
  sectionsH += (sections.length - 1) * sGap;

  const listY = tY + titleH + pad;

  // ── Rectángulo unificado borde a borde ──
  const blockTop = tY - pad;
  const blockH = listY + sectionsH + pad - blockTop;
  ctx.save();
  ctx.fillStyle = `rgba(${bgR},${bgG},${bgB},0.92)`;
  ctx.fillRect(0, blockTop, CANVAS_W, blockH);
  ctx.restore();

  // ── Texto: título ──
  ctx.save();
  ctx.font = tFont;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = `rgb(${fR},${fG},${fB})`;
  for (let i = 0; i < titleLines5.length; i++)
    ctx.fillText(titleLines5[i], mx, tY + i * tLh);
  ctx.restore();

  // ── Texto: secciones con wrap ──
  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = `rgb(${fR},${fG},${fB})`;
  let curY = listY;
  ctx.font = introFont;
  for (const il of introLines) {
    ctx.fillText(il, mx, curY);
    curY += sItemLh;
  }
  curY += sGap;
  for (let s = 0; s < sections.length; s++) {
    ctx.font = hdrFont;
    for (const hl of wrapped[s].hLines) {
      ctx.fillText(hl, mx, curY);
      curY += sHdrLh;
    }
    ctx.font = itemFont;
    for (const il of wrapped[s].iLines) {
      for (const line of il) {
        ctx.fillText(line, mx, curY);
        curY += sItemLh;
      }
    }
    if (s < sections.length - 1) curY += sGap;
  }
  ctx.restore();

  drawSlide4Logos(p);
}

/* =====================================================
   SLIDE 6 — EQUIPO
   ===================================================== */
function drawSlide6(p) {
  const mx = state.layout.marginX;
  const fg = state.preset.fg;
  const [fR, fG, fB] = hexRgb(fg);
  const ctx = p.drawingContext;

  const logoAreaH = 160;
  const topY = 60;
  const bottomY = IG_H - logoAreaH;

  // ── Animación de píxeles (misma que slide 2) cubriendo todo el canvas ──
  drawSlide2Pixels(p, 0, bottomY + 40, 0.45);

  const titleSz = 90;
  const titleLh = 90;
  const titleFont = `700 ${titleSz}px 'workfaaad-a', monospace`;
  const title = "COMISIÓN";

  const titleEndY = topY + titleLh + 20;
  const membersH = bottomY - titleEndY - 10;

  const textX = mx;
  const textMaxW = IG_W - mx * 2;

  const nameSz = 55;
  const nameFont = `700 ${nameSz}px 'workfaaad-a', monospace`;
  const descSz = 38;
  const descFont = `normal ${descSz}px 'Necto Mono', monospace`;
  const descLh = 42;
  const nameDescGap = 10;

  const wrapDesc = (text) => {
    ctx.font = descFont;
    const words = text.split(" ");
    const lines = [];
    let ln = "";
    for (const w of words) {
      const t = ln ? ln + " " + w : w;
      if (ctx.measureText(t).width > textMaxW && ln) {
        lines.push(ln);
        ln = w;
      } else ln = t;
    }
    if (ln) lines.push(ln);
    return lines;
  };

  // Pre-calcular líneas y alto real de cada miembro
  const memberData = SLIDE6_MEMBERS.map((m) => {
    const lines = wrapDesc(m.desc);
    const h = nameSz + nameDescGap + lines.length * descLh;
    return { member: m, lines, h };
  });
  const totalContentH = memberData.reduce((acc, d) => acc + d.h, 0);
  const gap = Math.min(
    60,
    Math.max(
      20,
      Math.floor((membersH - totalContentH) / (memberData.length - 1)),
    ),
  );
  const totalBlockH = totalContentH + gap * (memberData.length - 1);
  const blockStartY = titleEndY + Math.floor((membersH - totalBlockH) / 2);

  // ── Title ──
  ctx.save();
  ctx.font = titleFont;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = `rgb(${fR},${fG},${fB})`;
  ctx.fillText(title, mx, topY);
  ctx.restore();

  // ── Member cards ──
  let curY = blockStartY;
  for (const { member, lines, h } of memberData) {
    // Name
    ctx.save();
    ctx.font = nameFont;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = `rgb(${fR},${fG},${fB})`;
    ctx.fillText(member.name, textX, curY);
    ctx.restore();

    // Description wrapped
    ctx.save();
    ctx.font = descFont;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = `rgb(${fR},${fG},${fB})`;
    const descStartY = curY + nameSz + nameDescGap;
    for (let d = 0; d < lines.length; d++) {
      ctx.fillText(lines[d], textX, descStartY + d * descLh);
    }
    ctx.restore();

    curY += h + gap;
  }

  drawSlide4Logos(p);
}

/* =====================================================
   SLIDE 7 — EXTENSIÓN DE PLAZO
   ===================================================== */

function drawSlide7(p) {
  const fg = state.preset.fg;
  const [fR, fG, fB] = hexRgb(fg);
  const ctx = p.drawingContext;
  const font = "'workfaaad-a', monospace";

  const lines = [
    { text: "Convocatoria PCD — 2026", size: 52, weight: 400 },
    { text: "Extensión Plazo", size: 186, weight: 700 }, // 140pt
    { text: "26", size: 720, weight: 700 },
    { text: "de Mayo", size: 186, weight: 400 }, // 140pt
  ];

  const availW = CANVAS_W * 0.9;
  ctx.font = `700 ${lines[2].size}px ${font}`;
  while (ctx.measureText(lines[2].text).width > availW) {
    lines[2].size -= 10;
    ctx.font = `700 ${lines[2].size}px ${font}`;
  }

  const inter = 0.92;
  const totalH = lines.reduce((acc, l) => acc + l.size * inter, 0);
  let currentY = CANVAS_H / 2 - totalH / 2;

  if (!state.slide7.hideEditorial) {
    ctx.save();
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.fillStyle = `rgb(${fR},${fG},${fB})`;

    lines.forEach((line) => {
      if (line.text !== "26") {
        ctx.font = `${line.weight} ${line.size}px ${font}`;
        ctx.fillText(line.text, CANVAS_W / 2, currentY);
      }
      currentY += line.size * inter;
    });
    ctx.restore();

    if (typeof drawSlide4Logos === "function") drawSlide4Logos(p);
  }
}

/* =====================================================
   SLIDE 8 — CIERRE CONVOCATORIA
   ===================================================== */

function drawSlide8(p) {
  if (!state.slide7.hideEditorial) {
    drawSlide2Pixels(p, 0, CANVAS_H, 0.55);
    drawSlide8TextBlock(p);

    if (typeof drawSlide4Logos === "function") drawSlide4Logos(p);
  }
}

/* =====================================================
   SLIDE 9 — FONDO PIXEL
   ===================================================== */

function drawSlide9(p) {
  captureSlide9BackgroundFrame(p);
  scheduleSlide9PreviewFrame();

  const active = getActiveSlide9Layout();
  const img = active?.img || active?.image || state.slide9?.layoutImage;
  if (!img) return;
  p.push();
  p.drawingContext.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
  p.pop();
}

function drawSlide12(p) {
  captureSlide9BackgroundFrame(p);
}

/* =====================================================
   SLIDE 11 — PIXEL VERTICAL 100×170
   ===================================================== */
function drawSlide11(p) {
  const ctx = p.drawingContext;
  const bg = hexRgb(state.preset.bg);
  const fg = hexRgb(state.preset.fg);
  const fgIsLight = slide11RgbLum(fg) > 225;
  const tone = (amt) => mixRgb(bg, fg, amt);
  const colors = {
    bg,
    fg,
    mid: tone(fgIsLight ? 0.62 : 0.68),
    pale: tone(fgIsLight ? 0.82 : 0.86),
    soft: tone(fgIsLight ? 0.36 : 0.46),
    strong: fg,
  };
  const t = p.frameCount * 0.018 * (state.anim.speed || 1);
  const u = Math.min(CANVAS_W, CANVAS_H) / 1000;
  const px = Math.max(8, Math.round(18 * u));

  p.push();
  p.noStroke();
  const effect = state.anim.slide11Anim || "bitmap-fragments";
  if (effect === "ascii-zine-poster") {
    drawSlide11AsciiZinePoster(ctx, colors, t, px);
  } else if (effect === "call-strip-stairs") {
    drawSlide11CallStripStairs(ctx, colors, t, px);
  } else if (effect === "vertical-glyph-walls") {
    drawSlide11VerticalGlyphWalls(ctx, colors, t, px);
  } else if (effect === "moire-research-field") {
    drawSlide11MoireResearchField(ctx, colors, t, px);
  } else if (effect === "neon-atlas-blocks") {
    drawSlide11NeonAtlasBlocks(ctx, colors, t, px);
  } else if (effect === "modular-poster-tiles") {
    drawSlide11ModularPosterTiles(ctx, colors, t, px);
  } else if (effect === "symmetric-weave") {
    drawSlide11SymmetricWeave(ctx, colors, t, px);
  } else if (effect === "topographic-halftone") {
    drawSlide11TopographicHalftone(ctx, colors, t, px);
  } else if (effect === "ascii-checker-field") {
    drawSlide11AsciiCheckerField(ctx, colors, t, px);
  } else {
    drawSlide11BitmapFragments(ctx, colors, t, px);
  }
  if (effect !== "ascii-zine-poster") {
    drawSlide11EditorialOverlay(ctx, colors, t, px);
  }
  p.pop();
}

function drawSlide11BitmapFragments(ctx, colors, t, px) {
  const { bg, fg, mid, pale, strong } = colors;
  const cell = Math.max(7, px * 0.58);
  const cols = Math.ceil(CANVAS_W / cell);
  const rows = Math.ceil(CANVAS_H / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const flow =
        Math.sin(c * 0.17 + t * 1.2) +
        Math.cos(r * 0.13 - t * 0.9) +
        Math.sin((c + r) * 0.055 + t * 1.6);
      const grain = slide11Hash(c, r, 11 + Math.floor(t * 5));
      const rgb = flow + grain * 1.4 > 0.72
        ? fg
        : flow - grain > 0.2
          ? strong
          : flow > -0.55
            ? mid
            : bg;
      fillRgb(ctx, rgb, 1);
      const x = c * cell + Math.sin(r * 0.21 + t) * cell * 0.18;
      const y = r * cell + Math.cos(c * 0.19 - t) * cell * 0.18;
      const shrink = grain > 0.72 ? 0.18 : grain > 0.48 ? 0.08 : 0;
      ctx.fillRect(x, y, cell * (1 - shrink) + 0.6, cell * (1 - shrink) + 0.6);
    }
  }
  drawSlide11OrganicVeins(ctx, pale, bg, t, px, 9, 0.34);
}

function drawSlide11CallStripStairs(ctx, colors, t, px) {
  const { bg, fg, mid, pale, soft, strong } = colors;
  const cell = Math.max(10, px * 0.95);
  const cols = Math.ceil(CANVAS_W / cell);
  const rows = Math.ceil(CANVAS_H / cell);
  for (let c = 0; c < cols; c++) {
    const band = Math.sin(c * 0.68 + t * 1.1);
    const rgb = band > 0.42 ? pale : band > -0.15 ? soft : bg;
    fillRgb(ctx, rgb, 1);
    ctx.fillRect(c * cell, 0, cell + 0.5, CANVAS_H);
  }
  for (let r = -4; r < rows + 8; r++) {
    for (let c = -4; c < cols + 4; c++) {
      const river =
        r -
        c * 1.35 -
        Math.sin(c * 0.36 + t * 1.7) * 5 -
        Math.cos(r * 0.19 - t) * 3;
      const near = Math.abs(river % 15);
      if (near < 4.2 || near > 13.4) {
        const x = c * cell + Math.sin(r * 0.33 + t) * cell * 0.25;
        const y = r * cell;
        const n = slide11Hash(c, r, 24 + Math.floor(t * 4));
        const rgb = n > 0.76 ? strong : n > 0.5 ? fg : mid;
        fillRgb(ctx, rgb, 1);
        ctx.fillRect(x, y, cell * (1.1 + n * 0.25), cell * 0.9);
      }
    }
  }
  drawSlide11OrganicVeins(ctx, fg, bg, t + 3, px, 7, 0.18);
}

function drawSlide11VerticalGlyphWalls(ctx, colors, t, px) {
  const { bg, fg, mid, pale, strong } = colors;
  const cell = Math.max(8, px * 0.62);
  const cols = Math.ceil(CANVAS_W / cell);
  const rows = Math.ceil(CANVAS_H / cell);
  for (let c = 0; c < cols; c++) {
    const base = Math.sin(c * 0.22 + t * 0.8);
    for (let r = 0; r < rows; r++) {
      const warp = Math.sin(r * 0.11 + c * 0.19 + t * 1.4);
      const cavity = Math.sin((c - cols * 0.38) * 0.09) + Math.cos((r - rows * 0.42) * 0.12 + t);
      const n = slide11Hash(c, r, 37 + Math.floor(t * 3));
      const rgb = cavity > 1.0
        ? bg
        : base + warp + n > 0.95
          ? pale
          : base + warp > 0.15
            ? fg
            : mid;
      fillRgb(ctx, rgb, 1);
      const w = cell * (0.32 + Math.abs(warp) * 0.64);
      const x = c * cell + Math.sin(r * 0.18 + t) * cell * 0.24;
      ctx.fillRect(x, r * cell, Math.max(2, w), cell + 0.7);
      if (n > 0.9) {
        fillRgb(ctx, strong, 1);
        ctx.fillRect(x + w * 0.55, r * cell, cell * 0.2, cell);
      }
    }
  }
}

function drawSlide11MoireResearchField(ctx, colors, t, px) {
  const { bg, fg, mid, pale, strong } = colors;
  const cell = Math.max(5, px * 0.34);
  const cols = Math.ceil(CANVAS_W / cell);
  const rows = Math.ceil(CANVAS_H / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const waveA = Math.sin(c * 0.48 + r * 0.1 + t * 2.1);
      const waveB = Math.cos(c * 0.08 - r * 0.42 + t * 1.4);
      const mask = Math.sin(c * 0.03 + r * 0.07 + t * 0.7);
      const x = c * cell + waveB * cell * 0.28;
      const y = r * cell + waveA * cell * 0.2;
      const rgb = mask + waveA > 0.58
        ? fg
        : waveB > 0.64
          ? strong
          : mask > -0.15
            ? mid
            : bg;
      fillRgb(ctx, rgb, 1);
      ctx.fillRect(x, y, cell * (0.45 + Math.abs(waveA) * 0.75), cell * (0.22 + Math.abs(waveB) * 0.85));
    }
  }
  drawSlide11OrganicVeins(ctx, pale, bg, t + 7, px, 12, 0.12);
}

function drawSlide11NeonAtlasBlocks(ctx, colors, t, px) {
  const { bg, fg, mid, pale, soft, strong } = colors;
  const cell = Math.max(11, px * 0.95);
  const cols = Math.ceil(CANVAS_W / cell);
  const rows = Math.ceil(CANVAS_H / cell);
  fillRgb(ctx, soft, 1);
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (let r = -2; r < rows + 2; r++) {
    for (let c = -2; c < cols + 2; c++) {
      const contour =
        Math.sin(c * 0.2 + t * 0.8) +
        Math.cos(r * 0.21 - t * 0.6) +
        Math.sin((c - r) * 0.13 + t);
      const n = slide11Hash(c, r, 53);
      if (contour + n * 1.1 < -0.38) continue;
      const rgb = contour > 1.3
        ? fg
        : n > 0.76
          ? pale
          : contour > 0.35
            ? strong
            : bg;
      fillRgb(ctx, rgb, 1);
      const jitterX = Math.sin(r * 0.37 + t * 1.2) * cell * 0.22;
      const jitterY = Math.cos(c * 0.31 - t) * cell * 0.22;
      ctx.fillRect(c * cell + jitterX, r * cell + jitterY, cell * (1.05 + n * 0.24), cell * (1.05 + (1 - n) * 0.18));
    }
  }
  drawSlide11OrganicVeins(ctx, mid, fg, t, px, 8, 0.22);
}

function drawSlide11ModularPosterTiles(ctx, colors, t, px) {
  const { bg, fg, mid, pale, soft, strong } = colors;
  const tile = CANVAS_W / 17;
  const cols = Math.ceil(CANVAS_W / tile);
  const rows = Math.ceil(CANVAS_H / tile);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bend = Math.sin(c * 0.72 + t) + Math.cos(r * 0.42 - t * 1.3);
      const n = slide11Hash(c, r, 71 + Math.floor(t * 2));
      const rgb = bend + n > 1.25
        ? fg
        : bend > 0.42
          ? pale
          : n > 0.62
            ? mid
            : bg;
      fillRgb(ctx, rgb, 1);
      const x = c * tile + Math.sin(r * 0.29 + t) * tile * 0.15;
      const y = r * tile + Math.cos(c * 0.23 - t) * tile * 0.15;
      ctx.fillRect(x, y, tile + 0.8, tile + 0.8);
      if (n > 0.83 || Math.abs(bend) < 0.16) {
        fillRgb(ctx, n > 0.9 ? strong : soft, 1);
        ctx.fillRect(x, y, tile * (n > 0.9 ? 0.36 : 0.58), tile + 0.8);
      }
    }
  }
  drawSlide11OrganicVeins(ctx, fg, bg, t + 2, px, 6, 0.16);
}

function drawSlide11SymmetricWeave(ctx, colors, t, px) {
  const contrast = colors.fg;
  const base = colors.bg;
  const deepTone = colors.strong;
  const mistTone = colors.mid;
  const brightTone = colors.pale;
  const cell = Math.max(14, Math.round(px * 1.05));
  const cols = Math.ceil(CANVAS_W / cell);
  const rows = Math.ceil(CANVAS_H / cell);
  const halfCols = Math.ceil(cols / 2);
  const cx = (cols - 1) / 2;

  fillRgb(ctx, base, 1);
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (let r = -1; r <= rows; r++) {
    for (let c = 0; c < halfCols; c++) {
      const dist = Math.abs(c - cx * 0.5);
      const diagonalA = Math.abs(((r + c + Math.floor(t * 1.3)) % 13) - 6);
      const diagonalB = Math.abs(((r - c + Math.floor(t * 1.1)) % 17) - 8);
      const diamond =
        Math.abs((c - halfCols * 0.5) * 0.85) +
        Math.abs(((r % 22) - 11) * 0.48);
      const hash = slide11Hash(c, r, 93);
      const pulse = Math.sin(t * 2.2 + r * 0.22 + c * 0.47);
      const active =
        diagonalA < 2.1 ||
        diagonalB < 2.4 ||
        (diamond > 5.2 && diamond < 8.1) ||
        (hash > 0.78 && pulse > -0.2);
      if (!active) continue;

      const layer =
        pulse > 0.86 || (hash > 0.9 && diagonalA < 2.4)
          ? brightTone
          : hash > 0.82 || pulse > 0.72
            ? contrast
            : hash > 0.52
              ? mistTone
              : deepTone;
      const alpha =
        layer === brightTone
          ? 0.72
          : layer === contrast
            ? 0.62
            : layer === mistTone
              ? 0.42
              : 0.56;
      const y = r * cell;
      const leftX = c * cell;
      const rightX = (cols - 1 - c) * cell;
      fillRgb(ctx, layer, alpha);
      ctx.fillRect(leftX, y, cell, cell);
      ctx.fillRect(rightX, y, cell, cell);

      if ((diagonalA < 1.2 || diagonalB < 1.2) && r % 3 !== 0) {
        fillRgb(ctx, contrast, 0.22);
        const inset = Math.round(cell * 0.22);
        ctx.fillRect(leftX + inset, y + inset, cell - inset * 2, cell - inset * 2);
        ctx.fillRect(rightX + inset, y + inset, cell - inset * 2, cell - inset * 2);
      }
      if (dist < 2.2 && r % 4 === 0) {
        fillRgb(ctx, brightTone, 0.62);
        ctx.fillRect(leftX, y, cell, cell);
        ctx.fillRect(rightX, y, cell, cell);
      }
    }
  }

  for (let r = 0; r < rows; r += 5) {
    fillRgb(ctx, contrast, 0.16);
    const y = r * cell + Math.round(Math.sin(t + r) * cell);
    for (let c = 1; c < cols; c += 4) {
      ctx.fillRect(c * cell, y, cell, cell);
    }
  }

  fillRgb(ctx, brightTone, 0.32);
  for (let r = 2; r < rows; r += 9) {
    const y = r * cell;
    for (let c = 0; c < halfCols; c += 5) {
      const shimmer = Math.sin(t * 2.6 + r * 0.5 + c) > 0.35;
      if (!shimmer) continue;
      const leftX = c * cell;
      const rightX = (cols - 1 - c) * cell;
      ctx.fillRect(leftX, y, cell, cell);
      ctx.fillRect(rightX, y, cell, cell);
    }
  }
}

function drawSlide11TopographicHalftone(ctx, colors, t, px) {
  const paper = colors.bg;
  const accent = colors.fg;
  const deepAccent = colors.strong;
  const mutedAccent = colors.mid;
  const paleAccent = colors.pale;
  const softAccent = colors.soft;
  fillRgb(ctx, paper, 1);
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const bands = [
    { y: -0.08, h: 0.24, color: deepAccent, mode: "dots", amp: 0.045, alpha: 0.58 },
    { y: 0.11, h: 0.19, color: accent, mode: "solid", amp: 0.035, alpha: 0.62 },
    { y: 0.27, h: 0.2, color: mutedAccent, mode: "hatch", amp: 0.05, alpha: 0.58 },
    { y: 0.43, h: 0.2, color: accent, mode: "solid", amp: 0.038, alpha: 0.52 },
    { y: 0.57, h: 0.23, color: deepAccent, mode: "cross", amp: 0.046, alpha: 0.48 },
    { y: 0.74, h: 0.34, color: paleAccent, mode: "rings", amp: 0.04, alpha: 0.42 },
  ];

  for (let i = 0; i < bands.length; i++) {
    drawSlide11TopoBand(ctx, bands[i], i, t, px);
  }

  drawSlide11TopoHatch(ctx, CANVAS_H * 0.26, CANVAS_H * 0.24, mutedAccent, t, px, -1, 0.46);
  drawSlide11TopoHatch(ctx, CANVAS_H * 0.74, CANVAS_H * 0.24, accent, t + 3, px, 1, 0.32);
  drawSlide11TopoDotMist(ctx, softAccent, t, px);
}

function drawSlide11TopoBand(ctx, band, index, t, px) {
  const step = Math.max(18, px * 1.25);
  const top = CANVAS_H * band.y;
  const h = CANVAS_H * band.h;
  const cols = Math.ceil(CANVAS_W / step) + 2;
  const rows = Math.ceil(h / step) + 4;
  const scroll = ((t * step * (0.22 + index * 0.035)) % step) - step;

  for (let r = -2; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const x = c * step + scroll;
      const wave =
        Math.sin(c * 0.19 + t * 0.7 + index) * CANVAS_H * band.amp +
        Math.cos(c * 0.071 - t * 0.9 + index * 2) * CANVAS_H * band.amp * 0.55;
      const y =
        top +
        r * step +
        wave +
        Math.sin(r * 0.63 + t) * step * 0.16 +
        Math.sin(t * 1.25 + index) * step * 0.55;
      const ragged = slide11Hash(c, r, 120 + index + Math.floor(t * 2));
      const shimmer = 0.76 + Math.sin(t * 2.4 + c * 0.41 + r * 0.27 + index) * 0.24;
      if (ragged < 0.08 && (r === 0 || r > rows - 3)) continue;

      if (band.mode === "dots") {
        fillRgb(ctx, band.color, band.alpha * (0.65 + ragged * 0.35) * shimmer);
        ctx.beginPath();
        ctx.arc(x + step * 0.5, y + step * 0.5, step * (0.2 + ragged * 0.13), 0, Math.PI * 2);
        ctx.fill();
      } else if (band.mode === "hatch") {
        fillRgb(ctx, band.color, band.alpha * shimmer);
        ctx.fillRect(x, y, step, step);
        strokeRgb(ctx, band.color, 0.36);
        ctx.lineWidth = Math.max(1, step * 0.12);
        ctx.beginPath();
        ctx.moveTo(x - step * 0.2, y + step);
        ctx.lineTo(x + step, y - step * 0.2);
        ctx.stroke();
      } else if (band.mode === "cross") {
        fillRgb(ctx, band.color, band.alpha * 0.42 * shimmer);
        ctx.fillRect(x, y, step, step);
        strokeRgb(ctx, band.color, band.alpha * shimmer);
        ctx.lineWidth = Math.max(1, step * 0.08);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + step, y + step);
        ctx.moveTo(x + step, y);
        ctx.lineTo(x, y + step);
        ctx.stroke();
      } else if (band.mode === "rings") {
        strokeRgb(ctx, band.color, band.alpha * shimmer);
        ctx.lineWidth = Math.max(1, step * 0.08);
        ctx.beginPath();
        ctx.arc(x + step * 0.5, y + step * 0.5, step * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        if (ragged > 0.56) {
          ctx.beginPath();
          ctx.arc(x + step * 0.5, y + step * 0.5, step * 0.13, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        fillRgb(ctx, band.color, band.alpha * (0.72 + ragged * 0.24) * shimmer);
        ctx.fillRect(x, y, step + 0.5, step + 0.5);
      }
    }
  }
}

function drawSlide11TopoHatch(ctx, y, h, color, t, px, dir, alpha) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, CANVAS_W, h);
  ctx.clip();
  strokeRgb(ctx, color, alpha);
  ctx.lineWidth = Math.max(1, px * 0.11);
  const gap = px * 1.45;
  const drift = (t * px * 2.2) % gap;
  for (let x = -CANVAS_H; x < CANVAS_W + CANVAS_H; x += gap) {
    ctx.beginPath();
    if (dir > 0) {
      ctx.moveTo(x + drift, y + h);
      ctx.lineTo(x + h + drift, y);
    } else {
      ctx.moveTo(x + drift, y);
      ctx.lineTo(x + h + drift, y + h);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlide11TopoDotMist(ctx, color, t, px) {
  const step = Math.max(18, px * 1.15);
  fillRgb(ctx, color, 0.18);
  for (let r = 0; r < CANVAS_H / step; r++) {
    for (let c = 0; c < CANVAS_W / step; c++) {
      const n =
        Math.sin(c * 0.18 + r * 0.22 + t * 2.4) +
        slide11Hash(c, r, 160 + Math.floor(t * 3));
      if (n < 1.08) continue;
      ctx.beginPath();
      ctx.arc(c * step, r * step, step * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSlide11AsciiCheckerField(ctx, colors, t, px) {
  const paper = colors.bg;
  const ink = colors.fg;
  const inkSoft = colors.fg;
  fillRgb(ctx, paper, 1);
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const cell = Math.max(34, Math.round(px * 1.95));
  const cols = Math.ceil(CANVAS_W / cell);
  const rows = Math.ceil(CANVAS_H / cell);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(cell * 1.18)}px 'Space Mono', monospace`;

  for (let r = -1; r < rows + 1; r++) {
    for (let c = -1; c < cols + 1; c++) {
      const x = c * cell;
      const y = r * cell;
      const terrain =
        Math.sin(c * 0.22 + t * 0.85) +
        Math.cos(r * 0.17 - t * 0.55) +
        Math.sin((c + r) * 0.08 + t * 0.7);
      const diagonal = r - c * 0.78 + Math.sin(c * 0.15 + t) * 4;
      const hash = slide11Hash(c, r, 210 + Math.floor(t * 2));
      const checkerZone =
        terrain > 0.42 &&
        diagonal > -5 &&
        diagonal < rows * 0.42 &&
        (c + r) % 2 === 0;
      const stripeZone = terrain < -0.12 && r > rows * 0.46 && c % 3 !== 1;
      const starZone = !checkerZone && !stripeZone && hash > 0.68;
      const dotZone = hash > 0.93 || (c % 9 === 0 && r % 7 === 0);

      if (checkerZone) {
        const on = (c + r + Math.floor(t * 2)) % 2 === 0;
        if (on) {
          fillRgb(ctx, ink, 0.5);
          ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
        }
      } else if (stripeZone) {
        fillRgb(ctx, ink, 0.48);
        const bars = 2;
        const barW = Math.max(3, cell * 0.13);
        for (let i = 0; i < bars; i++) {
          const offset = i * cell * 0.34 + ((r + c) % 3) * cell * 0.05;
          ctx.fillRect(x + offset, y, barW, cell + 0.5);
        }
      } else if (starZone) {
        fillRgb(ctx, ink, hash > 0.82 ? 0.64 : 0.46);
        const drift = Math.sin(t * 2 + c * 0.3 + r * 0.2) * cell * 0.06;
        ctx.fillText("*", x + cell * 0.5 + drift, y + cell * 0.52);
      }

      if (dotZone) {
        fillRgb(ctx, ink, 0.52);
        const s = Math.max(4, cell * 0.14);
        ctx.fillRect(x + cell * 0.39, y + cell * 0.39, s, s);
      }

      if (hash > 0.96 && !checkerZone) {
        fillRgb(ctx, inkSoft, 0.34);
        ctx.fillRect(x, y, cell * 0.72, cell * 0.72);
      }
    }
  }

  for (let band = 0; band < 4; band++) {
    const y = CANVAS_H * (0.12 + band * 0.22) + Math.sin(t + band) * cell;
    fillRgb(ctx, ink, 0.2);
    for (let c = 0; c < cols; c += 4) {
      const x = c * cell + ((band % 2) * cell);
      ctx.fillRect(x, y, cell, cell);
    }
  }
}

function drawSlide11AsciiZinePoster(ctx, colors, t, px) {
  const blue = colors.bg;
  const paper = colors.fg;
  const blueInk = colors.bg;
  const palePixel = mixRgb(blue, paper, 0.36);
  const midPixel = mixRgb(blue, paper, 0.18);
  const mono = "'Space Mono', 'Necto Mono', monospace";
  const margin = CANVAS_W * 0.03;
  const bodyMargin = CANVAS_W * 0.03;
  const whiteY = CANVAS_H * 0.58;

  ctx.fillStyle = `rgb(${blue[0]},${blue[1]},${blue[2]})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawSlide11ReferencePixels(ctx, CANVAS_W * 0.62, -px * 1.2, px * 2.2, t, [
    paper,
    blue,
    palePixel,
    blue,
    paper,
  ]);
  drawSlide11ReferencePixels(ctx, CANVAS_W * 0.76, CANVAS_H * 0.08, px * 2.5, t + 2, [
    blue,
    paper,
    blue,
    midPixel,
    paper,
  ]);

  ctx.fillStyle = `rgba(${paper[0]},${paper[1]},${paper[2]},0.52)`;
  ctx.font = `400 ${Math.round(px * 2.8)}px ${mono}`;
  ctx.fillText("/*", margin * 0.22, CANVAS_H * 0.055);
  ctx.fillText("/*", margin * 0.22, CANVAS_H * 0.135);
  ctx.fillText("/*", margin * 0.22, CANVAS_H * 0.215);

  drawSlide11AsciiHeadline(
    ctx,
    ["PROCESSING"],
    margin,
    CANVAS_H * 0.03,
    CANVAS_W - margin * 2,
    CANVAS_H * 0.16,
    paper,
    blue,
    t,
  );
  drawSlide11MetaLine(ctx, `26.06.2026//CRTIC`, margin + px * 3.8, CANVAS_H * 0.215, paper, px * 1.42);
  drawSlide11AsciiHeadline(
    ctx,
    ["COMMUNITY"],
    margin,
    CANVAS_H * 0.255,
    CANVAS_W - margin * 2,
    CANVAS_H * 0.145,
    paper,
    blue,
    t + 0.8,
  );
  drawSlide11MetaLine(ctx, `FaAAD//27.06.2026`, margin + px * 3.8, CANVAS_H * 0.43, paper, px * 1.35);
  drawSlide11AsciiHeadline(
    ctx,
    ["DAY 2026"],
    margin,
    CANVAS_H * 0.455,
    CANVAS_W - margin * 2,
    CANVAS_H * 0.12,
    paper,
    blue,
    t + 1.6,
  );

  drawSlide11SlashBand(ctx, whiteY - px * 3.0, px * 3.7, paper, t, true);

  ctx.fillStyle = `rgb(${paper[0]},${paper[1]},${paper[2]})`;
  ctx.fillRect(0, whiteY, CANVAS_W, CANVAS_H - whiteY);

  const infoY = whiteY + px * 3.8;
  const leftX = bodyMargin;
  const rightX = CANVAS_W * 0.52;
  const leftW = CANVAS_W * 0.43;
  const rightW = CANVAS_W - rightX - bodyMargin;
  const bodySize = Math.round(px * 1.22);
  drawSlide11Paragraph(ctx, SLIDE11_DESCRIPTION, leftX, infoY, leftW, bodySize, blueInk, 1.58);
  drawSlide11List(ctx, SLIDE11_PEOPLE, rightX, infoY, rightW, bodySize, blueInk, ">");

  drawSlide11SlashBand(ctx, whiteY + CANVAS_H * 0.225, px * 3.7, blueInk, t + 1, false);

  drawSlide11ProjectTicker(
    ctx,
    bodyMargin,
    whiteY + CANVAS_H * 0.29,
    CANVAS_W - bodyMargin * 2,
    CANVAS_H * 0.08,
    blueInk,
    Math.round(px * 0.95),
  );

  drawSlide11LogoRow(ctx, bodyMargin, CANVAS_H - px * 5.7, CANVAS_W - bodyMargin * 2, px * 4.3, blueInk);
}

function drawSlide11AsciiShelf(ctx, x, y, w, px, color, t, variant = 0) {
  const size = Math.round(px * 0.78);
  ctx.font = `700 ${size}px 'Space Mono', monospace`;
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.86)`;
  const patterns = [
    "|=|__|::|__|~~~|__|=|###|>__<|^^|__|::::|__|",
    "===---===---|||---:::---|||---ooo---|||---===",
    "|===|--| |--|+++|--|[]|--|::::|--|==|--|::|",
  ];
  const text = patterns[variant % patterns.length];
  const charW = ctx.measureText("M").width;
  const repeat = Math.ceil(w / (text.length * charW)) + 1;
  const scroll = Math.floor(t * 2) % text.length;
  const line = (text.repeat(repeat + 1)).slice(scroll, scroll + Math.ceil(w / charW) + 2);
  ctx.fillText(line, x, y);
  ctx.fillText("=".repeat(Math.ceil(w / charW)), x, y + size * 1.25);
}

function drawSlide11AsciiBook(ctx, x, y, w, h, ink, softInk, px) {
  drawSlide11AsciiBox(ctx, x, y, w, h, ink, px, "");
  const size = Math.round(px * 0.88);
  const lineH = size * 1.1;
  const mid = x + w / 2;
  ctx.font = `700 ${size}px 'Space Mono', monospace`;
  ctx.fillStyle = `rgba(${softInk[0]},${softInk[1]},${softInk[2]},0.72)`;
  const rows = Math.floor(h / lineH) - 2;
  for (let i = 1; i <= rows; i++) {
    const yy = y + i * lineH;
    ctx.fillText("||", x + px * 1.1, yy);
    ctx.fillText("||", x + w - px * 2.2, yy);
    ctx.fillText(i % 2 ? " |" : " /", mid - px * 0.5, yy);
    ctx.fillText(i % 2 ? "| " : "\\ ", mid + px * 0.2, yy);
  }
  strokeRgb(ctx, ink, 0.74);
  ctx.lineWidth = Math.max(1, px * 0.11);
  ctx.beginPath();
  ctx.moveTo(mid, y + px * 1.5);
  ctx.lineTo(mid, y + h - px * 1.5);
  ctx.stroke();
}

function drawSlide11AsciiBox(ctx, x, y, w, h, color, px, title = "") {
  const size = Math.round(px * 0.82);
  const lineH = size * 1.1;
  ctx.font = `700 ${size}px 'Space Mono', monospace`;
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.86)`;
  const charW = ctx.measureText("M").width;
  const cols = Math.max(4, Math.floor(w / charW) - 2);
  const rows = Math.max(3, Math.floor(h / lineH));
  const top = "." + "-".repeat(cols) + ".";
  const bottom = "'" + "-".repeat(cols) + "'";
  ctx.fillText(top, x, y + lineH);
  for (let r = 2; r < rows; r++) {
    ctx.fillText("|" + " ".repeat(cols) + "|", x, y + r * lineH);
  }
  ctx.fillText(bottom, x, y + rows * lineH);
  if (title) {
    ctx.fillText(`| ${title} ${"-".repeat(Math.max(2, cols - title.length - 3))}|`, x, y + lineH * 2);
  }
}

function drawSlide11AsciiCentered(ctx, text, x, y, w, color, size) {
  ctx.font = `900 ${size}px 'Space Mono', monospace`;
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.9)`;
  ctx.textAlign = "center";
  ctx.fillText(text, x + w / 2, y);
  ctx.textAlign = "left";
}

function drawSlide11ReferencePixels(ctx, x, y, cell, t, palette) {
  const pattern = [
    "001101011001111001",
    "010010010100001010",
    "111010110111011110",
    "001110010010010001",
    "011001111010111011",
    "110010001110010110",
    "010111010011111001",
  ];
  const drift = Math.floor(t * 1.5) % pattern[0].length;
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      const idx = (c + drift) % pattern[r].length;
      if (pattern[r][idx] !== "1" && slide11Hash(c, r, Math.floor(t * 4)) < 0.58) continue;
      const color = palette[(c + r * 2 + Math.floor(t)) % palette.length];
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color === palette[1] ? 0.58 : 0.96})`;
      ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
    }
  }
}

function drawSlide11MetaLine(ctx, text, x, y, color, size) {
  ctx.font = `900 ${Math.round(size)}px 'Space Mono', 'Necto Mono', monospace`;
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.96)`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function drawSlide11SlashBand(ctx, y, h, color, t, fillBg = false) {
  if (fillBg) {
    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},1)`;
    ctx.fillRect(0, y, CANVAS_W, h);
    ctx.fillStyle = `rgba(${state.preset.bg ? hexRgb(state.preset.bg)[0] : 0},${state.preset.bg ? hexRgb(state.preset.bg)[1] : 0},${state.preset.bg ? hexRgb(state.preset.bg)[2] : 0},0.98)`;
  } else {
    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.98)`;
  }
  const size = Math.max(14, h * 0.78);
  ctx.font = `900 ${Math.round(size)}px 'Space Mono', monospace`;
  ctx.textBaseline = "top";
  const slash = "////////////////////////////";
  const charW = ctx.measureText("/").width;
  const offset = -((t * 18) % (charW * 2));
  for (let yy = y - size * 0.08; yy < y + h; yy += size * 0.58) {
    for (let x = offset; x < CANVAS_W + charW * 2; x += slash.length * charW * 0.72) {
      ctx.fillText(slash, x, yy);
    }
  }
}

function drawSlide11ProjectTicker(ctx, x, y, w, h, color, size) {
  const text = SLIDE11_PROJECTS.join(" // ");
  const lines = slide11WrapText(ctx, text, w, `900 ${size}px 'Space Mono', monospace`);
  ctx.font = `900 ${size}px 'Space Mono', monospace`;
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.96)`;
  ctx.textBaseline = "alphabetic";
  const lineH = size * 1.55;
  const maxLines = Math.floor(h / lineH);
  lines.slice(0, maxLines).forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineH);
  });
}

function drawSlide11LogoRow(ctx, x, y, w, h, color) {
  const logoHex = slide11RgbHex(color);
  const order = ["faad_lockup-principal", "processingFoundation", "LID", "crtic"];
  const scale = {
    "faad_lockup-principal": 0.7,
    processingFoundation: 0.9,
    LID: 0.88,
    crtic: 0.92,
  };
  for (const name of order) {
    const c = _logosImgCache[name];
    const stale =
      !c ||
      c.color !== logoHex ||
      (name === "processingFoundation" && c.bg !== state.preset.bg);
    if (stale) _buildLogoImg(name, logoHex);
  }

  const logoData = order.map((name) => {
    const c = _logosImgCache[name];
    if (!c || !c.img.complete || c.img.naturalWidth === 0) return { w: 0, h: 0 };
    const ih = h * (scale[name] ?? 1);
    return { w: ih * (c.img.naturalWidth / c.img.naturalHeight), h: ih };
  });
  const totalW = logoData.reduce((sum, item) => sum + item.w, 0);
  const gap = Math.max(24, (w - totalW) / (order.length - 1));
  let xx = x;
  order.forEach((name, i) => {
    const c = _logosImgCache[name];
    const d = logoData[i];
    if (c && c.img.complete && c.img.naturalWidth > 0 && d.w > 0) {
      ctx.drawImage(c.img, xx, y + (h - d.h) / 2, d.w, d.h);
    }
    xx += d.w + gap;
  });
}

function slide11RgbHex(rgb) {
  return (
    "#" +
    rgb
      .map((value) =>
        Math.max(0, Math.min(255, Math.round(value)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

function drawSlide11EditorialOverlay(ctx, colors, t, px) {
  const bg = colors.bg;
  const fg = colors.fg;
  const panelBg = mixRgb(bg, [0, 0, 0], slide11RgbLum(bg) > 128 ? 0.08 : 0.16);
  const margin = CANVAS_W * 0.055;
  const gap = CANVAS_W * 0.028;
  const titleTop = CANVAS_H * 0.045;
  const titleH = CANVAS_H * 0.28;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  drawSlide11Rule(ctx, margin, titleTop - px * 1.2, CANVAS_W - margin * 2, fg, t);
  drawSlide11AsciiHeadline(
    ctx,
    ["PROCESSING", "COMMUNITY", "DAY 2026"],
    margin,
    titleTop,
    CANVAS_W - margin * 2,
    titleH,
    fg,
    bg,
    t,
  );

  const descY = titleTop + titleH + gap;
  const descW = CANVAS_W * 0.58;
  const dateX = margin + descW + gap;
  const dateW = CANVAS_W - margin - dateX;
  const footerY = CANVAS_H - margin - px * 5.6;
  drawSlide11Panel(ctx, margin, descY, descW, CANVAS_H * 0.13, panelBg, fg, 0.74);
  drawSlide11Label(ctx, "DESCRIPCION", margin + px, descY + px * 1.45, fg, px);
  drawSlide11Paragraph(
    ctx,
    SLIDE11_DESCRIPTION,
    margin + px,
    descY + px * 3.2,
    descW - px * 2,
    Math.round(px * 1.05),
    fg,
    1.2,
  );

  drawSlide11Panel(ctx, dateX, descY, dateW, CANVAS_H * 0.13, fg, bg, 0.84);
  ctx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},0.92)`;
  ctx.font = `700 ${Math.round(px * 1.15)}px 'Space Mono', monospace`;
  ctx.fillText("FECHAS", dateX + px, descY + px * 1.6);
  ctx.font = `900 ${Math.round(px * 2.1)}px 'Space Mono', monospace`;
  ctx.fillText(SLIDE11_DATES[0], dateX + px, descY + px * 4.2);
  ctx.fillText(SLIDE11_DATES[1], dateX + px, descY + px * 6.6);

  const peopleY = descY + CANVAS_H * 0.16;
  const peopleW = CANVAS_W * 0.34;
  const projectsX = margin + peopleW + gap;
  const projectsW = CANVAS_W - margin - projectsX;
  const contentH = footerY - peopleY - gap;
  drawSlide11Panel(ctx, margin, peopleY, peopleW, contentH, panelBg, fg, 0.66);
  drawSlide11Label(ctx, "PERSONAS", margin + px, peopleY + px * 1.5, fg, px);
  drawSlide11List(ctx, SLIDE11_PEOPLE, margin + px, peopleY + px * 3.4, peopleW - px * 2, Math.round(px * 1.0), fg, ">");

  drawSlide11Panel(ctx, projectsX, peopleY, projectsW, contentH, panelBg, fg, 0.68);
  drawSlide11Label(ctx, "PROYECTOS", projectsX + px, peopleY + px * 1.5, fg, px);
  drawSlide11Projects(ctx, projectsX + px, peopleY + px * 3.4, projectsW - px * 2, contentH - px * 4.5, fg, px);

  drawSlide11Panel(ctx, margin, footerY, CANVAS_W - margin * 2, px * 4.8, fg, bg, 0.82);
  ctx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},0.9)`;
  ctx.font = `700 ${Math.round(px * 1.1)}px 'Space Mono', monospace`;
  ctx.fillText("//// CREATIVE CODING / DIGITAL INTERACTION / EXHIBITION ////", margin + px, footerY + px * 1.8);
  ctx.font = `900 ${Math.round(px * 1.7)}px 'Space Mono', monospace`;
  ctx.fillText(SLIDE11_TITLE, margin + px, footerY + px * 3.9);
  ctx.restore();
}

function drawSlide11AsciiHeadline(ctx, lines, x, y, w, h, fg, bg, t) {
  const off = document.createElement("canvas");
  const scale = 0.5;
  off.width = Math.max(1, Math.floor(w * scale));
  off.height = Math.max(1, Math.floor(h * scale));
  const octx = off.getContext("2d");
  octx.clearRect(0, 0, off.width, off.height);
  octx.fillStyle = "white";
  octx.textBaseline = "top";
  octx.textAlign = "left";

  const lineH = off.height / lines.length;
  const fontFamily = "'Space Mono', monospace";
  lines.forEach((line, i) => {
    let fs = lineH * 0.9;
    octx.font = `900 ${fs}px ${fontFamily}`;
    while (fs > 8 && octx.measureText(line).width > off.width * 0.98) {
      fs -= 1;
      octx.font = `900 ${fs}px ${fontFamily}`;
    }
    const yy = i * lineH + (lineH - fs) * 0.08;
    octx.fillText(line, 0, yy);
  });

  const data = octx.getImageData(0, 0, off.width, off.height).data;
  const sample = Math.max(4, Math.floor(off.width / 115));
  const outCell = sample / scale;
  const chars = ["#", "/", "=", "*", "0", "1"];
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `900 ${Math.max(7, Math.round(outCell * 0.95))}px 'Space Mono', monospace`;
  for (let yy = 0; yy < off.height; yy += sample) {
    for (let xx = 0; xx < off.width; xx += sample) {
      const idx = (yy * off.width + xx) * 4 + 3;
      if (data[idx] < 64) continue;
      const flicker = 0.78 + Math.sin(t * 3 + xx * 0.09 + yy * 0.04) * 0.18;
      ctx.fillStyle = `rgba(${fg[0]},${fg[1]},${fg[2]},${Math.max(0.35, flicker).toFixed(2)})`;
      const ch = chars[(xx / sample + yy / sample) % chars.length | 0];
      ctx.fillText(ch, x + xx / scale, y + yy / scale);
    }
  }
}

function drawSlide11Panel(ctx, x, y, w, h, fillRgbValue, strokeRgbValue, alpha = 0.7) {
  fillRgb(ctx, fillRgbValue, alpha);
  ctx.fillRect(x, y, w, h);
  strokeRgb(ctx, strokeRgbValue, 0.58);
  ctx.lineWidth = Math.max(1, CANVAS_W * 0.002);
  ctx.strokeRect(x, y, w, h);
}

function drawSlide11Rule(ctx, x, y, w, color, t) {
  strokeRgb(ctx, color, 0.78);
  ctx.lineWidth = Math.max(1, CANVAS_W * 0.002);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.74)`;
  ctx.font = `700 ${Math.round(CANVAS_W * 0.018)}px 'Space Mono', monospace`;
  const marks = "/ / / / / / / / / / / / / / / / / / / /";
  ctx.fillText(marks.slice(Math.floor(t * 3) % 4), x, y - CANVAS_W * 0.012);
}

function drawSlide11Label(ctx, text, x, y, color, px) {
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.9)`;
  ctx.font = `900 ${Math.round(px * 1.08)}px 'Space Mono', monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`[ ${text} ]`, x, y);
}

function drawSlide11Paragraph(ctx, text, x, y, w, size, color, leading = 1.25) {
  const lines = slide11WrapText(ctx, text, w, `700 ${size}px 'Space Mono', monospace`);
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.9)`;
  ctx.font = `700 ${size}px 'Space Mono', monospace`;
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * size * leading));
}

function drawSlide11List(ctx, items, x, y, w, size, color, prefix = ">") {
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.92)`;
  ctx.font = `700 ${size}px 'Space Mono', monospace`;
  let yy = y;
  for (const item of items) {
    const lines = slide11WrapText(ctx, `${prefix} ${item}`, w, `700 ${size}px 'Space Mono', monospace`);
    for (const line of lines) {
      ctx.fillText(line, x, yy);
      yy += size * 1.22;
    }
    yy += size * 0.22;
  }
}

function drawSlide11Projects(ctx, x, y, w, h, color, px) {
  const colGap = px * 1.4;
  const colW = (w - colGap) / 2;
  const size = Math.round(px * 0.8);
  const left = SLIDE11_PROJECTS.slice(0, Math.ceil(SLIDE11_PROJECTS.length / 2));
  const right = SLIDE11_PROJECTS.slice(left.length);
  drawSlide11ProjectColumn(ctx, left, x, y, colW, h, size, color, "01");
  drawSlide11ProjectColumn(ctx, right, x + colW + colGap, y, colW, h, size, color, "02");
}

function drawSlide11ProjectColumn(ctx, items, x, y, w, h, size, color, label) {
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.86)`;
  ctx.font = `700 ${size}px 'Space Mono', monospace`;
  ctx.fillText(`// ${label}`, x, y);
  let yy = y + size * 1.45;
  items.forEach((item, index) => {
    const lines = slide11WrapText(ctx, `${String(index + 1).padStart(2, "0")} ${item}`, w, `700 ${size}px 'Space Mono', monospace`);
    for (const line of lines) {
      if (yy > y + h - size) return;
      ctx.fillText(line, x, yy);
      yy += size * 1.15;
    }
    yy += size * 0.28;
  });
}

function slide11WrapText(ctx, text, maxWidth, font) {
  ctx.font = font;
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSlide11OrganicVeins(ctx, colorA, colorB, t, px, count, alpha) {
  const step = Math.max(6, px * 0.75);
  for (let i = 0; i < count; i++) {
    const fromLeft = i % 2 === 0;
    let x = fromLeft ? -step * 2 : CANVAS_W + step * 2;
    let y = CANVAS_H * (((i * 0.173 + 0.09) % 0.92) + 0.04);
    const dir = fromLeft ? 1 : -1;
    const length = Math.ceil(CANVAS_W / step) + 10;
    fillRgb(ctx, i % 3 === 0 ? colorB : colorA, alpha + (i % 4) * 0.045);
    for (let k = 0; k < length; k++) {
      const drift =
        Math.sin(k * 0.33 + i * 1.9 + t * 1.4) * step * 1.1 +
        Math.cos(k * 0.11 - t + i) * step * 0.8;
      const yy = y + drift;
      const w = step * (0.7 + ((i + k) % 3) * 0.34);
      const h = Math.max(2, step * (0.18 + ((i + k) % 2) * 0.18));
      ctx.fillRect(Math.round(x), Math.round(yy), Math.round(w), Math.round(h));
      if ((k + i) % 5 === 0) {
        ctx.fillRect(Math.round(x), Math.round(yy + step * 0.8), Math.round(step * 0.45), Math.round(step * 0.45));
      }
      x += dir * step * (0.82 + 0.18 * Math.sin(k * 0.4 + t));
    }
  }
}

function drawSlide11MicroPattern(ctx, x, y, w, h, cell, mode, palette, t) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const n = slide11Hash(c, r, mode * 19 + Math.floor(t * 3));
      const rgb = palette[Math.floor(n * palette.length) % palette.length];
      fillRgb(ctx, rgb, 1);
      const xx = x + c * cell;
      const yy = y + r * cell;
      if (mode === 0) {
        if ((r + c + Math.floor(t)) % 2 === 0) ctx.fillRect(xx, yy, cell, cell);
      } else if (mode === 1) {
        ctx.fillRect(xx, yy, cell * 0.32, cell);
      } else if (mode === 2) {
        if (n > 0.42) ctx.fillRect(xx + cell * 0.25, yy + cell * 0.25, cell * 0.5, cell * 0.5);
      } else {
        ctx.fillRect(xx, yy + cell * 0.4, cell, cell * 0.22);
      }
    }
  }
  ctx.restore();
}

function slide11Hash(x, y, seed = 0) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function mixRgb(a, b, amt) {
  return a.map((v, i) => Math.round(v * (1 - amt) + b[i] * amt));
}

function fillRgb(ctx, rgb, alpha = 1) {
  const a = slide11LightAlpha(rgb, alpha);
  ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

function strokeRgb(ctx, rgb, alpha = 1) {
  const a = slide11LightAlpha(rgb, alpha);
  ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

function slide11LightAlpha(rgb, alpha) {
  const lum = slide11RgbLum(rgb);
  if (lum > 245) return alpha * 0.54;
  if (lum > 225) return alpha * 0.66;
  if (lum > 205) return alpha * 0.82;
  return alpha;
}

function slide11RgbLum(rgb) {
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function drawSlide11Checker(ctx, x, y, w, h, cell, a, b) {
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      fillRgb(ctx, (r + c) % 2 ? a : b, 1);
      ctx.fillRect(x + c * cell, y + r * cell, cell + 0.5, cell + 0.5);
    }
  }
}

function drawSlide11VerticalBars(ctx, x, y, w, h, cell, a, b, t) {
  const cols = Math.ceil(w / cell);
  for (let c = 0; c < cols; c++) {
    const wave = (Math.sin(t * 2 + c * 0.7) + 1) * 0.5;
    const barH = h * (0.45 + wave * 0.55);
    fillRgb(ctx, c % 3 === 0 ? b : a, 1);
    ctx.fillRect(Math.round(x + c * cell), Math.round(y), Math.ceil(cell * 0.62), Math.round(barH));
  }
}

function drawSlide11DotField(ctx, x, y, w, h, cell, color, t) {
  const step = Math.max(5, Math.round(cell * 0.55));
  const r = Math.max(1.2, cell * 0.08);
  fillRgb(ctx, color, 0.96);
  for (let yy = y; yy < y + h; yy += step) {
    for (let xx = x; xx < x + w; xx += step) {
      const n = Math.sin(xx * 0.017 + yy * 0.023 + t * 3);
      if (n > -0.72) {
        ctx.beginPath();
        ctx.arc(xx, yy, r + Math.max(0, n) * r * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawSlide11DiagonalHatch(ctx, x, y, w, h, cell, color, t) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  strokeRgb(ctx, color, 0.92);
  ctx.lineWidth = Math.max(1, cell * 0.08);
  const gap = cell * 0.6;
  const drift = (t * cell * 0.55) % gap;
  for (let i = -h; i < w + h; i += gap) {
    ctx.beginPath();
    ctx.moveTo(x + i + drift, y + h);
    ctx.lineTo(x + i + h + drift, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlide11Waves(ctx, x, y, w, h, cell, color, t) {
  strokeRgb(ctx, color, 0.95);
  ctx.lineWidth = Math.max(1, cell * 0.09);
  const lines = Math.max(5, Math.floor(h / (cell * 0.38)));
  for (let l = 0; l < lines; l++) {
    const yy = y + l * cell * 0.36;
    ctx.beginPath();
    for (let xx = x; xx <= x + w; xx += cell * 0.32) {
      const wave = Math.sin((xx - x) * 0.08 + t * 3 + l * 0.8) * cell * 0.12;
      if (xx === x) ctx.moveTo(xx, yy + wave);
      else ctx.lineTo(xx, yy + wave);
    }
    ctx.stroke();
  }
}

function getActiveSlide9Layout() {
  const layouts = state.slide9?.layouts || [];
  if (!layouts.length) return null;
  const index = Math.max(
    0,
    Math.min(layouts.length - 1, state.slide9.activeLayoutIndex || 0),
  );
  return layouts[index] || null;
}

function captureSlide9BackgroundFrame(p) {
  if (!slide9BackgroundCanvas) {
    slide9BackgroundCanvas = document.createElement("canvas");
  }
  if (
    slide9BackgroundCanvas.width !== CANVAS_W ||
    slide9BackgroundCanvas.height !== CANVAS_H
  ) {
    slide9BackgroundCanvas.width = CANVAS_W;
    slide9BackgroundCanvas.height = CANVAS_H;
  }
  const ctx = slide9BackgroundCanvas.getContext("2d");
  if (ctx) ctx.drawImage(p.canvas, 0, 0, CANVAS_W, CANVAS_H);
}

function scheduleSlide9PreviewFrame() {
  if (slide9PreviewFramePending) return;
  slide9PreviewFramePending = true;
  requestAnimationFrame(() => {
    slide9PreviewFramePending = false;
    renderSlide9PreviewFrames();
  });
}

function renderSlide9PreviewFrames() {
  if (state.posterSlide !== 9 || !slide9BackgroundCanvas) return;
  const strip = document.getElementById("slide9-preview-strip");
  if (!strip || strip.classList.contains("hidden")) return;
  const layouts = state.slide9.layouts || [];
  strip.querySelectorAll("canvas").forEach((canvas, i) => {
    const layout = layouts[i];
    const img = layout?.img || layout?.image;
    const ctx = canvas.getContext("2d");
    if (!ctx || !img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(slide9BackgroundCanvas, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  });
}

function updateSlide9PreviewActiveState() {
  const listEl = document.getElementById("slide9-layout-list");
  if (listEl) {
    listEl.querySelectorAll(".slide9-layout-thumb").forEach((node, index) => {
      node.classList.toggle("active", index === state.slide9.activeLayoutIndex);
    });
  }
  const strip = document.getElementById("slide9-preview-strip");
  if (strip) {
    strip.querySelectorAll(".slide9-preview-frame").forEach((node, index) => {
      node.classList.toggle("active", index === state.slide9.activeLayoutIndex);
    });
  }
}

/* Función auxiliar para dibujar texto con kerning (espaciado entre letras) */
function drawBlockedTextWithKerning(
  ctx,
  text,
  x,
  y,
  size,
  targetWidth,
  weight,
  font,
) {
  ctx.font = `${weight} ${size}px ${font}`;

  // Medimos el ancho de la tipografía sólida (sin espacios extra)
  const measuredWidth = ctx.measureText(text).width;

  if (text.length <= 1) {
    ctx.fillText(text, x, y);
    return;
  }

  // Calculamos el espacio total a llenar y lo dividimos entre los huecos de las letras
  const totalKerningSpace = targetWidth - measuredWidth;
  const kerningPerLetter = totalKerningSpace / (text.length - 1);

  // Empezamos a dibujar desde la izquierda del bloque
  ctx.textAlign = "left";
  let currentX = x - targetWidth / 2;

  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], currentX, y);
    // AvanceX = ancho de la letra + espaciado calculado
    currentX += ctx.measureText(text[i]).width + kerningPerLetter;
  }
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

  const grid = _bannerGridData || BANNER_GRID_PATTERN;
  const cols = grid[0].length;
  const rows = grid.length;
  const cell = CANVAS_H / rows; // square cells
  const skipRows = 3; // bottom rows reserved for logos

  p.push();
  p.noStroke();
  for (let r = 0; r < rows - skipRows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (val === 1) p.fill(fgR, fgG, fgB);
      else p.fill(midR, midG, midB);
      p.rect(BANNER_SPLIT + c * cell, r * cell, cell + 0.5, cell + 0.5);
    }
  }
  p.pop();
}

function drawBannerDecorations(p) {
  const [fR, fG, fB] = hexRgb(state.preset.fg);
  const fontSize = 120;
  const lh = fontSize * state.title.lineHeight * 1.4;
  const stripH = 85;
  const totalH = 3 * lh;
  const startY = Math.max(20, (CANVAS_H - stripH - totalH) / 2);
  const decSize = 75;

  p.push();
  p.noStroke();
  p.drawingContext.font = `700 ${decSize}px '${state.title.font}', monospace`;
  p.drawingContext.letterSpacing = "0px";
  p.drawingContext.textBaseline = "top";
  p.drawingContext.textAlign = "left";
  p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.3)`;

  for (let i = 0; i < 3; i++) {
    p.drawingContext.fillText("/*", 10, startY + i * lh);
  }
  p.pop();
}

function drawBannerLogos(p) {
  const m = state.layout.margin;
  const fg = state.preset.fg;
  const bg = state.preset.bg;

  for (const name of LOGO_ORDER) {
    const c = _logosImgCache[name];
    const stale =
      !c || c.color !== fg || (name === "processingFoundation" && c.bg !== bg);
    if (stale) _buildLogoImg(name, fg);
  }

  const ctx = p.drawingContext;
  const grid = _bannerGridData || BANNER_GRID_PATTERN;
  const cellH = CANVAS_H / grid.length;
  const stripH = 3 * cellH;
  const y0 = CANVAS_H - stripH;
  const pad = 16;
  const logoH = stripH * 0.6;
  const xStart = BANNER_SPLIT;
  const availW = CANVAS_W - xStart - m - pad;

  const LOGO_SCALE = {
    "faad_lockup-principal": 0.8,
    LID: 0.8,
    crtic: 1.0,
    processingFoundation: 1.0,
  };

  const logoData = LOGO_ORDER.map((name) => {
    const c = _logosImgCache[name];
    if (!c || !c.img.complete || c.img.naturalWidth === 0)
      return { w: 0, h: 0, yOff: 0 };
    const scale = LOGO_SCALE[name] ?? 1.0;
    const h = logoH * scale;
    const w = h * (c.img.naturalWidth / c.img.naturalHeight);
    const yOff = (logoH - h) / 2;
    return { w, h, yOff };
  });

  const totalLogosW = logoData.reduce((a, d) => a + d.w, 0);
  const gap = Math.max(pad, (availW - totalLogosW) / (LOGO_ORDER.length - 1));

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
  const m = state.layout.margin;
  const fontSize = 115;
  const lh = fontSize * state.title.lineHeight * 1.4;
  const stripH = 85;
  const totalH = 3 * lh;
  const startY = Math.max(20, (CANVAS_H - stripH - totalH) / 2);
  const x = 110;
  const lines = ["Processing", "Community", "Day \u2014 2026"];

  p.noStroke();
  p.drawingContext.font = `700 ${fontSize}px '${state.title.font}', monospace`;
  p.drawingContext.letterSpacing = "0px";
  p.drawingContext.textBaseline = "top";
  p.drawingContext.textAlign = "left";
  p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},1)`;

  for (let i = 0; i < lines.length; i++) {
    p.drawingContext.fillText(lines[i], x, startY + i * lh);
  }
  p.drawingContext.letterSpacing = "0px";
}

/* =====================================================
   FORMATO — Cambio IG ↔ A5 ↔ Banner
   ===================================================== */
function switchFormat(fmt) {
  if (fmt === state.format) return;
  state.format = fmt;
  const w =
    fmt === "banner"
      ? BANNER_W
      : fmt === "a5"
        ? A5_W
        : fmt === "slide11"
          ? SLIDE11_W
          : fmt === "slide12"
            ? SLIDE12_W
          : IG_W;
  const h =
    fmt === "banner"
      ? BANNER_H
      : fmt === "a5"
        ? A5_H
        : fmt === "slide11"
          ? SLIDE11_H
          : fmt === "slide12"
            ? SLIDE12_H
          : IG_H;
  setCanvasSize(w, h);
  if (p5Instance) p5Instance.resizeCanvas(w, h);
  state.meta.topLeft = `${w}×${h}`;
  const resBadge = document.getElementById("res-badge");
  if (resBadge) resBadge.textContent = `${w} × ${h} px`;
  resizeCanvasWrapper();
  if (currentAnimation) currentAnimation.reset();
}

function drawGrid(p) {
  const { cols, rows, weight } = state.grid;
  const gx = 0;
  const gy = 0;
  const gw = CANVAS_W;
  const gh = CANVAS_H;
  const opa = state.preset.gridOpacity;
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
  p.drawingContext.font = `400 11px 'Necto Mono', monospace`;
  p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.6)`;
  p.drawingContext.textBaseline = "middle";
  p.drawingContext.textAlign = "left";
  p.drawingContext.fillText(state.meta.topLeft, m, h / 2);
  p.drawingContext.textAlign = "right";
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
  p.drawingContext.font = `400 11px 'Necto Mono', monospace`;
  p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},0.6)`;
  p.drawingContext.textBaseline = "middle";
  p.drawingContext.textAlign = "left";
  p.drawingContext.fillText(state.meta.bottomLeft, m, y + h / 2);
  p.drawingContext.textAlign = "right";
  p.drawingContext.fillText(state.meta.bottomRight, CANVAS_W - m, y + h / 2);
  p.pop();
}

function drawTitle(p) {
  const { font, size, weight, lineHeight, alignH } = state.title;
  const b = state.layout.blocks.title;
  const cell = getCellRect(b.colStart, b.rowStart, b.colSpan, b.rowSpan);
  const [fR, fG, fB] = hexRgb(state.preset.fg);

  drawBlockInCell(p, cell, () => {
    const weightNum =
      weight === "black" ? "900" : weight === "bold" ? "700" : "400";
    const fontStr = `${weightNum} ${size}px '${font}', monospace`;
    const lh = size * lineHeight * 1.2;
    const totalH = TITLE_LINES.length * lh;
    const x = cell.x + 8;
    const maxW = cell.w - 16;

    p.noStroke();
    p.drawingContext.font = fontStr;
    p.drawingContext.letterSpacing = "0px";
    p.drawingContext.textBaseline = "top";
    p.drawingContext.textAlign = "left";

    const startY = cell.y + Math.max(8, (cell.h - totalH) / 2) - 10;

    for (let i = 0; i < TITLE_LINES.length; i++) {
      const line = TITLE_LINES[i];
      const lineY = startY + i * lh;

      if (line.startsWith("/*")) {
        const prefix = "/*";
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
  const size = 30;
  const lh = size * state.infoBlock.lineHeight;
  const mx = state.layout.marginX;
  const my = state.layout.marginY;
  const indent = mx + size * 1.2;
  const valW = CANVAS_W - indent - mx;
  const [fR, fG, fB] = hexRgb(state.preset.fg);

  const topLines = INFO_LINES.slice(0, 4); // Evento → Descripción
  const bottomLines = INFO_LINES.slice(4); // Llamado a → fechas

  const ctx = p.drawingContext;
  p.noStroke();
  ctx.save();
  ctx.letterSpacing = "0px";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = `rgba(${fR},${fG},${fB},1.0)`;

  // Calcula el alto en px que ocupa un array de líneas INFO_LINES
  function blockHeight(lines) {
    let h = 0;
    for (const line of lines) {
      const colon = line.indexOf(":");
      if (colon > -1) {
        const key = '"' + line.slice(0, colon).trim() + '": ';
        ctx.font = `700 ${size}px 'Necto Mono', monospace`;
        const keyW = ctx.measureText(key).width;
        ctx.font = `normal ${size}px 'Necto Mono', monospace`;
        h +=
          lh *
          wrapText(p, '"' + line.slice(colon + 1).trim() + '"', valW - keyW)
            .length;
      } else {
        ctx.font = `normal ${size}px 'Necto Mono', monospace`;
        h += lh * wrapText(p, '"' + line + '"', valW).length;
      }
    }
    return h;
  }

  // Dibuja un array de líneas INFO_LINES con keys en bold; retorna el y final
  function drawLines(lines, startY, isLastGroup) {
    let y = startY;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const colon = line.indexOf(":");
      const isLast = isLastGroup && i === lines.length - 1;
      if (colon > -1) {
        const key = '"' + line.slice(0, colon).trim() + '": ';
        const val =
          '"' + line.slice(colon + 1).trim() + '"' + (isLast ? "" : ",");
        ctx.font = `700 ${size}px 'Necto Mono', monospace`;
        const keyW = ctx.measureText(key).width;
        ctx.fillText(key, indent, y);
        ctx.font = `normal ${size}px 'Necto Mono', monospace`;
        const wrapped = wrapText(p, val, valW - keyW);
        ctx.fillText(wrapped[0], indent + keyW, y);
        y += lh;
        for (let li = 1; li < wrapped.length; li++) {
          ctx.fillText(wrapped[li], indent + keyW, y);
          y += lh;
        }
      } else {
        ctx.font = `normal ${size}px 'Necto Mono', monospace`;
        const val = '"' + line + '"' + (isLast ? "" : ",");
        const wrapped = wrapText(p, val, valW);
        for (const wl of wrapped) {
          ctx.fillText(wl, indent, y);
          y += lh;
        }
      }
    }
    return y;
  }

  // ── Bloque superior ──
  ctx.font = `normal ${size}px 'Necto Mono', monospace`;
  let y = my + size;
  ctx.fillText("{", mx, y);
  y += lh;
  const topEndY = drawLines(topLines, y, false);

  // ── Bloque inferior — anclado desde arriba del logo ──
  const logoTop = state.showExtraLogos ? CANVAS_H - 10 - 90 : CANVAS_H - my;
  const botH = blockHeight(bottomLines) + lh; // líneas + llave de cierre
  const bottomY = logoTop - botH - 24;

  // ── Píxeles animados en el espacio entre bloques ──
  drawSlide2Pixels(p, topEndY + 12, bottomY - 80);

  // ── Dibujar bloque inferior ──
  ctx.fillStyle = `rgba(${fR},${fG},${fB},1.0)`;
  const afterY = drawLines(bottomLines, bottomY, true);
  ctx.font = `normal ${size}px 'Necto Mono', monospace`;
  ctx.fillText("}", mx, afterY);

  ctx.restore();

  if (state.showExtraLogos) {
    const logoH = 90;
    const logoName = "faad_lockup-principal";
    const fg = state.preset.fg;
    const lc = _logosImgCache[logoName];
    if (!lc || lc.color !== fg) _buildLogoImg(logoName, fg);
    const c = _logosImgCache[logoName];
    if (c && c.img.complete && c.img.naturalWidth > 0) {
      const w = logoH * (c.img.naturalWidth / c.img.naturalHeight);
      p.drawingContext.drawImage(c.img, 40, CANVAS_H - 10 - logoH, w, logoH);
    }
  }
}

function drawSlide2Pixels(p, areaStartY, areaEndY, opacityScale = 1) {
  const areaX = 0;
  const areaW = CANVAS_W;
  const areaH = areaEndY - areaStartY;
  if (areaH < 20) return;

  const pixSize = 40;
  const pCols = Math.floor(areaW / pixSize);
  const pRows = Math.floor(areaH / pixSize);
  if (pCols < 1 || pRows < 1) return;

  const t = p5Instance.frameCount * 0.018;
  const [fR, fG, fB] = hexRgb(state.preset.fg);
  const opa = Math.min(
    1,
    (state.preset.gridOpacity / 100) * 2.2 * opacityScale,
  );

  p.drawingContext.save();
  for (let row = 0; row < pRows; row++) {
    for (let col = 0; col < pCols; col++) {
      const n = p.noise(col * 0.22, row * 0.22, t);
      if (n > 0.48) {
        const alpha = ((n - 0.48) / 0.52) * opa;
        p.drawingContext.fillStyle = `rgba(${fR},${fG},${fB},${alpha.toFixed(3)})`;
        p.drawingContext.fillRect(
          areaX + col * pixSize,
          areaStartY + row * pixSize,
          pixSize - 2,
          pixSize - 2,
        );
      }
    }
  }
  p.drawingContext.restore();
}

function wrapText(p, text, maxWidth) {
  if (maxWidth <= 0) return [text];
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
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
  const area = document.getElementById("canvas-area");
  const wrapper = document.getElementById("canvas-wrapper");
  if (!area || !wrapper) return;
  const aw = area.clientWidth - 48;
  const ah = area.clientHeight - 48;
  const asp = CANVAS_W / CANVAS_H;
  let w, h;
  if (aw / ah > asp) {
    h = ah;
    w = h * asp;
  } else {
    w = aw;
    h = w / asp;
  }
  wrapper.style.width = w + "px";
  wrapper.style.height = h + "px";
}

/* =====================================================
   HELPERS
   ===================================================== */
function hexRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function showToast(msg, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* =====================================================
   WCAG 2.1 — CÁLCULO DE CONTRASTE
   ===================================================== */
function hexToRgbNorm(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

function relativeLuminance({ r, g, b }) {
  const toLinear = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1, hex2) {
  const L1 = relativeLuminance(hexToRgbNorm(hex1));
  const L2 = relativeLuminance(hexToRgbNorm(hex2));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function meetsAA(hex1, hex2) {
  return contrastRatio(hex1, hex2) >= 4.5;
}

function hexToHsl(hex) {
  let { r, g, b } = hexToRgbNorm(hex);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }) {
  h /= 360;
  s /= 100;
  l /= 100;
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
  const toHex = (x) =>
    Math.round(Math.max(0, Math.min(255, x * 255)))
      .toString(16)
      .padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function adjustColorForContrast(targetColor, fixedColor, minRatio = 4.5) {
  const fixedLum = relativeLuminance(hexToRgbNorm(fixedColor));
  const shouldBeDark = fixedLum > 0.5;
  const hsl = hexToHsl(targetColor);
  const step = shouldBeDark ? -1 : 1;
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
  const ratio = contrastRatio(state.preset.bg, state.preset.fg);
  const pass = ratio >= 4.5;
  const ratioStr = ratio.toFixed(1) + ":1";

  const ratioEl = document.getElementById("contrast-ratio-val");
  const badgeEl = document.getElementById("contrast-badge");
  if (ratioEl) ratioEl.textContent = ratioStr;
  if (badgeEl) {
    badgeEl.textContent = pass ? "✓ AA" : "✗ AA";
    badgeEl.className = "contrast-badge " + (pass ? "pass" : "fail");
  }

  const tbEl = document.getElementById("toolbar-contrast");
  if (tbEl) {
    tbEl.textContent = "[AA " + (pass ? "✓" : "✗") + "] " + ratioStr;
    tbEl.className = "toolbar-contrast " + (pass ? "pass" : "fail");
  }
}

function buildWcagSwatches() {
  const container = document.getElementById("wcag-swatches");
  if (!container) return;
  container.innerHTML = "";
  const palettes =
    [10, 11, 12].includes(state.posterSlide)
      ? SLIDE10_PALETTES_DEF
      : WCAG_PALETTES;
  palettes.forEach((palette) => {
    const btn = document.createElement("button");
    btn.className = "wcag-swatch";
    btn.style.setProperty("--ws-bg", palette.bg);
    btn.style.setProperty("--ws-fg", palette.fg);
    btn.title = `${palette.name} — ${contrastRatio(palette.bg, palette.fg).toFixed(1)}:1`;
    btn.textContent = "Aa";
    btn.addEventListener("click", () => applyWcagPalette(palette));
    container.appendChild(btn);
  });
}

function applyWcagPalette(palette) {
  state.preset.bg = palette.bg;
  state.preset.fg = palette.fg;
  state.preset.animColor = palette.fg; // animaciones usan el fg de la paleta
  lastValidBg = palette.bg;
  lastValidFg = palette.fg;
  const posterBg = document.getElementById("poster-bg");
  const posterFg = document.getElementById("poster-fg");
  const bgPicker = document.getElementById("bg-color");
  const animPicker = document.getElementById("bubble-bg-color");
  if (posterBg) posterBg.value = palette.bg;
  if (posterFg) posterFg.value = palette.fg;
  if (bgPicker) bgPicker.value = palette.bg;
  if (animPicker) animPicker.value = palette.fg;
  updateContrastUI();
  if (
    ["flow-field", "code-rain", "glyph-flow-field"].includes(
      state.anim.current,
    ) &&
    currentAnimation
  ) {
    currentAnimation.reset();
  }
  resetSlide4AnimationInstance();
  if (slide10HeroAnimation) slide10HeroAnimation.reset();
}

function flashPicker(el) {
  el.classList.add("picker-error-flash");
  setTimeout(() => el.classList.remove("picker-error-flash"), 400);
}

function showContrastError(ratio) {
  const el = document.getElementById("contrast-error");
  if (!el) return;
  el.textContent = `Contraste insuficiente: ${ratio.toFixed(1)}:1. Mínimo requerido: 4.5:1`;
  el.classList.remove("hidden");
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.add("hidden"), 3500);
}

function hideContrastError() {
  const el = document.getElementById("contrast-error");
  if (el) {
    clearTimeout(el._hideTimer);
    el.classList.add("hidden");
  }
}

function setControlValue(id, value) {
  const control = document.getElementById(id);
  if (control && value !== undefined && value !== null) control.value = value;
}

function setControlChecked(id, checked) {
  const control = document.getElementById(id);
  if (control) control.checked = !!checked;
}

function setLabelText(id, text) {
  const label = document.getElementById(id);
  if (label) label.textContent = text;
}

function syncControlsFromState() {
  setControlValue("format-select", state.format);
  setControlValue("poster-slide-select", String(state.posterSlide));
  setControlChecked("extra-logos-toggle", state.showExtraLogos);
  setControlChecked("convocatoria-tag-toggle", state.showConvocatoriaTag);

  setControlValue("poster-bg", state.preset.bg);
  setControlValue("poster-fg", state.preset.fg);
  setControlValue("fg-color", state.preset.bubbleFg || state.preset.fg);
  setControlValue("bubble-bg-color", state.preset.animColor);
  setControlValue("bg-color", state.preset.bg);
  setControlValue("anim-opacity", state.anim.opacity);
  setLabelText("anim-opacity-val", state.anim.opacity);
  setControlValue("grid-opacity", state.preset.gridOpacity);
  setLabelText("grid-opacity-val", state.preset.gridOpacity);

  const mode = getPosterAnimMode();
  rebuildAnimSelect(mode);
  setControlValue(
    "anim-select",
    mode === "slide45"
      ? state.anim.slide4Anim
      : mode === "slide10"
        ? state.anim.slide10BgAnim
        : mode === "slide11"
          ? state.anim.slide11Anim
          : mode === "slide9"
            ? state.anim.slide9Anim
          : mode === "slide7"
            ? state.anim.slide7Anim
            : state.anim.current,
  );
  setControlValue("anim-blend", state.anim.blendMode);
  setControlValue("anim-speed", state.anim.speed);
  setLabelText("anim-speed-val", Number(state.anim.speed).toFixed(1));
  setControlValue("anim-text-size", state.anim.textSize);
  setLabelText("anim-text-size-val", state.anim.textSize);
  setControlValue("slide4-leading", state.anim.slide4Leading);
  setLabelText("slide4-leading-val", state.anim.slide4Leading);
  setControlValue("slide4-pixel-mode", state.anim.slide4PixelMode);
  setControlValue("anim-seed", state.anim.seed);
  setControlValue("anim-font", state.anim.font);

  setControlValue("margin-val", state.layout.margin);
  setLabelText("margin-disp", state.layout.margin);
  setControlChecked("grid-show", state.grid.show);
  setControlValue("grid-cols", state.grid.cols);
  setLabelText("grid-cols-val", state.grid.cols);
  setControlValue("grid-rows", state.grid.rows);
  setLabelText("grid-rows-val", state.grid.rows);
  setControlValue("grid-weight", state.grid.weight);
  setLabelText("grid-weight-val", Number(state.grid.weight).toFixed(1));
  setControlChecked("guides-toggle", state.showGuides);

  setControlValue("slide7-fecha-vieja", state.slide7.fechaVieja);
  setControlValue("slide7-fecha-nueva", state.slide7.fechaNueva);
  setControlValue("slide7-mes", state.slide7.mes);
  setControlValue("slide7-hold-old", state.slide7.holdOld);
  setLabelText("slide7-hold-old-val", state.slide7.holdOld);
  setControlValue("slide7-flip-dur", state.slide7.flipDur);
  setLabelText("slide7-flip-dur-val", state.slide7.flipDur);

  setControlValue("slide8-finaliza-size", state.slide8.finalizaSize);
  setLabelText("slide8-finaliza-size-val", state.slide8.finalizaSize);
  setControlValue("slide8-convocatoria-size", state.slide8.convocatoriaSize);
  setLabelText("slide8-convocatoria-size-val", state.slide8.convocatoriaSize);
  setControlValue("slide8-abierta-size", state.slide8.abiertaSize);
  setLabelText("slide8-abierta-size-val", state.slide8.abiertaSize);
  setControlValue("slide8-pcd-size", state.slide8.pcdSize);
  setLabelText("slide8-pcd-size-val", state.slide8.pcdSize);
  setControlValue("slide8-leading", state.slide8.leading);
  setLabelText("slide8-leading-val", state.slide8.leading);
  setControlValue("slide8-boldness", state.slide8.boldness);
  setLabelText("slide8-boldness-val", state.slide8.boldness);

  const playBtn = document.getElementById("btn-play-pause");
  if (playBtn) playBtn.classList.toggle("active", state.playing);
  const playLabel = document.getElementById("play-label");
  if (playLabel) playLabel.textContent = state.playing ? "Pause" : "Play";
  const guidesBtn = document.getElementById("btn-guides");
  if (guidesBtn) guidesBtn.classList.toggle("active", state.showGuides);
  const s7EditorialBtn = document.getElementById("btn-toggle-s7-editorial");
  if (s7EditorialBtn) {
    s7EditorialBtn.textContent = state.slide7.hideEditorial
      ? "Mostrar Textos"
      : "Ocultar Textos";
    s7EditorialBtn.classList.toggle("active", state.slide7.hideEditorial);
  }

  updateContrastUI();
  updateSlide3BackgroundControls();
  updateSlide8TypographyControls();
  updateSlide9LayoutControls();
  updateSlide10Controls();
}

function updateSlide10Controls() {
  const isSlide10 = state.posterSlide === 10;
  const isSlide11 = state.posterSlide === 11;
  const isSlide12 = state.posterSlide === 12;
  const isFixedHeroFormat = isSlide10 || isSlide11 || isSlide12;
  const usesHeroPalettes = isSlide10 || isSlide11 || isSlide12;
  const formatSelect = document.getElementById("format-select");
  if (formatSelect) {
    if (isSlide10) formatSelect.value = "a5";
    if (isSlide11) formatSelect.value = "slide11";
    if (isSlide12) formatSelect.value = "slide12";
    formatSelect.disabled = isFixedHeroFormat;
    formatSelect.title = isSlide10
      ? "El slide 10 usa formato A5 fijo"
      : isSlide11
        ? "El slide 11 usa formato 100×170 cm fijo"
        : isSlide12
          ? "El slide 12 usa formato horizontal 1920×1080 fijo"
        : "";
  }

  const extraLogos = document.getElementById("extra-logos-controls");
  if (extraLogos) {
    extraLogos.style.display =
      state.format === "banner" || isFixedHeroFormat ? "none" : "";
  }

  const convocatoriaControls = document.getElementById("convocatoria-tag-controls");
  if (convocatoriaControls) {
    convocatoriaControls.style.display =
      state.format === "banner" || isFixedHeroFormat ? "none" : "";
  }

  const paletteLabel = document.getElementById("palette-section-label");
  if (paletteLabel) {
    paletteLabel.textContent = usesHeroPalettes
      ? "Paletas fluor e invertidas"
      : "Paletas accesibles (WCAG AA)";
  }

  const animationLabel = document.getElementById("animation-section-label");
  if (animationLabel) {
    animationLabel.textContent = isSlide10
      ? "Animación de fondo"
      : isSlide11
        ? "Animación pixel"
        : isSlide12
          ? "Animación pixel"
      : "Animación";
  }

  const heroControls = document.getElementById("slide10-hero-controls");
  if (heroControls) heroControls.style.display = isSlide10 ? "" : "none";

  const heroBtn = document.getElementById("btn-toggle-slide10-hero");
  if (heroBtn) {
    heroBtn.textContent = state.slide10.showHero
      ? "Ocultar Processing Community Day"
      : "Mostrar Processing Community Day";
    heroBtn.classList.toggle("active", !state.slide10.showHero);
  }
}

/* =====================================================
   PRESETS DE COLOR
   ===================================================== */
function buildColorSwatches() {
  const container = document.getElementById("color-swatches");
  if (!container) return;
  container.innerHTML = "";
  COLOR_PRESETS.forEach((preset) => {
    const btn = document.createElement("button");
    btn.className =
      "swatch-btn" + (preset.id === state.preset.activeId ? " active" : "");
    btn.dataset.preset = preset.id;
    btn.style.setProperty("--sb-bg", preset.bg);
    btn.style.setProperty("--sb-fg", preset.fg);
    btn.textContent = preset.label;
    btn.title = preset.id;
    btn.addEventListener("click", () => applyColorPreset(preset.id));
    container.appendChild(btn);
  });
}

function applyColorPreset(id) {
  const preset = COLOR_PRESETS.find((p) => p.id === id);
  if (!preset) return;
  state.preset.bg = preset.bg;
  state.preset.fg = preset.fg;
  state.preset.animColor = preset.anim;
  state.preset.activeId = id;
  document.querySelectorAll(".swatch-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.preset === id);
  });
  // Sync color pickers con el preset
  state.preset.bubbleFg = preset.fg;
  const fgPicker = document.getElementById("fg-color");
  const animPicker = document.getElementById("bubble-bg-color");
  const bgPicker = document.getElementById("bg-color");
  if (fgPicker) fgPicker.value = preset.fg;
  if (animPicker) animPicker.value = preset.anim;
  if (bgPicker) bgPicker.value = preset.bg;
  // Sync WCAG pickers
  const posterBg = document.getElementById("poster-bg");
  const posterFg = document.getElementById("poster-fg");
  if (posterBg) posterBg.value = preset.bg;
  if (posterFg) posterFg.value = preset.fg;
  lastValidBg = preset.bg;
  lastValidFg = preset.fg;
  updateContrastUI();
  // Reset buffer-based animations so they repaint with new bg color
  if (
    ["flow-field", "code-rain", "glyph-flow-field"].includes(
      state.anim.current,
    ) &&
    currentAnimation
  ) {
    currentAnimation.reset();
  }
}

/* =====================================================
   SELECTOR DE ANIMACIONES DINÁMICO
   ===================================================== */
// mode: 'slide45' | 'slide10' | 'slide11' | 'slide9' | 'slide7' | 'poster'
function rebuildAnimSelect(mode) {
  const select = document.getElementById("anim-select");
  if (!select) return;
  const isFullCanvas = mode !== "poster";
  const leadRow = document.getElementById("slide4-leading-row");
  if (leadRow) leadRow.style.display = mode === "slide45" ? "" : "none";
  const curAnimVal =
    mode === "slide45"
      ? state.anim.slide4Anim
      : mode === "slide10"
        ? state.anim.slide10BgAnim
        : mode === "slide11"
          ? state.anim.slide11Anim
        : mode === "slide9"
          ? state.anim.slide9Anim
          : mode === "slide7"
            ? state.anim.slide7Anim
            : null;
  const pixelRow = document.getElementById("slide4-pixel-mode-row");
  if (pixelRow)
    pixelRow.style.display =
      isFullCanvas && curAnimVal === "pixel-explosion" ? "" : "none";
  updateSlide8TypographyControls();
  const options =
    mode === "slide11"
      ? ANIM_OPTIONS_SLIDE11
      : mode === "slide10"
      ? ANIM_OPTIONS_SLIDE4
      : isFullCanvas
        ? ANIM_OPTIONS_SLIDE4
        : ANIM_OPTIONS_POSTER;
  const currentValue =
    mode === "slide45"
      ? state.anim.slide4Anim
      : mode === "slide10"
        ? state.anim.slide10BgAnim
        : mode === "slide11"
          ? state.anim.slide11Anim
        : mode === "slide9"
          ? state.anim.slide9Anim
          : mode === "slide7"
            ? state.anim.slide7Anim
            : state.anim.current;
  select.innerHTML = "";
  for (const opt of options) {
    const el = document.createElement("option");
    el.value = opt.value;
    el.textContent = opt.label;
    if (opt.value === currentValue) el.selected = true;
    select.appendChild(el);
  }
  if (!options.some((o) => o.value === currentValue)) {
    select.value = options[0].value;
    if (mode === "slide45") {
      state.anim.slide4Anim = options[0].value;
      initSlide4Animation();
    } else if (mode === "slide10") {
      state.anim.slide10BgAnim = options[0].value;
      initSlide4Animation();
    } else if (mode === "slide11") {
      state.anim.slide11Anim = options[0].value;
    } else if (mode === "slide9") {
      state.anim.slide9Anim = options[0].value;
      initSlide4Animation();
    } else if (mode === "slide7") {
      state.anim.slide7Anim = options[0].value;
      initSlide4Animation();
    } else {
      switchAnimation(options[0].value);
    }
  }
}

function updateSlide8TypographyControls() {
  const controls = document.getElementById("slide8-typography-controls");
  if (controls)
    controls.style.display = state.posterSlide === 8 ? "" : "none";

  const btn = document.getElementById("btn-toggle-slide8-split");
  if (btn) {
    btn.textContent = state.slide8.splitConvocatoria
      ? "Unir convocatoria"
      : "Dividir convocatoria";
    btn.classList.toggle("active", state.slide8.splitConvocatoria);
  }
}

function updateSlide3BackgroundControls() {
  const controls = document.getElementById("slide3-bg-controls");
  if (controls) {
    controls.style.display =
      state.format !== "banner" && state.posterSlide === 3 ? "" : "none";
  }

  const btn = document.getElementById("btn-toggle-slide3-slide9-bg");
  if (btn) {
    btn.classList.toggle("active", state.slide3Slide9Bg);
    btn.textContent = state.slide3Slide9Bg
      ? "Fondo slide 9 activo"
      : "Activar fondo slide 9";
  }
}

function updateSlide9LayoutControls() {
  const controls = document.getElementById("slide9-layout-controls");
  if (controls)
    controls.style.display = state.posterSlide === 9 ? "" : "none";

  syncSlide9LegacyLayout();
  const layouts = getSlide9Layouts();
  const count = layouts.length;
  const previewKey = layouts.map((item) => item.url || item.name).join("|");
  const nameEl = document.getElementById("slide9-layout-name");
  if (nameEl) {
    nameEl.textContent =
      count === 0
        ? "Sin archivo"
        : count === 1
          ? layouts[0].name
          : `${count} layouts PNG cargados`;
  }

  const listEl = document.getElementById("slide9-layout-list");
  if (listEl && previewKey !== slide9PreviewKey) {
    listEl.innerHTML = "";
    layouts.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slide9-layout-thumb";
      btn.classList.toggle("active", index === state.slide9.activeLayoutIndex);
      btn.title = item.name;
      btn.addEventListener("click", () => {
        setActiveSlide9Layout(index);
        updateSlide9LayoutControls();
      });

      const img = document.createElement("img");
      img.src = item.url;
      img.alt = item.name;
      btn.appendChild(img);

      const label = document.createElement("span");
      label.textContent = `${index + 1}`;
      btn.appendChild(label);
      listEl.appendChild(btn);
    });
  }

  const strip = document.getElementById("slide9-preview-strip");
  if (strip) {
    strip.classList.toggle("hidden", state.posterSlide !== 9 || count <= 1);
    if (previewKey !== slide9PreviewKey) {
      strip.innerHTML = "";
      layouts.forEach((item, index) => {
        const frame = document.createElement("button");
        frame.type = "button";
        frame.className = "slide9-preview-frame";
        frame.classList.toggle(
          "active",
          index === state.slide9.activeLayoutIndex,
        );
        frame.title = item.name;
        frame.addEventListener("click", () => {
          setActiveSlide9Layout(index);
          updateSlide9LayoutControls();
        });

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(CANVAS_W / 4);
        canvas.height = Math.round(CANVAS_H / 4);
        frame.appendChild(canvas);

        const label = document.createElement("span");
        label.textContent = `${index + 1}`;
        frame.appendChild(label);
        strip.appendChild(frame);
      });
    }
    renderSlide9PreviewFrames();
  }
  slide9PreviewKey = previewKey;
  updateSlide9PreviewActiveState();

  const paletteBtn = document.getElementById("btn-toggle-slide9-palette-bg");
  if (paletteBtn) {
    paletteBtn.classList.toggle("active", state.slide9.tintAnimations);
    paletteBtn.textContent = state.slide9.tintAnimations
      ? "Colores de paleta activos"
      : "Usar colores de paleta";
  }

  updateSlide9ExportLabels();
}

function clearSlide9Layout() {
  getSlide9Layouts().forEach((item) => {
    if (item.url) URL.revokeObjectURL(item.url);
  });
  clearStoredSlide9LayoutFiles();
  state.slide9.layoutImage = null;
  state.slide9.layoutUrl = null;
  state.slide9.layoutName = "";
  state.slide9.layouts = [];
  state.slide9.activeLayoutIndex = 0;
  slide9PreviewKey = "";
  const listEl = document.getElementById("slide9-layout-list");
  if (listEl) listEl.innerHTML = "";
  const strip = document.getElementById("slide9-preview-strip");
  if (strip) {
    strip.innerHTML = "";
    strip.classList.add("hidden");
  }
  const input = document.getElementById("slide9-layout-file");
  if (input) input.value = "";
  updateSlide9LayoutControls();
}

function getSlide9Layouts() {
  const layouts = Array.isArray(state.slide9.layouts)
    ? state.slide9.layouts
    : [];
  if (layouts.length) return layouts;
  if (state.slide9.layoutImage) {
    return [
      {
        img: state.slide9.layoutImage,
        url: state.slide9.layoutUrl,
        name: state.slide9.layoutName || "layout.png",
      },
    ];
  }
  return [];
}

function syncSlide9LegacyLayout() {
  const layouts = getSlide9Layouts();
  const index = Math.min(
    Math.max(0, state.slide9.activeLayoutIndex || 0),
    Math.max(0, layouts.length - 1),
  );
  state.slide9.activeLayoutIndex = index;
  const active = layouts[index];
  state.slide9.layoutImage = active?.img || active?.image || null;
  state.slide9.layoutUrl = active?.url || null;
  state.slide9.layoutName = active?.name || "";
}

function setActiveSlide9Layout(index) {
  const layouts = getSlide9Layouts();
  if (!layouts.length) return;
  state.slide9.activeLayoutIndex = Math.min(
    Math.max(0, index),
    layouts.length - 1,
  );
  syncSlide9LegacyLayout();
}

function updateSlide9ExportLabels() {
  const count =
    state.posterSlide === 9 && getSlide9Layouts().length > 1
      ? getSlide9Layouts().length
      : 0;
  const pngLabel = count ? `PNG — ${count} slides` : "PNG — frame actual";
  const videoLabel = count ? `Video — ${count} videos` : "Video — 10 segundos";
  const sidebarPng = document.getElementById("btn-export-png-sidebar");
  const sidebarVideo = document.getElementById("btn-export-mp4-sidebar");
  const toolbarPng = document.getElementById("btn-export-png");
  const toolbarVideo = document.getElementById("btn-export-mp4");
  if (sidebarPng) sidebarPng.textContent = pngLabel;
  if (sidebarVideo) sidebarVideo.textContent = videoLabel;
  if (toolbarPng) toolbarPng.textContent = count ? `PNG x${count}` : "PNG";
  if (toolbarVideo)
    toolbarVideo.textContent = count ? `MP4 x${count}` : "MP4 10s";
}

function loadSlide9Layouts(files) {
  const inputFiles = Array.from(files || []);
  if (!inputFiles.length) return;
  const pngFiles = inputFiles.filter(
    (file) =>
      file.type === "image/png" || file.name.toLowerCase().endsWith(".png"),
  );
  if (!pngFiles.length) {
    showToast("Sube archivos PNG", "error");
    return;
  }
  if (pngFiles.length !== inputFiles.length) {
    showToast("Se omitieron archivos que no eran PNG", "error");
  }

  Promise.all(
    pngFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => resolve({ img, url, name: file.name });
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(file.name));
          };
          img.src = url;
        }),
    ),
  )
    .then((layouts) => {
      getSlide9Layouts().forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
      state.slide9.layouts = layouts;
      state.slide9.activeLayoutIndex = 0;
      syncSlide9LegacyLayout();
      saveSlide9LayoutFiles(pngFiles);
      schedulePersistentStateSave();
      updateSlide9LayoutControls();
      showToast(
        layouts.length === 1
          ? "Layout PNG cargado"
          : `${layouts.length} layouts PNG cargados`,
        "success",
      );
    })
    .catch(() => {
      showToast("No se pudo cargar uno de los PNG", "error");
    });
}

function resetSlide8AnimationMask() {
  if (!slide4Animation) return;
  slide4Animation._slide8GridReady = false;
  slide4Animation._slide8TextKey = null;
  resetSlide4AnimationInstance();
}

/* =====================================================
   BINDINGS
   ===================================================== */
function bindControls() {
  const el = (id) => document.getElementById(id);
  const onInput = (id, fn) => {
    const e = el(id);
    if (e) e.addEventListener("input", fn);
  };
  const onChange = (id, fn) => {
    const e = el(id);
    if (e) e.addEventListener("change", fn);
  };
  const onCheck = (id, fn) => {
    const e = el(id);
    if (e) e.addEventListener("change", fn);
  };
  const onClick = (id, fn) => {
    const e = el(id);
    if (e) e.addEventListener("click", fn);
  };

  const slider = (id, dispId, fn, mult = 1, dec = 0) => {
    const s = el(id),
      d = el(dispId);
    if (!s) return;
    s.addEventListener("input", () => {
      const v = parseFloat(s.value) * mult;
      if (d) d.textContent = dec > 0 ? v.toFixed(dec) : v;
      fn(v);
    });
  };

  // ——— Formato ———
  onChange("format-select", (e) => {
    if (state.posterSlide === 10) {
      e.target.value = "a5";
      return;
    }
    if (state.posterSlide === 11) {
      e.target.value = "slide11";
      return;
    }
    if (state.posterSlide === 12) {
      e.target.value = "slide12";
      return;
    }
    switchFormat(e.target.value);
    const isBanner = e.target.value === "banner";
    const bc = document.getElementById("banner-controls");
    const sc = document.getElementById("poster-slide-controls");
    const elc = document.getElementById("extra-logos-controls");
    const ctc = document.getElementById("convocatoria-tag-controls");
    const s3c = document.getElementById("slide3-bg-controls");
    if (bc) bc.style.display = isBanner ? "" : "none";
    if (sc) sc.style.display = isBanner ? "none" : "";
    if (elc) elc.style.display = isBanner ? "none" : "";
    if (ctc) ctc.style.display = isBanner ? "none" : "";
    if (s3c)
      s3c.style.display = !isBanner && state.posterSlide === 3 ? "" : "none";
  });

  onChange("poster-slide-select", (e) => {
    const prev = state.posterSlide;
    state.posterSlide = Number(e.target.value);

    if ([10, 11, 12].includes(state.posterSlide)) {
      if (![10, 11, 12].includes(prev)) {
        formatBeforeSlide10 = ["a5", "slide11", "slide12"].includes(state.format)
          ? "ig"
          : state.format;
      }
      switchFormat(
        state.posterSlide === 10
          ? "a5"
          : state.posterSlide === 11
            ? "slide11"
            : "slide12",
      );
      if (state.posterSlide === 12) {
        applyWcagPalette({
          name: "Blanco referencia / azul",
          bg: "#FFFFFF",
          fg: "#2D50F4",
        });
      } else {
        const referenceBlue = SLIDE10_PALETTES_DEF.find(
          (palette) => palette.name === "Azul referencia / blanco",
        );
        if (referenceBlue) applyWcagPalette(referenceBlue);
      }
    } else if ([10, 11, 12].includes(prev)) {
      const restoredFormat = formatBeforeSlide10 || "ig";
      switchFormat(restoredFormat);
      formatBeforeSlide10 = null;

      // Las primeras versiones del slide 10 compartían esta propiedad y
      // podían reemplazar accidentalmente el Hero Visual del slide 4.
      if (state.posterSlide === 4) {
        state.anim.slide4Anim = "glitch-overload";
      }
    }

    // Determinar el modo de animación (Hero Visual vs Poster Estándar)
    const prevMode = getPosterAnimMode(prev);
    const curMode = getPosterAnimMode();

    // Reconstruir selector de animaciones si cambiamos de modo
    if (prevMode !== curMode) rebuildAnimSelect(curMode);

    // Gestionar la instancia de animación de capa superior (Slide 4/5/7)
    if (
      [4, 5, 7, 8, 9, 10, 12].includes(state.posterSlide) ||
      isSlide3Slide9BgActive()
    ) {
      if (!slide4Animation || prevMode !== curMode || prev !== state.posterSlide)
        initSlide4Animation();
    } else {
      slide4Animation = null;
      slide10HeroAnimation = null;
      if (currentAnimation) currentAnimation.reset();
    }

    // Mostrar/Ocultar inputs de fecha de Slide 7
    const s7c = document.getElementById("slide7-controls");
    if (s7c) s7c.style.display = state.posterSlide === 7 ? "" : "none";

    // Mostrar/Ocultar botón de visibilidad (Editorial) de Slide 7
    const s7Extra = document.getElementById("s7-extra-ctrls");
    if (s7Extra) {
      s7Extra.classList.toggle("hidden", state.posterSlide !== 7);
    }
    updateSlide3BackgroundControls();
    updateSlide8TypographyControls();
    updateSlide9LayoutControls();
    updateSlide10Controls();
    buildWcagSwatches();
  });

  onCheck("extra-logos-toggle", (e) => {
    state.showExtraLogos = e.target.checked;
  });

  onCheck("convocatoria-tag-toggle", (e) => {
    state.showConvocatoriaTag = e.target.checked;
  });

  onClick("btn-randomize-banner", () => {
    randomizeBannerGrid();
    showToast("Banner aleatorio");
  });

  onClick("btn-upload-slide9-layout", () => {
    const input = el("slide9-layout-file");
    if (input) input.click();
  });
  onChange("slide9-layout-file", (e) => {
    loadSlide9Layouts(e.target.files);
  });
  onClick("btn-clear-slide9-layout", () => {
    clearSlide9Layout();
    showToast("Layout PNG quitado");
  });
  onClick("btn-toggle-slide9-palette-bg", () => {
    state.slide9.tintAnimations = !state.slide9.tintAnimations;
    updateSlide9LayoutControls();
    showToast(
      state.slide9.tintAnimations
        ? "Colores de paleta activos"
        : "Colores de paleta desactivados",
    );
  });

  onClick("btn-toggle-slide3-slide9-bg", () => {
    const prevMode = getPosterAnimMode();
    state.slide3Slide9Bg = !state.slide3Slide9Bg;
    const curMode = getPosterAnimMode();
    if (prevMode !== curMode) rebuildAnimSelect(curMode);
    if (state.slide3Slide9Bg) {
      initSlide4Animation();
    } else {
      slide4Animation = null;
      if (currentAnimation) currentAnimation.reset();
    }
    updateSlide3BackgroundControls();
    showToast(
      state.slide3Slide9Bg
        ? "Fondo slide 9 activo"
        : "Fondo slide 9 desactivado",
    );
  });

  onClick("btn-toggle-slide10-hero", () => {
    state.slide10.showHero = !state.slide10.showHero;
    updateSlide10Controls();
    showToast(
      state.slide10.showHero
        ? "Processing Community Day visible"
        : "Processing Community Day oculto",
    );
  });

  // ——— Slide 7 ———
  onInput("slide7-fecha-vieja", (e) => {
    state.slide7.fechaVieja = e.target.value;
    resetSlide4AnimationInstance();
  });
  onInput("slide7-fecha-nueva", (e) => {
    state.slide7.fechaNueva = e.target.value;
    resetSlide4AnimationInstance();
  });
  onInput("slide7-mes", (e) => {
    state.slide7.mes = e.target.value;
    resetSlide4AnimationInstance();
  });
  slider("slide7-hold-old", "slide7-hold-old-val", (v) => {
    state.slide7.holdOld = v;
  });
  slider("slide7-flip-dur", "slide7-flip-dur-val", (v) => {
    state.slide7.flipDur = v;
  });

  // Control para ocultar/mostrar editorial en Slide 7
  onClick("btn-toggle-s7-editorial", () => {
    state.slide7.hideEditorial = !state.slide7.hideEditorial;
    const btn = document.getElementById("btn-toggle-s7-editorial");
    if (btn) {
      btn.textContent = state.slide7.hideEditorial
        ? "Mostrar Textos"
        : "Ocultar Textos";
      btn.classList.toggle("active", state.slide7.hideEditorial);
    }
  });

  onClick("btn-toggle-slide8-split", () => {
    state.slide8.splitConvocatoria = !state.slide8.splitConvocatoria;
    updateSlide8TypographyControls();
    resetSlide8AnimationMask();
  });
  slider("slide8-finaliza-size", "slide8-finaliza-size-val", (v) => {
    state.slide8.finalizaSize = Math.round(v);
    resetSlide8AnimationMask();
  });
  slider("slide8-convocatoria-size", "slide8-convocatoria-size-val", (v) => {
    state.slide8.convocatoriaSize = Math.round(v);
    resetSlide8AnimationMask();
  });
  slider("slide8-abierta-size", "slide8-abierta-size-val", (v) => {
    state.slide8.abiertaSize = Math.round(v);
    resetSlide8AnimationMask();
  });
  slider("slide8-pcd-size", "slide8-pcd-size-val", (v) => {
    state.slide8.pcdSize = Math.round(v);
    resetSlide8AnimationMask();
  });
  slider(
    "slide8-leading",
    "slide8-leading-val",
    (v) => {
      state.slide8.leading = v;
      resetSlide8AnimationMask();
    },
    0.01,
    2,
  );
  slider("slide8-boldness", "slide8-boldness-val", (v) => {
    state.slide8.boldness = v;
    resetSlide8AnimationMask();
  }, 1, 1);

  // ——— Layout y Grilla ———
  slider("margin-val", "margin-disp", (v) => {
    state.layout.margin = v;
  });
  onCheck("grid-show", (e) => {
    state.grid.show = e.target.checked;
  });
  slider("grid-cols", "grid-cols-val", (v) => {
    state.grid.cols = Math.round(v);
  });
  slider("grid-rows", "grid-rows-val", (v) => {
    state.grid.rows = Math.round(v);
  });
  slider(
    "grid-weight",
    "grid-weight-val",
    (v) => {
      state.grid.weight = v;
    },
    0.1,
    1,
  );
  onCheck("guides-toggle", (e) => {
    state.showGuides = e.target.checked;
    state.grid.show = e.target.checked;
    el("btn-guides").classList.toggle("active", e.target.checked);
  });
  onClick("btn-randomize-layout", () => {
    randomizeLayout();
    showToast("Layout aleatorio");
  });
  onClick("btn-reset-layout", () => {
    resetLayout();
    showToast("Layout reseteado");
  });

  // ——— Paleta ———
  buildColorSwatches();
  onInput("fg-color", (e) => {
    state.preset.bubbleFg = e.target.value;
  });
  onInput("bubble-bg-color", (e) => {
    // Afecta animColor → todas las animaciones usan getAnimRgb() → animColor
    state.preset.animColor = e.target.value;
  });
  onInput("bg-color", (e) => {
    state.preset.bg = e.target.value;
    lastValidBg = e.target.value;
    const posterBg = document.getElementById("poster-bg");
    if (posterBg) posterBg.value = e.target.value;
    updateContrastUI();
    if (
      ["flow-field", "code-rain", "glyph-flow-field"].includes(
        state.anim.current,
      ) &&
      currentAnimation
    )
      currentAnimation.reset();
  });
  slider("anim-opacity", "anim-opacity-val", (v) => {
    state.anim.opacity = v;
  });
  slider("grid-opacity", "grid-opacity-val", (v) => {
    state.preset.gridOpacity = v;
  });

  // ——— Colores del afiche (WCAG) ———
  onInput("poster-bg", (e) => {
    const newBg = e.target.value;
    const autoAdjust = document.getElementById("auto-contrast")?.checked;
    if (meetsAA(newBg, state.preset.fg)) {
      state.preset.bg = newBg;
      lastValidBg = newBg;
      const bgPicker = document.getElementById("bg-color");
      if (bgPicker) bgPicker.value = newBg;
      hideContrastError();
      if (
        ["flow-field", "code-rain", "glyph-flow-field"].includes(
          state.anim.current,
        ) &&
        currentAnimation
      )
        currentAnimation.reset();
    } else if (autoAdjust) {
      const adjustedFg = adjustColorForContrast(state.preset.fg, newBg);
      state.preset.bg = newBg;
      state.preset.fg = adjustedFg;
      lastValidBg = newBg;
      lastValidFg = adjustedFg;
      const posterFg = document.getElementById("poster-fg");
      const bgPicker = document.getElementById("bg-color");
      if (posterFg) posterFg.value = adjustedFg;
      if (bgPicker) bgPicker.value = newBg;
      hideContrastError();
      if (
        ["flow-field", "code-rain", "glyph-flow-field"].includes(
          state.anim.current,
        ) &&
        currentAnimation
      )
        currentAnimation.reset();
    } else {
      e.target.value = lastValidBg;
      flashPicker(e.target);
      showContrastError(contrastRatio(newBg, state.preset.fg));
    }
    updateContrastUI();
  });

  onInput("poster-fg", (e) => {
    const newFg = e.target.value;
    const autoAdjust = document.getElementById("auto-contrast")?.checked;
    if (meetsAA(state.preset.bg, newFg)) {
      state.preset.fg = newFg;
      state.preset.animColor = newFg; // sync animaciones con nuevo fg
      lastValidFg = newFg;
      const animPicker = document.getElementById("bubble-bg-color");
      if (animPicker) animPicker.value = newFg;
      hideContrastError();
    } else if (autoAdjust) {
      const adjustedBg = adjustColorForContrast(state.preset.bg, newFg);
      state.preset.fg = newFg;
      state.preset.bg = adjustedBg;
      lastValidFg = newFg;
      lastValidBg = adjustedBg;
      const posterBg = document.getElementById("poster-bg");
      const bgPicker = document.getElementById("bg-color");
      if (posterBg) posterBg.value = adjustedBg;
      if (bgPicker) bgPicker.value = adjustedBg;
      hideContrastError();
      if (
        ["flow-field", "code-rain", "glyph-flow-field"].includes(
          state.anim.current,
        ) &&
        currentAnimation
      )
        currentAnimation.reset();
    } else {
      e.target.value = lastValidFg;
      flashPicker(e.target);
      showContrastError(contrastRatio(state.preset.bg, newFg));
    }
    updateContrastUI();
  });

  // ——— Animación ———
  onChange("anim-select", (e) => {
    const pixelRow = document.getElementById("slide4-pixel-mode-row");
    if ([4, 5].includes(state.posterSlide)) {
      state.anim.slide4Anim = e.target.value;
      initSlide4Animation();
      if (pixelRow)
        pixelRow.style.display =
          e.target.value === "pixel-explosion" ? "" : "none";
    } else if (state.posterSlide === 10) {
      state.anim.slide10BgAnim = e.target.value;
      initSlide4Animation();
      if (pixelRow) pixelRow.style.display = "none";
    } else if (state.posterSlide === 11) {
      state.anim.slide11Anim = e.target.value;
      if (pixelRow) pixelRow.style.display = "none";
    } else if (isSlide9Like() || isSlide3Slide9BgActive()) {
      state.anim.slide9Anim = e.target.value;
      initSlide4Animation();
      if (pixelRow)
        pixelRow.style.display =
          e.target.value === "pixel-explosion" ? "" : "none";
    } else if ([7, 8].includes(state.posterSlide)) {
      state.anim.slide7Anim = e.target.value;
      initSlide4Animation();
      if (pixelRow)
        pixelRow.style.display =
          e.target.value === "pixel-explosion" ? "" : "none";
    } else {
      switchAnimation(e.target.value);
    }
  });
  onChange("slide4-pixel-mode", (e) => {
    state.anim.slide4PixelMode = e.target.value;
  });
  onChange("anim-blend", (e) => {
    state.anim.blendMode = e.target.value;
  });
  onChange("anim-font", (e) => {
    state.anim.font = e.target.value;
    if (getPosterAnimMode() !== "poster") {
      resetSlide4AnimationInstance();
      if (slide10HeroAnimation) slide10HeroAnimation.reset();
    } else if (currentAnimation) {
      currentAnimation.reset();
    }
  });
  slider(
    "slide4-leading",
    "slide4-leading-val",
    (v) => {
      state.anim.slide4Leading = v;
      if ([4, 5, 10].includes(state.posterSlide)) initSlide4Animation();
    },
    0.01,
    2,
  );
  slider(
    "anim-speed",
    "anim-speed-val",
    (v) => {
      state.anim.speed = v;
    },
    0.1,
    1,
  );
  slider("anim-text-size", "anim-text-size-val", (v) => {
    state.anim.textSize = Math.round(v);
    if (getPosterAnimMode() !== "poster") {
      resetSlide4AnimationInstance();
      if (slide10HeroAnimation) slide10HeroAnimation.reset();
    } else if (currentAnimation) {
      currentAnimation.reset();
    }
  });
  onChange("anim-seed", (e) => {
    state.anim.seed = parseInt(e.target.value) || 0;
    if (getPosterAnimMode() !== "poster") initSlide4Animation();
    else initAnimation();
  });
  onClick("btn-randomize-anim", () => {
    const seed = Math.floor(Math.random() * 99999);
    state.anim.seed = seed;
    el("anim-seed").value = seed;
    if (getPosterAnimMode() !== "poster") initSlide4Animation();
    else initAnimation();
    showToast("Nueva semilla: " + seed);
  });

  // ——— Exportación ———
  onClick("btn-export-png", exportPNG);
  onClick("btn-export-mp4", exportVideo);
  onClick("btn-export-png-sidebar", exportPNG);
  onClick("btn-export-mp4-sidebar", exportVideo);

  // ——— Toolbar ———
  onClick("btn-play-pause", () => {
    state.playing = !state.playing;
    const btn = el("btn-play-pause");
    const label = el("play-label");
    btn.classList.toggle("active", state.playing);
    if (label) label.textContent = state.playing ? "Pause" : "Play";
    const icon = el("play-icon");
    if (icon)
      icon.setAttribute(
        "d",
        state.playing ? "M8 5v14l11-7z" : "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
      );
  });

  onClick("btn-reset", () => {
    const anim = getPosterAnimMode() !== "poster"
      ? slide4Animation
      : currentAnimation;
    if (anim) anim.reset();
    showToast("Animación reiniciada");
  });

  onClick("btn-guides", () => {
    state.showGuides = !state.showGuides;
    state.grid.show = state.showGuides;
    el("btn-guides").classList.toggle("active", state.showGuides);
    const toggle = el("guides-toggle");
    if (toggle) toggle.checked = state.showGuides;
  });

  window.addEventListener("resize", resizeCanvasWrapper);
  updateSlide8TypographyControls();
  updateSlide9LayoutControls();
}

/* =====================================================
   EXPORTACIÓN
   ===================================================== */
async function waitForCanvasFrame() {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

function slide9ExportBatch() {
  if (state.posterSlide !== 9) return [];
  return getSlide9Layouts();
}

function exportFileBaseName(name, index) {
  const base =
    (name || `slide-${index + 1}`)
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || `slide-${index + 1}`;
  return `pcd2026-slide9-${String(index + 1).padStart(2, "0")}-${base}`;
}

async function exportPNG() {
  const wasPlay = state.playing;
  state.playing = false;

  const cv = document.querySelector("#canvas-container canvas");
  if (!cv) {
    showToast("Canvas no encontrado", "error");
    state.playing = wasPlay;
    return;
  }

  const layouts = slide9ExportBatch();
  const activeIndex = state.slide9.activeLayoutIndex || 0;

  if (layouts.length > 1) {
    showProgress(true, "Exportando PNGs...");
    for (let i = 0; i < layouts.length; i++) {
      setActiveSlide9Layout(i);
      updateSlide9LayoutControls();
      await waitForCanvasFrame();
      downloadDataURL(
        cv.toDataURL("image/png"),
        `${exportFileBaseName(layouts[i].name, i)}.png`,
      );
      updateProgress((i + 1) / layouts.length, `${i + 1} / ${layouts.length}`);
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
    setActiveSlide9Layout(activeIndex);
    updateSlide9LayoutControls();
    showProgress(false);
    showToast(
      `${layouts.length} PNGs exportados ${CANVAS_W}×${CANVAS_H}`,
      "success",
    );
    state.playing = wasPlay;
    return;
  }

  await waitForCanvasFrame();
  downloadDataURL(cv.toDataURL("image/png"), "pcd2026.png");
  showToast(`PNG exportado ${CANVAS_W}×${CANVAS_H}`, "success");
  state.playing = wasPlay;
}

async function exportVideo() {
  const cv = document.querySelector("#canvas-container canvas");
  if (!cv) {
    showToast("Canvas no encontrado", "error");
    return;
  }
  if (!window.MediaRecorder) {
    showToast("MediaRecorder no soportado", "error");
    return;
  }

  const layouts = slide9ExportBatch();
  const activeIndex = state.slide9.activeLayoutIndex || 0;
  const wasPlay = state.playing;
  state.playing = true;

  if (layouts.length > 1) {
    let exported = 0;
    for (let i = 0; i < layouts.length; i++) {
      setActiveSlide9Layout(i);
      updateSlide9LayoutControls();
      await waitForCanvasFrame();
      updateProgress(i / layouts.length, `Video ${i + 1} / ${layouts.length}`);
      const ok = await exportSingleVideo(cv, exportFileBaseName(layouts[i].name, i), {
        label: `Video ${i + 1} / ${layouts.length}`,
        keepPlayback: true,
        showFinalToast: false,
      });
      if (!ok) break;
      exported++;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    setActiveSlide9Layout(activeIndex);
    updateSlide9LayoutControls();
    showProgress(false);
    showToast(
      exported === layouts.length
        ? `${layouts.length} videos exportados`
        : `Exportados ${exported} de ${layouts.length} videos`,
      exported === layouts.length ? "success" : "error",
    );
    state.playing = wasPlay;
    return;
  }

  await exportSingleVideo(cv, "pcd2026", {
    keepPlayback: true,
    showFinalToast: true,
  });
  state.playing = wasPlay;
}

function exportSingleVideo(
  cv,
  fileBaseName,
  { label = "Grabando...", keepPlayback = false, showFinalToast = true } = {},
) {
  return new Promise((resolve) => {
    const fps = state.anim.fps || 30;
    const duration = 10000; // 10 segundos fijos

    const mp4Types = [
      "video/mp4;codecs=avc1",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm",
    ];
    const mime =
      mp4Types.find((t) => {
        try {
          return MediaRecorder.isTypeSupported(t);
        } catch (e) {
          return false;
        }
      }) || "video/webm";
    const ext = mime.includes("mp4") ? "mp4" : "webm";

    let stream;
    try {
      stream = cv.captureStream(fps);
    } catch (e) {
      showToast("captureStream no soportado", "error");
      resolve(false);
      return;
    }

    let rec;
    try {
      rec = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 8_000_000,
      });
    } catch (e) {
      stream.getTracks().forEach((track) => track.stop());
      showToast("No se pudo iniciar MediaRecorder", "error");
      resolve(false);
      return;
    }

    const chunks = [];
    const wasPlay = state.playing;
    let settled = false;
    let progressTimer = null;
    if (!keepPlayback) state.playing = true;

    const stopStream = () => {
      stream.getTracks().forEach((track) => track.stop());
    };
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      if (progressTimer) clearInterval(progressTimer);
      stopStream();
      if (!keepPlayback) state.playing = wasPlay;
      resolve(ok);
    };

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      downloadURL(
        URL.createObjectURL(new Blob(chunks, { type: mime })),
        `${fileBaseName}.${ext}`,
      );
      if (showFinalToast) {
        showProgress(false);
        showToast(`Video exportado (10s · ${ext.toUpperCase()})`, "success");
      }
      finish(true);
    };
    rec.onerror = () => {
      showProgress(false);
      showToast("No se pudo exportar el video", "error");
      finish(false);
    };

    // Reiniciar animación desde el principio antes de grabar
    if (getPosterAnimMode() !== "poster") {
      resetSlide4AnimationInstance();
    } else {
      if (currentAnimation) currentAnimation.reset();
    }

    showProgress(true, label);
    try {
      rec.start();
    } catch (e) {
      showProgress(false);
      showToast("No se pudo iniciar la grabación", "error");
      finish(false);
      return;
    }
    let elapsed = 0;
    progressTimer = setInterval(() => {
      elapsed += 100;
      updateProgress(
        elapsed / duration,
        `${label} · ${(elapsed / 1000).toFixed(1)}s / 10s`,
      );
      if (elapsed >= duration) {
        if (rec.state !== "inactive") rec.stop();
      }
    }, 100);
  });
}

function downloadDataURL(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
function downloadURL(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
function showProgress(show, msg = "") {
  const el = document.getElementById("export-progress");
  if (el) el.classList.toggle("hidden", !show);
  if (show && msg) {
    const t = document.getElementById("progress-text");
    if (t) t.textContent = msg;
  }
}
function updateProgress(ratio, msg) {
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  if (fill) fill.style.width = ratio * 100 + "%";
  if (text && msg) text.textContent = msg;
}

/* =====================================================
   INICIALIZACIÓN
   ===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  // Filtrar paletas WCAG programáticamente (excluye cualquiera que no cumpla 4.5:1)
  WCAG_PALETTES = WCAG_PALETTES_DEF.filter((p) => meetsAA(p.bg, p.fg));
  restorePersistentState();
  if (state.posterSlide === 4) {
    state.anim.slide4Anim = "glitch-overload";
    if (state.format === "a5") state.format = "ig";
  }
  if (state.posterSlide === 10) {
    state.format = "a5";
    setCanvasSize(A5_W, A5_H);
  } else if (state.posterSlide === 11) {
    state.format = "slide11";
    setCanvasSize(SLIDE11_W, SLIDE11_H);
  } else if (state.posterSlide === 12) {
    state.format = "slide12";
    setCanvasSize(SLIDE12_W, SLIDE12_H);
  } else if (state.format === "a5") {
    setCanvasSize(A5_W, A5_H);
  } else if (state.format === "slide11") {
    setCanvasSize(SLIDE11_W, SLIDE11_H);
  } else if (state.format === "slide12") {
    setCanvasSize(SLIDE12_W, SLIDE12_H);
  } else if (state.format === "banner") {
    setCanvasSize(BANNER_W, BANNER_H);
  }
  state.meta.topLeft = `${CANVAS_W}×${CANVAS_H}`;
  const initialResBadge = document.getElementById("res-badge");
  if (initialResBadge) {
    initialResBadge.textContent = `${CANVAS_W} × ${CANVAS_H} px`;
  }
  await restoreSlide9LayoutFiles();
  lastValidBg = state.preset.bg;
  lastValidFg = state.preset.fg;

  await initLogos();
  p5Instance = new p5(sketch);
  setTimeout(resizeCanvasWrapper, 80);
  bindControls();
  buildWcagSwatches();
  syncControlsFromState();
  setupPersistentStateAutosave();
  window.addEventListener("resize", resizeCanvasWrapper);
});
