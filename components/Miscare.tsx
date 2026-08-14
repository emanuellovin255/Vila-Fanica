'use client'

import { useEffect } from 'react'

import { initHeaderScroll } from '@/lib/reveal'

/**
 * Montează stratul de mișcare O SINGURĂ DATĂ, din layout-ul șablonului.
 *
 * T02 e explicit aici: scripturile erau IIFE-uri atașate pe `document`.
 * În Next.js NU devin listenere per componentă — ar însemna zeci de
 * listenere pentru un singur efect. Devin asta: un singur montaj,
 * inițializări explicite, funcții de curățare.
 *
 * `initDepthTilt` NU se mai montează: înclinarea cardurilor sub mouse
 * făcea parte din stratul 3D scos la cererea clientului (vezi antetul
 * din `styles/depth.css`). `lib/depth.ts` rămâne în arbore, nemontat.
 *
 * REVEAL-UL LA SCROLL E OPRIT, tot la cererea clientului: conținutul nu
 * mai „vine" nicăieri când derulezi, e pur și simplu acolo. Consecința
 * care conta: secțiunile mai înalte decât ecranul (feature-uri, oferte,
 * camere) nu apucau întotdeauna să fie marcate de IntersectionObserver
 * și rămâneau la `opacity: 0` — adică exact casetele albe și goale
 * raportate. Fără reveal, problema dispare din rădăcină. `lib/reveal.ts`
 * rămâne în arbore pentru `initHeaderScroll`, care n-are legătură cu
 * apariția conținutului: doar micșorează logo-ul după ce ai derulat.
 *
 * Nu randează nimic. Dacă nu se montează deloc (JavaScript oprit),
 * pagina rămâne integral vizibilă.
 */
export function Miscare() {
  useEffect(() => {
    const opresteAntet = initHeaderScroll()
    return () => {
      opresteAntet()
    }
  }, [])

  return null
}
