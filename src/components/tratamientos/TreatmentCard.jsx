'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Timer, CircleDot, Layers } from 'lucide-react'
import ToothBadge from '../ToothBadge'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const toMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(n || 0)
  )

const safeDate = (v) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

const monthLabel = (d) =>
  d?.toLocaleDateString('es-MX', { month: 'long' })?.replace(/^\w/, (c) => c.toUpperCase()) || '—'

function statusMeta(statusRaw) {
  const s = String(statusRaw || '').toLowerCase().trim()

  const isDone =
    s === 'terminado' || s === 'finalizado' || s === 'completado' || s === 'completo'
  const isProgress =
    s === 'en proceso' || s === 'en progreso' || s === 'proceso' || s === 'progress'

  if (isDone) {
    return {
      label: 'Terminado',
      icon: CheckCircle2,
      badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
      dot: 'bg-emerald-600',
      ring: 'ring-emerald-500/20 dark:ring-emerald-400/20',
      border: 'border-emerald-500/30 dark:border-emerald-400/30',
    }
  }

  if (isProgress) {
    return {
      label: 'En proceso',
      icon: Timer,
      badge: 'bg-sky-500/10 text-sky-800 border-sky-500/20 dark:text-sky-400',
      dot: 'bg-sky-600',
      ring: 'ring-sky-500/20 dark:ring-sky-400/20',
      border: 'border-sky-500/30 dark:border-sky-400/30',
    }
  }

  return {
    label: 'Por iniciar',
    icon: CircleDot,
    badge: 'bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-400',
    dot: 'bg-amber-600',
    ring: 'ring-amber-500/20 dark:ring-amber-400/20',
    border: 'border-amber-500/30 dark:border-amber-400/30',
  }
}

const getQty = (x) => x?.quantity ?? x?.qty ?? x?.cantidad ?? null
const getItemCost = (x) => x?.total_cost ?? x?.cost ?? x?.precio ?? 0

export default function TreatmentCard({
  treatment,
  active = false,
  onClick,
  onStatusClick,
}) {
  const isGroup = Boolean(treatment?.isGroup)
  const items = Array.isArray(treatment?.items) ? treatment.items : []

  const dateValue = isGroup ? treatment?.group_start_date : treatment?.service_date
  const date = safeDate(dateValue)

  const status = treatment?.status || treatment?.group_status || 'Por iniciar'
  const meta = statusMeta(status)
  const StatusIcon = meta.icon

  const title = useMemo(() => {
    if (isGroup) return treatment?.title || 'Paquete de tratamientos'
    return treatment?.service_name || 'Tratamiento'
  }, [isGroup, treatment?.title, treatment?.service_name])

  const cost = useMemo(() => {
    if (isGroup) {
      const sum = items.reduce((acc, it) => acc + Number(getItemCost(it) || 0), 0)
      return Number.isFinite(sum) ? sum : 0
    }
    return Number(treatment?.total_cost || 0)
  }, [treatment, isGroup, items])

  const day = date ? String(date.getDate()).padStart(2, '0') : '—'
  const year = date ? String(date.getFullYear()) : '—'
  const month = date ? monthLabel(date) : '—'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group relative w-full text-left rounded-2xl border bg-card text-card-foreground',
        'transition-colors hover:bg-indigo-50 hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'p-4',
        'ring-1',
        meta.ring,
        meta.border,
        active ? 'border-sky-500 ring-sky-500/25' : 'border-border'
      )}
    >
      {/* Header (fecha / costo / badge) */}
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div className="flex gap-10">
          <div className="min-w-[50px]">
            <p className="text-sm text-muted-foreground leading-none">{month}</p>
            <p className="text-3xl font-semibold leading-none mt-1">{day}</p>
            <p className="text-sm text-muted-foreground leading-none mt-1">{year}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Costo total:</p>
            <p className="text-2xl font-semibold">{toMoney(cost)}</p>
          </div>
        </div>

        <Badge
  role={typeof onStatusClick === 'function' ? 'button' : undefined}
  tabIndex={typeof onStatusClick === 'function' ? 0 : undefined}
  className={cx(
    'border select-none cursor-default px-3 py-1 text-sm',
    meta.badge,
    typeof onStatusClick === 'function' ? 'cursor-pointer' : ''
  )}
  onClick={(e) => {
    if (typeof onStatusClick !== 'function') return
    e.preventDefault()
    e.stopPropagation()
    onStatusClick(treatment) // ✅ pásale el card/treatment
  }}
  onKeyDown={(e) => {
    if (typeof onStatusClick !== 'function') return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onStatusClick(treatment) // ✅ pásale el card/treatment
    }
  }}
>
  <StatusIcon className="mr-2 h-4 w-4" />
  {meta.label}
</Badge>

      </div>

      <Separator className="my-3" />

      {/* Body (título + items tipo lista) */}
      <div className="space-y-3">
        {/* <div className="flex items-center gap-2">
          {isGroup ? <Layers className="h-4 w-4 text-muted-foreground" /> : null}
          <p className="text-lg font-semibold">{title}</p>
        </div> */}

        {isGroup ? (
          <div className="space-y-1">
            {items.map((it, idx) => {
              const n = it?.service_name || it?.name || 'Tratamiento'
              const qty = getQty(it)
              const itemCost = Number(getItemCost(it) || 0)
                const teeth = Array.isArray(it?.teethIds)
                      ? it.teethIds
                      : (it?.teethIds ? String(it.teethIds).split(',').map(Number) : [])

              return (
                <div key={`${n}-${idx}`} className="rounded-md bg-muted/50 p-2">
                  <p className="text-md font-semibold">
                    <span className="mr-2 align-middle">•</span>
                    <span className="align-middle">{n}</span>
                  </p>
                  <div className="flex items-end justify-between gap-2 text-muted-foreground">
                    {teeth.length > 0 && (
                      <div className="text-base flex flex-wrap gap-2 justify-center items-center">
                        <p className="mb-1">No. Dientes:</p>

                        <div className="flex flex-wrap gap-2">
                          {teeth.map((n) => (
                            <ToothBadge
                              key={n}
                              tooth={n}
                              onClick={(tooth) => {
                                console.log('clicked tooth', tooth)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* <p className="text-base">
                      Cantidad: <span className="font-semibold text-foreground">{qty ?? '—'}</span>
                    </p> */}
                    <p className="text-base">
                      Costo:{' '}
                      <span className="font-semibold text-foreground">{toMoney(itemCost)}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-muted/30 p-4">
            <p className="text-lg font-semibold">
              <span className="mr-2 align-middle">•</span>
              <span className="align-middle">{treatment?.service_name || 'Tratamiento'}</span>
            </p>
            <div className="mt-2 flex items-center justify-between gap-4 text-muted-foreground">
              <p className="text-base">
                Cantidad:{' '}
                <span className="font-semibold text-foreground">
                  {getQty(treatment) ?? '—'}
                </span>
              </p>
              <p className="text-base">
                Costo:{' '}
                <span className="font-semibold text-foreground">
                  {toMoney(Number(treatment?.total_cost || 0))}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
