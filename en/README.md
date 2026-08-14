# Folderul `en/` — versiunea în engleză a site-ului

Tot ce e aici e **traducerea** fișierelor din [`date/`](../date/). Aceleași numere,
aceleași nume, aceeași structură — doar textul e în engleză.

Se vede pe adresele care încep cu `/en`: `/en`, `/en/rooms`, `/en/offers`, `/en/area`,
`/en/contact`.

---

## Regula de aur

**Un fișier din `en/` trebuie să aibă exact aceleași `##` și aceleași nume de câmpuri
ca perechea lui din `date/`.** Se traduce doar ce e *după* două puncte și textul liber.

```
date/04-camere.md                    en/04-camere.md
─────────────────                    ────────────────
## Cameră dublă twin                 ## Twin Room
Preț de la: 270                      Preț de la: 270
Persoane: 2 persoane                 Persoane: 2 guests
Poze: camera-twin-...webp            Poze: camera-twin-...webp
```

Observă: `Preț de la:` și `Poze:` rămân scrise **în română**, cu aceleași valori.
Numele câmpului e o etichetă tehnică, nu text de pe site. Pozele sunt aceleași fișiere.

---

## Ce se traduce și ce nu

| Se traduce în `en/` | Rămâne mereu din `date/` |
|---|---|
| `01` — sloganul și descrierea scurtă | numele pensiunii (e nume propriu) |
| `03` — toate textele primei pagini | `02` — telefon, e-mail, adresă, GPS, program |
| `04` — numele și descrierile camerelor | `11` — culorile și fonturile |
| `05` — facilitățile | `12` — datele firmei, CUI, link-urile ANPC |
| `06` — pachetele și excursiile | prețurile și numele pozelor |
| `08` — recenziile | |
| `09` — întrebările frecvente | |
| `13` — atracțiile din Deltă | |
| `14` — pagina de contact | |
| `10` — doar textele butoanelor (blocul `## Etichete`) | `10` — tipul rezervării și sistemul folosit |

De asta folderul `en/` **nu are** fișierele `02`, `11` și `12`: acelea nu se traduc
niciodată, se citesc mereu din `date/`.

### Excepția de la `10-rezervari-si-plati.md`

Fișierul există în `en/` din două motive:

- blocul `## Etichete` conține text vizibil („Sosire", „Plecare", „Oaspeți", textul
  butonului) — fără el, un vizitator englez vedea butoane în română;
- dacă scrii un `Adresă:` propriu, el are prioritate. Booking servește aceeași
  proprietate pe adrese diferite pentru fiecare limbă (`...ro.html` față de
  `...en-gb.html`), iar un oaspete englez trimis pe varianta românească vede pagina
  în română.

---

## Dacă lipsește un fișier din `en/`

Secțiunea aceea **nu apare deloc pe `/en`**. Nu se afișează varianta românească în
locul ei și nu apare nicio eroare — pur și simplu lipsește din pagina englezească.

Deci: dacă adaugi o cameră nouă în `date/04-camere.md` și uiți să o adaugi și în
`en/04-camere.md`, camera aceea nu va exista pe `/en/rooms`.

**Excepție:** numele pensiunii se ia din română dacă `en/01-...` nu îl repetă.

---

## Când modifici ceva, modifici în două locuri

Ordinea recomandată:

1. Faci schimbarea în `date/`.
2. Deschizi fișierul cu **același număr** din `en/`.
3. Faci aceeași schimbare, cu textul tradus.

Verificare rapidă: numărul de `##` dintr-un fișier `en/` ar trebui să fie același cu
cel din perechea lui din `date/`.

---

## Cum oprești engleza cu totul

În [`setari.md`](../setari.md):

```
Engleză: nu
```

Linkul de schimbare a limbii dispare din antet și adresele `/en` nu mai există.
Fișierele de aici rămân pe loc, nefolosite, până pui `da` la loc.

---

Regulile de format (`##`, câmpuri, liste, prețuri, poze) sunt aceleași ca la română și
sunt explicate în [`date/README.md`](../date/README.md).
