/* ============================================================
   jsonld.ts — datele structurate, generate din SiteData.

   În nișa de cazare, datele structurate sunt cel mai mare avantaj
   disponibil: foarte puține site-uri de pensiuni le au corect, iar
   Google afișează stele, preț și disponibilitate direct în rezultate.

   REGULA CARE NU SE ÎNCALCĂ (REGULI.md 3, T07):
   `AggregateRating` și `Review` se generează DOAR din recenzii reale,
   cu sursă. `Offer` doar din prețuri confirmate. Google penalizează
   datele structurate care nu corespund cu ce e vizibil în pagină — și
   e o afirmație falsă către un potențial oaspete. De asta fiecare
   generator de mai jos întoarce `null` când data lipsește, în loc să
   inventeze un câmp.

   Generat din SiteData, deci imposibil de desincronizat de conținut:
   dacă prețul se schimbă în `.md`, se schimbă și în JSON-LD.
   ============================================================ */

import type { Offer, Room, SiteData } from '@/content/types'
import { numar } from '@/lib/continut/md'

type Jsonld = Record<string, unknown>

/** Elimină cheile fără valoare, ca să nu emitem `"price": null`. */
function curat<T extends Jsonld>(obj: T): T {
  const out: Jsonld = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out as T
}

function url(base: string, cale = ''): string {
  const b = base.replace(/\/$/, '')
  const c = cale.startsWith('/') ? cale : cale ? `/${cale}` : ''
  return `${b}${c}`
}

/** Tipul schema.org potrivit, dedus din `brand.stars` și tip. */
function tipCazare(date: SiteData): string {
  // Un resort e o categorie schema.org distinctă; altfel LodgingBusiness
  // acoperă pensiuni, cabane, vile — mai larg și mai sigur decât `Hotel`.
  const nume = `${date.brand.name} ${date.hero.headline}`.toLowerCase()
  if (/resort/.test(nume)) return 'Resort'
  if (date.brand.stars && date.brand.stars >= 3 && /hotel/.test(nume)) return 'Hotel'
  return 'LodgingBusiness'
}

function adresa(date: SiteData): Jsonld | undefined {
  const { contact } = date
  if (!contact.street && !contact.city) return undefined
  return curat({
    '@type': 'PostalAddress',
    streetAddress: contact.street,
    addressLocality: contact.city,
    addressRegion: contact.region,
    postalCode: contact.postalCode,
    addressCountry: contact.countryCode,
  })
}

function geo(date: SiteData): Jsonld | undefined {
  const { lat, lng } = date.contact
  if (lat === undefined || lng === undefined) return undefined
  return { '@type': 'GeoCoordinates', latitude: lat, longitude: lng }
}

/** AggregateRating — doar din notă reală, cu sursă (REGULI.md 3). */
function agregat(date: SiteData): Jsonld | undefined {
  const r = date.rating
  if (!r || !r.source) return undefined
  const value = Number(r.value.replace(',', '.'))
  if (!Number.isFinite(value)) return undefined
  return curat({
    '@type': 'AggregateRating',
    ratingValue: value,
    bestRating: r.scale,
    ratingCount: r.count,
  })
}

/** Review[] — doar recenzii reale, cu sursă (loader-ul le-a filtrat deja). */
function recenzii(date: SiteData): Jsonld[] {
  return date.reviews.items
    .filter((rec) => rec.source && rec.quote)
    .map((rec) =>
      curat({
        '@type': 'Review',
        reviewBody: rec.quote,
        author: rec.author ? { '@type': 'Person', name: rec.author } : undefined,
        datePublished: rec.date || undefined,
        reviewRating:
          rec.rating > 0
            ? { '@type': 'Rating', ratingValue: rec.rating, bestRating: 5 }
            : undefined,
        // Sursa e obligatorie; o punem ca `publisher` al recenziei.
        publisher: { '@type': 'Organization', name: rec.source },
      }),
    )
}

/** Facilitățile locației, ca `LocationFeatureSpecification`. */
function amenitati(date: SiteData): Jsonld[] {
  return date.perks.items.map((p) => ({
    '@type': 'LocationFeatureSpecification',
    name: p.title,
    value: true,
  }))
}

/**
 * Schema principală: Hotel / Resort / LodgingBusiness pentru prima
 * pagină. Adresă, geo, telefon, facilități, stele, notă, recenzii.
 */
export function schemaCazare(date: SiteData, baseUrl: string): Jsonld {
  return curat({
    '@context': 'https://schema.org',
    '@type': tipCazare(date),
    '@id': url(baseUrl, '#cazare'),
    name: date.brand.name,
    description: date.seo.description || undefined,
    url: url(baseUrl),
    telephone: date.contact.phone || undefined,
    email: date.contact.email || undefined,
    image: date.seo.ogImage ? url(baseUrl, date.seo.ogImage) : undefined,
    priceRange: pretRange(date),
    starRating: date.brand.stars
      ? { '@type': 'Rating', ratingValue: date.brand.stars }
      : undefined,
    address: adresa(date),
    geo: geo(date),
    hasMap: date.contact.mapsUrl || undefined,
    aggregateRating: agregat(date),
    review: recenzii(date),
    amenityFeature: amenitati(date),
    checkinTime: undefined,
    sameAs: date.contact.social.map((s) => s.url),
  })
}

