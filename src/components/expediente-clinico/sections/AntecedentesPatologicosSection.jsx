'use client'

// §5 del formato — Antecedentes personales patológicos.
// Tabla SI / NO / TIEMPO DE EVOLUCIÓN. El campo de evolución solo se habilita
// cuando la respuesta es "Sí", igual que en el papel (donde queda en blanco).
//
// Los 14 renglones son obligatorios: lo que no aplica se marca "No", no se deja
// vacío. Para que eso no signifique 14 clics, el botón de arriba responde "No"
// en todo lo que siga pendiente y deja libre marcar el "Sí" de lo que sí aplica.

import { Controller, useFormContext } from 'react-hook-form'

import { ANTECEDENTES_PATOLOGICOS } from '../constants'
import { patologicosPendientes, respondido } from '../completitud'
import { SiNoToggle } from '../shared/SiNoField'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function AntecedentesPatologicosSection({ readOnly }) {
  const { control, register, setValue, watch } = useFormContext()

  const antecedentesPatologicos = watch('antecedentesPatologicos')
  const pendientes = patologicosPendientes({ antecedentesPatologicos })
  const total = ANTECEDENTES_PATOLOGICOS.length

  const marcarPendientesEnNo = () => {
    pendientes.forEach((item) => {
      setValue(`antecedentesPatologicos.${item.id}.presente`, false, {
        shouldDirty: true,
        shouldTouch: true,
      })
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
        <p className="text-xs">
          <span className="font-medium">
            {total - pendientes.length} de {total}
          </span>{' '}
          <span className="text-muted-foreground">
            respondidos. Lo que no aplica se marca &ldquo;No&rdquo;.
          </span>
        </p>

        {!readOnly ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendientes.length === 0}
            onClick={marcarPendientesEnNo}
          >
            Marcar los {pendientes.length} pendientes como &ldquo;No&rdquo;
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-md border">
        <div className="hidden grid-cols-[1fr_auto_200px] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>Padecimiento</span>
          <span className="text-center">Sí / No</span>
          <span>Tiempo de evolución</span>
        </div>

        {ANTECEDENTES_PATOLOGICOS.map((item, index) => {
          const presente = antecedentesPatologicos?.[item.id]?.presente ?? null
          const pendiente = !respondido(presente)

          return (
            <div
              key={item.id}
              className={cn(
                'grid gap-3 px-3 py-2.5 sm:grid-cols-[1fr_auto_200px] sm:items-center',
                index % 2 ? 'bg-muted/20' : '',
                // Franja ámbar en lo que falta: se va vaciando conforme se
                // responde, sin necesidad de leer renglón por renglón.
                pendiente && 'border-l-2 border-l-amber-400'
              )}
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
    </div>
  )
}
