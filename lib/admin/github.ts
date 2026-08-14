/* ============================================================
   github.ts — scrisul și cititul în repo, prin API-ul Contents.

   ATENȚIE, PENTRU CINE ÎNTREȚINE MOTORUL: parte din panoul de
   administrare, o modificare locală față de motorul-sursă. Vezi
   `MOTOR-MODIFICAT.md`.

   DE CE API-UL CONTENTS, ȘI NU GIT PLUMBING
   -----------------------------------------
   Panoul schimbă un fișier pe salvare. API-ul Contents face exact asta
   într-o singură cerere — citește cu `sha`, scrie cu `sha` — și creează
   commit-ul singur. Blob/tree/commit ar fi patru cereri și un arbore
   construit de mână, util doar pentru salvări multi-fișier, pe care
   panoul nu le face.

   `sha` E PROTECȚIA ÎMPOTRIVA SUPRASCRIERII
   -----------------------------------------
   Fiecare citire aduce și `sha`-ul fișierului. Scrierea îl trimite
   înapoi; dacă între timp altcineva a comis (din GitHub, sau din alt
   tab al panoului), GitHub refuză cu 409. Fără el, ultimul care apasă
   Salvează ar șterge în tăcere munca celuilalt — iar aici „celălalt"
   poate fi chiar gazda, cu telefonul în mână și laptopul deschis.

   TOKEN-UL
   --------
   Un token GitHub *fine-grained*, cu acces DOAR la acest repo și DOAR la
   `Contents: Read and write`. Stă în variabilele Vercel. Nu ajunge
   niciodată în browser: tot ce vine de la panou trece prin rutele din
   `app/api/admin/`, care rulează pe server.
   ============================================================ */

const API = 'https://api.github.com'

export interface Fisier {
  cale: string
  continut: string
  /** `sha`-ul blob-ului. Se trimite la scriere, ca protecție. */
  sha: string
}

export class EroareGitHub extends Error {
  constructor(
    mesaj: string,
    readonly status: number,
  ) {
    super(mesaj)
  }
}

function config() {
  const token = process.env.ADMIN_GITHUB_TOKEN?.trim()
  const repo = process.env.ADMIN_GITHUB_REPO?.trim()
  const ramura = process.env.ADMIN_GITHUB_BRANCH?.trim() || 'main'
  if (!token || !repo) return null
  return { token, repo, ramura }
}

/** Panoul poate scrie în GitHub? Dacă nu, `depozit.ts` cade pe disc. */
export function areGitHub(): boolean {
  return config() !== null
}

async function cere(cale: string, init: RequestInit = {}): Promise<Response> {
  const c = config()
  if (!c) throw new EroareGitHub('ADMIN_GITHUB_TOKEN sau ADMIN_GITHUB_REPO lipsește.', 500)

  return fetch(`${API}/repos/${c.repo}${cale}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    // Conținutul repo-ului se schimbă la fiecare salvare; un răspuns din
    // cache ar arăta gazdei textul de dinaintea propriei modificări.
    cache: 'no-store',
  })
}

function ramura(): string {
  return config()!.ramura
}

/* ------------------------------------------------------------------ */

/** Un fișier text din repo, cu `sha`-ul lui. `null` dacă nu există. */
export async function citeste(cale: string): Promise<Fisier | null> {
  const r = await cere(`/contents/${codeaza(cale)}?ref=${encodeURIComponent(ramura())}`)
  if (r.status === 404) return null
  if (!r.ok) throw new EroareGitHub(await mesajEroare(r), r.status)

  const j = (await r.json()) as { content?: string; encoding?: string; sha: string; type: string }
  if (j.type !== 'file' || j.content === undefined) {
    throw new EroareGitHub(`„${cale}" nu e un fișier.`, 400)
  }
  return { cale, continut: dinBase64(j.content), sha: j.sha }
}

/** Octeții unui fișier binar (o poză), pentru previzualizare. */
export async function citesteOcteti(cale: string): Promise<{ octeti: Uint8Array; sha: string } | null> {
  const r = await cere(`/contents/${codeaza(cale)}?ref=${encodeURIComponent(ramura())}`, {
    // `raw` scapă de base64 și de limita de 1 MB a răspunsului JSON.
    headers: { Accept: 'application/vnd.github.raw' },
  })
  if (r.status === 404) return null
  if (!r.ok) throw new EroareGitHub(await mesajEroare(r), r.status)
  return { octeti: new Uint8Array(await r.arrayBuffer()), sha: r.headers.get('etag') ?? '' }
}

/**
 * Scrie un fișier și face commit.
 *
 * `sha` lipsă = fișier nou. `sha` greșit sau învechit = 409, pe care
 * apelantul traduce în „cineva a modificat fișierul între timp".
 */
export async function scrie(opt: {
  cale: string
  continut: string | Uint8Array
  sha?: string
  mesaj: string
}): Promise<{ sha: string }> {
  const r = await cere(`/contents/${codeaza(opt.cale)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: opt.mesaj,
      content: typeof opt.continut === 'string' ? inBase64(opt.continut) : octetiInBase64(opt.continut),
      branch: ramura(),
      ...(opt.sha ? { sha: opt.sha } : {}),
    }),
  })
  if (!r.ok) throw new EroareGitHub(await mesajEroare(r), r.status)
  const j = (await r.json()) as { content: { sha: string } }
  return { sha: j.content.sha }
}

export async function sterge(opt: { cale: string; sha: string; mesaj: string }): Promise<void> {
  const r = await cere(`/contents/${codeaza(opt.cale)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message: opt.mesaj, sha: opt.sha, branch: ramura() }),
  })
  if (!r.ok) throw new EroareGitHub(await mesajEroare(r), r.status)
}

/** Numele fișierelor dintr-un folder. Fără recursivitate — `poze/` e plat. */
export async function listeaza(cale: string): Promise<Array<{ nume: string; sha: string; marime: number }>> {
  const r = await cere(`/contents/${codeaza(cale)}?ref=${encodeURIComponent(ramura())}`)
  if (r.status === 404) return []
  if (!r.ok) throw new EroareGitHub(await mesajEroare(r), r.status)
  const j = (await r.json()) as Array<{ name: string; sha: string; size: number; type: string }>
  if (!Array.isArray(j)) throw new EroareGitHub(`„${cale}" nu e un folder.`, 400)
  return j.filter((x) => x.type === 'file').map((x) => ({ nume: x.name, sha: x.sha, marime: x.size }))
}

/* ------------------------------------------------------------------ */

/** Fiecare segment separat: `/` din cale rămân separatori. */
function codeaza(cale: string): string {
  return cale.split('/').map(encodeURIComponent).join('/')
}

function inBase64(s: string): string {
  return octetiInBase64(new TextEncoder().encode(s))
}

function octetiInBase64(o: Uint8Array): string {
  // Pe bucăți: `String.fromCharCode(...o)` depășește stiva la poze mari.
  let bin = ''
  const pas = 0x8000
  for (let i = 0; i < o.length; i += pas) {
    bin += String.fromCharCode(...o.subarray(i, i + pas))
  }
  return btoa(bin)
}

function dinBase64(s: string): string {
  const bin = atob(s.replace(/\s/g, ''))
  const o = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(o)
}

/** Mesajul lui GitHub, dacă îl dă; altfel codul. Ajunge la gazdă, deci contează. */
async function mesajEroare(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as { message?: string }
    return j.message ? `GitHub: ${j.message}` : `GitHub a răspuns ${r.status}.`
  } catch {
    return `GitHub a răspuns ${r.status}.`
  }
}
