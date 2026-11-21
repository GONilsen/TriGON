// TriGON map card for dashboards: floor plans with every person, live.
// Loaded automatically by the TriGON integration. Minimal config:
//   type: custom:trigon-card
// Options: entity, title, view (tabs|stacked), floor, style (glow|theme),
//          show_people, show_background, show_scanners, trails
const NS = "http://www.w3.org/2000/svg";
const FARGER = ["#3FA7FF", "#FF5FA2", "#FFB020", "#3FD08A", "#B07CFF", "#FF7A45"];
const BILDER = {}; // floor -> {v, url} (shared by all cards)

const TEKST = {
  nb: { away: "Ikke hjemme", unknown: "ukjent", all: "Alle", noMap: "Fant ikke TriGON-kartet. Er TriGON satt opp?",
    noFloors: "Ingen etasjer å vise", title: "Hvor er vi", entity: "Kart-sensor (finnes automatisk)", ttl: "Tittel",
    view: "Visning", tabs: "Én etasje om gangen", stacked: "Alle etasjer under hverandre", floor: "Startetasje (id, valgfritt)",
    style: "Stil", glow: "Glød (mørkt kart)", theme: "Følg temaet", show_people: "Vis personer øverst",
    show_background: "Vis plantegning", show_scanners: "Vis proxyer", trails: "Vis spor" },
  en: { away: "Not home", unknown: "unknown", all: "All", noMap: "TriGON map not found. Is TriGON set up?",
    noFloors: "No floors to show", title: "Where are we", entity: "Map sensor (found automatically)", ttl: "Title",
    view: "View", tabs: "One floor at a time", stacked: "All floors stacked", floor: "Start floor (id, optional)",
    style: "Style", glow: "Glow (dark map)", theme: "Follow theme", show_people: "Show people on top",
    show_background: "Show floor plan", show_scanners: "Show proxies", trails: "Show trails" },
};
const språk = (hass) => (/^(nb|nn|no)/i.test((hass && ((hass.locale && hass.locale.language) || hass.language)) || "en") ? "nb" : "en");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ini = (n) => String(n || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

class TrigonCard extends HTMLElement {
  setConfig(config) {
    this._c = { view: "tabs", style: "glow", show_people: true, show_background: true, show_scanners: false, trails: true, ...config };
    this._spor = {};
    this._geoKey = null;
    this._valgt = this._c.floor || null;
    const root = this.shadowRoot || this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 14px; overflow: hidden; }
        .tittel { font-size: 20px; font-weight: 500; margin: 2px 2px 12px; color: var(--primary-text-color); }
        .personer { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .personer:empty { display: none; }
        .p { display: flex; align-items: center; gap: 9px; padding: 5px 14px 5px 5px; border-radius: 22px; cursor: pointer;
          background: color-mix(in srgb, var(--f) 12%, transparent); border: 1px solid color-mix(in srgb, var(--f) 35%, transparent);
          -webkit-tap-highlight-color: transparent; transition: opacity .3s; }
        .p.borte { opacity: .45; filter: saturate(.3); }
        .av { width: 30px; height: 30px; border-radius: 15px; background: var(--f) center / cover; color: #fff; font-weight: 700;
          font-size: 12px; display: grid; place-items: center; box-shadow: 0 0 0 2px var(--f), 0 0 10px color-mix(in srgb, var(--f) 60%, transparent); }
        .av.bilde { color: transparent; }
        .p .navn { font-size: 13px; font-weight: 600; color: var(--primary-text-color); line-height: 1.15; }
        .p .rom { font-size: 11px; color: var(--secondary-text-color); }
        .etasjer { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
        .etasjer:empty { display: none; }
        .chip { border: 1px solid var(--divider-color); background: none; color: var(--primary-text-color); font: inherit; font-size: 13px;
          padding: 5px 13px; border-radius: 16px; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; }
        .chip.aktiv { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
        .chip .ant { font-size: 11px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: inline-grid;
          place-items: center; background: color-mix(in srgb, currentColor 20%, transparent); }
        .chip .ant:empty { display: none; }
        .etasje + .etasje { margin-top: 12px; }
        .etasje h3 { margin: 4px 2px 6px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          color: var(--secondary-text-color); }
        svg { width: 100%; height: auto; display: block; border-radius: 14px; }
        .rf { fill: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
          stroke: color-mix(in srgb, var(--primary-text-color) 35%, transparent); stroke-width: .06; stroke-linejoin: round; }
        .rf.opptatt { fill: color-mix(in srgb, var(--primary-color) 16%, transparent); }
        .rn { fill: var(--secondary-text-color); font-size: .4px; text-anchor: middle; dominant-baseline: central; }
        .px { fill: color-mix(in srgb, var(--primary-text-color) 45%, transparent); }
        .halo { opacity: .16; }
        .pers { transition: transform .9s cubic-bezier(.3, .7, .3, 1); cursor: pointer; }
        .pers text { fill: #fff; font-size: .36px; font-weight: 700; text-anchor: middle; dominant-baseline: central; }
        .halo, .ring, .spor { pointer-events: none; }
        .ring { fill: none; stroke-width: .05; transform-box: fill-box; transform-origin: center; animation: radar 2.8s ease-out infinite; }
        .ring.r2 { animation-delay: 1.4s; }
        @keyframes radar { from { transform: scale(1); opacity: .75; } to { transform: scale(3.6); opacity: 0; } }
        .spor { fill: none; stroke-width: .08; stroke-linecap: round; }
        .glod svg { background: radial-gradient(120% 90% at 30% 15%, #16263f 0%, #0c1527 55%, #070c17 100%); }
        .glod .rf { fill: rgba(127, 239, 255, .035); stroke: #7FEFFF; stroke-opacity: .5; stroke-width: .05; }
        .glod .rf.opptatt { fill: rgba(127, 239, 255, .16); stroke-opacity: .95; animation: puls 3.2s ease-in-out infinite; }
        @keyframes puls { 0%, 100% { fill-opacity: .55; } 50% { fill-opacity: 1; } }
        .glod .rn { fill: rgba(214, 232, 255, .72); }
        .glod .px { fill: #A9D4FF; opacity: .8; }
        .glod image.plan { filter: invert(1) hue-rotate(180deg); }
        .tom { color: var(--secondary-text-color); font-size: 13px; padding: 8px 2px; }
        @media (prefers-reduced-motion: reduce) { .ring, .glod .rf.opptatt { animation: none; } .ring { opacity: 0; } }
      </style>
      <ha-card><div class="tittel" hidden></div><div class="personer"></div><div class="etasjer"></div><div class="kart"></div></ha-card>`;
    root.querySelector("ha-card").classList.toggle("glod", this._c.style !== "theme");
    const t = root.querySelector(".tittel");
    t.hidden = !this._c.title; t.textContent = this._c.title || "";
    if (this._hass) this.hass = this._hass;
  }

  _finnKart(hass) {
    if (this._c.entity) return this._c.entity;
    if (this._auto && hass.states[this._auto]) return this._auto;
    for (const id of ["sensor.trigon_map", "sensor.trigon_kart"]) if (hass.states[id]) return (this._auto = id);
    const f = Object.values(hass.states).find((s) => s.entity_id.startsWith("sensor.") && s.attributes.floors && s.attributes.persons && s.attributes.scanners);
    return (this._auto = f ? f.entity_id : null);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._c) return;
    this._t = TEKST[språk(hass)];
    const root = this.shadowRoot;
    const id = this._finnKart(hass);
    const k = id && hass.states[id];
    if (!k) { root.querySelector(".kart").innerHTML = `<div class="tom">${this._t.noMap}</div>`; this._geoKey = null; return; }
    const a = k.attributes;
    this._etasjer = a.floors || [];
    this._planer = a.plans || {};
    const pers = (a.persons || []).map((p, i) => {
      const st = hass.states[p.entity];
      const ha = p.person && hass.states[p.person];
      return { ...p, farge: (this._c.colors || {})[p.id] || FARGER[i % FARGER.length], st, at: st ? st.attributes : {},
        bilde: ha && ha.attributes.entity_picture };
    });
    this._pers = pers;
    this._oppdaterSpor(pers);
    if (this._c.view !== "stacked" && !this._valgtBruker) {
      // Følg etasjen der flest er hjemme, til brukeren velger selv
      const ant = this._antall(pers);
      const best = Object.entries(ant).sort((x, y) => y[1] - x[1])[0];
      const fallback = (this._etasjer.find((e) => e.level === 0) || this._etasjer[0] || {}).id;
      const ny = this._c.floor || (best ? best[0] : fallback);
      if (ny !== this._valgt) { this._valgt = ny; this._geoKey = null; }
    }
    const geoKey = JSON.stringify([a.floors, a.scanners, a.plans, this._valgt, Object.keys(BILDER).map((f) => BILDER[f].v)]);
    if (geoKey !== this._geoKey) { this._geoKey = geoKey; this._tegnKart(a); this._lastBilder(); }
    this._tegnPersoner(pers);
    this._tegnEtasjevalg(pers);
    this._oppdaterMarkorer(pers);
  }

  _antall(pers) {
    const ant = {};
    for (const p of pers) if (p.at.home && p.at.floor) ant[p.at.floor] = (ant[p.at.floor] || 0) + 1;
    return ant;
  }

  async _lastBilder() {
    if (!this._c.show_background || !this._hass.fetchWithAuth) return;
    let endret = false;
    for (const [fid, m] of Object.entries(this._planer)) {
      const c = BILDER[fid];
      if (c && c.v === m.v) continue;
      if (c && c.laster === m.v) continue;
      BILDER[fid] = { ...(c || {}), laster: m.v };
      try {
        const r = await this._hass.fetchWithAuth(`/api/trigon/plan/${fid}?v=${m.v}`);
        if (!r.ok) continue;
        const url = URL.createObjectURL(await r.blob());
        BILDER[fid] = { url, v: m.v };
        endret = true;
      } catch (e) { /* ignore */ }
    }
    if (endret) { this._geoKey = null; this.hass = this._hass; }
  }

  _tegnEtasjevalg(pers) {
    const el = this.shadowRoot.querySelector(".etasjer");
    if (this._c.view === "stacked" || this._etasjer.length < 2) { el.innerHTML = ""; return; }
    const ant = this._antall(pers);
    const html = this._etasjer.map((e) => `<button class="chip ${e.id === this._valgt ? "aktiv" : ""}" data-e="${esc(e.id)}">${esc(e.name)}<span class="ant">${ant[e.id] || ""}</span></button>`).join("");
    if (html === this._valgHtml) return;
    this._valgHtml = html;
    el.innerHTML = html;
    el.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
      this._valgt = b.dataset.e; this._valgtBruker = true; this._geoKey = null; this._valgHtml = null; this.hass = this._hass;
    }));
  }

  _tegnKart(a) {
    const kart = this.shadowRoot.querySelector(".kart");
    kart.innerHTML = "";
    this._svg = {};
    let etasjer = this._etasjer;
    if (this._c.view !== "stacked") etasjer = etasjer.filter((e) => e.id === this._valgt);
    for (const e of etasjer) {
      const rom = e.rooms || [];
      const pts = rom.flatMap((r) => r.polygon);
      const plan = this._c.show_background && this._planer[e.id] && BILDER[e.id] && BILDER[e.id].url ? this._planer[e.id] : null;
      if (!pts.length && !plan) continue;
      const pad = 0.5;
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
      if (!pts.length) [x0, y0, x1, y1] = [plan.x, plan.y, plan.x + plan.w, plan.y + plan.h];
      const div = document.createElement("div");
      div.className = "etasje";
      if (this._c.view === "stacked" || this._etasjer.length < 2) div.innerHTML = `<h3>${esc(e.name)}</h3>`;
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);
      svg.innerHTML = `<defs><filter id="tg-glod" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="0.09" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="tg-rund" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath></defs>`;
      const lag = {};
      for (const n of ["bg", "rom", "spor", "px", "pers"]) { lag[n] = document.createElementNS(NS, "g"); svg.appendChild(lag[n]); }
      const glod = this._c.style !== "theme";
      if (plan) {
        const im = document.createElementNS(NS, "image");
        im.setAttribute("href", BILDER[e.id].url);
        im.setAttribute("x", plan.x); im.setAttribute("y", plan.y); im.setAttribute("width", plan.w); im.setAttribute("height", plan.h);
        im.setAttribute("preserveAspectRatio", "none"); im.setAttribute("class", "plan");
        im.setAttribute("opacity", glod ? Math.min(plan.opacity ?? 0.5, 0.28) : plan.opacity ?? 0.5);
        lag.bg.appendChild(im);
      }
      const romEl = {};
      for (const r of rom) {
        const pg = document.createElementNS(NS, "polygon");
        pg.setAttribute("points", r.polygon.map((p) => p.join(",")).join(" "));
        pg.setAttribute("class", "rf");
        if (glod) pg.setAttribute("filter", "url(#tg-glod)");
        lag.rom.appendChild(pg);
        romEl[r.id] = pg;
        const rx = r.polygon.map((p) => p[0]), ry = r.polygon.map((p) => p[1]);
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", (Math.min(...rx) + Math.max(...rx)) / 2); t.setAttribute("y", (Math.min(...ry) + Math.max(...ry)) / 2);
        t.setAttribute("class", "rn"); t.textContent = r.name;
        lag.rom.appendChild(t);
      }
      if (this._c.show_scanners) {
        for (const p of (a.scanners || []).filter((q) => q.floor === e.id)) {
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 0.12); c.setAttribute("class", "px");
          const tt = document.createElementNS(NS, "title"); tt.textContent = p.name; c.appendChild(tt);
          lag.px.appendChild(c);
        }
      }
      div.appendChild(svg);
      kart.appendChild(div);
      this._svg[e.id] = { svg, lag, romEl, el: {} };
    }
    if (!Object.keys(this._svg).length) kart.innerHTML = `<div class="tom">${this._t.noFloors}</div>`;
  }

  _tegnPersoner(pers) {
    const liste = this.shadowRoot.querySelector(".personer");
    if (!this._c.show_people) { liste.innerHTML = ""; return; }
    const html = pers.map((p) => {
      const hjemme = p.st && p.at.home;
      const tekst = !p.st ? this._t.unknown : hjemme ? `${esc(p.st.state)}${p.at.floor_name ? " · " + esc(p.at.floor_name) : ""}` : this._t.away;
      const av = p.bilde ? `<div class="av bilde" style="background-image:url('${esc(p.bilde)}')">${ini(p.name)}</div>` : `<div class="av">${ini(p.name)}</div>`;
      return `<div class="p ${hjemme ? "" : "borte"}" data-e="${esc(p.entity)}" data-f="${esc(p.at.floor || "")}" style="--f:${p.farge}">${av}
        <div><div class="navn">${esc(p.name)}</div><div class="rom">${tekst}</div></div></div>`;
    }).join("");
    if (html === this._listeHtml) return;
    this._listeHtml = html;
    liste.innerHTML = html;
    liste.querySelectorAll(".p").forEach((el) => el.addEventListener("click", () => {
      // Hopp til personens etasje; trykk igjen for detaljer
      const f = el.dataset.f;
      if (f && this._c.view !== "stacked" && f !== this._valgt) { this._valgt = f; this._valgtBruker = true; this._geoKey = null; this.hass = this._hass; return; }
      this._info(el.dataset.e);
    }));
  }

  _oppdaterSpor(pers) {
    const nå = Date.now();
    for (const p of pers) {
      const at = p.at;
      if (!at.home || at.x == null) { delete this._spor[p.id]; continue; }
      let s = this._spor[p.id] || [];
      const sist = s[s.length - 1];
      if (sist && sist.f !== at.floor) s = [];
      if (!sist || sist.f !== at.floor || sist.x !== at.x || sist.y !== at.y) s.push({ x: at.x, y: at.y, t: nå, f: at.floor });
      this._spor[p.id] = s.filter((q) => nå - q.t < 300000).slice(-60);
    }
  }

  _oppdaterMarkorer(pers) {
    const opptatt = {};
    for (const [fid, f] of Object.entries(this._svg || {})) {
      f.lag.spor.innerHTML = "";
      const her = pers.filter((p) => p.at.home && p.at.floor === fid && p.at.x != null);
      for (const p of her) {
        if (p.at.room_id) opptatt[p.at.room_id] = true;
        if (this._c.trails) {
          const s = (this._spor[p.id] || []).filter((q) => q.f === fid);
          for (let i = 1; i < s.length; i++) {
            const l = document.createElementNS(NS, "line");
            l.setAttribute("x1", s[i - 1].x); l.setAttribute("y1", s[i - 1].y); l.setAttribute("x2", s[i].x); l.setAttribute("y2", s[i].y);
            l.setAttribute("class", "spor"); l.setAttribute("stroke", p.farge);
            l.setAttribute("stroke-opacity", (0.08 + 0.55 * (i / (s.length - 1))).toFixed(2));
            f.lag.spor.appendChild(l);
          }
        }
        let m = f.el[p.id];
        if (!m) m = f.el[p.id] = this._lagMarkor(p, f.lag.pers);
        const n = her.indexOf(p);
        m.g.style.transform = `translate(${p.at.x + n * 0.3}px, ${p.at.y}px)`;
        m.halo.setAttribute("r", Math.min(Math.max(p.at.error_m || 0.5, 0.5), 3));
      }
      for (const [pid, m] of Object.entries(f.el)) if (!her.some((p) => p.id === pid)) { m.g.remove(); delete f.el[pid]; }
      for (const [rid, pg] of Object.entries(f.romEl)) pg.classList.toggle("opptatt", !!opptatt[rid]);
    }
  }

  _lagMarkor(p, lag) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "pers");
    const halo = document.createElementNS(NS, "circle");
    halo.setAttribute("class", "halo"); halo.setAttribute("fill", p.farge);
    g.appendChild(halo);
    for (const n of [1, 2]) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", 0.32); c.setAttribute("class", `ring r${n}`); c.setAttribute("stroke", p.farge);
      g.appendChild(c);
    }
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("r", 0.32); dot.setAttribute("fill", p.farge); dot.setAttribute("stroke", "#fff"); dot.setAttribute("stroke-width", 0.05);
    if (this._c.style !== "theme") dot.setAttribute("filter", "url(#tg-glod)");
    g.appendChild(dot);
    if (p.bilde) {
      const im = document.createElementNS(NS, "image");
      im.setAttribute("href", p.bilde); im.setAttribute("x", -0.27); im.setAttribute("y", -0.27);
      im.setAttribute("width", 0.54); im.setAttribute("height", 0.54);
      im.setAttribute("clip-path", "url(#tg-rund)"); im.setAttribute("preserveAspectRatio", "xMidYMid slice");
      g.appendChild(im);
    } else {
      const t = document.createElementNS(NS, "text"); t.textContent = ini(p.name); g.appendChild(t);
    }
    const tt = document.createElementNS(NS, "title"); tt.textContent = p.name; g.appendChild(tt);
    g.addEventListener("click", () => this._info(p.entity));
    lag.appendChild(g);
    return { g, halo };
  }

  _info(entityId) {
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  getCardSize() { return 8; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }
  static getStubConfig() { return {}; }

  static getConfigForm() {
    const t = TEKST[språk(document.querySelector("home-assistant") && document.querySelector("home-assistant").hass)];
    return {
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "view", selector: { select: { mode: "dropdown", options: [{ value: "tabs", label: t.tabs }, { value: "stacked", label: t.stacked }] } } },
        { name: "style", selector: { select: { mode: "dropdown", options: [{ value: "glow", label: t.glow }, { value: "theme", label: t.theme }] } } },
        { type: "grid", name: "", schema: [
          { name: "show_people", selector: { boolean: {} } },
          { name: "show_background", selector: { boolean: {} } },
          { name: "trails", selector: { boolean: {} } },
          { name: "show_scanners", selector: { boolean: {} } },
        ] },
        { name: "floor", selector: { text: {} } },
        { name: "entity", selector: { entity: { domain: "sensor" } } },
      ],
      computeLabel: (s) => ({ title: t.ttl, view: t.view, style: t.style, show_people: t.show_people, show_background: t.show_background,
        trails: t.trails, show_scanners: t.show_scanners, floor: t.floor, entity: t.entity }[s.name]),
    };
  }
}

if (!customElements.get("trigon-card")) {
  customElements.define("trigon-card", TrigonCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "trigon-card", name: "TriGON", description: "Live floor plan with everyone's position (TriGON)",
    preview: true, documentationURL: "https://github.com/GONilsen/TriGON#dashboard-card" });
}
