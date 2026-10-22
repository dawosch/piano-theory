# Stilleitfaden „Klavier verstehen“

Referenz ist das freigegebene Probekapitel `C:\dev\piano-theory\kap05-intervalle.html`. Vor dem Schreiben **vollständig lesen** und Aufbau, Ton und Bausteine übernehmen.

## Leser
Erwachsener Klavieranfänger (liest Noten noch langsam), will Theorie *tief* verstehen, inklusive des Warum. Musikrichtung: Mischung mit Schwerpunkt Pop/Begleitung. Das Buch beginnt bei null, setzt aber Erwachsenenverstand und etwas Mathematik voraus.

## Dateien und Regeln für parallele Arbeit
- Jedes Kapitel ist eine Datei `C:\dev\piano-theory\kapNN-slug.html` (NN zweistellig, Slug exakt aus `toc.js`).
- **Nicht bearbeiten:** `toc.js`, `book.js`, `book.css`, `index.html`, Kapitel anderer Teile. Andere Agents arbeiten parallel daran. Wenn du einen Fehler in `book.js` findest oder einen neuen gemeinsamen Baustein brauchst, melde es in deinem Abschlussbericht.
- Kapitelspezifisches CSS kommt in ein `<style>` im `<head>`, kapitelspezifisches JS in ein `<script>` am Ende (nach `Book.chapter(N)`).
- Kopf der Datei exakt wie in Kapitel 5 (Doctype, Fonts, `book.css`). Am Ende: abcjs-CDN-Skript (falls Noten vorkommen; schadet sonst nicht), `toc.js`, `book.js`, dann `Book.chapter(N);`.

## Aufbau eines Kapitels
1. `<header class="chapter-head">` mit `.num` („Teil X · Kapitel N“), `h1` (Titel aus toc.js), `.lede` (2–3 Sätze: worum es geht und warum es dem Leser am Klavier hilft), `<div class="prereq" id="prereq"></div>`.
2. `<div class="goals">` mit „Nach diesem Kapitel kannst du“ und 4–6 Lernzielen.
3. Nummerierte Abschnitte `<h2 id="…">N.1 …</h2>` (6–12 Stück, je nach Stoff). Unterpunkte als `h4`.
4. „Das Wichtigste in Kürze“ (`h2 id="kurz"`, 4–6 Punkte).
5. `<section class="exercises" id="uebungen">` mit 8–12 Übungen, nummeriert N.1, N.2 … Mischung aus `Theorie`, `Notenlesen`, `Am Klavier`, `Gehör`, `Vertiefung`. Jede Übung hat eine Lösung in `<details class="solution">`. Die Lösung erklärt kurz das Warum, nicht nur das Ergebnis.
6. `<footer class="chapter-foot" id="chapter-foot"></footer>`.

Umfang: ähnlich wie Kapitel 5 (≈ 40–60 KB HTML). Kleinere Themen dürfen kürzer sein, aber nie oberflächlich.

## Die drei Ebenen
- **Theorie** (normaler Text): allein ausreichend, um dem Buch zu folgen. Neue Begriffe beim ersten Auftreten als `<dfn id="g-slug">Begriff</dfn>`. Pro Kapitel nur Begriffe, die hier *eingeführt* werden. `id` mit Präfix `g-`, Kleinbuchstaben, Umlaute ausgeschrieben (ae, oe, ue, ss).
- **Tiefer verstehen:** `<section class="layer deep" data-title="Frage oder These als Titel"> … </section>`. Mindestens 3 pro Kapitel. Titel bevorzugt als Warum-Frage. Inhalt deckt die vier Ebenen ab, wo sie passen: **Akustik/Mathematik** (mit echten, nachgerechneten Zahlen), **Geschichte** (Herkunft von Begriffen und Regeln), **Wahrnehmung** (warum wir etwas als Spannung, Ruhe usw. hören), **Systemlogik** (warum X aus Y folgt). Sie dürfen anspruchsvoll sein, aber jeder Schritt wird erklärt.
- **Am Klavier:** `<section class="layer piano" data-title="…"> … </section>`. Mindestens 2 pro Kapitel. Konkrete Griffe, Fingersätze, Handformen, kleine Übungen mit klarer Anweisung („Spiel … Sag laut …“), typische Fehler.
- Merksätze: `<div class="rule"><div class="lbl">Merke</div><p>…</p></div>`.

## Ton und Sprache
- Du-Form, sachlich-freundlich, präzise wie ein gutes Fachbuch. Kein Kinderbuchton, keine Ausrufe-Begeisterung.
- Kurze, klare Sätze, aktive Form. **Keine** eingeschobenen Gedankenstrich-Nebensätze, keine „nicht X, sondern Y“-Effekte, keine Doppelpunkt-Enthüllungen, keine Floskeln („Es ist wichtig zu beachten“, „spannenderweise“). Der Halbgeviertstrich – nur für Bereiche (c–e, 1–5) und Akkordfolgen (I–IV–V).
- Deutsche Notennamen (c, cis, des, h, b). Helmholtz-Oktaven: c' = mittleres C, c, C, C1; c'', c'''. Englische Bezeichnung beim ersten Auftreten daneben, wenn sie in der Praxis wichtig ist (Akkordsymbole, Leadsheets, englische Lernvideos).
- Stufen in römischen Ziffern (Stufentheorie ist Hauptsystem): Großbuchstaben = Dur, Kleinbuchstaben = Moll, ° vermindert, + übermäßig (I, ii, iii, IV, V, vi, vii°). Funktionstheorie (T, S, D, Tp, Sp, Dp, DD …) wird in Kapitel 14 eingeführt und danach dort, wo es hilft, ergänzend genannt.
- Vorzeichen als Zeichen ♯ ♭ ♮ im Text.
- Querverweise als „(Kapitel 15)“ bzw. „Abschnitt 5.10“. Nur auf Kapitel verweisen, die laut toc.js existieren; Kapitelnummern und Titel exakt aus toc.js.

