'use client'

// components/expediente-clinico/shared/SiNoField.jsx
// El papel usa columnas SI / NO + un campo de detalle ("tiempo de evolución",
// "¿cuál?"). Se comparte entre §5 (antecedentes patológicos), §6 (medicamentos
// y alergias), §7 (fuma) y §8 (embarazo).
//
// El valor es tri-estado: true = sí, false = no, null = sin responder. Volver a
// tocar la opción activa la deselecciona (por si se marcó por error).

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function SiNoToggle({ value, onChange, disabled, name }) {
  const opciones = [
    { label: 'Sí', valor: true },
    { label: 'No', valor: false },
  ]

  return (
    <div className="flex gap-1" role="group" aria-label={name}>
      {opciones.map((op) => {
        const activo = value === op.valor

        return (
          <Button
            key={op.label}
            type="button"
            size="sm"
            variant={activo ? 'default' : 'outline'}
            disabled={disabled}
            aria-pressed={activo}
            className={cn('h-8 w-12', activo && op.valor === false && 'bg-muted-foreground hover:bg-muted-foreground/90')}
            onClick={() => onChange?.(activo ? null : op.valor)}
          >
            {op.label}
          </Button>
        )
      })}
    </div>
  )
}

export default function SiNoField({
  label,
  ayuda,
  value,
  onChange,
  detalle,
  onDetalleChange,
  detalleLabel = 'Especificar',
  detallePlaceholder = '',
  detalleType = 'text',
  disabled,
  // Por defecto el detalle solo aparece si la respuesta fue "Sí" (campos
  // condicionales del spec: fuma, embarazo, medicamentos).
  mostrarDetalleSiempre = false,
}) {
  const mostrarDetalle = Boolean(onDetalleChange) && (mostrarDetalleSiempre || value === true)

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
        </div>

        <SiNoToggle value={value} onChange={onChange} disabled={disabled} name={label} />
      </div>

      {mostrarDetalle ? (
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs text-muted-foreground">{detalleLabel}</Label>
          <Input
            type={detalleType}
            value={detalle ?? ''}
            disabled={disabled}
            placeholder={detallePlaceholder}
            onChange={(e) => onDetalleChange?.(e.target.value)}
          />
        </div>
      ) : null}
    </div>
  )
}
