/**
 * The single source of truth for a generated site.
 *
 * `scripts/ingest.ts` writes `content/site.json` against this shape by reading a
 * real hotel website; every component renders from it and nothing else. Adding a
 * field here means adding it to the extractor and to the component that uses it —
 * there is no other place where site-specific content is allowed to live.
 */

import type { Etichete } from '@/lib/i18n/etichete'

export type { Etichete }

export type IconName =
  | 'pin' | 'clock' | 'phone' | 'mail' | 'globe'
  | 'users' | 'bed' | 'ruler' | 'accessible' | 'door'
  | 'wifi' | 'tv' | 'safe' | 'fridge' | 'climate' | 'coffee' | 'shower' | 'parking' | 'ev'
  | 'pool' | 'sauna' | 'spa' | 'dining' | 'bar' | 'terrace'
  | 'check' | 'arrow' | 'plus' | 'chevron' | 'star' | 'search' | 'close' | 'play'
  | 'tag' | 'calendar' | 'refresh' | 'glass' | 'clock-late' | 'shield'
  | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok'
  // T04 — adăugate pentru nișa de cazare din România. Apar des la
  // cabane și pensiuni și nu existau în setul din hotel-forge.
  | 'ciubar' | 'foc-de-tabara' | 'teleschi' | 'pet-friendly' | 'grill'
  | 'biciclete' | 'drumetie' | 'pescuit' | 'sala-conferinte'
  | 'mic-dejun' | 'transfer-aeroport' | 'incalzire-lemne'

export interface Palette {
  /** Primary text. */
  ink: string
  /** Secondary text on light grounds. */
  inkSoft: string
  /** Tertiary text, captions, labels. */
  muted: string
  /** Hairlines and borders. */
  line: string
  /** Page ground. */
  canvas: string
  /** Cards and raised surfaces. */
  surface: string
  /** Recessed bands and alternating sections. */
  surfaceAlt: string
  /** The brand's dominant colour — headers, dark sections, primary buttons. */
  brand: string
  /** A lighter step of the brand, for hover states. */
  brandLift: string
  /** Text/iconography that sits on `brand`. */
  onBrand: string
  /** The single accent. Used sparingly: eyebrows, prices, one CTA. */
  accent: string
  /** A lighter step of the accent, for use on dark grounds. */
  accentLift: string
  /** Positive/confirmation. */
  positive: string
  /** Scarcity and time-sensitive notices. */
  attention: string
}

export interface Typography {
  /** Display family name as it must appear in `font-family`. */
  display: string
  /** Body family name. */
  body: string
  /** Full stacks including fallbacks. */
  displayStack: string
  bodyStack: string
  /** Google Fonts family+weight spec, consumed by `scripts/lib/fonts.ts`. */
  displaySpec: string
  bodySpec: string
  /** Optical correction: some display faces need tighter tracking at large sizes. */
  displayTracking: string
}

export interface Theme {
  colors: Palette
  fonts: Typography
  /** Corner radius token. A brand with hard geometry should get `0px`. */
  radius: string
  /** Set when the source brand reads as classic//luxury rather than contemporary. */
  character: 'classic' | 'contemporary' | 'warm' | 'coastal' | 'irlandez'
}

export interface NavItem {
  label: string
  href: string
}

export interface Cta {
  label: string
  href: string
  variant?: 'primary' | 'accent' | 'ghost' | 'light'
}

/**
 * Un tarif și perioada în care e valabil: „290 lei / noapte" +
 * „martie–mai".
 *
 * Există fiindcă o pensiune din Deltă vinde pe sezoane, nu pe un preț
 * unic. Proza „290 lei între 27 martie și 31 mai, 320 lei între 1 iunie
 * și 31 octombrie" e adevărată, dar nimeni n-o citește dintr-un card:
 * cerința clientului e lista, în locul paragrafului.
 *
 * `amount` rămâne TEXT, nu număr: la camere e „290 lei / noapte", la
 * pachete „1.400 lei / persoană" — unități diferite, scrise de gazdă
 * exact cum vrea să apară. Numărul curat, din care se generează `Offer`
 * în JSON-LD, rămâne `Room.priceFrom`.
 */
export interface PretPerioada {
  /** „290 lei / noapte" */
  amount: string
  /** „martie–mai" */
  period: string
}

