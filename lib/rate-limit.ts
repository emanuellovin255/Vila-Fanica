/* ============================================================
   lib/rate-limit.ts — limitare de rată persistentă.

   PROBLEMA pe care o rezolvă (recunoscută în comentariul din lead.js):
   funcțiile serverless sunt stateless. Un contor ținut într-un `Map`
   trăiește doar cât instanța care l-a creat; Vercel pornește instanțe
   noi la nevoie, deci limita se resetează și nu limitează nimic. Pentru
   spam-ul simplu pe un formular de contact e tolerabil. Pentru un
   endpoint de plată (T13), nu — de aici store-ul persistent.

   Store: Upstash Redis prin REST (fetch, zero dependențe, merge pe edge).
   Fereastră FIXĂ prin INCR + EXPIRE NX: prima cerere din fereastră pune
   contorul pe 1 și îi dă expirare; următoarele doar incrementează. Simplu,
   atomic, suficient pentru rate limiting de formular și de plată.

   FALLBACK: dacă lipsesc variabilele Upstash, cade pe un `Map` în memorie
   și scrie UN avertisment în log. Așa dezvoltarea locală merge fără Redis,
   iar o producție greșit configurată se vede în loguri, nu tăcut.
   ============================================================ */

const URL_UPSTASH = process.env.UPSTASH_REDIS_REST_URL
const TOKEN_UPSTASH = process.env.UPSTASH_REDIS_REST_TOKEN
const ARE_UPSTASH = Boolean(URL_UPSTASH && TOKEN_UPSTASH)

let avertizat = false
function avertizeazaOData() {
  if (avertizat) return
  avertizat = true
  console.warn(
    'rate-limit: UPSTASH_REDIS_REST_URL/TOKEN lipsesc — limitare doar în memorie, ' +
      'se resetează la fiecare instanță serverless. Acceptabil în dezvoltare și pe ' +
      'formularul de contact; NU pe endpoint-ul de plată (T13).',
  )
}

export type OptiuniLimita = {
  /** Cheia contorului. De regulă `formular:<ip>` sau `plata:<ip>`. */
  cheie: string
  /** Câte cereri sunt permise în fereastră. */
  max: number
  /** Lungimea ferestrei, în secunde. */
  fereastraSec: number
}

export type RezultatLimita = {
  /** `true` dacă cererea DEPĂȘEȘTE limita și trebuie respinsă cu 429. */
  blocat: boolean
  /** Câte cereri au mai rămas în fereastră (0 când e blocat). */
  ramase: number
  /** Secunde până la resetarea ferestrei — pentru headerul `Retry-After`. */
  resetSec: number
}

/* ------------------------------------------------------------
   Store în memorie — fallback de dezvoltare.
   ------------------------------------------------------------ */
const local = new Map<string, { count: number; expira: number }>()

function limiteazaLocal({ cheie, max, fereastraSec }: OptiuniLimita): RezultatLimita {
  avertizeazaOData()
  const acum = Date.now()
  const fereastraMs = fereastraSec * 1000
  const intrare = local.get(cheie)

  if (!intrare || intrare.expira <= acum) {
    local.set(cheie, { count: 1, expira: acum + fereastraMs })
    // Curățenie ocazională, ca Map-ul să nu crească nelimitat.
    if (local.size > 5000) {
      for (const [k, v] of local) if (v.expira <= acum) local.delete(k)
    }
    return { blocat: false, ramase: max - 1, resetSec: fereastraSec }
  }

  intrare.count += 1
  const resetSec = Math.max(1, Math.ceil((intrare.expira - acum) / 1000))
  if (intrare.count > max) return { blocat: true, ramase: 0, resetSec }
  return { blocat: false, ramase: max - intrare.count, resetSec }
}

/* ------------------------------------------------------------
   Store Upstash — producție.
   Pipeline: INCR cheie; EXPIRE cheie fereastră NX (doar dacă n-are deja).
   ------------------------------------------------------------ */
async function limiteazaUpstash(opt: OptiuniLimita): Promise<RezultatLimita> {
  const { cheie, max, fereastraSec } = opt
  const res = await fetch(`${URL_UPSTASH}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN_UPSTASH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', cheie],
      ['EXPIRE', cheie, String(fereastraSec), 'NX'],
      ['TTL', cheie],
    ]),
    // Fără cache: fiecare apel e o scriere.
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`upstash HTTP ${res.status}`)
  const out = (await res.json()) as Array<{ result: number }>
  const count = Number(out[0]?.result ?? 0)
  const ttl = Number(out[2]?.result ?? fereastraSec)
  const resetSec = ttl > 0 ? ttl : fereastraSec

  if (count > max) return { blocat: true, ramase: 0, resetSec }
  return { blocat: false, ramase: Math.max(0, max - count), resetSec }
}

/**
 * Verifică și consumă o unitate din limită pentru `cheie`.
 *
 * Cu Upstash configurat, limita ține ÎNTRE instanțe serverless. Fără el,
 * cade pe memorie (avertisment în log). Dacă Upstash e configurat dar
 * PICĂ, cererea e lăsată să treacă (fail-open) — un formular indisponibil
 * pentru că Redis-ul a hâ­cî­it e mai rău decât o cerere nelimitată
 * ocazional. Endpoint-ul de plată își adaugă propriile verificări dincolo
 * de rate limit (T13), deci fail-open aici nu deschide o gaură de plată.
 */
export async function limiteaza(opt: OptiuniLimita): Promise<RezultatLimita> {
  if (!ARE_UPSTASH) return limiteazaLocal(opt)
  try {
    return await limiteazaUpstash(opt)
  } catch (e) {
    console.warn('rate-limit: Upstash indisponibil, trec pe memorie —', (e as Error).message)
    return limiteazaLocal(opt)
  }
}
