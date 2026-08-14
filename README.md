# Site-ul Vilei Fănică — ghid de modificare

Aici stă tot ce se vede pe site: texte, poze, date de contact.

**Nu trebuie să știi programare ca să schimbi ceva.** Textele se scriu în fișiere obișnuite,
în română, iar site-ul se actualizează singur după ce salvezi.

---

## Înainte de publicare — ce lipsește

Site-ul e construit și funcționează, dar **nu se publică așa**. Îi lipsesc câteva informații
pe care numai gazdele le pot da. `npm run verifica` le semnalează la fiecare rulare.

### Obligatoriu legal, chiar dacă `verifica` trece

| Ce lipsește | Unde se scrie |
|---|---|
| **Nr. registrul comerțului** și **sediul social** | `date/12-firma-si-documente-legale.md` |

Avem deja denumirea (VILA FANICA SRL) și CUI-ul (46778737) — dar amândouă merită confirmate pe
o factură de-a lor, iar celelalte două lipsesc de tot.

**Atenție — `npm run verifica` NU se oprește pentru asta**, fiindcă vede că denumirea și CUI-ul sunt
completate. Nu înseamnă că e în regulă: datele complete de identificare ale comerciantului sunt
obligatorii în subsolul oricărui site care vinde sau colectează date, iar lipsa lor e motiv de
amendă ANPC. E primul lucru pe care îl verifică un control și singurul de pe lista asta care
costă bani dacă rămâne așa.

### De confirmat, cu o singură conversație

1. **Numărul 0740 454 064 citește WhatsApp?** Tot site-ul e construit în jurul lui. Dacă nu,
   se golește rândul „WhatsApp:" din `date/02-…` și se pune „Buton WhatsApp: nu" în
   `setari.md`.
2. **E-mailul e `vilafainica@yahoo.com` sau `vilafanica@…`?** Așa e publicat pe site-ul lor,
   dar „fainica" pare o greșeală de tipar. Un e-mail greșit înseamnă formulare pierdute tăcut.
3. **Se servește mic dejun?** Salonul e listat ca dotare, servirea nu scrie nicăieri. E cel
   mai puternic argument nefolosit al locului — dacă răspunsul e da, intră în patru locuri.
4. **18 sau 34 de camere?** Descrierea lor spune 18, fișa de pe agregator spune 34 și 68 de
   locuri. Până se lămurește, cifra nu apare nicăieri pe site.
5. **Orele de check-in și check-out.** Nepublicate nicăieri. Sunt printre primele întrebări
   pe care le pune oricine.
6. **Politica de anulare.** Se cere avans? Până când se poate anula? Rezervarea e directă,
   deci nu împrumută condițiile nimănui — `date/12-…`.
7. **Certificatul de clasificare pentru cele 3 stele.** Stelele sunt luate de pe firma
   clădirii. Dacă nu există certificat, se golește rândul „Stele:" din `date/01-…`.
8. **Se vorbește engleză? Dar maghiară?** De asta depinde dacă se pornește `/en` —
   vezi `setari.md`.

### Ce ar face site-ul vizibil mai bun

| Ce | De ce |
|---|---|
| **Fotografii mari** | cele 11 primite sunt 414×414 px, salvate din Facebook. Vezi mai jos |
| **Poze cu apartamentul** | fără ele, apartamentul nu e deloc pe site — vezi `date/04-camere.md` |
| **Recenzii de Google** | secțiunea de păreri e scoasă complet, fiindcă n-avem ce arăta — vezi `date/08-recenzii.md` |
| **Linkul paginii de Facebook** | pozele vin de acolo, dar adresa nu e confirmată |

Plus, la publicare: domeniul în `NEXT_PUBLIC_SITE_URL`, iar pentru formular `DESTINATAR` și
`RESEND_API_KEY` (vezi `.env.example`).

---

## Despre fotografii — citește înainte să te miri

Cele unsprezece poze din `poze/` sunt **mărite de două ori** din originale de 414×414 px,
salvate de pe Facebook. Transformarea e reproductibilă: scriptul e în
[`Poze Camere/pregateste.mjs`](Poze%20Camere/pregateste.mjs), iar originalele sunt lângă el.

**Deci poza mare de sus e mai moale decât ar trebui.** Nu e o greșeală de setare și nu se
repară din cod: informația nu există în fișier. Am ales cadrul de amurg tocmai fiindcă are
puțin detaliu fin, deci se vede cel mai puțin.

