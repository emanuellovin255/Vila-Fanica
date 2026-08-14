/* ============================================================
   proba-patch.ts — probele editorului chirurgical al panoului.

     npm run proba-patch

   Rulează pe fișierele REALE din `date/` și `en/`, nu pe exemple
   inventate: dacă cineva schimbă un fișier de conținut într-un fel la
   care patch.ts nu se aștepta, probele cad ÎNAINTE ca gazda să apese
   Salvează în panou.

   Ce se verifică, în ordinea importanței:

   1. Panoul citește exact ce citește motorul — aceleași blocuri,
      aceleași câmpuri, același text. Dacă cele două ar diverge, gazda
      ar edita altceva decât ce se vede pe site.
   2. O rescriere IDENTICĂ nu atinge fișierul. Un formular trimite toate
      câmpurile la fiecare salvare; fără asta, prima salvare ar reformata
      tot fișierul și ar face diff-urile din GitHub ilizibile.
   3. O schimbare atinge STRICT liniile ei. Comentariile `<!-- … -->`,
      separatoarele și restul câmpurilor rămân neatinse.
   4. Operațiile inverse se anulează: adaugă+șterge și mută-sus+mută-jos
      refac fișierul octet cu octet.

   Se rulează înainte de `npm run verifica` la orice modificare în
   `lib/admin/patch.ts` sau în formatul fișierelor din `date/`.
   ============================================================ */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { analizeaza, normalizeaza } from '../lib/continut/md'
import {
  blocuri,
  campuri,
  citesteBlocuri,
  gasesteBloc,
  setCamp,
  setDescriere,
  adaugaBloc,
  stergeBloc,
  mutaBloc,
  ordoneazaCampuri,
  stergeCamp,
} from '../lib/admin/patch'
import { FISIERE_PANOU, campuriDin, type Camp } from '../lib/admin/schema'
import { FISIERE, rezolva } from '../lib/continut/fisiere'

import { fileURLToPath } from 'node:url'

const RADACINA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATE = path.join(RADACINA, 'date')

let treceri = 0
let picari = 0
let sarite = 0

function ok(nume: string, condiție: boolean, detaliu = '') {
  if (condiție) {
    treceri++
  } else {
    picari++
    console.log(`  PICAT  ${nume}${detaliu ? '\n         ' + detaliu : ''}`)
  }
}

/**
 * O probă care n-are pe ce rula.
 *
 * NU e o trecere și NU e o picare. Probele astea se rulează pe conținutul
 * REAL al site-ului, iar site-urile diferă: unul n-are restaurant, altul
 * n-are oferte. O probă sărită se numără separat și se spune la final —
 * altfel, un site căruia îi lipsesc jumătate din fișiere ar raporta „toate
 * probele trec" fără să fi probat mai nimic.
 */
function sari(sectiune: string, motiv: string) {
  sarite++
  console.log(`  SĂRIT  ${sectiune} — ${motiv}`)
}

/* ------------------------------------------------------------------ */
/* Subiectele probelor se ALEG din fișiere, nu se scriu aici           */
/*                                                                     */
/* Probele verifică `patch.ts`, nu conținutul unui site anume. Scrise   */
/* cu „Cameră dublă cu balcon" în ele, ar fi rulat într-un singur repo. */
/* ------------------------------------------------------------------ */

/** Textul unui fișier de conținut, sau `null` dacă site-ul nu-l are. */
function textDate(nume: string): string | null {
  const cale = rezolva(DATE, nume)
  return cale ? readFileSync(cale, 'utf8') : null
}

interface Subiect {
  titlu: string
  cheie: string
  valoare: string
}

/**
 * Primul bloc `##` care are un câmp completat — și câmpul acela.
 *
 * `exclude` sare peste chei nepotrivite pentru proba cerută: una care
 * apare de două ori în fișier, sau una a cărei valoare e pe mai multe
 * rânduri când proba numără linii.
 */
function subiect(text: string, exclude: (cheie: string, valoare: string) => boolean = () => false): Subiect | null {
  for (const b of citesteBlocuri(text, 2)) {
    for (const [cheie, valoare] of Object.entries(b.campuri)) {
      if (!valoare.trim() || valoare.includes('\n')) continue
      if (exclude(cheie, valoare)) continue
      return { titlu: b.titlu, cheie, valoare }
    }
  }
  return null
}

/** Titlul unui bloc care nu e primul — pentru probele de mutare și de descriere. */
function titluBloc(text: string, index: number): string | null {
  return citesteBlocuri(text, 2)[index]?.titlu ?? null
}

/**
 * Câte linii s-au schimbat REAL între două texte — cea mai lungă
 * subsecvență comună, ca `git diff`. O comparație linie-cu-linie ar
 * raporta „825 de linii diferite" pentru o singură linie inserată.
 */
function liniiDiferite(a: string, b: string): number {
  const la = a.split('\n')
  const lb = b.split('\n')
  const n = la.length
  const m = lb.length
  // LCS pe rânduri, tabel rulant.
  let prev = new Array(m + 1).fill(0)
  for (let i = 1; i <= n; i++) {
    const cur = new Array(m + 1).fill(0)
    for (let j = 1; j <= m; j++) {
      cur[j] = la[i - 1] === lb[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1])
    }
    prev = cur
  }
  const comune = prev[m]
  return n - comune + (m - comune)
}

/** Comentariile din text, ca listă — trebuie să supraviețuiască orice operație. */
function comentarii(text: string): string[] {
  return text.match(/<!--[\s\S]*?-->/g) ?? []
}

