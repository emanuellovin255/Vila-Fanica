import Image from 'next/image'

import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Hero-ul Șablonului 6 · Irlandez.
 *
 * Un cadru la ecran plin, cu titlul în majuscule peste el, un delimitator
 * desenat și subtitlul dedesubt. Jos, marginea ruptă de hârtie care face
 * trecerea către corpul paginii — semnătura vizuală a referinței
 * (zagazaga.ro), desenată aici cu un SVG inline, nu cu o imagine.
 *
 * Server Component, deci ZERO JavaScript. Toată mișcarea e CSS din
 * `skin.css`, iar stările „ascuns" trăiesc exclusiv în `from {}`-urile
 * keyframe-urilor (REGULI.md 12): fără JS și sub `prefers-reduced-motion`,
 * titlul, subtitlul și insignele sunt integral vizibile de la prima
 * pictare.
 *
 * POZA E LCP-UL PAGINII: `priority` + `fetchPriority="high"`, niciodată
 * `lazy` (REGULI.md 13), și nu i se animează `opacity` — ar întârzia exact
 * momentul în care browserul o consideră pictată.
 *
 * DE CE TITLUL E SCURT: Anton, în majuscule, la corpul din skin, încape în
 * două rânduri. Argumentele stau în subtitlu, la un font care se citește.
 * Vezi nota din `date/03-pagina-principala.md`.
 */
export function HeroIrlandez({ date }: { date: SiteData }) {
  const { hero, brand } = date

  // Fără `id="continut"` pe secțiune: ancora aia stă pe `<main>`, în Sablon.tsx.
  return (
    <section className="hero hero-irlandez" aria-label={hero.headline || brand.name}>
      {hero.image && (
        <div className="hero-media">
          <Image
            className="hero-irlandez__poza"
            src={hero.image}
            alt={hero.headline || brand.name}
            fill
            sizes="100vw"
            priority
            fetchPriority="high"
          />
        </div>
      )}

      {/* Elementele intră în trepte, din CSS, prin `nth-child`. Ordinea din
          DOM e și ordinea de citire, deci întârzierile nu trebuie ținute
          minte nicăieri altundeva. */}
      <div className="wrap hero-inner hero-irlandez__text">
        <h1 className="hero-titlu">{hero.headline || brand.name}</h1>

        {/* Delimitatorul dintre titlu și subtitlu: o linie subțiată la
            capete, cum e trasată cu peniţa. `aria-hidden` fiindcă nu
            spune nimic — e punctuație vizuală. */}
        <svg
          className="hero-irlandez__linie"
          viewBox="0 0 240 8"
          role="presentation"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M2 4 C 60 1, 180 7, 238 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {brand.tagline && <p className="eyebrow hero-irlandez__stampila">{brand.tagline}</p>}
        {hero.sub && <p className="hero-sub">{hero.sub}</p>}

        {hero.badges.length > 0 && (
          <div className="hero-badges">
            {hero.badges.map((b, i) => (
              <span className="pill" key={i}>
                {b.icon && <Icon name={b.icon} marime="sm" />}
                {b.text}
                {b.score && <span className="pill-score tabular">{b.score}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Marginea ruptă de hârtie. E un SVG întins pe toată lățimea, în
          culoarea fundalului paginii, care acoperă baza fotografiei. Nu e
          o imagine descărcată: 300 de octeți de cale, scalabilă la orice
          lățime, care nu se pixelează pe ecrane mari. */}
      <svg
        className="hero-irlandez__rupere"
        viewBox="0 0 1440 42"
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M0 42 L0 26 C 90 18, 150 30, 244 24 C 342 18, 396 31, 498 27
             C 604 23, 660 13, 762 19 C 858 25, 918 16, 1014 21
             C 1116 26, 1176 14, 1272 20 C 1350 25, 1398 20, 1440 17
             L1440 42 Z"
          fill="currentColor"
        />
      </svg>
    </section>
  )
}
