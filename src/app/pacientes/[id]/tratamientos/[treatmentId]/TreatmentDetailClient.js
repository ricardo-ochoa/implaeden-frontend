'use client'

import React, { useEffect, useMemo, useState } from 'react'

// shadcn/ui
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

// icons
import {
  Check,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Trash2,
  X,
  NotebookPen,
  History,
  Pen,
  CopyCheck,
} from 'lucide-react'

import UploadFilesModal from '@/components/UploadFilesModal'
import FilePreviewModal from '@/components/FilePreviewModal'
import TreatmentDetailEvidences from '@/components/TreatmentDetailEvidences'
import TreatmentPaymentsModal from '@/components/TreatmentPaymentsModal'
import TreatmentHistoryDrawer from '@/components/TreatmentHistoryDrawer'
import UpdateStatusModal from '@/components/UpdateStatusModal'

import useTreatmentDocuments from '../../../../../../lib/hooks/useTreatmentDocuments'
import useEmailDocuments from '../../../../../../lib/hooks/useEmailDocuments'
import { formatDate } from '../../../../../../lib/utils/formatDate'
import DiagramaTratamientos from '@/components/tratamientos/DiagramaTratamientos'
import TreatmentsMenu from '@/components/tratamientos/TreatmentsMenu'
import { Box } from '@mui/material'
import formatearFechaHora from '../../../../../../lib/utils/dateFormate'

// ⚠️ Ajusta el path si tu archivo está en otra carpeta
import TreatmentEvidenceCard from '@/components/TreatmentEvidenceCard'
import useTreatmentStatusModal from '../../../../../../lib/hooks/useTreatmentStatusModal'
// Ejemplo alternativo:
// import TreatmentEvidenceCard from '@/components/tratamientos/TreatmentEvidenceCard'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const DOCUMENT_TYPES = [
  { type: 'budget', label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio' },
  { type: 'end_letter', label: 'Carta fin' },
]

const toMoney = (n) => {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(Number(n || 0))
  } catch {
    return `${n || 0}`
  }
}

// ✅ Normalizador reutilizable
const normalizeTeethIds = (v) => {
  if (!v) return []
  if (Array.isArray(v)) return v.map(Number).filter(Number.isFinite)

  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed.map(Number).filter(Number.isFinite)
    } catch {}
    return s
      .split(',')
      .map((x) => Number(x.trim()))
      .filter(Number.isFinite)
  }
  return []
}

// ✅ detalle para 1 tratamiento (docs + evidencias existentes)
function TreatmentDetailItem({
  paciente,
  initialTratamiento,
  onCostSaved,
  onQuantitySaved,
}) {
  const [tratamiento, setTratamiento] = useState(initialTratamiento)

  const [isEditingCost, setIsEditingCost] = useState(false)
  const [editableCost, setEditableCost] = useState(
    initialTratamiento?.total_cost ?? 0
  )

  // ✅ cantidad (si la sigues usando)
  const [isEditingQty, setIsEditingQty] = useState(false)
  const [editableQty, setEditableQty] = useState(
    initialTratamiento?.quantity ?? 1
  )

  const treatmentId = tratamiento?.treatment_id ?? tratamiento?.id

  // ✅ Documentos (hook)
  const {
    documents = [],
    loading,
    error,
    isUpdating,
    fetchDocuments,
    createDocument,
    deleteDocument,
    updateCost,
    updateQuantity,
  } = useTreatmentDocuments(paciente.id, treatmentId)

  // Email (hook)
  const { alert: emailAlert, loadingLabels, sendDocuments, closeAlert } =
    useEmailDocuments()

  // UI subida docs
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDocType, setSelectedType] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newFiles, setNewFiles] = useState([])
  const [previewFile, setPreviewFile] = useState(null)

  const teethIds = useMemo(() => {
    return normalizeTeethIds(tratamiento?.teethIds ?? tratamiento?.teeth_ids)
  }, [tratamiento?.teethIds, tratamiento?.teeth_ids])

  // sync interno
  useEffect(() => {
    setTratamiento(initialTratamiento)
    setEditableCost(initialTratamiento?.total_cost ?? 0)
    setEditableQty(initialTratamiento?.quantity ?? 1)
  }, [initialTratamiento])

  const selectedDocLabel = useMemo(() => {
    return DOCUMENT_TYPES.find((d) => d.type === selectedDocType)?.label || ''
  }, [selectedDocType])

  const money = useMemo(() => {
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(Number(tratamiento?.total_cost ?? 0))
    } catch {
      return `${tratamiento?.total_cost ?? 0}`
    }
  }, [tratamiento?.total_cost])

  const handleCloseModal = async () => {
    setIsModalOpen(false)
    setSelectedType('')
    setNewDate('')
    setNewFiles([])
    await fetchDocuments()
  }

  const handleSaveDocument = async () => {
    if (!newDate || newFiles.length === 0) {
      window.alert('Fecha y archivos obligatorios')
      return
    }

    const fd = new FormData()
    fd.append('created_at', newDate)
    fd.append('document_type', selectedDocType)
    newFiles.forEach((f) => fd.append('file', f))

    await createDocument(fd)
    await handleCloseModal()
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando documentos…
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{String(error)}</AlertDescription>
        </Alert>
      ) : null}

      {/* Modales docs */}
      <UploadFilesModal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={`Subir ${selectedDocLabel || selectedDocType}`}
        newRecordDate={newDate}
        setNewRecordDate={setNewDate}
        setNewRecordFiles={setNewFiles}
        handleSaveRecord={handleSaveDocument}
      />

      <FilePreviewModal
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      {/* Alerts email */}
      {emailAlert?.open ? (
        <div className="fixed bottom-6 right-6 z-50 w-[320px]">
          <Alert
            variant={emailAlert.severity === 'error' ? 'destructive' : 'default'}
          >
            <AlertTitle>
              {emailAlert.severity === 'error' ? 'Error' : 'Listo'}
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{emailAlert.message}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeAlert}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
    </div>
  )
}