const fisiere = readdirSync(DATE).filter((f) => f.endsWith('.md') && f !== 'README.md')

console.log('\n=== 1. Scanarea vede aceleași blocuri ca parserul motorului ===')
for (const f of fisiere) {
  const text = readFileSync(path.join(DATE, f), 'utf8')
  const alMeu = blocuri(text).filter((b) => b.nivel === 2)
  const alMotorului = analizeaza(text).blocuri
  ok(
    `${f}: număr de blocuri`,
    alMeu.length === alMotorului.length,
    `patch=${alMeu.length} motor=${alMotorului.length}`,
  )
  for (let i = 0; i < Math.min(alMeu.length, alMotorului.length); i++) {
    ok(`${f}: titlu #${i}`, alMeu[i].titlu === alMotorului[i].titlu, `„${alMeu[i].titlu}" vs „${alMotorului[i].titlu}"`)
  }
}

console.log('\n=== 2. Câmpurile citite sunt identice cu ale motorului ===')
for (const f of fisiere) {
  const text = readFileSync(path.join(DATE, f), 'utf8')
  const alMotorului = analizeaza(text).blocuri
  const alMeu = citesteBlocuri(text, 2)
  for (let i = 0; i < Math.min(alMeu.length, alMotorului.length); i++) {
    const m = alMotorului[i]
    const p = alMeu[i]
    for (const [cheie, valoare] of m.campuri) {
      ok(
        `${f} / „${m.titlu}" / ${cheie}`,
        p.campuri[cheie] === valoare,
        `patch=${JSON.stringify(p.campuri[cheie])} motor=${JSON.stringify(valoare)}`,
      )
    }
    // Descrierile se compară cu spațiul alb normalizat, INTENȚIONAT.
    //
    // `md.ts` lipește rândurile unui paragraf cu `\n\n`, iar textul întreg
    // ajunge într-un singur `<p>` (sau într-un `<meta description>`), unde
    // HTML colapsează spațiul alb. Deci „fără cost\n\nsuplimentar" și
    // „fără cost suplimentar" sunt același lucru pe pagină. Panoul arată
    // forma citibilă într-un textarea; ce trebuie să se potrivească e
    // TEXTUL, nu spațiile dintre rânduri.
    const spatii = (x: string) => x.replace(/\s+/g, ' ').trim()
    ok(
      `${f} / „${m.titlu}" / descriere`,
      spatii(p.descriere) === spatii(m.text),
      `patch=${JSON.stringify(p.descriere.slice(0, 70))} motor=${JSON.stringify(m.text.slice(0, 70))}`,
    )
  }
}

/** Fișierul cu cele mai multe blocuri `##` — subiectul probelor de structură. */
const CU_BLOCURI = (() => {
  let cel: { nume: string; text: string; n: number } | null = null
  for (const f of fisiere) {
    const text = readFileSync(path.join(DATE, f), 'utf8')
    const n = citesteBlocuri(text, 2).length
    if (!cel || n > cel.n) cel = { nume: f, text, n }
  }
  return cel
})()

console.log('\n=== 3. setCamp schimbă EXACT o linie ===')
;(() => {
  const text = textDate(FISIERE.camere) ?? textDate(FISIERE.oferte) ?? CU_BLOCURI?.text
  if (!text) return sari('3', 'niciun fișier de conținut cu blocuri')
  const s = subiect(text)
  if (!s) return sari('3', 'niciun bloc cu un câmp completat pe un rând')

  const nou = setCamp(text, { titlu: s.titlu }, s.cheie, 'PROBĂ-999')
  ok('o singură linie atinsă', liniiDiferite(text, nou) === 2, `${liniiDiferite(text, nou)} (o linie scoasă + una pusă)`)
  ok(
    'motorul citește valoarea nouă',
    analizeaza(nou).blocuri.find((b) => b.titlu === s.titlu)?.campuri.get(s.cheie) === 'PROBĂ-999',
  )

  // Cheia rămâne scrisă cum era în fișier — cu diacriticele și majuscula ei.
  // `setCamp` primește cheia NORMALIZATĂ; dacă ar rescrie-o așa, fișierul
  // s-ar umple încet de „Pret de la:" în loc de „Preț de la:".
  const randOriginal = text
    .split('\n')
    .find((l) => l.includes(':') && normalizeaza(l.slice(0, l.indexOf(':'))) === s.cheie)!
  const cheieScrisa = randOriginal.slice(0, randOriginal.indexOf(':') + 1)
  ok('cheia păstrează scrierea din fișier', nou.includes(`${cheieScrisa} PROBĂ-999`), cheieScrisa)

  ok('comentariile intacte', JSON.stringify(comentarii(text)) === JSON.stringify(comentarii(nou)))

  const vechi = analizeaza(text).blocuri
  const dupa = analizeaza(nou).blocuri
  ok(
    'restul blocurilor neschimbate',
    vechi.every((b, i) => (b.titlu !== s.titlu ? b.text === dupa[i].text : true)),
  )
})()

