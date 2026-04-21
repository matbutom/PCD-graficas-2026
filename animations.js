/* =====================================================
   ANIMATIONS.JS — Processing Community Day 2026
   Todas las animaciones giran en torno a "CONVOCATORIA ABIERTA"
   ===================================================== */

/* =====================================================
   CONSTANTES GLOBALES DE LAYOUT
   ===================================================== */
let CANVAS_W = 1080;
let CANVAS_H = 1350;
const MARGIN   = 40;

const ZONES = {
  topBar:    { y: 0,    h: 40   },
  json:      { y: 40,   h: 635  },
  anim:      { y: 620,  h: 212  },  // fila 3 del grid — espacio en blanco entre info y título
  title:     { y: 887,  h: 423  },
  bottomBar: { y: 1310, h: 40   }
};

// Llamado desde app.js al cambiar formato (IG ↔ Banner)
function setCanvasSize(w, h) { CANVAS_W = w; CANVAS_H = h; }

/* =====================================================
   CONSTANTES DEL MENSAJE
   ===================================================== */
const MESSAGE       = 'CONVOCATORIA ABIERTA';
const MESSAGE_WORDS = ['CONVOCATORIA', 'ABIERTA'];
const MESSAGE_CHARS = MESSAGE.replace(' ', '').split('');
// ['C','O','N','V','O','C','A','T','O','R','I','A','A','B','I','E','R','T','A']

/* =====================================================
   UTILIDADES COMPARTIDAS
   ===================================================== */

// Retorna las posiciones target de cada char del mensaje
// dispuesto en 2 líneas centradas dentro de bounds b
function getMessageLayout(b, fontSize) {
  const charW = fontSize * 0.62;
  const lineH = fontSize * 1.35;
  const w1    = MESSAGE_WORDS[0].length * charW;
  const w2    = MESSAGE_WORDS[1].length * charW;
  const cy    = b.y + b.h * 0.5;
  const pos   = [];
  for (let i = 0; i < MESSAGE_WORDS[0].length; i++) {
    pos.push({
      tx:   b.x + b.w * 0.5 - w1 * 0.5 + i * charW + charW * 0.5,
      ty:   cy - lineH * 0.5,
      word: 0
    });
  }
  for (let i = 0; i < MESSAGE_WORDS[1].length; i++) {
    pos.push({
      tx:   b.x + b.w * 0.5 - w2 * 0.5 + i * charW + charW * 0.5,
      ty:   cy + lineH * 0.5,
      word: 1
    });
  }
  return pos;
}

// Construye el string de fuente leyendo del estado global
// Para animaciones usa state.anim.font; el title sigue usando state.title.font
function getFont(state, size) {
  const f = (state.anim && state.anim.font) ? state.anim.font :
            (state.title && state.title.font) ? state.title.font : 'Space Mono';
  const w = (state.anim && state.anim.fontWeight) ? state.anim.fontWeight : '700';
  return `${w} ${Math.round(size)}px '${f}', sans-serif`;
}

/* =====================================================
   VECTOR 2D — utilidades físicas
   ===================================================== */
class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  clone()           { return new Vec2(this.x, this.y); }
  add(v)            { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v)            { return new Vec2(this.x - v.x, this.y - v.y); }
  scale(s)          { return new Vec2(this.x * s,   this.y * s); }
  mag()             { return Math.sqrt(this.x * this.x + this.y * this.y); }
  norm()            { const m = this.mag(); return m > 0 ? this.scale(1/m) : new Vec2(); }
  dot(v)            { return this.x * v.x + this.y * v.y; }
  static dist(a, b) { return a.sub(b).mag(); }
}

function resolveCircleCollision(a, b, restitution = 0.75) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d  = Math.sqrt(dx*dx + dy*dy);
  const minD = a.r + b.r;
  if (d >= minD || d === 0) return;
  const nx = dx/d, ny = dy/d;
  const overlap = (minD - d) * 0.5;
  a.x -= nx*overlap; a.y -= ny*overlap;
  b.x += nx*overlap; b.y += ny*overlap;
  const dvn = (b.vx-a.vx)*nx + (b.vy-a.vy)*ny;
  if (dvn >= 0) return;
  const j = -(1+restitution)*dvn*0.5;
  a.vx -= j*nx; a.vy -= j*ny;
  b.vx += j*nx; b.vy += j*ny;
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1,3), 16),
    parseInt(hex.slice(3,5), 16),
    parseInt(hex.slice(5,7), 16)
  ];
}

/* =====================================================
   CLASE BASE
   ===================================================== */
class BaseAnimation {
  constructor(p, state) {
    this.p     = p;
    this.state = state;
    this.mx    = CANVAS_W / 2;
    this.my    = CANVAS_H / 2;
  }

  getBounds() {
    if (this.state.anim.fullCanvas) return { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H };
    return { x: 0, y: ZONES.anim.y, w: CANVAS_W, h: ZONES.anim.h };
  }

  // Siempre devuelve el hueco en blanco entre info y título,
  // independientemente de fullCanvas. Se usa para centrar posiciones target.
  // En modo banner (canvas < zona anim) centra en el canvas.
  getAnimZone() {
    if (CANVAS_H < ZONES.anim.y + ZONES.anim.h) {
      const zH = Math.round(CANVAS_H * 0.55);
      const zY = Math.round((CANVAS_H - zH) / 2);
      return { x: 0, y: zY, w: CANVAS_W, h: zH };
    }
    return { x: 0, y: ZONES.anim.y, w: CANVAS_W, h: ZONES.anim.h };
  }

  getFg()      { return hexToRgb(this.state.preset.fg); }
  getBg()      { return hexToRgb(this.state.preset.bg); }
  getAnimRgb() {
    // Fallback: si animColor no contrasta bien con bg, usar fg
    const anim = hexToRgb(this.state.preset.animColor);
    const bg   = hexToRgb(this.state.preset.bg);
    const lumA = (anim[0]*0.299 + anim[1]*0.587 + anim[2]*0.114) / 255;
    const lumB = (bg[0]*0.299   + bg[1]*0.587   + bg[2]*0.114)   / 255;
    if (Math.abs(lumA - lumB) < 0.22) return hexToRgb(this.state.preset.fg);
    return anim;
  }
  getTextSize() { return this.state.anim.textSize || 48; }

  draw() {
    if (this.state.playing) this.advanceState();
    this.render();
  }

  advanceState()  {}
  render()        {}
  reset()         {}
  getPosterAlpha() { return 1; }   // override to control editorial overlay timing
  handleMouse(cx, cy, type) { this.mx = cx; this.my = cy; }
}

/* =====================================================
   1. LETTER PHYSICS — Letras de CONVOCATORIA ABIERTA con física
   TRIGGER DE LECTURA: proximidad del mouse → letras se atraen hacia su posición
   correcta. Doble click → snap inmediato al mensaje legible.
   ===================================================== */
