import Image from 'next/image'
import Link from 'next/link'

import { AmenitatiChips } from './AmenitatiChips'
import { ListaPreturi } from './ListaPreturi'
import { pret } from '@/lib/format'
import { Icon } from '@/components/Icon'
import type { Room, SiteData } from '@/content/types'
import { caleaPublica, type Limba } from '@/lib/i18n/limbi'
import { traduSegment } from '@/lib/i18n/rute'

/**
 * Cardul unei camere. Duce la `/camere/<slug>` — pagina care prinde
 * căutările (T07).
 *
 * Server Component. `prioritizeaza` e adevărat doar pentru primele
 * carduri de deasupra pliului; restul primesc `loading="lazy"`
 * (REGULI.md 13).
 *
 * PREȚUL. Cu „Prețuri:" completat în `04-camere.md`, cardul arată grila
 * pe sezoane — cerință de client. Fără ea, rămâne „de la …", format din
 * numărul curat (T05); fără niciun preț confirmat se afișează
 * `booking.labels.submit`, nu un preț inventat (REGULI.md 3).
 *
 * De ce grila și nu „de la": tariful minim al pensiunii ăsteia e cel din
 * noiembrie, adică o lună din nouă. „De la 270 lei" era corect și,
 * pentru cine caută în iulie, complet nefolositor.
 */
export function CardCamera({
  camera,
  meta,
  labels,
  ui,
  prioritizeaza = false,
}: {
  camera: Room
  meta: SiteData['meta']
  labels: SiteData['booking']['labels']
  /** `date.ui` — etichetele dotărilor în limba paginii. */
  ui: SiteData['ui']
  prioritizeaza?: boolean
}) {
  // Pe /en cardul trebuie să ducă la `/en/rooms/<slug>` (T76).
  const limba = meta.localeShort as Limba
  const url = caleaPublica(limba, traduSegment(`/camere/${camera.slug}`, limba))

  return (
    <article className="card camera">
      <Link href={url} className="card-media" aria-label={camera.tag ? `${camera.name} — ${camera.tag}` : camera.name}>
        {camera.image && (
          <Image
            src={camera.image}
            alt={camera.name}
            width={640}
            height={480}
            sizes="(max-width: 820px) 100vw, 33vw"
            priority={prioritizeaza}
            loading={prioritizeaza ? undefined : 'lazy'}
          />
        )}
        {camera.tag && (
          <span className="ribbon" data-scarce={camera.scarce ? 'true' : undefined}>
            {camera.tag}
          </span>
        )}
      </Link>

      <div className="card-body">
        <h3>
          <Link href={url}>{camera.name}</Link>
        </h3>

        <div className="meta">
          {camera.occupancy && (
            <span>
              <Icon name="users" marime="sm" /> {camera.occupancy}
            </span>
          )}
          {camera.bed && (
            <span>
              <Icon name="bed" marime="sm" /> {camera.bed}
            </span>
          )}
          {camera.size && (
            <span>
              <Icon name="ruler" marime="sm" /> {camera.size}
            </span>
          )}
        </div>

        <AmenitatiChips amenitati={camera.amenities} ui={ui} maxim={4} />

        <div className="card-foot">
          {camera.prices?.length ? (
            <ListaPreturi preturi={camera.prices} />
          ) : (
            <div className="price">
              {camera.priceFrom !== undefined ? (
                <>
                  <small>{labels.from}</small>
                  <b className="tabular">
                    {pret(camera.priceFrom, meta.currencySymbol)} <em>/ {labels.perNight}</em>
                  </b>
                </>
              ) : (
                <span className="price-ask">{labels.submit}</span>
              )}
            </div>
          )}
          <Link className="btn btn-ghost btn-sm" href={url} aria-label={camera.name}>
            <Icon name="arrow" marime="sm" className="ic-nudge" />
          </Link>
        </div>
      </div>
    </article>
  )
}