console.log('\n=== 4. setCamp cu cheie scrisă fără diacritice găsește câmpul ===')
;(() => {
  const text = textDate(FISIERE.camere) ?? textDate(FISIERE.oferte) ?? CU_BLOCURI?.text
  if (!text) return sari('4', 'niciun fișier de conținut cu blocuri')
  const s = subiect(text)
  if (!s) return sari('4', 'niciun bloc cu un câmp completat pe un rând')

  // `s.cheie` e deja normalizată (fără diacritice); majusculele o duc și mai
  // departe de cum e scrisă în fișier.
  const nou = setCamp(text, { titlu: s.titlu }, s.cheie.toUpperCase(), 'PROBĂ-777')
  ok(
    'tolerant la diacritice și majuscule',
    analizeaza(nou).blocuri.find((b) => b.titlu === s.titlu)?.campuri.get(s.cheie) === 'PROBĂ-777',
  )
  ok('tot o singură linie atinsă', liniiDiferite(text, nou) === 2, `${liniiDiferite(text, nou)}`)
})()

console.log('\n=== 5. Listă pe mai multe rânduri: scrisă aliniat, citită întreagă ===')
;(() => {
  const text = textDate(FISIERE.oferte) ?? textDate(FISIERE.camere) ?? CU_BLOCURI?.text
  if (!text) return sari('5', 'niciun fișier de conținut cu blocuri')

  // Virgulele din elemente sunt tot rostul probei: o listă pe mai multe
  // rânduri NU se taie la virgulă, spre deosebire de una pe un rând.
  const bucati = ['Cazare 3 nopți, cu mic dejun', 'Acces la piscină, gratuit', 'O excursie cu barca']

  // Se scrie peste un câmp care EXISTĂ, nu într-unul nou: înlocuirea și
  // inserarea sunt două căi diferite prin `patch.ts`, iar cea de înlocuire e
  // cea pe care o folosește formularul la fiecare salvare.
  const s = subiect(text)
  if (!s) return sari('5', 'niciun bloc cu un câmp completat')

  const nou = setCamp(text, { titlu: s.titlu }, s.cheie, bucati.join('\n'))
  const b = analizeaza(nou).blocuri.find((x) => x.titlu === s.titlu)!
  const citit = b.campuri.get(s.cheie)!.split('\n')
  ok('trei elemente, cu virgulele lor', citit.length === 3, JSON.stringify(citit))
  ok('virgula din primul element a rămas', citit[0] === 'Cazare 3 nopți, cu mic dejun', citit[0])
  ok('comentariile intacte', JSON.stringify(comentarii(text)) === JSON.stringify(comentarii(nou)))

  // Și pe calea de INSERARE, cu o cheie care nu există în bloc.
  const inserat = setCamp(text, { titlu: s.titlu }, 'Probă listă', bucati.join('\n'))
  const citit2 = analizeaza(inserat).blocuri.find((x) => x.titlu === s.titlu)!.campuri.get('proba lista')!.split('\n')
  ok('inserarea păstrează tot trei elemente', citit2.length === 3, JSON.stringify(citit2))
  ok('inserarea păstrează virgula', citit2[0] === 'Cazare 3 nopți, cu mic dejun', citit2[0])
})()

console.log('\n=== 6. Câmp inexistent: se adaugă după ultimul câmp, nu în descriere ===')
;(() => {
  const text = textDate(FISIERE.camere) ?? CU_BLOCURI?.text
  if (!text) return sari('6', 'niciun fișier de conținut cu blocuri')
  // Un bloc care are ȘI câmpuri, ȘI descriere — altfel „descrierea nu s-a
  // atins" n-ar proba nimic.
  const b0 = citesteBlocuri(text, 2).find((b) => Object.keys(b.campuri).length > 0 && b.descriere.trim())
  if (!b0) return sari('6', 'niciun bloc cu și câmpuri, și descriere')
  const titlu = b0.titlu

  const nou = setCamp(text, { titlu }, 'Probă câmp nou', 'da')
  const b = analizeaza(nou).blocuri.find((x) => x.titlu === titlu)!
  ok('câmpul nou e citit', b.campuri.get('proba camp nou') === 'da', JSON.stringify(b.campuri.get('proba camp nou')))
  const vechiB = analizeaza(text).blocuri.find((x) => x.titlu === titlu)!
  ok('descrierea nu s-a atins', b.text === vechiB.text, `\n  vechi: ${vechiB.text.slice(0, 80)}\n  nou:   ${b.text.slice(0, 80)}`)
  ok('celelalte câmpuri neatinse', [...vechiB.campuri].every(([k, v]) => b.campuri.get(k) === v))
  ok('exact o linie în plus, nimic scos', liniiDiferite(text, nou) === 1, `${liniiDiferite(text, nou)}`)

  // Și un câmp care EXISTĂ, dar e gol: e o schimbare de valoare, nu o inserare.
  const gol = Object.entries(b0.campuri).find(([, v]) => !v.trim())
  if (!gol) {
    sari('6 (câmp existent gol)', `blocul „${titlu}" n-are niciun câmp gol`)
    return
  }
  const nou2 = setCamp(text, { titlu }, gol[0], 'Nou')
  ok('câmp existent gol: o linie atinsă', liniiDiferite(text, nou2) === 2, `${liniiDiferite(text, nou2)}`)
  ok(
    'valoarea a ajuns acolo',
    analizeaza(nou2).blocuri.find((x) => x.titlu === titlu)!.campuri.get(gol[0]) === 'Nou',
  )
})()

