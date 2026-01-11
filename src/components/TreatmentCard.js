'use client'

import React, { useMemo } from 'react'
import { formatDate } from '../../lib/utils/formatDate'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

const cx = (...c) => c.filter(Boolean).join(' ')

const toMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(n || 0)
  )

const normalizeStatus = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase()
  if (!v) return 'Por Iniciar'
  if (v === 'terminado') return 'Terminado'
  if (v === 'en proceso') return 'En proceso'
  if (v === 'por iniciar') return 'Por Iniciar'
  return 'Por Iniciar'
}

// ✅ Helper: intenta sacar nombre desde varias formas comunes
const getServiceName = (obj) => {
  return (
    obj?.service_name ??
    obj?.serviceName ??
    obj?.tratamiento ??
    obj?.name ??
    obj?.service?.name ??
    ''
  )
}

const getCardBorderClass = (status) => {
  switch (status) {
    case 'Terminado':
      return 'border-emerald-500'
    case 'En proceso':
      return 'border-orange-400'
    default:
      return 'border-slate-200'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Terminado':
      return 'border-emerald-500 text-emerald-600'
    case 'En proceso':
      return 'border-orange-400 text-orange-500'
    default:
      return 'border-slate-400 text-slate-700'
  }
}

export default function TreatmentCard({
  treatment,
  onMenuOpen,
  onClick,
  onStatusClick,
  className,
  showMenu = false,
}) {
const isGroup =
  Boolean(treatment?.isGroup) ||
  (treatment?.group_id != null && Array.isArray(treatment?.items) && treatment.items.length > 0)


  const items = useMemo(() => {
    if (!isGroup) {
      return [
        {
          service_name: getServiceName(treatment),
          total_cost: treatment?.total_cost,
          status: treatment?.status,
          service_date: treatment?.service_date,
        },
      ]
    }

    return (treatment?.items || []).map((it) => ({
      service_name: getServiceName(it),
      total_cost: it?.total_cost,
      status: it?.status,
      service_date: it?.service_date,
    }))
  }, [isGroup, treatment])

  const status = useMemo(() => {
    if (!isGroup) return normalizeStatus(treatment?.status)
    if (treatment?.group_status) return normalizeStatus(treatment.group_status)

    const statuses = items.map((x) => normalizeStatus(x?.status)).filter(Boolean)
    if (statuses.length === 0) return 'Por Iniciar'

    const allDone = statuses.every((s) => s === 'Terminado')
    if (allDone) return 'Terminado'

    const anyInProgress = statuses.some((s) => s === 'En proceso')
    if (anyInProgress) return 'En proceso'

    return 'Por Iniciar'
  }, [isGroup, treatment, items])

  const dateValue = isGroup
    ? treatment?.group_start_date ||
      treatment?.start_date ||
      treatment?.items?.[0]?.service_date
    : treatment?.service_date

  const total = useMemo(() => {
    if (!isGroup) return Number(treatment?.total_cost ?? 0)
    return items.reduce((acc, it) => acc + Number(it?.total_cost ?? 0), 0)
  }, [isGroup, items, treatment])

  const borderClass = getCardBorderClass(status)

  const hasOne = items.length === 1
  const firstName = (items[0]?.service_name || '').trim()

  return (
    <Card
      onClick={onClick}
      className={cx(
        'w-full min-w-0 cursor-pointer rounded-[14px] border-2 bg-white transition-shadow hover:shadow-md',
        borderClass,
        className
      )}
    >
      <CardContent className="relative p-4 min-w-0">
        {showMenu ? (
          <div className="absolute right-3 top-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={(e) => {
                e.stopPropagation()
                onMenuOpen?.(e, treatment)
              }}
              aria-label="Acciones"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {/* Fecha */}
        <div className="text-2xl font-black tracking-tight">
          {dateValue ? formatDate(dateValue) : '—'}
        </div>

        {/* ✅ Nombre(s) */}
        <div className="mt-2 text-lg">
          {hasOne ? (
            <div className={cx('leading-snug break-words', firstName ? '' : 'text-muted-foreground')}>
              {firstName || '—'}
            </div>
          ) : (
            <div className="space-y-2">
              {items.slice(0, 3).map((it, idx) => {
                const name = (it?.service_name || '').trim()
                return (
                  <div
                    key={`${name || idx}`}
                    className={cx('leading-snug', name ? 'break-words line-clamp-2' : 'text-muted-foreground')}
                  >
                    {idx + 1}. {name || '—'}
                  </div>
                )
              })}

              {items.length > 3 ? (
                <div className="text-base font-medium text-muted-foreground">
                  +{items.length - 3} más
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-end justify-between gap-3">
          <div className="rounded-xl bg-slate-50 px-2 py-2">
            <div className="text-sm text-muted-foreground">Total:</div>
            <div className="text-xl font-extrabold">{toMoney(total)} mxn</div>
          </div>

          <Badge
            variant="outline"
            className={cx(
              'cursor-pointer select-none rounded-md border-2 px-1 py-1 text-sm',
              getStatusBadgeClass(status)
            )}
            onClick={(e) => {
              e.stopPropagation()
              onStatusClick?.(treatment)
            }}
          >
            {status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
