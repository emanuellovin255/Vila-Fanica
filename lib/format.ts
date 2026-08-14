/* ============================================================
   format.ts — formatarea numerelor la RANDARE.

   Loader-ul (T05) citește un preț ca număr curat: `480`. Aici devine
   text pentru ochi: „480 lei". Motivul separării e că din numărul curat
   se generează ȘI afișajul, ȘI `Offer`-ul din JSON-LD (T07) — dacă am
   formata la citire, cele două ar putea diverge.
   ============================================================ */

const RO = new Intl.NumberFormat('ro-RO')

/** `480` → „480". `1250` → „1.250". Cifrele rămân aliniate prin `tabular-nums`. */
export function numar(n: number): string {
  return RO.format(n)
}

/** `480`, „lei" → „480 lei". Simbolul vine din `SiteData.meta`. */
export function pret(n: number, simbol: string): string {
  return `${numar(n)} ${simbol}`
}
