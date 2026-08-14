/**
 * Redirect-uri 301 de pe site-ul vechi.
 *
 * Cum se folosește, în next.config.ts:
 *   import { redirecturi } from './redirecturi'
 *   const config: NextConfig = { …, async redirects() { return redirecturi } }
 *
 * ── LISTA E GOALĂ, ȘI E CORECT ────────────────────────────────────────────
 *
 * Vila Fănică n-a avut niciodată un site pe domeniul ei. Ce există sunt trei
 * prezențe pe domeniile ALTORA:
 *
 *   · m.cazarebailefelix.ro/cazare-baile-felix/vila-fanica-u-77.html  (agregator)
 *   · vilafanicabailefelix.cazare7.ro                                 (subdomeniu cazare7)
 *   · pagina de Facebook
 *
 * Niciunul nu se migrează. Un redirect scris de noi n-ar fi respectat de
 * cazare7.ro sau de agregator — nu sunt serverele noastre — iar paginile alea
 * rămân oricum acolo unde sunt, ca surse de trafic separate.
 *
 * Partea bună: site-ul pornește curat. Nu moștenește nicio rută stricată și
 * nicio poziție de apărat.
 *
 * ── CE E DE FĂCUT ÎN SCHIMB ───────────────────────────────────────────────
 *
 * După ce domeniul propriu e live, se cere celor de la cazare7 și de la
 * agregator să pună linkul către el în fișa locației. Asta transferă
 * autoritatea fără niciun redirect — și e singurul lucru care chiar se poate
 * face când paginile vechi sunt ale altcuiva.
 *
 * ── CÂND SE COMPLETEAZĂ TOTUȘI ────────────────────────────────────────────
 *
 * Dacă apare un domeniu propriu vechi de care nu știam, se rulează
 * `npm run migrare` peste el și lista se generează, apoi SE DECIDE MANUAL ce
 * rămâne.
 *
 * REGULA CARE NU SE OCOLEȘTE: niciun redirect nu duce în bloc spre „/".
 * `scripts/migrare.ts:14` e explicit — un 301 în bloc spre prima pagină e
 * tratat de Google drept soft 404, adică un semnal mai prost decât un 404
 * curat. Paginile fără conținut nu primesc redirect; ies din index singure.
 */

// Forma acceptată de `redirects()` din next.config — tipată local, ca
// fișierul să nu depindă de căi interne din Next.
export interface Redirect301 {
  source: string
  destination: string
  permanent: true
}

export const redirecturi: Redirect301[] = []
