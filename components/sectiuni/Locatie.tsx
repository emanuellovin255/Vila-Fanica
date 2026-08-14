import Image from 'next/image'
import Link from 'next/link'

import { AntetSectiune } from './AntetSectiune'
import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'
import { caleaPublica, type Limba } from '@/lib/i18n/limbi'
import { traduSegment } from '@/lib/i18n/rute'

/**
 * „Locația" — trei blocuri poză + text, cu latura care alternează.
 *
 * Cerință de client: între camere și pachete trebuie să stea informații
 * și poze despre locație, în trei blocuri — poza stânga, poza dreapta,
 * poza stânga. Alternanța se calculează din index (`i % 2 === 1`), nu se
 * scrie în date: dacă se șterge un bloc, restul se rearanjează singure.
 *
 * DATELE NU SE DUBLEAZĂ. Blocurile se construiesc din `date.area`, adică
 * din `date/13-zona-si-atractii.md` — aceleași atracții pe care le arată și pagina
 * `/zona`, doar că aici sunt doar cele marcate `Prima pagină: da`. Nu
 * există un fișier separat de întreținut și nimic scris de mână în
 * componentă (REGULI.md 3): dacă gazda schimbă textul Pădurii Letea, se
 * schimbă în amândouă locurile.
 *
 * Structura urmează `FeatureAlternant` — frați `<section class="feature">`
 * cu `.split` înăuntru — ca ritmul paginii să fie același între
 * feature-uri, pachete și blocurile de aici.
 *
 * Server Component. Pozele sunt mereu sub pliu → `loading="lazy"`.
 * Fără atracții în `13-zona-si-atractii.md`, nu se randează nimic.
 */
const CATE = 3

/**
 * Atracțiile marcate `Prima pagină: da` în `13-zona-si-atractii.md`; fără niciuna
 * marcată, primele `CATE` din fișier.
 *
 * Selecția implicită („primele trei") punea aici exact atracțiile care se
 * vând și ca excursii în `06-oferte-si-excursii.md` — Letea, Mila 23, Sulina — deci
 * aceleași poze și aceleași texte apăreau de două ori pe prima pagină
 * (T75). Fallback-ul rămâne, ca un client fără cheia nouă să se randeze
 * neschimbat.
 */
function alese(items: SiteData['area']['items']) {
  const marcate = items.filter((a) => a.onHome)
  return marcate.length ? marcate.slice(0, CATE) : items.slice(0, CATE)
}

export function Locatie({ date }: { date: SiteData }) {
  const items = alese(date.area.items)
  if (!items.length) return null

  const { section } = date.area
  const areAntet = Boolean(section.eyebrow || section.title || section.lede)
  // Pe /en linkul trebuie să ducă la `/en/area`, nu la `/zona` — altfel
  // butonul scotea vizitatorul înapoi pe română (T76).
  const limba = date.meta.localeShort as Limba
  const caleCatreZona = caleaPublica(limba, traduSegment('/zona', limba))

  return (
    <>
      {areAntet && (
        <section className="locatie-antet" id="locatie">
          <div className="wrap">
            <AntetSectiune eyebrow={section.eyebrow} title={section.title} lede={section.lede} />
          </div>
        </section>
      )}

      {items.map((a, i) => (
        <section className="feature locatie-bloc" key={a.name}>
          <div className="wrap">
            <div className="split" data-reverse={i % 2 === 1 ? 'true' : undefined}>
              {a.image && (
                <div className="split-media">
                  <Image
                    src={a.image}
                    alt={a.name}
                    width={720}
                    height={560}
                    sizes="(max-width: 820px) 100vw, 50vw"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="split-body">
                {a.distance && (
                  <p className="eyebrow">
                    <Icon name="clock" marime="sm" /> {a.distance}
                  </p>
                )}
                <h3>{a.name}</h3>
                <p className="lede">{a.text}</p>

                {/* Ultimul bloc duce mai departe: restul atracțiilor stau pe
                    pagina lor, care e cea care rankează pe „ce vizitezi în
                    Delta Dunării". */}
                {i === items.length - 1 && date.area.items.length > CATE && (
                  <p className="stack" style={{ marginTop: 'var(--sp-5)' }}>
                    <Link className="btn btn-ghost" href={caleCatreZona}>
                      <Icon name="pin" marime="sm" /> {date.ui.veziToataZona}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  )
}