/** „$$" pentru schema, dedus din prețul minim al camerelor. */
function pretRange(date: SiteData): string | undefined {
  const preturi = date.rooms.items
    .map((c) => c.priceFrom)
    .filter((p): p is number => typeof p === 'number')
  if (!preturi.length) return undefined
  const min = Math.min(...preturi)
  if (min < 250) return '€'
  if (min < 500) return '€€'
  return '€€€'
}

/**
 * HotelRoom + Offer pentru o pagină de cameră. Prețul intră DOAR dacă e
 * confirmat (REGULI.md 3) — o cameră fără preț n-are `Offer`, dar
 * rămâne un `HotelRoom` valid.
 */
export function schemaCamera(camera: Room, date: SiteData, baseUrl: string): Jsonld {
  const caleCamera = `/camere/${camera.slug}`
  return curat({
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    '@id': url(baseUrl, `${caleCamera}#camera`),
    name: camera.name,
    description: camera.description || undefined,
    url: url(baseUrl, caleCamera),
    image: camera.image ? url(baseUrl, camera.image) : undefined,
    occupancy: camera.occupancy
      ? { '@type': 'QuantitativeValue', name: camera.occupancy }
      : undefined,
    bed: camera.bed || undefined,
    floorSize: camera.size
      ? { '@type': 'QuantitativeValue', name: camera.size }
      : undefined,
    // Offer doar din preț confirmat.
    offers:
      camera.priceFrom !== undefined
        ? curat({
            '@type': 'Offer',
            price: camera.priceFrom,
            priceCurrency: date.meta.currency,
            availability: 'https://schema.org/InStock',
            url: url(baseUrl, `${caleCamera}`),
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: camera.priceFrom,
              priceCurrency: date.meta.currency,
              unitText: 'noapte',
            },
          })
        : undefined,
    isPartOf: { '@type': 'LodgingBusiness', name: date.brand.name, '@id': url(baseUrl, '#cazare') },
  })
}

/**
 * Offer pentru o pagină de ofertă/excursie (T61). Prețul intră DOAR
 * dacă e confirmat și numeric (REGULI.md 3): un traseu de excursie fără
 * preț public rămâne un `Offer` valid, doar fără `price`.
 */
export function schemaOferta(oferta: Offer, date: SiteData, baseUrl: string): Jsonld {
  const cale = oferta.href ?? `/oferte/${oferta.slug}`
  const pretNumeric = numar(oferta.price)
  return curat({
    '@context': 'https://schema.org',
    '@type': 'Offer',
    '@id': url(baseUrl, `${cale}#oferta`),
    name: oferta.title,
    description: oferta.text || undefined,
    url: url(baseUrl, cale),
    image: oferta.image ? url(baseUrl, oferta.image) : undefined,
    price: pretNumeric,
    priceCurrency: pretNumeric !== undefined ? date.meta.currency : undefined,
    availability: 'https://schema.org/InStock',
    category: oferta.badge || undefined,
    offeredBy: {
      '@type': 'LodgingBusiness',
      name: date.brand.name,
      '@id': url(baseUrl, '#cazare'),
    },
  })
}

/** FAQPage din secțiunea de întrebări. */
export function schemaFaq(date: SiteData): Jsonld | null {
  if (!date.faq.items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: date.faq.items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/** Organization + WebSite pentru entitatea de brand. */
export function schemaOrganizatie(date: SiteData, baseUrl: string): Jsonld {
  return curat({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': url(baseUrl, '#org'),
    name: date.legal.company || date.brand.name,
    url: url(baseUrl),
    logo: date.brand.logo ? url(baseUrl, date.brand.logo) : undefined,
    sameAs: date.contact.social.map((s) => s.url),
  })
}

export function schemaWebsite(date: SiteData, baseUrl: string): Jsonld {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': url(baseUrl, '#website'),
    name: date.brand.name,
    url: url(baseUrl),
    inLanguage: date.meta.locale,
  }
}

/** BreadcrumbList pentru o pagină interioară. */
export function schemaBreadcrumb(
  cai: { nume: string; cale: string }[],
  baseUrl: string,
): Jsonld | null {
  if (cai.length < 2) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: cai.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.nume,
      item: url(baseUrl, c.cale),
    })),
  }
}

/** Menu din meniul restaurantului. */
export function schemaMeniu(
  categorii: {
    nume: string
    preparate: { nume: string; pret?: string; descriere?: string; gramaj?: string }[]
  }[],
  numeLocatie: string,
): Jsonld | null {
  if (!categorii.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `Meniu · ${numeLocatie}`,
    hasMenuSection: categorii.map((cat) => ({
      '@type': 'MenuSection',
      name: cat.nume,
      hasMenuItem: cat.preparate.map((p) =>
        curat({
          '@type': 'MenuItem',
          name: p.nume,
          description: p.descriere,
          // `suitableForDiet` n-ar avea ce citi aici; gramajul e cea mai
          // apropiată informație structurată reală despre porție.
          nutrition: p.gramaj
            ? { '@type': 'NutritionInformation', servingSize: p.gramaj }
            : undefined,
          offers: p.pret ? { '@type': 'Offer', price: p.pret } : undefined,
        }),
      ),
    })),
  }
}
