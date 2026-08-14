/**
 * Setul de iconuri.
 *
 * Sursă: Fiald/hotel-forge/components/Icon.tsx (103 linii), portat,
 * plus 12 iconuri noi desenate pentru nișa de cazare din România.
 *
 * Totul e desenat aici, nu luat dintr-un font de emoji (REGULI.md 8).
 * Emoji-urile se randează diferit pe fiecare platformă — un 🏊 arată
 * altfel pe iPhone, pe Android și pe Windows — poartă o culoare pe care
 * designul nu o controlează, și citesc ca placeholder pe un site care
 * cere bani cuiva. Astea sunt glife de 24px cu o singură linie, pe
 * `currentColor`, deci moștenesc culoarea textului de lângă ele și stau
 * pe aceeași greutate optică.
 *
 * Ce s-a schimbat la port: `stroke-width` NU mai e scris în SVG. Vine
 * din `icons.css`, ca `.icon--sm` și `.icon--lg` să poată compensa
 * optic — o linie de 1,5 la 18px arată mai subțire decât aceeași linie
 * la 32px. Un `strokeWidth` în JSX ar fi bătut regula din CSS.
 *
 * La un icon nou se COPIAZĂ unul existent și se modifică. Nu se
 * desenează de la zero și nu se importă de pe un site de iconuri —
 * altfel se rupe grosimea de linie și setul nu mai arată ca un set.
 */
import type { IconName } from '@/content/types'

/**
 * Fiecare valoare e o listă de sub-trasee separate prin ` M`.
 * Se despart la randare în `<path>`-uri separate, ca `stroke-linecap`
 * să nu unească două trasee care doar se ating.
 */
