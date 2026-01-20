'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import 'lightgallery/css/lightgallery.css'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// icons
import { MoreVertical, Plus, Trash2, Pencil, CreditCard } from 'lucide-react'

// tus componentes
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import ModalServicio from '@/components/ModalServicio'
import TreatmentCard from '@/components/TreatmentCard'
import UpdateStatusModal from '@/components/UpdateStatusModal'
import TreatmentPaymentsModal from '@/components/TreatmentPaymentsModal'

import usePatientTreatments from '../../../../../lib/hooks/usePatientTreatments'
import api from '../../../../../lib/api'

// ✅ Normaliza SIEMPRE a: ["Por Iniciar","En proceso","Terminado"]
const normalizeStatus = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase()
  if (!v) return 'Por Iniciar'
  if (v === 'terminado') return 'Terminado'
  if (v === 'en proceso') return 'En proceso'
  if (v === 'por iniciar') return 'Por Iniciar'
  return 'Por Iniciar'
}

// arma 1 card por group_id (y los singles NO traen items)
function buildCardsFromTreatments(flat = []) {
  const byKey = new Map()

  for (const t of flat) {
    const gid = t?.group_id
    const key = gid ? `g-${gid}` : `s-${t?.treatment_id}`

    if (!byKey.has(key)) {
      const base = {
        isGroup: Boolean(gid),
        group_id: gid || null,
        group_start_date: t?.service_date || null,
        group_status: null,

        // single fields (también sirven como fallback)
        treatment_id: t?.treatment_id,
        service_name: t?.service_name,
        service_date: t?.service_date,
        status: normalizeStatus(t?.status),
        total_cost: t?.total_cost,
      }

      // ✅ SOLO los grupos tienen items
      if (gid) base.items = []

      byKey.set(key, base)
    }

    const card = byKey.get(key)

    // si es group: empuja a items + calcula start_date
    if (gid) {
      card.items.push(t)

      if (t?.service_date && card.group_start_date) {
        const a = new Date(card.group_start_date).getTime()
        const b = new Date(t.service_date).getTime()
        if (Number.isFinite(a) && Number.isFinite(b) && b < a) {
          card.group_start_date = t.service_date
        }
      }
    }
  }

  // derive status del grupo
  const cards = Array.from(byKey.values()).map((c) => {
    if (!c.isGroup) return c

    const statuses = (c.items || []).map((it) => normalizeStatus(it?.status)).filter(Boolean)
    let groupStatus = 'Por Iniciar'
    if (statuses.length) {
      const allDone = statuses.every((s) => s === 'Terminado')
      const anyInProgress = statuses.some((s) => s === 'En proceso')
      groupStatus = allDone ? 'Terminado' : anyInProgress ? 'En proceso' : 'Por Iniciar'
    }

    return {
      ...c,
      status: groupStatus, // para modal/status
      group_status: groupStatus,
    }
  })

  // ordenar por fecha desc
  cards.sort((a, b) => {
    const da = new Date(a.isGroup ? a.group_start_date : a.service_date).getTime()
    const db = new Date(b.isGroup ? b.group_start_date : b.service_date).getTime()
    return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0)
  })

  return cards
}

