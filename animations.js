/* =====================================================
   ANIMATIONS.JS — Librería de animaciones p5.js
   Cada animación es una clase factory que recibe (p, state)
   Formato canvas: 1080×1350
   ===================================================== */

// ——— CLASE BASE ———
class BaseAnimation {
  constructor(p, state) {
    this.p = p;
    this.state = state;
    this.t = 0; // tiempo interno
  }
  update() { this.t += 0.01 * this.speed(); }
  speed() { return this.state.anim.speed; }
  draw() {} // override en subclases
  reset() { this.t = 0; }
  // Convierte color hex a array [r, g, b]
  hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return [r, g, b];
  }
}

/* =====================================================
   1. PARTICLES — Partículas flotantes con conexiones
   ===================================================== */
class ParticlesAnimation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.particles = [];
    this.init();
  }

  init() {
    const params = this.state.anim.params.particles;
    const seed = this.state.anim.seed;
    this.p.randomSeed(seed);
    this.particles = [];
    for (let i = 0; i < params.count; i++) {
      this.particles.push({
        x: this.p.random(1080),
        y: this.p.random(1350),
        vx: this.p.random(-0.8, 0.8),
        vy: this.p.random(-0.8, 0.8),
        size: this.p.random(1, params.size)
      });
    }
  }

  reset() { super.reset(); this.init(); }

  draw() {
    const p = this.p;
    const params = this.state.anim.params.particles;
    const mainColor = this.state.anim.color;
    const spd = this.state.anim.speed;
    const [r, g, b] = this.hexToRgb(mainColor);
    const [lr, lg, lb] = this.hexToRgb(params.lineColor);

    // Si cambia la cantidad de partículas, reiniciar
    if (this.particles.length !== params.count) this.init();

    // Actualizar posiciones
    for (let pt of this.particles) {
      pt.x += pt.vx * spd;
      pt.y += pt.vy * spd;
      if (pt.x < 0) pt.x = 1080;
      if (pt.x > 1080) pt.x = 0;
      if (pt.y < 0) pt.y = 1350;
      if (pt.y > 1350) pt.y = 0;
    }

    // Dibujar conexiones
    p.strokeWeight(0.5);
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i+1; j < this.particles.length; j++) {
        const d = p.dist(this.particles[i].x, this.particles[i].y,
                          this.particles[j].x, this.particles[j].y);
        if (d < params.distance) {
          const alpha = p.map(d, 0, params.distance, 180, 0);
          p.stroke(lr, lg, lb, alpha);
          p.line(this.particles[i].x, this.particles[i].y,
                 this.particles[j].x, this.particles[j].y);
        }
      }
    }

    // Dibujar partículas
    p.noStroke();
    for (let pt of this.particles) {
      p.fill(r, g, b, 200);
      p.ellipse(pt.x, pt.y, pt.size * 2);
    }
  }
}

/* =====================================================
   2. WAVES — Ondas sinusoidales
   ===================================================== */
