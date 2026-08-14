/* ============================================================
   sesiune.ts — poarta panoului de administrare.

   ATENȚIE, PENTRU CINE ÎNTREȚINE MOTORUL: parte din panoul de
   administrare, o modificare locală față de motorul-sursă. Vezi
   `MOTOR-MODIFICAT.md`.

   CE E ȘI CE NU E
   ---------------
   O parolă, una singură, a locației. NU e un sistem de conturi: gazda
   n-are cont GitHub, n-are cont pe site, nu se înregistrează nimeni.
   Scrie parola, intră, editează. Ăsta e tot modelul, și e ales
   deliberat — un cont GitHub cu invitație de colaborator ar fi mai
   „corect", dar ar fi și motivul pentru care panoul n-ar fi folosit
   niciodată.

   UNDE STĂ PAROLA
   ---------------
   În variabilele de mediu de pe Vercel (`ADMIN_PAROLA`), puse de gazdă,
   direct în interfața Vercel. Nu trece prin repo, nu trece prin nimeni.
   Fără `ADMIN_PAROLA` setat, panoul e ÎNCHIS complet — nu „deschis fără
   parolă". O configurare incompletă nu are voie să devină o ușă
   deschisă.

   CE ȚINE COOKIE-UL
   -----------------
   Nimic secret: doar momentul expirării, semnat cu HMAC-SHA-256 peste
   `ADMIN_SECRET`. Serverul verifică semnătura, deci nimeni nu-și poate
   scrie singur un cookie valid. Nu există sesiuni stocate nicăieri —
   niciun fișier, nicio bază de date; asta e și motivul pentru care nu
   există „deconectare de pe toate dispozitivele" decât prin schimbarea
   lui `ADMIN_SECRET`.

   Comparația parolei se face în timp CONSTANT. Un `===` pe șiruri iese
   la prima literă diferită, iar diferența de timp, măsurată de multe
   ori, spune atacatorului câte litere a ghicit.
   ============================================================ */

import { cookies } from 'next/headers'

import { limiteaza } from '@/lib/rate-limit'

const COOKIE = 'panou'
/** Opt ore: o zi de lucru, nu mai mult. */
const DURATA_SEC = 8 * 60 * 60

function parola(): string | undefined {
  const p = process.env.ADMIN_PAROLA?.trim()
  return p || undefined
}

function secret(): string | undefined {
  const s = process.env.ADMIN_SECRET?.trim()
  return s || undefined
}

/**
 * Panoul e configurat? Fără parolă SAU fără secret, răspunsul e nu, iar
 * `/admin` arată o pagină care spune ce lipsește — nu un formular care
 * n-ar putea funcționa.
 */
export function esteConfigurat(): boolean {
  return Boolean(parola() && secret())
}

/** Ce lipsește din configurare, pentru mesajul de pe ecran. */
export function lipsesteDinConfigurare(): string[] {
  const lipsa: string[] = []
  if (!parola()) lipsa.push('ADMIN_PAROLA')
  if (!secret()) lipsa.push('ADMIN_SECRET')
  return lipsa
}

/* ------------------------------------------------------------------ */
/* Semnătura                                                          */
/* ------------------------------------------------------------------ */

const codor = new TextEncoder()

async function cheie(): Promise<CryptoKey> {
  const s = secret()
  if (!s) throw new Error('ADMIN_SECRET lipsește.')
  return crypto.subtle.importKey('raw', codor.encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

function base64url(octeti: ArrayBuffer): string {
  let bin = ''
  for (const b of new Uint8Array(octeti)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function semneaza(mesaj: string): Promise<string> {
  return base64url(await crypto.subtle.sign('HMAC', await cheie(), codor.encode(mesaj)))
}

/**
 * Comparație în timp constant. Diferența de lungime scapă oricum (e
 * vizibilă și altfel), dar conținutul nu.
 */
function egalConstant(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diferit = 0
  for (let i = 0; i < a.length; i++) diferit |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diferit === 0
}

/* ------------------------------------------------------------------ */
/* Intrare și ieșire                                                  */
/* ------------------------------------------------------------------ */

export type RezultatIntrare =
  | { ok: true }
  | { ok: false; motiv: 'neconfigurat' | 'parola-greșită' | 'prea-multe-încercări'; asteaptaSec?: number }

/**
 * Verifică parola și, dacă e bună, pune cookie-ul de sesiune.
 *
 * `identificator` e IP-ul cererii — cheia pentru limitarea de rată.
 * Cinci încercări la cinci minute: destul pentru cineva care a greșit
 * tastarea, prea puțin pentru cineva care încearcă din dicționar. Fără
 * Upstash, limitarea e doar în memorie (vezi `lib/rate-limit.ts`), deci
 * pe Vercel merită configurat și el.
 */
export async function intra(parolaData: string, identificator: string): Promise<RezultatIntrare> {
  if (!esteConfigurat()) return { ok: false, motiv: 'neconfigurat' }

  const limita = await limiteaza({ cheie: `panou:${identificator}`, max: 5, fereastraSec: 300 })
  if (limita.blocat) return { ok: false, motiv: 'prea-multe-încercări', asteaptaSec: limita.resetSec }

  if (!egalConstant(parolaData, parola()!)) return { ok: false, motiv: 'parola-greșită' }

  const expira = Date.now() + DURATA_SEC * 1000
  const mesaj = String(expira)
  const valoare = `${mesaj}.${await semneaza(mesaj)}`

  const magazie = await cookies()
  magazie.set(COOKIE, valoare, {
    httpOnly: true,
    // Pe `localhost` cookie-ul n-ar fi trimis deloc cu `secure`.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURATA_SEC,
  })

  return { ok: true }
}

/** Șterge cookie-ul. Nu există nimic altceva de curățat. */
export async function iesi(): Promise<void> {
  const magazie = await cookies()
  magazie.delete(COOKIE)
}

/**
 * Sesiunea e valabilă?
 *
 * Verifică semnătura ÎNTÂI, expirarea după — invers, un cookie meșterit
 * cu o dată din viitor ar trece de prima poartă.
 */
export async function areSesiune(): Promise<boolean> {
  if (!esteConfigurat()) return false

  const valoare = (await cookies()).get(COOKIE)?.value
  if (!valoare) return false

  const separator = valoare.lastIndexOf('.')
  if (separator < 1) return false
  const mesaj = valoare.slice(0, separator)
  const semnatura = valoare.slice(separator + 1)

  let asteptata: string
  try {
    asteptata = await semneaza(mesaj)
  } catch {
    return false
  }
  if (!egalConstant(semnatura, asteptata)) return false

  const expira = Number(mesaj)
  return Number.isFinite(expira) && expira > Date.now()
}

/**
 * Sesiune sau eroare — pentru rutele API.
 *
 * Întoarce `null` când e în regulă, altfel răspunsul de trimis. Așa
 * fiecare rută începe cu două linii și nu poate uita verificarea:
 *
 *   const refuz = await cereSesiune()
 *   if (refuz) return refuz
 */
export async function cereSesiune(): Promise<Response | null> {
  if (await areSesiune()) return null
  return Response.json(
    { eroare: 'Sesiunea a expirat. Intră din nou.' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  )
}
