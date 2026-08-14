import { notFound, redirect } from 'next/navigation'

import { Editor } from '@/components/admin/Editor'
import { fisierPanou } from '@/lib/admin/schema'
import { areSesiune } from '@/lib/admin/sesiune'

export default async function PaginaText({ params }: { params: Promise<{ fisier: string }> }) {
  if (!(await areSesiune())) redirect('/admin/intra')

  const { fisier } = await params
  const schema = fisierPanou(fisier)
  if (!schema) notFound()

  return <Editor schema={schema} />
}
