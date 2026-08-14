/* ============================================================
   lib/whatsapp.ts — un singur loc care construiește cererea de rezervare.

   Locația n-are motor de rezervări (`date/10-rezervari-si-plati.md`:
   „Tip: formular"), deci canalul real e WhatsApp. Butonul „Verifică
   disponibilitatea" deschide întâi un calendar (T64) și abia apoi trimite
   în conversație — cu perioada, numărul de oaspeți și camera deja scrise.

   Mesajul NU spune numele pensiunii: omul scrie pe numărul pensiunii, deci
   gazda știe unde e. Ce nu știe e ce cameră, ce perioadă și câți oameni —
   exact ce pune mesajul.
   ============================================================ */

import type { SiteData } from '@/content/types'
import type { Etichete } from '@/lib/i18n/etichete'

export type CerereRezervare = {
  /**
   * Numele oaspetelui, cerut în dialog. Opțional: un câmp obligatoriu în
   * fața unui buton de WhatsApp e un formular deghizat și pierde exact
   * omul pe care îl vrem.
   */
  nume?: string
  /** Numele camerei sau al ofertei. Lipsește pe prima pagină. */
  subiect?: string
  /** `YYYY-MM-DD`, așa cum le ține calendarul. */
  checkIn?: string
  checkOut?: string
  persoane?: number
}

/**
 * `2026-08-12` → `12 august 2026`. Fără `Date`, ca să nu intre fusul orar.
 *
 * Numele lunilor vin din `date.ui` (T76): erau scrise aici, în română,
 * deci un oaspete englez primea pe WhatsApp „12 august 2026" — ceea ce
 * merge din întâmplare pentru august, dar nu și pentru „12 octombrie".
 */
export function dataLizibila(iso: string, ui: Etichete): string {
  const [a, l, z] = iso.split('-').map(Number)
  if (!a || !l || !z) return iso
  return `${z} ${ui.luniMici[l - 1]} ${a}`
}

/** Nopțile dintre două date ISO. Zero sau negativ → `undefined`. */
export function nopti(checkIn: string, checkOut: string): number | undefined {
  const a = Date.parse(`${checkIn}T00:00:00Z`)
  const b = Date.parse(`${checkOut}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return undefined
  const n = Math.round((b - a) / 86400000)
  return n > 0 ? n : undefined
}

/**
 * Mesajul precompletat. Rămâne editabil în WhatsApp — e o schiță pe care
 * omul o poate completa, nu un formular trimis.
 *
 * Fără date alese (JavaScript oprit, deci fără calendar) rămâne întrebarea
 * scurtă: tot e mai mult decât un „bună ziua" gol.
 */
export function mesajRezervare(ui: Etichete, c: CerereRezervare = {}): string {
  const randuri = [ui.waSalut]

  // Numele primul, imediat după salut — e ordinea în care se prezintă un om
  // când scrie cuiva. Gazda vede cu cine vorbește înainte de orice detaliu,
  // iar conversația începe cu un nume, nu cu o dată.
  const nume = c.nume?.trim()
  if (nume) randuri.push(`${ui.waNume}: ${nume}`)

  // „Camera / pachetul", nu „Camera": butonul se apasă și din dreptul unui
  // pachet de sejur, iar gazda trebuie să vadă la ce se referă cererea.
  if (c.subiect) randuri.push(`${ui.waSubiect}: ${c.subiect}`)
  if (c.checkIn) randuri.push(`${ui.waSosire}: ${dataLizibila(c.checkIn, ui)}`)
  if (c.checkOut) {
    const n = c.checkIn ? nopti(c.checkIn, c.checkOut) : undefined
    const nopti_ = n ? ` (${n} ${n === 1 ? ui.noapte : ui.nopti})` : ''
    randuri.push(`${ui.waPlecare}: ${dataLizibila(c.checkOut, ui)}${nopti_}`)
  }
  if (c.persoane) randuri.push(`${ui.waOaspeti}: ${c.persoane}`)

  return randuri.join('\n')
}

/**
 * Linkul către conversație. `undefined` dacă locația n-are WhatsApp —
 * apelantul cade atunci pe telefon (REGULI.md 3: nu inventăm o cale).
 */
export function urlWhatsApp(
  contact: SiteData['contact'],
  ui: Etichete,
  c: CerereRezervare = {},
): string | undefined {
  if (!contact.whatsapp) return undefined
  return `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mesajRezervare(ui, c))}`
}

/**
 * Linkul pe care îl primește un buton de rezervare, cu tot cu căderile
 * elegante: motorul de rezervări → WhatsApp → telefon apelabil → ancora
 * `#rezervare`.
 *
 * MOTORUL E PRIMUL când locația are unul (`date/10-…`, „Tip: link"): acolo e
 * disponibilitatea reală, deci omul vede pe loc ce e liber, fără să aștepte un
 * răspuns. Fără motor, ordinea rămâne cea dinainte — WhatsApp, apoi telefon.
 *
 * Ăsta e și `href`-ul scris în HTML, deci butonul funcționează și fără
 * JavaScript — doar că fără perioada aleasă în calendar. Cu JavaScript se
 * deschide dialogul, iar dialogul adaugă datele peste linkul ăsta.
 *
 * `ancora` se dă explicit pe subpagini (`/#rezervare`): `#rezervare` gol
 * n-ar duce nicăieri de pe `/camere/apartament`.
 */
export function linkRezervare(date: SiteData, subiect?: string, ancora = '#rezervare'): string {
  if (date.booking.mod === 'deep-link' && date.booking.engineUrl) return date.booking.engineUrl
  return urlWhatsApp(date.contact, date.ui, { subiect }) ?? date.contact.phoneHref ?? ancora
}

/**
 * `true` pentru linkurile care ies din site (deci vor `target` și `rel`).
 *
 * Orice `http(s)`, nu doar WhatsApp: de când butoanele pot duce direct în
 * motorul de rezervări, o verificare pe `wa.me` lăsa linkul de Booking fără
 * `rel="noopener"`. Ancorele (`#rezervare`) și `tel:` nu intră aici.
 */
export function esteExtern(href: string): boolean {
  return href.startsWith('https://') || href.startsWith('http://')
}
