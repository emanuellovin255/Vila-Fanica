import Image from 'next/image'
import Link from 'next/link'

import { AntetSectiune } from './AntetSectiune'
import { Icon } from '@/components/Icon'
import type { Offer, SiteData } from '@/content/types'

/**
 * Excursiile: o grilă de patru carduri, toate la fel.
 *
 * DE CE E SECȚIUNE SEPARATĂ (T75). Excursiile stăteau în aceeași grilă cu
 * pachetele. Nu au preț — sunt incluse în pachete, iar tariful separat nu
 * e publicat — deci nu primeau `.card-foot`, în timp ce pachetele de
 * lângă ele îl aveau. Într-o grilă care întinde toate cardurile la
 * aceeași înălțime, asta însemna un sfert de casetă goală sub fiecare
 * excursie.
 *
 * Aici cardurile sunt omogene prin construcție: aceeași poză, același
 * eyebrow (durata din `Valabil:`), un rezumat de o frază și ACELAȘI link
 * jos, pe toate. N-are cum să apară o casetă cu subsol lângă una fără.
 *
 * DE CE `g2` ȘI NU `g3`. Sunt patru. În trei coloane, al doilea rând ar
 * rămâne cu două treimi goale — adică fix problema pe care o reparăm, la
 * alt nivel. Două coloane dau 2×2, fără rest.
 *
 * Fiecare card duce la `/oferte/<slug>`, pagina care prinde căutările de
 * tipul „excursie Pădurea Letea din Crișan".
 *
 * Server Component. Fără excursii, nu se randează nimic (REGULI.md 3).
 */
export function Excursii({ date }: { date: SiteData }) {
  const excursii = date.offers.items.filter((o) => o.kind === 'excursion')
  if (!excursii.length) return null

  const { section } = date.excursions

  return (
    <section className="excursii" id="excursii">
      <div className="wrap">
        <AntetSectiune eyebrow={section.eyebrow} title={section.title} lede={section.lede} />
        <div className="grid g2">
          {excursii.map((e) => (
            <CardExcursie key={e.slug} excursie={e} eticheta={date.ui.veziExcursia} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CardExcursie({ excursie, eticheta }: { excursie: Offer; eticheta: string }) {
  const url = excursie.href ?? `/oferte/${excursie.slug}`

  return (
    <article className="card excursie">
      {excursie.image && (
        <Link href={url} className="card-media" aria-label={excursie.title}>
          <Image
            src={excursie.image}
            alt={excursie.title}
            width={640}
            height={420}
            sizes="(max-width: 820px) 100vw, 50vw"
            loading="lazy"
          />
        </Link>
      )}

      <div className="card-body">
        {/* Calendar, nu ceas: de când rândul începe cu perioada („01 apr –
            30 sep 2026 · o jumătate de zi"), un ceas ar anunța o durată și ar
            livra o dată. E același icon ca pe cardurile de pachet, unde
            rândul spune același lucru. */}
        {excursie.valid && (
          <p className="eyebrow">
            <Icon name="calendar" marime="sm" /> {excursie.valid}
          </p>
        )}
        <h3>
          <Link href={url}>{excursie.title}</Link>
        </h3>
        {excursie.summary && <p className="lede">{excursie.summary}</p>}

        {/* Subsolul e pe TOATE cardurile, fără condiție. Un card cu subsol
            lângă unul fără e exact ce a produs golul alb de dinainte. */}
        <div className="card-foot">
          <Link className="btn btn-ghost btn-sm" href={url}>
            {eticheta}
            <Icon name="arrow" marime="sm" className="ic-nudge" />
          </Link>
        </div>
      </div>
    </article>
  )
}
