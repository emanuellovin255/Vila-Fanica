/* ============================================================
   continut/index.ts — de la fișiere `.md` la un `SiteData` validat.

   Ăsta e task-ul care face sistemul „ușor de editat": un om fără
   cunoștințe tehnice editează text în română, iar din el se generează
   site-ul, cu conținutul în HTML (T05).

   Trei principii care se văd peste tot mai jos:

   1. CÂMP NECOMPLETAT = CÂMP ABSENT, niciodată o valoare implicită
      inventată (REGULI.md 3). De asta `text()` întoarce `undefined`
      pentru `''`: o componentă nu trebuie să poată randa un titlu urmat
      de gol.

   2. EROARE UTILĂ. Nu „unexpected token", ci fișierul, blocul, câmpul
      și ce e de făcut. Destinatarul nu poate citi codul.

   3. SURSA DE ADEVĂR RĂMÂN FIȘIERELE `.md`. `content/site.json` e
      artefact de build, util la debug. Intră în `.gitignore`.
   ============================================================ */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { AreaAttraction, Cta, Faq, Feature, IconName, Offer, Review, Room, SiteData } from '@/content/types'

import {
  analizeaza,
  boolean,
  lista,
  normalizeaza,
  numar,
  preturi,
  slug,
  sugereaza,
  text,
  type Bloc,
  type Document,
} from './md'
import { FISIERE, rezolva } from './fisiere'
import { radacinaClientDir } from './radacina'
import { etichete, type Etichete } from '@/lib/i18n/etichete'
import { caleaPublica, type Limba } from '@/lib/i18n/limbi'
import { traduSegment } from '@/lib/i18n/rute'
import { Raport } from './raport'
import { citesteSetari, type Setari } from './setari'

export { Raport } from './raport'
export type { Constatare, Nivel } from './raport'
export { IMPLICIT } from './setari'
export type { Setari } from './setari'
export { radacinaClientDir } from './radacina'

export interface ContinutClient {
  date: SiteData
  setari: Setari
  raport: Raport
  /** Pozele găsite în `poze/`, pentru verificări și pentru T31. */
  poze: string[]
}

/* ------------------------------------------------------------------ */
/* Citire                                                              */
/* ------------------------------------------------------------------ */

interface Sursa {
  fisier: string
  doc: Document
}

function citeste(
  radacina: string,
  fisier: string,
  raport: Raport,
  optiuni: { optional?: boolean } = {},
): Sursa | null {
  // `rezolva` acceptă și un fișier redenumit, cât timp păstrează numărul
  // din față (vezi `fisiere.ts`). Numele din raport rămâne cel canonic:
  // ăla e scris în ghiduri, deci ăla trebuie căutat în GitHub.
  const cale = rezolva(radacina, fisier)
  if (!cale) {
    // `optional` = pe /en un fișier lipsă înseamnă doar că secțiunea aceea
    // nu apare (T08), nu o problemă de raportat.
    if (!optiuni.optional) {
      raport.avertisment({
        fisier,
        mesaj: 'Fișierul lipsește.',
        solutie: `Copiază-l din clienti/_sablon-client/${fisier} și completează-l.`,
      })
    }
    return null
  }
  return { fisier, doc: analizeaza(readFileSync(cale, 'utf8')) }
}

/** Blocul cu titlul cerut, indiferent de diacritice și de majuscule. */
function bloc(s: Sursa | null, ...nume: string[]): Bloc | undefined {
  if (!s) return undefined
  return s.doc.blocuri.find((b) => {
    const t = b.titlu.toLowerCase()
    return nume.some((n) => t.includes(n.toLowerCase()))
  })
}

/** Blocurile care chiar au conținut — cele goale din șablon nu contează. */
function blocuriCompletate(s: Sursa | null): Bloc[] {
  if (!s) return []
  return s.doc.blocuri.filter(
    (b) => b.titlu.trim() !== '' || b.text.trim() !== '' || [...b.campuri.values()].some(Boolean),
  )
}

function camp(b: Bloc | undefined, cheie: string): string | undefined {
  return b ? text(b.campuri.get(cheie)) : undefined
}

/**
 * Prima frază a unui text, ca plasă de siguranță pentru cardurile de
 * ofertă fără `Rezumat:`.
 *
 * NU e „conținut inventat" (REGULI.md 3): e o tăietură din proza pe care
 * a scris-o clientul, nu o formulare nouă. Rostul ei e că un card
 * trebuie să aibă înălțimea vecinilor lui — un paragraf de zece rânduri
 * într-o grilă cu carduri de trei rânduri e fix golul alb pe care îl
 * reparăm (T75).
 */
function primaFraza(s: string | undefined): string {
  const t = (s ?? '').trim()
  if (!t) return ''
  const primulParagraf = t.split('\n\n')[0].replace(/\s*\n\s*/g, ' ').trim()
  // Punctul dintr-o abreviere („cca. 40 de lei") nu termină fraza, deci
  // cerem o literă mare sau sfârșitul textului după el.
  const m = primulParagraf.match(/^.*?[.!?](?=\s+[A-ZĂÂÎȘȚ]|$)/)
  return (m ? m[0] : primulParagraf).trim()
}

/**
 * Verifică cheile pe care nu le recunoaștem și propune cea mai
 * apropiată. O cheie scrisă greșit și ignorată în tăcere e cel mai
 * enervant fel de bug pentru cineva care nu poate citi codul.
 */
function verificaChei(b: Bloc, cunoscute: readonly string[], fisier: string, raport: Raport) {
  for (const cheie of b.campuri.keys()) {
    if (cunoscute.includes(cheie)) continue
    const s = sugereaza(cheie, cunoscute)
    raport.nota({
      fisier,
      linie: b.linie,
      unde: b.titlu || undefined,
      mesaj: `Nu recunosc câmpul „${cheie}", deci e ignorat.`,
      solutie: s ? `Ai vrut să scrii „${s}"?` : `Câmpurile acceptate aici: ${cunoscute.join(', ')}.`,
    })
  }
}

/* ------------------------------------------------------------------ */
/* Poze                                                                */
/* ------------------------------------------------------------------ */

/**
 * Numele fișierelor din `poze/`.
 *
 * Sursa de adevăr e folderul, citit direct — așa „am pus o poză nouă"
 * funcționează imediat la `npm run dev` și la `verifica`. Dar pe Vercel
 * paginile se randează la cerere (nonce-ul CSP), iar funcția serverless
 * n-are folderul: zeci de MB nu intră într-o funcție ca să-i citim numele.
 * Pentru cazul ăla, `sync-media` scrie la prebuild `content/poze.json`, cu
 * exact aceleași nume. Calea e literală, deci o vede și urmăritorul de
 * fișiere al Next.
 */
function citestePoze(radacina: string): string[] {
  const dir = path.join(radacina, 'poze')
  // `.md` e exclus: `poze/README.md` e ghidul folderului, nu o poză. Fără
  // filtru ar fi copiat în `public/media` și raportat ca imagine nefolosită.
  if (existsSync(dir)) return readdirSync(dir).filter((f) => !f.startsWith('.') && !f.endsWith('.md'))

  const lista = path.resolve(process.cwd(), 'content', 'poze.json')
  if (!existsSync(lista)) return []
  try {
    const nume = JSON.parse(readFileSync(lista, 'utf8'))
    return Array.isArray(nume) ? nume : []
  } catch {
    return []
  }
}

