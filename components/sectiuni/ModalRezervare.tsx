'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Calendar } from './Calendar'
import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'
import { numeMotor, rezolvaRezervare } from '@/lib/rezervari'
import { dataLizibila, nopti, urlWhatsApp } from '@/lib/whatsapp'

const MAX_OASPETI = 12

/**
 * Dialogul de disponibilitate (T64): calendar de perioadă + număr de
 * oaspeți, apoi ieșirea către locul unde se răspunde la „e liber?".
 *
 * DOUĂ IEȘIRI, DUPĂ CONFIGURAȚIE (`date/10-rezervari-si-plati.md`):
 *
 *   „Tip: link"      → motorul locației (aici Booking.com), cu perioada și
 *                      numărul de oaspeți deja completate. Acolo e sursa
 *                      reală de disponibilitate și prețul exact. Dacă există
 *                      și WhatsApp, apare lângă, ca a doua cale — cine vrea
 *                      să vorbească direct cu gazda n-are de ce să treacă
 *                      printr-un intermediar.
 *   „Tip: formular"  → doar WhatsApp, cu mesajul scris (comportamentul de
 *                      dinainte de conectarea la Booking).
 *
 * DE CE UN DIALOG, nu o pagină: dialogul nu scoate omul din pagină, deci dacă
 * se răzgândește rămâne unde era. Iar noi nu avem ce afișa după „caută" —
 * disponibilitatea o știe motorul, nu site-ul; noi doar ducem întrebarea acolo
 * completă, ca omul să nu reintroducă nimic.
 *
 * Fără JavaScript dialogul nu există, iar butonul care l-ar fi deschis rămâne
 * un `<a>` către motor sau către WhatsApp (`ButonDisponibilitate`): mai sărac
 * — fără perioadă — dar întreg (REGULI.md 12).
 *
 * SE RANDEAZĂ ÎN `document.body`, PRIN PORTAL. Nu e o preferință: butonul
 * care deschide dialogul stă și în antet, iar antetul are `backdrop-filter`.
 * Orice element cu `backdrop-filter` devine bloc conținător pentru
 * descendenții `position: fixed` — așa că un overlay „pe tot ecranul"
 * randat acolo se întindea pe cei 74px ai antetului, iar calendarul ieșea
 * tăiat deasupra ecranului. Portalul îl scoate din antet.
 */
