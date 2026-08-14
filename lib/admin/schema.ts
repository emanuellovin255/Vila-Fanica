/* ============================================================
   schema.ts — ce formular arată panoul pentru fiecare fișier.

   ATENȚIE, PENTRU CINE ÎNTREȚINE MOTORUL: parte din panoul de
   administrare, o modificare locală față de motorul-sursă. Vezi
   `MOTOR-MODIFICAT.md`.

   E SINGURUL FIȘIER AL PANOULUI SCRIS PENTRU SITE-UL ĂSTA. Restul
   (`api.ts`, `depozit.ts`, `github.ts`, `patch.ts`, `sesiune.ts`,
   `app/admin/**`, `components/admin/**`) nu știe ce site e și se
   propagă neatins. Aici, în schimb, fiecare rând a fost scris citind
   `date/*.md` ale Pensiunii Izora.

   DE CE O SCHEMĂ ȘI NU UN TEXTAREA
   --------------------------------
   Un textarea cu markdown-ul brut ar fi mutat problema înapoi la gazdă:
   ar trebui în continuare să știe că prețul se scrie fără „lei", că
   „Poze:" cere numele exact al fișierului, că o listă pe un rând se taie
   la virgulă. Adică ar fi GitHub cu alt fundal.

   Schema mută cunoștințele alea în cod: fiecare câmp are un tip, o
   etichetă și o explicație.

   AJUTOARELE VIN DIN FIȘIERE
   --------------------------
   Textele de la `ajutor` sunt luate din comentariile `<!-- … -->` deja
   scrise în `date/`. Nu sunt explicații noi: cine editează din GitHub și
   cine editează din panou trebuie să citească același lucru, altfel unul
   dintre cele două texte va fi greșit peste șase luni.

   CHEILE SUNT SINGURA SURSĂ DE ADEVĂR
   -----------------------------------
   `cheie` e forma NORMALIZATĂ (litere mici, fără diacritice) cu care
   caută parserul; `cheieScrisa` e cum se scrie rândul când câmpul e
   adăugat prima dată. O cheie greșită înseamnă că panoul scrie un câmp
   pe care motorul îl ignoră în tăcere — gazda vede „salvat" și pe site
   nu se schimbă nimic. Listele acceptate de motor sunt `CHEI_CAMERA`,
   `CHEI_OFERTA`, `CHEI_RECENZIE` și `CHEI_ZONA` din
   `lib/continut/index.ts`; `npm run proba-patch` verifică pe fișierele
   reale că schema și motorul văd aceleași chei.

   CE NU E AICI, ȘI DE CE
   ----------------------
   · `07-meniu-restaurant.md` — modulul e oprit și fișierul n-are niciun
     preparat. Fișierul explică de ce (alergenii sunt cerință legală și
     nu se deduc din poze). O dală goală n-ar ajuta pe nimeni.
   · `11-culori-si-fonturi.md` — culorile se aleg la construcția
     site-ului. O culoare greșită face panoul însuși ilizibil.
   · „## Feature-uri alternante" din `03-pagina-principala.md` — cele
     trei blocuri poză + text (transport, cazare, masă) sunt sub-blocuri
     `###`, iar formularele panoului lucrează pe blocuri `##`. Se
     editează din GitHub. Vezi `ADMIN.md`.
   ============================================================ */

import { FISIERE } from '@/lib/continut/fisiere'

/* ------------------------------------------------------------------ */
/* Tipuri                                                             */
/* ------------------------------------------------------------------ */

export type TipCamp =
  /** Un rând. */
  | 'text'
  /** Mai multe rânduri, pentru fraze. */
  | 'paragraf'
  /** Doar cifre. Panoul afișează sufixul și refuză „380 lei". */
  | 'numar'
  /** O poză din `poze/`, aleasă din grilă. */
  | 'poza'
  /** Mai multe poze, în ordine. Prima e cea de pe card. */
  | 'poze'
  /** Un clip din `poze/`. */
  | 'video'
  /** Listă de rânduri: fiecare element pe rândul lui în fișier. */
  | 'lista'
  /** Listă de etichete scurte, pe un rând, despărțite prin virgulă. */
  | 'etichete'
  /** `da` / `nu`. */
  | 'da-nu'
  /** Iconuri din setul lui `components/Icon.tsx`. */
  | 'icon'

export interface Camp {
  /** Cheia normalizată din `.md`. Trebuie să se potrivească EXACT. */
  cheie: string
  /** Cum se scrie cheia când câmpul e adăugat pentru prima dată. */
  cheieScrisa: string
  eticheta: string
  tip: TipCamp
  /** O frază, din comentariile fișierului. Apare sub câmp. */
  ajutor?: string
  /** Text gri în câmpul gol, ca exemplu. */
  exemplu?: string
  /** Pentru `numar`: ce se scrie după cifră pe ecran (nu în fișier). */
  sufix?: string
}

export interface Bloc {
  /** Titlul `##` din fișier. Cu el se caută blocul. */
  titlu: string
  /** Cum se numește pe ecran, dacă altfel decât în fișier. */
  eticheta?: string
  ajutor?: string
  campuri: Camp[]
  /** Blocul are și text liber sub câmpuri? */
  descriere?: { eticheta: string; ajutor?: string }
}