/** Extensiile acceptate pentru fiecare fel de fișier din `poze/`. */
const EXT_IMAGINE = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.svg', '.gif'] as const
const EXT_VIDEO = ['.mp4', '.webm', '.mov'] as const

/**
 * Traduce numele unui fișier din `poze/` în adresa lui de pe site și
 * verifică întâi că fișierul chiar există și că are extensia potrivită.
 * Mesajul spune CARE fișier și UNDE — exact ce cere criteriul de
 * terminare din T05.
 *
 * `poza()` și clipurile de video (T60) sunt același lucru — aceeași
 * validare de existență, aceeași sugestie când numele diferă doar prin
 * extensie — deci trec toate pe aici; nu scriem a doua funcție identică.
 */
function fisierMedia(
  nume: string | undefined,
  extensii: readonly string[],
  ctx: { fisier: string; unde?: string; linie?: number },
  poze: string[],
  raport: Raport,
): string | undefined {
  const n = text(nume)
  if (!n) return undefined

  if (!poze.includes(n)) {
    // Același fișier cu altă extensie e cea mai frecventă scăpare.
    const fara = n.replace(/\.[^.]+$/, '')
    const alta = poze.find((p) => p.replace(/\.[^.]+$/, '') === fara)
    raport.eroare({
      ...ctx,
      mesaj: `Am găsit „${n}", dar fișierul nu există în poze/.`,
      solutie: alta
        ? `În poze/ există „${alta}". Scrie exact numele ăsta, cu tot cu extensie.`
        : `Pune fișierul în clienti/<nume>/poze/ sau șterge rândul. Numele trebuie scris identic, cu extensie și cu aceleași majuscule.`,
    })
    return undefined
  }

  const ext = (n.match(/\.[^.]+$/)?.[0] ?? '').toLowerCase()
  if (!extensii.includes(ext)) {
    raport.eroare({
      ...ctx,
      mesaj: `„${n}" are extensia „${ext || '(niciuna)'}", care nu se potrivește aici.`,
      solutie: `Aici merg doar: ${extensii.join(', ')}.`,
    })
    return undefined
  }
  return `/media/${n}`
}

/** Cazul obișnuit: o imagine din `poze/`. Un apel al lui `fisierMedia`. */
function poza(
  nume: string | undefined,
  ctx: { fisier: string; unde?: string; linie?: number },
  poze: string[],
  raport: Raport,
): string | undefined {
  return fisierMedia(nume, EXT_IMAGINE, ctx, poze, raport)
}

/* ------------------------------------------------------------------ */
/* Butoane                                                             */
/* ------------------------------------------------------------------ */

/**
 * Un buton se scrie ca text simplu („Vezi camerele") sau ca
 * `Text | /adresa`. Fără adresă, se deduce din text — și dacă nu se
 * poate deduce, butonul nu se randează deloc, în loc să ducă nicăieri.
 */
const DESTINATII: [RegExp, string][] = [
  [/camer/i, '/camere'],
  [/ofert|pachet/i, '/oferte'],
  [/galeri|poz|foto/i, '/galerie'],
  // `/contact` e pagină, nu ancoră către subsol: un link de meniu care
  // doar derulează la finalul paginii curente nu duce nicăieri.
  [/contact|scrie|mesaj/i, '/contact'],
  [/meniu|restaurant|mânc|manc/i, '/#meniu'],
  [/eveniment|nunt|conferint/i, '/evenimente'],
  [/zon|împrejur|imprejur|atracți|atracti/i, '/zona'],
  [/disponibil|rezerv|caut/i, '#rezervare'],
  [/telefon|sun[ăa]|apel/i, 'tel'],
]

/**
 * `link` traduce adresa în limba paginii. E parametru, nu import: funcția
 * asta e pură, iar limba o știe doar `incarcaClient`, care îi pasează
 * închiderea lui (T76). Fără el, un buton „Vezi pachetele" de pe /en
 * ducea la `/oferte`, adică înapoi pe română.
 */
function cta(
  brut: string | undefined,
  variant: Cta['variant'] | undefined,
  link: (cale: string) => string,
): Cta | undefined {
  const v = text(brut)
  if (!v) return undefined
  const [eticheta, href] = v.split('|').map((x) => x.trim())
  if (!eticheta) return undefined
  if (href) return { label: eticheta, href: link(href), variant }
  const gasit = DESTINATII.find(([re]) => re.test(eticheta))
  return gasit ? { label: eticheta, href: link(gasit[1]), variant } : undefined
}

/* ------------------------------------------------------------------ */
/* Încărcarea propriu-zisă                                             */
/* ------------------------------------------------------------------ */

const CHEI_CAMERA = [
  'pret de la',
  'preturi',
  'persoane',
  'pat',
  'suprafata',
  'poze',
  'facilitati',
  'eticheta',
  'video',
  'poster video',
] as const

const CHEI_OFERTA = [
  'tip',
  'pret',
  'preturi',
  'pret anterior',
  'unitate',
  'poza',
  'badge',
  'include',
  'valabil',
  'rezumat',
] as const

const CHEI_RECENZIE = ['autor', 'sursa', 'data', 'nota'] as const
const CHEI_ZONA = ['distanta', 'poza', 'prima pagina'] as const

