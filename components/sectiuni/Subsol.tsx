import Image from 'next/image'
import Link from 'next/link'

import { Icon } from '@/components/Icon'
import { SetariCookies } from '@/components/SetariCookies'
import type { SiteData } from '@/content/types'

/**
 * Subsolul: contact, NAP, program, social, ANPC + SOL, date firmă,
 * linkuri legale.
 *
 * Server Component. Aici trăiesc obligațiile legale RO (REGULI.md 14):
 * datele de identificare a firmei, linkul ANPC și linkul SOL. Ele NU
 * sunt opționale de design — un site de cazare fără ele riscă amendă.
 *
 * NAP-ul (nume, adresă, telefon) trebuie să fie identic cu Google
 * Business Profile (standarde/02). De asta vine din aceleași câmpuri
 * care alimentează JSON-LD-ul, nu e rescris aici.
 *
 * Fiecare bucată se randează doar dacă există (REGULI.md 3): fără
 * social, nu apare rândul de social; fără CUI, nu apare un „CUI:" gol.
 */
export function Subsol({ date }: { date: SiteData }) {
  const { brand, contact, nav, legal, meta, ui } = date
  const anul = new Date().getFullYear()

  return (
    <footer className="site-footer" id="contact">
      <div className="wrap">
        <div className="f-grid">
          <div className="f-brand">
            {/* Sigla, dacă există una în date — aceleași dimensiuni reale ca în
                antet (vezi comentariul de acolo). Sigla își conține numele,
                deci numele scris cu litere rămâne doar pentru clienții fără
                logo; aici îl duce `alt`. */}
            {brand.logo ? (
              <Image className="f-logo" src={brand.logo} alt={brand.name} width={1536} height={1024} sizes="240px" />
            ) : (
              <span className="logo-name">{brand.name}</span>
            )}
            {brand.tagline && <p>{brand.tagline}</p>}
            {contact.social.length > 0 && (
              <div className="f-social">
                {contact.social.map((s) => (
                  <a key={s.url} href={s.url} aria-label={s.label} target="_blank" rel="noopener noreferrer">
                    <Icon name={s.icon} marime="sm" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {nav.length > 0 && (
            <nav aria-label={ui.navigatieSubsol}>
              <h3>{ui.pagini}</h3>
              <ul>
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div>
            <h3>{ui.contact}</h3>
            <ul className="f-nap">
              {contact.phone && (
                <li>
                  <a href={contact.phoneHref}>
                    <Icon name="phone" marime="sm" /> {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`}>
                    <Icon name="mail" marime="sm" /> {contact.email}
                  </a>
                </li>
              )}
              {(contact.street || contact.city) && (
                <li>
                  <Icon name="pin" marime="sm" />
                  <span>
                    {[contact.street, contact.city, contact.region].filter(Boolean).join(', ')}
                  </span>
                </li>
              )}
              {contact.hours && (
                <li>
                  <Icon name="clock" marime="sm" /> {contact.hours}
                </li>
              )}
            </ul>
          </div>

          {legal.links.length > 0 && (
            <nav aria-label={ui.informatiiLegale}>
              <h3>{ui.legal}</h3>
              <ul>
                {legal.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
                {/* Revocarea consimțământului de cookies — obligatorie, oricând (T11). */}
                <li>
                  <SetariCookies eticheta={ui.setariCookies} />
                </li>
              </ul>
            </nav>
          )}
        </div>

        {/* Datele de identificare a firmei — obligatorii (REGULI.md 14).
            Vin din date/12-firma-si-documente-legale.md, niciodată scrise în cod. */}
        {(legal.company || legal.registration) && (
          <div className="f-firma">
            {legal.company && <span>{legal.company}</span>}
            {legal.registration && <span>{legal.registration}</span>}
            {contact.street && (
              <span>
                {[contact.street, contact.postalCode, contact.city, contact.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}
          </div>
        )}

        <div className="f-bot">
          <span>
            © {anul} {brand.name}
          </span>
          {/* ANPC și SOL — linkuri către paginile oficiale, obligatorii
              pentru orice site care primește cereri online (REGULI.md 14). */}
          <div className="f-anpc">
            <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer">
              ANPC
            </a>
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              {ui.sol}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
