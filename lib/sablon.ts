import type { SiteData } from '@/content/types'
import type { Setari } from '@/lib/continut'
import type { MeniuCategorie } from '@/content/meniu'

/**
 * Contractul dintre motor și un șablon (C2).
 *
 * Dispecerul din `app/[limba]/page.tsx` încarcă datele o singură dată și
 * predă asamblarea vizuală unui șablon prin props-urile astea. Un șablon
 * primește tot ce-i trebuie ca să compună pagina și nu citește nimic
 * direct din disc — rămâne pur layout (REGULI.md 1).
 *
 * Tipul stă în motor, nu în vreun șablon, ca toate trei să depindă de
 * aceeași formă fără să se importe unele pe altele.
 */
export interface PropsSablon {
  date: SiteData
  setari: Setari
  meniu: MeniuCategorie[]
}
