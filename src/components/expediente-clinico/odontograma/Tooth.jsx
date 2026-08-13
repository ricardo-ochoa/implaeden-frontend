'use client'

// components/expediente-clinico/odontograma/Tooth.jsx
// Una pieza dental del odontograma. MVP: un estado por pieza completa (no por
// cara), como se acordó para esta primera versión.

import { ESTADO_DIENTE_POR_ID } from '../constants'
import { cn } from '@/lib/utils'

export default function Tooth({ fdi, diente, arcada = 'superior', onClick, disabled }) {
  const estado = ESTADO_DIENTE_POR_ID[diente?.estado] || ESTADO_DIENTE_POR_ID.sano
  const esAusente = estado.id === 'ausente'
  const tieneNota = Boolean(diente?.observaciones)
  const esInferior = arcada === 'inferior'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`Pieza ${fdi} — ${estado.label}`}
      aria-label={`Pieza ${fdi}, ${estado.label}`}
      className={cn(
        'group flex flex-col items-center gap-1 rounded-md p-1 transition',
        !disabled && 'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled && 'cursor-default',
        esInferior && 'flex-col-reverse'
      )}
    >
      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
        {fdi}
      </span>

      {/* Corona + raíz. La arcada inferior se dibuja espejeada. */}
      <span className={cn('relative flex flex-col items-center', esInferior && 'flex-col-reverse')}>
        <span
          className={cn(
            'block h-6 w-6 rounded-t-[6px] border-2',
            estado.color,
            estado.borde,
            esAusente && 'opacity-60'
          )}
        />
        <span
          className={cn(
            'block h-3 w-3.5 rounded-b-[4px] border-x-2 border-b-2',
            estado.color,
            estado.borde,
            esAusente && 'opacity-60'
          )}
        />

        {esAusente ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-base font-bold leading-none text-white">
            ✕
          </span>
        ) : null}

        {tieneNota ? (
          <span
            className="pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-background bg-foreground"
            aria-hidden="true"
          />
        ) : null}
      </span>
    </button>
  )
}
