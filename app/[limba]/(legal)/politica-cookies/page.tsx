import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { esteLimba, type Limba } from '@/lib/i18n/limbi'

/**
 * Politica de cookies (T11). Descrie exact ce se stochează, cine îl pune și cât
 * trăiește — pe fluxul REAL al motorului: consimțământ ținut local, Analytics
 * doar după accept, harta Google încărcată abia la click (facade, T06/T12).
 *
 * BILINGVĂ (T76), după tiparul din `Formular.tsx`.
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
    titlu: 'Politica de cookies',
    descriere: 'Ce cookie-uri și stocare locală folosește site-ul, cine le pune și cât trăiesc.',
    actualizat: 'Ultima actualizare: 5 august 2026',
    intro:
      'Un cookie (sau o valoare de stocare locală) este un mic fișier pe care site-ul îl salvează în browserul tău. Le folosim la minimum și îți cerem acordul înainte de orice nu e strict necesar. Nimic din ce e opțional nu se încarcă înainte să alegi în banner.',
    sectiuni: [
      {
        titlu: 'Strict necesare',
        text: 'Fac site-ul să funcționeze și nu au nevoie de consimțământ. Alegerea ta din bannerul de cookies se salvează local (localStorage), ca să nu te întrebăm la fiecare pagină. Rămâne pe dispozitivul tău, nu ajunge la noi, și o poți șterge oricând curățând datele site-ului.',
      },
      {
        titlu: 'Analitice (opțional)',
        text: 'Dacă accepți categoria „analitice", încărcăm Google Analytics (Google Ireland Ltd.), ca să înțelegem cum e folosit site-ul — ce pagini se văd, de pe ce fel de dispozitiv. Adresa IP este anonimizată. Aceste cookie-uri sunt puse de Google și pot trăi până la 2 ani. Google Analytics nu pornește niciun request înainte de acceptul tău.',
      },
      {
        titlu: 'Marketing (opțional)',
        text: 'Categoria există în banner pentru corectitudine, dar implicit nu e configurat niciun pixel de reclamă pe acest site. Dacă se adaugă vreodată, apare aici, descris, și tot după accept.',
      },
      {
        titlu: 'Harta',
        text: 'Harta Google se încarcă în josul paginii, cu `loading="lazy"`, deci request-ul pleacă doar dacă derulezi până acolo. Un click pe ea deschide Google Maps într-o filă nouă.',
      },
      {
        titlu: 'Cum îți schimbi alegerea',
        text: 'Oricând, din butonul „Setări cookies" din subsolul site-ului. Poți accepta, refuza sau alege pe categorii. Refuzul e la fel de simplu ca acceptul — un singur click.',
      },
    ],
  },
  en: {
    titlu: 'Cookie policy',
    descriere: 'Which cookies and local storage this site uses, who sets them and how long they last.',
    actualizat: 'Last updated: 5 August 2026',
    intro:
      'A cookie (or a local-storage value) is a small file the site saves in your browser. We use them as little as possible and ask for your consent before anything that is not strictly necessary. Nothing optional loads before you choose in the banner.',
    sectiuni: [
      {
        titlu: 'Strictly necessary',
        text: 'These make the site work and need no consent. Your choice in the cookie banner is saved locally (localStorage) so we do not ask again on every page. It stays on your device, never reaches us, and you can delete it at any time by clearing the site data.',
      },
      {
        titlu: 'Analytics (optional)',
        text: 'If you accept the "analytics" category, we load Google Analytics (Google Ireland Ltd.) to understand how the site is used — which pages are viewed, from what kind of device. Your IP address is anonymised. These cookies are set by Google and can last up to 2 years. Google Analytics fires no request at all before you accept.',
      },
      {
        titlu: 'Marketing (optional)',
        text: 'The category exists in the banner for the sake of completeness, but no advertising pixel is configured on this site by default. If one is ever added, it will be described here, and it will still only load after you accept.',
      },
      {
        titlu: 'The map',
        text: 'The Google map loads at the bottom of the page with `loading="lazy"`, so the request only goes out if you actually scroll that far. Clicking it opens Google Maps in a new tab.',
      },
      {
        titlu: 'Changing your mind',
        text: 'At any time, from the "Cookie settings" button in the site footer. You can accept, refuse, or choose per category. Refusing is exactly as easy as accepting — one click.',
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

export default async function PoliticaCookies({ params }: { params: Promise<{ limba: string }> }) {
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
