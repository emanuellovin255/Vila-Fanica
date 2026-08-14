import { AntetSectiune } from './AntetSectiune'
import { VideoVertical } from './VideoVertical'
import type { SiteData } from '@/content/types'

/**
 * Secțiunea cu clipul de prezentare al locației (T60), pe prima pagină.
 *
 * Fără date, nu se randează (REGULI.md 3): loader-ul completează
 * `date.prezentare` doar când blocul are și video, și poster. Video-ul
 * stă în ramă, pe fundal contrastant, ca să nu concureze cu hero-ul.
 */
export function Prezentare({ date }: { date: SiteData }) {
  const p = date.prezentare
  if (!p) return null

  return (
    <section className="prezentare" aria-label={p.title || 'Clip de prezentare'}>
      <div className="wrap prezentare-grid">
        <div className="prezentare-text">
          <AntetSectiune eyebrow={p.eyebrow} title={p.title} lede={p.text} />
        </div>
        <VideoVertical src={p.video} poster={p.poster} eticheta={p.title || date.brand.name} />
      </div>
    </section>
  )
}
