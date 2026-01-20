'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, Layers, CheckCircle2, Timer, CircleDot } from 'lucide-react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const toMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(n || 0)
  )

const toDate = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' })
}

function statusMeta(statusRaw) {
  const s = String(statusRaw || '').toLowerCase()

  if (s === 'terminado') {
    return {
      label: 'Terminado',
      icon: CheckCircle2,
      badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
      bar: 'bg-emerald-500/70',
      ring: 'ring-emerald-500/20 dark:ring-emerald-400/20',
      border: 'border-emerald-500/30 dark:border-emerald-400/30',
    }
  }

  if (s === 'en proceso') {
    return {
      label: 'En proceso',
      icon: Timer,
      badge: 'bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-400',
      bar: 'bg-amber-500/70',
      ring: 'ring-amber-500/20 dark:ring-amber-400/20',
      border: 'border-amber-500/30 dark:border-amber-400/30',
    }
  }

  return {
    label: 'Por iniciar',
    icon: CircleDot,
    badge: 'bg-sky-500/10 text-sky-800 border-sky-500/20 dark:text-sky-400',
    bar: 'bg-sky-500/70',
    ring: 'ring-sky-500/20 dark:ring-sky-400/20',
    border: 'border-sky-500/30 dark:border-sky-400/30',
  }
}

export default function TreatmentCard({ treatment, onClick, onStatusClick }) {
  const isGroup = Boolean(treatment?.isGroup)
  const items = Array.isArray(treatment?.items) ? treatment.items : []

  const date = isGroup ? treatment?.group_start_date : treatment?.service_date
  const status = treatment?.status || treatment?.group_status || 'Por Iniciar'

  const meta = statusMeta(status)
  const StatusIcon = meta.icon

  // ✅ nombres de tratamientos para grupos
  const names = useMemo(() => {
    if (!isGroup) return []
    return items
      .map((x) => x?.service_name)
      .filter(Boolean)
  }, [isGroup, items])

  const title = useMemo(() => {
    if (isGroup) return treatment?.title || 'Paquete de tratamientos'
    return treatment?.service_name || 'Tratamiento'
  }, [isGroup, treatment?.title, treatment?.service_name])

  const itemsCount = isGroup ? items.length : 0

  const cost = useMemo(() => {
    if (isGroup) {
      const sum = items.reduce((acc, it) => acc + Number(it?.total_cost || 0), 0)
      return Number.isFinite(sum) ? sum : 0
    }
    return Number(treatment?.total_cost || 0)
  }, [treatment, isGroup, items])

  // para lista (máx 4)
  const shownNames = isGroup ? names.slice(0, 4) : []
  const hiddenCount = isGroup ? Math.max(0, names.length - shownNames.length) : 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group relative w-full text-left rounded-xl border',
        'bg-card text-card-foreground border-border',
        'ring-1',
        meta.ring,
        meta.border,
        'transition-colors',
        'hover:bg-accent/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'p-4'
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'absolute left-0 top-0 h-full w-1.5 rounded-l-xl',
          meta.bar
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isGroup ? (
              <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : null}
            <p className="font-semibold truncate">{title}</p>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>Fecha: {toDate(date)}</span>
          </div>

          {isGroup ? (
            <div className="mt-1 text-xs text-muted-foreground">
              {itemsCount} {itemsCount === 1 ? 'tratamiento' : 'tratamientos'}
            </div>
          ) : null}
        </div>

      </div>

      {isGroup ? (
        <div className="mt-3 pl-2">
          <p className="text-xs font-medium text-muted-foreground">Incluye:</p>
          {shownNames.length ? (
            <ul className="mt-1 space-y-1">
              {shownNames.map((n, idx) => (
                <li key={`${n}-${idx}`} className="text-sm leading-snug">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 align-middle" />
                  <span className="align-middle">{n}</span>
                </li>
              ))}
              {hiddenCount > 0 ? (
                <li className="text-sm text-muted-foreground">
                  +{hiddenCount} más…
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">—</p>
          )}
        </div>
      ) : null}

      <Separator className="my-3" />

      <div className="flex flex-wrap items-center justify-between gap-2 pl-2">
        <div>
          <p className="text-xs text-muted-foreground">Costo</p>
          <p className="font-semibold">{toMoney(cost)}</p>
        </div>

        {typeof onStatusClick === 'function' ? (
        <>
        <Badge
            role="button"
            tabIndex={0}
            className={cx(
                'border uppercase select-none cursor-pointer transition',
                meta.badge,
                'hover:bg-transparent',
                meta.badgeHover,
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onStatusClick?.()
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onStatusClick?.()
                }
            }}
            >
            <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
            {meta.label}
            </Badge>
        </>
        ) : null}
      </div>
    </button>
  )
}
