import type { SiteData } from '@/content/types'

/**
 * Banda de dotări de sub hero — Șablonul 5 · Termal.
 *
 * O bandă îngustă cu dotările reale ale casei, care se plimbă lent spre
 * stânga. Nu e un ticker de știri: e felul în care se citesc șapte
 * facilități scurte fără să ocupe un ecran întreg de carduri.
 *
 * CUM BUCLEAZĂ FĂRĂ JAVASCRIPT: lista se randează de DOUĂ ori în HTML,
 * iar animația mută containerul cu exact −50%. Când ajunge la capăt, a
 * doua copie e fix acolo unde era prima, deci saltul înapoi la 0 nu se
 * vede. A doua copie primește `aria-hidden`, ca un cititor de ecran să nu
 * audă lista de două ori.
 *
 * Server Component, zero JS. Sub `prefers-reduced-motion` skin-ul oprește
 * animația și lasă lista să se rupă pe rânduri, deci rămâne lizibilă.
 *
 * TEXTELE VIN DIN `date/05-facilitati.md`, nu din codul ăsta: un șablon nu
 * ține conținut (REGULI.md 1). Fără facilități scrise, banda nu se
 * randează deloc.
 */
export function BandaDotari({ date }: { date: SiteData }) {
  const dotari = date.perks.items.map((p) => p.title).filter(Boolean)
  if (dotari.length < 3) return null

  const sir = (ascuns: boolean) => (
    <ul className="banda-dotari__lista" aria-hidden={ascuns || undefined}>
      {dotari.map((d, i) => (
        <li className="banda-dotari__element" key={`${d}-${i}`}>
          {d}
        </li>
      ))}
    </ul>
  )

  return (
    <section className="banda-dotari" aria-label={date.perks.section.title || date.brand.name}>
      <div className="banda-dotari__sir">
        {sir(false)}
        {sir(true)}
      </div>
    </section>
  )
}
