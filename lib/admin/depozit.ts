/* ============================================================
   depozit.ts — de unde citește și unde scrie panoul.

   ATENȚIE, PENTRU CINE ÎNTREȚINE MOTORUL: parte din panoul de
   administrare, o modificare locală față de motorul-sursă. Vezi
   `MOTOR-MODIFICAT.md`.

   DOUĂ IMPLEMENTĂRI, O INTERFAȚĂ
   ------------------------------
   `github`  în producție. Sursa de adevăr e repo-ul, fiecare salvare e
             un commit, istoricul e complet și reversibil.

   `disc`    în dezvoltare, când nu există token. Scrie direct în
             fișierele de pe disc, cu `node:fs`.

   De ce contează al doilea: fără el, tot panoul ar fi de nedezvoltat și
   de netestat local — ai avea nevoie de un token GitHub real ca să vezi
   dacă un buton funcționează, iar fiecare probă ar fi un commit adevărat
   în repo. Așa, `npm run dev` dă panoul întreg, funcțional, pe fișierele
   locale, iar `git diff` arată exact ce ar fi comis în producție.

   Alegerea NU e o setare: e prezența token-ului. Un deployment cu token
   scrie în GitHub; unul fără, pe disc. Pe Vercel discul funcției e
   read-only și oricum se pierde, deci lipsa token-ului acolo e o eroare,
   nu un mod de lucru — de asta `starea()` o raportează.

   CITIREA NU FOLOSEȘTE NICIODATĂ SNAPSHOT-UL DE BUILD
   ---------------------------------------------------
   Pe Vercel, fișierele din `date/` există și în funcție, așa cum erau la
   build. Ar fi mai rapid de citit de acolo — și complet greșit: după o
   salvare, site-ul se reconstruiește în 1–2 minute, iar în intervalul
   ăla panoul i-ar arăta gazdei textul de DINAINTEA propriei modificări.
   Deci citim mereu din depozit.
   ============================================================ */

import { readFileSync } from 'node:fs'
import { readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { radacinaClientDir } from '@/lib/continut/radacina'

import * as gh from './github'

export interface FisierText {
  cale: string
  continut: string
  /** `sha`-ul de trimis la scriere. Gol pe disc — acolo nu există conflict. */
  sha: string
}

export interface Element {
  nume: string
  sha: string
  marime: number
}

export type Fel = 'github' | 'disc'

export function fel(): Fel {
  return gh.areGitHub() ? 'github' : 'disc'
}

/** Ce trebuie să știe ecranul de setări despre unde ajung salvările. */
export function starea(): { fel: Fel; repo?: string; ramura?: string; avertisment?: string } {
  if (fel() === 'github') {
    return {
      fel: 'github',
      repo: process.env.ADMIN_GITHUB_REPO?.trim(),
      ramura: process.env.ADMIN_GITHUB_BRANCH?.trim() || 'main',
    }
  }
  return {
    fel: 'disc',
    avertisment:
      process.env.NODE_ENV === 'production'
        ? 'ADMIN_GITHUB_TOKEN lipsește. Pe Vercel, salvările din panou se pierd la ' +
          'următoarea publicare, fiindcă discul funcției nu e permanent. Setează ' +
          'ADMIN_GITHUB_TOKEN și ADMIN_GITHUB_REPO.'
        : undefined,
  }
}

/**
 * Rădăcina fișierelor de conținut. `radacinaClientDir` știe amândouă
 * layout-urile (repo de client vs. monorepo de dezvoltare).
 *
 * Într-un repo de client — cazul de aici — numele nici nu e folosit:
 * `date/` stă lângă `app/`. Îl citim totuși din `.client-activ`, la fel
 * ca `sync-media`, ca panoul să funcționeze și din monorepo.
 */
function radacina(): string {
  return radacinaClientDir(numeClient())
}

function numeClient(): string {
  try {
    return readFileSync(path.resolve(process.cwd(), '.client-activ'), 'utf8').trim()
  } catch {
    return ''
  }
}

function absolut(cale: string): string {
  const r = path.resolve(radacina(), cale)
  // Fără asta, o cale ca `../../etc/passwd` venită dintr-un parametru ar
  // ieși din folderul clientului. Rutele validează și ele, dar poarta
  // trebuie să fie și aici, cel mai jos posibil.
  if (r !== radacina() && !r.startsWith(radacina() + path.sep)) {
    throw new Error(`Calea „${cale}" iese din folderul site-ului.`)
  }
  return r
}

/* ------------------------------------------------------------------ */

export async function citeste(cale: string): Promise<FisierText | null> {
  if (fel() === 'github') return gh.citeste(cale)
  try {
    return { cale, continut: await readFile(absolut(cale), 'utf8'), sha: '' }
  } catch {
    return null
  }
}

export async function citesteOcteti(cale: string): Promise<Uint8Array | null> {
  if (fel() === 'github') return (await gh.citesteOcteti(cale))?.octeti ?? null
  try {
    return new Uint8Array(await readFile(absolut(cale)))
  } catch {
    return null
  }
}

export async function scrie(opt: {
  cale: string
  continut: string | Uint8Array
  sha?: string
  mesaj: string
}): Promise<{ sha: string }> {
  if (fel() === 'github') return gh.scrie(opt)
  await writeFile(absolut(opt.cale), opt.continut as Parameters<typeof writeFile>[1])
  return { sha: '' }
}

export async function sterge(opt: { cale: string; sha: string; mesaj: string }): Promise<void> {
  if (fel() === 'github') return gh.sterge(opt)
  await unlink(absolut(opt.cale))
}

export async function listeaza(cale: string): Promise<Element[]> {
  if (fel() === 'github') return gh.listeaza(cale)
  try {
    const intrari = await readdir(absolut(cale), { withFileTypes: true })
    return intrari
      .filter((e) => e.isFile() && !e.name.startsWith('.'))
      .map((e) => ({ nume: e.name, sha: '', marime: 0 }))
  } catch {
    return []
  }
}

/**
 * Conflictul de scriere, într-o formă pe care panoul o poate arăta.
 *
 * Pe GitHub, 409 înseamnă că `sha`-ul trimis nu mai e cel curent: cineva
 * a comis între citirea formularului și apăsarea butonului. Nu e o
 * eroare de rezolvat automat — cele două versiuni pot fi amândouă
 * corecte — deci gazda e cea care decide, după ce reîncarcă și vede ce e
 * acum în fișier.
 */
export function esteConflict(e: unknown): boolean {
  return e instanceof gh.EroareGitHub && (e.status === 409 || e.status === 422)
}

export { EroareGitHub } from './github'
