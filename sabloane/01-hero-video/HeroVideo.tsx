'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Hero cu video de fundal — Șablonul 1 (T20).
 *
 * REGULA CENTRALĂ: posterul (`hero.image`, AVIF) e ce contează pentru
 * LCP; video-ul e strict decorativ și nu concurează niciodată cu prima
 * afișare. De aceea:
 *
 *  - Posterul se randează în HTML, cu `priority` + `fetchPriority="high"`,
 *    fără `lazy` (REGULI.md 13). E imaginea pe care o măsoară LCP-ul.
 *  - Elementul `<video>` NU există în HTML-ul livrat. Se montează abia
 *    din `useEffect`, adică doar pe client și doar după ce pagina e
 *    utilizabilă. Astfel, pe mobil (unde nu-l redăm) nu se descarcă
 *    niciun byte de video — nici măcar `<source>` nu ajunge în DOM,
 *    verificabil în Network (criteriu de terminare T20).
 *
 * Condițiile în care NU redăm video (toate → doar poster):
 *  - lățime sub 900px (mobil / tabletă mică): majoritatea traficului,
 *    multe browsere blochează oricum autoplay, economie de date+baterie;
 *  - `prefers-reduced-motion: reduce`;
 *  - `navigator.connection.saveData` sau tip de conexiune lentă (2g/3g).
 *
 * Fără JavaScript: rămâne posterul + titlul + insignele, toate în HTML.
 */
export function HeroVideo({ date }: { date: SiteData }) {
  const { hero, brand } = date
  const [redaVideo, setRedaVideo] = useState(false)
  const [vizibil, setVizibil] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!hero.videoSrc) return

    const mediaMisc = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mediaLat = window.matchMedia('(min-width: 900px)')

    // `navigator.connection` e experimental și lipsește pe Safari — de
    // aceea accesul e defensiv. Fără el, presupunem conexiune ok.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const lent = Boolean(conn?.saveData) || /(^|-)(2g|3g)$/.test(conn?.effectiveType ?? '')

    if (mediaMisc.matches || !mediaLat.matches || lent) return

    setRedaVideo(true)
  }, [hero.videoSrc])

  return (
    <section className="hero hero-video" aria-label={hero.headline || brand.name}>
      <div className="hero-media">
        {hero.image ? (
          <Image
            src={hero.image}
            alt={hero.headline || brand.name}
            fill
            sizes="100vw"
            priority
            fetchPriority="high"
          />
        ) : null}

        {/* Montat doar client-side, doar când redarea e permisă: pe mobil
            nu intră niciodată în DOM, deci zero bytes de video acolo. */}
        {redaVideo && (
          <video
            ref={videoRef}
            className="hero-vid"
            data-vizibil={vizibil ? 'true' : undefined}
            poster={hero.image || undefined}
            muted
            loop
            playsInline
            autoPlay
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            onCanPlay={() => setVizibil(true)}
          >
            <source src={hero.videoSrc} />
          </video>
        )}
      </div>

      <div className="wrap hero-inner">
        {brand.tagline && <p className="eyebrow">{brand.tagline}</p>}
        <h1 className="hero-titlu">
          <span className="line" style={{ ['--l' as string]: '0' }}>
            <span>{hero.headline || brand.name}</span>
          </span>
        </h1>
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
