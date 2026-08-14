import { AntetSectiune } from './AntetSectiune'
import type { SiteData } from '@/content/types'

/**
 * „Povestea noastră" — primul bloc de text de sub hero.
 *
 * Fără poză, fără buline, fără buton: e locul unde gazda spune cine e,
 * iar orice element de interfață pus lângă text ar concura cu el. Poza
 * hero-ului e imediat deasupra, deci încă una aici n-ar adăuga nimic.
 *
 * Textul e limitat la o coloană de citit (`.poveste-text`, ~68ch): la
 * lățimea plină a paginii un rând de proză trece de 120 de caractere,
 * unde ochiul pierde începutul rândului următor.
 *
 * Server Component. Fără paragrafe, nu se randează (REGULI.md 3).
 */
export function Poveste({ date }: { date: SiteData }) {
  const { story } = date
  if (!story?.paragraphs.length) return null

  return (
    <section className="poveste" id="poveste">
      <div className="wrap">
        <AntetSectiune eyebrow={story.eyebrow} title={story.title} />
        <div className="poveste-text">
          {story.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
