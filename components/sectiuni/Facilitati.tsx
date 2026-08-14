import { AntetSectiune } from './AntetSectiune'
import { Icon } from '@/components/Icon'
import type { IconName, SiteData } from '@/content/types'

/**
 * Facilitățile: grilă de carduri cu icon + titlu + text.
 *
 * Server Component. Iconurile din T04. Secțiunea nu se randează dacă
 * n-are niciun element (REGULI.md 3). Un icon necunoscut cade pe
 * `check` — loader-ul (T05) deja avertizează despre el, aici doar ne
 * asigurăm că nu crapă randarea.
 */
const ICOANE_CUNOSCUTE = new Set<string>([
  'pin', 'clock', 'phone', 'mail', 'globe', 'users', 'bed', 'ruler', 'accessible', 'door',
  'wifi', 'tv', 'safe', 'fridge', 'climate', 'coffee', 'shower', 'parking', 'ev', 'pool',
  'sauna', 'spa', 'dining', 'bar', 'terrace', 'check', 'star', 'shield', 'tag', 'calendar',
  'ciubar', 'foc-de-tabara', 'teleschi', 'pet-friendly', 'grill', 'biciclete', 'drumetie',
  'pescuit', 'sala-conferinte', 'mic-dejun', 'transfer-aeroport', 'incalzire-lemne',
])

function icon(nume: string): IconName {
  return (ICOANE_CUNOSCUTE.has(nume) ? nume : 'check') as IconName
}

export function Facilitati({ date }: { date: SiteData }) {
  const { perks } = date
  if (!perks.items.length) return null

  return (
    <section className="on-brand facilitati" id="facilitati">
      <div className="wrap">
        <AntetSectiune eyebrow={perks.section.eyebrow} title={perks.section.title} lede={perks.section.lede} />
        <div className="grid g4">
          {perks.items.map((p, i) => (
            <div className="perk" key={i}>
              <span className="perk-icon">
                <Icon name={icon(p.icon)} />
              </span>
              <h3>{p.title}</h3>
              {p.text && <p>{p.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
