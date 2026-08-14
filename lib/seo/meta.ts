import type { Metadata } from 'next'

import type { SiteData } from '@/content/types'
import { caleaPublica, LIMBA_IMPLICITA, LIMBI, LOCALE_COMPLETE, type Limba } from '@/lib/i18n/limbi'
import { traduSegment } from '@/lib/i18n/rute'

/**
 * Metadatele unei pagini: titlu și description UNICE, canonical, OG,
 * Twitter Card, hreflang.
 *
 * Titlul și description-ul se generează din datele PAGINII, nu ale
 * site-ului (T07): o pagină de cameră are titlul camerei, nu al
 * locației. Duplicatele se verifică în `npm run verifica` (T32).
 *
 * `NEXT_PUBLIC_SITE_URL` e originul canonic. Fără el (dezvoltare), se
 * cade pe un placeholder — canonical-ul iese relativ, dar build-ul nu
 * se oprește.
 */
export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

export interface MetaPagina {
  /** Titlul paginii, fără numele locației — acela se adaugă aici. */
  titlu: string
  descriere?: string
  /** Calea limbii implicite, fără prefix. Ex: `/camere/apartament-deluxe` */
  cale: string
  /** Poza pentru OG, dacă pagina are una proprie (altfel og:image global). */
  imagine?: string
  /** Limbile în care EXISTĂ pagina asta. `/en` apare doar dacă e tradusă. */
  limbiDisponibile?: Limba[]
  /**
   * Calea internă pe limbă, pentru paginile `[slug]`: acolo slug-ul
   * diferă între limbi și nu se poate traduce dintr-o hartă de segmente.
   * Se calculează cu `caiPereche()` din `lib/i18n/perechi.ts`.
   */
  caiPerLimba?: Partial<Record<Limba, string>>
}

export function construiesteMeta(date: SiteData, limba: Limba, pagina: MetaPagina): Metadata {
  const base = baseUrl()
  const numeLocatie = date.brand.name
  const titluComplet = pagina.titlu
    ? `${pagina.titlu} · ${numeLocatie}`
    : `${numeLocatie}${date.contact.city ? ` · ${date.contact.city}` : ''}`

  // Adresa PUBLICĂ a paginii într-o limbă: slug-ul perechii (dacă pagina
  // l-a calculat) plus segmentul tradus plus prefixul de limbă. Toate trei
  // trebuie aplicate; sărind unul, canonical-ul și hreflang-ul arată către
  // adrese care nu există — pe engleză, `/en/camere/...` în loc de
  // `/en/rooms/...` (T76).
  const adresa = (l: Limba) => base + caleaPublica(l, traduSegment(pagina.caiPerLimba?.[l] ?? pagina.cale, l))

  const canonical = adresa(limba)
  const imagine = pagina.imagine ?? date.seo.ogImage

  // hreflang în ambele direcții, plus x-default. Se generează doar
  // pentru limbile în care pagina chiar există (T08): un hreflang către
  // o pagină inexistentă e ignorat de Google.
  const disponibile = pagina.limbiDisponibile ?? LIMBI.filter((l) => l === LIMBA_IMPLICITA)
  const languages: Record<string, string> = {}
  for (const l of disponibile) {
    languages[l] = adresa(l)
  }
  languages['x-default'] = adresa(LIMBA_IMPLICITA)

  return {
    title: titluComplet,
    description: pagina.descriere || date.seo.description,
    // Paginile reale de conținut SUNT indexabile: suprascriu plasa de
    // siguranță `noindex` din layout (care ține paginile de probă, ce
    // nu generează metadate proprii, în afara indexului).
    robots: { index: true, follow: true },
    alternates: { canonical, languages },
    openGraph: {
      title: titluComplet,
      description: pagina.descriere || date.seo.description,
      url: canonical,
      siteName: numeLocatie,
      locale: LOCALE_COMPLETE[limba],
      type: 'website',
      images: imagine
        ? [{ url: base + imagine, width: 1200, height: 630, alt: pagina.titlu || numeLocatie }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: titluComplet,
      description: pagina.descriere || date.seo.description,
      images: imagine ? [base + imagine] : undefined,
    },
  }
}
