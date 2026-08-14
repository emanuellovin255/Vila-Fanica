/* ============================================================
   md.ts — parserul de conținut.

   Formatul, și de ce nu YAML (DECIZII.md): o indentare greșită într-un
   YAML rupe build-ul, iar fișierele astea sunt editate de cineva care
   nu programează. Alegerea:

     ##  deschide un element
     ### deschide un sub-element (un preparat într-o categorie)
     Cheie: valoare   sunt câmpurile
     restul paragrafelor e descrierea

   Parserul IARTĂ, deliberat:
     `Preț de la:480`, `preț de la : 480`, `PREȚ DE LA: 480` și
     `Pret de la: 480` dau toate același rezultat.

   Ce NU iartă: un câmp pe care nu-l recunoaște. Ăla e raportat, cu
   sugestia celui mai apropiat câmp cunoscut — pentru că o cheie scrisă
   greșit care e ignorată în tăcere e cel mai enervant fel de bug
   pentru cineva care nu poate citi codul.
   ============================================================ */

/** Un element deschis de `##`, cu câmpurile și textul lui. */
export interface Bloc {
  /** Titlul de după `##`. Gol dacă e un bloc de șablon necompletat. */
  titlu: string
  /** Câmpurile, cu cheile normalizate (litere mici, fără diacritice). */
  campuri: Map<string, string>
  /** Paragrafele libere de sub câmpuri, unite cu `\n\n`. */
  text: string
  /** Sub-blocurile deschise de `###`. */
  subblocuri: Bloc[]
  /** Linia din fișier la care începe blocul — pentru mesaje de eroare. */
  linie: number
}

export interface Document {
  /** Titlul de după `#`. Informativ; nu ajunge pe site. */
  titlu: string
  blocuri: Bloc[]
  /** Câmpuri scrise înainte de primul `##`. Rar, dar legal. */
  campuri: Map<string, string>
}

/**
 * Normalizează o cheie de câmp: litere mici, fără diacritice, fără
 * spații duble, fără spații la capete.
 *
 * Diacriticele se scot INTENȚIONAT: cineva care scrie repede pune
 * `Pret de la:` și are dreptate să se aștepte să meargă.
 */
