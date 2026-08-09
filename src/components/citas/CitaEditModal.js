'use client'

import { useEffect, useMemo, useState } from 'react'
import { es } from 'date-fns/locale'

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const cx = (...c) => c.filter(Boolean).join(' ')
const pad = (n) => String(n).padStart(2, '0')

const STATUSES = [
  { v: 'scheduled', label: 'Programada' },
  { v: 'confirmed', label: 'Confirmada' },
  { v: 'completed', label: 'Completada' },
  { v: 'cancelled', label: 'Cancelada' },
  { v: 'no_show', label: 'No asistió' },
]

function toLocalParts(iso) {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(d.getTime())) return { date: undefined, hh: '09', mm: '00' }
  return { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), hh: pad(d.getHours()), mm: pad(d.getMinutes()) }
}
const buildLocal = (date, hh, mm) =>
  date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(Number(hh))}:${pad(Number(mm))}` : ''
function addMinutesLocal(localStr, minutes) {
  const [ymd, hm] = localStr.split('T')
  const [y, m, d] = ymd.split('-').map(Number)
  const [hh, mm] = hm.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm)
  dt.setMinutes(dt.getMinutes() + Number(minutes || 0))
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`
}

/**
 * Editar una cita. Envía SOLO los campos que cambian (guardado por diferencias),
 * para no sobreescribir el título/descripción de citas de Confirmafy sin querer.
 * onSave(changes) -> PATCH; debe devolver true si tuvo éxito.
 */
export default function CitaEditModal({ open, onClose, cita, servicios = [], onSave }) {
  const [form, setForm] = useState(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !cita) return
    const p = toLocalParts(cita.start)
    const durMin = cita.start && cita.end
      ? Math.max(15, Math.round((new Date(cita.end) - new Date(cita.start)) / 60000))
      : 60
    setForm({
      nombre: cita.contactName || '',
      telefono: cita.contactPhone || '',
      date: p.date, hh: p.hh, mm: p.mm,
      durationMin: String(durMin),
      serviceId: cita.serviceId ? String(cita.serviceId) : '',
      status: cita.status || 'scheduled',
      observaciones: cita.observations || '',
    })
    setCalendarOpen(false)
    setSaving(false)
  }, [open, cita])

  const originalStartLocal = useMemo(() => {
    const p = toLocalParts(cita?.start)
    return p.date ? `${buildLocal(p.date, p.hh, p.mm)}:00` : ''
  }, [cita])
  const originalDur = useMemo(() => (cita?.start && cita?.end
    ? Math.round((new Date(cita.end) - new Date(cita.start)) / 60000) : 60), [cita])

  if (!cita || !form) return null

  const handleSave = async () => {
    const changes = {}
    // Tiempo (start/end) solo si cambió fecha/hora o duración
    const newStart = `${buildLocal(form.date, form.hh, form.mm)}:00`
    if (newStart !== originalStartLocal || String(form.durationMin) !== String(originalDur)) {
      changes.start = newStart
      changes.end = addMinutesLocal(buildLocal(form.date, form.hh, form.mm), form.durationMin)
    }
    if (form.nombre !== (cita.contactName || '')) changes.nombre = form.nombre
    if (form.telefono !== (cita.contactPhone || '')) changes.telefono = form.telefono
    if (form.status !== (cita.status || 'scheduled')) changes.status = form.status
    if (form.serviceId && Number(form.serviceId) !== Number(cita.serviceId || 0)) changes.serviceId = Number(form.serviceId)
    if (form.observaciones !== (cita.observations || '')) changes.observaciones = form.observaciones

    if (Object.keys(changes).length === 0) { onClose?.(); return }

    setSaving(true)
    const ok = await onSave?.(changes)
    setSaving(false)
    if (ok) onClose?.()
  }

  const hours = Array.from({ length: 24 }, (_, i) => pad(i))
  const minutes = ['00', '15', '30', '45']
  const durations = [['30', '30 min'], ['45', '45 min'], ['60', '1 hora'], ['90', '1 h 30 min'], ['120', '2 horas']]

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.() }}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Editar cita</DialogTitle>
          <DialogDescription>Solo se guardan los cambios que hagas.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del paciente" />
            </div>
            <div className="grid gap-2">
              <Label>WhatsApp</Label>
              <Input value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} inputMode="numeric" placeholder="Teléfono" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Fecha y hora</Label>
            <div className="grid gap-3 md:grid-cols-[1fr_110px_110px]">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className={cx('justify-start text-left font-normal', !form.date && 'text-muted-foreground')}>
                    {form.date ? form.date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" locale={es} formatters={{ formatMonthDropdown: (d) => d.toLocaleString('es-MX', { month: 'long' }) }} selected={form.date} onSelect={(d) => { setForm((f) => ({ ...f, date: d })); setCalendarOpen(false) }} className="rounded-md border shadow-sm" captionLayout="dropdown" />
                </PopoverContent>
              </Popover>
              <Select value={form.hh} onValueChange={(v) => setForm((f) => ({ ...f, hh: v }))}>
                <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                <SelectContent>{hours.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.mm} onValueChange={(v) => setForm((f) => ({ ...f, mm: v }))}>
                <SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger>
                <SelectContent>{minutes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Duración</Label>
              <Select value={form.durationMin} onValueChange={(v) => setForm((f) => ({ ...f, durationMin: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{durations.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tratamiento {cita.serviceId ? '' : '(opcional)'}</Label>
            <Select value={form.serviceId} onValueChange={(v) => setForm((f) => ({ ...f, serviceId: v }))}>
              <SelectTrigger><SelectValue placeholder="Sin cambiar" /></SelectTrigger>
              <SelectContent>{servicios.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Observaciones</Label>
            <Textarea rows={4} value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={saving || !form.date}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