class WavesAnimation extends BaseAnimation {
  draw() {
    const p = this.p;
    const params = this.state.anim.params.waves;
    const mainColor = this.state.anim.color;
    const [r, g, b] = this.hexToRgb(mainColor);
    const spd = this.state.anim.speed;

    this.t += 0.015 * spd;

    p.noFill();
    for (let w = 0; w < params.count; w++) {
      const phase = (w / params.count) * p.TWO_PI;
      const yBase = p.map(w, 0, params.count - 1, 200, 1150);
      const alpha = p.map(w, 0, params.count, 80, 200);
      const weight = params.weight * 0.5;

      p.strokeWeight(weight);
      p.stroke(r, g, b, alpha);
      p.beginShape();
      for (let x = 0; x <= 1080; x += 4) {
        const y = yBase + Math.sin(x * params.freq + this.t + phase) * params.amplitude;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }
}

/* =====================================================
   3. NOISE FIELD — Campo de flujo con Perlin noise
   ===================================================== */
class NoiseFieldAnimation extends BaseAnimation {
  draw() {
    const p = this.p;
    const params = this.state.anim.params.noiseField;
    const mainColor = this.state.anim.color;
    const [r, g, b] = this.hexToRgb(mainColor);
    const spd = this.state.anim.speed;

    this.t += 0.005 * spd;

    const res = params.resolution;
    const stepX = 1080 / res;
    const stepY = 1350 / res;
    const len = params.vectorLen;

    p.strokeWeight(1);
    p.stroke(r, g, b, 150);

    for (let ix = 0; ix <= res; ix++) {
      for (let iy = 0; iy <= res; iy++) {
        const x = ix * stepX;
        const y = iy * stepY;
        const n = p.noise(x * params.noiseScale, y * params.noiseScale, this.t);
        const angle = n * p.TWO_PI * 2;
        const ex = x + Math.cos(angle) * len;
        const ey = y + Math.sin(angle) * len;
        p.line(x, y, ex, ey);
        p.ellipse(ex, ey, 3, 3);
      }
    }
  }
}

/* =====================================================
   4. GRID PULSE — Grilla de puntos que pulsan
   ===================================================== */
class GridPulseAnimation extends BaseAnimation {
  draw() {
    const p = this.p;
    const params = this.state.anim.params.gridPulse;
    const mainColor = this.state.anim.color;
    const [r, g, b] = this.hexToRgb(mainColor);
    const spd = this.state.anim.speed;

    this.t += 0.02 * spd * params.speed;

    const cols = params.cols;
    const rows = params.rows;
    const stepX = 1080 / cols;
    const stepY = 1350 / rows;

    p.noStroke();
    for (let ix = 0; ix < cols; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        const x = (ix + 0.5) * stepX;
        const y = (iy + 0.5) * stepY;
        const d = p.dist(x, y, 540, 675);
        const pulse = Math.sin(this.t - d * 0.008) * 0.5 + 0.5;
        const s = params.elemSize * pulse + 1;
        const alpha = pulse * 220 + 20;
        p.fill(r, g, b, alpha);
        p.ellipse(x, y, s, s);
      }
    }
  }
}

/* =====================================================
   5. CIRCLES GROW — Círculos concéntricos
   ===================================================== */
class CirclesGrowAnimation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.circles = [];
    this.init();
  }

  init() {
    const params = this.state.anim.params.circlesGrow;
    const seed = this.state.anim.seed;
    this.p.randomSeed(seed);
    this.circles = [];
    for (let i = 0; i < params.count; i++) {
      this.circles.push({
        x: this.p.random(200, 880),
        y: this.p.random(200, 1150),
        r: this.p.random(0, 800),
        maxR: this.p.random(300, 900),
        speed: this.p.random(0.5, 2.0)
      });
    }
  }

  reset() { super.reset(); this.init(); }

  draw() {
    const p = this.p;
    const params = this.state.anim.params.circlesGrow;
    const mainColor = this.state.anim.color;
    const [r, g, b] = this.hexToRgb(mainColor);
    const spd = this.state.anim.speed;

    if (this.circles.length !== params.count) this.init();

    p.noFill();
    p.strokeWeight(params.weight);

    for (let c of this.circles) {
      c.r += c.speed * spd * 0.5 * params.speed;
      if (c.r > c.maxR) c.r = 0;

      const alpha = p.map(c.r, 0, c.maxR, 200, 0);
      p.stroke(r, g, b, alpha);

      if (params.fill) {
        p.fill(r, g, b, alpha * 0.1);
      } else {
        p.noFill();
      }

      p.ellipse(c.x, c.y, c.r * 2, c.r * 2);
    }
  }
}

/* =====================================================
   6. GLITCH BARS — Barras con efecto glitch
   ===================================================== */
class GlitchBarsAnimation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.timer = 0;
    this.bars = [];
  }

  draw() {
    const p = this.p;
    const params = this.state.anim.params.glitchBars;
    const mainColor = this.state.anim.color;
    const [r, g, b] = this.hexToRgb(mainColor);
    const [r2, g2, b2] = this.hexToRgb(params.color2);
    const spd = this.state.anim.speed;

    this.timer++;

    // Regenerar barras periódicamente
    if (this.timer % Math.floor(8 / spd + 2) === 0) {
      this.bars = [];
      for (let i = 0; i < params.count; i++) {
        const y = p.random(0, 1350);
        const h = p.random(2, 40);
        const offset = p.random(-params.intensity, params.intensity);
        const useAltColor = p.random() > 0.7;
        this.bars.push({ y, h, offset, useAltColor });
      }
    }

    const maxOff = params.intensity;
    p.noStroke();
    for (let bar of this.bars) {
      if (bar.useAltColor) {
        p.fill(r2, g2, b2, 180);
      } else {
        p.fill(r, g, b, 120);
      }
      // Usar ancho extendido para que la barra cubra siempre el canvas completo
      p.rect(bar.offset - maxOff, bar.y, 1080 + maxOff * 2, bar.h);
    }
  }
}

/* =====================================================
   7. GRADIENT MESH — Malla de gradientes animados
   ===================================================== */
