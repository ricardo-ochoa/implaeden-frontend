'use client'

import { useEffect, useState } from 'react'
import { es } from 'date-fns/locale'
import api from '../../../lib/api'

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, User, Phone } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')
const pad = (n) => String(n).padStart(2, '0')

// (h 1-12, AM/PM) -> hora 24h
const to24 = (h12, ampm) => {
  let h = Number(h12) % 12
  if (ampm === 'PM') h += 12
  return h
}
const buildLocal = (date, h24, mm) =>
  date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(h24)}:${pad(Number(mm))}:00` : ''
function addMinutesLocal(localStr, minutes) {
  if (!localStr) return ''
  const [ymd, hms] = localStr.split('T')
  const [y, m, d] = ymd.split('-').map(Number)
  const [hh, mm] = hms.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm)
  dt.setMinutes(dt.getMinutes() + minutes)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`
}

const HOURS12 = Array.from({ length: 12 }, (_, i) => String(i + 1)) // 1..12
const MINUTES = ['00', '15', '30', '45']

/**
 * Quick-create estilo Google Calendar: al hacer click en un día del calendario.
 * Captura Nombre + WhatsApp + rango de hora (12h am/pm). onSave({nombre,telefono,start,end}).
 */
export default function QuickCreateCitaModal({ open, onClose, date, onSave }) {
  const [form, setForm] = useState(null)
  const [calOpen, setCalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [matches, setMatches] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm({
      nombre: '',
      telefono: '',
      date: date || new Date(),
      sh: '9', sm: '00', sap: 'AM',   // inicio 9:00 AM (dura 1 h)
    })
    setCalOpen(false)
    setSaving(false)
    setMatches([])
    setSelectedPatient(null)
  }, [open, date])

  // Al escribir el WhatsApp, busca pacientes con ese teléfono (match por patient_phones).
  async function onPhoneChange(v) {
    setForm((f) => ({ ...f, telefono: v }))
    setSelectedPatient(null)
    const digits = v.replace(/\D/g, '')
    if (digits.length >= 10) {
      try {
        const res = await api.get(`/appointments/suggest?phone=${encodeURIComponent(digits)}`)
        setMatches(res.data?.candidates || [])
      } catch { setMatches([]) }
    } else {
      setMatches([])
    }
  }
  function pickPatient(p) {
    const name = `${p.nombre || ''} ${p.apellidos || ''}`.trim()
    setSelectedPatient({ id: p.id, name })
    setForm((f) => ({ ...f, nombre: name }))
    setMatches([])
  }

  if (!form) return null

  const startLocal = buildLocal(form.date, to24(form.sh, form.sap), form.sm)
  const endLocal = addMinutesLocal(startLocal, 60) // 1 h por defecto
  const isValid = Boolean(form.nombre.trim() && form.date && startLocal)

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    const ok = await onSave?.({
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      start: startLocal,
      end: endLocal,
      patientId: selectedPatient?.id, // si eligió un paciente, se vincula directo
    })
    setSaving(false)
    if (ok) onClose?.()
  }

  const TimeRow = ({ label, h, m, ap, set }) => (
    <div className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
        <Select value={h} onValueChange={(v) => set('h', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{HOURS12.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={m} onValueChange={(v) => set('m', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{MINUTES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={ap} onValueChange={(v) => set('ap', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.() }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
          <DialogDescription>Se guardará en Google Calendar. Si el teléfono coincide con un paciente, se vincula solo.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Nombre */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5"><User className="h-4 w-4" />Nombre</Label>
            <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del paciente" autoFocus />
          </div>

          {/* WhatsApp */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5"><Phone className="h-4 w-4" />WhatsApp</Label>
            <Input value={form.telefono} onChange={(e) => onPhoneChange(e.target.value)} inputMode="numeric" placeholder="10 dígitos" />
            {selectedPatient ? (
              <div className="text-xs flex items-center gap-2 text-emerald-700">
                Se vinculará a <b>{selectedPatient.name}</b> (#{selectedPatient.id})
                <button type="button" className="underline text-muted-foreground" onClick={() => setSelectedPatient(null)}>quitar</button>
              </div>
            ) : matches.length > 0 ? (
              <div className="rounded-md border divide-y bg-background">
                <div className="px-2 py-1 text-xs text-muted-foreground">Paciente(s) con este teléfono — clic para vincular:</div>
                {matches.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPatient(p)}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted/50 flex items-center justify-between"
                  >
                    <span>{`${p.nombre || ''} ${p.apellidos || ''}`.trim()}</span>
                    <span className="text-xs text-muted-foreground">#{p.id}{p.telefono ? ` · ${p.telefono}` : ''}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Fecha */}
          <div className="grid gap-2">
            <Label>Fecha</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={cx('justify-start text-left font-normal', !form.date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.date ? form.date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Selecciona fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" locale={es} formatters={{ formatMonthDropdown: (d) => d.toLocaleString('es-MX', { month: 'long' }) }} selected={form.date} onSelect={(d) => { if (d) setForm((f) => ({ ...f, date: d })); setCalOpen(false) }} className="rounded-md border shadow-sm" captionLayout="dropdown" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hora de inicio (12h am/pm) — duración fija de 1 h */}
          <TimeRow label="Hora (dura 1 h)" h={form.sh} m={form.sm} ap={form.sap}
            set={(k, v) => setForm((f) => ({ ...f, [k === 'h' ? 'sh' : k === 'm' ? 'sm' : 'sap']: v }))} />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={!isValid || saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
