import { AntetSectiune } from './AntetSectiune'
import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Întrebări frecvente.
 *
 * Server Component, pe `<details>`/`<summary>` NATIV: se deschide fără
 * o linie de JavaScript (REGULI.md 12). motion.css îi dă o animație la
 * deschidere, dar funcționează și fără ea. `FAQPage` din JSON-LD vine
 * la T07, generat din aceleași date.
 *
 * Nu se randează fără întrebări (REGULI.md 3).
 */
export function Faq({ date }: { date: SiteData }) {
  const { faq } = date
  if (!faq.items.length) return null

  return (
    <section className="faq" id="intrebari">
      <div className="wrap" style={{ maxWidth: '820px' }}>
        <AntetSectiune eyebrow={faq.section.eyebrow} title={faq.section.title} />
        <div className="faq-list">
          {faq.items.map((f, i) => (
            <details className="faq-item" key={i}>
              <summary className="faq-q">
                {f.q}
                <Icon name="plus" marime="sm" />
              </summary>
              <div className="faq-a">
                <div>
                  <p>{f.a}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
