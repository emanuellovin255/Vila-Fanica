import type { SiteData } from '@/content/types'

/**
 * Banda cu numele camerelor, în mișcare lentă — Șablonul 6 · Irlandez.
 *
 * Preluată ca idee de la zagazaga.ro, unde tipurile de cazare trec într-o
 * bandă sub titlul secțiunii. Aici ține locul unei secțiuni întregi de
 * „ce oferim": trei nume mari, la fontul de afiș, citite din mers.
 *
 * CUM BUCLEAZĂ FĂRĂ JAVASCRIPT: lista se randează de DOUĂ ori în HTML, iar
 * animația mută containerul cu exact −50%. Când ajunge la capăt, a doua
 * copie e fix acolo unde era prima, deci saltul înapoi la 0 nu se vede.
 * A doua copie primește `aria-hidden`, ca un cititor de ecran să nu audă
 * lista de două ori. Tiparul e copiat din `05-termal/BandaDotari.tsx`
 * (REGULI.md 2: se copiază, nu se rescrie).
 *
 * Server Component, zero JS. Sub `prefers-reduced-motion` skin-ul oprește
 * animația și centrează lista, deci rămâne lizibilă.
 *
 * DE CE TREI COPII ALE LISTEI ȘI NU DOUĂ: cu trei camere, o listă de trei
 * nume nu umple ecranul unui monitor lat, iar banda ar avea goluri. Lista
 * se repetă de trei ori în fiecare jumătate, deci sunt nouă nume pe rând —
 * suficient la 2560px. E singurul motiv; la un client cu zece camere,
 * `REPETARI` se pune pe 1.
 *
 * TEXTELE VIN DIN `date/04-camere.md`, nu din codul ăsta: un șablon nu
 * ține conținut (REGULI.md 1). Sub două camere, banda nu se randează.
 */
const REPETARI = 3

export function MarchizaCamere({ date }: { date: SiteData }) {
  const nume = date.rooms.items.map((c) => c.name).filter(Boolean)
  if (nume.length < 2) return null

  const lista = Array.from({ length: REPETARI }, () => nume).flat()

  const sir = (ascuns: boolean) => (
    <ul className="marchiza__lista" aria-hidden={ascuns || undefined}>
      {lista.map((n, i) => (
        <li className="marchiza__element" key={`${n}-${i}`}>
          {n}
          <span className="marchiza__separator" aria-hidden="true">
            ·
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <section className="marchiza" aria-label={date.rooms.section.title || date.brand.name}>
      <div className="marchiza__sir">
        {sir(false)}
        {sir(true)}
      </div>
    </section>
  )
}
