'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function Iesire() {
  const router = useRouter()
  const [pleaca, setPleaca] = useState(false)

  return (
    <button
      type="button"
      className="p-btn p-btn--gol p-btn--mic"
      disabled={pleaca}
      onClick={async () => {
        setPleaca(true)
        await fetch('/api/admin/iesi', { method: 'POST' })
        router.replace('/admin/intra')
      }}
    >
      {pleaca ? 'Ies…' : 'Ieși'}
    </button>
  )
}
