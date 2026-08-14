/* ============================================================
   depth.ts — înclinarea cardurilor sub deget și sub mouse.

   Sursă: Web Tamplate/_core/js/depth.js (130 linii), portat pe TS.

   Tot restul profunzimii 3D trăiește în CSS (depth.css), legat direct
   de scroll. Aici rămâne doar ce CSS-ul nu poate face: să știe unde a
   atins omul cardul.

   Costul: un singur listener delegat per tip de eveniment și maximum o
   scriere de variabile CSS per cadru. Fără `getBoundingClientRect` în
   timpul mișcării — dreptunghiul se citește O DATĂ, la atingere.

   Ce s-a schimbat la port (T02):
   - IIFE-ul care se atașa singur pe `document` a devenit o funcție cu
     valoare de retur — funcția de curățare. În Next.js se montează O
     SINGURĂ DATĂ, din components/Miscare.tsx, niciodată per componentă.
   - SELECTOR trece pe clasele nișei.
   - MAX = 8 grade se păstrează. Comentariul din sursă are dreptate:
     peste atât arată ca un truc, nu ca adâncime.
   ============================================================ */

const SELECTOR = '.camera, .oferta, .facilitate, .spatiu-eveniment, .recenzie'
const MAX = 8

/** Pornește înclinarea. Întoarce funcția care o oprește și curăță tot. */
export function initDepthTilt(): () => void {
  if (typeof window === 'undefined') return () => {}

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  let active: HTMLElement | null = null // cardul atins acum
  let rect: DOMRect | null = null // dreptunghiul lui, citit o singură dată
  let pending: { x: number; y: number } | null = null // în așteptarea următorului cadru
  let frame = 0

  /* ------------------------------------------------------------
     Scrierea propriu-zisă, o dată per cadru.
     ------------------------------------------------------------ */
  function paint() {
    frame = 0
    if (!active || !rect || !pending) return

    // -0.5 … 0.5 față de centrul cardului
    const dx = (pending.x - rect.left) / rect.width - 0.5
    const dy = (pending.y - rect.top) / rect.height - 0.5

    // Degetul apasă în jos acolo unde atinge: axa Y se inversează.
    active.style.setProperty('--rx', `${(-dy * 2 * MAX).toFixed(2)}deg`)
    active.style.setProperty('--ry', `${(dx * 2 * MAX).toFixed(2)}deg`)
  }

  function schedule(x: number, y: number) {
    pending = { x, y }
    if (!frame) frame = requestAnimationFrame(paint)
  }

  function release() {
    if (!active) return
    active.classList.remove('is-tilting')
    active.style.removeProperty('--rx')
    active.style.removeProperty('--ry')
    active = null
    rect = null
    pending = null
  }

  function grab(el: HTMLElement, x: number, y: number) {
    if (active === el) return
    release()
    active = el
    rect = el.getBoundingClientRect()
    el.classList.add('is-tilting')
    schedule(x, y)
  }

  function cardFrom(e: Event): HTMLElement | null {
    const t = e.target
    if (!(t instanceof Element)) return null
    return t.closest<HTMLElement>(SELECTOR)
  }

  /* ------------------------------------------------------------
     Atingere — cazul principal: majoritatea traficului e mobil.
     `passive: true` peste tot: nu blocăm niciodată derularea.
     ------------------------------------------------------------ */
  const onDown = (e: PointerEvent) => {
    if (reduced.matches) return
    const card = cardFrom(e)
    if (!card) return
    grab(card, e.clientX, e.clientY)
  }

  const onMove = (e: PointerEvent) => {
    if (!active || !rect) return
    // Degetul a plecat de pe card în timpul derulării — lăsăm cardul.
    if (
      e.clientY < rect.top - 40 ||
      e.clientY > rect.bottom + 40 ||
      e.clientX < rect.left - 40 ||
      e.clientX > rect.right + 40
    ) {
      release()
      return
    }
    schedule(e.clientX, e.clientY)
  }

  const onRelease = () => release()

  document.addEventListener('pointerdown', onDown, { passive: true })
  document.addEventListener('pointermove', onMove, { passive: true })
  const RELEASE_EVENTS = ['pointerup', 'pointercancel', 'pointerleave', 'scroll'] as const
  RELEASE_EVENTS.forEach((ev) => document.addEventListener(ev, onRelease, { passive: true }))

  /* ------------------------------------------------------------
     Mouse — doar acolo unde chiar există un cursor fin. Pe touch,
     `pointer: fine` e fals, deci blocul nu rulează și nu se adaugă
     niciun listener în plus pe telefon.
     ------------------------------------------------------------ */
  const fine = window.matchMedia('(pointer: fine)').matches
  const onOver = (e: PointerEvent) => {
    if (reduced.matches) return
    const card = cardFrom(e)
    if (!card) {
      if (active) release()
      return
    }
    grab(card, e.clientX, e.clientY)
  }
  if (fine) document.addEventListener('pointerover', onOver, { passive: true })

  /* Dacă omul cere „fără mișcare" din sistem în timpul sesiunii,
     eliberăm cardul curent pe loc; CSS-ul se ocupă de rest. */
  const onPrefChange = () => {
    if (reduced.matches) release()
  }
  reduced.addEventListener('change', onPrefChange)

  return () => {
    document.removeEventListener('pointerdown', onDown)
    document.removeEventListener('pointermove', onMove)
    RELEASE_EVENTS.forEach((ev) => document.removeEventListener(ev, onRelease))
    if (fine) document.removeEventListener('pointerover', onOver)
    reduced.removeEventListener('change', onPrefChange)
    if (frame) cancelAnimationFrame(frame)
    release()
  }
}
