'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Galerie editorială cu lightbox — Șablonul 3 (T22).
 *
 * Layout tip revistă: un ritm de poze, câteva mari (`data-mare`) care
 * ocupă două coloane, restul normale. Fiecare are `width`/`height` fixe
 * → CLS 0 chiar în masonry (partea cea mai ușor de greșit, T22).
 *
 * REGULA DE PERFORMANȚĂ (fără excepție, standarde/02): în listă intră
 * doar thumbnail-ul mic (`next/image` îl servește la ~360–520px);
 * versiunea mare se cere ABIA la deschiderea în lightbox. Primele șase
 * poze se încarcă normal, restul `loading="lazy"`.
 *
 * Fără JavaScript: fiecare poză rămâne un `<a href>` către versiunea
 * mare, deci galeria e navigabilă și fără lightbox. Cu JavaScript,
 * click-ul deschide lightbox-ul (singura parte interactivă): săgeți +
 * swipe pe mobil, `Esc` închide, iar focusul se întoarce exact pe poza
 * de plecare (T22).
 */
export function GalerieEditoriala({
  imagini,
  titluri,
  eyebrow,
  titlu,
  ui,
}: {
  imagini: string[]
  titluri?: string[]
  eyebrow?: string
  titlu?: string
  /** `date.ui` — etichetele lightbox-ului, în limba paginii. */
  ui: SiteData['ui']
}) {
  const [deschis, setDeschis] = useState<number | null>(null)
  // Elementul care a deschis lightbox-ul (poza pe care s-a dat click sau
  // Enter). Îl reținem ca să întoarcem focusul exact acolo la închidere —
  // mai robust decât un index, fiindcă e chiar nodul de plecare.
  const declansator = useRef<HTMLElement | null>(null)
  const inchide = useRef<HTMLButtonElement>(null)
  const tactilX = useRef<number | null>(null)

  const alt = useCallback(
    (i: number) => titluri?.[i]?.trim() || `Fotografie ${i + 1}`,
    [titluri],
  )

  const mergiLa = useCallback(
    (dir: number) =>
      setDeschis((i) => (i === null ? i : (i + dir + imagini.length) % imagini.length)),
    [imagini.length],
  )

  const inchideSiIntoarce = useCallback(() => {
    setDeschis(null)
    // Focus sincron pe declanșator: dialogul e încă în DOM în acest tic,
    // deci mutăm focusul înainte ca React să-l demonteze (T22,
    // accesibilitate). Nu folosim requestAnimationFrame — nu rulează în
    // taburi ascunse.
    declansator.current?.focus()
  }, [])

  useEffect(() => {
    if (deschis === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') inchideSiIntoarce()
      else if (e.key === 'ArrowRight') mergiLa(1)
      else if (e.key === 'ArrowLeft') mergiLa(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Focus pe butonul de închidere: tastatura intră în dialog, nu rămâne
    // în spatele lui.
    inchide.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [deschis, mergiLa, inchideSiIntoarce])

  if (!imagini.length) return null

  return (
    <section className="galerie-editoriala" id="galerie" aria-label={titlu || 'Galerie foto'}>
      {(eyebrow || titlu) && (
        <div className="sec-head">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {titlu && <h2>{titlu}</h2>}
        </div>
      )}

      <div className="masonry" data-stagger>
        {imagini.map((src, i) => (
          <a
            key={src + i}
            className="masonry-item"
            data-mare={i % 5 === 0 ? 'true' : undefined}
            href={src}
            aria-label={`Mărește: ${alt(i)}`}
            onClick={(e) => {
              // Fără modificatori: preluăm click-ul și deschidem lightbox-ul.
              // Cu Ctrl/Cmd (deschide în tab nou) sau fără JS, linkul e real.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
              e.preventDefault()
              declansator.current = e.currentTarget
              setDeschis(i)
            }}
          >
            <Image
              src={src}
              alt={alt(i)}
              width={520}
              height={i % 5 === 0 ? 620 : 400}
              sizes="(max-width: 900px) 50vw, 320px"
              loading={i < 6 ? undefined : 'lazy'}
              priority={i < 2}
            />
          </a>
        ))}
      </div>

      {deschis !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt(deschis)}
          className="lightbox"
          onClick={inchideSiIntoarce}
          onTouchStart={(e) => {
            tactilX.current = e.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            if (tactilX.current === null) return
            const dx = (e.changedTouches[0]?.clientX ?? 0) - tactilX.current
            if (Math.abs(dx) > 45) mergiLa(dx < 0 ? 1 : -1)
            tactilX.current = null
          }}
        >
          <button
            ref={inchide}
            type="button"
            className="lightbox-x"
            aria-label={ui.inchide}
            onClick={(e) => {
              e.stopPropagation()
              inchideSiIntoarce()
            }}
          >
            <Icon name="close" marime="lg" />
          </button>

          {imagini.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-prev"
                aria-label={ui.fotografiaAnterioara}
                onClick={(e) => {
                  e.stopPropagation()
                  mergiLa(-1)
                }}
              >
                <Icon name="chevron" marime="lg" />
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-next"
                aria-label={ui.fotografiaUrmatoare}
                onClick={(e) => {
                  e.stopPropagation()
                  mergiLa(1)
                }}
              >
                <Icon name="chevron" marime="lg" />
              </button>
            </>
          )}

          <Image
            key={imagini[deschis]}
            src={imagini[deschis]}
            alt={alt(deschis)}
            width={1600}
            height={1200}
            sizes="92vw"
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
            priority
          />
        </div>
      )}
    </section>
  )
}
