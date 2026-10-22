// Inhaltsverzeichnis – einzige Quelle für Startseite, Kapitelnavigation und Voraussetzungen.
// ready: true, sobald die Kapitelseite existiert. trainer: Kapitel enthält einen Gehörtrainer.
window.BOOK = {
  title: "Klavier verstehen",
  parts: [
    {
      id: "I", title: "Grundlagen",
      blurb: "Wie Töne heißen, wie man sie aufschreibt und wie sie sich zu Tonleitern und Tonarten ordnen.",
      chapters: [
        { n: 1, slug: "klaviatur", ready: true, title: "Die Klaviatur", desc: "Stammtöne, schwarze Tasten, Oktaven, Halb- und Ganztöne. Warum es sieben weiße und fünf schwarze Tasten gibt und warum wir „H“ sagen.", prereq: [] },
        { n: 2, slug: "notenschrift", ready: true, title: "Notenschrift", desc: "Notensystem, Violin- und Bassschlüssel, Hilfslinien, das große System, Vorzeichen ♯ ♭ ♮.", prereq: [1] },
        { n: 3, slug: "rhythmus", ready: true, title: "Notenwerte und Rhythmus", desc: "Ganze bis Sechzehntel, Pausen, Punktierung, Haltebogen, Triolen.", prereq: [2] },
        { n: 4, slug: "takt", ready: true, title: "Takt, Metrum und Tempo", desc: "Taktarten, schwere und leichte Zählzeiten, Auftakt, Synkope, Tempoangaben.", prereq: [3] },
        { n: 5, slug: "intervalle", title: "Intervalle", ready: true, desc: "Abstände benennen und hören. Warum eine Quinte „rein“ klingt: Frequenzverhältnisse, Obertöne, gleichstufige Stimmung.", prereq: [1, 2], trainer: true },
        { n: 6, slug: "dur", ready: true, title: "Die Dur-Tonleiter", desc: "Das Ganz-/Halbton-Muster, Leittöne, Tetrachorde. Warum gerade diese sieben Töne.", prereq: [5] },
        { n: 7, slug: "quintenzirkel", ready: true, title: "Tonarten und Quintenzirkel", desc: "Vorzeichen der Tonarten herleiten statt auswendig lernen. Enharmonik und das pythagoreische Komma.", prereq: [6] },
        { n: 8, slug: "moll", ready: true, title: "Die Moll-Tonleitern", desc: "Natürliches, harmonisches und melodisches Moll. Parallel- und Varianttonarten.", prereq: [7], trainer: true },
        { n: 9, slug: "weitere-skalen", ready: true, title: "Pentatonik, Blues und andere Skalen", desc: "Pentatonik, Blues-Skala, chromatische Tonleiter, Ganztonleiter. Warum die Pentatonik auf den schwarzen Tasten liegt.", prereq: [8] },
        { n: 10, slug: "vortrag", ready: true, title: "Dynamik, Artikulation und Vortrag", desc: "piano bis forte, legato, staccato, Phrasierung, Wiederholungszeichen und Verzierungen wie Triller und Vorschlag.", prereq: [3] }
      ]
    },
    {
      id: "II", title: "Akkorde und Harmonik",
      blurb: "Wie aus Tönen Akkorde werden, wie Akkorde in einer Tonart zusammenwirken und wie man Leadsheets liest.",
      chapters: [
        { n: 11, slug: "dreiklaenge", ready: true, title: "Dreiklänge", desc: "Dur, Moll, vermindert, übermäßig. Warum der Durdreiklang in der Obertonreihe steckt.", prereq: [5], trainer: true },
        { n: 12, slug: "umkehrungen", ready: true, title: "Umkehrungen und Lagen", desc: "Grundstellung, Sextakkord, Quartsextakkord, enge und weite Lage. Kurze Griffwege am Klavier.", prereq: [11] },
        { n: 13, slug: "stufen", ready: true, title: "Leitereigene Akkorde und Stufen", desc: "Die sieben Akkorde einer Tonart, römische Stufenzahlen, Dur/Moll-Muster I ii iii IV V vi vii°.", prereq: [6, 11] },
        { n: 14, slug: "funktionen", ready: true, title: "Tonika, Subdominante, Dominante", desc: "Spannung und Entspannung. Stufentheorie und Funktionstheorie (T, S, D, Tp …) im Vergleich.", prereq: [13] },
        { n: 15, slug: "septakkorde", ready: true, title: "Septakkorde", desc: "Dominantsept, maj7, m7, halbvermindert, vermindert. Warum der Tritonus nach Auflösung drängt.", prereq: [11, 14], trainer: true },
        { n: 16, slug: "kadenzen", ready: true, title: "Kadenzen und Schlüsse", desc: "Ganzschluss, Halbschluss, Plagalschluss, Trugschluss. Wie Musik Satzzeichen setzt.", prereq: [14, 15], trainer: true },
        { n: 17, slug: "leadsheets", ready: true, title: "Akkordsymbole und Leadsheets", desc: "Cmaj7, Am/E, sus4, add9, Slash-Akkorde. Vom Symbol zum Griff.", prereq: [12, 15] },
        { n: 18, slug: "pop-progressionen", ready: true, title: "Typische Akkordfolgen", desc: "I–V–vi–IV, vi–IV–I–V, Fünfziger-Folge, Kanon-Folge. Warum so viele Songs gleich gebaut sind.", prereq: [16, 17] },
        { n: 19, slug: "nichtakkordtoene", ready: true, title: "Melodie über Akkorden", desc: "Akkordtöne und Nichtakkordtöne: Durchgang, Wechselnote, Vorhalt, Antizipation.", prereq: [13, 16, 17] }
      ]
    },
    {
      id: "III", title: "Fortgeschrittene Harmonik",
      blurb: "Akkorde, die von außerhalb der Tonart kommen, und wie Musik die Tonart wechselt.",
      chapters: [
        { n: 20, slug: "moll-harmonik", ready: true, title: "Harmonik in Moll", desc: "Warum Moll seine Dominante „leiht“. Akkorde aus den drei Moll-Formen.", prereq: [8, 16] },
        { n: 21, slug: "zwischendominanten", ready: true, title: "Zwischendominanten", desc: "V/V, V/vi und Co.: kurz eine andere Tonika ansteuern, ohne die Tonart zu verlassen. Doppeldominante.", prereq: [15, 16] },
        { n: 22, slug: "modulation", ready: true, title: "Modulation", desc: "Diatonisch, chromatisch, enharmonisch. Drehpunktakkorde und Rückung.", prereq: [21] },
        { n: 23, slug: "modale-mischung", ready: true, title: "Modale Mischung", desc: "Dur-Moll-Mischung: iv, ♭VI, ♭VII in Dur. Der Farbkasten der Popmusik.", prereq: [20] },
        { n: 24, slug: "modi", ready: true, title: "Kirchentonarten", desc: "Ionisch bis Lokrisch: Herkunft, Charakter, heutiger Gebrauch in Pop, Filmmusik und Jazz.", prereq: [8, 13], trainer: true },
        { n: 25, slug: "chromatische-akkorde", ready: true, title: "Chromatische Spezialakkorde", desc: "Neapolitaner, übermäßige Sextakkorde, verminderter Septakkord als Drehpunkt.", prereq: [21, 22] },
        { n: 26, slug: "sequenzen", ready: true, title: "Sequenzen und Orgelpunkt", desc: "Quintfallsequenz und andere Muster, die Harmonik in Bewegung halten.", prereq: [21] }
      ]
    },
    {
      id: "IV", title: "Jazz-Harmonik",
      blurb: "Erweiterte Akkorde, Voicings und die Werkzeuge, mit denen Jazzpianisten Harmonien umfärben.",
      chapters: [
        { n: 27, slug: "optionstoene", ready: true, title: "Erweiterte Akkorde und Optionstöne", desc: "9, 11, 13 und Alterationen. Avoid Notes und warum sie stören.", prereq: [15, 17] },
        { n: 28, slug: "ii-v-i", ready: true, title: "Die II–V–I-Verbindung", desc: "Der Baustein des Jazz in Dur und Moll. Ketten von II–V.", prereq: [21, 27] },
        { n: 29, slug: "voicings", ready: true, title: "Voicings am Klavier", desc: "Shell-Voicings, Rootless A/B, Drop-2, Quartvoicings. Stimmführung mit wenig Bewegung.", prereq: [28] },
        { n: 30, slug: "akkordskalen", ready: true, title: "Akkordskalen", desc: "Welche Skala passt zu welchem Akkord. Grundlage für Improvisation.", prereq: [24, 27] },
        { n: 31, slug: "tritonus-substitution", ready: true, title: "Tritonussubstitution und alterierte Dominanten", desc: "Warum D♭7 statt G7 funktioniert. Die alterierte Skala.", prereq: [28] },
        { n: 32, slug: "reharmonisierung", ready: true, title: "Reharmonisierung", desc: "Eine bekannte Melodie neu harmonisieren: Substitutionen, eingeschobene II–V, Bassbewegung.", prereq: [29, 31] }
      ]
    },
    {
      id: "V", title: "Stimmführung und Kontrapunkt",
      blurb: "Wie mehrere Stimmen gleichzeitig eigenständig bleiben. Die Regeln und warum es sie gibt.",
      chapters: [
        { n: 33, slug: "stimmfuehrung", ready: true, title: "Grundlagen der Stimmführung", desc: "Bewegungsarten, Konsonanz und Dissonanz, Parallelen. Warum Quintparallelen „verboten“ sind.", prereq: [5, 12] },
        { n: 34, slug: "kontrapunkt-1", ready: true, title: "Kontrapunkt I: Note gegen Note", desc: "Fux’ erste Gattung: zweistimmig, ein Ton gegen einen Ton.", prereq: [33] },
        { n: 35, slug: "kontrapunkt-2", ready: true, title: "Kontrapunkt II: Zwei und vier Noten", desc: "Zweite und dritte Gattung: Durchgänge und Wechselnoten kontrolliert einsetzen.", prereq: [34] },
        { n: 36, slug: "kontrapunkt-3", ready: true, title: "Kontrapunkt III: Synkope und freier Satz", desc: "Vierte Gattung (Vorhalte) und fünfte Gattung (alles gemischt).", prereq: [35] },
        { n: 37, slug: "choralsatz", ready: true, title: "Der vierstimmige Satz", desc: "Sopran, Alt, Tenor, Bass. Verdopplung, Stimmabstände, Akkordverbindungen im Bach-Stil.", prereq: [16, 33, 36] },
        { n: 38, slug: "fuge", ready: true, title: "Imitation, Kanon und Fuge", desc: "Thema, Antwort, Kontrasubjekt, Engführung. Eine Bach-Fuge lesen.", prereq: [36, 37] }
      ]
    },
    {
      id: "VI", title: "Formenlehre",
      blurb: "Wie Musikstücke im Großen gebaut sind, vom Motiv bis zur Sonate und zum Popsong.",
      chapters: [
        { n: 39, slug: "bausteine", ready: true, title: "Motiv, Phrase, Periode, Satz", desc: "Die kleinen Einheiten, aus denen Melodien gebaut sind.", prereq: [16] },
        { n: 40, slug: "liedformen", ready: true, title: "Liedformen, Rondo und Variation", desc: "AB, ABA, ABACA, Thema mit Variationen.", prereq: [39] },
        { n: 41, slug: "sonate", ready: true, title: "Die Sonatenhauptsatzform", desc: "Exposition, Durchführung, Reprise und die Logik der Tonarten dahinter.", prereq: [22, 40] },
        { n: 42, slug: "songformen", ready: true, title: "Songformen in Pop und Jazz", desc: "Strophe, Refrain, Bridge, 12-Takt-Blues, AABA.", prereq: [18, 39, 40] }
      ]
    },
    {
      id: "VII", title: "Klavierpraxis",
      blurb: "Kapitel 43, 45 und 47 sind unabhängig von der Theorie lesbar, die übrigen am besten parallel zu den genannten Theoriekapiteln.",
      chapters: [
        { n: 43, slug: "technik", ready: true, title: "Haltung und Technik", desc: "Sitzhöhe, Handform, Gewicht statt Kraft. Verspannungen vermeiden.", prereq: [] },
        { n: 44, slug: "fingersaetze", ready: true, title: "Fingersätze", desc: "Prinzipien statt Einzelfälle: Daumenuntersatz, Tonleitern, Arpeggien, Akkorde.", prereq: [6, 7] },
        { n: 45, slug: "pedal", ready: true, title: "Das Pedal", desc: "Haltepedal, synkopischer Pedalwechsel, Una corda, Sostenuto.", prereq: [] },
        { n: 46, slug: "begleitmuster", ready: true, title: "Begleitmuster", desc: "Von Blockakkorden über Arpeggien und Alberti-Bässe bis zu Pop-Patterns.", prereq: [12, 17] },
        { n: 47, slug: "ueben", ready: true, title: "Effektiv üben", desc: "Langsam üben, in Abschnitten üben, verteilt üben, mit Metronom. Was die Lernforschung sagt.", prereq: [] },
        { n: 48, slug: "blattspiel", ready: true, title: "Blattspiel", desc: "Muster statt Einzelnoten lesen, vorauslesen, nicht anhalten.", prereq: [2, 3, 5] },
        { n: 49, slug: "nach-gehoer", ready: true, title: "Nach Gehör spielen und improvisieren", desc: "Melodien heraushören, Akkorde finden, erste Improvisation über Pentatonik und Blues.", prereq: [9, 18] }
      ]
    }
  ],
  appendix: [
    { slug: "glossar", ready: true, title: "Glossar", desc: "Alle Fachbegriffe mit Verweis auf die Stelle, an der sie erklärt werden." },
    { slug: "anhang-tonarten", ready: true, title: "Tonarten-Übersicht", desc: "Quintenzirkel, Vorzeichen, Paralleltonarten auf einen Blick." },
    { slug: "anhang-akkorde", ready: true, title: "Akkordtabelle", desc: "Alle gängigen Akkordtypen mit Formel, Symbol und Griff." },
    { slug: "anhang-skalen", ready: true, title: "Skalentabelle", desc: "Tonleitern und Modi mit Intervallmuster." }
  ]
};
