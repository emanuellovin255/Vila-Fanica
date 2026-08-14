/* ============================================================
   fisiere.ts — numele fișierelor de conținut, într-un singur loc.

   ATENȚIE, PENTRU CINE ÎNTREȚINE MOTORUL: fișierul ăsta e o
   MODIFICARE LOCALĂ față de motorul-sursă. Vezi `MOTOR-MODIFICAT.md`
   din rădăcina repo-ului înainte de `npm run actualizeaza-motor`.

   De ce există:

   Fișierele din `date/` sunt editate de gazdă, nu de un programator.
   Un fișier numit „identitate" nu spune nimănui că acolo se schimbă
   numele din antet și descrierea care apare în Google; unul numit
   „legal-firma" nu spune că ăla e subsolul. Deci au fost redenumite în
   ceva ce se citește fără să deschizi fișierul:

     numele vechi          numele de acum
     01-identitate         01-nume-logo-si-descriere
     02-contact            02-telefon-email-si-adresa
     03-prima-pagina       03-pagina-principala
     06-oferte             06-oferte-si-excursii
     12-legal-firma        12-firma-si-documente-legale
     13-zona               13-zona-si-atractii
     14-pagina-contact     14-pagina-de-contact

   Motorul căuta numele exacte, scrise în vreo patruzeci de locuri din
   `index.ts`. Acum le caută de aici, iar `rezolva()` face căutarea
   TOLERANTĂ: numărul din față e identitatea fișierului, restul numelui
   e pentru om. Cine redenumește mâine `04-camere.md` în
   `04-camerele-noastre.md` nu strică nimic, atât timp cât păstrează
   „04-" și extensia „.md".

   Numerele NU se schimbă și nu se refolosesc: ele sunt contractul
   dintre fișierele gazdei și cod.
   ============================================================ */

import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Numele canonice — cele scrise chiar acum pe disc, în `date/` și `en/`.
 * Ele apar și în mesajele de eroare, deci trebuie să fie exact ce vede
 * gazda în GitHub când i se spune „completează în fișierul X".
 */
export const FISIERE = {
  identitate: '01-nume-logo-si-descriere.md',
  contact: '02-telefon-email-si-adresa.md',
  primaPagina: '03-pagina-principala.md',
  camere: '04-camere.md',
  facilitati: '05-facilitati.md',
  oferte: '06-oferte-si-excursii.md',
  meniu: '07-meniu-restaurant.md',
  recenzii: '08-recenzii.md',
  faq: '09-intrebari-frecvente.md',
  rezervari: '10-rezervari-si-plati.md',
  stil: '11-culori-si-fonturi.md',
  legal: '12-firma-si-documente-legale.md',
  zona: '13-zona-si-atractii.md',
  paginaContact: '14-pagina-de-contact.md',
} as const

export type NumeFisier = (typeof FISIERE)[keyof typeof FISIERE]

/** Prefixul numeric al unui nume de fișier: `03-pagina-principala.md` → `03`. */
function prefix(nume: string): string | null {
  return nume.match(/^(\d{2})-/)?.[1] ?? null
}

/**
 * Calea reală a unui fișier de conținut, sau `null` dacă nu există.
 *
 * Întâi numele exact — cazul normal, o singură verificare pe disc.
 * Dacă nu-l găsește, caută în folder orice `.md` care începe cu același
 * număr: asta e plasa de siguranță pentru redenumirile viitoare și
 * pentru fișierele rămase cu numele vechi (`01-identitate.md`).
 *
 * Când numărul are mai multe potriviri — cineva a lăsat și fișierul
 * vechi, și pe cel nou — câștigă primul în ordine alfabetică, mereu
 * același, ca rezultatul să nu depindă de ordinea de pe disc.
 */
export function rezolva(radacina: string, nume: string): string | null {
  const exact = path.join(radacina, nume)
  if (existsSync(exact)) return exact

  const nr = prefix(nume)
  if (!nr || !existsSync(radacina)) return null

  const potrivire = readdirSync(radacina)
    .filter((f) => f.endsWith('.md') && prefix(f) === nr)
    .sort()[0]
  return potrivire ? path.join(radacina, potrivire) : null
}
