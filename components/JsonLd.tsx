/**
 * Emite un bloc JSON-LD în HTML.
 *
 * Server Component. Datele structurate trebuie să fie în HTML-ul
 * livrat, nu injectate din JavaScript (T07, REGULI.md 12): Google le
 * citește oricum, dar crawlerele AI frecvent nu execută JS.
 *
 * `dangerouslySetInnerHTML` e sigur aici: conținutul e un obiect
 * serializat cu `JSON.stringify`, nu text de la utilizator. Închidem
 * totuși `</script>` (singura secvență care ar putea sparge blocul),
 * ca o descriere care conține din greșeală asta să nu rupă pagina.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] | null }) {
  if (!data) return null
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
