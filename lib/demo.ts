import type { SiteData } from '@/content/types'
import { etichete } from '@/lib/i18n/etichete'

/**
 * Un `SiteData` complet, pentru o locație INVENTATĂ.
 *
 * Regula demo (REGULI.md 3): conținutul e complet și plauzibil
 * cap-coadă, dar niciun nume, telefon, adresă sau recenzie nu vine de
 * la o firmă reală. „Vila Piatra Craiului" nu există; numărul de
 * telefon e din blocul rezervat 0700; recenziile sunt scrise pentru
 * demonstrație.
 *
 * Folosit de pagina de probă din T06 și, mai târziu, ca punct de
 * plecare pentru demo-urile din C5.
 */
export const DEMO: SiteData = {
  meta: {
    sourceUrl: '',
    generatedAt: '2026-08-05T00:00:00.000Z',
    locale: 'ro-RO',
    localeShort: 'ro',
    currency: 'RON',
    currencySymbol: 'lei',
  },
  brand: {
    name: 'Vila Piatra Craiului',
    shortName: 'Vila Piatra',
    tagline: 'Cabană cu ciubăr, la 1.100 m, sub creasta Pietrei Craiului',
    monogram: 'PC',
    stars: 4,
  },
  theme: {
    colors: {
      ink: '#17201C',
      inkSoft: '#414D47',
      muted: '#64706B',
      line: '#E3DED5',
      canvas: '#FCFBF9',
      surface: '#FFFFFF',
      surfaceAlt: '#F4F1EC',
      brand: '#1F3D33',
      brandLift: '#2C5648',
      onBrand: '#FFFFFF',
      accent: '#8A5A22',
      accentLift: '#C79B5C',
      positive: '#2E7D5B',
      attention: '#B03A2E',
    },
    fonts: {
      display: 'Satoshi',
      body: 'Inter',
      displayStack: "'Satoshi', 'Inter', system-ui, sans-serif",
      bodyStack: "'Inter', system-ui, sans-serif",
      displaySpec: '',
      bodySpec: '',
      displayTracking: '-0.02em',
    },
    radius: '14px',
    character: 'warm',
  },
  seo: {
    title: 'Vila Piatra Craiului · Zărnești',
    description:
      'Cabană de 4 camere sub creasta Pietrei Craiului, cu ciubăr în aer liber și mic dejun din produse locale. La 15 minute de intrarea în Parcul Național.',
    canonical: '',
  },
  contact: {
    phone: '0700 100 200',
    phoneHref: 'tel:0700100200',
    email: 'rezervari@exemplu-piatra-craiului.ro',
    street: 'Strada Pietei 12',
    city: 'Zărnești',
    region: 'Brașov',
    postalCode: '505800',
    country: 'România',
    countryCode: 'RO',
    lat: 45.5619,
    lng: 25.3392,
    mapsUrl: 'https://maps.google.com/?q=45.5619,25.3392',
    hours: 'Recepție 08:00–22:00',
    social: [
      { label: 'Facebook', icon: 'facebook', url: 'https://facebook.com/exemplu' },
      { label: 'Instagram', icon: 'instagram', url: 'https://instagram.com/exemplu' },
    ],
  },
  nav: [
    { label: 'Camere', href: '/camere' },
    { label: 'Oferte', href: '/oferte' },
    { label: 'Contact', href: '/#contact' },
  ],
  locales: [],
  // Demo-ul e românesc, deci etichetele motorului sunt cele românești.
  ui: etichete('ro'),
  hero: {
    headline: 'O cabană sub creastă, cu ciubărul aprins seara',
    sub: 'Patru camere, un foișor cu grătar și poteci marcate care pornesc din curte. La 1.100 m, unde vara e umbră și iarna e liniște.',
    image: '',
    badges: [
      { icon: 'pin', text: 'Zărnești, Brașov' },
      { icon: 'star', text: 'Nota oaspeților', score: '9,4' },
      { icon: 'ciubar', text: 'Ciubăr în aer liber' },
    ],
  },
  rating: {
    value: '9,4',
    scale: 10,
    label: 'Nota oaspeților',
    count: 128,
    source: 'Booking.com',
  },
  trust: [
    { value: '1.100 m', label: 'altitudine' },
    { value: '9,4', label: 'nota oaspeților' },
    { value: '4', label: 'camere' },
    { value: '15 min', label: 'de intrarea în parc' },
  ],
  perks: {
    section: { eyebrow: 'La fața locului', title: 'Ce găsești aici', lede: 'Fără liste lungi — doar ce chiar contează pentru o ședere la munte.' },
    items: [
      { icon: 'ciubar', title: 'Ciubăr în aer liber', text: 'Se încălzește pe lemne, cu vedere la creastă. Îl aprindem la cerere, seara.' },
      { icon: 'foc-de-tabara', title: 'Foc de tabără', text: 'Vatră amenajată în curte, lemne incluse.' },
      { icon: 'mic-dejun', title: 'Mic dejun local', text: 'Ouă de la vecini, brânză de burduf, dulceață de afine făcută în casă.' },
      { icon: 'drumetie', title: 'Poteci din curte', text: 'Trasee marcate de la 2 la 9 km pornesc chiar de la poartă.' },
    ],
  },
  rooms: {
    section: { eyebrow: 'Cazare', title: 'Cele patru camere', lede: 'Fiecare are baie proprie și vedere spre pădure sau spre creastă.' },
    items: [
      {
        slug: 'camera-creasta',
        name: 'Camera Creasta',
        image: '',
        occupancy: '2 persoane',
        bed: 'pat dublu king size',
        size: '26 m²',
        amenities: ['wifi', 'climate', 'shower', 'coffee', 'terrace'],
        description: 'La etaj, cu balcon orientat spre creasta Pietrei Craiului. Dimineața intră soarele direct.',
        priceFrom: 320,
        tag: 'Cea mai căutată',
      },
      {
        slug: 'camera-padure',
        name: 'Camera Pădure',
        image: '',
        occupancy: '2 adulți + 1 copil',
        bed: 'pat dublu + canapea extensibilă',
        size: '30 m²',
        amenities: ['wifi', 'climate', 'shower', 'fridge', 'pet-friendly'],
        description: 'Parter, cu ieșire directă în curte. Acceptăm un animal de companie.',
        priceFrom: 360,
      },
      {
        slug: 'apartament-familie',
        name: 'Apartamentul Familie',
        image: '',
        occupancy: 'până la 4 persoane',
        bed: 'dormitor + living cu canapea',
        size: '44 m²',
        amenities: ['wifi', 'climate', 'shower', 'fridge', 'coffee', 'terrace'],
        priceFrom: 480,
      },
    ],
  },
  features: [
    {
      id: 'padurea',
      eyebrow: 'Locul',
      title: 'Pădurea începe la poartă',
      text: 'Trei hectare de fag bătrân, cu poteci marcate. Vara e umbră, toamna e roșu, iarna e liniște completă.',
      image: '',
      bullets: ['Poteci marcate de la 2 la 9 km', 'Ciubăr în aer liber pe terasa de sus', 'Foc de tabără amenajat'],
      ctas: [{ label: 'Vezi galeria', href: '/galerie', variant: 'ghost' }],
      reverse: false,
    },
    {
      id: 'micul-dejun',
      eyebrow: 'Dimineața',
      title: 'Micul dejun e din sat',
      text: 'Nu avem bufet. Avem ouă de la vecini, brânză de burduf și pâine coaptă în seara dinainte.',
      image: '',
      bullets: ['Produse de la producători din Zărnești', 'Servit între 08:00 și 10:30', 'Opțiuni vegetariene la cerere'],
      ctas: [],
      reverse: true,
    },
  ],
  offers: {
    section: { eyebrow: '', title: 'Pachete', lede: '' },
    items: [
      {
        slug: 'weekend-la-munte',
        title: 'Weekend la munte',
        kind: 'package',
        summary: 'Două nopți, mic dejun inclus și ciubărul aprins o seară.',
        text: 'Două nopți, mic dejun inclus și ciubărul aprins o seară.',
        bullets: ['Două nopți în cameră dublă', 'Mic dejun în fiecare dimineață', 'Ciubărul aprins o seară'],
        image: '',
        price: '640 lei',
        priceUnit: '/ 2 nopți',
        priceWas: '720 lei',
        badge: 'Cel mai luat',
        href: '/oferte/weekend-la-munte',
      },
      {
        slug: 'saptamana-de-drumetii',
        title: 'Săptămână de drumeții',
        kind: 'package',
        summary: 'Cinci nopți, mic dejun zilnic și o hartă cu trasee marcate.',
        text: 'Cinci nopți, mic dejun zilnic și o hartă cu trasee marcate.',
        bullets: ['Cinci nopți în cameră dublă', 'Mic dejun zilnic', 'Hartă cu trasee marcate'],
        image: '',
        price: '1.450 lei',
        priceUnit: '/ 5 nopți',
        href: '/oferte/saptamana-de-drumetii',
      },
    ],
  },
  excursions: { section: { eyebrow: '', title: 'Excursii', lede: '' } },
  events: {
    section: { eyebrow: 'Evenimente', title: 'Spații pentru grupuri', lede: '' },
    items: [
      {
        title: 'Foișorul mare',
        capacity: 'până la 30 de persoane',
        text: 'Pentru zile de naștere, botezuri mici sau team-building-uri de weekend.',
        image: '',
        cta: { label: 'Cere o ofertă', href: '/#contact', variant: 'ghost' },
      },
    ],
  },
  reviews: {
    section: { eyebrow: 'Oaspeți', title: 'Ce spun cei care au stat aici', lede: '' },
    items: [
      {
        quote: 'Ciubărul seara, cu vedere la creastă, a fost exact ce ne trebuia după o zi de drumeție. Gazde calde, mic dejun pe cinste.',
        author: 'Andreea M.',
        source: 'Booking.com',
        date: 'iulie 2026',
        rating: 5,
      },
      {
        quote: 'Am venit cu câinele și ne-am simțit bineveniți. Camera Pădure are ieșire directă în curte, foarte practic.',
        author: 'Radu T.',
        source: 'Google',
        date: 'iunie 2026',
        rating: 5,
      },
      {
        quote: 'Liniște completă și un mic dejun pe care încă îl mai țin minte. Ne întoarcem la iarnă.',
        author: 'Ioana și Vlad',
        source: 'Facebook',
        date: 'mai 2026',
        rating: 5,
      },
    ],
  },
  faq: {
    section: { eyebrow: '', title: 'Întrebări frecvente' },
    items: [
      { q: 'Se poate ajunge cu mașina până la cabană?', a: 'Da, drumul e asfaltat până la poartă, iar în curte e parcare gratuită pentru oaspeți.' },
      { q: 'Acceptați animale de companie?', a: 'În Camera Pădure, da, un animal de talie mică sau medie. Vă rugăm să ne anunțați la rezervare.' },
      { q: 'Ciubărul e inclus în preț?', a: 'Prima seară de ciubăr e inclusă la pachetul de weekend. În rest, îl aprindem la cerere contra unei taxe mici, ca să acoperim lemnele.' },
      { q: 'Care e politica de anulare?', a: 'Anulare gratuită cu până la 7 zile înainte de sosire. Detaliile complete sunt în pagina de politică de anulare.' },
    ],
  },
  area: {
    section: {
      eyebrow: 'Împrejurimile',
      title: 'Ce e de văzut în jur',
      lede: 'Distanțele sunt măsurate de la poarta cabanei, cu mașina.',
    },
    items: [
      {
        name: 'Cheile Turzii',
        distance: '20 de minute cu mașina',
        text: 'Un canion de calcar cu poteci marcate și scări metalice pe porțiunile expuse. Traseul de bază durează în jur de trei ore dus-întors și se face fără echipament.',
      },
      {
        name: 'Salina Turda',
        distance: '30 de minute cu mașina',
        text: 'Mina de sare amenajată, cu roata panoramică și lacul subteran. E varianta de rezervă pentru o zi cu ploaie și funcționează tot anul, la 12 grade constant.',
      },
    ],
  },
  closing: {
    eyebrow: 'Ne vedem la munte',
    title: 'Verifică ce camere sunt libere',
    text: 'Spune-ne perioada și câți sunteți, iar noi îți răspundem cu ce avem liber, în aceeași zi.',
    cta: { label: 'Verifică disponibilitatea', href: '#rezervare', variant: 'accent' },
  },
  booking: {
    engineUrl: '',
    sameOrigin: false,
    assurances: ['Anulare gratuită cu 7 zile înainte', 'Fără plată pe site', 'Confirmare în aceeași zi'],
    labels: {
      checkIn: 'Sosire',
      checkOut: 'Plecare',
      guests: 'Persoane',
      submit: 'Verifică disponibilitatea',
      from: 'de la',
      perNight: 'noapte',
    },
    guestOptions: ['1 persoană', '2 persoane', '3 persoane', '4 persoane'],
    mod: 'formular',
  },
  payments: { enabled: false },
  legal: {
    company: 'Exemplu Piatra Craiului SRL',
    registration: 'CUI 00000000 · J08/000/2020',
    links: [
      { label: 'Politica de confidențialitate', href: '/politica-confidentialitate' },
      { label: 'Politica de cookies', href: '/politica-cookies' },
      { label: 'Termeni și condiții', href: '/termeni' },
      { label: 'Politica de anulare', href: '/politica-anulare' },
    ],
  },
  mockup: { enabled: false, notice: '' },
}
