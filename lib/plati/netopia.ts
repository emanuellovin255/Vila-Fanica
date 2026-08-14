/* ============================================================
   lib/plati/netopia.ts — INTERFAȚA modulului de plăți Netopia (T13, faza 1).

   ⚠️  ÎN FAZA 1 NU SE IMPLEMENTEAZĂ. Aici sunt doar tipurile, semnăturile și
   regulile, ca activarea de mai târziu (faza 2, la primul client care chiar
   încasează online) să fie o COMPLETARE, nu o rescriere. Fiecare funcție face
   `throw new Error('neimplementat')`. Nimic din motor nu importă acest fișier
   în faza 1, deci un site cu plăți oprite se buildează fără să-l atingă.

   Procedura completă de activare: `module/plati-netopia/CITESTE-MA.md`.
   Schema bazei de date: `module/plati-netopia/SCHEMA-DB.md`.

   REGULILE CARE NU SE NEGOCIAZĂ LA IMPLEMENTARE (standarde/01 §5):
   1. Nu atingem NICIODATĂ datele cardului. Redirect către pagina găzduită de
      Netopia → rămânem la PCI-DSS SAQ-A.
   2. Suma se calculează pe SERVER, din cameră + perioadă + tariful din datele
      locației. Niciodată preluată din pagină (`calculeazaSuma`).
   3. IPN-ul se verifică prin SEMNĂTURĂ (`verificaIpn`). Fără asta, oricine poate
      trimite o notificare falsă de „plătit". E punctul cel mai important.
   4. Rezervarea se confirmă DOAR după IPN valid, nu la redirect-ul de întoarcere
      (acela se poate falsifica).
   5. Loguri de tranzacții server-side, pentru reconciliere.
   6. Rate limit strict pe endpoint-ul de plată (T09, `lib/rate-limit.ts`).

   Netopia API v2 (JSON + semnătură RSA) + SDK Node.js oficial:
   doc.netopia-payments.com/docs/get-started/
   ============================================================ */

/** Mediu Netopia. Se testează integral în `sandbox` înainte de `live`. */
export type MediuNetopia = 'sandbox' | 'live'

/** Statusul unei comenzi, oglindit în baza de date. */
export type StatusComanda = 'initiat' | 'platit' | 'esuat' | 'anulat'

/**
 * Ce s-a rezervat. Din asta se calculează suma pe SERVER — clientul trimite
 * camera și perioada, NU suma. Suma din pagină nu are nicio autoritate.
 */
export type ComandaInput = {
  cameraSlug: string
  checkIn: string // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
  persoane: number
  client: { nume: string; email: string; telefon: string }
}

/** Suma recalculată server-side din datele locației. Sursa unică de adevăr. */
export type Suma = {
  valoare: number
  valuta: 'RON' | 'EUR'
  /** Detaliere pe nopți/tarif, pentru afișare și reconciliere. */
  detaliu: string
}

/** Rezultatul creării unei comenzi: unde trimitem vizitatorul + id-ul de urmărit. */
export type ComandaInitiata = {
  comandaId: string
  /** Pagina găzduită de Netopia. Redirect aici — nu atingem datele cardului. */
  redirectUrl: string
}

/** Ce extragem dintr-un IPN VERIFICAT prin semnătură. */
export type IpnRezultat = {
  comandaId: string
  status: StatusComanda
  sumaConfirmata: number
  valuta: string
}

const NEIMPLEMENTAT = 'neimplementat'

/**
 * Recalculează suma din cameră + perioadă + tariful din datele locației.
 * REGULA 2: nicio sumă nu vine din pagină. Faza 2 o implementează citind
 * tariful camerei (SiteData) și numărul de nopți.
 */
export function calculeazaSuma(_input: ComandaInput): Suma {
  throw new Error(NEIMPLEMENTAT)
}

/**
 * Creează o comandă la Netopia și întoarce URL-ul paginii lor găzduite.
 * Faza 2: calculează suma (server-side), scrie comanda `initiat` în DB, semnează
 * cererea, cheamă API v2, întoarce `redirectUrl`. REGULA 1: fără date de card.
 */
export function creeazaComanda(_input: ComandaInput, _mediu: MediuNetopia): Promise<ComandaInitiata> {
  throw new Error(NEIMPLEMENTAT)
}

/**
 * Verifică semnătura unui IPN și întoarce rezultatul. REGULA 3: un IPN cu
 * semnătură invalidă → aruncă / respinge, cu log. Doar de aici se schimbă
 * statusul comenzii în `platit` (REGULA 4), niciodată din redirect-ul de retur.
 */
export function verificaIpn(_corpBrut: string, _semnatura: string): Promise<IpnRezultat> {
  throw new Error(NEIMPLEMENTAT)
}
