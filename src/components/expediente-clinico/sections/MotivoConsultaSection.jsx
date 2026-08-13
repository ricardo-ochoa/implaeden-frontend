'use client'

// §3 del formato — Motivo de la consulta (texto libre).

import { useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { Textarea } from '@/components/ui/textarea'

export default function MotivoConsultaSection({ readOnly }) {
  const { register } = useFormContext()

  return (
    <Campo
      id="motivoConsulta"
      label="Motivo de la consulta"
      ayuda="En palabras del paciente: qué lo trae a consulta."
    >
      <Textarea
        id="motivoConsulta"
        rows={5}
        disabled={readOnly}
        {...register('motivoConsulta')}
      />
    </Campo>
  )
}
