'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronDown, X } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

function normalizeOptions(teeth, teethOptions) {
  if (Array.isArray(teethOptions) && teethOptions.length) return teethOptions
  const base = Array.isArray(teeth) ? teeth : []
  return base.map((id) => ({ id, label: `Diente ${id}` }))
}

export default function TeethMultiSelect({
  teeth = [], // dientes disponibles para ese tratamiento
  teethOptions, // opcional: [{id: 26, label:'Primer molar'}]
  value = [],
  onChange,
  placeholder = 'Selecciona dientes',
  disabled = false,
}) {
  const options = React.useMemo(
    () => normalizeOptions(teeth, teethOptions),
    [teeth, teethOptions]
  )

  const selected = Array.isArray(value) ? value : []
  const selectedSet = React.useMemo(() => new Set(selected), [selected])

  const labelFor = React.useCallback(
    (id) => options.find((o) => o.id === id)?.label || `Diente ${id}`,
    [options]
  )

  const toggle = (id) => {
    if (disabled) return
    const next = selectedSet.has(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id]
    onChange?.(next)
  }

  const remove = (id) => {
    if (disabled) return
    onChange?.(selected.filter((x) => x !== id))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cx(
            'w-full rounded-md border bg-background px-3 py-2',
            'flex items-center justify-between gap-3',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/30'
          )}
        >
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            {selected.length === 0 ? (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((id) => (
                <Badge
                  key={id}
                  variant="outline"
                  className="rounded-full px-2 py-1 bg-violet-500/15 text-violet-500 border-violet-500"
                >
                  <span className="font-semibold">{id}</span>
                  {/* <span className="mr-2">{labelFor(id)}</span> */}

                  <button
                    type="button"
                    className="ml-2 inline-flex items-center justify-center rounded-ful hover:bg-violet-500/20"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      remove(id)
                    }}
                    aria-label={`Quitar diente ${id}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar diente..." />
          <CommandList>
            <CommandEmpty>No hay resultados.</CommandEmpty>
            <CommandGroup heading="Dientes disponibles">
              {options.map((o) => {
                const isSelected = selectedSet.has(o.id)
                return (
                  <CommandItem
                    key={o.id}
                    value={`${o.id} ${o.label}`}
                    onSelect={() => toggle(o.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-9 text-sm font-semibold">{o.id}</span>
                      {/* <span className="text-sm">{o.label}</span> */}
                    </div>
                    {isSelected ? <Check className="h-4 w-4" /> : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
