import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Antet, BaraLipita, Excursii, Oferte, Subsol } from '@/components/sectiuni'
import { JsonLd } from '@/components/JsonLd'
import { Miscare } from '@/components/Miscare'
import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import type { SiteData } from '@/content/types'
import { construiesteMeta, baseUrl } from '@/lib/seo/meta'
import { schemaBreadcrumb } from '@/lib/seo/jsonld'
import { siteCurent } from '@/lib/site'

/** Lista de oferte și excursii. Fiecare card duce la pagina lui (T61). */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string }>
}): Promise<Metadata> {
  const { limba } = await params
  if (!esteLimba(limba)) return {}
  const { date, setari } = siteCurent(limba)
  return construiesteMeta(date, limba, {
    titlu: date.offers.section.title,
    descriere: date.offers.section.lede || `${date.ui.descriereOferte} ${date.brand.name}.`,
    cale: '/oferte',
    limbiDisponibile: limbiActive(setari.module.engleza),
  })
}

export default async function ListaOferte({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba
  const { date: dateBaza, setari } = siteCurent(lang)

  // Comutatorul de limbă trebuie să ducă la pagina echivalentă din
  // cealaltă limbă, nu la prima pagină (T76).
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(lang, '/oferte', limbiActive(setari.module.engleza)),
  }
  const base = baseUrl()

  return (
    <>
      <Miscare />
      <JsonLd
        data={schemaBreadcrumb(
          [
            { nume: date.ui.acasa, cale: '/' },
            { nume: date.offers.section.title, cale: '/oferte' },
          ],
          base,
        )}
      />
      <Antet date={date} />
      <main id="continut">
        <Oferte date={date} />
        {/* Excursiile au acum secțiunea lor (T75); pagina le arată pe
            amândouă, ca înainte, doar că despărțite. */}
        <Excursii date={date} />
      </main>
      <Subsol date={date} />
      <BaraLipita date={date} />
    </>
  )
}
