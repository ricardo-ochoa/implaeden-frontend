'use client'

// §14 del formato — Odontograma inicial y final.
// El papel pide dos diagramas: el del diagnóstico y el del cierre del
// tratamiento. Aquí son dos "snapshots" independientes, cada uno con su fecha;
// el final normalmente se llena en una consulta posterior.

import * as React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Copy } from 'lucide-react'

import Campo from '../shared/Campo'
import Odontograma from '../odontograma/Odontograma'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const VISTAS = [
  { id: 'odontogramaInicial', label: 'Inicial' },
  { id: 'odontogramaFinal', label: 'Final' },
]

export default function OdontogramaSection({ readOnly }) {
  const { control, getValues, setValue } = useFormContext()
  const [vista, setVista] = React.useState('odontogramaInicial')

  // Atajo habitual: el odontograma final casi siempre parte del inicial.
  const copiarDesdeInicial = () => {
    const inicial = getValues('odontogramaInicial')
    const finalActual = getValues('odontogramaFinal')

    setValue(
      'odontogramaFinal',
      { ...finalActual, dientes: JSON.parse(JSON.stringify(inicial?.dientes || {})) },
      { shouldDirty: true }
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={vista}
          onValueChange={(v) => v && setVista(v)}
          variant="outline"
        >
          {VISTAS.map((v) => (
            <ToggleGroupItem key={v.id} value={v.id} className="px-4">
              {v.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {vista === 'odontogramaFinal' && !readOnly ? (
          <Button type="button" variant="outline" size="sm" onClick={copiarDesdeInicial}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar del inicial
          </Button>
        ) : null}
      </div>

      {/* Las dos vistas quedan montadas para no perder el scroll ni desregistrar
          el campo al cambiar de pestaña. */}
      {VISTAS.map((v) => (
        <div key={v.id} hidden={vista !== v.id} className="space-y-4">
          <Controller
            name={v.id}
            control={control}
            render={({ field }) => (
              <>
                <Campo id={`${v.id}-fecha`} label={`Fecha del odontograma ${v.label.toLowerCase()}`}>
                  <Input
                    id={`${v.id}-fecha`}
                    type="date"
                    className="sm:max-w-xs"
                    disabled={readOnly}
                    value={field.value?.fecha || ''}
                    onChange={(e) => field.onChange({ ...field.value, fecha: e.target.value })}
                  />
                </Campo>

                <Odontograma value={field.value} onChange={field.onChange} readOnly={readOnly} />
              </>
            )}
          />
        </div>
      ))}
    </div>
  )
}