export interface Fisier {
  /** Cheia din URL: `/admin/text/<id>`. */
  id: string
  /** Numele fișierului din `date/`. */
  fisier: string
  titlu: string
  /** O frază pe ecranul de acasă. */
  rezumat: string
  /** Unde se vede pe site — ca gazda să știe ce schimbă. */
  undeSeVede: string
  /** Numele unui icon din `components/Icon.tsx`. */
  icon: string
  forma:
    | {
        /** Blocuri cu titluri fixe: nu se adaugă și nu se șterg. */
        fel: 'fixe'
        blocuri: Bloc[]
      }
    | {
        /** Listă de elemente de același fel: se adaugă, se șterg, se mută. */
        fel: 'lista'
        /** Antet opțional, un bloc fix înaintea listei (`## Secțiune`). */
        antet?: Bloc
        /** Cum se numește un element: „cameră", „ofertă". */
        singular: string
        plural: string
        campuri: Camp[]
        descriere?: { eticheta: string; ajutor?: string }
        /** Titlul devine adresa paginii? Atunci se avertizează la redenumire. */
        titluEsteAdresa?: boolean
        /** Elementele trebuie să existe și în `en/`, în aceeași ordine? */
        cerePereche?: boolean
      }
}

/* ------------------------------------------------------------------ */
/* Câmpuri refolosite                                                 */
/*                                                                    */
/* „Eticheta / Titlu / Text introductiv" e antetul oricărei secțiuni  */
/* din motor. Apare în șapte blocuri din `date/`, deci se scrie o     */
/* singură dată aici.                                                 */
/* ------------------------------------------------------------------ */

const ETICHETA: Camp = {
  cheie: 'eticheta',
  cheieScrisa: 'Eticheta',
  eticheta: 'Supratitlu',
  tip: 'text',
  ajutor: 'Cuvântul mic de deasupra titlului. Lasă gol și nu apare nimic.',
  exemplu: 'Camerele',
}

const TITLU: Camp = {
  cheie: 'titlu',
  cheieScrisa: 'Titlu',
  eticheta: 'Titlu',
  tip: 'text',
  ajutor: 'Gol = secțiunea nu se afișează deloc.',
}

const TEXT_INTRO: Camp = {
  cheie: 'text introductiv',
  cheieScrisa: 'Text introductiv',
  eticheta: 'Text introductiv',
  tip: 'paragraf',
  ajutor: 'Una–două fraze sub titlu.',
}

const POZA: Camp = { cheie: 'poza', cheieScrisa: 'Poza', eticheta: 'Poza', tip: 'poza' }

/* ------------------------------------------------------------------ */
/* Fișierele                                                          */
/* ------------------------------------------------------------------ */

