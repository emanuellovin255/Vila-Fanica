import Image from 'next/image'

import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Prima secțiune. Titlu, subtitlu, insigne, peste o poză mare.
 *
 * Server Component. Poza de aici e candidatul la LCP, deci primește
 * `priority` + `fetchPriority="high"` și NU primește `lazy` (REGULI.md
 * 13). Nu se animează (vezi motion.css): orice `opacity` sau `transform`
 * pe ea ar întârzia momentul în care browserul o consideră pictată.
 *
 * `sizes="100vw"` fiindcă ocupă toată lățimea; `next/image` alege
 * singur rezoluția potrivită din `srcset`.
 */
export function Hero({ date }: { date: SiteData }) {
  const { hero, brand } = date

  return (
    <section className="hero" id="continut">
      {hero.image && (
        <div className="hero-media">
          <Image
            src={hero.image}
            alt={hero.headline || brand.name}
            fill
            sizes="100vw"
            priority
            fetchPriority="high"
          />
        </div>
      )}
      <div className="wrap hero-inner">
        {brand.tagline && <p className="eyebrow">{brand.tagline}</p>}
        <h1>{hero.headline || brand.name}</h1>
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
