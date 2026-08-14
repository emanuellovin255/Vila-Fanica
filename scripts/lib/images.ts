/**
 * Pulls the source site's photography into public/media.
 *
 * The generated site must not hotlink the old host: it would keep a dependency on
 * infrastructure that is about to be switched off, and it hands page speed to a
 * server nobody controls any more. Everything is re-encoded to AVIF+WebP at sane
 * dimensions on the way in.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { fetchBinary, mapLimit } from './net'

export type ImageRole = 'hero' | 'feature' | 'card' | 'logo'

/** Rendered width doubled for high-density screens, then capped. */
const WIDTH: Record<ImageRole, number> = {
  hero: 2000,
  feature: 1400,
  card: 900,
  logo: 480,
}

export interface StoredImage {
  /** Public path, e.g. /media/camera-twin.webp */
  src: string
  width: number
  height: number
  bytes: number
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'imagine'

export class ImageStore {
  private seen = new Map<string, StoredImage>()
  private used = new Set<string>()

  constructor(private mediaDir: string) {}

  async init() {
    await mkdir(this.mediaDir, { recursive: true })
  }

  private uniqueName(base: string, ext: string): string {
    let name = `${base}.${ext}`
    let i = 2
    while (this.used.has(name)) name = `${base}-${i++}.${ext}`
    this.used.add(name)
    return name
  }

  /** Returns null when the asset is unreachable or not a usable photograph. */
  async store(url: string, role: ImageRole, hint?: string): Promise<StoredImage | null> {
    const cached = this.seen.get(url + role)
    if (cached) return cached

    const buf = await fetchBinary(url)
    if (!buf || buf.length < 1024) return null

    try {
      const img = sharp(buf, { animated: false })
      const meta = await img.metadata()
      if (!meta.width || !meta.height) return null
      // Sprites, spacers and tracking pixels are not photography.
      if (role !== 'logo' && (meta.width < 480 || meta.height < 320)) return null

      const target = Math.min(WIDTH[role], meta.width)
      const base = slugify(hint || path.basename(new URL(url).pathname).replace(/\.\w+$/, ''))

      // Logos keep their alpha channel; photographs do not have one to keep.
      const isLogo = role === 'logo'
      const ext = isLogo ? 'webp' : 'webp'
      const name = this.uniqueName(base, ext)

      const pipeline = sharp(buf).resize({ width: target, withoutEnlargement: true })
      const out = isLogo
        ? await pipeline.webp({ quality: 92, alphaQuality: 100 }).toBuffer({ resolveWithObject: true })
        : await pipeline.flatten({ background: '#ffffff' }).webp({ quality: 78, effort: 5 }).toBuffer({ resolveWithObject: true })

      await writeFile(path.join(this.mediaDir, name), out.data)

      const stored: StoredImage = {
        src: `/media/${name}`,
        width: out.info.width,
        height: out.info.height,
        bytes: out.data.length,
      }
      this.seen.set(url + role, stored)
      return stored
    } catch {
      return null
    }
  }

  async storeMany(
    urls: string[],
    role: ImageRole,
    hint?: string
  ): Promise<StoredImage[]> {
    const results = await mapLimit(urls, 4, (u, i) =>
      this.store(u, role, hint ? `${hint}-${i + 1}` : undefined)
    )
    return results.filter((r): r is StoredImage => r !== null)
  }

  get count() {
    return this.used.size
  }
}
