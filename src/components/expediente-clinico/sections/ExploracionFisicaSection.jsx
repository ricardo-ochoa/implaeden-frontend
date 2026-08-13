'use client'

// §12 y §13 del formato — Exploración física (habitus exterior) y exploración
// de cabeza, cavidad oral y cuello.

import { useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { EXPLORACION_CAMPOS, SIGNOS_VITALES } from '../constants'

import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

export default function ExploracionFisicaSection({ readOnly }) {
  const { register } = useFormContext()

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Habitus exterior</h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIGNOS_VITALES.map((signo) => (
            <Campo key={signo.id} id={signo.id} label={`${signo.label} (${signo.unidad})`}>
              <Input
                id={signo.id}
                type={signo.tipo}
                step={signo.step}
                placeholder={signo.placeholder}
                disabled={readOnly}
                {...register(signo.id)}
              />
            </Campo>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Cabeza, cavidad oral y cuello</h3>

        <div className="space-y-4">
          {EXPLORACION_CAMPOS.map((campo) => (
            <Campo key={campo.id} id={campo.id} label={campo.label}>
              <Textarea id={campo.id} rows={2} disabled={readOnly} {...register(campo.id)} />
            </Campo>
          ))}
        </div>
      </section>
    </div>
  )
}
