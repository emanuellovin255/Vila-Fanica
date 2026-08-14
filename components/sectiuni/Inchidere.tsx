import type { SiteData } from '@/content/types'
import { ButonDisponibilitate } from './ButonDisponibilitate'

/**
 * Ultima secțiune: un singur CTA, pe fundal de brand.
 *
 * Server Component. Nu se randează fără titlu — o secțiune de închidere
 * fără mesaj n-are ce închide.
 */
export function Inchidere({ date }: { date: SiteData }) {
  const { closing } = date
  if (!closing.title) return null

  return (
    <section className="on-brand inchidere">
      <div className="wrap sec-head center">
        {closing.eyebrow && <p className="eyebrow">{closing.eyebrow}</p>}
        <h2>{closing.title}</h2>
        {closing.text && <p className="lede">{closing.text}</p>}
        {closing.cta.label && (
          <p className="stack" style={{ justifyContent: 'center', marginTop: 'var(--sp-6)' }}>
            <ButonDisponibilitate
              date={date}
              eticheta={closing.cta.label}
              variant="accent"
              ancora={closing.cta.href}
            />
          </p>
        )}
      </div>
    </section>
  )
}
