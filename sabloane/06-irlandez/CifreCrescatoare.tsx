'use client'

import { useEffect } from 'react'

/**
 * Cifrele din banda de încredere urcă de la zero — Șablonul 6 · Irlandez.
 *
 * SINGURUL JavaScript al șablonului, și e strict decorativ.
 *
 * REGULA 12, aplicată literal: valoarea finală („9,6", „235", „10 minute")
 * e scrisă în HTML de server, din `date/03-pagina-principala.md`. Scriptul
 * ăsta doar o suprascrie temporar cu cifre mai mici și o pune la loc,
 * identică, la final. Fără JavaScript — sau cu `prefers-reduced-motion` —
 * banda arată exact cifrele reale, de la prima pictare.
 *
 * DIFERENȚA FAȚĂ DE VARIANTA ȘABLONULUI 5, și motivul pentru care fișierul
 * ăsta e copiat, nu importat: aici cifrele au ZECIMALE CU VIRGULĂ („9,6"),
 * fiindcă notele de pe Booking sunt pe zece, nu pe cinci. Expresia din
 * șablonul 5 prinde doar `^\s*(\d+)`, deci ar fi animat „9" și ar fi lăsat
 * „,6" pe loc — adică ar fi arătat „0,6", „3,6", „7,6" în timpul
 * numărătorii. Aici se prinde și partea zecimală, iar afișarea o
 * reconstruiește cu același număr de zecimale ca originalul.
 *
 * Rulează O SINGURĂ DATĂ: `unobserve` imediat ce banda a intrat în ecran,
 * ca derularea în sus și în jos să nu repornească numărătoarea.
 *
 * Nu randează nimic (urmează tiparul lui `components/Miscare.tsx`).
 */
export function CifreCrescatoare() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const banda = document.querySelector('.skin-irlandez .trust')
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
    // Prefixul numeric, cu zecimale despărțite prin virgulă sau punct.
    // Restul textului („ minute", „ km") rămâne neatins pe toată durata.
    const potrivire = original.match(/^\s*(\d+)(?:([.,])(\d+))?/)
    if (!potrivire) continue

    const [intreg, separator, zecimale] = [potrivire[1], potrivire[2], potrivire[3]]
    const tinta = Number(`${intreg}.${zecimale ?? 0}`)
    const cateZecimale = zecimale?.length ?? 0
    const coada = original.slice(potrivire[0].length)
    const inceput = performance.now()

    /** `9.6` → `9,6`, cu separatorul găsit în textul original. */
    const scrie = (valoare: number) => {
      const text = valoare.toFixed(cateZecimale)
      return `${separator ? text.replace('.', separator) : text}${coada}`
    }

    const pas = (acum: number) => {
      const t = Math.min((acum - inceput) / DURATA, 1)
      // Aceeași curbă de ieșire ca `--ease-out-expo`: repede la început,
      // așezare lentă pe ultima cifră.
      const usurat = 1 - Math.pow(1 - t, 4)
      cifra.textContent = t < 1 ? scrie(tinta * usurat) : original
      if (t < 1) requestAnimationFrame(pas)
    }

    cifra.textContent = scrie(0)
    requestAnimationFrame(pas)
  }
}
