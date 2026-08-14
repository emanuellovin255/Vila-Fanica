/* ============================================================
   verifica-lib.ts — motorul comenzii `npm run verifica` (T32).

   O singură comandă care prinde automat tot ce se poate greși înainte
   de lansare, ca să nu depindem de memoria cuiva la ora 2 noaptea.

   Trei niveluri, ca la T05 (lib/continut/raport.ts):

     EROARE       cod de ieșire 1, nu se publică
     AVERTISMENT  trece, dar apare în raport
     NOTĂ         informativ

   Fiecare problemă spune FIȘIERUL, LINIA și CE SĂ REPARI. Destinatarul
   nu programează: nu „validation failed", ci exact ce fișier, ce bloc și
   ce trebuie făcut.
   ============================================================ */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export type Nivel = 'eroare' | 'avertisment' | 'nota'

export interface Gasire {
  nivel: Nivel
  /** Calea fișierului, relativă la rădăcina reproului. */
  fisier: string
  /** Linia din fișier, când o știm. */
  linie?: number
  /** Blocul sau elementul, dacă se poate numi. */
  unde?: string
  /** Ce s-a găsit, în cuvintele cuiva care nu programează. */
  mesaj: string
  /** Ce trebuie făcut. Fără asta, o găsire e doar o plângere. */
  repara?: string
}

const ETICHETA: Record<Nivel, string> = {
  eroare: 'EROARE',
  avertisment: 'AVERTISMENT',
  nota: 'NOTĂ',
}

/** Rupe un text lung pe cuvinte, la ~72 de coloane, indentat cu 8. */
function indenta(text: string, indent = '        '): string {
  const cuvinte = text.split(/\s+/)
  const linii: string[] = []
  let rand = ''
  for (const c of cuvinte) {
    if (rand && (rand + ' ' + c).length > 72) {
      linii.push(indent + rand)
      rand = c
    } else {
      rand = rand ? rand + ' ' + c : c
    }
  }
  if (rand) linii.push(indent + rand)
  return linii.join('\n')
}

export class Verificare {
  readonly gasiri: Gasire[] = []
  /** Rădăcina reproului, pentru a scrie căi relative frumoase. */
  constructor(readonly radacina: string) {}

  adauga(g: Gasire) {
    this.gasiri.push(g)
  }
  eroare(g: Omit<Gasire, 'nivel'>) {
    this.adauga({ nivel: 'eroare', ...g })
  }
  avertisment(g: Omit<Gasire, 'nivel'>) {
    this.adauga({ nivel: 'avertisment', ...g })
  }
  nota(g: Omit<Gasire, 'nivel'>) {
    this.adauga({ nivel: 'nota', ...g })
  }

  /** Calea relativă la reprou, cu „/" indiferent de sistem. */
  rel(abs: string): string {
    return path.relative(this.radacina, abs).split(path.sep).join('/')
  }

  private numar(nivel: Nivel) {
    return this.gasiri.filter((g) => g.nivel === nivel).length
  }

  /** Un bloc, în formatul din T32: TAG  fișier:linie / mesaj / Repară. */
  static bloc(g: Gasire): string {
    const loc = [g.fisier, g.linie ? `:${g.linie}` : ''].join('')
    const unde = g.unde ? `  „${g.unde}"` : ''
    const cap = `${ETICHETA[g.nivel].padEnd(11)} ${loc}${unde}`
    const corp = indenta(g.mesaj)
    const rep = g.repara ? `\n${indenta(`Repară: ${g.repara}`)}` : ''
    return `${cap}\n${corp}${rep}`
  }

  /** Textul complet, grupat pe nivel. */
  text(): string {
    const grup = (nivel: Nivel) => this.gasiri.filter((g) => g.nivel === nivel)
    const parti: string[] = []
    const sectiune = (titlu: string, lista: Gasire[]) => {
      if (!lista.length) return
      parti.push(`\n${titlu}\n\n${lista.map(Verificare.bloc).join('\n\n')}`)
    }
    sectiune(
      `── ERORI (${this.numar('eroare')}) — se opresc la publicare ──`,
      grup('eroare'),
    )
    sectiune(
      `── AVERTISMENTE (${this.numar('avertisment')}) — trec, dar merită reparate ──`,
      grup('avertisment'),
    )
    sectiune(`── NOTE (${this.numar('nota')}) — informativ ──`, grup('nota'))
    return parti.join('\n')
  }

  /** Rezumatul dintr-un rând. */
  rezumat(): string {
    return (
      `${this.numar('eroare')} erori · ` +
      `${this.numar('avertisment')} avertismente · ` +
      `${this.numar('nota')} note`
    )
  }

  areErori(): boolean {
    return this.numar('eroare') > 0
  }
}

/* ------------------------------------------------------------------ */
/* Umblatul prin fișiere                                              */
/* ------------------------------------------------------------------ */

const IGNORA = new Set(['node_modules', '.next', '.git', 'media', '.vercel'])

/** Toate fișierele cu una din extensii, recursiv, sărind peste build-uri. */
export function fisiere(dir: string, extensii: string[]): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  const mers = (d: string) => {
    for (const nume of readdirSync(d)) {
      if (IGNORA.has(nume) || nume.startsWith('.')) continue
      const p = path.join(d, nume)
      const st = statSync(p)
      if (st.isDirectory()) mers(p)
      else if (extensii.some((e) => nume.endsWith(e))) out.push(p)
    }
  }
  mers(dir)
  return out
}

/** Citește un fișier ca listă de linii; [] dacă nu există. */
export function linii(fisier: string): string[] {
  if (!existsSync(fisier)) return []
  return readFileSync(fisier, 'utf8').split(/\r?\n/)
}

/** Numărul liniei (1-indexat) în care apare prima potrivire, sau undefined. */
export function liniaLui(text: string, re: RegExp): number | undefined {
  const idx = text.split(/\r?\n/).findIndex((l) => re.test(l))
  return idx >= 0 ? idx + 1 : undefined
}

/** Scoate comentariile ca să nu dăm fals-pozitiv pe explicații din cod. */
export function faraComentarii(cod: string): string {
  return cod
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')) // /* */
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1') // // (nu strica http://)
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' ')) // <!-- -->
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' ')) // {/* */}
}
