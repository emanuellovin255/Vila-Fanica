'use client'

/* ============================================================
   EditorSetari.tsx — ce apare pe prima pagină și în ce ordine.

   Parte din panoul de administrare, o modificare locală față de
   motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.

   Secțiunile de pe prima pagină nu sunt blocuri în `setari.md`, sunt
   CÂMPURI, iar ordinea rândurilor lor e ordinea de pe site. De asta au
   aici săgeți de mutat, nu doar bife: mutarea unei secțiuni chiar mută
   rândul în fișier.
   ============================================================ */

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface Comutator {
  cheie: string
  eticheta: string
  ajutor: string
  pornit: boolean
}

interface Sectiune {
  cheie: string
  pornit: boolean
}

interface Date {
  sha: string
  depozit: { fel: string; repo?: string; ramura?: string; avertisment?: string }
  module: Comutator[]
  sectiuni: Sectiune[]
  altele: Comutator[]
  meniuPdf: string
}

/** Numele secțiunilor, așa cum se cheamă pe ecran. Cheia e cea din fișier. */
const NUME: Record<string, string> = {
  'banda de incredere': 'Banda cu cifre, sub poza mare',
  facilitati: 'Ce găsești aici (facilități)',
  camere: 'Camerele',
  'feature-uri alternante': 'Blocurile poză + text',
  prezentare: 'Clipul de prezentare',
  'clip de prezentare': 'Clipul de prezentare',
  oferte: 'Ofertele și excursiile',
  recenzii: 'Recenziile',
  'meniu restaurant': 'Meniul restaurantului',
  harta: 'Harta',
  'intrebari frecvente': 'Întrebările frecvente',
  'sectiune de inchidere': 'Îndemnul de la final',
  evenimente: 'Spațiile de evenimente',
  galerie: 'Galeria',
}

