import { Fragment } from 'react'
import Image from 'next/image'

import {
  Antet,
  BlocRezervare,
  BaraLipita,
  ButonDisponibilitate,
  FeatureAlternant,
  Inchidere,
  Subsol,
} from '@/components/sectiuni'
import { sectiune } from '@/components/sectiuni/dispecer'
import { Icon } from '@/components/Icon'
import type { PropsSablon } from '@/lib/sablon'
import type { SiteData } from '@/content/types'

/**
 * Șablonul 2 · Poveste alternantă (T21).
 *
 * Pentru pensiuni, hoteluri boutique, locații cu o poveste. Fără video
 * în hero — diferența structurală față de Șablonul 1. Hero cu o singură
 * imagine mare, layout split (titlu stânga, imagine dreapta), apoi
 * feature-uri care alternează latura pe măsură ce cobori.
 *
 * ALTERNANȚA SE CALCULEAZĂ DIN INDEX, nu din date (T21): cine editează
 * `date/03-pagina-principala.md` nu setează niciodată `reverse` manual, deci
 * ștergerea unui feature din mijloc nu strică ordinea. Fiecare al doilea
 * feature primește imaginea pe partea cealaltă, aici, la randare.
 *
 * Doar layout și skin: hero-ul split e singura bucată proprie și e pur
 * markup + CSS, fără logică (REGULI.md 1).
 */
function HeroPoveste({ date }: { date: SiteData }) {
  const { hero, brand } = date

  return (
    <section className="hero-split" aria-label={hero.headline || brand.name}>
      <div className="wrap hero-split-grid">
        <div className="hero-split-text">
          {brand.tagline && <p className="eyebrow">{brand.tagline}</p>}
          <h1 className="hero-titlu">
            <span className="line" style={{ ['--l' as string]: '0' }}>
              <span>{hero.headline || brand.name}</span>
            </span>
          </h1>
          {hero.sub && <p className="lede">{hero.sub}</p>}
          {hero.badges.length > 0 && (
            <div className="hero-badges">
              {hero.badges.map((b, i) => (
                <span className="pill pill-ink" key={i}>
                  {b.icon && <Icon name={b.icon} marime="sm" />}
                  {b.text}
                  {b.score && <span className="pill-score tabular">{b.score}</span>}
                </span>
              ))}
            </div>
          )}
          <p className="stack" style={{ marginTop: 'var(--sp-6)' }}>
            <ButonDisponibilitate date={date} />
          </p>
        </div>

        <div className="hero-split-media">
          {hero.image ? (
            <Image
              src={hero.image}
              alt={hero.headline || brand.name}
              width={760}
              height={900}
              sizes="(max-width: 900px) 100vw, 48vw"
              priority
              fetchPriority="high"
            />
          ) : (
            <div className="hero-split-fallback" aria-hidden="true">
              <span className="logo-mark">{brand.monogram}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function SablonPovesteAlternanta({ date, setari, meniu }: PropsSablon) {
  const ctx = { date, meniu }
  const areInchidere = setari.sectiuni.includes('closing')

  return (
    <div className="skin-poveste">
      <Antet date={date} />

      <main id="continut">
        <HeroPoveste date={date} />

        {/* Disponibilitatea are secțiunea ei, ca `#rezervare` să existe
            pentru butonul din antet (care rămâne vizibil la scroll) și
            pentru bara mobilă.

            Se stinge din `setari.md` („Bloc de rezervare: nu") acolo unde
            fiecare cameră are deja butonul ei și un al doilea formular
            imediat sub hero doar amână povestea locului. Butoanele nu
            rămân moarte fără el: cu WhatsApp sau telefon în
            `02-telefon-email-si-adresa.md`, `linkRezervare` nu ajunge niciodată la
            ancoră. */}
        {setari.blocRezervare && <BlocRezervare date={date} />}

        {setari.sectiuni.map((id) => {
          // `features` e miezul acestui șablon: alternanța se recalculează
          // din index aici, ignorând orice `reverse` din date (T21).
          if (id === 'features') {
            if (!date.features.length) return null
            return (
              <Fragment key="features">
                {date.features.map((f, i) => (
                  <FeatureAlternant key={f.id} feature={{ ...f, reverse: i % 2 === 1 }} date={date} />
                ))}
              </Fragment>
            )
          }
          return <Fragment key={id}>{sectiune(id, ctx)}</Fragment>
        })}

        {!areInchidere && <Inchidere date={date} />}
      </main>

      <Subsol date={date} />
      <BaraLipita date={date} />
    </div>
  )
}
