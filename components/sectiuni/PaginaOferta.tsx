import Image from 'next/image'

import type { Offer, SiteData } from '@/content/types'
import { Icon } from '@/components/Icon'
import { ButonDisponibilitate } from './ButonDisponibilitate'
import { ListaPreturi } from './ListaPreturi'

/**
 * Pagina individuală a unei oferte sau a unui traseu de excursie (T61).
 *
 * Aceleași alegeri ca la `PaginaCamera`: Server Component, conținut în
 * HTML (REGULI.md 12), imaginea de sus e candidatul la LCP deci primește
 * `priority`, iar prețul se afișează doar dacă există (REGULI.md 3).
 *
 * Reia structura din `PaginaCamera` fără să forțeze o abstracție peste
 * două cazuri (T61): o cameră are facilități și galerie, o ofertă are un
 * program descriptiv — destul de diferite ca să rămână separate.
 */
export function PaginaOferta({ oferta, date }: { oferta: Offer; date: SiteData }) {
  const { booking } = date

  return (
    <main id="continut">
      <article className="wrap" style={{ paddingBlock: 'var(--section-pad)' }}>
        <header className="sec-head">
          {(oferta.badge || oferta.valid) && (
            <p className="eyebrow">{[oferta.badge, oferta.valid].filter(Boolean).join(' · ')}</p>
          )}
          <h1>{oferta.title}</h1>
          {oferta.summary && <p className="lede">{oferta.summary}</p>}
        </header>

        {oferta.image && (
          <div className="oferta-media" style={{ marginTop: 'var(--sp-6)' }}>
            <Image
              src={oferta.image}
              alt={oferta.title}
              width={1200}
              height={800}
              sizes="(max-width: 900px) 100vw, 900px"
              priority
              fetchPriority="high"
            />
          </div>
        )}

        {/* Lista `Include:` — elemente separate, nu un paragraf. Până la
            T75 ajungea concatenată în `text` și se citea ca un bloc
            compact de opt rânduri, imposibil de parcurs. */}
        {oferta.bullets.length > 0 && (
          <section style={{ marginTop: 'var(--sp-8)' }}>
            <h2>{date.ui.ceInclude}</h2>
            <ul className="lista-bifata">
              {oferta.bullets.map((b, i) => (
                <li key={i}>
                  <Icon name="check" marime="sm" />
                  {b}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Grila pe perioade, imediat sub „Ce include": e prima
            întrebare de după „ce primesc". */}
        {oferta.prices && oferta.prices.length > 0 && (
          <ListaPreturi preturi={oferta.prices} className="preturi-pagina" />
        )}

        {/* Proza ofertei. Paragrafe separate, nu un `pre-line` cu toate
            rândurile la rând: markdown-ul le desparte prin rând gol, iar
            `pre-line` păstra și tăieturile de rând din fișier, deci
            fraze rupte la mijloc, unde s-a nimerit lățimea editorului. */}
        {oferta.text &&
          oferta.text.split(/\n{2,}/).map((p, i) => (
            <p className="lede oferta-proza" key={i}>
              {p.replace(/\s*\n\s*/g, ' ')}
            </p>
          ))}

        <div
          className="card-foot"
          style={{ marginTop: 'var(--sp-8)', maxWidth: '420px', border: 'none', paddingTop: 0 }}
        >
          {/* Grila de mai sus a spus deja toate prețurile; „de la …"
              lângă buton ar repeta doar cifra cea mai mică. */}
          {!oferta.prices?.length && oferta.price && (
            <div className="price">
              <b className="tabular">
                {oferta.price}
                {oferta.priceUnit && <em> {oferta.priceUnit}</em>}
              </b>
              {oferta.priceWas && <span className="was tabular">{oferta.priceWas}</span>}
            </div>
          )}
          <ButonDisponibilitate date={date} context={oferta.title} ancora="/#rezervare" />
        </div>
      </article>
    </main>
  )
}