class LetterPhysics extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.circles  = [];
    this.noiseZ   = 0;
    this.snapMode = false;
    this.snapT    = 0;
    this._lastClick = 0;
    this.reset();
  }

  getAnimZone() {
    const base = super.getAnimZone();
    // Push target positions ~180px lower so animation starts in the lower half
    const offset = 180;
    return { x: base.x, y: base.y + offset, w: base.w, h: base.h };
  }

  reset() {
    const params = this.state.anim.params['letter-physics'];
    const r  = params.circleSize;
    const sz = this.getTextSize();
    this.p.randomSeed(this.state.anim.seed);
    const layout = getMessageLayout(this.getAnimZone(), sz);
    this.noiseZ    = 0;
    this.snapMode  = false;
    this.physTimer = 0;  // frames in physics phase

    // Typewriter intro state
    this.phase   = 'typewriter'; // 'typewriter' | 'physics' | 'return'
    this.twIdx   = 0;
    this.twTimer = 0;
    this.retT    = 0;   // 0→1 lerp progress for return phase

    this.circles = MESSAGE_CHARS.map((char, i) => ({
      x:    layout[i].tx,
      y:    layout[i].ty,
      vx:   0,
      vy:   0,
      r,
      char,
      tx:   layout[i].tx,
      ty:   layout[i].ty,
      word: layout[i].word
    }));
  }

  advanceState() {
    const params = this.state.anim.params['letter-physics'];
    const spd  = this.state.anim.speed;
    const b    = this.getBounds();
    const fric = params.friction;
    const maxV = 4 * spd;
    this.noiseZ += 0.006 * spd;

    // ── Fase typewriter ──────────────────────────────────────────
    // Timings fixed in frames so total always = 300 frames (10s @ 30fps):
    //   typewriter: 3 frames/letter × 19 = 57 + 18 pause = 75 frames (2.5s)
    //   physics:    150 frames (5s)
    //   return:     75 frames (2.5s)
    if (this.phase === 'typewriter') {
      this.twTimer++;
      const twDelay  = 3;   // fixed: frames per letter
      const pauseDur = 18;  // fixed: pause after last letter

      if (this.twIdx < this.circles.length) {
        // Revelar siguiente letra
        if (this.twTimer >= twDelay) {
          this.twIdx++;
          this.twTimer = 0;
        }
      } else {
        // Todas reveladas → esperar y luego lanzar física
        if (this.twTimer >= pauseDur) {
          this.phase = 'physics';
          this.physTimer = 0;
          this.p.randomSeed(this.state.anim.seed + 99);
          for (const c of this.circles) {
            c.vx = this.p.random(-2, 2);
            c.vy = this.p.random(-2, 2);
          }
        }
      }
      return;
    }
    // ─────────────────────────────────────────────────────────────

    // ── Fase return — easing de vuelta a posición inicial ────────
    if (this.phase === 'return') {
      const returnDur = 75; // 2.5s at 30fps — fixed, independent of speed (total loop = 300 frames = 10s)
      this.retT += 1 / returnDur;
      if (this.retT >= 1) {
        this.reset();
        return;
      }
      // Ease-in-out cubic
      const t = this.retT < 0.5
        ? 4 * this.retT * this.retT * this.retT
        : 1 - Math.pow(-2 * this.retT + 2, 3) / 2;
      for (const c of this.circles) {
        c.x = c.sx + (c.tx - c.sx) * t;
        c.y = c.sy + (c.ty - c.sy) * t;
        c.vx *= 0.85;
        c.vy *= 0.85;
      }
      return;
    }
    // ─────────────────────────────────────────────────────────────

    // Count physics frames and trigger return phase — fixed 5s
    this.physTimer++;
    const physicsDur = 150; // 5s at 30fps — fixed, independent of speed
    if (this.physTimer >= physicsDur) {
      // Snapshot current positions as start of return lerp
      for (const c of this.circles) { c.sx = c.x; c.sy = c.y; }
      this.phase = 'return';
      this.retT  = 0;
      return;
    }

    if (this.snapMode) {
      this.snapT += 0.05 * spd;
      if (this.snapT > 1) { this.snapMode = false; this.snapT = 1; }
    }

    for (const c of this.circles) {
      if (this.snapMode) {
        c.x  += (c.tx - c.x) * 0.1 * spd;
        c.y  += (c.ty - c.y) * 0.1 * spd;
        c.vx *= 0.82;
        c.vy *= 0.82;
      } else {
        const dx   = c.x - this.mx, dy = c.y - this.my;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 240 && dist > 0) {
          const t = 1 - dist / 240;
          c.vx += (c.tx - c.x) * t * 0.045 * spd;
          c.vy += (c.ty - c.y) * t * 0.045 * spd;
        } else {
          const angle = this.p.noise(c.x*0.0015, c.y*0.0015, this.noiseZ) * this.p.TWO_PI * 2;
          c.vx += Math.cos(angle) * 0.35 * spd;
          c.vy += Math.sin(angle) * 0.35 * spd;
        }
        const mag = Math.sqrt(c.vx*c.vx + c.vy*c.vy);
        if (mag > maxV) { c.vx = c.vx/mag*maxV; c.vy = c.vy/mag*maxV; }
        c.vx *= fric; c.vy *= fric;
        c.x  += c.vx;  c.y  += c.vy;
        if (c.x - c.r < b.x)       { c.x = b.x + c.r;       c.vx =  Math.abs(c.vx); }
        if (c.x + c.r > b.x + b.w) { c.x = b.x + b.w - c.r; c.vx = -Math.abs(c.vx); }
        if (c.y - c.r < b.y)       { c.y = b.y + c.r;        c.vy =  Math.abs(c.vy); }
        if (c.y + c.r > b.y + b.h) { c.y = b.y + b.h - c.r; c.vy = -Math.abs(c.vy); }
      }
    }
    for (let i = 0; i < this.circles.length; i++)
      for (let j = i+1; j < this.circles.length; j++)
        resolveCircleCollision(this.circles[i], this.circles[j]);
  }

  render() {
    const ctx     = this.p.drawingContext;
    const [r,g,b] = this.getAnimRgb();

    if (this.phase === 'typewriter') {
      // Solo letras ya reveladas
      for (let i = 0; i < this.twIdx; i++) {
        const c = this.circles[i];
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
        ctx.fillStyle   = `rgba(${r},${g},${b},0.12)`;
        ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`;
        ctx.lineWidth   = 1.5;
        ctx.fill();
        ctx.stroke();
        ctx.font         = getFont(this.state, Math.round(c.r * 0.88));
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = `rgba(${r},${g},${b},1)`;
        ctx.fillText(c.char, c.x, c.y);
        ctx.restore();
      }

      // Cursor parpadeante en la posición de la siguiente letra
      if (this.twIdx < this.circles.length) {
        const nc    = this.circles[this.twIdx];
        const blink = Math.floor(this.p.frameCount / 12) % 2 === 0;
        if (blink) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(nc.x, nc.y, nc.r, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
          ctx.lineWidth   = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          // Punto central
          ctx.beginPath();
          ctx.arc(nc.x, nc.y, nc.r * 0.12, 0, Math.PI*2);
          ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
          ctx.fill();
          ctx.restore();
        }
      }
      return;
    }

    // Fase physics / return — render normal
    for (const c of this.circles) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
      ctx.fillStyle   = `rgba(${r},${g},${b},0.12)`;
      ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`;
      ctx.lineWidth   = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.font         = getFont(this.state, Math.round(c.r * 0.88));
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = `rgba(${r},${g},${b},1)`;
      ctx.fillText(c.char, c.x, c.y);
      ctx.restore();
    }
  }

  handleMouse(cx, cy, type) {
    super.handleMouse(cx, cy, type);
    if (type === 'press') {
      const now = Date.now();
      if (now - this._lastClick < 350) { this.snapMode = true; this.snapT = 0; }
      this._lastClick = now;
    }
  }
}

/* =====================================================
   2. PARTICLE NETWORK — Red de letras del mensaje
   TRIGGER DE LECTURA: proximidad del mouse → letras convergen a posición target.
   Letras de la misma palabra tienen cohesión más fuerte.
   ===================================================== */
class ParticleNetwork extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.particles = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['particle-network'];
    const b  = this.getBounds();
    const sz = this.getTextSize();
    this.p.randomSeed(this.state.anim.seed);
    const layout = getMessageLayout(this.getAnimZone(), sz);
    this.particles = MESSAGE_CHARS.map((char, i) => ({
      x:    this.p.random(b.x, b.x + b.w),
      y:    this.p.random(b.y, b.y + b.h),
      vx:   this.p.random(-params.speed, params.speed),
      vy:   this.p.random(-params.speed, params.speed),
      char,
      tx:   layout[i].tx,
      ty:   layout[i].ty,
      word: layout[i].word
    }));
  }

  advanceState() {
    const params  = this.state.anim.params['particle-network'];
    const spd     = this.state.anim.speed;
    const b       = this.getBounds();
    const maxSpd  = params.speed * 3;

    for (let i = 0; i < this.particles.length; i++) {
      const pt   = this.particles[i];
      const dx   = this.mx - pt.x, dy = this.my - pt.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < 260) {
        const t = (1 - dist/260) * 0.06 * spd;
        pt.vx += (pt.tx - pt.x) * t;
        pt.vy += (pt.ty - pt.y) * t;
      }

      // Same-word cohesion
      for (let j = 0; j < this.particles.length; j++) {
        if (i === j || this.particles[j].word !== pt.word) continue;
        const ox = this.particles[j].x - pt.x;
        const oy = this.particles[j].y - pt.y;
        const od = Math.sqrt(ox*ox + oy*oy);
        if (od > 0 && od < 180) {
          pt.vx += (ox/od) * 0.014 * spd;
          pt.vy += (oy/od) * 0.014 * spd;
        }
      }

      pt.x += pt.vx * spd; pt.y += pt.vy * spd;
      const mag = Math.sqrt(pt.vx*pt.vx + pt.vy*pt.vy);
      if (mag > maxSpd) { pt.vx = pt.vx/mag*maxSpd; pt.vy = pt.vy/mag*maxSpd; }
      pt.vx *= 0.97; pt.vy *= 0.97;

      if (pt.x < b.x)       { pt.x = b.x;       pt.vx *= -1; }
      if (pt.x > b.x + b.w) { pt.x = b.x + b.w; pt.vx *= -1; }
      if (pt.y < b.y)       { pt.y = b.y;        pt.vy *= -1; }
      if (pt.y > b.y + b.h) { pt.y = b.y + b.h;  pt.vy *= -1; }
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['particle-network'];
    const [r,g,b] = this.getAnimRgb();
    const dist   = params.distance;
    const sz     = this.getTextSize();

    p.strokeWeight(0.7);
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i+1; j < this.particles.length; j++) {
        const dx = this.particles[j].x - this.particles[i].x;
        const dy = this.particles[j].y - this.particles[i].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < dist) {
          const sameWord = this.particles[i].word === this.particles[j].word;
          const alpha = p.map(d, 0, dist, sameWord ? 190 : 70, 0);
          p.stroke(r, g, b, alpha);
          p.line(this.particles[i].x, this.particles[i].y,
                 this.particles[j].x, this.particles[j].y);
        }
      }
    }
    const ctx = p.drawingContext;
    ctx.font         = getFont(this.state, sz * 0.8);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (const pt of this.particles) {
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.fillText(pt.char, pt.x, pt.y);
    }
  }
}

/* =====================================================
   3. FLOW FIELD — Letras del mensaje siguiendo campo Perlin
   TRIGGER DE LECTURA: cada ~6s las letras convergen al mensaje y se disuelven.
   ===================================================== */
