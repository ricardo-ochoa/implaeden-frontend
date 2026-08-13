'use client'

// §15 del formato — Estudios de gabinete, diagnóstico, seguimiento y firmas.
//
// La "firma" del paciente se resuelve con una confirmación con fecha y hora,
// no con firma en canvas: es lo que el spec deja como opción según los
// requisitos legales de la clínica. Si más adelante se necesita firma gráfica,
// se agrega un campo `pacienteFirmaUrl` sin tocar lo ya capturado.

import * as React from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import useDoctors from '../../../../lib/hooks/useDoctors'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

export default function EstudiosDiagnosticoSection({ readOnly }) {
  const { control, register, setValue, watch } = useFormContext()
  const confirmadoEn = watch('pacienteConfirmaFecha')

  const { doctors, etiquetaDoctor, isLoading: cargandoDoctores } = useDoctors()
  const odontologoId = watch('odontologoId')
  const odontologoNombre = watch('odontologoNombre')

  // Guardar nombre y cédula además del id: si mañana un médico se da de baja o
  // cambia de cédula, el expediente debe seguir mostrando quién firmó.
  const seleccionarDoctor = (id) => {
    const doctor = doctors.find((d) => String(d.id) === String(id))
    if (!doctor) return

    setValue('odontologoId', doctor.id, { shouldDirty: true })
    setValue('odontologoNombre', doctor.nombre, { shouldDirty: true })
    setValue('odontologoCedula', doctor.cedula_profesional || '', { shouldDirty: true })
  }

  // Con un solo médico dado de alta, se preselecciona. No se marca el formulario
  // como sucio para no mostrar "Cambios sin guardar" nada más abrir el paso; el
  // valor igual se persiste en el siguiente guardado, que envía el form completo.
  React.useEffect(() => {
    if (readOnly || odontologoId || doctors.length === 0) return

    const [doctor] = doctors
    setValue('odontologoId', doctor.id, { shouldDirty: false })
    setValue('odontologoNombre', doctor.nombre, { shouldDirty: false })
    setValue('odontologoCedula', doctor.cedula_profesional || '', { shouldDirty: false })
  }, [doctors, odontologoId, readOnly, setValue])

  // Un expediente viejo puede traer un médico que ya no está en el catálogo.
  const doctorFueraDeCatalogo =
    odontologoNombre && !doctors.some((d) => String(d.id) === String(odontologoId))

  // La confirmación vale como firma, así que se sella con la fecha/hora en que
  // se marcó (y se limpia si se desmarca).
  const marcarConfirmacion = (field) => (checked) => {
    const valor = checked === true
    field.onChange(valor)
    setValue('pacienteConfirmaFecha', valor ? new Date().toLocaleString('es-MX') : '', {
      shouldDirty: true,
    })
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <Campo
          id="estudiosGabinete"
          label="Estudios de gabinete (Lab y/o Rx)"
        >
          <Textarea
            id="estudiosGabinete"
            rows={4}
            disabled={readOnly}
            {...register('estudiosGabinete')}
          />
        </Campo>

        <Campo id="diagnostico" label="Diagnóstico">
          <Textarea id="diagnostico" rows={5} disabled={readOnly} {...register('diagnostico')} />
        </Campo>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Seguimiento</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="fechaPrimeraConsulta" label="Fecha de la primera consulta">
            <Input
              id="fechaPrimeraConsulta"
              type="date"
              disabled={readOnly}
              {...register('fechaPrimeraConsulta')}
            />
          </Campo>

          <Campo id="fechaCitaSubsecuente" label="Fecha de cita subsecuente">
            <Input
              id="fechaCitaSubsecuente"
              type="date"
              disabled={readOnly}
              {...register('fechaCitaSubsecuente')}
            />
          </Campo>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Firmas</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="odontologoId"
            label="Odontólogo"
            ayuda={
              doctorFueraDeCatalogo
                ? `Firmado por ${odontologoNombre}, que ya no está en el catálogo activo.`
                : undefined
            }
          >
            <Select
              value={odontologoId ? String(odontologoId) : ''}
              onValueChange={seleccionarDoctor}
              disabled={readOnly || cargandoDoctores || doctors.length === 0}
            >
              <SelectTrigger id="odontologoId">
                <SelectValue
                  placeholder={cargandoDoctores ? 'Cargando…' : 'Seleccionar odontólogo'}
                />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={String(doctor.id)}>
                    {etiquetaDoctor(doctor)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>

          <Campo
            id="odontologoCedula"
            label="Cédula profesional"
            ayuda="Se llena con el odontólogo seleccionado."
          >
            <Input id="odontologoCedula" disabled readOnly {...register('odontologoCedula')} />
          </Campo>
        </div>

        <div className="rounded-md border p-3">
          <div className="flex items-start gap-2">
            <Controller
              name="pacienteConfirma"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="pacienteConfirma"
                  className="mt-0.5"
                  checked={Boolean(field.value)}
                  disabled={readOnly}
                  onCheckedChange={marcarConfirmacion(field)}
                />
              )}
            />

            <div className="space-y-1">
              <Label htmlFor="pacienteConfirma" className="text-sm font-medium">
                El paciente confirma que la información es verídica
              </Label>
              {confirmadoEn ? (
                <p className="text-xs text-muted-foreground">Confirmado el {confirmadoEn}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
