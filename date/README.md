# Folderul `date/` — toate textele site-ului, în română

Fiecare fișier de aici controlează o parte anume din site. Numărul din față dă ordinea
și **nu se schimbă niciodată** — după el se orientează site-ul când caută fișierul.

Textul de după număr e pentru tine, ca să știi ce e înăuntru fără să deschizi fișierul.

---

## Ce controlează fiecare fișier

| Fișierul | Ce controlează | Unde se vede pe site |
|---|---|---|
| [`01-nume-logo-si-descriere.md`](01-nume-logo-si-descriere.md) | numele pensiunii, sloganul, numărul de margarete, logo-ul, descrierea scurtă | antet, subsol, titlul din fila browserului, descrierea din rezultatele Google |
| [`02-telefon-email-si-adresa.md`](02-telefon-email-si-adresa.md) | telefon, WhatsApp, e-mail, adresă, coordonate GPS, check-in / check-out, rețele sociale | subsol, pagina de contact, bara de jos de pe telefon, harta |
| [`03-pagina-principala.md`](03-pagina-principala.md) | toate textele de pe prima pagină | prima pagină, de sus până jos |
| [`04-camere.md`](04-camere.md) | camerele: nume, preț, poze, dotări, descriere | secțiunea de camere, pagina `/camere`, câte o pagină pentru fiecare cameră |
| [`05-facilitati.md`](05-facilitati.md) | lista „Ce găsești aici" | secțiunea de facilități (oprită acum din `setari.md`) |
| [`06-oferte-si-excursii.md`](06-oferte-si-excursii.md) | pachetele turistice și excursiile cu barca | pagina `/oferte` și câte o pagină pentru fiecare pachet |
| [`07-meniu-restaurant.md`](07-meniu-restaurant.md) | preparatele și prețurile din restaurant | secțiunea de meniu (oprită acum din `setari.md`) |
| [`08-recenzii.md`](08-recenzii.md) | recenziile oaspeților și nota medie | secțiunea de recenzii de pe prima pagină |
| [`09-intrebari-frecvente.md`](09-intrebari-frecvente.md) | întrebările și răspunsurile | secțiunea de întrebări (oprită acum din `setari.md`) |
| [`10-rezervari-si-plati.md`](10-rezervari-si-plati.md) | linkul de Booking și textele butoanelor de rezervare | butonul „Verifică disponibilitatea", bara de căutare, fereastra de rezervare |
| [`11-culori-si-fonturi.md`](11-culori-si-fonturi.md) | culorile și fonturile | tot site-ul |
| [`12-firma-si-documente-legale.md`](12-firma-si-documente-legale.md) | denumirea firmei, CUI, ANPC, textele paginilor legale | subsol și paginile `/termeni`, `/politica-cookies` etc. |
| [`13-zona-si-atractii.md`](13-zona-si-atractii.md) | Aquapark President, Băile Felix, rezervația Pârâul Peța, Oradea | pagina `/zona` și secțiunea „Locație" de pe prima pagină |
| [`14-pagina-de-contact.md`](14-pagina-de-contact.md) | titlul și textele de pe pagina de contact | pagina `/contact` |

---

## Formatul: patru reguli

### 1. `##` deschide un element nou

O cameră, o ofertă, o recenzie, o întrebare, o atracție. Ce scrii după `##` devine
titlul lui pe site și, la camere și oferte, adresa paginii:

```
## Cameră triplă
```

→ pagina `/camere/camera-tripla`

Dacă schimbi titlul, se schimbă și adresa. Ce era indexat în Google sub adresa veche
o ia de la capăt, așa că titlurile camerelor merită schimbate rar.

### 2. `Ceva: valoare` e un câmp

```
Preț de la: 300
Persoane: 2 persoane
Poze: camera-twin-cu-doua-paturi.webp, cabina-de-dus-din-baie.webp
```

Numele câmpului (înainte de `:`) trebuie să rămână scris exact așa. Valoarea (după `:`)
o schimbi liber.

Diacriticele din numele câmpului nu contează: `Preț de la:`, `Pret de la:` și
`PREȚ DE LA:` merg toate. Ce contează sunt cele două puncte.

**Dacă scrii greșit numele unui câmp**, el este ignorat în tăcere pe site — dar
`npm run verifica` îl prinde și îți spune ce ai vrut probabil să scrii.

### 3. Textul de sub câmpuri e descrierea

Scrii normal, în propoziții:

```
## Cameră dublă twin
Preț de la: 300
Persoane: 2 persoane

Cameră cu două paturi single, ferestre spre curte și baie proprie cu duș.
Are aer condiționat, minifrigider, televizor și Wi-Fi.
```

