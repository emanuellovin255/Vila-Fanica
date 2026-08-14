/* ============================================================
   patch.ts — editarea CHIRURGICALĂ a fișierelor `.md` din `date/`.

   ATENȚIE, PENTRU CINE ÎNTREȚINE MOTORUL: fișierul face parte din
   panoul de administrare, o modificare locală față de motorul-sursă.
   Vezi `MOTOR-MODIFICAT.md`.

   PRINCIPIUL, ȘI DE CE E SINGURA VARIANTĂ ACCEPTABILĂ
   ---------------------------------------------------
   Panoul NU regenerează fișierul din formular. Ar fi mult mai simplu de
   scris, dar ar arunca la fiecare salvare tot ce nu încape în formular:
   comentariile `<!-- … -->` care sunt manualul fișierului, separatoarele
   `---`, ordinea aleasă de om, spațierea lui.

   Aici se schimbă STRICT liniile cerute. Restul fișierului rămâne
   octet cu octet cum era. Consecința care contează: după o salvare din
   panou, fișierul e în continuare editabil de mână din GitHub, cu toate
   instrucțiunile la locul lor. Cele două drumuri de editare nu se bat
   cap în cap — sunt același fișier.

   RELAȚIA CU PARSERUL MOTORULUI (`lib/continut/md.ts`)
   ---------------------------------------------------
   Nu folosim `analizeaza()`: el întoarce valori, nu poziții, iar noi
   avem nevoie de numere de linie ca să putem scrie la loc. Folosim în
   schimb aceleași REGULI (`normalizeaza()` importat de acolo, aceeași
   definiție de câmp, aceeași tratare a comentariilor), ca ce citește
   panoul să fie exact ce citește site-ul.

   Fiecare operație rescanează fișierul de la zero. Un fișier are 200 de
   linii, deci costul e nul, iar alternativa — indici calculați o dată și
   invalidați de prima inserare — e exact felul de bug care corupe
   fișierul altcuiva în tăcere.
   ============================================================ */

import { normalizeaza } from '@/lib/continut/md'

/* ------------------------------------------------------------------ */
/* Scanare                                                            */
/* ------------------------------------------------------------------ */

export interface PozitieBloc {
  /** Titlul de după `##`, exact cum e scris în fișier. */
  titlu: string
  nivel: 2 | 3
  /** Indexul liniei `##`, de la 0. */
  start: number
  /** Prima linie DUPĂ bloc, exclusiv. */
  sfarsit: number
  /** Poziția între frații de același nivel, de la 0. */
  index: number
}

export interface PozitieCamp {
  /** Cheia normalizată — cu ea se caută. */
  cheie: string
  /** Cheia exact cum e scrisă în fișier. Nu se rescrie niciodată. */
  cheieBruta: string
  /** Indexul liniei `Cheie: …`. */
  start: number
  /** Prima linie după valoare, exclusiv. Mai mare decât `start + 1` la câmpurile pe mai multe rânduri. */
  sfarsit: number
  /** Valoarea, cu `\n` între rânduri. */
  valoare: string
}

/**
 * Fiecare linie cu regiunile de comentariu HTML înlocuite de spații.
 *
 * Comentariile trebuie sărite la scanare — un `## Clip de prezentare`
 * citat într-o explicație nu e un bloc, iar un `Meniu PDF:` explicat
 * într-un comentariu nu e câmpul cu acel nume. Motorul face același
 * lucru, cu `faraComentarii()` înainte de parsare.
 *
 * Diferența, și motivul pentru care nu putem doar șterge comentariile:
 * noi avem nevoie de NUMERE DE LINIE stabile, ca să scriem la loc exact
 * unde trebuie. Deci comentariile se „albesc" în copia pe care o
 * analizăm, iar textul original — cu ele întregi — e cel pe care îl
 * rescriem. Lungimea liniilor se păstrează, ca poziția lui `:` să rămână
 * aceeași.
 *
 * O linie devenită goală prin albire era comentariu pur: `esteComentariu`
 * o deosebește de o linie goală adevărată, fiindcă cele două se tratează
 * la fel la închiderea unui câmp, dar altfel la descriere.
 */
