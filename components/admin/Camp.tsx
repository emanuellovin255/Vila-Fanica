'use client'

/* ============================================================
   Camp.tsx — un câmp de formular, după tipul din schemă.

   Parte din panoul de administrare, o modificare locală față de
   motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.

   AICI SE PLĂTEȘTE INVESTIȚIA ÎN SCHEMĂ. Regulile formatului `.md` —
   prețul fără „lei", lista care se taie la virgulă doar pe un rând,
   numele exact al pozei — nu mai sunt lucruri de ținut minte: sunt
   tipuri de câmp. Un preț e un `<input>` numeric; o poză e o grilă de
   miniaturi; o listă e rânduri adăugate unul câte unul.

   Valorile circulă ca ȘIRURI, în forma din fișier: lista pe rânduri e un
   șir cu `\n`, etichetele sunt un șir cu virgule. Așa componentele nu
   trebuie să știe cum se serializează — `patch.ts` e singurul care știe.
   ============================================================ */

import { useId } from 'react'

import { Icon } from '@/components/Icon'
import type { Camp as CampSchema } from '@/lib/admin/schema'
import type { IconName } from '@/content/types'

import { AlegePoza } from './AlegePoza'
import type { Poza } from './AlegePoza'

/** Iconurile care au sens pentru dotările unei camere sau o facilitate. */
const ICONURI: IconName[] = [
  'wifi', 'tv', 'climate', 'safe', 'fridge', 'shower', 'coffee', 'dining', 'bar',
  'terrace', 'parking', 'ev', 'pool', 'sauna', 'spa', 'bed', 'ruler', 'users',
  'accessible', 'door', 'grill', 'ciubar', 'pescuit', 'drumetie', 'biciclete',
  'teleschi', 'glass', 'shield', 'clock', 'pin', 'star', 'calendar',
]

export interface Probleme {
  [cheie: string]: string | undefined
}

interface Props {
  camp: CampSchema
  valoare: string
  poze: Poza[]
  problema?: string
  onChange: (valoare: string) => void
}

export function Camp({ camp, valoare, poze, problema, onChange }: Props) {
  const id = useId()

  return (
    <div className="p-camp">
      <label htmlFor={id}>{camp.eticheta}</label>
      {corp(camp, valoare, poze, onChange, id)}
      {problema && (
        <p className="p-ajutor" style={{ color: 'var(--p-eroare)', fontWeight: 500 }}>
          {problema}
        </p>
      )}
      {camp.ajutor && <p className="p-ajutor">{camp.ajutor}</p>}
    </div>
  )
}

function corp(
  camp: CampSchema,
  valoare: string,
  poze: Poza[],
  onChange: (v: string) => void,
  id: string,
) {
  switch (camp.tip) {
    case 'paragraf':
      return (
        <textarea
          id={id}
          value={valoare}
          placeholder={camp.exemplu}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'numar':
      return (
        <div className="p-numar">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={valoare}
            placeholder={camp.exemplu ?? '0'}
            onChange={(e) => onChange(e.target.value)}
          />
          {camp.sufix && <span className="p-sufix">{camp.sufix}</span>}
        </div>
      )

    case 'poza':
      return <AlegePoza poze={poze} valoare={valoare} fel="imagine" onChange={onChange} />

    case 'poze':
      return <AlegePoza poze={poze} valoare={valoare} fel="imagine" multiple onChange={onChange} />

    case 'video':
      return <AlegePoza poze={poze} valoare={valoare} fel="video" onChange={onChange} />

    case 'lista':
      return <Randuri valoare={valoare} exemplu={camp.exemplu} onChange={onChange} />

    case 'etichete':
      return <Etichete valoare={valoare} onChange={onChange} />

    case 'icon':
      return <Iconuri valoare={valoare} onChange={onChange} />

    case 'da-nu':
      return (
        <select id={id} value={valoare.toLowerCase().startsWith('d') ? 'da' : 'nu'} onChange={(e) => onChange(e.target.value)}>
          <option value="da">Da</option>
          <option value="nu">Nu</option>
        </select>
      )

    default:
      return (
        <input
          id={id}
          type="text"
          value={valoare}
          placeholder={camp.exemplu}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}

/* ------------------------------------------------------------------ */

/**
 * Listă pe rânduri: fiecare element pe rândul lui în fișier.
 *
 * Un `<textarea>`, nu douăzeci de `<input>`-uri: se lipește ușor o listă
 * din altă parte, se rearanjează rândurile cu tastatura, se vede tot
 * dintr-o privire. Explicația de dedesubt spune singura regulă.
 */
function Randuri({
  valoare,
  exemplu,
  onChange,
}: {
  valoare: string
  exemplu?: string
  onChange: (v: string) => void
}) {
  const câte = valoare.split('\n').filter((x) => x.trim()).length
  return (
    <>
      <textarea
        value={valoare}
        placeholder={exemplu}
        rows={Math.min(12, Math.max(3, câte + 1))}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="p-ajutor">
        Câte unul pe rând. {câte === 1 ? '1 element' : `${câte} elemente`} acum.
        {câte === 1 && valoare.includes(',') && (
          <>
            {' '}
            <strong>
              Atenție: un singur rând care conține virgulă se taie la virgulă pe site. Pune-l pe două
              rânduri sau scoate virgula.
            </strong>
          </>
        )}
      </p>
    </>
  )
}

/** Etichete scurte, pe un rând în fișier, despărțite prin virgulă. */
function Etichete({ valoare, onChange }: { valoare: string; onChange: (v: string) => void }) {
  const bucati = valoare
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  function scoate(i: number) {
    onChange(bucati.filter((_, k) => k !== i).join(', '))
  }

  function adauga(text: string) {
    const t = text.trim().replace(/,/g, '')
    if (!t) return
    onChange([...bucati, t].join(', '))
  }

  return (
    <>
      {bucati.length > 0 && (
        <div className="p-etichete">
          {bucati.map((b, i) => (
            <span key={`${b}-${i}`} className="p-eticheta">
              {b}
              <button type="button" aria-label={`Scoate „${b}"`} onClick={() => scoate(i)}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        placeholder="Scrie și apasă Enter"
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          adauga(e.currentTarget.value)
          e.currentTarget.value = ''
        }}
        onBlur={(e) => {
          adauga(e.currentTarget.value)
          e.currentTarget.value = ''
        }}
      />
    </>
  )
}

/**
 * Iconuri, alese din setul desenat al site-ului.
 *
 * Se afișează desenul, nu numele: gazda n-are de unde să știe că duș se
 * scrie `shower`. Numele intră în fișier, imaginea rămâne pe ecran.
 */
function Iconuri({ valoare, onChange }: { valoare: string; onChange: (v: string) => void }) {
  const alese = valoare
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean)

  function comuta(nume: string) {
    const nou = alese.includes(nume) ? alese.filter((x) => x !== nume) : [...alese, nume]
    onChange(nou.join(', '))
  }

  // Iconurile deja scrise în fișier, chiar dacă nu sunt în lista sugerată.
  const toate = [...new Set([...alese, ...ICONURI])]

  return (
    <div className="p-iconuri">
      {toate.map((nume) => (
        <button
          key={nume}
          type="button"
          className="p-icon-opt"
          data-aleasa={alese.includes(nume) ? 'da' : 'nu'}
          aria-pressed={alese.includes(nume)}
          onClick={() => comuta(nume)}
        >
          <Icon name={nume as IconName} className="icon" />
          {nume}
        </button>
      ))}
    </div>
  )
}