**Ce o repară cu adevărat:** originalele de pe telefonul gazdelor. Aceleași fotografii,
făcute cu orice telefon din ultimii zece ani, au 3000+ px. Se pun în `poze/` cu **exact
același nume** și site-ul le ia automat, fără nicio altă modificare.

**Ce lipsește complet din fotografii:** recepția, salonul de mic dejun, apartamentul, curtea
cu foișorul și grătarul. Toate sunt scrise pe site ca text, dar niciuna nu se vede.

---

## Cel mai scurt drum: „vreau să schimb…"

| Vreau să schimb | Deschid fișierul |
|---|---|
| Numele, sloganul, descrierea din Google | [`date/01-nume-logo-si-descriere.md`](date/01-nume-logo-si-descriere.md) |
| Telefonul, WhatsApp-ul, e-mailul, adresa, orele | [`date/02-telefon-email-si-adresa.md`](date/02-telefon-email-si-adresa.md) |
| Titlul mare de pe prima pagină, poza de sus, textul de bun venit | [`date/03-pagina-principala.md`](date/03-pagina-principala.md) |
| Camerele: nume, poze, dotări (prețurile sunt goale intenționat) | [`date/04-camere.md`](date/04-camere.md) |
| **Cercurile cu facilități** | [`date/05-facilitati.md`](date/05-facilitati.md) |
| Pachete și oferte | [`date/06-oferte-si-excursii.md`](date/06-oferte-si-excursii.md) |
| Recenziile și nota medie (acum scoase) | [`date/08-recenzii.md`](date/08-recenzii.md) |
| Întrebările frecvente | [`date/09-intrebari-frecvente.md`](date/09-intrebari-frecvente.md) |
| Textele butoanelor de rezervare | [`date/10-rezervari-si-plati.md`](date/10-rezervari-si-plati.md) |
| Culorile și fonturile | [`date/11-culori-si-fonturi.md`](date/11-culori-si-fonturi.md) |
| Datele firmei, CUI, documentele legale | [`date/12-firma-si-documente-legale.md`](date/12-firma-si-documente-legale.md) |
| Atracțiile din zonă (Apollo, Nymphaea, Oradea…) | [`date/13-zona-si-atractii.md`](date/13-zona-si-atractii.md) |
| Textele de pe pagina de contact | [`date/14-pagina-de-contact.md`](date/14-pagina-de-contact.md) |
| **Pozele** | folderul [`poze/`](poze/) → [ghidul de acolo](poze/README.md) |
| **Textele în engleză** (acum oprite) | folderul [`en/`](en/) → [ghidul de acolo](en/README.md) |
| Ce secțiuni apar pe prima pagină, în ce ordine | [`setari.md`](setari.md) |

> Fiecare fișier are, chiar în capul lui, o explicație a ceea ce controlează.
> Deschide-l și citește primele rânduri înainte să schimbi ceva.

---

## Regulile de scriere (aceleași în toate fișierele)

Sunt patru, atât:

**1. `##` deschide un element nou.** O cameră, o facilitate, o recenzie, o întrebare.
Ce scrii după `##` devine titlul lui pe site.

**2. `Ceva: valoare` e un câmp.** Numele câmpului dinaintea celor două puncte se lasă
neatins; valoarea de după se schimbă.

```
Telefon: 0740 454 064
──────── ▲
 asta rămâne  asta schimbi
```

**3. Textul liber de sub câmpuri e descrierea.** Un rând gol înseamnă paragraf nou.

**4. Ce e între `<!--` și `-->` sunt explicații pentru tine.** Nu apar niciodată pe site.

**Un câmp lăsat gol dispare de pe site.** Nu apare „gol" sau „—", pur și simplu nu se
afișează nimic. E mai bine să lași gol decât să scrii ceva nesigur.

---

## Cum arată prima pagină, de sus în jos

Ordinea vine din [`setari.md`](setari.md); mutând un rând acolo, secțiunea urcă sau coboară.

