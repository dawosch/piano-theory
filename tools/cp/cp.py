# Prüfer/Löser für zweistimmigen Kontrapunkt nach Fux (Gattungen 1–4) und vierstimmigen Satz.
import random, itertools, sys
NAT = [0,2,4,5,7,9,11]
def dia(m):
    """diatonischer Index; Kreuz-Töne (cis, fis, gis) zählen zum unteren Stammton"""
    pc = m % 12; o = m // 12
    if pc in NAT: return o*7 + NAT.index(pc)
    return o*7 + NAT.index(pc-1)
def ivl(a, b):
    lo, hi = min(a,b), max(a,b)
    num = dia(hi) - dia(lo); s = (hi - lo)
    return num, s
def kind(a, b):
    num, s = ivl(a, b); sn = num % 7; s12 = s % 12
    if sn in (0,4) and s12 in (0,7): return "P"
    if sn in (2,5) and s12 in (3,4,8,9): return "I"
    return "D"
def name(a, b):
    num, s = ivl(a, b)
    return str(num % 7 + 1 if num >= 7 and num % 7 != 0 else num + 1) if num < 7 else str(num % 7 + 1 if num % 7 else 8)
def simple(a,b):
    num,s = ivl(a,b); return num % 7
def sgn(x): return (x>0)-(x<0)
def melodic_ok(prev2, prev, cur, allow_rep=False):
    d = cur - prev
    if d == 0: return allow_rep
    a = abs(d); n = abs(dia(cur)-dia(prev))
    if a in (6,10,11) or a > 12: return False      # Tritonus, Septimen, > Oktave
    if n == 1 and a > 2: return False              # übermäßige Sekunde
    if n == 0: return False                        # chromatischer Schritt
    if a == 9: return False                        # große Sexte (Fux meidet sie)
    if a == 8 and d < 0: return False              # kleine Sexte nur aufwärts
    if prev2 is not None:
        d0 = prev - prev2
        if abs(d0) >= 5 and not (sgn(d) == -sgn(d0) and abs(d) <= 2): return False  # großer Sprung → Gegenschritt
        if abs(d0) > 2 and abs(d) > 2 and sgn(d0) == sgn(d) and abs(d0+d) > 12: return False
        if abs(d0) > 2 and abs(d) > 2 and sgn(d0) == sgn(d) and (abs(d0)+abs(d)) not in (7,8,9) : return False  # zwei Sprünge nur als Dreiklang
    return True
def tritone_outline(line):
    # stufenweise Läufe in eine Richtung, die einen Tritonus umspannen
    i = 0
    while i < len(line)-1:
        j = i; dr = sgn(line[i+1]-line[i])
        while j+1 < len(line) and sgn(line[j+1]-line[j]) == dr and abs(line[j+1]-line[j]) <= 2: j += 1
        if j > i and abs(line[j]-line[i]) == 6: return True
        i = max(j, i+1)
    return False

def check_pair(prev_lo, prev_hi, lo, hi):
    """Parallelen und verdeckte Parallelen zwischen zwei Zusammenklängen"""
    errs = []
    k2 = kind(lo, hi)
    if k2 == "P":
        m1, m2 = sgn(lo-prev_lo), sgn(hi-prev_hi)
        if kind(prev_lo, prev_hi) == "P" and simple(prev_lo, prev_hi) == simple(lo, hi) and m1 != 0 and m2 != 0 and (prev_lo != lo):
            errs.append("Parallele" if m1 == m2 else "Gegenparallele")
        elif m1 == m2 and m1 != 0:
            errs.append("verdeckte")
    return errs

def lab(a,b):
    num,s = ivl(a,b)
    if num == 0: return "1"
    r = num % 7
    return "8" if r == 0 else str(r+1)

WHITE = [m for m in range(36, 90) if m % 12 in NAT]