Un **rând gol** înseamnă paragraf nou pe site. Două rânduri lipite unul sub altul
formează un singur paragraf.

Atenție: rândul gol e și cel care închide un câmp. Un câmp scris pe mai multe rânduri
(ca `Include:` sau `Buline:`) trebuie să aibă rândurile lipite, fără rând gol între ele.

### 4. `<!--` … `-->` sunt explicații, nu conținut

Nu ajung niciodată pe site. Fiecare fișier are astfel de explicații chiar în capul lui
și lângă câmpurile mai complicate. **Nu le șterge** — sunt manualul fișierului.

---

## Liste: două feluri, alege după conținut

**Pe un singur rând, despărțite prin virgulă** — pentru lucruri scurte:

```
Facilități: shower, fridge, tv, climate, wifi
```

**Pe mai multe rânduri, câte unul pe rând** — pentru fraze care conțin ele însele virgule:

```
Buline: Cu mașina, dinspre Oradea pe DN76, apoi spre Sânmartin și Cordău
        Parcare gratuită în curtea pensiunii, cu loc pentru toate mașinile
        Aquapark President e la 600 de metri, zece minute pe jos
```

Regula site-ului: dacă un câmp are **mai multe rânduri**, fiecare rând e un element și
virgulele din interior rămân parte din text. Dacă are **un singur rând**, se taie la
virgulă.

---

## Prețuri

Un preț simplu se scrie **doar cu cifre**, fără „lei" și fără „/noapte". Site-ul
adaugă singur moneda și formatarea:

```
Preț de la: 300
```

Prețurile pe sezoane se scriu câte unul pe rând, cu **linia lungă `—`** între sumă și
perioadă:

```
Prețuri: 300 lei / noapte — 1 oct – 31 mai
         350 lei / noapte — 1 iun – 30 sep
```

Linia lungă `—` desparte suma de perioadă. Linia scurtă `–` dinăuntrul perioadei
(„27 mar – 31 mai") rămâne parte din perioadă. Sunt două semne diferite: dacă le
inversezi, jumătate din rând se pierde.

---

## Poze

Se scrie **numele fișierului din folderul `poze/`**, cu tot cu extensie:

```
Poza: vedere-aeriana-pensiunea-din-fata.webp
```

Mai multe poze la o cameră, despărțite prin virgulă. **Prima e cea care apare pe card:**

```
Poze: camera-twin-cu-doua-paturi.webp, camera-twin-cu-parchet.webp
```

Numele trebuie scris identic cu cel din folder: aceleași litere mari și mici, aceeași
extensie. Dacă nu se potrivește, `npm run verifica` îți spune exact ce fișier lipsește
și care e cel mai apropiat ca nume.

Cum adaugi o poză nouă: [`poze/README.md`](../poze/README.md).

---

## Cum adaugi sau ștergi un element

**Adaugi** o cameră, o ofertă, o recenzie, o întrebare:

1. Copiezi un bloc întreg existent — de la rândul lui `##` până la rândul gol dinaintea
   următorului `##`.
2. Îl lipești mai jos.
3. Îi schimbi titlul de după `##` și restul câmpurilor.

**Ștergi** un element: ștergi tot blocul lui, de la `##` până înainte de următorul `##`.

**Muți** un element mai sus sau mai jos: tai blocul întreg și îl lipești în altă parte.
Ordinea din fișier e ordinea de pe site.

---

## Greșeli frecvente

| Ce se întâmplă | De ce | Cum repari |
|---|---|---|
| Am schimbat un text și nu se vede pe site | site-ul se reface în 1–2 minute | mai aștepți puțin și reîncarci pagina |
| O secțiune nu apare deloc | ori e oprită din `setari.md`, ori toate câmpurile ei sunt goale | verifici `setari.md` și dacă fișierul chiar are conținut |
| O recenzie nu apare | îi lipsește `Sursă:` | scrii de unde vine (Google, Booking) — o recenzie fără sursă nu se afișează, e obligatoriu legal |
| Poza nu apare | numele nu se potrivește exact cu fișierul din `poze/` | rulezi `npm run verifica`, care spune exact ce nume aștepta |
| Prețul apare ciudat | ai scris „270 lei / noapte" la `Preț de la:` | acolo se scrie doar `270` |
| Textul apare într-un singur bloc lung | lipsesc rândurile goale | pui rând gol între paragrafe |
| Ultimele rânduri dintr-o listă au ajuns în descriere | ai lăsat un rând gol în mijlocul listei | lipești rândurile listei unul sub altul |

---

## Înainte de publicare

```bash
npm run verifica
```

Trece prin toate fișierele de aici și spune, pe rând: fișierul, rândul, ce e greșit și
ce ai de făcut. **0 erori** înseamnă că se poate publica.
