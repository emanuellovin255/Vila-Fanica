# Setări — ce secțiuni apar pe site și în ce ordine

<!-- ────────────────────────────────────────────────────────────────────────

     CE E AICI:  comutatoarele site-ului. Aici nu se scrie text de pe
                 site — aici se hotărăște CE secțiuni se afișează, în
                 CE ORDINE, și ce pagini întregi există.

     TEXTELE sunt în folderul date/. Vezi date/README.md.

     CUM SE CITEȘTE UN RÂND
       Ceva: da     secțiunea sau pagina se afișează
       Ceva: nu     nu se afișează nicăieri — nici secțiunea, nici
                    linkul din meniul de sus

     TREI GRUPURI, mai jos:

       ## Șablon      felul în care e aranjată prima pagină

       ## Module      pagini și funcții întregi: galeria, pagina
                      „Zona", engleza, meniul restaurantului, plățile

       ## Secțiuni pe prima pagină   ORDINEA RÂNDURILOR DE ACOLO E
                      ORDINEA DE PE SITE. Muți un rând mai sus,
                      secțiunea urcă pe pagină. Ștergi rândul,
                      secțiunea dispare, iar textele ei rămân
                      neatinse în date/
     ──────────────────────────────────────────────────────────────────────── -->

---

## Șablon

Șablon: 6

<!--
  1 = Hero Video              resorturi mari, hoteluri 4-5*, spa. Doar cu filmări bune
  2 = Poveste alternantă      pensiuni, boutique, locații cu o poveste
  3 = Galerie editorială      cabane, chalet-uri, locații spectaculoase
  4 = Carusel editorial       locații cu mai multe lucruri de vândut deodată
  5 = Termal                  un singur cadru de dronă, ținut în mișcare lentă
  6 = Irlandez                afiș de pub: titluri uriașe, hârtie, grilă de cercuri

  DE CE 6. Cerința clientului a fost „în stilul site-ului Casei Irlandeze", iar șablonul 6 e
  chiar aranjamentul acela: titluri de afiș în majuscule, fundal de hârtie cu textură, margini
  rupte între secțiuni, grila de cercuri pentru facilități, banda cu numele camerelor.

  ⚠ NUMELE „IRLANDEZ" E DOAR NUMELE FOLDERULUI, nu o temă. Șablonul nu conține nimic irlandez:
  nu are trifoi, nu are verde, nu are simboluri. Ce are e o structură și o tipografie. Culorile
  vin în întregime din `date/11-culori-si-fonturi.md`, iar acolo sunt albastrul apei termale și
  cărămiziul fațadei — deci pagina arată a Vila Fănică, nu a pub.

  UN LUCRU DE ȘTIUT: șablonul 6 are o BANDĂ CU NUMELE CAMERELOR, în mișcare lentă, sub prima
  secțiune. Cu o singură cameră scrisă în `date/04-camere.md`, banda repetă un singur nume.
  Nu e stricată — dar e încă un motiv să se completeze apartamentul. Vezi nota din `04-…`.

  UNDE STĂ: `sabloane/06-irlandez/`. Efectele sunt scrise în `skin.css`, tot ce mișcă se
  oprește sub `prefers-reduced-motion`, iar singurul JavaScript e numărătoarea din banda de
  încredere — cifrele sunt în HTML de la server, deci fără JS pagina rămâne întreagă.

  ⚠ Șablonul 6 e o MODIFICARE DE MOTOR, documentată în MOTOR-MODIFICAT.md. Un
  `npm run actualizeaza-motor` neatent îl șterge, iar site-ul cade tăcut pe șablonul 2.
-->

---

## Module

Meniu restaurant: nu
Spații de evenimente: nu
Galerie extinsă: da
Pagina „Zona" (atracții și distanțe): da
Engleză: nu
Plăți online: nu

