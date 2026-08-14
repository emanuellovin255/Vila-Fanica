import type { MetadataRoute } from 'next'

import { baseUrl } from '@/lib/seo/meta'

/**
 * robots.txt.
 *
 * Permite tot, cu excepția paginilor de probă ale motorului (nu ajung
 * la un client, dar dacă ajung, nu vrem să fie indexate) și a panoului
 * de administrare. Trimite spre sitemap. Crawlerele asistenților AI
 * (GPTBot, PerplexityBot și celelalte) sunt permise explicit —
 * vizibilitatea acolo e exact ce urmărim (T07).
 *
 * `/admin` e apărat de parolă, nu de `robots.txt`; rândul de mai jos e
 * doar ca să nu ajungă într-un index. `app/admin/layout.tsx` pune și
 * `noindex` pe pagină.
 */
export default function robots(): MetadataRoute.Robots {
  const base = baseUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/probe/', '/api/', '/admin'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
