import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { esteLimba, type Limba } from '@/lib/i18n/limbi'

/**
 * Politica de anulare / rambursare (T11). Trebuie să fie ACCESIBILĂ înainte de
 * orice pas de plată (standarde/02) — reduce ezitarea la rezervare. Condițiile
 * exacte (procent, termen) diferă de la locație la locație și se completează în
 * `date/`; aici e cadrul general și transparent.
 *
 * BILINGVĂ (T76). Era proză românească scrisă direct în JSX, deci pe /en un
 * vizitator care apăsa „Cancellation policy" în subsol primea o pagină întreagă
 * în română. Tiparul e cel din `components/Formular.tsx` și
 * `app/[limba]/multumim/page.tsx`: un `Record<Limba, …>` cu textele, iar JSX-ul
 * doar le așază.
 */

const TEXTE: Record<
  Limba,
  {
    titlu: string
    descriere: string
    actualizat: string
    intro: string
    sectiuni: { titlu: string; text: string }[]
  }
> = {
  ro: {
    titlu: 'Politica de anulare',
    descriere: 'În ce condiții poți anula o rezervare și cum se face rambursarea.',
    actualizat: 'Ultima actualizare: 5 august 2026',
    intro:
      'Vrem ca rezervarea să fie o decizie fără stres. Condițiile exacte de anulare se comunică clar la confirmarea rezervării, înainte de orice plată, și sunt cele care se aplică.',
    sectiuni: [
      {
        titlu: 'Anulare gratuită',
        text: 'De regulă, anularea este gratuită dacă ne anunți cu suficient timp înainte de data sosirii. Termenul exact (de exemplu, cu câteva zile înainte) îți este comunicat la confirmare și apare în e-mailul de rezervare.',
      },
      {
        titlu: 'Anulare târzie sau neprezentare',
        text: 'Pentru anulările făcute după termenul de gratuitate sau în caz de neprezentare, se poate reține o parte din sumă, conform condițiilor comunicate la rezervare. Nu reținem niciodată sume nedeclarate în prealabil.',
      },
      {
        titlu: 'Rambursare',
        text: 'Dacă ți se cuvine o rambursare, o facem prin aceeași metodă prin care ai plătit, în termenul legal. În această fază site-ul nu procesează plăți online; plata și eventuala rambursare se fac direct cu locația.',
      },
      {
        titlu: 'Cum anulezi',
        text: 'Ne anunți prin telefon sau e-mail, cu numele și perioada rezervării. Îți confirmăm anularea în scris.',
      },
    ],
  },
  en: {
    titlu: 'Cancellation policy',
    descriere: 'When you can cancel a booking and how refunds work.',
    actualizat: 'Last updated: 5 August 2026',
    intro:
      'We want booking to be a decision you can make without stress. The exact cancellation terms are stated clearly when your booking is confirmed, before any payment, and those are the terms that apply.',
    sectiuni: [
      {
        titlu: 'Free cancellation',
        text: 'As a rule, cancelling is free if you let us know far enough ahead of your arrival date. The exact deadline — a few days before, for example — is given to you at confirmation and appears in your booking e-mail.',
      },
      {
        titlu: 'Late cancellation or no-show',
        text: 'For cancellations made after the free-cancellation deadline, or if you do not turn up, part of the amount may be retained, according to the terms given to you when you booked. We never retain amounts that were not stated in advance.',
      },
      {
        titlu: 'Refunds',
        text: 'If a refund is due to you, we issue it through the same method you paid with, within the legal deadline. At this stage the website does not process online payments; payment and any refund are handled directly with the property.',
      },
      {
        titlu: 'How to cancel',
        text: 'Let us know by phone or e-mail, with the name and dates of the booking. We confirm the cancellation to you in writing.',
      },
    ],
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

export default async function PoliticaAnulare({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const t = TEXTE[limba]

  return (
    <>
      <h1>{t.titlu}</h1>
      <p className="legal-actualizat">{t.actualizat}</p>
      <p>{t.intro}</p>

      {t.sectiuni.map((s) => (
        <section key={s.titlu}>
          <h2>{s.titlu}</h2>
          <p>{s.text}</p>
        </section>
      ))}
    </>
  )
}
