// Gemeinsame Bausteine des Buchs: Speicher, Notennamen, Klang, Klaviatur, Seitengerüst.
(function () {
  "use strict";

  const Book = (window.Book = {});

  // ---------- Speicher (nur Komfort, darf fehlen) ----------
  const store = (Book.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("kv:" + key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("kv:" + key, JSON.stringify(value)); } catch (e) { /* ignorieren */ }
    }
  });

  // ---------- Notennamen ----------
  const PC_SHARP = ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "ais", "h"];
  const PC_FLAT = ["c", "des", "d", "es", "e", "f", "ges", "g", "as", "a", "b", "h"];
  const PC_EN_SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const PC_EN_FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
  Book.isBlack = (m) => BLACK[((m % 12) + 12) % 12];

  // Deutsche Tonhöhe in Helmholtz-Schreibweise: 60 = c' (eingestrichenes c), 48 = c, 36 = C, 24 = C1.
  Book.name = function (m, opts) {
    opts = opts || {};
    const pc = ((m % 12) + 12) % 12;
    let base = (opts.flat ? PC_FLAT : PC_SHARP)[pc];
    if (opts.octave === false) return opts.capital ? base[0].toUpperCase() + base.slice(1) : base;
    const sci = Math.floor(m / 12) - 1;
    if (sci >= 3) return base + "'".repeat(sci - 3);
    const cap = base[0].toUpperCase() + base.slice(1);
    if (sci === 2) return cap;
    return cap + (2 - sci);
  };
  Book.nameEn = (m, flat) => (flat ? PC_EN_FLAT : PC_EN_SHARP)[((m % 12) + 12) % 12];
  Book.sci = (m, flat) => Book.nameEn(m, flat) + (Math.floor(m / 12) - 1);
  Book.freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- Klang ----------
  // Klavierähnlicher Synthesizer: wenige Teiltöne mit leichter Inharmonizität,
  // tonhöhenabhängiges Abklingen und ein Tiefpass, der sich mit der Zeit schließt.
  const audio = (Book.audio = {
    ctx: null, out: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 3;
        this.out = this.ctx.createGain();
        this.out.gain.value = 0.55;
        this.out.connect(comp); comp.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    now() { const c = this.ensure(); return c ? c.currentTime : 0; },
    // Einen Ton spielen. when: Sekunden ab jetzt, dur: gehaltene Dauer in Sekunden.
    note(m, when, dur, vel) {
      const ctx = this.ensure(); if (!ctx) return;
      if (Book.sampler && Book.sampler.ready) return Book.sampler.note(m, when, dur, vel);
      const t0 = ctx.currentTime + (when || 0) + 0.01;
      const d = dur == null ? 1.2 : dur;
      const v = (vel == null ? 0.8 : vel) * 0.32;
      const f0 = Book.freq(m);
      const decay = Math.max(0.6, 3.2 - (m - 40) * 0.045); // tiefe Töne klingen länger
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(v, t0 + 0.006);
      env.gain.setTargetAtTime(v * 0.35, t0 + 0.006, decay * 0.18);
      const release = t0 + d;
      env.gain.setTargetAtTime(0.0001, release, 0.09);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(Math.min(16000, f0 * 14), t0);
      lp.frequency.setTargetAtTime(Math.min(9000, f0 * 4), t0 + 0.02, decay * 0.3);
      lp.Q.value = 0.4;
      lp.connect(env); env.connect(this.out);
      const partials = [1, 0.55, 0.32, 0.22, 0.12, 0.08, 0.05];
      const B = 0.00035; // Inharmonizität der Saite
      partials.forEach((amp, i) => {
        const k = i + 1;
        const f = f0 * k * Math.sqrt(1 + B * k * k);
        if (f > 18000) return;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = amp;
        // höhere Teiltöne klingen schneller ab
        g.gain.setTargetAtTime(amp * 0.2, t0, decay * 0.25 / k);
        o.connect(g); g.connect(lp);
        o.start(t0); o.stop(release + 0.6);
      });
    },
    chord(ms, when, dur, vel) { ms.forEach((m) => this.note(m, when, dur, vel)); },
    // Gehaltener Ton mit exakter Frequenz (für Stimmungs- und Obertonbeispiele).
    // partials: Zahl der Teiltöne (1 = reiner Sinus).
    tone(freqs, when, dur, partials) {
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime + (when || 0) + 0.01;
      const d = dur || 3;
      const P = partials || 1;
      freqs.forEach((f) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.06);
        g.gain.setTargetAtTime(0.0001, t0 + d, 0.12);
        g.connect(this.out);
        for (let k = 1; k <= P; k++) {
          if (f * k > 16000) break;
          const o = ctx.createOscillator();
          o.frequency.value = f * k;
          const pg = ctx.createGain();
          pg.gain.value = 1 / k;
          o.connect(pg); pg.connect(g);
          o.start(t0); o.stop(t0 + d + 0.8);
        }
      });
    },
    // Töne nacheinander: [[midi|[midi…], dauerInSchlägen], …], bpm
    seq(steps, bpm, onStep) {
      const beat = 60 / (bpm || 90);
      let t = 0;
      const timers = [];
      steps.forEach((s, i) => {
        const ms = Array.isArray(s[0]) ? s[0] : [s[0]];
        const d = (s[1] || 1) * beat;
        if (ms[0] != null) this.chord(ms, t, d * 0.95);
        if (onStep) timers.push(setTimeout(() => onStep(i, ms), t * 1000));
        t += d;
      });
      if (onStep) timers.push(setTimeout(() => onStep(-1, []), t * 1000));
      return t;
    }
  });

  // ---------- Klaviersamples ----------
  // piano-samples.js (jeder dritte Ton als MP3) wird nach dem Laden der Seite nachgeladen.
  // Bis die Samples bereit sind, spielt der Synthesizer.
  const BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  const sampler = (Book.sampler = {
    ready: false, loading: false, buffers: {}, keys: [],
    load() {
      if (this.loading) return;
      this.loading = true;
      const s = document.createElement("script");
      s.src = BASE + "piano-samples.js";
      s.onload = () => this.decode();
      document.head.appendChild(s);
    },
    async decode() {
      const data = window.PIANO_SAMPLES;
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!data || !OAC) return;
      const dc = new OAC(1, 1, 44100);
      await Promise.all(Object.keys(data).map(async (k) => {
        try {
          const bin = atob(data[k]);
          const u = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          this.buffers[k] = await dc.decodeAudioData(u.buffer);
        } catch (e) { /* einzelner Ton fehlt: Nachbarton übernimmt */ }
      }));
      window.PIANO_SAMPLES = null;
      this.keys = Object.keys(this.buffers).map(Number).sort((a, b) => a - b);
      this.ready = this.keys.length > 0;
    },
    note(m, when, dur, vel) {
      const ctx = audio.ctx;
      let k = this.keys[0];
      this.keys.forEach((x) => { if (Math.abs(x - m) < Math.abs(k - m)) k = x; });
      const src = ctx.createBufferSource();
      src.buffer = this.buffers[k];
      src.playbackRate.value = Math.pow(2, (m - k) / 12);
      const g = ctx.createGain();
      const t0 = ctx.currentTime + (when || 0) + 0.01;
      const d = dur == null ? 1.2 : dur;
      g.gain.setValueAtTime((vel == null ? 0.8 : vel) * 0.9, t0);
      g.gain.setTargetAtTime(0.0001, t0 + d, 0.12);
      src.connect(g); g.connect(audio.out);
      src.start(t0); src.stop(t0 + d + 1.2);
    }
  });
  window.addEventListener("load", () => setTimeout(() => sampler.load(), 400));

  // ---------- Klaviatur ----------
  // Book.keyboard(container, { from: 48, to: 72, marks: [{m: 60, cls: "c2", label: "1"}], labels: "c"|"white"|"all"|"none", flat, onKey, brackets: [{from, to, label}] })
  const WW = 24, WH = 120, BW = 14, BH = 76;
  const BLACK_SHIFT = { 1: -2, 3: 2, 6: -3, 8: 0, 10: 3 };
  Book.keyboard = function (container, opts) {
    opts = Object.assign({ from: 48, to: 72, labels: "c", marks: [] }, opts || {});
    let from = opts.from, to = opts.to;
    if (Book.isBlack(from)) from--;
    if (Book.isBlack(to)) to++;
    const whites = [];
    for (let m = from; m <= to; m++) if (!Book.isBlack(m)) whites.push(m);
    const hasBrackets = opts.brackets && opts.brackets.length;
    const top = hasBrackets ? 26 : 2;
    const width = whites.length * WW + 2;
    const height = WH + top + 2;
    const xOf = {};
    whites.forEach((m, i) => (xOf[m] = 1 + i * WW));
    const markMap = {};
    (opts.marks || []).forEach((mk) => { const o = typeof mk === "number" ? { m: mk } : mk; markMap[o.m] = o; });

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "kbd");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", width * (opts.scale || 1));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", opts.ariaLabel || "Klaviatur von " + Book.name(from) + " bis " + Book.name(to));
    const keys = {};

    function labelFor(m) {
      const mk = markMap[m];
      if (mk && mk.label != null) return mk.label;
      const L = opts.labels;
      if (L === "none") return "";
      if (typeof L === "function") return L(m) || "";
      if (L === "all") return Book.name(m, { octave: false, flat: opts.flat, capital: true });
      if (L === "white") return Book.isBlack(m) ? "" : Book.name(m, { octave: false, capital: true });
      if (L === "c") return m % 12 === 0 ? Book.name(m) : "";
      if (L === "octave") return Book.isBlack(m) ? "" : Book.name(m);
      return "";
    }
    function makeKey(m, black) {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "key" + (markMap[m] ? " on" + (markMap[m].cls ? " " + markMap[m].cls : "") : ""));
      g.dataset.m = m;
      const r = document.createElementNS(NS, "rect");
      let x;
      if (black) {
        const prevWhite = m - 1;
        x = xOf[prevWhite] + WW - BW / 2 + (BLACK_SHIFT[m % 12] || 0);
        r.setAttribute("x", x); r.setAttribute("y", top); r.setAttribute("width", BW); r.setAttribute("height", BH);
        r.setAttribute("rx", 2); r.setAttribute("class", "b");
      } else {
        x = xOf[m];
        r.setAttribute("x", x); r.setAttribute("y", top); r.setAttribute("width", WW); r.setAttribute("height", WH);
        r.setAttribute("rx", 3); r.setAttribute("class", "w");
      }
      g.appendChild(r);
      const lab = labelFor(m);
      if (lab) {
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", x + (black ? BW : WW) / 2);
        t.setAttribute("y", top + (black ? BH - 8 : WH - 9));
        if (String(lab).length > 3 || black) t.setAttribute("class", "small");
        t.textContent = lab;
        g.appendChild(t);
      }
      const title = document.createElementNS(NS, "title");
      title.textContent = Book.name(m, { flat: opts.flat }) + " (" + Book.sci(m, opts.flat) + ")";
      g.appendChild(title);
      keys[m] = g;
      return g;
    }
    whites.forEach((m) => svg.appendChild(makeKey(m, false)));
    for (let m = from; m <= to; m++) if (Book.isBlack(m) && xOf[m - 1] != null) svg.appendChild(makeKey(m, true));

    if (hasBrackets) {
      opts.brackets.forEach((b) => {
        const cx = (m) => (Book.isBlack(m) ? xOf[m - 1] + WW + (BLACK_SHIFT[m % 12] || 0) : xOf[m] + WW / 2);
        const x1 = cx(b.from), x2 = cx(b.to);
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", `M${x1} ${top - 3} V${top - 9} H${x2} V${top - 3}`);
        p.setAttribute("class", "bracket");
        svg.appendChild(p);
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", (x1 + x2) / 2); t.setAttribute("y", top - 13);
        t.setAttribute("class", "bracket-label");
        t.textContent = b.label;
        svg.appendChild(t);
      });
    }

    function press(m) {
      const k = keys[m]; if (!k) return;
      k.classList.add("down");
      setTimeout(() => k.classList.remove("down"), 220);
    }
    svg.addEventListener("pointerdown", (e) => {
      const g = e.target.closest(".key"); if (!g) return;
      const m = +g.dataset.m;
      if (opts.silent !== true) audio.note(m, 0, 0.9);
      press(m);
      if (opts.onKey) opts.onKey(m);
    });

    const api = {
      svg, keys,
      mark(list, cls) {
        Object.values(keys).forEach((k) => k.classList.remove("on", "c2", "c3"));
        (list || []).forEach((mk) => {
          const o = typeof mk === "number" ? { m: mk, cls } : mk;
          const k = keys[o.m]; if (!k) return;
          k.classList.add("on"); if (o.cls) k.classList.add(o.cls);
        });
      },
      flash(m) { press(m); }
    };
    if (container) {
      const wrap = document.createElement("div");
      wrap.className = "figure-scroll";
      wrap.appendChild(svg);
      container.appendChild(wrap);
    }
    return api;
  };

  // ---------- Intervalle richtig schreiben ----------
  // Ton über einem Stammton, korrekt benannt: spellUp(60, 3, 3) → "es'" (kleine Terz über c').
  const LETTERS = ["c", "d", "e", "f", "g", "a", "h"];
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  function accName(letter, acc) {
    if (acc === 0) return letter;
    if (acc > 0) return letter + "is".repeat(acc);
    if (letter === "h") return acc === -1 ? "b" : "heses";
    if (letter === "e" || letter === "a") return letter + "s" + "es".repeat(-acc - 1);
    return letter + "es".repeat(-acc);
  }
  function octMarks(name, natMidi) {
    const sci = Math.floor(natMidi / 12) - 1;
    if (sci >= 3) return name + "'".repeat(sci - 3);
    const cap = name[0].toUpperCase() + name.slice(1);
    return sci === 2 ? cap : cap + (2 - sci);
  }
  Book.spellUp = function (root, number, semis) {
    const li = NAT.indexOf(((root % 12) + 12) % 12);
    if (li < 0) return Book.name(root + semis);
    const base = root - NAT[li];
    const t = li + number - 1;
    const nat = base + 12 * Math.floor(t / 7) + NAT[t % 7];
    return octMarks(accName(LETTERS[t % 7], root + semis - nat), nat);
  };

  // ---------- Klick-zum-Hören ----------
  // data-play="60 64" (+ data-mode="mel|harm|both", data-bpm) auf beliebigen Elementen,
  // data-tone="261.63 327.03" (+ data-partials, data-dur) für exakte Frequenzen.
  Book.playSpec = function (spec, mode, bpm) {
    const ms = String(spec).trim().split(/[\s,]+/).map(Number);
    const beat = 60 / (bpm || 100);
    if (mode === "harm") return audio.chord(ms, 0, 1.6);
    ms.forEach((m, i) => audio.note(m, i * beat, beat * 0.95));
    if (mode === "both") audio.chord(ms, ms.length * beat + 0.15, 1.6);
  };
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-play],[data-tone]");
    if (!el || e.target.closest(".kbd")) return;
    if (el.dataset.tone) {
      audio.tone(el.dataset.tone.split(/\s+/).map(Number), 0, +(el.dataset.dur || 3), +(el.dataset.partials || 1));
    } else {
      Book.playSpec(el.dataset.play, el.dataset.mode || "mel", +el.dataset.bpm || 100);
    }
  });

  // ---------- Klaviaturen und Noten aus dem Kapiteltext ----------
  // <div class="kb" data-from="60" data-to="72" data-marks="60 64:c2" data-labels="white" data-brackets="60-64:4 HT"></div>
  Book.autoKeyboards = function (root) {
    (root || document).querySelectorAll("div.kb").forEach((el) => {
      const marks = (el.dataset.marks || "").trim().split(/\s+/).filter(Boolean).map((t) => {
        const [m, cls, label] = t.split(":");
        return { m: +m, cls: cls || "", label: label };
      });
      const brackets = (el.dataset.brackets || "").split(";").filter((s) => s.trim()).map((s) => {
        const [range, label] = s.split(":");
        const [a, b] = range.trim().split("-").map(Number);
        return { from: a, to: b, label: (label || "").trim() };
      });
      Book.keyboard(el, {
        from: +(el.dataset.from || 60), to: +(el.dataset.to || 72),
        labels: el.dataset.labels || "c", marks, brackets,
        flat: el.hasAttribute("data-flat"), ariaLabel: el.getAttribute("aria-label") || undefined
      });
    });
  };

  // <div class="abc" data-bpm="80" data-caption="…">X:1 …</div>
  Book.score = function (el, abc, opts) {
    opts = opts || {};
    el.classList.add("score");
    el.textContent = "";
    const paper = document.createElement("div");
    paper.className = "paper";
    const tools = document.createElement("div");
    tools.className = "tools";
    tools.innerHTML = `<button class="btn" type="button">${ICON.play}<span>Abspielen</span></button>` +
      (opts.caption ? `<span class="cap">${opts.caption}</span>` : "");
    el.append(paper, tools);
    if (!window.ABCJS) {
      paper.innerHTML = '<p class="muted">Die Notenschrift braucht eine Internetverbindung und konnte nicht geladen werden.</p>';
      tools.hidden = true;
      return null;
    }
    const vo = window.ABCJS.renderAbc(paper, abc, {
      responsive: "resize", add_classes: true, foregroundColor: "currentColor",
      staffwidth: opts.width || 520, paddingleft: 0, paddingright: 0, paddingtop: 4, paddingbottom: 4,
      clickListener: (abcElem) => { (abcElem.midiPitches || []).forEach((p) => audio.note(p.pitch, 0, 0.8)); }
    })[0];
    if (vo.warnings && vo.warnings.length) el.dataset.warn = vo.warnings.join(" | ");
    try { vo.setUpAudio(); } catch (e) { /* nur für Klick-Abspielen nötig */ }
    const btn = tools.querySelector("button");
    let timer = null;
    const clear = () => paper.querySelectorAll(".playing").forEach((n) => n.classList.remove("playing"));
    const stop = () => { if (timer) timer.stop(); timer = null; clear(); btn.querySelector("span").textContent = "Abspielen"; };
    btn.addEventListener("click", () => {
      if (timer) return stop();
      audio.ensure();
      btn.querySelector("span").textContent = "Stopp";
      const bpm = opts.bpm || 80;
      // midiPitches[].duration ist in ganzen Noten angegeben, bpm zählt Schläge der Länge getBeatLength().
      const beatLen = (vo.getBeatLength && vo.getBeatLength()) || 0.25;
      const wholeSec = 60 / bpm / beatLen;
      timer = new window.ABCJS.TimingCallbacks(vo, {
        qpm: bpm,
        eventCallback(ev) {
          clear();
          if (!ev) { stop(); return; }
          (ev.elements || []).flat().forEach((n) => n && n.classList && n.classList.add("playing"));
          (ev.midiPitches || []).forEach((p) => {
            let d = p.duration ? p.duration * wholeSec : 0.6;
            if (p.endType === "staccato") d *= 0.4; // Staccato aus dem Notenbild verkürzen
            audio.note(p.pitch, 0, Math.max(0.15, d * 0.95), p.volume ? Math.min(1, p.volume / 105) : 0.8);
          });
        }
      });
      timer.start();
    });
    return vo;
  };
  Book.autoScores = function (root) {
    (root || document).querySelectorAll("div.abc").forEach((el) => {
      const abc = el.textContent.replace(/^\s+/gm, "");
      Book.score(el, abc, { bpm: +el.dataset.bpm || 80, caption: el.dataset.caption, width: +el.dataset.width || undefined });
    });
  };

  // ---------- Gehörtrainer ----------
  // cfg: { title, intro, items: [{id, label}], presets: [{label, ids}], modes: [{id, label}],
  //        build(item, mode) → { play(), marks: [midi…], answer: "Text" }, from, to }
  Book.earTrainer = function (el, cfg) {
    el.classList.add("trainer");
    const uid = "t" + Math.random().toString(36).slice(2, 7);
    const presetHtml = cfg.presets.map((p, i) =>
      `<label><input type="radio" name="${uid}-p" id="${uid}-p${i}" value="${i}"${i === 0 ? " checked" : ""}> ${p.label}</label>`).join("");
    const modeHtml = (cfg.modes || []).map((m, i) =>
      `<label><input type="radio" name="${uid}-m" id="${uid}-m${i}" value="${m.id}"${i === 0 ? " checked" : ""}> ${m.label}</label>`).join("");
    el.innerHTML = `<h4>${cfg.title}</h4>${cfg.intro ? `<p>${cfg.intro}</p>` : ""}
      <div class="settings"><span>Auswahl:</span>${presetHtml}</div>
      ${modeHtml ? `<div class="settings"><span>Spielweise:</span>${modeHtml}</div>` : ""}
      <div class="btn-row"><button class="btn primary" type="button" data-act="new">${ICON.play}<span>Neue Aufgabe</span></button>
      <button class="btn" type="button" data-act="again" disabled>Nochmal hören</button></div>
      <div class="opts" role="group" aria-label="Antworten"></div>
      <p class="feedback" aria-live="polite"></p>
      <div class="tkbd" hidden></div>
      <p class="score-line"></p>`;
    const optsEl = el.querySelector(".opts"), fb = el.querySelector(".feedback");
    const kbdEl = el.querySelector(".tkbd"), scoreEl = el.querySelector(".score-line");
    const again = el.querySelector('[data-act="again"]');
    // cfg.noKeyboard: Trainer ohne Antwort-Klaviatur (z. B. für Rhythmus)
    const kb = cfg.noKeyboard ? { mark() {} } : Book.keyboard(kbdEl, { from: cfg.from || 48, to: cfg.to || 84, labels: "c" });
    let cur = null, lastId = null, tried = false, right = 0, total = 0;
    const preset = () => cfg.presets[+el.querySelector(`input[name="${uid}-p"]:checked`).value];
    const mode = () => { const r = el.querySelector(`input[name="${uid}-m"]:checked`); return r ? r.value : null; };
    function drawOpts() {
      const ids = preset().ids;
      optsEl.innerHTML = cfg.items.filter((it) => ids.includes(it.id))
        .map((it) => `<button class="btn" type="button" data-id="${it.id}"${cur ? "" : " disabled"}>${it.label}</button>`).join("");
    }
    function ask() {
      const pool = cfg.items.filter((it) => preset().ids.includes(it.id));
      let item;
      do { item = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && item.id === lastId);
      lastId = item.id;
      let md = mode();
      if (md === "mix") { const ms = cfg.modes.filter((m) => m.id !== "mix"); md = ms[Math.floor(Math.random() * ms.length)].id; }
      cur = Object.assign({ item }, cfg.build(item, md));
      tried = false;
      fb.textContent = "Was hörst du?";
      kbdEl.hidden = true;
      again.disabled = false;
      drawOpts();
      cur.play();
    }
    el.addEventListener("change", () => { cur = null; again.disabled = true; fb.textContent = ""; kbdEl.hidden = true; drawOpts(); });
    el.querySelector('[data-act="new"]').addEventListener("click", ask);
    again.addEventListener("click", () => cur && cur.play());
    optsEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-id]"); if (!b || !cur) return;
      const ok = b.dataset.id === cur.item.id;
      if (!tried) { total++; if (ok) right++; tried = true; }
      if (ok) {
        b.classList.add("right");
        fb.textContent = "Richtig: " + cur.answer;
        kb.mark(cur.marks); kbdEl.hidden = !!cfg.noKeyboard;
        optsEl.querySelectorAll("button").forEach((x) => (x.disabled = true));
      } else {
        b.classList.add("wrong"); b.disabled = true;
        fb.textContent = "Nicht ganz. Hör noch einmal hin.";
      }
      scoreEl.textContent = `${right} von ${total} beim ersten Versuch richtig`;
    });
    drawOpts();
  };

  // Intervalle für Trainer und Tabellen
  Book.INTERVALS = [
    { id: "k2", label: "kleine Sekunde", n: 2, s: 1 }, { id: "g2", label: "große Sekunde", n: 2, s: 2 },
    { id: "k3", label: "kleine Terz", n: 3, s: 3 }, { id: "g3", label: "große Terz", n: 3, s: 4 },
    { id: "r4", label: "reine Quarte", n: 4, s: 5 }, { id: "tt", label: "Tritonus", n: 4, s: 6 },
    { id: "r5", label: "reine Quinte", n: 5, s: 7 }, { id: "k6", label: "kleine Sexte", n: 6, s: 8 },
    { id: "g6", label: "große Sexte", n: 6, s: 9 }, { id: "k7", label: "kleine Septime", n: 7, s: 10 },
    { id: "g7", label: "große Septime", n: 7, s: 11 }, { id: "r8", label: "Oktave", n: 8, s: 12 }
  ];
  Book.intervalTrainer = function (el) {
    const WHITE = [55, 57, 59, 60, 62, 64, 65, 67];
    Book.earTrainer(el, {
      title: "Gehörtrainer: Intervalle",
      intro: "Wähle aus, welche Intervalle vorkommen sollen. Der Grundton wechselt bei jeder Aufgabe.",
      items: Book.INTERVALS,
      presets: [
        { label: "Einstieg", ids: ["g2", "g3", "r5", "r8"] },
        { label: "Terzen und Sexten", ids: ["k3", "g3", "k6", "g6"] },
        { label: "Sekunden und Septimen", ids: ["k2", "g2", "k7", "g7"] },
        { label: "Alle", ids: Book.INTERVALS.map((i) => i.id) }
      ],
      modes: [{ id: "up", label: "aufwärts" }, { id: "down", label: "abwärts" }, { id: "harm", label: "zusammen" }, { id: "mix", label: "gemischt" }],
      from: 53, to: 81,
      build(it, md) {
        const lo = WHITE[Math.floor(Math.random() * WHITE.length)];
        const hi = lo + it.s;
        const a = Book.name(lo), b = it.id === "tt" ? Book.spellUp(lo, 4, 6) : Book.spellUp(lo, it.n, it.s);
        const play = md === "harm" ? () => audio.chord([lo, hi], 0, 1.8)
          : md === "down" ? () => { audio.note(hi, 0, 0.7); audio.note(lo, 0.7, 1); }
          : () => { audio.note(lo, 0, 0.7); audio.note(hi, 0.7, 1); };
        return { play, marks: [lo, { m: hi, cls: "c2" }], answer: `${it.label} (${a}–${b}, ${it.s} Halbtöne)` };
      }
    });
  };

  // ---------- Fortschritt ----------
  Book.done = () => new Set(store.get("done", []));
  Book.setDone = (n, on) => {
    const s = Book.done();
    on ? s.add(n) : s.delete(n);
    store.set("done", Array.from(s).sort((a, b) => a - b));
  };
  Book.allChapters = () => window.BOOK.parts.flatMap((p) => p.chapters.map((c) => Object.assign({ part: p.id }, c)));
  Book.file = (c) => "kap" + String(c.n).padStart(2, "0") + "-" + c.slug + ".html";

  // ---------- Inhaltsverzeichnis ----------
  Book.renderToc = function (el) {
    const done = Book.done();
    const all = Book.allChapters();
    const frag = document.createDocumentFragment();
    window.BOOK.parts.forEach((p) => {
      const sec = document.createElement("section");
      sec.className = "part";
      const read = p.chapters.filter((c) => done.has(c.n)).length;
      sec.innerHTML =
        `<header class="part-head"><span class="roman">${p.id}</span><div><h3>${p.title}</h3><p>${p.blurb}</p></div>` +
        `<span class="part-count" title="gelesen">${read}/${p.chapters.length}</span></header>`;
      const ol = document.createElement("ol");
      ol.className = "chapters";
      p.chapters.forEach((c) => {
        const li = document.createElement("li");
        li.className = "ch" + (c.ready ? " ready" : "") + (done.has(c.n) ? " is-done" : "");
        const title = c.ready ? `<a href="${Book.file(c)}">${c.title}</a>` : `<span>${c.title}</span>`;
        const chips = [];
        if (c.trainer) chips.push('<span class="chip">Gehörtrainer</span>');
        if (!c.ready) chips.push('<span class="chip soon">in Arbeit</span>');
        if (done.has(c.n)) chips.push('<span class="chip ok">gelesen</span>');
        li.innerHTML = `<span class="n">${c.n}</span><div class="txt"><div class="t">${title}${chips.join("")}</div><p>${c.desc}</p></div>`;
        ol.appendChild(li);
      });
      sec.appendChild(ol);
      frag.appendChild(sec);
    });
    const app = document.createElement("section");
    app.className = "part";
    app.innerHTML = `<header class="part-head"><span class="roman">A</span><div><h3>Anhang</h3><p>Nachschlagen statt lesen.</p></div></header>`;
    const ol = document.createElement("ol");
    ol.className = "chapters";
    window.BOOK.appendix.forEach((a) => {
      const li = document.createElement("li");
      li.className = "ch" + (a.ready ? " ready" : "");
      li.innerHTML = `<span class="n">·</span><div class="txt"><div class="t">${a.ready ? `<a href="${a.slug}.html">${a.title}</a>` : `<span>${a.title}</span><span class="chip soon">in Arbeit</span>`}</div><p>${a.desc}</p></div>`;
      ol.appendChild(li);
    });
    app.appendChild(ol);
    frag.appendChild(app);
    el.replaceChildren(frag);

    const total = all.length;
    const n = all.filter((c) => done.has(c.n)).length;
    const prog = document.getElementById("progress");
    if (prog) {
      prog.querySelector(".bar span").style.width = (100 * n / total) + "%";
      prog.querySelector(".lbl").textContent = n === 0
        ? `${total} Kapitel in sieben Teilen`
        : `${n} von ${total} Kapiteln gelesen`;
    }
    const last = store.get("last", null);
    const cont = document.getElementById("continue");
    if (cont && last && last.file) {
      cont.hidden = false;
      cont.querySelector("a").href = last.file + (last.at ? "#weiter" : "");
      cont.querySelector(".t").textContent = last.n + " · " + last.title;
    }
  };

  // ---------- Ebenen-Boxen ----------
  const ICON = {
    deep: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/><path d="M10.5 7.5v6M7.5 10.5h6"/></svg>',
    piano: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="16" rx="1.5"/><path d="M8.8 4v16M15.2 4v16"/><rect x="6.8" y="4" width="4" height="9" fill="currentColor"/><rect x="13.2" y="4" width="4" height="9" fill="currentColor"/></svg>',
    chev: '<svg class="icon chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>'
  };
  Book.ICON = ICON;
  const TAG = { deep: "Tiefer verstehen", piano: "Am Klavier" };

  // <section class="layer deep" data-title="…"> … </section>  →  einklappbares <details>
  Book.enhanceLayers = function (root) {
    (root || document).querySelectorAll("section.layer").forEach((sec) => {
      const kind = sec.classList.contains("deep") ? "deep" : "piano";
      const d = document.createElement("details");
      d.className = sec.className;
      if (sec.id) d.id = sec.id;
      d.open = !sec.hasAttribute("data-closed");
      const s = document.createElement("summary");
      s.innerHTML = `${ICON[kind]}<span class="tag">${TAG[kind]}</span><span class="ttl">${sec.dataset.title || ""}</span>${ICON.chev}`;
      const body = document.createElement("div");
      body.className = "body";
      while (sec.firstChild) body.appendChild(sec.firstChild);
      d.append(s, body);
      sec.replaceWith(d);
    });
  };

  // ---------- Begriffs-Tooltips ----------
  // Jeder Link auf eine Begriffsstelle (href="…#g-slug") zeigt beim Zeigen oder Fokussieren die Definition aus glossar-data.js.
  // Auf Touch-Geräten öffnet der erste Tipp den Tooltip, der zweite folgt dem Link.
  // <dfn class="tip"> markiert Begriffe, die das Buch nur benutzt und nicht erklärt; sie zeigen ihre Kurzdefinition selbst.
  // Ob der Tooltip schon offen war, wird beim pointerdown festgehalten: Ein Tipp löst vor dem click noch mouseenter und focus aus,
  // die den Tooltip bereits öffnen – beim click selbst ließe sich der erste Tipp also nicht mehr vom zweiten unterscheiden.
  let glossLoad = null, tip = null, tipFor = null, tap = null;
  function loadGlossar() {
    if (window.GLOSSAR) return Promise.resolve();
    return glossLoad || (glossLoad = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "glossar-data.js";
      s.onload = s.onerror = () => resolve();
      document.head.appendChild(s);
    }));
  }
  function hideTip() {
    if (!tipFor) return;
    tipFor.removeAttribute("aria-describedby");
    tip.hidden = true; tipFor = null;
  }
  function showTip(a, e) {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "gloss-tip"; tip.id = "gloss-tip"; tip.setAttribute("role", "tooltip");
      tip.append(document.createElement("strong"), document.createElement("span"), document.createElement("span"));
      tip.lastChild.className = "src";
      document.body.appendChild(tip);
    }
    hideTip();
    const here = e.h.split("#")[0] === location.pathname.split("/").pop();
    tip.children[0].textContent = e.t;
    tip.children[1].textContent = e.d;
    tip.children[2].textContent = a.tagName === "DFN" ? "" : here ? "Erklärt in diesem Kapitel" : `Erklärt in Kapitel ${e.n}`;
    tip.children[2].hidden = a.tagName === "DFN";
    tip.hidden = false; tipFor = a;
    a.setAttribute("aria-describedby", tip.id);
    const r = a.getClientRects()[0] || a.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const left = Math.max(16, Math.min(r.left, document.documentElement.clientWidth - w - 16));
    const below = r.bottom + 8 + h <= window.innerHeight || r.top - 8 - h < 0;
    tip.style.left = left + window.scrollX + "px";
    tip.style.top = (below ? r.bottom + 8 : r.top - 8 - h) + window.scrollY + "px";
  }
  Book.glossLinks = function (root) {
    const links = [...(root || document).querySelectorAll('main a[href*="#g-"], main dfn.tip[id]')].filter((a) => !a.closest("div.gl"));
    if (!links.length) return;
    loadGlossar().then(() => links.forEach((a) => {
      const e = window.GLOSSAR && window.GLOSSAR[a.tagName === "DFN" ? a.id : a.hash.slice(1)];
      if (!e) return;
      if (a.tagName === "DFN") a.tabIndex = 0;
      else a.classList.add("term-link");
      a.addEventListener("pointerdown", (ev) => { tap = ev.pointerType === "mouse" ? null : { a, open: tipFor === a }; });
      a.addEventListener("pointercancel", () => { tap = null; });
      a.addEventListener("mouseenter", () => showTip(a, e));
      a.addEventListener("mouseleave", hideTip);
      a.addEventListener("focus", () => showTip(a, e));
      a.addEventListener("blur", hideTip);
      a.addEventListener("click", (ev) => {
        const t = tap; tap = null;
        if (t && t.a === a && !t.open) { ev.preventDefault(); showTip(a, e); }
      });
    }));
    if (!Book.glossLinks.wired) {
      Book.glossLinks.wired = true;
      document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") hideTip(); });
      document.addEventListener("pointerdown", (ev) => { if (tipFor && !tipFor.contains(ev.target)) hideTip(); });
    }
  };

  // ---------- Hell/Dunkel ----------
  // Ohne gespeicherte Wahl folgt die Seite dem System; das Inline-Skript im <head> setzt eine gespeicherte Wahl schon vor dem ersten Zeichnen.
  const MOON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  const darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const isDark = () => {
    const t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : !!(darkQuery && darkQuery.matches);
  };
  Book.themeToggle = function () {
    const btn = document.createElement("button");
    btn.className = "toggle theme-toggle";
    btn.type = "button";
    btn.innerHTML = `${MOON}<span>Dunkel</span>`;
    const paint = () => {
      const on = isDark();
      btn.setAttribute("aria-pressed", String(on));
      btn.querySelector("span").textContent = on ? "Dunkel an" : "Dunkel aus";
    };
    btn.addEventListener("click", () => {
      const t = isDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", t);
      store.set("theme", t); paint();
    });
    if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener("change", paint);
    paint();
    return btn;
  };

  // ---------- Anhangseite ----------
  Book.page = function (title) {
    document.title = title + " · " + window.BOOK.title;
    const bar = document.createElement("div");
    bar.className = "topbar";
    bar.innerHTML = `<div class="wrap inner"><a class="home" href="index.html">${window.BOOK.title}</a><span class="where">Anhang · ${title}</span></div>`;
    bar.querySelector(".inner").append(Book.themeToggle());
    document.body.prepend(bar);
    Book.enhanceLayers();
    Book.autoKeyboards();
    Book.autoScores();
    Book.glossLinks();
  };

  // ---------- Kapitelseite ----------
  Book.chapter = function (n) {
    const all = Book.allChapters();
    const i = all.findIndex((c) => c.n === n);
    const c = all[i];
    document.title = c.title + " · " + window.BOOK.title;
    // Eine gemerkte Stelle in diesem Kapitel bleibt erhalten, bis wieder gescrollt wird.
    const prevLast = store.get("last", null);
    const saveLast = (pos) => store.set("last", Object.assign({ n: c.n, title: c.title, file: Book.file(c) }, pos));
    saveLast(prevLast && prevLast.n === n ? { at: prevLast.at, frac: prevLast.frac } : {});

    // Kopfleiste
    const bar = document.createElement("div");
    bar.className = "topbar";
    bar.innerHTML = `<div class="wrap inner"><a class="home" href="index.html">${window.BOOK.title}</a>` +
      `<span class="where">Teil ${c.part} · Kapitel ${c.n}</span>` +
      `<button class="toggle" type="button" id="deep-toggle" aria-pressed="true">${ICON.deep}<span>Vertiefungen</span></button></div>`;
    bar.querySelector(".inner").append(Book.themeToggle());
    document.body.prepend(bar);
    const tog = bar.querySelector("#deep-toggle");
    function applyDeep(show) {
      document.body.classList.toggle("hide-deep", !show);
      tog.setAttribute("aria-pressed", String(show));
      tog.querySelector("span").textContent = show ? "Vertiefungen an" : "Vertiefungen aus";
    }
    applyDeep(store.get("showDeep", true));
    tog.addEventListener("click", () => {
      const show = tog.getAttribute("aria-pressed") !== "true";
      store.set("showDeep", show); applyDeep(show);
    });

    // Voraussetzungen
    const pre = document.getElementById("prereq");
    if (pre) {
      if (!c.prereq.length) pre.innerHTML = "<span>Keine Voraussetzungen</span>";
      else {
        pre.innerHTML = "<span>Setzt voraus:</span>" + c.prereq.map((p) => {
          const pc = all.find((x) => x.n === p);
          return pc.ready ? `<a href="${Book.file(pc)}">${p} ${pc.title}</a>` : `<span class="muted">${p} ${pc.title}</span>`;
        }).join("");
      }
    }

    Book.enhanceLayers();
    Book.autoKeyboards();
    Book.autoScores();
    Book.glossLinks();
    document.querySelectorAll("div.interval-trainer").forEach((el) => Book.intervalTrainer(el));

    // Fuß: gelesen-Haken und Blättern
    const foot = document.getElementById("chapter-foot");
    if (foot) {
      const prev = all[i - 1], next = all[i + 1];
      const link = (x, dir, cls) => !x ? "<span></span>" :
        `<a class="${cls}${x.ready ? "" : " soon"}" href="${x.ready ? Book.file(x) : "#"}"><span class="dir">${dir}${x.ready ? "" : " · in Arbeit"}</span><span class="t">${x.n} ${x.title}</span></a>`;
      foot.innerHTML = `<div class="done"><button class="btn" type="button" id="done-btn"></button></div>` +
        `<nav class="pager">${link(prev, "Zurück", "prev")}${link(next, "Weiter", "next")}</nav>`;
      const btn = foot.querySelector("#done-btn");
      const paint = () => {
        const on = Book.done().has(n);
        btn.textContent = on ? "✓ Als gelesen markiert" : "Kapitel als gelesen markieren";
        btn.classList.toggle("primary", on);
      };
      btn.addEventListener("click", () => { Book.setDone(n, !Book.done().has(n)); paint(); });
      paint();
    }

    // Leseposition: „Weiterlesen“ (…#weiter) springt zur gemerkten Stelle, sonst beginnt das Kapitel oben.
    const resume = location.hash === "#weiter" && prevLast && prevLast.n === n ? prevLast : null;
    let ready = !resume, timer = 0;
    const save = () => { clearTimeout(timer); timer = 0; saveLast(readingPos()); };
    window.addEventListener("scroll", () => { if (ready && !timer) timer = setTimeout(save, 300); }, { passive: true });
    window.addEventListener("pagehide", () => { if (timer) save(); });
    if (resume) {
      const go = () => {
        restorePos(resume);
        history.replaceState(null, "", location.pathname + location.search);
        ready = true;
      };
      document.readyState === "complete" ? go() : window.addEventListener("load", go, { once: true });
    }
  };

  // Die Stelle wird relativ zum Abschnitt gespeichert (id der h2 + Anteil bis zur nächsten h2),
  // damit sie bei anderer Fensterbreite oder Schriftgröße an derselben Textstelle landet.
  const topbarH = () => { const t = document.querySelector(".topbar"); return t ? t.offsetHeight : 0; };
  const sectionHeads = () => [...document.querySelectorAll("main h2[id]")].filter((h) => h.offsetParent !== null);
  function sectionSpan(hs, k) {
    const top = hs[k].getBoundingClientRect().top;
    const end = hs[k + 1] ? hs[k + 1].getBoundingClientRect().top : document.querySelector("main").getBoundingClientRect().bottom;
    return { top, len: Math.max(1, end - top) };
  }
  function readingPos() {
    const edge = topbarH() + 1, hs = sectionHeads();
    let k = -1;
    hs.forEach((h, i) => { if (h.getBoundingClientRect().top <= edge) k = i; });
    if (k < 0) return { at: null, frac: 0 };
    const s = sectionSpan(hs, k);
    return { at: hs[k].id, frac: Math.round(Math.min(1, Math.max(0, (edge - s.top) / s.len)) * 1000) / 1000 };
  }
  function restorePos(pos) {
    const h = pos.at && document.getElementById(pos.at);
    if (!h) return;
    const hs = sectionHeads();
    let k = hs.indexOf(h), frac = pos.frac || 0;
    // Abschnitt ausgeblendet (z. B. Vertiefungen aus): ans Ende des vorherigen sichtbaren Abschnitts.
    if (k < 0) { k = hs.filter((x) => x.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING).length - 1; frac = 1; }
    if (k < 0) return;
    const s = sectionSpan(hs, k);
    window.scrollTo({ top: window.scrollY + s.top + frac * s.len - topbarH(), behavior: "instant" });
  }
})();
