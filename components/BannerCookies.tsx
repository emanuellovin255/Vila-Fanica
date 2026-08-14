'use client'

import { useEffect, useState } from 'react'

import {
  ACCEPTA_TOT,
  citeste,
  EVENIMENT_REDESCHIDE,
  REFUZA_TOT,
  salveaza,
} from '@/lib/consimtamant'

/* ============================================================
   components/BannerCookies.tsx — bannerul de consimțământ (T11).

   Un banner care blochează EFECTIV: cât timp e afișat (sau după un refuz),
   `Analytics` nu pornește nimic. Refuzul are exact aceeași greutate ca
   acceptul (un click, același buton) — un „Refuz" ascuns nu e consimțământ
   liber. Alegerea se ține în localStorage și e revocabilă din footer
   (butonul „Setări cookies" emite `EVENIMENT_REDESCHIDE`).

   Categoriile strict necesare nu apar cu comutator: nu cer consimțământ.
   ============================================================ */

type Limba = 'ro' | 'en'

const TEXTE: Record<Limba, Record<string, string>> = {
  ro: {
    mesaj:
      'Folosim cookies strict necesare ca site-ul să funcționeze. Cu acordul tău, folosim și cookies analitice ca să înțelegem cum e folosit site-ul. Nimic nu se încarcă înainte să alegi.',
    accepta: 'Accept toate',
    refuza: 'Doar necesare',
    prefer: 'Preferințe',
    analitice: 'Analitice (Google Analytics)',
    marketing: 'Marketing',
    salveaza: 'Salvează preferințele',
    politica: 'Politica de cookies',
  },
  en: {
    mesaj:
      'We use strictly necessary cookies to make the site work. With your consent, we also use analytics cookies to understand how the site is used. Nothing loads before you choose.',
    accepta: 'Accept all',
    refuza: 'Necessary only',
    prefer: 'Preferences',
    analitice: 'Analytics (Google Analytics)',
    marketing: 'Marketing',
    salveaza: 'Save preferences',
    politica: 'Cookie policy',
  },
}

export function BannerCookies({ limba = 'ro' }: { limba?: Limba }) {
  const t = TEXTE[limba]
  const hrefPolitica = limba === 'en' ? '/en/politica-cookies' : '/politica-cookies'

  const [vizibil, setVizibil] = useState(false)
  const [detalii, setDetalii] = useState(false)
  const [analitice, setAnalitice] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    // Prima vizită (fără alegere salvată) → arată bannerul.
    if (citeste() === null) setVizibil(true)
    // Footer-ul cere redeschiderea → readucem bannerul cu alegerea curentă.
    const redeschide = () => {
      const c = citeste()
      setAnalitice(Boolean(c?.analitice))
      setMarketing(Boolean(c?.marketing))
      setDetalii(true)
      setVizibil(true)
    }
    window.addEventListener(EVENIMENT_REDESCHIDE, redeschide)
    return () => window.removeEventListener(EVENIMENT_REDESCHIDE, redeschide)
  }, [])

  if (!vizibil) return null

  const inchide = () => setVizibil(false)

  return (
    <aside className="cookie-bar" role="dialog" aria-label={t.politica} aria-live="polite">
      <div className="wrap">
        <p>
          {t.mesaj}{' '}
          <a href={hrefPolitica}>{t.politica}</a>
        </p>

        {detalii && (
          <div className="cookie-cat">
            <label className="field-check">
              <input type="checkbox" checked disabled />
              <span>{limba === 'en' ? 'Strictly necessary (always on)' : 'Strict necesare (mereu active)'}</span>
            </label>
            <label className="field-check">
              <input type="checkbox" checked={analitice} onChange={(e) => setAnalitice(e.target.checked)} />
              <span>{t.analitice}</span>
            </label>
            <label className="field-check">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              <span>{t.marketing}</span>
            </label>
          </div>
        )}

        <div className="cookie-actions">
          {detalii ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                salveaza({ analitice, marketing })
                inchide()
              }}
            >
              {t.salveaza}
            </button>
          ) : (
            <button className="btn btn-ghost" type="button" onClick={() => setDetalii(true)}>
              {t.prefer}
            </button>
          )}
          {/* Refuz și Accept — aceeași greutate vizuală, ambele un singur click. */}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              salveaza(REFUZA_TOT)
              inchide()
            }}
          >
            {t.refuza}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              salveaza(ACCEPTA_TOT)
              inchide()
            }}
          >
            {t.accepta}
          </button>
        </div>
      </div>
    </aside>
  )
}
