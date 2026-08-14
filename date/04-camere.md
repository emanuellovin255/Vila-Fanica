# Camerele

<!-- ────────────────────────────────────────────────────────────────────────

     CE E AICI:  tipurile de cameră — nume, preț, poze, dotări.

     UNDE SE VEDE
       · pe prima pagină, ca niște carduri
       · pe pagina /camere
       · fiecare cameră are și pagina ei: /camere/camera-dubla-matrimoniala

     CÂMPURILE
       Preț de la:   doar cifra, fără „lei" și fără „de la"
       Persoane:     „2 adulți", „3 adulți", „4 persoane"
       Pat:          cum sunt aranjate paturile
       Suprafață:    doar cifra, în metri pătrați
       Poze:         numele fișierelor din poze/, despărțite prin virgulă.
                     PRIMA e cea de pe card
       Facilități:   numele iconițelor, despărțite prin virgulă
       Etichetă:     insigna colorată de pe colțul cardului. Gol = fără

     Textul liber de sub câmpuri e descrierea camerei.

     Fișierul ăsta SE TRADUCE. Varianta englezească e în en/04-camere.md.
     ──────────────────────────────────────────────────────────────────────── -->

<!--
  ══ PREȚURILE SUNT GOALE, INTENȚIONAT. CITEȘTE ASTA ÎNAINTE SĂ LE COMPLETEZI ══

  Cerința clientului a fost limpede: fără prețuri la camere.

  CE FACE MOTORUL CÂND „Preț de la:" E GOL — nu lasă un gol și nu scrie „—". Pune în locul
  cifrei butonul „Verifică disponibilitatea" (`components/sectiuni/CardCamera.tsx`, blocul
  `price-ask`, și la fel pe pagina fiecărei camere). Deci cardul rămâne întreg, iar locul
  unde ochiul caută prețul devine locul unde se apasă.

  DE CE E POTRIVIT AICI, nu doar acceptabil: fișa lor scrie explicit „în funcție de nopțile
  de cazare, prețurile pot fi negociate". Un preț fix scris pe site ar contrazice chiar felul
  în care lucrează. Iar cifrele care circulă pe agregatoare — 250 lei camera dublă, 500 lei
  apartamentul pe m.cazarebailefelix.ro, 300 lei pe cazare7 — sunt vechi, se contrazic între
  ele, și niciuna nu e confirmată de gazde. Publicată, oricare ar fi fost o promisiune pe
  care nimeni n-a făcut-o.

  ⚠ `npm run verifica` VA DA UN AVERTISMENT pentru fiecare cameră fără preț
  (`scripts/verifica.ts`, „Camera n-are preț «de la»"). E AȘTEPTAT, nu e o defecțiune, și nu
  blochează publicarea. Verificatorul are dreptate în general — ascunderea prețului chiar
  pierde vizitatori care compară — dar aici decizia e luată în cunoștință de cauză, iar
  pierderea e acoperită de altceva: textul de deasupra cardurilor
  (`03-pagina-principala.md`, „Secțiunea de camere") spune de ce nu e preț și unde se află.

  ══ DOTĂRILE ══

  Toate camerele au aceeași listă, și e chiar ce scriu ei: balcon, baie proprie, televizor,
  cablu TV, frigider, uscător de păr, internet wireless, aer condiționat, pat matrimonial
  180/200. Descrierea e identică pe site-ul lor, pe fișa de pe agregator și pe portalurile de
  cazare — deci nu e o singură sursă repetată prost, e ce declară ei peste tot.

  Descrierile de mai jos nu repetă de două ori aceeași listă. Un vizitator care citește al
  doilea card identic încetează să citească.

  ══ MICUL DEJUN ══

  ⚠ NU E SCRIS NICĂIERI, INTENȚIONAT. „SALON MIC DEJUN" apare ca dotare pe fișa de pe
  agregator, deci spațiul există. Dar nicăieri nu scrie dacă se servește, dacă e inclus în
  tarif sau între ce ore.

  Când gazdele confirmă, se adaugă în patru locuri: aici, la fiecare cameră; ca a patra
  „Asigurare" în `10-rezervari-si-plati.md`; ca întrebare în `09-intrebari-frecvente.md`; și
  în „Secțiunea de servicii" din `03-pagina-principala.md`.
-->

## Cameră dublă matrimonială

Preț de la:
Prețuri:
Persoane: 2 adulți
Pat: un pat matrimonial, 180×200
Suprafață:
Poze: camera-dubla-cu-pat-matrimonial.webp, camera-dubla-cu-birou-si-frigider.webp, camera-cu-masa-de-toaleta.webp, baie-cu-cabina-de-dus.webp
Facilități: bed, terrace, climate, tv, fridge, shower, wifi
Etichetă:

Camera de bază a vilei, și singura pe care o descriu ei în detaliu. Pat matrimonial de 180
pe 200, balcon propriu cu masă, baie cu duș, aer condiționat, televizor prin cablu, frigider
și uscător de păr. Internetul wireless prinde peste tot.

Balconul dă spre stradă, adică spre ștrand. Se bea cafeaua acolo dimineața, înainte să se
deschidă bazinele.

<!--
  ⚠ „Suprafață:" E GOALĂ. Descrierea lor spune „camere spațioase", ceea ce nu e o cifră.
  Nicio sursă nu dă metri pătrați. De întrebat — o cameră de 25 m² scrisă negru pe alb
  convinge mai mult decât „spațioasă".

  CELE PATRU POZE nu sunt toate din aceeași cameră, și se vede: prima și a doua arată o
  cameră renovată recent (mobilier deschis, tăblie capitonată), a treia una în stil mai
  vechi, cu masă de toaletă din lemn închis. Le-am pus împreună fiindcă astea sunt camerele
  duble ale vilei — dar merită întrebat dacă diferența e de etaj, de preț, sau dacă renovarea
  e în curs. Dacă sunt două categorii diferite, se despart în două blocuri „##".
-->

<!--
  ══ APARTAMENTUL LIPSEȘTE DE PE SITE, ȘI E O DECIZIE, NU O SCĂPARE ══

  CE ȘTIM: fișa de pe m.cazarebailefelix.ro listează, la tarife, „Apartament: 500 LEI", lângă
  „Camera dubla: 250 LEI". Deci un apartament există.

  CE NU ȘTIM: câte persoane încap, câte camere are, ce suprafață, cum sunt paturile, dacă are
  bucătărie. Și, mai important pentru un site — NU EXISTĂ NICIO FOTOGRAFIE. Cele unsprezece
  poze primite sunt trei exterioare, patru interioare de cameră dublă și baie, patru de la
  ștrand. Niciuna nu e un apartament.

  Un card fără poză, fără capacitate și fără preț nu convinge pe nimeni — arată a pagină
  neterminată și strică și cardul de lângă el. Deci nu e pus deloc: o cameră bine arătată bate
  o cameră bună plus una goală.

  ⚠ MERITĂ REPARAT REPEDE, e cel mai ieftin câștig de pe tot site-ul. Un apartament la 500 lei
  se vinde singur unei familii care altfel ar lua două camere duble la 250 fiecare — același
  bani pentru ei, mai puțină bătaie de cap pentru toată lumea.

  CE TREBUIE CA SĂ APARĂ: o întrebare la gazde (câte persoane, câte camere, ce suprafață, are
  bucătărie?) și două-trei fotografii de pe telefon. Apoi se copiază blocul camerei duble de
  mai sus, se schimbă numele în „Apartament" și se completează câmpurile. Adresa lui va fi
  `/camere/apartament`, generată singură din nume.
-->
