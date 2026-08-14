'use client'

import Script from 'next/script'
import { type FormEvent, useState } from 'react'

/* ============================================================
   components/Formular.tsx — cererea de cazare.

   Portat conceptual din `Web Tamplate/_core/js/form.js` + `partials/form.html`,
   rescris pentru React cu ÎMBUNĂTĂȚIRE PROGRESIVĂ (ca BaraDisponibilitate):

   - FĂRĂ JavaScript: e un `<form method="post" action="/api/formular">` real.
     Browserul face POST nativ, iar route handler-ul răspunde cu redirect la
     pagina de mulțumire. Formularul funcționează întreg (criteriu T10, REGULI.md 12).
   - CU JavaScript: interceptăm submit-ul, trimitem JSON, arătăm mesaje inline
     fără reîncărcarea paginii și încărcăm widget-ul Turnstile.

   Câmpuri, la minimul util (standarde/02): nume (obligatoriu), telefon SAU
   e-mail (unul din două), perioada, persoane, mesaj, acord GDPR (nebifat
   implicit). Plus un honeypot ascuns (`company`) — gratuit, complementar Turnstile.

   Validarea din browser e doar pentru UX; decizia finală o ia serverul
   (`lib/validare.ts`). Nimic nu se stochează.
   ============================================================ */

declare global {
  interface Window {
    /** API-ul Turnstile, prezent după ce se încarcă scriptul Cloudflare. */
    turnstile?: { reset?: (widget?: string) => void }
  }
}

type Limba = 'ro' | 'en'

const TEXTE: Record<Limba, Record<string, string>> = {
  ro: {
    nume: 'Nume',
    telefon: 'Telefon',
    email: 'E-mail',
    contact: 'Lasă un telefon sau un e-mail — completează măcar unul.',
    sosire: 'Sosire',
    plecare: 'Plecare',
    persoane: 'Persoane',
    mesaj: 'Mesaj (opțional)',
    acord: 'Sunt de acord ca datele mele să fie folosite pentru a-mi răspunde.',
    politica: 'politica de confidențialitate',
    trimite: 'Trimite cererea',
    seTrimite: 'Se trimite…',
    succes: 'Mulțumim! Cererea a plecat — revenim cât putem de repede.',
    eroareGen: 'Ceva n-a mers. Reîncearcă sau sună-ne direct.',
  },
  en: {
    nume: 'Name',
    telefon: 'Phone',
    email: 'Email',
    contact: 'Leave a phone number or an email — at least one.',
    sosire: 'Check-in',
    plecare: 'Check-out',
    persoane: 'Guests',
    mesaj: 'Message (optional)',
    acord: 'I agree to have my data used to reply to my request.',
    politica: 'privacy policy',
    trimite: 'Send request',
    seTrimite: 'Sending…',
    succes: 'Thank you! Your request is on its way — we’ll get back to you shortly.',
    eroareGen: 'Something went wrong. Please try again or call us.',
  },
}

type Stare = 'idle' | 'trimit' | 'ok' | 'eroare'

export function Formular({
  limba = 'ro',
  eroareInitiala,
  actiune = '/api/formular',
  politicaHref,
}: {
  limba?: Limba
  /** Mesaj de eroare de la un submit fără-JS (route-ul redirectează cu `?formular_eroare`). */
  eroareInitiala?: string
  actiune?: string
  politicaHref?: string
}) {
  const t = TEXTE[limba]
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const hrefPolitica = politicaHref ?? (limba === 'en' ? '/en/politica-confidentialitate' : '/politica-confidentialitate')

  const [stare, setStare] = useState<Stare>('idle')
  const [mesaj, setMesaj] = useState<string>(eroareInitiala ?? '')

  async function laSubmit(e: FormEvent<HTMLFormElement>) {
    // Fără fetch, formularul face POST nativ — nu împiedicăm nimic dacă
    // ceva pică aici. Cu JS, preluăm.
    e.preventDefault()
    const form = e.currentTarget
    setStare('trimit')
    setMesaj('')

    const date = Object.fromEntries(new FormData(form).entries())
    try {
      const res = await fetch(actiune, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(date),
      })
      const rez = (await res.json().catch(() => ({}))) as { ok?: boolean; eroare?: string }
      if (res.ok && rez.ok) {
        setStare('ok')
        setMesaj(t.succes)
        form.reset()
        // Resetăm widget-ul Turnstile ca un al doilea submit să aibă token nou.
        window.turnstile?.reset?.()
      } else {
        setStare('eroare')
        setMesaj(rez.eroare || t.eroareGen)
        window.turnstile?.reset?.()
      }
    } catch {
      setStare('eroare')
      setMesaj(t.eroareGen)
    }
  }

  return (
    <form id="formular" method="post" action={actiune} onSubmit={laSubmit} noValidate>
      {/* Honeypot (clasa `.hp` din base.css): invizibil pentru om, prezent pentru bot. */}
      <div className="hp" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="field">
        <label htmlFor="f-nume">{t.nume}</label>
        <input id="f-nume" type="text" name="nume" required minLength={2} autoComplete="name" />
      </div>

      <div className="field">
        <label htmlFor="f-telefon">{t.telefon}</label>
        <input id="f-telefon" type="tel" name="telefon" autoComplete="tel" inputMode="tel" />
      </div>
      <div className="field">
        <label htmlFor="f-email">{t.email}</label>
        <input id="f-email" type="email" name="email" autoComplete="email" inputMode="email" />
      </div>
      <p className="field-hint">{t.contact}</p>

      <div className="field">
        <label htmlFor="f-sosire">{t.sosire}</label>
        <input id="f-sosire" type="date" name="sosire" />
      </div>
      <div className="field">
        <label htmlFor="f-plecare">{t.plecare}</label>
        <input id="f-plecare" type="date" name="plecare" />
      </div>
      <div className="field">
        <label htmlFor="f-persoane">{t.persoane}</label>
        <input id="f-persoane" type="text" name="persoane" inputMode="numeric" autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor="f-mesaj">{t.mesaj}</label>
        <textarea id="f-mesaj" name="mesaj" rows={4} maxLength={1000} />
      </div>

      <label className="field-check">
        <input type="checkbox" name="acord" value="on" required />
        <span>
          {t.acord} <a href={hrefPolitica}>{t.politica}</a>
        </span>
      </label>

      {/* Widget Turnstile. Se randează doar dacă e configurat site key-ul.
          Scriptul e încărcat prin next/script, care primește nonce-ul CSP (T09).
          Widget-ul pune singur un `<input name="cf-turnstile-response">` în form. */}
      {siteKey && (
        <>
          <div className="cf-turnstile" data-sitekey={siteKey} data-language={limba} />
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
        </>
      )}

      <button className="btn btn-primary" type="submit" disabled={stare === 'trimit'}>
        {stare === 'trimit' ? t.seTrimite : t.trimite}
      </button>

      {/* Mesajul de stare. `role=status` ca cititoarele de ecran să-l anunțe.
          Vizibil și fără JS: route-ul fără-JS redirectează cu `?formular_eroare`. */}
      {mesaj && (
        <p className="form-msg" data-tone={stare === 'ok' ? 'ok' : 'err'} role="status">
          {mesaj}
        </p>
      )}
    </form>
  )
}
