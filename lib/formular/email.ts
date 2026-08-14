/* ============================================================
   lib/formular/email.ts — notificarea și confirmarea prin Resend.

   Portat din partea de notificare a `Web Tamplate/_core/api/lead.js`, cu
   două schimbări cerute de T10:
   - Canalul e Resend (email), nu CallMeBot + Google Sheets. WhatsApp rămâne
     OPȚIONAL (util la o cabană unde telefonul e canalul principal); scrierea
     în Sheets dispare — e o stocare de date personale pe care n-o vrem.
   - Se trimit DOUĂ mesaje: unul către locație (cu tot ce a completat) și,
     dacă vizitatorul a lăsat email, o confirmare către el.

   Nimic de aici nu stochează nimic (REGULI.md 15): construim textul, îl
   trimitem, îl uităm. Logurile NU conțin date personale — sunt vizibile.
   ============================================================ */

import { Resend } from 'resend'

import { CAMPURI, type CerereFormular } from '@/lib/validare'

const TIMP_MAX_MS = 8000

function numeLocatie(): string {
  return (process.env.SITE_NAME || 'Site de cazare').slice(0, 80)
}

/** Data și ora, în fusul României, scurt — pentru antetul notificării. */
function acum(): string {
  return new Intl.DateTimeFormat('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

/**
 * Notificarea către locație. Se construiește din ce a venit, în ordinea din
 * CAMPURI. Un câmp gol nu apare — mesajul se citește pe telefon, în două
 * secunde, fără rânduri „—" de umplutură.
 */
export function notificare(d: CerereFormular): { subiect: string; text: string } {
  const contact = [d.telefon, d.email].filter(Boolean).join(' · ')
  const linii = [
    `CERERE NOUĂ · ${numeLocatie()} · ${acum()}`,
    '',
    `${d.nume}${contact ? ' · ' + contact : ''}`,
  ]
  for (const c of CAMPURI) {
    if (c.nume === 'email') continue // deja în linia de contact
    if (d[c.nume]) linii.push(`${c.eticheta}: ${d[c.nume]}`)
  }
  return { subiect: `Cerere cazare · ${d.nume}`, text: linii.join('\n') }
}

/** Confirmarea către vizitator — scurtă, umană, fără jargon. */
function confirmare(d: CerereFormular): { subiect: string; text: string } {
  const nume = numeLocatie()
  const text = [
    `Bună, ${d.nume},`,
    '',
    `Am primit cererea ta și îți răspundem cât putem de repede.`,
    d.sosire || d.plecare ? `Perioada notată: ${[d.sosire, d.plecare].filter(Boolean).join(' → ')}.` : '',
    '',
    `Dacă între timp ai o întrebare, răspunde la acest email.`,
    '',
    `Cu drag,`,
    nume,
  ]
    .filter((l) => l !== '')
    .join('\n')
  return { subiect: `Am primit cererea ta · ${nume}`, text }
}

/**
 * Trimite notificarea (către locație) și, dacă e cazul, confirmarea (către
 * vizitator). Un canal picat nu-l blochează pe celălalt (`allSettled`).
 *
 * Fără `RESEND_API_KEY` (dezvoltare) NU trimite nimic: scrie în log că ar fi
 * trimis și răspunde `ok:true`. Util local, inofensiv — nimeni nu primește
 * un email fantomă. În producție lipsa cheii se vede în log.
 *
 * `remoteIp` nu se folosește aici; rămâne opțional pentru simetrie cu restul.
 */
export async function trimite(d: CerereFormular): Promise<{ ok: boolean }> {
  const cheie = process.env.RESEND_API_KEY
  const expeditor = process.env.FORMULAR_EXPEDITOR
  const destinatar = process.env.FORMULAR_DESTINATAR

  if (!cheie || !expeditor || !destinatar) {
    console.warn('formular: RESEND_API_KEY/EXPEDITOR/DESTINATAR lipsesc — email NEtrimis (dezvoltare).')
    return { ok: true }
  }

  const resend = new Resend(cheie)
  const notif = notificare(d)
  const catreLocatie = resend.emails.send({
    from: expeditor,
    to: destinatar.split(',').map((s) => s.trim()),
    subject: notif.subiect,
    text: notif.text,
    // Răspunsul pleacă direct la client dacă a lăsat email.
    replyTo: d.email || undefined,
  })

  const sarcini = [catreLocatie]
  if (d.email) {
    const conf = confirmare(d)
    sarcini.push(
      resend.emails.send({ from: expeditor, to: d.email, subject: conf.subiect, text: conf.text }),
    )
  }

  const cuTimeout = Promise.race([
    Promise.allSettled(sarcini),
    new Promise((res) => setTimeout(() => res('timeout'), TIMP_MAX_MS)),
  ])

  const rez = await cuTimeout
  if (rez === 'timeout') {
    console.warn('formular: trimitere email peste timp — probabil livrată, nu blocăm răspunsul.')
    return { ok: true }
  }

  // Log fără date personale: doar starea pe canal.
  const stare = (rez as PromiseSettledResult<unknown>[]).map((r) =>
    r.status === 'fulfilled' ? 'ok' : 'err',
  )
  console.log('formular', JSON.stringify({ canale: stare }))
  // Notificarea către locație (prima) e cea critică.
  const critic = (rez as PromiseSettledResult<unknown>[])[0]
  return { ok: critic.status === 'fulfilled' }
}