class FlowField extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.particles  = [];
    this.buffer     = null;
    this.noiseZ     = 0;
    this.frame      = 0;
    this.converging = false;
    this.convT      = 0;
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['flow-field'];
    const b  = this.getBounds();
    const sz = this.getTextSize();
    this.p.randomSeed(this.state.anim.seed);
    const layout = getMessageLayout(this.getAnimZone(), sz);
    this.particles = MESSAGE_CHARS.map((char, i) => ({
      x:    this.p.random(b.x, b.x + b.w),
      y:    this.p.random(b.y, b.y + b.h),
      px:   undefined, py: undefined,
      char,
      tx:   layout[i].tx, ty: layout[i].ty
    }));
    if (!this.buffer) this.buffer = this.p.createGraphics(CANVAS_W, CANVAS_H);
    const [bgR,bgG,bgB] = this.getBg();
    this.buffer.background(bgR, bgG, bgB);
    this.noiseZ = 0; this.frame = 0;
    this.converging = false; this.convT = 0;
  }

  advanceState() {
    const params  = this.state.anim.params['flow-field'];
    const spd     = this.state.anim.speed;
    const b       = this.getBounds();
    const ns      = params.noiseScale;
    this.noiseZ  += 0.003 * spd;
    this.frame   += spd;

    if (this.frame % 190 < 2 && !this.converging) {
      this.converging = true; this.convT = 0;
    }
    if (this.converging) {
      this.convT += 0.022 * spd;
      if (this.convT > 1) { this.converging = false; this.convT = 0; }
    }

    for (const pt of this.particles) {
      pt.px = pt.x; pt.py = pt.y;
      if (this.converging) {
        const ease = Math.sin(this.convT * Math.PI);
        pt.x += (pt.tx - pt.x) * 0.09 * ease * spd;
        pt.y += (pt.ty - pt.y) * 0.09 * ease * spd;
      } else {
        const n     = this.p.noise(pt.x*ns, pt.y*ns, this.noiseZ);
        const angle = n * this.p.TWO_PI * 2;
        const dx    = this.mx - pt.x, dy = this.my - pt.y;
        const d     = Math.sqrt(dx*dx + dy*dy);
        const blend = d < 120 ? (1 - d/120) * 0.45 : 0;
        const distA = d < 120 ? Math.atan2(dy, dx) + this.p.PI * 0.5 : 0;
        const fa    = angle*(1-blend) + distA*blend;
        pt.x += Math.cos(fa) * params.speed * spd;
        pt.y += Math.sin(fa) * params.speed * spd;
      }
      if (pt.x < b.x)       pt.x = b.x + b.w;
      if (pt.x > b.x + b.w) pt.x = b.x;
      if (pt.y < b.y)       pt.y = b.y + b.h;
      if (pt.y > b.y + b.h) pt.y = b.y;
    }
  }

  render() {
    const p      = this.p;
    const [r,g,b] = this.getAnimRgb();
    const [bgR,bgG,bgB] = this.getBg();
    const buf    = this.buffer;
    const sz     = this.getTextSize();

    buf.fill(bgR, bgG, bgB, this.converging ? 50 : 14);
    buf.noStroke();
    buf.rect(0, 0, CANVAS_W, CANVAS_H);
    buf.drawingContext.font         = getFont(this.state, sz * 0.72);
    buf.drawingContext.textAlign    = 'center';
    buf.drawingContext.textBaseline = 'middle';
    for (const pt of this.particles) {
      const a = this.converging ? Math.round(200 * Math.sin(this.convT * Math.PI) + 40) : 150;
      buf.drawingContext.fillStyle = `rgba(${r},${g},${b},${a/255})`;
      buf.drawingContext.fillText(pt.char, pt.x, pt.y);
    }
    p.image(buf, 0, 0);
  }
}

/* =====================================================
   4. GRID DISTORTION — Grilla de letras del mensaje deformable
   Glitch variant: grilla de bloques 32×32px con desplazamiento aleatorio y hue-shift
   en animColor. FASE 1 (t=1s): máximo glitch. (t=2s): bloques se ordenan y
   asientan (primero los más cercanos a letra). FASE 2: blockSize → 1px, canvas
   vuelve a layout base. Blend mode: Hard Light.
   ===================================================== */
class GridDistortion extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.t            = 0;
    this.blocks       = [];
    this.textCvs      = null;
    this.BLOCK        = 32;
    this._lastFont    = '';
    this._needRebuild = false;
    this._textPixels  = null;
    this.reset();
  }

  reset() {
    this.t        = 0;
    this._lastFont = '';
    if (!this.textCvs) this.textCvs = document.createElement('canvas');
    this.textCvs.width  = CANVAS_W;
    this.textCvs.height = CANVAS_H;
    this._renderText();
    this._buildBlocks();
  }

  _renderText() {
    const fontName   = (this.state.anim && this.state.anim.font)       ? this.state.anim.font       :
                       (this.state.title && this.state.title.font)      ? this.state.title.font      : 'Bebas Neue';
    const fontWeight = (this.state.anim && this.state.anim.fontWeight)  ? this.state.anim.fontWeight : '700';
    const fontKey    = `${fontWeight}|${fontName}`;
    if (fontKey === this._lastFont) return;
    this._lastFont    = fontKey;
    this._needRebuild = true;

    const ctx = this.textCvs.getContext('2d');
    const [br, bg2, bb] = this.getBg();
    ctx.fillStyle = `rgb(${br},${bg2},${bb})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = 80;
    for (let fs = 40; fs <= 600; fs += 2) {
      ctx.font = `${fontWeight} ${fs}px '${fontName}', sans-serif`;
      if (ctx.measureText('CONVOCATORIA').width >= CANVAS_W * 0.92) { fontSize = fs; break; }
    }

    const lineH = fontSize * 1.08;
    const cy    = ZONES.anim.y + ZONES.anim.h * 0.5;
    const [r, g, b] = this.getAnimRgb();
    ctx.font      = `${fontWeight} ${fontSize}px '${fontName}', sans-serif`;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillText('CONVOCATORIA', CANVAS_W / 2, cy - lineH / 2);
    ctx.fillText('ABIERTA',      CANVAS_W / 2, cy + lineH / 2);

    this._textPixels = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
  }

  _buildBlocks() {
    if (!this._textPixels) return;
    this.p.randomSeed(this.state.anim.seed);

    const B    = this.BLOCK;
    const cols = Math.ceil(CANVAS_W / B);
    const rows = Math.ceil(CANVAS_H / B);
    const STEP = 16;
    const [br, bg2, bb] = this.getBg();

    const letterPts = [];
    for (let y = 0; y < CANVAS_H; y += STEP) {
      for (let x = 0; x < CANVAS_W; x += STEP) {
        const idx = (y * CANVAS_W + x) * 4;
        if (Math.abs(this._textPixels[idx] - br) + Math.abs(this._textPixels[idx+1] - bg2) + Math.abs(this._textPixels[idx+2] - bb) > 30)
          letterPts.push({ x, y });
      }
    }

    this.blocks = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const bx = col * B, by = row * B;
        const bcx = bx + B / 2, bcy = by + B / 2;
        let minDist = 99999;
        for (const lp of letterPts) {
          const d = Math.sqrt((bcx - lp.x) ** 2 + (bcy - lp.y) ** 2);
          if (d < minDist) minDist = d;
        }
        this.blocks.push({
          bx, by,
          rdx:      this.p.random(-60, 60),
          rdy:      this.p.random(-60, 60),
          hueShift: this.p.random(-80, 80),
          dist:     minDist
        });
      }
    }

    let maxDist = 0;
    for (const bl of this.blocks) if (bl.dist > maxDist) maxDist = bl.dist;
    for (const bl of this.blocks) bl.distNorm = maxDist > 0 ? bl.dist / maxDist : 0;
    this._needRebuild = false;
  }

  advanceState() {
    this.t += 0.016 * this.state.anim.speed;
  }

  _hue2rgb(p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  _applyHue(r, g, b, deg) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = 0; const l = (max + min) / 2;
    if (d > 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) :
          max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    h = ((h + deg / 360) % 1 + 1) % 1;
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p2  = 2 * l - q2;
    return [
      Math.round(this._hue2rgb(p2, q2, h + 1/3) * 255),
      Math.round(this._hue2rgb(p2, q2, h)        * 255),
      Math.round(this._hue2rgb(p2, q2, h - 1/3)  * 255)
    ];
  }

  render() {
    this._renderText();
    if (this._needRebuild) this._buildBlocks();

    const CYCLE = 12;
    const tSec  = this.t % CYCLE;
    const ctx   = this.p.drawingContext;
    const [r, g, b]     = this.getAnimRgb();
    const [br, bg2, bb] = this.getBg();
    const B = this.BLOCK;

    // Phase timing (12s cycle):
    // 0→2s  : displacement ramp 0→max
    // 2→4s  : hold max glitch
    // 4→7s  : settle (closest-to-letter blocks first)
    // 7→10s : blockSize 32→1px
    // 10→11s: hold clean text
    // 11→12s: fade out → loop

    ctx.fillStyle = `rgb(${br},${bg2},${bb})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Text layer beneath blocks
    let textAlpha = 0;
    if      (tSec >= 4  && tSec < 7)  textAlpha = (tSec - 4) / 3;
    else if (tSec >= 7  && tSec < 11) textAlpha = 1;
    else if (tSec >= 11)              textAlpha = Math.max(0, 1 - (tSec - 11));

    if (textAlpha > 0.005) {
      ctx.globalAlpha = textAlpha;
      ctx.drawImage(this.textCvs, 0, 0);
      ctx.globalAlpha = 1;
    }

    if (tSec >= 10) return;  // no blocks in hold/fade phase

    ctx.globalCompositeOperation = 'hard-light';

    const blockSize = tSec >= 7
      ? Math.max(1, B * (1 - (tSec - 7) / 3))
      : B;

    for (const bl of this.blocks) {
      let dx = 0, dy = 0, hueAmt = bl.hueShift;

      if (tSec < 2) {
        dx = bl.rdx * (tSec / 2);
        dy = bl.rdy * (tSec / 2);
      } else if (tSec < 4) {
        dx = bl.rdx; dy = bl.rdy;
      } else if (tSec < 7) {
        const settleT = (tSec - 4) / 3;
        const delay   = bl.distNorm * 0.75;
        const prog    = Math.min(1, Math.max(0, (settleT - delay) / (1 - delay + 0.001)));
        const ease    = prog * prog * (3 - 2 * prog);
        dx     = bl.rdx * (1 - ease);
        dy     = bl.rdy * (1 - ease);
        hueAmt = bl.hueShift * (1 - ease);
      } else {
        hueAmt = 0;
      }

      const [hr, hg, hb] = this._applyHue(r, g, b, hueAmt);
      ctx.fillStyle = `rgb(${hr},${hg},${hb})`;
      ctx.fillRect(bl.bx + dx, bl.by + dy, blockSize, blockSize);
    }

    ctx.globalCompositeOperation = 'source-over';
  }
}

