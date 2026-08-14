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
import { MoreVertical, Plus, Trash2, Pencil, CreditCard, Search, X } from 'lucide-react'

// tus componentes
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import ModalServicio from '@/components/ModalServicio'
import TreatmentCard from '@/components/tratamientos/TreatmentCard'
import UpdateStatusModal from '@/components/UpdateStatusModal'
import TreatmentPaymentsModal from '@/components/TreatmentPaymentsModal'
import usePatientTreatments from '../../../../../lib/hooks/usePatientTreatments'
import api from '../../../../../lib/api'
import DiagramaTratamientos, {
  derivarTeethDeTratamientos,
} from '@/components/tratamientos/DiagramaTratamientos'
import ToothHistoryModal from '@/components/tratamientos/ToothHistoryModal'
import useTeethCatalog from '../../../../../lib/hooks/useTeethCatalog'
import { Input } from '@/components/ui/input'
import useTreatmentStatusModal from '../../../../../lib/hooks/useTreatmentStatusModal'

const normalizeStatus = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase()
  if (!v) return 'Por Iniciar'
  if (v === 'terminado') return 'Terminado'
  if (v === 'en proceso') return 'En proceso'
  if (v === 'por iniciar') return 'Por Iniciar'
  return 'Por Iniciar'
}

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
  const [newRecordFiles, setNewRecordFiles] = useState([])
  const [selectedService, setSelectedService] = useState('')
  const [initialCost, setInitialCost] = useState('')
  const [newTreatmentTeethIds, setNewTreatmentTeethIds] = useState([]) // ✅ para el modal

  const { openFor, modalProps } = useTreatmentStatusModal({
  patientId: paciente.id,
  onAfterSave: async ({ target }) => {
    await fetchPatientTreatments()

    setToast({
      open: true,
      variant: 'success',
      title: 'Listo',
      message: target?.isGroup
        ? 'Estado del paquete actualizado correctamente.'
        : 'Estado actualizado correctamente.',
    })
  },
})


  // delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)

  // status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

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

  const timelineDotClasses = (card) => {
  const s = normalizeStatus(card?.status ?? card?.group_status)

    if (s === 'Terminado') return 'bg-emerald-600 border-emerald-600'
    if (s === 'En proceso') return 'bg-sky-600 border-sky-600'
    return 'bg-amber-600 border-amber-600'
  }

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

  // Piezas que aparecen en algún tratamiento, para pintarlas en el diagrama.
  const teethConTratamiento = useMemo(
    () => derivarTeethDeTratamientos(treatments),
    [treatments]
  )

  // Historial por pieza: al hacer clic en un diente del diagrama.
  const { teethMap } = useTeethCatalog()
  const [toothHistory, setToothHistory] = useState(null)

  // ✅ renderiza cards (1 por grupo o 1 por single)
  const cards = useMemo(() => buildCardsFromTreatments(treatments || []), [treatments])

  const filteredCards = useMemo(() => {
    const q = String(search || '').trim().toLowerCase()

    return (cards || []).filter((card) => {
      const s = normalizeStatus(card?.status ?? card?.group_status)

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'in_progress' && s === 'En proceso') ||
        (statusFilter === 'done' && s === 'Terminado')

      if (!matchStatus) return false
      if (!q) return true

      // 🔎 busca en: nombre single + items del group + title si existiera
      const parts = [
        card?.title,
        card?.group_title,
        card?.service_name,
        ...(card?.items || []).map((it) => it?.service_name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return parts.includes(q)
    })
  }, [cards, statusFilter, search])


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
    setNewTreatmentTeethIds([])
  }

  const handleSaveRecord = async (payload) => {
  try {
    // ✅ Caso 1: GRUPO
    if (payload?.items?.length > 1) {
      const services = (payload.items || []).map((it) => ({
        service_id: it.service_id,
        // Obligatorio para el backend. ModalServicio manda la fecha en cada
        // item y también como `group_start_date`; nunca como `start_date`, que
        // es lo que se leía antes y llegaba undefined -> 400.
        service_date: it.service_date || payload.group_start_date,
        total_cost: it.total_cost,
        quantity: it.quantity ?? 0,
        teeth_ids: it.teeth_ids ?? [],
        status: it.status ?? 'Por Iniciar',
        notes: it.notes ?? null,
      }))

      await api.post(`/pacientes/${paciente.id}/tratamientos`, {
        title: payload.title,
        services,
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

    // ✅ Caso 2: SINGLE (se queda igual)
    await api.post(`/pacientes/${paciente.id}/tratamientos`, {
      service_id: payload.service_id,
      service_date: payload.service_date,
      total_cost: payload.total_cost,
      quantity: payload.quantity,
      teeth_ids: payload.teeth_ids,
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
  const cx = (...classes) => classes.filter(Boolean).join(' ')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold">
            {existRecords ? 'Tratamientos' : 'No hay tratamientos registrados:'}
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

      <div className="flex flex-col md:flex-row md:items-start md:gap-4">
        <div className="shrink-0 self-start md:sticky md:top-4">
         {
          // `manual`: el clic abre el historial de la pieza en vez de alternar
          // una selección que no alimentaba nada.
          existRecords && (
            <DiagramaTratamientos
              manual
              onToothClick={(id) => setToothHistory(Number(String(id).replace('_', '')))}
              treatmentTeeth={teethConTratamiento}
              soloClickConTratamiento
              showLegend
            />
          )
         }
      </div>

    <div className="w-full max-h-[60vh] overflow-y-auto bg-[#F5F7FB] rounded-xl">
  <div className="sticky top-0 z-20 bg-[#F5F7FB] px-4 py-2">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Segmented control */}
      <div className="inline-flex w-full md:w-auto rounded-full bg-indigo-50 p-1">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={cx(
            'h-11 flex-1 md:flex-none md:px-6 rounded-full text-sm font-semibold transition',
            statusFilter === 'all'
              ? 'bg-background text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Todos
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('in_progress')}
          className={cx(
            'h-11 flex-1 md:flex-none md:px-6 rounded-full text-sm font-semibold transition',
            statusFilter === 'in_progress'
              ? 'bg-background text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          En proceso
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('done')}
          className={cx(
            'h-11 flex-1 md:flex-none md:px-6 rounded-full text-sm font-semibold transition',
            statusFilter === 'done'
              ? 'bg-background text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Terminados
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-[360px]">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar"
          className="h-12 rounded-full pl-12 pr-12 bg-background"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Limpiar"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        ) : null}
      </div>
    </div>

    {/* opcional: contador */}
    <div className="mt-1 text-xs text-muted-foreground">
      Mostrando {filteredCards.length} de {cards.length}
    </div>
  </div>
      <div className="relative px-4 py-2">
        { filteredCards.length > 1 && (
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" aria-hidden="true" />
                )
              }
        {filteredCards.map((card) => {
  const key = card.isGroup ? `group-${card.group_id}` : `t-${card.treatment_id}`

  return (
    <div key={key} className="relative min-w-0 mb-3 pl-4">
      {filteredCards.length > 1 && (
        <span
          aria-hidden="true"
          className={cx(
            'absolute -inset-0 top-5 -translate-x-1/2',
            'h-3 w-3 rounded-full border',
            'ring-background',
            timelineDotClasses(card)
          )}
        />
      )}

      {/* Dropdown */}
      <div className="absolute right-2 top-2 z-10">
        ...
      </div>

      <TreatmentCard
        treatment={card}
        onClick={() => handleCardClick(card)}
        onStatusClick={() => openFor(card)}
      />
    </div>
  )
})}

      </div>
    </div>
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
        teethIds={newTreatmentTeethIds}
        setTeethIds={setNewTreatmentTeethIds}
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

      <UpdateStatusModal {...modalProps} />

      <TreatmentPaymentsModal
        open={paymentsModalOpen}
        onOpenChange={(v) => {
          setPaymentsModalOpen(v)
          if (!v) setPaymentsTarget(null)
        }}
        patientId={paciente.id}
        card={paymentsTarget}
      />

      <ToothHistoryModal
        open={toothHistory != null}
        onOpenChange={(v) => !v && setToothHistory(null)}
        toothCode={toothHistory}
        treatments={treatments}
        teethMap={teethMap}
        onVerTratamiento={(t) => {
          setToothHistory(null)
          router.push(`/pacientes/${paciente.id}/tratamientos/${t.treatment_id}`)
        }}
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