export function ModalRezervare({
  date,
  subiect,
  onInchide,
}: {
  date: SiteData
  subiect?: string
  onInchide: () => void
}) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [persoane, setPersoane] = useState(2)
  /*
   * Numele oaspetelui. Rămâne OPȚIONAL: gol, rândul lipsește pur și simplu
   * din mesaj, ca orice câmp gol din motor. Un câmp obligatoriu aici ar
   * transforma butonul de WhatsApp într-un formular — adică exact în lucrul
   * pe care butonul îl înlocuiește.
   */
  const [nume, setNume] = useState('')
  /*
   * Camera. Când butonul a fost apăsat DIN dreptul unei camere sau al unui
   * pachet, `subiect` e deja răspunsul și nu mai întrebăm — ar fi un câmp
   * care cere ce omul tocmai a spus. Doar butoanele generale (antet, hero,
   * bara lipită) arată lista.
   */
  const camere = date.rooms.items.map((c) => c.name)
  const [camera, setCamera] = useState('')
  const panou = useRef<HTMLDivElement>(null)

  /* Escape închide, iar fundalul nu se mai poate derula cât timp dialogul
     e deschis — altfel, pe telefon, degetul mișcă pagina de dedesubt. */
  useEffect(() => {
    function laTasta(e: KeyboardEvent) {
      if (e.key === 'Escape') onInchide()
    }
    document.addEventListener('keydown', laTasta)
    const dinainte = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panou.current?.focus()
    return () => {
      document.removeEventListener('keydown', laTasta)
      document.body.style.overflow = dinainte
    }
  }, [onInchide])

  const ui = date.ui
  const n = checkIn && checkOut ? nopti(checkIn, checkOut) : undefined
  const gata = Boolean(checkIn && checkOut)
  const href = urlWhatsApp(date.contact, date.ui, {
    nume,
    subiect: subiect || camera || undefined,
    checkIn,
    checkOut,
    persoane,
  })

  /*
   * Motorul de rezervări, dacă locația are unul. Se cere adaptorului (T12), nu
   * se construiește aici: dialogul n-are de unde ști cum își numește Booking
   * parametrii, iar dacă mâine se schimbă furnizorul, aici nu e nimic de
   * editat. Numele de pe buton („Booking.com") vine din adresa reală, deci
   * nu poate ajunge să mintă.
   */
  const motor =
    date.booking.mod === 'deep-link'
      ? rezolvaRezervare(date.booking, {
          checkIn,
          checkOut,
          persoane: String(persoane),
        })
      : undefined
  const urlMotor = motor?.tip === 'link' ? motor.url : undefined
  const eticheteMotor = numeMotor(date.booking.engineUrl)

  /** Deschide un link în tab nou, dar nu lasă omul blocat dacă pop-up-ul e oprit. */
  function deschide(url: string) {
    const tab = window.open(url, '_blank', 'noopener,noreferrer')
    if (!tab) window.location.href = url
  }

  /** Ieșirea principală: motorul când există, altfel WhatsApp, altfel telefonul. */
  function trimite() {
    if (!gata) return
    if (urlMotor) deschide(urlMotor)
    else if (href) deschide(href)
    else if (date.contact.phoneHref) window.location.href = date.contact.phoneHref
    onInchide()
  }

  /** Ieșirea secundară, vizibilă doar când există și motor, și WhatsApp. */
  function trimiteWhatsApp() {
    if (!gata || !href) return
    deschide(href)
    onInchide()
  }

  const dialog = (
    <div className="mdl" role="presentation" onClick={onInchide}>
      <div
        className="mdl-panou"
        role="dialog"
        aria-modal="true"
        aria-label={date.booking.labels.submit}
        tabIndex={-1}
        ref={panou}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mdl-cap">
          <div>
            <h2>{date.booking.labels.submit}</h2>
            {subiect && <p className="mdl-subiect">{subiect}</p>}
          </div>
          <button type="button" className="mdl-inchide" onClick={onInchide} aria-label={ui.inchide}>
            <Icon name="close" marime="sm" />
          </button>
        </header>

        <div className="mdl-rezumat">
          <div className="mdl-camp">
            <small>{date.booking.labels.checkIn}</small>
            <b>{checkIn ? dataLizibila(checkIn, ui) : '—'}</b>
          </div>
          <div className="mdl-camp">
            <small>{date.booking.labels.checkOut}</small>
            <b>{checkOut ? dataLizibila(checkOut, ui) : '—'}</b>
          </div>
          <div className="mdl-camp">
            <small>{date.booking.labels.guests}</small>
            <div className="mdl-pas">
              <button
                type="button"
                onClick={() => setPersoane((p) => Math.max(1, p - 1))}
                disabled={persoane <= 1}
                aria-label={ui.unOaspeteMaiPutin}
              >
                −
              </button>
              <b className="tabular" aria-live="polite">
                {persoane}
              </b>
              <button
                type="button"
                onClick={() => setPersoane((p) => Math.min(MAX_OASPETI, p + 1))}
                disabled={persoane >= MAX_OASPETI}
                aria-label={ui.incaUnOaspete}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/*
          Numele. Stă înaintea camerei fiindcă asta e ordinea în care se
          prezintă un om: întâi cine e, apoi ce vrea. Rămâne opțional —
          fără el, mesajul pleacă exact ca înainte, doar fără primul rând.
        */}
        <label className="mdl-camera">
          <small>{ui.numeleTau}</small>
          <input
            type="text"
            name="nume"
            autoComplete="name"
            placeholder={ui.numeleTauExemplu}
            value={nume}
            onChange={(e) => setNume(e.target.value)}
          />
        </label>

        {/* Camera dorită — doar când butonul n-a venit deja din dreptul uneia. */}
        {!subiect && camere.length > 0 && (
          <label className="mdl-camera">
            <small>{ui.camera}</small>
            <select value={camera} onChange={(e) => setCamera(e.target.value)}>
              <option value="">{ui.nuMamHotarat}</option>
              {camere.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        <Calendar
          ui={ui}
          checkIn={checkIn}
          checkOut={checkOut}
          onSchimba={(i, o) => {
            setCheckIn(i)
            setCheckOut(o)
          }}
        />

        <footer className="mdl-jos">
          <p className="mdl-nopti">
            {n ? `${n} ${n === 1 ? ui.noapte : ui.nopti}` : ui.alegePerioada}
          </p>

          {/* Cu motor: „Rezervă pe Booking.com" e acțiunea principală (acolo
              se vede ce e liber), iar WhatsApp rămâne alături, pentru cine
              vrea gazda direct. Fără motor: exact butonul de dinainte. */}
          <div className="mdl-actiuni">
            {urlMotor && href && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={trimiteWhatsApp}
                disabled={!gata}
              >
                <Icon name="phone" marime="sm" />
                {ui.intreabaPeWhatsApp}
              </button>
            )}
            <button
              type="button"
              className={`btn ${urlMotor ? 'btn-primary' : 'btn-wa'}`}
              onClick={trimite}
              disabled={!gata}
            >
              <Icon name={urlMotor ? 'search' : 'phone'} marime="sm" />
              {urlMotor && eticheteMotor
                ? `${ui.rezervaPe} ${eticheteMotor}`
                : date.booking.labels.submit}
            </button>
          </div>
        </footer>

        <p className="mdl-nota">
          {urlMotor && eticheteMotor
            ? ui.notaMotor.replace('{motor}', eticheteMotor)
            : ui.notaWhatsApp}
        </p>
      </div>
    </div>
  )

  return createPortal(dialog, document.body)
}
