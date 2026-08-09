'use client'

import { useState } from 'react'
import useSWR from 'swr'
import api, { fetcher } from '../../../../../lib/api'

import CitasTable from '@/components/citas/CitasTable'
import CitaModal from '@/components/citas/CitaModal'
import CitaDetailDialog from '@/components/citas/CitaDetailDialog'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Plus, Loader2 } from 'lucide-react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

// Fase 1: listar (desde Google Calendar) + crear. Editar/eliminar en Fase 2.
export default function CitasClient({
  paciente,
  patientId,
  initialServicios = [],
  initialCitas = [],
}) {
  const pid = Number(patientId ?? paciente?.id ?? paciente?.patient_id ?? paciente?.paciente_id)

  if (!pid) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Falta patientId/paciente.id para cargar citas.</AlertDescription>
      </Alert>
    )
  }

  const { data: citas, error: errorCitas, isLoading: loadingCitas, mutate } = useSWR(
    `/pacientes/${pid}/citas`,
    fetcher,
    { fallbackData: initialCitas }
  )

  const [servicios] = useState(initialServicios)
  const [modalOpen, setModalOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [selected, setSelected] = useState(null)

  const formatearFechaHora = (isoString) => {
    if (!isoString) return 'Fecha no disponible'
    const fecha = new Date(isoString)
    if (isNaN(fecha.getTime())) return 'Fecha inválida'
    return fecha.toLocaleString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const flash = (text) => {
    setMensaje(text)
    setTimeout(() => setMensaje(''), 3500)
  }

  // Recibe el payload ya listo del modal: { start, end, serviceId, observaciones, status }
  const handleSave = async (payload) => {
    try {
      await api.post(`/pacientes/${pid}/citas`, payload)
      await mutate()
      flash('Cita creada exitosamente')
      return true
    } catch (err) {
      const status = err?.response?.status
      if (status === 503) flash('Google Calendar no está configurado en el servidor.')
      else flash('Error guardando la cita')
      return false
    }
  }

  const list = Array.isArray(citas) ? citas : []
  const nowTs = Date.now()
  const upcoming = list
    .filter((c) => new Date(c.start).getTime() >= nowTs)
    .sort((a, b) => new Date(a.start) - new Date(b.start)) // más próxima primero
  const past = list
    .filter((c) => new Date(c.start).getTime() < nowTs)
    .sort((a, b) => new Date(b.start) - new Date(a.start)) // más reciente primero

  const isSuccess = mensaje.includes('exitosamente')

  return (
    <div className="relative">
      {mensaje ? (
        <div className="fixed top-4 left-1/2 z-50 w-[min(520px,calc(100%-24px))] -translate-x-1/2">
          <Alert className={cx(isSuccess ? 'border-emerald-500/40' : 'border-destructive/40')} variant={isSuccess ? 'default' : 'destructive'}>
            <AlertTitle>{isSuccess ? 'Listo' : 'Aviso'}</AlertTitle>
            <AlertDescription>{mensaje}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {errorCitas ? (
        <div className="mb-3">
          <Alert variant="destructive">
            <AlertTitle>No se pudieron cargar las citas</AlertTitle>
            <AlertDescription>
              Revisa que Google Calendar esté configurado en el servidor (Service Account + calendario compartido).
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">Sincronizado con Google Calendar</span>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {loadingCitas ? (
        <div className="flex items-center justify-center py-10 rounded-lg border bg-card">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Próximas citas */}
          <section>
            <h3 className="text-sm font-semibold mb-2">
              Próximas citas {upcoming.length ? `(${upcoming.length})` : ''}
            </h3>
            {upcoming.length ? (
              <div className="rounded-lg border bg-card p-2 md:p-4">
                <CitasTable citas={upcoming} formatearFechaHora={formatearFechaHora} onRowClick={setSelected} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay próximas citas.</p>
            )}
          </section>

          {/* Citas anteriores */}
          <section>
            <h3 className="text-sm font-semibold mb-2">
              Citas anteriores {past.length ? `(${past.length})` : ''}
            </h3>
            <div className="rounded-lg border bg-card p-2 md:p-4">
              <CitasTable citas={past} formatearFechaHora={formatearFechaHora} onRowClick={setSelected} />
            </div>
          </section>
        </div>
      )}

      <CitaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        servicios={servicios}
        onSave={handleSave}
      />

      {/* Detalle de una cita (con editar/eliminar) */}
      <CitaDetailDialog
        cita={selected}
        servicios={servicios}
        onClose={() => setSelected(null)}
        onChanged={mutate}
      />
    </div>
  )
}
