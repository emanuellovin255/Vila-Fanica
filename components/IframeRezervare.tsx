'use client'

import { useState } from 'react'

/* ============================================================
   components/IframeRezervare.tsx — motorul de rezervări, încărcat LENEȘ (T12).

   Un widget de rezervări încărcat prost adaugă singur 500 KB+ și 2s de LCP. De
   aceea NU se încarcă la primul paint: până la click stă un placeholder cu
   ÎNĂLȚIME FIXĂ, ca layout-ul să nu sară (CLS 0). Iframe-ul apare doar când
   vizitatorul cere disponibilitatea.

   Domeniul iframe-ului trebuie să fie în CSP `frame-src` (T09), din
   `BOOKING_ENGINE_ORIGIN` — fără wildcard.
   ============================================================ */

const INALTIME = 620

export function IframeRezervare({
  src,
  titlu = 'Verifică disponibilitatea',
  eticheta = 'Încarcă motorul de rezervări',
  auto = false,
}: {
  src: string
  titlu?: string
  eticheta?: string
  /** `true` = pornește încărcat (când componenta apare deja în urma unei acțiuni). */
  auto?: boolean
}) {
  const [incarcat, setIncarcat] = useState(auto)

  return (
    <div
      className="iframe-rezervare"
      style={{ minHeight: INALTIME }}
    >
      {incarcat ? (
        <iframe
          src={src}
          title={titlu}
          loading="lazy"
          style={{ width: '100%', height: INALTIME, border: 0 }}
        />
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setIncarcat(true)}>
          {eticheta}
        </button>
      )}
    </div>
  )
}
