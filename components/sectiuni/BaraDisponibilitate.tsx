'use client'

import { type FormEvent, useState } from 'react'

import { Icon } from '@/components/Icon'
import { IframeRezervare } from '@/components/IframeRezervare'
import type { SiteData } from '@/content/types'
import { rezolvaRezervare } from '@/lib/rezervari'
import { urlWhatsApp } from '@/lib/whatsapp'

/**
 * Bara de disponibilitate: check-in, check-out, persoane, submit.
 *
 * `"use client"` fiindcă e interactivă. Dar — atenție — NU conține
 * motorul de rezervări (T06). Doar colectează datele și le predă
 * adaptorului din T12 prin `onCauta`. Șablonul nu știe cu ce sistem
 * vorbește: deep-link, iframe sau formular, decizia e a adaptorului.
 *
 * Fără JavaScript rămâne un `<form>` real care face GET către
 * `#rezervare`: câmpurile ajung în URL, iar adaptorul server-side le
 * poate citi. Nu e la fel de fluid, dar funcționează — pagina rămâne
 * întreagă (REGULI.md 12).
 *
 * Toate etichetele vin din `booking.labels` (T05), deci se traduc la
 * T08 fără să atingem componenta.
 */
export function BaraDisponibilitate({
  date,
  onCauta,
}: {
  date: SiteData
  onCauta?: (cerere: { checkIn: string; checkOut: string; persoane: string }) => void
}) {
  const { booking } = date
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [persoane, setPersoane] = useState(booking.guestOptions[0] ?? '')
  const [srcIframe, setSrcIframe] = useState<string | null>(null)

  const optiuni = booking.guestOptions.length ? booking.guestOptions : ['2 persoane']

  /*
   * Linkul secundar de WhatsApp, cu perioada deja aleasă în bară. Doar când
   * butonul principal duce în altă parte (motor de rezervări): pe `formular`,
   * întregul bloc e deja WhatsApp și un al doilea link ar fi zgomot.
   */
  const linkWhatsApp =
    booking.mod === 'deep-link'
      ? urlWhatsApp(date.contact, date.ui, {
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
          persoane: Number.parseInt(persoane, 10) || undefined,
        })
      : undefined

  /**
   * Cu JavaScript, submit-ul consultă adaptorul (T12) și execută rezultatul:
   * deep-link → navighează în motorul lor cu datele completate; iframe → îl
   * dezvăluie leneș sub bară; formular → coboară la formularul de contact.
   * Fără JavaScript, `onSubmit` nu rulează: `<form>`-ul face GET către
   * `#rezervare`, unde rămân telefonul și formularul (REGULI.md 12).
   *
   * EXCEPȚIA WHATSAPP, cerută de client. Când locația n-are motor de
   * rezervări (`mod: 'formular'`, cazul de față) dar are un număr de
   * WhatsApp, cererea pleacă direct în conversație, cu perioada aleasă
   * deja scrisă în mesaj: „sosire 14.08.2026, plecare 16.08.2026, 2
   * oaspeți". E singurul pas care chiar închide bucla — formularul de
   * contact cere încă un rând de completat, apoi așteptare pe email.
   *
   * Se verifică ÎNAINTE de adaptor, dar numai pe ramura `formular`: dacă
   * într-o zi apare linkul de Booking (T74 §5), deep-link-ul rămâne
   * prioritar și nimic de aici nu-l ocolește.
   */
  function laSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cerere = { checkIn, checkOut, persoane }
    if (onCauta) {
      onCauta(cerere)
      return
    }

    if (booking.mod === 'formular') {
      const wa = urlWhatsApp(date.contact, date.ui, {
        checkIn,
        checkOut,
        persoane: Number.parseInt(persoane, 10) || undefined,
      })
      if (wa) {
        window.open(wa, '_blank', 'noopener,noreferrer')
        return
      }
    }

    const r = rezolvaRezervare(booking, cerere)
    if (r.tip === 'link') {
      // Tab nou: motorul e alt site (la noi, Booking), iar cine se răzgândește
      // trebuie să găsească pensiunea acolo unde a lăsat-o. Cu pop-up-urile
      // oprite `window.open` întoarce `null` — atunci mergem în tabul curent,
      // ca butonul să nu pară mort.
      const tab = window.open(r.url, '_blank', 'noopener,noreferrer')
      if (!tab) window.location.href = r.url
    } else if (r.tip === 'iframe') {
      setSrcIframe(r.src)
    } else {
      const formular = document.getElementById('formular')
      if (formular) formular.scrollIntoView({ behavior: 'smooth' })
      else window.location.hash = 'rezervare'
    }
  }

  return (
    <section id="rezervare" aria-label={booking.labels.submit}>
      <div className="wrap">
        <form className="booking" method="get" action="#rezervare" onSubmit={laSubmit}>
          <label className="bk-field">
            {booking.labels.checkIn}
            <input
              type="date"
              name="checkIn"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </label>
          <label className="bk-field">
            {booking.labels.checkOut}
            <input
              type="date"
              name="checkOut"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </label>
          <label className="bk-field">
            {booking.labels.guests}
            <select name="persoane" value={persoane} onChange={(e) => setPersoane(e.target.value)}>
              {optiuni.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary" type="submit">
            <Icon name="search" marime="sm" />
            {booking.labels.submit}
          </button>

          {(booking.assurances.length > 0 || linkWhatsApp) && (
            <div className="bk-note">
              {booking.assurances.map((a, i) => (
                <span key={i}>
                  <Icon name="check" marime="sm" />
                  {a}
                </span>
              ))}

              {/* A doua cale, discretă: butonul mare duce pe Booking, dar cine
                  vrea gazda direct n-are de ce să treacă printr-un
                  intermediar. Apare doar când există și motor, și WhatsApp —
                  fără motor, tot blocul ăsta E deja WhatsApp. */}
              {linkWhatsApp && (
                <a className="bk-alt" href={linkWhatsApp} target="_blank" rel="noopener noreferrer">
                  <Icon name="phone" marime="sm" />
                  {date.ui.sauIntreabaDirect}
                </a>
              )}
            </div>
          )}
        </form>

        {/* Iframe-ul motorului, dezvăluit leneș doar după submit (mod „iframe"). */}
        {srcIframe && <IframeRezervare src={srcIframe} auto titlu={booking.labels.submit} eticheta={date.ui.incarcaMotorul} />}
      </div>
    </section>
  )
}
