// Verlinkt in jedem Kapitel und Anhang das erste Vorkommen jedes Glossarbegriffs mit seiner Definitionsstelle.
// Die Links tragen class="gl"; das Skript entfernt sie vor jedem Lauf und setzt sie neu, ist also wiederholbar.
// Wortformen kommen aus data-forms am <dfn> (fehlt das Attribut, gilt der dfn-Text, sofern mindestens 4 Zeichen lang).
// Eine Form mit vorangestelltem ~ gilt nur im Kapitel des dfn (z. B. „~Exposition“ für die Fuge in Kapitel 38).
// Im eigenen Kapitel haben dessen Begriffe Vorrang vor gleichlautenden Formen anderer Kapitel. Sonst gilt bei gleichlautenden
// Formen die nächstliegende frühere Definition (Tonika in Kapitel 6 als Stufe, ab Kapitel 14 als Funktion).
// Aufruf: node mk_links.js [--dry]   (--dry schreibt nichts, sondern nur tools/links.txt zur Durchsicht)
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path");
const BOOK = path.join(__dirname, "..");
const DRY = process.argv.includes("--dry");

const toc = new JSDOM(`<script>${fs.readFileSync(path.join(BOOK, "toc.js"), "utf8")}</script>`, { runScripts: "dangerously" }).window.BOOK;
const file = (c) => "kap" + String(c.n).padStart(2, "0") + "-" + c.slug + ".html";
const chapterFiles = toc.parts.flatMap((p) => p.chapters).map(file).filter((f) => fs.existsSync(path.join(BOOK, f)));
const pages = [...chapterFiles, ...fs.readdirSync(BOOK).filter((f) => /^anhang-.*\.html$/.test(f)).sort()];

// Text in diesen Elementen wird nie verlinkt.
const SKIP = "h1, h2, h3, h4, h5, h6, dfn, a, button, summary, th, code, kbd, label, select, textarea, svg, script, style, " +
  ".abc, .kb, .formula, .num, .eyebrow, .lbl, .kind, .tag, .prereq, .chapter-foot, [data-nolink]";

const GL_LINK = /<a class="gl" href="[^"]*">([^<]*)<\/a>/g;
const read = (f) => fs.readFileSync(path.join(BOOK, f), "utf8").replace(GL_LINK, "$1");

// ---------- Begriffe sammeln (gleiche Reihenfolge und Dublettenregel wie mk_glossar.js) ----------
const terms = new Map();   // Begriff (klein) → kanonische id
const formTo = new Map();  // Wortform mit kleinem Anfangsbuchstaben → [{ id, n }] in Kapitelreihenfolge
const localForms = new Map(); // Datei → Map(Wortform → id) für die Begriffe dieses Kapitels
const target = new Map();  // id → Datei
const label = new Map();   // id → Stichwort (für links.txt)
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const chapterNo = (f) => { const m = /^kap(\d\d)/.exec(f); return m ? +m[1] : 99; };
function pick(k, n) {
  const list = formTo.get(k);
  if (!list) return null;
  const before = list.filter((x) => x.n <= n);
  return (before.length ? before[before.length - 1] : list[0]).id;
}
for (const f of chapterFiles) {
  new JSDOM(read(f)).window.document.querySelectorAll("dfn[id]").forEach((dfn) => {
    const text = dfn.textContent.trim().replace(/\s+/g, " ");
    const key = (dfn.dataset.term || text).trim().toLowerCase();
    if (!terms.has(key)) { terms.set(key, dfn.id); target.set(dfn.id, f); label.set(dfn.id, dfn.dataset.term || text); }
    const id = terms.get(key);
    const forms = dfn.hasAttribute("data-forms")
      ? dfn.dataset.forms.split("|").map((x) => x.trim().replace(/\s+/g, " ")).filter(Boolean)
      : (text.length >= 4 ? [text] : []);
    if (!localForms.has(f)) localForms.set(f, new Map());
    forms.forEach((form) => {
      const local = form.startsWith("~"), k = lowerFirst(local ? form.slice(1).trim() : form);
      localForms.get(f).set(k, id);
      if (local) return;
      const list = formTo.get(k) || formTo.set(k, []).get(k);
      if (!list.some((x) => x.id === id)) list.push({ id, n: chapterNo(f) });
    });
  });
}

