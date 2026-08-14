import type { SiteData } from '@/content/types'
import { pret } from '@/lib/format'
import { ruteleSitului } from './rute'
import type { Setari } from '@/lib/continut'

/**
 * Generează llms.txt din SiteData.
 *
 * Model: Siteuri gata/Agentia mea/llms.txt (T07). Fișierul e o hartă
 * curată, în text, pentru asistenții AI (ChatGPT, Perplexity, Google AI
 * Overviews): răspunsuri directe la întrebări reale — prețuri, ce e
 * inclus, politica de anulare, distanțe.
 *
 * Ca și restul site-ului: doar date confirmate (REGULI.md 3). O cameră
 * fără preț apare fără preț, nu cu unul inventat.
 */
export function genereazaLlms(date: SiteData, setari: Setari, base: string): string {
  const l: string[] = []
  const linie = (s = '') => l.push(s)

  linie(`# ${date.brand.name}`)
  linie()
  if (date.seo.description) {
    linie(`> ${date.seo.description}`)
    linie()
  } else if (date.brand.tagline) {
    linie(`> ${date.brand.tagline}`)
    linie()
  }

  // Cazare — cu prețuri reale, în text, ca un asistent AI să le poată cita.
  if (date.rooms.items.length) {
    linie('## Cazare')
    linie()
    for (const c of date.rooms.items) {
      const detalii = [c.occupancy, c.bed, c.size].filter(Boolean).join(', ')
      const p = c.priceFrom !== undefined ? ` — de la ${pret(c.priceFrom, date.meta.currencySymbol)}/noapte` : ''
      linie(`### ${c.name}${p}`)
      if (detalii) linie(`- ${detalii}`)
      if (c.description) linie(`- ${c.description}`)
      linie(`- Pagină: ${base}/camere/${c.slug}`)
      linie()
    }
  }

  if (date.offers.items.length) {
    linie('## Oferte')
    linie()
    for (const o of date.offers.items) {
      const p = o.price ? ` — ${o.price}${o.priceUnit ? ` ${o.priceUnit}` : ''}` : ''
      linie(`- **${o.title}**${p}. ${o.text}`)
    }
    linie()
  }

  if (date.perks.items.length) {
    linie('## Facilități')
    linie()
    for (const f of date.perks.items) {
      linie(`- **${f.title}.** ${f.text}`)
    }
    linie()
  }

  // FAQ-ul e aur pentru citarea în AI: întrebare reală, răspuns direct.
  if (date.faq.items.length) {
    linie('## Întrebări frecvente')
    linie()
    for (const f of date.faq.items) {
      linie(`**${f.q}**`)
      linie(f.a)
      linie()
    }
  }

  linie('## Contact')
  linie()
  if (date.contact.phone) linie(`- Telefon: ${date.contact.phone}`)
  if (date.contact.email) linie(`- Email: ${date.contact.email}`)
  const adresa = [date.contact.street, date.contact.city, date.contact.region].filter(Boolean).join(', ')
  if (adresa) linie(`- Adresă: ${adresa}`)
  if (date.contact.hours) linie(`- Program: ${date.contact.hours}`)
  linie()

  // Paginile importante, ca un asistent să știe unde să trimită.
  linie('## Pagini')
  linie()
  const rute = ruteleSitului(date, setari).filter((r) => r.prioritate >= 0.6)
  for (const r of rute) {
    linie(`- ${base}${r.cale === '/' ? '/' : r.cale}`)
  }
  linie()

  return l.join('\n')
}