console.log('\n=== 7. setDescriere rescrie doar proza ===')
;(() => {
  const text = textDate(FISIERE.camere) ?? CU_BLOCURI?.text
  if (!text) return sari('7', 'niciun fișier de conținut cu blocuri')
  const titlu = titluBloc(text, 1) ?? titluBloc(text, 0)
  if (!titlu) return sari('7', 'fișierul n-are blocuri')

  const nou = setDescriere(text, { titlu }, 'Un paragraf nou.\n\nȘi al doilea.')
  const b = analizeaza(nou).blocuri.find((x) => x.titlu === titlu)!
  ok('descrierea e cea nouă', b.text === 'Un paragraf nou.\n\nȘi al doilea.', JSON.stringify(b.text))
  const vechiB = analizeaza(text).blocuri.find((x) => x.titlu === titlu)!
  ok('câmpurile neatinse', [...vechiB.campuri].every(([k, v]) => b.campuri.get(k) === v))
  ok('comentariile intacte', JSON.stringify(comentarii(text)) === JSON.stringify(comentarii(nou)))
  ok(
    'celelalte blocuri neatinse',
    analizeaza(text).blocuri.every((x, i) => (x.titlu === titlu ? true : x.text === analizeaza(nou).blocuri[i].text)),
  )
})()

console.log('\n=== 7b. Descrierea scrisă din panou se rupe pe rânduri, ca fișierul ===')
;(() => {
  const text = textDate(FISIERE.camere) ?? CU_BLOCURI?.text
  if (!text) return sari('7b', 'niciun fișier de conținut cu blocuri')
  const titlu = titluBloc(text, 0)
  if (!titlu) return sari('7b', 'fișierul n-are blocuri')

  const lung =
    'Cameră spațioasă cu balcon propriu, vedere directă spre lac, pat matrimonial, ' +
    'aer condiționat, minifrigider, televizor LCD și baie proprie cu cabină de duș și uscător de păr.'
  const nou = setDescriere(text, { titlu }, lung)
  // Doar rândurile BLOCULUI editat — și alte blocuri au descrieri lungi.
  const b = gasesteBloc(nou, { titlu })
  const randuri = nou.split('\n')
  const camp = campuri(nou, b.start + 1, b.sfarsit)
  const alDescrierii = randuri.slice(b.start + 1, b.sfarsit).filter((l, k) => {
    const abs = b.start + 1 + k
    const e = l.trim()
    if (!e || e === '---') return false
    return !camp.some((c) => abs >= c.start && abs < c.sfarsit)
  })
  ok('s-a rupt pe mai multe rânduri', alDescrierii.length >= 2, `${alDescrierii.length} rânduri`)
  ok('niciun rând peste 96 de caractere', alDescrierii.every((l) => l.length <= 96), JSON.stringify(alDescrierii.map((l) => l.length)))
  const citit = analizeaza(nou).blocuri.find((x) => x.titlu === titlu)!.text
  ok('motorul citește exact textul dat', citit.replace(/\s+/g, ' ').trim() === lung, JSON.stringify(citit.slice(0, 80)))
  ok('comentariile intacte', JSON.stringify(comentarii(text)) === JSON.stringify(comentarii(nou)))
})()

console.log('\n=== 8. adaugaBloc / stergeBloc — dus-întors curat ===')
;(() => {
  const text = textDate(FISIERE.recenzii) ?? CU_BLOCURI?.text
  if (!text) return sari('8', 'niciun fișier de conținut')
  const inainte = analizeaza(text).blocuri.length
  const cu = adaugaBloc(text, {
    titlu: 'O probă de bloc',
    sablon: 'Autor: Ion Probă\nSursă: Google\nNotă: 5\n\nText de probă.',
  })
  const dupaAdaugare = analizeaza(cu).blocuri
  ok('un bloc în plus', dupaAdaugare.length === inainte + 1)
  const nou = dupaAdaugare[dupaAdaugare.length - 1]
  ok('e ultimul', nou.titlu === 'O probă de bloc', nou.titlu)
  ok('câmpurile lui se citesc', nou.campuri.get('autor') === 'Ion Probă' && nou.campuri.get('sursa') === 'Google')
  ok('descrierea lui se citește', nou.text === 'Text de probă.', JSON.stringify(nou.text))

  const fara = stergeBloc(cu, { titlu: 'O probă de bloc' })
  ok('ștergerea reface fișierul exact', fara === text, `${liniiDiferite(fara, text)} linii diferite`)
})()

console.log('\n=== 9. mutaBloc — schimbă doar ordinea ===')
;(() => {
  // Mută blocul 1 în jos, deci fișierul trebuie să aibă cel puțin trei.
  const candidat = [textDate(FISIERE.recenzii), CU_BLOCURI?.text].find(
    (t): t is string => !!t && citesteBlocuri(t, 2).length >= 3,
  )
  if (!candidat) return sari('9', 'niciun fișier cu cel puțin trei blocuri')
  const text = candidat
  const inainte = analizeaza(text).blocuri.map((b) => b.titlu)
  const jos = mutaBloc(text, { index: 1 }, 'jos')
  const dupa = analizeaza(jos).blocuri.map((b) => b.titlu)
  const asteptat = [...inainte]
  ;[asteptat[1], asteptat[2]] = [asteptat[2], asteptat[1]]
  ok('ordinea s-a schimbat corect', JSON.stringify(dupa) === JSON.stringify(asteptat), `\n  ${JSON.stringify(dupa)}\n  ${JSON.stringify(asteptat)}`)
  ok('conținutul blocurilor e neatins', analizeaza(jos).blocuri.every((b) => {
    const orig = analizeaza(text).blocuri.find((x) => x.titlu === b.titlu)!
    return orig.text === b.text && [...orig.campuri].every(([k, v]) => b.campuri.get(k) === v)
  }))
  const sus = mutaBloc(jos, { index: 2 }, 'sus')
  ok('mutarea înapoi reface fișierul', sus === text, `${liniiDiferite(sus, text)} linii diferite`)
})()

