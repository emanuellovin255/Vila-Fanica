import type { MetadataRoute } from 'next'

import { ruteCuLimbi } from '@/lib/seo/rute'
import { baseUrl } from '@/lib/seo/meta'
import { siteCurent } from '@/lib/site'
import { LIMBA_IMPLICITA, type Limba } from '@/lib/i18n/limbi'

/**
 * sitemap.xml, generat din rutele REALE (T07).
 *
 * Conține exact paginile care se generează, niciuna în plus: `ruteCuLimbi`
 * le enumeră din datele și setările site-ului, deci o secțiune oprită nu
 * apare aici. `/en` apare doar dacă engleza e activată — un sitemap care
 * listează o pagină inexistentă e o eroare de crawl.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl()
  const { date, setari } = siteCurent()

  const limbi: Limba[] = setari.module.engleza ? ['ro', 'en'] : [LIMBA_IMPLICITA]
  const lastmod = date.meta.generatedAt

  // Datele se REÎNCARCĂ PENTRU FIECARE LIMBĂ, nu se prefixează cele
  // românești cu `/en`: slug-urile de cameră și de ofertă vin din numele
  // traduse, deci diferă între limbi. Vezi nota lungă din `ruteCuLimbi`.
  //
  // Meniul se încarcă separat de `SiteData`, deci condiția lui de rută nu
  // se poate calcula în `ruteleSitului` — se trimite de aici.
  return ruteCuLimbi((l) => {
    const { date: d, setari: s, meniu } = siteCurent(l)
    return { date: d, setari: s, areMeniu: meniu.length > 0 }
  }, limbi).map((r) => ({
    url: base + r.url,
    lastModified: lastmod,
    changeFrequency: r.frecventa,
    priority: r.prioritate,
  }))
}
