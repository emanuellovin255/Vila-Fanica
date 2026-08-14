import Image from 'next/image'

import { AntetSectiune } from './AntetSectiune'
import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Spații de evenimente: săli cu capacitate și CTA. Pentru locațiile cu
 * nunți sau conferințe.
 *
 * Server Component. Modul opțional (setari.md). Nu se randează fără
 * spații. Capacitatea vine ca text din date, nu se calculează.
 */
export function Evenimente({ date }: { date: SiteData }) {
  const { events } = date
  if (!events.items.length) return null

  return (
    <section className="spatii-evenimente" id="evenimente">
      <div className="wrap">
        <AntetSectiune eyebrow={events.section.eyebrow} title={events.section.title} lede={events.section.lede} />
        <div className="grid">
          {events.items.map((ev, i) => (
            <article className="event spatiu-eveniment" key={i}>
              {ev.image && (
                <div className="event-media">
                  <Image
                    src={ev.image}
                    alt={ev.title}
                    width={720}
                    height={480}
                    sizes="(max-width: 820px) 100vw, 50vw"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="event-body">
                {ev.capacity && (
                  <span className="capacity">
                    <Icon name="users" marime="sm" /> {ev.capacity}
                  </span>
                )}
                <h3>{ev.title}</h3>
                {ev.text && <p>{ev.text}</p>}
                {ev.cta?.label && (
                  <a className="btn btn-ghost" href={ev.cta.href}>
                    {ev.cta.label}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
