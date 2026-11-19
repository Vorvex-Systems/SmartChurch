/* SmartChurch by Vorvex - Home Assistant panel. No dependencies, no external requests.
   All dynamic text is inserted via textContent (never innerHTML). */

const BASE = "/smartchurch";
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "mdi:view-dashboard-outline" },
  { id: "rooms", label: "Räume", icon: "mdi:door-open" },
  { id: "devices", label: "Geräte", icon: "mdi:devices" },
  { id: "automations", label: "Automatisierungen", icon: "mdi:calendar-clock" },
  { id: "energy", label: "Energie", icon: "mdi:lightning-bolt-outline" },
  { id: "monitoring", label: "Monitoring", icon: "mdi:heart-pulse" },
  { id: "integrations", label: "Integrationen", icon: "mdi:puzzle-outline" },
  { id: "settings", label: "Einstellungen", icon: "mdi:cog-outline" },
];
const SCOPE_LABELS = {
  resources: "Räume und Ressourcen",
  bookings: "Buchungen",
  events: "Veranstaltungen",
  groups: "Gruppen",
  persons: "Personen",
};
const PERSONAL = ["groups", "persons"];
const CT_ERRORS = {
  invalid_auth: "ChurchTools lehnt den Token ab. Trage unter Integrationen einen neuen Token ein.",
  cannot_connect: "ChurchTools ist nicht erreichbar. Prüfe die URL und die Netzwerkverbindung.",
  not_configured: "ChurchTools ist noch nicht eingerichtet.",
};

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const CSS = `
:host { --petrol:#00968D; --ink:#202428; --paper:#F4F5F5; --line:#dde0e0; --muted:#5b6469; --warn:#b3402a;
  display:block; height:100%; color:var(--ink); background:var(--paper);
  font-family: Roboto, "Segoe UI", system-ui, sans-serif; font-size:15px; line-height:1.45; }
* { box-sizing:border-box; }
.app { display:grid; grid-template-columns:248px 1fr; height:100%; }
nav { background:var(--ink); color:var(--paper); display:flex; flex-direction:column; padding:20px 12px; gap:4px; overflow-y:auto; }
.brand { display:flex; align-items:center; gap:12px; padding:4px 10px 22px; }
.brand svg { flex:none; }
.brand b { display:block; font-size:17px; font-weight:600; letter-spacing:.2px; }
.brand span { font-size:12px; color:#9aa4a9; }
nav button { all:unset; cursor:pointer; display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:6px;
  color:#c9d0d3; border-left:3px solid transparent; }
nav button ha-icon { --mdc-icon-size:20px; color:#8b969b; }
nav button:hover { background:rgba(255,255,255,.06); color:#fff; }
nav button:focus-visible { outline:2px solid var(--petrol); outline-offset:1px; }
nav button[aria-current="page"] { background:rgba(255,255,255,.09); color:#fff; border-left-color:var(--petrol); }
nav button[aria-current="page"] ha-icon { color:var(--petrol); }
main { overflow-y:auto; padding:32px 40px 48px; }
h1 { margin:0 0 4px; font-size:26px; font-weight:600; }
.lead { margin:0 0 28px; color:var(--muted); max-width:62ch; }
h2 { font-size:16px; font-weight:600; margin:32px 0 12px; }
.chain { display:flex; align-items:stretch; gap:0; flex-wrap:wrap; }
.node { background:#fff; border:1px solid var(--line); border-radius:8px; padding:18px 22px; min-width:200px; flex:1 1 200px; }
.node.core { background:var(--ink); color:var(--paper); border-color:var(--ink); }
.node .name { font-weight:600; font-size:17px; }
.node .sub { font-size:13px; color:var(--muted); margin-top:2px; }
.node.core .sub { color:#9aa4a9; }
.state { display:flex; align-items:center; gap:8px; margin-top:14px; font-size:14px; }
.dot { width:10px; height:10px; border-radius:50%; background:#9aa4a9; flex:none; }
.dot.ok { background:var(--petrol); } .dot.bad { background:var(--warn); }
.link { flex:0 0 36px; align-self:center; height:2px; background:var(--petrol); }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
.card { background:#fff; border:1px solid var(--line); border-radius:8px; padding:16px 18px; }
.card h3 { margin:0 0 6px; font-size:16px; font-weight:600; }
.card p { margin:4px 0; color:var(--muted); font-size:14px; }
.big { font-size:28px; font-weight:600; }
.tools { display:flex; gap:12px; margin:0 0 16px; flex-wrap:wrap; }
input, select { font:inherit; padding:8px 10px; border:1px solid #c5cbcd; border-radius:6px; background:#fff; color:var(--ink); }
input:focus-visible, select:focus-visible, .btn:focus-visible { outline:2px solid var(--petrol); outline-offset:1px; }
.btn { font:inherit; font-weight:500; padding:9px 16px; border-radius:6px; border:1px solid var(--petrol); background:var(--petrol);
  color:#fff; cursor:pointer; text-decoration:none; display:inline-block; }
.btn.ghost { background:transparent; color:#00776F; }
.btn[disabled] { opacity:.55; cursor:default; }
.tablewrap { overflow-x:auto; background:#fff; border:1px solid var(--line); border-radius:8px; }
table { border-collapse:collapse; width:100%; }
th, td { text-align:left; padding:10px 14px; border-bottom:1px solid #eceeee; font-size:14px; white-space:nowrap; }
th { color:var(--muted); font-weight:500; }
tr:last-child td { border-bottom:0; }
.banner { background:#fbeae6; border:1px solid #e8b9ad; color:#7d2a18; border-radius:6px; padding:10px 14px; margin:0 0 20px; }
.ok-banner { background:#e3f3f1; border-color:#a9d6d1; color:#085b55; }
.empty { background:#fff; border:1px dashed #b9c0c2; border-radius:8px; padding:28px; color:var(--muted); max-width:62ch; }
.empty b { color:var(--ink); display:block; margin-bottom:4px; }
ul.plain { margin:8px 0 0; padding-left:18px; } ul.plain li { margin:3px 0; }
:host([narrow]) .app { grid-template-columns:1fr; grid-template-rows:1fr auto; }
:host([narrow]) nav { grid-row:2; flex-direction:row; padding:6px; gap:2px; overflow-x:auto; overflow-y:hidden; }
:host([narrow]) .brand { display:none; }
:host([narrow]) nav button { flex-direction:column; gap:2px; padding:6px 10px; font-size:11px; border-left:0; border-top:3px solid transparent; white-space:nowrap; }
:host([narrow]) nav button[aria-current="page"] { border-top-color:var(--petrol); }
:host([narrow]) main { padding:20px 16px 24px; grid-row:1; }
:host([narrow]) .link { flex-basis:100%; height:18px; width:2px; margin:0 auto; }
`;

