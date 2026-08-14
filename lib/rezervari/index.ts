/* ============================================================
   lib/rezervari/index.ts — contractul comun al celor 3 adaptoare (T12).

   `BaraDisponibilitate` (T06) nu trebuie să știe cu ce sistem vorbește. Îi dă
   funcției datele alese și primește înapoi UNA din trei instrucțiuni:

     Intrare:  { checkIn, checkOut, persoane }
     Ieșire:   { tip: 'link', url } | { tip: 'iframe', src } | { tip: 'formular' }

   Ordinea preferinței (standarde/02, viteză): deep-link (zero JS străin) >
   iframe leneș > formular. Alegerea vine din `booking.mod`
   (`date/10-rezervari-si-plati.md`); un client care schimbă furnizorul editează
   un fișier text, nu cod.
   ============================================================ */

import type { SiteData } from '@/content/types'

import { areDeepLink, FURNIZORI, numarPersoane } from './furnizori'

export type CerereRezervare = {
  checkIn: string
  checkOut: string
  persoane: string
}

export type RezultatRezervare =
  | { tip: 'link'; url: string }
  | { tip: 'iframe'; src: string }
  | { tip: 'formular' }

/**
 * Numele motorului, așa cum îl scriem pe buton: `booking.com` → „Booking.com".
 *
 * Se deduce din adresă, nu dintr-un câmp separat, ca să nu poată diverge de
 * linkul real — un buton „Rezervă pe Booking.com" care duce altundeva ar fi
 * mai rău decât unul fără nume. Șir gol dacă adresa lipsește sau e stricată,
 * iar apelantul cade pe eticheta generică.
 */
export function numeMotor(engineUrl: string): string {
  try {
    const gazda = new URL(engineUrl).hostname.replace(/^www\./, '')
    return gazda.charAt(0).toUpperCase() + gazda.slice(1)
  } catch {
    return ''
  }
}

/** Adaugă parametri la un URL fără să-i piardă pe cei existenți. */
function cuParametri(baza: string, params: Record<string, string>): string {
  const url = new URL(baza)
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v)
  return url.toString()
}

/**
 * Rezolvă o cerere de disponibilitate în instrucțiunea pe care o execută
 * componenta. Robust la config incompletă: un `deep-link` fără furnizor
 * cunoscut sau fără adresă cade elegant pe iframe, iar iframe fără adresă cade
 * pe formular — mereu rămâne o cale către rezervare.
 */
export function rezolvaRezervare(
  booking: SiteData['booking'],
  cerere: CerereRezervare,
): RezultatRezervare {
  const { mod, furnizor, engineUrl } = booking

  if (mod === 'deep-link' && engineUrl && areDeepLink(furnizor)) {
    const construieste = FURNIZORI[(furnizor as string).toLowerCase()]
    const params = construieste({
      checkIn: cerere.checkIn,
      checkOut: cerere.checkOut,
      adulti: numarPersoane(cerere.persoane),
    })
    return { tip: 'link', url: cuParametri(engineUrl, params) }
  }

  // Deep-link cerut dar fără furnizor cunoscut: tot îi ducem în motor, fără
  // pre-completare — mai bine pasul 1 al motorului lor decât nimic.
  if (mod === 'deep-link' && engineUrl) return { tip: 'link', url: engineUrl }

  if (mod === 'iframe' && engineUrl) return { tip: 'iframe', src: engineUrl }

  return { tip: 'formular' }
}
