// TriGON – panel i sidemenyen: live posisjon på plantegning og kalibrering med målepunkter.
const FARGER = ["#3FA7FF", "#FF5FA2", "#FFB020", "#3FD08A", "#B07CFF", "#FF7A45"];
const NS = "http://www.w3.org/2000/svg";
const D = "trigon";


// ---------- Språk: norsk i koden, engelsk via ordliste når HA-profilen ikke er norsk ----------
const EN = {
  "Posisjon": "Position", "Live": "Live", "Kalibrering": "Calibration", "Rediger": "Edit", "Laster …": "Loading …",
  "Personer": "People", "venter …": "waiting …", "Ikke hjemme": "Not home",
  "Ukalibrert (Bermudas avstander)": "Uncalibrated (Bermuda distances)",
  "Proxy": "Proxy", "Avst. m": "Dist. m", "Alder s": "Age s", "Ingen ferske målinger": "No recent readings",
  "✓ = avstand fra egen kalibrering. Sirklene på kartet viser avstanden fra hver proxy.": "✓ = distance from own calibration. The circles on the map show the distance from each proxy.",
  "Vis avstandssirkler": "Show distance circles",
  "Nytt målepunkt": "New measurement point", "Telefon som bæres": "Phone being carried", "Måletid": "Measuring time",
  "Start måling": "Start measuring", "Avbryt": "Cancel", "Ferdig": "Done",
  "Hold telefonen i hånda eller lomma som vanlig og stå stille til tiden er ute.": "Hold the phone in your hand or pocket as usual and stand still until the time is up.",
  "Still deg et sted i et rom (gjerne ca. 0,5 m fra vegger og i hjørnene), og trykk på kartet der du står.": "Stand somewhere in a room (preferably about 0.5 m from the walls, near the corners) and tap the map where you are standing.",
  "Valgt punkt:": "Selected point:",
  "Ingen proxyer hørte telefonen – punktet ble ikke lagret. Sjekk at riktig person er valgt og at Bluetooth er på.": "No proxies heard the phone – the point was not saved. Check that the right person is selected and that Bluetooth is on.",
  "Dekning per rom": "Coverage per room", "Rom": "Room", "Punkt": "Points", "Treff": "Hits",
  "Beregn kalibrering": "Compute calibration", "Beregner …": "Computing …", "Bruk kalibreringen": "Use calibration",
  "(ikke beregnet ennå)": "(not computed yet)",
  "Andre telefoner trenger bare 1–2 punkter hver. De justeres mot telefonen med flest punkter.": "Other phones only need 1–2 points each. They are adjusted to the phone with the most points.",
  "Resultat": "Result", "Treffer riktig rom i": "Correct room in", "av punktene, snittavvik": "of the points, mean error",
  "Per proxy": "Per proxy", "Avvik dB": "Error dB", "Telefon": "Phone", "Proxyer": "Proxies",
  "Redigering": "Editing", "Ulagrede endringer.": "Unsaved changes.", "Lagre": "Save", "Lagrer …": "Saving …",
  "Angre endringer": "Undo changes",
  "Trykk på et rom for å endre hjørnene, eller dra en proxy for å flytte den. Hjørner festes til nabo-rommenes hjørner.": "Tap a room to edit its corners, or drag a proxy to move it. Corners snap to the corners of neighbouring rooms.",
  "Trykk på punktet som skal bli nytt nullpunkt (0,0), f.eks. et ytterhjørne av huset. Punktet festes til nærmeste romhjørne.": "Tap the point that should become the new origin (0,0), e.g. an outer corner of the house. It snaps to the nearest room corner.",
  "Navn": "Name", "F.eks. Kontor": "E.g. Office", "Fjern siste hjørne": "Remove last corner",
  "Adresse": "Address", "Etasje": "Floor", "Høyde over gulv": "Height above floor", "Fjern proxy": "Remove proxy",
  "Id": "Id", "HA-område": "HA area", "Ingen": "None", "Areal": "Area", "Valgt vegg": "Selected wall", "Hjørner": "Corners",
  "Dra en vegg for å flytte den parallelt (5 cm-steg). Dra et hjørne for å flytte bare det. Trykk på en vegg for å skrive inn eksakt lengde; sluttpunktet (med klokka) flyttes. Trykk to ganger raskt på en vegg for nytt hjørne der du trykker (eller trykk én gang og bruk knappen under).": "Drag a wall to move it in parallel (5 cm steps). Drag a corner to move just that corner. Tap a wall to type an exact length; the end point (clockwise) moves. Double-tap a wall to add a corner where you tap (or tap once and use the button below).",
  "Nytt hjørne midt på valgt vegg": "New corner in the middle of the selected wall",
  "Flytt felles vegger og hjørner i nabo-rom samtidig": "Also move shared walls and corners in neighbouring rooms",
  "Fest hjørner til 45° og 90°": "Snap corners to 45° and 90°", "Slett valgt hjørne": "Delete selected corner", "Slett rom": "Delete room",
  "Legg til": "Add", "Nytt rom": "New room", "Legg til proxy …": "Add proxy …",
  "Lista viser Bluetooth-proxyer i HA som ikke er plassert ennå.": "The list shows Bluetooth proxies in HA that have not been placed yet.",
  "Vis oppsettet som YAML": "Show the setup as YAML", "Sikkerhetskopi": "Backup",
  "Ta vare på dette som sikkerhetskopi av oppsettet.": "Keep this as a backup of the setup.",
  "Etasjer": "Floors", "Dashbord": "Dashboard", "Hvor er vi": "Where are we", "Lag «Hvor er vi»-dashbord": "Create «Where are we» dashboard",
  "Lag et ferdig dashbord «Hvor er vi» med kartet og alle personer, synlig for alle brukere i sidemenyen. Kortet heter «TriGON» i kortvelgeren hvis du heller vil legge det inn selv.": "Create a ready-made «Where are we» dashboard with the map and everyone, visible to all users in the sidebar. The card is called «TriGON» in the card picker if you would rather add it yourself.",
  "Dashbordet «Hvor er vi» finnes allerede. Vil du erstatte innholdet med standardoppsettet?": "The «Where are we» dashboard already exists. Replace its content with the default layout?", "Alle etasjer": "All floors", "Zoom inn": "Zoom in", "Zoom ut": "Zoom out", "Hele etasjen": "Whole floor", "Gulvnivå": "Floor level", "Legg til etasje": "Add floor", "Ingen etasjer ennå.": "No floors yet.",
  "Gulvnivå er høyden på gulvet i meter i forhold til hovedetasjen (f.eks. 0, 2,75 og −2,65).": "Floor level is the height of the floor in metres relative to the main floor (e.g. 0, 2.75 and −2.65).",
  "Navn på etasjen (f.eks. 1. etasje)": "Name of the floor (e.g. Ground floor)",
  "Bermuda-enhet": "Bermuda device", "Legg til person …": "Add person …", "Ingen personer ennå.": "No people yet.",
  "Lista viser telefoner og brikker Bermuda følger (f.eks. Private BLE Device). Endringer i personer lagres med en gang.": "The list shows phones and tags tracked by Bermuda (e.g. Private BLE Device). Changes to people are saved immediately.",
  "Navn på personen": "Name of the person",
  "Ingen personer ennå. Legg dem til under «Rediger».": "No people yet. Add them under «Edit».",
  "Fjerne personen? Posisjonssensoren blir stående til du sletter den i HA.": "Remove the person? The position sensor remains until you delete it in HA.",
  "Ingen etasjer ennå. Gå til «Rediger» og legg til en etasje, last opp plantegning og tegn rommene.": "No floors yet. Go to «Edit», add a floor, upload a floor plan and draw the rooms.",
  "Kopier dette inn i": "Copy this into",
  "hvis du vil ha endringene i YAML-fila også.": "if you want the changes in the YAML file as well.",
  "Nullpunkt": "Origin",
  "Det røde krysset er 0,0 og gjelder alle etasjer. x øker mot høyre, y nedover, i meter. Høyden på proxyer måles fra gulvet i egen etasje.": "The red cross is 0,0 and applies to all floors. x increases to the right and y downwards, in metres. Proxy height is measured from the floor of its own storey.",
  "Velg nytt nullpunkt": "Choose new origin", "Bakgrunnstegning": "Background plan",
  "Trykk på punktet på tegningen som skal være nullpunktet (0,0).": "Tap the point on the plan that should be the origin (0,0).",
  "Dra tegningen på kartet til den ligger riktig over rommene.": "Drag the plan on the map until it lines up with the rooms.",
  "Lagre det nye nullpunktet før du justerer tegningen.": "Save the new origin before adjusting the plan.",
  "Synlighet": "Opacity", "Målestokk": "Scale", "Plassering": "Position",
  "1. Mål kjent avstand": "1. Measure a known distance", "2. Velg kjent punkt på tegningen": "2. Choose a known point on the plan",
  "Skriv inn hvor punktet ligger i husets koordinater (0,0 = nullpunktet), og trykk så på punktet på tegningen.": "Enter where the point is in the house coordinates (0,0 = origin), then tap the point on the plan.",
  "Trykk på det kjente punktet på tegningen.": "Tap the known point on the plan.",
  "Dra tegningen": "Drag the plan", "Bytt bilde": "Replace image", "Fjern": "Remove", "Last opp tegning": "Upload plan",
  "Last opp en plantegning (PNG eller JPEG, f.eks. skjermbilde av PDF-en) for denne etasjen. Deretter måler du en kjent avstand og velger et kjent punkt (f.eks. nullpunktet), og så kan du tegne rommene oppå.": "Upload a floor plan (PNG or JPEG, e.g. a screenshot of the PDF) for this floor. Then measure a known distance and choose a known point (e.g. the origin), and draw the rooms on top.",
  "Vis tegningen på kartet (alle faner)": "Show the plan on the map (all tabs)",
  "Nullpunkt 0,0 (x mot høyre, y nedover)": "Origin 0,0 (x to the right, y downwards)",
  "Dra for å flytte veggen parallelt. Dobbeltklikk for nytt hjørne.": "Drag to move the wall in parallel. Double-tap for a new corner.",
  // dialoger
  "Slette dette målepunktet?": "Delete this measurement point?",
  "Fjerne proxyen fra kartet? Den brukes da ikke i posisjonsberegningen.": "Remove the proxy from the map? It will no longer be used for positioning.",
  "Slette rommet? Sensorene for rommet blir stående til du sletter dem i HA.": "Delete the room? Its sensors remain until you delete them in HA.",
  "Forkaste geometrien som er lagret fra panelet og bruke YAML-fila igjen?": "Discard the geometry saved from the panel and use the YAML file again?",
  "Lagre først, så viser YAML-en det som er lagret.": "Save first; the YAML shows what has been saved.",
  "Fjerne bakgrunnstegningen for denne etasjen?": "Remove the background plan for this floor?",
  "Ingen målepunkter": "No measurement points", "Ukjent person eller etasje": "Unknown person or floor",
  "Ingen bakgrunn for denne etasjen": "No background for this floor",
  "Hvor langt er det mellom de to punktene i virkeligheten? (meter, f.eks. 9 eller 9,0)": "What is the real distance between the two points? (metres, e.g. 9 or 9.0)",
};
const EN_MONSTER = [
  [/^Proxyer som hører (.+)$/, "Proxies that hear $1"],
  [/^Kalibrert · (\d+) fingeravtrykk$/, "Calibrated · $1 fingerprints"],
  [/^Står stille … (\d+) s igjen · (\d+) proxyer hører deg$/, "Standing still … $1 s left · $2 proxies hear you"],
  [/^Lagret: (\d+) proxyer hørte deg\.$/, "Saved: $1 proxies heard you."],
  [/^Målepunkter \((\d+)\)$/, "Measurement points ($1)"],
  [/^Telefoner:/, "Phones:"],
  [/^Geometrien brukes nå fra lagret fra panelet\.$/, "The geometry currently comes from the panel (saved)."],
  [/^Geometrien brukes nå fra YAML-fila\.$/, "The geometry currently comes from the YAML file."],
  [/^Tegner nytt rom: trykk på kartet for hvert hjørne \((\d+) så langt\)\. Hjørnene festes til 45°\/90° fra forrige og første hjørne\.$/, "Drawing a new room: tap the map for each corner ($1 so far). Corners snap to 45°/90° from the previous and the first corner."],
  [/^Trykk på kartet der «(.+)» står\.$/, "Tap the map where «$1» is located."],
  [/^Nullpunktet er flyttet (.+) m \/ (.+) m\. Målepunktene flyttes likt når du lagrer\.$/, "The origin has moved $1 m / $2 m. Measurement points move the same amount when you save."],
  [/^Trykk på to punkter på tegningen med kjent avstand, f\.eks\. endene av en målsatt vegg \((\d)\/2\)\.$/, "Tap two points on the plan with a known distance, e.g. the ends of a dimensioned wall ($1/2)."],
  [/^1 piksel = (.+) cm · bildet er (.+) × (.+) m$/, "1 pixel = $1 cm · the image is $2 × $3 m"],
  [/^øvre venstre hjørne i (.+)$/, "top left corner at $1"],
  [/^Automatisk \((.*)\)$/, "Automatic ($1)"],
  [/^Kunne ikke lage dashbordet: (.*)$/s, "Could not create the dashboard: $1"],
  [/^Flytte nullpunktet hit \((.+)\)\?\nAlle rom, proxyer og målepunkter i alle etasjer flyttes slik at dette blir 0,0\.$/, "Move the origin here ($1)?\nAll rooms, proxies and measurement points on all floors are moved so that this becomes 0,0."],
  [/^Kunne ikke lagre: (.*)$/s, "Could not save: $1"], [/^Kunne ikke starte: (.*)$/s, "Could not start: $1"],
  [/^Opplasting feilet: (.*)$/s, "Upload failed: $1"], [/^Feil: (.*)$/s, "Error: $1"],
  [/^Klarte ikke å hente data: (.*)$/s, "Could not fetch data: $1"],
];
const EN_DELER = [["fingeravtrykk", "fingerprint"], ["utenfor rom", "outside rooms"], ["(brukes i entitetene)", "(used in entity IDs)"],
  [" · valgt: ", " · selected: "], ["referanse", "reference"], [" m over gulv)", " m above floor)"], ["Ikke hjemme", "Not home"],
  [" · trykk på en person for detaljer", " · tap a person for details"]];


