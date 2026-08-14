import { BaraDisponibilitate } from './BaraDisponibilitate'
import { BaraWhatsApp } from './BaraWhatsApp'
import type { SiteData } from '@/content/types'

/**
 * Alege blocul de rezervare potrivit locației. Un singur loc de decizie,
 * folosit de toate cele trei șabloane — altfel regula s-ar fi copiat de
 * trei ori și ar fi divergat la prima modificare.
 *
 * - Locația ARE motor de rezervări (deep-link sau iframe) → calendarul
 *   din `BaraDisponibilitate`: datele completate acolo ajung în motor și
 *   omul vede pe loc ce e liber.
 * - Locația N-ARE motor, dar are WhatsApp → `BaraWhatsApp`. Un calendar
 *   care nu poate răspunde „e liber" e trei câmpuri completate degeaba;
 *   un buton de WhatsApp deschide conversația din prima.
 *
 * Ambele randează `#rezervare`, deci ancorele din antet, din hero și din
 * bara mobilă funcționează la fel, indiferent de ramură.
 */
export function BlocRezervare({ date }: { date: SiteData }) {
  if (date.booking.mod === 'formular' && date.contact.whatsapp) {
    return <BaraWhatsApp date={date} />
  }
  return <BaraDisponibilitate date={date} />
}
