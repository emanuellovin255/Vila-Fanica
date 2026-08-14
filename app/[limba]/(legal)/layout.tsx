import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { Antet, Subsol } from '@/components/sectiuni'
import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import type { SiteData } from '@/content/types'
import { siteCurent } from '@/lib/site'

/**
 * Chrome-ul comun al paginilor legale (T11): antet + subsol, ca vizitatorul
 * să navigheze normal de pe o politică. Conținutul fiecărei pagini vine din
 * `page.tsx`. Grupul de rute `(legal)` nu adaugă segment în URL — paginile
 * rămân la `/politica-confidentialitate`, `/termeni` etc.
 *
 * Trăiește sub `[limba]` (nu la `app/(legal)/`) ca să primească `<html lang>`
 * din layout-ul rădăcină și rutele localizate din middleware.
 */
export default async function LayoutLegal({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ limba: string }>
}) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba
  const { date: dateBaza, setari } = siteCurent(lang)

  // Comutatorul de limbă din antet are nevoie de `locales`. Layout-ul nu
  // știe pe care politică se află, deci trimite la prima pagină din
  // cealaltă limbă: mai bine un comutator care duce acasă decât niciun
  // comutator, cum era până la T76.
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(lang, '/', limbiActive(setari.module.engleza)),
  }

  return (
    <>
      <Antet date={date} />
      <main id="continut">
        <div className="wrap">
          <article className="legal">{children}</article>
        </div>
      </main>
      <Subsol date={date} />
    </>
  )
}
