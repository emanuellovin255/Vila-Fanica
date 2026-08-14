import { Icon } from '@/components/Icon'
import type { IconName, SiteData } from '@/content/types'

/**
 * Chip-urile de facilități dintr-un card de cameră.
 *
 * Numele scurte din `date` („wifi", „climate") devin chip cu icon +
 * etichetă lizibilă. Un nume necunoscut se afișează ca text simplu, fără
 * icon — nu dispare și nu crapă.
 *
 * `maxim` limitează câte se arată pe card; restul se numără („+3"),
 * ca să nu se umfle cardul. Pe pagina camerei se afișează toate.
 *
 * ICONUL ȘI ETICHETA STAU SEPARAT (T76). Iconul e o alegere de design,
 * aceeași în orice limbă, deci rămâne aici. Eticheta e text vizibil, deci
 * vine din `date.ui.dotari` — până acum era scrisă în română direct în
 * componentă, deci pe /en un card de cameră afișa „Climatizare" și
 * „Frigider" sub un titlu englezesc.
 */
const ICOANE: Record<string, IconName> = {
  wifi: 'wifi',
  tv: 'tv',
  climate: 'climate',
  safe: 'safe',
  fridge: 'fridge',
  coffee: 'coffee',
  shower: 'shower',
  terrace: 'terrace',
  bed: 'bed',
  users: 'users',
  accessible: 'accessible',
  parking: 'parking',
  ev: 'ev',
  pool: 'pool',
  sauna: 'sauna',
  spa: 'spa',
  dining: 'dining',
  bar: 'bar',
  ciubar: 'ciubar',
  grill: 'grill',
  'pet-friendly': 'pet-friendly',
  'mic-dejun': 'mic-dejun',
  pescuit: 'pescuit',
  biciclete: 'biciclete',
}

export function AmenitatiChips({
  amenitati,
  ui,
  maxim,
}: {
  amenitati: string[]
  /** `date.ui` — etichetele dotărilor în limba paginii. */
  ui: SiteData['ui']
  maxim?: number
}) {
  if (!amenitati.length) return null

  const vizibile = maxim ? amenitati.slice(0, maxim) : amenitati
  const rest = maxim ? amenitati.length - vizibile.length : 0

  return (
    <ul className="chips">
      {vizibile.map((a) => {
        const cheie = a.toLowerCase()
        const icon = ICOANE[cheie]
        const eticheta = ui.dotari[cheie]
        return (
          <li className="chip" key={a}>
            {icon && <Icon name={icon} marime="sm" />}
            {eticheta ?? a}
          </li>
        )
      })}
      {rest > 0 && <li className="chip">+{rest}</li>}
    </ul>
  )
}
