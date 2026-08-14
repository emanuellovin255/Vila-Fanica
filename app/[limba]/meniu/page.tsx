import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Antet, BaraLipita, MeniuRestaurant, Subsol } from '@/components/sectiuni'
import { JsonLd } from '@/components/JsonLd'
import { Miscare } from '@/components/Miscare'
import type { SiteData } from '@/content/types'
import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import { construiesteMeta, baseUrl } from '@/lib/seo/meta'
import { schemaBreadcrumb, schemaMeniu } from '@/lib/seo/jsonld'
import { siteCurent } from '@/lib/site'

/**
 * Meniul restaurantului, la adresa lui.
 *
 * DE CE O PAGINĂ ȘI NU DOAR O SECȚIUNE
 * ------------------------------------
 * Secțiunea de pe prima pagină (`dispecer.tsx`, id `menu`) rămâne — e
 * bună pentru câteva specialități. Dar un meniu întreg nu încape acolo:
 * pe telefon ar însemna mii de pixeli de derulare între facilități și
 * hartă. Iar un PDF, varianta cealaltă, nu se indexează util — o căutare
 * de tipul „meniu bar Băile Felix prețuri" n-ar avea pe ce ateriza.
 *
 * Aici are: HTML real, cu preparate, gramaje, alergeni și prețuri, plus
 * `Menu` în JSON-LD.
 *
 * MODULUL E STINS LA THERMAL FAMILY RESORT. `setari.md` are
 * „Meniu restaurant: nu", fiindcă locația n-are încă un meniu publicat —
 * doar bar, snack bar și mic dejun bufet. Pagina se auto-anulează mai
 * jos (`notFound`), deci nu există și nu apare în sitemap. Codul stă
 * gata: se scrie meniul în `date/07-meniu-restaurant.md`, se pune „da" în
 * `setari.md`, și pagina apare fără nicio modificare de cod.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string }>
}): Promise<Metadata> {
  const { limba } = await params
  if (!esteLimba(limba)) return {}
  const lang = limba as Limba
  const { date, setari, meniu } = siteCurent(lang)
  if (!setari.module.meniuRestaurant || !meniu.length) return {}

  return construiesteMeta(date, lang, {
    titlu: date.ui.meniu,
    cale: '/meniu',
    limbiDisponibile: limbiActive(setari.module.engleza),
  })
}

export default async function PaginaMeniu({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba

  const { date: dateBaza, setari, meniu } = siteCurent(lang)

  // Modulul oprit sau meniul necompletat → ruta nu există (REGULI.md 3).
  // Același criteriu ca în `lib/seo/rute.ts`, ca sitemap-ul și paginile
  // reale să nu se contrazică.
  if (!setari.module.meniuRestaurant || !meniu.length) notFound()

  // Comutatorul de limbă trebuie să ducă la pagina echivalentă din
  // cealaltă limbă, nu la prima pagină.
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(lang, '/meniu', limbiActive(setari.module.engleza)),
  }

  return (
    <>
      <Miscare />
      <JsonLd data={schemaMeniu(meniu, date.brand.name)} />
      <JsonLd
        data={schemaBreadcrumb(
          [
            { nume: date.ui.acasa, cale: '/' },
            { nume: date.ui.meniu, cale: '/meniu' },
          ],
          baseUrl(),
        )}
      />
      <Antet date={date} />
      <main id="continut">
        <MeniuRestaurant categorii={meniu} ui={date.ui} />
      </main>
      <Subsol date={date} />
      {/* Fără preț: „de la 500 lei" e prețul unei camere și n-are ce căuta
          sub o listă de preparate. */}
      <BaraLipita date={date} />
    </>
  )
}
