import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { caleaPublica, esteLimba, type Limba } from '@/lib/i18n/limbi'
import { traduSegment } from '@/lib/i18n/rute'
import { siteCurent } from '@/lib/site'

/**
 * Politica de confidențialitate (T11). Descrie FLUXUL REAL al acestui motor,
 * nu un text generic: formularul trimite EMAIL prin Resend, nu stochează în
 * bază de date, nu scrie în Google Sheets. Dacă se activează plăți (T13),
 * pagina se actualizează (apare procesatorul și stocarea). Datele firmei vin
 * din `date/12-firma-si-documente-legale.md`, nu sunt scrise în cod.
 *
 * BILINGVĂ (T76). `{operator}`, `{telefon}`, `{email}` se înlocuiesc la
 * randare — datele de contact nu se traduc.
 */

interface Texte {
  titlu: string
  descriere: string
  actualizat: string
  operator: { titlu: string; text: string }
  ceDate: { titlu: string; intro: string; elemente: string[]; nota: string }
  deCe: { titlu: string; text: string }
  undeAjung: { titlu: string; paragrafe: string[] }
  cookies: { titlu: string; inainte: string; link: string; dupa: string }
  catPastram: { titlu: string; text: string }
  drepturi: { titlu: string; text: string; plangereInainte: string; plangereLink: string; plangereDupa: string }
  minori: { titlu: string; text: string }
  modificari: { titlu: string; text: string }
}

