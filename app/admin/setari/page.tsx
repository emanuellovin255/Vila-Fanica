import { redirect } from 'next/navigation'

import { EditorSetari } from '@/components/admin/EditorSetari'
import { areSesiune } from '@/lib/admin/sesiune'

export default async function PaginaSetari() {
  if (!(await areSesiune())) redirect('/admin/intra')
  return <EditorSetari />
}
