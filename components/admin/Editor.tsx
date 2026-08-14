'use client'

/* ============================================================
   Editor.tsx — formularul unui fișier de conținut.

   Parte din panoul de administrare, o modificare locală față de
   motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.

   CE TRIMITE LA SALVARE
   ---------------------
   Toate câmpurile, nu doar cele atinse. Pare risipă; nu e. `patch.ts`
   iese imediat din `setCamp` dacă valoarea e neschimbată, deci fișierul
   primește exact liniile modificate. Alternativa — să urmărim aici ce a
   atins gazda — ar mutat corectitudinea în interfață, unde un bug e
   invizibil până când cineva pierde un text.

   STRUCTURA E ALTĂ CERERE
   -----------------------
   Adaugă / șterge / mută trimit un `POST` separat și reîncarcă. Fiecare
   devine un commit cu mesajul lui („Panou: cameră nouă — …"), deci
   istoricul din GitHub se citește ca un jurnal, nu ca un șir de „update".
   ============================================================ */

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import type { Fisier } from '@/lib/admin/schema'

import { Camp } from './Camp'
import type { Poza } from './AlegePoza'

interface BlocDate {
  titlu: string
  index: number
  campuri: Record<string, string>
  descriere: string
}

interface Incarcat {
  cale: string
  sha: string
  blocuri: BlocDate[]
  antet?: BlocDate | null
}

type Stare = 'incarc' | 'gata' | 'salvez' | 'salvat'