interface Curat {
  /** Linia fără comentarii, cu lungimea păstrată. */
  linii: string[]
  /** Linia era comentariu (integral sau parțial) și n-a rămas nimic din ea. */
  esteComentariu: boolean[]
}

function curata(linii: string[]): Curat {
  const rezultat: string[] = []
  const esteComentariu: boolean[] = []
  let deschis = false

  for (const linie of linii) {
    const pastrat = linie.split('')
    let aviaComentariu = false
    let i = 0

    while (i < linie.length) {
      if (!deschis) {
        const d = linie.indexOf('<!--', i)
        if (d === -1) break
        deschis = true
        aviaComentariu = true
        // Albim de la `<!--` până la sfârșitul liniei sau până la `-->`.
        const f = linie.indexOf('-->', d + 4)
        const pana = f === -1 ? linie.length : f + 3
        for (let k = d; k < pana; k++) pastrat[k] = ' '
        if (f !== -1) deschis = false
        i = pana
      } else {
        aviaComentariu = true
        const f = linie.indexOf('-->', i)
        const pana = f === -1 ? linie.length : f + 3
        for (let k = i; k < pana; k++) pastrat[k] = ' '
        if (f !== -1) deschis = false
        i = pana
      }
    }

    // Liniile din mijlocul unui comentariu multi-linie: albite integral.
    if (deschis && !aviaComentariu) {
      for (let k = 0; k < pastrat.length; k++) pastrat[k] = ' '
      aviaComentariu = true
    }

    const text = pastrat.join('')
    rezultat.push(text)
    esteComentariu.push(aviaComentariu && !text.trim())
  }

  return { linii: rezultat, esteComentariu }
}

/**
 * Aceeași regulă ca `esteCamp` din `md.ts`: arată a `Cheie: valoare` ȘI
 * cheia e scurtă. Limita de cuvinte ține o propoziție din descriere
 * („Rezervările se fac astfel: sunați la…") să nu fie luată drept câmp.
 */
function cheieDinLinie(linie: string): string | null {
  const m = linie.match(/^([^:\n]{1,64}):/)
  if (!m) return null
  const cheie = m[1].trim()
  if (!cheie) return null
  if (cheie.split(/\s+/).length > 5) return null
  if (/[.!?]/.test(cheie)) return null
  return cheie
}