export default function TreatmentDetailClient({ paciente, tratamientos = [] }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [paymentsOpen, setPaymentsOpen] = useState(false)

  const [treatmentsState, setTreatmentsState] = useState(() =>
    Array.isArray(tratamientos) ? tratamientos : []
  )

   const { openFor, modalProps } = useTreatmentStatusModal({
  patientId: paciente?.id,
  onAfterSave: async ({ newStatus }) => {
    setTreatmentsState((prev) =>
      prev.map((t) => ({ ...t, status: newStatus }))
    )
    bumpEvents?.()
  },
})

  // ✅ init selected seguro
  const [selected, setSelected] = useState(() => {
    const first = Array.isArray(tratamientos) ? tratamientos[0] : null
    return first ? (first.treatment_id ?? first.id ?? null) : null
  })

  useEffect(() => {
    setTreatmentsState(Array.isArray(tratamientos) ? tratamientos : [])
  }, [tratamientos])

  // ✅ mantener selected válido al cambiar treatmentsState
  useEffect(() => {
    if (!treatmentsState.length) {
      setSelected(null)
      return
    }

    const firstId = treatmentsState[0]?.treatment_id ?? treatmentsState[0]?.id ?? null

    setSelected((prev) => {
      const exists = treatmentsState.some(
        (t) => Number(t?.treatment_id ?? t?.id) === Number(prev)
      )
      return exists ? prev : firstId
    })
  }, [treatmentsState])

  const many = treatmentsState.length > 1

  const selectedTreatment = useMemo(() => {
    if (!treatmentsState.length) return null
    const found = treatmentsState.find(
      (t) => Number(t?.treatment_id ?? t?.id) === Number(selected)
    )
    return found || treatmentsState[0]
  }, [treatmentsState, selected])

  // ✅ para EvidenceCard (por tratamiento seleccionado)
  const relatedTeeth = useMemo(() => {
    return normalizeTeethIds(selectedTreatment?.teeth_ids ?? selectedTreatment?.teethIds)
  }, [selectedTreatment])

  const [selectedTeeth, setSelectedTeeth] = useState([])
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState([])

  // ✅ reset al cambiar de tratamiento
  useEffect(() => {
    setSelectedTeeth([])
    setComment('')
    setFiles([])
  }, [selectedTreatment?.treatment_id, selectedTreatment?.id])

  const totalCost = useMemo(() => {
    return treatmentsState.reduce((acc, t) => acc + Number(t?.total_cost || 0), 0)
  }, [treatmentsState])

  const [eventsRefreshKey, setEventsRefreshKey] = useState(0)
  const bumpEvents = () => setEventsRefreshKey((x) => x + 1)

  const onCostSaved = (treatmentId, newCost) => {
    setTreatmentsState((prev) =>
      prev.map((t) => {
        const tid = t?.treatment_id ?? t?.id
        if (Number(tid) !== Number(treatmentId)) return t
        return { ...t, total_cost: Number(newCost) }
      })
    )
    bumpEvents()
  }

  const onQuantitySaved = (treatmentId, newQty) => {
    setTreatmentsState((prev) =>
      prev.map((t) => {
        const tid = t?.treatment_id ?? t?.id
        if (Number(tid) !== Number(treatmentId)) return t
        return { ...t, quantity: Number(newQty) }
      })
    )
    bumpEvents()
  }

  const card = useMemo(() => {
    const one = treatmentsState[0]
    if (!many) {
      return one
        ? {
            isGroup: false,
            treatment_id: one?.treatment_id ?? one?.id,
            service_name: one?.service_name,
            service_date: one?.service_date,
            total_cost: one?.total_cost,
            group_id: one?.group_id ?? null,
          }
        : null
    }

    return {
      isGroup: true,
      title: 'Paquete de tratamientos',
      group_id:
        Number(treatmentsState?.[0]?.group_id) ||
        Number(treatmentsState?.[0]?.groupId) ||
        null,
      items: treatmentsState,
    }
  }, [many, treatmentsState])

  const TotalAndHistoryButtons = (
    <div className="mt-6 flex items-center gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setPaymentsOpen(true)}
        className={cx(
          'flex items-center gap-2 rounded-xl bg-muted px-3 py-2',
          'cursor-pointer select-none',
          'transition hover:bg-muted/80 active:scale-[0.99]'
        )}
        title="Ver pagos"
      >
        <div className="text-base">Total:</div>
        <div className="text-lg font-mono font-semibold">{toMoney(totalCost)}</div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setHistoryOpen(true)}
        title="Historial"
        className="rounded-xl"
      >
        <Pen />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => openFor(card)}
        title="Cambiar estatus"
        className="rounded-xl"
      >
        <CopyCheck />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setHistoryOpen(true)}
        title="Historial"
        className="rounded-xl"
      >
        <History />
      </Button>
    </div>
  )

  const date = formatearFechaHora(treatmentsState?.[0]?.group_start_date)

  const selectedTreatmentId =
  selectedTreatment?.treatment_id ?? selectedTreatment?.id ?? null

