import Link from 'next/link'

import { AntetSectiune } from './AntetSectiune'
import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Antetul secțiunii de servicii: titlu, text introductiv, un buton.
 *
 * NU randează serviciile — alea sunt `features`, blocurile poză + text
 * care urmează imediat. Secțiunea asta doar le introduce, ca antetul
 * pachetelor (`.oferte-antet`) pentru blocurile de pachet: aceeași
 * regulă de ritm, aer deasupra și niciunul dedesubt, ca grupul să se
 * citească drept o singură coborâre.
 *
 * Server Component. Fără titlu, nu se randează nimic (REGULI.md 3).
 */
export function Servicii({ date }: { date: SiteData }) {
  const { services } = date
  if (!services?.title) return null

  return (
    <section className="servicii-antet" id="servicii">
      <div className="wrap">
        <AntetSectiune eyebrow={services.eyebrow} title={services.title} lede={services.lede} />
        {services.cta && (
          <p className="stack" style={{ marginTop: 'var(--sp-6)' }}>
            <Link className={`btn btn-${services.cta.variant ?? 'ghost'}`} href={services.cta.href}>
              {services.cta.label}
              <Icon name="arrow" marime="sm" className="ic-nudge" />
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
