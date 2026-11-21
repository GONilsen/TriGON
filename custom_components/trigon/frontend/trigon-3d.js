// TriGON 3D: "exploded" cutaway view of the house – floors pulled apart, walls with height,
// low front walls, floor colour by room type, people as pins and floor labels on the right.
// Pure SVG with our own projection (no CSS 3D), so it renders the same in Safari and Chrome.
const NS = "http://www.w3.org/2000/svg";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ini = (n) => String(n || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const VEGG = 1.05;   // wall height (m) – cut away like a dollhouse
const LAV = 0.32;    // height of exterior walls facing the camera
const INNE = 0.7;    // height of interior walls
const PLATE = 0.28;  // floor slab thickness
const ELEV = 30 * Math.PI / 180;
const LUFT = 1.1;    // free space between floors on screen (m)

function inni(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function gulvfarge(navn, i) {
  const n = String(navn || "").toLowerCase();
  if (/bad|wc|toalett|dusj|vask|bath|laundry|shower/.test(n)) return ["#C3C7CC", "#AEB3B9"];
  if (/garasje|garage|bod|teknisk|kjeller|storage|utility|carport/.test(n)) return ["#B5B3AE", "#A3A19C"];
  if (/kjøkken|kjokken|kitchen/.test(n)) return ["#DCCDB6", "#CDBDA3"];
  if (/gang|trapp|entre|entré|hall|stair/.test(n)) return ["#D2B48E", "#C2A47E"];
  const tre = [["#CFA97F", "#BE976C"], ["#D6B48C", "#C4A17A"], ["#C9A378", "#B89068"]];
  return tre[i % tre.length];
}

export class Hus3D {
  constructor(el, opts = {}) {
    this.el = el;
    this.opts = opts;
    this.yaw = opts.yaw ?? -12;
    this.personer = [];
    el.classList.add("hus3d");
    el.innerHTML = `<style>
      .hus3d { position: relative; user-select: none; -webkit-user-select: none; touch-action: pan-y; cursor: grab; }
      .hus3d svg { width: 100%; height: auto; display: block; overflow: visible; }
      .hus3d text.rn { font-size: .34px; fill: #4E443B; opacity: .8; text-anchor: middle; dominant-baseline: central; pointer-events: none;
        font-family: inherit; font-weight: 500; }
      .hus3d .lapp rect { fill: #4B535D; stroke: rgba(255, 255, 255, .22); stroke-width: .03; }
      .hus3d .lapp text { fill: #fff; font-size: .5px; font-weight: 600; dominant-baseline: central; font-family: inherit; }
      .hus3d .lapp .ant { fill: #7FEFFF; }
      .hus3d .nal { transition: transform .9s cubic-bezier(.3, .7, .3, 1); cursor: pointer; }
      .hus3d.drar .nal { transition: none; }
      .hus3d .nal text.i { fill: #fff; font-size: .3px; font-weight: 700; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
      .hus3d .nal .navn { font-size: .3px; font-weight: 600; text-anchor: middle; dominant-baseline: central; fill: #fff; pointer-events: none; }
      .hus3d .puls { transform-box: fill-box; transform-origin: center; animation: h3dpuls 2.6s ease-out infinite; pointer-events: none; }
      @keyframes h3dpuls { from { transform: scale(.6); opacity: .7; } to { transform: scale(2.6); opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .hus3d .puls { animation: none; opacity: 0; } }
    </style><svg></svg>`;
    this.svg = el.querySelector("svg");
    let dra = null;
    el.addEventListener("pointerdown", (ev) => { dra = { x: ev.clientX, yaw: this.yaw, id: ev.pointerId, flyttet: false }; });
    el.addEventListener("pointermove", (ev) => {
      if (!dra || dra.id !== ev.pointerId) return;
      const dx = ev.clientX - dra.x;
      if (!dra.flyttet && Math.abs(dx) < 8) return;
      if (!dra.flyttet) { dra.flyttet = true; el.classList.add("drar"); try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ } }
      this.yaw = Math.max(-60, Math.min(60, dra.yaw + dx * 0.25));
      this._tegn();
    });
    const slipp = () => { if (dra && dra.flyttet) this._stopp = Date.now(); dra = null; el.classList.remove("drar"); };
    el.addEventListener("pointerup", slipp);
    el.addEventListener("pointercancel", slipp);
    el.addEventListener("click", (ev) => { if (this._stopp && Date.now() - this._stopp < 350) { ev.stopPropagation(); ev.preventDefault(); } }, true);
    el.addEventListener("dblclick", () => { this.yaw = opts.yaw ?? -12; this._tegn(); });
  }

  // etasjer: [{id, navn, niva, rom: [{id, navn, polygon}]}]
  settEtasjer(etasjer) {
    const key = JSON.stringify(etasjer.map((e) => [e.id, e.navn, e.niva, e.rom.map((r) => [r.id, r.navn, r.polygon])]));
    if (key === this._geoKey) return;
    this._geoKey = key;
    this.etasjer = etasjer.filter((e) => e.rom.length).slice().sort((a, b) => a.niva - b.niva);
    const pts = this.etasjer.flatMap((e) => e.rom.flatMap((r) => r.polygon));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    this.cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    this.cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    // Exterior/interior per wall: a point just outside the edge that lies in another room means an interior wall
    this.vegger = {};
    for (const e of this.etasjer) {
      const liste = [];
      for (const r of e.rom) {
        const P = r.polygon, n = P.length;
        for (let i = 0; i < n; i++) {
          const a = P[i], b = P[(i + 1) % n];
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (L < 0.05) continue;
          let nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L;
          const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
          if (inni(mx + nx * 0.08, my + ny * 0.08, P)) { nx = -nx; ny = -ny; }
          const ute = !e.rom.some((o) => o !== r && inni(mx + nx * 0.15, my + ny * 0.15, o.polygon));
          liste.push({ a, b, nx, ny, ute });
        }
      }
      this.vegger[e.id] = liste;
    }
    this._tegn();
  }

  // personer: [{id, navn, farge, bilde, hjemme, etasje, x, y, rom_id}]
  settPersoner(personer) {
    this.personer = personer;
    const opptatt = personer.filter((p) => p.hjemme && p.rom_id).map((p) => p.rom_id).sort().join(",");
    if (opptatt !== this._opptatt) { this._opptatt = opptatt; this._tegn(); } else this._plasserPersoner();
  }

  _p(x, y, z) {
    const t = this.yaw * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    const X = x - this.cx, Y = y - this.cy;
    const xr = X * c - Y * s, yr = X * s + Y * c;
    return [xr, yr * Math.sin(ELEV) - z * Math.cos(ELEV), yr * Math.cos(ELEV) + z * Math.sin(ELEV)];
  }

  // Floors are pulled apart just enough that they never overlap on screen
  _z(i) { return (this._zs && this._zs[i]) || 0; }

  // Each floor is lifted until its lowest screen point (front slab edge) clears the top of the floor below
  _beregnSteg() {
    const ce = Math.cos(ELEV);
    const sy = (e) => e.rom.flatMap((r) => r.polygon).map((p) => this._p(p[0], p[1], 0)[1]);
    this._zs = [0];
    for (let i = 1; i < this.etasjer.length; i++) {
      const under = sy(this.etasjer[i - 1]), over = sy(this.etasjer[i]);
      const topp = Math.min(...under) - (this._zs[i - 1] + VEGG) * ce;   // highest point of the floor below
      const bunn = Math.max(...over) + PLATE * ce;                         // lowest point of this floor at z = 0
      this._zs.push(Math.max((bunn - topp + LUFT) / ce, this._zs[i - 1] + VEGG + 0.5));
    }
  }

  _tegn() {
    if (!this.etasjer || !this.etasjer.length) { this.svg.innerHTML = ""; return; }
    this._beregnSteg();
    const t = this.yaw * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    const opptatt = new Set((this._opptatt || "").split(",").filter(Boolean));
    const pt = (q) => `${q[0].toFixed(3)},${q[1].toFixed(3)}`;
    let ut = "";
    const alle = [];
    this.etasjer.forEach((e, i) => {
      const z = this._z(i);
      const deler = [];
      // Slab edges (front-facing exterior edges)
      for (const w of this.vegger[e.id]) {
        if (!w.ute) continue;
        const fy = w.nx * s + w.ny * c;
        if (fy <= 0.05) continue;
        const q = [this._p(w.a[0], w.a[1], z), this._p(w.b[0], w.b[1], z), this._p(w.b[0], w.b[1], z - PLATE), this._p(w.a[0], w.a[1], z - PLATE)];
        const lys = Math.round(222 + 20 * (w.nx * c - w.ny * s));
        deler.push(`<polygon points="${q.map(pt).join(" ")}" fill="rgb(${lys},${lys - 2},${lys - 6})" stroke="rgba(0,0,0,.08)" stroke-width=".02"/>`);
        alle.push(...q);
      }
      // Floors
      e.rom.forEach((r, k) => {
        const [f1, f2] = gulvfarge(r.navn, k);
        const q = r.polygon.map((p) => this._p(p[0], p[1], z));
        const opp = opptatt.has(r.id);
        deler.push(`<polygon points="${q.map(pt).join(" ")}" fill="${opp ? f1 : f2}" stroke="${opp ? "#7FEFFF" : "rgba(60,45,30,.25)"}" stroke-width="${opp ? 0.06 : 0.02}"${opp ? ' filter="url(#h3d-glod)"' : ""}/>`);
        alle.push(...q);
      });
      // Walls, painter's order (furthest first)
      const vegger = this.vegger[e.id].map((w) => {
        const fy = w.nx * s + w.ny * c;
        const h = !w.ute ? INNE : fy > 0.2 ? LAV : VEGG;
        const q = [this._p(w.a[0], w.a[1], z), this._p(w.b[0], w.b[1], z), this._p(w.b[0], w.b[1], z + h), this._p(w.a[0], w.a[1], z + h)];
        const d = (q[0][2] + q[1][2]) / 2 - (w.ute ? 0 : 0.01);
        return { q, d, w, h };
      }).sort((a, b) => a.d - b.d);
      for (const v of vegger) {
        // Light from the upper left: walls facing left/front are brighter
        const lys = (v.w.nx * c - v.w.ny * s) * -0.53 + (v.w.nx * s + v.w.ny * c) * 0.85;
        const g = Math.round(208 + 38 * (0.5 + 0.5 * Math.abs(lys)));
        deler.push(`<polygon points="${v.q.map(pt).join(" ")}" fill="rgb(${g},${g - 3},${g - 8})" stroke="rgba(0,0,0,.1)" stroke-width=".015"/>`);
        deler.push(`<line x1="${v.q[3][0].toFixed(3)}" y1="${v.q[3][1].toFixed(3)}" x2="${v.q[2][0].toFixed(3)}" y2="${v.q[2][1].toFixed(3)}" stroke="#3A4048" stroke-width=".11" stroke-linecap="round"/>`);
        alle.push(v.q[2], v.q[3]);
      }
      // Room names on the floor
      for (const r of e.rom) {
        const rx = r.polygon.map((p) => p[0]), ry = r.polygon.map((p) => p[1]);
        const m = this._p((Math.min(...rx) + Math.max(...rx)) / 2, (Math.min(...ry) + Math.max(...ry)) / 2, z);
        deler.push(`<text class="rn" x="${m[0].toFixed(3)}" y="${m[1].toFixed(3)}">${esc(r.navn)}</text>`);
      }
      ut += `<g data-etasje="${esc(e.id)}">${deler.join("")}</g>`;
    });
    // Bounds
    const xs = alle.map((q) => q[0]), ys = alle.map((q) => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) - 1.6, y1 = Math.max(...ys) + 0.4;
    // Floor labels to the right
    let lapper = "";
    const ant = {};
    for (const p of this.personer) if (p.hjemme && p.etasje) ant[p.etasje] = (ant[p.etasje] || 0) + 1;
    const lx = x1 + 0.9;
    let maks = lx;
    this.etasjer.forEach((e, i) => {
      const ly = this._p(this.cx, this.cy, this._z(i) + VEGG * 0.4)[1];
      const tekst = esc(e.navn);
      const w = 0.32 * tekst.length + 0.9 + (ant[e.id] ? 0.7 : 0);
      maks = Math.max(maks, lx + w);
      lapper += `<g class="lapp"><rect x="${lx.toFixed(2)}" y="${(ly - 0.42).toFixed(2)}" width="${w.toFixed(2)}" height=".84" rx=".26"/>
        <text x="${(lx + 0.38).toFixed(2)}" y="${ly.toFixed(2)}">${tekst}${ant[e.id] ? ` <tspan class="ant">· ${ant[e.id]}</tspan>` : ""}</text></g>`;
    });
    this._vb = [x0 - 0.5, y0, maks - x0 + 1, y1 - y0];
    this.svg.setAttribute("viewBox", this._vb.map((v) => v.toFixed(2)).join(" "));
    this.svg.innerHTML = `<defs><filter id="h3d-glod" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation=".06" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <clipPath id="h3d-rund" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath></defs>
      ${ut}${lapper}<g class="nalar"></g>`;
    this._naler = {};
    this._plasserPersoner();
  }

  _plasserPersoner() {
    const lag = this.svg.querySelector(".nalar");
    if (!lag || !this.etasjer) return;
    const indeks = Object.fromEntries(this.etasjer.map((e, i) => [e.id, i]));
    const synlige = this.personer.filter((p) => p.hjemme && p.x != null && indeks[p.etasje] != null);
    for (const [id, n] of Object.entries(this._naler)) if (!synlige.some((p) => p.id === id)) { n.remove(); delete this._naler[id]; }
    const brukt = {};
    for (const p of synlige) {
      const z = this._z(indeks[p.etasje]);
      const k = `${Math.round(p.x * 2)}:${Math.round(p.y * 2)}:${p.etasje}`;
      const dx = (brukt[k] = (brukt[k] || 0) + 1) - 1;
      const [bx, by] = this._p(p.x + dx * 0.45, p.y, z);
      let g = this._naler[p.id];
      if (!g) {
        g = document.createElementNS(NS, "g");
        g.setAttribute("class", "nal");
        const H = 1.25, r = 0.3;
        const hode = p.bilde
          ? `<circle cy="${-H}" r="${r + 0.04}" fill="${p.farge}"/><image href="${esc(p.bilde)}" x="${-r}" y="${-H - r}" width="${2 * r}" height="${2 * r}" clip-path="url(#h3d-rund)" preserveAspectRatio="xMidYMid slice"/>`
          : `<circle cy="${-H}" r="${r}" fill="${p.farge}" stroke="#fff" stroke-width=".05"/><text class="i" y="${-H}">${esc(ini(p.navn))}</text>`;
        const bredde = 0.19 * String(p.navn).length + 0.4;
        g.innerHTML = `<ellipse class="puls" rx=".45" ry="${(0.45 * Math.sin(ELEV)).toFixed(3)}" fill="none" stroke="${p.farge}" stroke-width=".05"/>
          <ellipse rx=".32" ry="${(0.32 * Math.sin(ELEV)).toFixed(3)}" fill="rgba(0,0,0,.25)"/>
          <line y1="0" y2="${-H + r}" stroke="${p.farge}" stroke-width=".07" stroke-linecap="round"/>
          ${hode}
          <rect x="${(-bredde / 2).toFixed(2)}" y="${(-H - r - 0.52).toFixed(2)}" width="${bredde.toFixed(2)}" height=".4" rx=".2" fill="${p.farge}"/>
          <text class="navn" y="${(-H - r - 0.32).toFixed(2)}">${esc(p.navn)}</text>
          <title>${esc(p.navn)}</title>`;
        g.addEventListener("click", () => this.opts.onPerson && this.opts.onPerson(p.id));
        lag.appendChild(g);
        this._naler[p.id] = g;
      }
      g.style.transform = `translate(${bx.toFixed(3)}px, ${by.toFixed(3)}px)`;
    }
  }
}
