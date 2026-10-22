// Erzeugt xref.txt: Gliederung jedes Kapitels + alle Querverweise mit Satz.
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path");
const BOOK = path.join(__dirname, "..");
const files = fs.readdirSync(BOOK).filter((f) => /^kap\d\d-.*\.html$/.test(f)).sort();
let out = "# GLIEDERUNG\n";
const refs = [];
for (const f of files) {
  const n = +f.slice(3, 5);
  const d = new JSDOM(fs.readFileSync(path.join(BOOK, f), "utf8")).window.document;
  const heads = [...d.querySelectorAll("h1, h2, h4, section.layer")].map((e) =>
    e.matches("section.layer") ? "  [" + (e.classList.contains("deep") ? "V" : "K") + "] " + e.dataset.title : (e.tagName === "H4" ? "    " : "") + e.textContent.trim());
  out += `\n## Kap ${n}: ${heads.join("\n")}\n`;
  const text = d.querySelector("main").textContent.replace(/\s+/g, " ");
  const sents = text.split(/(?<=[.!?])\s+/);
  sents.forEach((s) => { const m = s.match(/Kapitel(n)? \d+/g); if (m) refs.push(`${n} | ${s.slice(0, 260)}`); });
}
out += "\n# VERWEISE (Quelle | Satz)\n" + refs.join("\n") + "\n";
fs.writeFileSync(path.join(__dirname, "xref.txt"), out, "utf8");
console.log(files.length, "Kapitel,", refs.length, "Sätze mit Verweisen,", Math.round(out.length / 1024), "KB");