class GradientMeshAnimation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.points = [];
    this.init();
  }

  init() {
    const params = this.state.anim.params.gradientMesh;
    const n = params.points;
    this.p.randomSeed(this.state.anim.seed);
    this.points = [];
    for (let i = 0; i < n; i++) {
      this.points.push({
        x: this.p.random(1080),
        y: this.p.random(1350),
        vx: this.p.random(-0.5, 0.5),
        vy: this.p.random(-0.5, 0.5),
        colorIdx: i % 3
      });
    }
  }

  reset() { super.reset(); this.init(); }

  draw() {
    const p = this.p;
    const params = this.state.anim.params.gradientMesh;
    const spd = this.state.anim.speed;
    const smooth = params.smooth;

    const colors = [
      this.hexToRgb(params.color1),
      this.hexToRgb(params.color2),
      this.hexToRgb(params.color3)
    ];

    if (this.points.length !== params.points) this.init();

    // Mover puntos de control
    for (let pt of this.points) {
      pt.x += pt.vx * spd * smooth * 10;
      pt.y += pt.vy * spd * smooth * 10;
      if (pt.x < 0 || pt.x > 1080) pt.vx *= -1;
      if (pt.y < 0 || pt.y > 1350) pt.vy *= -1;
    }

    // Renderizar: para cada punto de la grilla, mezclar colores por distancia
    const step = 30;
    p.noStroke();
    for (let x = 0; x <= 1080; x += step) {
      for (let y = 0; y <= 1350; y += step) {
        let totalW = 0;
        let cr = 0, cg = 0, cb = 0;
        for (let pt of this.points) {
          const d = p.dist(x, y, pt.x, pt.y);
          const w = 1 / (d * d + 1);
          const col = colors[pt.colorIdx];
          cr += col[0] * w;
          cg += col[1] * w;
          cb += col[2] * w;
          totalW += w;
        }
        p.fill(cr/totalW, cg/totalW, cb/totalW, 200);
        p.rect(x, y, step + 1, step + 1);
      }
    }
  }
}

/* =====================================================
   8. STARFIELD — Campo de estrellas 3D
   ===================================================== */
class StarfieldAnimation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.stars = [];
    this.init();
  }

  init() {
    const params = this.state.anim.params.starfield;
    this.p.randomSeed(this.state.anim.seed);
    this.stars = [];
    for (let i = 0; i < params.count; i++) {
      this.stars.push(this.newStar(true));
    }
  }

  newStar(randomZ = false) {
    return {
      x: this.p.random(-540, 540),
      y: this.p.random(-675, 675),
      z: randomZ ? this.p.random(0, 1000) : 1000
    };
  }

  reset() { super.reset(); this.init(); }

  draw() {
    const p = this.p;
    const params = this.state.anim.params.starfield;
    const mainColor = this.state.anim.color;
    const [r, g, b] = this.hexToRgb(mainColor);
    const spd = this.state.anim.speed * params.speed;
    const depth = params.depth * 100;

    if (this.stars.length !== params.count) this.init();

    p.noStroke();
    p.translate(540, 675);

    for (let s of this.stars) {
      s.z -= spd;
      if (s.z <= 0) {
        s.x = p.random(-540, 540);
        s.y = p.random(-675, 675);
        s.z = 1000;
      }
      const sx = (s.x / s.z) * depth;
      const sy = (s.y / s.z) * depth;
      const size = p.map(s.z, 0, 1000, 4, 0.1);
      const alpha = p.map(s.z, 0, 1000, 255, 50);
      p.fill(r, g, b, alpha);
      p.ellipse(sx, sy, size, size);
    }

    p.translate(-540, -675);
  }
}

/* =====================================================
   9. MATRIX RAIN — Lluvia de caracteres
   Usa un p5.Graphics buffer para persistir el efecto trail
   entre frames (el main draw limpia el canvas cada frame)
   ===================================================== */
