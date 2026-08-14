/**
 * The technical audit of the source site.
 *
 * Every finding must cite something that was actually measured — a byte count, a
 * header value, a schema type. Findings with no evidence are dropped rather than
 * softened, because the improvements overlay puts these in front of a client and
 * a vague claim there is worse than no claim.
 */
import * as cheerio from 'cheerio'
import type { AuditFinding, AuditReport } from '../../content/types'
import { absolute, fetchPage, mapLimit, probeSize, sameHost } from './net'

const KB = 1024
const fmtKb = (b: number) => `${Math.round(b / KB)} KB`
const fmtMb = (b: number) => `${(b / KB / KB).toFixed(1)} MB`

/** Containers a browser cannot reliably decode, or that nobody should ship. */
const BAD_VIDEO = /\.(mov|avi|mkv|wmv|mpg|mpeg)(\?|$)/i

export interface AuditInput {
  url: string
  html: string
  headers: Headers
  bytes: number
}

export async function runAudit(input: AuditInput): Promise<AuditReport> {
  const { url, html, headers, bytes } = input
  const $ = cheerio.load(html)
  const findings: AuditFinding[] = []
  const metrics: AuditReport['metrics'] = { htmlBytes: bytes }

  /* ---------------------------------------------------------------- media */

  const mediaUrls = new Set<string>()
  $('video[src], video source[src], img[src]').each((_, el) => {
    const src = $(el).attr('src')
    const abs = src ? absolute(src, url) : null
    if (abs) mediaUrls.add(abs)
  })

  const videoUrls = [...mediaUrls].filter((u) => /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(u))
  const videoSizes = await mapLimit(videoUrls, 3, async (u) => ({ u, info: await probeSize(u) }))
  let largest: AuditReport['metrics']['largestMedia']
  for (const { u, info } of videoSizes) {
    if (!info) continue
    if (!largest || info.bytes > largest.bytes) {
      largest = { url: u, bytes: info.bytes, type: info.type }
    }
  }
  metrics.largestMedia = largest

  const autoplaying = $('video[autoplay]').length > 0
  if (largest && (BAD_VIDEO.test(largest.url) || largest.bytes > 3 * KB * KB)) {
    const badContainer = BAD_VIDEO.test(largest.url)
    findings.push({
      id: 'hero-video',
      severity: 'critic',
      area: 'performanta',
      title: badContainer ? 'Video în format neweb, servit în pagină' : 'Video prea greu în pagină',
      evidence:
        `${largest.url.split('/').pop()} are ${fmtMb(largest.bytes)}` +
        (badContainer ? ` și e servit ca ${largest.type || 'container non-web'}` : '') +
        (autoplaying ? ', cu autoplay la fiecare încărcare' : '') +
        '.',
      fix: 'Hero pe imagine statică optimizată, servită AVIF/WebP. Videoul, dacă rămâne, se încarcă la cerere și nu e niciodată resursa LCP.',
      anchor: 'hero',
    })
  }

  /* ------------------------------------------------------------ page weight */

  const cssHrefs = new Set<string>()
  const jsSrcs = new Set<string>()
  $('link[rel="stylesheet"][href]').each((_, el) => {
    const a = absolute($(el).attr('href')!, url)
    if (a) cssHrefs.add(a)
  })
  $('script[src]').each((_, el) => {
    const a = absolute($(el).attr('src')!, url)
    if (a) jsSrcs.add(a)
  })
  metrics.cssFiles = cssHrefs.size
  metrics.jsFiles = jsSrcs.size
  metrics.images = $('img').length

  const assets = [...cssHrefs, ...jsSrcs]
  const sizes = await mapLimit(assets, 6, (u) => probeSize(u))
  const assetBytes = sizes.reduce((sum, s) => sum + (s?.bytes ?? 0), 0)
  metrics.assetBytes = assetBytes

  if (cssHrefs.size + jsSrcs.size > 18 || assetBytes > 400 * KB) {
    findings.push({
      id: 'page-weight',
      severity: 'critic',
      area: 'performanta',
      title: 'Prea multe fișiere și prea mulți kilobytes pe prima încărcare',
      evidence: `${fmtKb(bytes)} HTML plus ${fmtKb(assetBytes)} din ${cssHrefs.size} fișiere CSS și ${jsSrcs.size} JS.`,
      fix: 'Componente proprii, fără page builder. CSS-ul critic e inline, restul se încarcă la nevoie.',
    })
  }

  /* ----------------------------------------------------------------- cache */

  const cc = headers.get('cache-control') ?? ''
  metrics.cacheControl = cc
  if (/no-store|no-cache/i.test(cc)) {
    findings.push({
      id: 'cache',
      severity: 'important',
      area: 'performanta',
      title: 'HTML-ul nu se cachează',
      evidence: `Serverul trimite Cache-Control: ${cc || '(gol)'} — fiecare vizitator regenerează pagina.`,
      fix: 'Pagini pre-randate, servite din CDN, cu revalidare incrementală la publicarea de conținut nou.',
    })
  }

  /* --------------------------------------------------------------- schema */

  const types = new Set<string>()
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text())
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk)
        if (node && typeof node === 'object') {
          const t = (node as Record<string, unknown>)['@type']
          if (typeof t === 'string') types.add(t)
          if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x))
          Object.values(node as Record<string, unknown>).forEach(walk)
        }
      }
      walk(json)
    } catch {
      /* malformed JSON-LD is itself invisible to Google; the missing-type check covers it */
    }
  })
  metrics.schemaTypes = [...types]

  const hasLodging = [...types].some((t) => /Hotel|LodgingBusiness|Resort|BedAndBreakfast/i.test(t))
  if (!hasLodging) {
    findings.push({
      id: 'schema',
      severity: 'critic',
      area: 'seo',
      title: 'Marcaj structurat greșit pentru un hotel',
      evidence: types.size
        ? `Pagina declară ${[...types].join(', ')} — niciun tip de cazare.`
        : 'Pagina nu conține deloc marcaj structurat.',
      fix: 'Hotel + LocalBusiness pe homepage, HotelRoom și Offer pe camere, AggregateRating și FAQPage unde există date reale.',
      anchor: 'rooms',
    })
  }

  const hasFaqMarkup = [...types].some((t) => /FAQPage/i.test(t))
  const looksLikeFaq =
    $('body').text().match(/întrebări frecvente|frequently asked|FAQ/i) !== null
  if (looksLikeFaq && !hasFaqMarkup) {
    findings.push({
      id: 'faq-schema',
      severity: 'important',
      area: 'seo',
      title: 'Secțiune de întrebări frecvente nemarcată',
      evidence: 'Pagina conține un bloc de întrebări frecvente, dar niciun marcaj FAQPage.',
      fix: 'Aceleași întrebări, marcate FAQPage, devin eligibile pentru afișare extinsă în rezultate.',
      anchor: 'faq',
    })
  }

  /* ------------------------------------------------------------ languages */

  const hreflang = $('link[rel="alternate"][hreflang]')
    .map((_, el) => $(el).attr('hreflang')!)
    .get()
  metrics.hreflang = hreflang
  metrics.lang = $('html').attr('lang')

  if (hreflang.length === 0) {
    findings.push({
      id: 'i18n',
      severity: 'important',
      area: 'seo',
      title: 'O singură limbă, fără alternative declarate',
      evidence: `Documentul e marcat lang="${metrics.lang ?? 'nedeclarat'}" și nu declară nicio versiune alternativă.`,
      fix: 'Versiune în engleză pe rute proprii, cu hreflang reciproc între variante.',
      anchor: 'locale',
    })
  }

  /* ----------------------------------------------------------------- meta */

  const title = $('title').text().trim()
  const desc = $('meta[name="description"]').attr('content')?.trim() ?? ''
  if (!desc) {
    findings.push({
      id: 'meta',
      severity: 'important',
      area: 'seo',
      title: 'Descriere lipsă în rezultatele Google',
      evidence: 'Pagina nu declară meta description, deci Google compune singur textul din rezultate.',
      fix: 'Titlu și descriere scrise pentru fiecare pagină, în fiecare limbă.',
    })
  } else if (title.length > 62) {
    findings.push({
      id: 'meta',
      severity: 'minor',
      area: 'seo',
      title: 'Titlu prea lung pentru rezultate',
      evidence: `Titlul are ${title.length} caractere și se va trunchia în listare.`,
      fix: 'Titluri sub 60 de caractere, cu termenul principal în față.',
    })
  }

  /* ----------------------------------------------------------- conversion */

  const bodyText = $('body').text()
  const priceHits = bodyText.match(/\d[\d.\s]*\s?(lei|ron|€|eur)\b/gi) ?? []
  metrics.pricesFound = priceHits.length
  if (priceHits.length < 3) {
    findings.push({
      id: 'prices',
      severity: 'critic',
      area: 'conversie',
      title: 'Prețurile nu sunt vizibile',
      evidence:
        priceHits.length === 0
          ? 'Nicio sumă afișată pe pagină — vizitatorul trebuie să plece de pe site ca să afle cât costă.'
          : `Doar ${priceHits.length} mențiuni de preț în toată pagina.`,
      fix: 'Preț „de la" pe fiecare cameră și pe fiecare pachet, marcat Offer pentru Google.',
      anchor: 'rooms',
    })
  }

  const bookingLinks = new Set<string>()
  $('a[href]').each((_, el) => {
    const href = absolute($(el).attr('href')!, url)
    if (!href) return
    if (/book|rezerv|reserv|wizard|availability|disponib/i.test(href)) bookingLinks.add(href)
  })
  const offsite = [...bookingLinks].find((h) => !sameHost(h, url))
  if (offsite) {
    let host = offsite
    try {
      host = new URL(offsite).host
    } catch {
      /* keep the raw string */
    }
    findings.push({
      id: 'booking',
      severity: 'critic',
      area: 'conversie',
      title: 'Rezervarea pleacă pe alt domeniu',
      evidence: `Butoanele de rezervare trimit către ${host}, în afara site-ului.`,
      fix: 'Calendar și disponibilitate direct în pagină; utilizatorul intră în motor abia la pasul de plată, cu datele deja completate.',
      anchor: 'booking',
    })
    findings.push({
      id: 'tracking',
      severity: 'important',
      area: 'tracking',
      title: 'Atribuirea campaniilor se rupe la rezervare',
      evidence: `Sesiunea trece de pe ${new URL(url).host} pe ${host}; fără linker cross-domain conversia apare ca trafic de recomandare.`,
      fix: 'Un singur flux de măsurare peste ambele domenii, cu evenimente de conversie definite pe pașii reali.',
    })
  }

  /* --------------------------------------------------------------- images */

  const rasters = $('img[src]')
    .map((_, el) => $(el).attr('src')!)
    .get()
  const legacy = rasters.filter((s) => /\.(jpe?g|png)(\?|$)/i.test(s)).length
  const modern = rasters.filter((s) => /\.(webp|avif)(\?|$)/i.test(s)).length
  if (legacy > modern && legacy > 5) {
    findings.push({
      id: 'images',
      severity: 'important',
      area: 'performanta',
      title: 'Imagini în formate vechi',
      evidence: `${legacy} imagini JPEG/PNG față de ${modern} în format modern.`,
      fix: 'Toate imaginile re-encodate AVIF/WebP, dimensionate pe punctul de afișare, cu lățime și înălțime declarate.',
    })
  }

  /* -------------------------------------------------------------- sitemap */

  try {
    const robots = await fetchPage(new URL('/robots.txt', url).href, 10_000)
    const smUrl = robots.body.match(/Sitemap:\s*(\S+)/i)?.[1]
    if (smUrl) {
      const sm = await fetchPage(smUrl, 15_000)
      const children = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
      let pages = children.length
      if (/sitemapindex/i.test(sm.body)) {
        const counts = await mapLimit(children.slice(0, 6), 3, async (child) => {
          try {
            const c = await fetchPage(child, 15_000)
            return [...c.body.matchAll(/<loc>/g)].length
          } catch {
            return 0
          }
        })
        pages = counts.reduce((a, b) => a + b, 0)
      }
      metrics.sitemapPages = pages
      if (pages > 0 && pages < 30) {
        findings.push({
          id: 'content-depth',
          severity: 'important',
          area: 'seo',
          title: 'Prea puține pagini pentru a domina căutările locale',
          evidence: `Sitemap-ul listează ${pages} adrese.`,
          fix: 'Pagini dedicate pentru fiecare intenție locală reală, nu conținut de umplutură.',
        })
      }
    }
  } catch {
    /* no robots/sitemap is not itself a finding worth reporting */
  }

  const order = { critic: 0, important: 1, minor: 2 }
  findings.sort((a, b) => order[a.severity] - order[b.severity])

  return {
    sourceUrl: url,
    generatedAt: new Date().toISOString(),
    findings,
    metrics,
  }
}
