/* ============================================================
   scrie-md.ts — scrie fișierele editabile `date/*.md` din ce a
   extras analiza.

   Diferența față de `ingest.ts` din hotel-forge: acela scria
   `content/site.json`. Aici scriem formatul `.md` din T05, cel pe
   care îl editează un om. Regula REGULI.md 3 e absolută: un câmp pe
   care nu l-am găsit NU primește o valoare inventată — primește un
   comentariu HTML care spune ce lipsește și de la cine se cere.

   Comentariile sunt ignorate de parser (md.ts `faraComentarii`), deci
   nu ajung niciodată pe site. Sunt strict pentru omul care completează.
   ============================================================ */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Faq, Offer, Palette, Review, Room, Typography } from '../../content/types'

/** Tot ce a putut extrage analiza dintr-un site. Câmpurile absente rămân goluri. */
export interface Extras {
  nume: string
  numeScurt: string
  /** dedus din titlu? → se marchează în fișier pentru verificare */
  numeDedus: boolean
  slogan?: string
  descriere?: string
  stele?: number
  tip?: string
  logo?: string

  telefon?: string
  email?: string
  strada?: string
  oras?: string
  judet?: string
  codPostal?: string
  tara?: string
  lat?: number
  lng?: number
  mapsUrl?: string
  social: { label: string; url: string }[]

  camere: Room[]
  oferte: Offer[]
  recenzii: Review[]
  faq: Faq[]

  paleta: Palette
  fonturi: Typography
  rotunjire: string
  caracter: string

  rezervari: {
    tip: 'link' | 'widget' | 'formular'
    sistem?: string
    adresa?: string
  }
}

/** Un preț numeric înapoi în text simplu, fără să inventeze moneda. */
const nrText = (n: number | undefined) => (typeof n === 'number' ? String(n) : '')

/** Comentariu-gol standard: ce lipsește, de la cine se cere. */
const gol = (ce: string) => `<!-- ${ce} -->`

async function scrie(dir: string, nume: string, continut: string) {
  await writeFile(path.join(dir, 'date', nume), continut.replace(/\n{3,}/g, '\n\n').trimStart() + '\n')
}

/* ------------------------------------------------------------------ 01 */

function identitate(e: Extras): string {
  const stele = e.stele
    ? `Stele: ${e.stele}`
    : `Stele: \n${gol('Nu am găsit o clasificare oficială pe site. Pune-o doar dacă e reală — nu inventăm stele.')}`
  const tip = e.tip ? `Tip: ${e.tip}` : `Tip: \n${gol('Nu am dedus tipul locației. hotel · pensiune · cabană · chalet · resort · agropensiune · vilă')}`
  const logo = e.logo
    ? `Logo: ${e.logo}`
    : `Logo: \n${gol('Nu am găsit un logo utilizabil. Pune fișierul în poze/ și scrie numele aici.')}`
  const nume = e.numeDedus
    ? `Nume: ${e.nume}\n${gol('Numele a fost dedus din titlul paginii — verifică-l.')}`
    : `Nume: ${e.nume}`

  return `# Identitate

## Nume
${nume}
Nume scurt: ${e.numeScurt}

## Slogan
${e.slogan ? `Slogan: ${e.slogan}` : `Slogan: \n${gol('Sloganul nu se poate extrage — e singurul lucru care trebuie scris. O propoziție concretă, nu „cazare de calitate".')}`}

## Clasificare
${stele}
${tip}

## Logo
${logo}

## Descriere scurtă
${e.descriere ? `Descriere: ${e.descriere}` : `Descriere: \n${gol('Nu am găsit o meta-descriere. Scrie 2-3 propoziții pentru rezultatele Google și pentru WhatsApp.')}`}
`
}

/* ------------------------------------------------------------------ 02 */

