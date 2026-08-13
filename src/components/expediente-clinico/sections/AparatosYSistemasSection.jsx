'use client'

// §11 del formato — Interrogatorio por aparatos y sistemas.
// El texto impreso de cada aparato es guía para el odontólogo: se muestra como
// ayuda y no se captura.

import { useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { APARATOS_Y_SISTEMAS } from '../constants'

import { Textarea } from '@/components/ui/textarea'

export default function AparatosYSistemasSection({ readOnly }) {
  const { register } = useFormContext()

  return (
    <div className="space-y-4">
      {APARATOS_Y_SISTEMAS.map((aparato) => (
        <Campo
          key={aparato.id}
          id={aparato.id}
          label={aparato.label}
          ayuda={aparato.ayuda}
        >
          <Textarea
            id={aparato.id}
            rows={2}
            disabled={readOnly}
            placeholder="Hallazgos relevantes"
            {...register(aparato.id)}
          />
        </Campo>
      ))}
    </div>
  )
}
