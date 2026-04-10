/* =====================================================
   ANIMATIONS.JS — Librería de animaciones p5.js
   Processing Community Day 2026
   Cada animación: constructor, advanceState(), render(),
   handleMouse(cx, cy, type), reset()
   ===================================================== */

/* =====================================================
   CONSTANTES GLOBALES DE LAYOUT
   ===================================================== */
const CANVAS_W = 1080;
const CANVAS_H = 1350;
const MARGIN   = 40;

// Zonas verticales del canvas (de arriba a abajo)
const ZONES = {
  topBar:    { y: 0,    h: 40  },
  json:      { y: 40,   h: 280 },
  anim:      { y: 320,  h: 710 },
  title:     { y: 1030, h: 280 },
  bottomBar: { y: 1310, h: 40  }
};

/* =====================================================
   VECTOR 2D — utilidades físicas
   ===================================================== */
class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  clone()         { return new Vec2(this.x, this.y); }
  add(v)          { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v)          { return new Vec2(this.x - v.x, this.y - v.y); }
  scale(s)        { return new Vec2(this.x * s,   this.y * s); }
  mag()           { return Math.sqrt(this.x * this.x + this.y * this.y); }
  norm()          { const m = this.mag(); return m > 0 ? this.scale(1 / m) : new Vec2(); }
  dot(v)          { return this.x * v.x + this.y * v.y; }
  static dist(a, b) { return a.sub(b).mag(); }
}

// Resolución de colisión elástica entre dos círculos (igual masa)
function resolveCircleCollision(a, b, restitution = 0.75) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d  = Math.sqrt(dx * dx + dy * dy);
  const minD = a.r + b.r;
  if (d >= minD || d === 0) return;

  const nx = dx / d;
  const ny = dy / d;
  const overlap = (minD - d) * 0.5;

  // Separar centros para evitar superposición
  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;

  // Respuesta de velocidad por impulso
  const dvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (dvn >= 0) return; // ya se separan
  const j = -(1 + restitution) * dvn * 0.5;
  a.vx -= j * nx;  a.vy -= j * ny;
  b.vx += j * nx;  b.vy += j * ny;
}

// Convierte hex a array [r, g, b]
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

/* =====================================================
   CLASE BASE
   ===================================================== */
class BaseAnimation {
  constructor(p, state) {
    this.p     = p;
    this.state = state;
    this.mx    = CANVAS_W / 2; // posición mouse en canvas coords
    this.my    = CANVAS_H / 2;
  }

  // Retorna los límites de renderizado según estado fullCanvas
  getBounds() {
    if (this.state.anim.fullCanvas) {
      return { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H };
    }
    return { x: 0, y: ZONES.anim.y, w: CANVAS_W, h: ZONES.anim.h };
  }

  // Colores del preset activo
  getFg()      { return hexToRgb(this.state.preset.fg); }
  getBg()      { return hexToRgb(this.state.preset.bg); }
  getAnimRgb() { return hexToRgb(this.state.preset.animColor); }

  draw() {
    if (this.state.playing) this.advanceState();
    this.render();
  }

  advanceState() {}
  render()       {}
  reset()        {}
  handleMouse(cx, cy, type) {
    this.mx = cx;
    this.my = cy;
  }
}

/* =====================================================
   1. LETTER PHYSICS — Letras en círculos con física
   Referencia: LiveTrack / LTSB style
   ===================================================== */
