import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import '../../styles/icons.css'
import '../../styles/admin.css'

/**
 * Layout-ul panoului de administrare.
 *
 * Parte din panoul de administrare, o modificare locală față de
 * motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.
 *
 * DE CE UN LAYOUT SEPARAT, CU `<html>` PROPRIU
 * --------------------------------------------
 * Layout-ul site-ului stă la `app/[limba]/layout.tsx` — sub un segment de
 * limbă, fiindcă `<html lang>` trebuie să fie corect pe fiecare pagină
 * publică. Panoul nu are limbă: e mereu în română, pentru o singură
 * persoană. Deci stă în afara lui `[limba]`, iar Next cere ca fiecare
 * ramură de nivel înalt să-și aducă propriul `<html>`.
 *
 * Efectul secundar util: panoul NU moștenește nici tema, nici fonturile,
 * nici tokenii site-ului. Culorile site-ului se editează chiar din panou;
 * dacă panoul le-ar folosi, o culoare pusă greșit l-ar face ilizibil exact
 * când e nevoie de el ca s-o repare.
 *
 * `middleware.ts` lasă `/admin` să treacă fără rewrite-ul de limbă, dar îi
 * pune în continuare CSP-ul și HSTS.
 */
export const metadata: Metadata = {
  title: 'Panou de administrare',
  // Nu are ce căuta în Google, nici în previzualizările de pe WhatsApp.
  robots: { index: false, follow: false, nocache: true },
}

export default function LayoutPanou({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <body className="panou">{children}</body>
    </html>
  )
}
