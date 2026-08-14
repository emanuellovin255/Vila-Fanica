/* ============================================================
   lib/rezervari/furnizori.ts — formatul de parametri al fiecărui motor.

   Deep-link înseamnă să trimiți vizitatorul direct în pasul 2 al rezervării,
   cu datele deja completate. Fiecare furnizor își numește parametrii altfel;
   maparea de aici e EXPLICITĂ, cu o notă despre sursa formatului (documentație
   sau URL observat pe un site real). Ce nu e aici cade pe iframe sau formular —
   nu inventăm un format de parametri pe care nu-l știm (REGULI.md 3).

   Intrarea comună: date `YYYY-MM-DD` (exact ce dă `<input type="date">`) și un
   număr de persoane extras din opțiunea aleasă („2 persoane" → 2).
   ============================================================ */

export type ParamRezervare = {
  checkIn: string
  checkOut: string
  adulti: number
}

/** Construiește query string-ul pentru un furnizor, sau `null` dacă nu-l știm. */
type Constructor = (p: ParamRezervare) => Record<string, string>

/** Vezi nota de la intrarea `booking` din `FURNIZORI`. */
const paramBooking: Constructor = ({ checkIn, checkOut, adulti }) => ({
  checkin: checkIn,
  checkout: checkOut,
  group_adults: String(adulti),
  group_children: '0',
  no_rooms: '1',
})

/**
 * Fiecare intrare = cum își numește furnizorul parametrii. Cheile sunt
 * normalizate (litere mici). Formatele sunt cele documentate / observate;
 * dacă un furnizor și le schimbă, se editează aici, într-un singur loc.
 */
export const FURNIZORI: Record<string, Constructor> = {
  // Previo (booking.previo.app) — deep-link cu date ISO și număr de persoane.
  // Observat pe widget-urile Previo ale pensiunilor RO.
  previo: ({ checkIn, checkOut, adulti }) => ({
    dateFrom: checkIn,
    dateTo: checkOut,
    persons: String(adulti),
  }),

  // SiteMinder / The Booking Button — checkin/checkout + adults.
  // Documentat în deep-link-urile TheBookingButton.
  siteminder: ({ checkIn, checkOut, adulti }) => ({
    checkin: checkIn,
    checkout: checkOut,
    adults: String(adulti),
  }),

  // Cloudbeds (hotels.cloudbeds.com) — checkin/checkout + adults.
  cloudbeds: ({ checkIn, checkOut, adulti }) => ({
    checkin: checkIn,
    checkout: checkOut,
    adults: String(adulti),
  }),

  /*
   * Booking.com — cazul pensiunilor care n-au motor propriu, dar au deja
   * o pagină de proprietate cu disponibilitate reală.
   *
   * Pe pagina unei proprietăți, Booking selectează perioada DOAR dacă
   * primește setul complet: perioadă + adulți + copii + număr de camere.
   * Fără `no_rooms`/`group_children` cade pe ultima căutare din cookie-ul
   * vizitatorului — adică pe alte date decât cele alese la noi. De asta
   * cele două sunt scrise explicit, nu lăsate implicite.
   *
   * `group_children=0` fiindcă bara noastră întreabă doar „câți oaspeți";
   * cine vine cu copii îi adaugă pe Booking, unde oricum se cer vârstele.
   *
   * Alias „booking.com" fiindcă exact așa se scrie în date/10
   * („Sistem: booking.com").
   */
  booking: paramBooking,
  'booking.com': paramBooking,
}

/** `true` dacă știm formatul de deep-link al furnizorului. */
export function areDeepLink(furnizor?: string): boolean {
  return Boolean(furnizor && FURNIZORI[furnizor.toLowerCase()])
}

/** Extrage numărul de adulți dintr-o opțiune de tip „2 persoane" / „2 adults". Minim 1. */
export function numarPersoane(optiune: string): number {
  const m = optiune.match(/\d+/)
  const n = m ? parseInt(m[0], 10) : 1
  return Number.isFinite(n) && n > 0 ? n : 1
}