/* =====================================================
   5. BOUNCING SHAPES — Palabras que rebotan con física
   TRIGGER DE LECTURA: click → todas las copias se ordenan en formación legible.
   ===================================================== */
class BouncingShapes extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.shapes   = [];
    this.snapMode = false;
    this.snapT    = 0;
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['bouncing-shapes'];
    const b      = this.getBounds();
    this.p.randomSeed(this.state.anim.seed);
    this.snapMode = false;
    const baseSize = params.size || 32;
    const defs = [
      { word: 0, scale: 1.3 }, { word: 1, scale: 1.3 },
      { word: 0, scale: 0.65 }, { word: 1, scale: 0.65 },
      { word: 0, scale: 0.42 }, { word: 1, scale: 0.42 },
      { word: 0, scale: 0.3  }, { word: 1, scale: 0.3  }
    ];
    this.shapes = defs.map(def => {
      const sz = baseSize * def.scale;
      const hw = MESSAGE_WORDS[def.word].length * sz * 0.31;
      const hh = sz * 0.5;
      return {
        x:    this.p.random(b.x + hw, b.x + b.w - hw),
        y:    this.p.random(b.y + hh, b.y + b.h * 0.5),
        vx:   this.p.random(-4, 4),
        vy:   this.p.random(-3, 2),
        hw, hh, sz,
        text: MESSAGE_WORDS[def.word],
        word: def.word,
        tx: 0, ty: 0
      };
    });
    this._computeTargets(b);
  }

  _computeTargets(b) {
    if (!b) b = this.getBounds();
    const cy = b.y + b.h * 0.5;
    for (const s of this.shapes) {
      s.tx = b.x + b.w * 0.5;
      s.ty = s.word === 0 ? cy - s.sz * 0.7 : cy + s.sz * 0.7;
    }
  }

  advanceState() {
    const params = this.state.anim.params['bouncing-shapes'];
    const spd    = this.state.anim.speed;
    const b      = this.getBounds();
    const grav   = params.gravity * 0.12 * spd;
    const e      = params.elasticity;

    if (this.snapMode) {
      this.snapT += 0.04 * spd;
      if (this.snapT > 1) { this.snapMode = false; this.snapT = 1; }
    }

    for (const s of this.shapes) {
      if (this.snapMode) {
        s.x  += (s.tx - s.x) * 0.09 * spd;
        s.y  += (s.ty - s.y) * 0.09 * spd;
        s.vx *= 0.85; s.vy *= 0.85;
        continue;
      }
      s.vy += grav;
      s.x  += s.vx * spd;
      s.y  += s.vy * spd;
      // Mouse friction — slow down nearby shapes
      const dx = s.x - this.mx, dy = s.y - this.my;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 130 && d > 0) {
        const fr = 1 - (1 - d/130) * 0.1 * spd;
        s.vx *= fr; s.vy *= fr;
      }
      if (s.x - s.hw < b.x)       { s.x = b.x + s.hw;         s.vx =  Math.abs(s.vx)*e; }
      if (s.x + s.hw > b.x + b.w) { s.x = b.x + b.w - s.hw;   s.vx = -Math.abs(s.vx)*e; }
      if (s.y - s.hh < b.y)       { s.y = b.y + s.hh;          s.vy =  Math.abs(s.vy)*e; }
      if (s.y + s.hh > b.y + b.h) { s.y = b.y + b.h - s.hh;   s.vy = -Math.abs(s.vy)*e*0.8; s.vx *= 0.98; }
    }
  }

  render() {
    const ctx     = this.p.drawingContext;
    const [r,g,b] = this.getAnimRgb();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (const s of this.shapes) {
      const alpha = s.sz > 30 ? 0.88 : 0.48;
      ctx.font        = getFont(this.state, s.sz);
      ctx.fillStyle   = `rgba(${r},${g},${b},${alpha})`;
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.25})`;
      ctx.lineWidth   = 1;
      ctx.strokeText(s.text, s.x, s.y);
      ctx.fillText(s.text,   s.x, s.y);
    }
  }

  handleMouse(cx, cy, type) {
    super.handleMouse(cx, cy, type);
    if (type === 'press') {
      this._computeTargets();
      this.snapMode = true;
      this.snapT    = 0;
    }
  }
}

/* =====================================================
   6. WAVE INTERFERENCE — Patrón de interferencia que revela "CONVOCATORIA ABIERTA"
   FASE 1 (t=0→1s): interferencia llena canvas con animColor. (t=1→3.5s): máscara
   de letras aparece; ondas fuera se desvanecen. (t=3.5→5s): texto legible formado
   enteramente por interferencia. FASE 2 (t=5→7s): máscara se disuelve, ondas vuelven
   a rol de textura de fondo. Loop. Fuente: fuente activa del póster, tamaño llena canvas.
   ===================================================== */
class WaveInterference extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.t          = 0;
    this.emitters   = [];
    this.maskCvs    = null;   // offscreen canvas with text mask (white on transparent)
    this.waveCvs    = null;   // low-res interference canvas
    this.tmpCvs     = null;   // temp canvas for compositing
    this.SCALE      = 3;      // wave computed at 1/SCALE resolution for performance
    this._lastFont  = '';
    this.reset();
  }

  reset() {
    this.t = 0;
    this._buildEmitters();
    this._initCanvases();
    this._buildMask();
  }

  _buildEmitters() {
    this.emitters = [];
    const N = 8;
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2;
      this.emitters.push({
        x:     CANVAS_W * 0.5 + Math.cos(angle) * CANVAS_W * 0.46,
        y:     CANVAS_H * 0.5 + Math.sin(angle) * CANVAS_H * 0.44,
        phase: (i / N) * Math.PI * 2
      });
    }
    // Extra central emitter for richer interference
    this.emitters.push({ x: CANVAS_W * 0.5, y: CANVAS_H * 0.5, phase: Math.PI });
  }

  _initCanvases() {
    const S  = this.SCALE;
    const wW = Math.ceil(CANVAS_W / S);
    const wH = Math.ceil(CANVAS_H / S);

    if (!this.waveCvs) this.waveCvs = document.createElement('canvas');
    this.waveCvs.width  = wW;
    this.waveCvs.height = wH;

    if (!this.tmpCvs) this.tmpCvs = document.createElement('canvas');
    this.tmpCvs.width  = CANVAS_W;
    this.tmpCvs.height = CANVAS_H;

    if (!this.maskCvs) this.maskCvs = document.createElement('canvas');
    this.maskCvs.width  = CANVAS_W;
    this.maskCvs.height = CANVAS_H;
  }

  _buildMask() {
    const fontName   = (this.state.anim && this.state.anim.font)       ? this.state.anim.font       :
                       (this.state.title && this.state.title.font)      ? this.state.title.font      : 'Bebas Neue';
    const fontWeight = (this.state.anim && this.state.anim.fontWeight)  ? this.state.anim.fontWeight : '700';
    const fontKey    = `${fontWeight}|${fontName}`;
    if (fontKey === this._lastFont) return;
    this._lastFont = fontKey;

    const ctx = this.maskCvs.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Binary-search for the font size that makes CONVOCATORIA fill ~92% of canvas width
    let fontSize = 80;
    for (let fs = 40; fs <= 600; fs += 2) {
      ctx.font = `${fontWeight} ${fs}px '${fontName}', sans-serif`;
      if (ctx.measureText('CONVOCATORIA').width >= CANVAS_W * 0.92) { fontSize = fs; break; }
    }

    const lineH = fontSize * 1.08;
    const cy    = ZONES.anim.y + ZONES.anim.h * 0.5;   // mismo centro que Letter Physics (y=726)
    ctx.font      = `${fontWeight} ${fontSize}px '${fontName}', sans-serif`;
    ctx.fillStyle = 'white';
    ctx.fillText('CONVOCATORIA', CANVAS_W / 2, cy - lineH / 2);
    ctx.fillText('ABIERTA',      CANVAS_W / 2, cy + lineH / 2);
  }

  advanceState() {
    this.t += 0.016 * this.state.anim.speed;  // 1 unit ≈ 1 second at 60 fps
  }

  _getPhase() {
    const CYCLE = 12;
    const tSec  = this.t % CYCLE;
    let bgAlpha   = 1;
    let maskAlpha = 0;

    // 12s cycle:
    // 0→2s  : full wave background (fuerte)
    // 2→6s  : máscara de letras aparece (4s)
    // 6→9s  : hold texto legible (3s)
    // 9→11s : máscara se disuelve (2s)
    // 11→12s: onda vuelve a baja opacidad → loop
    if (tSec < 2) {
      bgAlpha = 1; maskAlpha = 0;
    } else if (tSec < 6) {
      const prog = (tSec - 2) / 4;
      maskAlpha = prog;
      bgAlpha   = 1 - prog * 0.88;
    } else if (tSec < 9) {
      maskAlpha = 1; bgAlpha = 0.12;
    } else if (tSec < 11) {
      const prog = (tSec - 9) / 2;
      maskAlpha  = 1 - prog;
      bgAlpha    = 0.12 + prog * 0.88;
    } else {
      maskAlpha = 0;
      bgAlpha   = 1 - (tSec - 11) * 0.75;  // fades to ~0.25
    }
    return { bgAlpha, maskAlpha };
  }

  _computeWave() {
    const S    = this.SCALE;
    const wW   = this.waveCvs.width;
    const wH   = this.waveCvs.height;
    const ctx  = this.waveCvs.getContext('2d');
    const img  = ctx.createImageData(wW, wH);
    const d    = img.data;

    const [r, g, b]     = this.getAnimRgb();
    const [br, bg2, bb] = this.getBg();
    const freq = 0.022;   // fringe spacing ≈ stroke width (~15 px at full res)
    const numE = this.emitters.length;
    const spd  = this.t * 3.8;   // wave travel speed

    for (let py = 0; py < wH; py++) {
      const fy = py * S + S * 0.5;
      for (let px = 0; px < wW; px++) {
        const fx = px * S + S * 0.5;

        let val = 0;
        for (let i = 0; i < numE; i++) {
          const e  = this.emitters[i];
          const dx = fx - e.x, dy = fy - e.y;
          val += Math.sin(Math.sqrt(dx*dx + dy*dy) * freq - spd + e.phase);
        }
        val = (val / numE + 1) * 0.5;   // 0..1

        const idx = (py * wW + px) * 4;
        d[idx]   = (br + (r  - br)  * val) | 0;
        d[idx+1] = (bg2 + (g  - bg2) * val) | 0;
        d[idx+2] = (bb + (b  - bb)  * val) | 0;
        d[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  render() {
    const p   = this.p;
    const b_  = this.getBounds();
    const [br, bg2, bb] = this.getBg();
    const { bgAlpha, maskAlpha } = this._getPhase();

    // Rebuild mask if font changed
    this._buildMask();

    // Resize canvases if canvas dimensions changed
    if (this.waveCvs.width !== Math.ceil(CANVAS_W / this.SCALE)) {
      this._initCanvases();
      this._buildMask();
    }

    this._computeWave();

    const ctx = p.drawingContext;

    // Background fill
    ctx.fillStyle = `rgb(${br},${bg2},${bb})`;
    ctx.fillRect(b_.x, b_.y, b_.w, b_.h);

    // Full-canvas interference background
    if (bgAlpha > 0.005) {
      ctx.globalAlpha = bgAlpha;
      ctx.drawImage(this.waveCvs, b_.x, b_.y, b_.w, b_.h);
      ctx.globalAlpha = 1;
    }

    // Letter-masked interference layer
    if (maskAlpha > 0.005) {
      const tCtx = this.tmpCvs.getContext('2d');
      this.tmpCvs.width = b_.w;   // clears canvas
      this.tmpCvs.height = b_.h;
      tCtx.drawImage(this.waveCvs, 0, 0, b_.w, b_.h);
      tCtx.globalCompositeOperation = 'destination-in';
      tCtx.drawImage(this.maskCvs, -b_.x, -b_.y, CANVAS_W, CANVAS_H);
      tCtx.globalCompositeOperation = 'source-over';

      ctx.globalAlpha = maskAlpha;
      ctx.drawImage(this.tmpCvs, b_.x, b_.y);
      ctx.globalAlpha = 1;
    }
  }
}

/* =====================================================
   7. CODE RAIN — "CONVOCATORIA ABIERTA" monospace canvas-fill.
   BUILD (0→2s): lluvia aleatoria full-canvas, todas las columnas activas.
   LOCK (2→6s): columnas se bloquean izquierda→derecha; cada columna frena
     y hace snap al carácter correcto. Locked: brillo máximo + shadowBlur 4px.
   STABLE (6→7.5s): todo el texto legible, pulso sin por char.
   DISSOLVE (7.5→9s): nueva ola barre de arriba→abajo, desbloquea chars.
   POSTER (9→10s): fade a fondo.
   ===================================================== */
class CodeRain extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.t    = 0;
    this.cols = [];
    this.buf  = null;
    this.reset();
  }

  reset() {
    this.t = 0;
    this.p.randomSeed(this.state.anim.seed);
    this._buildLayout();
    if (!this.buf) this.buf = document.createElement('canvas');
    this.buf.width  = CANVAS_W;
    this.buf.height = CANVAS_H;
    const [br, bg2, bb] = this.getBg();
    const bc = this.buf.getContext('2d');
    bc.fillStyle = `rgb(${br},${bg2},${bb})`;
    bc.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  _buildLayout() {
    // 12 cols → CONVOCATORIA fills canvas width (monospace canvas-fill)
    const NCOLS  = 12;
    this.NCOLS   = NCOLS;
    this.colW    = Math.floor(CANVAS_W / NCOLS);
    this.charH   = Math.round(this.colW / 0.60);   // Space Mono ~0.60 aspect

    const cy        = CANVAS_H / 2;                  // centrado vertical exacto
    const lineGap   = this.charH * 1.12;
    this.line1Y     = cy - lineGap / 2;             // centre y of "CONVOCATORIA"
    this.line2Y     = cy + lineGap / 2;             // centre y of "ABIERTA"

    const W1       = 'CONVOCATORIA';
    const W2       = 'ABIERTA';
    const startW2  = Math.floor((NCOLS - W2.length) / 2);  // = 2

    this.cols = Array.from({ length: NCOLS }, (_, i) => {
      const targets = [];
      if (i < W1.length) targets.push({ char: W1[i], y: this.line1Y });
      const i2 = i - startW2;
      if (i2 >= 0 && i2 < W2.length) targets.push({ char: W2[i2], y: this.line2Y });
      return {
        x:          i * this.colW + this.colW / 2,
        y:          this.p.random(-CANVAS_H, -this.charH),
        speed:      this.p.random(5, 10),
        headChar:   this._rc(),
        targets,
        wasLocked:  false
      };
    });
  }

  _rc() {
    return MESSAGE_CHARS[Math.floor(Math.random() * MESSAGE_CHARS.length)];
  }

  advanceState() {
    this.t += 0.016 * this.state.anim.speed;
  }

  render() {
    const CYCLE = 10;
    const tSec  = this.t % CYCLE;
    const ctx   = this.p.drawingContext;
    const [r, g, b]     = this.getAnimRgb();
    const [br, bg2, bb] = this.getBg();
    const charH = this.charH;
    const NCOLS = this.NCOLS;
    const spd   = this.state.anim.speed;
    const bc    = this.buf.getContext('2d');

    bc.font         = `700 ${charH}px 'Space Mono', monospace`;
    bc.textAlign    = 'center';
    bc.textBaseline = 'middle';

    // Trail decay — faster during dissolve for crisp sweep
    const fadeA = tSec >= 7.5 ? 0.22 : 0.13;
    bc.fillStyle = `rgba(${br},${bg2},${bb},${fadeA})`;
    bc.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Dissolve sweep front (top→bottom, 7.5→9s)
    const dissolveY = tSec >= 7.5
      ? ((tSec - 7.5) / 1.5) * (CANVAS_H + charH * 2)
      : -1;

    for (let ci = 0; ci < NCOLS; ci++) {
      const col   = this.cols[ci];
      const x     = col.x;
      const lockT = 2 + (ci / (NCOLS - 1)) * 4;   // col 0 → t=2, col 11 → t=6
      const locked = tSec >= lockT && tSec < 7.5;
      const streaming = !locked;

      // Reset head when dissolve starts for previously-locked cols
      if (tSec >= 7.5 && col.wasLocked) {
        col.wasLocked = false;
        col.y = -charH * (1 + Math.random() * 4);
      }
      if (locked) col.wasLocked = true;

      // ── Streaming rain ──
      if (streaming) {
        let colSpd = col.speed;
        // Decelerate toward lock (cols approaching their lockT)
        if (tSec >= 2 && tSec < lockT) {
          const p = (tSec - 2) / Math.max(0.01, lockT - 2);
          colSpd *= Math.max(0.1, 1 - p * 0.90);
        }
        col.y += colSpd * spd;
        col.headChar = this._rc();
        if (col.y > CANVAS_H + charH * 2)
          col.y = -charH * (2 + Math.random() * 5);

        const TRAIL = 14;
        for (let ti = TRAIL; ti >= 0; ti--) {
          const chy = col.y - ti * charH;
          if (chy < -charH || chy > CANVAS_H + charH) continue;
          const a = ti === 0 ? 0.70 : (1 - ti / TRAIL) * 0.28;
          bc.fillStyle = `rgba(${r},${g},${b},${a})`;
          bc.fillText(ti === 0 ? col.headChar : this._rc(), x, chy);
        }
      }

      // ── Locked chars (LOCK + STABLE) ──
      if (locked) {
        const snap = Math.min(1, (tSec - lockT) * 3);   // 0.33s snap-in
        bc.shadowColor = `rgba(${r},${g},${b},0.85)`;
        bc.shadowBlur  = 4;
        for (const tgt of col.targets) {
          const pulse = tSec >= 6
            ? 0.90 + 0.10 * Math.sin(tSec * Math.PI * 2.4 + ci * 0.50)
            : 1;
          bc.fillStyle = `rgba(${r},${g},${b},${snap * pulse})`;
          bc.fillText(tgt.char, x, tgt.y);
        }
        bc.shadowBlur  = 0;
        bc.shadowColor = 'transparent';
      }

      // ── Dissolve: locked chars fade as sweep passes ──
      if (dissolveY >= 0) {
        for (const tgt of col.targets) {
          if (tgt.y < dissolveY) {
            // Sweep has passed → show random char fading out
            const fadeOut = Math.max(0, 1 - (dissolveY - tgt.y) / (charH * 3));
            bc.fillStyle = `rgba(${r},${g},${b},${fadeOut * 0.80})`;
            bc.fillText(this._rc(), x, tgt.y);
          } else {
            // Sweep hasn't arrived → keep locked char visible
            bc.shadowColor = `rgba(${r},${g},${b},0.85)`;
            bc.shadowBlur  = 4;
            bc.fillStyle   = `rgba(${r},${g},${b},0.95)`;
            bc.fillText(tgt.char, x, tgt.y);
            bc.shadowBlur  = 0;
            bc.shadowColor = 'transparent';
          }
        }
      }
    }

    // Stamp buffer onto main canvas
    ctx.fillStyle = `rgb(${br},${bg2},${bb})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(this.buf, 0, 0);

  }

  getPosterAlpha() {
    // 0→7.5s: poster invisible (lluvia + texto bloqueado protagonizan)
    // 7.5→9s: fade in mientras la onda dissolve barre el texto
    // 9→10s:  poster completamente visible
    const CYCLE = 10;
    const tSec  = (this.t % CYCLE);
    if (tSec < 7.5) return 0;
    if (tSec < 9)   return (tSec - 7.5) / 1.5;
    return 1;
  }
}