function contact(e: Extras): string {
  const linii: string[] = ['# Contact', '', '## Telefon']
  if (e.telefon) {
    linii.push(`Telefon: ${e.telefon}`, `Telefon afișat: ${e.telefon}`)
  } else {
    linii.push('Telefon: ', 'Telefon afișat: ', gol('Nu am găsit un număr de telefon pe site. Pune-l pe cel la care răspund efectiv.'))
  }
  linii.push('WhatsApp: ', gol('Lasă gol dacă nu folosesc WhatsApp pentru rezervări.'))

  linii.push('', '## Email')
  linii.push(e.email ? `Email: ${e.email}` : `Email: \n${gol('Nu am găsit o adresă de email.')}`)

  linii.push('', '## Adresă')
  if (e.strada || e.oras) {
    linii.push(
      `Stradă: ${e.strada ?? ''}`,
      `Oraș: ${e.oras ?? ''}`,
      `Județ: ${e.judet ?? ''}`,
      `Cod poștal: ${e.codPostal ?? ''}`,
      `Țară: ${e.tara || 'România'}`,
    )
    if (!e.strada) linii.push(gol('Strada nu era în datele structurate — completează-o.'))
  } else {
    linii.push('Stradă: ', 'Oraș: ', 'Județ: ', 'Cod poștal: ', 'Țară: România', gol('Adresa nu era în datele structurate — completează-o exact cum apare pe documente.'))
  }

  linii.push('', '## Coordonate GPS')
  if (typeof e.lat === 'number' && typeof e.lng === 'number') {
    linii.push(`Latitudine: ${e.lat}`, `Longitudine: ${e.lng}`)
  } else {
    linii.push('Latitudine: ', 'Longitudine: ', gol('Fără coordonate, harta arată centrul orașului. Din Google Maps: click dreapta → primul rând.'))
  }
  if (e.mapsUrl) linii.push(`Link Google Maps: ${e.mapsUrl}`)
  else linii.push('Link Google Maps: ')

  linii.push('', '## Program')
  linii.push('Check-in: ', 'Check-out: ', 'Recepție: ', gol('Programul nu se extrage sigur — completează orele reale.'))

  if (e.social.length) {
    linii.push('', '## Rețele sociale')
    for (const s of e.social) linii.push(`${s.label}: ${s.url}`)
  }

  return linii.join('\n') + '\n'
}

/* ------------------------------------------------------------------ 04 */

function camere(e: Extras): string {
  if (!e.camere.length) {
    return `# Camere

##

Preț de la:
Persoane:
Pat:
Suprafață:
Poze:
Facilități:
Etichetă:

${gol('Nu am identificat camere pe site. Adaugă câte un bloc ## per cameră.')}
`
  }
  const blocuri = e.camere.map((c) => {
    const l: string[] = [`## ${c.name}`, '']
    l.push(
      c.priceFrom != null
        ? `Preț de la: ${nrText(c.priceFrom)}`
        : `Preț de la: \n${gol('Nu am găsit un preț pe site-ul lor pentru această cameră. Întreabă clientul.')}`,
    )
    l.push(`Persoane: ${c.occupancy ?? ''}`)
    l.push(`Pat: ${c.bed ?? ''}`)
    l.push(`Suprafață: ${c.size ?? ''}`)
    l.push(`Poze: ${c.image ? path.basename(c.image) : ''}`)
    if (!c.image) l.push(gol('Nu am descărcat o poză pentru această cameră. Pune cel puțin una în poze/.'))
    l.push(`Facilități: ${(c.amenities ?? []).join(', ')}`)
    l.push('Etichetă: ')
    if (c.description) l.push('', c.description)
    return l.join('\n')
  })
  return `# Camere\n\n${blocuri.join('\n\n')}\n`
}

/* ------------------------------------------------------------------ 06 */

function oferte(e: Extras): string {
  if (!e.oferte.length) {
    return `# Oferte și pachete

${gol('Nu am găsit oferte pe site. Lasă gol dacă locația nu are pachete — secțiunea nu se afișează.')}
`
  }
  const blocuri = e.oferte.map((o) => {
    const l: string[] = [`## ${o.title}`, '']
    l.push(o.price ? `Preț: ${o.price}` : `Preț: \n${gol('Nu am găsit un preț pentru acest pachet.')}`)
    if (o.priceWas) l.push(`Preț anterior: ${o.priceWas}`)
    l.push('Unitate: ', gol('Ce acoperă prețul: „pachet / 2 persoane / 2 nopți". Fără asta, vizitatorul nu știe la ce se referă suma.'))
    l.push(`Poza: ${o.image ? path.basename(o.image) : ''}`)
    l.push('Badge: ')
    l.push('Include: ', gol('Cel mai important câmp: câte un rând cu ce include pachetul.'))
    l.push('Valabil: ')
    if (o.text) l.push('', o.text)
    return l.join('\n')
  })
  return `# Oferte și pachete\n\n${blocuri.join('\n\n')}\n`
}

/* ------------------------------------------------------------------ 08 */

