/* ============================================================
   lib/validare.ts — validarea și curățarea datelor din formular.

   Portat din `Web Tamplate/_core/api/lead.js` (validate, honeypot,
   pick, sanitizare) și adaptat pentru o cerere de cazare, nu de lead
   de servicii. Trăiește separat de route handler (T10) dintr-un motiv:
   e SINGURUL loc de adevăr pentru „ce e valid". Formularul din browser
   îl folosește doar pentru UX (mesaje instant); serverul îl folosește
   pentru decizia finală. Un câmp verificat doar în browser nu înseamnă
   nimic — clientul rulează pe mașina lui și poate trimite orice.

   REGULI de bază, moștenite din lead.js:
   - Listă PERMISIVĂ de câmpuri: ce nu e în `CAMPURI` dispare aici, o
     dată, și nu ajunge nici în email, nici nicăieri. O nișă care adaugă
     un `<input>` nou în HTML nu poate injecta date nevalidate.
   - Limita de lungime se aplică prin TĂIERE, nu prin respingere: cine
     scrie un roman în „mesaj" primește tot cererea trimisă, trunchiată.
   - Zero dependențe. Rulează la fel pe edge și pe Node.
   ============================================================ */

/** Telefon românesc: 07xxxxxxxx, cu sau fără prefix de țară (+4 / 4). */
const TELEFON_RO = /^(?:\+?4)?07\d{8}$/

/** E-mail — verificare structurală, nu livrabilitate (aia o face trimiterea). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Câmpurile acceptate ale unei cereri de cazare și limita fiecăruia.
 * `eticheta` e cum apare câmpul în emailul de notificare (T10).
 * Ordinea de aici e ordinea din email.
 */
export const CAMPURI = [
  { nume: 'sosire', max: 10, eticheta: 'Sosire' },
  { nume: 'plecare', max: 10, eticheta: 'Plecare' },
  { nume: 'persoane', max: 40, eticheta: 'Persoane' },
  { nume: 'camera', max: 120, eticheta: 'Cameră' },
  { nume: 'mesaj', max: 1000, eticheta: 'Mesaj' },
  { nume: 'email', max: 160, eticheta: 'E-mail' },
] as const

/** Datele curățate ale unei cereri: nume + contact, restul din CAMPURI, plus acordul GDPR. */
export type CerereFormular = {
  nume: string
  telefon: string
  /** Acordul GDPR — obligatoriu, nebifat implicit (standarde/01, T11). */
  acord: boolean
} & Record<(typeof CAMPURI)[number]['nume'], string>

/** Rezultatul validării — mesaj clar, gata de arătat în frontend. */
export type RezultatValidare = { ok: true } | { ok: false; eroare: string }

/**
 * Taie spațiile de la capete și limitează lungimea. `null`/`undefined`
 * devin șir gol, nu „null". Prima linie de apărare contra datelor murdare.
 */
export function text(v: unknown, max: number): string {
  return String(v == null ? '' : v)
    .trim()
    .slice(0, max)
}

/** Scoate separatoarele uzuale dintr-un telefon: spații, puncte, cratime, paranteze. */
export function normalizeazaTelefon(v: unknown): string {
  return String(v ?? '').replace(/[\s.\-()]/g, '')
}

/**
 * Honeypot. Câmpul `company` e ascuns vizual în formular; un om nu-l
 * vede și nu-l completează, un bot îl umple. Dacă e completat → bot.
 * Nu-i confirmăm capcana: apelantul răspunde 200 fals, nu 400.
 */
export function esteBot(body: Record<string, unknown>): boolean {
  return text(body.company, 200) !== ''
}

/**
 * Din tot ce a trimis browserul păstrăm EXACT câmpurile cunoscute.
 * Restul dispare aici și nu mai apare nicăieri. Un singur loc de filtrare.
 */
export function culege(body: Record<string, unknown>): CerereFormular {
  const d = {
    nume: text(body.nume, 80),
    telefon: normalizeazaTelefon(body.telefon),
    acord: esteAdevarat(body.acord),
  } as CerereFormular
  for (const c of CAMPURI) d[c.nume] = text(body[c.nume], c.max)
  return d
}

/** Un checkbox trimis prin form ajunge „on"; prin JSON poate fi `true`/`"true"`/`1`. */
function esteAdevarat(v: unknown): boolean {
  return v === true || v === 'on' || v === 'true' || v === '1'
}

/**
 * Validarea. Obligatorii: numele, UN canal de contact (telefon SAU email,
 * nu ambele — `standarde/02` cere minimul de câmpuri) și acordul GDPR.
 * Perioada, numărul de persoane și mesajul sunt opționale: cine răspunde
 * poate întreba restul. Mesajele sunt în română și spun ce să repare.
 */
export function valideaza(d: CerereFormular): RezultatValidare {
  if (d.nume.length < 2) return { ok: false, eroare: 'Scrie-ți numele, te rog.' }

  const areTelefon = d.telefon.length > 0
  const areEmail = d.email.length > 0
  if (!areTelefon && !areEmail) {
    return { ok: false, eroare: 'Lasă un telefon sau un e-mail ca să te putem contacta.' }
  }
  if (areTelefon && !TELEFON_RO.test(d.telefon)) {
    return { ok: false, eroare: 'Numărul de telefon nu pare corect (ex: 07xx xxx xxx).' }
  }
  if (areEmail && !EMAIL_RE.test(d.email)) {
    return { ok: false, eroare: 'Adresa de e-mail nu pare corectă.' }
  }
  if (!d.acord) {
    return { ok: false, eroare: 'Bifează acordul de prelucrare a datelor ca să putem răspunde.' }
  }
  return { ok: true }
}
