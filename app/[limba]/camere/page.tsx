import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Antet, BaraLipita, Camere, Subsol } from '@/components/sectiuni'
import { JsonLd } from '@/components/JsonLd'
import { Miscare } from '@/components/Miscare'
import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import type { SiteData } from '@/content/types'
import { construiesteMeta, baseUrl } from '@/lib/seo/meta'
import { schemaBreadcrumb } from '@/lib/seo/jsonld'
import { siteCurent } from '@/lib/site'

/** Lista de camere. Fiecare card duce la pagina care prinde căutarea. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string }>
}): Promise<Metadata> {
  const { limba } = await params
  if (!esteLimba(limba)) return {}
  const { date, setari } = siteCurent(limba)
  return construiesteMeta(date, limba, {
    titlu: 'Camere',
    descriere: `${date.ui.descriereCamere} ${date.brand.name}.`,
    cale: '/camere',
    limbiDisponibile: limbiActive(setari.module.engleza),
  })
}

export default async function ListaCamere({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba
  const { date: dateBaza, setari } = siteCurent(lang)

  // Comutatorul de limbă trebuie să ducă la pagina echivalentă din
  // cealaltă limbă, nu la prima pagină (T76).
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(lang, '/camere', limbiActive(setari.module.engleza)),
  }
  const base = baseUrl()

  return (
    <>
      <Miscare />
      <JsonLd
        data={schemaBreadcrumb(
          [
            { nume: date.ui.acasa, cale: '/' },
            { nume: 'Camere', cale: '/camere' },
          ],
          base,
        )}
      />
      <Antet date={date} />
      <main id="continut">
        <Camere date={date} />
      </main>
      <Subsol date={date} />
      <BaraLipita date={date} />
    </>
  )
}