export function incarcaClient(nume: string, limba: Limba = 'ro'): ContinutClient {
  const raport = new Raport()
  const radacinaClient = radacinaClientDir(nume)
  // Textele motorului în limba paginii. Tot ce nu vine dintr-un fișier
  // al clientului trece pe aici, o singură dată (T76).
  const t = etichete(limba)
  /**
   * O cale internă românească („/camere") → adresa publică din limba
   * paginii („/en/rooms"). Segmentul tradus + prefixul de limbă.
   *
   * Toate linkurile generate de motor (meniu, butoane, documente legale)
   * trec pe aici. Fără el, primul click din antetul englezesc scotea
   * vizitatorul înapoi pe română (T76).
   *
   * Ce NU atinge: ancorele goale (`#rezervare`), `tel`, `mailto:` și
   * adresele externe. Un prefix de limbă pe ele le-ar rupe — `#rezervare`
   * ar deveni `/en#rezervare`, adică o navigare, nu o săritură în pagină.
   */
  const link = (cale: string) =>
    cale.startsWith('/') ? caleaPublica(limba, traduSegment(cale, limba)) : cale

  if (!existsSync(radacinaClient)) {
    throw new Error(
      `\nNu există clienti/${nume}/.\n` +
        `Rulează \`npm run client-nou\` sau verifică numele folderului.\n`,
    )
  }

  // Româna stă mereu în `date/`. E ȘI baza pentru orice altă limbă:
  // datele care NU se traduc — telefon, email, adresă, CUI, culori
  // (T08) — se citesc mereu de aici, oricare ar fi limba paginii.
  const radacinaRo = path.join(radacinaClient, 'date')
  // Conținutul traductibil vine din folderul limbii (`en/` pentru /en).
  // Pentru română, cele două coincid.
  const radacinaLimba = limba === 'ro' ? radacinaRo : path.join(radacinaClient, limba)
  const poze = citestePoze(radacinaClient)

  // Fișiere STRUCTURALE — nu se traduc, mereu din română.
  const contact = citeste(radacinaRo, FISIERE.contact, raport)
  // Configurația motorului de rezervări (tip, adresă, furnizor) e
  // structurală și rămâne din română...
  const rezervari = citeste(radacinaRo, FISIERE.rezervari, raport)
  // ...dar blocul `## Etichete` din el e TEXT VIZIBIL: „Sosire",
  // „Plecare", „Persoane", eticheta butonului. Citit doar din `date/`,
  // rămânea românesc pe /en — chiar sub un buton scris în engleză (T76).
  // Deci se mai citește o dată, din folderul limbii, opțional: fără
  // `en/10-...`, se cade pe cel românesc, apoi pe `etichete.ts`.
  const rezervariLimba =
    limba === 'ro'
      ? rezervari
      : citeste(radacinaLimba, FISIERE.rezervari, raport, { optional: true })
  const stil = citeste(radacinaRo, FISIERE.stil, raport)
  const legalSursa = citeste(radacinaRo, FISIERE.legal, raport)

  // Fișiere de CONȚINUT — din folderul limbii. Pe /en, un fișier lipsă
  // înseamnă doar că secțiunea aceea nu apare (T08), deci nu e o
  // problemă de raportat: `optional` taie avertismentul de „lipsește".
  const optional = limba !== 'ro'
  const identitate = citeste(radacinaLimba, FISIERE.identitate, raport, { optional })
  const prima = citeste(radacinaLimba, FISIERE.primaPagina, raport, { optional })
  const camereSursa = citeste(radacinaLimba, FISIERE.camere, raport, { optional })
  const facilitatiSursa = citeste(radacinaLimba, FISIERE.facilitati, raport, { optional })
  const oferteSursa = citeste(radacinaLimba, FISIERE.oferte, raport, { optional })
  const recenziiSursa = citeste(radacinaLimba, FISIERE.recenzii, raport, { optional })
  const faqSursa = citeste(radacinaLimba, FISIERE.faq, raport, { optional })
  // Pagina „Zona" e opțională prin natura ei: multe locații n-o pornesc, deci
  // fișierul lipsă nu e o problemă de raportat.
  const zonaSursa = citeste(radacinaLimba, FISIERE.zona, raport, { optional: true })
  // Pagina `/contact`. Opțională prin natura ei: fără fișier, rămân
  // datele de contact din `02-telefon-email-si-adresa.md` și pagina se randează cu
  // titlul din `etichete.ts` — nimic nu se rupe.
  const contactPaginaSursa = citeste(radacinaLimba, FISIERE.paginaContact, raport, { optional: true })
  // Meniul (07) se citește separat, prin lib/continut/meniu.ts.

  const setariDoc = existsSync(path.join(radacinaClient, 'setari.md'))
    ? analizeaza(readFileSync(path.join(radacinaClient, 'setari.md'), 'utf8'))
    : null
  const setari = citesteSetari(setariDoc)

  /* ---------------------------------------------------------------- */
  /* 01 · Identitate — fără nume, site-ul n-are ce randa               */
  /* ---------------------------------------------------------------- */

  // Numele locației NU se traduce (T08): pe /en se ia din română dacă
  // en/01-nume-logo-si-descriere.md nu-l repetă. Slogan și descriere SE traduc.
  const identitateRo = optional ? citeste(radacinaRo, FISIERE.identitate, raport) : identitate
  const bNume = bloc(identitate, 'nume') ?? bloc(identitateRo, 'nume')
  const numeLocatie = camp(bloc(identitate, 'nume'), 'nume') ?? camp(bloc(identitateRo, 'nume'), 'nume')
  if (!numeLocatie) {
    raport.eroare({
      fisier: FISIERE.identitate,
      unde: 'Nume',
      mesaj: 'Numele locației lipsește.',
      solutie: 'Completează „Nume:" — apare în titlul paginii, în antet și în footer.',
    })
  }
  const numeScurt = camp(bNume, 'nume scurt') ?? numeLocatie ?? ''
  const slogan = camp(bloc(identitate, 'slogan'), 'slogan') ?? ''
  const stele = numar(camp(bloc(identitate, 'clasificare'), 'stele'))
  const descriere = camp(bloc(identitate, 'descriere'), 'descriere') ?? ''
  const logo = poza(
    camp(bloc(identitate, 'logo'), 'logo'),
    { fisier: FISIERE.identitate, unde: 'Logo' },
    poze,
    raport,
  )

  if (!descriere) {
    raport.avertisment({
      fisier: FISIERE.identitate,
      unde: 'Descriere scurtă',
      mesaj: 'Descrierea lipsește, deci Google va inventa singur un fragment sub titlu.',
      solutie: 'Scrie 2-3 propoziții pentru cineva care nu știe nimic despre locație.',
    })
  }

  /* ---------------------------------------------------------------- */
  /* 02 · Contact — fără telefon, un site de cazare nu are rost        */
  /* ---------------------------------------------------------------- */

  const bTel = bloc(contact, 'telefon')
  const telefon = camp(bTel, 'telefon')
  if (!telefon) {
    raport.eroare({
      fisier: FISIERE.contact,
      unde: 'Telefon',
      mesaj: 'Telefonul lipsește.',
      solutie:
        'Completează „Telefon:". La cabane și pensiuni telefonul e principalul canal de rezervare — fără el, bara lipită de pe mobil n-are ce afișa.',
    })
  }
  const telefonAfisat = camp(bTel, 'telefon afisat') ?? telefon ?? ''
  const whatsapp = camp(bTel, 'whatsapp')
  const email = camp(bloc(contact, 'email'), 'email') ?? ''

  const bAdr = bloc(contact, 'adres')
  const oras = camp(bAdr, 'oras') ?? ''
  if (!oras) {
    raport.avertisment({
      fisier: FISIERE.contact,
      unde: 'Adresă',
      mesaj: 'Orașul lipsește, deci locația nu poate apărea corect în căutările locale.',
      solutie: 'Completează cel puțin „Oraș:" și „Județ:". Trebuie să fie identice cu Google Business Profile.',
    })
  }

  const bGps = bloc(contact, 'coordonate')
  const bProgram = bloc(contact, 'program')
  const bSocial = bloc(contact, 'sociale')

  /**
   * Programul afișat în subsol și pe `/contact`, dintr-un singur șir.
   *
   * ÎNAINTE se citea doar „Recepție:", iar „Check-in:" și „Check-out:" din
   * `date/02-…` nu ajungeau nicăieri pe site — se scriau în fișier și
   * dispăreau. Gazda le completa și nu se întâmpla nimic, ceea ce e mai rău
   * decât un câmp care lipsește: pare stricat fără să spună de ce.
   *
   * Etichetele vin din `etichete.ts`, nu scrise aici: fișierul `02-…` n-are
   * pereche în `en/`, deci aceleași ore se afișează și pe /en, dar sub
   * „Check-in / Check-out", nu sub „Sosire / Plecare".
   *
   * Ordinea e cea în care le caută omul: orele întâi, recepția după.
   */
  const program = (b: ReturnType<typeof bloc>, et: Etichete): string | undefined => {
    const parti = [
      camp(b, 'check-in') ? `${et.sosire} ${camp(b, 'check-in')}` : null,
      camp(b, 'check-out') ? `${et.plecare} ${camp(b, 'check-out')}` : null,
      camp(b, 'receptie'),
    ].filter(Boolean)
    return parti.length ? parti.join(' · ') : undefined
  }

  const RETELE: [string, IconName][] = [
    ['facebook', 'facebook'],
    ['instagram', 'instagram'],
    ['tiktok', 'tiktok'],
    ['youtube', 'youtube'],
  ]
  const social = RETELE.flatMap(([cheie, icon]) => {
    const url = camp(bSocial, cheie)
    return url ? [{ label: cheie[0].toUpperCase() + cheie.slice(1), icon, url }] : []
  })

  /* ---------------------------------------------------------------- */
  /* 03 · Prima pagină                                                 */
  /* ---------------------------------------------------------------- */

  const bHero = bloc(prima, 'prima secțiune', 'prima sectiune')
  const heroImagine = poza(
    camp(bHero, 'poza'),
    { fisier: FISIERE.primaPagina, unde: 'Prima secțiune', linie: bHero?.linie },
    poze,
    raport,
  )
  if (!heroImagine) {
    raport.avertisment({
      fisier: FISIERE.primaPagina,
      unde: 'Prima secțiune',
      mesaj: 'Prima secțiune n-are poză, deci se va randa pe culoarea de brand, fără imagine.',
      solutie: 'Pune cea mai bună poză a locației în poze/ și scrie numele ei la „Poza:".',
    })
  }

  /**
   * Cadrele caruselului — Șablonul 4 (T-Delta).
   *
   * Blocul `## Carusel` cu sub-blocuri `###`, exact tiparul lui
   * „Feature-uri alternante" de mai jos: parserul din `md.ts` îl citește
   * deja, deci n-am atins nimic acolo. Ordinea cadrelor din fișier e
   * ordinea din carusel.
   *
   * Un cadru fără poză validă e SĂRIT, nu randat gol: un carusel care
   * comută pe un cadru negru arată stricat, nu „incomplet". Poza lipsă
   * e raportată de `poza()` cu fișierul și rândul ei.
   *
   * Fără blocul ăsta, `slides` rămâne `undefined` și hero-ul cade pe
   * poza unică din `## Prima secțiune` — deci un client pe alt șablon
   * se randează neschimbat.
   */
  const bCarusel = bloc(prima, 'carusel')
  const slides = (bCarusel?.subblocuri ?? []).flatMap((sb) => {
    const imagine = poza(
      camp(sb, 'poza'),
      { fisier: FISIERE.primaPagina, unde: `Carusel · ${sb.titlu}`, linie: sb.linie },
      poze,
      raport,
    )
    if (!imagine) return []
    return [
      {
        image: imagine,
        headline: camp(sb, 'titlu'),
        sub: camp(sb, 'subtitlu'),
      },
    ]
  })

  /**
   * Banda de semnătură (T-Delta) — o frază mare peste o poză întunecată.
   *
   * Cere ȘI text, ȘI poză: fraza singură ar fi un paragraf orfan pe
   * fundal gol, iar poza singură ar fi o bandă decorativă fără rost.
   * Lipsește oricare → secțiunea nu există (REGULI.md 3).
   */
  const bSemnatura = bloc(prima, 'semnătur', 'semnatur')
  const textSemnatura = camp(bSemnatura, 'text') ?? bSemnatura?.text?.trim()
  const imagineSemnatura = poza(
    camp(bSemnatura, 'poza'),
    { fisier: FISIERE.primaPagina, unde: 'Bandă de semnătură', linie: bSemnatura?.linie },
    poze,
    raport,
  )
  const signature =
    textSemnatura && imagineSemnatura
      ? {
          eyebrow: camp(bSemnatura, 'eticheta') ?? '',
          text: textSemnatura,
          image: imagineSemnatura,
          attribution: camp(bSemnatura, 'semnat de'),
        }
      : undefined

  const bTrust = bloc(prima, 'încredere', 'incredere')
  const trust = lista(bTrust?.campuri.get('elemente')).flatMap((rand) => {
    // „9,2 din 10 — nota oaspeților" → valoare + etichetă
    const [val, ...rest] = rand.split(/\s+[—–-]\s+/)
    const label = rest.join(' — ').trim()
    return val && label ? [{ value: val.trim(), label }] : []
  })

  const sectiune = (b: Bloc | undefined) => ({
    eyebrow: camp(b, 'eticheta') ?? '',
    title: camp(b, 'titlu') ?? '',
    lede: camp(b, 'text introductiv') ?? '',
  })

  // Ca `sectiune`, dar cu un titlu implicit când blocul lipsește sau n-are
  // „Titlu:" — pentru secțiunile al căror nume era înainte hardcodat (T61).
  const sectiuneNumita = (b: Bloc | undefined, titluImplicit: string) => {
    const s = sectiune(b)
    return { ...s, title: s.title || titluImplicit }
  }

  /* ---------------------------------------------------------------- */
  /* 04 · Camere — fiecare devine o pagină proprie (T07)              */
  /* ---------------------------------------------------------------- */

  const camere: Room[] = []
  const sluguriVazute = new Set<string>()

  for (const b of blocuriCompletate(camereSursa)) {
    const ctx = { fisier: FISIERE.camere, linie: b.linie, unde: b.titlu || '(cameră fără nume)' }
    verificaChei(b, CHEI_CAMERA, FISIERE.camere, raport)

    if (!b.titlu) {
      raport.eroare({
        ...ctx,
        mesaj: 'O cameră n-are nume, dar are date completate.',
        solutie: 'Scrie numele după „## ". Din el se face și adresa paginii: „Apartament Deluxe" → /camere/apartament-deluxe',
      })
      continue
    }

    let s = slug(b.titlu)
    if (sluguriVazute.has(s)) {
      raport.eroare({
        ...ctx,
        mesaj: `Două camere ar primi aceeași adresă: /camere/${s}.`,
        solutie: 'Schimbă numele uneia. Două pagini cu aceeași adresă înseamnă că una dintre ele dispare.',
      })
      s = `${s}-2`
    }
    sluguriVazute.add(s)

    const numePoze = lista(b.campuri.get('poze'))
    const imagini = numePoze.flatMap((n) => {
      const u = poza(n, ctx, poze, raport)
      return u ? [u] : []
    })
    if (!imagini.length) {
      raport.avertisment({
        ...ctx,
        mesaj: 'Camera n-are nicio poză, deci cardul ei va apărea gol.',
        solutie: 'Pune cel puțin o poză în poze/ și scrie numele ei la „Poze:". Prima e cea de pe card.',
      })
    }

    // Clipul camerei (T60): vertical, click-to-play. Fără poster nu se
    // randează (verifica îl prinde ca eroare), deci dacă e video dar nu e
    // poster, îl semnalăm aici, la sursă.
    const video = fisierMedia(b.campuri.get('video'), EXT_VIDEO, ctx, poze, raport)
    const videoPoster = poza(b.campuri.get('poster video'), ctx, poze, raport)
    if (video && !videoPoster) {
      raport.eroare({
        ...ctx,
        mesaj: 'Camera are „Video:", dar n-are „Poster video:".',
        solutie:
          'Scrie la „Poster video:" numele unui cadru din clip (imagine din poze/). Fără poster, clipul e o zonă goală până la click.',
      })
    }

    const pret = numar(b.campuri.get('pret de la'))
    if (pret === undefined && b.campuri.has('pret de la') && b.campuri.get('pret de la')?.trim()) {
      raport.avertisment({
        ...ctx,
        mesaj: `Nu pot citi un preț din „${b.campuri.get('pret de la')}".`,
        solutie: 'Scrie doar numărul: „480". Fără „lei", fără „/noapte" — formatarea o face site-ul.',
      })
    }

    camere.push({
      slug: s,
      name: b.titlu,
      image: imagini[0] ?? '',
      images: imagini.length > 1 ? imagini : undefined,
      occupancy: camp(b, 'persoane'),
      bed: camp(b, 'pat'),
      size: camp(b, 'suprafata'),
      amenities: lista(b.campuri.get('facilitati')),
      description: b.text || undefined,
      priceFrom: pret,
      prices: preturi(b.campuri.get('preturi')),
      tag: camp(b, 'eticheta'),
      video: videoPoster ? video : undefined,
      videoPoster: videoPoster && video ? videoPoster : undefined,
    })
  }

  if (!camere.length) {
    raport.avertisment({
      fisier: FISIERE.camere,
      mesaj: 'Nicio cameră completată, deci secțiunea de camere nu se va afișa.',
      solutie: 'Completează cel puțin o cameră. E secțiunea care aduce cele mai multe rezervări.',
    })
  }

  /* ---------------------------------------------------------------- */
  /* 05 · Facilități                                                   */
  /* ---------------------------------------------------------------- */

  const facilitati = blocuriCompletate(facilitatiSursa).flatMap((b) => {
    if (!b.titlu) return []
    const icon = (camp(b, 'icon') ?? 'check') as IconName
    return [{ icon, title: b.titlu, text: camp(b, 'text') ?? b.text ?? '' }]
  })

  /* ---------------------------------------------------------------- */
  /* 06 · Oferte                                                       */
  /* ---------------------------------------------------------------- */

  // Titlul secțiunii se citește dintr-un bloc `## Secțiune` traductibil
  // (T61), nu mai e hardcodat în română. Blocul NU e o ofertă, deci se
  // exclude din listă.
  const bSectiuneOferte = bloc(oferteSursa, 'secțiune', 'sectiune')
  // `bloc()` caută prin `includes`, deci „Secțiune" ar prinde și
  // „Secțiune excursii". Prima potrivire e cea a pachetelor (e prima în
  // fișier); antetul excursiilor se cere pe numele lui complet. Ambele
  // trebuie sărite mai jos, altfel un antet devine o ofertă fantomă.
  const bSectiuneExcursii = bloc(oferteSursa, 'secțiune excursii', 'sectiune excursii')
  const oferte: Offer[] = blocuriCompletate(oferteSursa).flatMap((b) => {
    if (!b.titlu || b === bSectiuneOferte || b === bSectiuneExcursii) return []
    const ctx = { fisier: FISIERE.oferte, linie: b.linie, unde: b.titlu }
    verificaChei(b, CHEI_OFERTA, FISIERE.oferte, raport)
    const rezumat = camp(b, 'rezumat')
    const bullets = lista(b.campuri.get('include'))
    if (!rezumat) {
      raport.nota({
        ...ctx,
        mesaj: 'Oferta n-are „Rezumat:", deci în card și în blocul de pe prima pagină apare prima frază din descriere.',
        solutie: 'Scrie o frază la „Rezumat:" — e singurul text care încape într-un card fără să-l facă de două ori mai înalt decât vecinii lui.',
      })
    }
    return [
      {
        slug: slug(b.titlu),
        title: b.titlu,
        // Proza completă rămâne pentru pagina ofertei; `summary` e ce se
        // randează în carduri. Până la T75 aici ajungea `Include:` întreg,
        // adică opt rânduri unite într-un singur string (T75).
        text: b.text ?? '',
        summary: rezumat ?? primaFraza(b.text),
        bullets,
        image: poza(camp(b, 'poza'), ctx, poze, raport) ?? '',
        // Excursiile sunt incluse în pachete și n-au preț propriu, deci
        // se randează altfel. Implicit „pachet": un fișier vechi, fără
        // cheia asta, se comportă exact ca înainte.
        kind: normalizeaza(camp(b, 'tip') ?? '').startsWith('excursie') ? 'excursion' : 'package',
        price: camp(b, 'pret'),
        prices: preturi(b.campuri.get('preturi')),
        priceWas: camp(b, 'pret anterior'),
        priceUnit: camp(b, 'unitate'),
        valid: camp(b, 'valabil'),
        badge: camp(b, 'badge'),
        href: link(`/oferte/${slug(b.titlu)}`),
      },
    ]
  })

  /* ---------------------------------------------------------------- */
  /* 08 · Recenzii — sursa e obligatorie (REGULI.md 3)                */
  /* ---------------------------------------------------------------- */

  const bSectiuneRecenzii = bloc(recenziiSursa, 'secțiune', 'sectiune')
  const bNota = bloc(recenziiSursa, 'nota medie', 'notă medie')
  const notaValoare = camp(bNota, 'nota')
  const rating = notaValoare
    ? {
        value: notaValoare,
        scale: numar(camp(bNota, 'din')) ?? 5,
        // Eticheta notei se traduce din blocul `## Nota medie` (T61).
        label: camp(bNota, 'eticheta') ?? 'Nota oaspeților',
        count: numar(camp(bNota, 'numar recenzii')),
        source: camp(bNota, 'sursa'),
      }
    : undefined

  if (rating && !rating.source) {
    raport.eroare({
      fisier: FISIERE.recenzii,
      unde: 'Nota medie',
      mesaj: 'Nota medie e completată, dar nu spune de unde vine.',
      solutie:
        'Completează „Sursă:" (Google, Booking.com…). Fără ea nu putem genera AggregateRating — o notă fără sursă e o afirmație pe care nimeni n-o poate verifica.',
    })
  }

  const recenzii: Review[] = []
  for (const b of blocuriCompletate(recenziiSursa)) {
    // Blocurile „Nota medie" și „Secțiune" nu sunt recenzii; sar peste ele.
    if (b === bNota || b === bSectiuneRecenzii) continue
    if (!b.text.trim() && !b.titlu) continue
    verificaChei(b, CHEI_RECENZIE, FISIERE.recenzii, raport)

    const sursa = camp(b, 'sursa')
    const autor = camp(b, 'autor')
    const citat = b.text.trim() || b.titlu

    if (!sursa) {
      // Nu e eroare de build: e o secțiune care pur și simplu nu apare.
      raport.avertisment({
        fisier: FISIERE.recenzii,
        linie: b.linie,
        unde: autor ?? citat.slice(0, 40),
        mesaj: 'Recenzia n-are sursă, deci NU se afișează pe site.',
        solutie:
          'Completează „Sursă:" (de unde vine) și „Data:". O recenzie fără sursă e o practică comercială incorectă, nu doar un gol de design.',
      })
      continue
    }
    if (!citat) continue

    recenzii.push({
      quote: citat,
      author: autor ?? '',
      source: sursa,
      date: camp(b, 'data') ?? '',
      rating: numar(camp(b, 'nota')) ?? 0,
    })
  }

  /* ---------------------------------------------------------------- */
  /* 09 · Întrebări frecvente                                          */
  /* ---------------------------------------------------------------- */

  const bSectiuneFaq = bloc(faqSursa, 'secțiune', 'sectiune')
  const faq: Faq[] = blocuriCompletate(faqSursa).flatMap((b) =>
    b !== bSectiuneFaq && b.titlu && b.text.trim() ? [{ q: b.titlu, a: b.text.trim() }] : [],
  )

  /* ---------------------------------------------------------------- */
  /* 13 · Zona — atracțiile din jur, pagina proprie (T05)              */
  /* ---------------------------------------------------------------- */

  const bSectiuneZona = bloc(zonaSursa, 'secțiune', 'sectiune')
  const zona: AreaAttraction[] = []
  for (const b of blocuriCompletate(zonaSursa)) {
    if (b === bSectiuneZona || !b.titlu) continue
    const ctx = { fisier: FISIERE.zona, linie: b.linie, unde: b.titlu }
    verificaChei(b, CHEI_ZONA, FISIERE.zona, raport)
    const text = b.text.trim()
    if (!text) {
      // Un nume fără descriere e o listă de bifat, nu conținut care aduce
      // trafic — și e exact greșeala pe care pagina asta trebuie s-o evite.
      raport.nota({
        ...ctx,
        mesaj: 'Atracția n-are descriere, deci nu se afișează.',
        solutie: 'Scrie 2-3 propoziții despre ce e și de ce merită. Fără ele, pagina nu rankează.',
      })
      continue
    }
    zona.push({
      name: b.titlu,
      distance: camp(b, 'distanta'),
      image: poza(camp(b, 'poza'), ctx, poze, raport),
      text,
      onHome: boolean(camp(b, 'prima pagina')),
    })
  }

  /* ---------------------------------------------------------------- */
  /* 03 · Feature-uri alternante — motorul Șablonului 2               */
  /* ---------------------------------------------------------------- */

  const bFeatures = bloc(prima, 'feature')
  const features: Feature[] = (bFeatures?.subblocuri ?? []).flatMap((sb, i) => {
    if (!sb.titlu) return []
    const ctx = { fisier: FISIERE.primaPagina, linie: sb.linie, unde: sb.titlu }
    const buton = cta(sb.campuri.get('buton'), 'ghost', link)
    return [
      {
        id: slug(sb.titlu),
        eyebrow: camp(sb, 'eticheta') ?? '',
        title: sb.titlu,
        text: camp(sb, 'text') ?? sb.text ?? '',
        image: poza(camp(sb, 'poza'), ctx, poze, raport) ?? '',
        bullets: lista(sb.campuri.get('buline')),
        ctas: buton ? [buton] : [],
        // Alternanța e calculată, nu scrisă de mână: cine adaugă un
        // feature la mijloc nu trebuie să reordoneze restul.
        reverse: i % 2 === 1,
      },
    ]
  })

  /* ---------------------------------------------------------------- */
  /* 03 · Povestea noastră — primul bloc de text de sub hero          */
  /* ---------------------------------------------------------------- */

  // Proza stă sub câmpuri, ca la orice bloc: `b.text` are paragrafele
  // unite cu rând gol, exact cum le-a scris gazda. Le despărțim înapoi
  // ca fiecare să fie un `<p>` — un singur paragraf de zece rânduri e
  // ilizibil, iar `white-space: pre-line` n-ar da aer între idei.
  const bPoveste = bloc(prima, 'povestea noastr', 'poveste')
  const paragrafePoveste = (bPoveste?.text ?? '')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
  const story = paragrafePoveste.length
    ? {
        eyebrow: camp(bPoveste, 'eticheta') ?? '',
        title: camp(bPoveste, 'titlu') ?? bPoveste?.titlu ?? '',
        paragraphs: paragrafePoveste,
      }
    : undefined

  /* ---------------------------------------------------------------- */
  /* 03 · Serviciile noastre — antetul blocurilor de mai jos          */
  /* ---------------------------------------------------------------- */

  // Doar antetul: titlu, text introductiv și butonul către pachete.
  // Blocurile propriu-zise (transport, cazare, masă) sunt `features` —
  // aceeași structură poză + text, doar introduse de secțiunea asta.
  const bServicii = bloc(prima, 'sectiunea de servicii', 'secțiunea de servicii')
  const titluServicii = camp(bServicii, 'titlu')
  const services = titluServicii
    ? {
        eyebrow: camp(bServicii, 'eticheta') ?? '',
        title: titluServicii,
        lede: camp(bServicii, 'text introductiv') ?? '',
        cta: cta(bServicii?.campuri.get('buton'), 'ghost', link),
      }
    : undefined

  /* ---------------------------------------------------------------- */
  /* 14 · Pagina de contact                                            */
  /* ---------------------------------------------------------------- */

  const bSectiuneContact = bloc(contactPaginaSursa, 'secțiune', 'sectiune')
  const bAcces = bloc(contactPaginaSursa, 'cum ajungi')
  const contactPage = {
    section: sectiuneNumita(bSectiuneContact, t.navContact),
    acces: bAcces?.text.trim()
      ? {
          title: camp(bAcces, 'titlu') ?? bAcces.titlu,
          text: bAcces.text.trim(),
          bullets: lista(bAcces.campuri.get('buline')),
        }
      : undefined,
  }

  /* ---------------------------------------------------------------- */
  /* 03 · Clip de prezentare (T60) — vertical, click-to-play          */
  /* ---------------------------------------------------------------- */

  const bPrezentare = bloc(prima, 'clip de prezentare')
  const prezentareVideo = fisierMedia(
    bPrezentare?.campuri.get('video'),
    EXT_VIDEO,
    { fisier: FISIERE.primaPagina, unde: 'Clip de prezentare', linie: bPrezentare?.linie },
    poze,
    raport,
  )
  const prezentarePoster = poza(
    bPrezentare?.campuri.get('poster'),
    { fisier: FISIERE.primaPagina, unde: 'Clip de prezentare', linie: bPrezentare?.linie },
    poze,
    raport,
  )
  // Secțiunea apare doar cu video ȘI poster: un clip fără poster e o zonă
  // goală până la click (REGULI.md 3 — mai bine lipsă decât pe jumătate).
  if (prezentareVideo && !prezentarePoster) {
    raport.eroare({
      fisier: FISIERE.primaPagina,
      unde: 'Clip de prezentare',
      linie: bPrezentare?.linie,
      mesaj: 'Clipul de prezentare are „Video:", dar n-are „Poster:".',
      solutie:
        'Scrie la „Poster:" numele unui cadru din clip (imagine din poze/). Fără poster, secțiunea nu se afișează.',
    })
  }
  const prezentare =
    prezentareVideo && prezentarePoster
      ? {
          eyebrow: camp(bPrezentare, 'eticheta') ?? '',
          title: camp(bPrezentare, 'titlu') ?? '',
          text: camp(bPrezentare, 'text') ?? bPrezentare?.text ?? '',
          video: prezentareVideo,
          poster: prezentarePoster,
        }
      : undefined

  /* ---------------------------------------------------------------- */
  /* 10 · Rezervări (contractul cu T12)                                */
  /* ---------------------------------------------------------------- */

  const bRez = bloc(rezervari, 'rezervări', 'rezervari')
  const bRezLimba = bloc(rezervariLimba, 'rezervări', 'rezervari')
  // Din folderul limbii dacă există acolo, altfel din română (vezi
  // `rezervariLimba`, mai sus).
  const bEtichete = bloc(rezervariLimba, 'etichete') ?? bloc(rezervari, 'etichete')
  /*
   * Adresa motorului e structurală, dar are o EXCEPȚIE de limbă: motoarele
   * mari servesc aceeași proprietate pe URL-uri diferite per limbă
   * (`…/pensiunea-izora.ro.html` vs `.en-gb.html`). Un oaspete englez trimis
   * pe varianta românească vede pagina în română — deci dacă `en/10-…` are
   * un „Adresă:" propriu, el câștigă. Tipul și furnizorul rămân din română:
   * alea chiar sunt aceleași pe tot site-ul.
   */
  const adresaMotor = camp(bRezLimba, 'adresa') || camp(bRez, 'adresa') || ''
  const tipRezervare = (camp(bRez, 'tip') ?? 'formular').toLowerCase()

  if (tipRezervare !== 'formular' && !adresaMotor) {
    raport.eroare({
      fisier: FISIERE.rezervari,
      unde: 'Rezervări',
      mesaj: `Tipul e „${tipRezervare}", dar „Adresă:" e goală.`,
      solutie:
        'Scrie adresa motorului de rezervări, sau pune „Tip: formular" ca cererile să vină pe email.',
    })
  }

  /* ---------------------------------------------------------------- */
  /* 11 · Temă                                                         */
  /* ---------------------------------------------------------------- */

  const bCulori = bloc(stil, 'culori')
  const bFonturi = bloc(stil, 'fonturi')
  const c = (cheie: string, implicit: string) => camp(bCulori, cheie) ?? implicit

  /* ---------------------------------------------------------------- */
  /* 12 · Legal (REGULI.md 14)                                         */
  /* ---------------------------------------------------------------- */

  const bFirma = bloc(legalSursa, 'firm')
  const denumire = camp(bFirma, 'denumire')
  const cui = camp(bFirma, 'cui')
  if (!denumire || !cui) {
    raport.avertisment({
      fisier: FISIERE.legal,
      unde: 'Firmă',
      mesaj: 'Denumirea firmei sau CUI-ul lipsesc din footer.',
      solutie:
        'Completează-le înainte de lansare. Sunt obligatorii pentru un site de cazare care primește cereri online — lipsa lor e motiv de amendă ANPC.',
    })
  }

  const bDocumente = bloc(legalSursa, 'documente legale')
  // Etichetele sunt ale motorului (paginile legale sunt ale lui), deci se
  // traduc din `etichete.ts`; adresele rămân cele scrise în `12-firma-si-documente-legale.md`
  // și se traduc mai târziu, la randare, prin `traduSegment` (T76).
  const linkuriLegale = [
    [t.politicaConfidentialitate, camp(bDocumente, 'politica de confidentialitate')],
    [t.politicaCookies, camp(bDocumente, 'politica de cookies')],
    [t.termeniSiConditii, camp(bDocumente, 'termeni si conditii')],
    [t.politicaAnulare, camp(bDocumente, 'politica de anulare')],
  ].flatMap(([label, href]) => (label && href ? [{ label, href: link(href) }] : []))

  /* ---------------------------------------------------------------- */
  /* Navigația — se generează din ce EXISTĂ, nu dintr-o listă fixă    */
  /* ---------------------------------------------------------------- */

  // Meniul restaurantului are ACUM pagină proprie (`app/[limba]/meniu/`),
  // pe lângă secțiunea opțională de pe prima pagină. Deci linkul din antet
  // duce la pagină, nu la ancora `/#meniu`: e adresa care se indexează și
  // singura care funcționează și de pe /camere sau /zona, nu doar de pe
  // prima pagină.
  //
  // Contactul are și el pagina lui, `app/[limba]/contact/`, iar
  // `id="contact"` rămâne pe subsol pentru ancorele vechi.
  //
  // `meniuVizibil` rămâne despre SECȚIUNEA de pe prima pagină, care e
  // separată de pagină și se aprinde din lista de secțiuni.
  const meniuVizibil = setari.module.meniuRestaurant && setari.sectiuni.includes('menu')

  // Etichetele vin din `etichete.ts`, nu scrise aici: meniul e al
  // motorului, deci pe /en trebuie să fie „Rooms", nu „Camere" (T76).
  //
  // Și ADRESELE se traduc, tot aici: pe /en meniul trebuie să ducă la
  // `/en/rooms`, nu la `/camere` — altfel primul click din antet scotea
  // vizitatorul înapoi pe română. `link()` face amândouă pașii: segmentul
  // tradus (`traduSegment`) și prefixul de limbă (`caleaPublica`).
  // Ancorele de pe prima pagină (`/#contact`) trec și ele prin el, ca să
  // primească prefixul.
  const nav = [
    camere.length ? { label: t.navCamere, href: link('/camere') } : null,
    oferte.length ? { label: t.navOferte, href: link('/oferte') } : null,
    setari.module.meniuRestaurant ? { label: t.navRestaurant, href: link('/meniu') } : null,
    setari.module.evenimente ? { label: t.navEvenimente, href: link('/evenimente') } : null,
    setari.module.galerieExtinsa ? { label: t.navGalerie, href: link('/galerie') } : null,
    setari.module.zona ? { label: t.navZona, href: link('/zona') } : null,
    { label: t.navContact, href: link('/contact') },
  ].filter((x): x is { label: string; href: string } => x !== null)

  const date: SiteData = {
    meta: {
      sourceUrl: '',
      generatedAt: new Date().toISOString(),
      locale: limba === 'ro' ? 'ro-RO' : 'en-GB',
      localeShort: limba,
      currency: 'RON',
      currencySymbol: 'lei',
    },
    brand: {
      name: numeLocatie ?? '',
      shortName: numeScurt,
      tagline: slogan,
      // Monogramă din inițiale, doar dacă n-are logo. Nu e „date
      // inventate": e o reprezentare a numelui pe care îl avem deja.
      monogram: (numeScurt || numeLocatie || '')
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] ?? '')
        .join('')
        .toUpperCase(),
      logo,
      stars: stele,
    },
    theme: {
      colors: {
        ink: c('text principal', '#17201C'),
        inkSoft: c('text secundar', '#414D47'),
        muted: c('text estompat', '#64706B'),
        line: c('linii si margini', '#E3DED5'),
        canvas: c('fundal pagina', '#FCFBF9'),
        surface: c('fundal carduri', '#FFFFFF'),
        surfaceAlt: c('fundal sectiuni alternante', '#F4F1EC'),
        brand: c('culoare principala', '#1F3D33'),
        brandLift: c('culoare principala, varianta deschisa', '#2C5648'),
        onBrand: c('text pe culoarea principala', '#FFFFFF'),
        accent: c('culoare de accent', '#8A5A22'),
        accentLift: c('culoare de accent, varianta deschisa', '#C79B5C'),
        positive: c('culoare de confirmare', '#2E7D5B'),
        attention: c('culoare de atentionare', '#B03A2E'),
      },
      fonts: {
        display: camp(bFonturi, 'font pentru titluri') ?? 'Satoshi',
        body: camp(bFonturi, 'font pentru text') ?? 'Inter',
        displayStack: `'${camp(bFonturi, 'font pentru titluri') ?? 'Satoshi'}', 'Inter', system-ui, sans-serif`,
        bodyStack: `'${camp(bFonturi, 'font pentru text') ?? 'Inter'}', system-ui, sans-serif`,
        displaySpec: '',
        bodySpec: '',
        displayTracking: '-0.02em',
      },
      radius: camp(bFonturi, 'rotunjire colturi') ?? '14px',
      character: (camp(bFonturi, 'caracter') ?? 'warm') as SiteData['theme']['character'],
    },
    seo: {
      title: numeLocatie ? `${numeLocatie}${oras ? ` · ${oras}` : ''}` : '',
      description: descriere,
      canonical: '',
      ogImage: heroImagine,
    },
    contact: {
      phone: telefonAfisat,
      // `tel:` are nevoie de forma fără spații; afișarea rămâne lizibilă.
      phoneHref: telefon ? `tel:${telefon.replace(/[^\d+]/g, '')}` : '',
      // Numărul brut, nu un link. Butoanele de disponibilitate își
      // construiesc singure `wa.me` cu mesajul lor (`lib/whatsapp.ts`),
      // iar mesajul diferă de la buton la buton.
      whatsapp: whatsapp ?? undefined,
      email,
      street: camp(bAdr, 'strada') ?? '',
      city: oras,
      region: camp(bAdr, 'judet'),
      postalCode: camp(bAdr, 'cod postal'),
      country: camp(bAdr, 'tara') ?? t.tara,
      countryCode: 'RO',
      lat: numar(camp(bGps, 'latitudine')),
      lng: numar(camp(bGps, 'longitudine')),
      mapsUrl: camp(bGps, 'link google maps'),
      hours: program(bProgram, t),
      social,
    },
    nav,
    locales: [],
    ui: t,
    hero: {
      headline: camp(bHero, 'titlu') ?? numeLocatie ?? '',
      sub: camp(bHero, 'subtitlu') ?? slogan,
      image: heroImagine ?? '',
      // Gol → Șablonul 4 cade pe poza unică de mai sus (vezi HeroCarusel).
      slides,
      badges: [],
    },
    signature,
    story,
    services,
    contactPage,
    rating,
    trust,
    perks: { section: sectiune(bloc(prima, 'facilit')), items: facilitati },
    rooms: { section: sectiune(bloc(prima, 'camere')), items: camere },
    features,
    prezentare,
    // Titlurile de secțiune se citesc din blocul `## Secțiune` al fiecărui
    // fișier și se traduc pe /en (T61); fără bloc, se cade pe valoarea de
    // dinainte, deci un client fără blocul respectiv se randează neschimbat.
    offers: { section: sectiuneNumita(bSectiuneOferte, t.sectiuneOferte), items: oferte },
    // Excursiile împart lista `offers.items` cu pachetele (același fișier,
    // aceeași pagină `/oferte/<slug>`) și se despart la randare, după
    // `kind`. Doar antetul lor de secțiune e separat.
    excursions: { section: sectiuneNumita(bSectiuneExcursii, t.sectiuneExcursii) },
    events: { section: { eyebrow: '', title: t.sectiuneEvenimente, lede: '' }, items: [] },
    reviews: { section: sectiuneNumita(bSectiuneRecenzii, t.sectiuneRecenzii), items: recenzii },
    faq: { section: sectiuneNumita(bSectiuneFaq, t.sectiuneIntrebari), items: faq },
    area: { section: sectiuneNumita(bSectiuneZona, t.sectiuneZona), items: zona },
    closing: {
      eyebrow: camp(bloc(prima, 'închidere', 'inchidere'), 'eticheta') ?? '',
      title: camp(bloc(prima, 'închidere', 'inchidere'), 'titlu') ?? '',
      text: camp(bloc(prima, 'închidere', 'inchidere'), 'text') ?? '',
      cta: cta(bloc(prima, 'închidere', 'inchidere')?.campuri.get('buton'), 'accent', link) ?? {
        label: '',
        href: '',
      },
    },
    booking: {
      engineUrl: adresaMotor,
      sameOrigin: false,
      assurances: lista(bEtichete?.campuri.get('asigurari')),
      labels: {
        checkIn: camp(bEtichete, 'sosire') ?? t.sosire,
        checkOut: camp(bEtichete, 'plecare') ?? t.plecare,
        guests: camp(bEtichete, 'persoane') ?? t.persoane,
        submit: camp(bEtichete, 'text buton') ?? t.verificaDisponibilitatea,
        // Astea două n-au avut niciodată de unde fi suprascrise din
        // `10-rezervari-si-plati.md`, deci erau românești și pe /en.
        from: t.dela,
        perNight: t.peNoapte,
      },
      guestOptions: lista(bEtichete?.campuri.get('optiuni persoane')),
      // Vocabularul din fișier (link/widget/formular) → modul intern.
      mod: tipRezervare === 'link' ? 'deep-link' : tipRezervare === 'widget' ? 'iframe' : 'formular',
      furnizor: camp(bRez, 'sistem')?.toLowerCase(),
    },
    // Plăți online (T13) — implicit OPRIT. Se pornește explicit din date/10.
    payments: {
      enabled: ['da', 'activ', 'pornit', 'true', 'on'].includes(
        (camp(bloc(rezervari, 'plăți', 'plati'), 'activ') ?? 'nu').toLowerCase(),
      ),
    },
    legal: {
      company: denumire ?? '',
      registration: [cui, camp(bFirma, 'nr. reg. com.')].filter(Boolean).join(' · ') || undefined,
      links: linkuriLegale,
    },
    mockup: { enabled: false, notice: '' },
  }

  // WhatsApp e un canal de rezervare, nu o rețea socială — de asta stă
  // separat, nu în `social`.
  if (whatsapp && setari.butonWhatsApp) {
    date.contact.social.unshift({ label: 'WhatsApp', icon: 'phone', url: `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}` })
  }

  return { date, setari, raport, poze }
}
