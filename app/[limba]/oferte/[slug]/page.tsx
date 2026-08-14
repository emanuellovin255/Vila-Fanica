import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Antet, BaraLipita, PaginaOferta, Subsol } from '@/components/sectiuni'
import { JsonLd } from '@/components/JsonLd'
import { Miscare } from '@/components/Miscare'
import { esteLimba, LIMBI, type Limba } from '@/lib/i18n/limbi'
import { caiPereche } from '@/lib/i18n/perechi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import type { SiteData } from '@/content/types'
import { construiesteMeta, baseUrl } from '@/lib/seo/meta'
import { schemaBreadcrumb, schemaOferta } from '@/lib/seo/jsonld'
import { siteCurent } from '@/lib/site'

/**
 * Pagina individuală a unei oferte sau a unui traseu de excursie (T61),
 * construită după modelul `camere/[slug]/page.tsx`. La Belvedere, cele 7
 * trasee sunt principalul diferențiator — fiecare merită o pagină proprie
 * indexabilă („excursie Pădurea Letea din Murighiol" e o căutare reală).
 */

export function generateStaticParams() {
  const params: { limba: string; slug: string }[] = []
  for (const limba of LIMBI) {
    const { date, setari } = siteCurent(limba)
    if (limba === 'en' && !setari.module.engleza) continue
    for (const o of date.offers.items) params.push({ limba, slug: o.slug })
  }
  return params
}

async function oferta(limbaBruta: string, slug: string) {
  if (!esteLimba(limbaBruta)) return null
  const { date, setari } = siteCurent(limbaBruta)
  const of = date.offers.items.find((o) => o.slug === slug)
  return of ? { date, setari, of, limba: limbaBruta as Limba } : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string; slug: string }>
}): Promise<Metadata> {
  const { limba, slug } = await params
  const g = await oferta(limba, slug)
  if (!g) return {}
  const { date, setari, of } = g
  const limbi = limbiActive(setari.module.engleza)

  return construiesteMeta(date, g.limba, {
    titlu: of.title,
    descriere: of.summary || `${date.ui.descriereOferte} ${date.brand.name}.`,
    cale: `/oferte/${of.slug}`,
    imagine: of.image || date.seo.ogImage,
    limbiDisponibile: limbi,
    // Slug-ul aceleiași oferte în cealaltă limbă: se mapează după poziția
    // din fișier, nu se poate deduce din text (T76).
    caiPerLimba: caiPereche('oferte', of.slug, g.limba, limbi),
  })
}

export default async function Oferta({
  params,
}: {
  params: Promise<{ limba: string; slug: string }>
}) {
  const { limba, slug } = await params
  const g = await oferta(limba, slug)
  if (!g) notFound()
  const { date: dateBaza, setari, of, limba: lang } = g
  const base = baseUrl()
  const limbi = limbiActive(setari.module.engleza)

  // Comutatorul de limbă trebuie să ducă la ACEEAȘI ofertă în cealaltă
  // limbă, nu la prima pagină.
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(
      lang,
      `/oferte/${of.slug}`,
      limbi,
      caiPereche('oferte', of.slug, lang, limbi),
    ),
  }

  return (
    <>
      <Miscare />
      <JsonLd data={schemaOferta(of, date, base)} />
      <JsonLd
        data={schemaBreadcrumb(
          [
            { nume: date.ui.acasa, cale: '/' },
            { nume: date.offers.section.title, cale: '/oferte' },
            { nume: of.title, cale: `/oferte/${of.slug}` },
          ],
          base,
        )}
      />
      <Antet date={date} />
      <PaginaOferta oferta={of} date={date} />
      <Subsol date={date} />
      <BaraLipita date={date} />
    </>
  )
}
