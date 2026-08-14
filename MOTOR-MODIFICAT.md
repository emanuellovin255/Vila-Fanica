# Modificări de motor — Vila Fănică

Motorul (`app/`, `components/`, `lib/`, `styles/`, `scripts/`, `content/`) e cod comun,
propagat între site-uri cu `npm run actualizeaza-motor`. Ce e scris mai jos **iese din
tiparul ăla**: sunt locuri în care codul comun a fost atins pentru site-ul ăsta.

> **ATENȚIE — un `npm run actualizeaza-motor` neatent le șterge pe toate.** Nu cade nimic
> zgomotos: site-ul se rebuildează, dar pierde câmpul de nume din WhatsApp și cade tăcut pe
> șablonul 2, cu alte fonturi și altă paletă. Înainte de orice actualizare de motor, se
> citește fișierul ăsta și se reaplică punctele **1–3**.

Punctele 4 și 5 sunt moștenite de la Casa Irlandeză, de unde a fost copiat motorul ăsta.

---

## 1 · Numele oaspetelui în mesajul de WhatsApp

**Cerut explicit de client:** butonul de programare trebuie să ducă în WhatsApp cu **data,
camera și numele** deja scrise. Motorul avea primele două; numele lipsea.

Patru fișiere, atinse minimal:

| Fișier | Ce s-a adăugat |
|---|---|
| `lib/i18n/etichete.ts` | `waNume`, `numeleTau`, `numeleTauExemplu` — în tip, în RO și în EN |
| `lib/whatsapp.ts` | `CerereRezervare.nume?`; `mesajRezervare()` îl scrie imediat după salut |
| `components/sectiuni/ModalRezervare.tsx` | starea `nume`, un `<input type="text">` deasupra selectorului de cameră, `nume` trecut în `urlWhatsApp(...)` |
| `styles/base.css` | regula `.mdl-camera select` a devenit `.mdl-camera select, .mdl-camera input[type='text']`, plus `appearance: none` și culoarea textului-fantomă din câmp |

Mesajul rezultat:

```
Bună ziua! Aș vrea să verific disponibilitatea.
Nume: Andrei Popescu
Camera / pachetul: Cameră dublă matrimonială
Sosire: 21 august 2026
Plecare: 24 august 2026 (3 nopți)
Oaspeți: 2
```

**Numele stă primul, imediat după salut**, fiindcă asta e ordinea în care se prezintă un om
când scrie cuiva: întâi cine e, apoi ce vrea. Gazda vede cu cine vorbește înainte de orice
detaliu.

**Câmpul e OPȚIONAL, și asta e o decizie, nu o scăpare.** Gol, rândul lipsește pur și simplu
din mesaj — exact ca orice câmp gol din motor. Un câmp obligatoriu în fața unui buton de
WhatsApp îl transformă într-un formular, adică exact în lucrul pe care butonul îl
înlocuiește. Cine vrea să scrie doar „e liber în weekend?" trebuie să poată.

**Ar trebui dusă în motor**, nu reaplicată la fiecare client. E o îmbunătățire care nu
strică nimic nicăieri: la un client care nu vrea câmpul, el rămâne gol și mesajul iese ca
înainte.

---

## 2 · Șablonul 6 „Irlandez" — venit odată cu motorul

Motorul ăsta e copiat din `casa-irlandeza`, deci **vine deja cu șablonul 6**:
`sabloane/06-irlandez/` (cinci fișiere), plus dispecerul din `app/[limba]/page.tsx`, importul
de skin din `app/[limba]/layout.tsx`, tipul lărgit în `lib/continut/setari.ts` și perechea de
fonturi „irlandez" din `scripts/lib/fonts.ts` și `content/types.ts`.

**Nu e nimic de reaplicat aici, dar e de știut**: șablonul 6 nu e în motorul de bază. Un
`actualizeaza-motor` care aduce codul dintr-un motor mai vechi îl șterge, iar `Șablon: 6` din
`setari.md` e respins tăcut. Site-ul cade pe șablonul 2 — fundal alb, carduri rotunjite,
facilitățile ca niște carduri în loc de cercuri.

**Numele „irlandez" e doar numele folderului.** Șablonul nu conține nimic irlandez: e o
structură și o tipografie. Culorile vin în întregime din `date/11-culori-si-fonturi.md`, unde
sunt albastrul apei termale și cărămiziul fațadei. La fel, `Caracter: irlandez` din același
fișier e numele tehnic al perechii Anton + Abhaya Libre, nu o descriere a locului.

