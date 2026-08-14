import { Stele } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Nota medie agregată.
 *
 * Se randează FĂRĂ să numească platforma (T06): „9,2 din 10", nu „9,2
 * pe Booking". `count` și `source` se păstrează pentru schema (T07) și
 * pentru afișarea sursei — dar afișajul principal rămâne curat.
 *
 * Numai din date reale, cu sursă (REGULI.md 3): dacă `rating` există,
 * loader-ul (T05) i-a verificat deja sursa.
 */
export function NotaMedie({ rating }: { rating: NonNullable<SiteData['rating']> }) {
  const stele = Math.round((Number(rating.value.replace(',', '.')) / rating.scale) * 5)

  return (
    <div className="rating-badge">
      {stele > 0 && <Stele numar={stele} />}
      <b className="tabular">{rating.value}</b>
      <span>
        din {rating.scale}
        {rating.count ? ` · ${rating.count} recenzii` : ''}
      </span>
    </div>
  )
}
