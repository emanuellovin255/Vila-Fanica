import Image from 'next/image'

import { AntetSectiune } from './AntetSectiune'
import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Pagina „Zona": atracțiile din jur și cât se face până la ele.
 *
 * DE CE E O PAGINĂ ȘI NU O SECȚIUNE
 * ---------------------------------
 * Prinde căutările din faza „unde mergem?", care vine ÎNAINTEA fazei „unde
 * dormim?" și are concurență mult mai mică. Cine caută „ce vizitezi în Delta
 * Dunării" nu caută încă o pensiune — dar va căuta una, iar atunci a fost deja
 * pe site-ul ăsta. Ca secțiune pe prima pagină n-ar avea adresă proprie, deci
 * n-ar putea rankeza pe nimic.
 *
 * DISTANȚA E TEXT LIBER, nu un număr de kilometri. La o locație în care se
 * ajunge cu barca, „18 km" e o informație inutilă și înșelătoare; „45 de minute
 * cu barca" e ce vrea omul să știe. Câmpul acceptă ce scrie gazda.
 *
 * Fără poză, cardul rămâne doar text — nu se randează un chenar gol.
 */
export function Zona({ date }: { date: SiteData }) {
  const { section, items } = date.area
  if (!items.length) return null

  return (
    <section className="section" id="zona">
      <div className="wrap">
        <AntetSectiune eyebrow={section.eyebrow} title={section.title} lede={section.lede} />

        <div className="zona-lista">
          {items.map((a) => (
            <article key={a.name} className="zona-item">
              {a.image && (
                <div className="zona-poza">
                  <Image
                    src={a.image}
                    alt={a.name}
                    width={720}
                    height={480}
                    sizes="(max-width: 820px) 100vw, 360px"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="zona-text">
                <h3>{a.name}</h3>
                {a.distance && (
                  <p className="zona-distanta">
                    <Icon name="clock" />
                    {a.distance}
                  </p>
                )}
                <p>{a.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