class LetterPhysics extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.circles = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['letter-physics'];
    const letters = params.text.replace(/\s+/g, '').toUpperCase().split('');
    const r = params.circleSize;
    const b = this.getBounds();
    this.p.randomSeed(this.state.anim.seed);
    this.circles = letters.map(char => ({
      x:    this.p.random(b.x + r * 2, b.x + b.w - r * 2),
      y:    this.p.random(b.y + r * 2, b.y + b.h - r * 2),
      vx:   this.p.random(-1.5, 1.5),
      vy:   this.p.random(-1, 1),
      r:    r,
      char: char
    }));
  }

  advanceState() {
    const params = this.state.anim.params['letter-physics'];
    const spd  = this.state.anim.speed;
    const b    = this.getBounds();
    const g    = params.gravity * 0.08 * spd;
    const fric = params.friction;
    const rep  = params.repulsion;

    for (const c of this.circles) {
      // Gravedad y fricción
      c.vy += g;
      c.vx *= fric;
      c.vy *= fric;
      // Movimiento
      c.x  += c.vx * spd;
      c.y  += c.vy * spd;
      // Rebotar en límites
      if (c.x - c.r < b.x)          { c.x = b.x + c.r;          c.vx = Math.abs(c.vx) * 0.85; }
      if (c.x + c.r > b.x + b.w)    { c.x = b.x + b.w - c.r;    c.vx = -Math.abs(c.vx) * 0.85; }
      if (c.y - c.r < b.y)          { c.y = b.y + c.r;           c.vy = Math.abs(c.vy) * 0.85; }
      if (c.y + c.r > b.y + b.h)    { c.y = b.y + b.h - c.r;    c.vy = -Math.abs(c.vy) * 0.85; }
      // Repulsión del mouse
      const dx = c.x - this.mx;
      const dy = c.y - this.my;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < rep && d > 0) {
        const force = ((rep - d) / rep) * 4 * spd;
        c.vx += (dx / d) * force;
        c.vy += (dy / d) * force;
      }
    }
    // Colisiones entre círculos (O(n²), n≤30 → viable)
    for (let i = 0; i < this.circles.length; i++) {
      for (let j = i + 1; j < this.circles.length; j++) {
        resolveCircleCollision(this.circles[i], this.circles[j]);
      }
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['letter-physics'];
    const [r, g, b] = this.getAnimRgb();

    p.noFill();
    for (const c of this.circles) {
      // Círculo
      p.stroke(r, g, b, 220);
      p.strokeWeight(1.5);
      p.ellipse(c.x, c.y, c.r * 2, c.r * 2);
      // Letra
      p.noStroke();
      p.fill(r, g, b, 255);
      p.drawingContext.font = `700 ${Math.round(c.r * 0.9)}px 'Space Mono', monospace`;
      p.drawingContext.textAlign    = 'center';
      p.drawingContext.textBaseline = 'middle';
      p.drawingContext.fillStyle = `rgb(${r},${g},${b})`;
      p.drawingContext.fillText(c.char, c.x, c.y);
      // Etiquetas de coordenadas
      if (params.showLabels) {
        p.drawingContext.font         = `400 9px 'Space Mono', monospace`;
        p.drawingContext.fillStyle    = `rgba(${r},${g},${b},0.5)`;
        p.drawingContext.textBaseline = 'top';
        p.drawingContext.fillText(`${Math.round(c.x)},${Math.round(c.y)}`, c.x, c.y + c.r + 3);
      }
    }
  }

  handleMouse(cx, cy, type) {
    super.handleMouse(cx, cy, type);
    if (type === 'press') this.reset();
  }
}

/* =====================================================
   2. PARTICLE NETWORK — Red de partículas conectadas
   ===================================================== */
