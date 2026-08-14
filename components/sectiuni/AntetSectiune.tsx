/**
 * Antetul unei secțiuni: eyebrow + titlu + text introductiv.
 *
 * Bucata asta se repetă la aproape fiecare secțiune, deci trăiește
 * într-un singur loc. Se randează doar câmpurile care există: fără
 * eyebrow, nu apare un rând gol; fără titlu, nu se randează nimic
 * (un antet fără titlu n-are rost).
 */
export function AntetSectiune({
  eyebrow,
  title,
  lede,
  center,
}: {
  eyebrow?: string
  title?: string
  lede?: string
  center?: boolean
}) {
  if (!title && !eyebrow && !lede) return null

  return (
    <div className={center ? 'sec-head center' : 'sec-head'}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {title && <h2>{title}</h2>}
      {lede && <p className="lede">{lede}</p>}
    </div>
  )
}
