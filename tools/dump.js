const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path"), url = require("url");
const BOOK = path.join(__dirname, "..");
const [page, rootIdx, rows] = process.argv.slice(2);
const dom = new JSDOM(fs.readFileSync(path.join(BOOK, page), "utf8"), { url: url.pathToFileURL(path.join(BOOK, page)).href, runScripts: "dangerously", resources: "usable", virtualConsole: new VirtualConsole(),
  beforeParse(w) { w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 1, height: 1 }); } });
setTimeout(() => {
  const d = dom.window.document;
  if (rootIdx) { const b = d.querySelector(`#roots button[data-i="${rootIdx}"]`); b && b.click(); }
  [...d.querySelectorAll("tbody tr")].slice(0, +rows || 99).forEach((tr) => console.log([...tr.children].map((td) => td.textContent).join(" | ")));
  process.exit(0);
}, 1500);
