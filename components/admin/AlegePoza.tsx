'use client'

/* ============================================================
   AlegePoza.tsx — alegerea unei poze sau a unui clip, din miniaturi.

   Parte din panoul de administrare, o modificare locală față de
   motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.

   DE CE MINIATURI ȘI NU UN CÂMP DE TEXT
   -------------------------------------
   În fișier, o poză e numele ei: `Poza: piscina-cu-apa-incalzita.webp`.
   Scris de mână, e cel mai fragil câmp din tot formatul — o literă
   greșită și poza nu apare, tăcut. Aici gazda apasă pe imagine; numele îl
   scrie panoul.

   ORDINEA CONTEAZĂ la câmpul `Poze:` al unei camere: prima e cea de pe
   card. De asta pozele alese se arată separat, numerotate, cu săgeți —
   nu doar bifate în grilă.

   Previzualizarea trece prin `/api/admin/poza/<nume>`, nu prin
   `/media/<nume>`: o poză încărcată acum nu e încă în `public/media/`,
   care se generează la build. Vezi comentariul rutei.
   ============================================================ */

import { useState } from 'react'

export interface Poza {
  nume: string
  fel: 'imagine' | 'video'
  marime: number
}

interface Props {
  poze: Poza[]
  /** Numele fișierului, sau mai multe despărțite prin virgulă. */
  valoare: string
  fel: 'imagine' | 'video'
  multiple?: boolean
  onChange: (valoare: string) => void
}

export function AlegePoza({ poze, valoare, fel, multiple, onChange }: Props) {
  const [deschis, setDeschis] = useState(false)

  const alese = valoare
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  const disponibile = poze.filter((p) => p.fel === fel)

  function pune(nume: string) {
    if (!multiple) {
      onChange(alese[0] === nume ? '' : nume)
      setDeschis(false)
      return
    }
    onChange((alese.includes(nume) ? alese.filter((x) => x !== nume) : [...alese, nume]).join(', '))
  }

  function mutaLa(i: number, j: number) {
    if (j < 0 || j >= alese.length) return
    const copie = [...alese]
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
    onChange(copie.join(', '))
  }

  return (
    <>
      <div className="p-alese">
        {alese.length === 0 && <span className="p-gol">nimic ales</span>}

        {alese.map((nume, i) => {
          const exista = poze.some((p) => p.nume === nume)
          return (
            <div key={`${nume}-${i}`} className="p-aleasa">
              {exista ? (
                <Previzualizare nume={nume} fel={fel} />
              ) : (
                <span className="p-gol" style={{ width: '100%', color: 'var(--p-eroare)' }}>
                  lipsește
                </span>
              )}
              <div className="p-aleasa-unelte">
                {multiple && alese.length > 1 && (
                  <>
                    <button type="button" aria-label="Mai la stânga" disabled={i === 0} onClick={() => mutaLa(i, i - 1)}>
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label="Mai la dreapta"
                      disabled={i === alese.length - 1}
                      onClick={() => mutaLa(i, i + 1)}
                    >
                      →
                    </button>
                  </>
                )}
                <button type="button" aria-label={`Scoate ${nume}`} onClick={() => pune(nume)}>
                  ×
                </button>
              </div>
              {multiple && i === 0 && (
                <p className="p-ajutor" style={{ fontSize: 12, marginTop: 2 }}>
                  pe card
                </p>
              )}
              {!exista && (
                <p className="p-ajutor" style={{ fontSize: 12, color: 'var(--p-eroare)' }}>
                  {nume}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <button type="button" className="p-btn p-btn--gol p-btn--mic" onClick={() => setDeschis(!deschis)}>
        {deschis ? 'Închide lista' : alese.length ? 'Schimbă' : fel === 'video' ? 'Alege un clip' : 'Alege o poză'}
      </button>

      {deschis && (
        <div style={{ marginTop: 12 }}>
          {disponibile.length === 0 ? (
            <p className="p-ajutor">
              Nu e niciun {fel === 'video' ? 'clip' : 'fișier'} în folderul de poze. Încarcă unul din
              pagina <strong>Pozele</strong>.
            </p>
          ) : (
            <div className="p-poze-grila">
              {disponibile.map((p) => {
                const ordine = alese.indexOf(p.nume)
                return (
                  <button
                    key={p.nume}
                    type="button"
                    className="p-poza"
                    data-aleasa={ordine >= 0 ? 'da' : 'nu'}
                    aria-pressed={ordine >= 0}
                    onClick={() => pune(p.nume)}
                  >
                    <Previzualizare nume={p.nume} fel={p.fel} />
                    {ordine >= 0 && <span className="p-poza-ordine">{ordine + 1}</span>}
                    <span className="p-poza-nume">{p.nume}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function Previzualizare({ nume, fel }: { nume: string; fel: 'imagine' | 'video' }) {
  const src = `/api/admin/poza/${encodeURIComponent(nume)}`
  if (fel === 'video') {
    // `preload="metadata"`: se ia primul cadru, nu tot clipul. Douăzeci de
    // clipuri într-o grilă ar fi altfel zeci de MB pe o conexiune mobilă.
    return <video src={src} muted playsInline preload="metadata" />
  }
  // `<img>` și nu `next/image`: optimizatorul lui Next n-ar putea citi o
  // rută care cere sesiune, iar aici nu ne trebuie oricum — miniaturile
  // sunt mici și văzute de o singură persoană.
  //
  // `width`/`height` sunt raportul cerut de regula 13, nu dimensiunea
  // reală: CSS-ul întinde miniatura la casetă cu `object-fit: cover`.
  // Fără ele, grila ar sări pe măsură ce se încarcă pozele.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={nume} loading="lazy" width={400} height={300} />
}