export interface Room {
  slug: string
  name: string
  image: string
  images?: string[]
  /** e.g. "2 persoane" */
  occupancy?: string
  /** e.g. "Pat dublu" */
  bed?: string
  /** e.g. "24 m²" */
  size?: string
  amenities: string[]
  description?: string
  /** Numeric so the template can format and mark up `Offer` schema. */
  priceFrom?: number
  /**
   * Grila de tarife pe sezoane („Prețuri:" în `04-camere.md`). Când
   * există, ÎNLOCUIEȘTE prețul unic „de la …" din card și descrierea în
   * proză din pagina camerei. Fără ea, totul se randează ca înainte.
   */
  prices?: PretPerioada[]
  /** Ribbon text. Omit rather than inventing one. */
  tag?: string
  /** Renders the ribbon in the attention colour. Only ever set from real availability. */
  scarce?: boolean
  /**
   * Clip vertical al camerei (T60), filmat cu telefonul. NU e fundal
   * decorativ: are comentariu audio și se redă click-to-play, cu sunet.
   * Elementul `<video>` se montează abia la apăsarea butonului de play,
   * deci până atunci în pagină e doar posterul — zero bytes de video.
   * Randat ca ultim bloc din pagina camerei.
   */
  video?: string
  /** Posterul clipului. Fără el, `VideoVertical` nu se randează (T60, verifica). */
  videoPoster?: string
}

export interface Feature {
  id: string
  eyebrow: string
  title: string
  text: string
  image: string
  bullets: string[]
  ctas: Cta[]
  /** Mirrors the split so consecutive features alternate. */
  reverse?: boolean
}

export interface Offer {
  slug: string
  title: string
  /**
   * Proza completă a blocului, pentru pagina `/oferte/<slug>`. NU se
   * randează în carduri sau în blocurile alternante: acolo intră
   * `summary`. Până la T75 aici ajungea lista `Include:` întreagă, unită
   * într-un singur string — de unde carduri de trei ori mai înalte decât
   * vecinele lor și aer mort în grilă.
   */
  text: string
  /** O frază, scrisă în `Rezumat:`. Ce se afișează în card și în bloc. */
  summary: string
  /** Lista din `Include:`, ca elemente separate — nu ca un paragraf. */
  bullets: string[]
  image: string
  /**
   * Pachetele se vând cu preț și se randează ca blocuri poză + text;
   * excursiile sunt incluse în pachete, n-au preț propriu și se randează
   * ca o grilă uniformă. Fără distincția asta ajungeau amestecate în
   * aceeași grilă, iar lipsa prețului lăsa jumătate din carduri fără
   * subsol (T75).
   */
  kind: 'package' | 'excursion'
  /** Formatted, because offers are quoted per package not per night. */
  price?: string
  priceWas?: string
  priceUnit?: string
  /**
   * Variantele de perioadă cu prețul fiecăreia („Prețuri:" în
   * `06-oferte-si-excursii.md`). Un pachet care se vinde cu 1.400 lei primăvara și
   * 1.500 vara nu are „un preț" — are două, iar „de la 1.400" ascunde
   * jumătate din adevăr până la pagina ofertei. Când lista există, se
   * randează în locul prețului unic.
   */
  prices?: PretPerioada[]
  /** „1 aprilie – 30 septembrie" la pachete, „o jumătate de zi" la excursii. */
  valid?: string
  badge?: string
  href?: string
}

export interface EventSpace {
  title: string
  capacity: string
  text: string
  image: string
  cta: Cta
}

export interface Review {
  quote: string
  author: string
  /** Where it came from. Never leave blank on a live site. */
  source: string
  date: string
  rating: number
}

export interface Faq {
  q: string
  a: string
}

