'use client'

// §7 y §8 del formato — Antecedentes personales no patológicos (tabaquismo) y
// antecedentes gineco-obstétricos.
//
// La sección gineco-obstétrica se muestra siempre, no condicionada al sexo: es
// lo que recomienda el spec para no hacer suposiciones sobre el paciente.

import { Controller, useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { SiNoToggle } from '../shared/SiNoField'

import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export default function AntecedentesNoPatologicosSection({ readOnly }) {
  const { control, register, watch } = useFormContext()

  const fuma = watch('fuma')
  const embarazada = watch('embarazada')

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Antecedentes personales no patológicos</h3>

        <div className="space-y-3 rounded-md border p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">¿Fuma?</p>
            <Controller
              name="fuma"
              control={control}
              render={({ field }) => (
                <SiNoToggle
                  name="Fuma"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={readOnly}
                />
              )}
            />
          </div>

          {fuma === true ? (
            <div className="grid gap-3 pt-1 sm:grid-cols-2">
              <Campo id="fumaDesdeCuando" label="Desde cuándo">
                <Input
                  id="fumaDesdeCuando"
                  disabled={readOnly}
                  placeholder="Ej. hace 5 años"
                  {...register('fumaDesdeCuando')}
                />
              </Campo>

              <Campo id="fumaCigarrosPorDia" label="Cigarros al día">
                <Input
                  id="fumaCigarrosPorDia"
                  type="number"
                  min={0}
                  disabled={readOnly}
                  {...register('fumaCigarrosPorDia')}
                />
              </Campo>
            </div>
          ) : null}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Antecedentes gineco-obstétricos</h3>
          <p className="text-xs text-muted-foreground">Llenar solo si aplica.</p>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">¿Está embarazada?</p>
            <Controller
              name="embarazada"
              control={control}
              render={({ field }) => (
                <SiNoToggle
                  name="Embarazada"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={readOnly}
                />
              )}
            />
          </div>

          {embarazada === true ? (
            <div className="pt-1">
              <Campo id="mesesGestacion" label="Meses de gestación">
                <Input
                  id="mesesGestacion"
                  type="number"
                  min={0}
                  max={10}
                  disabled={readOnly}
                  {...register('mesesGestacion')}
                />
              </Campo>
            </div>
          ) : null}
        </div>

        <Campo
          id="problemaPeriodoMenstrual"
          label="¿Tiene algún problema relacionado con su periodo menstrual?"
        >
          <Input
            id="problemaPeriodoMenstrual"
            disabled={readOnly}
            {...register('problemaPeriodoMenstrual')}
          />
        </Campo>
      </section>
    </div>
  )
}
