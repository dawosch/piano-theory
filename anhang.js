// Gemeinsame Logik der Anhangseiten: korrekte Tonbuchstabierung für beliebige Grundtöne.
(function () {
  "use strict";
  const LET = ["c", "d", "e", "f", "g", "a", "h"];
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  const EN = { c: "C", d: "D", e: "E", f: "F", g: "G", a: "A", h: "B" };

  // Deutscher Name aus Buchstabe + Vorzeichenzahl (−2 … +2)
  function de(letter, acc) {
    if (acc === 0) return letter;
    if (acc > 0) return letter + "is".repeat(acc);
    if (letter === "h") return acc === -1 ? "b" : "heses";
    if (letter === "e" || letter === "a") return letter + "s" + "es".repeat(-acc - 1);
    return letter + "es".repeat(-acc);
  }
  function en(letter, acc) {
    return EN[letter] + (acc > 0 ? (acc === 2 ? "𝄪" : "♯") : acc < 0 ? (acc === -2 ? "𝄫" : "♭") : "");
  }
  function cap(s) { return s[0].toUpperCase() + s.slice(1); }

  // Grundtöne zur Auswahl: [Buchstabenindex, Vorzeichen]
  const ROOTS = [[0, 0], [0, 1], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];

  // Ton im Abstand (Zahl n, Halbtöne s) über dem Grundton
  function above(root, n, s) {
    const [li, acc] = root;
    const rootPc = NAT[li] + acc;
    const t = li + n - 1;
    const natPc = NAT[t % 7] + 12 * Math.floor(t / 7);
    const tacc = rootPc + s - natPc;
    return { letter: LET[t % 7], acc: tacc, midiOffset: s };
  }

  window.Anhang = {
    LET, NAT, ROOTS, de, en, cap, above,
    rootLabel(r) { return cap(de(LET[r[0]], r[1])); },
    rootMidi(r, base) { return (base || 60) + NAT[r[0]] + r[1]; },
    spell(root, steps) { return steps.map(([n, s]) => above(root, n, s)); },
    // Auswahlknöpfe für Grundtöne
    rootPicker(el, onPick, initial) {
      el.innerHTML = ROOTS.map((r, i) => `<button type="button" class="btn${i === (initial || 0) ? " primary" : ""}" data-i="${i}">${this.rootLabel(r)}</button>`).join("");
      el.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-i]"); if (!b) return;
        el.querySelectorAll("button").forEach((x) => x.classList.toggle("primary", x === b));
        onPick(ROOTS[+b.dataset.i]);
      });
    }
  };
})();
