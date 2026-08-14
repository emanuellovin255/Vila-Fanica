import Image from 'next/image'
import Link from 'next/link'

import { ComutatorLimba } from '@/components/ComutatorLimba'
import { MeniuMobil } from '@/components/MeniuMobil'
import type { SiteData } from '@/content/types'
import { caleaPublica, type Limba } from '@/lib/i18n/limbi'
import { ButonDisponibilitate } from './ButonDisponibilitate'

/** Leagă burgerul de lista de linkuri, prin `aria-controls`. */
const ID_MENIU = 'meniu-principal'

/**
 * Antetul: logo, navigație, comutator de limbă, buton principal.
 *
 * Server Component. Se micșorează la scroll prin `.is-scrolled`, pusă
 * de `lib/reveal.ts` cu un IntersectionObserver pe sentinelă — nu cu un
 * listener de scroll (REGULI.md 11). Fără JavaScript, antetul rămâne
 * întreg și lipit, doar că nu se mai micșorează.
 *
 * `data-antet` și `data-antet-sentinela` sunt contractul cu reveal.ts.
 *
 * Zero text în română scris aici (REGULI.md, T06): eticheta butonului
 * vine din `booking.labels.submit`, linkurile din `nav`.
 */
export function Antet({ date }: { date: SiteData }) {
  const { brand, nav, locales } = date

  return (
    <>
      <a className="skip" href="#continut">
        {date.ui.sariLaContinut}
      </a>

      <header className="site-header" data-antet>
        <div className="wrap nav">
          <Link className="logo" href={caleaPublica(date.meta.localeShort as Limba, '/')} aria-label={`${brand.shortName || brand.name} — ${date.ui.acasa}`}>
            {/* Raportul de mai jos e cel REAL al fișierului din `poze/` — aici
                sigla Casa Drăgan, 1536×1024. Dacă îl mint, Next rezervă alt spațiu
                decât ocupă poza și antetul saltă la încărcare, deci se schimbă
                odată cu logo-ul. Înălțimea o dă CSS-ul (`.logo-img`), ca să se
                poată micșora pe telefon.

                CU LOGO, NUMELE NU SE MAI SCRIE ȘI CU LITERE alături: sigla asta
                își conține numele, iar „Delta Resort" de două ori, unul lângă
                altul, citește ca o greșeală. Numele rămâne în `alt` și în
                `aria-label`-ul linkului, deci cititoarele de ecran îl aud.
                Fără logo, rămâne monograma plus numele scris — ca înainte. */}
            {brand.logo ? (
              <Image className="logo-img" src={brand.logo} alt={brand.name} width={1536} height={1024} sizes="200px" priority />
            ) : (
              <>
                <span className="logo-mark" aria-hidden="true">
                  {brand.monogram}
                </span>
                <span className="logo-name">{brand.shortName || brand.name}</span>
              </>
            )}
          </Link>

          {nav.length > 0 && (
            <nav aria-label={date.ui.navigatiePrincipala}>
              {/* `id` e ținta lui `aria-controls` de pe burger: sub 1024px
                  lista asta E panoul care se deschide (vezi MeniuMobil). */}
              <ul className="nav-links" id={ID_MENIU}>
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="nav-cta">
            {locales.length > 1 && <ComutatorLimba locales={locales} eticheta={date.ui.limba} />}
            {/* Deschide direct WhatsApp, cu mesajul deja scris
                (`ButonDisponibilitate`). Fără număr configurat, redevine
                ancoră către bara de disponibilitate. */}
            <ButonDisponibilitate date={date} />
            {/* Burgerul apare doar sub 1024px (base.css). Randat mereu:
                ascunderea o face CSS-ul, deci nu depinde de JavaScript. */}
            {nav.length > 0 && <MeniuMobil eticheta={date.ui.meniu} controleaza={ID_MENIU} />}
          </div>
        </div>
      </header>

      {/* Elementul de 1px pe care îl urmărește observerul din reveal.ts.
          Când iese din ecran, antetul primește `.is-scrolled`. */}
      <span data-antet-sentinela aria-hidden="true" />
    </>
  )
}
