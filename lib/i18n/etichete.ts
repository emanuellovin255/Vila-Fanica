import type { Limba } from './limbi'

/* ============================================================
   etichete.ts — textele MOTORULUI, pe limbi.

   DE CE EXISTĂ (T08, T76)
   -----------------------
   Conținutul se traduce în `date/` și `en/`. Dar motorul are și el
   cuvintele lui, care nu vin din niciun fișier al clientului: „Acasă"
   din breadcrumb, „Închide" din dialoguri, numele lunilor din calendar,
   etichetele dotărilor, mesajul precompletat de WhatsApp, „de la"
   dinaintea prețului. Erau scrise direct în componente, în română — deci
   pe `/en` ieșeau tot în română, iar butonul „English" arăta o pagină pe
   jumătate tradusă.

   Aici stau o singură dată, în ambele limbi.

   REGULA, care nu se negociază (REGULI.md 3): aici intră DOAR text de
   interfață, generat de motor. Orice frază despre locație — ce se
   gătește, cum arată camerele, cât costă — e conținut și stă în `date/`,
   nu aici. Altfel un client ar moșteni descrierea altuia.

   CUM AJUNGE ÎN COMPONENTE. Loaderul știe limba, deci pune obiectul
   întreg în `SiteData.ui`. Fiecare componentă primește deja `date`, deci
   citește `date.ui.*` fără prop nou — inclusiv componentele client, unde
   un import de funcție care depinde de limbă n-ar fi mers.
   ============================================================ */

export interface Etichete {
  /* Navigație — etichetele derivate în `lib/continut/index.ts`. */
  navCamere: string
  navOferte: string
  navRestaurant: string
  navEvenimente: string
  navGalerie: string
  navZona: string
  navContact: string

  /* Titluri de secțiune de rezervă, când fișierul clientului n-are unul. */
  sectiuneOferte: string
  sectiuneExcursii: string
  sectiuneEvenimente: string
  sectiuneRecenzii: string
  sectiuneIntrebari: string
  sectiuneZona: string

  /* Antet și subsol. */
  sariLaContinut: string
  acasa: string
  navigatiePrincipala: string
  navigatieSubsol: string
  meniu: string
  limba: string
  pagini: string
  contact: string
  informatiiLegale: string
  legal: string
  sol: string
  setariCookies: string
  tara: string

  /* Documente legale — etichetele linkurilor din subsol. */
  politicaConfidentialitate: string
  politicaCookies: string
  termeniSiConditii: string
  politicaAnulare: string

  /* Prețuri și rezervare. */
  dela: string
  peNoapte: string
  sosire: string
  plecare: string
  persoane: string
  verificaDisponibilitatea: string
  incarcaMotorul: string

  /* Dialogul de rezervare. */
  inchide: string
  unOaspeteMaiPutin: string
  incaUnOaspete: string
  camera: string
  nuMamHotarat: string
  numeleTau: string
  numeleTauExemplu: string
  noapte: string
  nopti: string
  alegePerioada: string
  notaWhatsApp: string

  /* Ramura „locația are motor de rezervări" a dialogului (Booking & co). */
  rezervaPe: string
  intreabaPeWhatsApp: string
  sauIntreabaDirect: string
  notaMotor: string

  /* Calendar. */
  zile: string[]
  luni: string[]
  luniMici: string[]
  lunaAnterioara: string
  lunaUrmatoare: string

  /* Mesajul precompletat de WhatsApp. */
  waSalut: string
  waNume: string
  waSubiect: string
  waSosire: string
  waPlecare: string
  waOaspeti: string

  /* Hartă. */
  hartaCatre: string
  deschideInMaps: string
  deschideInWaze: string
  locatie: string

  /* Diverse etichete de interfață. */
  actiuniRapide: string
  laUnMomentDat: string
  ceInclude: string
  veziToataZona: string
  veziPachetul: string
  veziExcursia: string
  fotografiaAnterioara: string
  fotografiaUrmatoare: string
  galerieTitlu: string
  galerieSubtitlu: string
  /** `{nume}` se înlocuiește cu numele locației, la randare. */
  galerieLede: string
  /** `<meta description>` a paginii de galerie. `{nume}` la fel. */
  galerieDescriere: string
  /** `<meta description>` de rezervă pentru `/zona`. `{nume}` la fel. */
  zonaDescriere: string
  valoriNutritionale: string

  /* Etichetele dotărilor (`AmenitatiChips`). */
  dotari: Record<string, string>

  /**
   * Descrieri de REZERVĂ pentru `<meta description>`, când fișierul
   * clientului n-are una. Se completează cu numele locației.
   */
  descriereCamere: string
  descriereOferte: string
}

