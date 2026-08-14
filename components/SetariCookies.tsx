'use client'

import { EVENIMENT_REDESCHIDE } from '@/lib/consimtamant'

/* ============================================================
   components/SetariCookies.tsx — declanșatorul din footer (T11).

   Alegerea de cookies trebuie să fie REVOCABILĂ oricând, nu doar la prima
   vizită. Butonul ăsta, pus în subsol, redeschide bannerul cu alegerea
   curentă, ca vizitatorul să și-o poată schimba. Emite doar un eveniment;
   bannerul (`BannerCookies`) ascultă și se ocupă de restul.
   ============================================================ */

export function SetariCookies({ eticheta = 'Setări cookies' }: { eticheta?: string }) {
  return (
    <button
      type="button"
      className="link-buton"
      onClick={() => window.dispatchEvent(new Event(EVENIMENT_REDESCHIDE))}
    >
      {eticheta}
    </button>
  )
}
