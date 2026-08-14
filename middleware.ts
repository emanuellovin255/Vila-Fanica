import { NextResponse, type NextRequest } from 'next/server'

import { construiesteCsp, genereazaNonce, HEADERE_SECURITATE } from '@/lib/csp'
import { LIMBA_IMPLICITA, LIMBI, type Limba } from '@/lib/i18n/limbi'
import { traduSegmentIntern } from '@/lib/i18n/rute'

/**
 * Middleware-ul motorului. Face două lucruri, în ordine:
 *
 *   1. SECURITATE (T09): pune un nonce proaspăt pe fiecare cerere și
 *      Content-Security-Policy + HSTS + restul politicii. Nonce-ul intră
 *      și în headerele CERERII, ca Next să-l poată citi și să-l aplice
 *      pe scripturile pe care le emite (bootstrap, date de hidratare).
 *      Fără asta, un CSP fără `unsafe-inline` ar bloca propriul site.
 *
 *   2. LIMBĂ (T08): scoate prefixul limbii implicite din adresele publice
 *      printr-un rewrite intern.
 *
 * DE CE NONCE ȘI NU HASH-URI STATICE
 * ----------------------------------
 * Scripturile de hidratare ale Next conțin date per-pagină; hash-ul lor
 * s-ar schimba la fiecare modificare de conținut, imposibil de fixat într-un
 * header static. Nonce-ul e generat pe cerere, deci merge oricât s-ar
 * schimba pagina. Costul acceptat (și motivul pentru care `next.config.ts`
 * nu folosește `output: 'export'`): paginile se randează la cerere ca să
 * poarte nonce-ul. Conținutul e pre-construit la build; doar ștampilarea
 * nonce-ului se face per-cerere, la edge — rapid, fără date de utilizator.
 *
 * DE CE REWRITE, NU REDIRECT (limbă)
 * ----------------------------------
 * Layout-ul rădăcină stă la `app/[limba]/layout.tsx`, ca `<html lang>` să
 * fie corect pe fiecare rută (T08). Dar româna nu poartă prefix în URL: e
 * limba implicită și duce majoritatea traficului. Rewrite păstrează adresa
 * din bară și servește pagina pre-generată la `/ro/...`.
 *
 * EXCEPȚIA `/admin` (panoul de administrare)
 * ------------------------------------------
 * Panoul stă la `app/admin/`, în afara lui `app/[limba]/`. Fără excepția de
 * mai jos, `/admin` s-ar rescrie în `/ro/admin`, care nu există: panoul ar da
 * 404. Sare peste REWRITE, nu peste middleware — rămâne în `matcher`, deci
 * primește nonce, CSP și HSTS ca orice altă pagină. Scos din matcher, ar fi
 * singura pagină a site-ului fără politică de securitate, adică exact cea
 * care nu trebuie.
 */

/** `/admin` și tot ce e sub el. */
const ESTE_ADMIN = /^\/admin(\/|$)/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1 · Nonce + CSP. Nonce-ul merge pe headerele CERERII (ca să-l citească
  // Next la randare) și pe cele ale RĂSPUNSULUI (ca să-l impună browserul).
  const nonce = genereazaNonce()
  const csp = construiesteCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  // 2 · Rewrite de limbă. Panoul de administrare îl sare (vezi mai sus).
  const response = ESTE_ADMIN.test(pathname)
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : rewriteCuLimba(request, requestHeaders, pathname)

  // CSP + restul politicii pe răspuns.
  response.headers.set('Content-Security-Policy', csp)
  for (const [cheie, valoare] of HEADERE_SECURITATE) response.headers.set(cheie, valoare)

  return response
}

/**
 * Rewrite-ul de limbă, scos într-o funcție ca `/admin` să-l poată sări.
 *
 * `/en/...` și `/ro/...` merg neatinse; `/ro/...` rămâne accesibil
 * intenționat (canonical din T07 îl trimite la varianta fără prefix, deci nu
 * se duplică în index).
 */
function rewriteCuLimba(request: NextRequest, requestHeaders: Headers, pathname: string) {
  const prefix = LIMBI.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  return prefix
    ? rewriteSegmentTradus(request, requestHeaders, prefix)
    : rewriteFaraPrefix(request, requestHeaders)
}

/**
 * Adresa publică tradusă → ruta reală. `/en/rooms/x` servește
 * `app/[limba]/camere/[slug]`, fără să schimbe bara de adrese.
 *
 * DE CE E NEVOIE (T08, T76)
 * -------------------------
 * `app/[limba]/` are un singur folder per pagină, numit românește. Dar
 * slug-urile de nivel înalt se traduc (`lib/i18n/rute.ts`), fiindcă
 * `/en/camere` n-ar fi o adresă engleză. Fără rewrite-ul ăsta, tot ce
 * produce comutatorul de limbă, sitemap-ul și `hreflang`-ul pe engleză
 * dădea 404 — engleza n-a fost niciodată pornită, deci nimeni n-a lovit
 * pragul până acum.
 *
 * Pentru română e o funcție identitate: cheia hărții E numele folderului.
 */
function rewriteSegmentTradus(request: NextRequest, requestHeaders: Headers, limba: Limba) {
  const { pathname } = request.nextUrl
  const fara = pathname.slice(`/${limba}`.length) || '/'
  const intern = traduSegmentIntern(fara, limba)
  if (intern === fara) return NextResponse.next({ request: { headers: requestHeaders } })

  const url = request.nextUrl.clone()
  url.pathname = `/${limba}${intern === '/' ? '' : intern}`
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
}

function rewriteFaraPrefix(request: NextRequest, requestHeaders: Headers) {
  const url = request.nextUrl.clone()
  const { pathname } = request.nextUrl
  url.pathname = `/${LIMBA_IMPLICITA}${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    // Tot, în afară de fișierele statice, de API și de optimizatorul de
    // imagini: un rewrite sau un CSP pe un .woff2 nu apără nimic și costă
    // la fiecare cerere. Fișierele statice primesc headerele lor din
    // vercel.json. Route handler-ul formularului (T10) își pune singur CSP-ul.
    '/((?!api/|_next/static|_next/image|fonts/|media/|favicon.ico|icon|robots.txt|sitemap.xml|llms.txt).*)',
  ],
}