/* =====================================================
   8. CONSTELLATION — Constelación del mensaje
   TRIGGER DE LECTURA: mouse lejos → letras orbitan posiciones target,
   líneas secuenciales forman el trazo del mensaje.
   Mouse cerca → órbitas se desorganizan.
   ===================================================== */
class Constellation extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.stars = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['constellation'];
    const sz     = this.getTextSize();
    this.p.randomSeed(this.state.anim.seed);
    const layout = getMessageLayout(this.getAnimZone(), sz);
    this.stars = MESSAGE_CHARS.map((char, i) => {
      const tgt   = layout[i];
      const angle = this.p.random(this.p.TWO_PI);
      const orbit = this.p.random(12, 45);
      return {
        tx:    tgt.tx,   ty:    tgt.ty,
        x:     tgt.tx + Math.cos(angle) * orbit,
        y:     tgt.ty + Math.sin(angle) * orbit,
        vx:    0,        vy:    0,
        char,
        orbit, angle,
        angV:  (this.p.random(-0.025, 0.025) || 0.01) * (1 + Math.random() * 0.5),
        word:  i < 12 ? 0 : 1
      };
    });
  }

  advanceState() {
    const spd = this.state.anim.speed;
    const b   = this.getBounds();
    for (const s of this.stars) {
      const dx   = this.mx - s.tx, dy = this.my - s.ty;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 220) {
        const t = (1 - dist/220);
        s.vx += (Math.random() - 0.5) * 2 * t * spd * 0.6;
        s.vy += (Math.random() - 0.5) * 2 * t * spd * 0.6;
        s.x  += s.vx; s.y += s.vy;
        s.vx *= 0.90; s.vy *= 0.90;
        const tX = s.tx + Math.cos(s.angle) * s.orbit;
        const tY = s.ty + Math.sin(s.angle) * s.orbit;
        s.x += (tX - s.x) * 0.025; s.y += (tY - s.y) * 0.025;
      } else {
        s.angle += s.angV * spd;
        const tX = s.tx + Math.cos(s.angle) * s.orbit;
        const tY = s.ty + Math.sin(s.angle) * s.orbit;
        s.x  += (tX - s.x) * 0.18;
        s.y  += (tY - s.y) * 0.18;
        s.vx  = 0; s.vy = 0;
      }
      s.x = Math.max(b.x, Math.min(b.x + b.w, s.x));
      s.y = Math.max(b.y, Math.min(b.y + b.h, s.y));
    }
  }

  render() {
    const p      = this.p;
    const [r,g,b] = this.getAnimRgb();
    const sz     = this.getTextSize();

    // Sequential connections — trazo del mensaje
    p.strokeWeight(0.9);
    for (let i = 0; i < this.stars.length - 1; i++) {
      if (i === 11) continue; // gap between words
      const s1 = this.stars[i], s2 = this.stars[i+1];
      const d  = Math.sqrt((s2.x-s1.x)**2 + (s2.y-s1.y)**2);
      const a  = p.map(d, 0, 280, 160, 0);
      p.stroke(r, g, b, a);
      p.line(s1.x, s1.y, s2.x, s2.y);
    }
    // Letter nodes
    const ctx = p.drawingContext;
    ctx.font         = getFont(this.state, sz * 0.78);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (const s of this.stars) {
      ctx.fillStyle = `rgba(${r},${g},${b},0.92)`;
      ctx.fillText(s.char, s.x, s.y);
    }
  }
}

