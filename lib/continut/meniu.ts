import { readFileSync } from 'node:fs'

import type { MeniuCategorie } from '@/content/meniu'

import { FISIERE, rezolva } from './fisiere'
import { analizeaza, text } from './md'

/**
 * Încarcă meniul din date/07-meniu-restaurant.md.
 *
 * `##` deschide o categorie, `###` un preparat. Fiecare preparat are
 * un preț și, opțional, gramaj, alergeni, o notă de comandă și valorile
 * nutriționale. Ingredientele vin din CORPUL blocului `###`, ca
 * descrierea unei camere din `04-camere.md` — cine scrie meniul le
 * înșiră în proză, nu într-un câmp.
 *
 * Se întoarce o listă goală dacă fișierul lipsește sau e necompletat —
 * apelantul decide dacă asta e o problemă (de obicei nu: meniul e
 * opțional).
 */
export function incarcaMeniu(radacinaDate: string): MeniuCategorie[] {
  const cale = rezolva(radacinaDate, FISIERE.meniu)
  if (!cale) return []

  const doc = analizeaza(readFileSync(cale, 'utf8'))
  const categorii: MeniuCategorie[] = []

  for (const bloc of doc.blocuri) {
    if (!bloc.titlu.trim()) continue
    const preparate = bloc.subblocuri
      .filter((sb) => sb.titlu.trim())
      .map((sb) => ({
        nume: sb.titlu,
        pret: text(sb.campuri.get('pret')),
        alergeni: text(sb.campuri.get('alergeni')),
        gramaj: text(sb.campuri.get('gramaj')),
        nota: text(sb.campuri.get('nota')),
        nutritie: text(sb.campuri.get('valori nutritionale')),
        descriere: sb.text.trim() || undefined,
      }))
    if (!preparate.length) continue
    categorii.push({
      nume: bloc.titlu,
      servit: text(bloc.campuri.get('servit')),
      preparate,
    })
  }

  return categorii
}
