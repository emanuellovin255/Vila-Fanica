# Culori și fonturi

<!-- ────────────────────────────────────────────────────────────────────────

     CE E AICI:  culorile și fonturile întregului site.

     UNDE SE VEDE
       Peste tot. O culoare schimbată aici se schimbă pe toate paginile
       deodată — butoane, titluri, fundaluri, linii.

     CUM SE SCRIU CULORILE
       Ca un cod care începe cu # și are șase caractere: #0E5A70.
       Codul se ia din orice selector de culori (Google „color picker").
       Scris greșit sau lăsat gol, se folosește culoarea de rezervă.

     ATENȚIE LA CONTRAST
       „Text pe culoarea principală" trebuie să se citească peste
       „Culoare principală". Alb pe albastru închis se citește; alb pe
       bleu deschis, nu. E și o cerință de accesibilitate, nu doar o
       chestiune de gust.

     Fișierul ăsta NU se traduce: pe /en sunt aceleași culori.
     ──────────────────────────────────────────────────────────────────────── -->

<!--
  ══ DE UNDE VINE PALETA ══

  Nu dintr-o siglă — Vila Fănică n-are una vectorială. Vine din trei lucruri care se văd în
  fotografiile lor:

    · ALBASTRUL APEI de la ștrandul Apollo, de peste drum. E în patru din cele unsprezece
      fotografii, și e motivul pentru care oamenii vin la Băile Felix.
    · CĂRĂMIZIUL FAȚADEI — tencuiala portocaliu-arsă dintre balcoane, cea care ține toată
      clădirea în `poze/balcoane-cu-muscate-vara.webp` și în cadrul de seară.
    · CREMUL panourilor de la intrare și al ramelor, care nu e alb.

  ══ DE CE ALBASTRUL E PRINCIPALA ȘI CĂRĂMIZIUL E ACCENTUL, ȘI NU INVERS ══

  Prima variantă a fost invers — cărămiziul e culoarea clădirii, deci pare alegerea evidentă
  pentru butoane. Nu merge, din două motive.

  Primul e vizual: poza mare de sus E clădirea cărămizie. Un buton cărămiziu peste o
  fotografie cărămizie dispare în ea. Butonul principal trebuie să fie lucrul care se vede
  primul pe ecran, iar aici e singurul drum către o rezervare.

  Al doilea e ce vinde locul. Nimeni nu caută „vilă portocalie în Băile Felix". Se caută apă
  termală, și ștrandul e peste drum — argumentul întregului site. Albastrul îl spune înainte
  să se citească un cuvânt.

  Cărămiziul rămâne accentul: etichetele de secțiune, cifrele, linkurile. Apare des, în doze
  mici, și leagă pagina de clădire.

  ══ DE CE ATENȚIONAREA E OXBLOOD ȘI NU ROȘU ══

  #9C3A2B, nu un roșu de eroare. La o cazare, culoarea asta marchează „au mai rămas 2 camere",
  nu o defecțiune de sistem. Roșul aprins pe un site de cazare arată ca un mesaj de eroare și
  sperie exact omul care era gata să rezerve.

  ══ CONTRASTELE, MĂSURATE PE FUNDALUL PAGINII (#FBF7F1), NU ESTIMATE ══

    text principal      16,7:1      text secundar        9,8:1
    text estompat        5,7:1      accent (ca text)     6,0:1
    alb pe principal     7,7:1      alb pe princ. deschis 5,5:1
    atenționare          6,4:1      confirmare           4,7:1
    accent deschis pe principal      5,0:1

  Toate peste 4,5:1 (WCAG AA). `npm run verifica` le remăsoară la fiecare rulare — dacă cineva
  schimbă o culoare aici și scade sub prag, raportul o spune, cu rândul cu tot.
-->

## Culori

Culoare principală: #0E5A70
Culoare principală, variantă deschisă: #157287
Text pe culoarea principală: #FFFFFF

Culoare de accent: #9C4520
Culoare de accent, variantă deschisă: #F7C89A

Fundal pagină: #FBF7F1
Fundal carduri: #FFFFFF
Fundal secțiuni alternante: #F3EBE1

Text principal: #1E1613
Text secundar: #4A3D37
Text estompat: #6E5F58
Linii și margini: #E2D5C7

Culoare de confirmare: #2E7D5B
Culoare de atenționare: #9C3A2B

<!--
  DE CE ACCENTUL E CĂRĂMIZIU ÎNCHIS (#9C4520) ȘI NU PORTOCALIU

  Accentul trebuie să fie lizibil CA TEXT pe crem, nu doar frumos ca fundal de buton — îl
  folosesc etichetele de secțiune și cifrele. Portocaliul adevărat al fațadei (#D9722F) dă
  3,1:1 pe crem, adică sub prag. Cărămiziul închis dă 6,0:1 și rămâne aceeași culoare, doar
  mai adâncă.

  VARIANTA DESCHISĂ (#F7C89A) e treapta pentru FUNDALURI ÎNCHISE — pe albastrul de la subsol
  și din secțiunile închise, unde cea închisă s-ar stinge complet. Acolo dă 5,0:1.
  Nu se folosește niciodată pe crem: acolo are 1,4:1, adică e invizibilă.

  TEXTELE SUNT CALDE, NU NEUTRE. #1E1613 nu e negru și #4A3D37 nu e gri — amândouă au un
  pic de brun în ele. Pe un fundal crem, un gri neutru arată murdar; unul cald arată ca
  cerneală pe hârtie. E diferența care face fundalul să pară ales, nu îngălbenit.
-->

## Fonturi

Font pentru titluri: Anton
Font pentru text: Abhaya Libre
Rotunjire colțuri: 4px
Caracter: irlandez

<!--
  Perechea de fonturi e cea a șablonului 6 și rămâne neatinsă — s-a cerut explicit stilul
  Casei Irlandeze, iar titlurile de afiș în majuscule sunt chiar semnătura lui.

  ANTON pentru titluri: un grotesc greu și îngust, folosit numai în MAJUSCULE și numai la corp
  mare. La corp mic e ilegibil, deci nu se folosește niciodată sub 24px: acolo intră fontul de
  text.

  ABHAYA LIBRE pentru text: un serif cu duct umanist, cu o talie ceva mai mare decât a
  serifurilor clasice, deci se citește bine și la 16px pe telefon.

  ROTUNJIRE 4px, aproape colț drept. Cardurile rotunjite la 14px fac un site „de aplicație".
  Aici totul e panou, plăcuță și afiș lipit — colțul drept e parte din stil.

  ⚠ „Caracter: irlandez" E NUMELE TEHNIC AL PERECHII, nu o descriere a locului. Perechea e
  definită în `scripts/lib/fonts.ts` și fixează `Anton:wght@400` — Anton are doar greutatea
  400, iar specificația construită automat ar fi cerut Google Fonts o greutate care nu există,
  cu 400 Bad Request și build căzut. Numele n-are legătură cu Vila Fănică; schimbat, se pierde
  perechea și site-ul cade tăcut pe „warm" (Newsreader + Work Sans).

  Ambele fonturi expun `latin-ext`, deci Ă ă Â â Î î Ș ș Ț ț se randează corect — verificat pe
  răspunsul Google, nu presupus. Contează aici: numele locului se scrie „Fănică".

  Fonturile se descarcă o singură dată, la primul `npm run dev`, și se comit în
  `public/fonts/`. Niciun request către Google la runtime — și nicio problemă de GDPR cu IP-ul
  vizitatorului plecat la Google înainte de acceptul de cookies.
-->
