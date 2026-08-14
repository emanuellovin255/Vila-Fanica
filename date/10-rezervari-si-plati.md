# Rezervări și plăți

<!-- ────────────────────────────────────────────────────────────────────────

     CE E AICI:  unde duce butonul de rezervare și ce scrie pe el.

     UNDE SE VEDE
       · bara „Sosire / Plecare / Oaspeți" de sub prima secțiune
       · butonul „Verifică disponibilitatea" din antet, din cardurile de
         cameră și din secțiunea de închidere
       · fereastra care se deschide la click

     ## Rezervări — configurarea
       Tip: formular       nu există motor extern. Cererea pleacă pe
                           WhatsApp, cu mesajul deja scris. Așa e acum
       Tip: link           butonul ar duce la un site extern
       Sistem:             care site (booking.com, previo, cloudbeds…)
       Adresă:             linkul complet către pagina locației

     ## Etichete — textele de pe butoane
       Se traduc. Varianta englezească e în en/10-rezervari-si-plati.md

     ## Plăți online — comutatorul
       Activ: nu — plata cu cardul direct pe site e oprită.
     ──────────────────────────────────────────────────────────────────────── -->

## Rezervări

Tip: formular
Sistem:
Adresă:

<!--
  ══ DE CE „FORMULAR" ȘI CE ÎNSEAMNĂ EL AICI ══

  Vila Fănică n-are motor de rezervări. Nu e pe Booking.com — am căutat, nu există pagină de
  proprietate. Ce există sunt fișe pe agregatoare (cazare7, m.cazarebailefelix, portalturism),
  iar acolo „rezervarea" e tot un formular care ajunge la ei pe email.

  Deci nu există niciun calendar viu către care să trimitem omul. Singurul loc unde chiar se
  află dacă e liber e conversația cu gazda.

  ⚠ „Tip: formular" NU ÎNSEAMNĂ CĂ SE FOLOSEȘTE FORMULARUL DE CONTACT. Motorul are o
  scurtătură scrisă exact pentru cazul ăsta: când locația n-are engine dar are un număr de
  WhatsApp, toate butoanele de rezervare duc în conversație, cu mesajul deja compus —
  `linkRezervare()` din `lib/whatsapp.ts`, plus ramura de WhatsApp din `BaraDisponibilitate`.

  ══ CE SE ÎNTÂMPLĂ, PAS CU PAS, CÂND CINEVA APASĂ ══

  1. Se deschide un dialog cu: NUMELE, CAMERA, calendarul de perioadă și numărul de oaspeți.
  2. Se apasă butonul verde.
  3. Se deschide WhatsApp, pe numărul din `02-telefon-email-si-adresa.md`, cu mesajul:

       Bună ziua! Aș vrea să verific disponibilitatea.
       Nume: Andrei Popescu
       Camera / pachetul: Cameră dublă matrimonială
       Sosire: 21 august 2026
       Plecare: 24 august 2026 (3 nopți)
       Oaspeți: 2

  4. Mesajul rămâne EDITABIL. Nu se trimite singur — omul apasă trimite.

  Câmpul de nume e o modificare făcută pentru site-ul ăsta, cerută de client. E documentată în
  `MOTOR-MODIFICAT.md` și se pierde la un `npm run actualizeaza-motor` neatent.

  DE CE MERITĂ CELE TREI CÂMPURI: gazda primește o cerere completă, nu un „bună ziua" gol. Poate
  răspunde direct cu prețul, dintr-un singur mesaj, în loc să poarte patru mesaje de lămurire.
  Asta e toată diferența dintre o conversație care se termină în rezervare și una care moare
  după al doilea mesaj.

  Fără JavaScript, butonul rămâne un `<a>` real către WhatsApp, cu salutul scurt. Mai sărac —
  fără perioadă — dar întreg.

  ══ DACĂ APARE VREODATĂ O PAGINĂ DE BOOKING ══

  Se schimbă trei rânduri de mai sus:

    Tip: link
    Sistem: booking.com
    Adresă: https://www.booking.com/hotel/ro/…    ← CURATĂ, nimic după semnul „?"

  Motorul adaugă singur perioada și numărul de oaspeți, iar WhatsApp rămâne alături în dialog,
  ca a doua cale. Nu e nimic de programat.
-->

## Etichete

Text buton: Verifică disponibilitatea
Sosire: Sosire
Plecare: Plecare
Persoane: Oaspeți
Opțiuni persoane: 1 oaspete, 2 oaspeți, 3 oaspeți, 4 oaspeți, 5+ oaspeți
Asigurări: Peste drum de ștrandul Apollo, Parcare păzită, 30 de locuri, Balcon la fiecare cameră

<!--
  „Asigurări:" sunt cele trei promisiuni scurte de sub bara de disponibilitate. Toate trei sunt
  FAPTE publicate de ei, nu promisiuni de serviciu:

    · „Peste drum de ștrandul Apollo"  — se vede în `poze/strandul-apollo-vazut-de-la-vila.webp`
    · „Parcare păzită, 30 de locuri"   — scris în descrierea lor, pe toate sursele
    · „Balcon la fiecare cameră"       — „toate sunt dotate cu balcon", descrierea lor

  N-am pus nimic de tipul „confirmare imediată", „răspundem în aceeași zi" sau „cel mai bun
  preț garantat". Alea ar trebui confirmate cu gazda înainte de a fi scrise public, iar o
  promisiune de viteză nerespectată e prima linie dintr-o recenzie proastă.

  ⚠ DOUĂ CARE AR MERITA LOCUL ĂSTA, DUPĂ CONFIRMARE:

    · „Mic dejun inclus" — dacă se servește. Ar fi evident prima dintre toate. Vezi `05-…`.
    · „Acceptăm tichete de vacanță" — dacă e adevărat. Aproape nicio unitate din Băile Felix
      nu-l scrie, deși jumătate dintre angajații din România au tichete pe card și caută activ
      unde le pot folosi. E un filtru de căutare, nu o dotare.

  Când vine una din ele, se pune prima în listă și una din cele trei de acum coboară. Trei e
  numărul potrivit — la patru, rândul se rupe pe telefon.
-->

## Plăți online

Activ: nu

<!--
  Plata cu cardul direct pe site e OPRITĂ și nu se pornește fără configurare separată: cere
  bază de date, contract cu un procesator și termeni scriși.

  Nici n-are rost aici. Nu există motor de rezervări, deci nu există nici un moment în care
  cineva să plătească online — plata se face la fața locului sau prin transfer, după înțelegerea
  de pe WhatsApp.

  ⚠ DE ÎNTREBAT, ca să se poată scrie pe pagina de contact: se plătește cash, cu cardul la fața
  locului, prin transfer bancar? Se acceptă tichete de vacanță? Se cere avans?
  Sunt printre primele întrebări pe care le pune cineva care scrie pe WhatsApp — fiecare
  răspuns scris pe site e un mesaj în minus de scris de mână.
-->
