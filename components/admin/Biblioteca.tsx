'use client'

/* ============================================================
   Biblioteca.tsx — pozele site-ului: le vezi, urci altele, ștergi.

   Parte din panoul de administrare, o modificare locală față de
   motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.

   MICȘORAREA SE FACE AICI, ÎN BROWSER
   -----------------------------------
   O poză făcută cu telefonul are 8–12 MB și 4000 px pe latura mare. În
   repo n-are ce căuta: îl umflă permanent, încetinește fiecare `git
   clone` și fiecare build, iar site-ul o servește oricum redimensionată.

   Deci poza trece prin `<canvas>`, se reduce la 2400 px și iese `.webp`
   la calitate 0,82 — de obicei 200–400 KB. Abia atunci pleacă spre
   server. Câștigul: gazda poate trage poze direct de pe telefon, pe o
   conexiune slabă, fără să știe ce e un „format web" — și fără `sharp`
   într-o funcție serverless.

   Numele se curăță tot aici: fără diacritice, fără spații, cu cratime.
   `IMG_20240712_154233.jpg` devine ceva ce se poate citi într-un fișier.
   ============================================================ */

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Poza {
  nume: string
  fel: 'imagine' | 'video'
  marime: number
}

/** Latura mare, în pixeli. Peste asta nu se vede pe niciun ecran. */
const LATURA_MAX = 2400
const CALITATE = 0.82