const P: Record<IconName, string> = {
  // ---------------------------------------------------------------- contact
  pin: 'M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7.5V12l3 2',
  'clock-late': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7.5V12l3.5 2 M12 3v1.5',
  phone:
    'M15.5 21c-6.075 0-11-4.925-11-11 0-.69.06-1.365.174-2.02A1.5 1.5 0 0 1 6.152 6.7l2.02.404a1.5 1.5 0 0 1 1.192 1.28l.2 1.6a1.5 1.5 0 0 1-.71 1.46l-.94.564a10.5 10.5 0 0 0 4.414 4.414l.564-.94a1.5 1.5 0 0 1 1.46-.71l1.6.2a1.5 1.5 0 0 1 1.28 1.192l.404 2.02a1.5 1.5 0 0 1-1.28 1.778c-.655.114-1.33.174-2.02.174Z',
  mail: 'M4 6.5h16v11H4z M4.5 7l7.5 5.5L19.5 7',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3.5 12h17 M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z',

  // ----------------------------------------------------------------- cazare
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5 M16 4.6a3.5 3.5 0 0 1 0 6.8 M17.5 14.9c2.4.66 4 2.4 4 5.1',
  bed: 'M3 19v-9 M3 13h18v6 M21 19v-3 M6.5 10.5h4a1.5 1.5 0 0 1 1.5 1.5v1H5v-1a1.5 1.5 0 0 1 1.5-1.5Z M13 13V9.5a1 1 0 0 1 1-1h5.5a1.5 1.5 0 0 1 1.5 1.5V13',
  ruler: 'M4 14.5 14.5 4l5.5 5.5L9.5 20z M8 8l2 2 M11 5l2 2 M5 11l2 2',
  accessible: 'M12 6.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z M9 9.5h6 M12 9.5V15h4l2 5 M12 15H8.5A4.5 4.5 0 1 0 13 20',
  door: 'M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21 M4 21h16 M14.5 12.5v1.5',
  wifi: 'M3.5 9.5a13 13 0 0 1 17 0 M6.5 13a8.5 8.5 0 0 1 11 0 M9.5 16.5a4 4 0 0 1 5 0 M12 20h.01',
  tv: 'M3.5 6.5h17v11h-17z M8.5 21h7 M9 3.5 12 6.5 15 3.5',
  safe: 'M4 5.5h16v13H4z M13.5 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z M11.5 12H8 M17 8.5v7',
  fridge: 'M6 3.5h12v17H6z M6 10.5h12 M9 7V8 M9 13.5v1.5',
  climate: 'M12 4v16 M12 8 8.5 5.5 M12 8l3.5-2.5 M12 16l-3.5 2.5 M12 16l3.5 2.5 M4.5 8l15 8 M4.5 16l15-8',
  coffee: 'M5 8.5h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-6Z M17 10h1.5a2.5 2.5 0 0 1 0 5H17 M8.5 3v2.5 M12 3v2.5',
  shower: 'M6 21V7.5A3.5 3.5 0 0 1 9.5 4 3.5 3.5 0 0 1 13 7.5 M11 9.5h9 M13.5 13v.01 M16 15.5v.01 M18.5 13v.01 M14.5 18v.01 M17.5 18.5v.01',
  parking: 'M4 4.5h16v15H4z M10 16V8.5h3a2.75 2.75 0 0 1 0 5.5h-3',
  ev: 'M7 21V6.5A2.5 2.5 0 0 1 9.5 4h2A2.5 2.5 0 0 1 14 6.5V21 M5 21h11 M14 10h2.5a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0v-6l-2-2 M10.8 8.5 9 12h2l-1.2 3.5',

  // ------------------------------------------------------------- facilități
  pool: 'M3 16.5c1.5 0 1.5 1.5 3 1.5s1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 M8 15V6a2 2 0 0 1 4 0 M16 15V6a2 2 0 0 0-4 0 M8 10h8',
  sauna: 'M4 5.5h16v13H4z M4 9.5h16 M8 13v3 M12 13v3 M16 13v3 M9 4V2.5 M15 4V2.5',
  spa: 'M12 20c0-4.5 2-8.5 6.5-10.5C18.5 15 15.5 19 12 20Z M12 20c0-4.5-2-8.5-6.5-10.5C5.5 15 8.5 19 12 20Z M12 20v-4',
  dining: 'M6 3v8a2 2 0 0 0 4 0V3 M8 11v10 M16.5 3c-1.5 1.5-2 3.5-2 6 0 1.5.7 2.5 2 2.5V21',
  bar: 'M4 4.5h16L12 13v7 M8.5 20h7 M7 8.5h10',
  terrace: 'M12 3 3 9.5h18L12 3Z M12 9.5V21 M7 21h10 M6 13h2.5 M15.5 13H18',

  // ------------------------------------------------------------- interfață
  check: 'm4.5 12.5 5 5 10-11',
  arrow: 'M4.5 12h15 M13.5 6l6 6-6 6',
  plus: 'M12 5v14 M5 12h14',
  chevron: 'm6 9.5 6 6 6-6',
  star: 'm12 3.5 2.6 5.5 5.9.8-4.3 4.2 1.05 6L12 17.2 6.75 20l1.05-6L3.5 9.8l5.9-.8L12 3.5Z',
  search: 'M11 18.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z M16.5 16.5 21 21',
  close: 'M6 6l12 12 M18 6 6 18',
  /** Play. Triunghi conturat, aceeași greutate de linie ca restul setului. */
  play: 'M8 6.5v11l9-5.5-9-5.5Z',
  tag: 'M3.5 11V4.5a1 1 0 0 1 1-1H11l9.5 9.5-7.5 7.5L3.5 11Z M7.75 8.25v.01',
  calendar: 'M4 6.5h16v14H4z M4 11h16 M8.5 3.5V7 M15.5 3.5V7',
  refresh: 'M20 12a8 8 0 1 1-2.5-5.8 M20 3.5V9h-5.5',
  glass: 'M8 3h8l-1 7a3 3 0 0 1-6 0L8 3Z M12 13v7 M8.5 20h7 M8.6 6.5h6.8',
  shield: 'M12 3.5 5 6v6c0 4.2 3 7 7 8.5 4-1.5 7-4.3 7-8.5V6l-7-2.5Z M9 12l2 2 4-4',

  // ----------------------------------------------------------------- social
  facebook: 'M14.5 8.5h2.5V5h-2.5c-2 0-3.5 1.5-3.5 3.5v2H8.5V14H11v7h3.5v-7H17l.5-3.5h-3v-1.5c0-.6.4-.5 1-.5Z',
  instagram: 'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M17 7.2v.01',
  linkedin: 'M5.5 9.5V19 M5.5 6v.01 M10 19v-5.5a3 3 0 0 1 6 0V19 M10 9.5V19',
  youtube: 'M3.5 8.5a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-7Z M10.5 9.5v5l4.5-2.5-4.5-2.5Z',
  tiktok: 'M15 4v9.5a4 4 0 1 1-3.5-3.97 M15 4c.4 2.2 1.9 3.6 4 3.8',

  // ------------------------------------------------------------------------
  // T04 · Iconuri de nișă. Fiecare pornește de la unul existent:
  // aceleași raze de racordare, aceeași margine de 3px față de viewBox,
  // aceeași densitate de trasee. Sursa fiecăruia e notată alături.
  // ------------------------------------------------------------------------

  /** Ciubăr. Corpul din `sauna`, valurile din `pool`, aburii din `spa`. */
  ciubar:
    'M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6Z M4.5 14.4c1.4 0 1.4 1.2 2.8 1.2s1.4-1.2 2.8-1.2 1.4 1.2 2.8 1.2 1.4-1.2 2.8-1.2 1.4 1.2 2.3 1.2 M9 8.5c0-1.6 1-1.6 1-3.2 M13 8.5c0-1.6 1-1.6 1-3.2 M3 11h18',

  /** Foc de tabără. Flacăra din `spa` întoarsă, buștenii din `climate`. */
  'foc-de-tabara':
    'M12 14.5c2-1 3-2.4 3-4.2C15 7.9 13 6.3 12 3.5 11 6.3 9 7.9 9 10.3c0 1.8 1 3.2 3 4.2Z M12 14.5c-1-.6-1.5-1.4-1.5-2.4 0-1 .6-1.8 1.5-2.7.9.9 1.5 1.7 1.5 2.7 0 1-.5 1.8-1.5 2.4Z M4.5 20 19.5 16.5 M4.5 16.5 19.5 20',

  /**
   * Teleschi. Cablul din `climate`, stâlpul din `ev`, cabina din `safe`.
   * Prima variantă avea un scaun deschis, cu două picioare: la 18px
   * citea ca un steag pe un stâlp, nu ca o instalație. Cabina închisă,
   * cu o linie de geam, se recunoaște și la mărimea mică.
   */
  teleschi:
    'M3 6 21 10.5 M6.2 7.1V21 M4 21h4.4 M15.2 9.4v2.1 M12.4 11.5h5.6a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1h-5.6a1 1 0 0 1-1-1v-4.5a1 1 0 0 1 1-1Z M11.4 14.6h7.6',

  /** Pet friendly. Patru pernuțe și talpa, aceeași rază ca la `spa`. */
  'pet-friendly':
    'M8.6 9.6a1.6 2 0 1 0 0-4 1.6 2 0 0 0 0 4Z M15.4 9.6a1.6 2 0 1 0 0-4 1.6 2 0 0 0 0 4Z M4.8 14.4a1.5 1.8 0 1 0 0-3.6 1.5 1.8 0 0 0 0 3.6Z M19.2 14.4a1.5 1.8 0 1 0 0-3.6 1.5 1.8 0 0 0 0 3.6Z M12 20.5c-2.3 0-4.2-1.4-4.2-3.2 0-1.9 1.8-3.6 4.2-3.6s4.2 1.7 4.2 3.6c0 1.8-1.9 3.2-4.2 3.2Z',

  /** Grill. Cupola din `terrace`, picioarele din `dining`. */
  grill: 'M4 10.5a8 8 0 0 1 16 0Z M3 10.5h18 M7.8 13 6 20 M16.2 13 18 20 M8.5 20h7 M12 6.5v.01',

  /** Biciclete. Roțile din `refresh`, cadrul din `ruler`. */
  biciclete:
    'M6 19.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M18 19.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M6 16l4-8h4l4 8 M8.5 8h3 M14 8l-4 8 M14.5 6h2.5',

  /** Drumeție. Creasta din `terrace`, steagul din `tag`. */
  drumetie: 'M3 19.5 9 9.5l3.5 4.5 2.5-3 6 8.5Z M3 19.5h18 M8.5 9.5V4 M8.5 4l4 1.6-4 1.7',

  /** Pescuit. Corpul peștelui din `spa`, undița din `ruler`. */
  pescuit:
    'M3 12c3-3.6 6.2-5.2 9.2-5.2s5.6 1.6 7 5.2c-1.4 3.6-4 5.2-7 5.2S6 15.6 3 12Z M19.2 12 21.5 9.2v5.6L19.2 12Z M8 10.8v.01 M5 20.5c3-1.3 4.5-2.6 5.5-4.3',

  /** Sală de conferințe. Ecranul din `tv`, rândurile din `sauna`. */
  'sala-conferinte':
    'M3.5 4.5h17v10h-17z M12 14.5V18 M8 18h8 M7 8h6 M7 11h9 M3 20.5h18',

  /** Mic dejun. Ceașca din `coffee`, oul din `spa`. */
  'mic-dejun':
    'M3 9.5h9v5.5a3.5 3.5 0 0 1-3.5 3.5h-2A3.5 3.5 0 0 1 3 15V9.5Z M12 11h1.6a2 2 0 0 1 0 4H12 M2 21h13 M6 6.5V4 M9 6.5V4 M18.5 16a3 3 0 0 0 3-3c0-1.9-1.3-4.5-3-4.5S15.5 11.1 15.5 13a3 3 0 0 0 3 3Z M18.5 16v5',

  /** Transfer aeroport. Avionul construit pe unghiurile din `arrow`. */
  'transfer-aeroport':
    'M3 11.5 20 6.6a1.6 1.6 0 0 1 1 3l-14 5.6-3.5-1.2 1.5-1.2 2 .6 M9.5 8.8 6.5 6.6l1.8-.6 3.7 2 M9.8 13.9l.7 3.2 1.6-.6.3-3.2 M4 20.5h16',

  /**
   * Încălzire cu lemne. Buștenii din `parking`, flacăra din `foc-de-tabara`.
   * Flacăra era la început două arce deschise; la 18px citeau ca două
   * bifе rătăcite. Acum e o picătură închisă, care se citește ca formă.
   */
  'incalzire-lemne':
    'M3 8.5h9.5a2.5 2.5 0 0 1 0 5H3z M3 13.5h9.5a2.5 2.5 0 0 1 0 5H3z M12.5 8.5a2.5 2.5 0 0 0 0 5 M12.5 13.5a2.5 2.5 0 0 0 0 5 M19 3c2 2.2 2 4.4 0 6.6-2-2.2-2-4.4 0-6.6Z',
}

