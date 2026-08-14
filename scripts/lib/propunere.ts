/* ============================================================
   propunere.ts — cele trei decizii pe care le ia analiza:

     1. ce motor de rezervări folosesc (adaptorul din T12)
     2. ce șablon li se potrivește (unul din cele trei din C2)
     3. documentul PROPUNERE.md pe care îl citește omul

   Nimic de aici nu inventează conținut. Recomandarea de șablon și de
   feature-uri se sprijină pe ce s-a găsit efectiv pe site — o pagină de
   nunți, un meniu, footage video — nu pe presupuneri.
   ============================================================ */
import type { AuditReport } from '../../content/types'
import type { Crawled } from './extract'
import type { Extras } from './scrie-md'

/* --------------------------------------------------- motor de rezervări */

/**
 * Furnizorii pe care îi știe adaptorul din T12, plus cei pe care îi
 * întâlnim des la resorturile din România. Ordinea contează: cel mai
 * specific tipar câștigă (booking.previo.ro e Previo, nu Booking.com).
 */
const MOTOARE: { nume: string; re: RegExp }[] = [
  { nume: 'previo', re: /previo/i },
  { nume: 'hermes', re: /hermes|hermis/i },
  { nume: 'siteminder', re: /siteminder|thebookingbutton/i },
  { nume: 'cloudbeds', re: /cloudbeds/i },
  { nume: 'bookassist', re: /bookassist/i },
  { nume: 'profitroom', re: /profitroom/i },
  { nume: 'bookinglayer', re: /bookinglayer/i },
  { nume: 'travelclick', re: /travelclick|ihotelier/i },
  { nume: 'reservationsystem', re: /reservationsystem|reservi|sioux|bedbooking/i },
  { nume: 'booking.com', re: /booking\.com|admin\.booking/i },
]

export interface MotorDetectat {
  tip: 'link' | 'widget' | 'formular'
  sistem?: string
  adresa?: string
  /** Ce anume a trădat motorul — apare în PROPUNERE ca dovadă. */
  dovada?: string
}

/** Caută motorul în iframe-uri, în linkuri și în scripturi. */
export function detecteazaMotor(pages: Crawled[]): MotorDetectat {
  const candidati: { url: string; sursa: string }[] = []
  for (const p of pages) {
    p.$('iframe[src]').each((_, el) => {
      const src = p.$(el).attr('src')
      if (src) candidati.push({ url: src, sursa: 'iframe' })
    })
    p.$('a[href]').each((_, el) => {
      const href = p.$(el).attr('href')
      if (href && /book|rezerv|reserv|disponib|availab/i.test(href)) candidati.push({ url: href, sursa: 'link' })
    })
    p.$('script[src]').each((_, el) => {
      const src = p.$(el).attr('src')
      if (src) candidati.push({ url: src, sursa: 'script' })
    })
  }

  for (const motor of MOTOARE) {
    const hit = candidati.find((c) => motor.re.test(c.url))
    if (hit) {
      // Un iframe/script e widget încărcat în pagină; un link e „link".
      const tip = hit.sursa === 'iframe' || hit.sursa === 'script' ? 'widget' : 'link'
      return {
        tip,
        sistem: motor.nume,
        adresa: hit.sursa === 'link' ? hit.url : undefined,
        dovada: `găsit în ${hit.sursa}: ${hit.url.slice(0, 80)}`,
      }
    }
  }
  return { tip: 'formular', dovada: 'niciun motor de rezervări detectat în iframe-uri, linkuri sau scripturi' }
}

/* ----------------------------------------------------- recomandă șablon */

export interface RecomandareSablon {
  sablon: 1 | 2 | 3 | 4
  motiv: string
}

/**
 * - footage video utilizabil → Șablon 1 (Hero Video)
 * - resort / spa cu 12+ poze bune → Șablon 4 (Carusel editorial)
 * - 15+ poze bune, cabană / natură → Șablon 3 (Galerie editorială)
 * - altfel, sau o poveste clară de spus → Șablon 2 (Poveste alternantă)
 */
