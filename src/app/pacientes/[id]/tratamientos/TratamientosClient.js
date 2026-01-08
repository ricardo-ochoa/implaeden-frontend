// src/app/pacientes/[id]/tratamientos/TratamientosClient.js
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import 'lightgallery/css/lightgallery.css'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// icons
import { MoreVertical, Plus, Trash2 } from 'lucide-react'

// tus componentes existentes (pueden seguir siendo MUI por dentro; aquí solo cambiamos el contenedor)
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import ModalServicio from '@/components/ModalServicio'
import TreatmentCard from '@/components/TreatmentCard'
import UpdateStatusModal from '@/components/UpdateStatusModal'

import { useRandomAvatar } from '../../../../../lib/hooks/useRandomAvatar'
import usePatientTreatments from '../../../../../lib/hooks/usePatientTreatments'
import api from '../../../../../lib/api'

const cx = (...c) => c.filter(Boolean).join(' ')

export default function TratamientosClient({ paciente }) {
  const router = useRouter()

  const { treatments, loading, fetchPatientTreatments, deleteTreatment } =
    usePatientTreatments(paciente.id)

  const [patient, setPatient] = useState(null)

  // modal nuevo tratamiento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRecordDate, setNewRecordDate] = useState('')
  const [newRecordFiles, setNewRecordFiles] = useState([]) // no se usa aquí, lo dejo por compat
  const [selectedService, setSelectedService] = useState('')
  const [initialCost, setInitialCost] = useState('')

  // delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)

  // status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [newStatus, setNewStatus] = useState('')

  // “snackbar” shadcn -> Alert flotante
  const [toast, setToast] = useState({
    open: false,
    variant: 'success', // 'success' | 'error'
    title: '',
    message: '',
  })

  const defaultAvatar = useRandomAvatar()

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/pacientes/${paciente.id}`)
        setPatient(data)
      } catch (err) {
        console.error('Error fetching patient:', err)
      }
    }
    if (paciente?.id) fetchPatient()
  }, [paciente])

  useEffect(() => {
    if (!toast.open) return
    const t = setTimeout(() => setToast((s) => ({ ...s, open: false })), 3500)
    return () => clearTimeout(t)
  }, [toast.open])

  const existRecords = (treatments || []).length > 0

  const handleCardClick = (treatmentId) => {
    router.push(`/pacientes/${paciente.id}/tratamientos/${treatmentId}`)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setNewRecordDate('')
    setSelectedService('')
    setInitialCost('')
    setNewRecordFiles([])
  }

  const handleSaveRecord = async () => {
    if (!newRecordDate || !selectedService) return
    try {
      await api.post(`/servicios/patient/${paciente.id}`, {
        service_id: selectedService,
        service_date: newRecordDate,
        total_cost: initialCost,
      })
      handleCloseModal()
      fetchPatientTreatments()
      setToast({
        open: true,
        variant: 'success',
        title: 'Listo',
        message: 'Tratamiento creado correctamente.',
      })
    } catch (err) {
      console.error('Error al guardar el tratamiento:', err)
      setToast({
        open: true,
        variant: 'error',
        title: 'Error',
        message: 'No se pudo guardar el tratamiento.',
      })
    }
  }

  const handleStatusClick = (treatment) => {
    setSelectedTreatment(treatment)
    setNewStatus(treatment.status || '')
    setStatusModalOpen(true)
  }

  const handleSaveStatus = async () => {
    if (!selectedTreatment?.treatment_id || !newStatus) return
    try {
      await api.put(
        `/servicios/tratamientos/${selectedTreatment.treatment_id}/status`,
        { status: newStatus }
      )
      setStatusModalOpen(false)
      setSelectedTreatment(null)
      fetchPatientTreatments()
      setToast({
        open: true,
        variant: 'success',
        title: 'Listo',
        message: 'Estado actualizado correctamente.',
      })
    } catch (err) {
      console.error(err)
      setToast({
        open: true,
        variant: 'error',
        title: 'Error',
        message: 'No se pudo actualizar el estado.',
      })
    }
  }

  const handleDeleteRecord = async () => {
    if (!recordToDelete?.treatment_id) return
    try {
      await deleteTreatment(recordToDelete.treatment_id)
      setIsDeleteModalOpen(false)
      setRecordToDelete(null)
      setToast({
        open: true,
        variant: 'success',
        title: 'Eliminado',
        message: 'Tratamiento eliminado exitosamente.',
      })
    } catch (err) {
      console.error('Error al eliminar el tratamiento:', err)
      setToast({
        open: true,
        variant: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el tratamiento.',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-semibold">
                {existRecords ? 'Tratamientos registrados:' : 'No hay tratamientos registrados:'}
              </p>
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : null}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full md:w-[320px]"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus />
              Agregar nuevo tratamiento
            </Button>
          </div>
      </div>

      {/* Grid de tratamientos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(treatments || []).map((treatment) => (
          <div key={treatment.treatment_id} className="relative min-w-0">
            {/* Dropdown de acciones */}
            <div className="absolute right-2 top-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur"
                    aria-label="Acciones"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      setRecordToDelete(treatment)
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TreatmentCard
              treatment={treatment}
              onClick={() => handleCardClick(treatment.treatment_id)}
              onStatusClick={handleStatusClick}
              showMenu={false}      // 👈 para no duplicar el botón interno
              className="h-full"    // 👈 opcional: que todas queden “parejas” si el texto crece
            />
          </div>
        ))}
      </div>


      {/* Modales existentes */}
      <ModalServicio
        open={isModalOpen}
        onClose={handleCloseModal}
        title={`Nuevo tratamiento para ${patient?.nombre || ''} :`}
        newRecordDate={newRecordDate}
        setNewRecordDate={setNewRecordDate}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        initialCost={initialCost}
        setInitialCost={setInitialCost}
        handleSaveRecord={handleSaveRecord}
        newRecordFiles={newRecordFiles}
        setNewRecordFiles={setNewRecordFiles}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setRecordToDelete(null)
        }}
        title="Eliminar el tratamiento"
        description="¿Estás seguro de que quieres eliminar este tratamiento? Esta acción no se puede deshacer."
        onConfirm={handleDeleteRecord}
      />

      <UpdateStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        treatment={selectedTreatment}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        onSave={handleSaveStatus}
      />

      {/* Alert flotante tipo snackbar */}
      {toast.open ? (
        <div className="fixed bottom-6 left-1/2 z-50 w-[92vw] max-w-[520px] -translate-x-1/2">
          <Alert variant={toast.variant === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>{toast.title}</AlertTitle>
            <AlertDescription>{toast.message}</AlertDescription>
          </Alert>
        </div>
      ) : null}
    </div>
  )
}
