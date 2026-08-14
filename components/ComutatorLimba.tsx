'use client'

import Link from 'next/link'

import type { SiteData } from '@/content/types'
import { retineLimba } from '@/lib/i18n/preferinta'
import { esteLimba } from '@/lib/i18n/limbi'

/**
 * Comutatorul de limbă.
 *
 * `"use client"` doar ca să rețină alegerea la click (preferinta.ts).
 * NU înlocuiește text în DOM (ca `i18n.js` din Elektro Kasper) — în
 * Next.js fiecare limbă are paginile ei, pre-generate (T08, DECIZII.md).
 * Fără JavaScript, rămâne un set de linkuri reale către paginile
 * echivalente: comutarea funcționează, doar că nu se reține alegerea.
 *
 * `href` duce la PAGINA ECHIVALENTĂ din cealaltă limbă, nu la prima
 * pagină — maparea vine gata calculată în `SiteData.locales` (T08).
 */
export function ComutatorLimba({
  locales,
  eticheta,
}: {
  locales: SiteData['locales']
  /** `date.ui.limba` — „Limbă" / „Language". */
  eticheta: string
}) {
  return (
    <nav className="lang" aria-label={eticheta}>
      {locales.map((l) => (
        <Link
          key={l.code}
          href={l.href}
          hrefLang={l.code}
          aria-current={l.current ? 'true' : undefined}
          onClick={() => {
            if (esteLimba(l.code)) retineLimba(l.code)
          }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
