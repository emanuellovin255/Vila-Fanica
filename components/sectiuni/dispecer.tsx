import type { ReactNode } from 'react'

import {
  BandaIncredere,
  Camere,
  Evenimente,
  Excursii,
  Facilitati,
  Faq,
  Features,
  Inchidere,
  Locatie,
  MeniuRestaurant,
  Mozaic,
  Oferte,
  Poveste,
  Prezentare,
  Recenzii,
  Semnatura,
  Servicii,
} from '.'
import { HartaFacade } from './HartaFacade'
import type { SiteData } from '@/content/types'
import type { MeniuCategorie } from '@/content/meniu'

/**
 * Un id de secțiune → componenta lui.
 *
 * Trăiește în motor pentru că toate trei șabloanele (C2) îl folosesc:
 * fiecare parcurge `setari.sectiuni` (T05) și cere aici componenta,
 * ca ordinea și comutatoarele de module să rămână identice indiferent
 * de skin. Un șablon care tratează o secțiune în felul lui (de ex.
 * Șablonul 2 recalculează `reverse` la `features`, Șablonul 3 pune
 * galeria în coloana lui) sare acel id și îl compune singur.
 *
 * Fiecare componentă decide singură dacă se randează (REGULI.md 3):
 * fără date, întoarce null și secțiunea pur și simplu lipsește.
 */
export interface ContextSectiuni {
  date: SiteData
  meniu: MeniuCategorie[]
}

export function sectiune(id: string, { date, meniu }: ContextSectiuni): ReactNode {
  switch (id) {
    case 'story':
      return <Poveste date={date} />
    // Banda cu o singură frază, peste o poză întunecată. Fără blocul
    // `## Bandă de semnătură` completat, întoarce null singură.
    case 'signature':
      return <Semnatura date={date} />
    // Grila editorială de cinci poze. Sub cinci poze în date, la fel.
    case 'mozaic':
      return <Mozaic date={date} />
    case 'trust':
      return <BandaIncredere date={date} />
    case 'perks':
      return <Facilitati date={date} />
    case 'rooms':
      return <Camere date={date} />
    // Doar antetul; blocurile de servicii sunt `features`, imediat după.
    case 'services':
      return <Servicii date={date} />
    case 'features':
      return <Features features={date.features} date={date} />
    case 'location':
      return <Locatie date={date} />
    case 'prezentare':
      return <Prezentare date={date} />
    case 'offers':
      return <Oferte date={date} />
    case 'excursions':
      return <Excursii date={date} />
    case 'events':
      return <Evenimente date={date} />
    case 'reviews':
      return <Recenzii date={date} />
    case 'map':
      return <HartaFacade contact={date.contact} ui={date.ui} numeLocatie={date.brand.name} />
    case 'menu':
      return meniu.length ? <MeniuRestaurant categorii={meniu} ui={date.ui} /> : null
    case 'faq':
      return <Faq date={date} />
    case 'closing':
      return <Inchidere date={date} />
    default:
      return null
  }
}