class ParticleNetwork extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.particles = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['particle-network'];
    const b = this.getBounds();
    this.p.randomSeed(this.state.anim.seed);
    this.particles = Array.from({ length: params.count }, () => ({
      x:  this.p.random(b.x, b.x + b.w),
      y:  this.p.random(b.y, b.y + b.h),
      vx: this.p.random(-params.speed, params.speed),
      vy: this.p.random(-params.speed, params.speed)
    }));
  }

  advanceState() {
    const params = this.state.anim.params['particle-network'];
    const spd = this.state.anim.speed;
    const b   = this.getBounds();

    if (this.particles.length !== params.count) this.reset();

    for (const pt of this.particles) {
      pt.x += pt.vx * spd;
      pt.y += pt.vy * spd;
      if (pt.x < b.x)          { pt.x = b.x;          pt.vx *= -1; }
      if (pt.x > b.x + b.w)    { pt.x = b.x + b.w;    pt.vx *= -1; }
      if (pt.y < b.y)          { pt.y = b.y;           pt.vy *= -1; }
      if (pt.y > b.y + b.h)    { pt.y = b.y + b.h;     pt.vy *= -1; }

      // Atracción leve hacia el mouse
      const dx = this.mx - pt.x;
      const dy = this.my - pt.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 200 && d > 0) {
        pt.vx += (dx / d) * 0.08 * spd;
        pt.vy += (dy / d) * 0.08 * spd;
        // Limitar velocidad
        const mag = Math.sqrt(pt.vx*pt.vx + pt.vy*pt.vy);
        if (mag > params.speed * 3) {
          pt.vx = (pt.vx / mag) * params.speed * 3;
          pt.vy = (pt.vy / mag) * params.speed * 3;
        }
      }
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['particle-network'];
    const [r, g, b] = this.getAnimRgb();
    const dist   = params.distance;
    const ps     = params.pointSize;

    // Conexiones
    p.strokeWeight(0.6);
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[j].x - this.particles[i].x;
        const dy = this.particles[j].y - this.particles[i].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < dist) {
          const alpha = p.map(d, 0, dist, 200, 0);
          p.stroke(r, g, b, alpha);
          p.line(this.particles[i].x, this.particles[i].y,
                 this.particles[j].x, this.particles[j].y);
        }
      }
    }
    // Puntos
    p.noStroke();
    for (const pt of this.particles) {
      p.fill(r, g, b, 220);
      p.ellipse(pt.x, pt.y, ps * 2, ps * 2);
    }
    // Punto temporal del mouse
    p.stroke(r, g, b, 150);
    p.strokeWeight(0.5);
    for (const pt of this.particles) {
      const dx = pt.x - this.mx;
      const dy = pt.y - this.my;
      const d  = Math.sqrt(dx*dx+dy*dy);
      if (d < dist * 0.6) {
        const alpha = p.map(d, 0, dist * 0.6, 180, 0);
        p.stroke(r, g, b, alpha);
        p.line(this.mx, this.my, pt.x, pt.y);
      }
    }
  }
}

/* =====================================================
   3. FLOW FIELD — Campo de flujo Perlin noise
   ===================================================== */
class FlowField extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.particles = [];
    this.buffer    = null;
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['flow-field'];
    const b = this.getBounds();
    this.p.randomSeed(this.state.anim.seed);
    this.particles = Array.from({ length: 300 }, () => ({
      x:  this.p.random(b.x, b.x + b.w),
      y:  this.p.random(b.y, b.y + b.h),
      age: 0
    }));
    // Buffer persistente para rastros
    if (!this.buffer) {
      this.buffer = this.p.createGraphics(CANVAS_W, CANVAS_H);
    }
    const [bgR, bgG, bgB] = this.getBg();
    this.buffer.background(bgR, bgG, bgB);
    this.noiseZ = 0;
  }

  advanceState() {
    const params   = this.state.anim.params['flow-field'];
    const spd      = this.state.anim.speed;
    const b        = this.getBounds();
    const ns       = params.noiseScale;
    const maxAge   = params.trailLength;
    this.noiseZ   += 0.003 * spd;

    for (const pt of this.particles) {
      const n     = this.p.noise(pt.x * ns, pt.y * ns, this.noiseZ);
      const angle = n * this.p.TWO_PI * 2;

      // Distorsión local del mouse
      const dx = this.mx - pt.x;
      const dy = this.my - pt.y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      const distortAngle = d < 120 ? Math.atan2(dy, dx) + this.p.PI * 0.5 : 0;
      const blend = d < 120 ? (1 - d/120) * 0.6 : 0;
      const finalAngle = angle * (1 - blend) + distortAngle * blend;

      pt.px  = pt.x;
      pt.py  = pt.y;
      pt.x  += Math.cos(finalAngle) * params.speed * spd;
      pt.y  += Math.sin(finalAngle) * params.speed * spd;
      pt.age++;

      // Reiniciar partícula al salir del área o por edad
      if (pt.x < b.x || pt.x > b.x + b.w || pt.y < b.y || pt.y > b.y + b.h || pt.age > maxAge) {
        pt.x   = this.p.random(b.x, b.x + b.w);
        pt.y   = this.p.random(b.y, b.y + b.h);
        pt.age = 0;
      }
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['flow-field'];
    const [r, g, b] = this.getAnimRgb();
    const [bgR, bgG, bgB] = this.getBg();
    const buf    = this.buffer;

    // Desvanecer el buffer con el color de fondo
    buf.fill(bgR, bgG, bgB, 18);
    buf.noStroke();
    buf.rect(0, 0, CANVAS_W, CANVAS_H);

    // Dibujar rastros en el buffer
    buf.strokeWeight(1);
    for (const pt of this.particles) {
      if (pt.px === undefined) continue;
      const alpha = p.map(pt.age, 0, params.trailLength, 180, 0);
      buf.stroke(r, g, b, alpha);
      buf.line(pt.px, pt.py, pt.x, pt.y);
    }

    // Composite del buffer al canvas principal
    p.image(buf, 0, 0);
  }
}

