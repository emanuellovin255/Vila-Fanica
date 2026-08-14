import type { SiteData } from '@/content/types'
import type { Setari } from '@/lib/continut'
import { caleaPublica, LIMBA_IMPLICITA, type Limba } from '@/lib/i18n/limbi'
import { traduSegment } from '@/lib/i18n/rute'

/**
 * Enumeră rutele reale ale unui site, din datele și setările lui.
 *
 * Sursa unică pentru sitemap.xml (T07) și pentru `generateStaticParams`
 * din șabloane. O rută apare aici DOAR dacă are conținut: o secțiune de
 * evenimente oprită nu produce `/evenimente`. De asta sitemap-ul
 * conține exact rutele generate, niciuna în plus (criteriu T07).
 *
 * URL-urile sunt în română, dar FĂRĂ diacritice (T07): slug-urile vin
 * din loader, care le-a curățat deja („terasă" → `terasa`).
 */
export interface Ruta {
  /** Calea internă, fără prefix de limbă. */
  cale: string
  /** Prioritate relativă pentru sitemap. */
  prioritate: number
  /** Cât de des se schimbă, orientativ. */
  frecventa: 'weekly' | 'monthly' | 'yearly'
}

export function ruteleSitului(date: SiteData, setari: Setari, areMeniu = false): Ruta[] {
  const rute: Ruta[] = [{ cale: '/', prioritate: 1, frecventa: 'weekly' }]

  if (date.rooms.items.length) {
    rute.push({ cale: '/camere', prioritate: 0.9, frecventa: 'weekly' })
    for (const c of date.rooms.items) {
      // Paginile de cameră sunt cele care prind căutările — prioritate mare.
      rute.push({ cale: `/camere/${c.slug}`, prioritate: 0.8, frecventa: 'weekly' })
    }
  }

  if (date.offers.items.length) {
    rute.push({ cale: '/oferte', prioritate: 0.7, frecventa: 'weekly' })
    for (const o of date.offers.items) {
      rute.push({ cale: `/oferte/${o.slug}`, prioritate: 0.6, frecventa: 'weekly' })
    }
  }

  // Contactul ARE acum pagină proprie (`app/[limba]/contact/`), deci
  // intră aici fără condiție: se randează din `02-telefon-email-si-adresa.md`, care e
  // obligatoriu, deci nu se poate auto-anula. Înainte era doar ancora
  // `/#contact` către subsol, adică o adresă fără pagină în `app/` — un
  // 404 trimis la Google în sitemap-ul fiecărui client.
  rute.push({ cale: '/contact', prioritate: 0.5, frecventa: 'yearly' })

  // Meniul restaurantului ARE pagină proprie (`app/[limba]/meniu/`), pe
  // lângă secțiunea de pe prima pagină (`dispecer.tsx`, id `menu`). Un
  // meniu lung nu încape pe prima pagină, iar un PDF nu se indexează
  // util: „meniu bar Băile Felix prețuri" n-ar avea pe ce ateriza.
  //
  // Condiția e aceeași ca în pagină: modul pornit ȘI preparate scrise.
  // `areMeniu` vine de sus, fiindcă meniul se încarcă separat de
  // `SiteData` (vezi `lib/site.ts`). Fără condiția a doua, sitemap-ul ar
  // promite o pagină care întoarce 404.
  if (setari.module.meniuRestaurant && areMeniu) {
    rute.push({ cale: '/meniu', prioritate: 0.7, frecventa: 'monthly' })
  }

  // Pentru restul, comutatorul nu e de ajuns: paginile astea se
  // auto-anulează (`notFound`) când n-au ce arăta, deci sitemap-ul
  // trebuie să pună aceleași condiții. Altfel trimitem la Google exact
  // 404-urile pe care comentariul de mai sus le descrie ca reparate.
  if (setari.module.evenimente && date.events.items.length) {
    rute.push({ cale: '/evenimente', prioritate: 0.6, frecventa: 'monthly' })
  }
  if (setari.module.galerieExtinsa) rute.push({ cale: '/galerie', prioritate: 0.5, frecventa: 'monthly' })
  if (setari.module.zona && date.area.items.length) {
    rute.push({ cale: '/zona', prioritate: 0.6, frecventa: 'monthly' })
  }

  // Paginile legale există mereu, dar contează puțin pentru căutare.
  for (const l of date.legal.links) {
    rute.push({ cale: l.href, prioritate: 0.2, frecventa: 'yearly' })
  }

  return rute
}

/**
 * Toate rutele, pentru toate limbile în care există site-ul. Româna nu
 * poartă prefix; engleza primește `/en` doar dacă e activată.
 *
 * ── DE CE PRIMEȘTE O FUNCȚIE, NU UN SINGUR `date` ──
 *
 * Fiindcă rutele DIFERĂ de la o limbă la alta, în două feluri, iar varianta
 * veche — un singur set de rute, prefixat cu `/en` — le rata pe amândouă:
 *
 *   1. SEGMENTUL de nivel înalt se traduce: `/camere` → `/en/rooms`.
 *   2. SLUG-UL vine din numele elementului, care e tradus: camera
 *      „Cameră Dublă Deluxe" e `/camere/camera-dubla-deluxe`, dar
 *      „Deluxe Double Room" e `/en/rooms/deluxe-double-room`.
 *
 * Rezultatul, măsurat pe Casa Irlandeză înainte de reparație: sitemap-ul
 * conținea `/en/camere/camera-dubla-deluxe` și încă două ca ea — toate trei
 * dând 404, fiindcă adresele reale erau `/en/rooms/deluxe-double-room` &co.
 * Un sitemap care trimite crawler-ul în 404 e mai rău decât lipsa lui.
 *
 * Restul rutelor (`/en/camere`, `/en/zona`) existau, dar canonicalizau spre
 * `/en/rooms` și `/en/area` — deci sitemap-ul contrazicea canonical-ul paginii.
 *
 * `perLimba` întoarce datele ÎNCĂRCATE ÎN LIMBA CERUTĂ, de unde ies slug-urile
 * corecte; `traduSegment` rezolvă primul segment.
 */
export function ruteCuLimbi(
  perLimba: (l: Limba) => { date: SiteData; setari: Setari; areMeniu: boolean },
  limbi: Limba[],
): { url: string; prioritate: number; frecventa: Ruta['frecventa'] }[] {
  const iesire: { url: string; prioritate: number; frecventa: Ruta['frecventa'] }[] = []
  const active = limbi.length ? limbi : [LIMBA_IMPLICITA]

  for (const l of active) {
    const { date, setari, areMeniu } = perLimba(l)
    for (const r of ruteleSitului(date, setari, areMeniu)) {
      const cale = traduSegment(r.cale, l)
      // Paginile LEGALE vin din date deja ca adrese PUBLICE, cu prefixul de
      // limbă pus („/en/terms"), spre deosebire de restul rutelor, care sunt
      // interne („/camere"). Prefixate încă o dată, ieșeau „/en/en/terms".
      const arePrefix = cale === `/${l}` || cale.startsWith(`/${l}/`)
      iesire.push({
        url: arePrefix ? cale : caleaPublica(l, cale),
        prioritate: r.prioritate,
        frecventa: r.frecventa,
      })
    }
  }
  return iesire
}
