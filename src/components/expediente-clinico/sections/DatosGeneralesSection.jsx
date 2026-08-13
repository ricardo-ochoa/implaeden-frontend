'use client'

// §2 del formato — Datos generales del paciente.
// Nombre, edad, teléfono, correo y domicilio vienen precargados del módulo de
// pacientes (ver prefillDesdePaciente), pero quedan editables porque el papel
// permite corregirlos en consulta.

import { Controller, useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { ESCOLARIDAD_OPCIONES, SEXO_OPCIONES } from '../constants'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function DatosGeneralesSection({ readOnly }) {
  const { register, control, formState } = useFormContext()
  const { errors } = formState

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo
        id="nombre"
        label="Nombre"
        required
        className="sm:col-span-2"
        error={errors.nombre?.message}
      >
        <Input
          id="nombre"
          disabled={readOnly}
          {...register('nombre', { required: 'El nombre es obligatorio' })}
        />
      </Campo>

      <Campo id="edad" label="Edad" required error={errors.edad?.message}>
        <Input
          id="edad"
          type="number"
          min={0}
          max={120}
          disabled={readOnly}
          {...register('edad', {
            required: 'La edad es obligatoria',
            min: { value: 0, message: 'Edad inválida' },
            max: { value: 120, message: 'Edad inválida' },
          })}
        />
      </Campo>

      <Campo id="sexo" label="Sexo" required error={errors.sexo?.message}>
        <Controller
          name="sexo"
          control={control}
          rules={{ required: 'El sexo es obligatorio' }}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange} disabled={readOnly}>
              <SelectTrigger id="sexo">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {SEXO_OPCIONES.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Campo>

      <Campo id="fechaConsulta" label="Fecha de consulta" required error={errors.fechaConsulta?.message}>
        <Input
          id="fechaConsulta"
          type="date"
          disabled={readOnly}
          {...register('fechaConsulta', { required: 'La fecha es obligatoria' })}
        />
      </Campo>

      <Campo id="telefono" label="Teléfono">
        <Input id="telefono" type="tel" disabled={readOnly} {...register('telefono')} />
      </Campo>

      <Campo id="correo" label="Correo" error={errors.correo?.message}>
        <Input
          id="correo"
          type="email"
          disabled={readOnly}
          {...register('correo', {
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' },
          })}
        />
      </Campo>

      <Campo id="domicilio" label="Domicilio" className="sm:col-span-2">
        <Input id="domicilio" disabled={readOnly} {...register('domicilio')} />
      </Campo>

      <Campo id="lugarResidencia" label="Lugar de residencia">
        <Input
          id="lugarResidencia"
          disabled={readOnly}
          placeholder="Ciudad / municipio"
          {...register('lugarResidencia')}
        />
      </Campo>

      <Campo id="ocupacion" label="Ocupación">
        <Input id="ocupacion" disabled={readOnly} {...register('ocupacion')} />
      </Campo>

      <Campo id="escolaridad" label="Escolaridad" className="sm:col-span-2">
        <Controller
          name="escolaridad"
          control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange} disabled={readOnly}>
              <SelectTrigger id="escolaridad">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {ESCOLARIDAD_OPCIONES.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Campo>
    </div>
  )
}
