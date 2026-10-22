// Erzeugt C:\dev\piano-theory\glossar.html aus allen <dfn>-Begriffen der Kapitel.
// Aufruf: node mk_glossar.js
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path");
const BOOK = path.join(__dirname, "..");

const toc = new JSDOM(`<script>${fs.readFileSync(path.join(BOOK, "toc.js"), "utf8")}</script>`, { runScripts: "dangerously" }).window.BOOK;
const chapters = toc.parts.flatMap((p) => p.chapters);
const file = (c) => "kap" + String(c.n).padStart(2, "0") + "-" + c.slug + ".html";

const entries = new Map();
for (const c of chapters) {
  const f = path.join(BOOK, file(c));
  if (!fs.existsSync(f)) continue;
  const d = new JSDOM(fs.readFileSync(f, "utf8")).window.document;
  d.querySelectorAll("dfn").forEach((dfn) => {
    const term = dfn.textContent.trim().replace(/\s+/g, " ");
    const key = term.toLowerCase();
    if (!term || entries.has(key)) return;
    const block = dfn.closest("p, li, td, dd") || dfn.parentElement;
    const text = block.textContent.replace(/\s+/g, " ").trim();
    const sentences = text.split(/(?<=[.!?:])\s+(?=[A-ZÄÖÜ„(])/);
    let def = sentences.find((s) => s.includes(term)) || sentences[0];
    if (def.length > 320) def = def.slice(0, 317).replace(/\s\S*$/, "") + " …";
    const sec = dfn.closest("section.layer");
    entries.set(key, { term, def, n: c.n, title: c.title, href: file(c) + (dfn.id ? "#" + dfn.id : ""), deep: !!(sec && sec.classList.contains("deep")) });
  });
}

const sorted = [...entries.values()].sort((a, b) => a.term.localeCompare(b.term, "de", { sensitivity: "base" }));
const groups = {};
sorted.forEach((e) => {
  let L = e.term[0].toUpperCase();
  L = { "Ä": "A", "Ö": "O", "Ü": "U" }[L] || L;
  if (!/[A-Z]/.test(L)) L = "#";
  (groups[L] = groups[L] || []).push(e);
});
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const letters = Object.keys(groups).sort();

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Glossar · Klavier verstehen</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=IBM+Plex+Mono:wght@400;500&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&display=swap">
<link rel="stylesheet" href="book.css">
<style>
  .letters { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-block: 0.8rem; font-family: var(--font-display); }
  .letters a { text-decoration: none; border: 1px solid var(--line); border-radius: 4px; padding: 0.1rem 0.5rem; }
  #q { width: 100%; font: inherit; padding: 0.5rem 0.8rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); color: var(--ink); }
  .gl h2 { font-size: var(--step-2); margin-top: 2rem; border-bottom: 2px solid var(--ink); padding-bottom: 0.2rem; }
  .gl dl { margin: 0; }
  .gl dt { font-family: var(--font-display); font-weight: 650; font-size: var(--step-1); margin-top: 1rem; }
  .gl dd { margin: 0.15rem 0 0; }
  .gl .src { font-family: var(--font-display); font-size: var(--step--1); }
  .gl .tag { font-family: var(--font-display); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--deep); border: 1px solid var(--deep-line); border-radius: 999px; padding: 0 0.45rem; margin-left: 0.4rem; }
</style>
</head>
<body>
<main class="wrap">
  <header class="chapter-head">
    <div class="num">Anhang</div>
    <h1>Glossar</h1>
    <p class="lede">${sorted.length} Fachbegriffe mit dem Satz, in dem sie eingeführt werden, und einem Link zur Stelle im Buch.</p>
  </header>
  <label for="q" class="eyebrow">Begriff suchen</label>
  <input id="q" type="search" placeholder="z. B. Tritonus" autocomplete="off">
  <nav class="letters">${letters.map((L) => `<a href="#L-${L}">${L}</a>`).join("")}</nav>
  <div class="gl">
${letters.map((L) => `    <section id="L-${L}"><h2>${L}</h2><dl>
${groups[L].map((e) => `      <div class="entry" data-t="${esc(e.term.toLowerCase())}"><dt>${esc(e.term)}${e.deep ? '<span class="tag">Vertiefung</span>' : ""}</dt><dd>${esc(e.def)} <a class="src" href="${e.href}">Kapitel ${e.n}</a></dd></div>`).join("\n")}
    </dl></section>`).join("\n")}
  </div>
</main>
<script src="toc.js"></script>
<script src="book.js"></script>
<script>
  Book.page("Glossar");
  const q = document.getElementById("q");
  q.addEventListener("input", () => {
    const v = q.value.trim().toLowerCase();
    document.querySelectorAll(".entry").forEach((e) => (e.hidden = v && !e.dataset.t.includes(v)));
    document.querySelectorAll(".gl section").forEach((s) => (s.hidden = !s.querySelector(".entry:not([hidden])")));
  });
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(BOOK, "glossar.html"), html, "utf8");
console.log("Glossar:", sorted.length, "Begriffe aus", chapters.filter((c) => fs.existsSync(path.join(BOOK, file(c)))).length, "Kapiteln");