---

## 3 · Promisiunea de viteză scoasă din blocul de WhatsApp

**`components/sectiuni/BaraWhatsApp.tsx`** — paragraful de sub titlu.

Varianta din motor scria:

> „Alege perioada și câți sunteți, iar noi îți răspundem pe WhatsApp cu ce e liber și cu
> prețul exact. **Răspundem în aceeași zi.**"

Ultima propoziție e o **promisiune de viteză hardcodată în cod**, pe care n-a făcut-o nicio
gazdă și pe care site-ul n-are cum s-o țină. La Vila Fănică nu există nicio sursă care să
spună cât de repede se răspunde. O promisiune de viteză nerespectată e prima linie dintr-o
recenzie proastă — și e cu atât mai rea cu cât nici clientul nu știe că site-ul o face în
numele lui.

Textul nou descrie **ce face butonul**, nu cât de repede răspunde omul:

> „Spuneți-ne numele, perioada și câți sunteți. Butonul deschide o conversație pe WhatsApp cu
> totul deja scris — nu trebuie decât să apăsați trimite."

**Asta e o eroare de motor reparată, nu o adaptare de client**, și ar trebui dusă în motor:
afectează orice client fără engine de rezervări. Ideal, propoziția ar veni dintr-un câmp din
`date/10-rezervari-si-plati.md`, ca fiecare gazdă să scrie ce poate ține.

---

## 4 · Bug de motor reparat scoped, moștenit de la Casa Irlandeză

**`styles/base.css`, regula `.hero-inner`** are:

```css
.hero-inner { width: 100%; padding: 120px 0 40px; }
```

Scurtătura `padding` **anulează `padding-inline: var(--container-pad)` de pe `.wrap`**, cu
care elementul e mereu combinat (`class="wrap hero-inner …"`). Rezultatul: titlul și
subtitlul din prima secțiune ating marginile ecranului, cel mai vizibil pe telefon.

**Bug-ul e al motorului și afectează toate cele șase șabloane.** E reparat **scoped**, în
`sabloane/06-irlandez/skin.css`, cu `padding-block` + `padding-inline` în loc de scurtătură.
De făcut la o revizie de motor: aceeași corecție în `base.css`, apoi scoasă din skin.

---

## 5 · Două corecții de motor care merg cu el

Amândouă sunt erori reparate în motorul Casei Irlandeze și copiate odată cu el. Nu sunt
adaptări pentru clientul ăsta și **ar trebui duse în motorul de bază**, nu reaplicate:

**`scripts/verifica.ts`, `continutDate`** — iese devreme din verificarea „poze nefolosite"
când modulul de galerie e pornit (`if (setari.module.galerieExtinsa) return`). Fără asta,
verificatorul raporta drept „greutate inutilă" chiar pozele din care e făcută pagina
`/galerie`. Aici, cu unsprezece poze și galeria pornită, ar fi dat unsprezece note false.

**`lib/seo/rute.ts` (`ruteCuLimbi`) și `app/sitemap.ts`** — rutele englezești se construiesc
din datele încărcate în limba cerută, nu din cele românești prefixate cu `/en`. Fără
corecție, sitemap-ul conținea adrese `/en/camere/<slug-românesc>` care dădeau 404, în timp ce
paginile reale erau la `/en/rooms/<slug-englezesc>`.

> La Vila Fănică a doua corecție nu se vede: **modulul de engleză e oprit** în `setari.md`,
> deci nu se generează nicio rută `/en`. Devine relevantă în clipa în care se pune „da".

---

## Cum se verifică că totul e la locul lui, după o actualizare de motor

```bash
npm run verifica
```

Trebuie să iasă cu erorile **așteptate** — nr. registrul comerțului și sediul social din
`date/12-…` — plus avertismentul de preț lipsă la camera dublă, care e intenționat
(`date/04-camere.md`). Orice altceva înseamnă că s-a pierdut ceva de mai sus.

Trei semne rapide că s-a stricat ceva:

| Semnul | Ce s-a pierdut |
|---|---|
| Dialogul de rezervare n-are câmp de nume | punctul 1 |
| Prima pagină n-are titlu în majuscule, fundalul e alb, facilitățile sunt carduri | punctul 2 |
| Sub prima secțiune scrie iar „Răspundem în aceeași zi" | punctul 3 |