const LOGO = `<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="8" fill="#00968D"/><path d="M18 7v5m-2.5-2.5h5M10 28V19l8-6 8 6v9z" fill="none" stroke="#F4F5F5" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

class SmartChurchPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._page = "dashboard";
    this._status = null;
    this._areas = [];
    this._entityReg = [];
    this._deviceReg = [];
    this._errors = [];
    this._filter = { q: "", domain: "" };
    this._lastCount = -1;
    this._test = null;
    this._onPop = () => { this._page = this._pageFromUrl(); this._render(); };
  }

  connectedCallback() {
    const style = document.createElement("style");
    style.textContent = CSS;
    this._nav = h("nav", { "aria-label": "Hauptnavigation" });
    this._main = h("main");
    this.shadowRoot.replaceChildren(style, h("div", { class: "app" }, this._nav, this._main));
    this._page = this._pageFromUrl();
    window.addEventListener("popstate", this._onPop);
    this._render();
    if (this._hass) this._load();
  }
  disconnectedCallback() { window.removeEventListener("popstate", this._onPop); }

  set panel(_) {}
  set narrow(v) { this.toggleAttribute("narrow", !!v); }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) { if (this.isConnected) this._load(); return; }
    const count = Object.keys(hass.states).length;
    if (count !== this._lastCount && ["dashboard", "rooms", "devices"].includes(this._page)) {
      this._lastCount = count;
      this._render();
    }
  }

  _pageFromUrl() {
    const sub = location.pathname.split("/")[2] || "dashboard";
    return NAV.some((n) => n.id === sub) ? sub : "dashboard";
  }
  _go(id) {
    history.pushState(null, "", id === "dashboard" ? BASE : `${BASE}/${id}`);
    this._page = id;
    this._render();
    this._main.scrollTop = 0;
  }

  async _load() {
    const call = async (label, msg) => {
      try { return await this._hass.callWS(msg); }
      catch (e) { this._errors.push(`${label}: ${e && e.message ? e.message : "Fehler"}`); return null; }
    };
    const [status, areas, ents, devs] = await Promise.all([
      call("SmartChurch-Status", { type: "smartchurch/status" }),
      call("Bereiche", { type: "config/area_registry/list" }),
      call("Entitäten", { type: "config/entity_registry/list" }),
      call("Geräte", { type: "config/device_registry/list" }),
    ]);
    this._status = status;
    this._areas = areas || [];
    this._entityReg = ents || [];
    this._deviceReg = devs || [];
    this._lastCount = Object.keys(this._hass.states).length;
    this._render();
  }

  /* ---- derived data ---- */
  _entityAreaMap() {
    const devArea = new Map(this._deviceReg.map((d) => [d.id, d.area_id]));
    const map = new Map();
    for (const e of this._entityReg) map.set(e.entity_id, e.area_id || devArea.get(e.device_id) || null);
    return map;
  }
  _entityName(id) {
    const st = this._hass.states[id];
    return (st && st.attributes && st.attributes.friendly_name) || id;
  }

  /* ---- rendering ---- */
  _render() {
    if (!this._nav) return;
    this._nav.replaceChildren(
      h("div", { class: "brand" }, this._logo(), h("div", {}, h("b", {}, "SmartChurch"), h("span", {}, "by Vorvex"))),
      ...NAV.map((n) =>
        h("button", { "aria-current": n.id === this._page ? "page" : null, onclick: () => this._go(n.id) },
          h("ha-icon", { icon: n.icon }), n.label)),
    );
    const item = NAV.find((n) => n.id === this._page);
    const body = this[`_page_${this._page}`]();
    this._main.replaceChildren(
      ...this._errors.map((e) => h("div", { class: "banner", role: "alert" }, e)),
      h("h1", {}, item.label),
      body,
    );
    document.title = `${item.label} – SmartChurch`;
  }
  _logo() { const d = document.createElement("div"); d.innerHTML = LOGO; return d.firstChild; }

  _stateRow(kind, text) { return h("div", { class: "state" }, h("span", { class: `dot ${kind}` }), text); }

  _page_dashboard() {
    const ha = this._hass && this._hass.connected !== false;
    const ct = this._status && this._status.churchtools;
    const ctKind = !this._status ? "" : ct.configured ? "ok" : "bad";
    const ctText = !this._status ? "Status unbekannt" : ct.configured ? "Verbunden" : "Nicht eingerichtet";
    const entities = this._hass ? Object.keys(this._hass.states).length : 0;
    return h("div", {},
      h("p", { class: "lead" }, "Buchungen aus ChurchTools steuern Heizung und Licht in Home Assistant. Hier siehst du, ob beide Seiten verbunden sind."),
      h("div", { class: "chain" },
        h("div", { class: "node" }, h("div", { class: "name" }, "ChurchTools"), h("div", { class: "sub" }, ct && ct.host ? ct.host : "Räume und Buchungen"), this._stateRow(ctKind, ctText)),
        h("div", { class: "link" }),
        h("div", { class: "node core" }, h("div", { class: "name" }, "SmartChurch"), h("div", { class: "sub" }, `Version ${this._status ? this._status.version : "–"}`), this._stateRow("ok", "Läuft")),
        h("div", { class: "link" }),
        h("div", { class: "node" }, h("div", { class: "name" }, "Geräte"), h("div", { class: "sub" }, `${entities} Entitäten`), this._stateRow(ha ? "ok" : "bad", ha ? "Verbunden" : "Getrennt")),
      ),
      ct && !ct.configured && h("div", { class: "empty", style: "margin-top:24px" }, h("b", {}, "ChurchTools fehlt noch"), "Verbinde ChurchTools unter Integrationen, damit Buchungen erkannt werden können."),
      h("h2", {}, "Nächste Schritte"),
      h("ul", { class: "plain" },
        h("li", {}, "Bereiche und Geräte prüfen (Räume, Geräte)."),
        h("li", {}, "ChurchTools verbinden und Datenfreigabe wählen (Integrationen)."),
        h("li", {}, "Regeln für Buchungen anlegen (Automatisierungen, folgt in einer späteren Version)."),
      ),
    );
  }

  _page_rooms() {
    if (!this._areas.length) {
      return h("div", { class: "empty" }, h("b", {}, "Noch keine Bereiche"), "Lege Bereiche in Home Assistant unter Einstellungen → Bereiche an. Sie erscheinen dann hier als Räume.");
    }
    const areaOf = this._entityAreaMap();
    const stats = new Map();
    for (const [id, area] of areaOf) {
      if (!area || !this._hass.states[id]) continue;
      const s = stats.get(area) || { total: 0, lightsOn: 0 };
      s.total++;
      if (id.startsWith("light.") && this._hass.states[id].state === "on") s.lightsOn++;
      stats.set(area, s);
    }
    return h("div", { class: "grid" }, ...[...this._areas].sort((a, b) => a.name.localeCompare(b.name, "de")).map((a) => {
      const s = stats.get(a.area_id) || { total: 0, lightsOn: 0 };
      return h("div", { class: "card" }, h("h3", {}, a.name), h("div", { class: "big" }, s.total), h("p", {}, "Entitäten"), h("p", {}, s.lightsOn ? `${s.lightsOn} Licht(er) an` : "Kein Licht an"));
    }));
  }

  _page_devices() {
    const areaOf = this._entityAreaMap();
    const areaName = new Map(this._areas.map((a) => [a.area_id, a.name]));
    const ids = Object.keys(this._hass.states);
    const domains = [...new Set(ids.map((i) => i.split(".")[0]))].sort();
    const q = this._filter.q.toLowerCase();
    const rows = ids.filter((id) => (!this._filter.domain || id.startsWith(this._filter.domain + ".")) &&
      (!q || id.toLowerCase().includes(q) || this._entityName(id).toLowerCase().includes(q))).sort();
    const shown = rows.slice(0, 200);
    const search = h("input", { type: "search", placeholder: "Suchen", "aria-label": "Geräte suchen", value: this._filter.q });
    search.addEventListener("input", () => { this._filter.q = search.value; this._rerenderKeepFocus("input[type=search]"); });
    const sel = h("select", { "aria-label": "Typ filtern" }, h("option", { value: "" }, "Alle Typen"),
      ...domains.map((d) => h("option", { value: d, selected: d === this._filter.domain }, d)));
    sel.addEventListener("change", () => { this._filter.domain = sel.value; this._render(); });
    return h("div", {},
      h("p", { class: "lead" }, "Alle Entitäten aus Home Assistant. Steuern kannst du sie in einer späteren Version, gesteuert durch Regeln und mit Freigabeliste."),
      h("div", { class: "tools" }, search, sel),
      h("div", { class: "tablewrap" }, h("table", {},
        h("thead", {}, h("tr", {}, h("th", {}, "Name"), h("th", {}, "Raum"), h("th", {}, "Zustand"))),
        h("tbody", {}, ...shown.map((id) => h("tr", {}, h("td", {}, this._entityName(id)), h("td", {}, areaName.get(areaOf.get(id)) || "–"), h("td", {}, this._hass.states[id].state)))))),
      rows.length > shown.length && h("p", { class: "lead", style: "margin-top:12px" }, `${shown.length} von ${rows.length} angezeigt. Verfeinere die Suche.`),
    );
  }
  _rerenderKeepFocus(sel) {
    this._render();
    const el = this._main.querySelector(sel);
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }

  _later(text) {
    return h("div", { class: "empty" }, h("b", {}, "Noch nicht verfügbar"), text);
  }
  _page_automations() { return this._later("Regeln, die Buchungen mit Heizung, Licht und Szenen verknüpfen, folgen als Nächstes."); }
  _page_energy() { return this._later("Energiewerte aus den Home-Assistant-Sensoren werden hier angezeigt, sobald die Automatisierung steht."); }
  _page_monitoring() { return this._later("Hier erscheinen Verbindungsstatus, Fehler und das Protokoll ausgeführter Aktionen."); }

  _page_integrations() {
    const ct = this._status && this._status.churchtools;
    const admin = this._status && this._status.is_admin;
    const setup = "/config/integrations/integration/smartchurch";
    const card = [h("h3", {}, "ChurchTools")];
    if (!ct || !ct.configured) {
      card.push(h("p", {}, "Nicht eingerichtet."));
      card.push(admin ? h("a", { class: "btn", href: setup }, "ChurchTools hinzufügen") : h("p", {}, "Ein Administrator muss ChurchTools hinzufügen."));
    } else {
      card.push(this._stateRow("ok", `Verbunden mit ${ct.host || "ChurchTools"}`));
      card.push(h("p", {}, "Freigegebene Daten:"));
      card.push(h("ul", { class: "plain" }, ...ct.scopes.map((s) => h("li", {}, SCOPE_LABELS[s] || s, PERSONAL.includes(s) ? " (personenbezogen)" : ""))));
      if (admin) {
        const btn = h("button", { class: "btn ghost", style: "margin-right:8px", disabled: this._test === "busy" ? true : null, onclick: () => this._testCt() }, "Verbindung testen");
        card.push(h("div", { style: "margin-top:16px" }, btn, h("a", { class: "btn", href: setup }, "Einstellungen öffnen")));
        if (this._test && this._test !== "busy") {
          card.push(h("div", { class: this._test.ok ? "banner ok-banner" : "banner", style: "margin-top:14px", role: "status" },
            this._test.ok ? `Verbindung funktioniert (Benutzer: ${this._test.user || "unbekannt"}).` : CT_ERRORS[this._test.error] || "Test fehlgeschlagen."));
        }
      }
    }
    return h("div", {}, h("p", { class: "lead" }, "Externe Systeme, die SmartChurch nutzt. Zugangsdaten werden nur auf dem Server gespeichert."), h("div", { class: "grid" },
      h("div", { class: "card", style: "grid-column: span 2" }, ...card),
      h("div", { class: "card" }, h("h3", {}, "Home Assistant"), this._stateRow("ok", "Eingebaut"), h("p", {}, "SmartChurch läuft direkt in Home Assistant."))));
  }
  async _testCt() {
    this._test = "busy"; this._render();
    try { this._test = await this._hass.callWS({ type: "smartchurch/churchtools/test" }); }
    catch (e) { this._test = { ok: false, error: "cannot_connect" }; }
    this._render();
  }

  _page_settings() {
    const u = this._hass && this._hass.user;
    return h("div", { class: "grid" },
      h("div", { class: "card" }, h("h3", {}, "Angemeldet als"), h("p", {}, u ? u.name : "–"), h("p", {}, u && u.is_admin ? "Administrator" : "Benutzer")),
      h("div", { class: "card" }, h("h3", {}, "Version"), h("p", {}, `SmartChurch ${this._status ? this._status.version : "–"}`)),
      h("div", { class: "card" }, h("h3", {}, "Rechte"), h("p", {}, "Alle Benutzer sehen das Panel, Verbindungen verwalten nur Administratoren. Feinere Rollen folgen.")));
  }
}

customElements.define("smartchurch-panel", SmartChurchPanel);
