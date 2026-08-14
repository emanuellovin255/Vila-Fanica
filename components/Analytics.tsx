'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

import { citeste, EVENIMENT_SCHIMBARE, type Consimtamant } from '@/lib/consimtamant'

/* ============================================================
   components/Analytics.tsx — Google Analytics, încărcat DOAR după accept.

   Miezul conformității GDPR din T11: înainte ca vizitatorul să accepte
   categoria „analitice", această componentă NU randează nimic — deci nu pleacă
   niciun request către googletagmanager.com sau google-analytics.com. Bannerul
   (`BannerCookies`) scrie alegerea, un `CustomEvent` o anunță, iar componenta
   reacționează fără reîncărcarea paginii.

   Fără `NEXT_PUBLIC_ANALYTICS_ID` nu se încarcă nimic, oricând — un site fără
   Analytics nu plătește nici măcar costul acestei verificări.
   ============================================================ */

export function Analytics() {
  const id = process.env.NEXT_PUBLIC_ANALYTICS_ID
  const [permis, setPermis] = useState(false)

  useEffect(() => {
    const aplica = (c: Consimtamant | null) => setPermis(Boolean(c?.analitice))
    aplica(citeste())
    const laSchimbare = (e: Event) => aplica((e as CustomEvent<Consimtamant>).detail)
    window.addEventListener(EVENIMENT_SCHIMBARE, laSchimbare)
    return () => window.removeEventListener(EVENIMENT_SCHIMBARE, laSchimbare)
  }, [])

  if (!id || !permis) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  )
}
