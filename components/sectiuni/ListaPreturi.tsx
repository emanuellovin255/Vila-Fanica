import type { PretPerioada } from '@/content/types'

/**
 * Grila de tarife pe sezoane: un rând per perioadă.
 *
 *   290 lei / noapte — martie–mai
 *   320 lei / noapte — iunie–octombrie
 *
 * DE CE ÎNLOCUIEȘTE PARAGRAFUL. Tarifele erau scrise în proza camerei
 * („290 lei între 27 martie și 31 mai, 320 lei între 1 iunie și 31
 * octombrie"). Adevărat, dar nimeni nu citește un paragraf ca să afle un
 * preț — iar în card nu încăpea deloc, deci acolo apărea doar „de la
 * 270 lei", adică tariful de noiembrie, valabil o lună din nouă.
 *
 * Un `<dl>` și nu o listă: perechile tarif → perioadă chiar sunt termen
 * și definiție, iar cititoarele de ecran le anunță ca atare.
 *
 * Server Component. Fără tarife, nu se randează nimic (REGULI.md 3) —
 * apelantul cade pe afișajul dinainte.
 */
export function ListaPreturi({
  preturi,
  className,
}: {
  preturi: PretPerioada[] | undefined
  className?: string
}) {
  if (!preturi?.length) return null

  return (
    <dl className={className ? `preturi ${className}` : 'preturi'}>
      {preturi.map((p, i) => (
        <div className="pret-rand" key={i}>
          <dt className="tabular">{p.amount}</dt>
          {p.period && <dd>{p.period}</dd>}
        </div>
      ))}
    </dl>
  )
}
