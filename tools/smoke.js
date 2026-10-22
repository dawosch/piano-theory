// Headless-Test einer Buchseite: node smoke.js <kapNN-slug.html> [weitere …]
// Lädt die Seite aus C:\dev\piano-theory mit jsdom, ersetzt abcjs-CDN durch lokale Kopie,
// meldet Skriptfehler, abcjs-Warnungen und zählt die Bausteine.
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path"), url = require("url");
const BOOK = path.join(__dirname, "..");
const ABC = url.pathToFileURL(require.resolve("abcjs/dist/abcjs-basic.js")).href;

function run(page) {
  return new Promise((resolve) => {
    let html = fs.readFileSync(path.join(BOOK, page), "utf8")
      .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/abcjs\/[^"]+/g, ABC);
    const errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => errors.push(String(e.detail || e.message || e).slice(0, 300)));
    vc.on("error", (e) => errors.push("console.error: " + String(e).slice(0, 300)));
    let osc = 0;
    const dom = new JSDOM(html, {
      url: url.pathToFileURL(path.join(BOOK, page)).href, runScripts: "dangerously", resources: "usable", virtualConsole: vc,
      beforeParse(w) {
        class N { connect() {} disconnect() {} }
        const P = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, linearRampToValueAtTime() {} });
        w.AudioContext = class {
          constructor() { this.currentTime = 0; this.state = "running"; this.destination = new N(); }
          createGain() { return Object.assign(new N(), { gain: P() }); }
          createDynamicsCompressor() { return Object.assign(new N(), { threshold: P(), ratio: P() }); }
          createBiquadFilter() { return Object.assign(new N(), { frequency: P(), Q: P(), type: "" }); }
          createOscillator() { osc++; return Object.assign(new N(), { frequency: P(), start() {}, stop() {}, type: "" }); }
          createBufferSource() { return Object.assign(new N(), { playbackRate: P(), start() {}, stop() {} }); }
          resume() {}
        };
        w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 });
      }
    });
    setTimeout(() => {
      const d = dom.window.document;
      const r = { page, errors };
      r.counts = {
        layersDeep: d.querySelectorAll("details.layer.deep").length,
        layersPiano: d.querySelectorAll("details.layer.piano").length,
        unconvertedLayers: d.querySelectorAll("section.layer").length,
        keyboards: d.querySelectorAll("svg.kbd").length,
        scores: d.querySelectorAll(".score .paper svg").length,
        trainers: d.querySelectorAll(".trainer").length,
        exercises: d.querySelectorAll(".exercise").length,
        dfn: d.querySelectorAll("dfn").length
      };
      r.abcWarnings = [...d.querySelectorAll("[data-warn]")].map((e) => e.dataset.warn.replace(/<[^>]+>/g, ""));
      const ids = {}; d.querySelectorAll("[id]").forEach((e) => (ids[e.id] = (ids[e.id] || 0) + 1));
      r.duplicateIds = Object.keys(ids).filter((k) => ids[k] > 1);
      // Alle Abspiel-Elemente einmal anklicken
      const before = osc;
      d.querySelectorAll("[data-play],[data-tone]").forEach((e) => e.click());
      d.querySelectorAll(".trainer [data-act=new]").forEach((b) => b.click());
      r.playables = d.querySelectorAll("[data-play],[data-tone]").length;
      r.soundOk = osc > before || r.playables === 0;
      r.title = d.title;
      dom.window.close();
      resolve(r);
    }, 2500);
  });
}
(async () => {
  const pages = process.argv.slice(2);
  for (const p of pages) console.log(JSON.stringify(await run(p), null, 1));
  process.exit(0);
})();
