'use client'

// components/expediente-clinico/shared/SiNoField.jsx
// El papel usa columnas SI / NO + un campo de detalle ("tiempo de evolución",
// "¿cuál?"). Se comparte entre §5 (antecedentes patológicos), §6 (medicamentos
// y alergias), §7 (fuma) y §8 (embarazo).
//
// El valor es tri-estado: true = sí, false = no, null = sin responder. Volver a
// tocar la opción activa la deselecciona (por si se marcó por error). Con
// `permiteNoAplica` se suma un cuarto valor (NO_APLICA) para las preguntas
// obligatorias que no le corresponden a todo paciente (§8 gineco-obstétricos).

import { NO_APLICA } from '../constants'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Distintivo para las preguntas obligatorias que siguen sin respuesta: es lo
// que impide avanzar de paso, así que conviene verlo junto al control.
export function PendienteTag({ className }) {
  return (
    <span
      className={cn(
        'rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800',
        'dark:bg-amber-950 dark:text-amber-300',
        className
      )}
    >
      Pendiente
    </span>
  )
}

export function SiNoToggle({ value, onChange, disabled, name, permiteNoAplica = false }) {
  const opciones = [
    { label: 'Sí', valor: true },
    { label: 'No', valor: false },
    ...(permiteNoAplica ? [{ label: 'No aplica', valor: NO_APLICA }] : []),
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
            className={cn(
              'h-8',
              op.valor === NO_APLICA ? 'px-2' : 'w-12',
              // "Sí" conserva el color primario; las respuestas negativas se
              // marcan en gris para que resalte lo que sí hay que atender.
              activo && op.valor !== true && 'bg-muted-foreground hover:bg-muted-foreground/90'
            )}
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
  requerido = false,
  // Con `detalleRequerido`, un "Sí" sin el detalle deja el campo pendiente: la
  // respuesta útil es cuál medicamento o a qué es alérgico, no que exista uno.
  detalleRequerido = false,
  permiteNoAplica = false,
}) {
  const mostrarDetalle = Boolean(onDetalleChange) && (mostrarDetalleSiempre || value === true)
  const sinResponder = value !== true && value !== false && value !== NO_APLICA
  const detalleVacio = detalleRequerido && value === true && String(detalle ?? '').trim() === ''
  const pendiente = requerido && (sinResponder || detalleVacio)

  return (
    <div className={cn('space-y-2 rounded-md border p-3', pendiente && 'border-l-2 border-l-amber-400')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {label}
            {requerido ? <span className="ml-0.5 text-destructive">*</span> : null}
          </p>
          {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          {pendiente ? <PendienteTag /> : null}
          <SiNoToggle
            value={value}
            onChange={onChange}
            disabled={disabled}
            name={label}
            permiteNoAplica={permiteNoAplica}
          />
        </div>
      </div>

      {mostrarDetalle ? (
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs text-muted-foreground">
            {detalleLabel}
            {detalleRequerido && value === true ? (
              <span className="ml-0.5 text-destructive">*</span>
            ) : null}
          </Label>
          <Input
            type={detalleType}
            value={detalle ?? ''}
            disabled={disabled}
            placeholder={detallePlaceholder}
            aria-invalid={detalleVacio || undefined}
            className={cn(detalleVacio && 'border-amber-400 focus-visible:ring-amber-400')}
            onChange={(e) => onDetalleChange?.(e.target.value)}
          />
        </div>
      ) : null}
    </div>
  )
}
