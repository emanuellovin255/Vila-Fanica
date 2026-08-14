'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Butonul de meniu de pe telefon și panoul pe care îl deschide.
 *
 * Sub 1024px `.nav-links` e ascunsă și apare `.burger` (base.css). Butonul
 * exista de la început, dar nu era legat de nimic: niciun handler, nicio
 * clasă, niciun panou. Apăsat, nu se întâmpla nimic — adică pe telefon
 * navigația întreagă (camere, oferte, galerie, zona, contact) era
 * inaccesibilă din antet. Aici se leagă.
 *
 * `"use client"` doar pentru starea deschis/închis. Lista de linkuri rămâne
 * randată pe server, în `Antet` — ea e conținut, nu interfață, iar un
 * crawler care nu execută JavaScript trebuie s-o vadă oricum (REGULI.md 12).
 *
 * Legătura cu lista se face prin `data-meniu="deschis"` pus pe antet, nu
 * prin props: `<ul>` e fratele acestui buton în arborele randat pe server,
 * deci n-avem cum să-i pasăm starea. E același mecanism cu `.is-scrolled`
 * al lui `reveal.ts` — un atribut pe antet, restul e CSS.
 */
export function MeniuMobil({
  /** `date.ui.meniu` — „Meniu" / „Menu". */
  eticheta,
  /** `id`-ul listei de linkuri, pentru `aria-controls`. */
  controleaza,
}: {
  eticheta: string
  controleaza: string
}) {
  const [deschis, setDeschis] = useState(false)
  const buton = useRef<HTMLButtonElement>(null)

  // Starea, scrisă pe antet. Curățată la demontare, ca o navigare care
  // schimbă layout-ul să nu lase antetul blocat pe „deschis".
  useEffect(() => {
    const antet = buton.current?.closest('[data-antet]')
    if (!antet) return
    if (deschis) antet.setAttribute('data-meniu', 'deschis')
    else antet.removeAttribute('data-meniu')
    return () => antet.removeAttribute('data-meniu')
  }, [deschis])

  useEffect(() => {
    if (!deschis) return
    const antet = buton.current?.closest('[data-antet]')

    const laTasta = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setDeschis(false)
      // Focusul înapoi pe buton: altfel rămâne pe body și următorul Tab
      // o ia de la începutul paginii.
      buton.current?.focus()
    }

    const laClick = (e: MouseEvent) => {
      const tinta = e.target as Element | null
      // Clickul care tocmai a deschis meniul nu îl închide la loc.
      if (!tinta || buton.current?.contains(tinta)) return
      // Un click pe un link din panou ÎNCHIDE meniul. Navigarea din Next
      // e client-side: fără asta, panoul rămânea deschis peste pagina nouă.
      if (!antet?.contains(tinta) || tinta.closest('a')) setDeschis(false)
    }

    // Trecut pe ecran lat, panoul n-are ce căuta: `.nav-links` redevine
    // rândul obișnuit din antet, iar `data-meniu` ar rămâne agățat — invizibil
    // acolo (regula de panou e sub `max-width: 1024px`), dar redeschis singur
    // la întoarcerea pe lățime mică.
    //
    // `matchMedia`, nu `resize`: se declanșează O DATĂ, la trecerea pragului,
    // în loc de zeci de ori în timpul tragerii de fereastră. Pragul e același
    // cu cel din base.css.
    const lat = window.matchMedia('(min-width: 1025px)')
    const laPrag = () => { if (lat.matches) setDeschis(false) }

    document.addEventListener('keydown', laTasta)
    document.addEventListener('click', laClick)
    lat.addEventListener('change', laPrag)
    return () => {
      document.removeEventListener('keydown', laTasta)
      document.removeEventListener('click', laClick)
      lat.removeEventListener('change', laPrag)
    }
  }, [deschis])

  return (
    <button
      ref={buton}
      className="burger"
      type="button"
      aria-label={eticheta}
      aria-controls={controleaza}
      aria-expanded={deschis}
      onClick={() => setDeschis((d) => !d)}
    >
      <span />
      <span />
      <span />
    </button>
  )
}
