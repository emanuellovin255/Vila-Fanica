import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Harta locației: se vede unde e pensiunea, iar un click deschide
 * Google Maps.
 *
 * CE S-A SCHIMBAT ȘI DE CE (cerință client)
 * -----------------------------------------
 * Înainte era un „facade": o placă goală cu un buton „Încarcă harta",
 * iar harta reală apărea abia după al doilea click. Pe o locație la
 * care se ajunge numai pe apă, aia arăta ca un chenar gri — omul nu
 * vedea NIMIC despre unde e Crișanul. Cerința a fost explicită: harta
 * trebuie să arate locația, iar un click să deschidă Maps.
 *
 * Deci: harta se randează direct, iar peste ea stă un link care acoperă
 * toată suprafața (`.map-hit`). Clickul nu se pierde în hartă — pleacă
 * în Google Maps, într-un tab nou. E un `<a>` real, deci se ajunge la
 * el cu Tab și se apasă cu Enter.
 *
 * COSTUL, asumat. `iframe`-ul cere ceva de la Google. Rămâne
 * `loading="lazy"`, iar secțiunea e ULTIMA din pagină (`setari.md`):
 * request-ul pleacă doar dacă omul chiar derulează până jos, nu la
 * primul paint. Analytics rămâne mai departe blocat până la accept
 * (`lib/consimtamant.ts`) — asta n-a fost atinsă.
 *
 * Server Component: nu mai are stare, deci nu mai are nevoie de
 * `"use client"` — un client component mai puțin în bundle.
 *
 * FĂRĂ COORDONATE, TOT FUNCȚIONEAZĂ. `date/02-telefon-email-si-adresa.md` n-are încă
 * latitudine și longitudine (blocant T74). Până vin, harta se
 * construiește din ADRESA scrisă — o CĂUTARE Google Maps după
 * „Pensiunea Izora, Str. Principală nr. 226, Crișan, Tulcea", nu un pin
 * inventat pe coordonate ghicite (REGULI.md 3). Când se completează
 * `Latitudine`/`Longitudine`, codul trece singur pe ele: sunt mai
 * precise decât o căutare după adresă.
 */
export function HartaFacade({
  contact,
  ui,
  numeLocatie,
  distante,
  indicatii,
}: {
  contact: SiteData['contact']
  /** Textele motorului în limba paginii (`date.ui`). */
  ui: SiteData['ui']
  /** Numele pensiunii, ca să fie primul termen al căutării. */
  numeLocatie?: string
  distante?: string[]
  indicatii?: string
}) {
  const adresa = [contact.street, contact.postalCode, contact.city, contact.region]
    .filter(Boolean)
    .join(', ')

  // Ordinea preferinței: coordonate (exacte) → link scris de gazdă →
  // căutare după nume + adresă. Prima care există câștigă.
  const coordonate = contact.lat && contact.lng ? `${contact.lat},${contact.lng}` : ''
  // Fără `country`: în `02-telefon-email-si-adresa.md` e scris „RO", cod de țară, nu
  // nume — într-o căutare Google Maps ar fi zgomot, nu precizie.
  const interogare = [numeLocatie, adresa].filter(Boolean).join(', ')
  const tinta = coordonate || interogare

  const embed = tinta
    ? `https://www.google.com/maps?q=${encodeURIComponent(tinta)}&z=${coordonate ? 15 : 13}&output=embed`
    : ''

  const linkMaps =
    contact.mapsUrl ||
    (tinta ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tinta)}` : '')

  const linkWaze = tinta ? `https://waze.com/ul?q=${encodeURIComponent(tinta)}&navigate=yes` : ''

  const titluHarta = `${ui.hartaCatre} ${numeLocatie || contact.city || ui.locatie}`

  return (
    <section id="harta" className="harta">
      <div className="wrap grid g2" style={{ alignItems: 'start' }}>
        <div>
          {adresa && (
            <p className="lede" style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <Icon name="pin" /> {adresa}
            </p>
          )}
          {indicatii && <p style={{ marginTop: 'var(--sp-4)' }}>{indicatii}</p>}
          {distante && distante.length > 0 && (
            <ul className="chips" style={{ marginTop: 'var(--sp-4)' }}>
              {distante.map((d, i) => (
                <li className="chip" key={i}>
                  {d}
                </li>
              ))}
            </ul>
          )}
          {(linkMaps || linkWaze) && (
            <p className="stack" style={{ marginTop: 'var(--sp-5)' }}>
              {linkMaps && (
                <a className="btn btn-primary" href={linkMaps} target="_blank" rel="noopener noreferrer">
                  <Icon name="pin" marime="sm" /> {ui.deschideInMaps}
                </a>
              )}
              {linkWaze && (
                <a className="btn btn-ghost" href={linkWaze} target="_blank" rel="noopener noreferrer">
                  <Icon name="arrow" marime="sm" /> {ui.deschideInWaze}
                </a>
              )}
            </p>
          )}
        </div>

        {embed && (
          <div className="map-live">
            <iframe
              src={embed}
              title={titluHarta}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
            />
            {/* Stratul de click. Acoperă harta ca să nu se piardă gestul
                în panoramarea Google: oriunde apeși, se deschide Maps. */}
            {linkMaps && (
              <a
                className="map-hit"
                href={linkMaps}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${ui.deschideInMaps} — ${titluHarta}`}
              >
                <span>
                  <Icon name="pin" marime="sm" /> {ui.deschideInMaps}
                </span>
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