class MatrixRainAnimation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.drops = [];
    this.timer = 0;
    // Buffer persistente para el trail effect
    this.buffer = p.createGraphics(1080, 1350);
    this.buffer.background(0);
    this.init();
  }

  getCharset() {
    const cs = this.state.anim.params.matrixRain.charset;
    if (cs === 'katakana') return 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
    if (cs === 'numbers') return '0123456789';
    if (cs === 'mixed') return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  }

  init() {
    const params = this.state.anim.params.matrixRain;
    const cols = Math.floor(1080 / 20);
    this.p.randomSeed(this.state.anim.seed);
    this.drops = [];
    for (let i = 0; i < cols; i++) {
      this.drops.push(this.p.random(-1350, 0));
    }
    if (this.buffer) this.buffer.background(0);
  }

  reset() {
    super.reset();
    this.init();
  }

  draw() {
    const p = this.p;
    const buf = this.buffer;
    const params = this.state.anim.params.matrixRain;
    const mainColor = this.state.anim.color;
    const [r, g, b] = this.hexToRgb(mainColor);
    const spd = this.state.anim.speed;
    const charset = this.getCharset();
    const bgColor = this.state.bg ? this.state.bg.color : '#000000';
    const [bgR, bgG, bgB] = this.hexToRgb(bgColor);

    this.timer++;

    // Trail effect en el buffer persistente (no en el canvas principal)
    buf.fill(bgR, bgG, bgB, 28);
    buf.noStroke();
    buf.rect(0, 0, 1080, 1350);

    const fontSize = 16;
    // Configurar fuente en el buffer, no en el canvas principal
    buf.textSize(fontSize);
    buf.textFont('Space Mono, monospace');
    buf.textAlign(buf.CENTER, buf.BOTTOM);

    const cols = Math.floor(1080 / 20);
    if (this.drops.length !== cols) this.init();

    for (let i = 0; i < cols; i++) {
      if (p.random() < params.density) {
        const ch = charset[Math.floor(p.random(charset.length))];
        const x = i * 20 + 10;
        const y = this.drops[i];

        // Carácter principal brillante (en el buffer)
        buf.fill(r, g, b, 255);
        buf.text(ch, x, y);

        // Carácter anterior más oscuro
        buf.fill(r * 0.5, g * 0.5, b * 0.5, 150);
        const ch2 = charset[Math.floor(p.random(charset.length))];
        buf.text(ch2, x, y - fontSize);
      }

      this.drops[i] += params.dropSpeed * spd * 0.3;
      if (this.drops[i] > 1350 && p.random() > 0.975) {
        this.drops[i] = 0;
      }
    }

    // Componer el buffer sobre el canvas principal
    p.image(buf, 0, 0);
  }
}

/* =====================================================
   10. GEOMETRIC ROTATION — Formas geométricas rotando
   ===================================================== */
class GeometricRotationAnimation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.shapes = [];
    this.init();
  }

  init() {
    const params = this.state.anim.params.geometricRotation;
    this.p.randomSeed(this.state.anim.seed);
    this.shapes = [];
    for (let i = 0; i < params.count; i++) {
      this.shapes.push({
        x: this.p.random(100, 980),
        y: this.p.random(100, 1250),
        size: this.p.random(30, 200),
        rotSpeed: this.p.random(-0.02, 0.02) * params.speed,
        rot: this.p.random(this.p.TWO_PI),
        alpha: this.p.random(80, 200)
      });
    }
  }

  reset() { super.reset(); this.init(); }

  drawShape(shape, type, r, g, b, weight) {
    const p = this.p;
    p.push();
    p.translate(shape.x, shape.y);
    p.rotate(shape.rot);
    p.stroke(r, g, b, shape.alpha);
    p.strokeWeight(weight);
    p.noFill();

    const s = shape.size;
    if (type === 'square') {
      p.rect(-s/2, -s/2, s, s);
    } else if (type === 'triangle') {
      p.triangle(0, -s/2, -s*0.433, s/4, s*0.433, s/4);
    } else if (type === 'hexagon') {
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const a = p.TWO_PI / 6 * i;
        p.vertex(Math.cos(a)*s/2, Math.sin(a)*s/2);
      }
      p.endShape(p.CLOSE);
    } else { // circle
      p.ellipse(0, 0, s, s);
    }
    p.pop();
  }

  draw() {
    const p = this.p;
    const params = this.state.anim.params.geometricRotation;
    const mainColor = this.state.anim.color;
    const [r, g, b] = this.hexToRgb(mainColor);
    const spd = this.state.anim.speed;

    if (this.shapes.length !== params.count) this.init();

    for (let s of this.shapes) {
      s.rot += s.rotSpeed * spd;
      this.drawShape(s, params.shape, r, g, b, params.weight);
    }
  }
}

/* =====================================================
   REGISTRO DE ANIMACIONES
   ===================================================== */
const ANIMATIONS = {
  'particles':           ParticlesAnimation,
  'waves':               WavesAnimation,
  'noise-field':         NoiseFieldAnimation,
  'grid-pulse':          GridPulseAnimation,
  'circles-grow':        CirclesGrowAnimation,
  'glitch-bars':         GlitchBarsAnimation,
  'gradient-mesh':       GradientMeshAnimation,
  'starfield':           StarfieldAnimation,
  'matrix-rain':         MatrixRainAnimation,
  'geometric-rotation':  GeometricRotationAnimation
};