console.log('\n=== 10. setari.md — comutatoare și reordonare de secțiuni ===')
;(() => {
  const cale = path.join(RADACINA, 'setari.md')
  if (!existsSync(cale)) return sari('10', 'site-ul n-are setari.md')
  const text = readFileSync(cale, 'utf8')

  const blocuriSetari = citesteBlocuri(text, 2)
  // Blocul cu cele mai multe comutatoare — de obicei „Secțiuni pe prima
  // pagină", dar numele blocurilor din setari.md nu se presupune aici.
  const celMare = [...blocuriSetari].sort((a, b) => Object.keys(b.campuri).length - Object.keys(a.campuri).length)[0]
  if (!celMare || Object.keys(celMare.campuri).length < 2) {
    return sari('10', 'setari.md n-are niciun bloc cu cel puțin două câmpuri')
  }

  // Subiectul preferat: o cheie care apare în DOUĂ blocuri — un modul oprit
  // de tot vs. o secțiune ascunsă de pe prima pagină poartă același nume.
  // Acolo se vede dacă selectorul atinge doar blocul cerut; o cheie unică
  // n-ar proba nimic despre asta.
  let subiectul: { bloc: (typeof blocuriSetari)[number]; cheie: string; geaman: (typeof blocuriSetari)[number] | null } | null = null
  for (const b of blocuriSetari) {
    for (const cheie of Object.keys(b.campuri)) {
      const geaman = blocuriSetari.find((x) => x !== b && cheie in x.campuri)
      if (geaman) {
        subiectul = { bloc: b, cheie, geaman }
        break
      }
    }
    if (subiectul) break
  }
  if (!subiectul) {
    sari('10 (cheie în două blocuri)', 'nicio cheie nu apare în două blocuri din setari.md')
    const [primaCheie] = Object.keys(celMare.campuri)
    subiectul = { bloc: celMare, cheie: primaCheie, geaman: null }
  }

  const { bloc, cheie, geaman } = subiectul
  const opus = bloc.campuri[cheie].trim() === 'nu' ? 'da' : 'nu'
  const comutat = setCamp(text, { titlu: bloc.titlu }, cheie, opus)
  ok('comutatorul s-a schimbat', citesteBlocuri(comutat, 2).find((b) => b.titlu === bloc.titlu)?.campuri[cheie] === opus)
  ok('o singură linie atinsă', liniiDiferite(text, comutat) === 2, `${liniiDiferite(text, comutat)}`)
  ok('comentariile din setari.md intacte', JSON.stringify(comentarii(text)) === JSON.stringify(comentarii(comutat)))

  if (geaman) {
    const dupa = citesteBlocuri(comutat, 2).find((b) => b.titlu === geaman.titlu)!
    ok(
      `„${cheie}" din „${geaman.titlu}" NU s-a atins`,
      dupa.campuri[cheie] === geaman.campuri[cheie],
      dupa.campuri[cheie],
    )
  }

  const ultimaCheie = Object.keys(celMare.campuri).at(-1)!
  const scos = stergeCamp(text, { titlu: celMare.titlu }, ultimaCheie)
  const s2 = citesteBlocuri(scos, 2).find((b) => b.titlu === celMare.titlu)!
  ok('rândul a dispărut', s2.campuri[ultimaCheie] === undefined)
  ok('restul câmpurilor au rămas', Object.keys(s2.campuri).length === Object.keys(celMare.campuri).length - 1)

  // Reordonare: ultimele două chei mutate în față.
  const cheiOriginale = Object.keys(celMare.campuri)
  const rasucit = [...cheiOriginale.slice(-2), ...cheiOriginale.slice(0, -2)]
  const reordonat = ordoneazaCampuri(text, { titlu: celMare.titlu }, rasucit)
  const chei = Object.keys(citesteBlocuri(reordonat, 2).find((b) => b.titlu === celMare.titlu)!.campuri)
  ok('prima e cea cerută', chei[0] === rasucit[0], chei.slice(0, 5).join(', '))
  ok('a doua e cea cerută', chei[1] === rasucit[1], chei.slice(0, 5).join(', '))
  ok('toate câmpurile sunt încă acolo', chei.length === cheiOriginale.length, `${chei.length} din ${cheiOriginale.length}`)
  ok('comentariile intacte la reordonare', JSON.stringify(comentarii(text)) === JSON.stringify(comentarii(reordonat)))
})()

console.log('\n=== 11. Sub-blocuri `###` (categorii cu preparate) ===')
;(() => {
  const text = textDate(FISIERE.meniu)
  if (!text) return sari('11', `site-ul n-are ${FISIERE.meniu}`)
  // Un sub-bloc care are un câmp completat, oricare.
  const cuPret = analizeaza(text)
    .blocuri.flatMap((b) => b.subblocuri.map((s) => ({ categorie: b.titlu, s })))
    .find((x) => [...x.s.campuri.values()].some((v) => v.trim() && !v.includes('\n')))
  if (!cuPret) return sari('11', 'niciun sub-bloc `###` cu un câmp completat')
  ok('am găsit un sub-bloc cu câmp', !!cuPret, JSON.stringify(cuPret.s.titlu))

  const cheie = [...cuPret.s.campuri.entries()].find(([, v]) => v.trim() && !v.includes('\n'))![0]
  const nou = setCamp(text, { titlu: cuPret.s.titlu, nivel: 3, parinte: cuPret.categorie }, cheie, '42')
  ok('câmpul sub-blocului: o singură linie', liniiDiferite(text, nou) === 2, `${liniiDiferite(text, nou)} (o linie scoasă + una pusă)`)
  const doc = analizeaza(nou)
  const categorie = doc.blocuri.find((b) => b.titlu === cuPret.categorie)!
  const preparat = categorie.subblocuri.find((s) => s.titlu === cuPret.s.titlu)!
  ok('motorul citește valoarea nouă', preparat.campuri.get(cheie) === '42', preparat.campuri.get(cheie))
  ok(
    'celelalte sub-blocuri din categorie neatinse',
    categorie.subblocuri.every((s) => {
      if (s.titlu === cuPret.s.titlu) return true
      const v = analizeaza(text).blocuri.find((b) => b.titlu === cuPret.categorie)!.subblocuri.find((x) => x.titlu === s.titlu)!
      return s.campuri.get(cheie) === v.campuri.get(cheie) && s.text === v.text
    }),
  )
})()

