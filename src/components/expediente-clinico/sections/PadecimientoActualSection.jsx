'use client'

// §9 y §10 del formato — Padecimiento actual y padecimientos sistémicos
// bucales previos.

import { useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { Textarea } from '@/components/ui/textarea'

export default function PadecimientoActualSection({ readOnly }) {
  const { register } = useFormContext()

  return (
    <div className="space-y-4">
      <Campo
        id="padecimientoActual"
        label="Padecimiento actual"
        ayuda="Evolución del padecimiento: inicio, síntomas, tratamientos previos."
      >
        <Textarea
          id="padecimientoActual"
          rows={7}
          disabled={readOnly}
          {...register('padecimientoActual')}
        />
      </Campo>

      <Campo
        id="padecimientosSistemicosBucalesPrevios"
        label="Padecimientos sistémicos bucales previos"
      >
        <Textarea
          id="padecimientosSistemicosBucalesPrevios"
          rows={4}
          disabled={readOnly}
          {...register('padecimientosSistemicosBucalesPrevios')}
        />
      </Campo>
    </div>
  )
}