export function normalizeaza(s: string): string {
  return s
    .normalize('NFD')
    // Scoate semnele diacritice combinate rămase după descompunere.
    .replace(/[̀-ͯ]/g, '')
    // ș/ț cu virgulă dedesubt nu se descompun în toate motoarele.
    .replace(/[șş]/gi, 's')
    .replace(/[țţ]/gi, 't')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Slug pentru URL: fără diacritice, fără două cratime la rând, fără
 * cratimă la capete. „Apartament Deluxe cu terasă" → `apartament-deluxe-cu-terasa`.
 *
 * URL-urile rămân în română, dar fără diacritice (T07): un `ș` în URL
 * ajunge procent-codat și devine ilizibil când e lipit pe WhatsApp.
 */
export function slug(s: string): string {
  return normalizeaza(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Primul număr dintr-un text, oricum ar fi scris.
 * `480`, `480 lei`, `de la 480 RON`, `480,50`, `1.250` → 480 / 480,5 / 1250.
 *
 * Formatarea se face la randare, nu la citire — un `priceFrom` numeric
 * e singurul lucru din care se poate genera și afișajul, și `Offer`-ul
 * din JSON-LD (T07).
 */
export function numar(s: string | undefined): number | undefined {
  if (!s) return undefined
  // Punctul e separator de mii în română („1.250"), virgula e zecimală.
  const m = s.replace(/(\d)\.(\d{3})\b/g, '$1$2').match(/-?\d+(?:,\d+)?/)
  if (!m) return undefined
  const n = Number(m[0].replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

/**
 * Listă. Un câmp pe mai multe rânduri dă un element per rând; unul pe
 * un singur rând se taie la virgulă.
 *
 *   Facilități: wifi, climate, safe     → trei elemente
 *   Buline: Poteci marcate de la 2 la 9 km
 *           Ciubăr în aer liber          → două elemente
 *
 * Distincția contează: o bulină conține adesea o virgulă („Ciubăr în
 * aer liber, pe terasa de sus"), deci n-avem voie să tăiem la virgulă
 * un câmp scris pe rânduri.
 */
export function lista(s: string | undefined): string[] {
  if (!s) return []
  const randuri = s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
  if (randuri.length > 1) return randuri
  return (randuri[0] ?? '')
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/**
 * Grila de tarife pe sezoane. Un rând per perioadă, cu tariful înaintea
 * liniei lungi și perioada după ea:
 *
 *   Prețuri: 290 lei / noapte — 27 martie – 31 mai
 *            320 lei / noapte — 1 iunie – 31 octombrie
 *
 * SE TAIE DOAR LA LINIA LUNGĂ (—), niciodată la cea scurtă (–) sau la
 * cratimă. Perioada însăși conține o linie scurtă („1 iunie – 31
 * octombrie"): dacă am accepta-o ca separator, tariful ar rămâne
 * „320 lei / noapte — 1 iunie" și restul s-ar pierde în tăcere.
 *
 * Un rând fără separator se ia întreg ca tarif, fără perioadă — mai bine
 * decât să dispară.
 */
export function preturi(s: string | undefined): { amount: string; period: string }[] {
  return lista(s).flatMap((rand) => {
    const i = rand.indexOf('—')
    const amount = (i === -1 ? rand : rand.slice(0, i)).trim()
    const period = i === -1 ? '' : rand.slice(i + 1).trim()
    return amount ? [{ amount, period }] : []
  })
}

/**
 * `da` / `nu`, cu toleranță. Orice altceva e `undefined`, nu `false` —
 * distincția contează: un modul necompletat nu e același lucru cu unul
 * oprit explicit.
 */
export function boolean(s: string | undefined): boolean | undefined {
  if (s === undefined) return undefined
  const v = normalizeaza(s)
  if (!v) return undefined
  if (['da', 'yes', 'true', 'on', 'activ', 'pornit', '1'].includes(v)) return true
  if (['nu', 'no', 'false', 'off', 'inactiv', 'oprit', '0'].includes(v)) return false
  return undefined
}

/**
 * Câmp gol = câmp absent (REGULI.md 3). Nu întoarce niciodată `''`,
 * ca o componentă să nu poată randa un titlu urmat de nimic.
 */
export function text(v: string | undefined): string | undefined {
  // Un câmp scris pe mai multe rânduri e o singură frază, nu un poem.
  const t = v?.replace(/\s*\n\s*/g, ' ').trim()
  return t ? t : undefined
}

/* ------------------------------------------------------------------ */

/**
 * O linie e un câmp dacă arată a `Cheie: valoare` ȘI cheia e scurtă.
 * Limita de cuvinte ține o propoziție din descriere („Rezervările se
 * fac astfel: sunați la…") să nu fie citită drept câmp.
 */
const CAMP = /^([^:\n]{1,64}):(.*)$/

function esteCamp(linie: string): RegExpMatchArray | null {
  const m = linie.match(CAMP)
  if (!m) return null
  const cheie = m[1].trim()
  // Maximum 5 cuvinte și fără punctuație de frază.
  if (cheie.split(/\s+/).length > 5) return null
  if (/[.!?]/.test(cheie)) return null
  // O adresă („https://…") nu e un câmp fără cheie.
  if (!cheie) return null
  return m
}

/** Scoate comentariile HTML. Sunt instrucțiuni pentru om, nu conținut. */
function faraComentarii(s: string): string {
  return s.replace(/<!--[\s\S]*?-->/g, '')
}

export function analizeaza(brut: string): Document {
  const doc: Document = { titlu: '', blocuri: [], campuri: new Map() }

  const linii = faraComentarii(brut).split(/\r?\n/)
  let bloc: Bloc | null = null
  let subbloc: Bloc | null = null
  let paragrafe: string[] = []
  /**
   * Cheia câmpului deschis acum. Un câmp rămâne deschis până la prima
   * linie goală: liniile de sub el i se adaugă, câte una pe rând.
   *
   *   Buline: Poteci marcate de la 2 la 9 km
   *           Ciubăr în aer liber, pe terasa de sus
   *           Foc de tabără amenajat
   *
   * Fără regula asta, ultimele două rânduri ar ajunge în descriere, iar
   * lista ar avea o singură bulină — greșeala ar fi tăcută, ceea ce e
   * mai rău decât o eroare. Indentarea NU e obligatorie, tocmai ca să
   * ierte pe cineva care scrie totul aliniat la stânga.
   */
  let campDeschis: { tinta: Bloc | Document; cheie: string } | null = null

  /**
   * Rândurile paragrafului care se scrie acum.
   *
   * UN PARAGRAF E UN GRUP DE RÂNDURI ALIPITE, despărțit de următorul
   * printr-un rând gol — regula din markdown, și singura pe care o
   * bănuiește cineva care scrie text într-un fișier `.md`. Înainte,
   * FIECARE RÂND devenea un paragraf: `text` ieșea cu `\n\n` între
   * bucăți de frază tăiate acolo unde s-a nimerit lățimea editorului.
   *
   * Nu se vedea cât timp proza se randa într-un singur `<p>` — HTML
   * strânge oricum spațiile. Se vedea imediat ce cineva o despărțea pe
   * paragrafe sau punea `white-space: pre-line`, ca pagina de ofertă:
   * acolo fraza se rupea la mijloc, la fiecare rând din fișier.
   */
  let randuriParagraf: string[] = []

  const inchideParagraf = () => {
    if (randuriParagraf.length) paragrafe.push(randuriParagraf.join(' '))
    randuriParagraf = []
  }

  const inchide = () => {
    inchideParagraf()
    const tinta = subbloc ?? bloc
    if (tinta) tinta.text = paragrafe.join('\n\n').trim()
    paragrafe = []
  }

  const nou = (titlu: string, linie: number): Bloc => ({
    titlu: titlu.trim(),
    campuri: new Map(),
    text: '',
    subblocuri: [],
    linie,
  })

  for (let i = 0; i < linii.length; i++) {
    const brut1 = linii[i]
    const linie = brut1.trim()

    // Separatorul `---` e decor pentru ochi, nu structură.
    if (/^-{3,}$/.test(linie)) continue

    if (linie.startsWith('### ') || linie === '###') {
      inchide()
      campDeschis = null
      subbloc = nou(linie.slice(3), i + 1)
      if (bloc) bloc.subblocuri.push(subbloc)
      continue
    }

    if (linie.startsWith('## ') || linie === '##') {
      inchide()
      campDeschis = null
      subbloc = null
      bloc = nou(linie.slice(2), i + 1)
      doc.blocuri.push(bloc)
      continue
    }

    if (linie.startsWith('# ')) {
      inchide()
      campDeschis = null
      doc.titlu = linie.slice(2).trim()
      continue
    }

    // Linia goală închide câmpul deschis — de aici încolo urmează
    // descrierea, nu continuarea ultimei chei — și, în același timp,
    // închide paragraful început.
    if (!linie) {
      campDeschis = null
      inchideParagraf()
      continue
    }

    const m = esteCamp(linie)
    if (m) {
      const tinta = subbloc ?? bloc ?? doc
      const cheie = normalizeaza(m[1])
      tinta.campuri.set(cheie, m[2].trim())
      campDeschis = { tinta, cheie }
      continue
    }

    if (campDeschis) {
      const { tinta, cheie } = campDeschis
      const precedent = tinta.campuri.get(cheie) ?? ''
      tinta.campuri.set(cheie, precedent ? `${precedent}\n${linie}` : linie)
      continue
    }

    randuriParagraf.push(linie)
  }

  inchide()
  return doc
}

/* ------------------------------------------------------------------ */

/** Distanța Levenshtein, pentru sugestia „ai vrut să scrii…?". */
function distanta(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = cur
  }
  return prev[n]
}

/**
 * Cel mai apropiat câmp cunoscut, dacă e destul de apropiat ca să fie
 * plauzibil o scăpare de tastare. Peste o treime din lungime, tăcem:
 * o sugestie greșită e mai rea decât niciuna.
 */
export function sugereaza(cheie: string, cunoscute: readonly string[]): string | undefined {
  let cea: string | undefined
  let min = Infinity
  for (const c of cunoscute) {
    const d = distanta(cheie, c)
    if (d < min) {
      min = d
      cea = c
    }
  }
  return cea && min <= Math.max(2, Math.floor(cea.length / 3)) ? cea : undefined
}
