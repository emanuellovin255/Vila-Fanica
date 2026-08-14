# Vila Fănică — stare

> Ce e gata, ce lipsește și în ce ordine merită rezolvat.
> Scris la 14 august 2026, după construirea site-ului.

**Șablon:** 6 · Irlandez (aranjament de afiș, recolorat cu culorile clădirii)
**Module pornite:** galerie extinsă, pagina „Zona"
**Module oprite:** engleză, oferte, meniu restaurant, spații de evenimente, plăți online
**`npm run verifica`:** 0 erori · 1 avertisment (prețul lipsă, intenționat)

---

## Gata

- identitate: **Vila Fănică**, 3 stele, Băile Felix
- contact complet: telefon, WhatsApp, e-mail, adresă, GPS
- **rezervarea prin WhatsApp, cu numele, camera și perioada precompletate** — funcția cerută
- 1 cameră descrisă, fără preț (cerut așa)
- 10 facilități, toate din dotări declarate de ei
- 8 întrebări frecvente
- 8 atracții pe pagina `/zona`, trei dintre ele și pe prima pagină
- 11 fotografii procesate, redenumite în română
- paletă proprie, cu toate contrastele peste 4,5:1
- 10 adrese, toate 200, sitemap și JSON-LD generate

---

## De completat, în ordinea în care contează

### 1 · Fotografii mari — schimbă cel mai mult, costă cel mai puțin

Cele 11 poze sunt **414×414 px**, salvate de pe Facebook, mărite de două ori. Poza mare de sus
e vizibil mai moale decât ar trebui și nu se repară din cod: informația nu există în fișier.

**Ce trebuie:** aceleași fotografii, trimise de gazde direct de pe telefon. Orice telefon din
ultimii zece ani dă 3000+ px. Se pun în `poze/` cu **exact același nume** și site-ul le ia
automat.

**Ce lipsește complet — nicio fotografie:**
recepția · salonul de mic dejun · **apartamentul** · curtea cu foișorul și grătarul

### 2 · Apartamentul — o cameră întreagă nu e pe site

Fișa de pe agregator îl listează la tarife (500 lei), deci există. Dar n-avem nicio poză, nicio
suprafață, nicio capacitate. Un card gol ar fi stricat și cardul de lângă el, deci nu e pus
deloc.

**Ce trebuie:** două-trei poze și răspunsul la „câte persoane, câte camere, are bucătărie?".
Apoi se copiază blocul din `date/04-camere.md` și apare la `/camere/apartament`.

**De ce merită repede:** un apartament la 500 lei se vinde singur unei familii care altfel ia
două camere duble la 250. Aceiași bani, mai puțină bătaie de cap.

### 3 · Datele firmei — singurul lucru care costă bani dacă rămâne așa

Avem **VILA FANICA SRL** și **CUI 46778737**. Lipsesc **numărul din registrul comerțului** și
**sediul social**. Amândouă sunt obligatorii în subsol; lipsa lor e motiv de amendă ANPC.

Scriu pe orice factură emit ei. `npm run verifica` **nu se oprește** pentru asta — nu înseamnă
că e în regulă.
→ `date/12-firma-si-documente-legale.md`

### 4 · Cinci întrebări pentru gazde, cinci minute de conversație

| Întrebarea | Unde intră răspunsul |
|---|---|
| **Numărul 0740 454 064 citește WhatsApp?** | dacă nu, se schimbă tot fluxul de rezervare — `date/02-…`, `setari.md` |
| **E-mailul e `vilafainica` sau `vilafanica`?** | așa e publicat la ei, dar pare greșeală de tipar — `date/02-…` |
| **Se servește mic dejun? Inclus? Între ce ore?** | 4 locuri: `04-…`, `05-…`, `09-…`, `10-…` |
| **18 sau 34 de camere?** | sursele se contrazic — banda de încredere din `03-…` |
| **Orele de check-in și check-out** | `date/02-…` și `date/09-…` |

### 5 · Politica de anulare — lipsește de tot

Rezervarea e directă, deci nu împrumută condițiile nimănui. Trei întrebări: se cere avans?
până când se poate anula? ce se întâmplă la neprezentare?

Pagina `/politica-anulare` există, dar e generică — și e chiar pagina pe care o caută acolo
cineva care ezită să scrie pe WhatsApp.
→ `date/12-firma-si-documente-legale.md`

### 6 · Recenziile — cea mai slabă secțiune de pe site

Acum: nota 10 din 10, dar din **zece păreri**, cea mai recentă din **2022**, de pe
amfostacolo.ro. Vila nu e pe Booking.

**Ce trebuie, în ordine:**
1. recenziile de pe fișa de Google — se copiază 4–6, cuvânt cu cuvânt, în `date/08-…`
2. dacă nu există fișă de Google, se face: gratuit, douăzeci de minute
3. un mesaj scurt pe WhatsApp a doua zi după plecare, cu linkul de recenzie — numărul fiecărui
   oaspete e deja acolo, chiar de la rezervare

⚠ Dacă nu se strâng recenzii în câteva luni, secțiunea merită scoasă din `setari.md`: o singură
părere din 2022 atrage atenția asupra lipsei, nu asupra calității.

### 7 · Engleza — un cuvânt, dar întâi o întrebare

Toate cele zece fișiere din `en/` sunt **scrise și gata**. Se pornesc cu `Engleză: da` în
`setari.md`.

Sunt oprite fiindcă nu știm dacă cineva răspunde în engleză, iar tot site-ul duce într-o
conversație pe WhatsApp — o pagină `/en` aduce mesaje la care poate n-are cine să răspundă.

⚠ **Merită întrebat și despre maghiară.** Vama Borș e la 25 km, Budapesta la 300.

### 8 · Certificatul de clasificare

Cele 3 stele sunt luate de pe firma clădirii, nu de pe un certificat. Dacă certificatul nu
există, se golește rândul „Stele:" din `date/01-…`.

### 9 · Pagina de Facebook

Pozele vin de acolo, dar adresa exactă n-a fost confirmată. Un link, și iconița apare în subsol
și pe pagina de contact.

---

## Idei care nu blochează nimic, dar aduc rezervări

**Pachete.** Pagina `/oferte` e gata în cod, doar goală. Trei care s-ar vinde aici, în ordinea
în care le-aș încerca: sejur de 5+ nopți cu tariful negociat scris pe site · extrasezon
septembrie–mai (bazinele acoperite merg tot anul) · weekend cu mașina, cu parcarea în față.
→ `date/06-oferte-si-excursii.md`

**Tichete de vacanță.** Dacă se acceptă, locul lor e la „Asigurări:" în `date/10-…`. Aproape
nicio unitate din Băile Felix nu-l scrie, deși jumătate dintre angajații din România au tichete
pe card și caută activ unde le pot folosi.

**Parteneriat cu Apollo.** Dacă există tarife reduse la ștrand pentru oaspeți, e al
unsprezecelea cerc de facilități și unul dintre cele mai bune.
→ `date/05-facilitati.md`

**Un text scris de gazde.** Cinci propoziții despre casă, cu mâna lor — de când o țin, de unde
vine numele „Fănică". Textul de acum e scris de mine, din fapte publicate de ei, și se vede.
Când vine al lor, se pune în loc **cuvânt cu cuvânt** și secțiunea urcă pe primul loc în
`setari.md`.
→ `date/03-pagina-principala.md`

---

## Următorul pas

```bash
npm run dev
```
