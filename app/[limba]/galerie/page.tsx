import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Antet, AntetSectiune, BaraLipita, Galerie, Subsol } from '@/components/sectiuni'
import { JsonLd } from '@/components/JsonLd'
import { Miscare } from '@/components/Miscare'
import { esteLimba, type Limba } from '@/lib/i18n/limbi'
import { construiesteLocales, limbiActive } from '@/lib/i18n/rute'
import type { SiteData } from '@/content/types'
import { construiesteMeta, baseUrl } from '@/lib/seo/meta'
import { schemaBreadcrumb } from '@/lib/seo/jsonld'
import { siteCurent } from '@/lib/site'

/**
 * Pagina de galerie — `Galerie extinsă: da` din `setari.md` (T05).
 *
 * DE CE EXISTĂ FIȘIERUL ĂSTA
 * --------------------------
 * Modulul exista de la început ca UN COMUTATOR, dar pagina nu. Pornit, el
 * adăuga „Galerie" în meniu (`lib/continut/index.ts`) și `/galerie` în
 * `sitemap.xml` (`lib/seo/rute.ts`) — către o rută care nu era nicăieri în
 * `app/`. Rezultatul era un 404 în meniul principal și un 404 trimis la Google,
 * exact greșeala pe care comentariul din `rute.ts` o descrie ca reparată pentru
 * `/contact` și `/facilitati/restaurant`. Singurul motiv pentru care nu s-a
 * văzut mai devreme e că niciun client livrat nu pornise modulul.
 *
 * DE UNDE VIN POZELE
 * ------------------
 * Din `poze/`, toate, nu doar cele referite dintr-un `date/*.md`. Asta e chiar
 * rostul unei galerii: pozele bune care n-au încăput în nicio secțiune. De aia
 * `siteCurent()` expune `poze`.
 *
 * TEXTUL ALTERNATIV vine din numele fișierului. Nu e o soluție de compromis:
 * regula de denumire (T70 §3) cere nume descriptive, cu cratime și fără
 * diacritice, tocmai ca `salupa-proprie-la-ponton.webp` să poată deveni
 * „Șalupa proprie la ponton". Un fișier numit `IMG_4471` produce un alt prost,
 * ceea ce e semnalul corect: se repară numele, nu se cârpește aici.
 */

/** `salupa-proprie-la-ponton.webp` → `Salupa proprie la ponton`. */
function titluDinNume(fisier: string): string {
  const fara = fisier.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  return fara ? fara.charAt(0).toUpperCase() + fara.slice(1) : 'Fotografie'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ limba: string }>
}): Promise<Metadata> {
  const { limba } = await params
  if (!esteLimba(limba)) return {}
  const { date, setari } = siteCurent(limba as Limba)
  return construiesteMeta(date, limba as Limba, {
    titlu: date.ui.galerieTitlu,
    descriere: date.ui.galerieDescriere.replace('{nume}', date.brand.name),
    cale: '/galerie',
    limbiDisponibile: limbiActive(setari.module.engleza),
  })
}

export default async function PaginaGalerie({ params }: { params: Promise<{ limba: string }> }) {
  const { limba } = await params
  if (!esteLimba(limba)) notFound()
  const lang = limba as Limba
  const { date: dateBaza, setari, poze } = siteCurent(lang)

  // Comutatorul de limbă trebuie să ducă la pagina echivalentă din
  // cealaltă limbă, nu la prima pagină (T76).
  const date: SiteData = {
    ...dateBaza,
    locales: construiesteLocales(lang, '/galerie', limbiActive(setari.module.engleza)),
  }

  // Comutatorul e sursa de adevăr: cu modulul oprit, pagina nu există deloc.
  // Altfel ar rămâne o adresă indexabilă pe care meniul n-o arată nimănui.
  if (!setari.module.galerieExtinsa) notFound()

  // Logo-ul nu e o fotografie a locației.
  const numeLogo = date.brand.logo?.replace(/^\/media\//, '')
  const imagini = poze.filter((p) => /\.(avif|webp|jpe?g|png)$/i.test(p) && p !== numeLogo)

  return (
    <>
      <Miscare />
      <JsonLd
        data={schemaBreadcrumb(
          [
            { nume: date.ui.acasa, cale: '/' },
            { nume: date.ui.navGalerie, cale: '/galerie' },
          ],
          baseUrl(),
        )}
      />
      <Antet date={date} />
      <main id="continut">
        <section className="section">
          <div className="wrap">
            <AntetSectiune
              eyebrow={date.ui.galerieTitlu}
              title={date.ui.galerieSubtitlu}
              lede={date.ui.galerieLede.replace('{nume}', date.brand.name)}
            />
            <Galerie imagini={imagini.map((p) => `/media/${p}`)} titluri={imagini.map(titluDinNume)} ui={date.ui} />
          </div>
        </section>
      </main>
      <Subsol date={date} />
      <BaraLipita date={date} />
    </>
  )
}
