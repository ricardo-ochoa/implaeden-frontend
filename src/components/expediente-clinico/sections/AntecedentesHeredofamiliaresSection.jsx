'use client'

// §4 del formato — Antecedentes heredofamiliares.
// El papel trae una sola columna de captura por renglón; aquí se usa como
// checkbox + parentesco, que es lo que se escribe a mano en la práctica.
//
// El paso es obligatorio, y cuatro casillas vacías son ambiguas (¿no tiene o no
// se preguntó?). Por eso existe "No hay antecedentes", excluyente con el resto:
// si ya se marcó algún padecimiento o se escribió en "Otros" queda deshabilitada,
// y mientras esté marcada se deshabilitan los renglones.

import { Controller, useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { ANTECEDENTES_HEREDOFAMILIARES } from '../constants'
import { hayHeredofamiliares } from '../completitud'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export default function AntecedentesHeredofamiliaresSection({ readOnly }) {
  const { control, register, watch } = useFormContext()

  const sinAntecedentes = watch('heredofamiliaresSinAntecedentes') === true
  const hayAlguno = hayHeredofamiliares({
    heredofamiliares: watch('heredofamiliares'),
    heredofamiliaresOtros: watch('heredofamiliaresOtros'),
  })

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'rounded-md border p-3',
          sinAntecedentes && 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/30',
          !sinAntecedentes && !hayAlguno && 'border-l-2 border-l-amber-400'
        )}
      >
        <div className="flex items-start gap-2">
          <Controller
            name="heredofamiliaresSinAntecedentes"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="heredofamiliaresSinAntecedentes"
                className="mt-0.5"
                checked={Boolean(field.value)}
                disabled={readOnly || hayAlguno}
                onCheckedChange={(v) => field.onChange(v === true)}
              />
            )}
          />
          <div className="min-w-0">
            <Label
              htmlFor="heredofamiliaresSinAntecedentes"
              className={cn('text-sm font-medium', hayAlguno && 'text-muted-foreground')}
            >
              No hay antecedentes heredofamiliares
            </Label>
            <p className="text-xs text-muted-foreground">
              {hayAlguno
                ? 'No disponible: ya se registró al menos un antecedente familiar.'
                : 'Marca esta casilla si se interrogó y el paciente no refiere ningún antecedente familiar.'}
            </p>
          </div>
        </div>
      </div>

      {ANTECEDENTES_HEREDOFAMILIARES.map((item) => {
        const presente = watch(`heredofamiliares.${item.id}.presente`)

        return (
          <div key={item.id} className={cn('space-y-2 rounded-md border p-3', sinAntecedentes && 'opacity-60')}>
            <div className="flex items-center gap-2">
              <Controller
                name={`heredofamiliares.${item.id}.presente`}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id={`heredofamiliares-${item.id}`}
                    checked={Boolean(field.value)}
                    disabled={readOnly || sinAntecedentes}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                )}
              />
              <Label htmlFor={`heredofamiliares-${item.id}`} className="text-sm font-medium">
                {item.label}
              </Label>
            </div>

            {presente ? (
              <div className="space-y-1.5 pl-6">
                <Label className="text-xs text-muted-foreground">Parentesco</Label>
                <Input
                  disabled={readOnly || sinAntecedentes}
                  placeholder="Ej. madre, abuelo paterno"
                  {...register(`heredofamiliares.${item.id}.parentesco`)}
                />
              </div>
            ) : null}
          </div>
        )
      })}

      <Campo
        id="heredofamiliaresOtros"
        label="Otros"
        ayuda="Otros antecedentes familiares relevantes."
      >
        <Textarea
          id="heredofamiliaresOtros"
          rows={3}
          disabled={readOnly || sinAntecedentes}
          {...register('heredofamiliaresOtros')}
        />
      </Campo>
    </div>
  )
}