export function Editor({ schema }: { schema: Fisier }) {
  const [limba, setLimba] = useState<'ro' | 'en'>('ro')
  const [date, setDate] = useState<Incarcat | null>(null)
  const [poze, setPoze] = useState<Poza[]>([])
  const [stare, setStare] = useState<Stare>('incarc')
  const [eroare, setEroare] = useState('')
  const [deschis, setDeschis] = useState<number | null>(null)
  const [titluNou, setTitluNou] = useState('')

  const incarca = useCallback(async () => {
    setStare('incarc')
    setEroare('')
    try {
      const r = await fetch(`/api/admin/continut?id=${schema.id}&limba=${limba}`)
      const j = await r.json()
      if (!r.ok) {
        setEroare(j.eroare ?? 'Nu am putut deschide fișierul.')
        setDate(null)
      } else {
        setDate(j as Incarcat)
      }
    } catch {
      setEroare('Nu am reușit să ajung la server.')
    } finally {
      setStare('gata')
    }
  }, [schema.id, limba])

  useEffect(() => {
    void incarca()
  }, [incarca])

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/admin/poze')
        if (r.ok) setPoze(((await r.json()) as { poze: Poza[] }).poze)
      } catch {
        /* fără poze, câmpurile de poză spun singure că lista e goală */
      }
    })()
  }, [])

  function schimbaCamp(index: number, cheie: string, valoare: string) {
    setDate((d) => {
      if (!d) return d
      if (index === -2) {
        return d.antet ? { ...d, antet: { ...d.antet, campuri: { ...d.antet.campuri, [cheie]: valoare } } } : d
      }
      return {
        ...d,
        blocuri: d.blocuri.map((b) =>
          b.index === index ? { ...b, campuri: { ...b.campuri, [cheie]: valoare } } : b,
        ),
      }
    })
    setStare('gata')
  }

  function schimbaDescriere(index: number, valoare: string) {
    setDate((d) =>
      d ? { ...d, blocuri: d.blocuri.map((b) => (b.index === index ? { ...b, descriere: valoare } : b)) } : d,
    )
    setStare('gata')
  }

  async function salveaza() {
    if (!date) return
    setStare('salvez')
    setEroare('')
    try {
      const r = await fetch('/api/admin/continut', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: schema.id,
          limba,
          sha: date.sha,
          antet: date.antet ? { campuri: date.antet.campuri } : undefined,
          blocuri: date.blocuri.map((b) => ({
            index: b.index,
            campuri: b.campuri,
            descriere: schema.forma.fel === 'lista' || areDescriere(schema, b.titlu) ? b.descriere : undefined,
          })),
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
      setEroare('Nu am reușit să ajung la server. Verifică internetul și încearcă din nou.')
      setStare('gata')
    }
  }

  async function structura(corp: Record<string, unknown>) {
    if (!date) return
    setStare('salvez')
    setEroare('')
    try {
      const r = await fetch('/api/admin/continut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schema.id, limba, sha: date.sha, ...corp }),
      })
      const j = await r.json()
      if (!r.ok) {
        setEroare(j.eroare ?? 'Nu am putut face schimbarea.')
        setStare('gata')
        return
      }
      setTitluNou('')
      setDeschis(null)
      await incarca()
      setStare('salvat')
    } catch {
      setEroare('Nu am reușit să ajung la server.')
      setStare('gata')
    }
  }

  const lista = schema.forma.fel === 'lista' ? schema.forma : null

  return (
    <>
      <header className="p-antet">
        <Link href="/admin" className="p-inapoi">
          ← Panou
        </Link>
        <span className="p-spatiu" />
      </header>

      <main className="p-corp">
        <h1 className="p-titlu-pagina">{schema.titlu}</h1>
        <p className="p-unde">{schema.undeSeVede}</p>

        <div className="p-limba" role="group" aria-label="Limba textelor">
          <button type="button" data-activ={limba === 'ro' ? 'da' : 'nu'} onClick={() => setLimba('ro')}>
            Română
          </button>
          <button type="button" data-activ={limba === 'en' ? 'da' : 'nu'} onClick={() => setLimba('en')}>
            English
          </button>
        </div>

        {eroare && <p className="p-mesaj p-mesaj--eroare">{eroare}</p>}

        {stare === 'incarc' && <p className="p-incarcare">Se încarcă…</p>}

        {date && (
          <>
            {/* Antetul secțiunii, când fișierul are unul (`## Secțiune`). */}
            {lista?.antet && date.antet && (
              <div className="p-card">
                <h2>{lista.antet.eticheta ?? lista.antet.titlu}</h2>
                {lista.antet.ajutor && <p className="p-ajutor-bloc">{lista.antet.ajutor}</p>}
                {lista.antet.campuri.map((c) => (
                  <Camp
                    key={c.cheie}
                    camp={c}
                    poze={poze}
                    valoare={date.antet?.campuri[c.cheie] ?? ''}
                    onChange={(v) => schimbaCamp(-2, c.cheie, v)}
                  />
                ))}
              </div>
            )}

            {/* Blocuri fixe: titlurile nu se schimbă, nu se adaugă, nu se șterg. */}
            {schema.forma.fel === 'fixe' &&
              schema.forma.blocuri.map((b) => {
                const d = date.blocuri.find((x) => x.titlu === b.titlu)
                if (!d || d.index < 0) return null
                return (
                  <div className="p-card" key={b.titlu}>
                    <h2>{b.eticheta ?? b.titlu}</h2>
                    {b.ajutor && <p className="p-ajutor-bloc">{b.ajutor}</p>}
                    {b.campuri.map((c) => (
                      <Camp
                        key={c.cheie}
                        camp={c}
                        poze={poze}
                        valoare={d.campuri[c.cheie] ?? ''}
                        onChange={(v) => schimbaCamp(d.index, c.cheie, v)}
                      />
                    ))}
                    {b.descriere && (
                      <div className="p-camp">
                        <label>{b.descriere.eticheta}</label>
                        <textarea
                          value={d.descriere}
                          onChange={(e) => schimbaDescriere(d.index, e.target.value)}
                        />
                        {b.descriere.ajutor && <p className="p-ajutor">{b.descriere.ajutor}</p>}
                      </div>
                    )}
                  </div>
                )
              })}

            {/* Listă de elemente: pliate, ca să încapă toate pe un ecran. */}
            {lista &&
              date.blocuri.map((d, poz) => (
                <div className="p-element" key={`${d.titlu}-${d.index}`} data-deschis={deschis === d.index ? 'da' : 'nu'}>
                  <button
                    type="button"
                    className="p-element-cap"
                    aria-expanded={deschis === d.index}
                    onClick={() => setDeschis(deschis === d.index ? null : d.index)}
                  >
                    <svg className="p-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" strokeWidth="2" />
                    </svg>
                    <h3>{d.titlu || `(${lista.singular} fără nume)`}</h3>
                  </button>

                  {deschis === d.index && (
                    <div className="p-element-corp">
                      {lista.campuri.map((c) => (
                        <Camp
                          key={c.cheie}
                          camp={c}
                          poze={poze}
                          valoare={d.campuri[c.cheie] ?? ''}
                          problema={problemaCamp(c.cheie, d.campuri[c.cheie] ?? '')}
                          onChange={(v) => schimbaCamp(d.index, c.cheie, v)}
                        />
                      ))}

                      {lista.descriere && (
                        <div className="p-camp">
                          <label>{lista.descriere.eticheta}</label>
                          <textarea
                            value={d.descriere}
                            onChange={(e) => schimbaDescriere(d.index, e.target.value)}
                          />
                          {lista.descriere.ajutor && <p className="p-ajutor">{lista.descriere.ajutor}</p>}
                        </div>
                      )}

                      <div className="p-element-unelte">
                        <button
                          type="button"
                          className="p-btn p-btn--gol p-btn--mic"
                          disabled={poz === 0 || stare === 'salvez'}
                          onClick={() => structura({ actiune: 'muta', index: poz, directie: 'sus' })}
                        >
                          ↑ Mai sus
                        </button>
                        <button
                          type="button"
                          className="p-btn p-btn--gol p-btn--mic"
                          disabled={poz === date.blocuri.length - 1 || stare === 'salvez'}
                          onClick={() => structura({ actiune: 'muta', index: poz, directie: 'jos' })}
                        >
                          ↓ Mai jos
                        </button>
                        <span style={{ flex: 1 }} />
                        <button
                          type="button"
                          className="p-btn p-btn--pericol p-btn--mic"
                          disabled={stare === 'salvez'}
                          onClick={() => {
                            const sigur = window.confirm(
                              `Ștergi „${d.titlu}"? Se poate reveni din istoricul GitHub, dar nu dintr-un buton de aici.`,
                            )
                            if (sigur) void structura({ actiune: 'sterge', index: poz })
                          }}
                        >
                          Șterge
                        </button>
                      </div>

                      {lista.titluEsteAdresa && (
                        <p className="p-ajutor" style={{ marginTop: 12 }}>
                          Numele de sus e și adresa paginii. Se schimbă doar din GitHub, intenționat:
                          o redenumire schimbă adresa, iar ce era în Google o ia de la capăt.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {/* Adăugare */}
            {lista && (
              <div className="p-card">
                <h2>Adaugă {lista.singular === 'ofertă' ? 'o ofertă' : `un/o ${lista.singular}`}</h2>
                <p className="p-ajutor-bloc">
                  Scrie numele; câmpurile apar goale, de completat.
                  {lista.cerePereche && (
                    <>
                      {' '}
                      <strong>
                        Adaugă-o și în engleză, pe aceeași poziție — altfel comutatorul de limbă
                        ajunge pe elementul greșit.
                      </strong>
                    </>
                  )}
                </p>
                <div className="p-camp">
                  <label htmlFor="titlu-nou">Numele</label>
                  <input
                    id="titlu-nou"
                    type="text"
                    value={titluNou}
                    onChange={(e) => setTitluNou(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="p-btn"
                  disabled={!titluNou.trim() || stare === 'salvez'}
                  onClick={() => structura({ actiune: 'adauga', titlu: titluNou.trim() })}
                >
                  Adaugă
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {date && (
        <div className="p-salvare">
          <span className="p-stare">
            {stare === 'salvez' && 'Se salvează…'}
            {stare === 'salvat' && 'Salvat. Site-ul se reface în 1–2 minute.'}
            {stare === 'gata' && `Editezi ${date.cale}`}
          </span>
          <button type="button" className="p-btn" disabled={stare === 'salvez'} onClick={salveaza}>
            {stare === 'salvez' ? 'Se salvează…' : 'Salvează'}
          </button>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */

function areDescriere(schema: Fisier, titlu: string): boolean {
  if (schema.forma.fel !== 'fixe') return true
  return Boolean(schema.forma.blocuri.find((b) => b.titlu === titlu)?.descriere)
}

/**
 * Greșelile care nu se văd până apar pe site. Se arată pe loc, sub câmp,
 * nu la salvare — la salvare ar fi prea târziu ca gazda să lege cauza de
 * efect.
 */
function problemaCamp(cheie: string, valoare: string): string | undefined {
  if (!valoare.trim()) {
    if (cheie === 'sursa') return 'Fără sursă, recenzia nu se afișează deloc pe site.'
    return undefined
  }
  if ((cheie === 'pret de la' || cheie === 'pret' || cheie === 'pret anterior') && /[a-zA-Z]/.test(valoare)) {
    return 'Scrie doar cifra. „lei" și „/noapte" le pune site-ul singur.'
  }
  return undefined
}