/* =====================================================
   4. GRID DISTORTION — Grilla deformable con mouse
   ===================================================== */
class GridDistortion extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.points = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['grid-distortion'];
    const b      = this.getBounds();
    const n      = params.density;
    const stepX  = b.w / n;
    const stepY  = (b.h / n) * (b.h / b.w);
    this.points  = [];
    for (let iy = 0; iy <= Math.floor(b.h / stepY); iy++) {
      for (let ix = 0; ix <= n; ix++) {
        this.points.push({
          ox: b.x + ix * stepX, // posición original
          oy: b.y + iy * stepY,
          x:  b.x + ix * stepX, // posición actual
          y:  b.y + iy * stepY,
          vx: 0, vy: 0,
          cols: n + 1,
          row:  iy,
          col:  ix
        });
      }
    }
    this.cols = n + 1;
  }

  advanceState() {
    const params = this.state.anim.params['grid-distortion'];
    const rad    = params.radius;
    const force  = params.force;
    const spring = 0.08;
    const damp   = 0.85;

    for (const pt of this.points) {
      const dx = this.mx - pt.ox;
      const dy = this.my - pt.oy;
      const d  = Math.sqrt(dx*dx + dy*dy);
      // Empuje radial desde el mouse
      let fx = 0, fy = 0;
      if (d < rad && d > 0) {
        const strength = (1 - d / rad) * force;
        fx = -(dx / d) * strength;
        fy = -(dy / d) * strength;
      }
      // Resorte de retorno a posición original
      fx += (pt.ox - pt.x) * spring;
      fy += (pt.oy - pt.y) * spring;

      pt.vx = (pt.vx + fx * 0.016) * damp;
      pt.vy = (pt.vy + fy * 0.016) * damp;
      pt.x += pt.vx;
      pt.y += pt.vy;
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['grid-distortion'];
    const [r, g, b] = this.getAnimRgb();
    const n      = this.cols;

    p.noFill();
    p.stroke(r, g, b, 160);
    p.strokeWeight(0.8);

    if (params.showLines && n > 0) {
      for (let i = 0; i < this.points.length; i++) {
        const pt  = this.points[i];
        // Línea horizontal
        if ((i % n) < n - 1) {
          const right = this.points[i + 1];
          if (right) p.line(pt.x, pt.y, right.x, right.y);
        }
        // Línea vertical
        const below = this.points[i + n];
        if (below) p.line(pt.x, pt.y, below.x, below.y);
      }
    }

    // Puntos
    p.noStroke();
    p.fill(r, g, b, 200);
    for (const pt of this.points) {
      p.ellipse(pt.x, pt.y, 3, 3);
    }
  }
}

/* =====================================================
   5. BOUNCING SHAPES — Formas con gravedad y rebote
   ===================================================== */
