# Toate paginile site-ului

**Zece adrese**, plus trei fișiere tehnice. Lista e generată din `sitemap.xml`, deci e exact
ce se publică: fiecare adresă de mai jos răspunde cu 200, iar `canonical`-ul paginii coincide
cu adresa din sitemap.

Site-ul e într-o singură limbă, româna, deci nu există prefix și nu există `hreflang`.
Engleza e scrisă și gata, dar oprită — vezi mai jos.

---

## Paginile de conținut

| Pagina | Adresa | De unde vine |
|---|---|---|
| **Prima pagină** | `/` | `03-pagina-principala.md` + secțiunile din `setari.md` |
| **Camere** | `/camere` | `04-camere.md` |
| **Camera dublă matrimonială** | `/camere/camera-dubla-matrimoniala` | `04-camere.md`, blocul camerei |
| **Zona** | `/zona` | `13-zona-si-atractii.md` |
| **Galerie** | `/galerie` | toate cele 11 poze din `poze/` |
| **Contact** | `/contact` | `14-pagina-de-contact.md` + `02-…` |

> **O SINGURĂ PAGINĂ DE CAMERĂ, și e o lipsă, nu o alegere de design.** Apartamentul există —
> apare la tarife pe fișa de pe agregator — dar n-avem nicio fotografie a lui și nici o
> descriere. Vezi nota din [`date/04-camere.md`](date/04-camere.md).
> Când vin pozele, se copiază blocul camerei duble, iar `/camere/apartament` apare singură.

> **Slug-ul unei camere vine din numele ei.** „Cameră dublă matrimonială" →
> `camera-dubla-matrimoniala`. Dacă redenumești camera, se schimbă și adresa ei, iar vechea
> adresă începe să dea 404. La o cameră deja indexată de Google, adaugă un redirect în
> [`redirecturi.ts`](redirecturi.ts).

---

## Paginile legale

| Pagina | Adresa |
|---|---|
| Termeni și condiții | `/termeni` |
| Politica de confidențialitate | `/politica-confidentialitate` |
| Politica de cookies | `/politica-cookies` |
| Politica de anulare | `/politica-anulare` |

Se generează automat, pe legislația RO, din `12-firma-si-documente-legale.md` și din ce e
pornit în `setari.md`. Nu se scriu de mână.

**Atenție — `/politica-anulare` e generică deocamdată:** câmpul „Anulare:" din `12-…` e gol, fiindcă
nimeni n-a scris încă politica reală. La o vilă cu rezervări directe, aia e chiar pagina pe
care o caută cineva acolo. Vezi nota din fișier.

---

## Pagini care există în cod, dar sunt oprite

Nu se generează deloc — nici pagina, nici linkul din meniu, nici intrarea din sitemap.
Se aprind dintr-un singur cuvânt în `setari.md`.

| Pagina | Adresa ar fi | Se aprinde cu | De ce e oprită |
|---|---|---|---|
| **Tot site-ul în engleză** | `/en`, `/en/rooms`, `/en/area`… | `Engleză: da` | nu știm dacă cineva de la vilă răspunde în engleză — vezi `setari.md` |
| **Oferte** | `/oferte` | `Oferte: da` | nu există niciun pachet — vezi `06-…` |
| **Meniu restaurant** | `/meniu` | `Meniu restaurant: da` | vila n-are restaurant — vezi `07-…` |
| **Evenimente** | `/evenimente` | `Spații de evenimente: da` | nu există informații despre capacități |

Pagina **Mulțumim** (`/multumim`) apare doar după trimiterea formularului de contact, deci nu
e în sitemap.

**Fișierele din `en/` sunt scrise, complet, toate zece.** Se pornesc schimbând `Engleză: nu`
în `Engleză: da`. Atunci apar încă zece adrese, cu slug-uri traduse (`/en/rooms`, nu
`/en/camere`), plus `hreflang` și comutatorul de limbă din antet. Mesajul de WhatsApp iese și
el în engleză, cu numele lunii tradus.

---

## Fișiere tehnice

| Adresa | Ce e |
|---|---|
| `/sitemap.xml` | cele 10 adrese, generate din rutele reale |
| `/robots.txt` | ce are voie să indexeze un crawler |
| `/llms.txt` | rezumatul site-ului pentru asistenții AI |
| `/admin` | panoul de editare din browser — cere `ADMIN_PAROLA` și cheile de GitHub din `.env.example`; fără ele, pagina cere o parolă pe care n-o acceptă nimeni |

---

## Cum verifici că lista asta e încă adevărată

```bash
npm run dev
```

```bash
curl -s http://localhost:3000/sitemap.xml | grep -oE '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' | sed 's|http://localhost:3000||' | while read u; do echo "$(curl -s -o /dev/null -w '%{http_code}' localhost:3000$u) $u"; done
```

Fiecare adresă trebuie să răspundă cu 200. `npm run verifica` prinde oricum linkurile moarte
dintre pagini, dar nu și o adresă listată în sitemap care a rămas fără pagină — de asta
verificarea de mai sus merită făcută după orice redenumire de cameră.
