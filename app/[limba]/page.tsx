import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { Miscare } from '@/components/Miscare'
import type { SiteData } from '@/content/types'
import type { PropsSablon } from '@/lib/sablon'
import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import { construiesteMeta, baseUrl } from '@/lib/seo/meta'
import {
  schemaCazare,
  schemaFaq,
  schemaMeniu,
  schemaOrganizatie,
  schemaWebsite,
} from '@/lib/seo/jsonld'
import { siteCurent } from '@/lib/site'

import { SablonHeroVideo } from '@sabloane/01-hero-video/Sablon'
import { SablonPovesteAlternanta } from '@sabloane/02-poveste-alternanta/Sablon'
import { SablonGalerieRezervare } from '@sabloane/03-galerie-rezervare/Sablon'
import { SablonCaruselEditorial } from '@sabloane/04-carusel-editorial/Sablon'
import { SablonTermal } from '@sabloane/05-termal/Sablon'
import { SablonIrlandez } from '@sabloane/06-irlandez/Sablon'

/**
 * Prima pagină — dispecerul de șabloane (C2).
 *
 * Motorul deține SEO-ul și JSON-LD-ul (rămân identice pe toate șabloanele,
 * T07), încarcă datele o singură dată, apoi predă asamblarea vizuală
 * șablonului ales din `setari.sablon` (T05):
 *
 *   1 → Hero Video (T20)        2 → Poveste alternantă (T21)
 *   3 → Galerie + rezervare (T22)  4 → Carusel editorial (T-Delta)
 *   5 → Termal (scris pentru Casa Drăgan)
 *   6 → Irlandez (scris pentru Casa Irlandeză)
 *
 * Un șablon primește `{ date, setari, meniu }` și randează layout-ul lui —
 * antet, `<main>`, secțiuni, subsol. Nu atinge niciun fișier din `_motor/`
 * (REGULI.md 1): trăiește integral în `sabloane/<n>/`. Contractul de date
 * și SEO rămâne al motorului, deci un crawler AI care nu execută JS vede
 * același conținut structurat indiferent de șablon.
 */

const SABLOANE: Record<1 | 2 | 3 | 4 | 5 | 6, (p: PropsSablon) => ReactNode> = {
  1: SablonHeroVideo,
  2: SablonPovesteAlternanta,
  3: SablonGalerieRezervare,
  4: SablonCaruselEditorial,
  5: SablonTermal,
  6: SablonIrlandez,
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string }>
}): Promise<Metadata> {
  const { limba } = await params
  if (!esteLimba(limba)) return {}
  const { date, setari } = siteCurent(limba)
  return construiesteMeta(date, limba, {
    titlu: '',
    cale: '/',
    imagine: date.seo.ogImage,
    limbiDisponibile: setari.module.engleza ? ['ro', 'en'] : ['ro'],
  })
}

export default async function Acasa({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba

  const { date: dateBaza, setari, meniu } = siteCurent(lang)
  const base = baseUrl()

  // Comutatorul de limbă are nevoie de URL-urile paginilor echivalente.
  // Se populează aici, nu în loader: depinde de RUTA curentă, nu de date.
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(lang, '/', limbiActive(setari.module.engleza)),
  }

  const Sablon = SABLOANE[setari.sablon] ?? SablonPovesteAlternanta

  return (
    <>
      <Miscare />

      {/* Datele structurate, în HTML (T07). Fiecare întoarce null dacă
          n-are ce declara — nimic inventat (REGULI.md 3). Stau aici, în
          motor, ca să fie identice pe toate cele trei șabloane. */}
      <JsonLd data={schemaCazare(date, base)} />
      <JsonLd data={schemaOrganizatie(date, base)} />
      <JsonLd data={schemaWebsite(date, base)} />
      {/* `FAQPage` DOAR dacă întrebările chiar se văd în pagină. Google
          cere ca datele structurate să descrie conținut vizibil, iar
          secțiunea se poate scoate din `setari.md` — cum s-a și scos
          aici. O schemă de FAQ pe o pagină fără FAQ e exact tiparul
          pentru care se retrag rezultatele îmbogățite. */}
      {setari.sectiuni.includes('faq') && <JsonLd data={schemaFaq(date)} />}
      {meniu.length > 0 && <JsonLd data={schemaMeniu(meniu, date.brand.name)} />}

      <Sablon date={date} setari={setari} meniu={meniu} />
    </>
  )
}