class BouncingShapes extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.shapes = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['bouncing-shapes'];
    const b      = this.getBounds();
    this.p.randomSeed(this.state.anim.seed);
    this.shapes  = Array.from({ length: params.count }, (_, i) => {
      const shapeTypes = [];
      if (params.shapes.circle)   shapeTypes.push('circle');
      if (params.shapes.square)   shapeTypes.push('square');
      if (params.shapes.triangle) shapeTypes.push('triangle');
      const type = shapeTypes[Math.floor(this.p.random(shapeTypes.length))] || 'circle';
      return {
        x:    this.p.random(b.x + 30, b.x + b.w - 30),
        y:    this.p.random(b.y, b.y + b.h * 0.5),
        vx:   this.p.random(-2, 2),
        vy:   this.p.random(-1, 1),
        r:    params.size,
        type: type,
        rot:  this.p.random(this.p.TWO_PI),
        rotV: this.p.random(-0.04, 0.04),
        label: 'PCDSTG2026'.charAt(i % 10)
      };
    });
  }

  advanceState() {
    const params = this.state.anim.params['bouncing-shapes'];
    const spd    = this.state.anim.speed;
    const b      = this.getBounds();
    const g      = params.gravity * 0.12 * spd;
    const e      = params.elasticity;

    for (const s of this.shapes) {
      s.vy += g;
      s.x  += s.vx * spd;
      s.y  += s.vy * spd;
      s.rot += s.rotV * spd;

      // Mouse push
      const dx = s.x - this.mx;
      const dy = s.y - this.my;
      const d  = Math.sqrt(dx*dx+dy*dy);
      if (d < 100 && d > 0) {
        s.vx += (dx/d) * 3 * spd;
        s.vy += (dy/d) * 3 * spd;
      }

      // Rebotes en límites
      if (s.x - s.r < b.x)        { s.x = b.x + s.r;          s.vx = Math.abs(s.vx) * e; }
      if (s.x + s.r > b.x + b.w)  { s.x = b.x + b.w - s.r;    s.vx = -Math.abs(s.vx) * e; }
      if (s.y - s.r < b.y)        { s.y = b.y + s.r;           s.vy = Math.abs(s.vy) * e; }
      if (s.y + s.r > b.y + b.h)  { s.y = b.y + b.h - s.r;    s.vy = -Math.abs(s.vy) * e * 0.8; s.vx *= 0.98; }
    }

    // Colisiones entre formas
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = i+1; j < this.shapes.length; j++) {
        resolveCircleCollision(this.shapes[i], this.shapes[j], params.elasticity);
      }
    }
  }

  render() {
    const p      = this.p;
    const [r, g, b] = this.getAnimRgb();

    p.stroke(r, g, b, 200);
    p.strokeWeight(1.5);
    p.noFill();

    for (const s of this.shapes) {
      p.push();
      p.translate(s.x, s.y);
      p.rotate(s.rot);
      const sz = s.r;

      if (s.type === 'circle') {
        p.ellipse(0, 0, sz * 2, sz * 2);
      } else if (s.type === 'square') {
        p.rect(-sz, -sz, sz * 2, sz * 2);
      } else {
        p.triangle(0, -sz, -sz * 0.866, sz * 0.5, sz * 0.866, sz * 0.5);
      }

      // Letra/símbolo interior
      p.fill(r, g, b, 200);
      p.noStroke();
      p.drawingContext.font         = `700 ${Math.round(sz * 0.7)}px 'Space Mono', monospace`;
      p.drawingContext.textAlign    = 'center';
      p.drawingContext.textBaseline = 'middle';
      p.drawingContext.fillStyle    = `rgba(${r},${g},${b},0.9)`;
      p.drawingContext.fillText(s.label, 0, 0);
      p.pop();
    }
  }
}

/* =====================================================
   6. WAVE INTERFERENCE — Interferencia de ondas
   ===================================================== */
class WaveInterference extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.emitters = [];
    this.t = 0;
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['wave-interference'];
    this.p.randomSeed(this.state.anim.seed);
    this.emitters = Array.from({ length: params.emitters }, (_, i) => ({
      x: CANVAS_W * (i + 1) / (params.emitters + 1),
      y: CANVAS_H * 0.5 + this.p.random(-100, 100)
    }));
    this.t = 0;
  }

  advanceState() {
    this.t += 0.04 * this.state.anim.speed;
    // El primer emisor sigue al mouse suavemente
    if (this.emitters.length > 0) {
      this.emitters[0].x += (this.mx - this.emitters[0].x) * 0.05;
      this.emitters[0].y += (this.my - this.emitters[0].y) * 0.05;
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['wave-interference'];
    const [r, g, b] = this.getAnimRgb();
    const res    = params.resolution;
    const freq   = params.frequency;
    const amp    = params.amplitude;

    p.noStroke();
    for (let x = 0; x < CANVAS_W; x += res) {
      for (let y = 0; y < CANVAS_H; y += res) {
        let sum = 0;
        for (const em of this.emitters) {
          const dx = x - em.x;
          const dy = y - em.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          sum += Math.sin(d * freq - this.t) * amp;
        }
        const v = Math.sin(sum * 0.04);
        const alpha = (v * 0.5 + 0.5) * 200;
        p.fill(r, g, b, alpha);
        p.rect(x, y, res, res);
      }
    }
    // Indicadores de los emisores
    p.stroke(r, g, b, 200);
    p.strokeWeight(1);
    p.noFill();
    for (const em of this.emitters) {
      p.ellipse(em.x, em.y, 12, 12);
    }
  }
}

