# Folderul `poze/` — toate imaginile site-ului

Aici stau **toate** pozele, într-un singur loc, fără subfoldere. Le pui o dată aici și
apoi le chemi după nume, din orice fișier din [`date/`](../date/):

```
Poza: pescarusi-in-zbor-delta.webp
```

Nu se scrie nicio cale, niciun `/`, niciun `poze/` — doar numele fișierului, exact cum
apare în listă, **cu tot cu extensie**.

---

## Cum adaugi o poză nouă, direct din GitHub

1. Intri în folderul `poze` de pe pagina repo-ului.
2. Sus, la dreapta: **Add file** → **Upload files**.
3. Tragi poza acolo (sau o alegi de pe calculator).
4. Jos, la **Commit changes**, apeși butonul verde.
5. Te duci în fișierul unde vrei să apară poza (de exemplu `date/04-camere.md`) și îi
   scrii numele la câmpul potrivit: `Poza:` sau `Poze:`.

**Doar încărcarea nu e suficientă.** O poză pusă în folder, dar nechemată din niciun
fișier, nu apare nicăieri pe site — stă degeaba și îngreunează repo-ul.

## Cum înlocuiești o poză existentă

Cel mai simplu: **încarci noua poză cu exact același nume**. GitHub o suprascrie, iar
toate locurile care o foloseau arată automat poza nouă. Nu mai ai nimic de schimbat în
`date/`.

Dacă îi dai alt nume, trebuie să schimbi numele și în fiecare fișier care o folosea.

---

## Reguli pentru fișiere

### Formatul

| Extensie | Când |
|---|---|
| **`.webp`** | formatul folosit peste tot aici. Se încarcă rapid și arată bine |
| `.jpg`, `.jpeg` | merg, dar sunt mai grele. Site-ul le convertește la afișare |
| `.png` | doar pentru logo sau imagini cu fundal transparent |
| `.svg` | pentru logo, dacă există varianta vectorială |
| `.avif`, `.gif` | acceptate, rar necesare |

Pentru clipuri video: `.mp4`, `.webm` sau `.mov`. Un clip are nevoie **și** de o poză
de copertă (câmpul `Poster:` sau `Poster video:`) — fără ea, clipul nu se afișează.

### Numele fișierului

Numele bun descrie ce se vede în poză, în română, cu cratime:

| Nume | Verdict |
|---|---|
| `camera-twin-cuverturi-turcoaz.webp` | bun |
| `foisor-cu-acoperis-de-stuf.webp` | bun |
| `IMG_20240712_154233.jpg` | greșit — nu spune nimic despre poză |
| `Camera Twin (2).webp` | greșit — spații, litere mari, paranteze |
| `cameră-dublă.webp` | greșit — diacritice |

Reguli: **litere mici**, **cratime în loc de spații**, **fără diacritice** (ă, î, ș, ț),
fără paranteze și fără caractere speciale.

Motivul e practic: numele ajunge în adresa imaginii pe internet, iar un `ș` sau un
spațiu acolo devine o înșiruire ilizibilă de simboluri.

Numele descriptiv ajută și la Google Images — de acolo vine o parte din trafic pentru
o pensiune din Deltă.

### Dimensiunea

- **Lățime**: 1600–2000 px pentru pozele mari (prima secțiune, galerie), 1200 px e
  suficient pentru carduri de cameră.
- **Greutate**: sub 300 KB per poză, ideal. Pozele de aici sunt între 60 și 650 KB.
- Site-ul le redimensionează automat pentru telefon, deci nu trebuie să faci tu
  variante mici. Dar dintr-o poză mică nu poate face una mare: sub 1200 px lățime se
  vede neclar pe ecrane bune.

---

## Unde se folosesc pozele

| Câmpul | În ce fișier | Ce face |
|---|---|---|
| `Logo:` | `01-nume-logo-si-descriere.md` | logo-ul din antet și favicon-ul |
| `Poza:` | `03-pagina-principala.md` → `## Prima secțiune` | poza mare de sus |
| `Poza:` | `03-pagina-principala.md` → fiecare `###` din feature-uri | pozele blocurilor alternante |
| `Poze:` | `04-camere.md` | pozele unei camere. **Prima e cea de pe card** |
| `Poza:` | `06-oferte-si-excursii.md` | poza unui pachet sau a unei excursii |
| `Poza:` | `13-zona-si-atractii.md` | poza unei atracții |
| `Video:` + `Poster:` | `03-pagina-principala.md` | clipul de prezentare |
| `Video:` + `Poster video:` | `04-camere.md` | clipul unei camere |

Pagina `/galerie` se face singură, din toate pozele folosite în fișierele de mai sus.
Nu are un fișier propriu.

---

## Ce se întâmplă cu pozele după ce le pui aici

Nu trebuie să faci nimic manual. La fiecare pornire sau publicare, pozele sunt copiate
automat în `public/media/`, de unde le servește site-ul, și li se generează variantele
pentru telefon. Folderul `public/media/` se reface singur — nu se editează.

---

## Verificare

```bash
npm run verifica
```

Îți spune:

- **eroare** — o poză cerută dintr-un fișier `date/` nu există aici (și care e cel mai
  apropiat nume, dacă ai greșit doar extensia);
- **notă** — o poză stă aici, dar nu e folosită nicăieri.

---

## Fișierul `_manifest.json`

Notițe tehnice despre fiecare poză: de unde a fost preluată de pe site-ul vechi, ce
dimensiune are, pe ce pagini apare. Se generează automat. Nu e nevoie să-l deschizi și
nu se editează manual.