/* =====================================================
   9. ELASTIC MESH — Letras del mensaje conectadas por resortes
   TRIGGER DE LECTURA: al soltar el arrastre, la cadena retorna al mensaje legible.
   ===================================================== */
class ElasticMesh extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.nodes   = [];
    this.dragIdx = -1;
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['elastic-mesh'];
    const sz     = this.getTextSize();
    const layout = getMessageLayout(this.getAnimZone(), sz);
    this.nodes   = MESSAGE_CHARS.map((char, i) => {
      const tgt = layout[i];
      return {
        ox:   tgt.tx, oy: tgt.ty,
        x:    tgt.tx + (Math.random()-0.5)*220,
        y:    tgt.ty + (Math.random()-0.5)*220,
        vx:   0, vy: 0,
        char,
        word: i < 12 ? 0 : 1
      };
    });
    this.dragIdx = -1;
  }

  advanceState() {
    const params = this.state.anim.params['elastic-mesh'];
    const k      = params.stiffness;
    const damp   = params.damping;

    if (this.dragIdx >= 0) {
      const n = this.nodes[this.dragIdx];
      n.x = this.mx; n.y = this.my; n.vx = 0; n.vy = 0;
    }

    for (let i = 0; i < this.nodes.length; i++) {
      if (i === this.dragIdx) continue;
      const n  = this.nodes[i];
      let fx   = (n.ox - n.x) * k;
      let fy   = (n.oy - n.y) * k;
      // Spring to adjacent chars
      for (const ni of [i-1, i+1]) {
        if (ni < 0 || ni >= this.nodes.length) continue;
        if ((i === 11 && ni === 12) || (i === 12 && ni === 11)) continue;
        const nb = this.nodes[ni];
        fx += (nb.x - n.x) * k * 0.55;
        fy += (nb.y - n.y) * k * 0.55;
      }
      n.vx = (n.vx + fx) * damp;
      n.vy = (n.vy + fy) * damp;
      n.x += n.vx; n.y += n.vy;
    }
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['elastic-mesh'];
    const [r,g,b] = this.getAnimRgb();
    const sz     = this.getTextSize();

    // Spring lines
    p.stroke(r, g, b, 80);
    p.strokeWeight(params.lineWeight);
    for (let i = 0; i < this.nodes.length - 1; i++) {
      if (i === 11) continue;
      p.line(this.nodes[i].x, this.nodes[i].y, this.nodes[i+1].x, this.nodes[i+1].y);
    }
    // Letters
    const ctx = p.drawingContext;
    ctx.font         = getFont(this.state, sz * 0.88);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.nodes.length; i++) {
      const n   = this.nodes[i];
      const a   = i === this.dragIdx ? 1.0 : 0.88;
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillText(n.char, n.x, n.y);
    }
  }

  handleMouse(cx, cy, type) {
    super.handleMouse(cx, cy, type);
    if (type === 'press') {
      let minD = 55; this.dragIdx = -1;
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
   10. ROTATING TYPOGRAPHY — CONVOCATORIA ABIERTA en 2 líneas, letras rotando
   TRIGGER DE LECTURA: mouse proximity → letras cercanas se enderezan a 0°,
   revelando el mensaje con claridad local.
   ===================================================== */
class RotatingTypography extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.letters = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['rotating-typography'];
    const sz     = this.getTextSize();
    this.p.randomSeed(this.state.anim.seed);
    const layout = getMessageLayout(this.getAnimZone(), sz);
    this.letters = MESSAGE_CHARS.map((char, i) => {
      const tgt  = layout[i];
      const rotV = (this.p.random(-0.04, 0.04) + (Math.random() > 0.5 ? 0.012 : -0.012)) * params.speed;
      return { x: tgt.tx, y: tgt.ty, ch: char, rot: this.p.random(this.p.TWO_PI), rotV };
    });
  }

  advanceState() {
    const params = this.state.anim.params['rotating-typography'];
    const spd    = this.state.anim.speed;
    for (const lt of this.letters) {
      const dx = this.mx - lt.x, dy = this.my - lt.y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 160) {
        // Ease to 0 rotation near mouse
        lt.rot += (0 - lt.rot) * (1 - d/160) * 0.09 * spd;
      } else {
        lt.rot += lt.rotV * spd;
      }
    }
  }

  render() {
    const p      = this.p;
    const [r,g,b] = this.getAnimRgb();
    const sz     = this.getTextSize();
    p.drawingContext.font      = getFont(this.state, sz * 0.92);
    p.drawingContext.textAlign = 'center';
    for (const lt of this.letters) {
      p.push();
      p.translate(lt.x, lt.y);
      p.rotate(lt.rot);
      p.drawingContext.fillStyle    = `rgba(${r},${g},${b},0.92)`;
      p.drawingContext.textBaseline = 'middle';
      p.drawingContext.fillText(lt.ch, 0, 0);
      p.pop();
    }
  }
}

/* =====================================================
   11. PIXEL TEXTURE — Ruido de píxeles con CONVOCATORIA ABIERTA flotando
   El texto deriva suavemente sobre una textura de noise animado.
   Mouse → los píxeles más cercanos se intensifican.
   ===================================================== */
