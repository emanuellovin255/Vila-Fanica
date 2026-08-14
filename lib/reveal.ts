/* ============================================================
   reveal.ts — apariția secțiunilor la scroll.

   Sursă: partea de IntersectionObserver din
   Web Tamplate/_core/js/main.js (~80 din 587 de linii).

   Ăsta e ACUM MECANISMUL UNIC de apariție. Stratul 3D legat de scroll
   din depth.css (`animation-timeline: view()`) s-a scos la cererea
   clientului — vezi antetul din `styles/depth.css`. Rămâne un fade
   simplu, declanșat de observerul de mai jos.

   Niciodată un listener pe `scroll` (REGULI.md 11).

   REGULA CARE CONTEAZĂ (REGULI.md 12):
   starea „ascuns" se adaugă DOAR din JavaScript. Fără JS, fără
   `IntersectionObserver` sau sub `prefers-reduced-motion`, `.js-reveal`
   nu ajunge niciodată pe <html> — iar motion.css lasă totul vizibil.
   Un crawler AI care nu execută JavaScript vede pagina întreagă.
   ============================================================ */

/**
 * Grilele ai căror copii intră în cascadă, nu dintr-o bucată.
 * `[data-stagger]` e varianta deschisă: un șablon își marchează grila
 * proprie în HTML, fără să atingă lista de aici.
 */
const GRUPURI_CASCADA = [
  '[data-stagger]',
  '.camere',
  '.oferte',
  '.facilitati',
  '.spatii-evenimente',
  '.recenzii',
  '.faq-list',
] as const

/** Pornește reveal-ul. Întoarce funcția care îl oprește. */
export function initReveal(): () => void {
  if (typeof window === 'undefined') return () => {}

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced || !('IntersectionObserver' in window)) return () => {}

  const targets = document.querySelectorAll<HTMLElement>('main section')
  if (!targets.length) return () => {}

  // Abia acum declarăm că JS-ul chiar rulează. Până în clipa asta,
  // `.reveal-child` e vizibil prin `html:not(.js-reveal)` din motion.css.
  document.documentElement.classList.add('js-reveal')

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        // Se dezabonează imediat: o secțiune apare o singură dată.
        obs.unobserve(entry.target)
      })
    },
    // `threshold: 0` — declanșează la PRIMUL pixel intrat, plus 120px de
    // avans prin `rootMargin`. Vechiul `0.12` cerea 12% din suprafața
    // SECȚIUNII: pe secțiunile înalte (`.oferte` trece de 2600 px) asta
    // însemna sute de pixeli derulați peste o secțiune încă la
    // `opacity: 0` — al doilea motiv al „spațiilor goale albe".
    { threshold: 0, rootMargin: '120px 0px 120px 0px' },
  )

  targets.forEach((el) => {
    el.classList.add('reveal')

    let hasChildren = false
    GRUPURI_CASCADA.forEach((sel) => {
      el.querySelectorAll<HTMLElement>(sel).forEach((group) => {
        Array.from(group.children).forEach((child, i) => {
          child.classList.add('reveal-child')
          ;(child as HTMLElement).style.setProperty('--i', String(i))
          hasChildren = true
        })
      })
    })
    if (hasChildren) el.classList.add('reveal--children')

    // Indexul stelelor, pentru cascada din recenzii.
    el.querySelectorAll<HTMLElement>('.stars').forEach((stars) => {
      Array.from(stars.children).forEach((star, i) => {
        ;(star as HTMLElement).style.setProperty('--s', String(i))
      })
    })

    io.observe(el)
  })

  return () => {
    io.disconnect()
    document.documentElement.classList.remove('js-reveal')
  }
}

/**
 * Antetul se micșorează după ce a trecut de sentinelă.
 * IntersectionObserver pe un element de 1px, nu listener pe `scroll`.
 * Sentinela e pusă de componenta `Antet` (T06), imediat sub antet.
 */
export function initHeaderScroll(): () => void {
  if (typeof window === 'undefined') return () => {}

  const header = document.querySelector<HTMLElement>('[data-antet]')
  const sentinel = document.querySelector<HTMLElement>('[data-antet-sentinela]')
  if (!header || !sentinel || !('IntersectionObserver' in window)) return () => {}

  const io = new IntersectionObserver(
    (entries) => header.classList.toggle('is-scrolled', !entries[0].isIntersecting),
    { threshold: 0 },
  )
  io.observe(sentinel)

  return () => io.disconnect()
}