export interface SiteData {
  meta: {
    sourceUrl: string
    generatedAt: string
    locale: string
    localeShort: string
    currency: string
    currencySymbol: string
  }
  brand: {
    name: string
    shortName: string
    tagline: string
    monogram: string
    logo?: string
    stars?: number
  }
  theme: Theme
  seo: {
    title: string
    description: string
    canonical: string
    ogImage?: string
  }
  contact: {
    phone: string
    phoneHref: string
    /**
     * Numărul de WhatsApp, exact cum e scris în `date/02-telefon-email-si-adresa.md`.
     * Stă separat de `phone` pentru că e un canal de rezervare, nu o
     * rețea socială: butoanele „Verifică disponibilitatea" construiesc
     * din el un link `wa.me` cu mesaj precompletat (`lib/whatsapp.ts`).
     * Gol → butoanele cad înapoi pe ancora `#rezervare`.
     */
    whatsapp?: string
    email: string
    street: string
    city: string
    region?: string
    postalCode?: string
    country: string
    countryCode: string
    lat?: number
    lng?: number
    mapsUrl?: string
    hours?: string
    social: { label: string; icon: IconName; url: string }[]
  }
  nav: NavItem[]
  locales: { code: string; label: string; href: string; current?: boolean }[]
  /**
   * Textele MOTORULUI în limba paginii (`lib/i18n/etichete.ts`): „Acasă",
   * „Închide", numele lunilor, etichetele dotărilor, mesajul de WhatsApp.
   *
   * Stă în `SiteData` fiindcă loaderul e singurul care știe limba, iar
   * fiecare componentă primește deja `date` — inclusiv cele client, unde
   * un `etichete(limba)` importat direct n-ar fi avut de unde lua limba.
   * Înainte, textele astea erau scrise în română direct în componente,
   * deci `/en` rămânea pe jumătate românesc (T76).
   */
  ui: Etichete
  hero: {
    headline: string
    sub: string
    image: string
    /**
     * Video de fundal pentru Șablonul 1 (Hero Video, T20). Opțional:
     * fără el, hero-ul rămâne pe poster (`image`). Nu se redă niciodată
     * pe mobil, sub `prefers-reduced-motion`, pe `saveData` sau pe
     * conexiuni lente — decizia se ia client-side, deci pe mobil nu se
     * descarcă niciun byte (T20). Sub 3 MB, fără pistă audio (ingest).
     */
    videoSrc?: string
    /**
     * Cadrele caruselului de pe Șablonul 4 (Carusel editorial, T-Delta),
     * din blocul `## Carusel` al lui `03-pagina-principala.md`.
     *
     * Fiecare cadru are poza LUI și, opțional, titlu și subtitlu proprii.
     * Un cadru fără text cade pe `headline`/`sub` de mai sus, deci se
     * poate scrie o simplă listă de poze și caruselul rămâne corect.
     *
     * Lista goală → hero-ul rămâne poza unică (`image`), exact ca pe
     * șabloanele 1–3. De aceea câmpul e opțional: niciun client existent
     * nu simte adăugarea lui.
     */
    slides?: { image: string; headline?: string; sub?: string }[]
    badges: { icon?: IconName; text: string; score?: string }[]
  }
  /**
   * Banda de semnătură (T-Delta) — o singură frază, mare, cu serifă, peste
   * o poză întunecată. Vine din blocul `## Bandă de semnătură` al lui
   * `03-pagina-principala.md`.
   *
   * E momentul „de ce aici" al paginii: nu vinde o dotare, ci spune ce fel
   * de loc e. Fără `text`, secțiunea nu se randează deloc (REGULI.md 3).
   */
  signature?: { eyebrow: string; text: string; image: string; attribution?: string }
  /**
   * „Povestea noastră" — primul bloc de text de sub hero, fără poză și
   * fără buton. Cerință de client: după titlu vine proza locului, nu
   * încă un formular.
   *
   * Paragrafele stau ca listă, nu ca un singur string: în markdown sunt
   * despărțite prin rând gol, iar un `<p>` cu `white-space: pre-line`
   * ar da un bloc de zece rânduri fără aer între idei.
   */
  story?: { eyebrow: string; title: string; paragraphs: string[] }
  /**
   * Antetul secțiunii de servicii: titlu, text introductiv și butonul
   * către pachete. Blocurile propriu-zise (transport, cazare, masă) sunt
   * `features` — aceeași structură poză + text, doar introduse de aici.
   */
  services?: { eyebrow: string; title: string; lede: string; cta?: Cta }
  /**
   * Pagina `/contact` (`date/14-pagina-de-contact.md`). Datele de contact
   * propriu-zise rămân în `contact` — aici stau doar textele paginii.
   *
   * E pagină, nu ancoră către subsol: „Contact" din meniu trebuie să
   * ducă undeva, nu să deruleze la finalul paginii curente.
   */
  contactPage?: {
    section: { eyebrow: string; title: string; lede: string }
    /** „Cum ajungi" — indicațiile de acces, mutate din prima pagină. */
    acces?: { title: string; text: string; bullets: string[] }
  }
  /** Aggregate guest score. Rendered without naming a platform. */
  rating?: {
    value: string
    scale: number
    label: string
    /** Kept for schema.org even when not displayed. */
    count?: number
    source?: string
  }
  trust: { value: string; label: string }[]
  perks: {
    section: { eyebrow: string; title: string; lede: string }
    items: { icon: IconName; title: string; text: string }[]
    footnote?: { text: string; highlight?: string; cta: Cta }
  }
  rooms: {
    section: { eyebrow: string; title: string; lede: string }
    items: Room[]
  }
  features: Feature[]
  /**
   * Clip de prezentare al locației (T60), pe prima pagină. Vertical, cu
   * comentariu audio, click-to-play — la fel ca video-ul de cameră. Apare
   * doar dacă blocul `## Clip de prezentare` din `03-pagina-principala.md` e
   * completat ȘI `Clip de prezentare` e în `## Secțiuni` din `setari.md`.
   */
  prezentare?: { eyebrow: string; title: string; text: string; video: string; poster: string }
  offers: {
    section: { eyebrow: string; title: string; lede: string }
    /** Pachetele ȘI excursiile: aceeași sursă, despărțite la randare după `kind`. */
    items: Offer[]
  }
  /**
   * Doar antetul secțiunii de excursii de pe prima pagină — elementele
   * stau în `offers.items` cu `kind: 'excursion'`, fiindcă vin din
   * același fișier și au aceleași pagini `/oferte/<slug>`.
   */
  excursions: {
    section: { eyebrow: string; title: string; lede: string }
  }
  events: {
    section: { eyebrow: string; title: string; lede: string }
    items: EventSpace[]
  }
  reviews: {
    section: { eyebrow: string; title: string; lede: string }
    items: Review[]
  }
  faq: {
    section: { eyebrow: string; title: string }
    items: Faq[]
  }
  /**
   * Pagina „Zona" (T05, `date/13-zona-si-atractii.md`) — atracțiile din jur și distanțele
   * până la ele. Se randează la `/zona` doar cu `Pagina „Zona": da` în
   * `setari.md`.
   *
   * Prinde căutările din faza „unde mergem?", care sunt anterioare fazei „unde
   * dormim?" și au concurență mult mai mică: cine caută „ce vizitezi în Delta
   * Dunării" nu caută încă o pensiune, dar va căuta una.
   */
  area: {
    section: { eyebrow: string; title: string; lede: string }
    items: AreaAttraction[]
  }
  closing: {
    eyebrow: string
    title: string
    text: string
    cta: Cta
  }
  booking: {
    /** Where the engine lives. Cross-origin engines get a linker warning in the audit. */
    engineUrl: string
    sameOrigin: boolean
    /** Reassurances shown under the date picker. */
    assurances: string[]
    labels: {
      checkIn: string
      checkOut: string
      guests: string
      submit: string
      from: string
      perNight: string
    }
    guestOptions: string[]
    /**
     * Cum se ajunge la motorul de rezervări (T12), din `date/10-rezervari-si-plati.md`:
     * - `deep-link`: buton către motorul lor, cu datele deja completate (preferat);
     * - `iframe`: motorul lor încărcat leneș, la click/în viewport;
     * - `formular`: locația n-are motor — cererea merge pe email (T10) + telefon.
     */
    mod: 'deep-link' | 'iframe' | 'formular'
    /** Cheia furnizorului pentru formatul de parametri la deep-link (previo, siteminder, cloudbeds, booking…). */
    furnizor?: string
  }
  /**
   * Plăți online prin Netopia (T13). Implicit OPRIT: majoritatea locațiilor
   * încasează la sosire sau prin sistemul lor. Când e `false`, nimic din
   * `lib/plati/` nu e importat, iar site-ul se buildează fără să atingă modulul.
   * Comutatorul vine din `date/10-rezervari-si-plati.md` („## Plăți", „Activ: nu").
   */
  payments: {
    enabled: boolean
  }
  legal: {
    company: string
    registration?: string
    links: NavItem[]
  }
  /** Renders the proposal banner and enables the improvements overlay. */
  mockup: {
    enabled: boolean
    notice: string
  }
}