class PixelTexture extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.t          = 0;
    this.chars      = [];
    this.noiseOff   = [];
    this.pixelSize  = 10;
    this.reset();
  }

  reset() {
    const b  = this.getBounds();
    const sz = this.getTextSize();
    this.p.randomSeed(this.state.anim.seed);
    this.t         = 0;
    this.pixelSize = Math.max(6, Math.round(sz * 0.19));
    const layout   = getMessageLayout(b, sz);
    this.chars     = MESSAGE_CHARS.map((char, i) => ({
      x:     layout[i].tx,
      y:     layout[i].ty,
      char,
      phase: this.p.random(Math.PI * 2),
      word:  layout[i].word
    }));
    this.noiseOff = MESSAGE_CHARS.map(() => ({
      ox: this.p.random(1000),
      oy: this.p.random(1000)
    }));
  }

  advanceState() {
    this.t += 0.013 * this.state.anim.speed;
  }

  render() {
    const p        = this.p;
    const [r,g,b_] = this.getAnimRgb();
    const ctx      = p.drawingContext;
    const px       = this.pixelSize;
    const sz       = this.getTextSize();
    const t        = this.t;

    // ── Pixel noise grid ──
    const cols = Math.ceil(CANVAS_W / px) + 1;
    const rows = Math.ceil(CANVAS_H / px) + 1;
    for (let iy = 0; iy < rows; iy++) {
      for (let ix = 0; ix < cols; ix++) {
        const wx  = ix * px;
        const wy  = iy * px;
        // Mouse proximity boosts nearby pixels
        const mdx = wx - this.mx, mdy = wy - this.my;
        const md  = Math.sqrt(mdx * mdx + mdy * mdy);
        const mBoost = md < 120 ? (1 - md / 120) * 0.4 : 0;
        const n   = p.noise(ix * 0.07 + t * 0.11, iy * 0.07 - t * 0.09, t * 0.18);
        const raw = (n - 0.3) * 1.8 + mBoost;
        if (raw < 0.05) continue;
        const a = Math.min(0.6, raw * 0.6);
        ctx.fillStyle = `rgba(${r},${g},${b_},${a.toFixed(3)})`;
        ctx.fillRect(wx, wy, px - 1, px - 1);
      }
    }

    // ── CONVOCATORIA ABIERTA letters drifting on noise ──
    ctx.font         = getFont(this.state, sz * 0.94);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.chars.length; i++) {
      const c  = this.chars[i];
      const no = this.noiseOff[i];
      const dx = (p.noise(no.ox + t * 0.38) - 0.5) * 22;
      const dy = (p.noise(no.oy + t * 0.38) - 0.5) * 22;
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.0 + c.phase);
      // Each word gets a slightly different hue shift via alpha
      const wordA = c.word === 0 ? pulse : 0.55 + 0.45 * Math.sin(t * 1.6 + c.phase + 1.2);
      ctx.fillStyle = `rgba(${r},${g},${b_},${wordA.toFixed(3)})`;
      ctx.fillText(c.char, c.x + dx, c.y + dy);
    }
  }
}

/* =====================================================
   12. GLYPH FLOW FIELD — partículas guiadas por campo vectorial de glyphs
   BUILD (0→6s): 60 partículas/s emitidas desde posiciones aleatorias,
   cada una guiada tangencialmente por los contornos del glifo.
   Trail alpha 12, color animColor. Las letras emergen poco a poco.
   CLIMAX (6→7.5s): emisión cesa, partículas completan sus trayectorias.
   TRANSITION (7.5→9s): trail decae (-2/frame), partículas invertidas borran.
   POSTER (9→10s): fade-in mientras los últimos trails se disuelven.
   Clave: buffer de trails persistente (independiente del fondo).
   ===================================================== */
class GlyphFlowField extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.t         = 0;
    this.particles = [];
    this.trailBuf  = null;
    this.glyphCvs  = null;
    this.glyphData = null;
    this._lastFont = '';
    this.reset();
  }

  reset() {
    this.t         = 0;
    this.particles = [];
    if (!this.trailBuf) {
      this.trailBuf        = document.createElement('canvas');
      this.trailBuf.width  = CANVAS_W;
      this.trailBuf.height = CANVAS_H;
    }
    // Resize if canvas dimensions changed
    if (this.trailBuf.width !== CANVAS_W || this.trailBuf.height !== CANVAS_H) {
      this.trailBuf.width  = CANVAS_W;
      this.trailBuf.height = CANVAS_H;
    }
    const [bgR, bgG, bgB] = this.getBg();
    const tc = this.trailBuf.getContext('2d');
    tc.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
    tc.fillRect(0, 0, CANVAS_W, CANVAS_H);
    this._buildGlyph();
  }

  _buildGlyph() {
    const fontName   = (this.state.anim && this.state.anim.font)       ? this.state.anim.font       : 'Space Mono';
    const fontWeight = (this.state.anim && this.state.anim.fontWeight)  ? this.state.anim.fontWeight : '700';
    const key = `${fontWeight}|${fontName}`;
    if (key === this._lastFont && this.glyphData) return;
    this._lastFont = key;

    if (!this.glyphCvs) this.glyphCvs = document.createElement('canvas');
    this.glyphCvs.width  = CANVAS_W;
    this.glyphCvs.height = CANVAS_H;
    const ctx = this.glyphCvs.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    let fs = 40;
    for (; fs <= 600; fs += 2) {
      ctx.font = `${fontWeight} ${fs}px '${fontName}', sans-serif`;
      if (ctx.measureText('CONVOCATORIA').width >= CANVAS_W * 0.90) break;
    }
    const lineH = fs * 1.08;
    const cy    = CANVAS_H / 2;
    ctx.font      = `${fontWeight} ${fs}px '${fontName}', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('CONVOCATORIA', CANVAS_W / 2, cy - lineH / 2);
    ctx.fillText('ABIERTA',      CANVAS_W / 2, cy + lineH / 2);

    this.glyphData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
  }

  _sample(x, y) {
    const ix = x | 0, iy = y | 0;
    if (ix < 0 || ix >= CANVAS_W || iy < 0 || iy >= CANVAS_H) return 0;
    return this.glyphData[(iy * CANVAS_W + ix) * 4] / 255;
  }

  _fieldVec(x, y, reversed) {
    // Gradient of glyph brightness field → tangent = perpendicular
    const d  = 4;
    const gx = this._sample(x + d, y) - this._sample(x - d, y);
    const gy = this._sample(x, y + d) - this._sample(x, y - d);
    const gm = Math.sqrt(gx * gx + gy * gy);

    let vx, vy;
    if (gm > 0.04) {
      // Near stroke edge: flow tangentially along contour
      vx = -gy / gm;
      vy =  gx / gm;
    } else {
      // Open area: Perlin noise + gentle vertical pull toward glyph band
      const n   = this.p.noise(x * 0.003, y * 0.003, this.t * 0.2);
      const ang = n * this.p.TWO_PI * 2;
      vx = Math.cos(ang);
      vy = Math.sin(ang);
      const pull = (CANVAS_H * 0.5 - y) / CANVAS_H * 0.5;
      vy += pull;
      const vm = Math.sqrt(vx * vx + vy * vy);
      if (vm > 0) { vx /= vm; vy /= vm; }
    }
    return reversed ? { vx: -vx, vy: -vy } : { vx, vy };
  }

  _emit(reversed) {
    return {
      x:        Math.random() * CANVAS_W,
      y:        Math.random() * CANVAS_H,
      age:      0,
      life:     4 * 60,   // 4s × 60fps
      reversed: reversed
    };
  }

  advanceState() {
    const spd = this.state.anim.speed;
    this.t += 0.016 * spd;
    const tSec = this.t % 10;

    if (tSec < 6) {
      this.particles.push(this._emit(false));
    } else if (tSec >= 7.5 && tSec < 9) {
      this.particles.push(this._emit(true));
    }

    const vel = 2.5 * spd;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.age++;
      if (pt.age > pt.life) { this.particles.splice(i, 1); continue; }
      const { vx, vy } = this._fieldVec(pt.x, pt.y, pt.reversed);
      pt.x += vx * vel;
      pt.y += vy * vel;
      if (pt.x < 0)        pt.x += CANVAS_W;
      if (pt.x > CANVAS_W) pt.x -= CANVAS_W;
      if (pt.y < 0)        pt.y += CANVAS_H;
      if (pt.y > CANVAS_H) pt.y -= CANVAS_H;
    }
  }

  render() {
    const tSec            = this.t % 10;
    const [r, g, b]       = this.getAnimRgb();
    const [bgR, bgG, bgB] = this.getBg();
    const tc              = this.trailBuf.getContext('2d');

    this._buildGlyph();

    // Trail decay during TRANSITION + POSTER phases
    if (tSec >= 7.5) {
      tc.fillStyle = `rgba(${bgR},${bgG},${bgB},0.015)`;
      tc.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Draw particle dots onto trail buffer (alpha 12/255 per dot — accumulates over time)
    for (const pt of this.particles) {
      const lr      = pt.age / pt.life;
      const fadeIn  = Math.min(1, pt.age / 20);
      const fadeOut = lr > 0.75 ? Math.max(0, 1 - (lr - 0.75) / 0.25) : 1;
      const alpha   = (12 / 255) * fadeIn * fadeOut;
      if (alpha < 0.001) continue;
      tc.beginPath();
      tc.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
      tc.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(4)})`;
      tc.fill();
    }

    this.p.drawingContext.drawImage(this.trailBuf, 0, 0);
  }

  getPosterAlpha() {
    const tSec = this.t % 10;
    if (tSec < 9) return 0;
    return Math.min(1, tSec - 9);   // 1s fade-in (9→10s)
  }
}

