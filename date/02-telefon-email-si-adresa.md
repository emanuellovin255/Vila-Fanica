# Contact — telefon, e-mail, adresă și program

<!-- ────────────────────────────────────────────────────────────────────────

     CE E AICI:  toate datele de contact, într-un singur loc.

     UNDE SE VEDE  — datele de aici apar automat în CINCI locuri:
       · în subsol, pe fiecare pagină
       · pe pagina /contact
       · în bara de jos de pe telefon (sună / WhatsApp / disponibilitate)
       · în butonul verde de WhatsApp
       · în datele structurate pe care le citește Google

     Le scrii o singură dată aici. Nu se mai scriu nicăieri altundeva.

     CUM SE SCRIU
       Telefon:          așa cum se formează:  0740 454 064
       Telefon afișat:   cum vrei să se vadă pe ecran
       WhatsApp:         cu prefix de țară, fără spații:  +40740454064
       Check-in:         doar ora, „14:00", fără „de la"

     Fișierul ăsta NU se traduce: aceleași valori se afișează și pe /en.
     ──────────────────────────────────────────────────────────────────────── -->

## Telefon
Telefon: 0740 454 064
Telefon afișat: 0740 454 064
WhatsApp: +40740454064

<!--
  NUMĂRUL VINE DE PE SITE-UL LOR, `vilafanicabailefelix.cazare7.ro/contact`, unde e scris
  „0740-454-064 — Administrator". E un număr de mobil, deci poate primi mesaje pe WhatsApp.

  ⚠ DE CONFIRMAT ÎNAINTE DE PUBLICARE, și nu e o formalitate: numărul ăsta CHIAR citește
  WhatsApp? Tot site-ul e construit în jurul lui — fiecare buton „Verifică disponibilitatea"
  deschide o conversație cu mesajul deja scris. Un buton verde care duce pe un număr care nu
  deschide niciodată aplicația e mai rău decât niciun buton.

  Dacă răspunsul e nu: rândul „WhatsApp:" se golește și se pune „Buton WhatsApp: nu" în
  `setari.md`. Motorul cade atunci singur pe telefon apelabil — vezi `linkRezervare` din
  `lib/whatsapp.ts`. Nimic nu se strică, dar site-ul pierde jumătate din ce a fost gândit.

  MAI EXISTĂ UN NUMĂR, fix: 0359 444 679, de pe fișa de pe m.cazarebailefelix.ro. Nu l-am pus
  aici fiindcă motorul afișează un singur telefon, iar mobilul e cel bun: se răspunde la el
  și primește mesaje. Fixul merită pus pe pagina de contact, ca al doilea rând, dacă gazdele
  îl vor acolo — se scrie în `14-pagina-de-contact.md`.
-->

## Email
Email: vilafainica@yahoo.com

<!--
  ⚠⚠ ADRESA E SCRISĂ EXACT CUM E PUBLICATĂ DE EI, pe propriul lor site, la /contact:
  `vilafainica@yahoo.com` — cu „fainica", nu „fanica".

  Poate fi o greșeală de tipar veche, rămasă acolo de ani, sau poate fi chiar adresa. Nu se
  ghicește: o adresă „corectată" de noi ar trimite formularul de contact în neant, tăcut.

  DE ÎNTREBAT, în prima conversație: e „vilafainica" sau „vilafanica"? Un minut de întrebat,
  și scapi de mesaje pierdute.

  LA PUBLICARE: aceeași adresă trebuie pusă în variabila de mediu `DESTINATAR`, plus o cheie
  `RESEND_API_KEY` (vezi `.env.example`). Fără ele, formularul se vede dar trimiterea eșuează
  — ceea ce e mai rău decât lipsa formularului.

  MERITĂ CERUT: o adresă pe domeniul propriu (rezervari@vilafanica.ro) în loc de una de
  yahoo. E o setare de zece minute la furnizorul de domeniu, iar yahoo-ul poate rămâne în
  spate ca destinație reală a mesajelor.
-->

## Adresă
Stradă: Str. Primăverii nr. 7
Oraș: Băile Felix
Județ: Bihor
Cod poștal: 417500
Țară: RO

