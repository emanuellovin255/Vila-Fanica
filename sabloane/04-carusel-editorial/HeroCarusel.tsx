'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/** Cât stă un cadru pe ecran, în milisecunde. */
const PAUZA = 6000

/**
 * Hero cu carusel pe tot ecranul — Șablonul 4 (T-Delta).
 *
 * Semnătura șablonului: cadrele se schimbă singure, iar FIECARE își
 * poartă titlul și subtitlul lui. Nu e o galerie decorativă în spatele
 * unui titlu fix — e o succesiune de afirmații despre loc, fiecare cu
 * fotografia care o susține.
 *
 * REGULA DE PERFORMANȚĂ (fără excepție, standarde/02): primul cadru e
 * candidatul la LCP. El se randează cu `priority` + `fetchPriority="high"`,
 * fără `lazy`, și NU se animează la intrare — orice `opacity` sau
 * `transform` pe el ar întârzia momentul în care browserul îl consideră
 * pictat. Cadrele 2+ primesc `loading="lazy"`: pe un vizitator care
 * pleacă în trei secunde nu s-a descărcat decât primul.
 *
 * Toate cadrele stau montate, suprapuse, și comută din `opacity` +
 * un Ken Burns lent pe `transform` — doar proprietăți compozitate
 * (REGULI.md 11). Nimic nu se remontează la schimbarea cadrului, deci
 * nu există niciun reflow și CLS-ul rămâne 0.
 *
 * CÂND NU RULEAZĂ SINGUR
 *  - `prefers-reduced-motion: reduce` → fără autoplay, fără Ken Burns;
 *    rămân săgețile și punctele, iar schimbarea e instant (vezi skin.css);
 *  - mouse-ul e peste carusel, sau focusul e într-un buton din el —
 *    altfel cadrul fuge de sub degetul cuiva care tocmai voia să-l vadă;
 *  - tabul e ascuns (`document.hidden`) — un timer care rulează într-un
 *    tab de fundal consumă baterie degeaba.
 *
 * FĂRĂ JAVASCRIPT: primul cadru, titlul, subtitlul și butoanele sunt în
 * HTML-ul livrat de server. Caruselul nu pornește, dar hero-ul arată
 * întreg și corect — nu un ecran gol.
 *
 * ACCESIBILITATE: `aria-roledescription="carousel"` pe secțiune, fiecare
 * cadru `aria-hidden` când nu e activ (deci cititoarele de ecran nu
 * citesc șase titluri unul după altul), `aria-live="polite"` pe zona de
 * text. Etichetele butoanelor vin din `date.ui`, deci `/en` iese corect
 * din prima.
 */