export function Biblioteca() {
  const [poze, setPoze] = useState<Poza[]>([])
  const [incarc, setIncarc] = useState(true)
  const [lucrez, setLucrez] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [eroare, setEroare] = useState('')
  const intrare = useRef<HTMLInputElement>(null)

  const reincarca = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/poze')
      if (r.ok) setPoze(((await r.json()) as { poze: Poza[] }).poze)
      else setEroare('Nu am putut citi lista de poze.')
    } catch {
      setEroare('Nu am reușit să ajung la server.')
    } finally {
      setIncarc(false)
    }
  }, [])

  useEffect(() => {
    void reincarca()
  }, [reincarca])

  async function urca(fisiere: FileList) {
    setEroare('')
    setMesaj('')
    let urcate = 0

    for (const f of Array.from(fisiere)) {
      setLucrez(f.name)
      try {
        const { nume, date } = await pregateste(f)
        const r = await fetch('/api/admin/poze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nume, date }),
        })
        const j = await r.json()
        if (!r.ok) {
          setEroare(`${f.name}: ${j.eroare ?? 'nu s-a putut încărca.'}`)
          break
        }
        urcate++
      } catch (e) {
        setEroare(`${f.name}: ${(e as Error).message}`)
        break
      }
    }

    setLucrez('')
    if (urcate) setMesaj(`${urcate === 1 ? 'O poză' : `${urcate} poze`} încărcate. Alege-le acum la camere sau la oferte.`)
    await reincarca()
    if (intrare.current) intrare.current.value = ''
  }

  async function stergePoza(nume: string, oricum = false) {
    setEroare('')
    setMesaj('')
    const r = await fetch(`/api/admin/poze?nume=${encodeURIComponent(nume)}${oricum ? '&oricum=da' : ''}`, {
      method: 'DELETE',
    })
    const j = await r.json()
    if (!r.ok) {
      if (j.folosita && !oricum) {
        const sigur = window.confirm(`${j.eroare}\n\nȘtergi oricum?`)
        if (sigur) await stergePoza(nume, true)
        return
      }
      setEroare(j.eroare ?? 'Nu am putut șterge.')
      return
    }
    setMesaj(`„${nume}" a fost ștearsă.`)
    await reincarca()
  }

  return (
    <>
      <header className="p-antet">
        <Link href="/admin" className="p-inapoi">
          ← Panou
        </Link>
        <span className="p-spatiu" />
      </header>

      <main className="p-corp">
        <h1 className="p-titlu-pagina">Pozele</h1>
        <p className="p-unde">
          Toate pozele și clipurile site-ului. Le pui aici o dată, apoi le alegi la camere, la oferte
          sau pe prima pagină.
        </p>

        {eroare && <p className="p-mesaj p-mesaj--eroare">{eroare}</p>}
        {mesaj && <p className="p-mesaj p-mesaj--bine">{mesaj}</p>}

        <div className="p-card">
          <h2>Încarcă poze</h2>
          <p className="p-ajutor-bloc">
            Alege una sau mai multe. Poți trage direct poze de pe telefon, oricât de mari — panoul le
            micșorează singur înainte să le trimită.
          </p>
          <input
            ref={intrare}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            disabled={Boolean(lucrez)}
            onChange={(e) => e.target.files && void urca(e.target.files)}
          />
          {lucrez && <p className="p-ajutor">Se pregătește „{lucrez}"…</p>}
        </div>

        {incarc ? (
          <p className="p-incarcare">Se încarcă…</p>
        ) : (
          <>
            <p className="p-unde">
              {poze.length} {poze.length === 1 ? 'fișier' : 'fișiere'} în folder.
            </p>
            <div className="p-poze-grila">
              {poze.map((p) => (
                <figure key={p.nume} style={{ margin: 0 }}>
                  <div className="p-poza" style={{ cursor: 'default' }}>
                    {p.fel === 'video' ? (
                      <video src={`/api/admin/poza/${encodeURIComponent(p.nume)}`} muted playsInline preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/admin/poza/${encodeURIComponent(p.nume)}`}
                        alt={p.nume}
                        loading="lazy"
                        width={400}
                        height={300}
                      />
                    )}
                    <span className="p-poza-nume">{p.nume}</span>
                  </div>
                  <button
                    type="button"
                    className="p-btn p-btn--pericol p-btn--mic"
                    style={{ width: '100%', marginTop: 6 }}
                    onClick={() => void stergePoza(p.nume)}
                  >
                    Șterge
                  </button>
                </figure>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}

/* ------------------------------------------------------------------ */

/** Numele fișierului, curățat: fără diacritice, fără spații, cu cratime. */
function curataNume(brut: string, extensie: string): string {
  const fara = brut
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[șş]/gi, 's')
    .replace(/[țţ]/gi, 't')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${fara || 'poza'}.${extensie}`
}

/**
 * Micșorează o imagine și o dă în `.webp`. Clipurile trec neatinse —
 * un video nu se poate recompresa în browser, iar unul de peste 6 MB e
 * respins de server cu un mesaj clar.
 */
async function pregateste(f: File): Promise<{ nume: string; date: string }> {
  const esteVideo = f.type.startsWith('video/')

  if (esteVideo) {
    const ext = (f.name.split('.').pop() ?? 'mp4').toLowerCase()
    return { nume: curataNume(f.name, ext), date: await caDataUrl(f) }
  }

  // SVG-urile nu trec prin canvas: sunt vectori, redesenarea le-ar
  // transforma în pixeli.
  if (f.type === 'image/svg+xml') {
    return { nume: curataNume(f.name, 'svg'), date: await caDataUrl(f) }
  }

  const bitmap = await creeazaBitmap(f)
  const scara = Math.min(1, LATURA_MAX / Math.max(bitmap.width, bitmap.height))
  const l = Math.round(bitmap.width * scara)
  const h = Math.round(bitmap.height * scara)

  const canvas = document.createElement('canvas')
  canvas.width = l
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browserul n-a putut pregăti poza.')
  ctx.drawImage(bitmap, 0, 0, l, h)

  const date = canvas.toDataURL('image/webp', CALITATE)
  if (!date.startsWith('data:image/webp')) {
    // Safari vechi nu scrie webp; PNG-ul e mai greu, dar corect.
    return { nume: curataNume(f.name, 'png'), date: canvas.toDataURL('image/png') }
  }
  return { nume: curataNume(f.name, 'webp'), date }
}

async function creeazaBitmap(f: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(f)
  const url = URL.createObjectURL(f)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function caDataUrl(f: File): Promise<string> {
  return new Promise((rezolva, respinge) => {
    const cititor = new FileReader()
    cititor.onload = () => rezolva(String(cititor.result))
    cititor.onerror = () => respinge(new Error('fișierul n-a putut fi citit.'))
    cititor.readAsDataURL(f)
  })
}