/* =====================================================
   7. CODE RAIN — Lluvia de código Processing/p5.js
   ===================================================== */
const CODE_CHARSETS = {
  p5js:    ['ellipse','rect','fill','stroke','setup','draw','mouseX','mouseY','noise','random','vertex','beginShape','endShape','translate','rotate','scale','push','pop','map','dist','lerp'].join(''),
  latin:   'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  katakana:'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ',
  numbers: '0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
};

class CodeRain extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.drops  = [];
    this.buffer = null;
    this.reset();
  }

  reset() {
    const params  = this.state.anim.params['code-rain'];
    const colW    = 18;
    const cols    = Math.floor(CANVAS_W / colW);
    this.p.randomSeed(this.state.anim.seed);
    this.drops    = Array.from({ length: cols }, () => this.p.random(-CANVAS_H, 0));
    this.colW     = colW;
    if (!this.buffer) {
      this.buffer = this.p.createGraphics(CANVAS_W, CANVAS_H);
    }
    const [bgR, bgG, bgB] = this.getBg();
    this.buffer.background(bgR, bgG, bgB);
  }

  advanceState() {
    const params = this.state.anim.params['code-rain'];
    const spd    = this.state.anim.speed;
    const colW   = this.colW;

    // Fade del buffer
    const [bgR, bgG, bgB] = this.getBg();
    this.buffer.fill(bgR, bgG, bgB, 22);
    this.buffer.noStroke();
    this.buffer.rect(0, 0, CANVAS_W, CANVAS_H);

    const charset = CODE_CHARSETS[params.charset] || CODE_CHARSETS.p5js;
    const [r, g, b] = this.getAnimRgb();
    const fontSize  = 14;
    this.buffer.textSize(fontSize);
    this.buffer.drawingContext.font         = `400 ${fontSize}px 'Space Mono', monospace`;
    this.buffer.drawingContext.textBaseline = 'top';

    for (let i = 0; i < this.drops.length; i++) {
      const ch = charset[Math.floor(Math.random() * charset.length)];
      const x  = i * colW;
      const y  = this.drops[i];

      // Velocidad en zona cercana al mouse aumenta
      const dx   = x - this.mx;
      const dist = Math.abs(dx);
      const vel  = params.dropSpeed * spd * (1 + (dist < 80 ? 1.5 : 0));

      // Carácter principal brillante
      this.buffer.drawingContext.fillStyle = `rgba(${r},${g},${b},1)`;
      this.buffer.drawingContext.fillText(ch, x, y);
      // Carácter previo más oscuro
      const ch2 = charset[Math.floor(Math.random() * charset.length)];
      this.buffer.drawingContext.fillStyle = `rgba(${r},${g},${b},0.4)`;
      this.buffer.drawingContext.fillText(ch2, x, y - fontSize);

      this.drops[i] += vel;
      if (this.drops[i] > CANVAS_H && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
    }
  }

  render() {
    this.p.image(this.buffer, 0, 0);
  }
}

/* =====================================================
   8. CONSTELLATION — Constelaciones dinámicas
   ===================================================== */
