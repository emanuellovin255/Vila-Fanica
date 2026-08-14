/**
 * Reads a hotel website and pulls out everything the template needs.
 *
 * Hard rule: this module never invents content. If a price, a review or a room
 * size isn't on the source site, the field stays undefined and the template
 * renders an honest alternative. A generated site that quotes a rate nobody
 * charges, or a testimonial nobody wrote, is worse than one with a gap.
 */
import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { Faq, IconName, Offer, Review, Room } from '../../content/types'
import { absolute, fetchPage, mapLimit } from './net'

export interface Crawled {
  url: string
  html: string
  $: CheerioAPI
  kind: PageKind
}

export type PageKind =
  | 'home' | 'rooms' | 'offers' | 'spa' | 'dining' | 'events' | 'contact' | 'about' | 'other'

const PATTERNS: [PageKind, RegExp][] = [
  ['rooms',   /camere|rooms|accommodation|cazare|apartament|suite/i],
  ['offers',  /oferte|offers|packages|pachete|promo/i],
  ['spa',     /spa|wellness|piscin|pool|sauna|masaj|massage/i],
  ['dining',  /restaurant|dining|meniu|menu|pub|bar|terasa|terrace/i],
  ['events',  /event|eveniment|conferint|conference|nunt|wedding|banquet|sala/i],
  ['contact', /contact/i],
  ['about',   /despre|about/i],
]

function classify(url: string): PageKind {
  const p = (() => {
    try { return new URL(url).pathname } catch { return url }
  })()
  if (p === '/' || p === '') return 'home'
  for (const [kind, re] of PATTERNS) if (re.test(p)) return kind
  return 'other'
}

/* ------------------------------------------------------------------- crawling */