export function HeroCarusel({ date }: { date: SiteData }) {
  const { hero, brand, ui } = date

  // Fallback: fără blocul `## Carusel` în 03-pagina-principala.md rămâne
  // un singur cadru, construit din poza unică. Șablonul funcționează
  // atunci exact ca un hero clasic, fără să se strice nimic.
  const cadre =
    hero.slides && hero.slides.length > 0
      ? hero.slides
      : hero.image
        ? [{ image: hero.image, headline: hero.headline, sub: hero.sub }]
        : []

  const [activ, setActiv] = useState(0)
  const [pornit, setPornit] = useState(false)
  const oprit = useRef(false)

  const mergiLa = useCallback(
    (i: number) => setActiv(((i % cadre.length) + cadre.length) % cadre.length),
    [cadre.length],
  )

  /**
   * Autoplay-ul pornește DIN `useEffect`, nu din starea inițială: pe
   * server `pornit` e `false`, deci HTML-ul livrat e identic cu ce
   * randează clientul la prima trecere. Fără asta, React ar reclama o
   * nepotrivire de hidratare.
   */
  useEffect(() => {
    if (cadre.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setPornit(true)
  }, [cadre.length])

  useEffect(() => {
    if (!pornit) return

    const ceas = setInterval(() => {
      if (oprit.current || document.hidden) return
      setActiv((i) => (i + 1) % cadre.length)
    }, PAUZA)

    return () => clearInterval(ceas)
  }, [pornit, cadre.length])

  // Săgețile de la tastatură funcționează când caruselul are focusul.
  const laTasta = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') mergiLa(activ + 1)
    else if (e.key === 'ArrowLeft') mergiLa(activ - 1)
  }

  // Swipe pe mobil, ca în galeria Șablonului 3.
  const tactilX = useRef<number | null>(null)

  if (!cadre.length) return null

  const cadru = cadre[activ]
  const titlu = cadru.headline || hero.headline || brand.name
  const subtitlu = cadru.sub || hero.sub

  return (
    <section
      className="hero hero-carusel"
      aria-roledescription="carousel"
      aria-label={hero.headline || brand.name}
      onKeyDown={laTasta}
      onMouseEnter={() => {
        oprit.current = true
      }}
      onMouseLeave={() => {
        oprit.current = false
      }}
      onFocusCapture={() => {
        oprit.current = true
      }}
      onBlurCapture={() => {
        oprit.current = false
      }}
      onTouchStart={(e) => {
        tactilX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        if (tactilX.current === null) return
        const dx = (e.changedTouches[0]?.clientX ?? 0) - tactilX.current
        if (Math.abs(dx) > 45) mergiLa(activ + (dx < 0 ? 1 : -1))
        tactilX.current = null
      }}
    >
      <div className="hero-media carusel-cadre">
        {cadre.map((c, i) => (
          <div
            key={c.image + i}
            className="carusel-cadru"
            data-activ={i === activ ? 'true' : undefined}
            aria-hidden={i === activ ? undefined : 'true'}
          >
            <Image
              src={c.image}
              alt={c.headline || hero.headline || brand.name}
              fill
              sizes="100vw"
              // Doar primul cadru concurează pentru LCP. Restul se
              // descarcă leneș, în ordinea în care ajung pe ecran.
              priority={i === 0}
              fetchPriority={i === 0 ? 'high' : undefined}
              loading={i === 0 ? undefined : 'lazy'}
            />
          </div>
        ))}
      </div>

      <div className="wrap hero-inner">
        {brand.tagline && <p className="eyebrow">{brand.tagline}</p>}

        {/* `key` pe indexul cadrului: React remontează blocul de text la
            fiecare schimbare, deci animația de intrare din skin.css
            repornește. Fără el, poza s-ar schimba și titlul ar rămâne
            înțepenit. */}
        <div className="carusel-text" key={activ} aria-live="polite">
          <h1 className="hero-titlu">{titlu}</h1>
          {subtitlu && <p className="hero-sub">{subtitlu}</p>}
        </div>

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

      {cadre.length > 1 && (
        <div className="carusel-comenzi wrap">
          <button
            type="button"
            className="carusel-sageata"
            aria-label={ui.fotografiaAnterioara}
            onClick={() => mergiLa(activ - 1)}
          >
            <Icon name="chevron" marime="md" />
          </button>

          <ol className="carusel-puncte">
            {cadre.map((c, i) => (
              <li key={c.image + i}>
                <button
                  type="button"
                  className="carusel-punct"
                  data-activ={i === activ ? 'true' : undefined}
                  aria-current={i === activ ? 'true' : undefined}
                  // Titlul cadrului e o etichetă mai bună decât „cadrul 3":
                  // spune unde ajungi, nu doar că te muți.
                  aria-label={c.headline || `${i + 1} / ${cadre.length}`}
                  onClick={() => mergiLa(i)}
                />
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="carusel-sageata"
            aria-label={ui.fotografiaUrmatoare}
            onClick={() => mergiLa(activ + 1)}
          >
            <Icon name="chevron" marime="md" />
          </button>

          <p className="carusel-numar tabular" aria-hidden="true">
            <b>{String(activ + 1).padStart(2, '0')}</b>
            <span>/</span>
            {String(cadre.length).padStart(2, '0')}
          </p>
        </div>
      )}
    </section>
  )
}