// Ein Muster für alle Formen: ganze Wörter, keine Bindestrich-Nachbarn, Anfangsbuchstabe beliebig groß, Leerzeichen flexibel.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const allForms = new Set([...formTo.keys(), ...[...localForms.values()].flatMap((m) => [...m.keys()])]);
const pattern = [...allForms].sort((a, b) => b.length - a.length).map((k) => {
  const c = k.charAt(0), rest = esc(k.slice(1)).replace(/ /g, "\\s+");
  return (c.toUpperCase() !== c ? `[${esc(c)}${esc(c.toUpperCase())}]` : esc(c)) + rest;
});
const RE = new RegExp(`(?<![\\p{L}\\p{N}\\-])(?:${pattern.join("|")})(?![\\p{L}\\p{N}\\-])`, "gu");

// ---------- Seiten verlinken ----------
const review = [];
let total = 0;
for (const f of pages) {
  const src = read(f);
  const dom = new JSDOM(src, { includeNodeLocations: true });
  const d = dom.window.document;
  const main = d.querySelector("main");
  if (!main) continue;
  const done = new Set();
  const inserts = [];
  const local = new Map(localForms.get(f) || []);
  // Handlinks auf Begriffe zählen als bereits verlinkt. Ihr Wortlaut gilt im ganzen Kapitel als dieser Begriff,
  // so bleibt z. B. „Umkehrung“ in Kapitel 38 nach einem Handlink auf die Motivumkehrung unverlinkt.
  d.querySelectorAll('a[href*="#g-"]:not(.gl)').forEach((a) => {
    const id = a.getAttribute("href").split("#")[1];
    done.add(id);
    local.set(lowerFirst(a.textContent.trim().replace(/\s+/g, " ")), id);
  });
  const walker = d.createTreeWalker(main, dom.window.NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const skip = node.parentElement.closest(SKIP);
    if (skip) {
      // Hinter der Definitionsstelle braucht der Begriff in diesem Kapitel keinen Link mehr.
      const dfn = node.parentElement.closest("dfn");
      if (dfn) {
        if (dfn.id) done.add(dfn.id);
        const id = terms.get((dfn.dataset.term || dfn.textContent).trim().replace(/\s+/g, " ").toLowerCase());
        if (id) done.add(id);
      }
      continue;
    }
    const loc = dom.nodeLocation(node);
    if (!loc) continue;
    const raw = src.slice(loc.startOffset, loc.endOffset);
    for (const m of raw.matchAll(RE)) {
      const k = lowerFirst(m[0].replace(/\s+/g, " "));
      const id = local.get(k) || pick(k, chapterNo(f));
      if (!id || done.has(id)) continue;
      done.add(id);
      const href = target.get(id) === f ? "#" + id : target.get(id) + "#" + id;
      inserts.push({ at: loc.startOffset + m.index, len: m[0].length, href });
      const flat = (x) => x.replace(/\s+/g, " ");
      review.push(`${f} | ${id} (${label.get(id)}) | …${flat(raw.slice(Math.max(0, m.index - 90), m.index))}[${flat(m[0])}]${flat(raw.slice(m.index + m[0].length, m.index + m[0].length + 70))}…`);
    }
  }
  let out = src;
  inserts.sort((a, b) => b.at - a.at).forEach(({ at, len, href }) => {
    out = out.slice(0, at) + `<a class="gl" href="${href}">` + out.slice(at, at + len) + "</a>" + out.slice(at + len);
  });
  total += inserts.length;
  const before = fs.readFileSync(path.join(BOOK, f), "utf8");
  if (!DRY && out !== before) fs.writeFileSync(path.join(BOOK, f), out, "utf8");
}

fs.writeFileSync(path.join(__dirname, "links.txt"), review.join("\n") + "\n", "utf8");
console.log(`${total} Begriffslinks in ${pages.length} Seiten aus ${allForms.size} Wortformen${DRY ? " (Probelauf, nichts geschrieben)" : ""}. Liste: tools/links.txt`);
