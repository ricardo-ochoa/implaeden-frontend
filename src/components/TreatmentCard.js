// src/components/TreatmentCard.jsx (o donde lo tengas)
'use client'

import React, { useState } from 'react'
import { formatDate } from '../../lib/utils/formatDate'

// shadcn/ui
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// icons
import { MoreVertical, Pencil } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

function getStatusVariant(status) {
  // Badge variants típicos: "default" | "secondary" | "destructive" | "outline"
  // Mapeo aproximado a tus colores anteriores:
  switch (status) {
    case 'Terminado':
      return 'default' // puedes cambiar a "secondary" si prefieres
    case 'En proceso':
      return 'secondary'
    case 'Por Iniciar':
    default:
      return 'outline'
  }
}

function getStatusRingClass(status) {
  // para simular el “color” del borde/hover
  switch (status) {
    case 'Terminado':
      return 'ring-emerald-500/40 hover:ring-emerald-500/60'
    case 'En proceso':
      return 'ring-amber-500/40 hover:ring-amber-500/60'
    case 'Por Iniciar':
    default:
      return 'ring-slate-400/40 hover:ring-slate-400/60'
  }
}

export default function TreatmentCard({ treatment, onMenuOpen, onClick, onStatusClick }) {
  const [hovered, setHovered] = useState(false)

  const status = treatment?.status || 'Sin estado'
  const statusVariant = getStatusVariant(status)
  const ringClass = getStatusRingClass(status)

  return (
    <Card
  className={cx(
    'group w-full md:w-[40%] lg:w-[300px] cursor-pointer rounded-[10px] border-2 border-transparent transition-colors transition-shadow',
    // light
    'hover:bg-slate-50 hover:shadow-md hover:border-[#B2C6FB]',
    // dark
    'dark:hover:bg-slate-900/60 dark:hover:border-[#B2C6FB]/60 dark:hover:shadow-lg dark:hover:shadow-black/30'
  )}
    >
      <CardContent className="relative p-4" onClick={onClick}>
        {/* Top row: status + menu */}
        <div className="flex items-start justify-between gap-2">
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Badge
              variant={statusVariant}
              className={cx(
                'select-none font-bold cursor-pointer',
                'ring-2 ring-inset transition-shadow',
                ringClass
              )}
              onClick={(e) => {
                e.stopPropagation()
                onStatusClick?.(treatment)
              }}
            >
              <span className="inline-flex items-center gap-1">
                <span>{status}</span>
                {hovered ? <Pencil className="h-3.5 w-3.5" /> : null}
              </span>
            </Badge>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onMenuOpen?.(e, treatment)
            }}
            aria-label="Acciones"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Title */}
        <div className="mt-3 flex items-center gap-2">
          <p className="text-sm font-bold leading-5">{treatment?.service_name}</p>
        </div>

        {/* Category */}
        <p className="mt-2 text-sm">
          <span className="font-semibold">Categoría:</span>{' '}
          <span className="text-muted-foreground">{treatment?.category || '—'}</span>
        </p>

        {/* Date */}
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="font-semibold">Fecha:</span>
          <span className="text-muted-foreground">
            {treatment?.service_date ? formatDate(treatment.service_date) : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
