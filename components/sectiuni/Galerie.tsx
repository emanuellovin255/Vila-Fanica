'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/**
 * Galerie: grilă de thumbnail-uri, versiunea mare doar la deschidere.
 *
 * `"use client"` pentru lightbox. Economia e reală: thumbnail-ul din
 * listă e mic (`next/image` îl servește la ~400px), iar imaginea mare
 * se cere abia la click. O galerie care ar încărca toate pozele la
 * rezoluție mare ar rupe bugetul de greutate (standarde/02).
 *
 * Fără JavaScript, thumbnail-urile rămân vizibile — sunt `<Image>`-uri
 * reale, nu depind de lightbox. Doar mărirea la click lipsește.
 * Escape închide; focusul se întoarce unde era.
 */
export function Galerie({
  imagini,
  titluri,
  ui,
}: {
  imagini: string[]
  titluri?: string[]
  /** `date.ui` — eticheta butonului de închidere, în limba paginii. */
  ui: SiteData['ui']
}) {
  const [deschis, setDeschis] = useState<number | null>(null)

  useEffect(() => {
    if (deschis === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeschis(null)
      if (e.key === 'ArrowRight') setDeschis((i) => (i === null ? i : (i + 1) % imagini.length))
      if (e.key === 'ArrowLeft') setDeschis((i) => (i === null ? i : (i - 1 + imagini.length) % imagini.length))
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [deschis, imagini.length])

  if (!imagini.length) return null

  const alt = (i: number) => titluri?.[i] ?? `Fotografie ${i + 1}`

  return (
    <>
      <div className="gallery">
        {imagini.map((src, i) => (
          <button key={src} type="button" onClick={() => setDeschis(i)} aria-label={`Mărește: ${alt(i)}`}>
            <Image src={src} alt={alt(i)} width={400} height={300} sizes="(max-width: 820px) 50vw, 220px" loading="lazy" />
          </button>
        ))}
      </div>

      {deschis !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt(deschis)}
          onClick={() => setDeschis(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)' as unknown as number,
            display: 'grid',
            placeItems: 'center',
            padding: 'var(--sp-5)',
            background: 'var(--glass-scrolled)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <button
            type="button"
            aria-label={ui.inchide}
            onClick={() => setDeschis(null)}
            style={{ position: 'absolute', top: 'var(--sp-5)', insetInlineEnd: 'var(--sp-5)', color: 'var(--ink)' }}
          >
            <Icon name="close" marime="lg" />
          </button>
          <Image
            src={imagini[deschis]}
            alt={alt(deschis)}
            width={1600}
            height={1200}
            sizes="90vw"
            style={{ width: 'auto', height: 'auto', maxWidth: '90vw', maxHeight: '86vh', borderRadius: 'var(--r-md)' }}
            priority
          />
        </div>
      )}
    </>
  )
}
