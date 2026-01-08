// src/components/TreatmentCard.jsx
'use client'

import React from 'react'
import { formatDate } from '../../lib/utils/formatDate'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Pencil } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

function getStatusVariant(status) {
  switch (status) {
    case 'Terminado':
      return 'default'
    case 'En proceso':
      return 'secondary'
    default:
      return 'outline'
  }
}

function getStatusRingClass(status) {
  switch (status) {
    case 'Terminado':
      return 'ring-emerald-500/40 hover:ring-emerald-500/60'
    case 'En proceso':
      return 'ring-amber-500/40 hover:ring-amber-500/60'
    default:
      return 'ring-slate-400/40 hover:ring-slate-400/60'
  }
}

export default function TreatmentCard({
  treatment,
  onMenuOpen,
  onClick,
  onStatusClick,
  className,
  showMenu = true,
}) {
  const status = treatment?.status || 'Sin estado'
  const statusVariant = getStatusVariant(status)
  const ringClass = getStatusRingClass(status)

  return (
    <Card
      onClick={onClick}
      className={cx(
        'group w-full min-w-0 cursor-pointer rounded-[10px] border-2 border-transparent transition-colors transition-shadow',
        'hover:bg-slate-50 hover:shadow-md hover:border-[#B2C6FB]',
        'dark:hover:bg-slate-900/60 dark:hover:border-[#B2C6FB]/60 dark:hover:shadow-lg dark:hover:shadow-black/30',
        className
      )}
    >
      <CardContent className="relative p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <Badge
              variant={statusVariant}
              className={cx(
                'select-none font-bold cursor-pointer',
                'ring-2 ring-inset transition-shadow',
                ringClass,
                'max-w-full'
              )}
              onClick={(e) => {
                e.stopPropagation()
                onStatusClick?.(treatment)
              }}
            >
              <span className="inline-flex min-w-0 items-center gap-1">
                <span className="truncate">{status}</span>
                <Pencil className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </Badge>
          </div>

          {showMenu ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onMenuOpen?.(e, treatment)
              }}
              aria-label="Acciones"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div className="mt-3 min-w-0">
          <p className="text-sm font-bold leading-5 break-words line-clamp-2">
            {treatment?.service_name || '—'}
          </p>
        </div>

        <p className="mt-2 text-sm min-w-0">
          <span className="font-semibold">Categoría:</span>{' '}
          <span className="text-muted-foreground break-words">
            {treatment?.category || '—'}
          </span>
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm min-w-0">
          <span className="font-semibold shrink-0">Fecha:</span>
          <span className="text-muted-foreground truncate">
            {treatment?.service_date ? formatDate(treatment.service_date) : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
