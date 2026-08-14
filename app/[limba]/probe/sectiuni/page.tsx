import type { Metadata } from 'next'

import {
  BandaIncredere,
  Camere,
  Evenimente,
  Facilitati,
  Faq,
  Features,
  Hero,
  Inchidere,
  Oferte,
  Recenzii,
} from '@/components/sectiuni'
import { Miscare } from '@/components/Miscare'
import { DEMO } from '@/lib/demo'
import type { SiteData } from '@/content/types'

/**
 * Pagina de probă a componentelor de secțiune (T06, „Verificare").
 *
 * Fiecare secțiune se randează de TREI ori: cu date complete, cu date
 * parțiale, cu date absente. Criteriul e ca a treia coloană să nu
 * producă niciodată un „undefined" în pagină și nicio secțiune cu titlu
 * urmat de gol — secțiunea trebuie pur și simplu să lipsească.
 *
 * `noindex`, exclusă din sitemap, necopiată la un client (T31).
 */
export const metadata: Metadata = {
  title: 'Probă · componentele de secțiune',
  robots: { index: false, follow: false },
}

/** Aceleași date, dar cu secțiunile golite — pentru coloana „absent". */
const GOL: SiteData = {
  ...DEMO,
  trust: [],
  perks: { ...DEMO.perks, items: [] },
  rooms: { ...DEMO.rooms, items: [] },
  features: [],
  offers: { ...DEMO.offers, items: [] },
  events: { ...DEMO.events, items: [] },
  reviews: { section: DEMO.reviews.section, items: [] },
  rating: undefined,
  faq: { ...DEMO.faq, items: [] },
  closing: { ...DEMO.closing, title: '' },
}

/** Date parțiale: jumătate din câmpuri lipsă, ca la un client real în lucru. */
const PARTIAL: SiteData = {
  ...DEMO,
  trust: DEMO.trust.slice(0, 2),
  rooms: {
    ...DEMO.rooms,
    items: [
      // O cameră fără preț și fără facilități — cazul „încă necompletat".
      { slug: 'partial', name: 'Cameră în curs de completare', image: '', amenities: [] },
    ],
  },
  offers: { ...DEMO.offers, items: DEMO.offers.items.slice(0, 1) },
  reviews: {
    section: DEMO.reviews.section,
    // O recenzie fără notă și fără dată — dar cu sursă, deci se afișează.
    items: [{ quote: 'A fost bine.', author: 'Un oaspete', source: 'Google', date: '', rating: 0 }],
  },
}

function Coloana({ titlu, date }: { titlu: string; date: SiteData }) {
  return (
    <div style={{ borderTop: '2px solid var(--accent)' }}>
      <p className="eyebrow wrap" style={{ paddingTop: 'var(--sp-6)' }}>
        {titlu}
      </p>
      <BandaIncredere date={date} />
      <Facilitati date={date} />
      <Camere date={date} />
      <Features features={date.features} />
      <Oferte date={date} />
      <Evenimente date={date} />
      <Recenzii date={date} />
      <Faq date={date} />
      <Inchidere date={date} />
    </div>
  )
}

export default function ProbaSectiuni() {
  return (
    <>
      <Miscare />
      <main id="continut">
        <Hero date={DEMO} />
        <Coloana titlu="1 · Date complete" date={DEMO} />
        <Coloana titlu="2 · Date parțiale" date={PARTIAL} />
        <Coloana titlu="3 · Date absente — secțiunile trebuie să LIPSEASCĂ, nu să apară goale" date={GOL} />
      </main>
    </>
  )
}
