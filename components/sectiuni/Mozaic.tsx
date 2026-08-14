import Image from 'next/image'
import Link from 'next/link'

import { AntetSectiune } from './AntetSectiune'
import type { SiteData } from '@/content/types'
import { caleaPublica, type Limba } from '@/lib/i18n/limbi'
import { traduSegment } from '@/lib/i18n/rute'

/** Câte poze intră în mozaic. Cinci e ritmul: una mare, patru mici. */
const CATE = 5

/**
 * Mozaic foto — o grilă editorială, între două secțiuni de text.
 *
 * De ce există, când site-ul are deja o pagină de galerie: galeria e o
 * destinație, iar pe prima pagină aproape nimeni nu ajunge la ea. Aici
 * fotografiile sunt puse în drum, în locul unde vizitatorul tocmai a
 * citit despre camere și se întreabă cum arată de fapt locul. Cinci
 * cadre, nu treizeci: cât să convingă, nu cât să obosească.
 *
 * Server Component. Pozele se strâng din datele existente (camere,
 * feature-uri, oferte) — nu există un al doilea loc în care gazda să
 * aleagă poze pentru mozaic, fiindcă ar fi încă o listă de întreținut,
 * care s-ar desincroniza de restul site-ului.
 *
 * Sub `CATE` poze, secțiunea nu se randează: o grilă cu două cadre și
 * trei goluri arată stricat (REGULI.md 3).
 *
 * PERFORMANȚĂ: în listă intră doar thumbnail-uri (`sizes` le cere la
 * ~320–640px, nu la lățimea originală), `width`/`height` sunt fixe →
 * CLS 0, iar tot ce e sub primele două cadre e `lazy`.
 */
export function Mozaic({ date }: { date: SiteData }) {
  const imagini: { src: string; alt: string }[] = []
  const adauga = (src?: string, alt?: string) => {
    if (!src || imagini.some((i) => i.src === src)) return
    imagini.push({ src, alt: alt?.trim() || date.brand.name })
  }

  // Ordinea contează: feature-urile sunt cadrele „mari" ale locului
  // (spa, apă, restaurant), camerele vin după, ofertele la urmă.
  for (const f of date.features) adauga(f.image, f.title)
  for (const c of date.rooms.items) {
    adauga(c.image, c.name)
    c.images?.forEach((im) => adauga(im, c.name))
  }
  for (const o of date.offers.items) adauga(o.image, o.title)

  if (imagini.length < CATE) return null

  const alese = imagini.slice(0, CATE)

  /**
   * Butonul „vezi toate" apare DOAR dacă pagina de galerie chiar există.
   *
   * `/galerie` se generează numai cu „Galerie extinsă: da" în setari.md.
   * Semnalul îl citim din `date.nav`, unde loaderul a pus deja linkul
   * exact în aceeași condiție — așa nu trebuie să primim `setari` până
   * aici, și cele două nu se pot desincroniza.
   */
  const limba = date.meta.localeShort as Limba
  const caleGalerie = caleaPublica(limba, traduSegment('/galerie', limba))
  const areGalerie = date.nav.some((n) => n.href === caleGalerie)

  return (
    <section className="mozaic" id="mozaic">
      <div className="wrap">
        <AntetSectiune eyebrow={date.ui.galerieTitlu} title={date.ui.galerieSubtitlu} />

        <div className="mozaic-grila" data-stagger>
          {alese.map((im, i) => (
            <figure
              key={im.src}
              className="mozaic-celula"
              // Prima celulă ocupă două rânduri; restul, unul. Marcajul
              // e un atribut, nu o clasă, ca skin-urile să-l poată
              // suprascrie fără să se bată pe specificitate.
              data-mare={i === 0 ? 'true' : undefined}
            >
              <Image
                src={im.src}
                alt={im.alt}
                width={i === 0 ? 900 : 560}
                height={i === 0 ? 1100 : 420}
                sizes={i === 0 ? '(max-width: 900px) 100vw, 44vw' : '(max-width: 900px) 50vw, 22vw'}
                loading={i < 2 ? undefined : 'lazy'}
              />
            </figure>
          ))}
        </div>

        {areGalerie && (
          <p className="mozaic-link">
            <Link className="btn btn-ghost" href={caleGalerie}>
              {date.ui.galerieTitlu}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
