/**
 * Limbile sistemului.
 *
 * Fișierul ăsta e mic intenționat: e singurul loc care știe câte limbi
 * există și care e implicită. Tot restul (rute, hreflang, sitemap,
 * comutator) se derivă din el, la BUILD — nu în browser.
 *
 * De ce la build: `Elektro Kasper/js/i18n.js` schimba limba înlocuind
 * text în DOM, în browserul vizitatorului. Merge pe un site de o
 * pagină, dar aici pierdem exact ce urmărim — un crawler AI care nu
 * execută JavaScript ar vedea o singură limbă (vezi DECIZII.md,
 * secțiunea despre `bind.js`). Logica de comutare și de persistență a
 * alegerii se preia; mecanismul de înlocuire în DOM, nu.
 */

export const LIMBI = ['ro', 'en'] as const
export type Limba = (typeof LIMBI)[number]

/** Româna e implicită: n-are prefix în URL și duce majoritatea traficului. */
export const LIMBA_IMPLICITA: Limba = 'ro'

export function esteLimba(x: string): x is Limba {
  return (LIMBI as readonly string[]).includes(x)
}

/**
 * Din segmentul de rută în URL-ul public.
 * Româna nu poartă prefix: `/ro/camere/x` se servește la `/camere/x`.
 */
export function caleaPublica(limba: Limba, cale: string): string {
  const c = cale.startsWith('/') ? cale : `/${cale}`
  return limba === LIMBA_IMPLICITA ? c : `/${limba}${c === '/' ? '' : c}`
}

/** Eticheta din comutator. Numele limbii se scrie în limba ei. */
export const ETICHETE: Record<Limba, string> = {
  ro: 'Română',
  en: 'English',
}

/** `<html lang>` și `og:locale`. */
export const LOCALE_COMPLETE: Record<Limba, string> = {
  ro: 'ro-RO',
  en: 'en-GB',
}
