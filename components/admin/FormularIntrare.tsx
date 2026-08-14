'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Formularul de parolă.
 *
 * Parola pleacă prin `POST`, în corp — niciodată prin URL, care ajunge în
 * istoricul browserului și în loguri. Cookie-ul îl pune serverul; aici nu
 * se ține nimic în memorie după trimitere.
 *
 * `nume` vine din `date/01-…` prin pagina-server: e componentă client,
 * deci n-are voie să citească de pe disc. Scris de mână aici, ar fi
 * primul lucru uitat la instalarea pe alt site.
 */
export function FormularIntrare({ nume }: { nume: string }) {
  const router = useRouter()
  const [parola, setParola] = useState('')
  const [eroare, setEroare] = useState('')
  const [trimite, setTrimite] = useState(false)

  async function trimiteFormular(e: React.FormEvent) {
    e.preventDefault()
    if (!parola || trimite) return
    setTrimite(true)
    setEroare('')

    try {
      const r = await fetch('/api/admin/intra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parola }),
      })
      if (r.ok) {
        setParola('')
        router.replace('/admin')
        return
      }
      const j = (await r.json()) as { eroare?: string }
      setEroare(j.eroare ?? 'Nu am putut intra.')
    } catch {
      setEroare('Nu am reușit să ajung la server. Verifică internetul.')
    } finally {
      setTrimite(false)
    }
  }

  return (
    <main className="p-intrare">
      <form onSubmit={trimiteFormular}>
        <h1>{nume}</h1>
        <p className="p-sub">Panou de administrare</p>

        {eroare && <p className="p-mesaj p-mesaj--eroare">{eroare}</p>}

        <div className="p-camp">
          <label htmlFor="parola">Parola</label>
          <input
            id="parola"
            name="parola"
            type="password"
            value={parola}
            onChange={(e) => setParola(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </div>

        <button type="submit" className="p-btn" disabled={trimite || !parola}>
          {trimite ? 'Se verifică…' : 'Intră'}
        </button>
      </form>
    </main>
  )
}
