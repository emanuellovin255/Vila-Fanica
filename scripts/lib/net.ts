/** Fetching helpers shared by the extractor and the auditor. */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export interface Fetched {
  url: string
  status: number
  headers: Headers
  body: string
  bytes: number
}

export async function fetchPage(url: string, timeoutMs = 30_000): Promise<Fetched> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      signal: ctl.signal,
      redirect: 'follow',
    })
    const body = await res.text()
    return {
      url: res.url || url,
      status: res.status,
      headers: res.headers,
      body,
      bytes: Buffer.byteLength(body),
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchBinary(url: string, timeoutMs = 45_000): Promise<Buffer | null> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctl.signal })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** HEAD first — a lot of hosts refuse it, so fall back to a ranged GET. */
export async function probeSize(
  url: string
): Promise<{ bytes: number; type: string } | null> {
  try {
    const head = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } })
    const len = head.headers.get('content-length')
    if (len) {
      return { bytes: Number(len), type: head.headers.get('content-type') ?? '' }
    }
    const ranged = await fetch(url, {
      headers: { 'User-Agent': UA, Range: 'bytes=0-0' },
    })
    const cr = ranged.headers.get('content-range')
    const total = cr?.split('/')[1]
    if (total && total !== '*') {
      return { bytes: Number(total), type: ranged.headers.get('content-type') ?? '' }
    }
  } catch {
    /* unreachable asset — the caller treats null as "unknown", not "zero" */
  }
  return null
}

export function absolute(href: string, base: string): string | null {
  try {
    return new URL(href, base).href
  } catch {
    return null
  }
}

export function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host
  } catch {
    return false
  }
}

/** Small concurrency limiter — polite to the source host, still fast. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      out[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return out
}
