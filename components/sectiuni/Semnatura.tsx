import Image from 'next/image'

import type { SiteData } from '@/content/types'

/**
 * Banda de semnătură: o frază, mare, peste o fotografie întunecată.
 *
 * E singura secțiune care nu vinde nimic. Restul paginii înșiră camere,
 * prețuri și dotări; asta spune ce fel de loc e — și tocmai fiindcă nu
 * cere nimic, e citită. Stă între două secțiuni pline (de obicei după
 * camere) ca o respirație: banda ocupă toată lățimea, textul e centrat
 * și scurt, iar în jurul lui nu e nimic altceva.
 *
 * Server Component. Fără text sau fără poză, nu se randează deloc
 * (REGULI.md 3): o frază pe fundal gol arată a greșeală, iar o poză
 * întunecată fără text arată a bug de încărcare.
 *
 * Poza NU e candidat la LCP — e mult sub prima vedere — deci primește
 * `loading="lazy"` și `sizes="100vw"`, fiindcă ocupă lățimea întreagă.
 * Se pune `<p>`, nu `<blockquote>`, cât timp fraza e a casei și nu un
 * citat atribuit; devine `<blockquote>` abia când există `Semnat de:`.
 */
export function Semnatura({ date }: { date: SiteData }) {
  const { signature } = date
  if (!signature?.text || !signature.image) return null

  const fraza = (
    <p className="semnatura-text">
      {signature.text}
    </p>
  )

  return (
    <section className="semnatura" id="semnatura">
      <div className="semnatura-media">
        <Image
          src={signature.image}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          loading="lazy"
        />
      </div>

      <div className="wrap semnatura-inner">
        {signature.eyebrow && <p className="eyebrow">{signature.eyebrow}</p>}

        {signature.attribution ? (
          <blockquote className="semnatura-citat">
            {fraza}
            <footer className="semnatura-semnat">{signature.attribution}</footer>
          </blockquote>
        ) : (
          fraza
        )}
      </div>
    </section>
  )
}