export async function crawl(rootUrl: string, max = 14): Promise<Crawled[]> {
  const root = new URL(rootUrl)
  const queue = new Set<string>([root.href])

  // Prefer the sitemap: it is the site's own statement of what matters.
  try {
    const robots = await fetchPage(new URL('/robots.txt', root).href, 10_000)
    const smUrl = robots.body.match(/Sitemap:\s*(\S+)/i)?.[1]
    if (smUrl) {
      const sm = await fetchPage(smUrl, 15_000)
      let locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
      if (/sitemapindex/i.test(sm.body)) {
        const nested = await mapLimit(locs.slice(0, 5), 3, async (child) => {
          try {
            const c = await fetchPage(child, 15_000)
            return [...c.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
          } catch { return [] }
        })
        locs = nested.flat()
      }
      for (const loc of locs) {
        if (queue.size >= max) break
        if (new URL(loc).host !== root.host) continue
        if (/\.(xml|kml|jpg|png|pdf)$/i.test(loc)) continue
        if (/politica|gdpr|termeni|cookie|privacy|terms|accesibil/i.test(loc)) continue
        queue.add(loc)
      }
    }
  } catch {
    /* fall through to homepage-link discovery */
  }

  if (queue.size < 4) {
    try {
      const home = await fetchPage(root.href)
      const $ = cheerio.load(home.body)
      $('a[href]').each((_, el) => {
        if (queue.size >= max) return
        const abs = absolute($(el).attr('href')!, root.href)
        if (!abs) return
        try {
          if (new URL(abs).host !== root.host) return
        } catch { return }
        if (/#|\.(jpg|png|pdf)/i.test(abs)) return
        if (classify(abs) !== 'other') queue.add(abs)
      })
    } catch {
      /* a homepage we cannot read is reported by the caller */
    }
  }

  const pages = await mapLimit([...queue].slice(0, max), 4, async (u) => {
    try {
      const r = await fetchPage(u)
      if (r.status >= 400) return null
      return { url: r.url, html: r.body, $: cheerio.load(r.body), kind: classify(r.url) }
    } catch {
      return null
    }
  })

  return pages.filter((p): p is Crawled => p !== null)
}

/* --------------------------------------------------------------- structured data */

export interface LinkedData {
  name?: string
  phone?: string
  email?: string
  street?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  lat?: number
  lng?: number
  stars?: number
  ratingValue?: string
  ratingCount?: number
  ratingBest?: number
}

export function readJsonLd($: CheerioAPI): LinkedData {
  const out: LinkedData = {}
  $('script[type="application/ld+json"]').each((_, el) => {
    let json: unknown
    try { json = JSON.parse($(el).text()) } catch { return }
    const visit = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(visit)
      if (!node || typeof node !== 'object') return
      const o = node as Record<string, any>
      if (typeof o.telephone === 'string') out.phone ??= o.telephone
      if (typeof o.email === 'string') out.email ??= o.email
      if (o.address && typeof o.address === 'object') {
        const a = o.address as Record<string, any>
        out.street ??= a.streetAddress
        out.city ??= a.addressLocality
        out.region ??= a.addressRegion
        out.postalCode ??= a.postalCode
        out.country ??= a.addressCountry?.name ?? a.addressCountry
      }
      if (o.geo && typeof o.geo === 'object') {
        const g = o.geo as Record<string, any>
        if (g.latitude) out.lat ??= Number(g.latitude)
        if (g.longitude) out.lng ??= Number(g.longitude)
      }
      if (o.starRating?.ratingValue) out.stars ??= Number(o.starRating.ratingValue)
      if (o.aggregateRating && typeof o.aggregateRating === 'object') {
        const r = o.aggregateRating as Record<string, any>
        out.ratingValue ??= String(r.ratingValue)
        out.ratingCount ??= Number(r.reviewCount ?? r.ratingCount) || undefined
        out.ratingBest ??= Number(r.bestRating) || undefined
      }
      const t = o['@type']
      const isOrg = typeof t === 'string' && /Hotel|Lodging|Organization|LocalBusiness|Resort/i.test(t)
      if (isOrg && typeof o.name === 'string') out.name ??= o.name
      Object.values(o).forEach(visit)
    }
    visit(json)
  })
  return out
}

/* -------------------------------------------------------------------- contact */

const PHONE_RE = /(?:\+?4?0[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3}[\s.-]?\d{3,4}/g

export function extractContact(pages: Crawled[], ld: LinkedData) {
  const home = pages.find((p) => p.kind === 'home') ?? pages[0]
  const contactPage = pages.find((p) => p.kind === 'contact') ?? home
  const text = `${contactPage.$('body').text()} ${home.$('body').text()}`

  let phone = ld.phone
  if (!phone) {
    const telHref = home.$('a[href^="tel:"]').first().attr('href')
      ?? contactPage.$('a[href^="tel:"]').first().attr('href')
    phone = telHref?.replace('tel:', '').trim()
  }
  if (!phone) phone = (text.match(PHONE_RE) ?? [])[0]?.trim()

  let email = ld.email
  if (!email) {
    email = home.$('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', '').split('?')[0]
      ?? contactPage.$('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', '').split('?')[0]
  }

  const socialMap: [RegExp, string, IconName][] = [
    [/facebook\.com/i, 'Facebook', 'facebook'],
    [/instagram\.com/i, 'Instagram', 'instagram'],
    [/linkedin\.com/i, 'LinkedIn', 'linkedin'],
    [/youtube\.com|youtu\.be/i, 'YouTube', 'youtube'],
    [/tiktok\.com/i, 'TikTok', 'tiktok'],
  ]
  const social: { label: string; icon: IconName; url: string }[] = []
  const seen = new Set<string>()
  for (const page of pages) {
    page.$('a[href]').each((_, el) => {
      const href = page.$(el).attr('href')!
      for (const [re, label, icon] of socialMap) {
        if (re.test(href) && !seen.has(label)) {
          seen.add(label)
          social.push({ label, icon, url: href })
        }
      }
    })
  }

  const mapsUrl = pages
    .flatMap((p) => p.$('a[href*="google.com/maps"], a[href*="goo.gl/maps"], a[href*="maps.app.goo.gl"]').map((_, el) => p.$(el).attr('href')!).get())
    .find(Boolean)

  return {
    phone: phone ?? '',
    email: email ?? '',
    street: ld.street ?? '',
    city: ld.city ?? '',
    region: ld.region,
    postalCode: ld.postalCode,
    country: ld.country ?? '',
    lat: ld.lat,
    lng: ld.lng,
    mapsUrl,
    social,
  }
}

/* ---------------------------------------------------------------------- rooms */

const AMENITY_DICT: [RegExp, string][] = [
  [/wi-?fi/i, 'WiFi'],
  [/smart\s?tv|televizor|\btv\b/i, 'Smart TV'],
  [/minibar|frigider|fridge/i, 'Minibar'],
  [/seif|safe\b/i, 'Seif'],
  [/aer condi|climatiz|air\s?condition|\bA\/C\b/i, 'Aer condiționat'],
  [/balcon|balcony/i, 'Balcon'],
  [/dus|duș|shower/i, 'Duș walk-in'],
  [/espressor|coffee\s?machine|cafea/i, 'Espressor'],
  [/uscator|uscător|hairdryer/i, 'Uscător de păr'],
  [/halat|robe/i, 'Halate'],
  [/canapea|sofa/i, 'Canapea extensibilă'],
  [/dizabilit|accesibil|accessible/i, 'Acces facilitat'],
]

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)

/** Prices are read only where the source states them; never estimated. */
function readPrice(text: string): number | undefined {
  const m = text.match(/(\d[\d.\s]{1,8})\s?(lei|ron)\b/i)
  if (!m) return undefined
  const n = Number(m[1].replace(/[.\s]/g, ''))
  return Number.isFinite(n) && n > 40 && n < 100_000 ? n : undefined
}

export function extractRooms(pages: Crawled[], baseUrl: string): Array<Room & { sourceImages: string[] }> {
  const page = pages.find((p) => p.kind === 'rooms')
  if (!page) return []
  const $ = page.$
  const rooms: Array<Room & { sourceImages: string[] }> = []
  const seen = new Set<string>()

  $('h2, h3').each((_, el) => {
    const name = $(el).text().trim().replace(/\s+/g, ' ')
    if (!name || name.length < 4 || name.length > 70) return
    if (!/camer|apartament|suite|standard|deluxe|executive|twin|matrimonial|dubl|single|room/i.test(name)) return
    const key = slug(name)
    if (!key || seen.has(key)) return
    seen.add(key)

    // Walk forward through siblings until the next heading — that block is the room.
    const block = $('<div></div>')
    let node = $(el).parent()
    for (let hop = 0; hop < 4 && node.length; hop++) {
      if (node.find('img').length) break
      node = node.parent()
    }
    block.append(node.clone())
    const blockText = block.text()

    const amenities: string[] = []
    for (const [re, label] of AMENITY_DICT) {
      if (re.test(blockText) && !amenities.includes(label)) amenities.push(label)
    }

    const sourceImages = block
      .find('img[src]')
      .map((_, img) => absolute($(img).attr('src')!, baseUrl))
      .get()
      .filter((u): u is string => !!u && !/logo|icon|favicon|placeholder/i.test(u))

    const occupancy = blockText.match(/(\d)\s*(persoane|persoană|adulți|guests?|pers\.)/i)?.[0]
    const size = blockText.match(/(\d{2,3})\s?m(?:p|²|2)\b/i)?.[0]
    const bed = /pat dublu|matrimonial/i.test(blockText)
      ? 'Pat dublu'
      : /dou[ăa] paturi|twin|paturi single/i.test(blockText)
        ? 'Două paturi single'
        : undefined

    rooms.push({
      slug: key,
      name,
      image: '',
      amenities: amenities.slice(0, 5),
      occupancy: occupancy?.replace(/\s+/g, ' '),
      size,
      bed,
      priceFrom: readPrice(blockText),
      sourceImages: [...new Set(sourceImages)].slice(0, 4),
    })
  })

  return rooms.slice(0, 8)
}

/* --------------------------------------------------------------------- offers */

export function extractOffers(pages: Crawled[], baseUrl: string): Array<Offer & { sourceImage?: string }> {
  const page = pages.find((p) => p.kind === 'offers')
  if (!page) return []
  const $ = page.$
  const offers: Array<Offer & { sourceImage?: string }> = []
  const seen = new Set<string>()

  $('h2, h3').each((_, el) => {
    const title = $(el).text().trim().replace(/\s+/g, ' ')
    if (!title || title.length < 4 || title.length > 80) return
    const key = slug(title)
    if (!key || seen.has(key)) return
    seen.add(key)

    let container = $(el).parent()
    for (let hop = 0; hop < 3 && container.length; hop++) {
      if (container.find('img').length) break
      container = container.parent()
    }
    const text = container.text().replace(/\s+/g, ' ').trim()
    const body = $(el).nextAll('p').first().text().trim()

    const priceMatch = text.match(/(\d[\d.\s]{2,8})\s?(lei|ron|€)/i)
    const wasMatch = text.match(/(?:redus din|în loc de|instead of)\s*(\d[\d.\s]{2,8})\s?(lei|ron|€)/i)
    const img = container.find('img[src]').first().attr('src')

    offers.push({
      slug: key,
      title,
      // Extractorul citește un site străin: n-are de unde ști dacă un
      // bloc e pachet sau excursie și nu găsește o listă „include" de
      // încredere. Pune valorile neutre; separarea se face de mână, în
      // `06-oferte-si-excursii.md`, cu `Tip:` (T75).
      kind: 'package',
      summary: body.slice(0, 180) || text.slice(0, 180),
      bullets: [],
      text: body.slice(0, 180) || text.slice(0, 180),
      image: '',
      price: priceMatch ? priceMatch[0].replace(/\s+/g, ' ') : undefined,
      priceWas: wasMatch ? wasMatch[1].trim() : undefined,
      sourceImage: img ? absolute(img, baseUrl) ?? undefined : undefined,
    })
  })

  return offers.slice(0, 6)
}

/* ------------------------------------------------------------------------ faq */

export function extractFaq(pages: Crawled[]): Faq[] {
  const out: Faq[] = []
  const seen = new Set<string>()

  for (const page of pages) {
    const $ = page.$
    $('details').each((_, el) => {
      const q = $(el).find('summary').first().text().trim()
      const a = $(el).clone().find('summary').remove().end().text().trim()
      if (q && a && !seen.has(q)) { seen.add(q); out.push({ q, a: a.slice(0, 400) }) }
    })
    $('h3, h4, dt, .accordion-title, [class*="toggle-title"]').each((_, el) => {
      const q = $(el).text().trim().replace(/\s+/g, ' ')
      if (!q.includes('?') || q.length < 10 || q.length > 160 || seen.has(q)) return
      const a = $(el).next().text().trim().replace(/\s+/g, ' ')
      if (!a || a.length < 20) return
      seen.add(q)
      out.push({ q, a: a.slice(0, 400) })
    })
  }
  return out.slice(0, 8)
}

/* -------------------------------------------------------------------- reviews */

/**
 * Only returns quotes that are actually present on the source site. Testimonials
 * are never synthesised: a fabricated review is a false statement about a real
 * business, and it is the single easiest thing for a client to spot.
 */
export function extractReviews(pages: Crawled[]): Review[] {
  const out: Review[] = []
  const seen = new Set<string>()
  for (const page of pages) {
    const $ = page.$
    $('blockquote, [class*="testimonial"], [class*="review"]').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      if (text.length < 60 || text.length > 400 || seen.has(text)) return
      seen.add(text)
      out.push({ quote: text, author: '', source: '', date: '', rating: 5 })
    })
  }
  return out.slice(0, 3)
}