<!--
  Un modul pe „nu" nu se afișează deloc — nici secțiunea, nici linkul din meniu, nici ruta.
  Nu e ascuns cu CSS: pur și simplu nu se generează.

  Meniu restaurant  → NU. Vila n-are restaurant. Fișele de pe portaluri măsoară chiar distanța
                      până la unul („restaurant la 300 m"), ceea ce ar fi absurd dacă ar fi avut
                      unul în casă. Are un salon de mic dejun, care e un spațiu, nu un local.
                      Vezi date/07-meniu-restaurant.md.

  Galerie extinsă   → PORNIT. Pagina /galerie, construită din toate cele unsprezece fotografii
                      din poze/. Cu atât de puține poze, o pagină de galerie e discutabilă — dar
                      mozaicul de pe prima pagină trimite către ea, iar patru dintre fotografii
                      (ștrandul) n-au loc altundeva.
                      ⚠ SE REEVALUEAZĂ când vin poze noi: cu douăzeci de fotografii, pagina
                      devine bună; cu unsprezece, e doar corectă.

  Pagina „Zona"     → PORNIT, și e cea mai valoroasă pagină de SEO de pe site. Prinde căutările
                      „ce vizitezi în Băile Felix", „ștrandul Apollo", „aquapark Oradea" — care
                      vin ÎNAINTEA căutării „unde dorm" și pe care o vilă le poate câștiga, spre
                      deosebire de „hotel Băile Felix".
                      Aici are și cu ce: patru din cele unsprezece fotografii sunt de la ștrand.
                      Conținutul e în date/13-zona-si-atractii.md.

  ⚠ Engleză         → OPRIT, ȘI E O DECIZIE, NU O SCĂPARE.
                      Fișierele din `en/` sunt scrise și gata. Se pornește schimbând un singur
                      cuvânt aici, în „da".

                      De ce e oprit acum: nu știm dacă cineva de la vilă vorbește engleză.
                      Site-ul lor de pe cazare7 are butoane RO/HU/EN, dar alea duc la Google
                      Translate — nu sunt o declarație că se răspunde în engleză.
                      Iar tot site-ul ăsta duce într-o conversație pe WhatsApp: o pagină /en
                      aduce mesaje în engleză, la un număr unde poate nu are cine să răspundă.
                      Un mesaj fără răspuns e mai rău decât o pagină care nu există.

                      ⚠ DE ÎNTREBAT, ȘI CHIAR MERITĂ: se vorbește engleză? Dar maghiară?
                      Băile Felix primesc constant turiști din Ungaria — vama Borș e la 25 km,
                      Budapesta la 300. Dacă răspunsul e da, se pune „da" aici și /en apare cu
                      tot cu meniu, sitemap și mesaj de WhatsApp tradus.

  Spații evenimente → NU. Nu există nicio informație despre capacități, tarife sau organizare.
                      ⚠ MERITĂ ÎNTREBAT totuși: o vilă de 34 de camere cu foișor și grătar în
                      curte primește, de obicei, grupuri. Dacă da, e o pagină întreagă
                      nefolosită.

  Plăți online      → NU se pornește fără configurare separată. Cere bază de date și contract
                      cu un procesator. Nici n-are rost: nu există motor de rezervări, deci nu
                      există moment în care cineva să plătească pe site. Vezi
                      date/10-rezervari-si-plati.md.
-->

---

## Secțiuni pe prima pagină

Ordinea de aici e ordinea din site. Șterge un rând ca să scoți secțiunea.

Bloc de rezervare: da
Camere: da
Facilități: da
Povestea noastră: da
Bandă de încredere: da
Feature-uri alternante: da
Mozaic foto: da
Bandă de semnătură: da
Locație: da
Recenzii: da
Întrebări frecvente: da
Hartă: da
Secțiune de închidere: da

<!--
  Bloc de rezervare  → NU e o secțiune ca celelalte: e bara de disponibilitate de imediat sub
  prima secțiune, iar poziția ei e fixă, deci rândul nu se poate muta.
  Aici chiar duce undeva: sosire, plecare, oaspeți, iar butonul deschide dialogul cu numele și
  camera, de unde cererea pleacă întreagă pe WhatsApp.
  Vezi date/10-rezervari-si-plati.md.

  ══ ORDINEA DE MAI SUS E ALTA DECÂT LA CASA IRLANDEZĂ, ȘI DE ASTA ══

  Acolo, povestea era prima: din 235 de recenzii, aproape toate vorbeau despre gazde, deci
  argumentul locului era omul. Aici nu e cazul — avem zece recenzii, ultima din 2022, și niciun
  text scris de gazde. O „poveste" pusă sus, scrisă de altcineva, ar fi fost umplutură pe locul
  cel mai valoros al paginii.

  Argumentul Vilei Fănică e altul și e verificabil: e peste drum de ștrand, are parcare păzită
  și balcon la fiecare cameră. Deci:

  1. CAMERE — primele, imediat sub bară. Omul care a ajuns aici caută unde doarme. Cardurile
     n-au preț (s-a cerut așa), dar au butonul în locul lui — deci prima secțiune de conținut
     e și primul loc de unde se poate rezerva.

  2. FACILITĂȚI — grila de cercuri, secțiunea-semnătură a șablonului. Zece cercuri, toate din
     dotări declarate de ei. Aici e locul unde se vede că vila are ce oferi, iar primul cerc e
     chiar ștrandul de peste drum.

  3. POVESTEA — a treia, nu prima. E acolo ca să lege faptele într-un text, nu ca să convingă
     singură. ⚠ URCĂ PE LOCUL ÎNTÂI în ziua în care gazdele scriu ele textul — atunci merită
     locul de sus, cum îl merita la Casa Irlandeză.

  4. BANDA DE ÎNCREDERE — cifrele imediat după poveste. Povestea spune, cifrele confirmă.

  5. FEATURE-URI ALTERNANTE — cele trei blocuri poză + text: ștrandul, parcarea, balconul.
     Sunt argumentele desfășurate, după ce cifrele le-au anunțat.

  6. MOZAIC FOTO — pus în drum exact când omul a citit destul și vrea să vadă. Trimite spre
     /galerie.

  7. LOCAȚIE — ștrandul Apollo, cu trei blocuri. E aproape o repetare a feature-urilor, și e
     intenționat: e singurul lucru pe care îl repetăm, fiindcă e singurul care decide.

  8. RECENZII — pornită, deși e slabă (nota 10 din 10, dar din zece păreri). Vezi
     date/08-recenzii.md. ⚠ DACĂ NU SE STRÂNG RECENZII DE GOOGLE ÎN CÂTEVA LUNI, merită
     scoasă: o secțiune de păreri cu un singur citat din 2022 atrage atenția asupra lipsei, nu
     asupra calității.

  9. ÎNTREBĂRI FRECVENTE — opt întrebări, toate din informații publicate de ei. Google le poate
     arăta direct în rezultate, dar numai fiindcă secțiunea chiar se vede în pagină.

  10. HARTĂ — la final, înainte de închidere. Adresa e ultima informație de care are nevoie
      cineva care a citit deja tot.

  Secțiuni care EXISTĂ, dar sunt oprite: serviciile, ofertele, excursiile, clipul de
  prezentare, meniul restaurantului, spațiile de evenimente. Textele lor sunt neatinse în
  date/ — se readuc scriind rândul la loc, în ordinea dorită.

  ⚠ „Serviciile noastre" e SCOASĂ intenționat: textul ei ar fi repetat, cuvânt cu cuvânt,
  cercurile de la Facilități — parcarea, foișorul, salonul, ștrandul. La Casa Irlandeză cele
  două secțiuni spuneau lucruri diferite; aici ar fi spus același lucru de două ori. Textul
  rămâne scris în date/03-pagina-principala.md, gata de repornit dacă se schimbă ceva.
-->

---

## Altele

Buton WhatsApp: da
Analytics: nu

<!--
  BUTON WHATSAPP → PORNIT, și e inima site-ului, nu un accesoriu.

  Spre deosebire de Casa Irlandeză, unde butonul era pregătit dar invizibil fiindcă lipsea
  numărul, aici numărul există: 0740 454 064, luat de pe site-ul lor. Deci WhatsApp apare din
  prima zi în patru locuri deodată — butonul verde plutitor, bara lipită de jos de pe telefon,
  dialogul de rezervare și pagina de contact.

  Mesajul e precompletat cu NUMELE, camera, perioada și numărul de oaspeți (`lib/whatsapp.ts`).
  Câmpul de nume e o modificare făcută pentru site-ul ăsta — vezi MOTOR-MODIFICAT.md.

  ⚠ DE CONFIRMAT ÎNAINTE DE PUBLICARE: numărul chiar citește WhatsApp? Dacă nu, se golește
  rândul „WhatsApp:" din date/02-… și se pune „nu" aici. Motorul cade atunci singur pe telefon
  apelabil. Vezi nota lungă din date/02-telefon-email-si-adresa.md.

  ANALYTICS → oprit. Se pornește după ce se decide ce instrument se folosește; se încarcă
  oricum doar după acceptul de cookies.
-->
