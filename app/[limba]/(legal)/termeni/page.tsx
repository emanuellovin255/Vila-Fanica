import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { siteCurent } from '@/lib/site'

/**
 * Termeni și condiții (T11). Cadru pentru un site de PREZENTARE: rezervările se
 * fac prin sistemul locației sau prin contact direct, prețurile sunt orientative,
 * plata online nu există în această fază (apare la T13, când pagina se actualizează).
 *
 * BILINGVĂ (T76). `{firma}` se înlocuiește la randare cu denumirea din
 * `date/12-firma-si-documente-legale.md` — datele firmei nu se traduc și nu se scriu în cod.
 */

const TEXTE: Record<
  Limba,
  {
    titlu: string
    descriere: string
    actualizat: string
    cineSuntem: { titlu: string; text: string }
    sectiuni: { titlu: string; text: string }[]
    litigii: { titlu: string; inainte: string; intre: string; dupa: string; anpc: string; sol: string }
  }
> = {
  ro: {
    titlu: 'Termeni și condiții',
    descriere: 'Condițiile de folosire a site-ului și de solicitare a unei rezervări.',
    actualizat: 'Ultima actualizare: 5 august 2026',
    cineSuntem: {
      titlu: 'Cine suntem',
      text: 'Acest site este operat de {firma}. Prin folosirea site-ului ești de acord cu termenii de mai jos.',
    },
    sectiuni: [
      {
        titlu: 'Ce oferă site-ul',
        text: 'Site-ul prezintă locația de cazare și îți permite să trimiți o cerere de rezervare prin formular sau să folosești sistemul de rezervări al locației. Fotografiile și descrierile sunt orientative; disponibilitatea și prețul final se confirmă la rezervare.',
      },
      {
        titlu: 'Cereri și rezervări',
        text: 'Trimiterea formularului este o cerere, nu o rezervare confirmată. Rezervarea devine fermă doar după confirmarea locației, în condițiile comunicate atunci. În această fază, plata nu se face pe site: se achită conform înțelegerii directe cu locația.',
      },
      {
        titlu: 'Prețuri',
        text: 'Prețurile afișate sunt informative și pot varia în funcție de perioadă, durată și disponibilitate. Prețul care contează este cel confirmat de locație la rezervare; nicio sumă introdusă în pagină nu obligă locația.',
      },
      {
        titlu: 'Proprietate intelectuală',
        text: 'Textele, imaginile și elementele de design ale site-ului aparțin {firma} sau sunt folosite cu acordul titularilor. Nu pot fi reproduse fără permisiune.',
      },
      {
        titlu: 'Răspundere',
        text: 'Depunem eforturi rezonabile ca informațiile să fie corecte și actuale, dar nu garantăm absența oricărei erori. Site-ul poate fi indisponibil temporar din motive tehnice.',
      },
    ],
    litigii: {
      titlu: 'Lege aplicabilă și soluționarea litigiilor',
      inainte:
        'Acestor termeni li se aplică legea română. Eventualele neînțelegeri se rezolvă pe cale amiabilă; în caz contrar, sunt competente instanțele din România. Poți apela și la ',
      intre: ' sau la platforma europeană de ',
      dupa: '.',
      anpc: 'ANPC',
      sol: 'soluționare online a litigiilor (SOL)',
    },
  },
  en: {
    titlu: 'Terms and conditions',
    descriere: 'The terms for using this website and for requesting a booking.',
    actualizat: 'Last updated: 5 August 2026',
    cineSuntem: {
      titlu: 'Who we are',
      text: 'This website is operated by {firma}. By using the site you agree to the terms below.',
    },
    sectiuni: [
      {
        titlu: 'What the site offers',
        text: 'The site presents the property and lets you send a booking request through the form, or use the property’s own booking system. Photos and descriptions are indicative; availability and the final price are confirmed when you book.',
      },
      {
        titlu: 'Requests and bookings',
        text: 'Submitting the form is a request, not a confirmed booking. A booking becomes firm only once the property confirms it, on the terms stated at that point. At this stage, payment is not taken on the site: it is settled directly with the property.',
      },
      {
        titlu: 'Prices',
        text: 'Prices shown are indicative and can vary with the season, the length of stay and availability. The price that counts is the one the property confirms when you book; no figure entered on a page binds the property.',
      },
      {
        titlu: 'Intellectual property',
        text: 'The text, images and design elements of this site belong to {firma} or are used with the rights holders’ permission. They may not be reproduced without permission.',
      },
      {
        titlu: 'Liability',
        text: 'We make reasonable efforts to keep the information correct and current, but we do not guarantee that it is free of every error. The site may be temporarily unavailable for technical reasons.',
      },
    ],
    litigii: {
      titlu: 'Governing law and dispute resolution',
      inainte:
        'These terms are governed by Romanian law. Any disagreement is settled amicably where possible; failing that, the courts of Romania have jurisdiction. You may also turn to ',
      intre: ' or to the European ',
      dupa: ' platform.',
      anpc: 'the Romanian consumer protection authority (ANPC)',
      sol: 'Online Dispute Resolution (ODR)',
    },
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string }>
}): Promise<Metadata> {
  const { limba } = await params
  if (!esteLimba(limba)) return {}
  const t = TEXTE[limba]
  return { title: t.titlu, description: t.descriere }
}

export default async function Termeni({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba
  const t = TEXTE[lang]

  const { date } = siteCurent(lang)
  const { legal, brand } = date
  // Denumirea completă, cu numărul de înregistrare când există. Vine din
  // `12-firma-si-documente-legale.md`, niciodată scrisă în cod (REGULI.md 14).
  const firma = `${legal.company || brand.name}${legal.registration ? ` (${legal.registration})` : ''}`

  return (
    <>
      <h1>{t.titlu}</h1>
      <p className="legal-actualizat">{t.actualizat}</p>

      <section>
        <h2>{t.cineSuntem.titlu}</h2>
        <p>{t.cineSuntem.text.replace('{firma}', firma)}</p>
      </section>

      {t.sectiuni.map((s) => (
        <section key={s.titlu}>
          <h2>{s.titlu}</h2>
          <p>{s.text.replace('{firma}', legal.company || brand.name)}</p>
        </section>
      ))}

      <section>
        <h2>{t.litigii.titlu}</h2>
        <p>
          {t.litigii.inainte}
          <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer">
            {t.litigii.anpc}
          </a>
          {t.litigii.intre}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            {t.litigii.sol}
          </a>
          {t.litigii.dupa}
        </p>
      </section>
    </>
  )
}