export function recomandaSablon(
  e: Extras,
  pages: Crawled[],
  imaginiDescarcate: number,
): RecomandareSablon {
  const html = pages.map((p) => p.html).join(' ').toLowerCase()
  const areVideo = pages.some((p) => p.$('video[src], video source[src]').length > 0)
  const eNatura = /caban|chalet|munte|pădure|padure|natur|lac|fores|rustic|conac/.test(html) || /caban|chalet|agropensiune/.test((e.tip ?? '').toLowerCase())
  // Un resort are mai multe lucruri de vândut deodată — spa, piscine,
  // restaurant, apă — și niciunul nu încape într-o singură poză de sus.
  // Exact cazul pentru care există Șablonul 4.
  const eResort = /resort|spa\b|wellness|piscin|jacuzzi|saun|aquapark/.test(html) || /resort|hotel|spa/.test((e.tip ?? '').toLowerCase())

  if (areVideo) {
    return { sablon: 1, motiv: 'Site-ul lor folosește deja video — Șablonul 1 (Hero Video) valorifică footage-ul. Pe mobil videoul nu se încarcă, deci nu costă viteză.' }
  }
  if (eResort && imaginiDescarcate >= 12) {
    return { sablon: 4, motiv: `Resort cu ${imaginiDescarcate} imagini utilizabile — Șablonul 4 (Carusel editorial) arată pe rând spa-ul, apa și restaurantul, fiecare cadru cu titlul lui. O singură poză de sus ar fi trebuit să aleagă unul și să-i piardă pe ceilalți.` }
  }
  if (imaginiDescarcate >= 15 || (eNatura && imaginiDescarcate >= 8)) {
    return { sablon: 3, motiv: `${imaginiDescarcate} imagini utilizabile${eNatura ? ' și o locație în natură' : ''} — Șablonul 3 (Galerie editorială) le pune în valoare, cu rezervarea lipită lângă galerie.` }
  }
  return { sablon: 2, motiv: 'Șablonul 2 (Poveste alternantă) — cel mai versatil, pentru o locație cu o poveste de spus și fără footage video sau o galerie foarte bogată.' }
}

/* ------------------------------------------------------ scrie PROPUNERE */

const SEV: Record<string, string> = { critic: 'CRITIC', important: 'IMPORTANT', minor: 'MINOR' }

/** Feature-uri propuse — DOAR dacă datele lor le justifică. */
function featuresPropuse(e: Extras, pages: Crawled[]): string[] {
  const out: string[] = []
  const html = pages.map((p) => p.html).join(' ').toLowerCase()
  const areMeniu = pages.some((p) => p.kind === 'dining') || /meniu|restaurant|mic dejun/.test(html)
  const areEvenimente = pages.some((p) => p.kind === 'events') || /nunt|eveniment|conferint|banquet/.test(html)
  const areEngleza = pages.some((p) => p.$('link[rel="alternate"][hreflang]').length > 0) || /\/en\b|lang="en"/.test(html)

  if (areMeniu) out.push('**Meniu restaurant** — au o pagină de restaurant / meniu. Pornește modulul și completează `date/07-meniu-restaurant.md`.')
  if (areEvenimente) out.push('**Spații de evenimente** — au conținut despre nunți sau conferințe. Pornește modulul „Spații de evenimente".')
  if (areEngleza) out.push('**Engleză** — site-ul are deja o versiune sau marcaj de limbă engleză. Pornește modulul și tradu `date/` în `en/`.')
  if (!out.length) out.push('Niciun feature opțional nu se justifică din datele lor. Site-ul de bază (camere, facilități, contact) e suficient.')
  return out
}