| # | Secțiunea | De unde vine |
|---|---|---|
| 1 | Poza mare, titlul, cele două butoane | `03-pagina-principala.md` → `## Prima secțiune` |
| 2 | Blocul verde de WhatsApp | `10-rezervari-si-plati.md` |
| 3 | Banda cu numele camerelor, în mișcare | `04-camere.md` |
| 4 | Camerele | `04-camere.md` |
| 5 | **Cercurile cu facilități** | `05-facilitati.md` |
| 6 | Textul de bun venit | `03-pagina-principala.md` |
| 7 | Cifrele (peste drum · 30 · 180×200 · 300 m) | `03-pagina-principala.md` → `## Bandă de încredere` |
| 8 | Cele trei blocuri poză + text | `03-pagina-principala.md` → `## Feature-uri alternante` |
| 9 | Mozaicul foto | se strânge singur din pozele deja folosite |
| 10 | Banda de semnătură | `03-pagina-principala.md` |
| 11 | Ștrandul Apollo și Băile Felix | `13-zona-si-atractii.md` |
| 12 | Întrebările frecvente | `09-intrebari-frecvente.md` |
| 13 | Harta | coordonatele din `02-telefon-email-si-adresa.md` |
| 14 | Ultimul îndemn | `03-pagina-principala.md` → `## Secțiunea de închidere` |

**Recenziile nu sunt pe listă**, fiindcă secțiunea e scoasă complet — nu avem ce arăta.
Se pune la loc scriind părerile în `date/08-recenzii.md` și adăugând rândul „Recenzii: da" în
`setari.md`, între „Locație" și „Întrebări frecvente".

Lista completă a paginilor, cu adrese: **[PAGINI.md](PAGINI.md)**.

---

## Cum se rezervă

**Nu există calendar și nu există motor de rezervări.** Vila nu e pe Booking și n-are un
sistem propriu, deci nu există nicăieri un loc care să știe ce e liber — în afară de gazdă.

Așa că fiecare buton „Verifică disponibilitatea" deschide un **dialog** cu patru lucruri:

```
Numele dumneavoastră     ex. Andrei Popescu
Camera                   Cameră dublă matrimonială
Sosire · Plecare         calendar
Oaspeți                  − 2 +
```

Butonul verde deschide apoi WhatsApp, pe numărul din `date/02-…`, cu mesajul deja scris:

```
Bună ziua! Aș vrea să verific disponibilitatea.
Nume: Andrei Popescu
Camera / pachetul: Cameră dublă matrimonială
Sosire: 21 august 2026
Plecare: 24 august 2026 (3 nopți)
Oaspeți: 2
```

**Mesajul rămâne editabil și nu se trimite singur** — omul apasă trimite.

Numele e opțional: lăsat gol, rândul lipsește pur și simplu. Un câmp obligatoriu în fața unui
buton de WhatsApp l-ar transforma într-un formular, adică exact în lucrul pe care îl
înlocuiește.

Când apare vreodată o pagină de Booking, se schimbă trei rânduri în
`date/10-rezervari-si-plati.md` și butoanele duc acolo, cu perioada completată. Nu e nimic de
programat.

---

## Ce NU se atinge

Folderele astea sunt „motorul" site-ului — codul care ia textele tale și construiește
paginile. Se schimbă doar de către cine se ocupă de partea tehnică.

| Folder | Ce e |
|---|---|
| `app/` | paginile propriu-zise: ce adresă are fiecare pagină |
| `components/` | bucățile refolosibile: antetul, subsolul, cardul de cameră, galeria |
| `lib/` | logica: citirea fișierelor, traducerile, SEO-ul, mesajul de WhatsApp |
| `styles/` | stilurile vizuale (culorile concrete vin din `11-culori-si-fonturi.md`) |
| `sabloane/` | felul în care e aranjată prima pagină |
| `scripts/` | comenzile de verificare și publicare |
| `public/`, `content/` | fișiere generate automat |

**[`MOTOR-MODIFICAT.md`](MOTOR-MODIFICAT.md) — de citit înainte de orice
`npm run actualizeaza-motor`.** Site-ul ăsta are trei modificări în cod, printre care chiar
câmpul de nume din WhatsApp. O actualizare neatentă le șterge tăcut.

---

## Pentru partea tehnică

```bash
npm install
```

```bash
npm run dev
```

Site-ul pornește pe `http://localhost:3000`.

Înainte de fiecare publicare:

```bash
npm run verifica
```

Verifică texte lipsă, poze inexistente, linkuri moarte, contrastul culorilor, obligațiile
legale și bugetul de performanță. Raportul spune fișierul, rândul și ce e de făcut.

**Acum trebuie să iasă cu 0 erori și 1 avertisment** — avertismentul e prețul lipsă de la
camera dublă, care e intenționat (vezi `date/04-camere.md`). Orice eroare înseamnă că s-a
stricat ceva.