/** O atracție din jur, pentru pagina „Zona". */
export interface AreaAttraction {
  name: string
  /** Cum se ajunge și cât durează: „45 de minute cu barca". Text liber, nu km. */
  distance?: string
  image?: string
  text: string
  /**
   * `Prima pagină: da` în `13-zona-si-atractii.md` — atracția intră și în secțiunea
   * „Locația" de pe prima pagină, nu doar pe `/zona`.
   *
   * Există fiindcă selecția implicită („primele trei din fișier") punea
   * pe prima pagină exact atracțiile care se vând și ca excursii, deci
   * aceleași trei poze și aceleași trei texte apăreau de două ori pe
   * același ecran (T75). Nimeni marcat → se cade pe primele trei, deci
   * clienții care n-au cheia asta se randează neschimbat.
   */
  onHome?: boolean
}

export type Severity = 'critic' | 'important' | 'minor'
export type Area = 'performanta' | 'seo' | 'conversie' | 'tracking' | 'accesibilitate'

export interface AuditFinding {
  id: string
  severity: Severity
  area: Area
  title: string
  /** What was actually measured on the source site. Never a generic claim. */
  evidence: string
  /** What this template does instead. */
  fix: string
  /** DOM id the improvements overlay pins the marker to. */
  anchor?: string
}

export interface AuditReport {
  sourceUrl: string
  generatedAt: string
  findings: AuditFinding[]
  metrics: {
    htmlBytes?: number
    assetBytes?: number
    cssFiles?: number
    jsFiles?: number
    images?: number
    largestMedia?: { url: string; bytes: number; type: string }
    cacheControl?: string
    schemaTypes?: string[]
    hreflang?: string[]
    lang?: string
    sitemapPages?: number
    pricesFound?: number
  }
}
