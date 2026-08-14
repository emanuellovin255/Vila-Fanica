/* ============================================================
   raport.ts — validarea pe trei niveluri (T05).

   | Nivel        | Când                                  | Ce face                          |
   |--------------|---------------------------------------|----------------------------------|
   | eroare       | lipsește ceva fără care site-ul       | oprește build-ul                 |
   |              | n-are sens (nume, telefon)            |                                  |
   | avertisment  | lipsește ceva care ascunde o secțiune | build trece, secțiunea nu se     |
   |              | (nicio cameră, nicio recenzie)        | randează, se scrie în consolă    |
   | nota         | lipsește ceva opțional                | doar în raportul din CITESTE-MA  |

   REGULA DE SCRIS MESAJE: destinatarul nu programează. Nu
   „unexpected token", ci exact ce fișier, exact ce bloc, exact ce câmp
   și exact ce trebuie făcut.
   ============================================================ */

export type Nivel = 'eroare' | 'avertisment' | 'nota'

export interface Constatare {
  nivel: Nivel
  /** Fișierul, relativ la folderul clientului. Ex: `date/04-camere.md` */
  fisier: string
  /** Blocul, dacă se poate numi. Ex: camera „Apartament Deluxe" */
  unde?: string
  /** Linia din fișier, când o știm. */
  linie?: number
  /** Ce s-a găsit, în cuvintele cuiva care nu programează. */
  mesaj: string
  /** Ce trebuie făcut. Fără asta, constatarea e doar o plângere. */
  solutie?: string
}

export class Raport {
  readonly constatari: Constatare[] = []

  private adauga(nivel: Nivel, c: Omit<Constatare, 'nivel'>) {
    this.constatari.push({ nivel, ...c })
  }

  eroare(c: Omit<Constatare, 'nivel'>) {
    this.adauga('eroare', c)
  }
  avertisment(c: Omit<Constatare, 'nivel'>) {
    this.adauga('avertisment', c)
  }
  nota(c: Omit<Constatare, 'nivel'>) {
    this.adauga('nota', c)
  }

  get erori() {
    return this.constatari.filter((c) => c.nivel === 'eroare')
  }
  get avertismente() {
    return this.constatari.filter((c) => c.nivel === 'avertisment')
  }
  get note() {
    return this.constatari.filter((c) => c.nivel === 'nota')
  }

  /** Un rând, pentru consolă. */
  static rand(c: Constatare): string {
    const loc = [c.fisier, c.linie ? `linia ${c.linie}` : null, c.unde ? `„${c.unde}"` : null]
      .filter(Boolean)
      .join(', ')
    return `  ${loc}\n    ${c.mesaj}${c.solutie ? `\n    → ${c.solutie}` : ''}`
  }

  /** Textul complet, grupat pe nivel. Gol dacă nu e nimic de spus. */
  text(): string {
    const parti: string[] = []
    const sectiune = (titlu: string, lista: Constatare[]) => {
      if (!lista.length) return
      parti.push(`\n${titlu}\n${lista.map(Raport.rand).join('\n\n')}`)
    }
    sectiune(`ERORI (${this.erori.length}) — build-ul se oprește`, this.erori)
    sectiune(`AVERTISMENTE (${this.avertismente.length}) — secțiunile astea nu se vor afișa`, this.avertismente)
    sectiune(`NOTE (${this.note.length}) — opționale`, this.note)
    return parti.join('\n')
  }

  /**
   * Oprește build-ul dacă există erori. Aruncă un mesaj care se
   * citește, nu un stack trace.
   */
  opresteDacaEErori(client: string): void {
    if (!this.erori.length) return
    throw new Error(
      `\nNu pot genera site-ul pentru „${client}".\n` +
        `${this.erori.length} ${this.erori.length === 1 ? 'problemă trebuie rezolvată' : 'probleme trebuie rezolvate'} în clienti/${client}/:\n` +
        this.erori.map(Raport.rand).join('\n\n') +
        '\n',
    )
  }

  /** Avertismentele și notele merg în consolă, nu opresc nimic. */
  scrieInConsola(client: string): void {
    const rest = [...this.avertismente, ...this.note]
    if (!rest.length) return
    process.stdout.write(
      `\nclienti/${client}/ — ${this.avertismente.length} avertismente, ${this.note.length} note:\n` +
        rest.map(Raport.rand).join('\n\n') +
        '\n\n',
    )
  }
}
