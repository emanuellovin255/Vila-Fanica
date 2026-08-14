import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Antet, BaraLipita, PaginaContact, Subsol } from '@/components/sectiuni'
import { JsonLd } from '@/components/JsonLd'
import { Miscare } from '@/components/Miscare'
import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import type { SiteData } from '@/content/types'
import { construiesteMeta, baseUrl } from '@/lib/seo/meta'
import { schemaBreadcrumb } from '@/lib/seo/jsonld'
import { siteCurent } from '@/lib/site'

/**
 * Pagina de contact.
 *
 * Până acum „Contact" din meniu era `/#contact`, adică o ancoră spre
 * subsolul paginii curente: derula până jos și atât. Nicio adresă
 * proprie de dat mai departe, niciun formular, nicio hartă, nimic de
 * indexat. Cerință de client: pagină separată.
 *
 * `PaginaContact` ține conținutul; aici stau doar ruta, metadatele și
 * breadcrumb-ul, ca la celelalte pagini.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string }>
}): Promise<Metadata> {
  const { limba } = await params
  if (!esteLimba(limba)) return {}
  const { date, setari } = siteCurent(limba as Limba)
  const titlu = date.contactPage?.section.title || date.ui.navContact

  return construiesteMeta(date, limba as Limba, {
    titlu,
    descriere:
      date.contactPage?.section.lede ||
      [date.brand.name, date.contact.phone, date.contact.email].filter(Boolean).join(' · '),
    cale: '/contact',
    limbiDisponibile: limbiActive(setari.module.engleza),
  })
}

export default async function Contact({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba
  const { date: dateBaza, setari } = siteCurent(lang)

  // Comutatorul de limbă trebuie să ducă la pagina echivalentă din
  // cealaltă limbă, nu la prima pagină (T76).
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(lang, '/contact', limbiActive(setari.module.engleza)),
  }

  return (
    <>
      <Miscare />
      <JsonLd
        data={schemaBreadcrumb(
          [
            { nume: date.ui.acasa, cale: '/' },
            { nume: date.contactPage?.section.title || date.ui.navContact, cale: '/contact' },
          ],
          baseUrl(),
        )}
      />
      <Antet date={date} />
      <PaginaContact date={date} />
      <Subsol date={date} />
      <BaraLipita date={date} />
    </>
  )
}
