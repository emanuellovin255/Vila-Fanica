/**
 * Derives the generated site's palette from the source brand.
 *
 * The point is that no two generated sites share a colour scheme: everything
 * below is computed from colours the source site actually uses (its stylesheets
 * and its logo), then corrected for contrast. Nothing here is a preset.
 */
import sharp from 'sharp'
import type { Palette } from '../../content/types'

/* ------------------------------------------------------------------ colour math */

export interface Rgb { r: number; g: number; b: number }
export interface Hsl { h: number; s: number; l: number }

export function hexToRgb(hex: string): Rgb | null {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6
  else if (max === G) h = ((B - R) / d + 2) / 6
  else h = ((R - G) / d + 4) / 6
  return { h: h * 360, s, l }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const H = ((h % 360) + 360) % 360 / 360
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return { r: hue(H + 1 / 3) * 255, g: hue(H) * 255, b: hue(H - 1 / 3) * 255 }
}

const hsl = (h: number, s: number, l: number) => rgbToHex(hslToRgb({ h, s, l }))

function luminance({ r, g, b }: Rgb): number {
  const f = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function contrast(a: string, b: string): number {
  const ra = hexToRgb(a), rb = hexToRgb(b)
  if (!ra || !rb) return 1
  const la = luminance(ra), lb = luminance(rb)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Walks lightness until the colour clears `target` contrast against `against`. */
function ensureContrast(color: string, against: string, target = 4.5): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  const base = rgbToHsl(rgb)
  const againstRgb = hexToRgb(against)
  const goDarker = againstRgb ? luminance(againstRgb) > 0.35 : true
  let { l } = base
  for (let i = 0; i < 60; i++) {
    const candidate = hsl(base.h, base.s, l)
    if (contrast(candidate, against) >= target) return candidate
    l += goDarker ? -0.015 : 0.015
    if (l <= 0.02 || l >= 0.98) break
  }
  return hsl(base.h, base.s, goDarker ? 0.12 : 0.95)
}

/* ------------------------------------------------ harvesting colours from source */

const NAMED_SKIP = /^(transparent|inherit|currentcolor|initial|unset|none)$/i

/** Counts every colour literal in a stylesheet, weighted by how often it appears. */
export function colorsFromCss(css: string): Map<string, number> {
  const counts = new Map<string, number>()
  const bump = (hex: string, by = 1) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return
    counts.set(hex.toLowerCase(), (counts.get(hex.toLowerCase()) ?? 0) + by)
  }

  for (const m of css.matchAll(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g)) {
    const rgb = hexToRgb(m[0])
    if (rgb) bump(rgbToHex(rgb))
  }
  for (const m of css.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) {
    bump(rgbToHex({ r: +m[1], g: +m[2], b: +m[3] }))
  }
  // Declared custom properties are far better brand signals than incidental
  // colours buried in a theme's default stylesheet, so weight them heavily.
  for (const m of css.matchAll(/--[\w-]*(?:brand|primary|accent|main|theme)[\w-]*\s*:\s*([^;]+);/gi)) {
    const val = m[1].trim()
    if (NAMED_SKIP.test(val)) continue
    const hex = val.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/)
    if (hex) {
      const rgb = hexToRgb(hex[0])
      if (rgb) bump(rgbToHex(rgb), 40)
    }
  }
  return counts
}

/** Dominant chromatic colours in an image, ignoring near-neutral pixels. */
export async function colorsFromImage(buf: Buffer): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  try {
    const { data, info } = await sharp(buf)
      .resize(64, 64, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const buckets = new Map<string, { n: number; r: number; g: number; b: number }>()
    for (let i = 0; i < data.length; i += info.channels) {
      const a = info.channels === 4 ? data[i + 3] : 255
      if (a < 200) continue
      const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] }
      const { h, s, l } = rgbToHsl(rgb)
      if (s < 0.18 || l < 0.06 || l > 0.94) continue // skip neutrals and blowouts
      const key = `${Math.round(h / 15)}:${Math.round(s * 4)}:${Math.round(l * 4)}`
      const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
      buckets.set(key, { n: cur.n + 1, r: cur.r + rgb.r, g: cur.g + rgb.g, b: cur.b + rgb.b })
    }
    for (const { n, r, g, b } of buckets.values()) {
      if (n < 4) continue
      counts.set(rgbToHex({ r: r / n, g: g / n, b: b / n }), n)
    }
  } catch {
    /* an unreadable logo simply contributes nothing */
  }
  return counts
}

