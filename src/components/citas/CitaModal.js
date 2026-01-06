'use client'

import { useEffect, useMemo, useState } from 'react'

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// mini helper
const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function CitaModal({
  open,
  onClose,
  servicios = [],
  onSave,
  initialData = null,
}) {
  const [form, setForm] = useState({
    appointment_at: '',
    service_id: '',
    observaciones: '',
  })

  const [calendarOpen, setCalendarOpen] = useState(false)

  // --- helpers: parse/format YYYY-MM-DDTHH:mm ---
  const pad = (n) => String(n).padStart(2, '0')

  const toLocalDateTime = (iso) => {
    if (!iso) return ''
    const dt = new Date(iso)
    if (isNaN(dt.getTime())) return ''

    const YYYY = dt.getFullYear()
    const MM = pad(dt.getMonth() + 1)
    const DD = pad(dt.getDate())
    const hh = pad(dt.getHours())
    const mm = pad(dt.getMinutes())
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`
  }

  const parseLocalDateTime = (value) => {
    // value: YYYY-MM-DDTHH:mm
    if (!value || !value.includes('T')) return { date: undefined, hh: '09', mm: '00' }
    const [ymd, hm] = value.split('T')
    const [y, m, d] = ymd.split('-').map(Number)
    const [hh, mm] = hm.split(':')
    const date = y && m && d ? new Date(y, m - 1, d) : undefined
    return { date, hh: hh || '09', mm: mm || '00' }
  }

  const buildLocalDateTime = (date, hh, mm) => {
    if (!date) return ''
    const YYYY = date.getFullYear()
    const MM = pad(date.getMonth() + 1)
    const DD = pad(date.getDate())
    return `${YYYY}-${MM}-${DD}T${pad(Number(hh))}:${pad(Number(mm))}`
  }

  // derived UI values from form.appointment_at
  const { date: selectedDate, hh, mm } = useMemo(
    () => parseLocalDateTime(form.appointment_at),
    [form.appointment_at]
  )

  useEffect(() => {
    if (!open) return

    if (initialData) {
      setForm({
        appointment_at: toLocalDateTime(initialData.appointment_at),
        service_id: String(initialData.service_id ?? ''),
        observaciones: initialData.observaciones || '',
      })
    } else {
      setForm({
        appointment_at: '',
        service_id: '',
        observaciones: '',
      })
    }

    setCalendarOpen(false)
  }, [open, initialData])

  const handleGuardar = async () => {
    const ok = await onSave?.(form)
    if (ok) onClose?.()
  }

  const isValid = Boolean(form.appointment_at && form.service_id)

  // options
  const hours = Array.from({ length: 24 }, (_, i) => pad(i))
  const minutes = ['00', '15', '30', '45']

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose?.()
      }}
    >
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="font-bold">
            {initialData ? 'Editar Cita' : 'Registrar Nueva Cita'}
          </DialogTitle>
          <DialogDescription>
            Selecciona fecha, hora y tratamiento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          {/* Fecha + hora */}
          <div className="grid gap-2">
            <Label>Fecha y Hora</Label>

            <div className="grid gap-3 md:grid-cols-[1fr_140px_140px]">
              {/* Fecha (Calendar) */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cx(
                      'justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    {selectedDate
                      ? selectedDate.toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Selecciona fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      const next = buildLocalDateTime(d, hh, mm)
                      setForm((f) => ({ ...f, appointment_at: next }))
                      setCalendarOpen(false)
                    }}
                    className="rounded-md border shadow-sm"
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              {/* Hora */}
              <Select
                value={hh}
                onValueChange={(v) => {
                  const next = buildLocalDateTime(selectedDate, v, mm)
                  setForm((f) => ({ ...f, appointment_at: next }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Minutos */}
              <Select
                value={mm}
                onValueChange={(v) => {
                  const next = buildLocalDateTime(selectedDate, hh, v)
                  setForm((f) => ({ ...f, appointment_at: next }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Guardaremos: <span className="font-mono">{form.appointment_at || '—'}</span>
            </p>
          </div>

          {/* Tratamiento */}
          <div className="grid gap-2">
            <Label>Tratamiento</Label>
            <Select
              value={String(form.service_id || '')}
              onValueChange={(v) => setForm((f) => ({ ...f, service_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tratamiento" />
              </SelectTrigger>
              <SelectContent>
                {servicios.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="grid gap-2">
            <Label>Observaciones</Label>
            <Textarea
              rows={4}
              value={form.observaciones}
              onChange={(e) =>
                setForm((f) => ({ ...f, observaciones: e.target.value }))
              }
              placeholder="Comentarios adicionales..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar} disabled={!isValid}>
            {initialData ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
