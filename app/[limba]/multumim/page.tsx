import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { esteLimba } from '@/lib/i18n/limbi'

/**
 * Pagina de mulțumire (T10). Ținta redirectului fără-JavaScript după un
 * submit valid: browserul face POST nativ la `/api/formular`, route handler-ul
 * răspunde cu 303 aici. Cu JavaScript nu se ajunge niciodată pe ea — mesajul
 * de succes apare inline, în formular.
 *
 * `noindex`: o pagină de mulțumire n-are ce căuta în index. Ajunge pe ea doar
 * cine tocmai a trimis o cerere.
 */

const TEXTE = {
  ro: {
    titlu: 'Mulțumim!',
    text: 'Am primit cererea ta. Revenim cât putem de repede — de obicei în aceeași zi.',
    inapoi: 'Înapoi la pagina principală',
  },
  en: {
    titlu: 'Thank you!',
    text: 'We received your request and will get back to you shortly — usually the same day.',
    inapoi: 'Back to the homepage',
  },
} as const

export const metadata: Metadata = {
  title: 'Mulțumim',
  robots: { index: false, follow: false },
}

export default async function PaginaMultumim({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()

  const t = TEXTE[limba as 'ro' | 'en']
  const acasa = limba === 'ro' ? '/' : '/en'

  return (
    <main>
      <section className="on-brand" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <div className="wrap sec-head center">
          <h1>{t.titlu}</h1>
          <p className="lede">{t.text}</p>
          <p className="stack" style={{ justifyContent: 'center', marginTop: 'var(--sp-6)' }}>
            <a className="btn btn-accent" href={acasa}>
              {t.inapoi}
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
