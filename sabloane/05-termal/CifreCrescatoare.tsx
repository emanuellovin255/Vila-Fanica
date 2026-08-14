'use client'

import { useEffect } from 'react'

/**
 * Cifrele din banda de încredere urcă de la zero — Șablonul 5 · Termal.
 *
 * SINGURUL JavaScript al șablonului, și e strict decorativ.
 *
 * REGULA 12, aplicată literal: valoarea finală („12", „600 m", „24/7") e
 * scrisă în HTML de server, din `date/03-pagina-principala.md`. Scriptul
 * ăsta doar o suprascrie temporar cu cifre mai mici și o pune la loc,
 * identică, la final. Fără JavaScript — sau cu `prefers-reduced-motion` —
 * banda arată exact cifrele reale, de la prima pictare.
 *
 * Rulează O SINGURĂ DATĂ: `unobserve` imediat ce banda a intrat în ecran,
 * ca derularea în sus și în jos să nu repornească numărătoarea.
 *
 * Nu randează nimic (urmează tiparul lui `components/Miscare.tsx`).
 */
export function CifreCrescatoare() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const banda = document.querySelector('.skin-termal .trust')
    if (!banda) return

    const observator = new IntersectionObserver(
      (intrari) => {
        for (const intrare of intrari) {
          if (!intrare.isIntersecting) continue
          observator.unobserve(intrare.target)
          porneste(intrare.target)
        }
      },
      { threshold: 0.35 },
    )
    observator.observe(banda)

    return () => observator.disconnect()
  }, [])

  return null
}

/** Animează fiecare `<b>` din bandă de la 0 la valoarea deja scrisă în el. */
function porneste(banda: Element) {
  const DURATA = 1100

  for (const cifra of banda.querySelectorAll<HTMLElement>('.trust-item b')) {
    const original = cifra.textContent ?? ''
    // Doar prefixul numeric se animează; restul („m", „/7") rămâne pe loc.
    const potrivire = original.match(/^\s*(\d+)/)
    if (!potrivire) continue

    const tinta = Number(potrivire[1])
    const coada = original.slice(potrivire[0].length)
    const inceput = performance.now()

    const pas = (acum: number) => {
      const t = Math.min((acum - inceput) / DURATA, 1)
      // Aceeași curbă de ieșire ca `--ease-out-expo`: repede la început,
      // așezare lentă pe ultima cifră.
      const usurat = 1 - Math.pow(1 - t, 4)
      cifra.textContent = t < 1 ? `${Math.round(tinta * usurat)}${coada}` : original
      if (t < 1) requestAnimationFrame(pas)
    }

    cifra.textContent = `0${coada}`
    requestAnimationFrame(pas)
  }
}