const RO: Etichete = {
  navCamere: 'Camere',
  navOferte: 'Oferte',
  navRestaurant: 'Restaurant',
  navEvenimente: 'Evenimente',
  navGalerie: 'Galerie',
  navZona: 'Zona',
  navContact: 'Contact',

  sectiuneOferte: 'Oferte',
  sectiuneExcursii: 'Excursii',
  sectiuneEvenimente: 'Evenimente',
  sectiuneRecenzii: 'Ce spun oaspeții',
  sectiuneIntrebari: 'Întrebări frecvente',
  sectiuneZona: 'Zona',

  sariLaContinut: 'Sari la conținut',
  acasa: 'Acasă',
  navigatiePrincipala: 'Navigație principală',
  navigatieSubsol: 'Navigație subsol',
  meniu: 'Meniu',
  limba: 'Limbă',
  pagini: 'Pagini',
  contact: 'Contact',
  informatiiLegale: 'Informații legale',
  legal: 'Legal',
  sol: 'Soluționarea online a litigiilor (SOL)',
  setariCookies: 'Setări cookies',
  tara: 'România',

  politicaConfidentialitate: 'Politica de confidențialitate',
  politicaCookies: 'Politica de cookies',
  termeniSiConditii: 'Termeni și condiții',
  politicaAnulare: 'Politica de anulare',

  dela: 'de la',
  peNoapte: 'pe noapte',
  sosire: 'Sosire',
  plecare: 'Plecare',
  persoane: 'Persoane',
  verificaDisponibilitatea: 'Verifică disponibilitatea',
  incarcaMotorul: 'Încarcă motorul de rezervări',

  inchide: 'Închide',
  unOaspeteMaiPutin: 'Un oaspete mai puțin',
  incaUnOaspete: 'Încă un oaspete',
  camera: 'Camera',
  nuMamHotarat: 'Nu m-am hotărât încă',
  numeleTau: 'Numele dumneavoastră',
  numeleTauExemplu: 'ex. Andrei Popescu',
  noapte: 'noapte',
  nopti: 'nopți',
  alegePerioada: 'Alege sosirea și plecarea',
  notaWhatsApp:
    'Butonul deschide WhatsApp cu numele, camera și perioada deja scrise. Poți modifica mesajul înainte să-l trimiți.',

  rezervaPe: 'Rezervă pe',
  intreabaPeWhatsApp: 'Întreabă pe WhatsApp',
  sauIntreabaDirect: 'sau întreabă gazda pe WhatsApp',
  notaMotor:
    'Se deschide {motor} cu perioada și numărul de oaspeți deja completate — acolo vezi ce e liber și prețul exact.',

  zile: ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'],
  luni: [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
  ],
  luniMici: [
    'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
  ],
  lunaAnterioara: 'Luna anterioară',
  lunaUrmatoare: 'Luna următoare',

  waSalut: 'Bună ziua! Aș vrea să verific disponibilitatea.',
  waNume: 'Nume',
  waSubiect: 'Camera / pachetul',
  waSosire: 'Sosire',
  waPlecare: 'Plecare',
  waOaspeti: 'Oaspeți',

  hartaCatre: 'Hartă către',
  deschideInMaps: 'Deschide în Google Maps',
  deschideInWaze: 'Deschide în Waze',
  locatie: 'locație',

  actiuniRapide: 'Acțiuni rapide',
  laUnMomentDat: 'La un moment dat',
  ceInclude: 'Ce include',
  veziToataZona: 'Vezi toată zona',
  veziPachetul: 'Vezi pachetul',
  veziExcursia: 'Vezi excursia',
  fotografiaAnterioara: 'Fotografia anterioară',
  fotografiaUrmatoare: 'Fotografia următoare',
  galerieTitlu: 'Galerie',
  galerieSubtitlu: 'Locul, în fotografii',
  galerieLede:
    'Toate fotografiile de la {nume}, la rezoluție mare. Apasă pe oricare ca să o vezi întreagă.',
  galerieDescriere: 'Fotografii de la {nume}: camerele, locul și împrejurimile.',
  zonaDescriere: 'Ce e de văzut în jurul {nume}, cu distanțele până la fiecare.',
  valoriNutritionale: 'Valori nutriționale',

  dotari: {
    wifi: 'Wi-Fi',
    tv: 'TV',
    climate: 'Climatizare',
    safe: 'Seif',
    fridge: 'Frigider',
    coffee: 'Cafea',
    shower: 'Duș',
    terrace: 'Terasă',
    bed: 'Pat dublu',
    users: 'Mai multe camere',
    accessible: 'Acces facil',
    parking: 'Parcare',
    ev: 'Încărcare electrică',
    pool: 'Piscină',
    sauna: 'Saună',
    spa: 'Spa',
    dining: 'Restaurant',
    bar: 'Bar',
    ciubar: 'Ciubăr',
    grill: 'Grătar',
    'pet-friendly': 'Pet friendly',
    'mic-dejun': 'Mic dejun',
    pescuit: 'Pescuit',
    biciclete: 'Biciclete',
  },

  descriereCamere: 'Camerele și apartamentele de la',
  descriereOferte: 'Pachete și oferte la',
}

