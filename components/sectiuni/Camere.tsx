import { AntetSectiune } from './AntetSectiune'
import { CardCamera } from './CardCamera'
import type { SiteData } from '@/content/types'

/**
 * Secțiunea de camere de pe prima pagină: listă de carduri.
 *
 * Server Component. Nu se randează fără camere (REGULI.md 3). Primele
 * două carduri primesc `priority` — sunt de obicei deasupra pliului pe
 * desktop; restul se încarcă leneș.
 */
export function Camere({ date }: { date: SiteData }) {
  const { rooms, meta, booking } = date
  if (!rooms.items.length) return null

  return (
    <section className="camere" id="camere">
      <div className="wrap">
        <AntetSectiune eyebrow={rooms.section.eyebrow} title={rooms.section.title} lede={rooms.section.lede} />
        <div className="grid g3">
          {rooms.items.map((camera, i) => (
            <CardCamera
              key={camera.slug}
              camera={camera}
              meta={meta}
              labels={booking.labels}
              ui={date.ui}
              prioritizeaza={i < 2}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