interface Props {
  name: IconName
  /** `sm` 18px · implicit 24px · `lg` 32px. Mărimile din REGULI.md 8. */
  marime?: 'sm' | 'md' | 'lg'
  className?: string
  /**
   * Un icon lângă o etichetă e decorativ și primește `aria-hidden`.
   * Se dă `eticheta` DOAR când iconul stă singur și chiar poartă
   * informație — atunci devine `role="img"` cu nume accesibil.
   */
  eticheta?: string
}

export function Icon({ name, marime = 'md', className, eticheta }: Props) {
  const d = P[name]
  if (!d) return null

  const clase = ['icon', marime === 'sm' && 'icon--sm', marime === 'lg' && 'icon--lg', className]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      className={clase}
      viewBox="0 0 24 24"
      /* Contur, nu suprafață. `stroke-width` vine din icons.css. */
      fill="none"
      stroke="currentColor"
      aria-hidden={eticheta ? undefined : true}
      role={eticheta ? 'img' : undefined}
      focusable="false"
    >
      {eticheta ? <title>{eticheta}</title> : null}
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  )
}

/**
 * Rând de stele pentru note. Astea sunt singurele pline din set,
 * împreună cu logo-urile sociale: un contur citește ca „stea goală"
 * la 14px, adică exact opusul a ce vrea să spună.
 *
 * `numar` vine dintr-o notă reală. Nu se randează niciodată o stea
 * dintr-o notă pe care n-a dat-o nimeni (REGULI.md 3).
 */
export function Stele({ numar, dinCat = 5 }: { numar: number; dinCat?: number }) {
  const intregi = Math.round(numar)
  return (
    <span className="stars" role="img" aria-label={`${numar} din ${dinCat}`}>
      {Array.from({ length: intregi }, (_, i) => (
        <svg
          key={i}
          className="icon icon--sm icon--solid"
          style={{ ['--s' as string]: String(i) }}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m12 3.5 2.6 5.5 5.9.8-4.3 4.2 1.05 6L12 17.2 6.75 20l1.05-6L3.5 9.8l5.9-.8L12 3.5Z" />
        </svg>
      ))}
    </span>
  )
}

/** Numele tuturor iconurilor — folosit de pagina de probă din T04. */
export const NUME_ICONURI = Object.keys(P) as IconName[]
