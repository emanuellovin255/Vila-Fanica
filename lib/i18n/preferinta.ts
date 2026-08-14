/* ============================================================
   preferinta.ts — memoria alegerii de limbă.

   Sursă: logica de rezolvare și persistență din
   Siteuri gata/Elektro Kasper/js/i18n.js (646 linii).

   CE S-A PRELUAT ȘI CE NU (DECIZII.md, T08)
   -----------------------------------------
   `i18n.js` făcea două lucruri: (1) reținea alegerea de limbă și o
   rezolva în ordinea URL → localStorage → implicit, și (2) înlocuia
   text în DOM, în browserul vizitatorului.

   Se preia DOAR (1). Înlocuirea de text în DOM NU se preia: în Next.js
   traducerea se rezolvă la BUILD, cu conținutul în HTML — altfel un
   crawler AI care nu execută JavaScript ar vedea o singură limbă
   (același motiv ca la `bind.js`).

   Ce rămâne aici e minim și onest: reținem ce a ales omul, ca data
   viitoare comutatorul să pornească de la alegerea lui. NU
   redirecționăm automat — un redirect din localStorage ar ascunde `/en`
   de crawlere și ar fi o surpriză pentru vizitator. Româna rămâne
   implicită la `/`, engleza rămâne explicită la `/en`.
   ============================================================ */

'use client'

import { LIMBA_IMPLICITA, LIMBI, type Limba } from './limbi'

const CHEIE = 'sr-limba'

/** Reține alegerea. Se apelează când omul apasă pe comutator. */
export function retineLimba(limba: Limba): void {
  try {
    if (limba === LIMBA_IMPLICITA) localStorage.removeItem(CHEIE)
    else localStorage.setItem(CHEIE, limba)
  } catch {
    // Mod privat / cookies blocate: nu reținem, dar nici nu crăpăm.
  }
}

/** Limba reținută, sau `null` dacă nu s-a ales nimic încă. */
export function limbaRetinuta(): Limba | null {
  try {
    const v = localStorage.getItem(CHEIE)
    return v && (LIMBI as readonly string[]).includes(v) ? (v as Limba) : null
  } catch {
    return null
  }
}
