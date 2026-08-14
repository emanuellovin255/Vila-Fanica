import { redirect } from 'next/navigation'

import { FormularIntrare } from '@/components/admin/FormularIntrare'
import { areSesiune, esteConfigurat, lipsesteDinConfigurare } from '@/lib/admin/sesiune'
import { siteCurent } from '@/lib/site'

/**
 * Ecranul de parolă.
 *
 * Dacă panoul nu e configurat, arată CE lipsește, nu un formular care
 * n-ar putea funcționa. O configurare incompletă nu are voie să devină o
 * ușă deschisă: `areSesiune()` întoarce `false` fără parolă setată.
 */
export default async function Intrare() {
  if (await areSesiune()) redirect('/admin')

  if (!esteConfigurat()) {
    return (
      <main className="p-intrare">
        <div style={{ maxWidth: 460 }}>
          <div className="p-card">
            <h1 style={{ marginTop: 0, fontSize: 21 }}>Panoul nu e configurat încă</h1>
            <p style={{ color: 'var(--p-text-slab)' }}>
              Lipsesc din setările Vercel:{' '}
              <strong>{lipsesteDinConfigurare().join(' și ')}</strong>.
            </p>
            <p style={{ color: 'var(--p-text-slab)', fontSize: 15 }}>
              Se adaugă o dată, la <em>Settings → Environment Variables</em>, apoi site-ul se
              republică. Pașii, cu tot ce trebuie: fișierul <code>ADMIN.md</code> din repo.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return <FormularIntrare nume={siteCurent('ro').date.brand.name} />
}