export function EditorSetari() {
  const [date, setDate] = useState<Date | null>(null)
  const [stare, setStare] = useState<'incarc' | 'gata' | 'salvez' | 'salvat'>('incarc')
  const [eroare, setEroare] = useState('')

  const incarca = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/setari')
      const j = await r.json()
      if (!r.ok) setEroare(j.eroare ?? 'Nu am putut citi setările.')
      else setDate(j as Date)
    } catch {
      setEroare('Nu am reușit să ajung la server.')
    } finally {
      setStare('gata')
    }
  }, [])

  useEffect(() => {
    void incarca()
  }, [incarca])

  function comuta(unde: 'module' | 'altele', cheie: string) {
    setDate((d) =>
      d ? { ...d, [unde]: d[unde].map((x) => (x.cheie === cheie ? { ...x, pornit: !x.pornit } : x)) } : d,
    )
    setStare('gata')
  }

  function comutaSectiune(cheie: string) {
    setDate((d) =>
      d ? { ...d, sectiuni: d.sectiuni.map((s) => (s.cheie === cheie ? { ...s, pornit: !s.pornit } : s)) } : d,
    )
    setStare('gata')
  }

  function muta(i: number, delta: number) {
    setDate((d) => {
      if (!d) return d
      const j = i + delta
      if (j < 0 || j >= d.sectiuni.length) return d
      const copie = [...d.sectiuni]
      ;[copie[i], copie[j]] = [copie[j], copie[i]]
      return { ...d, sectiuni: copie }
    })
    setStare('gata')
  }

  async function salveaza() {
    if (!date) return
    setStare('salvez')
    setEroare('')
    try {
      const r = await fetch('/api/admin/setari', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sha: date.sha,
          module: Object.fromEntries(date.module.map((m) => [m.cheie, m.pornit])),
          altele: Object.fromEntries(date.altele.map((a) => [a.cheie, a.pornit])),
          sectiuni: date.sectiuni.filter((s) => s.pornit).map((s) => s.cheie),
          sectiuniOprite: date.sectiuni.filter((s) => !s.pornit).map((s) => s.cheie),
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setEroare(j.eroare ?? 'Nu am putut salva.')
        setStare('gata')
        return
      }
      setDate((d) => (d ? { ...d, sha: j.sha ?? d.sha } : d))
      setStare('salvat')
    } catch {
      setEroare('Nu am reușit să ajung la server.')
      setStare('gata')
    }
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
        <h1 className="p-titlu-pagina">Setări</h1>
        <p className="p-unde">Ce apare pe site și în ce ordine.</p>

        {eroare && <p className="p-mesaj p-mesaj--eroare">{eroare}</p>}
        {date?.depozit.avertisment && <p className="p-mesaj p-mesaj--atentie">{date.depozit.avertisment}</p>}
        {stare === 'incarc' && <p className="p-incarcare">Se încarcă…</p>}

        {date && (
          <>
            <div className="p-card">
              <h2>Ordinea secțiunilor pe prima pagină</h2>
              <p className="p-ajutor-bloc">
                De sus în jos, exact cum apar. Scoate bifa și secțiunea dispare de pe prima pagină —
                textele ei rămân în panou, neatinse.
              </p>
              <ul className="p-ordine">
                {date.sectiuni.map((s, i) => (
                  <li key={s.cheie}>
                    <input
                      type="checkbox"
                      checked={s.pornit}
                      aria-label={`Arată ${NUME[s.cheie] ?? s.cheie}`}
                      style={{ width: 24, height: 24, accentColor: 'var(--p-accent)' }}
                      onChange={() => comutaSectiune(s.cheie)}
                    />
                    <span className="p-nume" style={{ opacity: s.pornit ? 1 : 0.5 }}>
                      {NUME[s.cheie] ?? s.cheie}
                    </span>
                    <button type="button" aria-label="Mai sus" disabled={i === 0} onClick={() => muta(i, -1)}>
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Mai jos"
                      disabled={i === date.sectiuni.length - 1}
                      onClick={() => muta(i, 1)}
                    >
                      ↓
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-card">
              <h2>Pagini și module</h2>
              <p className="p-ajutor-bloc">
                Oprit, un modul dispare complet: nici secțiunea, nici linkul din meniul de sus.
              </p>
              {date.module.map((m) => (
                <label className="p-comutator" key={m.cheie}>
                  <input type="checkbox" checked={m.pornit} onChange={() => comuta('module', m.cheie)} />
                  <span className="p-comutator-text">
                    <strong>{m.eticheta}</strong>
                    <span className="p-ajutor">{m.ajutor}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="p-card">
              <h2>Altele</h2>
              {date.altele.map((a) => (
                <label className="p-comutator" key={a.cheie}>
                  <input type="checkbox" checked={a.pornit} onChange={() => comuta('altele', a.cheie)} />
                  <span className="p-comutator-text">
                    <strong>{a.eticheta}</strong>
                    <span className="p-ajutor">{a.ajutor}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="p-card">
              <h2>Unde ajung salvările</h2>
              <p className="p-ajutor-bloc" style={{ marginBottom: 0 }}>
                {date.depozit.fel === 'github' ? (
                  <>
                    În GitHub, la <strong>{date.depozit.repo}</strong>, pe ramura{' '}
                    <strong>{date.depozit.ramura}</strong>. Fiecare salvare e o versiune separată,
                    din care se poate reveni oricând.
                  </>
                ) : (
                  <>În fișierele de pe calculatorul pe care rulează site-ul acum.</>
                )}
              </p>
            </div>
          </>
        )}
      </main>

      {date && (
        <div className="p-salvare">
          <span className="p-stare">
            {stare === 'salvez' && 'Se salvează…'}
            {stare === 'salvat' && 'Salvat. Site-ul se reface în 1–2 minute.'}
            {stare === 'gata' && 'Editezi setari.md'}
          </span>
          <button type="button" className="p-btn" disabled={stare === 'salvez'} onClick={salveaza}>
            {stare === 'salvez' ? 'Se salvează…' : 'Salvează'}
          </button>
        </div>
      )}
    </>
  )
}
