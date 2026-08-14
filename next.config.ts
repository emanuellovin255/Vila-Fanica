import type { NextConfig } from 'next'

import { redirecturi } from './redirecturi'

/**
 * Configurația motorului. Nimic de aici nu e specific unui client.
 *
 * De ce NU `output: 'export'`:
 * exportul complet static ar scoate din joc `middleware.ts` (CSP cu nonce, T09)
 * și route handler-ul formularului (T10). Next.js pre-generează oricum la build
 * fiecare pagină care nu cere date la cerere — adică toate paginile unui site de
 * cazare. Câștigăm SSG-ul cerut de `standarde/02` fără să pierdem serverul de
 * care avem nevoie pentru securitate.
 */
const config: NextConfig = {
  reactStrictMode: true,

  // Metadate în `<head>`, nu în `<body>`. Din 15.2, Next „streamuiește"
  // metadatele: pentru browsere obișnuite le trimite în corp și le mută în
  // cap din React (client-side), rezervând plasarea în `<head>` doar pentru
  // boturile pe care le recunoaște după user-agent. Cu randare dinamică (T09,
  // nonce-ul CSP) asta înseamnă că title/description/canonical ajung în
  // `<body>` pentru orice user-agent nerecunoscut — inclusiv Lighthouse și
  // orice crawler mai simplu — unde nu contează pentru SEO. Forțăm metadate
  // blocante (în `<head>`) pentru toți: rezolvarea lor e ieftină (citim
  // `date/*.md`, deja în cache), deci costul pe TTFB e neglijabil.
  htmlLimitedBots: /.*/,

  // Fără asta, Next urcă în arbore după un lockfile și alege directorul
  // home al utilizatorului ca rădăcină de proiect. Motorul e rădăcina lui.
  outputFileTracingRoot: __dirname,

  // Conținutul clientului, împachetat în funcțiile serverless.
  //
  // Paginile se randează la cerere, ca să poarte nonce-ul CSP (vezi mai jos),
  // deci loader-ul citește `date/*.md` la FIECARE cerere, nu doar la build.
  // Urmăritorul de fișiere al Next vede doar căi literale: prinde singur
  // `.client-activ`, dar nu și `path.join(radacinaClient, 'date', ...)`, care
  // se compune la rulare. Rezultatul, pe Vercel, era o funcție care știa ce
  // client servește dar n-avea niciun fișier al lui: „Application error: a
  // server-side exception has occurred" la fiecare pagină.
  //
  // `poze/` NU intră aici, intenționat: sunt zeci de MB, iar la rulare ne
  // trebuie doar lista de nume. Ea se scrie în `content/poze.json` la
  // prebuild (`sync-media`) — câțiva KB în loc de tot folderul.
  outputFileTracingIncludes: {
    '/**': ['./setari.md', './date/**/*.md', './en/**/*.md', './content/poze.json'],
  },

  // Fiecare poză a clientului e descărcată și re-encodată local în public/media,
  // deci site-ul generat nu depinde niciodată de serverul lui vechi (REGULI.md 9).
  images: {
    formats: ['image/avif', 'image/webp'],
    // Fără `remotePatterns`: nu servim imagini de pe alt domeniu, intenționat.
  },

  // Migrarea SEO (tasks/T04): 301-uri de la URL-urile site-ului WordPress
  // vechi. Lista, cu motivul fiecărei decizii, e în `redirecturi.ts`;
  // inventarul complet al celor 120 de adrese vechi, în `MIGRARE.md`.
  //
  // E singura excepție de la „nimic din config nu e specific unui client":
  // fișierul importat e al clientului, config-ul rămâne generic.
  async redirects() {
    return redirecturi
  },

  // Numai headerele care nu au nevoie de nonce. CSP și HSTS vin din middleware,
  // ca să poată purta nonce-ul cererii. Restul politicii de cache stă în vercel.json.
  async headers() {
    return [
      {
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default config