/* =====================================================
   FUNCIÓN AUXILIAR: dibuja el texto sobre el canvas p5
   ===================================================== */
function drawTextLayer(p, state) {
  const layout = state.layout;
  const M = layout.independentMargins ? layout.margins : {
    top: layout.marginAll, right: layout.marginAll,
    bottom: layout.marginAll, left: layout.marginAll
  };

  const areaX = M.left;
  const areaY = M.top;
  const areaW = 1080 - M.left - M.right;
  const areaH = 1350 - M.top - M.bottom;

  // Recopilar elementos visibles
  const elements = [];

  const applyTransform = (txt, transform) => {
    if (transform === 'uppercase') return txt.toUpperCase();
    if (transform === 'lowercase') return txt.toLowerCase();
    if (transform === 'capitalize') return txt.replace(/\b\w/g, c => c.toUpperCase());
    return txt;
  };

  // Título
  const titleTxt = applyTransform(state.title.text, state.title.transform);
  if (titleTxt) {
    elements.push({ type: 'title', text: titleTxt, cfg: state.title });
  }

  // Subtítulo
  if (state.subtitle.visible) {
    const subTxt = applyTransform(state.subtitle.text, state.subtitle.transform);
    if (subTxt) elements.push({ type: 'subtitle', text: subTxt, cfg: state.subtitle });
  }

  // Body
  if (state.body.visible) {
    if (state.body.text) elements.push({ type: 'body', text: state.body.text, cfg: state.body });
  }

  if (elements.length === 0) return;

  // Calcular alturas aproximadas
  const gaps = [layout.gapTitleSubtitle, layout.gapSubtitleBody];
  let totalH = 0;
  const heights = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const lines = el.text.split('\n');
    const lineH = el.cfg.size * el.cfg.lineHeight;
    const h = lines.length * lineH;
    heights.push(h);
    totalH += h;
    if (i < elements.length - 1) totalH += gaps[i] || 0;
  }

  // Posición Y según alineación vertical
  let startY;
  if (layout.alignV === 'top') startY = areaY;
  else if (layout.alignV === 'bottom') startY = areaY + areaH - totalH;
  else startY = areaY + (areaH - totalH) / 2;

  // Dibujar cada elemento
  let curY = startY;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const cfg = el.cfg;

    // Configurar fuente
    const fontStr = `${cfg.style === 'italic' ? 'italic ' : ''}${cfg.weight} ${cfg.size}px '${cfg.font}', sans-serif`;
    p.drawingContext.font = fontStr;

    // Alineación horizontal
    let textX;
    if (layout.alignH === 'left') {
      p.drawingContext.textAlign = 'left';
      textX = areaX;
    } else if (layout.alignH === 'right') {
      p.drawingContext.textAlign = 'right';
      textX = areaX + areaW;
    } else {
      p.drawingContext.textAlign = 'center';
      textX = areaX + areaW / 2;
    }

    // Sombra de texto
    if (cfg.shadow && cfg.shadow.on) {
      const [sr, sg, sb] = hexToRgb(cfg.shadow.color);
      p.drawingContext.shadowColor = `rgba(${sr},${sg},${sb},0.8)`;
      p.drawingContext.shadowOffsetX = cfg.shadow.x;
      p.drawingContext.shadowOffsetY = cfg.shadow.y;
      p.drawingContext.shadowBlur = cfg.shadow.blur;
    } else {
      p.drawingContext.shadowColor = 'transparent';
      p.drawingContext.shadowBlur = 0;
    }

    // Letter spacing via canvas nativo
    p.drawingContext.letterSpacing = cfg.letterSpacing + 'px';

    // Color
    const [tr, tg, tb] = hexToRgb(cfg.color);
    p.fill(tr, tg, tb);
    p.noStroke();

    // Dibujar líneas
    const lines = el.text.split('\n');
    const lineH = cfg.size * cfg.lineHeight;
    for (let li = 0; li < lines.length; li++) {
      p.drawingContext.fillStyle = `rgb(${tr},${tg},${tb})`;
      p.drawingContext.fillText(lines[li], textX, curY + lineH * (li + 1));
    }

    curY += heights[i] + (gaps[i] || 0);
  }

  // Resetear sombra
  p.drawingContext.shadowColor = 'transparent';
  p.drawingContext.shadowBlur = 0;
  p.drawingContext.letterSpacing = '0px';
}

// Helper hex a rgb (duplicado local para uso en drawTextLayer)
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r, g, b];
}