class Constellation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.stars = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['constellation'];
    const b      = this.getBounds();
    this.p.randomSeed(this.state.anim.seed);
    this.stars   = Array.from({ length: params.count }, () => ({
      x:  this.p.random(b.x, b.x + b.w),
      y:  this.p.random(b.y, b.y + b.h),
      vx: this.p.random(-params.speed, params.speed),
      vy: this.p.random(-params.speed, params.speed),
      r:  this.p.random(1, params.pointSize)
    }));
  }

  advanceState() {
    const params = this.state.anim.params['constellation'];
    const spd    = this.state.anim.speed;
    const b      = this.getBounds();

    if (this.stars.length !== params.count) this.reset();

    for (const s of this.stars) {
      s.x += s.vx * spd;
      s.y += s.vy * spd;
      if (s.x < b.x)       { s.x = b.x;       s.vx *= -1; }
      if (s.x > b.x + b.w) { s.x = b.x + b.w; s.vx *= -1; }
      if (s.y < b.y)        { s.y = b.y;       s.vy *= -1; }
      if (s.y > b.y + b.h) { s.y = b.y + b.h; s.vy *= -1; }
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['constellation'];
    const [r, g, b] = this.getAnimRgb();
    const dist   = params.distance;

    // Conexiones
    p.strokeWeight(0.5);
    for (let i = 0; i < this.stars.length; i++) {
      for (let j = i + 1; j < this.stars.length; j++) {
        const dx = this.stars[j].x - this.stars[i].x;
        const dy = this.stars[j].y - this.stars[i].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < dist) {
          const alpha = p.map(d, 0, dist, 150, 0);
          p.stroke(r, g, b, alpha);
          p.line(this.stars[i].x, this.stars[i].y, this.stars[j].x, this.stars[j].y);
        }
      }
      // Conexión al mouse
      const dx = this.mx - this.stars[i].x;
      const dy = this.my - this.stars[i].y;
      const d  = Math.sqrt(dx*dx+dy*dy);
      if (d < dist * 0.8) {
        const alpha = p.map(d, 0, dist * 0.8, 200, 0);
        p.stroke(r, g, b, alpha);
        p.line(this.stars[i].x, this.stars[i].y, this.mx, this.my);
      }
    }
    // Estrellas
    p.noStroke();
    for (const s of this.stars) {
      p.fill(r, g, b, 230);
      p.ellipse(s.x, s.y, s.r * 2, s.r * 2);
    }
    // Punto del mouse
    p.fill(r, g, b, 180);
    p.ellipse(this.mx, this.my, 6, 6);
  }
}

/* =====================================================
   9. ELASTIC MESH — Malla elástica con resortes
   ===================================================== */
class ElasticMesh extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.nodes  = [];
    this.dragIdx = -1;
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['elastic-mesh'];
    const b      = this.getBounds();
    const cols   = params.resX;
    const rows   = params.resY;
    const stepX  = b.w / (cols - 1);
    const stepY  = b.h / (rows - 1);
    this.cols    = cols;
    this.rows    = rows;
    this.nodes   = [];

    for (let iy = 0; iy < rows; iy++) {
      for (let ix = 0; ix < cols; ix++) {
        const ox = b.x + ix * stepX;
        const oy = b.y + iy * stepY;
        this.nodes.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 });
      }
    }
  }

  advanceState() {
    const params  = this.state.anim.params['elastic-mesh'];
    const k       = params.stiffness;
    const damp    = params.damping;
    const cols    = this.cols;

    // Si arrastrando, mover nodo seleccionado
    if (this.dragIdx >= 0) {
      const n = this.nodes[this.dragIdx];
      n.x = this.mx;
      n.y = this.my;
      n.vx = 0; n.vy = 0;
    }

    for (let i = 0; i < this.nodes.length; i++) {
      if (i === this.dragIdx) continue;
      const n  = this.nodes[i];
      let fx   = (n.ox - n.x) * k; // resorte al origen
      let fy   = (n.oy - n.y) * k;

      // Influencia de vecinos
      const neighbors = [i-1, i+1, i-cols, i+cols];
      for (const ni of neighbors) {
        if (ni < 0 || ni >= this.nodes.length) continue;
        const nb = this.nodes[ni];
        const dx = nb.x - n.x;
        const dy = nb.y - n.y;
        fx += dx * k * 0.3;
        fy += dy * k * 0.3;
      }

      n.vx = (n.vx + fx) * damp;
      n.vy = (n.vy + fy) * damp;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['elastic-mesh'];
    const [r, g, b] = this.getAnimRgb();
    const cols   = this.cols;

    p.stroke(r, g, b, 150);
    p.strokeWeight(params.lineWeight);
    p.noFill();

    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if ((i % cols) < cols - 1) {
        const right = this.nodes[i + 1];
        if (right) p.line(n.x, n.y, right.x, right.y);
      }
      const below = this.nodes[i + cols];
      if (below) p.line(n.x, n.y, below.x, below.y);
    }

    // Nodo dragging
    if (this.dragIdx >= 0) {
      const n = this.nodes[this.dragIdx];
      p.fill(r, g, b, 220);
      p.noStroke();
      p.ellipse(n.x, n.y, 12, 12);
    }
  }

  handleMouse(cx, cy, type) {
    super.handleMouse(cx, cy, type);
    if (type === 'press') {
      let minD = 40;
      this.dragIdx = -1;
      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        const d = Math.sqrt((cx-n.x)**2 + (cy-n.y)**2);
        if (d < minD) { minD = d; this.dragIdx = i; }
      }
    }
    if (type === 'release') this.dragIdx = -1;
  }
}