/* ------------------------------------------------------------- palette assembly */

interface Candidate { hex: string; score: number; hsl: Hsl }

function rank(counts: Map<string, number>): Candidate[] {
  const out: Candidate[] = []
  for (const [hex, n] of counts) {
    const rgb = hexToRgb(hex)
    if (!rgb) continue
    const h = rgbToHsl(rgb)
    if (h.s < 0.12) continue          // greys carry no brand signal
    if (h.l > 0.92 || h.l < 0.05) continue
    // Favour colours that are both frequent and genuinely chromatic.
    out.push({ hex, score: n * (0.4 + h.s), hsl: h })
  }
  return out.sort((a, b) => b.score - a.score)
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Builds a full palette from harvested colours.
 *
 * Brand = the strongest chromatic signal, darkened enough to carry white text.
 * Accent = the strongest candidate far enough away in hue to read as a second
 * colour; if the brand is the only hue present, the accent is derived from it
 * rather than invented, which keeps single-colour brands coherent.
 */
export function buildPalette(
  cssColors: Map<string, number>,
  logoColors: Map<string, number>
): Palette {
  const merged = new Map<string, number>(cssColors)
  // The logo is the most deliberate colour decision a brand makes.
  for (const [hex, n] of logoColors) merged.set(hex, (merged.get(hex) ?? 0) + n * 12)

  const ranked = rank(merged)
  const fallback: Hsl = { h: 205, s: 0.32, l: 0.24 }
  const brandHsl = ranked[0]?.hsl ?? fallback

  // Deep enough for white text and for large dark bands.
  const brandL = Math.min(0.3, Math.max(0.16, brandHsl.l > 0.5 ? 0.24 : brandHsl.l))
  const brandS = Math.min(0.72, Math.max(0.22, brandHsl.s))
  let brand = hsl(brandHsl.h, brandS, brandL)
  brand = ensureContrast(brand, '#ffffff', 7)

  const far = ranked.find((c) => hueDistance(c.hsl.h, brandHsl.h) > 45 && c.hsl.s > 0.25)
  const accentHue = far ? far.hsl.h : (brandHsl.h + 34) % 360
  const accentSat = far ? Math.min(0.62, Math.max(0.3, far.hsl.s)) : 0.44
  // Accent must read on the light ground; it is used for prices and eyebrows.
  const accent = ensureContrast(hsl(accentHue, accentSat, 0.42), '#fffdf9', 4.5)
  const accentLift = hsl(accentHue, Math.min(0.7, accentSat + 0.06), 0.62)

  // Neutrals inherit a trace of the brand hue so they read as chosen, not default.
  const nh = brandHsl.h
  const canvas = hsl(nh, 0.16, 0.985)
  const surface = '#ffffff'
  const surfaceAlt = hsl(nh, 0.14, 0.955)
  const line = hsl(nh, 0.12, 0.885)
  const ink = hsl(nh, 0.22, 0.1)
  const inkSoft = hsl(nh, 0.14, 0.24)
  const muted = ensureContrast(hsl(nh, 0.1, 0.44), canvas, 4.5)

  return {
    ink,
    inkSoft,
    muted,
    line,
    canvas,
    surface,
    surfaceAlt,
    brand,
    brandLift: hsl(brandHsl.h, brandS, Math.min(0.42, brandL + 0.1)),
    onBrand: '#ffffff',
    accent,
    accentLift,
    positive: ensureContrast(hsl(152, 0.42, 0.34), canvas, 4.5),
    attention: ensureContrast(hsl(18, 0.62, 0.42), '#ffffff', 4.5),
  }
}

/** Rough read of whether the source brand presents as classic or contemporary. */
export function readCharacter(css: string, html: string): 'classic' | 'contemporary' | 'warm' | 'coastal' {
  const fonts = [...css.matchAll(/font-family\s*:\s*([^;}]+)/gi)].map((m) => m[1].toLowerCase()).join(' ')
  const serif = /garamond|didot|playfair|cormorant|baskerville|georgia|times|serif/.test(fonts)
  const geometric = /futura|poppins|montserrat|jost|outfit/.test(fonts)
  const text = html.toLowerCase()
  if (/mare|litoral|delta|beach|seaside|marin/.test(text)) return 'coastal'
  if (serif && !geometric) return 'classic'
  if (/rustic|traditional|conac|han |pensiune|cabana/.test(text)) return 'warm'
  return 'contemporary'
}
