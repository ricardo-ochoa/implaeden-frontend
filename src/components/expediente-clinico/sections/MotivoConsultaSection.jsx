'use client'

// §3 del formato — Motivo de la consulta (texto libre, obligatorio).
// Cuando el paciente llega sin una queja concreta el renglón no se deja en
// blanco: se registra "Revisión general", y el botón evita teclearlo cada vez.

import { useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { MOTIVO_POR_DEFECTO } from '../constants'
import { conTexto } from '../completitud'
import { PendienteTag } from '../shared/SiNoField'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export default function MotivoConsultaSection({ readOnly }) {
  const { register, setValue, watch } = useFormContext()

  const vacio = !conTexto(watch('motivoConsulta'))

  return (
    <div className={cn('space-y-3 rounded-md border p-3', vacio && 'border-l-2 border-l-amber-400')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">
          Motivo de la consulta<span className="ml-0.5 text-destructive">*</span>
        </p>
        {vacio ? <PendienteTag /> : null}
      </div>

      <Campo id="motivoConsulta" ayuda="En palabras del paciente: qué lo trae a consulta.">
        <Textarea
          id="motivoConsulta"
          rows={5}
          disabled={readOnly}
          {...register('motivoConsulta')}
        />
      </Campo>

      {!readOnly && vacio ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setValue('motivoConsulta', MOTIVO_POR_DEFECTO, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
        >
          Sin motivo específico: {MOTIVO_POR_DEFECTO}
        </Button>
      ) : null}
    </div>
  )
}
