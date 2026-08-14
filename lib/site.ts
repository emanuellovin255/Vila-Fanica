import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { SiteData } from '@/content/types'
import { incarcaClient, radacinaClientDir, IMPLICIT as SETARI_IMPLICITE, type Setari } from '@/lib/continut'
import { incarcaMeniu } from '@/lib/continut/meniu'
import type { MeniuCategorie } from '@/content/meniu'
import { DEMO } from '@/lib/demo'
import type { Limba } from '@/lib/i18n/limbi'

/**
 * Rezolvă „site-ul curent" — singurul loc care știe ce SiteData se
 * randează.
 *
 * DE CE EXISTĂ
 * ------------
 * Motorul e copiat în repo-ul fiecărui client (DECIZII.md): un repo =
 * un client. Dar în repo-ul SISTEMULUI (ăsta) nu există niciun client —
 * doar demo-ul. Resolver-ul ascunde diferența:
 *
 *   - dacă există `clienti/<nume>/` cu un fișier `.client-activ` la
 *     rădăcina motorului, se încarcă acel client (cazul repo-ului de
 *     client, scris de `npm run client-nou`, T31);
 *   - altfel se cade pe DEMO, ca probe-urile, sitemap-ul și llms.txt să
 *     funcționeze în repo-ul sistemului.
 *
 * Nimic din UI nu știe de distincția asta: componentele primesc un
 * SiteData și atât.
 */

export interface Site {
  date: SiteData
  setari: Setari
  meniu: MeniuCategorie[]
  /**
   * Numele fișierelor din `poze/`, în ordine alfabetică. Le folosește pagina
   * de galerie (`Galerie extinsă: da`), singurul loc care are nevoie de TOATE
   * pozele, nu doar de cele referite dintr-un `date/*.md`.
   */
  poze: string[]
  /** Numele folderului de client, sau `null` pentru demo. */
  client: string | null
}

function numeClientActiv(): string | null {
  const marker = path.resolve(process.cwd(), '.client-activ')
  if (!existsSync(marker)) return null
  const nume = readFileSync(marker, 'utf8').trim()
  return nume || null
}

/** Cache pe proces: build-ul cere același site de zeci de ori. */
const cache = new Map<string, Site>()

export function siteCurent(limba: Limba = 'ro'): Site {
  const cheie = limba
  const gata = cache.get(cheie)
  if (gata) return gata

  const client = numeClientActiv()

  let site: Site
  if (client) {
    const { date, setari, poze } = incarcaClient(client, limba)
    const radacinaDate = path.join(radacinaClientDir(client), limba === 'ro' ? 'date' : limba)
    const meniu = setari.module.meniuRestaurant ? incarcaMeniu(radacinaDate) : []
    site = { date, setari, meniu, poze, client }
  } else {
    // Repo-ul sistemului: demo, cu setările implicite.
    site = { date: DEMO, setari: SETARI_IMPLICITE, meniu: [], poze: [], client: null }
  }

  cache.set(cheie, site)
  return site
}

