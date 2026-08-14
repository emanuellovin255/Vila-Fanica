import { ok } from '@/lib/admin/api'
import { iesi } from '@/lib/admin/sesiune'

export async function POST(): Promise<Response> {
  await iesi()
  return ok({ ok: true })
}
