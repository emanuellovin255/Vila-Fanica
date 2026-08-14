import { AntetSectiune } from './AntetSectiune'
import type { SiteData } from '@/content/types'
import type { MeniuCategorie } from '@/content/meniu'

/**
 * Meniul restaurantului: categorii, preparate, gramaje, ingrediente,
 * prețuri, alergeni și valori nutriționale.
 *
 * Server Component. Modul opțional, pornit din setari.md. Prețurile sunt
 * aliniate în coloană prin `tabular-nums`.
 *
 * IERARHIA E DELIBERATĂ. Ce vinde stă la vedere — numele, gramajul,
 * ingredientele, prețul. Ce e obligație de etichetare stă mai jos, mai
 * mic: alergenii ca linie discretă, valorile nutriționale pliate într-un
 * `<details>`. Randate la același nivel, cele ~40 de cifre nutriționale
 * ale unui preparat ar îneca descrierea care îl face de dorit — dar
 * rămân în HTML, deci indexabile și accesibile fără JavaScript.
 *
 * Nu se randează fără categorii.
 */
export function MeniuRestaurant({
  categorii,
  ui,
  titlu,
}: {
  categorii: MeniuCategorie[]
  /** `date.ui` — titlul și eticheta de nutriție, în limba paginii. */
  ui: SiteData['ui']
  titlu?: string
}) {
  const titluAfisat = titlu ?? ui.meniu
  if (!categorii.length) return null

  return (
    <section className="meniu" id="meniu">
      <div className="wrap" style={{ maxWidth: '820px' }}>
        <AntetSectiune title={titluAfisat} />
        {categorii.map((cat, i) => (
          <div className="menu-cat" key={i}>
            <h3>{cat.nume}</h3>
            {cat.servit && <p className="menu-alergeni">{cat.servit}</p>}
            {cat.preparate.map((p, j) => (
              <div className="menu-row" key={j}>
                <div className="menu-info">
                  <span className="menu-nume">
                    {p.nume}
                    {p.gramaj && <em className="menu-gramaj"> · {p.gramaj}</em>}
                  </span>
                  {p.descriere && <p className="menu-descriere">{p.descriere}</p>}
                  {p.nota && <p className="menu-nota">{p.nota}</p>}
                  {p.alergeni && <p className="menu-alergeni">Alergeni: {p.alergeni}</p>}
                  {p.nutritie && (
                    <details className="menu-nutritie">
                      <summary>{ui.valoriNutritionale}</summary>
                      <p>{p.nutritie}</p>
                    </details>
                  )}
                </div>
                {p.pret && <b className="tabular">{p.pret}</b>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
