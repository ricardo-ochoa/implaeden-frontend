'use client'

import * as React from 'react'
import api from '../api'

export default function useTeethCatalog() {
  const [rows, setRows] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    let alive = true

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/teeth')
        if (!alive) return
        setRows(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!alive) return
        setError(e)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const teethMap = React.useMemo(() => {
    const m = new Map()
    ;(rows || []).forEach((r) => {
      const id = Number(r?.tooth_code)
      if (!Number.isFinite(id)) return
      m.set(id, r?.name_es || String(id))
    })
    return m
  }, [rows])

  // formato que tu card espera: [{id,label}]
  const toothOptions = React.useMemo(() => {
    return (rows || [])
      .map((r) => ({
        id: Number(r?.tooth_code),
        label: r?.name_es || String(r?.tooth_code),
      }))
      .filter((x) => Number.isFinite(x.id))
  }, [rows])

  return { rows, teethMap, toothOptions, loading, error }
}
