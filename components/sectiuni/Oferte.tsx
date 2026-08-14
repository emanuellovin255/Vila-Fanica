import Image from 'next/image'
import Link from 'next/link'

import { AntetSectiune } from './AntetSectiune'
import { ButonDisponibilitate } from './ButonDisponibilitate'
import { ListaPreturi } from './ListaPreturi'
import { Icon } from '@/components/Icon'
import type { Offer, SiteData } from '@/content/types'

/**
 * Pachetele: antet, apoi un bloc mare poză + text pentru fiecare, cu
 * latura care alternează stânga – dreapta.
 *
 * DE CE NU MAI E O GRILĂ DE CARDURI (T75). Până aici secțiunea băga în
 * aceeași grilă `.g3` și pachetele, și cele patru excursii. Pachetele
 * primeau ca text lista `Include:` întreagă, unită într-un singur string
 * de opt rânduri, iar excursiile n-au preț, deci `.card-foot` nu se
 * randa deloc pentru ele. Rezultatul, în aceeași grilă care întinde toate
 * cardurile la înălțimea celui mai înalt: casete de trei ori mai scurte
 * decât vecinele lor, cu un sfert de card gol dedesubt — exact „golurile
 * albe" raportate. Excursiile au acum secțiunea lor (`Excursii.tsx`).
 *
 * Un pachet e o decizie de câteva mii de lei, deci merită lățimea plină:
 * poză mare, program pe buline, preț și două căi de acțiune. Structura e
 * fix cea din `FeatureAlternant` — `.split` cu `data-reverse` — ca ritmul
 * paginii să nu se rupă între feature-uri și pachete.
 *
 * Alternanța se calculează din index, nu se scrie în date: ștergerea unui
 * pachet nu strică ordinea celorlalte.
 *
 * Server Component. Fără pachete, nu se randează nimic (REGULI.md 3).
 */
export function Oferte({ date }: { date: SiteData }) {
  const pachete = date.offers.items.filter((o) => o.kind === 'package')
  if (!pachete.length) return null

  const { section } = date.offers
  const areAntet = Boolean(section.eyebrow || section.title || section.lede)

  return (
    <>
      {areAntet && (
        <section className="oferte-antet" id="oferte">
          <div className="wrap">
            <AntetSectiune eyebrow={section.eyebrow} title={section.title} lede={section.lede} />
          </div>
        </section>
      )}

      {pachete.map((o, i) => (
        <BlocPachet key={o.slug} oferta={o} date={date} reverse={i % 2 === 1} />
      ))}
    </>
  )
}

function BlocPachet({
  oferta,
  date,
  reverse,
}: {
  oferta: Offer
  date: SiteData
  reverse: boolean
}) {
  const url = oferta.href ?? `/oferte/${oferta.slug}`

  return (
    <section className="feature pachet-bloc" id={oferta.slug}>
      <div className="wrap">
        <div className="split" data-reverse={reverse ? 'true' : undefined}>
          {oferta.image && (
            <div className="split-media">
              <Image
                src={oferta.image}
                alt={oferta.title}
                width={720}
                height={560}
                sizes="(max-width: 820px) 100vw, 50vw"
                loading="lazy"
              />
              {oferta.badge && <span className="ribbon">{oferta.badge}</span>}
            </div>
          )}

          <div className="split-body">
            {oferta.valid && (
              <p className="eyebrow">
                <Icon name="calendar" marime="sm" /> {oferta.valid}
              </p>
            )}
            <h3>{oferta.title}</h3>
            {oferta.summary && <p className="lede">{oferta.summary}</p>}

            {oferta.bullets.length > 0 && (
              <ul>
                {oferta.bullets.map((b, i) => (
                  <li key={i}>
                    <Icon name="check" marime="sm" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {/* Variantele de perioadă, cu prețul fiecăreia (cerință de
                client). Un pachet care costă 1.400 lei primăvara și
                1.500 vara n-are „un preț" — „de la 1.400" ascundea
                jumătate din adevăr până la pagina ofertei. */}
            {oferta.prices?.length ? (
              <ListaPreturi preturi={oferta.prices} className="pachet-pret" />
            ) : (
              oferta.price && (
                <div className="price pachet-pret">
                  <b className="tabular">
                    {oferta.price}
                    {oferta.priceUnit && <em> {oferta.priceUnit}</em>}
                  </b>
                  {oferta.priceWas && <span className="was tabular">{oferta.priceWas}</span>}
                </div>
              )
            )}

            <div className="stack">
              <ButonDisponibilitate date={date} context={oferta.title} />
              <Link className="btn btn-ghost" href={url}>
                {date.ui.veziPachetul}
                <Icon name="arrow" marime="sm" className="ic-nudge" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