<!--
  Adresa e identică pe toate sursele: pe site-ul lor, pe fișa de pe agregator și pe
  portalurile de cazare. Codul poștal 417500 vine tot de acolo, deci nu e ghicit.

  Băile Felix ține administrativ de comuna Sânmartin, județul Bihor. Pe site apare „Băile
  Felix", fiindcă așa caută lumea și așa scrie pe indicator; comuna Sânmartin apare o dată,
  pe pagina de contact, pentru cine completează un formular oficial.

  Asta e adresa LOCAȚIEI, unde vin oaspeții. Sediul social al firmei e alt lucru și stă în
  `12-firma-si-documente-legale.md`.
-->

## Coordonate GPS
Latitudine: 46.993545
Longitudine: 21.979944
Link Google Maps: https://www.google.com/maps/search/?api=1&query=46.993545,21.979944

<!--
  Coordonatele sunt cele publicate în fișa de pe amfostacolo.ro.

  ⚠ DE VERIFICAT O DATĂ, cu ochii: se deschide linkul de mai sus și se uită dacă pinul cade
  PE CLĂDIRE, nu în mijlocul străzii sau la vecin. E o verificare de treizeci de secunde și e
  singurul lucru din fișierul ăsta care nu se poate confirma din text.

  DACĂ SE MUTĂ PINUL: Google Maps → click dreapta pe clădire → primul rând din meniu e
  perechea de numere → se copiază aici și în linkul de mai sus, după „query=".

  Harta de pe prima pagină și cea de pe /contact folosesc exact numerele astea.
-->

## Program
Check-in:
Check-out:
Recepție:

<!--
  ⚠ TOATE TREI GOALE, fiindcă orele nu sunt publicate nicăieri: nici pe site-ul lor, nici pe
  fișa de pe agregator, nici pe portalurile de cazare. Nu se inventează.

  Cât timp rândurile sunt goale, orele pur și simplu nu se afișează. Pagina de contact rămâne
  întreagă — adresă, telefon, hartă — doar fără rândul de program.

  DE COMPLETAT, după o singură întrebare la gazde:
    Check-in: 14:00
    Check-out: 12:00

  „Recepție:" se completează doar dacă există cu adevărat o recepție cu program. La o vilă de
  34 de camere e probabil să existe cineva permanent, dar „probabil" nu se publică. Dacă e
  non-stop, se scrie „non-stop"; dacă gazdele primesc personal, se scrie asta.

  Când vin orele, ele intră și ca întrebare în `09-intrebari-frecvente.md` — acolo e loc
  pentru o propoziție întreagă, nu doar pentru o oră.
-->

## Rețele sociale
Facebook:
Instagram:

<!--
  ⚠ FACEBOOK EXISTĂ, DAR ADRESA EXACTĂ NU E CONFIRMATĂ. Cele unsprezece fotografii din
  `poze/` vin de pe o pagină de Facebook a vilei — se vede din numele fișierelor originale,
  păstrate în `Poze Camere/`. Ce nu știm e adresa paginii.

  Un rând gol nu afișează nicio iconiță, deci nu strică nimic. Dar merită completat repede:
  pagina e activă (fotografiile sunt din 2025), iar la o vilă din Băile Felix pagina de
  Facebook e de obicei prima sursă de cereri directe.

  DE CERUT GAZDELOR: linkul complet al paginii. Se lipește aici și iconița apare în subsol și
  pe pagina de contact.

  Instagram: de întrebat dacă există. Dacă nu, rândul rămâne gol — nu e nimic de forțat.
-->

## Limbi vorbite

Limbi: română

<!--
  Doar româna, fiindcă doar despre ea avem confirmare.

  Site-ul lor de pe cazare7 are butoane RO / HU / EN, dar alea sunt legături către Google
  Translate, nu o declarație că cineva de la vilă vorbește maghiară sau engleză. Nu e același
  lucru și nu se scrie ca și cum ar fi.

  ⚠ DE ÎNTREBAT, ȘI CHIAR CONTEAZĂ AICI: se vorbește maghiară? Băile Felix primesc constant
  turiști din Ungaria — vama Borș e la 25 km, Budapesta la 300 — iar „se vorbește maghiară"
  scris pe site aduce oaspeți care altfel sună în altă parte. Dacă da, se adaugă la rândul de
  mai sus și se pornește și engleza din `setari.md` cu mai multă convingere.
-->
