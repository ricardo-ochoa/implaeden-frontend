'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import api, { fetcher } from '../../../lib/api'
import CitaEditModal from '@/components/citas/CitaEditModal'
import QuickCreateCitaModal from '@/components/citas/QuickCreateCitaModal'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft, ChevronRight, Loader2, Search, Clock, User, Stethoscope, ExternalLink, Pencil, Trash2, Link2, Phone,
} from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

// ---- catálogos de estilo (mismos tokens shadcn del proyecto) ----
const STATUS = {
  scheduled: { label: 'Programada', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500', accent: 'border-l-blue-500' },
  confirmed: { label: 'Confirmada', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', accent: 'border-l-emerald-500' },
  completed: { label: 'Completada', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400', accent: 'border-l-gray-400' },
  cancelled: { label: 'Cancelada', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500', accent: 'border-l-red-500' },
  no_show:   { label: 'No asistió', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', accent: 'border-l-amber-500' },
}
const SOURCE = {
  'clinic-app': { label: 'App', badge: 'bg-indigo-100 text-indigo-800' },
  confirmafy:   { label: 'Confirmafy', badge: 'bg-teal-100 text-teal-800' },
  manual:       { label: 'Manual', badge: 'bg-slate-100 text-slate-700' },
}
const st = (s) => STATUS[s] || STATUS.scheduled
const sr = (s) => SOURCE[s] || SOURCE.manual

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] // lunes primero

const pad = (n) => String(n).padStart(2, '0')
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hourFmt = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '')
const longFmt = (iso) => (iso ? new Date(iso).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—')
const monthLabel = (iso) => new Date(iso).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

// Matriz de 6 semanas (lunes primero) para el mes del ancla.
function monthGrid(anchor) {
  const y = anchor.getFullYear(), m = anchor.getMonth()
  const first = new Date(y, m, 1)
  const startOffset = (first.getDay() + 6) % 7 // días desde el lunes
  const gridStart = new Date(y, m, 1 - startOffset)
  const weeks = []
  const cur = new Date(gridStart)
  for (let w = 0; w < 6; w++) {
    const days = []
    for (let d = 0; d < 7; d++) {
      days.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(days)
  }
  return { weeks, month: m }
}

export default function AgendaClient({ initialAppointments = [], initialFrom, initialTo }) {
  const [range, setRange] = useState({ from: initialFrom, to: initialTo })
  const [search, setSearch] = useState('')
  const [sourceF, setSourceF] = useState('all')
  const [statusF, setStatusF] = useState('all')
  const [selected, setSelected] = useState(null)

  const key = `/appointments/calendar?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, { fallbackData: initialAppointments })
  const { data: servData } = useSWR('/servicios', fetcher)
  const servicios = Array.isArray(servData) ? servData : []
  const citas = Array.isArray(data) ? data : []

  // Sugerencia de paciente para la cita seleccionada si está SIN asignar
  const suggestKey = selected && !selected.isLinked && (selected.contactPhone || selected.contactName)
    ? `/appointments/suggest?phone=${encodeURIComponent(selected.contactPhone || '')}&name=${encodeURIComponent(selected.contactName || '')}`
    : null
  const { data: suggestion } = useSWR(suggestKey, fetcher)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [newFor, setNewFor] = useState(null) // día clicado para crear cita

  async function handleCreate(payload) {
    try {
      await api.post('/appointments', payload)
      await mutate()
      return true
    } catch (e) { return false }
  }
  async function linkAppt(eventId, patientId, addPhone) {
    try {
      await api.post(`/appointments/${eventId}/link`, { patientId, addPhone })
      await mutate()
      setSelected(null)
    } catch (e) { /* noop */ }
  }

  async function saveEdit(changes) {
    try {
      await api.patch(`/appointments/${editing.eventId}`, changes)
      await mutate()
      return true
    } catch (e) { return false }
  }
  async function doDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/appointments/${confirmDelete.eventId}`)
      await mutate()
    } catch (e) { /* noop */ } finally {
      setDeleting(false)
      setConfirmDelete(null)
      setSelected(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return citas.filter((c) => {
      if (sourceF !== 'all' && c.source !== sourceF) return false
      if (statusF !== 'all' && c.status !== statusF) return false
      if (q) {
        const hay = `${c.treatment || ''} ${c.observations || ''} ${c.patientId || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [citas, search, sourceF, statusF])

  // Citas por día (clave local yyyy-mm-dd)
  const byDay = useMemo(() => {
    const map = {}
    for (const c of filtered) {
      if (!c.start) continue
      const k = dayKey(new Date(c.start))
      ;(map[k] = map[k] || []).push(c)
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => new Date(a.start) - new Date(b.start))
    return map
  }, [filtered])

  const { weeks, month } = useMemo(() => monthGrid(new Date(range.from)), [range.from])
  const todayKey = dayKey(new Date())

  const shiftMonth = (delta) => {
    const base = new Date(range.from)
    const from = new Date(base.getFullYear(), base.getMonth() + delta, 1)
    const to = new Date(base.getFullYear(), base.getMonth() + delta + 1, 0, 23, 59, 59)
    setRange({ from: from.toISOString(), to: to.toISOString() })
  }

  return (
    <div>
      {/* ---- Barra de filtros ---- */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente/tratamiento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[220px]"
          />
        </div>

        <Select value={sourceF} onValueChange={setSourceF}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Origen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            <SelectItem value="clinic-app">App</SelectItem>
            <SelectItem value="confirmafy">Confirmafy</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Link href="/agenda/sin-asignar">
          <Button variant="outline" size="sm">Sin asignar</Button>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-[150px] text-center font-medium capitalize">{monthLabel(range.from)}</span>
          <Button variant="outline" size="sm" onClick={() => shiftMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>No se pudo cargar la agenda</AlertTitle>
          <AlertDescription>Revisa que Google Calendar esté configurado en el servidor.</AlertDescription>
        </Alert>
      ) : null}

      <div className="text-sm text-muted-foreground mb-2">{filtered.length} cita(s) · Google Calendar</div>

      {/* ---- Grid del mes ---- */}
      <div className="border rounded-lg overflow-hidden">
        {/* Encabezados de día */}
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {WEEKDAYS.map((d) => (
            <div key={d} className="p-2 text-xs font-semibold uppercase tracking-wide text-center text-muted-foreground border-r last:border-r-0">{d}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((date, di) => {
                const inMonth = date.getMonth() === month
                const k = dayKey(date)
                const dayCitas = byDay[k] || []
                const isToday = k === todayKey
                return (
                  <div
                    key={di}
                    onClick={() => setNewFor(date)}
                    title="Nueva cita"
                    className={cx(
                      'min-h-[150px] border-r last:border-r-0 p-2 align-top cursor-pointer transition-colors hover:bg-muted/40',
                      inMonth ? 'bg-card' : 'bg-muted/20'
                    )}
                  >
                    <div className="mb-2 flex justify-end">
                      <span className={cx(
                        'flex items-center justify-center leading-none tabular-nums',
                        isToday
                          ? 'h-9 min-w-9 px-1.5 rounded-full bg-primary text-primary-foreground text-xl font-bold'
                          : inMonth
                            ? 'text-2xl font-bold text-foreground'
                            : 'text-2xl font-semibold text-muted-foreground/40'
                      )}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {dayCitas.map((c) => {
                        const s = st(c.status)
                        return (
                          <button
                            key={c.eventId}
                            onClick={(e) => { e.stopPropagation(); setSelected(c) }}
                            title={`${hourFmt(c.start)} · ${c.contactName || c.treatment || 'Cita'}`}
                            className={cx(
                              'w-full text-left rounded-md border-l-4 bg-muted/40 pl-2 pr-1.5 py-1.5 space-y-0.5',
                              'hover:bg-muted hover:shadow-sm transition-all',
                              s.accent
                            )}
                          >
                            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground leading-tight">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="tabular-nums">{hourFmt(c.start)}</span>
                            </div>
                            <div className="truncate text-[13px] font-semibold text-foreground leading-tight">
                              {c.emoji && <span className="mr-1">{c.emoji}</span>}
                              {c.contactName || c.treatment || 'Cita'}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* ---- Dialog de detalle (click en evento) ---- */}
      <Dialog open={Boolean(selected)} onOpenChange={(v) => { if (!v) setSelected(null) }}>
        <DialogContent className="sm:max-w-[520px] overflow-hidden">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-2 pr-6">
                  <span className={cx('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', st(selected.status).dot)} />
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">{selected.contactName || selected.treatment || 'Cita'}</span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 pt-1">
                  <span className={cx('inline-block rounded-full px-2 py-0.5 text-xs font-medium', st(selected.status).badge)}>{st(selected.status).label}</span>
                  <span className={cx('inline-block rounded-full px-2 py-0.5 text-xs font-medium', sr(selected.source).badge)}>{sr(selected.source).label}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span className="capitalize">{longFmt(selected.start)}{selected.end ? ` – ${hourFmt(selected.end)}` : ''}</span>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  {selected.patientId
                    ? <Link className="text-primary underline" href={`/pacientes/${selected.patientId}`}>Ver paciente #{selected.patientId}</Link>
                    : <span className="text-amber-700">Sin asignar (cita de {sr(selected.source).label})</span>}
                </div>

                {/* Reconciliación inline si está sin asignar */}
                {!selected.isLinked && (
                  <div className="ml-6 rounded-md border p-2 space-y-2">
                    {suggestion?.type === 'disambiguate' && <p className="text-xs text-amber-700">Ese teléfono es de varios pacientes:</p>}
                    {suggestion?.type === 'by_name' && <p className="text-xs text-muted-foreground">¿Es alguno? (se agrega el teléfono al vincular)</p>}
                    {suggestion?.type === 'auto' && <p className="text-xs text-muted-foreground">Coincidencia por teléfono:</p>}
                    {suggestion && suggestion.candidates?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {suggestion.candidates.map((p) => (
                          <Button key={p.id} size="sm" variant="outline" onClick={() => linkAppt(selected.eventId, p.id, selected.contactPhone)}>
                            <Link2 className="h-4 w-4 mr-1.5" />{`${p.nombre || ''} ${p.apellidos || ''}`.trim()}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Sin coincidencias. <Link className="underline" href="/agenda/sin-asignar">Asignar en la bandeja</Link>
                      </p>
                    )}
                  </div>
                )}
                {selected.contactPhone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <a className="text-primary underline" href={`https://wa.me/52${selected.contactPhone.slice(-10)}`} target="_blank" rel="noopener noreferrer">
                      {selected.contactPhone}
                    </a>
                  </div>
                )}
                {selected.treatment && (
                  <div className="flex items-start gap-2 min-w-0">
                    <Stethoscope className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">{selected.treatment}</span>
                  </div>
                )}
                {selected.observations && (
                  <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-h-40 overflow-y-auto">
                    {selected.observations}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
                {selected.raw?.htmlLink && (
                  <a href={selected.raw.htmlLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline"><ExternalLink className="h-4 w-4 mr-2" />Google Calendar</Button>
                  </a>
                )}
                <Button variant="outline" onClick={() => { setEditing(selected); setSelected(null) }}>
                  <Pencil className="h-4 w-4 mr-2" />Editar
                </Button>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => { setConfirmDelete(selected); setSelected(null) }}>
                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <CitaEditModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        cita={editing}
        servicios={servicios}
        onSave={saveEdit}
      />

      {/* Quick-create al hacer click en un día */}
      <QuickCreateCitaModal
        open={Boolean(newFor)}
        onClose={() => setNewFor(null)}
        date={newFor}
        onSave={handleCreate}
      />

      {/* Confirmación de eliminación */}
      <AlertDialog open={Boolean(confirmDelete)} onOpenChange={(v) => { if (!v && !deleting) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará también de Google Calendar. Esta acción no se puede deshacer.
              {confirmDelete?.treatment ? (
                <><br /><span className="font-medium text-foreground break-words [overflow-wrap:anywhere]">{confirmDelete.treatment}</span></>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); doDelete() }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
