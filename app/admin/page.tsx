import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Icon } from '@/components/Icon'
import { Iesire } from '@/components/admin/Iesire'
import { starea } from '@/lib/admin/depozit'
import { FISIERE_PANOU } from '@/lib/admin/schema'
import { areSesiune } from '@/lib/admin/sesiune'
import { siteCurent } from '@/lib/site'
import type { IconName } from '@/content/types'

/**
 * Acasă în panou: dale mari, una pentru fiecare lucru care se schimbă.
 *
 * Ordinea NU e cea din `schema.ts`: aici sunt puse în ordinea în care se
 * ating în practică. Prețurile la camere se schimbă des; numele locației,
 * o dată în viață. Deci camerele sunt primele, iar identitatea aproape
 * ultima.
 *
 * E o PREFERINȚĂ, nu o filtrare: un id necunoscut de aici se pune la
 * coadă, nu dispare. Altfel, un fișier adăugat în `schema.ts` la un site
 * nou n-ar apărea pe ecranul de acasă și n-ar fi nimic care să spună de
 * ce — dala pur și simplu ar lipsi.
 */
const ORDINE = [
  'prima-pagina',
  'camere',
  'oferte',
  'feature-uri',
  'recenzii',
  'intrebari',
  'facilitati',
  'contact',
  'rezervari',
  'identitate',
]

export default async function Acasa() {
  if (!(await areSesiune())) redirect('/admin/intra')

  const depozit = starea()
  const rang = (id: string) => {
    const i = ORDINE.indexOf(id)
    return i === -1 ? ORDINE.length : i
  }
  const dale = [...FISIERE_PANOU].sort((a, b) => rang(a.id) - rang(b.id))

  return (
    <>
      <header className="p-antet">
        {/* Numele vine din snapshot-ul de build, nu din depozit — spre
            deosebire de conținutul editat (vezi `depozit.ts`). E doar
            decorul antetului: dacă gazda tocmai și-a schimbat numele
            locației, aici se vede cel vechi timp de 1–2 minute. */}
        <h1>Panou · {siteCurent('ro').date.brand.shortName}</h1>
        <span className="p-spatiu" />
        <Iesire />
      </header>

      <main className="p-corp">
        {depozit.avertisment && <p className="p-mesaj p-mesaj--atentie">{depozit.avertisment}</p>}

        {depozit.fel === 'disc' && !depozit.avertisment && (
          <p className="p-mesaj p-mesaj--atentie">
            Rulezi local. Salvările merg direct în fișierele de pe calculator, nu în GitHub.
          </p>
        )}

        <p className="p-unde" style={{ marginTop: 4 }}>
          Alege ce vrei să schimbi. După fiecare salvare, site-ul se reface în 1–2 minute.
        </p>

        <div className="p-dale">
          <Link href="/admin/poze" className="p-dala">
            <Icon name="pin" className="icon" />
            <h2>Pozele</h2>
            <p>Trage o poză de pe telefon. Se micșorează singură.</p>
          </Link>

          {dale.map((f) => (
            <Link key={f.id} href={`/admin/text/${f.id}`} className="p-dala">
              <Icon name={f.icon as IconName} className="icon" />
              <h2>{f.titlu}</h2>
              <p>{f.rezumat}</p>
            </Link>
          ))}

          <Link href="/admin/setari" className="p-dala">
            <Icon name="refresh" className="icon" />
            <h2>Setări</h2>
            <p>Ce secțiuni apar pe prima pagină, în ce ordine, și ce pagini sunt pornite.</p>
          </Link>
        </div>

        <div className="p-card" style={{ marginTop: 28 }}>
          <h2>Ce nu se poate de aici</h2>
          <p className="p-ajutor-bloc" style={{ marginBottom: 0 }}>
            Un <strong>tip nou de pagină</strong> și schimbările de design cer cod — acolo se cheamă
            partea tehnică. Din panou se adaugă, se șterg și se mută <em>elemente</em> (o cameră, o
            ofertă, o recenzie) și se aprind sau se sting secțiunile și paginile care există deja.
          </p>
        </div>
      </main>
    </>
  )
}