/* =====================================================
   10. ROTATING TYPOGRAPHY — Tipografía cinética
   ===================================================== */
class RotatingTypography extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.letters = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['rotating-typography'];
    const b      = this.getBounds();
    this.p.randomSeed(this.state.anim.seed);
    const chars  = params.text.toUpperCase().replace(/\s+/g, '').split('');

    if (params.distribution === 'grid') {
      const cols  = Math.ceil(Math.sqrt(chars.length * b.w / b.h));
      const rows  = Math.ceil(chars.length / cols);
      const stepX = b.w / cols;
      const stepY = b.h / rows;
      this.letters = chars.map((ch, i) => ({
        x:     b.x + (i % cols + 0.5) * stepX,
        y:     b.y + (Math.floor(i / cols) + 0.5) * stepY,
        ch,
        rot:   this.p.random(this.p.TWO_PI),
        rotV:  this.p.random(-0.02, 0.02) * params.speed
      }));
    } else if (params.distribution === 'circular') {
      this.letters = chars.map((ch, i) => {
        const angle = (i / chars.length) * this.p.TWO_PI;
        const rx    = b.w * 0.35;
        const ry    = b.h * 0.35;
        return {
          x: b.x + b.w * 0.5 + Math.cos(angle) * rx,
          y: b.y + b.h * 0.5 + Math.sin(angle) * ry,
          ch, rot: angle,
          rotV: this.p.random(-0.02, 0.02) * params.speed
        };
      });
    } else {
      this.letters = chars.map(ch => ({
        x:    this.p.random(b.x + 30, b.x + b.w - 30),
        y:    this.p.random(b.y + 30, b.y + b.h - 30),
        ch,
        rot:  this.p.random(this.p.TWO_PI),
        rotV: this.p.random(-0.02, 0.02) * params.speed
      }));
    }
  }

  advanceState() {
    const params = this.state.anim.params['rotating-typography'];
    const spd    = this.state.anim.speed;

    for (const lt of this.letters) {
      // Rotación más rápida cerca del mouse
      const dx    = this.mx - lt.x;
      const dy    = this.my - lt.y;
      const d     = Math.sqrt(dx*dx + dy*dy);
      const boost = d < 150 ? (1 - d/150) * 5 : 0;
      lt.rot += (lt.rotV + Math.sign(lt.rotV) * boost) * spd;
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['rotating-typography'];
    const [r, g, b] = this.getAnimRgb();
    const sz     = params.letterSize;

    p.drawingContext.font      = `700 ${sz}px 'Space Mono', monospace`;
    p.drawingContext.textAlign = 'center';

    for (const lt of this.letters) {
      p.push();
      p.translate(lt.x, lt.y);
      p.rotate(lt.rot);
      p.drawingContext.fillStyle    = `rgba(${r},${g},${b},0.9)`;
      p.drawingContext.textBaseline = 'middle';
      p.drawingContext.fillText(lt.ch, 0, 0);
      p.pop();
    }
  }
}

/* =====================================================
   REGISTRO DE ANIMACIONES
   ===================================================== */
const ANIMATIONS = {
  'letter-physics':       LetterPhysics,
  'particle-network':     ParticleNetwork,
  'flow-field':           FlowField,
  'grid-distortion':      GridDistortion,
  'bouncing-shapes':      BouncingShapes,
  'wave-interference':    WaveInterference,
  'code-rain':            CodeRain,
  'constellation':        Constellation,
  'elastic-mesh':         ElasticMesh,
  'rotating-typography':  RotatingTypography
};
