# Fremdmaterial und Danksagungen

## Mitgeliefert

**Klaviersamples (`piano-samples.js`)**
- Quelle: „FluidR3_GM“ Soundfont, Acoustic Grand Piano, von Frank Wen
- Als MP3 aufbereitet von Benjamin Gleitzman im Projekt midi-js-soundfonts: https://github.com/gleitz/midi-js-soundfonts
- Lizenz: Creative Commons Attribution 3.0 (CC BY 3.0), https://creativecommons.org/licenses/by/3.0/
- Änderungen: Auswahl jedes dritten Tons von C1 bis C7, neu verpackt als JavaScript-Datei (`window.PIANO_SAMPLES`, MP3 als Base64).

## Zur Laufzeit geladen (nicht im Repository enthalten)

- **abcjs 6.4.4** (Notensatz und Wiedergabe), Paul Rosen und Mitwirkende, MIT-Lizenz, https://github.com/paulrosen/abcjs — geladen von cdnjs.cloudflare.com
- **Schriften** Bricolage Grotesque, Literata und IBM Plex Mono, SIL Open Font License 1.1 — geladen von Google Fonts

## Nur für die Werkzeuge in `tools/` (per `npm install`)

- **jsdom** (MIT) und **abcjs** (MIT) für den automatischen Seitentest
