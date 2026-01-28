'use client'

import { useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import TreatmentCard from './TreatmentCard'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const norm = (v) => String(v || '').toLowerCase().trim()

const getStatus = (t) => norm(t?.status || t?.group_status || 'por iniciar')

const getDateMs = (t) => {
  const v = t?.isGroup ? t?.group_start_date : t?.service_date
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

const matchesSearch = (t, q) => {
  if (!q) return true
  const hay = []

  hay.push(t?.title)
  hay.push(t?.service_name)

  if (Array.isArray(t?.items)) {
    for (const it of t.items) {
      hay.push(it?.service_name)
      hay.push(it?.name)
    }
  }

  const text = hay.filter(Boolean).join(' | ').toLowerCase()
  return text.includes(q)
}

export default function TreatmentsTimelineList({
  treatments = [],
  title = 'Lista de tratamientos',
  className,
  onSelect,
}) {
  // UI state
  const [tab, setTab] = useState('all') // all | progress | done
  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState(null)

  const filtered = useMemo(() => {
    const query = norm(q)

    let list = Array.isArray(treatments) ? [...treatments] : []

    // ordenar por fecha desc (más reciente primero)
    list.sort((a, b) => getDateMs(b) - getDateMs(a))

    // filtro por status
    if (tab !== 'all') {
      list = list.filter((t) => {
        const s = getStatus(t)
        if (tab === 'progress') return s.includes('proceso') || s.includes('progreso')
        if (tab === 'done') return s.includes('termin') || s.includes('final') || s.includes('complet')
        return true
      })
    }

    // buscador
    list = list.filter((t) => matchesSearch(t, query))

    return list
  }, [treatments, tab, q])

  return (
    <section
      className={cx(
        'rounded-xl bg-muted/20 p-4',
        'flex flex-col gap-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-full p-1">
            <TabsTrigger value="all" className="rounded-full px-4">
              Todos
            </TabsTrigger>
            <TabsTrigger value="progress" className="rounded-full px-4">
              En proceso
            </TabsTrigger>
            <TabsTrigger value="done" className="rounded-full px-4">
              Terminados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar"
          className="h-12 rounded-full pl-12 pr-12 bg-background"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Timeline list (scroll) */}
      <div className="relative flex-1 min-h-0 overflow-y-auto pr-2">
        {/* Línea vertical */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-border/70" />

        <div className="space-y-4 pl-1">
          {filtered.map((t, idx) => {
            const id = t?.id ?? t?.treatment_id ?? t?.patient_service_id ?? `${idx}`
            const isActive = String(activeId) === String(id)

            return (
              <div key={id} className="relative">
                {/* Punto */}
                <span
                  className={cx(
                    'absolute -left-6 top-6 h-4 w-4 rounded-full',
                    isActive ? 'bg-sky-700' : 'bg-muted-foreground/40'
                  )}
                />

                <TreatmentCard
                  treatment={t}
                  active={isActive}
                  onClick={() => {
                    setActiveId(id)
                    onSelect?.(t)
                  }}
                  onStatusClick={() => {
                    // si quieres abrir modal para cambiar status, aquí lo conectas
                    setActiveId(id)
                    onSelect?.(t)
                  }}
                />
              </div>
            )
          })}

          {!filtered.length ? (
            <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
              No hay tratamientos que coincidan con tu filtro/búsqueda.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
