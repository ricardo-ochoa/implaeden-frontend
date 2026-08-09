'use client'

import { useState } from 'react'
import useSWR from 'swr'
import api, { fetcher } from '../../../lib/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Search, UserPlus, Link2, Phone, Clock } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')
const SOURCE = {
  confirmafy: { label: 'Confirmafy', cls: 'bg-teal-100 text-teal-800' },
  manual: { label: 'Manual', cls: 'bg-slate-100 text-slate-700' },
  'clinic-app': { label: 'App', cls: 'bg-indigo-100 text-indigo-800' },
}
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const fullName = (p) => `${p.nombre || ''} ${p.apellidos || ''}`.trim()

export default function ReconcileClient({ initial = [], from, to }) {
  const key = `/appointments/unassigned?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, { fallbackData: initial })
  const citas = Array.isArray(data) ? data : []

  const [busy, setBusy] = useState(null)     // eventId en proceso
  const [msg, setMsg] = useState('')
  const [chooseFor, setChooseFor] = useState(null) // cita para "elegir otro"

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  // Vincula un evento a un paciente (o crea uno nuevo). payload:
  //   { patientId, addPhone? } | { newPatient:{nombre,telefono} }
  async function link(cita, payload) {
    setBusy(cita.eventId)
    try {
      await api.post(`/appointments/${cita.eventId}/link`, payload)
      await mutate()
      flash('Cita vinculada')
      setChooseFor(null)
    } catch (e) {
      flash(e?.response?.data?.error || 'No se pudo vincular')
    } finally {
      setBusy(null)
    }
  }

  const isSuccess = msg === 'Cita vinculada'

  return (
    <div>
      {msg ? (
        <Alert className={cx('mb-3', isSuccess ? 'border-emerald-500/40' : 'border-destructive/40')} variant={isSuccess ? 'default' : 'destructive'}>
          <AlertTitle>{isSuccess ? 'Listo' : 'Aviso'}</AlertTitle>
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>No se pudo cargar</AlertTitle>
          <AlertDescription>Revisa que Google Calendar esté configurado.</AlertDescription>
        </Alert>
      ) : null}

      <div className="text-sm text-muted-foreground mb-3">{citas.length} cita(s) por asignar</div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : citas.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          🎉 No hay citas sin asignar en este periodo.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 items-start">
          {citas.map((c) => {
            const s = c.suggestion || { type: 'new', candidates: [] }
            const src = SOURCE[c.source] || SOURCE.manual
            const working = busy === c.eventId
            return (
              <div key={c.eventId} className="rounded-lg border bg-card p-4">
                {/* Info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                  <span className={cx('rounded-full px-2 py-0.5 text-xs font-medium', src.cls)}>{src.label}</span>
                  <span className="font-medium">{c.contactName || c.treatment || 'Cita'}</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" />{fmt(c.start)}</span>
                  {c.contactPhone && <span className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{c.contactPhone}</span>}
                </div>

                {/* Acciones según la sugerencia */}
                <div className="flex flex-wrap items-center gap-2">
                  {s.type === 'auto' && s.candidates[0] && (
                    <Button size="sm" disabled={working} onClick={() => link(c, { patientId: s.candidates[0].id, addPhone: c.contactPhone })}>
                      <Link2 className="h-4 w-4 mr-2" />Vincular a {fullName(s.candidates[0])}
                    </Button>
                  )}

                  {s.type === 'by_name' && (
                    <>
                      <span className="text-sm text-muted-foreground">¿Es alguno? (se agrega el teléfono)</span>
                      {s.candidates.map((p) => (
                        <Button key={p.id} size="sm" variant="outline" disabled={working} onClick={() => link(c, { patientId: p.id, addPhone: c.contactPhone })}>
                          {fullName(p)}
                        </Button>
                      ))}
                    </>
                  )}

                  {s.type === 'disambiguate' && (
                    <>
                      <span className="text-sm text-amber-700">Ese teléfono es de varios pacientes:</span>
                      {s.candidates.map((p) => (
                        <Button key={p.id} size="sm" variant="outline" disabled={working} onClick={() => link(c, { patientId: p.id })}>
                          {fullName(p)}
                        </Button>
                      ))}
                    </>
                  )}

                  {s.type === 'new' && (
                    <Button
                      size="sm"
                      disabled={working || !c.contactPhone || !c.contactName}
                      title={!c.contactPhone ? 'Sin teléfono en el evento — usa "Elegir otro"' : ''}
                      onClick={() => link(c, { newPatient: { nombre: c.contactName, telefono: c.contactPhone } })}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />Crear paciente "{c.contactName}"
                    </Button>
                  )}

                  {/* Siempre disponible */}
                  <Button size="sm" variant="ghost" disabled={working} onClick={() => setChooseFor(c)}>
                    <Search className="h-4 w-4 mr-2" />Elegir otro
                  </Button>

                  {working && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog: buscar y elegir paciente manualmente */}
      <ChoosePatientDialog
        cita={chooseFor}
        onClose={() => setChooseFor(null)}
        onPick={(patientId) => link(chooseFor, { patientId, addPhone: chooseFor?.contactPhone })}
      />
    </div>
  )
}

function ChoosePatientDialog({ cita, onClose, onPick }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  async function search(value) {
    setQ(value)
    if (value.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await api.get(`/pacientes?search=${encodeURIComponent(value)}&limit=8`)
      setResults(res.data?.patients || res.data || [])
    } catch { setResults([]) } finally { setLoading(false) }
  }

  return (
    <Dialog open={Boolean(cita)} onOpenChange={(v) => { if (!v) { onClose(); setQ(''); setResults([]) } }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Elegir paciente</DialogTitle>
          <DialogDescription>
            Vincular la cita de <b>{cita?.contactName || 'este evento'}</b>
            {cita?.contactPhone ? ` (${cita.contactPhone})` : ''} a un paciente existente.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input autoFocus placeholder="Buscar por nombre, teléfono…" value={q} onChange={(e) => search(e.target.value)} className="pl-9" />
        </div>

        <div className="max-h-64 overflow-auto divide-y">
          {loading && <div className="py-4 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /></div>}
          {!loading && results.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className="w-full text-left px-2 py-2 text-sm hover:bg-muted/50 rounded flex items-center justify-between"
            >
              <span>{`${p.nombre || ''} ${p.apellidos || ''}`.trim()}</span>
              <span className="text-xs text-muted-foreground">#{p.id}{p.telefono ? ` · ${p.telefono}` : ''}</span>
            </button>
          ))}
          {!loading && q.trim().length >= 2 && results.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">Sin resultados</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