const EN: Etichete = {
  navCamere: 'Rooms',
  navOferte: 'Offers',
  navRestaurant: 'Restaurant',
  navEvenimente: 'Events',
  navGalerie: 'Gallery',
  navZona: 'The area',
  navContact: 'Contact',

  sectiuneOferte: 'Offers',
  sectiuneExcursii: 'Boat trips',
  sectiuneEvenimente: 'Events',
  sectiuneRecenzii: 'What guests say',
  sectiuneIntrebari: 'Frequently asked questions',
  sectiuneZona: 'The area',

  sariLaContinut: 'Skip to content',
  acasa: 'Home',
  navigatiePrincipala: 'Main navigation',
  navigatieSubsol: 'Footer navigation',
  meniu: 'Menu',
  limba: 'Language',
  pagini: 'Pages',
  contact: 'Contact',
  informatiiLegale: 'Legal information',
  legal: 'Legal',
  sol: 'Online Dispute Resolution (ODR)',
  setariCookies: 'Cookie settings',
  tara: 'Romania',

  politicaConfidentialitate: 'Privacy policy',
  politicaCookies: 'Cookie policy',
  termeniSiConditii: 'Terms and conditions',
  politicaAnulare: 'Cancellation policy',

  dela: 'from',
  peNoapte: 'per night',
  sosire: 'Check-in',
  plecare: 'Check-out',
  persoane: 'Guests',
  verificaDisponibilitatea: 'Check availability',
  incarcaMotorul: 'Load the booking engine',

  inchide: 'Close',
  unOaspeteMaiPutin: 'One guest fewer',
  incaUnOaspete: 'One more guest',
  camera: 'Room',
  nuMamHotarat: "I haven't decided yet",
  numeleTau: 'Your name',
  numeleTauExemplu: 'e.g. Andrew Fisher',
  noapte: 'night',
  nopti: 'nights',
  alegePerioada: 'Pick your check-in and check-out',
  notaWhatsApp:
    'The button opens WhatsApp with your name, the room and your dates already written. You can edit the message before sending it.',

  rezervaPe: 'Book on',
  intreabaPeWhatsApp: 'Ask on WhatsApp',
  sauIntreabaDirect: 'or ask the host on WhatsApp',
  notaMotor:
    'This opens {motor} with your dates and party size already filled in — that is where you see what is free and the exact price.',

  zile: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  luni: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  luniMici: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  lunaAnterioara: 'Previous month',
  lunaUrmatoare: 'Next month',

  waSalut: "Hello! I'd like to check availability.",
  waNume: 'Name',
  waSubiect: 'Room / package',
  waSosire: 'Check-in',
  waPlecare: 'Check-out',
  waOaspeti: 'Guests',

  hartaCatre: 'Map to',
  deschideInMaps: 'Open in Google Maps',
  deschideInWaze: 'Open in Waze',
  locatie: 'the property',

  actiuniRapide: 'Quick actions',
  laUnMomentDat: 'At a glance',
  ceInclude: "What's included",
  veziToataZona: 'See the whole area',
  veziPachetul: 'See the package',
  veziExcursia: 'See the trip',
  fotografiaAnterioara: 'Previous photo',
  fotografiaUrmatoare: 'Next photo',
  galerieTitlu: 'Gallery',
  galerieSubtitlu: 'The place, in pictures',
  galerieLede:
    'Every photo from {nume}, at full resolution. Tap any of them to see it whole.',
  galerieDescriere: 'Photos from {nume}: the rooms, the place and the surroundings.',
  zonaDescriere: 'What there is to see around {nume}, and how far each of them is.',
  valoriNutritionale: 'Nutrition facts',

  dotari: {
    wifi: 'Wi-Fi',
    tv: 'TV',
    climate: 'Air conditioning',
    safe: 'Safe',
    fridge: 'Fridge',
    coffee: 'Coffee',
    shower: 'Shower',
    terrace: 'Terrace',
    bed: 'Double bed',
    users: 'Multiple rooms',
    accessible: 'Step-free access',
    parking: 'Parking',
    ev: 'EV charging',
    pool: 'Pool',
    sauna: 'Sauna',
    spa: 'Spa',
    dining: 'Restaurant',
    bar: 'Bar',
    ciubar: 'Hot tub',
    grill: 'Barbecue',
    'pet-friendly': 'Pet friendly',
    'mic-dejun': 'Breakfast',
    pescuit: 'Fishing',
    biciclete: 'Bicycles',
  },

  descriereCamere: 'Rooms and apartments at',
  descriereOferte: 'Packages and offers at',
}

const TOATE: Record<Limba, Etichete> = { ro: RO, en: EN }

export function etichete(limba: Limba): Etichete {
  return TOATE[limba] ?? RO
}