console.log('\n=== 12. Un `##` citat într-un comentariu NU e bloc ===')
;(() => {
  // Se caută în TOATE fișierele un comentariu care citează un titlu `##` —
  // scriitorii de conținut fac asta ca să explice un bloc opțional.
  const surse = [
    ...fisiere.map((f) => ({ nume: f, text: readFileSync(path.join(DATE, f), 'utf8') })),
    ...(existsSync(path.join(RADACINA, 'setari.md'))
      ? [{ nume: 'setari.md', text: readFileSync(path.join(RADACINA, 'setari.md'), 'utf8') }]
      : []),
  ]

  let gasit = 0
  for (const { nume, text } of surse) {
    const citate = comentarii(text)
      .flatMap((c) => c.split('\n'))
      .map((l) => l.trim().match(/^##\s+(.+?)\s*$/)?.[1])
      .filter((t): t is string => !!t)
    if (!citate.length) continue

    gasit++
    const titluri = blocuri(text)
      .filter((b) => b.nivel === 2)
      .map((b) => b.titlu)
    for (const t of citate) {
      ok(`${nume}: „${t}" citat în comentariu nu e bloc`, !titluri.includes(t), titluri.join(' | '))
    }
  }

  if (!gasit) sari('12', 'niciun fișier nu citează un titlu `##` într-un comentariu')
})()

console.log('\n=== 13. Un câmp explicat în comentariu NU e câmp ===')
// Peste TOATE fișierele, nu doar unul: un comentariu care scrie „Poza: …" ca
// exemplu n-are voie să devină câmp în niciunul.
for (const f of fisiere) {
  const text = readFileSync(path.join(DATE, f), 'utf8')
  const alMeu = citesteBlocuri(text, 2)
  const alMotorului = analizeaza(text).blocuri
  for (let i = 0; i < alMotorului.length; i++) {
    const cheiMotor = [...alMotorului[i].campuri.keys()].sort()
    const cheiPatch = Object.keys(alMeu[i].campuri).sort()
    ok(
      `${f} · „${alMotorului[i].titlu}": aceleași chei`,
      JSON.stringify(cheiMotor) === JSON.stringify(cheiPatch),
      `motor=${cheiMotor.join(',')} patch=${cheiPatch.join(',')}`,
    )
  }
}

console.log('\n=== 14. Titlu ambiguu → eroare, nu ghicit ===')
;(() => {
  // Un fragment care se potrivește cu DOUĂ titluri din același fișier. Se
  // caută, nu se scrie: „Cameră" e ambiguu la o pensiune, nu și la un
  // restaurant.
  let gasit: { text: string; fragment: string } | null = null
  for (const f of fisiere) {
    const text = readFileSync(path.join(DATE, f), 'utf8')
    const titluri = blocuri(text)
      .filter((b) => b.nivel === 2)
      .map((b) => normalizeaza(b.titlu))
    for (const t of titluri) {
      // Prefixele titlului, de la cel mai lung: primul care prinde două
      // titluri fără să fie egal cu vreunul e fragmentul ambiguu.
      const cuvinte = t.split(' ')
      for (let n = cuvinte.length - 1; n >= 1; n--) {
        const fragment = cuvinte.slice(0, n).join(' ')
        const potriviri = titluri.filter((x) => x.includes(fragment))
        if (potriviri.length >= 2 && !titluri.includes(fragment)) {
          gasit = { text, fragment }
          break
        }
      }
      if (gasit) break
    }
    if (gasit) break
  }

  if (gasit) {
    let aAruncat = false
    try {
      gasesteBloc(gasit.text, { titlu: gasit.fragment })
    } catch (e) {
      aAruncat = true
      ok('eroarea spune cu ce s-a potrivit', String(e).includes('se potrivește'), String(e))
    }
    ok(`un titlu ambiguu („${gasit.fragment}") aruncă`, aAruncat)
  } else {
    sari('14 (titlu ambiguu)', 'niciun fișier n-are două titluri cu prefix comun')
  }

  const text = CU_BLOCURI?.text
  if (!text) return sari('14 (titlu inexistent)', 'niciun fișier de conținut')
  let aAruncat2 = false
  try {
    gasesteBloc(text, { titlu: 'Nu există așa ceva' })
  } catch (e) {
    aAruncat2 = true
    ok('eroarea listează ce există', String(e).includes('În fișier sunt'), String(e))
  }
  ok('un titlu inexistent aruncă', aAruncat2)
})()

console.log('\n=== 15. Toate fișierele: o rescriere identică nu schimbă nimic ===')
// Asta e proba care contează cel mai mult în practică: un formular trimite
// TOATE câmpurile la fiecare salvare, nu doar pe cel editat. Dacă rescrierea
// identică nu e no-op, prima salvare a gazdei ar reformata tot fișierul.
for (const f of fisiere) {
  const text = readFileSync(path.join(DATE, f), 'utf8')
  let nou = text

  for (const b of citesteBlocuri(text, 2)) {
    for (const [cheie, valoare] of Object.entries(b.campuri)) {
      nou = setCamp(nou, { index: b.index }, cheie, valoare)
    }
    nou = setDescriere(nou, { index: b.index }, b.descriere)

    // Și sub-blocurile `###`, dacă are (categoriile din meniu).
    for (const s of citesteBlocuri(text, 3, b.titlu)) {
      for (const [cheie, valoare] of Object.entries(s.campuri)) {
        nou = setCamp(nou, { titlu: s.titlu, nivel: 3, parinte: b.titlu }, cheie, valoare)
      }
      nou = setDescriere(nou, { titlu: s.titlu, nivel: 3, parinte: b.titlu }, s.descriere)
    }
  }

  ok(`${f}: rescrierea identică e no-op`, nou === text, `${liniiDiferite(nou, text)} linii diferite`)
}

console.log('\n=== 16. setari.md: rescrierea identică e no-op ===')
;(() => {
  const cale = path.join(RADACINA, 'setari.md')
  if (!existsSync(cale)) return sari('16', 'site-ul n-are setari.md')
  const text = readFileSync(cale, 'utf8')
  let nou = text
  for (const b of citesteBlocuri(text, 2)) {
    for (const [cheie, valoare] of Object.entries(b.campuri)) {
      nou = setCamp(nou, { index: b.index }, cheie, valoare)
    }
  }
  ok('setari.md neatins', nou === text, `${liniiDiferite(nou, text)} linii diferite`)

  // Reordonare cu ordinea CURENTĂ: tot no-op.
  const celMare = [...citesteBlocuri(text, 2)].sort(
    (a, b) => Object.keys(b.campuri).length - Object.keys(a.campuri).length,
  )[0]
  if (!celMare) return sari('16 (reordonare)', 'setari.md n-are blocuri')
  const chei = Object.keys(celMare.campuri)
  const acelasi = ordoneazaCampuri(text, { titlu: celMare.titlu }, chei)
  ok('reordonarea în aceeași ordine e no-op', acelasi === text, `${liniiDiferite(acelasi, text)} linii diferite`)
})()

console.log('\n=== 17. Fișierele din en/ trec aceleași probe ===')
;(() => {
  const EN = path.join(RADACINA, 'en')
  if (!existsSync(EN)) return sari('17', 'site-ul n-are folder en/ (o singură limbă)')
  for (const f of readdirSync(EN).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
    const text = readFileSync(path.join(EN, f), 'utf8')
    const alMeu = blocuri(text).filter((b) => b.nivel === 2).map((b) => b.titlu)
    const alMotorului = analizeaza(text).blocuri.map((b) => b.titlu)
    ok(`en/${f}: aceleași blocuri ca motorul`, JSON.stringify(alMeu) === JSON.stringify(alMotorului), `${alMeu.length} vs ${alMotorului.length}`)

    let nou = text
    for (const b of citesteBlocuri(text, 2)) {
      for (const [cheie, valoare] of Object.entries(b.campuri)) nou = setCamp(nou, { index: b.index }, cheie, valoare)
      nou = setDescriere(nou, { index: b.index }, b.descriere)
      for (const s of citesteBlocuri(text, 3, b.titlu)) {
        for (const [cheie, valoare] of Object.entries(s.campuri)) {
          nou = setCamp(nou, { titlu: s.titlu, nivel: 3, parinte: b.titlu }, cheie, valoare)
        }
        nou = setDescriere(nou, { titlu: s.titlu, nivel: 3, parinte: b.titlu }, s.descriere)
      }
    }
    ok(`en/${f}: rescrierea identică e no-op`, nou === text, `${liniiDiferite(nou, text)} linii diferite`)
  }
})()

console.log('\n=== 18. Schema panoului se potrivește cu fișierele reale ===')
{
  // Proba care contează cel mai mult după cele de mai sus: o cheie scrisă
  // greșit în `schema.ts` face ca panoul să scrie un câmp pe care motorul
  // îl ignoră în tăcere — exact felul de bug care se descoperă abia când
  // gazda întreabă „de ce nu se vede prețul pe care l-am pus".
  for (const f of FISIERE_PANOU) {
    // `rezolva` acceptă și un nume redenumit care păstrează prefixul numeric.
    const cale = rezolva(DATE, f.fisier)
    ok(`${f.id}: fișierul „${f.fisier}" există`, cale !== null, path.join(DATE, f.fisier))
    if (!cale) continue

    const text = readFileSync(cale, 'utf8')
    const doc = analizeaza(text)
    const cheiDinFisier = new Set<string>()
    for (const b of doc.blocuri) {
      for (const k of b.campuri.keys()) cheiDinFisier.add(k)
      for (const sb of b.subblocuri) for (const k of sb.campuri.keys()) cheiDinFisier.add(k)
    }

    // Cheia scrisă în schemă trebuie să fie deja normalizată — altfel nu se
    // potrivește niciodată cu ce citește parserul.
    for (const c of campuriDin(f)) {
      ok(
        `${f.id} / ${c.cheie}: cheie normalizată`,
        c.cheie === normalizeaza(c.cheie),
        `„${c.cheie}" ar trebui „${normalizeaza(c.cheie)}"`,
      )
      ok(
        `${f.id} / ${c.cheie}: „${c.cheieScrisa}" se normalizează la ea`,
        normalizeaza(c.cheieScrisa) === c.cheie,
        `„${c.cheieScrisa}" → „${normalizeaza(c.cheieScrisa)}", nu „${c.cheie}"`,
      )
    }

    // Blocurile fixe declarate trebuie să existe cu adevărat.
    if (f.forma.fel === 'fixe') {
      for (const b of f.forma.blocuri) {
        let gasit = true
        try {
          gasesteBloc(text, { titlu: b.titlu })
        } catch {
          gasit = false
        }
        ok(`${f.id}: blocul „${b.titlu}" există în fișier`, gasit)
      }
    } else if (f.forma.antet) {
      let gasit = true
      try {
        gasesteBloc(text, { titlu: f.forma.antet.titlu })
      } catch {
        gasit = false
      }
      ok(`${f.id}: antetul „${f.forma.antet.titlu}" există`, gasit)
    }
  }

  // Invers: un câmp care EXISTĂ în fișier și are conținut, dar pe care
  // schema nu-l acoperă, e conținut invizibil în panou. Gazda l-ar putea
  // pierde fără să știe.
  //
  // Excepțiile sunt DELIBERATE și scrise aici, cu motivul lor — nu tăcute.
  // Dacă apare un câmp nou neacoperit, proba cade și cineva trebuie să
  // decidă: intră în panou, sau intră în lista asta?
  const NEACOPERITE_INTENTIONAT: Record<string, string[]> = {
    // Motorul de rezervări și plățile online sunt configurare tehnică:
    // se ating o dată, la lansare, de partea tehnică. Un comutator „Plăți
    // online" în panou ar fi un buton care cere bază de date, chei Netopia
    // și un contract — nu ceva de apăsat din greșeală.
    [FISIERE.rezervari]: ['tip', 'sistem', 'adresa', 'activ'],
  }

  const acoperite = new Map<string, Set<string>>()
  for (const f of FISIERE_PANOU) {
    const set = acoperite.get(f.fisier) ?? new Set<string>()
    for (const c of campuriDin(f)) set.add(c.cheie)
    acoperite.set(f.fisier, set)
  }
  for (const [fisier, chei] of acoperite) {
    const cale = rezolva(DATE, fisier)
    if (!cale) continue // deja raportat mai sus
    const text = readFileSync(cale, 'utf8')
    const scutite = NEACOPERITE_INTENTIONAT[fisier] ?? []
    const lipsa = new Set<string>()
    for (const b of analizeaza(text).blocuri) {
      for (const [k, v] of b.campuri) if (v.trim() && !chei.has(k) && !scutite.includes(k)) lipsa.add(k)
    }
    ok(
      `${fisier}: schema acoperă toate câmpurile completate`,
      lipsa.size === 0,
      `neacoperite: ${[...lipsa].join(', ')}`,
    )
  }
}

console.log('\n=== 19. Nicio proză înghițită ca „câmp" ===')
{
  // Capcana care a ascuns complet o întrebare frecventă de pe site: un rând
  // de răspuns care începe cu puține cuvinte urmate de `:` („Da, la pachetele
  // turistice: 75%…") e citit ca `Cheie: valoare`. Textul dispare din bloc,
  // iar un bloc fără text nu se randează.
  //
  // Testul: toate cheile REALE din `date/` încep cu majusculă. Una cu
  // minusculă e proză înghițită.
  for (const dir of ['date', 'en']) {
    const folder = path.join(RADACINA, dir)
    if (!existsSync(folder)) continue
    for (const f of readdirSync(folder).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
      const text = readFileSync(path.join(folder, f), 'utf8')
      const suspecte: string[] = []
      for (const b of blocuri(text)) {
        const copil = blocuri(text).find((x) => x.nivel > b.nivel && x.start > b.start && x.start < b.sfarsit)
        for (const c of campuri(text, b.start + 1, copil ? copil.start : b.sfarsit)) {
          if (/^[a-zăâîșț]/.test(c.cheieBruta)) suspecte.push(`${f}:${c.start + 1} „${c.cheieBruta}"`)
        }
      }
      ok(`${dir}/${f}: nicio cheie cu literă mică`, suspecte.length === 0, suspecte.join(' · '))
    }
  }

  // Și blocuri rămase complet goale — nu ajung pe site.
  for (const dir of ['date', 'en']) {
    const folder = path.join(RADACINA, dir)
    if (!existsSync(folder)) continue
    for (const f of readdirSync(folder).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
      const goale = analizeaza(readFileSync(path.join(folder, f), 'utf8'))
        .blocuri.filter((b) => b.titlu.trim() && !b.text.trim() && !b.campuri.size && !b.subblocuri.length)
        .map((b) => b.titlu)
      ok(`${dir}/${f}: niciun bloc complet gol`, goale.length === 0, goale.join(' · '))
    }
  }
}

console.log(`\n${'─'.repeat(50)}`)
console.log(`  ${treceri} treceri · ${picari} picări${sarite ? ` · ${sarite} sărite` : ''}`)
if (sarite) {
  // Sărite ≠ trecute. Un site căruia îi lipsesc fișiere ar raporta altfel
  // „toate probele trec" fără să fi probat mai nimic.
  console.log('  Probele sărite n-au pe ce rula pe site-ul ăsta — motivele, mai sus.')
}
console.log(picari ? '  NU e gata.\n' : '  Toate probele trec.\n')
process.exit(picari ? 1 : 0)
