import { pret } from '@/lib/format'
import type { SiteData } from '@/content/types'
import { ButonDisponibilitate } from './ButonDisponibilitate'

/**
 * Bara lipită de jos, pe mobil: telefon apelabil + buton principal.
 *
 * Server Component. E o cerință de conversie (standarde/02, partea 3):
 * la o cabană, telefonul rămâne principalul canal, deci trebuie să fie
 * la degetul omului permanent, apelabil cu un tap.
 *
 * Se afișează doar sub 820px (regula din base.css). Fără JavaScript,
 * rămâne vizibilă și funcțională: e HTML simplu, nu depinde de niciun
 * observer.
 *
 * Prețul minim se calculează din camere, nu se scrie — și nu apare
 * deloc dacă nicio cameră n-are preț confirmat (REGULI.md 3).
 */
export function BaraLipita({ date }: { date: SiteData }) {
  const { contact, rooms, booking, meta } = date

  const preturi = rooms.items.map((c) => c.priceFrom).filter((p): p is number => typeof p === 'number')
  const minim = preturi.length ? Math.min(...preturi) : undefined

  // Fără telefon și fără preț de arătat, bara n-are ce oferi.
  if (!contact.phone && minim === undefined) return null

  return (
    <div className="mobile-bar" role="region" aria-label={date.ui.actiuniRapide}>
      {contact.phone ? (
        <a href={contact.phoneHref}>
          <small>{booking.labels.from}</small>
          {minim !== undefined ? (
            <b className="tabular">{pret(minim, meta.currencySymbol)}</b>
          ) : (
            <b>{contact.phone}</b>
          )}
        </a>
      ) : (
        minim !== undefined && (
          <span>
            <small>{booking.labels.from}</small>
            <b className="tabular">{pret(minim, meta.currencySymbol)}</b>
          </span>
        )
      )}
      {/* Pe telefon, WhatsApp e la un tap: butonul deschide conversația
          cu mesajul deja scris, nu doar derulează la formular. */}
      <ButonDisponibilitate date={date} />
    </div>
  )
}
