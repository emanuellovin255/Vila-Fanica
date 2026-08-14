import type { SiteData } from '@/content/types'

/**
 * Banda de încredere: 3-5 cifre sau fapte, sub prima secțiune.
 *
 * Server Component. Se randează doar dacă are elemente (REGULI.md 3):
 * o bandă goală e mai rea decât niciuna. Numărul de coloane se dă din
 * CSS (`--trust-cols`), calculat din câte elemente sunt.
 */
export function BandaIncredere({ date }: { date: SiteData }) {
  const { trust } = date
  if (!trust.length) return null

  return (
    <section className="trust" aria-label={date.ui.laUnMomentDat}>
      <div className="wrap" style={{ ['--trust-cols' as string]: String(trust.length) }}>
        {trust.map((t, i) => (
          <div className="trust-item" key={i}>
            <b className="tabular">{t.value}</b>
            <span>{t.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
