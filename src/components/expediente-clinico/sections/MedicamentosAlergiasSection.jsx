'use client'

// §6 del formato — Medicamentos y alergias.
// Ambas preguntas son obligatorias: se responden Sí o No, nunca se dejan en
// blanco. Y un "Sí" exige el "¿cuál?", que es el dato que hay que conocer antes
// de tratar (qué toma, a qué es alérgico).

import { Controller, useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import SiNoField from '../shared/SiNoField'

import { Textarea } from '@/components/ui/textarea'

export default function MedicamentosAlergiasSection({ readOnly }) {
  const { control, register } = useFormContext()

  const preguntas = [
    {
      name: 'tomaMedicamento',
      label: '¿Actualmente está tomando algún medicamento?',
      detalleLabel: '¿Cuál?',
      detallePlaceholder: 'Medicamento y dosis',
    },
    {
      name: 'alergicoMedicamento',
      label: '¿Es alérgico a algún medicamento?',
      detalleLabel: '¿Cuál?',
      detallePlaceholder: 'Medicamento y tipo de reacción',
    },
  ]

  return (
    <div className="space-y-3">
      {preguntas.map((pregunta) => (
        <Controller
          key={pregunta.name}
          name={pregunta.name}
          control={control}
          render={({ field }) => (
            <SiNoField
              label={pregunta.label}
              requerido
              detalleRequerido
              disabled={readOnly}
              value={field.value?.presente ?? null}
              onChange={(presente) => field.onChange({ ...field.value, presente })}
              detalle={field.value?.cual || ''}
              onDetalleChange={(cual) => field.onChange({ ...field.value, cual })}
              detalleLabel={pregunta.detalleLabel}
              detallePlaceholder={pregunta.detallePlaceholder}
            />
          )}
        />
      ))}

      <Campo id="otrosMedicamentos" label="Otros">
        <Textarea
          id="otrosMedicamentos"
          rows={3}
          disabled={readOnly}
          placeholder="Suplementos, tratamientos en curso, etc."
          {...register('otrosMedicamentos')}
        />
      </Campo>
    </div>
  )
}
