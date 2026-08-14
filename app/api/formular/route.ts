/* ============================================================
   app/api/formular/route.ts — endpoint-ul formularului de cazare.

   Portat din `Web Tamplate/_core/api/lead.js` (Vercel serverless clasic) în
   Route Handler App Router, cu securitatea din T09 legată:
     honeypot → rate limit → validare → Turnstile → email (Resend).

   DOUĂ CĂI, ACELAȘI COD
   ---------------------
   - CU JavaScript: `Formular.tsx` trimite JSON (`Content-Type: application/json`)
     și primește JSON. Mesaje inline, fără reîncărcarea paginii.
   - FĂRĂ JavaScript: browserul face un POST nativ `application/x-www-form-urlencoded`.
     Răspundem cu un REDIRECT: succesul duce la pagina de mulțumire, eroarea
     întoarce la formular cu mesajul în query. Formularul se trimite și fără JS
     (criteriu T10).

   Nu stochează nimic (REGULI.md 15). Nu logează date personale.
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server'

import { trimite } from '@/lib/formular/email'
import { limiteaza } from '@/lib/rate-limit'
import { verificaTurnstile } from '@/lib/turnstile'
import { culege, esteBot, valideaza } from '@/lib/validare'

// Rate limit: 3 cereri / IP / 10 min. A 4-a → 429. La fel ca în lead.js.
const RATE_MAX = 3
const RATE_FEREASTRA_SEC = 10 * 60

function ipClient(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'necunoscut'
}

/** Same-origin: dacă `Origin` e prezent, trebuie să fie propriul host. Altfel, 403. */
function acelasiOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // POST-uri fără Origin (unele browsere vechi, curl) — le lăsăm validării
  try {
    return new URL(origin).host === req.headers.get('host')
  } catch {
    return false
  }
}

/** Vizitatorul a trimis prin JS (JSON) sau printr-un POST nativ de formular? */
function esteJson(req: NextRequest): boolean {
  return (req.headers.get('content-type') || '').includes('application/json')
}

/** Limba paginii de proveniență, ca redirectul fără-JS să rămână în aceeași limbă. */
function limbaDinReferer(req: NextRequest): string {
  const ref = req.headers.get('referer') || ''
  try {
    const p = new URL(ref).pathname
    if (p === '/en' || p.startsWith('/en/')) return '/en'
  } catch {
    /* fără referer valid → româna implicită */
  }
  return ''
}

/** Corpul cererii, indiferent de format (JSON sau formular). */
async function corp(req: NextRequest): Promise<Record<string, unknown>> {
  if (esteJson(req)) {
    try {
      return (await req.json()) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  const form = await req.formData()
  const out: Record<string, unknown> = {}
  for (const [k, v] of form.entries()) out[k] = typeof v === 'string' ? v : ''
  return out
}

/** Răspuns de succes: JSON pentru JS, redirect la pagina de mulțumire pentru fără-JS. */
function succes(req: NextRequest): NextResponse {
  if (esteJson(req)) return NextResponse.json({ ok: true })
  const url = new URL(`${limbaDinReferer(req)}/multumim`, req.nextUrl.origin)
  return NextResponse.redirect(url, 303)
}

/** Răspuns de eroare: JSON cu status pentru JS, redirect înapoi cu mesaj pentru fără-JS. */
function eroare(req: NextRequest, mesaj: string, status: number): NextResponse {
  if (esteJson(req)) return NextResponse.json({ ok: false, eroare: mesaj }, { status })
  const ref = req.headers.get('referer')
  const inapoi = ref ? new URL(ref) : new URL(`${limbaDinReferer(req)}/`, req.nextUrl.origin)
  inapoi.searchParams.set('formular_eroare', mesaj)
  inapoi.hash = 'formular'
  return NextResponse.redirect(inapoi, 303)
}

export async function POST(req: NextRequest) {
  if (!acelasiOrigin(req)) {
    return eroare(req, 'Cerere respinsă.', 403)
  }

  const body = await corp(req)

  // 1 · Honeypot. Câmp `company` completat = bot. Succes fals — nu-i confirmăm
  // capcana și nu trimitem nimic.
  if (esteBot(body)) return succes(req)

  // 2 · Rate limit (persistent cu Upstash, T09). Devreme, ca să apere și
  // verificarea Turnstile și trimiterea de email de un potop de cereri.
  const rl = await limiteaza({ cheie: `formular:${ipClient(req)}`, max: RATE_MAX, fereastraSec: RATE_FEREASTRA_SEC })
  if (rl.blocat) {
    const res = eroare(req, 'Prea multe cereri. Încearcă din nou peste câteva minute.', 429)
    res.headers.set('Retry-After', String(rl.resetSec))
    return res
  }

  // 3 · Curățare + validare (nume, telefon SAU email, acord GDPR).
  const d = culege(body)
  const v = valideaza(d)
  if (!v.ok) return eroare(req, v.eroare, 400)

  // 4 · Turnstile, server-side (T09). Token gol/invalid → respins.
  const t = await verificaTurnstile(body['cf-turnstile-response'] as string, ipClient(req))
  if (!t.ok) return eroare(req, t.eroare, 400)

  // 5 · Trimitere email. Notificarea către locație e critică; confirmarea
  // către vizitator, dacă a lăsat email, e bonus.
  const email = await trimite(d)
  if (!email.ok) {
    return eroare(req, 'Nu am putut trimite cererea acum. Sună-ne sau reîncearcă.', 502)
  }

  return succes(req)
}

/** Orice altă metodă → 405. */
export async function GET() {
  return NextResponse.json({ ok: false, eroare: 'Metodă nepermisă.' }, { status: 405 })
}
