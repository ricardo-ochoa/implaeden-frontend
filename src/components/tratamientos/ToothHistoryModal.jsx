'use client'

// components/tratamientos/ToothHistoryModal.jsx
// ---------------------------------------------------------------------------
// Historial de una pieza dental: todos los tratamientos en los que aparece,
// del más reciente al más antiguo. Se abre al hacer clic en el diagrama.
//
// El nombre viene del catálogo `teeth` (GET /teeth), que solo guarda el nombre
// genérico ("Primer molar"): el cuadrante FDI se deriva aquí para poder decir
// "Primer molar superior derecho" y no confundir la 16 con la 26.
// ---------------------------------------------------------------------------

import { useMemo } from 'react'
import { CalendarDays, ExternalLink, Package } from 'lucide-react'

import { COLORES_ESTADO_TRATAMIENTO } from './DiagramaTratamientos'
import { formatCurrency } from '../../../lib/utils/formatCurrency'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const CUADRANTES = {
  1: { zona: 'superior derecho', temporal: false },
  2: { zona: 'superior izquierdo', temporal: false },
  3: { zona: 'inferior izquierdo', temporal: false },
  4: { zona: 'inferior derecho', temporal: false },
  5: { zona: 'superior derecho', temporal: true },
  6: { zona: 'superior izquierdo', temporal: true },
  7: { zona: 'inferior izquierdo', temporal: true },
  8: { zona: 'inferior derecho', temporal: true },
}

export function describirPieza(fdi, teethMap) {
  const codigo = Number(fdi)
  if (!Number.isInteger(codigo) || codigo <= 0) {
    return { titulo: 'Pieza dental', detalle: '' }
  }

  const nombre = teethMap?.get?.(codigo) || ''
  const cuadrante = CUADRANTES[Math.floor(codigo / 10)]

  const titulo = nombre
    ? `${nombre}${cuadrante ? ` ${cuadrante.zona}` : ''}`
    : `Pieza ${codigo}`

  const detalle = [
    `Pieza ${codigo} (FDI)`,
    cuadrante?.temporal ? 'Dentición temporal' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return { titulo, detalle }
}

// "2025-06-30T06:00:00.000Z" -> "30/06/2025". Sin construir un Date: en México
// `new Date('2025-06-30')` se interpreta como UTC y muestra el día anterior.
const formatFecha = (valor) => {
  const [y, m, d] = String(valor || '').split('T')[0].split('-')
  return y && m && d ? `${d}/${m}/${y}` : '—'
}

const normalizeStatus = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase()
  if (v === 'terminado') return 'Terminado'
  if (v === 'en proceso') return 'En proceso'
  return 'Por Iniciar'
}

function EstadoBadge({ status }) {
  const color = COLORES_ESTADO_TRATAMIENTO[status] || COLORES_ESTADO_TRATAMIENTO['Por Iniciar']

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: color.stroke, color: color.stroke }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color.fill }} />
      {color.label}
    </span>
  )
}

export default function ToothHistoryModal({
  open,
  onOpenChange,
  toothCode,
  treatments = [],
  teethMap,
  onVerTratamiento,
}) {
  const { titulo, detalle } = useMemo(
    () => describirPieza(toothCode, teethMap),
    [toothCode, teethMap]
  )

  // Tratamientos en los que aparece esta pieza, del más reciente al más viejo.
  const historial = useMemo(() => {
    const codigo = Number(toothCode)
    if (!Number.isInteger(codigo)) return []

    return (Array.isArray(treatments) ? treatments : [])
      .filter((t) => {
        const dientes = t?.teethIds ?? t?.teeth_ids ?? []
        return (Array.isArray(dientes) ? dientes : []).some((d) => Number(d) === codigo)
      })
      .map((t) => ({
        ...t,
        status: normalizeStatus(t?.status),
        fecha: String(t?.service_date || t?.group_start_date || '').split('T')[0],
      }))
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
  }, [treatments, toothCode])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {detalle}
            {historial.length
              ? ` · ${historial.length} tratamiento${historial.length === 1 ? '' : 's'}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {historial.length === 0 ? (
          <Alert>
            <AlertTitle>Sin historial</AlertTitle>
            <AlertDescription>
              Esta pieza no tiene tratamiento asociado.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="max-h-[55vh] pr-3">
            <div className="space-y-3">
              {historial.map((t) => (
                <div key={t.treatment_id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {t.service_name || 'Tratamiento'}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatFecha(t.fecha)}
                        </span>
                        {t.group_title ? (
                          <span className="inline-flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            {t.group_title}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <EstadoBadge status={t.status} />
                  </div>

                  {t.notes ? (
                    <p className="mt-2 text-sm text-muted-foreground">{t.notes}</p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {Number(t.quantity) > 1 ? `${t.quantity} piezas · ` : ''}
                      {t.total_cost != null && t.total_cost !== ''
                        ? `$${formatCurrency(Number(t.total_cost) || 0)}`
                        : ''}
                    </p>

                    {onVerTratamiento ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onVerTratamiento(t)}
                      >
                        Ver tratamiento
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
