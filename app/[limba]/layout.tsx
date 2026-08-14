import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import '../../styles/tokens.css'
// Stratul al doilea al temei: cele 14 culori [CLIENT], fonturile alese și
// `@font-face`-urile lor, generate de `scripts/tema.ts` din
// `date/11-culori-si-fonturi.md` la fiecare dev/build. Vine imediat după
// tokens.css tocmai ca să-l suprascrie, și înaintea restului, ca skin-urile
// să calculeze din valorile clientului, nu din tema neutră a motorului.
import '../../styles/tokens.client.css'
import '../../styles/fonts.css'
import '../../styles/base.css'
import '../../styles/icons.css'
import '../../styles/motion.css'
import '../../styles/depth.css'

// Skin-urile celor șase șabloane (C2). Fiecare e complet încapsulat sub
// clasa lui de rădăcină (`.skin-hero-video`, `.skin-poveste`,
// `.skin-galerie`, `.skin-carusel`, `.skin-termal`, `.skin-irlandez`), deci
// încărcarea tuturor șase nu contaminează nimic: pe o pagină se aplică doar
// regulile de sub clasa șablonului activ. Se importă aici, din app-dir, ca
// fișierele de skin să rămână în `sabloane/`, separat de motor (REGULI.md 1).
import '../../sabloane/01-hero-video/skin.css'
import '../../sabloane/02-poveste-alternanta/skin.css'
import '../../sabloane/03-galerie-rezervare/skin.css'
import '../../sabloane/04-carusel-editorial/skin.css'
import '../../sabloane/05-termal/skin.css'
import '../../sabloane/06-irlandez/skin.css'

import { Analytics } from '@/components/Analytics'
import { BannerCookies } from '@/components/BannerCookies'
import { esteLimba, LIMBI } from '@/lib/i18n/limbi'

/**
 * Layout-ul rădăcină al motorului. Nu există în `hotel-forge` — e cod
 * nou (vezi DECIZII.md).
 *
 * DE CE STĂ SUB `[limba]` ȘI NU LA `app/layout.tsx`
 * -------------------------------------------------
 * `<html lang>` trebuie să fie corect pe fiecare rută: un `lang="ro"`
 * pe o pagină în engleză strică și SEO-ul, și cititoarele de ecran
 * (T08). Un layout rădăcină la `app/layout.tsx` nu primește niciodată
 * parametri de rută, deci n-ar avea de unde să știe limba paginii.
 *
 * Aici o știe, iar paginile rămân pre-generate static: `generateStaticParams`
 * le produce pe toate la build. Româna își pierde prefixul în
 * `middleware.ts`, care rescrie `/camere/x` la `/ro/camere/x`. Adresa
 * publică rămâne fără prefix, dar HTML-ul livrat are `lang` corect.
 *
 * Deliberat minimal: nu conține antet, subsol sau vreo secțiune. Alea
 * vin din șabloane (C2), care compun componentele din T06 peste
 * layout-ul ăsta. Un layout care ar ști de antet ar face imposibil un
 * șablon fără antet.
 *
 * Ordinea importurilor de CSS contează și e cea din T02:
 * tokens → fonts → base → icons → motion → depth. Fiecare suprascrie
 * precedentul la specificitate egală, fără `!important`.
 */

export function generateStaticParams() {
  return LIMBI.map((limba) => ({ limba }))
}

/**
 * Randare la cerere, nu la build (T09).
 *
 * CSP-ul din `middleware.ts` interzice `unsafe-inline` pe `script-src` și pune
 * un nonce per-cerere. Scripturile de hidratare ale Next (inclusiv cele inline,
 * cu datele RSC) trebuie să poarte acel nonce ca browserul să le lase să ruleze —
 * altfel tot JavaScript-ul e blocat și interactivitatea moare (comutator de limbă,
 * galerie, mișcare). Next ștampilează nonce-ul citind headerul CSP al CERERII, ceea
 * ce se poate face doar la randare per-cerere.
 *
 * Conținutul rămâne pre-construit din `date/` la build; aici se face doar
 * ștampilarea nonce-ului, la edge, rapid și fără date de utilizator. `generateStaticParams`
 * de mai sus rămâne util: enumeră limbile valide (restul → 404).
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  // Valorile reale se generează per pagină din SiteData (T07). Astea
  // sunt plasa de siguranță, ca build-ul să nu producă un titlu gol.
  title: 'Motor',
  robots: { index: false, follow: false },
}

export default async function LayoutRadacina({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ limba: string }>
}) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()

  return (
    <html lang={limba}>
      <body>
        {/*
          UN SINGUR preload, pe fontul primei secțiuni (T03).
          Preload la tot înseamnă preload la nimic: patru fișiere care se
          bat pe aceeași bandă amână exact fontul care contează pentru LCP.
          `inter-ro-ext` (3,6 KB, diacriticele) și Satoshi se descarcă
          normal, prin `unicode-range` și prin folosire efectivă.

          Randat în corp, nu într-un `<head>` scris de mână: un `<head>`
          manual în layout flush-uiește capul înainte ca metadatele paginii
          (generate cu randare dinamică, T09) să se rezolve — și title,
          description și canonical ajung în `<body>`, unde crawlerele și
          Lighthouse nu le văd. Next generează `<head>`-ul, React ridică
          acest preload în el, iar metadatele intră tot acolo.
        */}
        <link
          rel="preload"
          href="/fonts/inter-ro-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {children}
        {/*
          Consimțământ + Analytics (T11). Bannerul blochează efectiv: Analytics
          nu pornește nimic înainte de accept. Ambele sunt pe fiecare pagină,
          din layout, ca alegerea și măsurătoarea să fie consecvente peste tot.
        */}
        <BannerCookies limba={limba as 'ro' | 'en'} />
        <Analytics />
      </body>
    </html>
  )
}
