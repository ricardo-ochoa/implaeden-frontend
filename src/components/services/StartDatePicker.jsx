'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

const pad2 = (n) => String(n).padStart(2, '0')
const toYYYYMMDD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

// ✅ Acepta "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD HH:mm:ss"
function normalizeYMD(value) {
  if (!value) return ''
  const m = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

function parseYYYYMMDD(value) {
  const ymd = normalizeYMD(value)
  if (!ymd) return undefined
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return undefined
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(dt.getTime()) ? undefined : dt
}

export default function StartDatePicker({ value, onChange, allowManual = true }) {
  const ymd = React.useMemo(() => normalizeYMD(value), [value])
  const selected = React.useMemo(() => parseYYYYMMDD(ymd), [ymd])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="bg-white pl-2 hover:bg-gray-200 justify-start gap-2"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CalendarIcon className="h-5 w-5" />
          </span>

          <span className="font-semibold text-black">
            {selected ? format(selected, 'MMM dd yyyy', { locale: es }) : 'Selecciona fecha'}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && onChange?.(toYYYYMMDD(d))}
            captionLayout="dropdown"
          />

          {allowManual ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Editar manualmente</p>
              <Input
                type="date"
                value={ymd}
                onChange={(e) => onChange?.(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full"
                  onClick={() => onChange?.(toYYYYMMDD(new Date()))}
                >
                  Hoy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full"
                  onClick={() => onChange?.('')}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