export function scriePropunere(
  e: Extras,
  audit: AuditReport,
  sablon: RecomandareSablon,
  pages: Crawled[],
  goluri: string[],
  imaginiDescarcate: number,
): string {
  const camereCuPret = e.camere.filter((c) => c.priceFrom != null).length
  const L: string[] = []

  L.push(`# Propunere — ${e.nume}`)
  L.push('')
  L.push(`> Generat de \`npm run analiza\` din ${audit.sourceUrl} la ${new Date().toLocaleDateString('ro-RO')}.`)
  L.push('> Un document de decizie, nu conținut de site. Citește-l în 5 minute, apoi rulează `npm run client-nou`.')
  L.push('')

  /* 1 */
  L.push('## 1 · Ce am extras')
  L.push('')
  L.push(`- **Nume:** ${e.nume}${e.numeDedus ? ' _(dedus din titlu — verifică)_' : ''}`)
  L.push(`- **Contact:** ${[e.telefon, e.email].filter(Boolean).join(' · ') || '_nimic găsit_'}`)
  L.push(`- **Adresă:** ${[e.strada, e.oras, e.judet].filter(Boolean).join(', ') || '_negăsită_'}`)
  L.push(`- **Camere:** ${e.camere.length} găsite, dintre care ${camereCuPret} cu preț pe site`)
  L.push(`- **Oferte:** ${e.oferte.length}`)
  L.push(`- **Recenzii:** ${e.recenzii.length} citate (fără autor/sursă — nu se afișează până nu le completezi)`)
  L.push(`- **Întrebări frecvente:** ${e.faq.length}`)
  L.push(`- **Imagini descărcate și re-encodate WebP:** ${imaginiDescarcate}`)
  L.push('')

  /* 2 */
  L.push('## 2 · Ce lipsește (de completat înainte de lansare)')
  L.push('')
  if (!goluri.length) L.push('_Datele extrase acoperă tot ce se poate extrage automat._')
  for (const g of goluri) L.push(`- ${g}`)
  L.push('')

  /* 3 */
  L.push('## 3 · Auditul site-ului actual')
  L.push('')
  L.push('_Argumentul de vânzare. Fiecare constatare are dovada măsurată, nu o afirmație generică._')
  L.push('')
  if (!audit.findings.length) {
    L.push('_Niciun defect major detectat — site-ul lor e făcut bine._')
  }
  for (const f of audit.findings) {
    L.push(`### [${SEV[f.severity]}] ${f.title}`)
    L.push(`- **Dovada:** ${f.evidence}`)
    L.push(`- **Ce facem în loc:** ${f.fix}`)
    L.push('')
  }

  /* 4 */
  L.push('## 4 · Șablonul recomandat')
  L.push('')
  const nume = {
    1: 'Hero Video',
    2: 'Poveste alternantă',
    3: 'Galerie editorială',
    4: 'Carusel editorial',
  }[sablon.sablon]
  L.push(`**Șablon ${sablon.sablon} · ${nume}**`)
  L.push('')
  L.push(sablon.motiv)
  L.push('')
  L.push('```bash')
  L.push(`npm run client-nou -- ${e.numeScurt.toLowerCase().replace(/\s+/g, '-')} --sablon ${sablon.sablon}`)
  L.push('```')
  L.push('')

  /* 5 */
  L.push('## 5 · Feature-uri propuse')
  L.push('')
  for (const f of featuresPropuse(e, pages)) L.push(`- ${f}`)
  L.push('')

  /* 6 */
  L.push('## 6 · Motorul de rezervări detectat')
  L.push('')
  if (e.rezervari.tip === 'formular') {
    L.push('**Fără motor de rezervări** — se recomandă formular + telefon.')
    L.push('')
    L.push('La cabane și pensiuni mici, telefonul rămâne canalul principal; formularul trimite cererea pe email, fără bază de date.')
  } else {
    L.push(`**${e.rezervari.sistem}** (tip: \`${e.rezervari.tip}\`)`)
    L.push('')
    L.push(`Adaptorul din T12 îl acoperă. ${e.rezervari.adresa ? `Adresă detectată: ${e.rezervari.adresa}` : ''}`)
  }
  L.push('')

  return L.join('\n') + '\n'
}