/** Toate blocurile `##` și `###`, în ordinea din fișier. */
export function blocuri(text: string): PozitieBloc[] {
  const brute = text.split('\n')
  const { linii } = curata(brute)
  const gasite: PozitieBloc[] = []

  let nr2 = 0
  let nr3 = 0

  for (let i = 0; i < linii.length; i++) {
    const linie = linii[i]
    // `##` la începutul liniei, fără indentare — la fel ca la parser,
    // unde linia e trimmuită înainte de verificare.
    const m = linie.trim().match(/^(#{2,3})(\s+(.*))?$/)
    if (!m) continue
    const nivel = m[1].length as 2 | 3
    if (nivel === 2) {
      nr2++
      nr3 = 0
    } else {
      nr3++
    }
    gasite.push({
      titlu: (m[3] ?? '').trim(),
      nivel,
      start: i,
      sfarsit: linii.length,
      index: (nivel === 2 ? nr2 : nr3) - 1,
    })
  }

  // Sfârșitul unui bloc = următorul bloc de nivel MAI MIC SAU EGAL.
  // Un `###` nu închide un `##`; un `##` închide și `##`-ul, și `###`-ul.
  for (let k = 0; k < gasite.length; k++) {
    for (let j = k + 1; j < gasite.length; j++) {
      if (gasite[j].nivel <= gasite[k].nivel) {
        gasite[k].sfarsit = gasite[j].start
        break
      }
    }
  }

  return gasite
}

/**
 * Câmpurile dintr-un interval de linii.
 *
 * Un câmp rămâne deschis până la prima linie GOALĂ: liniile de sub el i
 * se adaugă, câte una pe rând. Exact regula parserului, fără care o
 * listă scrisă pe rânduri („Include:" cu trei bulinele) ar fi citită ca
 * un câmp cu o singură valoare plus două rânduri de descriere.
 */
export function campuri(text: string, de: number, pana: number): PozitieCamp[] {
  const { linii, esteComentariu } = curata(text.split('\n'))
  const gasite: PozitieCamp[] = []
  let deschis: PozitieCamp | null = null

  for (let i = de; i < Math.min(pana, linii.length); i++) {
    if (esteComentariu[i]) {
      // Un comentariu întrerupe continuarea, ca să nu „înghită" un câmp
      // explicațiile de sub el.
      deschis = null
      continue
    }
    const linie = linii[i]
    const gol = !linie.trim()

    if (gol) {
      deschis = null
      continue
    }
    if (/^#{1,3}(\s|$)/.test(linie.trim())) {
      deschis = null
      continue
    }
    if (/^-{3,}$/.test(linie.trim())) {
      deschis = null
      continue
    }

    const cheieBruta = cheieDinLinie(linie)
    if (cheieBruta) {
      deschis = {
        cheie: normalizeaza(cheieBruta),
        cheieBruta,
        start: i,
        sfarsit: i + 1,
        valoare: linie.slice(linie.indexOf(':') + 1).trim(),
      }
      gasite.push(deschis)
      continue
    }

    if (deschis) {
      const v = linie.trim()
      deschis.valoare = deschis.valoare ? `${deschis.valoare}\n${v}` : v
      deschis.sfarsit = i + 1
    }
  }

  return gasite
}

/**
 * Intervalul de linii care aparțin blocului ÎN SINE, nu copiilor lui.
 *
 * `PozitieBloc.sfarsit` merge până la următorul bloc de nivel egal sau
 * mai mic — deci un `## Mic dejun` din meniu îl include pe tot, cu cele
 * șase `### preparate` ale lui. Câmpurile PROPRII ale categoriei se
 * termină însă la primul `###`.
 *
 * Fără distincția asta, o scriere pe `## Mic dejun` la cheia `Preț` ar
 * nimeri prețul primului preparat — tăcut, și tocmai în fișierul cu cele
 * mai multe câmpuri repetate. Parserul motorului face la fel: un câmp
 * aparține blocului cel mai adânc deschis în acel moment.
 */
function intervalPropriu(text: string, b: PozitieBloc): [number, number] {
  const copil = blocuri(text).find((x) => x.nivel > b.nivel && x.start > b.start && x.start < b.sfarsit)
  return [b.start + 1, copil ? copil.start : b.sfarsit]
}

/* ------------------------------------------------------------------ */
/* Selectarea unui bloc                                               */
/* ------------------------------------------------------------------ */

export interface Selector {
  titlu?: string
  /** Poziția între frații de același nivel, de la 0. */
  index?: number
  nivel?: 2 | 3
  /** Pentru un `###`: titlul lui `##`-ului în care stă. */
  parinte?: string
}

export class EroarePatch extends Error {}

/**
 * Blocul cerut, sau o eroare care spune ce s-a găsit în loc.
 *
 * Potrivirea pe titlu e întâi EXACTĂ (normalizat), apoi „conține" — dar
 * numai dacă „conține" dă exact un rezultat. Un titlu ambiguu e o
 * eroare, nu o alegere la noroc: a scrie peste blocul greșit e cel mai
 * rău lucru care poate ieși de aici.
 */
export function gasesteBloc(text: string, sel: Selector): PozitieBloc {
  const nivel = sel.nivel ?? 2
  let candidati = blocuri(text).filter((b) => b.nivel === nivel)

  if (sel.parinte !== undefined) {
    const p = gasesteBloc(text, { titlu: sel.parinte, nivel: 2 })
    candidati = candidati.filter((b) => b.start > p.start && b.start < p.sfarsit)
  }

  if (sel.index !== undefined) {
    // La `###` indexul e relativ la părinte, deci se numără în felia filtrată.
    const b = sel.parinte !== undefined ? candidati[sel.index] : candidati.find((x) => x.index === sel.index)
    if (!b) throw new EroarePatch(`Nu există blocul cu numărul ${sel.index + 1} (sunt ${candidati.length}).`)
    return b
  }

  if (sel.titlu === undefined) throw new EroarePatch('Selector fără titlu și fără număr.')

  const cerut = normalizeaza(sel.titlu)
  const exacte = candidati.filter((b) => normalizeaza(b.titlu) === cerut)
  if (exacte.length === 1) return exacte[0]
  if (exacte.length > 1) {
    throw new EroarePatch(`Sunt ${exacte.length} blocuri cu titlul „${sel.titlu}". Nu pot alege.`)
  }

  const contin = candidati.filter((b) => normalizeaza(b.titlu).includes(cerut))
  if (contin.length === 1) return contin[0]
  if (contin.length > 1) {
    throw new EroarePatch(
      `„${sel.titlu}" se potrivește cu ${contin.length} blocuri: ${contin.map((b) => `„${b.titlu}"`).join(', ')}.`,
    )
  }

  throw new EroarePatch(
    `Nu găsesc blocul „${sel.titlu}". În fișier sunt: ${candidati.map((b) => `„${b.titlu}"`).join(', ') || '(niciunul)'}.`,
  )
}

/* ------------------------------------------------------------------ */
/* Serializarea unei valori                                           */
/* ------------------------------------------------------------------ */

/**
 * Liniile pe care se scrie un câmp.
 *
 * O valoare cu mai multe elemente se scrie pe mai multe rânduri,
 * aliniate sub primul — și pentru citit, și pentru că regula formatului
 * e că un câmp pe mai multe rânduri NU se mai taie la virgulă. Așa o
 * bulină care conține ea însăși o virgulă rămâne întreagă.
 *
 * Un element singur rămâne pe un rând. Dacă acel unic element conține o
 * virgulă, formatul nu-l poate reprezenta ca listă (`lista()` din md.ts
 * l-ar tăia) — de asta panoul avertizează la scriere, aici nu putem face
 * nimic mai bun decât să respectăm ce a cerut omul.
 */
function liniiCamp(cheieBruta: string, valoare: string): string[] {
  const parti = valoare
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)

  if (parti.length === 0) return [`${cheieBruta}: `]
  if (parti.length === 1) return [`${cheieBruta}: ${parti[0]}`]

  const indent = ' '.repeat(cheieBruta.length + 2)
  return [`${cheieBruta}: ${parti[0]}`, ...parti.slice(1).map((p) => indent + p)]
}

/**
 * Taie un paragraf în rânduri de cel mult `LATIME` caractere, la spații.
 *
 * DE CE, dacă motorul nu-i cere:
 *
 * Fișierele din `date/` sunt scrise de mână cu rândurile rupte pe la 96
 * de coloane. Dacă panoul ar scrie fiecare paragraf pe un singur rând
 * lung, orice descriere editată din panou ar apărea în `git diff` ca o
 * linie uriașă înlocuind trei — imposibil de citit pentru cine verifică
 * ce s-a schimbat, și un stil diferit față de restul fișierului.
 *
 * Pentru motor cele două forme sunt echivalente: `md.ts` lipește
 * rândurile unui paragraf, iar HTML-ul colapsează spațiul alb. Deci
 * rupem rândurile pentru OM.
 */
const LATIME = 96

function infasoara(paragraf: string): string[] {
  const cuvinte = paragraf.split(/\s+/).filter(Boolean)
  if (!cuvinte.length) return []

  const randuri: string[] = []
  let curent = cuvinte[0]
  for (const c of cuvinte.slice(1)) {
    if (curent.length + 1 + c.length <= LATIME) {
      curent += ' ' + c
    } else {
      randuri.push(curent)
      curent = c
    }
  }
  randuri.push(curent)
  return randuri
}

/* ------------------------------------------------------------------ */
/* Operațiile                                                         */
/* ------------------------------------------------------------------ */

export type Operatie =
  | { fel: 'camp'; bloc?: Selector; cheie: string; valoare: string }
  | { fel: 'descriere'; bloc: Selector; text: string }
  | { fel: 'adauga-bloc'; nivel?: 2 | 3; parinte?: string; titlu: string; sablon: string }
  | { fel: 'sterge-bloc'; bloc: Selector }
  | { fel: 'muta-bloc'; bloc: Selector; directie: 'sus' | 'jos' }
  | { fel: 'ordine-campuri'; bloc: Selector; ordine: string[] }
  | { fel: 'sterge-camp'; bloc: Selector; cheie: string }

/** Aplică o operație și întoarce textul nou. Nu modifică intrarea. */
export function aplica(text: string, op: Operatie): string {
  switch (op.fel) {
    case 'camp':
      return setCamp(text, op.bloc, op.cheie, op.valoare)
    case 'descriere':
      return setDescriere(text, op.bloc, op.text)
    case 'adauga-bloc':
      return adaugaBloc(text, op)
    case 'sterge-bloc':
      return stergeBloc(text, op.bloc)
    case 'muta-bloc':
      return mutaBloc(text, op.bloc, op.directie)
    case 'ordine-campuri':
      return ordoneazaCampuri(text, op.bloc, op.ordine)
    case 'sterge-camp':
      return stergeCamp(text, op.bloc, op.cheie)
  }
}

/** Aplică operațiile în ordine. Rescanează după fiecare — vezi capul fișierului. */
export function aplicaToate(text: string, operatii: Operatie[]): string {
  return operatii.reduce(aplica, text)
}

/**
 * Scrie valoarea unui câmp. Dacă lipsește, îl adaugă după ultimul câmp
 * al blocului.
 *
 * `bloc` nedefinit = câmpurile de dinaintea primului `##`. Rar, dar
 * legal în format.
 *
 * O valoare goală NU șterge linia: rămâne `Cheie: `, ca la fișierele
 * livrate (`Stele: `). Câmpul gol e invizibil pe site oricum, iar linia
 * rămasă îi spune gazdei că are unde să scrie.
 */
export function setCamp(text: string, sel: Selector | undefined, cheie: string, valoare: string): string {
  const linii = text.split('\n')
  const cerut = normalizeaza(cheie)

  const [de, pana] = sel
    ? intervalPropriu(text, gasesteBloc(text, sel))
    : [0, blocuri(text)[0]?.start ?? linii.length]

  const existent = campuri(text, de, pana).find((c) => c.cheie === cerut)

  if (existent) {
    // VALOARE NESCHIMBATĂ = FIȘIER NEATINS.
    //
    // Un formular trimite toate câmpurile, nu doar pe cel editat. Fără
    // ieșirea asta, o salvare în care gazda a schimbat un preț ar rescrie
    // și celelalte douăzeci de câmpuri — cu indentarea noastră canonică,
    // nu cu a lor. Diff-ul din GitHub ar arăta douăzeci de linii atinse
    // în loc de una, iar alinierea alesă de om s-ar pierde la prima
    // salvare. Comparăm valorile, nu textul: `Preț: 380` și
    // `Preț:   380` au aceeași valoare, deci nu e nimic de făcut.
    if (existent.valoare === valoare.split('\n').map((x) => x.trim()).filter(Boolean).join('\n')) {
      return text
    }
    const noi = liniiCamp(existent.cheieBruta, valoare)
    return [...linii.slice(0, existent.start), ...noi, ...linii.slice(existent.sfarsit)].join('\n')
  }

  // Câmp nou. Îl punem după ultimul câmp existent, ca să nu ajungă în
  // mijlocul descrierii sau după un comentariu explicativ.
  const toate = campuri(text, de, pana)
  const dupa = toate.length ? toate[toate.length - 1].sfarsit : de
  const noi = liniiCamp(cheie, valoare)
  return [...linii.slice(0, dupa), ...noi, ...linii.slice(dupa)].join('\n')
}

/** Șterge linia unui câmp cu totul. Pentru `setari.md`, unde un rând lipsă = secțiune scoasă. */
export function stergeCamp(text: string, sel: Selector, cheie: string): string {
  const linii = text.split('\n')
  const b = gasesteBloc(text, sel)
  const [de, pana] = intervalPropriu(text, b)
  const c = campuri(text, de, pana).find((x) => x.cheie === normalizeaza(cheie))
  if (!c) return text
  return [...linii.slice(0, c.start), ...linii.slice(c.sfarsit)].join('\n')
}

/**
 * Rescrie ORDINEA câmpurilor unui bloc, fără să le schimbe valorile.
 *
 * `setari.md` → `## Secțiuni pe prima pagină` folosește ordinea rândurilor
 * ca ordine a secțiunilor pe site. Cheile care nu apar în `ordine` rămân
 * la sfârșit, în ordinea lor de dinainte — nu dispar dacă panoul nu le
 * cunoaște.
 */
export function ordoneazaCampuri(text: string, sel: Selector, ordine: string[]): string {
  const linii = text.split('\n')
  const b = gasesteBloc(text, sel)
  const [de, pana] = intervalPropriu(text, b)
  const toate = campuri(text, de, pana)
  if (toate.length < 2) return text

  const cerute = ordine.map(normalizeaza)
  const rang = (c: PozitieCamp) => {
    const i = cerute.indexOf(c.cheie)
    return i === -1 ? cerute.length : i
  }
  const sortate = [...toate].sort((x, y) => rang(x) - rang(y) || x.start - y.start)

  // Se rescriu doar liniile câmpurilor, în blocul lor compact. Ce e între
  // ele — comentarii, rânduri goale — rămâne unde era, dar câmpurile se
  // adună la poziția primului. E singura variantă care nu poate încurca
  // o explicație cu un câmp.
  const primul = toate[0].start
  const ultimul = toate[toate.length - 1].sfarsit
  const intre = linii.slice(primul, ultimul).filter((l, k) => {
    const abs = primul + k
    return !toate.some((c) => abs >= c.start && abs < c.sfarsit)
  })

  const scrise = sortate.flatMap((c) => liniiCamp(c.cheieBruta, c.valoare))
  return [...linii.slice(0, primul), ...scrise, ...intre, ...linii.slice(ultimul)].join('\n')
}

/**
 * Rescrie descrierea unui bloc — paragrafele libere de sub câmpuri.
 *
 * „Liber" = ce nu e nici titlu, nici câmp sau continuare de câmp, nici
 * comentariu, nici separator. Se șterg toate acele linii și se scrie
 * textul nou la poziția PRIMEI dintre ele, ca să nu sară descrierea
 * deasupra câmpurilor sau sub un comentariu de final.
 */
export function setDescriere(text: string, sel: Selector, descriere: string): string {
  const brute = text.split('\n')
  const { linii, esteComentariu } = curata(brute)
  const b = gasesteBloc(text, sel)
  const [de, pana] = intervalPropriu(text, b)
  const camp = campuri(text, de, pana)

  const esteDescriere = (i: number) => {
    if (esteComentariu[i]) return false
    const l = linii[i].trim()
    if (!l) return false
    if (/^#{1,3}(\s|$)/.test(l)) return false
    if (/^-{3,}$/.test(l)) return false
    return !camp.some((c) => i >= c.start && i < c.sfarsit)
  }

  const aleDescrierii: number[] = []
  for (let i = de; i < pana; i++) if (esteDescriere(i)) aleDescrierii.push(i)

  const paragrafe = descriere
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
  const noi = paragrafe.flatMap((p, k) => (k === 0 ? infasoara(p) : ['', ...infasoara(p)]))

  // Neschimbată: nu rescriem nimic. Vezi nota de la `setCamp`.
  const acum = aleDescrierii.length
    ? (() => {
        const p: string[] = []
        let curent: string[] = []
        for (let i = de; i < pana; i++) {
          if (esteDescriere(i)) {
            curent.push(linii[i].trim())
          } else if (curent.length) {
            p.push(curent.join(' '))
            curent = []
          }
        }
        if (curent.length) p.push(curent.join(' '))
        return p.join('\n\n')
      })()
    : ''
  if (acum === paragrafe.join('\n\n')) return text

  if (aleDescrierii.length) {
    const primul = aleDescrierii[0]
    const ultimul = aleDescrierii[aleDescrierii.length - 1] + 1
    // Se păstrează comentariile care stăteau între paragrafele vechi — sunt
    // explicații ale fișierului, nu conținut de rescris.
    const pastrate = brute.slice(primul, ultimul).filter((_, k) => esteComentariu[primul + k] && brute[primul + k].trim() !== '')
    return [...brute.slice(0, primul), ...noi, ...pastrate, ...brute.slice(ultimul)].join('\n')
  }

  if (!noi.length) return text

  // Nu exista descriere. Se pune după ultimul câmp, despărțită cu un rând gol.
  const dupa = camp.length ? camp[camp.length - 1].sfarsit : de
  return [...brute.slice(0, dupa), '', ...noi, ...brute.slice(dupa)].join('\n')
}

/**
 * Adaugă un bloc nou la sfârșitul containerului lui.
 *
 * `sablon` e corpul blocului (câmpurile și descrierea), fără linia `##`.
 * Vine din schema panoului, deci blocul nou pornește cu exact câmpurile
 * pe care le știe formularul — nu cu un bloc gol în care gazda trebuie
 * să ghicească ce se poate scrie.
 *
 * Containerul e fișierul (pentru `##`) sau blocul părinte (pentru `###`).
 */
export function adaugaBloc(
  text: string,
  op: { nivel?: 2 | 3; parinte?: string; titlu: string; sablon: string },
): string {
  const linii = text.split('\n')
  const nivel = op.nivel ?? 2
  const diez = '#'.repeat(nivel)

  let unde: number
  if (op.parinte !== undefined) {
    unde = gasesteBloc(text, { titlu: op.parinte, nivel: 2 }).sfarsit
  } else {
    const deNivel = blocuri(text).filter((b) => b.nivel === nivel)
    unde = deNivel.length ? deNivel[deNivel.length - 1].sfarsit : linii.length
  }

  // Se sare peste rândurile goale de la coada containerului, ca blocul nou
  // să nu ajungă după trei rânduri albe.
  while (unde > 0 && !linii[unde - 1].trim()) unde--

  const corp = op.sablon.split('\n')
  const bloc = ['', `${diez} ${op.titlu}`, ...corp]
  return [...linii.slice(0, unde), ...bloc, ...linii.slice(unde)].join('\n')
}

/** Șterge un bloc întreg, cu tot cu rândul lui gol de dinainte. */
export function stergeBloc(text: string, sel: Selector): string {
  const linii = text.split('\n')
  const b = gasesteBloc(text, sel)

  let de = b.start
  // Rândul gol dinaintea blocului îi aparținea; altfel rămâne o gaură.
  while (de > 0 && !linii[de - 1].trim()) de--
  let pana = b.sfarsit
  while (pana > de && !linii[pana - 1].trim()) pana--

  return [...linii.slice(0, de), ...linii.slice(pana)].join('\n')
}

/**
 * Mută un bloc peste fratele lui de dinainte sau de după.
 *
 * Ordinea din fișier e ordinea de pe site — și, la camere și oferte, e
 * și legătura cu traducerea din `en/` (`lib/i18n/perechi.ts` le
 * împerechează după poziție). Panoul avertizează despre asta la salvare.
 */
export function mutaBloc(text: string, sel: Selector, directie: 'sus' | 'jos'): string {
  const b = gasesteBloc(text, sel)
  const frati = blocuri(text).filter((x) => x.nivel === b.nivel)

  if (b.nivel === 3) {
    // Un `###` se mută doar între frații din același `##`.
    const parinte = blocuri(text)
      .filter((x) => x.nivel === 2)
      .find((p) => b.start > p.start && b.start < p.sfarsit)
    if (parinte) {
      const local = frati.filter((x) => x.start > parinte.start && x.start < parinte.sfarsit)
      return schimba(text, local, b, directie)
    }
  }

  return schimba(text, frati, b, directie)
}

function schimba(text: string, frati: PozitieBloc[], b: PozitieBloc, directie: 'sus' | 'jos'): string {
  const linii = text.split('\n')
  const i = frati.findIndex((x) => x.start === b.start)
  const j = directie === 'sus' ? i - 1 : i + 1
  if (i === -1 || j < 0 || j >= frati.length) {
    throw new EroarePatch(directie === 'sus' ? 'Blocul e deja primul.' : 'Blocul e deja ultimul.')
  }

  const primul = frati[Math.min(i, j)]
  const doi = frati[Math.max(i, j)]
  // Frații sunt adiacenți: sfârșitul primului E începutul celui de-al doilea.
  const a = linii.slice(primul.start, primul.sfarsit)
  const c = linii.slice(doi.start, doi.sfarsit)

  return [...linii.slice(0, primul.start), ...c, ...a, ...linii.slice(doi.sfarsit)].join('\n')
}

/* ------------------------------------------------------------------ */
/* Citire, pentru formular                                            */
/* ------------------------------------------------------------------ */

export interface BlocCitit {
  titlu: string
  index: number
  campuri: Record<string, string>
  descriere: string
}

/** Blocurile de nivelul cerut, cu valorile lor — ce umple formularul. */
export function citesteBlocuri(text: string, nivel: 2 | 3 = 2, parinte?: string): BlocCitit[] {
  const { linii, esteComentariu } = curata(text.split('\n'))
  let lista = blocuri(text).filter((b) => b.nivel === nivel)

  if (parinte !== undefined) {
    const p = gasesteBloc(text, { titlu: parinte, nivel: 2 })
    lista = lista.filter((b) => b.start > p.start && b.start < p.sfarsit)
  }

  return lista.map((b, i) => {
    const [de, pana] = intervalPropriu(text, b)
    const camp = campuri(text, de, pana)
    const valori: Record<string, string> = {}
    for (const c of camp) valori[c.cheie] = c.valoare

    const paragrafe: string[] = []
    let curent: string[] = []
    for (let k = de; k < pana; k++) {
      const l = linii[k].trim()
      const esteCamp = camp.some((c) => k >= c.start && k < c.sfarsit)
      if (esteComentariu[k] || esteCamp || /^#{1,3}(\s|$)/.test(l) || /^-{3,}$/.test(l)) continue
      if (!l) {
        if (curent.length) paragrafe.push(curent.join(' '))
        curent = []
        continue
      }
      curent.push(l)
    }
    if (curent.length) paragrafe.push(curent.join(' '))

    return { titlu: b.titlu, index: parinte !== undefined ? i : b.index, campuri: valori, descriere: paragrafe.join('\n\n') }
  })
}

/** Câmpurile de dinaintea primului `##`. */
export function citesteCampuriGlobale(text: string): Record<string, string> {
  const primul = blocuri(text)[0]?.start ?? text.split('\n').length
  const valori: Record<string, string> = {}
  for (const c of campuri(text, 0, primul)) valori[c.cheie] = c.valoare
  return valori
}
