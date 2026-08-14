import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Antet, BaraLipita, Subsol, Zona } from '@/components/sectiuni'
import { JsonLd } from '@/components/JsonLd'
import { Miscare } from '@/components/Miscare'
import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import type { SiteData } from '@/content/types'
import { construiesteMeta, baseUrl } from '@/lib/seo/meta'
import { schemaBreadcrumb } from '@/lib/seo/jsonld'
import { siteCurent } from '@/lib/site'

/**
 * Pagina „Zona" — `Pagina „Zona": da` din `setari.md`, conținut din
 * `date/13-zona-si-atractii.md`.
 *
 * Ca și `/galerie`, modulul exista ca simplu comutator: pornit, punea „Zona" în
 * meniu și `/zona` în `sitemap.xml`, către o rută inexistentă. Aici lipsea mai
 * mult decât pagina — nu exista nici model de date, nici fișier de conținut,
 * nici componentă. Toate trei s-au adăugat odată cu ea.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string }>
}): Promise<Metadata> {
  const { limba } = await params
  if (!esteLimba(limba)) return {}
  const { date, setari } = siteCurent(limba as Limba)
  return construiesteMeta(date, limba as Limba, {
    titlu: date.area.section.title,
    descriere:
      date.area.section.lede ||
      date.ui.zonaDescriere.replace('{nume}', date.brand.name),
    cale: '/zona',
    limbiDisponibile: limbiActive(setari.module.engleza),
  })
}

export default async function PaginaZona({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba
  const { date: dateBaza, setari } = siteCurent(lang)

  // Comutatorul de limbă trebuie să ducă la pagina echivalentă din
  // cealaltă limbă, nu la prima pagină (T76).
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(lang, '/zona', limbiActive(setari.module.engleza)),
  }

  // Modulul oprit, sau fișierul gol: pagina nu există. O pagină „Zona" fără
  // atracții ar fi exact conținutul de umplutură pe care auditul îl reproșează
  // site-urilor pe care le înlocuim.
  if (!setari.module.zona || !date.area.items.length) notFound()

  return (
    <>
      <Miscare />
      <JsonLd
        data={schemaBreadcrumb(
          [
            { nume: date.ui.acasa, cale: '/' },
            { nume: date.area.section.title, cale: '/zona' },
          ],
          baseUrl(),
        )}
      />
      <Antet date={date} />
      <main id="continut">
        <Zona date={date} />
      </main>
      <Subsol date={date} />
      <BaraLipita date={date} />
    </>
  )
}
