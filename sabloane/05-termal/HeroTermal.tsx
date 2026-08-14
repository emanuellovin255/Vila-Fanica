import Image from 'next/image'

import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Hero-ul Șablonului 5 · Termal.
 *
 * Un singur cadru, la ecran plin, cu o mișcare Ken Burns de 24 de secunde
 * atât de lentă încât nu se observă — dacă vizitatorul o vede, e prea
 * mult. Restul e voal și text.
 *
 * Server Component, deci ZERO JavaScript. Toată mișcarea e CSS din
 * `skin.css`, iar stările „ascuns" trăiesc exclusiv în `from {}`-urile
 * keyframe-urilor (REGULI.md 12): fără JS și sub `prefers-reduced-motion`,
 * titlul, subtitlul și insignele sunt integral vizibile.
 *
 * POZA E LCP-UL PAGINII: `priority` + `fetchPriority="high"`, niciodată
 * `lazy` (REGULI.md 13), și nu i se animează `opacity` — Ken Burns e pur
 * `transform`, care nu întârzie momentul în care browserul o consideră
 * pictată.
 *
 * De ce nu un carusel, ca pe Șablonul 4: locația are un singur argument,
 * nu trei. Toate cadrele bune sunt variații ale aceleiași clădiri văzute
 * din dronă, iar un carusel ar fi rotit aceeași casă din patru unghiuri.
 */
export function HeroTermal({ date }: { date: SiteData }) {
  const { hero, brand } = date

  // Fără `id="continut"` pe secțiune: ancora aia stă pe `<main>`, în Sablon.tsx.
  return (
    <section className="hero hero-termal" aria-label={hero.headline || brand.name}>
      {hero.image && (
        <div className="hero-media">
          <Image
            className="hero-termal__poza"
            src={hero.image}
            alt={hero.headline || brand.name}
            fill
            sizes="100vw"
            priority
            fetchPriority="high"
          />
        </div>
      )}

      {/* Cele trei (sau patru) elemente intră în trepte, din CSS, prin
          `nth-child`. Ordinea din DOM e și ordinea de citire, deci
          întârzierile nu trebuie ținute minte nicăieri altundeva. */}
      <div className="wrap hero-inner hero-termal__text">
        {brand.tagline && <p className="eyebrow">{brand.tagline}</p>}
        <h1 className="hero-titlu">{hero.headline || brand.name}</h1>
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
    </section>
  )
}