const {
  updateCost: updateSelectedCost,
  isUpdating: isUpdatingSelectedCost,
} = useTreatmentDocuments(paciente?.id, selectedTreatmentId)


  return (
    <div className="space-y-4">
      {/* Header */}
      {!many ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Tratamiento</p>
            <p className="font-semibold">
              {selectedTreatment?.service_name || 'Tratamiento'}
            </p>
          </div>
          {TotalAndHistoryButtons}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-bold text-lg">{treatmentsState.length} Tratamientos</p>
            <p className="text-sm text-muted-foreground">{date}</p>
          </div>
          {TotalAndHistoryButtons}
        </div>
      )}
      <Separator />
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          width: '100%',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Izquierda 20% */}
        <Box
          sx={{
            flex: '0 0 20%',
            gap: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TreatmentsMenu
            treatments={treatmentsState}
            value={selected}
            onChange={(t) => setSelected(t?.treatment_id ?? t?.id)}
            showMeta
          />

          <DiagramaTratamientos />
        </Box>

        {/* Derecha 80% */}
        <Box
          sx={{
            flex: '1 1 80%',
            minWidth: 0,
            backgroundColor: '#F5F7FB',
            borderRadius: 2,
          }}
        >
          {selectedTreatment ? (
            <div className="space-y-3">
              <TreatmentEvidenceCard
                title={selectedTreatment?.service_name || 'Tratamiento'}
                relatedTeeth={relatedTeeth}
                cost={Number(selectedTreatment?.total_cost || 0)}
                teeth={relatedTeeth}
                teethOptions={relatedTeeth.map((n) => ({ id: n, label: String(n) }))}

                selectedTeeth={selectedTeeth}
                onSelectedTeethChange={setSelectedTeeth}

                comment={comment}
                onCommentChange={setComment}

                files={files}
                onFilesChange={setFiles}

                avatarUrl="/perfil.png"
                avatarInitials="IE"

                // ✅ NUEVO: guardar costo desde el header
                costUpdating={isUpdatingSelectedCost}
                onSaveCost={async (newCost) => {
                  const ok = await updateSelectedCost(newCost)
                  if (ok) {
                    onCostSaved?.(selectedTreatmentId, newCost)
                    return true
                  }
                  return false
                }}

                onSubmit={({ selectedTeeth, comment, files }) => {
                  console.log('submit evidence', {
                    treatmentId: selectedTreatmentId,
                    selectedTeeth,
                    comment,
                    files,
                  })
                }}
              />
              <TreatmentDetailItem
                key={selectedTreatment?.treatment_id ?? selectedTreatment?.id}
                paciente={paciente}
                initialTratamiento={selectedTreatment}
                onCostSaved={onCostSaved}
                onQuantitySaved={onQuantitySaved}
              />
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Selecciona un tratamiento para ver el detalle.
            </div>
          )}
        </Box>
      </Box>

      {/* ✅ Modales */}
      <TreatmentPaymentsModal
        open={paymentsOpen}
        onOpenChange={setPaymentsOpen}
        patientId={paciente?.id}
        card={card}
      />

      <TreatmentHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        patientId={paciente?.id}
        card={card}
        refreshKey={eventsRefreshKey}
      />

      <UpdateStatusModal {...modalProps} />

    </div>
  )
}
