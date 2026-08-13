'use client'

// §4 del formato — Antecedentes heredofamiliares.
// El papel trae una sola columna de captura por renglón; aquí se usa como
// checkbox + parentesco, que es lo que se escribe a mano en la práctica.

import { Controller, useFormContext } from 'react-hook-form'

import Campo from '../shared/Campo'
import { ANTECEDENTES_HEREDOFAMILIARES } from '../constants'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function AntecedentesHeredofamiliaresSection({ readOnly }) {
  const { control, register, watch } = useFormContext()

  return (
    <div className="space-y-3">
      {ANTECEDENTES_HEREDOFAMILIARES.map((item) => {
        const presente = watch(`heredofamiliares.${item.id}.presente`)

        return (
          <div key={item.id} className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Controller
                name={`heredofamiliares.${item.id}.presente`}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id={`heredofamiliares-${item.id}`}
                    checked={Boolean(field.value)}
                    disabled={readOnly}
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
                  disabled={readOnly}
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
          disabled={readOnly}
          {...register('heredofamiliaresOtros')}
        />
      </Campo>
    </div>
  )
}
