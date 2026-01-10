'use client'

import { useEffect, useMemo, useState } from 'react'

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

// icons
import { Check, ChevronDown, Loader2 } from 'lucide-react'

const normalize = (s = '') =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

function uniqStrings(arr) {
  return Array.from(new Set(arr.filter(Boolean).map((s) => String(s).trim()))).sort((a, b) =>
    a.localeCompare(b)
  )
}

function ComboBox({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Escribe o selecciona…',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)

  const selectedLabel = value?.trim() ? value : ''

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex gap-2">
        {/* Input libre */}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />

        {/* Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={disabled}
              aria-label={`Seleccionar ${label}`}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="p-0 w-[320px]" align="end">
            <Command>
              <CommandInput placeholder={`Buscar ${label.toLowerCase()}…`} />
              <CommandList>
                <CommandEmpty>No hay resultados</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => {
                    const isSelected = normalize(opt) === normalize(selectedLabel)
                    return (
                      <CommandItem
                        key={opt}
                        value={opt}
                        onSelect={() => {
                          onChange(opt)
                          setOpen(false)
                        }}
                      >
                        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                          {isSelected ? <Check className="h-4 w-4" /> : null}
                        </span>
                        <span className="truncate">{opt}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export default function ServiceFormDialog({
  open,
  onOpenChange,
  mode = 'create', // 'create' | 'edit'
  initialValue = null,
  services = [],
  onSubmit,
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initialValue?.name || '')
    setCategory(initialValue?.category || '')
    setDescription(initialValue?.description || '')
  }, [open, initialValue])

  // Opciones existentes
  const nameOptions = useMemo(
    () => uniqStrings(services.map((s) => s?.name)),
    [services]
  )

  const categoryOptions = useMemo(
    () => uniqStrings(services.map((s) => s?.category)),
    [services]
  )

  // 🔒 Regla: no permitir crear si existe EXACTO name+category
  const duplicateExact = useMemo(() => {
    if (mode !== 'create') return false
    const n = normalize(name)
    const c = normalize(category)
    if (!n || !c) return false
    return services.some(
      (s) => normalize(s?.name) === n && normalize(s?.category) === c
    )
  }, [mode, name, category, services])

  // validación mínima
  const canSubmit =
    name.trim().length >= 3 &&
    category.trim().length >= 2 &&
    !duplicateExact

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit?.({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar servicio' : 'Nuevo servicio'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'create' && duplicateExact ? (
            <Alert variant="destructive">
              <AlertTitle>Ya existe</AlertTitle>
              <AlertDescription>
                Ya existe un servicio con el mismo <b>Nombre</b> y <b>Categoría</b>.
                Cambia alguno de los dos para poder crearlo.
              </AlertDescription>
            </Alert>
          ) : null}

          <ComboBox
            label="Nombre"
            value={name}
            onChange={setName}
            options={nameOptions}
            placeholder="Ej. Implantes Dentales"
            disabled={loading}
          />

          <ComboBox
            label="Categoría"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            placeholder="Ej. Cirugías Dentales"
            disabled={loading}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el servicio…"
              disabled={loading}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'edit' ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
