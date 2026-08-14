/* ============================================================
   lib/turnstile.ts — verificarea Cloudflare Turnstile, server-side.

   Turnstile e cerut în `standarde/01` dar nu apare în niciun site din
   `Siteuri gata/`. Aici devine cod real. E invizibil pentru omul real
   (spre deosebire de un CAPTCHA clasic, care taie din conversie): widget-ul
   emite un token în fundal, iar noi îl verificăm AICI, pe server.

   De ce server-side: un token „valid" după verificarea din browser nu
   înseamnă nimic — oricine poate sări peste JavaScript-ul din pagină și
   trimite direct la endpoint. Adevărul e la Cloudflare, întrebat cu cheia
   secretă pe care browserul n-o vede niciodată.

   Complementar honeypot-ului din `validare.ts`, nu în locul lui: honeypot-ul
   e gratuit și prinde boți proști; Turnstile prinde ce trece de honeypot.
   ============================================================ */

const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const SECRET = process.env.TURNSTILE_SECRET_KEY
const TIMEOUT_MS = 5000

/** `true` doar când cheia secretă e configurată; altfel verificarea se sare. */
export const TURNSTILE_ACTIV = Boolean(SECRET)

export type RezultatTurnstile = { ok: true } | { ok: false; eroare: string }

/**
 * Verifică un token Turnstile la Cloudflare.
 *
 * Fără `TURNSTILE_SECRET_KEY` (dezvoltare, sau un client care se bazează
 * doar pe honeypot + rate limit) răspunde `ok:true` fără să întrebe nimic —
 * widget-ul nici nu se randează, deci n-ar exista token de verificat.
 *
 * `remoteIp` e opțional dar recomandat: Cloudflare îl folosește la scor.
 * Dacă apelul la Cloudflare pică (rețea, timeout), respingem (fail-closed):
 * pe un formular, mai bine un submit ratat decât o poartă deschisă. Cine
 * chiar vrea să contacteze locația mai are telefonul din antet.
 */
export async function verificaTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<RezultatTurnstile> {
  if (!TURNSTILE_ACTIV) return { ok: true }
  if (!token) return { ok: false, eroare: 'Verificare anti-spam lipsă. Reîncarcă pagina.' }

  const corp = new URLSearchParams()
  corp.set('secret', SECRET as string)
  corp.set('response', token)
  if (remoteIp) corp.set('remoteip', remoteIp)

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: corp,
      signal: ctrl.signal,
      cache: 'no-store',
    })
    const data = (await res.json()) as { success?: boolean }
    if (data.success) return { ok: true }
    return { ok: false, eroare: 'Verificare anti-spam eșuată. Reîncearcă.' }
  } catch {
    return { ok: false, eroare: 'Nu am putut verifica cererea. Reîncearcă.' }
  } finally {
    clearTimeout(t)
  }
}