export const FISIERE_PANOU: Fisier[] = [
  /* -------------------------------------------------------------- */
  {
    id: 'prima-pagina',
    fisier: FISIERE.primaPagina,
    titlu: 'Prima pagină',
    rezumat: 'Titlul mare de sus, poza mare, povestea, cifrele, textul de final.',
    undeSeVede: 'Prima pagină, de sus până jos. Ordinea secțiunilor se schimbă la Setări.',
    icon: 'globe',
    forma: {
      fel: 'fixe',
      blocuri: [
        {
          titlu: 'Prima secțiune',
          eticheta: 'Sus, prima priveliște',
          ajutor: 'Ce vede cineva în prima secundă: poza mare, titlul și cele două butoane.',
          campuri: [
            {
              ...TITLU,
              tip: 'paragraf',
              ajutor: 'Titlul cel mai mare din site. Scurt și concret.',
            },
            {
              cheie: 'subtitlu',
              cheieScrisa: 'Subtitlu',
              eticheta: 'Subtitlu',
              tip: 'paragraf',
              ajutor: 'Fraza de sub titlu. Spune unde e locația și ce are ea de special.',
            },
            {
              ...POZA,
              eticheta: 'Poza mare',
              ajutor:
                'O poză orizontală, cât mai mare. Cea de acum e cu pescărușii: din pozele lor, niciun cadru orizontal destul de mare nu arată pensiunea.',
            },
            {
              cheie: 'video',
              cheieScrisa: 'Video',
              eticheta: 'Clip în loc de poză',
              tip: 'video',
              ajutor: 'Merge doar pe Șablonul 1. Aici e Șablonul 2, deci rămâne gol.',
            },
            {
              cheie: 'buton principal',
              cheieScrisa: 'Buton principal',
              eticheta: 'Butonul plin',
              tip: 'text',
              exemplu: 'Verifică disponibilitatea',
            },
            {
              cheie: 'buton secundar',
              cheieScrisa: 'Buton secundar',
              eticheta: 'Butonul cu contur',
              tip: 'text',
              exemplu: 'Vezi camerele',
            },
          ],
        },
        {
          titlu: 'Povestea noastră',
          eticheta: 'Povestea noastră',
          ajutor: 'Primul bloc de text de sub poza mare. Aici vorbește gazda despre locul ei.',
          campuri: [ETICHETA, TITLU],
          descriere: {
            eticheta: 'Textul poveștii',
            ajutor:
              'Paragrafele se despart printr-un rând gol. Fiecare devine un paragraf separat pe site; unite, s-ar citi ca un zid.',
          },
        },
        {
          titlu: 'Bandă de încredere',
          eticheta: 'Cifrele de sub poza mare',
          campuri: [
            {
              cheie: 'elemente',
              cheieScrisa: 'Elemente',
              eticheta: 'Elemente',
              tip: 'lista',
              ajutor:
                'Câte unul pe rând, cu linia LUNGĂ „—" între cifră și explicație. Un rând fără linia lungă nu se afișează.',
              exemplu: '4,9 din 5 — media a 179 de recenzii Google',
            },
          ],
        },
        {
          titlu: 'Secțiunea de camere',
          eticheta: 'Titlul secțiunii de camere',
          ajutor: 'Doar titlul și textul introductiv. Camerele se editează la Camerele.',
          campuri: [ETICHETA, TITLU, TEXT_INTRO],
        },
        {
          titlu: 'Secțiunea de servicii',
          eticheta: 'Titlul secțiunii de servicii',
          ajutor:
            'Doar antetul. Cele trei blocuri poză + text de sub el (transport, cazare, masă) se editează din GitHub — vezi ADMIN.md.',
          campuri: [
            ETICHETA,
            TITLU,
            TEXT_INTRO,
            {
              cheie: 'buton',
              cheieScrisa: 'Buton',
              eticheta: 'Butonul',
              tip: 'text',
              ajutor: 'Doar text, sau „Text | adresă": „Vezi pachetele | /oferte".',
              exemplu: 'Vezi pachetele | /oferte',
            },
          ],
        },
        {
          titlu: 'Clip de prezentare',
          eticheta: 'Clipul de prezentare',
          ajutor:
            'Apare doar dacă e pornit la Setări ȘI dacă are și clip, și poză de copertă. Acum nu există niciun clip, deci e gol intenționat.',
          campuri: [
            ETICHETA,
            TITLU,
            { cheie: 'text', cheieScrisa: 'Text', eticheta: 'Text', tip: 'paragraf' },
            { cheie: 'video', cheieScrisa: 'Video', eticheta: 'Clipul', tip: 'video' },
            {
              cheie: 'poster',
              cheieScrisa: 'Poster',
              eticheta: 'Poza de copertă',
              tip: 'poza',
              ajutor: 'Ce se vede înainte de apăsarea pe play. Fără ea, clipul nu se afișează deloc.',
            },
          ],
        },
        {
          titlu: 'Secțiunea de închidere',
          eticheta: 'Ultimul îndemn, înainte de subsol',
          campuri: [
            ETICHETA,
            TITLU,
            { cheie: 'text', cheieScrisa: 'Text', eticheta: 'Text', tip: 'paragraf' },
            { cheie: 'buton', cheieScrisa: 'Buton', eticheta: 'Butonul', tip: 'text' },
          ],
        },
      ],
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'camere',
    fisier: FISIERE.camere,
    titlu: 'Camerele',
    rezumat: 'Nume, preț pe sezon, câte persoane, ce pat, poze, dotări, descriere.',
    undeSeVede: 'Secțiunea de camere, pagina /camere și câte o pagină pentru fiecare cameră.',
    icon: 'bed',
    forma: {
      fel: 'lista',
      singular: 'cameră',
      plural: 'camere',
      titluEsteAdresa: true,
      cerePereche: true,
      campuri: [
        {
          cheie: 'pret de la',
          cheieScrisa: 'Preț de la',
          eticheta: 'Preț de la',
          tip: 'numar',
          sufix: 'lei / noapte',
          ajutor:
            'Doar cifra — minimul de sezon. Nu se mai afișează cât timp grila de mai jos e completată, dar din ea se generează prețul din datele pentru Google și din bara de pe telefon.',
        },
        {
          cheie: 'preturi',
          cheieScrisa: 'Prețuri',
          eticheta: 'Prețul pe sezoane',
          tip: 'lista',
          ajutor:
            'Un rând pe sezon: tariful, apoi linia LUNGĂ „—", apoi perioada. Linia lungă e singurul separator; perioada poate conține linia scurtă „–".',
          exemplu: '320 lei / noapte — 01 iun – 31 oct',
        },
        {
          cheie: 'persoane',
          cheieScrisa: 'Persoane',
          eticheta: 'Câte persoane',
          tip: 'text',
          exemplu: '2 persoane',
        },
        {
          cheie: 'pat',
          cheieScrisa: 'Pat',
          eticheta: 'Patul',
          tip: 'text',
          exemplu: 'pat matrimonial',
        },
        {
          cheie: 'suprafata',
          cheieScrisa: 'Suprafață',
          eticheta: 'Suprafața',
          tip: 'text',
          ajutor: 'Gol la toate camerele: suprafețele nu sunt confirmate. Gol = nu se afișează.',
          exemplu: '22 m²',
        },
        {
          cheie: 'poze',
          cheieScrisa: 'Poze',
          eticheta: 'Pozele',
          tip: 'poze',
          ajutor: 'Prima e cea care apare pe card. Trage ca să schimbi ordinea.',
        },
        {
          cheie: 'facilitati',
          cheieScrisa: 'Facilități',
          eticheta: 'Dotări',
          tip: 'icon',
          ajutor: 'Apar ca iconuri pe cardul camerei și pe pagina ei.',
        },
        {
          cheie: 'eticheta',
          cheieScrisa: 'Etichetă',
          eticheta: 'Bulina de pe card',
          tip: 'text',
          ajutor: 'Un cuvânt sau două, colorate, pe colțul cardului. Gol = fără bulină.',
          exemplu: 'Cel mai spațios',
        },
        {
          cheie: 'video',
          cheieScrisa: 'Video',
          eticheta: 'Clipul camerei',
          tip: 'video',
          ajutor: 'Opțional. Acum nu există niciun clip filmat.',
        },
        {
          cheie: 'poster video',
          cheieScrisa: 'Poster video',
          eticheta: 'Coperta clipului',
          tip: 'poza',
          ajutor: 'Obligatorie dacă ai pus clip. Fără ea, clipul nu apare.',
        },
      ],
      descriere: {
        eticheta: 'Descrierea camerei',
        ajutor: 'Câteva fraze. Apare pe pagina camerei și în descrierea din Google.',
      },
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'oferte',
    fisier: FISIERE.oferte,
    titlu: 'Pachetele și excursiile',
    rezumat: 'Cele două pachete cu masă și transfer, și cele patru excursii cu barca.',
    undeSeVede: 'Pagina /oferte și câte o pagină pentru fiecare pachet și fiecare excursie.',
    icon: 'tag',
    forma: {
      fel: 'lista',
      titluEsteAdresa: true,
      cerePereche: true,
      antet: {
        titlu: 'Secțiune',
        eticheta: 'Titlul de deasupra pachetelor',
        ajutor:
          'Antetul listei de pachete. Titlul de deasupra excursiilor stă în „## Secțiune excursii", care apare mai jos ca element al listei — se editează din GitHub.',
        campuri: [ETICHETA, TITLU, TEXT_INTRO],
      },
      singular: 'ofertă',
      plural: 'oferte',
      campuri: [
        {
          cheie: 'tip',
          cheieScrisa: 'Tip',
          eticheta: 'Felul',
          tip: 'text',
          ajutor:
            'Scrie „pachet" sau „excursie". Pachetele se randează ca blocuri mari poză + text; excursiile, ca o grilă uniformă, fără subsol de preț.',
          exemplu: 'pachet',
        },
        {
          cheie: 'pret',
          cheieScrisa: 'Preț',
          eticheta: 'Prețul, cum se scrie',
          tip: 'text',
          ajutor:
            'Aici se scrie CU TOT cu „lei" — apare pe site cuvânt cu cuvânt: „de la 1.400 lei". La excursii rămâne gol. (Sfatul de sub câmp, „scrie doar cifra", e al camerelor, nu al ofertelor.)',
          exemplu: 'de la 1.400 lei',
        },
        {
          cheie: 'preturi',
          cheieScrisa: 'Prețuri',
          eticheta: 'Prețul pe perioade',
          tip: 'lista',
          ajutor:
            'Un rând pe perioadă: tariful, apoi linia LUNGĂ „—", apoi perioada. Completată, se afișează în locul prețului unic de mai sus.',
          exemplu: '1.500 lei / persoană — 01 iun – 30 sep',
        },
        {
          cheie: 'unitate',
          cheieScrisa: 'Unitate',
          eticheta: 'Prețul e pentru',
          tip: 'text',
          exemplu: '/ persoană',
        },
        {
          cheie: 'pret anterior',
          cheieScrisa: 'Preț anterior',
          eticheta: 'Preț tăiat',
          tip: 'text',
          ajutor: 'Prețul de dinainte de reducere. Apare tăiat, lângă cel nou. Gol = nu apare.',
        },
        POZA,
        {
          cheie: 'badge',
          cheieScrisa: 'Badge',
          eticheta: 'Bulina de pe card',
          tip: 'text',
          exemplu: 'Cel mai scurt',
        },
        {
          cheie: 'valabil',
          cheieScrisa: 'Valabil',
          eticheta: 'Valabilitate',
          tip: 'text',
          exemplu: '01 apr – 30 sep 2026',
        },
        {
          cheie: 'rezumat',
          cheieScrisa: 'Rezumat',
          eticheta: 'Fraza de pe card',
          tip: 'paragraf',
          ajutor:
            'O SINGURĂ frază — e tot ce încape pe card. Fără ea, pe card ajunge prima frază din descriere.',
        },
        {
          cheie: 'include',
          cheieScrisa: 'Include',
          eticheta: 'Ce include',
          tip: 'lista',
          ajutor: 'Câte un rând pentru fiecare lucru inclus. Rândurile pot conține virgule.',
        },
      ],
      descriere: {
        eticheta: 'Programul detaliat',
        ajutor: 'Zi cu zi, ce nu e inclus, reducerile pentru copii. Apare pe pagina ofertei.',
      },
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'recenzii',
    fisier: FISIERE.recenzii,
    titlu: 'Recenziile',
    rezumat: 'Ce spun oaspeții, cu autorul și sursa, plus nota medie.',
    undeSeVede: 'Secțiunea de recenzii de pe prima pagină. Nota medie ajunge și în stelele din Google.',
    icon: 'star',
    forma: {
      fel: 'lista',
      singular: 'recenzie',
      plural: 'recenzii',
      antet: {
        titlu: 'Nota medie',
        eticheta: 'Nota medie',
        ajutor:
          'Din ea se generează stelele care apar sub titlul site-ului în Google. Fără sursă nu se afișează deloc.',
        campuri: [
          { cheie: 'nota', cheieScrisa: 'Notă', eticheta: 'Nota', tip: 'numar', sufix: 'din 5' },
          { cheie: 'din', cheieScrisa: 'Din', eticheta: 'Din cât', tip: 'numar', exemplu: '5' },
          {
            cheie: 'numar recenzii',
            cheieScrisa: 'Număr recenzii',
            eticheta: 'Câte recenzii',
            tip: 'numar',
            exemplu: '179',
          },
          {
            cheie: 'sursa',
            cheieScrisa: 'Sursă',
            eticheta: 'De unde vine',
            tip: 'text',
            ajutor: 'OBLIGATORIU. O notă fără sursă e o afirmație pe care nimeni n-o poate verifica.',
            exemplu: 'Google',
          },
        ],
      },
      campuri: [
        {
          cheie: 'autor',
          cheieScrisa: 'Autor',
          eticheta: 'Cine a scris',
          tip: 'text',
          exemplu: 'Bogdan Borca',
        },
        {
          cheie: 'sursa',
          cheieScrisa: 'Sursă',
          eticheta: 'De unde vine',
          tip: 'text',
          ajutor:
            'OBLIGATORIU. O recenzie fără sursă nu se afișează pe site — e cerință legală, nu o alegere de design.',
          exemplu: 'Google',
        },
        {
          cheie: 'data',
          cheieScrisa: 'Data',
          eticheta: 'Data',
          tip: 'text',
          ajutor:
            'Gol la toate: Google arăta doar „acum un an", nu data exactă, iar o dată dedusă ar fi o invenție.',
          exemplu: 'august 2025',
        },
        { cheie: 'nota', cheieScrisa: 'Notă', eticheta: 'Nota', tip: 'numar', sufix: 'din 5' },
      ],
      descriere: {
        eticheta: 'Textul recenziei',
        ajutor: 'Cuvânt cu cuvânt ce a scris omul. Nu se înfrumusețează.',
      },
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'intrebari',
    fisier: FISIERE.faq,
    titlu: 'Întrebările frecvente',
    rezumat: 'Întrebările care se pun la telefon, cu răspunsurile.',
    undeSeVede:
      'Secțiunea e OPRITĂ pe prima pagină. Răspunsurile ajung totuși în datele pe care le citește Google și pot apărea direct în rezultate.',
    icon: 'shield',
    forma: {
      fel: 'lista',
      singular: 'întrebare',
      plural: 'întrebări',
      campuri: [],
      descriere: {
        eticheta: 'Răspunsul',
        ajutor: 'Numele elementului e întrebarea; aici scrii răspunsul. Fără răspuns, nu se afișează.',
      },
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'facilitati',
    fisier: FISIERE.facilitati,
    titlu: 'Facilitățile',
    rezumat: 'Transferul, parcarea, pontonul, bucătăria — fiecare cu iconul ei.',
    undeSeVede:
      'Secțiunea e OPRITĂ acum (repeta ce spun serviciile). Se readuce adăugând rândul „Facilități: da" la Setări.',
    icon: 'check',
    forma: {
      fel: 'lista',
      singular: 'facilitate',
      plural: 'facilități',
      campuri: [
        {
          cheie: 'icon',
          cheieScrisa: 'Icon',
          eticheta: 'Iconul',
          tip: 'icon',
          ajutor: 'Un singur icon, cel care descrie cel mai bine facilitatea. Niciunul ales = o bifă.',
        },
        {
          cheie: 'text',
          cheieScrisa: 'Text',
          eticheta: 'Textul',
          tip: 'paragraf',
          ajutor:
            'O propoziție-două. Pune doar ce există cu adevărat: o facilitate promisă și negăsită la fața locului e cel mai sigur drum către o recenzie de 3 stele.',
        },
      ],
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'zona',
    fisier: FISIERE.zona,
    titlu: 'Zona și atracțiile',
    rezumat: 'Letea, Mila 23, Sulina, Caraorman, pescuitul de la ponton.',
    undeSeVede: 'Pagina /zona, cu toate; pe prima pagină, numai cele cu „Apare pe prima pagină: da".',
    icon: 'pin',
    forma: {
      fel: 'lista',
      singular: 'atracție',
      plural: 'atracții',
      cerePereche: true,
      antet: {
        titlu: 'Secțiune',
        eticheta: 'Titlul secțiunii',
        ajutor:
          'Folosit în DOUĂ locuri: secțiunea de pe prima pagină și capul paginii /zona. Se scrie o singură dată, aici.',
        campuri: [ETICHETA, TITLU, TEXT_INTRO],
      },
      campuri: [
        {
          cheie: 'distanta',
          cheieScrisa: 'Distanța',
          eticheta: 'Cât se face până acolo',
          tip: 'text',
          ajutor: 'Nu trebuie să fie în kilometri — la Crișan se ajunge pe apă, deci se scrie ca durată.',
          exemplu: 'o jumătate de zi cu barca',
        },
        POZA,
        {
          cheie: 'prima pagina',
          cheieScrisa: 'Prima pagină',
          eticheta: 'Apare pe prima pagină',
          tip: 'da-nu',
          ajutor:
            'Pe „da" intră în secțiunea „Activități" de pe prima pagină. Acum sunt trei pe „da" — restul se vând deja ca excursii, iar aceleași poze de două ori pe un ecran nu ajută.',
        },
      ],
      descriere: {
        eticheta: 'Descrierea',
        ajutor:
          'Două-trei propoziții despre ce e și de ce merită. Fără ele, atracția NU se afișează deloc.',
      },
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'contact',
    fisier: FISIERE.contact,
    titlu: 'Telefon, e-mail, adresă',
    rezumat: 'Datele de contact, coordonatele pentru hartă, orele de check-in.',
    undeSeVede: 'Subsolul, pagina /contact, bara de jos de pe telefon, harta.',
    icon: 'phone',
    forma: {
      fel: 'fixe',
      blocuri: [
        {
          titlu: 'Telefon',
          campuri: [
            {
              cheie: 'telefon',
              cheieScrisa: 'Telefon',
              eticheta: 'Număr pentru apelare',
              tip: 'text',
              ajutor: 'Cu prefix de țară, fără spații: așa se formează la apăsare pe telefon.',
              exemplu: '+40724001728',
            },
            {
              cheie: 'telefon afisat',
              cheieScrisa: 'Telefon afișat',
              eticheta: 'Cum se scrie pe site',
              tip: 'text',
              exemplu: '0724 001 728',
            },
            {
              cheie: 'whatsapp',
              cheieScrisa: 'WhatsApp',
              eticheta: 'WhatsApp',
              tip: 'text',
              ajutor: 'Cu prefix de țară. Gol = butonul verde și bara de jos nu mai apar.',
              exemplu: '+40724001728',
            },
          ],
        },
        {
          titlu: 'Email',
          campuri: [{ cheie: 'email', cheieScrisa: 'Email', eticheta: 'E-mail', tip: 'text' }],
        },
        {
          titlu: 'Adresă',
          campuri: [
            { cheie: 'strada', cheieScrisa: 'Stradă', eticheta: 'Strada și numărul', tip: 'text' },
            {
              cheie: 'oras',
              cheieScrisa: 'Oraș',
              eticheta: 'Localitatea',
              tip: 'text',
              ajutor: 'Trebuie să fie identică cu cea din Google Business Profile.',
            },
            { cheie: 'judet', cheieScrisa: 'Județ', eticheta: 'Județul', tip: 'text' },
            { cheie: 'cod postal', cheieScrisa: 'Cod poștal', eticheta: 'Codul poștal', tip: 'text' },
            { cheie: 'tara', cheieScrisa: 'Țară', eticheta: 'Țara', tip: 'text', exemplu: 'RO' },
          ],
        },
        {
          titlu: 'Coordonate GPS',
          eticheta: 'Locul pe hartă',
          ajutor:
            'Se iau din Google Maps: click dreapta pe locație, apoi pe cifrele de sus. Se scriu cu PUNCT, nu cu virgulă. Fără ele, harta nu se afișează deloc — și trebuie să fie ale PENSIUNII, nu ale debarcaderului din Murighiol.',
          campuri: [
            {
              cheie: 'latitudine',
              cheieScrisa: 'Latitudine',
              eticheta: 'Latitudine',
              tip: 'text',
              exemplu: '45.17',
            },
            {
              cheie: 'longitudine',
              cheieScrisa: 'Longitudine',
              eticheta: 'Longitudine',
              tip: 'text',
              exemplu: '29.42',
            },
            {
              cheie: 'link google maps',
              cheieScrisa: 'Link Google Maps',
              eticheta: 'Link către Google Maps',
              tip: 'text',
            },
          ],
        },
        {
          titlu: 'Program',
          eticheta: 'Orele casei',
          ajutor:
            'Necompletate. Orele din pachete țin de pachet, nu de recepție, și sunt scrise acolo unde sunt adevărate — la Pachetele și excursiile.',
          campuri: [
            {
              cheie: 'check-in',
              cheieScrisa: 'Check-in',
              eticheta: 'Check-in de la',
              tip: 'text',
              exemplu: '14.00',
            },
            {
              cheie: 'check-out',
              cheieScrisa: 'Check-out',
              eticheta: 'Check-out până la',
              tip: 'text',
              exemplu: '12.00',
            },
            {
              cheie: 'receptie',
              cheieScrisa: 'Recepție',
              eticheta: 'Programul recepției',
              tip: 'text',
            },
          ],
        },
      ],
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'pagina-contact',
    fisier: FISIERE.paginaContact,
    titlu: 'Pagina de contact',
    rezumat: 'Textele de deasupra formularului și indicațiile de acces.',
    undeSeVede: 'Pagina /contact. Telefonul, adresa și harta vin din „Telefon, e-mail, adresă".',
    icon: 'mail',
    forma: {
      fel: 'fixe',
      blocuri: [
        {
          titlu: 'Secțiune',
          eticheta: 'Titlul paginii',
          campuri: [ETICHETA, TITLU, TEXT_INTRO],
        },
        {
          titlu: 'Cum ajungi',
          eticheta: 'Cum se ajunge la pensiune',
          campuri: [
            { ...TITLU, ajutor: undefined },
            {
              cheie: 'buline',
              cheieScrisa: 'Buline',
              eticheta: 'Buline',
              tip: 'lista',
              ajutor: 'Câte una pe rând. Pot conține virgule — nu se taie la virgulă.',
            },
          ],
          descriere: {
            eticheta: 'Textul de sub buline',
            ajutor: 'Explicația lungă a drumului. Gol = blocul nu se afișează.',
          },
        },
      ],
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'rezervari',
    fisier: FISIERE.rezervari,
    titlu: 'Textele de rezervare',
    rezumat: 'Ce scrie pe butonul de rezervare și pe bara de căutare.',
    undeSeVede: 'Butonul „Verifică disponibilitatea", bara de sub poza mare, dialogul de rezervare.',
    icon: 'calendar',
    forma: {
      fel: 'fixe',
      blocuri: [
        {
          titlu: 'Etichete',
          eticheta: 'Textele butoanelor și ale barei',
          ajutor:
            'Unde duce butonul (linkul de Booking) e configurare tehnică și se schimbă din GitHub, nu de aici: un link greșit e o rezervare pierdută.',
          campuri: [
            {
              cheie: 'text buton',
              cheieScrisa: 'Text buton',
              eticheta: 'Butonul principal',
              tip: 'text',
              exemplu: 'Verifică disponibilitatea',
            },
            { cheie: 'sosire', cheieScrisa: 'Sosire', eticheta: 'Eticheta „Sosire"', tip: 'text' },
            { cheie: 'plecare', cheieScrisa: 'Plecare', eticheta: 'Eticheta „Plecare"', tip: 'text' },
            {
              cheie: 'persoane',
              cheieScrisa: 'Persoane',
              eticheta: 'Eticheta „Oaspeți"',
              tip: 'text',
            },
            {
              cheie: 'optiuni persoane',
              cheieScrisa: 'Opțiuni persoane',
              eticheta: 'Opțiunile din listă',
              tip: 'etichete',
              ajutor: 'Ce se poate alege la numărul de oaspeți.',
            },
            {
              cheie: 'asigurari',
              cheieScrisa: 'Asigurări',
              eticheta: 'Sub buton, mărunt',
              tip: 'etichete',
              ajutor:
                'Trei lucruri scurte și liniștitoare. Scrie numai ce e adevărat: „Răspundem în aceeași zi" e o promisiune de serviciu, nu un fapt despre locație.',
            },
          ],
        },
      ],
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'identitate',
    fisier: FISIERE.identitate,
    titlu: 'Nume, logo, descriere',
    rezumat: 'Numele pensiunii, sloganul, margaretele, logo-ul, descrierea din Google.',
    undeSeVede: 'Antetul, subsolul, titlul din fila browserului, rezultatele Google.',
    icon: 'search',
    forma: {
      fel: 'fixe',
      blocuri: [
        {
          titlu: 'Nume',
          campuri: [
            { cheie: 'nume', cheieScrisa: 'Nume', eticheta: 'Numele complet', tip: 'text' },
            {
              cheie: 'nume scurt',
              cheieScrisa: 'Nume scurt',
              eticheta: 'Numele scurt',
              tip: 'text',
              ajutor: 'Pentru locurile strâmte, cum e titlul filei din browser.',
            },
          ],
        },
        {
          titlu: 'Slogan',
          campuri: [{ cheie: 'slogan', cheieScrisa: 'Slogan', eticheta: 'Sloganul', tip: 'text' }],
        },
        {
          titlu: 'Clasificare',
          campuri: [
            {
              cheie: 'stele',
              cheieScrisa: 'Stele',
              eticheta: 'Margarete',
              tip: 'numar',
              ajutor:
                'La pensiuni turistice clasificarea e în margarete, nu în stele. Gol = nu se afișează nicio clasificare.',
            },
            {
              cheie: 'tip',
              cheieScrisa: 'Tip',
              eticheta: 'Tipul locației',
              tip: 'text',
              exemplu: 'pensiune',
            },
          ],
        },
        {
          titlu: 'Logo',
          campuri: [
            {
              cheie: 'logo',
              cheieScrisa: 'Logo',
              eticheta: 'Logo-ul',
              tip: 'poza',
              ajutor:
                'De preferat cu fundal transparent (.png sau .svg). Cel de acum e raster, 512×512 — bun pentru antet și favicon, pixelat la print.',
            },
          ],
        },
        {
          titlu: 'Descriere scurtă',
          eticheta: 'Descrierea din Google',
          ajutor:
            'Fraza care apare sub titlu în rezultatele căutării și când cineva dă linkul pe WhatsApp. Între 120 și 160 de caractere e ideal. NU se vede pe pagină.',
          campuri: [
            {
              cheie: 'descriere',
              cheieScrisa: 'Descriere',
              eticheta: 'Descrierea',
              tip: 'paragraf',
            },
          ],
        },
      ],
    },
  },

  /* -------------------------------------------------------------- */
  {
    id: 'legal',
    fisier: FISIERE.legal,
    titlu: 'Firma și documentele legale',
    rezumat: 'Denumirea firmei, CUI-ul, sediul, politica de anulare.',
    undeSeVede: 'Subsolul fiecărei pagini și paginile /termeni, /politica-anulare și celelalte.',
    icon: 'safe',
    forma: {
      fel: 'fixe',
      blocuri: [
        {
          titlu: 'Firmă',
          eticheta: 'Datele firmei',
          ajutor:
            'OBLIGATORII prin lege în subsol, la un site care primește cereri online. Lipsa lor e motiv de amendă, nu o formalitate de design. Denumirea COMPLETĂ, cu forma juridică; CUI cu prefixul „RO" dacă firma e plătitoare de TVA.',
          campuri: [
            {
              cheie: 'denumire',
              cheieScrisa: 'Denumire',
              eticheta: 'Denumirea firmei',
              tip: 'text',
              exemplu: 'Vila Bradul SRL',
            },
            { cheie: 'cui', cheieScrisa: 'CUI', eticheta: 'CUI', tip: 'text', exemplu: 'RO12345678' },
            {
              cheie: 'adresa sediu social',
              cheieScrisa: 'Adresă sediu social',
              eticheta: 'Adresa sediului social',
              tip: 'text',
              ajutor: 'Poate fi diferită de adresa pensiunii. Aici merge cea din documentele firmei.',
            },
            {
              cheie: 'cont bancar',
              cheieScrisa: 'Cont bancar',
              eticheta: 'Cont bancar (IBAN)',
              tip: 'text',
              ajutor: 'Opțional. Util dacă se acceptă plata prin transfer bancar.',
            },
            { cheie: 'banca', cheieScrisa: 'Bancă', eticheta: 'Banca', tip: 'text' },
          ],
        },
        {
          titlu: 'Autorizații',
          eticheta: 'Autorizații',
          ajutor:
            'Opțional, dar crește încrederea — puține site-uri le afișează. Numai numere de documente REALE.',
          campuri: [
            {
              cheie: 'certificat de clasificare',
              cheieScrisa: 'Certificat de clasificare',
              eticheta: 'Certificatul de clasificare',
              tip: 'text',
              ajutor: 'Numărul certificatului pentru cele 4 margarete.',
            },
            {
              cheie: 'autorizatie sanitara',
              cheieScrisa: 'Autorizație sanitară',
              eticheta: 'Autorizația sanitară',
              tip: 'text',
            },
          ],
        },
        {
          titlu: 'Politica de anulare — textul',
          eticheta: 'Politica de anulare',
          ajutor:
            'Apare pe pagina de politică și înainte de pasul de plată. Fii CONCRET: câte zile înainte se poate anula, ce se reține, ce se întâmplă la neprezentare. Vagul crește ezitarea; precizia o reduce.',
          campuri: [
            {
              cheie: 'anulare',
              cheieScrisa: 'Anulare',
              eticheta: 'Textul politicii',
              tip: 'lista',
              ajutor:
                'Câte o regulă pe rând. Rândurile pot conține virgule — nu se taie la virgulă.',
              exemplu: 'Anulare gratuită până la 7 zile înainte de data sosirii.',
            },
          ],
        },
        {
          titlu: 'Responsabil protecția datelor',
          eticheta: 'Cereri GDPR',
          ajutor:
            'Adresa la care se pot trimite cereri de acces, rectificare sau ștergere a datelor. Poate fi aceeași cu e-mailul de contact. Obligatorie în politica de confidențialitate.',
          campuri: [
            {
              cheie: 'email pentru cereri gdpr',
              cheieScrisa: 'Email pentru cereri GDPR',
              eticheta: 'E-mail pentru cereri GDPR',
              tip: 'text',
            },
          ],
        },
        {
          titlu: 'Link-uri obligatorii în footer',
          eticheta: 'ANPC și SOL',
          ajutor: 'Obligatorii prin lege și pre-completate. Nu le șterge.',
          campuri: [
            {
              cheie: 'anpc',
              cheieScrisa: 'ANPC',
              eticheta: 'ANPC',
              tip: 'text',
              ajutor: 'Autoritatea Națională pentru Protecția Consumatorilor.',
            },
            {
              cheie: 'sol',
              cheieScrisa: 'SOL',
              eticheta: 'SOL',
              tip: 'text',
              ajutor: 'Soluționarea Online a Litigiilor — platforma europeană ODR.',
            },
          ],
        },
        {
          titlu: 'Documente legale',
          eticheta: 'Adresele paginilor legale',
          ajutor:
            'Paginile se generează automat, pe legislația din România. Adresele de mai jos sunt pre-completate — schimbate, linkurile din subsol duc în gol.',
          campuri: [
            {
              cheie: 'politica de confidentialitate',
              cheieScrisa: 'Politica de confidențialitate',
              eticheta: 'Politica de confidențialitate',
              tip: 'text',
            },
            {
              cheie: 'politica de cookies',
              cheieScrisa: 'Politica de cookies',
              eticheta: 'Politica de cookies',
              tip: 'text',
            },
            {
              cheie: 'termeni si conditii',
              cheieScrisa: 'Termeni și condiții',
              eticheta: 'Termeni și condiții',
              tip: 'text',
            },
            {
              cheie: 'politica de anulare',
              cheieScrisa: 'Politica de anulare',
              eticheta: 'Politica de anulare',
              tip: 'text',
            },
          ],
        },
      ],
    },
  },
]

/* ------------------------------------------------------------------ */

export function fisierPanou(id: string): Fisier | undefined {
  return FISIERE_PANOU.find((f) => f.id === id)
}

/** Toate câmpurile unui fișier — pentru validare la salvare. */
export function campuriDin(f: Fisier): Camp[] {
  if (f.forma.fel === 'fixe') return f.forma.blocuri.flatMap((b) => b.campuri)
  return [...(f.forma.antet?.campuri ?? []), ...f.forma.campuri]
}
