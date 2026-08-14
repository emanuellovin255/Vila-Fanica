import { AntetSectiune } from './AntetSectiune'
import { ButonDisponibilitate } from './ButonDisponibilitate'
import { HartaFacade } from './HartaFacade'
import { Icon } from '@/components/Icon'
import { Formular } from '@/components/Formular'
import type { SiteData } from '@/content/types'
import { caleaPublica, type Limba } from '@/lib/i18n/limbi'
import { traduSegment } from '@/lib/i18n/rute'

/**
 * Pagina `/contact`.
 *
 * DE CE E PAGINĂ ȘI NU ANCORĂ (cerință de client)
 * -----------------------------------------------
 * „Contact" din meniu ducea la `/#contact`, adică la subsolul paginii
 * curente: apăsat de oriunde, derula până jos și atât — telefon, email,
 * adresă, în corpul de text al footerului. Nici formular, nici hartă,
 * nici indicații de acces, și nicio adresă proprie pe care s-o dea
 * cineva mai departe sau pe care s-o indexeze Google.
 *
 * Aici sunt toate patru: datele de contact, formularul (T10, funcțional
 * și fără JavaScript), harta și „cum ajungi" — indicațiile de acces,
 * care la o locație în care se ajunge numai pe apă sunt informația cea
 * mai căutată dintre toate.
 *
 * Server Component; `Formular` e singura bucată client.
 */
export function PaginaContact({ date }: { date: SiteData }) {
  const { contact, contactPage, ui } = date
  const limba = date.meta.localeShort as Limba
  const sectiune = contactPage?.section
  const acces = contactPage?.acces

  return (
    <main id="continut">
      <section className="section">
        <div className="wrap">
          <AntetSectiune
            eyebrow={sectiune?.eyebrow}
            title={sectiune?.title || ui.navContact}
            lede={sectiune?.lede}
          />

          <div className="grid g2 contact-grid">
            <div>
              <ul className="contact-lista">
                {contact.phone && (
                  <li>
                    <Icon name="phone" />
                    <a href={contact.phoneHref}>{contact.phone}</a>
                  </li>
                )}
                {contact.email && (
                  <li>
                    <Icon name="mail" />
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </li>
                )}
                {(contact.street || contact.city) && (
                  <li>
                    <Icon name="pin" />
                    <span>
                      {[contact.street, contact.city, contact.region].filter(Boolean).join(', ')}
                    </span>
                  </li>
                )}
                {contact.hours && (
                  <li>
                    <Icon name="clock" />
                    <span>{contact.hours}</span>
                  </li>
                )}
              </ul>

              {/* Pe telefon, WhatsApp e mai rapid decât orice formular:
                  butonul deschide conversația cu mesajul deja scris.

                  `ancora` trimite la formular doar dacă formularul există
                  — vezi condiția de mai jos. Fără e-mail, o ancoră
                  `#formular` ar duce nicăieri: click, pagina nu se mișcă,
                  iar butonul pare stricat. */}
              <p className="stack" style={{ marginTop: 'var(--sp-6)' }}>
                <ButonDisponibilitate date={date} cuIcon ancora={contact.email ? '#formular' : undefined} />
              </p>

              {acces && (
                <div className="contact-acces">
                  <h2>{acces.title}</h2>
                  {acces.text.split(/\n{2,}/).map((p, i) => (
                    <p key={i}>{p.replace(/\s*\n\s*/g, ' ')}</p>
                  ))}
                  {acces.bullets.length > 0 && (
                    <ul className="lista-bifata">
                      {acces.bullets.map((b, i) => (
                        <li key={i}>
                          <Icon name="check" marime="sm" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* FĂRĂ E-MAIL, FĂRĂ FORMULAR.

                Destinatarul mesajelor vine din variabila de mediu
                `DESTINATAR` (vezi `lib/formular/email.ts`), dar adresa
                publică din `date/02-telefon-email-si-adresa.md` e cea
                care spune dacă locația are sau nu un e-mail funcțional.
                Cu ea goală, formularul ar accepta mesaje și le-ar pierde
                în tăcere: omul scrie, apasă „Trimite", primește pagina de
                mulțumire — și nimeni nu primește nimic. Mai rău decât
                lipsa formularului.

                Condiția e aceeași ca la blocul de e-mail de mai sus. Se
                completează „Email:" în `date/02-…` și formularul reapare
                singur, fără nicio modificare aici. */}
            {contact.email && (
              <div className="contact-formular">
                <Formular
                  limba={limba === 'en' ? 'en' : 'ro'}
                  politicaHref={caleaPublica(limba, traduSegment('/politica-confidentialitate', limba))}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <HartaFacade contact={contact} ui={ui} numeLocatie={date.brand.name} />
    </main>
  )
}