function recenzii(e: Extras): string {
  if (!e.recenzii.length) {
    return `# Recenzii

## Regula, înainte de orice

**O recenzie fără sursă nu se afișează pe site.** O recenzie inventată e o practică comercială incorectă.

${gol('Nu am găsit recenzii cu sursă pe site. Nu inventez: adaugă citate reale, cu autor și sursă (Google/Booking), altfel secțiunea nu se afișează.')}
`
  }
  const blocuri = e.recenzii.map((r) => {
    const titlu = r.quote.split(/[.!?]/)[0].slice(0, 60).trim()
    return [
      `## ${titlu}`,
      '',
      'Autor: ',
      'Sursă: ',
      'Data: ',
      `Notă: ${r.rating ?? ''}`,
      gol('Citatul a fost preluat de pe site, dar FĂRĂ autor și sursă. Completează-le (Google/Booking + luna/anul) sau șterge blocul — fără sursă nu se afișează (REGULI.md 3).'),
      '',
      r.quote,
    ].join('\n')
  })
  return `# Recenzii\n\n## Regula, înainte de orice\n\n**O recenzie fără sursă nu se afișează pe site.**\n\n${blocuri.join('\n\n')}\n`
}

/* ------------------------------------------------------------------ 09 */

function faq(e: Extras): string {
  if (!e.faq.length) {
    return `# Întrebări frecvente

##

${gol('Nu am găsit întrebări frecvente pe site. Scrie 6-10 din cele primite efectiv la telefon — contează pentru FAQPage schema și pentru asistenții AI.')}
`
  }
  const blocuri = e.faq.map((f) => `## ${f.q}\n\n${f.a}`)
  return `# Întrebări frecvente\n\n${blocuri.join('\n\n')}\n`
}

/* ------------------------------------------------------------------ 10 */

function rezervari(e: Extras): string {
  const r = e.rezervari
  const sistem = r.sistem ? `Sistem: ${r.sistem}` : 'Sistem: '
  const adresa = r.adresa
    ? `Adresă: ${r.adresa}\n${gol('Adresa detectată e pagina de start a motorului. Pentru „link" rezervă manual până la pasul de disponibilitate și pune adresa de acolo.')}`
    : `Adresă: `
  const nota =
    r.tip === 'formular'
      ? gol('Nu am detectat niciun motor de rezervări. Recomandarea: formular + telefon. La cabane telefonul rămâne canalul principal.')
      : gol(`Am detectat „${r.sistem}". Verifică tipul: „link" (buton către motorul lor, recomandat) sau „widget" (încărcat în pagină doar la cerere).`)

  return `# Rezervări și plăți

## Rezervări

Tip: ${r.tip}
${sistem}
${adresa}
${nota}

## Etichete

Text buton: Verifică disponibilitatea
Sosire: Sosire
Plecare: Plecare
Persoane: Oaspeți
Opțiuni persoane: 1 oaspete, 2 oaspeți, 3 oaspeți, 4 oaspeți, 5+ oaspeți

## Plăți online

Activ: nu
`
}

/* ------------------------------------------------------------------ 11 */

function culori(e: Extras): string {
  const p = e.paleta
  return `# Culori și fonturi

Culorile de mai jos au fost **extrase din logo-ul și din CSS-ul site-ului lor** de \`npm run analiza\`. Verifică-le vizual lângă logo înainte de lansare.

## Culori

Culoare principală: ${p.brand}
Culoare principală, variantă deschisă: ${p.brandLift}
Text pe culoarea principală: ${p.onBrand}

Culoare de accent: ${p.accent}
Culoare de accent, variantă deschisă: ${p.accentLift}

Fundal pagină: ${p.canvas}
Fundal carduri: ${p.surface}
Fundal secțiuni alternante: ${p.surfaceAlt}

Text principal: ${p.ink}
Text secundar: ${p.inkSoft}
Text estompat: ${p.muted}
Linii și margini: ${p.line}

Culoare de confirmare: ${p.positive}
Culoare de atenționare: ${p.attention}

## Fonturi

Font pentru titluri: ${e.fonturi.display}
Font pentru text: ${e.fonturi.body}
Rotunjire colțuri: ${e.rotunjire}
Caracter: ${e.caracter}
`
}

/* ------------------------------------------------------------------ */

/**
 * Scrie toate fișierele `date/*.md` din datele extrase. Nu atinge
 * 03-prima-pagina (texte de campanie — nu se extrag), 05-facilități,
 * 07-meniu, 12-legal: acelea rămân scheletul copiat, de completat de om.
 */
export async function scrieDate(dir: string, e: Extras): Promise<string[]> {
  const fisiere: [string, string][] = [
    ['01-nume-logo-si-descriere.md', identitate(e)],
    ['02-telefon-email-si-adresa.md', contact(e)],
    ['04-camere.md', camere(e)],
    ['06-oferte-si-excursii.md', oferte(e)],
    ['08-recenzii.md', recenzii(e)],
    ['09-intrebari-frecvente.md', faq(e)],
    ['10-rezervari-si-plati.md', rezervari(e)],
    ['11-culori-si-fonturi.md', culori(e)],
  ]
  for (const [nume, continut] of fisiere) await scrie(dir, nume, continut)
  return fisiere.map(([n]) => n)
}