/* =====================================================
   13. SLOT DRUM TYPOGRAPHY — cada char como tambor de ruleta
   BUILD (0→6s): todos los drums arrancan girando simultáneamente.
     Cada drum resuelve en orden aleatorio con espaciado uniforme.
     Deceleración easeOutCubic + overshoot al snap. Chars sin resolver
     giran a 8–12 chars/s. Canvas-fill fontSize.
   STABLE (6→7.5s): todos bloqueados. Pulso colectivo: scale 1→1.03→1 c/1.2s.
   EXIT (7.5→9s): todos aceleran de nuevo, opacidad 1→0 durante el giro.
   POSTER (9→10s): fade in.
   ===================================================== */
class SlotDrumTypography extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.t          = 0;
    this.drums      = [];
    this._fontSize  = 0;
    this._slotH     = 0;
    this._lastCycle = -1;
    this.reset();
  }

  reset() {
    this.t          = 0;
    this._lastCycle = -1;
    this.p.randomSeed(this.state.anim.seed);

    // Canvas-fill fontSize: CONVOCATORIA fills ~92% canvas width
    const ctx  = this.p.drawingContext;
    const font = (this.state.anim && this.state.anim.font)       ? this.state.anim.font       : 'Space Mono';
    const wt   = (this.state.anim && this.state.anim.fontWeight)  ? this.state.anim.fontWeight : '700';
    let fs = 40;
    for (; fs <= 600; fs += 2) {
      ctx.font = `${wt} ${fs}px '${font}', sans-serif`;
      if (ctx.measureText('CONVOCATORIA').width >= CANVAS_W * 0.92) break;
    }
    this._fontSize = fs;
    this._slotH    = Math.round(fs * 1.1);   // px height of one char slot

    const slotH = this._slotH;
    const N     = MESSAGE_CHARS.length;
    const charW = fs * 0.62;
    const lineH = fs * 1.08;
    const cy    = CANVAS_H / 2;
    const w1    = MESSAGE_WORDS[0].length * charW;
    const w2    = MESSAGE_WORDS[1].length * charW;

    const positions = [];
    for (let i = 0; i < MESSAGE_WORDS[0].length; i++) {
      positions.push({
        x:       CANVAS_W * 0.5 - w1 * 0.5 + i * charW + charW * 0.5,
        y:       cy - lineH * 0.5,
        char:    MESSAGE_WORDS[0][i],
        charIdx: i
      });
    }
    for (let i = 0; i < MESSAGE_WORDS[1].length; i++) {
      positions.push({
        x:       CANVAS_W * 0.5 - w2 * 0.5 + i * charW + charW * 0.5,
        y:       cy + lineH * 0.5,
        char:    MESSAGE_WORDS[1][i],
        charIdx: MESSAGE_WORDS[0].length + i
      });
    }

    const total = positions.length;

    // Fisher-Yates shuffle for random resolve order
    const order = Array.from({ length: total }, (_, i) => i);
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(this.p.random(i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    // resolveAt: evenly staggered across 6s, last drum starts decel at 5.1s → finishes at 6s
    const RESOLVE_DUR = 0.9;
    const resolveAt   = new Array(total);
    for (let rank = 0; rank < total; rank++) {
      resolveAt[order[rank]] = (rank / (total - 1)) * (6.0 - RESOLVE_DUR);
    }

    this.drums = positions.map((pos, i) => ({
      x:              pos.x,
      y:              pos.y,
      char:           pos.char,
      charIdx:        pos.charIdx,
      resolveAt:      resolveAt[i],
      spinHz:         8 + this.p.random(4),          // char-slots per second when spinning freely
      scrollY:        this.p.random(N * slotH),      // continuous scroll position in px
      resolveScrollY: null,   // target px (landing on correct char), set on first decel frame
      startScrollY:   null,   // scrollY at start of decel
      exitBaseY:      null    // scrollY at start of EXIT phase
    }));
  }

  _easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  _initDecel(drum) {
    const N      = MESSAGE_CHARS.length;
    const slotH  = this._slotH;
    const cycleH = N * slotH;
    drum.startScrollY = drum.scrollY;
    // Nearest scrollY > current that lands drum's correct char at center
    const base   = ((drum.charIdx * slotH) % cycleH + cycleH) % cycleH;
    const target = base + Math.ceil((drum.scrollY + 1 - base) / cycleH) * cycleH;
    drum.resolveScrollY = target;
  }

  advanceState() {
    const spd  = this.state.anim.speed;
    const dt   = 0.016 * spd;
    this.t    += dt;

    const tSec  = this.t % 10;
    const cycle = Math.floor(this.t / 10);
    const N     = MESSAGE_CHARS.length;
    const RESOLVE_DUR = 0.9;

    // Cycle boundary: re-seed starting positions
    if (cycle !== this._lastCycle) {
      this._lastCycle = cycle;
      this.p.randomSeed(this.state.anim.seed + cycle * 37);
      for (const drum of this.drums) {
        drum.scrollY        = this.p.random(N * this._slotH);
        drum.resolveScrollY = null;
        drum.startScrollY   = null;
        drum.exitBaseY      = null;
      }
    }

    for (const drum of this.drums) {
      const spinPxPerSec = drum.spinHz * this._slotH;   // px/s at full speed

      if (tSec < 7.5) {
        // BUILD + STABLE: free spin or decelerate
        if (tSec < drum.resolveAt) {
          drum.scrollY += spinPxPerSec * dt;
        } else {
          const elapsed = tSec - drum.resolveAt;
          if (drum.resolveScrollY === null) this._initDecel(drum);
          if (elapsed < RESOLVE_DUR) {
            const progress    = elapsed / RESOLVE_DUR;
            const eased       = this._easeOut(progress);
            // overshoot: a bump that peaks mid-way then returns to 0
            const overshootPx = this._slotH * 0.25 * Math.sin(progress * Math.PI) * (1 - eased);
            drum.scrollY = drum.startScrollY
              + (drum.resolveScrollY - drum.startScrollY) * eased
              + overshootPx;
          } else {
            drum.scrollY = drum.resolveScrollY;
          }
        }
      } else if (tSec < 9) {
        // EXIT: quadratic spin-up from resolved position
        if (drum.exitBaseY === null) drum.exitBaseY = drum.scrollY;
        const elapsed = tSec - 7.5;
        drum.scrollY  = drum.exitBaseY + 0.5 * spinPxPerSec * elapsed * elapsed / 1.5;
      }
      // POSTER: no update
    }
  }

  render() {
    const tSec      = this.t % 10;
    const [r, g, b] = this.getAnimRgb();
    const ctx       = this.p.drawingContext;
    const fs        = this._fontSize;
    const slotH     = this._slotH;
    const N         = MESSAGE_CHARS.length;
    const font      = (this.state.anim && this.state.anim.font)       ? this.state.anim.font       : 'Space Mono';
    const wt        = (this.state.anim && this.state.anim.fontWeight)  ? this.state.anim.fontWeight : '700';
    const RESOLVE_DUR = 0.9;

    // EXIT fade: opacity 1→0 over 7.5→9s
    let exitAlpha = 1;
    if (tSec >= 7.5 && tSec < 9) exitAlpha = Math.max(0, 1 - (tSec - 7.5) / 1.5);
    else if (tSec >= 9)          exitAlpha = 0;

    // STABLE collective pulse: scale 1→1.03→1 every 1.2s
    let pulseScale = 1;
    if (tSec >= 6 && tSec < 7.5) {
      const phase = ((tSec - 6) % 1.2) / 1.2;
      pulseScale  = 1 + 0.03 * Math.sin(phase * Math.PI * 2);
    }

    ctx.save();
    ctx.font         = `${wt} ${fs}px '${font}', sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    const halfW = fs * 0.32;
    const visH  = slotH * 1.4;   // visible clip window height per drum

    for (const drum of this.drums) {
      const isFullyResolved = drum.resolveScrollY !== null
        && (tSec - drum.resolveAt) >= RESOLVE_DUR
        && tSec < 7.5;

      ctx.save();

      // Clip to drum column (canvas-space coordinates, before any transform)
      ctx.beginPath();
      ctx.rect(drum.x - halfW, drum.y - visH * 0.5, halfW * 2, visH);
      ctx.clip();

      // Pulse scale anchored at drum center (only for fully resolved drums in STABLE)
      if (isFullyResolved && pulseScale !== 1) {
        ctx.translate(drum.x, drum.y);
        ctx.scale(pulseScale, pulseScale);
        ctx.translate(-drum.x, -drum.y);
      }

      // scrollY → which chars are visible and at what y positions
      const scrollY    = drum.scrollY;
      const fracOffset = ((scrollY % slotH) + slotH) % slotH;  // sub-slot px offset
      const baseIdx    = Math.floor(scrollY / slotH);           // char at top of window

      for (let row = -1; row <= 2; row++) {
        const ci    = ((baseIdx + row) % N + N) % N;
        const yPos  = drum.y - fracOffset + row * slotH;
        const dist  = Math.abs(yPos - drum.y);
        const sAlpha = Math.max(0, 1 - dist / (slotH * 0.62));
        if (sAlpha < 0.01) continue;

        ctx.globalAlpha = exitAlpha * sAlpha;
        ctx.fillStyle   = `rgb(${r},${g},${b})`;
        ctx.fillText(MESSAGE_CHARS[ci], drum.x, yPos);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  getPosterAlpha() {
    const tSec = this.t % 10;
    if (tSec < 9) return 0;
    return Math.min(1, tSec - 9);
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
  'rotating-typography':  RotatingTypography,
  'pixel-texture':        PixelTexture,
  'glyph-flow-field':     GlyphFlowField,
  'slot-drum-typography': SlotDrumTypography
};
