/* ============================================================
   lib/csp.ts — construiește Content-Security-Policy cu nonce.

   Rulează pe edge (din middleware), deci: zero acces la disc, zero
   dependențe. Tot ce e specific unui client (domeniul motorului de
   rezervări) intră prin variabilă de mediu, nu prin citirea din
   `date/10-...` — edge-ul nu poate citi fișiere.

   FILOZOFIA politicii:
   - `script-src` NU are `unsafe-inline`. Scripturile lui Next (bootstrap,
     datele de hidratare) primesc nonce-ul cererii, generat aici. Cu
     `strict-dynamic`, un script de încredere (cu nonce) poate încărca la
     rândul lui alte scripturi — așa merg loaderele Next și Turnstile —
     iar allowlist-ul pe gazdă devine irelevant în browserele moderne.
     `'self'` rămâne ca plasă pentru browserele fără `strict-dynamic`.
   - `unsafe-inline` e permis DOAR pe `style` — componentele setează
     variabile CSS prin atributul `style` (adâncime, reveal, T02). E o altă
     axă decât `script-src`: nu deschide XSS de execuție.
   - `frame-ancestors 'self'` înlocuiește `X-Frame-Options` (clickjacking).
   - `frame-src` permite EXACT motorul de rezervări al clientului (T12) și
     widget-ul Turnstile. Fără wildcard.
   - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` — închid
     vectorii clasici (plugin-uri, deturnarea `<base>`, exfiltrare prin form).
   ============================================================ */

/**
 * `'unsafe-eval'` DOAR în dezvoltare, și nu pentru panou.
 *
 * HMR-ul lui Next evaluează module ca șiruri. CSP-ul le bloca, `main-app.js`
 * murea cu `EvalError` și NICIUN component client nu se hidrata în
 * `npm run dev`: banner de cookies inert, meniu de telefon mort, formular
 * mort. Eroarea apărea doar în consolă, deci a trecut neobservată (era deja
 * notată ca „de verificat separat" în `MOTOR-MODIFICAT.md`).
 *
 * În producție nu există HMR, deci politica strictă rămâne neatinsă acolo.
 */
const DEV = process.env.NODE_ENV === 'development'

/** Widget-ul Turnstile: scriptul și iframe-ul lui vin de aici. */
const TURNSTILE = 'https://challenges.cloudflare.com'

/** Harta reală (T06/T12) se încarcă în iframe DE LA GOOGLE, dar doar la click. */
const MAPS = 'https://www.google.com'

/**
 * Domeniile Google Analytics. Se adaugă la CSP DOAR dacă Analytics e configurat
 * (`NEXT_PUBLIC_ANALYTICS_ID`). A permite un domeniu în CSP nu declanșează niciun
 * request — GA nu pleacă înainte de accept (T11, `components/Analytics.tsx`); CSP
 * doar nu-l blochează după. Un site fără Analytics nu-și lărgește deloc politica.
 */
const GA_ACTIV = Boolean(process.env.NEXT_PUBLIC_ANALYTICS_ID)
const GA_SCRIPT = 'https://www.googletagmanager.com'
const GA_CONNECT = ['https://www.google-analytics.com', 'https://region1.google-analytics.com', GA_SCRIPT]
const GA_IMG = 'https://www.google-analytics.com'

/**
 * Domeniul motorului de rezervări încadrat în iframe (T12). Sursa de
 * adevăr e `date/10-rezervari-si-plati.md` (câmpul `booking.engineUrl`);
 * edge-ul nu poate citi fișiere, așa că valoarea e expusă aici ca origin.
 * T12 leagă datele → această variabilă la configurarea clientului.
 * Gol = niciun iframe extern permis (`frame-src 'self'`).
 */
function originRezervari(): string {
  const raw = process.env.BOOKING_ENGINE_ORIGIN?.trim()
  if (!raw) return ''
  try {
    return new URL(raw).origin
  } catch {
    return ''
  }
}

/** Generează un nonce criptografic pe cerere. `crypto` e global pe edge. */
export function genereazaNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  // base64 din octeți, fără dependențe de Node Buffer.
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/**
 * Construiește valoarea headerului CSP pentru un nonce dat.
 * O singură linie, spații normalizate — gata de pus pe header.
 */
export function construiesteCsp(nonce: string): string {
  const rezervari = originRezervari()
  const frameSrc = ['frame-src', "'self'", TURNSTILE, MAPS, rezervari].filter(Boolean).join(' ')
  const connect = ["'self'", TURNSTILE, ...(GA_ACTIV ? GA_CONNECT : [])].join(' ')
  const img = ["'self'", 'data:', 'blob:', ...(GA_ACTIV ? [GA_IMG] : [])].join(' ')

  const directive = [
    "default-src 'self'",
    // nonce = poarta reală; strict-dynamic propagă încrederea; 'self' = fallback vechi.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${DEV ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img}`,
    "font-src 'self'",
    // formularul trimite same-origin; Turnstile (și GA, după accept) deschid conexiuni.
    `connect-src ${connect}`,
    frameSrc,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    'upgrade-insecure-requests',
  ]

  return directive.join('; ').replace(/\s{2,}/g, ' ').trim()
}

/**
 * Headerele de securitate care nu depind de nonce, puse DOAR aici (nu și
 * în vercel.json), ca să nu se dubleze pe același răspuns. Restul politicii
 * statice — `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
 * — stă exclusiv în vercel.json, fiindcă acoperă și fișierele servite fără
 * middleware (media, fonturi, `_next/static`).
 */
export const HEADERE_SECURITATE: Array<[string, string]> = [
  // Forțează HTTPS 2 ani, pe tot subdomeniul, eligibil de preload.
  ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload'],
  // Redundant cu `frame-ancestors 'self'`, dar ajută browserele vechi.
  ['X-Frame-Options', 'SAMEORIGIN'],
]
