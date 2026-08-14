import { AntetSectiune } from './AntetSectiune'
import { NotaMedie } from './NotaMedie'
import { Stele } from '@/components/Icon'
import type { Review, SiteData } from '@/content/types'

/**
 * Recenziile: citat, autor, sursă, notă.
 *
 * Server Component. SURSA E OBLIGATORIE (REGULI.md 3): loader-ul (T05)
 * a eliminat deja recenziile fără sursă înainte să ajungă aici, deci
 * orice recenzie randată o are. Dacă n-a rămas niciuna, secțiunea nu
 * se randează.
 *
 * Sursa se AFIȘEAZĂ lângă autor: e ceea ce o face verificabilă și, în
 * același timp, ce Google cere ca `Review` să fie legal.
 */
export function Recenzii({ date }: { date: SiteData }) {
  const { reviews, rating } = date
  // Nota medie poate exista fără citate; le tratăm separat.
  if (!reviews.items.length && !rating) return null

  return (
    <section className="recenzii" id="recenzii">
      <div className="wrap">
        <div className="sec-head" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-6)', alignItems: 'flex-end' }}>
          <AntetSectiune eyebrow={reviews.section.eyebrow} title={reviews.section.title} lede={reviews.section.lede} />
          {rating && <NotaMedie rating={rating} />}
        </div>

        {reviews.items.length > 0 && (
          <div className="grid g3">
            {reviews.items.map((r, i) => (
              <CardRecenzie key={i} recenzie={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function CardRecenzie({ recenzie }: { recenzie: Review }) {
  const initiala = recenzie.author.trim()[0]?.toUpperCase() ?? '·'
  return (
    <figure className="review recenzie">
      {recenzie.rating > 0 && <Stele numar={recenzie.rating} />}
      <blockquote>{recenzie.quote}</blockquote>
      <figcaption>
        <span className="avatar" aria-hidden="true">
          {initiala}
        </span>
        <div>
          {recenzie.author && <b>{recenzie.author}</b>}
          {/* Sursa: de unde vine și când. Obligatorie (REGULI.md 3). */}
          <span>{[recenzie.source, recenzie.date].filter(Boolean).join(' · ')}</span>
        </div>
      </figcaption>
    </figure>
  )
}