// TriGON-merket (samme design som brand/icon.png)
const MERKE = `<svg class="merke" viewBox="0 0 100 100" aria-hidden="true">
  <defs>
    <linearGradient id="tg-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3FD0E0"/><stop offset=".5" stop-color="#3FA7FF"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient>
    <radialGradient id="tg-glod"><stop offset="0" stop-color="#3FD0E0" stop-opacity=".55"/><stop offset="1" stop-color="#3FD0E0" stop-opacity="0"/></radialGradient>
  </defs>
  <g fill="none" stroke-width="2.6" opacity=".6">
    <circle cx="50" cy="27" r="21" stroke="#3FD0E0"/><circle cx="25.5" cy="69" r="21" stroke="#3FA7FF"/><circle cx="74.5" cy="69" r="21" stroke="#8B5CF6"/>
  </g>
  <path d="M50 27 L25.5 69 L74.5 69 Z" fill="none" stroke="url(#tg-g)" stroke-width="3.6" stroke-linejoin="round"/>
  <circle cx="50" cy="27" r="4.6" fill="#3FD0E0"/><circle cx="25.5" cy="69" r="4.6" fill="#3FA7FF"/><circle cx="74.5" cy="69" r="4.6" fill="#8B5CF6"/>
  <circle cx="50" cy="55" r="12" fill="url(#tg-glod)"/><circle cx="50" cy="55" r="6" fill="#fff"/><circle cx="50" cy="55" r="4" fill="#3FA7FF"/>
</svg>`;

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ini = (n) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const areal = (poly) => Math.abs(poly.reduce((s, p, i) => {
  const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1];
}, 0)) / 2;
function inni(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function siden(iso) {
  if (!iso) return "–";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${Math.round(s / 3600)} t`;
}

class TrigonPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._fane = "live";
    this._valgt = null; // valgt person (live)
    this._sirkler = false;
    this._spor = {}; // spor per person: [{x, y, t, f}]
    this._kalPerson = null;
    this._kalPunkt = null; // {floor, x, y}
    this._varighet = 20;
    this._live = null;
    this._koble = true;
    this._vinkel = true;
    this._bilder = {};
    this._visBg = true;
    this._bgModus = null;
    this._vis = {}; // zoom per etasje: {x, y, w, h} eller null
    this._etasjeFor = { live: "alle" };
    try { Object.assign(this._etasjeFor, JSON.parse(localStorage.getItem("trigon_etasje") || "{}")); } catch (e) { /* ignorer */ }
    for (const k of ["hass", "narrow", "panel"]) {
      if (Object.prototype.hasOwnProperty.call(this, k)) { const v = this[k]; delete this[k]; this[k] = v; }
    }
  }

  get _norsk() {
    const l = (this._hass && ((this._hass.locale && this._hass.locale.language) || this._hass.language)) || "nb";
    return /^(nb|nn|no)/i.test(l);
  }

  _t(s) {
    if (this._norsk || s == null) return s;
    const str = String(s);
    if (EN[str] != null) return EN[str];
    let r = str;
    for (const [re, ut] of EN_MONSTER) if (re.test(r)) { r = r.replace(re, ut); break; }
    for (const [a, b] of EN_DELER) r = r.split(a).join(b);
    return r;
  }

  // Oversett tekstnoder og placeholder i et ferdig tegnet område
  _oversett(rot) {
    if (!rot || this._norsk) return;
    const w = document.createTreeWalker(rot, NodeFilter.SHOW_TEXT);
    const noder = [];
    while (w.nextNode()) noder.push(w.currentNode);
    for (const n of noder) {
      const raw = n.nodeValue, s = raw.trim();
      if (!s || !/[A-Za-zÆØÅæøå]/.test(s)) continue;
      const ny = this._t(s);
      if (ny !== s) n.nodeValue = raw.replace(s, ny);
    }
    if (rot.querySelectorAll) rot.querySelectorAll("[placeholder]").forEach((el) => { el.placeholder = this._t(el.placeholder); });
  }

  set hass(h) {
    this._hass = h;
    if (this._menu) this._menu.hass = h;
    if (!this._startet && this.isConnected) this._start();
  }
  set narrow(n) { this._narrow = n; if (this._menu) this._menu.narrow = n; this.toggleAttribute("narrow", !!n); }
  set panel(p) { this._panel = p; }

  connectedCallback() { if (this._hass && !this._startet) this._start(); }
  disconnectedCallback() {
    if (this._unsub) { this._unsub.then((u) => u()).catch(() => {}); this._unsub = null; }
    this._startet = false;
  }

  async _start() {
    this._startet = true;
    this._skjelett();
    try {
      this._modell = await this._hass.callWS({ type: `${D}/model` });
    } catch (e) {
      this.shadowRoot.querySelector(".kart").innerHTML = `<div class="tom">Klarte ikke å hente data: ${esc(e.message || e)}</div>`;
      return;
    }
    const p = this._modell.personer;
    p.forEach((x, i) => (x.farge = FARGER[i % FARGER.length]));
    if (!this._kalPerson && p.length) this._kalPerson = p[0].id;
    this._tegnKart();
    this._tegnSide();
    this._lastBilder();
    this._unsub = this._hass.connection.subscribeMessage((m) => this._mottak(m), { type: `${D}/subscribe` });
  }

  _skjelett() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; background: var(--primary-background-color); color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
        .topp { display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 12px;
          background: var(--app-header-background-color, var(--primary-color)); color: var(--app-header-text-color, #fff);
          position: sticky; top: 0; z-index: 2; }
        .topp h1 { font-size: 20px; font-weight: 400; margin: 0 12px 0 4px; flex: 1; }
        .topp h1.logo { display: flex; align-items: center; gap: 6px; font-size: 24px; letter-spacing: .01em; white-space: nowrap; }
        .topp .merke { width: 36px; height: 36px; flex: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,.25)); }
        .topp .tri { font-weight: 300; }
        .topp .gon { font-weight: 900; background: linear-gradient(90deg, #7FEFFF, #A9D4FF 50%, #D6C2FF); -webkit-background-clip: text;
          background-clip: text; color: transparent; }
        .faner { display: flex; gap: 4px; }
        .fane { background: none; border: 0; color: inherit; font: inherit; font-size: 14px; padding: 8px 14px; border-radius: 18px;
          cursor: pointer; opacity: .75; }
        .fane.aktiv { opacity: 1; background: rgba(255,255,255,.18); }
        .innhold { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; padding: 16px; align-items: start; }
        :host([narrow]) .innhold { grid-template-columns: 1fr; padding: 8px; }
        .kort { background: var(--card-background-color, var(--ha-card-background)); border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, none); border: 1px solid var(--divider-color); padding: 14px; }
        .kart { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 16px; }
        :host([narrow]) .kart { grid-template-columns: 1fr; }
        .etasje h3, .side h3 { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          color: var(--secondary-text-color); }
        svg { width: 100%; height: auto; display: block; touch-action: manipulation; }
        svg.klikk { cursor: crosshair; }
        .etasje { position: relative; }
        .zoom { position: absolute; top: 0; right: 0; display: flex; gap: 4px; z-index: 1; }
        .zoom button { width: 32px; height: 32px; border-radius: 16px; border: 1px solid var(--divider-color); font: inherit; font-size: 17px;
          line-height: 1; background: var(--card-background-color, #fff); color: var(--primary-text-color); cursor: pointer; padding: 0; }
        .zoom button:disabled { opacity: .35; cursor: default; }
        .etasjevalg { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
        .etasjevalg:empty { display: none; }
        .chip { border: 1px solid var(--divider-color); background: none; color: var(--primary-text-color); font: inherit; font-size: 13px;
          padding: 6px 14px; border-radius: 16px; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; }
        .chip.aktiv { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
        .chip .ant { font-size: 11px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: inline-grid; place-items: center;
          background: color-mix(in srgb, currentColor 18%, transparent); }
        .chip .ant:empty { display: none; }
        .halo, .sirkel, .ring, .spor, .straale, .sig { pointer-events: none; }
        .ring { fill: none; stroke-width: .05; transform-box: fill-box; transform-origin: center; animation: radar 2.8s ease-out infinite; }
        .ring.r2 { animation-delay: 1.4s; }
        @keyframes radar { from { transform: scale(1); opacity: .75; } to { transform: scale(3.6); opacity: 0; } }
        .spor { fill: none; stroke-width: .08; stroke-linecap: round; }
        .straale { stroke-dasharray: .12 .2; animation: flyt 1.1s linear infinite; stroke-linecap: round; }
        @keyframes flyt { to { stroke-dashoffset: -.32; } }
        .sig { font-size: .22px; font-weight: 700; text-anchor: middle; dominant-baseline: central; paint-order: stroke;
          stroke: var(--card-background-color, #fff); stroke-width: .06px; }
        .kart.glod svg { background: radial-gradient(120% 90% at 30% 15%, #16263f 0%, #0c1527 55%, #070c17 100%); border-radius: 14px; }
        .glod .rf { fill: rgba(127, 239, 255, .035); stroke: #7FEFFF; stroke-opacity: .5; stroke-width: .05; }
        .glod .rf.opptatt { fill: rgba(127, 239, 255, .16); stroke-opacity: .95; animation: puls 3.2s ease-in-out infinite; }
        @keyframes puls { 0%, 100% { fill-opacity: .55; } 50% { fill-opacity: 1; } }
        .glod .rn { fill: rgba(214, 232, 255, .72); }
        .glod .px { fill: #A9D4FF; }
        .glod .pxn { fill: rgba(169, 212, 255, .55); }
        .glod image.plan { filter: invert(1) hue-rotate(180deg); }
        .glod .sirkel { opacity: .9; }
        .glod .sig { stroke: #0c1527; }
        .glod .null line, .glod .null path { opacity: .6; }
        @media (prefers-reduced-motion: reduce) { .ring, .straale, .glod .rf.opptatt { animation: none; } .ring { opacity: 0; } }
        .ikke-live .pers { pointer-events: none; opacity: .7; }
        .rf { fill: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
          stroke: color-mix(in srgb, var(--primary-text-color) 35%, transparent); stroke-width: .06; stroke-linejoin: round; }
        .rf.opptatt { fill: color-mix(in srgb, var(--primary-color) 14%, transparent); }
        .rn { fill: var(--secondary-text-color); font-size: .4px; text-anchor: middle; pointer-events: none; }
        .px { fill: color-mix(in srgb, var(--primary-text-color) 55%, transparent); }
        .pxn { fill: var(--secondary-text-color); font-size: .26px; text-anchor: middle; pointer-events: none; opacity: .8; }
        .sirkel { fill: none; stroke-width: .04; stroke-dasharray: .15 .1; opacity: .7; }
        .halo { opacity: .16; }
        .pers { transition: transform .8s ease; cursor: pointer; }
        .pers text { fill: #fff; font-size: .36px; font-weight: 700; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
        .kp { stroke-width: .07; }
        .px.flytt { cursor: grab; stroke: var(--card-background-color, #fff); stroke-width: .05; }
        .px.valgtpx { fill: var(--primary-color); }
        .rf.valgtrom { fill: color-mix(in srgb, var(--primary-color) 18%, transparent); stroke: var(--primary-color); stroke-width: .08; }
        .rf { cursor: default; }
        .hj { fill: var(--card-background-color, #fff); stroke: var(--primary-color); stroke-width: .06; cursor: grab; }
        .hj.valgt { fill: var(--primary-color); }
        .mid { fill: var(--primary-color); opacity: .45; cursor: copy; }
        .mal { fill: var(--primary-text-color); font-size: .3px; font-weight: 600; text-anchor: middle; dominant-baseline: central;
          paint-order: stroke; stroke: var(--card-background-color, #fff); stroke-width: .08px; pointer-events: none; }
        .vegg { stroke: transparent; stroke-width: .35; cursor: move; stroke-linecap: round; }
        .vegg:hover, .vegg.aktiv { stroke: color-mix(in srgb, var(--primary-color) 45%, transparent); }
        .nytt { fill: color-mix(in srgb, var(--accent-color, #ff9800) 15%, transparent); stroke: var(--accent-color, #ff9800); stroke-width: .07; stroke-dasharray: .2 .1; }
        .felt { display: grid; grid-template-columns: 110px 1fr; gap: 6px 10px; align-items: center; font-size: 13px; }
        .felt input, .felt select { font: inherit; padding: 5px 8px; border-radius: 8px; background: var(--card-background-color);
          color: var(--primary-text-color); border: 1px solid var(--divider-color); min-width: 0; }
        textarea { width: 100%; min-height: 220px; font-family: monospace; font-size: 12px; background: var(--secondary-background-color);
          color: var(--primary-text-color); border: 1px solid var(--divider-color); border-radius: 8px; box-sizing: border-box; }
        .knapp.fare { background: var(--error-color, #db4437); }
        .null line, .null path { stroke: var(--error-color, #db4437); stroke-width: .05; fill: none; }
        .null path.pil { fill: var(--error-color, #db4437); stroke: none; }
        .null text { fill: var(--error-color, #db4437); font-size: .32px; font-weight: 700; }
        .null circle { fill: var(--error-color, #db4437); }
        .mål { fill: none; stroke: var(--primary-color); stroke-width: .08; }
        .side { display: flex; flex-direction: column; gap: 14px; }
        .rad { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px; cursor: pointer; }
        .rad:hover, .rad.valgt { background: color-mix(in srgb, var(--primary-color) 10%, transparent); }
        .rad.borte { opacity: .5; }
        .ini { width: 30px; height: 30px; border-radius: 15px; color: #fff; font-weight: 700; font-size: 12px; display: grid;
          place-items: center; flex: none; background-size: cover; background-position: center; }
        .ini.bilde { color: transparent; box-shadow: 0 0 0 2px var(--f); }
        .navn { font-weight: 600; font-size: 14px; }
        .sm { font-size: 12px; color: var(--secondary-text-color); }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        td, th { padding: 4px 4px; text-align: left; border-bottom: 1px solid var(--divider-color); }
        th { color: var(--secondary-text-color); font-weight: 500; }
        td.t { text-align: right; font-variant-numeric: tabular-nums; }
        .knapp { background: var(--primary-color); color: var(--text-primary-color, #fff); border: 0; border-radius: 18px;
          padding: 9px 18px; font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; }
        .knapp.sek { background: transparent; color: var(--primary-color); border: 1px solid var(--primary-color); }
        .knapp:disabled { opacity: .4; cursor: default; }
        .knapper { display: flex; gap: 8px; flex-wrap: wrap; }
        select { font: inherit; padding: 6px 8px; border-radius: 8px; background: var(--card-background-color);
          color: var(--primary-text-color); border: 1px solid var(--divider-color); }
        label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .linje { height: 8px; border-radius: 4px; background: var(--divider-color); overflow: hidden; }
        .linje > div { height: 100%; background: var(--primary-color); transition: width .5s linear; }
        .ok { color: var(--success-color, #3FD08A); } .dårlig { color: var(--error-color, #FF4D5E); } .middels { color: var(--warning-color, #FFB020); }
        .romliste { display: grid; grid-template-columns: 1fr auto auto; gap: 4px 10px; font-size: 13px; align-items: center; }
        .tom { color: var(--secondary-text-color); padding: 12px; }
        .slett { background: none; border: 0; color: var(--error-color, #FF4D5E); cursor: pointer; font-size: 16px; }
        details summary { cursor: pointer; font-size: 13px; color: var(--secondary-text-color); }
        .melding { font-size: 13px; padding: 8px 10px; border-radius: 8px; background: color-mix(in srgb, var(--primary-color) 10%, transparent); }
      </style>
      <div class="topp"><span class="meny"></span><h1 class="logo">${MERKE}<span class="tri">Tri</span><span class="gon">GON</span></h1>
        <div class="faner"><button class="fane" data-f="live">Live</button><button class="fane" data-f="kal">Kalibrering</button><button class="fane" data-f="red">Rediger</button></div></div>
      <div class="innhold"><div class="kort"><div class="etasjevalg"></div><div class="kart"><div class="tom">Laster …</div></div></div><div class="side"></div></div>`;
    if (customElements.get("ha-menu-button")) {
      this._menu = document.createElement("ha-menu-button");
      this._menu.hass = this._hass; this._menu.narrow = this._narrow;
      this.shadowRoot.querySelector(".meny").appendChild(this._menu);
    }
    this._oversett(this.shadowRoot.querySelector(".topp"));
    this._oversett(this.shadowRoot.querySelector(".kart"));
    this.shadowRoot.querySelectorAll(".fane").forEach((b) => b.addEventListener("click", () => {
      this._fane = b.dataset.f; if (this._fane === "red" && !this._utkast) this._lagUtkast(); this._sideHtml = null; this._tegnKart(); this._tegnSide(); this._oppdaterKart();
    }));
  }

  // ---------- kart ----------
  _tegnKart() {
    const kart = this.shadowRoot.querySelector(".kart");
    kart.innerHTML = "";
    this._svg = {};
    const g = this._geo();
    const red = this._fane === "red";
    const valgt = this._aktivEtasje(g.etasjer);
    this._tegnEtasjevalg(g.etasjer, valgt);
    kart.classList.toggle("ikke-live", this._fane !== "live");
    kart.classList.toggle("glod", this._fane === "live");
    for (const e of g.etasjer) {
      if (valgt !== "alle" && e.id !== valgt) continue;
      const pts = e.rom.flatMap((r) => r.polygon).concat(g.proxyer.filter((p) => p.etasje === e.id).map((p) => [p.x, p.y]));
      if (!pts.length) pts.push([0, 0], [10, 8]);
      pts.push([0, 0]);
      if (!pts.length) continue;
      const bg = this._bgRekt(e.id);
      void bg;
      if (bg && this._visBg && this._bilder[e.id]) pts.push([bg.x, bg.y], [bg.x + bg.w, bg.y + bg.h]);
      const pad = red ? 1.5 : 0.5;
      const x0 = Math.min(...pts.map((p) => p[0])) - pad, x1 = Math.max(...pts.map((p) => p[0])) + pad;
      const y0 = Math.min(...pts.map((p) => p[1])) - pad, y1 = Math.max(...pts.map((p) => p[1])) + pad;
      const div = document.createElement("div");
      div.className = "etasje";
      div.innerHTML = `<h3>${esc(e.navn)}</h3>`;
      const svg = document.createElementNS(NS, "svg");
      const grunn = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      const v = this._vis[e.id] = this._klem(this._vis[e.id], grunn);
      const vv = v || grunn;
      svg.setAttribute("viewBox", `${vv.x} ${vv.y} ${vv.w} ${vv.h}`);
      const lag = {};
      const defs = document.createElementNS(NS, "defs");
      defs.innerHTML = `<filter id="trigon-glod" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="0.09" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="trigon-rund" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>`;
      svg.appendChild(defs);
      for (const n of ["bg", "rom", "sirkler", "spor", "kal", "px", "red", "pers", "mål"]) { lag[n] = document.createElementNS(NS, "g"); svg.appendChild(lag[n]); }
      if (bg && this._visBg && this._bilder[e.id]) {
        const im = document.createElementNS(NS, "image");
        im.setAttribute("href", this._bilder[e.id].url);
        im.setAttribute("x", bg.x); im.setAttribute("y", bg.y); im.setAttribute("width", bg.w); im.setAttribute("height", bg.h);
        im.setAttribute("preserveAspectRatio", "none"); im.setAttribute("opacity", bg.m.opacity ?? 0.5);
        im.style.pointerEvents = "none";
        im.setAttribute("class", "plan");
        if (this._fane === "live") im.setAttribute("opacity", Math.min(bg.m.opacity ?? 0.5, 0.3));
        lag.bg.appendChild(im);
      }
      const romEl = {};
      for (const r of e.rom) {
        const pg = document.createElementNS(NS, "polygon");
        pg.setAttribute("points", r.polygon.map((p) => p.join(",")).join(" "));
        pg.setAttribute("class", "rf" + (red && this._valg && this._valg.type === "rom" && this._valg.id === r.id ? " valgtrom" : ""));
        if (this._fane === "live") pg.setAttribute("filter", "url(#trigon-glod)");
        if (red) pg.addEventListener("click", (ev) => { if (this._nyttRom || this._plasser) return; ev.stopPropagation(); this._velg({ type: "rom", id: r.id }); });
        lag.rom.appendChild(pg);
        romEl[r.id] = pg;
        const xs = r.polygon.map((p) => p[0]), ys = r.polygon.map((p) => p[1]);
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", (Math.min(...xs) + Math.max(...xs)) / 2);
        t.setAttribute("y", (Math.min(...ys) + Math.max(...ys)) / 2);
        t.setAttribute("class", "rn");
        t.textContent = r.navn;
        lag.rom.appendChild(t);
      }
      lag.rom.appendChild(this._nullMerke());
      for (const p of g.proxyer.filter((p) => p.etasje === e.id)) {
        const c = document.createElementNS(NS, "circle");
        const valgt = red && this._valg && this._valg.type === "proxy" && this._valg.adresse === p.adresse;
        c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", red ? 0.22 : 0.14);
        c.setAttribute("class", "px" + (red ? " flytt" : "") + (valgt ? " valgtpx" : ""));
        if (red) c.addEventListener("pointerdown", (ev) => this._startDra(ev, { type: "proxy", adresse: p.adresse }, svg, e.id));
        const tt = document.createElementNS(NS, "title"); tt.textContent = `${p.navn} (${p.z} m over gulv)`; c.appendChild(tt);
        lag.px.appendChild(c);
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", p.x); t.setAttribute("y", p.y + 0.45); t.setAttribute("class", "pxn"); t.textContent = p.navn;
        lag.px.appendChild(t);
      }
      svg.addEventListener("click", (ev) => this._kartKlikk(ev, e.id, svg));
      svg.addEventListener("pointerdown", (ev) => {
        if (!(this._bgModus && this._bgModus.type === "flytt" && this._bgModus.floor === e.id)) return;
        const bgr = this._bgRekt(e.id); if (!bgr) return;
        ev.preventDefault();
        try { svg.setPointerCapture(ev.pointerId); } catch (er) { /* ignorer */ }
        this._draObj = { type: "bg", svg, etasje: e.id, start: this._punkt(ev, svg), orig: [bgr.x, bgr.y], el: svg.querySelector("image"), flyttet: false, sx: ev.clientX, sy: ev.clientY };
      });
      svg.addEventListener("pointermove", (ev) => this._dra(ev, svg));
      svg.addEventListener("pointerup", () => this._slippDra());
      svg.addEventListener("pointercancel", () => this._slippDra());
      if (red) svg.classList.add("klikk");
      this._kobleZoom(svg, e.id, grunn, div);
      div.appendChild(svg);
      kart.appendChild(div);
      this._svg[e.id] = { svg, lag, romEl, el: {} };
      if (red) this._tegnRed(e.id);
    }
    if (!Object.keys(this._svg).length) kart.innerHTML = `<div class="tom">Ingen etasjer ennå. Gå til «Rediger» og legg til en etasje, last opp plantegning og tegn rommene.</div>`;
    this._tegnKalPunkter();
    this._oversett(kart);
  }

  _sorterEtasjer(etasjer) { return etasjer.slice().sort((a, b) => b.niva - a.niva); }

  // Hvilken etasje som vises i denne fanen ("alle" bare i Live)
  _aktivEtasje(etasjer) {
    etasjer = etasjer || this._geo().etasjer;
    let v = this._etasjeFor[this._fane];
    if (v === "alle" && this._fane === "live") return "alle";
    if (etasjer.some((e) => e.id === v)) return v;
    if (this._fane === "live") return "alle";
    const k = this._fane === "kal" && ((this._live && this._live.kalibrering) || this._kalPunkt);
    if (k && etasjer.some((e) => e.id === k.floor)) return k.floor;
    const null0 = etasjer.find((e) => e.niva === 0);
    return null0 ? null0.id : (this._sorterEtasjer(etasjer)[0] || {}).id || "alle";
  }

  _velgEtasje(id) {
    this._etasjeFor[this._fane] = id;
    if (this._fane === "red" && id !== "alle") {
      if (this._bgModus && this._bgModus.floor !== id) this._bgModus = null;
      this._bgEtasje = id;
    }
    try { localStorage.setItem("trigon_etasje", JSON.stringify(this._etasjeFor)); } catch (e) { /* ignorer */ }
    this._sideHtml = null; this._tegnKart(); this._tegnSide(); this._oppdaterKart();
  }

  _tegnEtasjevalg(etasjer, valgt) {
    const el = this.shadowRoot.querySelector(".etasjevalg");
    if (!el) return;
    const liste = this._sorterEtasjer(etasjer);
    if (liste.length < 2 && this._fane !== "live") { el.innerHTML = ""; return; }
    const chip = (id, navn) => `<button class="chip ${id === valgt ? "aktiv" : ""}" data-e="${esc(id)}">${esc(navn)}<span class="ant" data-ant="${esc(id)}"></span></button>`;
    el.innerHTML = (this._fane === "live" ? chip("alle", this._t("Alle etasjer")) : "") + liste.map((e) => chip(e.id, e.navn)).join("");
    el.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => this._velgEtasje(b.dataset.e)));
    if (liste.length < 2 && this._fane === "live") el.innerHTML = "";
  }

  _klem(v, g) {
    if (!v) return null;
    const w = Math.min(Math.max(v.w, g.w / 12), g.w);
    if (w >= g.w * 0.999) return null;
    const h = w * g.h / g.w;
    return { x: Math.min(Math.max(v.x, g.x), g.x + g.w - w), y: Math.min(Math.max(v.y, g.y), g.y + g.h - h), w, h };
  }

  // Zoom og panorering: knapper, musehjul, to fingre (knip) og én finger når kartet er zoomet inn
  _kobleZoom(svg, fid, g, div) {
    const pek = new Map();
    let knip = null, pan = null;
    const vis = () => this._vis[fid] || g;
    const knapper = document.createElement("div");
    knapper.className = "zoom";
    knapper.innerHTML = `<button data-z="inn" title="${this._t("Zoom inn")}">+</button><button data-z="ut" title="${this._t("Zoom ut")}">−</button><button data-z="hel" title="${this._t("Hele etasjen")}">⤢</button>`;
    const touch = () => {
      const zoomet = !!this._vis[fid];
      svg.style.touchAction = zoomet || this._fane === "red" ? "none" : "pan-y";
      knapper.querySelector('[data-z="ut"]').disabled = !zoomet;
      knapper.querySelector('[data-z="hel"]').disabled = !zoomet;
    };
    const sett = (v) => {
      this._vis[fid] = this._klem(v, g);
      const n = vis();
      svg.setAttribute("viewBox", `${n.x} ${n.y} ${n.w} ${n.h}`);
      touch();
    };
    const rekt = () => svg.getBoundingClientRect();
    const tilVerden = (cx, cy, v) => { const r = rekt(); return [v.x + (cx - r.left) * v.w / r.width, v.y + (cy - r.top) * v.h / r.height]; };
    const plasser = (w, cx, cy, wx, wy) => {
      const r = rekt();
      w = Math.min(Math.max(w, g.w / 12), g.w);
      const h = w * g.h / g.w;
      sett({ x: wx - (cx - r.left) * w / r.width, y: wy - (cy - r.top) * h / r.height, w, h });
    };
    const zoomRundt = (cx, cy, faktor) => { const v = vis(); const [wx, wy] = tilVerden(cx, cy, v); plasser(v.w / faktor, cx, cy, wx, wy); };
    knapper.addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      ev.stopPropagation();
      const r = rekt(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (b.dataset.z === "hel") sett(null); else zoomRundt(cx, cy, b.dataset.z === "inn" ? 1.6 : 1 / 1.6);
    });
    knapper.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    div.appendChild(knapper);
    touch();
    svg.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      zoomRundt(ev.clientX, ev.clientY, Math.exp(-ev.deltaY * (ev.deltaMode ? 0.05 : 0.002)));
    }, { passive: false });
    const midt = () => { const [a, b] = [...pek.values()]; return [(a.x + b.x) / 2, (a.y + b.y) / 2, Math.hypot(a.x - b.x, a.y - b.y)]; };
    svg.addEventListener("pointerdown", (ev) => {
      pek.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pek.size === 2) {
        // Andre finger: avbryt dra/trykk og start knip
        ev.stopPropagation(); ev.preventDefault();
        if (this._draObj) { if (this._draObj.flyttet) this._endret = true; this._draObj = null; }
        pan = null;
        const [mx, my, d] = midt();
        const v = vis();
        knip = { d0: Math.max(d, 1), w0: v.w, p0: tilVerden(mx, my, v) };
        for (const id of pek.keys()) { try { svg.setPointerCapture(id); } catch (e) { /* ignorer */ } }
      } else if (pek.size === 1) {
        pan = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, v0: vis(), aktiv: false };
      }
    }, true);
    svg.addEventListener("pointermove", (ev) => {
      if (!pek.has(ev.pointerId)) return;
      pek.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (knip && pek.size >= 2) {
        const [mx, my, d] = midt();
        plasser(knip.w0 * knip.d0 / Math.max(d, 1), mx, my, knip.p0[0], knip.p0[1]);
        this._stoppKlikk = Date.now();
        return;
      }
      if (!pan || pan.id !== ev.pointerId || this._draObj || !this._vis[fid]) return;
      if (!pan.aktiv) {
        if (Math.hypot(ev.clientX - pan.sx, ev.clientY - pan.sy) < 6) return;
        pan.aktiv = true;
        try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignorer */ }
      }
      const r = rekt(), v = pan.v0;
      sett({ x: v.x - (ev.clientX - pan.sx) * v.w / r.width, y: v.y - (ev.clientY - pan.sy) * v.h / r.height, w: v.w, h: v.h });
      this._stoppKlikk = Date.now();
    });
    const slipp = (ev) => {
      pek.delete(ev.pointerId);
      if (knip && pek.size < 2) { knip = null; this._stoppKlikk = Date.now(); }
      if (pan && pan.id === ev.pointerId) { if (pan.aktiv) this._stoppKlikk = Date.now(); pan = null; }
    };
    svg.addEventListener("pointerup", slipp);
    svg.addEventListener("pointercancel", slipp);
    // Et trykk som var en zoom/panorering skal ikke velge punkt eller rom
    svg.addEventListener("click", (ev) => {
      if (this._stoppKlikk && Date.now() - this._stoppKlikk < 350) { ev.stopPropagation(); ev.preventDefault(); }
    }, true);
  }

  _kartKlikk(ev, etasje, svg) {
    if (this._fane === "red") { this._redKlikk(ev, etasje, svg); return; }
    if (this._fane !== "kal" || (this._live && this._live.kalibrering)) return;
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    this._kalPunkt = { floor: etasje, x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 };
    this._tegnMål();
    this._tegnSide();
  }

  _tegnMål() {
    for (const [fid, f] of Object.entries(this._svg || {})) {
      f.lag.mål.innerHTML = "";
      const k = (this._live && this._live.kalibrering) || this._kalPunkt;
      if (this._fane !== "kal" || !k || k.floor !== fid) continue;
      for (const r of [0.25, 0.5]) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", k.x); c.setAttribute("cy", k.y); c.setAttribute("r", r); c.setAttribute("class", "mål");
        f.lag.mål.appendChild(c);
      }
    }
  }

  _tegnKalPunkter() {
    const kal = this._modell.kalibrering;
    for (const [fid, f] of Object.entries(this._svg || {})) {
      f.lag.kal.innerHTML = "";
      if (this._fane !== "kal") continue;
      for (const p of kal.points.filter((p) => p.floor === fid)) {
        const farge = (this._modell.personer.find((x) => x.id === p.person) || {}).farge || "#888";
        const g = document.createElementNS(NS, "g");
        g.setAttribute("stroke", farge); g.setAttribute("class", "kp");
        const s = 0.18;
        g.innerHTML = `<line x1="${p.x - s}" y1="${p.y - s}" x2="${p.x + s}" y2="${p.y + s}"/><line x1="${p.x - s}" y1="${p.y + s}" x2="${p.x + s}" y2="${p.y - s}"/>`;
        f.lag.kal.appendChild(g);
      }
    }
  }

  _oppdaterKart() {
    this._tegnKalPunkter();
    this._tegnMål();
    const live = this._live;
    if (!live || !this._svg) return;
    const opptatt = {};
    for (const [fid, f] of Object.entries(this._svg)) {
      const iBruk = [];
      f.lag.sirkler.innerHTML = "";
      f.lag.spor.innerHTML = "";
      if (this._fane === "live") this._tegnSpor(fid, f.lag.spor);
      for (const p of this._modell.personer) {
        const s = live.personer[p.id];
        if (!s || !s.hjemme || s.etasje !== fid || s.x == null) continue;
        iBruk.push(p.id);
        if (s.rom_id) opptatt[s.rom_id] = true;
        let m = f.el[p.id];
        if (!m) {
          const g = document.createElementNS(NS, "g");
          g.setAttribute("class", "pers");
          const halo = document.createElementNS(NS, "circle");
          halo.setAttribute("class", "halo"); halo.setAttribute("fill", p.farge);
          const ringer = [1, 2].map((n) => {
            const c = document.createElementNS(NS, "circle");
            c.setAttribute("r", 0.32); c.setAttribute("class", `ring r${n}`); c.setAttribute("stroke", p.farge);
            return c;
          });
          const dot = document.createElementNS(NS, "circle");
          dot.setAttribute("r", 0.32); dot.setAttribute("fill", p.farge); dot.setAttribute("stroke", "#fff"); dot.setAttribute("stroke-width", 0.05);
          if (this._fane === "live") dot.setAttribute("filter", "url(#trigon-glod)");
          g.append(halo, ...ringer, dot);
          const bilde = this._bilde(p);
          if (bilde) {
            const im = document.createElementNS(NS, "image");
            im.setAttribute("href", bilde); im.setAttribute("x", -0.27); im.setAttribute("y", -0.27);
            im.setAttribute("width", 0.54); im.setAttribute("height", 0.54);
            im.setAttribute("clip-path", "url(#trigon-rund)"); im.setAttribute("preserveAspectRatio", "xMidYMid slice");
            g.append(im);
          } else {
            const t = document.createElementNS(NS, "text"); t.textContent = ini(p.navn);
            g.append(t);
          }
          g.addEventListener("click", (ev) => { ev.stopPropagation(); this._valgt = this._valgt === p.id ? null : p.id; this._tegnSide(); this._oppdaterKart(); });
          f.lag.pers.appendChild(g);
          m = f.el[p.id] = { g, halo };
        }
        const dx = (iBruk.length - 1) * 0.35;
        m.g.style.transform = `translate(${s.x + dx}px, ${s.y}px)`;
        m.halo.setAttribute("r", Math.min(Math.max(s.avvik || 0.5, 0.5), 3));
      }
      for (const [pid, m] of Object.entries(f.el)) if (!iBruk.includes(pid)) { m.g.remove(); delete f.el[pid]; }
      for (const [rid, pg] of Object.entries(f.romEl)) pg.classList.toggle("opptatt", !!opptatt[rid]);
    }
    const ant = {};
    for (const s of Object.values(live.personer || {})) if (s && s.hjemme && s.etasje) ant[s.etasje] = (ant[s.etasje] || 0) + 1;
    this.shadowRoot.querySelectorAll(".chip .ant").forEach((el) => {
      const n = this._fane === "live" && el.dataset.ant !== "alle" ? ant[el.dataset.ant] || 0 : 0;
      el.textContent = n ? String(n) : "";
    });
    if (this._fane === "live" && this._valgt) this._tegnStraaler();
    // Avstandssirkler for valgt person (horisontal avstand i personens etasje)
    if (this._fane === "live" && this._sirkler && this._valgt) {
      const s = live.personer[this._valgt];
      const p = this._modell.personer.find((x) => x.id === this._valgt);
      if (s && s.hjemme && s.etasje && this._svg[s.etasje]) {
        const et = this._modell.etasjer.find((e) => e.id === s.etasje);
        const zt = et.niva + this._modell.telefonhoyde;
        for (const [addr, r] of Object.entries(s.raw || {})) {
          const px = this._modell.proxyer.find((q) => q.adresse === addr);
          if (!px || r.d == null) continue;
          const pe = this._modell.etasjer.find((e) => e.id === px.etasje);
          const dz = pe.niva + px.z - zt;
          const h = Math.sqrt(Math.max(r.d * r.d - dz * dz, 0.01));
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("cx", px.x); c.setAttribute("cy", px.y); c.setAttribute("r", h);
          c.setAttribute("class", "sirkel"); c.setAttribute("stroke", p.farge);
          this._svg[s.etasje].lag.sirkler.appendChild(c);
        }
      }
    }
  }

  _bilde(p) {
    const st = p.person && this._hass && this._hass.states[p.person];
    return (st && st.attributes.entity_picture) || null;
  }

  _oppdaterSpor(m) {
    const nå = Date.now();
    for (const [pid, s] of Object.entries(m.personer || {})) {
      if (!s || !s.hjemme || s.x == null) { delete this._spor[pid]; continue; }
      let a = this._spor[pid] || [];
      const sist = a[a.length - 1];
      if (sist && sist.f !== s.etasje) a = [];
      if (!sist || sist.f !== s.etasje || Math.hypot(sist.x - s.x, sist.y - s.y) > 0.15) a.push({ x: s.x, y: s.y, t: nå, f: s.etasje });
      else sist.t = nå;
      this._spor[pid] = a.filter((q) => nå - q.t < 240000).slice(-80);
    }
  }

  // Hale bak hver person: siste minutter, svakere jo eldre
  _tegnSpor(fid, lag) {
    for (const p of this._modell.personer) {
      const a = (this._spor[p.id] || []).filter((q) => q.f === fid);
      for (let i = 1; i < a.length; i++) {
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", a[i - 1].x); l.setAttribute("y1", a[i - 1].y); l.setAttribute("x2", a[i].x); l.setAttribute("y2", a[i].y);
        l.setAttribute("class", "spor"); l.setAttribute("stroke", p.farge);
        l.setAttribute("stroke-opacity", (0.08 + 0.55 * (i / (a.length - 1))).toFixed(2));
        lag.appendChild(l);
      }
    }
  }

  // Signallinjer fra proxyene som hører valgt person (samme etasje); tykkere og sterkere jo bedre signal
  _tegnStraaler() {
    const s = this._live.personer[this._valgt];
    const p = this._modell.personer.find((x) => x.id === this._valgt);
    if (!s || !p || !s.hjemme || s.x == null || !this._svg[s.etasje]) return;
    const lag = this._svg[s.etasje].lag.sirkler;
    for (const [addr, r] of Object.entries(s.raw || {})) {
      const px = this._modell.proxyer.find((q) => q.adresse === addr);
      if (!px || px.etasje !== s.etasje || r.rssi == null) continue;
      const k = Math.min(Math.max((r.rssi + 95) / 45, 0), 1);
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", px.x); l.setAttribute("y1", px.y); l.setAttribute("x2", s.x); l.setAttribute("y2", s.y);
      l.setAttribute("class", "straale"); l.setAttribute("stroke", p.farge);
      l.setAttribute("stroke-width", (0.025 + 0.085 * k).toFixed(3)); l.setAttribute("stroke-opacity", (0.3 + 0.6 * k).toFixed(2));
      lag.appendChild(l);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", px.x + (s.x - px.x) * 0.35); t.setAttribute("y", px.y + (s.y - px.y) * 0.35);
      t.setAttribute("class", "sig"); t.setAttribute("fill", p.farge); t.textContent = String(r.rssi);
      lag.appendChild(t);
    }
  }

  // ---------- data ----------
  _mottak(m) {
    const forrigeKal = this._live && this._live.kalibrering;
    this._live = m;
    this._oppdaterSpor(m);
    if (forrigeKal && !m.kalibrering) {
      // Måling ferdig: hent oppdatert modell (punkter)
      this._sistePunkt = m.siste_punkt;
      this._kalPunkt = null;
      this._hass.callWS({ type: `${D}/model` }).then((mod) => {
        mod.personer.forEach((x, i) => (x.farge = FARGER[i % FARGER.length]));
        this._modell = mod; this._oppdaterKart(); this._tegnSide();
      });
    }
    this._oppdaterKart();
    this._tegnSide();
  }

  // ---------- sidepanel ----------
  _tegnSide() {
    const side = this.shadowRoot.querySelector(".side");
    if (!side || !this._modell) return;
    this.shadowRoot.querySelectorAll(".fane").forEach((b) => b.classList.toggle("aktiv", b.dataset.f === this._fane));
    const html = this._fane === "live" ? this._sideLive() : this._fane === "kal" ? this._sideKal() : this._sideRed();
    if (html === this._sideHtml) return;
    this._sideHtml = html;
    side.innerHTML = html;
    this._oversett(side);
    if (this._fane === "red") this._kobleRed(side); else this._kobleSide(side);
  }

  _sideLive() {
    const live = this._live;
    const rader = this._modell.personer.map((p) => {
      const s = live && live.personer[p.id];
      const hjemme = s && s.hjemme;
      const et = hjemme ? (this._modell.etasjer.find((e) => e.id === s.etasje) || {}).navn : "";
      const fp = hjemme && s.fingeravtrykk ? ` · fingeravtrykk ${Math.round(s.fingeravtrykk * 100)} %` : "";
      const tekst = !s ? "venter …" : hjemme ? `${esc(s.rom || "?")} · ${esc(et)} · ±${s.avvik} m${fp}` : "Ikke hjemme";
      return `<div class="rad ${hjemme ? "" : "borte"} ${this._valgt === p.id ? "valgt" : ""}" data-p="${p.id}">
        ${(() => { const b = this._bilde(p); return b ? `<div class="ini bilde" style="--f:${p.farge};background-image:url('${esc(b)}')">${ini(p.navn)}</div>` : `<div class="ini" style="background:${p.farge}">${ini(p.navn)}</div>`; })()}
        <div style="flex:1"><div class="navn">${esc(p.navn)}</div><div class="sm">${tekst}</div></div>
        <div class="sm">${s ? siden(s.sist_hort) : ""}</div></div>`;
    }).join("");
    let detalj = "";
    if (this._valgt && live) {
      const s = live.personer[this._valgt];
      const rows = Object.entries((s && s.raw) || {}).sort((a, b) => (a[1].d ?? 99) - (b[1].d ?? 99)).map(([addr, r]) => {
        const px = this._modell.proxyer.find((q) => q.adresse === addr) || { navn: addr };
        return `<tr><td>${esc(px.navn)}</td><td class="t">${r.rssi ?? "–"}</td><td class="t">${r.d ?? "–"}${r.kalibrert ? " ✓" : ""}</td>
          <td class="t">${r.bermuda != null ? r.bermuda.toFixed(1) : "–"}</td><td class="t">${r.age}</td></tr>`;
      }).join("");
      detalj = `<div class="kort"><h3>Proxyer som hører ${esc((this._modell.personer.find((p) => p.id === this._valgt) || {}).navn)}</h3>
        <table><tr><th>Proxy</th><th class="t">RSSI</th><th class="t">Avst. m</th><th class="t">Bermuda</th><th class="t">Alder s</th></tr>${rows || `<tr><td colspan="5" class="sm">Ingen ferske målinger</td></tr>`}</table>
        <div class="sm" style="margin-top:6px">✓ = avstand fra egen kalibrering. Sirklene på kartet viser avstanden fra hver proxy.</div>
        <label style="margin-top:8px"><input type="checkbox" class="sirk" ${this._sirkler ? "checked" : ""}> Vis avstandssirkler</label></div>`;
    }
    const kal = this._modell.kalibrering;
    const status = live && live.kalibrert ? `<span class="ok">Kalibrert · ${live.fingeravtrykk || 0} fingeravtrykk</span>` : `<span class="middels">Ukalibrert (Bermudas avstander)</span>`;
    return `<div class="kort"><h3>Personer</h3>${rader || '<div class="sm">Ingen personer ennå. Legg dem til under «Rediger».</div>'}<div class="sm" style="margin-top:8px">${status} · trykk på en person for detaljer</div></div>${detalj}
      <div class="kort"><h3>Dashbord</h3>
        <div class="sm">Lag et ferdig dashbord «Hvor er vi» med kartet og alle personer, synlig for alle brukere i sidemenyen. Kortet heter «TriGON» i kortvelgeren hvis du heller vil legge det inn selv.</div>
        <div class="knapper" style="margin-top:10px"><button class="knapp sek lag-dash">Lag «Hvor er vi»-dashbord</button></div></div>`;
  }

  _romDekning() {
    const kal = this._modell.kalibrering;
    const kv = (kal.fit && kal.fit.kvalitet && kal.fit.kvalitet.rom) || {};
    const out = [];
    for (const e of this._modell.etasjer) for (const r of e.rom) {
      const n = kal.points.filter((p) => p.floor === e.id && inni(p.x, p.y, r.polygon)).length;
      const mål = areal(r.polygon) < 8 ? 2 : 4;
      out.push({ r, e, n, mål, kv: kv[r.id] });
    }
    return out;
  }

  _sideKal() {
    const kal = this._modell.kalibrering;
    const live = this._live;
    const ses = live && live.kalibrering;
    const pers = this._modell.personer;
    const opts = pers.map((p) => `<option value="${p.id}" ${p.id === this._kalPerson ? "selected" : ""}>${esc(p.navn)}</option>`).join("");
    let måling;
    if (ses) {
      const pct = 100 * (1 - ses.remaining / ses.duration);
      const n = Object.keys(ses.counts).length;
      måling = `<div class="melding">Står stille … ${Math.ceil(ses.remaining)} s igjen · ${n} proxyer hører deg</div>
        <div class="linje"><div style="width:${pct}%"></div></div>
        <div class="knapper"><button class="knapp sek avbryt">Avbryt</button></div>`;
    } else {
      const k = this._kalPunkt;
      let romnavn = "";
      if (k) {
        const e = this._modell.etasjer.find((x) => x.id === k.floor);
        const r = e && e.rom.find((r) => inni(k.x, k.y, r.polygon));
        romnavn = `${r ? r.navn : "utenfor rom"} · ${e ? e.navn : ""} · (${k.x.toFixed(1)}, ${k.y.toFixed(1)})`;
      }
      let siste = "";
      if (this._sistePunkt) {
        const n = Object.keys(this._sistePunkt.rssi || {}).length;
        siste = n ? `<div class="melding ok">Lagret: ${n} proxyer hørte deg.</div>` : `<div class="melding dårlig">Ingen proxyer hørte telefonen – punktet ble ikke lagret. Sjekk at riktig person er valgt og at Bluetooth er på.</div>`;
      }
      måling = `${siste}
        <label>Telefon som bæres <select class="kperson">${opts}</select></label>
        <label>Måletid <select class="kvar">${[15, 20, 30, 45].map((v) => `<option ${v === this._varighet ? "selected" : ""}>${v}</option>`).join("")}</select> s</label>
        <div class="sm">${k ? `Valgt punkt: <b>${esc(romnavn)}</b>` : "Still deg et sted i et rom (gjerne ca. 0,5 m fra vegger og i hjørnene), og trykk på kartet der du står."}</div>
        <div class="knapper"><button class="knapp start" ${k ? "" : "disabled"}>Start måling</button></div>
        <div class="sm">Hold telefonen i hånda eller lomma som vanlig og stå stille til tiden er ute.</div>`;
    }
    const vf = this._aktivEtasje();
    const dek = this._romDekning().filter((d) => vf === "alle" || d.e.id === vf);
    const romrader = dek.map((d) => {
      const fullt = d.n >= d.mål;
      const kv = d.kv && d.kv.treff_pct != null ? `<span class="${d.kv.treff_pct >= 80 ? "ok" : d.kv.treff_pct >= 50 ? "middels" : "dårlig"}">${d.kv.treff_pct} %</span>` : `<span class="sm">–</span>`;
      return `<div>${esc(d.r.navn)} <span class="sm">${esc(d.e.navn)}</span></div><div class="${fullt ? "ok" : "sm"}">${d.n}/${d.mål}${fullt ? " ✓" : ""}</div><div>${kv}</div>`;
    }).join("");
    const fit = kal.fit;
    let res = "";
    if (fit && fit.kvalitet) {
      const q = fit.kvalitet;
      const pxr = Object.entries(kal.proxyer || {}).map(([a, p]) => `<tr><td>${esc(p.navn)}</td><td class="t">${p.A}</td><td class="t">${p.n}</td><td class="t">${p.punkter}</td><td class="t">${p.rms_db}</td></tr>`).join("");
      const prr = Object.entries(kal.personer || {}).map(([id, p]) => `${esc((pers.find((x) => x.id === id) || { navn: id }).navn)}: ${p.referanse ? "referanse" : `${p.offset > 0 ? "+" : ""}${p.offset} dB`}`).join(" · ");
      res = `<div class="kort"><h3>Resultat</h3>
        <div class="melding">Treffer riktig rom i <b>${q.treff_pct ?? "–"} %</b> av punktene, snittavvik <b>${q.snitt_feil_m ?? "–"} m</b>.</div>
        <details style="margin-top:8px"><summary>Per proxy</summary><table><tr><th>Proxy</th><th class="t">A (1 m)</th><th class="t">n</th><th class="t">Punkt</th><th class="t">Avvik dB</th></tr>${pxr}</table></details>
        <div class="sm" style="margin-top:6px">Telefoner: ${prr}</div></div>`;
    }
    const punktliste = kal.points.slice().reverse().map((p) => {
      const e = this._modell.etasjer.find((x) => x.id === p.floor);
      const r = e && e.rom.find((r) => inni(p.x, p.y, r.polygon));
      const navn = (pers.find((x) => x.id === p.person) || { navn: p.person }).navn;
      return `<tr><td>${esc(r ? r.navn : "?")}</td><td>${esc(navn)}</td><td class="t">${p.proxyer}</td><td class="t"><button class="slett" data-id="${p.id}" title="Slett">✕</button></td></tr>`;
    }).join("");
    return `
      <div class="kort side"><h3>Nytt målepunkt</h3>${måling}</div>
      <div class="kort"><h3>Dekning per rom</h3>
        <div class="romliste"><div class="sm">Rom</div><div class="sm">Punkt</div><div class="sm">Treff</div>${romrader}</div>
        <div class="knapper" style="margin-top:12px"><button class="knapp beregn" ${kal.points.length ? "" : "disabled"}>Beregn kalibrering</button></div>
        <label style="margin-top:10px"><input type="checkbox" class="bruk" ${kal.enabled ? "checked" : ""}> Bruk kalibreringen ${kal.aktiv ? "" : '<span class="sm">(ikke beregnet ennå)</span>'}</label>
        <div class="sm" style="margin-top:6px">Andre telefoner trenger bare 1–2 punkter hver. De justeres mot telefonen med flest punkter.</div></div>
      ${res}
      <div class="kort"><details><summary>Målepunkter (${kal.points.length})</summary>
        <table><tr><th>Rom</th><th>Telefon</th><th class="t">Proxyer</th><th></th></tr>${punktliste}</table></details></div>`;
  }

  _kobleSide(side) {
    side.querySelectorAll(".rad[data-p]").forEach((el) => el.addEventListener("click", () => {
      this._valgt = this._valgt === el.dataset.p ? null : el.dataset.p; this._tegnSide(); this._oppdaterKart();
    }));
    const q = (s) => side.querySelector(s);
    if (q(".lag-dash")) q(".lag-dash").addEventListener("click", () => this._lagDashbord());
    if (q(".sirk")) q(".sirk").addEventListener("change", (e) => { this._sirkler = e.target.checked; this._oppdaterKart(); });
    if (q(".kperson")) q(".kperson").addEventListener("change", (e) => { this._kalPerson = e.target.value; });
    if (q(".kvar")) q(".kvar").addEventListener("change", (e) => { this._varighet = Number(e.target.value); });
    if (q(".start")) q(".start").addEventListener("click", async () => {
      const k = this._kalPunkt; if (!k) return;
      this._sistePunkt = null;
      try {
        await this._hass.callWS({ type: `${D}/calibrate/start`, person: this._kalPerson, floor: k.floor, x: k.x, y: k.y, duration: this._varighet });
      } catch (e) { alert(this._t(`Kunne ikke starte: ${e.message || e}`)); }
    });
    if (q(".avbryt")) q(".avbryt").addEventListener("click", () => this._hass.callWS({ type: `${D}/calibrate/cancel` }));
    if (q(".beregn")) q(".beregn").addEventListener("click", async (ev) => {
      ev.target.disabled = true; ev.target.textContent = this._t("Beregner …");
      try {
        const r = await this._hass.callWS({ type: `${D}/calibrate/fit` });
        this._modell.kalibrering = r.kalibrering;
        if (!r.resultat.ok) alert(this._t(r.resultat.melding));
      } catch (e) { alert(this._t(`Feil: ${e.message || e}`)); }
      this._tegnSide();
    });
    if (q(".bruk")) q(".bruk").addEventListener("change", async (e) => {
      this._modell.kalibrering = await this._hass.callWS({ type: `${D}/calibrate/enable`, enabled: e.target.checked });
      this._tegnSide();
    });
    side.querySelectorAll(".slett").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm(this._t("Slette dette målepunktet?"))) return;
      this._modell.kalibrering = await this._hass.callWS({ type: `${D}/calibrate/delete`, point: b.dataset.id });
      this._tegnSide(); this._oppdaterKart();
    }));
  }

  async _lagDashbord() {
    const url = this._norsk ? "trigon-hvor" : "trigon-where";
    try {
      const liste = await this._hass.callWS({ type: "lovelace/dashboards/list" });
      const finnes = liste.some((d) => d.url_path === url);
      if (finnes && !confirm(this._t("Dashbordet «Hvor er vi» finnes allerede. Vil du erstatte innholdet med standardoppsettet?"))) {
        this._gaaTil(`/${url}`); return;
      }
      if (!finnes) {
        await this._hass.callWS({ type: "lovelace/dashboards/create", url_path: url, title: this._t("Hvor er vi"),
          icon: "mdi:map-marker-radius", require_admin: false, show_in_sidebar: true, mode: "storage" });
      }
      await this._hass.callWS({ type: "lovelace/config/save", url_path: url, config: {
        title: this._t("Hvor er vi"),
        views: [{ title: this._t("Hvor er vi"), path: "kart", icon: "mdi:map-marker-radius", type: "panel",
          cards: [{ type: "custom:trigon-card" }] }],
      } });
      this._gaaTil(`/${url}/kart`);
    } catch (e) { alert(this._t(`Kunne ikke lage dashbordet: ${e.message || e}`)); }
  }

  _gaaTil(sti) {
    history.pushState(null, "", sti);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  // ================= REDIGERING =================
  _geo() {
    if (this._fane !== "red" || !this._utkast) return { etasjer: this._modell.etasjer, proxyer: this._modell.proxyer };
    const u = this._utkast;
    const etasjer = Object.entries(u.floors).map(([id, f]) => ({ id, navn: f.name, niva: f.level,
      rom: u.rooms.filter((r) => r.floor === id).map((r) => ({ id: r.id, navn: r.name, omrade: r.area, polygon: r.polygon })) }))
      .sort((a, b) => b.niva - a.niva);
    const proxyer = u.scanners.map((s) => ({ adresse: s.address.toLowerCase(), navn: s.name, etasje: s.floor, x: s.x, y: s.y, z: s.z, rom: s.room }));
    return { etasjer, proxyer };
  }

  _lagUtkast() {
    const m = this._modell;
    this._utkast = {
      floors: Object.fromEntries(m.etasjer.map((e) => [e.id, { name: e.navn, level: e.niva }])),
      scanners: m.proxyer.map((p) => ({ address: p.adresse.toUpperCase(), name: p.navn, floor: p.etasje, x: p.x, y: p.y, z: p.z, room: p.rom_fast ? p.rom : null })),
      rooms: m.etasjer.flatMap((e) => e.rom.map((r) => ({ id: r.id, name: r.navn, floor: e.id, area: r.omrade || null, polygon: r.polygon.map((p) => [...p]) }))),
    };
    this._endret = false;
    this._valg = null; this._nyttRom = null; this._plasser = null; this._eksport = null; this._shift = null; this._velgNull = false;
  }

  _endre() { this._endret = true; this._sideHtml = null; this._tegnKart(); this._tegnSide(); this._oppdaterKart(); }
  _velg(v) { this._valg = v; this._sideHtml = null; this._tegnKart(); this._tegnSide(); this._oppdaterKart(); }
  _proxy(adr) { return this._utkast.scanners.find((s) => s.address.toLowerCase() === adr); }
  _rom(id) { return this._utkast.rooms.find((r) => r.id === id); }

  _punkt(ev, svg) {
    const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }

  // Fest til hjørner i andre rom (0,25 m) eller til 5 cm-rutenett
  _fest(x, y, etasje, unntak, naboer) {
    let best = null, bd = 0.25;
    for (const r of this._utkast.rooms) {
      if (r.floor !== etasje) continue;
      r.polygon.forEach((p, i) => {
        if (unntak && unntak.has(`${r.id}:${i}`)) return;
        const d = Math.hypot(p[0] - x, p[1] - y);
        if (d < bd) { bd = d; best = p; }
      });
    }
    if (best) return [best[0], best[1]];
    const v = this._vinkelFest(x, y, naboer || []);
    if (v) return [Math.round(v[0] * 100) / 100, Math.round(v[1] * 100) / 100];
    return [Math.round(x * 20) / 20, Math.round(y * 20) / 20];
  }

  _koblede(romId, i) {
    const r = this._rom(romId);
    const [x, y] = r.polygon[i];
    const ut = [{ rom: romId, i }];
    if (!this._koble) return ut;
    for (const o of this._utkast.rooms) {
      if (o.floor !== r.floor || o.id === romId) continue;
      o.polygon.forEach((p, j) => { if (Math.hypot(p[0] - x, p[1] - y) < 0.03) ut.push({ rom: o.id, i: j }); });
    }
    return ut;
  }

  // Lengde på en vegg som tekst, litt inn i rommet (eller til venstre for linjen)
  _malTekst(a, b, sentrum) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    let nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
    if (sentrum && (sentrum[0] - mx) * nx + (sentrum[1] - my) * ny < 0) { nx = -nx; ny = -ny; }
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", mx + nx * 0.28); t.setAttribute("y", my + ny * 0.28);
    t.setAttribute("class", "mal");
    t.textContent = `${len.toFixed(2).replace(".", ",")} m`;
    return t;
  }

  // Sett eksakt lengde på vegg i: flytter sluttpunktet langs veggen (koblede hjørner følger med)
  _settLengde(romId, i, ny) {
    const r = this._rom(romId);
    const n = r.polygon.length, j = (i + 1) % n;
    const a = r.polygon[i], b = r.polygon[j];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!(ny > 0) || !len) return;
    const nb = [Math.round((a[0] + (b[0] - a[0]) * ny / len) * 100) / 100, Math.round((a[1] + (b[1] - a[1]) * ny / len) * 100) / 100];
    for (const v of this._koblede(romId, j)) this._rom(v.rom).polygon[v.i] = [...nb];
    this._endre();
  }

  _nyttHjorne(romId, i, punkt) {
    const r = this._rom(romId);
    const a = r.polygon[i], b = r.polygon[(i + 1) % r.polygon.length];
    let p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (punkt) {
      // Prosjiser klikket ned på veggen
      const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
      const s = Math.max(0.05, Math.min(0.95, ((punkt[0] - a[0]) * dx + (punkt[1] - a[1]) * dy) / l2));
      p = [a[0] + s * dx, a[1] + s * dy];
    }
    r.polygon.splice(i + 1, 0, [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]);
    this._valg = { type: "rom", id: romId, hj: i + 1 };
    this._endre();
  }

  // Fest et punkt slik at linjene til naboene blir 0/45/90/135 grader.
  _vinkelFest(x, y, naboer) {
    if (!this._vinkel || !naboer.length) return null;
    const dirs = [[1, 0], [Math.SQRT1_2, Math.SQRT1_2], [0, 1], [-Math.SQRT1_2, Math.SQRT1_2]];
    const linjer = [];
    for (const n of naboer) for (const d of dirs) linjer.push({ n, d });
    // 1) skjæringspunkt mellom linjer fra to ulike naboer
    let best = null, bd = 0.35;
    for (let a = 0; a < linjer.length; a++) for (let b = a + 1; b < linjer.length; b++) {
      const A = linjer[a], B = linjer[b];
      if (A.n === B.n) continue;
      const det = A.d[0] * B.d[1] - A.d[1] * B.d[0];
      if (Math.abs(det) < 1e-6) continue;
      const t = ((B.n[0] - A.n[0]) * B.d[1] - (B.n[1] - A.n[1]) * B.d[0]) / det;
      const p = [A.n[0] + t * A.d[0], A.n[1] + t * A.d[1]];
      const dd = Math.hypot(p[0] - x, p[1] - y);
      if (dd < bd) { bd = dd; best = p; }
    }
    if (best) return best;
    // 2) nærmeste enkeltlinje; langs linjen festes avstanden til 5 cm
    bd = 0.3;
    for (const { n, d } of linjer) {
      let s = (x - n[0]) * d[0] + (y - n[1]) * d[1];
      s = Math.round(s * 20) / 20;
      const p = [n[0] + s * d[0], n[1] + s * d[1]];
      const dd = Math.hypot(p[0] - x, p[1] - y);
      if (dd < bd) { bd = dd; best = p; }
    }
    return best;
  }

  _oppdaterPolygoner(fid) {
    for (const r of this._utkast.rooms) {
      if (r.floor !== fid) continue;
      const pg = this._svg[fid] && this._svg[fid].romEl[r.id];
      if (pg) pg.setAttribute("points", r.polygon.map((p) => p.join(",")).join(" "));
    }
  }

  _tegnRed(fid) {
    const f = this._svg[fid];
    const lag = f.lag.red;
    lag.innerHTML = "";
    // Valgt rom: hjørner og midtpunkter
    if (this._valg && this._valg.type === "rom") {
      const r = this._rom(this._valg.id);
      if (r && r.floor === fid) {
        r.polygon.forEach((p, i) => {
          const q = r.polygon[(i + 1) % r.polygon.length];
          const l = document.createElementNS(NS, "line");
          l.setAttribute("x1", p[0]); l.setAttribute("y1", p[1]); l.setAttribute("x2", q[0]); l.setAttribute("y2", q[1]);
          const aktiv = (this._draObj && this._draObj.type === "vegg" && this._draObj.rom === r.id && this._draObj.i === i) || this._valg.vegg === i;
          l.setAttribute("class", "vegg" + (aktiv ? " aktiv" : ""));
          const tt = document.createElementNS(NS, "title"); tt.textContent = "Dra for å flytte veggen parallelt. Dobbeltklikk for nytt hjørne."; l.appendChild(tt);
          l.addEventListener("pointerdown", (ev) => this._startDra(ev, { type: "vegg", rom: r.id, i }, f.svg, fid));

          lag.appendChild(l);
        });
        const sentrum = r.polygon.reduce((s, p) => [s[0] + p[0] / r.polygon.length, s[1] + p[1] / r.polygon.length], [0, 0]);
        r.polygon.forEach((p, i) => lag.appendChild(this._malTekst(p, r.polygon[(i + 1) % r.polygon.length], sentrum)));
        r.polygon.forEach((p, i) => {
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 0.17);
          c.setAttribute("class", "hj" + (this._valg.hj === i ? " valgt" : ""));
          c.addEventListener("pointerdown", (ev) => { this._valg = { type: "rom", id: r.id, hj: i }; this._startDra(ev, { type: "hj", rom: r.id, i }, f.svg, fid); });
          lag.appendChild(c);
        });
      }
    }
    // Nytt rom under tegning
    if (this._nyttRom && this._nyttRom.floor === fid && this._nyttRom.points.length) {
      const pl = document.createElementNS(NS, this._nyttRom.points.length > 2 ? "polygon" : "polyline");
      pl.setAttribute("points", this._nyttRom.points.map((p) => p.join(",")).join(" "));
      pl.setAttribute("class", "nytt");
      lag.appendChild(pl);
      const np = this._nyttRom.points;
      for (let i = 0; i + 1 < np.length; i++) lag.appendChild(this._malTekst(np[i], np[i + 1], null));
      for (const p of this._nyttRom.points) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 0.13); c.setAttribute("class", "hj");
        lag.appendChild(c);
      }
    }
    this._oversett(lag);
  }

  _startDra(ev, mål, svg, etasje) {
    if (this._nyttRom || this._plasser || this._bgModus) return;
    ev.stopPropagation(); ev.preventDefault();
    try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignorer */ }
    this._draObj = { ...mål, svg, etasje, flyttet: false, el: ev.target, sx: ev.clientX, sy: ev.clientY };
    if (mål.type === "proxy") this._valg = { type: "proxy", adresse: mål.adresse };
    if (mål.type === "hj") {
      const k = this._koblede(mål.rom, mål.i);
      this._draObj.koblet = k;
      this._draObj.unntak = new Set(k.map((v) => `${v.rom}:${v.i}`));
    }
    if (mål.type === "vegg") {
      const r = this._rom(mål.rom);
      const n = r.polygon.length;
      const a = r.polygon[mål.i], b = r.polygon[(mål.i + 1) % n];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      this._draObj.normal = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
      this._draObj.start = this._punkt(ev, svg);
      const flytt = [...this._koblede(mål.rom, mål.i), ...this._koblede(mål.rom, (mål.i + 1) % n)];
      const sett = new Map();
      for (const v of flytt) sett.set(`${v.rom}:${v.i}`, { ...v, orig: [...this._rom(v.rom).polygon[v.i]] });
      this._draObj.flytt = [...sett.values()];
      this._valg = { type: "rom", id: mål.rom };
    }
  }

  _dra(ev, svg) {
    const d = this._draObj;
    if (!d || d.svg !== svg) return;
    // Små bevegelser (skjelving i hånd/mus) er ikke dra: krever 6 skjermpiksler
    if (!d.flyttet && d.sx != null && Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < 6) return;
    const [x0, y0] = this._punkt(ev, svg);
    d.flyttet = true;
    if (d.type === "bg") {
      const nx = d.orig[0] + (x0 - d.start[0]), ny = d.orig[1] + (y0 - d.start[1]);
      d.ny = [Math.round(nx * 100) / 100, Math.round(ny * 100) / 100];
      if (d.el) { d.el.setAttribute("x", d.ny[0]); d.el.setAttribute("y", d.ny[1]); }
      return;
    }
    if (d.type === "proxy") {
      const s = this._proxy(d.adresse);
      [s.x, s.y] = [Math.round(x0 * 20) / 20, Math.round(y0 * 20) / 20];
      if (d.el) { d.el.setAttribute("cx", s.x); d.el.setAttribute("cy", s.y); }
    } else if (d.type === "hj") {
      const r = this._rom(d.rom);
      const n = r.polygon.length;
      const naboer = [r.polygon[(d.i - 1 + n) % n], r.polygon[(d.i + 1) % n]];
      const ny = this._fest(x0, y0, r.floor, d.unntak, naboer);
      for (const v of d.koblet) this._rom(v.rom).polygon[v.i] = [...ny];
      this._oppdaterPolygoner(r.floor);
      this._tegnRed(r.floor);
    } else if (d.type === "vegg") {
      const [nx, ny] = d.normal;
      let s = (x0 - d.start[0]) * nx + (y0 - d.start[1]) * ny;
      s = Math.round(s * 20) / 20;
      for (const v of d.flytt) {
        this._rom(v.rom).polygon[v.i] = [Math.round((v.orig[0] + nx * s) * 100) / 100, Math.round((v.orig[1] + ny * s) * 100) / 100];
      }
      d.avstand = s;
      this._oppdaterPolygoner(this._rom(d.rom).floor);
      this._tegnRed(this._rom(d.rom).floor);
    }
  }

  _slippDra() {
    const d = this._draObj;
    if (!d) return;
    this._draObj = null;
    this._sisteDra = Date.now();
    if (d.type === "bg") { if (d.ny) this._settBg(d.etasje, { x: d.ny[0], y: d.ny[1] }); return; }
    if (d.type === "vegg" && !d.flyttet) {
      // To raske trykk på samme vegg = nytt hjørne der du trykket
      const nå = Date.now(), f = this._forrigeVeggTrykk;
      this._forrigeVeggTrykk = { rom: d.rom, i: d.i, t: nå };
      if (f && f.rom === d.rom && f.i === d.i && nå - f.t < 500) {
        this._forrigeVeggTrykk = null;
        this._nyttHjorne(d.rom, d.i, d.start);
        return;
      }
      this._velg({ type: "rom", id: d.rom, vegg: d.i });
      return;
    }
    if (d.flyttet || d.type === "hj") this._endre(); else this._velg(this._valg);
    if (d.type === "vegg" && d.avstand) this._melding = `Veggen ble flyttet ${Math.abs(d.avstand).toFixed(2)} m.`;
  }

  _redKlikk(ev, etasje, svg) {
    if (this._sisteDra && Date.now() - this._sisteDra < 300) return; // klikket som avslutter en dragning
    const [x, y] = this._punkt(ev, svg);
    if (this._bgModus && this._bgModus.floor === etasje && this._bgModus.type !== "flytt") {
      const bg = this._bgRekt(etasje);
      if (!bg) return;
      const m = bg.m;
      const px = [(x - m.x) / m.scale, (y - m.y) / m.scale];
      if (this._bgModus.type === "null") {
        const kx = Number(this._bgModus.kx) || 0, ky = Number(this._bgModus.ky) || 0;
        this._bgModus = null;
        this._settBg(etasje, { x: kx - px[0] * m.scale, y: ky - px[1] * m.scale });
        return;
      }
      if (this._bgModus.type === "avstand") {
        this._bgModus.pts.push({ px, xy: [x, y] });
        this._sideHtml = null; this._tegnSide(); this._tegnBgMerker(etasje);
        if (this._bgModus.pts.length === 2) {
          const [a, b] = this._bgModus.pts;
          const dpx = Math.hypot(b.px[0] - a.px[0], b.px[1] - a.px[1]);
          const svar = prompt(this._t("Hvor langt er det mellom de to punktene i virkeligheten? (meter, f.eks. 9 eller 9,0)"), "");
          this._bgModus = null;
          const L = Number(String(svar || "").replace(",", "."));
          if (!(L > 0) || !dpx) { this._sideHtml = null; this._tegnSide(); this._tegnKart(); return; }
          const s = L / dpx;
          // Første punkt blir liggende der det er
          this._settBg(etasje, { scale: s, x: a.xy[0] - a.px[0] * s, y: a.xy[1] - a.px[1] * s });
        }
        return;
      }
    }
    if (this._velgNull) {
      const [ox, oy] = this._fest(x, y, etasje);
      if (!confirm(this._t(`Flytte nullpunktet hit (${ox.toFixed(2)}, ${oy.toFixed(2)})?\nAlle rom, proxyer og målepunkter i alle etasjer flyttes slik at dette blir 0,0.`))) return;
      const u = this._utkast;
      for (const r of u.rooms) r.polygon = r.polygon.map((p) => [Math.round((p[0] - ox) * 100) / 100, Math.round((p[1] - oy) * 100) / 100]);
      for (const s of u.scanners) { s.x = Math.round((s.x - ox) * 100) / 100; s.y = Math.round((s.y - oy) * 100) / 100; }
      this._shift = [(this._shift ? this._shift[0] : 0) + ox, (this._shift ? this._shift[1] : 0) + oy];
      this._velgNull = false;
      this._endre();
      return;
    }
    if (this._plasser) {
      this._utkast.scanners.push({ address: this._plasser.address, name: this._plasser.name, floor: etasje,
        x: Math.round(x * 20) / 20, y: Math.round(y * 20) / 20, z: 2.4, room: null });
      this._valg = { type: "proxy", adresse: this._plasser.address.toLowerCase() };
      this._plasser = null;
      this._endre();
      return;
    }
    if (this._nyttRom) {
      if (this._nyttRom.floor && this._nyttRom.floor !== etasje) return;
      this._nyttRom.floor = etasje;
      const pts = this._nyttRom.points;
      const naboer = pts.length ? (pts.length >= 2 ? [pts[pts.length - 1], pts[0]] : [pts[pts.length - 1]]) : [];
      pts.push(this._fest(x, y, etasje, null, naboer));
      this._sideHtml = null; this._tegnRed(etasje); this._tegnSide();
      return;
    }
    if (this._valg) this._velg(null);
  }

  _sideRed() {
    const u = this._utkast;
    let valg = `<div class="sm">Trykk på et rom for å endre hjørnene, eller dra en proxy for å flytte den. Hjørner festes til nabo-rommenes hjørner.</div>`;
    const etasjeOpts = (sel) => Object.entries(u.floors).sort((a, b) => b[1].level - a[1].level)
      .map(([id, f]) => `<option value="${id}" ${id === sel ? "selected" : ""}>${esc(f.name)}</option>`).join("");
    if (this._velgNull) {
      valg = `<div class="melding">Trykk på punktet som skal bli nytt nullpunkt (0,0), f.eks. et ytterhjørne av huset. Punktet festes til nærmeste romhjørne.</div>
        <div class="knapper"><button class="knapp sek null-avbryt">Avbryt</button></div>`;
    } else if (this._nyttRom) {
      const n = this._nyttRom.points.length;
      valg = `<div class="melding">Tegner nytt rom: trykk på kartet for hvert hjørne (${n} så langt). Hjørnene festes til 45°/90° fra forrige og første hjørne.</div>
        <div class="felt"><span>Navn</span><input class="nr-navn" value="${esc(this._nyttRom.name || "")}" placeholder="F.eks. Kontor"></div>
        <div class="knapper"><button class="knapp nr-ferdig" ${n >= 3 ? "" : "disabled"}>Ferdig</button>
          <button class="knapp sek nr-angre" ${n ? "" : "disabled"}>Fjern siste hjørne</button><button class="knapp sek nr-avbryt">Avbryt</button></div>`;
    } else if (this._plasser) {
      valg = `<div class="melding">Trykk på kartet der «${esc(this._plasser.name)}» står.</div>
        <div class="knapper"><button class="knapp sek pl-avbryt">Avbryt</button></div>`;
    } else if (this._valg && this._valg.type === "proxy") {
      const s = this._proxy(this._valg.adresse);
      if (s) {
        const romOpts = `<option value="">Automatisk (${esc((this._modell.proxyer.find((p) => p.adresse === s.address.toLowerCase()) || {}).rom || "–")})</option>` +
          u.rooms.filter((r) => r.floor === s.floor).map((r) => `<option value="${r.id}" ${r.id === s.room ? "selected" : ""}>${esc(r.name)}</option>`).join("");
        valg = `<h3>Proxy</h3><div class="felt">
          <span>Navn</span><input data-f="name" value="${esc(s.name)}">
          <span>Adresse</span><span class="sm">${esc(s.address)}</span>
          <span>Etasje</span><select data-f="floor">${etasjeOpts(s.floor)}</select>
          <span>x (m)</span><input data-f="x" type="number" step="0.05" value="${s.x}">
          <span>y (m)</span><input data-f="y" type="number" step="0.05" value="${s.y}">
          <span>Høyde over gulv</span><input data-f="z" type="number" step="0.1" value="${s.z}">
          <span>Rom</span><select data-f="room">${romOpts}</select></div>
          <div class="knapper"><button class="knapp fare px-slett">Fjern proxy</button></div>`;
      }
    } else if (this._valg && this._valg.type === "rom") {
      const r = this._rom(this._valg.id);
      if (r) {
        const omr = Object.values(this._hass.areas || {}).sort((a, b) => a.name.localeCompare(b.name))
          .map((a) => `<option value="${a.area_id}" ${a.area_id === r.area ? "selected" : ""}>${esc(a.name)}</option>`).join("");
        const hj = this._valg.hj;
        valg = `<h3>Rom</h3><div class="felt">
          <span>Navn</span><input data-r="name" value="${esc(r.name)}">
          <span>Id</span><span class="sm">${esc(r.id)} (brukes i entitetene)</span>
          <span>Etasje</span><span class="sm">${esc(u.floors[r.floor].name)}</span>
          <span>HA-område</span><select data-r="area"><option value="">Ingen</option>${omr}</select>
          <span>Areal</span><span class="sm">${areal(r.polygon).toFixed(1).replace(".", ",")} m²</span>
          ${this._valg.vegg != null ? (() => {
            const a = r.polygon[this._valg.vegg], b = r.polygon[(this._valg.vegg + 1) % r.polygon.length];
            return `<span>Valgt vegg</span><span><input class="vegglengde" type="number" step="0.01" min="0.05" value="${Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2)}" style="width:90px"> m</span>`;
          })() : ""}
          <span>Hjørner</span><span class="sm">${r.polygon.length}${hj != null ? ` · valgt: (${r.polygon[hj][0].toFixed(2)}, ${r.polygon[hj][1].toFixed(2)})` : ""}</span></div>
          <div class="sm">Dra en vegg for å flytte den parallelt (5 cm-steg). Dra et hjørne for å flytte bare det. Trykk på en vegg for å skrive inn eksakt lengde; sluttpunktet (med klokka) flyttes. Trykk to ganger raskt på en vegg for nytt hjørne der du trykker (eller trykk én gang og bruk knappen under).</div>
          ${this._valg.vegg != null ? `<div class="knapper"><button class="knapp sek ny-hj">Nytt hjørne midt på valgt vegg</button></div>` : ""}
          <label><input type="checkbox" class="koble" ${this._koble ? "checked" : ""}> Flytt felles vegger og hjørner i nabo-rom samtidig</label>
          <label><input type="checkbox" class="vinkel" ${this._vinkel ? "checked" : ""}> Fest hjørner til 45° og 90°</label>
          <div class="knapper"><button class="knapp sek hj-slett" ${hj != null && r.polygon.length > 3 ? "" : "disabled"}>Slett valgt hjørne</button>
            <button class="knapp fare rom-slett">Slett rom</button></div>`;
      }
    }
    const eksport = this._eksport != null ? `<textarea readonly>${esc(this._eksport)}</textarea>
      <div class="sm">Ta vare på dette som sikkerhetskopi av oppsettet.</div>` : "";
    return `
      <div class="kort side"><h3>Redigering</h3>
        ${this._endret ? '<div class="sm"><b class="middels">Ulagrede endringer.</b></div>' : ""}
        <div class="knapper"><button class="knapp lagre" ${this._endret ? "" : "disabled"}>Lagre</button>
          <button class="knapp sek angre" ${this._endret ? "" : "disabled"}>Angre endringer</button></div>
        ${valg}</div>
      ${this._sideEtasjer()}
      ${this._sideBg()}
      <div class="kort side"><h3>Nullpunkt</h3>
        <div class="sm">Det røde krysset er 0,0 og gjelder alle etasjer. x øker mot høyre, y nedover, i meter. Høyden på proxyer måles fra gulvet i egen etasje.</div>
        <div class="knapper"><button class="knapp sek null" ${this._velgNull || this._nyttRom || this._plasser ? "disabled" : ""}>Velg nytt nullpunkt</button></div>
        ${this._shift ? `<div class="sm middels">Nullpunktet er flyttet ${this._shift[0].toFixed(2)} m / ${this._shift[1].toFixed(2)} m. Målepunktene flyttes likt når du lagrer.</div>` : ""}</div>
      <div class="kort side"><h3>Legg til</h3>
        <div class="knapper"><button class="knapp sek nytt-rom" ${this._nyttRom || this._plasser ? "disabled" : ""}>Nytt rom</button>
          <select class="ny-proxy" ${this._nyttRom || this._plasser ? "disabled" : ""}><option value="">Legg til proxy …</option>${(this._ledige || []).map((s) => `<option value="${esc(s.address)}">${esc(s.name)}</option>`).join("")}</select></div>
        <div class="sm">Lista viser Bluetooth-proxyer i HA som ikke er plassert ennå.</div></div>
      ${this._sidePersoner()}
      <div class="kort side"><h3>Sikkerhetskopi</h3>
        <div class="knapper"><button class="knapp sek eksporter">Vis oppsettet som YAML</button></div>${eksport}</div>`;
  }

  _sideBg() {
    const u = this._utkast;
    const etasjer = Object.entries(u.floors).sort((a, b) => b[1].level - a[1].level);
    const vf = this._aktivEtasje();
    if (vf && vf !== "alle" && u.floors[vf]) this._bgEtasje = vf;
    if (!this._bgEtasje || !u.floors[this._bgEtasje]) this._bgEtasje = etasjer.length ? etasjer[0][0] : null;
    const fid = this._bgEtasje;
    const m = (this._modell.planer || {})[fid];
    const opts = etasjer.map(([id, f]) => `<option value="${id}" ${id === fid ? "selected" : ""}>${esc(f.name)}</option>`).join("");
    let innhold;
    const bm = this._bgModus;
    if (bm && bm.type === "avstand") {
      innhold = `<div class="melding">Trykk på to punkter på tegningen med kjent avstand, f.eks. endene av en målsatt vegg (${bm.pts.length}/2).</div>
        <div class="knapper"><button class="knapp sek bg-avbryt">Avbryt</button></div>`;
    } else if (bm && bm.type === "null") {
      innhold = `<div class="sm">Skriv inn hvor punktet ligger i husets koordinater (0,0 = nullpunktet), og trykk så på punktet på tegningen.</div>
        <div class="felt"><span>x (m)</span><input class="bg-kx" type="number" step="0.01" value="${bm.kx ?? 0}">
          <span>y (m)</span><input class="bg-ky" type="number" step="0.01" value="${bm.ky ?? 0}"></div>
        <div class="melding">Trykk på det kjente punktet på tegningen.</div>
        <div class="knapper"><button class="knapp sek bg-avbryt">Avbryt</button></div>`;
    } else if (bm && bm.type === "flytt") {
      innhold = `<div class="melding">Dra tegningen på kartet til den ligger riktig over rommene.</div>
        <div class="knapper"><button class="knapp bg-avbryt">Ferdig</button></div>`;
    } else if (m && this._shift) {
      innhold = `<div class="sm middels">Lagre det nye nullpunktet før du justerer tegningen.</div>`;
    } else if (m) {
      innhold = `<div class="felt">
          <span>Synlighet</span><input class="bg-op" type="range" min="0.1" max="1" step="0.05" value="${m.opacity ?? 0.5}">
          <span>Målestokk</span><span class="sm">1 piksel = ${(m.scale * 100).toFixed(2).replace(".", ",")} cm · bildet er ${(m.width * m.scale).toFixed(1)} × ${(m.height * m.scale).toFixed(1)} m</span>
          <span>Plassering</span><span class="sm">øvre venstre hjørne i (${m.x.toFixed(2)}, ${m.y.toFixed(2)})</span></div>
        <div class="knapper">
          <button class="knapp sek bg-avstand">1. Mål kjent avstand</button>
          <button class="knapp sek bg-null">2. Velg kjent punkt på tegningen</button>
          <button class="knapp sek bg-flytt">Dra tegningen</button></div>
        <div class="knapper"><label class="knapp sek" style="display:inline-flex">Bytt bilde<input class="bg-fil" type="file" accept="image/png,image/jpeg,image/webp" hidden></label>
          <button class="knapp fare bg-slett">Fjern</button></div>`;
    } else {
      innhold = `<div class="sm">Last opp en plantegning (PNG eller JPEG, f.eks. skjermbilde av PDF-en) for denne etasjen. Deretter måler du en kjent avstand og velger et kjent punkt (f.eks. nullpunktet), og så kan du tegne rommene oppå.</div>
        <div class="knapper"><label class="knapp" style="display:inline-flex">Last opp tegning<input class="bg-fil" type="file" accept="image/png,image/jpeg,image/webp" hidden></label></div>`;
    }
    return `<div class="kort side"><h3>Bakgrunnstegning</h3>
      <div class="felt"><span>Etasje</span><select class="bg-etasje">${opts}</select></div>
      ${innhold}
      <label><input type="checkbox" class="bg-vis" ${this._visBg ? "checked" : ""}> Vis tegningen på kartet (alle faner)</label></div>`;
  }

  async _hentLedige() {
    try {
      const devs = await this._hass.callWS({ type: "config/device_registry/list" });
      const brukt = new Set(this._utkast.scanners.map((s) => s.address.toUpperCase()));
      const ut = [];
      for (const d of devs) {
        const bt = (d.connections || []).find((c) => c[0] === "bluetooth");
        if (!bt) continue;
        const adr = String(bt[1]).toUpperCase();
        if (brukt.has(adr)) continue;
        // Bare skannere (proxyer/adaptere), ikke vanlige BLE-enheter
        if (!(d.config_entries || []).length || !/proxy|scanner|adapter|esp|bluetooth/i.test(`${d.name || ""} ${d.name_by_user || ""} ${d.model || ""}`)) continue;
        ut.push({ address: adr, name: d.name_by_user || d.name || adr });
      }
      this._ledige = ut.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) { this._ledige = []; }
    this._sideHtml = null; this._tegnSide();
  }

  _kobleRed(side) {
    const q = (s) => side.querySelector(s);
    if (!this._ledige) this._hentLedige();
    side.querySelectorAll("[data-f]").forEach((el) => el.addEventListener("change", () => {
      const s = this._proxy(this._valg.adresse); const f = el.dataset.f;
      let v = el.value;
      if (["x", "y", "z"].includes(f)) v = Number(v);
      if (f === "room") v = v || null;
      s[f] = v;
      if (f === "floor") s.room = null;
      this._endre();
    }));
    side.querySelectorAll("[data-r]").forEach((el) => el.addEventListener("change", () => {
      const r = this._rom(this._valg.id); r[el.dataset.r] = el.value || null; this._endre();
    }));
    if (q(".px-slett")) q(".px-slett").addEventListener("click", () => {
      if (!confirm(this._t("Fjerne proxyen fra kartet? Den brukes da ikke i posisjonsberegningen."))) return;
      this._utkast.scanners = this._utkast.scanners.filter((s) => s.address.toLowerCase() !== this._valg.adresse);
      this._valg = null; this._ledige = null; this._endre();
    });
    if (q(".hj-slett")) q(".hj-slett").addEventListener("click", () => {
      const r = this._rom(this._valg.id); r.polygon.splice(this._valg.hj, 1); this._valg = { type: "rom", id: r.id }; this._endre();
    });
    if (q(".rom-slett")) q(".rom-slett").addEventListener("click", () => {
      if (!confirm(this._t("Slette rommet? Sensorene for rommet blir stående til du sletter dem i HA."))) return;
      this._utkast.rooms = this._utkast.rooms.filter((r) => r.id !== this._valg.id);
      this._utkast.scanners.forEach((s) => { if (s.room === this._valg.id) s.room = null; });
      this._valg = null; this._endre();
    });
    if (q(".nytt-rom")) q(".nytt-rom").addEventListener("click", () => { this._valg = null; this._nyttRom = { floor: null, points: [], name: "" }; this._velg(null); });
    if (q(".nr-navn")) q(".nr-navn").addEventListener("input", (e) => { this._nyttRom.name = e.target.value; });
    if (q(".nr-angre")) q(".nr-angre").addEventListener("click", () => { this._nyttRom.points.pop(); this._sideHtml = null; if (this._nyttRom.floor) this._tegnRed(this._nyttRom.floor); this._tegnSide(); });
    if (q(".nr-avbryt")) q(".nr-avbryt").addEventListener("click", () => { this._nyttRom = null; this._velg(null); });
    if (q(".nr-ferdig")) q(".nr-ferdig").addEventListener("click", () => {
      const n = this._nyttRom;
      const navn = (n.name || "").trim() || "Nytt rom";
      let base = navn.toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "rom";
      let id = base, k = 2;
      while (this._rom(id)) id = `${base}_${k++}`;
      this._utkast.rooms.push({ id, name: navn, floor: n.floor, area: null, polygon: n.points });
      this._nyttRom = null; this._valg = { type: "rom", id }; this._endre();
    });
    if (q(".ny-proxy")) q(".ny-proxy").addEventListener("change", (e) => {
      const s = (this._ledige || []).find((x) => x.address === e.target.value);
      if (s) { this._plasser = s; this._valg = null; this._sideHtml = null; this._tegnSide(); }
    });
    if (q(".bg-etasje")) q(".bg-etasje").addEventListener("change", (e) => { this._bgEtasje = e.target.value; this._bgModus = null; this._velgEtasje(e.target.value); });
    if (q(".bg-fil")) q(".bg-fil").addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) this._lastOpp(this._bgEtasje, f); });
    if (q(".bg-op")) q(".bg-op").addEventListener("change", (e) => this._settBg(this._bgEtasje, { opacity: Number(e.target.value) }));
    if (q(".bg-avstand")) q(".bg-avstand").addEventListener("click", () => { this._bgModus = { type: "avstand", floor: this._bgEtasje, pts: [] }; this._valg = null; this._sideHtml = null; this._tegnKart(); this._tegnSide(); });
    if (q(".bg-null")) q(".bg-null").addEventListener("click", () => { this._bgModus = { type: "null", floor: this._bgEtasje, kx: 0, ky: 0 }; this._valg = null; this._sideHtml = null; this._tegnSide(); });
    if (q(".bg-flytt")) q(".bg-flytt").addEventListener("click", () => { this._bgModus = { type: "flytt", floor: this._bgEtasje }; this._valg = null; this._sideHtml = null; this._tegnSide(); });
    if (q(".bg-kx")) q(".bg-kx").addEventListener("input", (e) => { if (this._bgModus) this._bgModus.kx = e.target.value; });
    if (q(".bg-ky")) q(".bg-ky").addEventListener("input", (e) => { if (this._bgModus) this._bgModus.ky = e.target.value; });
    if (q(".bg-avbryt")) q(".bg-avbryt").addEventListener("click", () => { this._bgModus = null; this._sideHtml = null; this._tegnKart(); this._tegnSide(); });
    if (q(".bg-vis")) q(".bg-vis").addEventListener("change", (e) => { this._visBg = e.target.checked; this._tegnKart(); this._oppdaterKart(); });
    if (q(".bg-slett")) q(".bg-slett").addEventListener("click", async () => {
      if (!confirm(this._t("Fjerne bakgrunnstegningen for denne etasjen?"))) return;
      await this._hass.fetchWithAuth(`/api/${D}/plan/${this._bgEtasje}`, { method: "DELETE" });
      const pl = { ...(this._modell.planer || {}) }; delete pl[this._bgEtasje]; this._modell.planer = pl;
      await this._lastBilder(); this._sideHtml = null; this._tegnSide();
    });
    if (q(".vegglengde")) q(".vegglengde").addEventListener("change", (e) => this._settLengde(this._valg.id, this._valg.vegg, Number(e.target.value)));
    if (q(".vinkel")) q(".vinkel").addEventListener("change", (e) => { this._vinkel = e.target.checked; });
    if (q(".ny-hj")) q(".ny-hj").addEventListener("click", () => this._nyttHjorne(this._valg.id, this._valg.vegg, null));
    if (q(".koble")) q(".koble").addEventListener("change", (e) => { this._koble = e.target.checked; });
    if (q(".null")) q(".null").addEventListener("click", () => { this._velgNull = true; this._valg = null; this._sideHtml = null; this._tegnKart(); this._tegnSide(); });
    if (q(".null-avbryt")) q(".null-avbryt").addEventListener("click", () => { this._velgNull = false; this._sideHtml = null; this._tegnSide(); });
    if (q(".pl-avbryt")) q(".pl-avbryt").addEventListener("click", () => { this._plasser = null; this._sideHtml = null; this._tegnSide(); });
    if (q(".angre")) q(".angre").addEventListener("click", () => { this._lagUtkast(); this._sideHtml = null; this._tegnKart(); this._tegnSide(); this._oppdaterKart(); });
    if (q(".lagre")) q(".lagre").addEventListener("click", async (ev) => {
      ev.target.disabled = true; ev.target.textContent = this._t("Lagrer …");
      try {
        const msg = { type: `${D}/geometry/save`, geometry: this._utkast };
        if (this._shift) msg.shift = this._shift;
        const mod = await this._hass.callWS(msg);
        this._settModell(mod); this._lagUtkast();
      } catch (e) { alert(this._t(`Kunne ikke lagre: ${e.message || e}`)); ev.target.disabled = false; ev.target.textContent = this._t("Lagre"); return; }
      this._sideHtml = null; this._tegnKart(); this._tegnSide(); this._oppdaterKart();
    });
    if (q(".eksporter")) q(".eksporter").addEventListener("click", async () => {
      if (this._endret) { alert(this._t("Lagre først, så viser YAML-en det som er lagret.")); return; }
      const r = await this._hass.callWS({ type: `${D}/geometry/export` });
      this._eksport = r.yaml; this._sideHtml = null; this._tegnSide();
    });
    this._kobleEtasjer(side);
    this._koblePersoner(side);
  }


  // ---------- etasjer ----------
  _sideEtasjer() {
    const u = this._utkast;
    const rader = Object.entries(u.floors).sort((a, b) => b[1].level - a[1].level).map(([id, f]) => {
      const brukt = u.rooms.some((r) => r.floor === id) || u.scanners.some((s) => s.floor === id);
      return `<input data-et="${id}" data-k="name" value="${esc(f.name)}">
        <span style="display:flex;gap:4px;align-items:center"><input data-et="${id}" data-k="level" type="number" step="0.05" value="${f.level}" style="width:72px"> m</span>
        <button class="slett et-slett" data-id="${id}" ${brukt ? "disabled" : ""} title="${brukt ? "Etasjen har rom eller proxyer" : "Slett"}">✕</button>`;
    }).join("");
    return `<div class="kort side"><h3>Etasjer</h3>
      ${rader ? `<div class="felt" style="grid-template-columns:1fr auto auto"><span class="sm">Navn</span><span class="sm">Gulvnivå</span><span></span>${rader}</div>` : `<div class="sm">Ingen etasjer ennå.</div>`}
      <div class="sm">Gulvnivå er høyden på gulvet i meter i forhold til hovedetasjen (f.eks. 0, 2,75 og −2,65).</div>
      <div class="knapper"><button class="knapp sek ny-etasje">Legg til etasje</button></div></div>`;
  }

  _kobleEtasjer(side) {
    side.querySelectorAll("[data-et]").forEach((el) => el.addEventListener("change", () => {
      const f = this._utkast.floors[el.dataset.et];
      if (el.dataset.k === "level") f.level = Number(el.value) || 0; else f.name = el.value || f.name;
      this._endre();
    }));
    side.querySelectorAll(".et-slett").forEach((b) => b.addEventListener("click", () => {
      delete this._utkast.floors[b.dataset.id]; this._endre();
    }));
    const ny = side.querySelector(".ny-etasje");
    if (ny) ny.addEventListener("click", () => {
      const navn = prompt(this._t("Navn på etasjen (f.eks. 1. etasje)"), "");
      if (!navn) return;
      let base = navn.toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "etasje";
      let id = base, k = 2;
      while (this._utkast.floors[id]) id = `${base}_${k++}`;
      const nivaer = Object.values(this._utkast.floors).map((f) => f.level);
      this._utkast.floors[id] = { name: navn, level: nivaer.length ? Math.max(...nivaer) + 2.75 : 0 };
      this._bgEtasje = id;
      this._endre();
    });
  }

  // ---------- personer ----------
  _sidePersoner() {
    const pers = this._modell.personer || [];
    const enheter = this._bermuda || [];
    const navnPa = (adr) => (enheter.find((d) => d.address === adr) || {}).name;
    const rader = pers.map((p) => `<input data-pe="${p.id}" value="${esc(p.navn)}">
        <span class="sm" title="${esc(p.bermuda)}">${esc(navnPa(p.bermuda) || p.bermuda.slice(0, 10) + "…")}</span>
        <button class="slett pe-slett" data-id="${p.id}" title="Fjern">✕</button>`).join("");
    const brukt = new Set(pers.map((p) => p.bermuda));
    const ledige = enheter.filter((d) => !brukt.has(d.address));
    return `<div class="kort side"><h3>Personer</h3>
      ${rader ? `<div class="felt" style="grid-template-columns:1fr 1fr auto"><span class="sm">Navn</span><span class="sm">Bermuda-enhet</span><span></span>${rader}</div>` : `<div class="sm">Ingen personer ennå.</div>`}
      <div class="knapper"><select class="ny-person"><option value="">Legg til person …</option>${ledige.map((d) => `<option value="${esc(d.address)}">${esc(d.name)}</option>`).join("")}</select></div>
      <div class="sm">Lista viser telefoner og brikker Bermuda følger (f.eks. Private BLE Device). Endringer i personer lagres med en gang.</div></div>`;
  }

  async _hentBermuda() {
    if (this._bermudaHentet) return;
    this._bermudaHentet = true;
    try { this._bermuda = await this._hass.callWS({ type: `${D}/bermuda/devices` }); } catch (e) { this._bermuda = []; }
    this._sideHtml = null; this._tegnSide();
  }

  async _lagrePersoner(liste) {
    try {
      const mod = await this._hass.callWS({ type: `${D}/persons/save`, persons: liste });
      this._settModell(mod);
    } catch (e) { alert(this._t(`Kunne ikke lagre: ${e.message || e}`)); }
    this._sideHtml = null; this._tegnSide(); this._oppdaterKart();
  }

  _koblePersoner(side) {
    this._hentBermuda();
    const liste = () => (this._modell.personer || []).map((p) => ({ id: p.id, name: p.navn, bermuda: p.bermuda }));
    side.querySelectorAll("[data-pe]").forEach((el) => el.addEventListener("change", () => {
      const l = liste(); const p = l.find((x) => x.id === el.dataset.pe); if (p && el.value.trim()) { p.name = el.value.trim(); this._lagrePersoner(l); }
    }));
    side.querySelectorAll(".pe-slett").forEach((b) => b.addEventListener("click", () => {
      if (!confirm(this._t("Fjerne personen? Posisjonssensoren blir stående til du sletter den i HA."))) return;
      this._lagrePersoner(liste().filter((x) => x.id !== b.dataset.id));
    }));
    const ny = side.querySelector(".ny-person");
    if (ny) ny.addEventListener("change", () => {
      const d = (this._bermuda || []).find((x) => x.address === ny.value); if (!d) return;
      const navn = prompt(this._t("Navn på personen"), d.name.split(/\s+-\s+|\s/)[0]);
      if (!navn) { ny.value = ""; return; }
      this._lagrePersoner([...liste(), { name: navn, bermuda: d.address }]);
    });
  }

  _nullMerke() {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "null");
    g.innerHTML = `<title>Nullpunkt 0,0 (x mot høyre, y nedover)</title>
      <circle cx="0" cy="0" r=".09"/>
      <line x1="0" y1="0" x2=".9" y2="0"/><path class="pil" d="M1.05 0 L.85 -.09 L.85 .09 Z"/>
      <line x1="0" y1="0" x2="0" y2=".9"/><path class="pil" d="M0 1.05 L-.09 .85 L.09 .85 Z"/>
      <text x="1.12" y=".12">x</text><text x=".1" y="1.35">y</text><text x=".12" y="-.14">0,0</text>`;
    return g;
  }

  _settModell(mod) {
    mod.personer.forEach((x, i) => (x.farge = FARGER[i % FARGER.length]));
    this._modell = mod;
    if (this._utkast && !this._endret) this._lagUtkast();
    this._lastBilder();
  }

  // ---------- bakgrunnstegninger ----------
  async _lastBilder() {
    const planer = this._modell.planer || {};
    let endret = false;
    for (const [fid, m] of Object.entries(planer)) {
      const c = this._bilder[fid];
      if (c && c.v === m.v) continue;
      try {
        const r = await this._hass.fetchWithAuth(`/api/${D}/plan/${fid}?v=${m.v}`);
        if (!r.ok) continue;
        const url = URL.createObjectURL(await r.blob());
        if (c) URL.revokeObjectURL(c.url);
        this._bilder[fid] = { url, v: m.v };
        endret = true;
      } catch (e) { /* ignorer */ }
    }
    for (const fid of Object.keys(this._bilder)) if (!planer[fid]) { URL.revokeObjectURL(this._bilder[fid].url); delete this._bilder[fid]; endret = true; }
    if (endret) { this._tegnKart(); this._oppdaterKart(); }
  }

  _tegnBgMerker(fid) {
    const f = this._svg[fid]; if (!f || !this._bgModus || !this._bgModus.pts) return;
    for (const p of this._bgModus.pts) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", p.xy[0]); c.setAttribute("cy", p.xy[1]); c.setAttribute("r", 0.15); c.setAttribute("class", "hj valgt");
      f.lag.red.appendChild(c);
    }
  }

  _bgRekt(fid) {
    const m = (this._modell.planer || {})[fid];
    if (!m || !m.width) return null;
    // Ulagret nytt nullpunkt i redigering: vis tegningen flyttet like mye som rommene
    const s = this._fane === "red" && this._shift ? this._shift : [0, 0];
    return { x: m.x - s[0], y: m.y - s[1], w: m.width * m.scale, h: m.height * m.scale, m };
  }

  async _lastOpp(fid, fil) {
    const img = new Image();
    const url = URL.createObjectURL(fil);
    try {
      await new Promise((ok, feil) => { img.onload = ok; img.onerror = () => feil(new Error("Klarte ikke å lese bildet (bruk PNG eller JPEG)")); img.src = url; });
      const maks = 3000;
      const k = Math.min(1, maks / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise((ok) => cv.toBlob(ok, "image/png"));
      const r = await this._hass.fetchWithAuth(`/api/${D}/plan/${fid}?w=${w}&h=${h}`, { method: "POST", body: blob, headers: { "Content-Type": "image/png" } });
      if (!r.ok) throw new Error(await r.text());
      const meta = await r.json();
      this._modell.planer = { ...(this._modell.planer || {}), [fid]: meta };
      await this._lastBilder();
      this._sideHtml = null; this._tegnSide();
    } catch (e) { alert(this._t(`Opplasting feilet: ${e.message || e}`)); }
    finally { URL.revokeObjectURL(url); }
  }

  async _settBg(fid, endring) {
    try {
      this._modell.planer = await this._hass.callWS({ type: `${D}/plan/transform`, floor: fid, ...endring });
    } catch (e) { alert(this._t(`Feil: ${e.message || e}`)); }
    this._sideHtml = null; this._tegnKart(); this._tegnSide(); this._oppdaterKart();
  }

}

customElements.define("trigon-panel", TrigonPanel);