const TEXTE: Record<Limba, Texte> = {
  ro: {
    titlu: 'Politica de confidențialitate',
    descriere:
      'Ce date colectăm prin formularul de pe site, unde ajung, cât le păstrăm și ce drepturi ai.',
    actualizat: 'Ultima actualizare: 5 august 2026',
    operator: {
      titlu: 'Cine este operatorul',
      text: '{operator} este operatorul datelor cu caracter personal colectate prin acest site.{contact}',
    },
    ceDate: {
      titlu: 'Ce date colectăm',
      intro: 'Prin formularul de contact colectăm doar ce completezi tu:',
      elemente: [
        'numele pe care îl scrii;',
        'numărul de telefon și/sau adresa de e-mail;',
        'perioada dorită (sosire, plecare) și numărul de persoane, dacă le completezi;',
        'mesajul scris de tine.',
      ],
      nota:
        'Nu cerem CNP, serie și număr de act de identitate, date medicale sau date bancare. Nu folosim formulare care colectează date fără să le vezi.',
    },
    deCe: {
      titlu: 'De ce le colectăm',
      text: 'Ca să te putem contacta și să răspundem la cererea ta de cazare. Temeiul legal este consimțământul tău, exprimat prin bifarea căsuței din formular, împreună cu demersurile precontractuale făcute la cererea ta (art. 6 alin. 1 lit. a și b din Regulamentul general privind protecția datelor).',
    },
    undeAjung: {
      titlu: 'Unde ajung, exact',
      paragrafe: [
        'Când trimiți formularul, datele completate ajung într-un e-mail către adresa locației, prin serviciul de trimitere Resend (Resend, Inc.). Dacă ai lăsat un e-mail, primești și tu o confirmare la aceeași adresă. Nu stocăm cererea într-o bază de date și nu o scriem în niciun tabel — după trimiterea e-mailului, datele nu mai sunt reținute de site.',
        'Pentru a bloca trimiterile automate, formularul folosește Cloudflare Turnstile (Cloudflare, Inc.), o verificare anti-spam care nu îți cere să rezolvi nimic. Site-ul este găzduit de Vercel Inc.; jurnalele tehnice ale găzduirii rețin temporar adresa IP a cererii, strict ca protecție împotriva abuzului, iar datele pe care le completezi în formular nu apar în aceste jurnale. Nu vindem, nu închiriem și nu schimbăm datele tale cu nimeni.',
      ],
    },
    cookies: {
      titlu: 'Cookie-uri și măsurare',
      inainte: 'Detaliile despre cookie-uri sunt pe pagina ',
      link: 'Politica de cookies',
      dupa:
        '. Pe scurt: folosim doar stocare strict necesară funcționării site-ului, iar Google Analytics se încarcă numai după ce accepți categoria „analitice" în bannerul de consimțământ. Înainte de accept nu pleacă niciun request către servere de urmărire.',
    },
    catPastram: {
      titlu: 'Cât le păstrăm',
      text: 'Cererile primite prin e-mail se păstrează în căsuța locației cel mult 12 luni de la ultimul contact, dacă nu devii oaspete. Dacă rezervarea se realizează, se aplică termenele legale de păstrare a documentelor.',
    },
    drepturi: {
      titlu: 'Ce drepturi ai',
      text: 'Ai dreptul de acces, de rectificare, de ștergere, de restricționare a prelucrării, de portabilitate și de opoziție, precum și dreptul de a-ți retrage oricând consimțământul, fără să afecteze prelucrarea de dinainte. Îți poți exercita oricare dintre ele{contact}. Răspundem în cel mult 30 de zile.',
      plangereInainte:
        'Ai, de asemenea, dreptul de a depune plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (',
      plangereLink: 'dataprotection.ro',
      plangereDupa: ').',
    },
    minori: {
      titlu: 'Minori',
      text: 'Site-ul nu se adresează persoanelor sub 16 ani și nu colectăm cu bună știință date de la acestea.',
    },
    modificari: {
      titlu: 'Modificări',
      text: 'Dacă schimbăm felul în care prelucrăm datele — de exemplu la activarea plăților online — actualizăm această pagină și data de mai sus.',
    },
  },
  en: {
    titlu: 'Privacy policy',
    descriere:
      'What data the form on this site collects, where it goes, how long we keep it and what rights you have.',
    actualizat: 'Last updated: 5 August 2026',
    operator: {
      titlu: 'Who the controller is',
      text: '{operator} is the controller of the personal data collected through this website.{contact}',
    },
    ceDate: {
      titlu: 'What we collect',
      intro: 'Through the contact form we collect only what you type in:',
      elemente: [
        'the name you give;',
        'your phone number and/or e-mail address;',
        'the dates you want (arrival, departure) and the number of guests, if you fill them in;',
        'the message you write.',
      ],
      nota:
        'We do not ask for national ID numbers, identity-document details, health data or bank details. We do not use forms that collect data you cannot see.',
    },
    deCe: {
      titlu: 'Why we collect it',
      text: 'So that we can contact you and answer your accommodation enquiry. The legal basis is your consent, given by ticking the box in the form, together with the pre-contractual steps taken at your request (Article 6(1)(a) and (b) of the General Data Protection Regulation).',
    },
    undeAjung: {
      titlu: 'Where it actually goes',
      paragrafe: [
        'When you submit the form, what you filled in is sent as an e-mail to the property’s address, through the delivery service Resend (Resend, Inc.). If you left an e-mail address, you receive a copy of the confirmation at that address too. We do not store the enquiry in a database and we do not write it to any spreadsheet — once the e-mail is sent, the site retains nothing.',
        'To block automated submissions the form uses Cloudflare Turnstile (Cloudflare, Inc.), an anti-spam check that asks nothing of you. The site is hosted by Vercel Inc.; the hosting’s technical logs briefly retain the request’s IP address, strictly as abuse protection, and what you type into the form does not appear in those logs. We do not sell, rent or trade your data with anyone.',
      ],
    },
    cookies: {
      titlu: 'Cookies and measurement',
      inainte: 'The details about cookies are on the ',
      link: 'Cookie policy',
      dupa:
        ' page. In short: we use only storage that is strictly necessary for the site to work, and Google Analytics loads only after you accept the "analytics" category in the consent banner. Before you accept, no request goes out to any tracking server.',
    },
    catPastram: {
      titlu: 'How long we keep it',
      text: 'Enquiries received by e-mail stay in the property’s inbox for at most 12 months from the last contact, if you do not become a guest. If a booking goes ahead, the statutory document-retention periods apply.',
    },
    drepturi: {
      titlu: 'Your rights',
      text: 'You have the right of access, rectification, erasure, restriction of processing, data portability and objection, as well as the right to withdraw your consent at any time, without affecting processing carried out before that. You can exercise any of them{contact}. We reply within 30 days at the latest.',
      plangereInainte:
        'You also have the right to lodge a complaint with the Romanian National Supervisory Authority for Personal Data Processing (',
      plangereLink: 'dataprotection.ro',
      plangereDupa: ').',
    },
    minori: {
      titlu: 'Children',
      text: 'This site is not aimed at people under 16 and we do not knowingly collect data from them.',
    },
    modificari: {
      titlu: 'Changes',
      text: 'If we change the way we process data — when online payments are switched on, for example — we update this page and the date above.',
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

export default async function Politica({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba
  const t = TEXTE[lang]

  const { date } = siteCurent(lang)
  const { legal, contact, brand } = date
  const operator = legal.company || brand.name

  // Datele de contact se lipesc la finalul frazei, doar cele care există
  // (REGULI.md 3: fără „Telefon:" urmat de gol).
  const contactOperator = [
    legal.registration ? ` ${legal.registration}.` : '',
    contact.phone ? ` ${date.ui.contact}: ${contact.phone}.` : '',
    contact.email ? ` E-mail: ${contact.email}.` : '',
  ].join('')

  const contactDrepturi = [contact.phone, contact.email].filter(Boolean).join(' / ')
  const caleCookies = caleaPublica(lang, traduSegment('/politica-cookies', lang))

  return (
    <>
      <h1>{t.titlu}</h1>
      <p className="legal-actualizat">{t.actualizat}</p>

      <section>
        <h2>{t.operator.titlu}</h2>
        <p>{t.operator.text.replace('{operator}', operator).replace('{contact}', contactOperator)}</p>
      </section>

      <section>
        <h2>{t.ceDate.titlu}</h2>
        <p>{t.ceDate.intro}</p>
        <ul>
          {t.ceDate.elemente.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <p>{t.ceDate.nota}</p>
      </section>

      <section>
        <h2>{t.deCe.titlu}</h2>
        <p>{t.deCe.text}</p>
      </section>

      <section>
        <h2>{t.undeAjung.titlu}</h2>
        {t.undeAjung.paragrafe.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <section>
        <h2>{t.cookies.titlu}</h2>
        <p>
          {t.cookies.inainte}
          <a href={caleCookies}>{t.cookies.link}</a>
          {t.cookies.dupa}
        </p>
      </section>

      <section>
        <h2>{t.catPastram.titlu}</h2>
        <p>{t.catPastram.text}</p>
      </section>

      <section>
        <h2>{t.drepturi.titlu}</h2>
        <p>{t.drepturi.text.replace('{contact}', contactDrepturi ? ` — ${contactDrepturi}` : '')}</p>
        <p>
          {t.drepturi.plangereInainte}
          <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">
            {t.drepturi.plangereLink}
          </a>
          {t.drepturi.plangereDupa}
        </p>
      </section>

      <section>
        <h2>{t.minori.titlu}</h2>
        <p>{t.minori.text}</p>
      </section>

      <section>
        <h2>{t.modificari.titlu}</h2>
        <p>{t.modificari.text}</p>
      </section>
    </>
  )
}
