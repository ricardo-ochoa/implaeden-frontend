'use client'

// components/expediente-clinico/odontograma/Odontograma.jsx
// ---------------------------------------------------------------------------
// Odontograma de 32 piezas en notación FDI, con el mismo acomodo que el papel:
//
//   18..11 | 21..28      (arcada superior)
//   48..41 | 31..38      (arcada inferior)
//
// MVP: un estado por pieza completa. La estructura guardada
// ({ fecha, dientes: { 18: { estado, observaciones } } }) ya deja lugar para
// pasar a 5 caras después sin romper lo capturado.
//
// Se guarda como JSON (no como imagen) para poder sacar reportes.
// ---------------------------------------------------------------------------
import * as React from 'react'

import { CUADRANTES_FDI, ESTADOS_DIENTE, ESTADO_DIENTE_POR_ID } from '../constants'
import Tooth from './Tooth'
import useTeethCatalog from '../../../../lib/hooks/useTeethCatalog'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const DIENTE_VACIO = { estado: 'sano', observaciones: '' }

function Leyenda() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {ESTADOS_DIENTE.map((estado) => (
        <span key={estado.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn('h-3 w-3 rounded-sm border', estado.color, estado.borde)} />
          {estado.label}
        </span>
      ))}
    </div>
  )
}

// Cada pieza abre su propio popover, anclado al diente que se tocó.
function ToothPopover({ fdi, arcada, diente, nombrePieza, readOnly, onUpdate }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="inline-flex">
          <Tooth fdi={fdi} arcada={arcada} diente={diente} disabled={readOnly} />
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-72" align="center">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Pieza {fdi}</p>
            <p className="text-xs text-muted-foreground">{nombrePieza || 'Notación FDI'}</p>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {ESTADOS_DIENTE.map((estado) => {
              const activo = (diente?.estado || 'sano') === estado.id

              return (
                <button
                  key={estado.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onUpdate({ estado: estado.id })}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition',
                    activo ? 'border-primary bg-muted font-medium' : 'hover:bg-muted',
                    readOnly && 'cursor-default'
                  )}
                >
                  <span className={cn('h-3 w-3 shrink-0 rounded-sm border', estado.color, estado.borde)} />
                  <span className="truncate">{estado.label}</span>
                </button>
              )
            })}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`diente-${fdi}-observaciones`} className="text-xs">
              Observaciones
            </Label>
            <Textarea
              id={`diente-${fdi}-observaciones`}
              rows={2}
              disabled={readOnly}
              value={diente?.observaciones || ''}
              onChange={(e) => onUpdate({ observaciones: e.target.value })}
              placeholder="Notas de la pieza (opcional)"
            />
          </div>

          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Listo
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function Odontograma({ value, onChange, readOnly = false }) {
  const { teethMap } = useTeethCatalog()
  const dientes = value?.dientes || {}

  const actualizarDiente = (fdi, cambios) => {
    if (readOnly) return
    onChange?.({
      ...value,
      dientes: {
        ...dientes,
        [fdi]: { ...DIENTE_VACIO, ...(dientes[fdi] || {}), ...cambios },
      },
    })
  }

  const renderArcada = (izquierda, derecha, arcada) => {
    const renderDiente = (fdi) => (
      <ToothPopover
        key={fdi}
        fdi={fdi}
        arcada={arcada}
        diente={dientes[fdi] || DIENTE_VACIO}
        nombrePieza={teethMap.get(fdi)}
        readOnly={readOnly}
        onUpdate={(cambios) => actualizarDiente(fdi, cambios)}
      />
    )

    return (
      <div className="flex items-start justify-center gap-2">
        <div className="flex">{izquierda.map(renderDiente)}</div>
        <div className="w-px self-stretch bg-border" aria-hidden="true" />
        <div className="flex">{derecha.map(renderDiente)}</div>
      </div>
    )
  }

  // Resumen de lo marcado: evita recorrer el diagrama pieza por pieza.
  const resumen = React.useMemo(() => {
    const conteo = {}
    Object.values(dientes).forEach((d) => {
      const id = d?.estado
      if (!id || id === 'sano') return
      conteo[id] = (conteo[id] || 0) + 1
    })
    return Object.entries(conteo).map(([id, total]) => ({
      id,
      total,
      label: ESTADO_DIENTE_POR_ID[id]?.label || id,
    }))
  }, [dientes])

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card p-4">
        <div className="min-w-[560px] space-y-3">
          {renderArcada(CUADRANTES_FDI.superiorDerecho, CUADRANTES_FDI.superiorIzquierdo, 'superior')}
          <div className="h-px bg-border" aria-hidden="true" />
          {renderArcada(CUADRANTES_FDI.inferiorDerecho, CUADRANTES_FDI.inferiorIzquierdo, 'inferior')}
        </div>
      </div>

      <Leyenda />

      {resumen.length ? (
        <p className="text-xs text-muted-foreground">
          Piezas marcadas:{' '}
          {resumen.map((r, i) => (
            <span key={r.id}>
              {i > 0 ? ' · ' : ''}
              <span className="font-medium text-foreground">{r.total}</span> {r.label.toLowerCase()}
            </span>
          ))}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Toca una pieza para marcar su estado. Todas inician como sanas.
        </p>
      )}
    </div>
  )
}
