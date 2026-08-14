import { ButonDisponibilitate } from './ButonDisponibilitate'
import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Blocul de rezervare, în varianta „întreabă pe WhatsApp".
 *
 * Înlocuiește `BaraDisponibilitate` (calendar cu sosire/plecare/persoane)
 * la locațiile care NU au motor de rezervări. Motivul e simplu: un
 * calendar care nu știe ce e liber îi cere omului să completeze trei
 * câmpuri și apoi tot îl trimite la un formular. WhatsApp taie pasul —
 * un tap, conversația e deschisă, cu mesajul deja scris.
 *
 * Server Component: e un `<a>`, nu are stare. Funcționează identic fără
 * JavaScript și e vizibil în HTML pentru crawlere.
 *
 * `#rezervare` rămâne aici: butonul din antet, cel din hero și bara
 * lipită de pe mobil trimit toate spre ancora asta.
 *
 * Fără număr de WhatsApp în `date/02-telefon-email-si-adresa.md`, secțiunea cade elegant
 * pe telefon; fără niciunul, nu se randează deloc (REGULI.md 3).
 */
export function BaraWhatsApp({ date }: { date: SiteData }) {
  const { contact, booking } = date

  if (!contact.whatsapp && !contact.phone) return null

  return (
    <section id="rezervare" aria-label={booking.labels.submit}>
      <div className="wrap">
        <div className="wa-block">
          <div className="wa-block-text">
            <h2>{booking.labels.submit}</h2>
            {/*
              DESCRIE CE FACE BUTONUL, NU CÂT DE REPEDE RĂSPUNDE GAZDA.
              Varianta din motor se termina cu „Răspundem în aceeași zi." —
              o promisiune de viteză pe care n-a făcut-o nicio gazdă și pe
              care site-ul n-o poate ține. Prima recenzie proastă începe
              exact așa. Vezi MOTOR-MODIFICAT.md, punctul 3.
            */}
            <p className="lede">
              Spuneți-ne numele, perioada și câți sunteți. Butonul deschide o conversație pe
              WhatsApp cu totul deja scris — nu trebuie decât să apăsați trimite.
            </p>
          </div>

          <div className="stack wa-block-actions">
            <ButonDisponibilitate date={date} variant="wa" cuIcon />
            {contact.phoneHref && (
              <a className="btn btn-ghost" href={contact.phoneHref}>
                <Icon name="phone" marime="sm" />
                {contact.phone}
              </a>
            )}
          </div>

          {booking.assurances.length > 0 && (
            <div className="bk-note">
              {booking.assurances.map((a, i) => (
                <span key={i}>
                  <Icon name="check" marime="sm" />
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
