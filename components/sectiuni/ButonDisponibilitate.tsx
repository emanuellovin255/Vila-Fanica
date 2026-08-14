'use client'

import { useState } from 'react'

import { ModalRezervare } from './ModalRezervare'
import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'
import { esteExtern, linkRezervare } from '@/lib/whatsapp'

/**
 * Butonul „Verifică disponibilitatea", peste tot unde apare.
 *
 * Cu JavaScript deschide dialogul de rezervare (calendar de perioadă +
 * număr de oaspeți). De acolo, perioada aleasă pleacă unde e disponibilitatea
 * reală: pe Booking, dacă locația are motor (`date/10-…`, „Tip: link"), sau pe
 * WhatsApp, cu camera, sosirea, plecarea, nopțile și oaspeții deja scrise.
 * Când există amândouă, dialogul le arată alături și omul alege.
 *
 * Fără JavaScript rămâne exact ce se vede în HTML — un `<a>` către motor sau
 * către WhatsApp (REGULI.md 12). De asta e `<a href>` cu `preventDefault`, nu
 * `<button>`: un `<button>` fără JS nu duce nicăieri.
 *
 * PLASA DE SIGURANȚĂ. Fără motor și fără număr de WhatsApp în
 * `date/02-telefon-email-si-adresa.md`, `linkRezervare` cade pe telefonul apelabil, apoi pe
 * `ancora`. Nu rămâne niciodată un buton mort.
 *
 * `context` — numele camerei sau titlul pachetului. Intră și în mesaj, și
 * în capul dialogului, ca omul să vadă pentru ce cere.
 */
export function ButonDisponibilitate({
  date,
  context,
  eticheta,
  variant = 'primary',
  ancora = '#rezervare',
  cuIcon = false,
}: {
  date: SiteData
  /** Ce a văzut omul pe ecran când a apăsat: numele camerei, titlul pachetului. */
  context?: string
  /** Implicit `booking.labels.submit`, din `date/10-rezervari-si-plati.md`. */
  eticheta?: string
  variant?: 'primary' | 'accent' | 'light' | 'ghost' | 'wa'
  /** Unde cade butonul dacă nu există nici WhatsApp, nici telefon. */
  ancora?: string
  cuIcon?: boolean
}) {
  const [deschis, setDeschis] = useState(false)
  const href = linkRezervare(date, context, ancora)
  const extern = esteExtern(href)
  // Iconița spune ce se întâmplă la click. „Telefon" doar când linkul CHIAR e
  // un apel: de când `linkRezervare` poate întoarce motorul de rezervări,
  // „extern" nu mai înseamnă automat WhatsApp.
  const eApel = href.startsWith('tel:')

  return (
    <>
      <a
        className={`btn btn-${variant}`}
        href={href}
        {...(extern ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={(e) => {
          // Click cu modificator sau cu rotița = „deschide în tab nou". Îl
          // lăsăm browserului: e linkul real, nu o cursă spre dialog.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          setDeschis(true)
        }}
      >
        {cuIcon && <Icon name={eApel ? 'phone' : 'search'} marime="sm" />}
        {eticheta ?? date.booking.labels.submit}
      </a>

      {deschis && (
        <ModalRezervare date={date} subiect={context} onInchide={() => setDeschis(false)} />
      )}
    </>
  )
}
