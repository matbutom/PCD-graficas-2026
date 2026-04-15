/* =====================================================
   ANIMATIONS.JS — Processing Community Day 2026
   Todas las animaciones giran en torno a "CONVOCATORIA ABIERTA"
   ===================================================== */

/* =====================================================
   CONSTANTES GLOBALES DE LAYOUT
   ===================================================== */
const CANVAS_W = 1080;
const CANVAS_H = 1350;
const MARGIN   = 40;

const ZONES = {
  topBar:    { y: 0,    h: 40   },
  json:      { y: 40,   h: 635  },
  anim:      { y: 620,  h: 212  },  // fila 3 del grid — espacio en blanco entre info y título
  title:     { y: 887,  h: 423  },
  bottomBar: { y: 1310, h: 40   }
};

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
  getAnimZone() {
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

  advanceState() {}
  render()       {}
  reset()        {}
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

  reset() {
    const params = this.state.anim.params['letter-physics'];
    const r  = params.circleSize;
    const sz = this.getTextSize();
    this.p.randomSeed(this.state.anim.seed);
    const layout = getMessageLayout(this.getAnimZone(), sz);
    this.noiseZ   = 0;
    this.snapMode = false;

    // Typewriter intro state
    this.phase   = 'typewriter'; // 'typewriter' | 'physics'
    this.twIdx   = 0;            // número de letras reveladas
    this.twTimer = 0;            // frame counter dentro de la fase

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
    if (this.phase === 'typewriter') {
      this.twTimer++;
      const twDelay  = Math.max(3, Math.round(9 / spd));   // frames por letra
      const pauseDur = Math.max(30, Math.round(90 / spd));  // frames de pausa al final

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

    // Fase physics — render normal
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
   TRIGGER DE LECTURA: en reposo / mouse lejos — las letras en sus posiciones
   originales forman el mensaje tileado. Fila central siempre legible.
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
    const sz     = this.getTextSize();
    const cols   = Math.max(4, Math.round(b.w / (sz * 1.05)));
    const rows   = Math.max(3, Math.round(b.h / (sz * 1.5)));
    const stepX  = b.w / cols;
    const stepY  = b.h / rows;
    const midRow = Math.floor(rows / 2);
    this.cols    = cols + 1;
    this.points  = [];

    for (let iy = 0; iy <= rows; iy++) {
      for (let ix = 0; ix <= cols; ix++) {
        // Mid row cycles through the full message; other rows repeat MESSAGE_CHARS
        let charIdx;
        if (iy === midRow) {
          charIdx = ix % MESSAGE_CHARS.length;
        } else {
          charIdx = (iy * (cols+1) + ix) % MESSAGE_CHARS.length;
        }
        this.points.push({
          ox:       b.x + ix * stepX,
          oy:       b.y + iy * stepY,
          x:        b.x + ix * stepX,
          y:        b.y + iy * stepY,
          vx: 0, vy: 0,
          char:     MESSAGE_CHARS[charIdx],
          isCenter: iy === midRow
        });
      }
    }
  }

  advanceState() {
    const params = this.state.anim.params['grid-distortion'];
    const rad    = params.radius;
    const force  = params.force;
    for (const pt of this.points) {
      if (pt.isCenter) continue; // center row stays fixed
      const dx = this.mx - pt.ox, dy = this.my - pt.oy;
      const d  = Math.sqrt(dx*dx + dy*dy);
      let fx = 0, fy = 0;
      if (d < rad && d > 0) {
        const str = (1 - d/rad) * force;
        fx = -(dx/d)*str; fy = -(dy/d)*str;
      }
      fx += (pt.ox - pt.x) * 0.08;
      fy += (pt.oy - pt.y) * 0.08;
      pt.vx = (pt.vx + fx*0.016) * 0.85;
      pt.vy = (pt.vy + fy*0.016) * 0.85;
      pt.x += pt.vx; pt.y += pt.vy;
    }
  }

  render() {
    const [r,g,b] = this.getAnimRgb();
    const sz      = this.getTextSize();
    const ctx     = this.p.drawingContext;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (const pt of this.points) {
      const fs    = pt.isCenter ? sz * 0.92 : sz * 0.6;
      const alpha = pt.isCenter ? 1.0 : 0.42;
      ctx.font      = getFont(this.state, fs);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillText(pt.char, pt.x, pt.y);
    }
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
   6. WAVE INTERFERENCE — Líneas de texto que ondean
   TRIGGER DE LECTURA: mouse lejos → ondas se aplanan, mensaje legible en filas.
   ===================================================== */
class WaveInterference extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.t = 0;
    this.rowPhases = [];
    this.reset();
  }

  reset() {
    const params = this.state.anim.params['wave-interference'];
    this.p.randomSeed(this.state.anim.seed);
    this.t = 0;
    this.rowPhases = Array.from({ length: params.emitters }, (_, i) =>
      i * (Math.PI * 2 / params.emitters) + this.p.random(Math.PI)
    );
  }

  advanceState() {
    this.t += 0.022 * this.state.anim.speed;
  }

  render() {
    const p      = this.p;
    const params = this.state.anim.params['wave-interference'];
    const [r,g,b] = this.getAnimRgb();
    const sz     = this.getTextSize();
    const b_     = this.getBounds();
    const freq   = params.frequency;
    const amp    = params.amplitude;
    const numRows = params.emitters;
    const ctx    = p.drawingContext;
    const charW  = sz * 0.62;
    const rowH   = b_.h / (numRows + 1);

    // Mouse controls local amplitude
    const inCanvas = b_.x <= this.mx && this.mx <= b_.x + b_.w;
    const mAmp     = inCanvas ? amp : amp * 0.2;

    const repeat = (MESSAGE + '  ').repeat(6);
    ctx.font         = getFont(this.state, sz * 0.78);
    ctx.textBaseline = 'middle';

    for (let ri = 0; ri < numRows; ri++) {
      const baseY    = b_.y + (ri + 1) * rowH;
      const phase    = this.rowPhases[ri];
      const rowAlpha = p.map(ri, 0, numRows - 1, 0.92, 0.3);

      for (let ci = 0; ci < repeat.length; ci++) {
        const ch = repeat[ci];
        const cx_ = b_.x - charW + ci * charW;
        if (cx_ > b_.x + b_.w + charW) break;

        const waveY = Math.sin(this.t + phase + ci * freq) * mAmp;
        const mdx   = cx_ - this.mx, mdy = baseY - this.my;
        const md    = Math.sqrt(mdx*mdx + mdy*mdy);
        const local = md < 160 ? Math.sin(this.t*2.5 + md*0.04) * (1 - md/160) * amp * 0.7 : 0;

        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(${r},${g},${b},${rowAlpha})`;
        ctx.fillText(ch, cx_, baseY + waveY + local);
      }
    }
  }
}

/* =====================================================
   7. CODE RAIN — Lluvia con letras de CONVOCATORIA ABIERTA
   TRIGGER DE LECTURA: columnas sincronizadas forman el mensaje en vertical.
   Mouse cerca de una columna la congela.
   ===================================================== */
class CodeRain extends BaseAnimation {
  constructor(p, state) {
    super(p, state);
    this.drops  = [];
    this.buffer = null;
    this.frame  = 0;
    this.reset();
  }

  reset() {
    const sz   = this.getTextSize();
    const colW = Math.max(18, Math.round(sz * 0.72));
    const cols = Math.floor(CANVAS_W / colW);
    this.p.randomSeed(this.state.anim.seed);
    this.colW     = colW;
    this.fontSize = sz * 0.72;
    // Every 3rd column is a "message column" — will display MESSAGE vertically
    this.msgCols = new Set();
    const spacing = Math.max(3, Math.floor(cols / 4));
    for (let i = spacing; i < cols; i += spacing) this.msgCols.add(i);

    this.drops = Array.from({ length: cols }, () => ({
      y:     this.p.random(-CANVAS_H, 0),
      charI: Math.floor(this.p.random(MESSAGE_CHARS.length)),
      dir:   this.p.random() > 0.12 ? 1 : -1
    }));

    if (!this.buffer) this.buffer = this.p.createGraphics(CANVAS_W, CANVAS_H);
    const [bgR,bgG,bgB] = this.getBg();
    this.buffer.background(bgR, bgG, bgB);
    this.frame = 0;
  }

  advanceState() {
    const params  = this.state.anim.params['code-rain'];
    const spd     = this.state.anim.speed;
    const colW    = this.colW;
    const fs      = this.fontSize;
    this.frame   += spd;

    const [bgR,bgG,bgB] = this.getBg();
    this.buffer.fill(bgR, bgG, bgB, 20);
    this.buffer.noStroke();
    this.buffer.rect(0, 0, CANVAS_W, CANVAS_H);

    const [r,g,b] = this.getAnimRgb();
    const bCtx    = this.buffer.drawingContext;
    bCtx.font         = getFont(this.state, fs);
    bCtx.textBaseline = 'top';
    bCtx.textAlign    = 'center';

    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      const x    = i * colW + colW * 0.5;

      // Mouse freezes nearby columns
      if (Math.abs(x - this.mx) < colW * 1.6) continue;

      drop.charI = (drop.charI + 1) % MESSAGE_CHARS.length;
      const ch   = MESSAGE_CHARS[drop.charI];
      const prevCh = MESSAGE_CHARS[(drop.charI - 1 + MESSAGE_CHARS.length) % MESSAGE_CHARS.length];

      drop.y += params.dropSpeed * spd * drop.dir;

      bCtx.fillStyle = `rgba(${r},${g},${b},1)`;
      bCtx.fillText(ch, x, drop.y);
      bCtx.fillStyle = `rgba(${r},${g},${b},0.3)`;
      bCtx.fillText(prevCh, x, drop.y - fs * drop.dir);

      if (drop.dir === 1 && drop.y > CANVAS_H && Math.random() > 0.975) drop.y = 0;
      if (drop.dir === -1 && drop.y < 0       && Math.random() > 0.975) drop.y = CANVAS_H;

      // Message columns: every ~100 frames show MESSAGE vertically
      if (this.msgCols.has(i) && Math.floor(this.frame) % 100 < MESSAGE_CHARS.length) {
        const mi    = Math.floor(this.frame) % 100;
        if (mi < MESSAGE_CHARS.length) {
          const msgY = CANVAS_H * 0.18 + mi * (fs * 1.3);
          bCtx.fillStyle = `rgba(${r},${g},${b},0.95)`;
          bCtx.fillText(MESSAGE_CHARS[mi], x, msgY);
        }
      }
    }
  }

  render() { this.p.image(this.buffer, 0, 0); }
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
  'pixel-texture':        PixelTexture
};
