'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Icon } from '@/components/Icon'

/**
 * Player pentru un clip vertical filmat cu telefonul (T60).
 *
 * Material real: portret (9/16), cu comentariu audio, 32–62 s. De aici
 * trei decizii care nu se negociază:
 *
 *  1. ZERO BYTES PÂNĂ LA CLICK. Elementul `<video>` NU există în HTML —
 *     până la apăsarea butonului, în pagină e doar posterul, ca orice
 *     `next/image`. Se montează abia din `onClick`, deci în panoul de
 *     rețea nu apare niciun request de video la încărcarea paginii
 *     (criteriu de terminare T60).
 *  2. CLICK-TO-PLAY, NU AUTOPLAY. Clipul are comentariu, nu e fundal
 *     decorativ. `autoPlay` pornește DOAR pentru că montarea vine dintr-un
 *     gest al utilizatorului, deci sunetul e permis de browser.
 *  3. SUNETUL RĂMÂNE PORNIT. Nu e `muted`. Controalele native rămân, ca
 *     oaspetele să poată opri sau da mai încet.
 */
export function VideoVertical({
  src,
  poster,
  eticheta,
}: {
  src: string
  poster: string
  eticheta: string
}) {
  const [redat, setRedat] = useState(false)

  return (
    <div className="video-vertical">
      {redat ? (
        <video
          className="video-vertical-el"
          src={src}
          poster={poster}
          controls
          autoPlay
          playsInline
          preload="none"
        />
      ) : (
        <button
          type="button"
          className="video-vertical-play"
          aria-label={`Redă clipul: ${eticheta}`}
          onClick={() => setRedat(true)}
        >
          <Image src={poster} alt="" fill sizes="(max-width: 420px) 100vw, 380px" />
          <span className="video-vertical-icon" aria-hidden="true">
            <Icon name="play" marime="lg" />
          </span>
        </button>
      )}
    </div>
  )
}
