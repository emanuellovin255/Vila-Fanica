import type { SiteData } from '@/content/types'
import { caleaPublica, ETICHETE, LIMBA_IMPLICITA, LIMBI, type Limba } from './limbi'

/**
 * Segmentele de rută traduse. Slug-urile DIFERĂ între limbi:
 * `/camere/apartament-deluxe` vs `/en/rooms/deluxe-apartment` (T08).
 * Maparea e explicită, nu ghicită — un slug tradus greșit rupe
 * `hreflang`-ul în ambele direcții.
 *
 * Segmentele de nivel înalt (camere↔rooms) se traduc aici, o dată.
 * Slug-urile de cameră/ofertă se mapează în `lib/i18n/perechi.ts`, după
 * poziția din fișier — nu aici, fiindcă asta ar cere citirea datelor, iar
 * fișierul ăsta e importat de `middleware.ts`, care rulează pe edge și nu
 * poate atinge `node:fs`.
 *
 * CHEIA E ȘI NUMELE FOLDERULUI din `app/[limba]/`. Nu e o coincidență:
 * `traduSegmentIntern` se bazează pe asta ca să traducă înapoi adresa
 * publică engleză în ruta reală.
 */
const SEGMENTE: Record<string, Partial<Record<Limba, string>>> = {
  camere: { ro: 'camere', en: 'rooms' },
  oferte: { ro: 'oferte', en: 'offers' },
  contact: { ro: 'contact', en: 'contact' },
  facilitati: { ro: 'facilitati', en: 'facilities' },
  restaurant: { ro: 'restaurant', en: 'restaurant' },
  evenimente: { ro: 'evenimente', en: 'events' },
  galerie: { ro: 'galerie', en: 'gallery' },
  zona: { ro: 'zona', en: 'area' },
  meniu: { ro: 'meniu', en: 'menu' },
  multumim: { ro: 'multumim', en: 'thank-you' },
  // Paginile legale. Fără ele aici, comutatorul de limbă de pe „Termeni
  // și condiții" ducea la `/en/termeni` — o adresă englezească doar pe
  // jumătate (T76).
  'politica-confidentialitate': { ro: 'politica-confidentialitate', en: 'privacy-policy' },
  'politica-cookies': { ro: 'politica-cookies', en: 'cookie-policy' },
  'politica-anulare': { ro: 'politica-anulare', en: 'cancellation-policy' },
  termeni: { ro: 'termeni', en: 'terms' },
}

/** Traduce primul segment al unei căi; restul (slug-ul) rămâne neatins. */
export function traduSegment(cale: string, limba: Limba): string {
  const parti = cale.replace(/^\//, '').split('/')
  if (!parti[0]) return cale
  const tradus = SEGMENTE[parti[0]]?.[limba]
  if (tradus) parti[0] = tradus
  return `/${parti.join('/')}`
}

/**
 * Inversul lui `traduSegment`: din adresa PUBLICĂ în ruta REALĂ.
 *
 * `app/[limba]/` are un singur folder per pagină, numit românește
 * (`camere/`), dar adresa engleză e `/en/rooms`. Fără pasul ăsta,
 * comutatorul de limbă trimitea pe o rută care nu există — 404 pe toată
 * engleza, adică exact „butonul English nu merge". Engleza n-a fost
 * niciodată pornită până acum, deci nimeni n-a lovit pragul (T76).
 *
 * Se aplică în `middleware.ts`, printr-un rewrite: bara de adrese
 * păstrează `/en/rooms`, Next primește `/en/camere`.
 *
 * Pentru română e o funcție identitate: cheia hărții E numele folderului.
 */
export function traduSegmentIntern(cale: string, limba: Limba): string {
  const parti = cale.replace(/^\//, '').split('/')
  if (!parti[0]) return cale
  for (const [folder, traduceri] of Object.entries(SEGMENTE)) {
    if (traduceri[limba] === parti[0]) {
      parti[0] = folder
      return `/${parti.join('/')}`
    }
  }
  return cale
}

/**
 * Construiește `SiteData.locales` pentru comutator: fiecare limbă cu
 * eticheta ei și cu URL-ul PAGINII ECHIVALENTE, nu al primei pagini
 * (T08). `limbiActive` sunt limbile în care pagina chiar există.
 *
 * `caiPerLimba` acoperă paginile `[slug]`, unde slug-ul însuși diferă
 * între limbi și nu se poate traduce dintr-o hartă de segmente: pagina
 * îl calculează cu `caiPereche()` și îl pasează aici.
 */
export function construiesteLocales(
  limbaCurenta: Limba,
  caleInterna: string,
  limbiActive: Limba[],
  caiPerLimba?: Partial<Record<Limba, string>>,
): SiteData['locales'] {
  const active = limbiActive.length ? limbiActive : [LIMBA_IMPLICITA]
  return active.map((l) => ({
    code: l,
    label: ETICHETE[l],
    href: caleaPublica(l, traduSegment(caiPerLimba?.[l] ?? caleInterna, l)),
    current: l === limbaCurenta,
  }))
}

/** Limbile în care există site-ul, după setări. Româna mereu; engleza opțional. */
export function limbiActive(englezaPornita: boolean): Limba[] {
  return englezaPornita ? [...LIMBI] : [LIMBA_IMPLICITA]
}
