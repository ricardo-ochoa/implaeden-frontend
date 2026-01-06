'use client'

import { useState } from 'react'
import useSWR from 'swr'
import api, { fetcher } from '../../../../../lib/api'

import CitasTable from '@/components/citas/CitasTable'
import CitaModal from '@/components/citas/CitaModal'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// icon (lucide)
import { Plus, Loader2 } from 'lucide-react'

// mini helper
const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function CitasClient({
  paciente,
  initialServicios = [],
  initialCitas = [],
}) {
  const pacienteId = paciente.id

  // SWR
  const {
    data: citas,
    error: errorCitas,
    isLoading: loadingCitas,
    mutate,
  } = useSWR(`/pacientes/${pacienteId}/citas`, fetcher, {
    fallbackData: initialCitas,
  })

  // UI state
  const [servicios] = useState(initialServicios)
  const [modalOpen, setModalOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [selectedCita, setSelectedCita] = useState(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [citaToDelete, setCitaToDelete] = useState(null)

  const formatearFechaHora = (isoString) => {
    if (!isoString) return 'Fecha no disponible'
    const fecha = new Date(isoString)
    if (isNaN(fecha.getTime())) return 'Fecha inválida'
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const flash = (text) => {
    setMensaje(text)
    setTimeout(() => setMensaje(''), 3000)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedCita(null)
  }

  const handleSave = async (form) => {
    const { appointment_at, service_id } = form
    if (!appointment_at || !service_id) {
      flash('Por favor complete fecha y tratamiento')
      return false
    }

    try {
      const promise = selectedCita
        ? api.put(`/pacientes/${pacienteId}/citas/${selectedCita.id}`, form)
        : api.post(`/pacientes/${pacienteId}/citas`, form)

      await promise
      await mutate()

      flash(selectedCita ? 'Cita actualizada exitosamente' : 'Cita creada exitosamente')
      handleCloseModal()
      return true
    } catch (err) {
      flash('Error guardando la cita')
      return false
    }
  }

  const handleEdit = (cita) => {
    setSelectedCita(cita)
    setModalOpen(true)
  }

  const handleRequestDelete = (id) => {
    const cita = (citas || []).find((c) => c.id === id)
    setCitaToDelete(cita || null)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!citaToDelete) return

    try {
      await api.delete(`/pacientes/${pacienteId}/citas/${citaToDelete.id}`)
      await mutate()
      flash('Cita eliminada exitosamente')
    } catch (err) {
      flash('Error eliminando la cita')
    } finally {
      setConfirmOpen(false)
      setCitaToDelete(null)
    }
  }

  const isSuccess = mensaje.includes('exitosamente')

  return (
    <div className="relative">
      {/* Toast simple (shadcn Alert fijo) */}
      {mensaje ? (
        <div className="fixed top-4 left-1/2 z-50 w-[min(520px,calc(100%-24px))] -translate-x-1/2">
          <Alert className={cx(isSuccess ? 'border-emerald-500/40' : 'border-destructive/40')} variant={isSuccess ? 'default' : 'destructive'}>
            <AlertTitle>{isSuccess ? 'Listo' : 'Error'}</AlertTitle>
            <AlertDescription>{mensaje}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {errorCitas ? (
        <div className="fixed top-20 left-1/2 z-50 w-[min(640px,calc(100%-24px))] -translate-x-1/2">
          <Alert variant="destructive">
            <AlertTitle>Error cargando citas</AlertTitle>
            <AlertDescription>
              {typeof errorCitas === 'string' ? errorCitas : 'Ocurrió un error al cargar las citas.'}
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-center justify-end mb-3">
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Body */}
      <div className="rounded-lg border bg-card">
        {loadingCitas ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="p-2 md:p-4">
            <CitasTable
              citas={citas || []}
              servicios={servicios}
              formatearFechaHora={formatearFechaHora}
              onEdit={handleEdit}
              onDelete={handleRequestDelete}
            />
          </div>
        )}
      </div>

      {/* Modal de crear/editar (si esto sigue siendo MUI adentro, puede causar conflicto con Radix; ideal migrarlo también) */}
      <CitaModal
        open={modalOpen}
        onClose={handleCloseModal}
        servicios={servicios}
        onSave={handleSave}
        initialData={selectedCita}
      />

      {/* Confirm delete (shadcn Dialog) */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => {
          setConfirmOpen(v)
          if (!v) setCitaToDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmas eliminar esta cita?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false)
                setCitaToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
