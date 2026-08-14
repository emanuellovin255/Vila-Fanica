/* ============================================================
   lib/consimtamant.ts — starea consimțământului pentru cookies (T11).

   GDPR real, nu decorativ: scripturile de urmărire NU se încarcă înainte de
   accept. Componenta `Analytics` întreabă modulul ăsta și pornește Google
   Analytics doar dacă vizitatorul a acceptat categoria „analitice". Bannerul
   scrie alegerea, Analytics o citește, footer-ul o poate revoca — toate prin
   funcțiile de aici.

   Stocare: `localStorage`, ca alegerea să persiste la refresh și între vizite.
   Un `CustomEvent` anunță schimbarea în aceeași filă, ca Analytics să pornească
   sau să se oprească fără reîncărcarea paginii.

   Categoriile:
   - STRICT NECESARE: nu au comutator, nu cer consimțământ (fac site-ul să meargă).
   - ANALITICE: Google Analytics. Implicit OPRIT.
   - MARKETING: pixeli de reclamă. Implicit OPRIT. (Niciun pixel configurat acum,
     dar categoria există ca bannerul să fie corect din prima.)
   ============================================================ */

const CHEIE = 'consimtamant-cookies'
const VERSIUNE = 1

/** Numele evenimentului emis când alegerea se schimbă (ascultat de Analytics). */
export const EVENIMENT_SCHIMBARE = 'consimtamant-schimbat'
/** Numele evenimentului prin care footer-ul cere redeschiderea bannerului. */
export const EVENIMENT_REDESCHIDE = 'consimtamant-redeschide'

export type Consimtamant = {
  analitice: boolean
  marketing: boolean
}

type Stocat = Consimtamant & { v: number }

/** Alegerea salvată, sau `null` dacă vizitatorul n-a ales încă (→ arată bannerul). */
export function citeste(): Consimtamant | null {
  if (typeof window === 'undefined') return null
  try {
    const brut = window.localStorage.getItem(CHEIE)
    if (!brut) return null
    const s = JSON.parse(brut) as Stocat
    if (s.v !== VERSIUNE) return null // schimbarea versiunii = re-întrebăm
    return { analitice: Boolean(s.analitice), marketing: Boolean(s.marketing) }
  } catch {
    return null
  }
}

/** Salvează alegerea și anunță ascultătorii (Analytics) în aceeași filă. */
export function salveaza(c: Consimtamant): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHEIE, JSON.stringify({ ...c, v: VERSIUNE } satisfies Stocat))
  } catch {
    /* localStorage plin sau blocat — nu blocăm pagina */
  }
  window.dispatchEvent(new CustomEvent(EVENIMENT_SCHIMBARE, { detail: c }))
}

/** Scurtături pentru butoanele bannerului. */
export const ACCEPTA_TOT: Consimtamant = { analitice: true, marketing: true }
export const REFUZA_TOT: Consimtamant = { analitice: false, marketing: false }
