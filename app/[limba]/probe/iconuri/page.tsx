import type { Metadata } from 'next'

import { Icon, NUME_ICONURI, Stele } from '@/components/Icon'

/**
 * Pagina de probă a setului de iconuri (T04, „Verificare").
 *
 * Randează tot setul la 18 / 24 / 32px, pe fundal deschis și pe fundal
 * închis. Un icon care „sare" din set — linie mai groasă, margine
 * diferită, densitate mai mare — se vede imediat pe un singur ecran.
 *
 * `noindex` și exclusă din sitemap. `npm run client-nou` (T31) nu o
 * copiază în repo-ul unui client: e o unealtă a motorului.
 */
export const metadata: Metadata = {
  title: 'Probă · setul de iconuri',
  robots: { index: false, follow: false },
}

function Grila() {
  return (
    <div className="probe-icoane">
      {NUME_ICONURI.map((name) => (
        <figure key={name}>
          <div className="probe-marimi">
            <Icon name={name} marime="sm" />
            <Icon name={name} />
            <Icon name={name} marime="lg" />
          </div>
          <figcaption>{name}</figcaption>
        </figure>
      ))}
    </div>
  )
}

export default function ProbaIconuri() {
  return (
    <main>
      <section className="wrap">
        <div className="sec-head">
          <p className="eyebrow">Probă</p>
          <h1>Setul de iconuri</h1>
          <p className="lede">
            {NUME_ICONURI.length} iconuri, fiecare la 18, 24 și 32 px. Toate moștenesc culoarea
            textului de lângă ele. Zero emoji, zero bibliotecă, zero sprite extern.
          </p>
          <p className="stack" style={{ marginTop: 'var(--sp-4)' }}>
            <Stele numar={5} />
          </p>
        </div>
        <Grila />
      </section>

      <section className="probe-fundal-inchis">
        <div className="wrap">
          <div className="sec-head">
            <h2>Același set, pe fundal închis</h2>
            <p className="lede">
              Aceleași fișiere, altă culoare moștenită. Dacă vreun icon are o culoare proprie, aici
              se vede.
            </p>
          </div>
          <Grila />
        </div>
      </section>
    </main>
  )
}