## Fakten
- Alle Zahlen nachrechnen (z. B. mit `python -I -c …`): Frequenzen, Cent, Verhältnisse, Halbtonzahlen, Vorzeichen.
- Musiktheorie sorgfältig prüfen: Tonnamen, Akkordtöne, Enharmonik (richtige Buchstaben!), Stimmführungsregeln.
- Geschichte nur mit gesichertem Wissen. Bei Legenden sagen, dass es Legenden sind. Lieber weglassen als raten.
- Liedbeispiele nur nennen, wenn du dir sicher bist, dass das Beispiel stimmt. Urheberrechtlich geschützte Melodien **nie** in Noten setzen, nur beim Namen nennen. Gemeinfreie Klassik (Bach, Mozart, Beethoven, Chopin, Volkslieder) darf zitiert werden, kurz und korrekt.

## Bausteine (alle in book.js)
- **Klaviatur:** `<div class="kb" data-from="60" data-to="72" data-labels="white" data-marks="60 64:c2 67:c3:G" data-brackets="60-64:4 HT;64-67:3 HT" aria-label="…"></div>`
  - MIDI-Nummern: 60 = c'. `data-labels`: `c` (nur C mit Oktave), `white`, `all`, `octave`, `none`. `data-flat` für b-Namen bei `all`.
  - Marken: `midi`, `midi:klasse`, `midi:klasse:Beschriftung`. Klassen: leer = blau, `c2` = petrol, `c3` = orange. Beschriftung leer lassen mit `60::`.
  - In einer `<figure>` mit `<figcaption>` einbetten, wenn sie eine eigene Abbildung ist.
- **Noten (abcjs 6.4.4):** `<div class="abc" data-bpm="80" data-caption="…">` + ABC-Text (Einrückung wird entfernt) + `</div>`.
  - ABC-Oktaven: `C` = c', `c` = c'', `c'` = c''', `C,` = c, `C,,` = C. ABC `B` = deutsches h. `^` = ♯, `_` = ♭, `=` = ♮. Akkord: `[CEG]`. Text über Noten: `"^Text"`. Akkordsymbol: `"C"` vor der Note.
  - Bassschlüssel: `K:C clef=bass` (bzw. `K:Bb clef=bass`). Großes System, geprüft:
    ```
    X:1
    M:4/4
    L:1/4
    K:C
    %%score {RH LH}
    V:RH clef=treble
    V:LH clef=bass
    [V:RH] "C"[EGc]4 | "F"[FAc]4 | "G7"[DFGB]4 | "C"[EGc]4 |]
    [V:LH] C,4 | F,,4 | G,,4 | C,4 |]
    ```
  - `M:none` für taktlose Beispiele. Tonart in `K:` setzen (z. B. `K:Am`, `K:Eb`).
  - **Immer** mit dem Smoke-Test prüfen: `abcWarnings` muss leer sein.
- **Klick zum Hören:** `data-play="60 64 67"` auf Button/Tabellenzeile, `data-mode="mel|harm|both"`, `data-bpm`. Tabellenzeilen: `<tr class="play-row" data-play=…>` und als letzte Zelle `▶`. Buttons: `<button class="btn" type="button" data-play="…" data-mode="harm">▶ …</button>` in `<div class="btn-row">`.
- **Exakte Frequenzen:** `data-tone="261.63 327.03" data-partials="6" data-dur="4"` (für Stimmung/Obertöne).
- **Eigene Abläufe** (Akkordfolgen, Kadenzen) per JS: `Book.audio.seq([[[48,60,64,67],2],[[53,60,65,69],2]], bpm)` – jeder Schritt `[midi oder [midis], Dauer in Schlägen]`. Einzeltöne: `Book.audio.note(m, startSek, dauerSek)`, Akkord: `Book.audio.chord([…], start, dauer)`.
- **Gehörtrainer:** Für Intervalle `<div class="interval-trainer"></div>`. Für andere Themen (Dreiklänge, Septakkorde, Kadenzen, Skalen, Modi) eigenen Trainer per `Book.earTrainer(el, cfg)` im Kapitel-Script; Signatur in book.js (`items`, `presets`, `modes`, `build(item, mode) → {play, marks, answer}`, `from`, `to`). Kapitel mit `trainer: true` in toc.js **müssen** einen Trainer haben.
- **Hilfen:** `Book.name(m, {flat})` (Helmholtz-Name), `Book.spellUp(root, zahl, halbtöne)` (korrekt geschriebener Ton über weißem Grundton), `Book.freq(m)`.
- **Tabellen:** immer in `<div class="table-scroll">`. Zahlen mit `class="num"`.
- **Formeln:** `<div class="formula">…</div>`.
- **Eigene SVG-Grafiken:** Farben nur über CSS-Variablen (`var(--ink)`, `--muted`, `--accent`, `--deep`, `--piano`, `--bad`, `--ok`, `--line`), nie feste Farben. `viewBox` + `width:100%`.

## Qualitätsprüfung vor Abgabe
1. `cd C:\dev\piano-theory-tools && node smoke.js kapNN-slug.html` für jedes Kapitel. Erwartet: `errors` leer, `abcWarnings` leer, `duplicateIds` leer, `unconvertedLayers` 0, `soundOk` true, mindestens 3 deep / 2 piano / 8 Übungen, Trainer falls verlangt.
2. Fachlich gegenlesen: jede Tonangabe, jedes Notenbeispiel (stimmt das Abc mit dem Text überein?), jede Klaviatur-Markierung.
3. Sprachlich gegenlesen nach den Regeln oben.
