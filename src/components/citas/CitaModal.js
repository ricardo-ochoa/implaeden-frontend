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

const cx = (...classes) => classes.filter(Boolean).join(' ')
const pad = (n) => String(n).padStart(2, '0')

// Suma minutos a un datetime local "YYYY-MM-DDTHH:mm" y devuelve "YYYY-MM-DDTHH:mm:00"
function addMinutesLocal(localStr, minutes) {
  const [ymd, hm] = localStr.split('T')
  const [y, m, d] = ymd.split('-').map(Number)
  const [hh, mm] = hm.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm)
  dt.setMinutes(dt.getMinutes() + Number(minutes || 0))
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`
}

/**
 * Modal para CREAR una cita (Fase 1). El backend la escribe en Google Calendar.
 * Enviamos hora "de pared" (sin offset) + el backend aplica la zona de la clínica.
 */
export default function CitaModal({ open, onClose, servicios = [], onSave }) {
  const [form, setForm] = useState({
    appointment_at: '', // "YYYY-MM-DDTHH:mm" (local)
    serviceId: '',
    durationMin: '60',
    observaciones: '',
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const parseLocal = (value) => {
    if (!value || !value.includes('T')) return { date: undefined, hh: '09', mm: '00' }
    const [ymd, hm] = value.split('T')
    const [y, m, d] = ymd.split('-').map(Number)
    const [hh, mm] = hm.split(':')
    const date = y && m && d ? new Date(y, m - 1, d) : undefined
    return { date, hh: hh || '09', mm: mm || '00' }
  }
  const buildLocal = (date, hh, mm) => {
    if (!date) return ''
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(Number(hh))}:${pad(Number(mm))}`
  }

  const { date: selectedDate, hh, mm } = useMemo(
    () => parseLocal(form.appointment_at),
    [form.appointment_at]
  )

  useEffect(() => {
    if (!open) return
    setForm({ appointment_at: '', serviceId: '', durationMin: '60', observaciones: '' })
    setCalendarOpen(false)
    setSaving(false)
  }, [open])

  const isValid = Boolean(form.appointment_at) // el tratamiento es opcional

  const handleGuardar = async () => {
    if (!isValid) return
    setSaving(true)
    const start = `${form.appointment_at}:00`
    const end = addMinutesLocal(form.appointment_at, form.durationMin)
    const payload = { start, end, observaciones: form.observaciones, status: 'scheduled' }
    if (form.serviceId) payload.serviceId = Number(form.serviceId)
    else payload.serviceName = 'Chequeo General' // default cuando no eligen tratamiento
    const ok = await onSave?.(payload)
    setSaving(false)
    if (ok) onClose?.()
  }

  const hours = Array.from({ length: 24 }, (_, i) => pad(i))
  const minutes = ['00', '15', '30', '45']
  const durations = [
    { v: '30', label: '30 min' },
    { v: '45', label: '45 min' },
    { v: '60', label: '1 hora' },
    { v: '90', label: '1 h 30 min' },
    { v: '120', label: '2 horas' },
  ]

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.() }}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="font-bold">Registrar Nueva Cita</DialogTitle>
          <DialogDescription>
            Se guardará en Google Calendar (agenda de la clínica).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          {/* Fecha + hora */}
          <div className="grid gap-2">
            <Label>Fecha y Hora</Label>
            <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cx('justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}
                  >
                    {selectedDate
                      ? selectedDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Selecciona fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      setForm((f) => ({ ...f, appointment_at: buildLocal(d, hh, mm) }))
                      setCalendarOpen(false)
                    }}
                    className="rounded-md border shadow-sm"
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              <Select value={hh} onValueChange={(v) => setForm((f) => ({ ...f, appointment_at: buildLocal(selectedDate, v, mm) }))}>
                <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                <SelectContent>{hours.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>

              <Select value={mm} onValueChange={(v) => setForm((f) => ({ ...f, appointment_at: buildLocal(selectedDate, hh, v) }))}>
                <SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger>
                <SelectContent>{minutes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Duración */}
          <div className="grid gap-2">
            <Label>Duración</Label>
            <Select value={form.durationMin} onValueChange={(v) => setForm((f) => ({ ...f, durationMin: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{durations.map((d) => <SelectItem key={d.v} value={d.v}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Tratamiento */}
          <div className="grid gap-2">
            <Label>Tratamiento (opcional)</Label>
            <Select value={String(form.serviceId || '')} onValueChange={(v) => setForm((f) => ({ ...f, serviceId: v }))}>
              <SelectTrigger><SelectValue placeholder="Chequeo General (por defecto)" /></SelectTrigger>
              <SelectContent>
                {servicios.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="grid gap-2">
            <Label>Observaciones</Label>
            <Textarea
              rows={4}
              value={form.observaciones}
              onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
              placeholder="Comentarios adicionales..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleGuardar} disabled={!isValid || saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
