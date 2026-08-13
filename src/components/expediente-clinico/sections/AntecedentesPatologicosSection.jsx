'use client'

// §5 del formato — Antecedentes personales patológicos.
// Tabla SI / NO / TIEMPO DE EVOLUCIÓN. El campo de evolución solo se habilita
// cuando la respuesta es "Sí", igual que en el papel (donde queda en blanco).

import { Controller, useFormContext } from 'react-hook-form'

import { ANTECEDENTES_PATOLOGICOS } from '../constants'
import { SiNoToggle } from '../shared/SiNoField'

import { Input } from '@/components/ui/input'

export default function AntecedentesPatologicosSection({ readOnly }) {
  const { control, register, watch } = useFormContext()

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="hidden grid-cols-[1fr_auto_200px] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
        <span>Padecimiento</span>
        <span className="text-center">Sí / No</span>
        <span>Tiempo de evolución</span>
      </div>

      {ANTECEDENTES_PATOLOGICOS.map((item, index) => {
        const presente = watch(`antecedentesPatologicos.${item.id}.presente`)

        return (
          <div
            key={item.id}
            className={`grid gap-3 px-3 py-2.5 sm:grid-cols-[1fr_auto_200px] sm:items-center ${
              index % 2 ? 'bg-muted/20' : ''
            }`}
          >
            <p className="text-sm">{item.label}</p>

            <Controller
              name={`antecedentesPatologicos.${item.id}.presente`}
              control={control}
              render={({ field }) => (
                <SiNoToggle
                  name={item.label}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={readOnly}
                />
              )}
            />

            <Input
              className="h-8"
              placeholder={presente === true ? 'Ej. 2 años' : '—'}
              disabled={readOnly || presente !== true}
              {...register(`antecedentesPatologicos.${item.id}.tiempoEvolucion`)}
            />
          </div>
        )
      })}
    </div>
  )
}
