'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const pad2 = (n) => String(n).padStart(2, '0')
const toYYYYMMDD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

function parseYYYYMMDD(value) {
  if (!value) return undefined
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return undefined
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(dt.getTime()) ? undefined : dt
}

export default function StartDatePicker({ value, onChange }) {
  const selected = React.useMemo(() => parseYYYYMMDD(value), [value])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" className="bg-white pl-1 hover:bg-gray-200 justify-start">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CalendarIcon className="h-5 w-5" />
          </span>

          <span className="font-semibold text-black">
            {selected ? format(selected, 'MMM dd yyyy', { locale: es }) : 'Selecciona fecha'}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => d && onChange?.(toYYYYMMDD(d))}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}