def species1(cf, above=True, lo=60, hi=79, extra=None, n_keep=40, seed=1):
    """Alle Lösungen der 1. Gattung, nach Güte sortiert."""
    N = len(cf); sols = []
    pool = [m for m in WHITE if lo <= m <= hi]
    def ok_harm(i, m):
        c = cf[i]
        if above and m < c: return False
        if not above and m > c: return False
        num, s = ivl(c, m)
        if num > 14: return False
        k = kind(c, m)
        if k == "D": return False
        if num == 0 and i not in (0, N-1): return False
        if i == 0 and k != "P": return False
        if i == 0 and not above and simple(c,m) != 0: return False
        if i == N-1 and simple(c, m) != 0: return False
        if i == N-2:
            if above and not (simple(c,m) == 5 and s % 12 == 9): return False
            if not above and not (simple(c,m) == 2 and s % 12 == 3): return False
        return True
    def rec(line):
        i = len(line)
        if i == N:
            if tritone_outline(line): return
            top = max(line)
            if line.count(top) > 1: return
            if max(line) - min(line) > 16: return
            sols.append(list(line)); return
        cands = list(pool) + ([extra[i]] if extra and i in extra else [])
        for m in cands:
            if not ok_harm(i, m): continue
            if i > 0:
                if not melodic_ok(line[i-2] if i >= 2 else None, line[i-1], m): continue
                pl, ph = (cf[i-1], line[i-1]) if above else (line[i-1], cf[i-1])
                l, h = (cf[i], m) if above else (m, cf[i])
                if check_pair(pl, ph, l, h): continue
                # höchstens drei gleiche unvollkommene in Folge
                if i >= 3:
                    ks = [simple(cf[j], (line+[m])[j]) for j in range(i-3, i+1)]
                    if all(k == ks[0] for k in ks) and ks[0] in (2,5): continue
            line.append(m); rec(line); line.pop()
    rec([])
    def score(line):
        sc = 0
        for i in range(1, N):
            d = abs(line[i]-line[i-1])
            if d > 2: sc += 2
            if d >= 5: sc += 2
            pl, ph = (cf[i-1], line[i-1]); 
            if sgn(line[i]-line[i-1]) == sgn(cf[i]-cf[i-1]): sc += 1
        for i in range(1, N-1):
            if kind(cf[i], line[i]) == "P": sc += 1.5
        t = line.index(max(line))
        if t in (0, N-1): sc += 3
        return sc
    sols.sort(key=score)
    return sols, score
def show(cf, line, above=True):
    return " ".join(lab(c, m) for c, m in zip(cf, line))

def florid(cf, per_bar, lo, hi, n_max=3000, seed=3, suspension=False, penult=None, rest_start=True, time_limit=60):
    """Gattung 2 (per_bar=2), 3 (per_bar=4) oder 4 (suspension=True, per_bar=2, gebunden).
    CP oben. Liefert Liste von Linien (flach) mit Positionen."""
    import time
    N = len(cf); rnd = random.Random(seed); t0 = time.time()
    slots = []  # (bar, beat)
    for b in range(N-1):
        for k in range(per_bar):
            if b == 0 and k == 0 and rest_start and per_bar == 2: continue
            slots.append((b, k))
    slots.append((N-1, 0))
    pool = [m for m in WHITE if lo <= m <= hi]
    sols = []
    def harm(i, line):
        b, k = slots[i]; m = line[i]; c = cf[b]
        if m < c: return False
        num, s = ivl(c, m)
        if num > 14: return False
        kd = kind(c, m)
        if b == N-1: return simple(c, m) == 0
        if i == 0 and kd != "P": return False
        if num == 0 and b != N-1 and not (i == 0): return False
        if suspension:
            if k == 0:
                # gebunden: gleicher Ton wie vorher
                if i == 0 or line[i-1] != m: return False
                if kd == "D":
                    sn = simple(c, m)
                    return sn in (6, 3)   # 7–6, 4–3 (Auflösung wird beim nächsten geprüft)
                return True
            else:
                if kd == "D": return False
                if i > 0 and slots[i-1][1] == 0 and kind(cf[b], line[i-1]) == "D":
                    # Auflösung: Schritt abwärts in unvollkommene Konsonanz
                    if not (line[i-1] - m in (1, 2) and kd == "I"): return False
                return True
        if k == 0:
            return kd != "D"
        if per_bar == 4 and k == 2 and kd == "D": return False
        if kd != "D": return True
        return None  # Dissonanz: muss Durchgang/Wechselnote sein, wird später geprüft
    def diss_ok(line, i):
        # Dissonanz auf schwacher Zählzeit i: Durchgang (Schritt, gleiche Richtung) oder untere/obere Wechselnote (nur Gattung 3, nicht auf Schlag 3)
        a, m, n = line[i-1], line[i], line[i+1]
        d1, d2 = m - a, n - m
        if not (abs(d1) in (1,2) and abs(d2) in (1,2)): return False
        if sgn(d1) == sgn(d2): return True
        return per_bar == 4 and slots[i][1] != 2
    def rec(line):
        if time.time() - t0 > time_limit or len(sols) >= n_max: return
        i = len(line)
        if i == len(slots):
            if tritone_outline(line): return
            if line.count(max(line)) > 1 and not suspension: return
            if max(line) - min(line) > 16: return
            sols.append(list(line)); return
        b, k = slots[i]
        cands = list(pool); rnd.shuffle(cands)
        if penult and b == N-2: cands = [m for m in cands if m in penult.get(k, cands)]
        for m in cands:
            line.append(m)
            ok = True
            h = harm(i, line)
            if h is False: ok = False
            if ok and i > 0:
                if not suspension and line[i-1] == m: ok = False
                if ok and not (suspension and k == 0) and not melodic_ok(line[i-2] if i >= 2 and not (suspension and slots[i-1][1]==0) else None, line[i-1], m, allow_rep=False):
                    ok = False
            # vorige Dissonanz jetzt prüfen
            if ok and i >= 2 and not suspension:
                pb, pk = slots[i-1]
                if pk != 0 and kind(cf[pb], line[i-1]) == "D" and not diss_ok(line, i-1): ok = False
            if ok and i == len(slots)-1 and h is None: ok = False
            # Parallelen: Schwerpunkt zu Schwerpunkt, letzte Note des Takts zum nächsten Schwerpunkt
            if ok and (k == 0 or b == N-1) and i > 0:
                pc = cf[slots[i-1][0]]
                if check_pair(pc, line[i-1], cf[b], m) and not (suspension and k == 0): ok = False
                # Schwerpunkt-Parallelen (Taktanfang zu Taktanfang)
                prev_strong = [j for j in range(i) if slots[j][1] == 0]
                if ok and prev_strong:
                    j = prev_strong[-1]
                    pcj = cf[slots[j][0]]
                    if kind(pcj, line[j]) == "P" and kind(cf[b], m) == "P" and simple(pcj, line[j]) == simple(cf[b], m) and not suspension: ok = False
            if ok and suspension and k == 1 and i >= 2:
                # Parallelen zwischen aufeinanderfolgenden schwachen Zählzeiten (die "eigentlichen" Töne)
                j = i - 2
                if slots[j][1] == 1 and kind(cf[slots[j][0]], line[j]) == "P" and kind(cf[b], m) == "P" and simple(cf[slots[j][0]], line[j]) == simple(cf[b], m): ok = False
            if ok and i >= 3 and per_bar == 2 and not suspension and k == 1:
                j = i - 2
                if slots[j][1] == 1 and kind(cf[slots[j][0]], line[j]) == "P" and kind(cf[b], m) == "P" and simple(cf[slots[j][0]], line[j]) == simple(cf[b], m): ok = False
            if ok: rec(line)
            line.pop()
    rec([])
    return slots, sols

