import Image from 'next/image'

import { ButonDisponibilitate } from './ButonDisponibilitate'
import { Icon } from '@/components/Icon'
import type { Cta, Feature, SiteData } from '@/content/types'

/**
 * Feature alternant: imagine + text, cu latura care alternează.
 *
 * Ăsta e MOTORUL Șablonului 2 (T06). `reverse` vine deja calculat din
 * loader (T05): al doilea, al patrulea feature au imaginea pe partea
 * cealaltă, fără ca cine editează să fi scris ceva. `data-reverse`
 * comută ordinea prin CSS, deci pe mobil se aplatizează la o coloană.
 *
 * Server Component. Se randează un feature doar dacă are titlu. Poza
 * primește `loading="lazy"` — feature-urile sunt mereu sub pliu.
 */
function butonVariant(v: Cta['variant']): 'primary' | 'accent' | 'light' | 'ghost' {
  if (v === 'primary' || v === 'accent' || v === 'light') return v
  return 'ghost'
}

export function FeatureAlternant({ feature, date }: { feature: Feature; date?: SiteData }) {
  return (
    <section className="feature" id={feature.id}>
      <div className="wrap">
        <div className="split" data-reverse={feature.reverse ? 'true' : undefined}>
          {feature.image && (
            <div className="split-media">
              <Image
                src={feature.image}
                alt={feature.title}
                width={720}
                height={560}
                sizes="(max-width: 820px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
          )}
          <div className="split-body">
            {feature.eyebrow && <p className="eyebrow">{feature.eyebrow}</p>}
            <h2>{feature.title}</h2>
            {/* Proza pe paragrafe, nu într-un singur `<p>`. Un feature
                scris la „Text:" are o frază și dă exact un paragraf, ca
                înainte; unul scris ca proză sub câmpuri poate avea trei,
                iar unite ar fi un zid de douăsprezece rânduri. */}
            {feature.text
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, i) => (
                <p className="lede" key={i}>
                  {p}
                </p>
              ))}
            {feature.bullets.length > 0 && (
              <ul>
                {feature.bullets.map((b, i) => (
                  <li key={i}>
                    <Icon name="check" marime="sm" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {feature.ctas.length > 0 && (
              <div className="stack">
                {feature.ctas.map((c) =>
                  // CTA-ul care ducea la bara de disponibilitate deschide acum
                  // dialogul cu calendarul, purtând titlul feature-ului din care
                  // s-a apăsat. Un CTA care duce în altă parte (`/oferte`,
                  // `/galerie`) rămâne link: e navigație, nu o cerere.
                  date && c.href.includes('#rezervare') ? (
                    <ButonDisponibilitate
                      key={c.href}
                      date={date}
                      context={feature.title}
                      eticheta={c.label}
                      variant={butonVariant(c.variant)}
                    />
                  ) : (
                    <a key={c.href} className={`btn btn-${butonVariant(c.variant)}`} href={c.href}>
                      {c.label}
                    </a>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Toate feature-urile la rând, sărind cele fără titlu. */
export function Features({ features, date }: { features: Feature[]; date?: SiteData }) {
  if (!features.length) return null
  return (
    <>
      {features.map((f) => (
        <FeatureAlternant key={f.id} feature={f} date={date} />
      ))}
    </>
  )
}