export default function TratamientosClient({ paciente }) {
  const router = useRouter()

  const { treatments, loading, fetchPatientTreatments, deleteTreatment } =
    usePatientTreatments(paciente.id)

  const [patient, setPatient] = useState(null)

  // modal nuevo tratamiento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRecordDate, setNewRecordDate] = useState('')
  const [newRecordFiles, setNewRecordFiles] = useState([]) // compat
  const [selectedService, setSelectedService] = useState('')
  const [initialCost, setInitialCost] = useState('')

  // delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)

  // status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [newStatus, setNewStatus] = useState('')

    // pagos modal
      const [paymentsModalOpen, setPaymentsModalOpen] = useState(false)
      const [paymentsTarget, setPaymentsTarget] = useState(null)
  
      const openPayments = (card) => {
        setPaymentsTarget(card)
        setPaymentsModalOpen(true)
      }

  // toast
  const [toast, setToast] = useState({
    open: false,
    variant: 'success',
    title: '',
    message: '',
  })

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

  // ✅ renderiza cards (1 por grupo o 1 por single)
  const cards = useMemo(() => buildCardsFromTreatments(treatments || []), [treatments])

  const handleCardClick = (card) => {
    if (card?.isGroup) {
      const firstId = card?.items?.[0]?.treatment_id
      if (firstId) router.push(`/pacientes/${paciente.id}/tratamientos/${firstId}`)
      return
    }
    router.push(`/pacientes/${paciente.id}/tratamientos/${card.treatment_id}`)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setNewRecordDate('')
    setSelectedService('')
    setInitialCost('')
    setNewRecordFiles([])
  }

  const handleSaveRecord = async (payload) => {
    try {
      // Caso 1: GRUPO (ModalServicio manda: { title, start_date, items })
      if (payload?.items?.length > 1) {
        await api.post(`/servicios/patient/${paciente.id}/group`, {
          title: payload.title,
          start_date: payload.start_date,
          items: payload.items,
        })

        handleCloseModal()
        await fetchPatientTreatments()

        setToast({
          open: true,
          variant: 'success',
          title: 'Listo',
          message: 'Paquete de tratamientos creado correctamente.',
        })
        return
      }

      // Caso 2: SINGLE
      await api.post(`/pacientes/${paciente.id}/tratamientos`, {
        service_id: payload.service_id,
        service_date: payload.service_date,
        total_cost: payload.total_cost,
      })

      handleCloseModal()
      await fetchPatientTreatments()

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
    setNewStatus(normalizeStatus(treatment?.status))
    setStatusModalOpen(true)
  }

  const handleSaveStatus = async () => {
    if (!selectedTreatment || !newStatus) return

    try {
      if (selectedTreatment?.isGroup) {
        const ids = (selectedTreatment.items || [])
          .map((x) => x?.treatment_id)
          .filter(Boolean)

        await Promise.all(
          ids.map((id) =>
            api.put(`/pacientes/${paciente.id}/tratamientos/${id}/status`, {
              status: newStatus,
            })
          )
        )

        setStatusModalOpen(false)
        setSelectedTreatment(null)
        await fetchPatientTreatments()

        setToast({
          open: true,
          variant: 'success',
          title: 'Listo',
          message: 'Estado del paquete actualizado correctamente.',
        })
        return
      }

      if (!selectedTreatment?.treatment_id) return

      await api.put(
        `/pacientes/${paciente.id}/tratamientos/${selectedTreatment.treatment_id}/status`,
        { status: newStatus }
      )

      setStatusModalOpen(false)
      setSelectedTreatment(null)
      await fetchPatientTreatments()

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
    if (!recordToDelete) return

    try {
      if (recordToDelete?.isGroup) {
        const ids = (recordToDelete.items || [])
          .map((x) => x?.treatment_id)
          .filter(Boolean)

        for (const id of ids) {
          await deleteTreatment(id)
        }

        setIsDeleteModalOpen(false)
        setRecordToDelete(null)
        await fetchPatientTreatments()

        setToast({
          open: true,
          variant: 'success',
          title: 'Eliminado',
          message: 'Paquete eliminado exitosamente.',
        })
        return
      }

      if (!recordToDelete?.treatment_id) return
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold">
            {existRecords ? 'Tratamientos registrados:' : 'No hay tratamientos registrados:'}
          </p>
          {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="h-12 rounded-full px-6 w-full md:w-auto"
        >
          <Plus />
          Agregar nuevo tratamiento
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const key = card.isGroup ? `group-${card.group_id}` : `t-${card.treatment_id}`

          return (
            <div key={key} className="relative min-w-0">
              {/* Dropdown de acciones (por card) */}
              <div className="absolute right-2 top-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-background/80 backdrop-blur"
                      aria-label="Acciones"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusClick(card)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Cambiar status
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          openPayments(card)
                        }}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Ver pagos
                      </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setRecordToDelete(card)
                        setIsDeleteModalOpen(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar {card.isGroup ? 'paquete' : 'tratamiento'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <TreatmentCard
                treatment={card}
                onClick={() => handleCardClick(card)}
                onStatusClick={() => handleStatusClick(card)}
              />
            </div>
          )
        })}
      </div>

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
        title={recordToDelete?.isGroup ? 'Eliminar paquete' : 'Eliminar el tratamiento'}
        description={
          recordToDelete?.isGroup
            ? '¿Estás seguro de que quieres eliminar este paquete? Se eliminarán todos los tratamientos dentro. Esta acción no se puede deshacer.'
            : '¿Estás seguro de que quieres eliminar este tratamiento? Esta acción no se puede deshacer.'
        }
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

      <TreatmentPaymentsModal
        open={paymentsModalOpen}
        onOpenChange={(v) => {
          setPaymentsModalOpen(v)
          if (!v) setPaymentsTarget(null)
        }}
        patientId={paciente.id}
        card={paymentsTarget}
      />

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