def fscore(cf, slots, line):
    sc = 0
    for i in range(1, len(line)):
        d = abs(line[i]-line[i-1])
        if d > 2: sc += 1.5
        if d >= 5: sc += 2
    t = line.index(max(line))
    if t in (0, len(line)-1): sc += 3
    for i,(b,k) in enumerate(slots):
        if k == 0 and 0 < b < len(cf)-1 and kind(cf[b], line[i]) == "P": sc += 1
    return sc
def fshow(cf, slots, line):
    out = []; bar = -1
    for (b,k), m in zip(slots, line):
        if b != bar: out.append("|"); bar = b
        out.append(lab(cf[b], m) + ("*" if kind(cf[b], m) == "D" else ""))
    return " ".join(out)

RANGES = {"S": (60, 79), "A": (55, 74), "T": (48, 67), "B": (41, 62)}
def check_satb(chords, names=None):
    """chords: Liste von (S, A, T, B). Meldet Parallelen, verdeckte Parallelen (Außenstimmen mit Sopransprung),
    Umfänge, Stimmkreuzung, Abstände."""
    V = "SATB"; errs = []
    for i, ch in enumerate(chords):
        for v, m in zip(V, ch):
            lo, hi = RANGES[v]
            if not lo <= m <= hi: errs.append(f"{i}: {v} außerhalb ({m})")
        s, a, t, b = ch
        if not (s >= a >= t >= b): errs.append(f"{i}: Stimmkreuzung")
        if s - a > 12 or a - t > 12: errs.append(f"{i}: Abstand > Oktave")
        if t - b > 19: errs.append(f"{i}: Tenor–Bass > Duodezime")
    for i in range(1, len(chords)):
        p, c = chords[i-1], chords[i]
        for x, y in itertools.combinations(range(4), 2):
            hi0, lo0, hi1, lo1 = p[x], p[y], c[x], c[y]
            if kind(lo0, hi0) == "P" and kind(lo1, hi1) == "P" and simple(lo0, hi0) == simple(lo1, hi1) and (hi0 != hi1 or lo0 != lo1):
                if sgn(hi1-hi0) != 0 and sgn(lo1-lo0) != 0:
                    errs.append(f"{i-1}->{i}: {V[x]}{V[y]} {'Parallele' if sgn(hi1-hi0)==sgn(lo1-lo0) else 'Gegenparallele'} {lab(lo1,hi1)}")
        s0, b0, s1, b1 = p[0], p[3], c[0], c[3]
        if kind(b1, s1) == "P" and sgn(s1-s0) == sgn(b1-b0) != 0 and abs(s1-s0) > 2 and not (kind(b0, s0) == "P" and simple(b0,s0)==simple(b1,s1)):
            errs.append(f"{i-1}->{i}: verdeckte {lab(b1,s1)} Außenstimmen (Sopransprung)")
    return errs
