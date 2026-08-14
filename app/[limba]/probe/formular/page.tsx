import type { Metadata } from 'next'

import { Formular } from '@/components/Formular'

/**
 * Pagina de probă a formularului (T10, „Verificare"). Îl randează în ambele
 * limbi, ca să văd câmpurile, mesajele și widget-ul Turnstile (când e configurat).
 * `noindex`, exclusă din sitemap, necopiată la un client (T31).
 */
export const metadata: Metadata = {
  title: 'Probă · formular',
  robots: { index: false, follow: false },
}

export default async function ProbaFormular({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  const l = limba === 'en' ? 'en' : 'ro'
  return (
    <main id="continut">
      <section>
        <div className="wrap" style={{ maxWidth: 560 }}>
          <p className="eyebrow" style={{ paddingTop: 'var(--sp-8)' }}>
            Probă · formular ({l})
          </p>
          <Formular limba={l} />
        </div>
      </section>
    </main>
  )
}