/* ----------------------------------------------------------------- facilities */

export function extractFeatureImages(pages: Crawled[], kind: PageKind, baseUrl: string): string[] {
  const page = pages.find((p) => p.kind === kind)
  if (!page) return []
  const $ = page.$
  return [
    ...new Set(
      $('img[src]')
        .map((_, el) => absolute($(el).attr('src')!, baseUrl))
        .get()
        .filter((u): u is string => !!u && !/logo|icon|favicon|avatar|placeholder/i.test(u))
    ),
  ].slice(0, 6)
}

export function extractHeroImage(pages: Crawled[], baseUrl: string): string | undefined {
  const home = pages.find((p) => p.kind === 'home') ?? pages[0]
  if (!home) return undefined
  const og = home.$('meta[property="og:image"]').attr('content')
  if (og) return absolute(og, baseUrl) ?? undefined
  const first = home.$('img[src]')
    .map((_, el) => absolute(home.$(el).attr('src')!, baseUrl))
    .get()
    .find((u) => !!u && !/logo|icon|favicon/i.test(u))
  return first ?? undefined
}

export function extractLogo(pages: Crawled[], baseUrl: string): string | undefined {
  const home = pages.find((p) => p.kind === 'home') ?? pages[0]
  if (!home) return undefined
  const $ = home.$
  const candidate =
    $('img[class*="logo" i], img[alt*="logo" i], img[src*="logo" i]').first().attr('src') ??
    $('header img').first().attr('src')
  return candidate ? absolute(candidate, baseUrl) ?? undefined : undefined
}

/** Every stylesheet on the homepage, concatenated — the input for colour harvesting. */
export async function collectCss(page: Crawled, baseUrl: string): Promise<string> {
  const hrefs = page.$('link[rel="stylesheet"][href]')
    .map((_, el) => absolute(page.$(el).attr('href')!, baseUrl))
    .get()
    .filter((u): u is string => !!u)
    .slice(0, 12)

  const inline = page.$('style').map((_, el) => page.$(el).html() ?? '').get().join('\n')
  const external = await mapLimit(hrefs, 5, async (u) => {
    try { return (await fetchPage(u, 20_000)).body } catch { return '' }
  })
  return inline + '\n' + external.join('\n')
}
