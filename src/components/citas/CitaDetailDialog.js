'use client'

import { useState } from 'react'
import api from '../../../lib/api'
import CitaEditModal from './CitaEditModal'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Clock, User, Phone, Stethoscope, ExternalLink, Pencil, Trash2 } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')
const STATUS = {
  scheduled: { label: 'Programada', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  confirmed: { label: 'Confirmada', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  completed: { label: 'Completada', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelada', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  no_show:   { label: 'No asistió', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
}
const SOURCE = {
  'clinic-app': { label: 'App', badge: 'bg-indigo-100 text-indigo-800' },
  confirmafy:   { label: 'Confirmafy', badge: 'bg-teal-100 text-teal-800' },
  manual:       { label: 'Manual', badge: 'bg-slate-100 text-slate-700' },
}
const st = (s) => STATUS[s] || STATUS.scheduled
const sr = (s) => SOURCE[s] || SOURCE.manual
const longFmt = (iso) => (iso ? new Date(iso).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—')
const hourFmt = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '')

/**
 * Detalle de una cita, reutilizable. Incluye editar (CitaEditModal) y eliminar.
 * Props: cita, servicios, onClose, onChanged (refresca la lista).
 */
export default function CitaDetailDialog({ cita, servicios = [], onClose, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function saveEdit(changes) {
    try {
      await api.patch(`/appointments/${cita.eventId}`, changes)
      await onChanged?.()
      return true
    } catch (e) { return false }
  }
  async function doDelete() {
    setDeleting(true)
    try {
      await api.delete(`/appointments/${cita.eventId}`)
      await onChanged?.()
      onClose?.()
    } catch (e) { /* noop */ } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <Dialog open={Boolean(cita) && !editing && !confirmDelete} onOpenChange={(v) => { if (!v) onClose?.() }}>
        <DialogContent className="sm:max-w-[520px] overflow-hidden">
          {cita && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-2 pr-6">
                  <span className={cx('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', st(cita.status).dot)} />
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">{cita.contactName || cita.treatment || 'Cita'}</span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 pt-1">
                  <span className={cx('inline-block rounded-full px-2 py-0.5 text-xs font-medium', st(cita.status).badge)}>{st(cita.status).label}</span>
                  <span className={cx('inline-block rounded-full px-2 py-0.5 text-xs font-medium', sr(cita.source).badge)}>{sr(cita.source).label}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span className="capitalize">{longFmt(cita.start)}{cita.end ? ` – ${hourFmt(cita.end)}` : ''}</span>
                </div>
                {cita.contactPhone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <a className="text-primary underline" href={`https://wa.me/52${cita.contactPhone.slice(-10)}`} target="_blank" rel="noopener noreferrer">{cita.contactPhone}</a>
                  </div>
                )}
                {cita.treatment && (
                  <div className="flex items-start gap-2 min-w-0">
                    <Stethoscope className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">{cita.treatment}</span>
                  </div>
                )}
                {cita.observations && (
                  <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-h-40 overflow-y-auto">
                    {cita.observations}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
                {cita.raw?.htmlLink && (
                  <a href={cita.raw.htmlLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline"><ExternalLink className="h-4 w-4 mr-2" />Google Calendar</Button>
                  </a>
                )}
                <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-2" />Editar</Button>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                </Button>
                <Button variant="outline" onClick={onClose}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CitaEditModal
        open={editing}
        onClose={() => setEditing(false)}
        cita={cita}
        servicios={servicios}
        onSave={async (changes) => { const ok = await saveEdit(changes); if (ok) onClose?.(); return ok }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={(v) => { if (!v && !deleting) setConfirmDelete(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>Se borrará también de Google Calendar. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={(e) => { e.preventDefault(); doDelete() }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
