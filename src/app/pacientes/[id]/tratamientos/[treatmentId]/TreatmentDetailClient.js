'use client'

import React, { useEffect, useMemo, useState } from 'react'

// shadcn/ui
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'

// icons
import {
  Check,
  FileText,
  Loader2,
  Mail,
  Pencil,
  ReceiptText,
  Trash2,
  X,
  NotebookPen,
  History,
} from 'lucide-react'

import UploadFilesModal from '@/components/UploadFilesModal'
import FilePreviewModal from '@/components/FilePreviewModal'
import TreatmentDetailEvidences from '@/components/TreatmentDetailEvidences'
import TreatmentPaymentsModal from '@/components/TreatmentPaymentsModal'
import TreatmentHistoryDrawer from '@/components/TreatmentHistoryDrawer'

import useTreatmentDocuments from '../../../../../../lib/hooks/useTreatmentDocuments'
import useEmailDocuments from '../../../../../../lib/hooks/useEmailDocuments'
import { formatDate } from '../../../../../../lib/utils/formatDate'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const DOCUMENT_TYPES = [
  { type: 'budget', label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio' },
  { type: 'end_letter', label: 'Carta fin' },
]

const toDate = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

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

// ✅ detalle para 1 tratamiento
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

  // ✅ NUEVO: cantidad
  const [isEditingQty, setIsEditingQty] = useState(false)
  const [editableQty, setEditableQty] = useState(
    initialTratamiento?.quantity ?? 1
  )

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
    updateQuantity, // ✅ nuevo
  } = useTreatmentDocuments(paciente.id, tratamiento?.treatment_id ?? tratamiento?.id)

  // Email (hook)
  const { alert: emailAlert, loadingLabels, sendDocuments, closeAlert } =
    useEmailDocuments()

  // UI subida docs
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDocType, setSelectedType] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newFiles, setNewFiles] = useState([])
  const [previewFile, setPreviewFile] = useState(null)

  const normalizeTeethIds = (v) => {
  if (!v) return []

  // ya viene como array
  if (Array.isArray(v)) return v.map(Number).filter(Number.isFinite)

  // viene como string (CSV o JSON)
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []

    // intenta JSON: "[26,27,28]"
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed.map(Number).filter(Number.isFinite)
    } catch {}

    // fallback CSV: "26,27,28"
    return s
      .split(',')
      .map((x) => Number(x.trim()))
      .filter(Number.isFinite)
  }

  return []
}

  const teethIds = useMemo(() => {
  return normalizeTeethIds(tratamiento?.teethIds ?? tratamiento?.teeth_ids)
}, [tratamiento?.teethIds, tratamiento?.teeth_ids])


  // sincroniza state interno si cambia initialTratamiento
  useEffect(() => {
    setTratamiento(initialTratamiento)
    setEditableCost(initialTratamiento?.total_cost ?? 0)
    setEditableQty(initialTratamiento?.quantity ?? 1) // ✅ nuevo
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

  const handleOpenModal = (type) => {
    setSelectedType(type)
    setIsModalOpen(true)
  }

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

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este documento?')) return
    await deleteDocument(id)
    await fetchDocuments()
  }

  // ✅ ÚNICO handleUpdateCost
  const handleUpdateCost = async () => {
    const newCost = Number(editableCost)
    if (!Number.isFinite(newCost)) {
      window.alert('Costo inválido')
      return
    }

    const success = await updateCost(newCost)

    if (success) {
      const tid = tratamiento?.treatment_id ?? tratamiento?.id

      setTratamiento((prev) => ({ ...prev, total_cost: newCost }))
      setIsEditingCost(false)

      onCostSaved?.(tid, newCost)
    } else {
      window.alert(error || 'Ocurrió un error.')
    }
  }

  // ✅ NUEVO: handleUpdateQuantity
  const handleUpdateQuantity = async () => {
    const q = Number(editableQty)
    const qty = Number.isFinite(q) ? Math.trunc(q) : NaN

    if (!Number.isFinite(qty) || qty < 1) {
      window.alert('Cantidad inválida (entero >= 1)')
      return
    }

    const success = await updateQuantity(qty)

    if (success) {
      const tid = tratamiento?.treatment_id ?? tratamiento?.id

      setTratamiento((prev) => ({ ...prev, quantity: qty }))
      setIsEditingQty(false)

      onQuantitySaved?.(tid, qty)
    } else {
      window.alert(error || 'Ocurrió un error.')
    }
  }

  const renderDocCard = ({ type, label }) => {
    const docs = (documents || []).filter((d) => d.document_type === type)
    const isEmailLoading = Boolean(loadingLabels?.has?.(label))

    return (
      <Card
        key={type}
        className={cx(
          'w-full lg:w-[32%] border-2 border-transparent transition',
          'hover:border-[#B2C6FB] hover:shadow-sm',
          'dark:hover:border-[#B2C6FB]/60 dark:hover:shadow-black/30'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{label}</p>
            {docs.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(docs[0].created_at)}
              </p>
            ) : null}
          </div>

          {docs.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {docs.map((doc) => {
                const isPdf = doc.file_url?.toLowerCase?.().endsWith('.pdf')
                const fileName = doc.file_url?.split('/').pop() || 'archivo'

                return (
                  <div key={doc.id} className="relative">
                    <div
                      className="h-[100px] w-full overflow-hidden rounded-md border cursor-pointer"
                      onClick={() =>
                        setPreviewFile({
                          preview: doc.file_url,
                          type: isPdf ? 'application/pdf' : 'image/jpeg',
                          name: fileName,
                        })
                      }
                    >
                      {isPdf ? (
                        <object
                          data={doc.file_url}
                          type="application/pdf"
                          width="100%"
                          height="100%"
                          style={{ pointerEvents: 'none' }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={doc.file_url}
                          alt={label}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-8 w-8 bg-background/70 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(doc.id)
                      }}
                      aria-label="Eliminar documento"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No hay documentos</p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 p-4 pt-0">
          <Button
            type="button"
            variant={docs.length > 0 ? 'outline' : 'default'}
            onClick={() => handleOpenModal(type)}
          >
            {docs.length > 0 ? 'Actualizar' : 'Subir'}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={docs.length === 0 || isEmailLoading}
            onClick={() =>
              sendDocuments({
                to: paciente.email,
                docs: docs.map((d) => d.file_url),
                label,
                treatmentName: tratamiento?.service_name,
                patientName: `${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''}`.trim(),
              })
            }
            className="gap-2"
          >
            {isEmailLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1) Costo + Cantidad */}
      <div className="flex flex-wrap items-center gap-8">
        {/* Costo */}
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-semibold">Costo del tratamiento:</p>

          {isEditingCost ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editableCost}
                onChange={(e) => setEditableCost(e.target.value)}
                disabled={isUpdating}
                className="w-[140px]"
              />

              <Button
                type="button"
                size="icon"
                onClick={handleUpdateCost}
                disabled={isUpdating}
                aria-label="Guardar costo"
                title="Guardar"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditableCost(tratamiento?.total_cost ?? 0)
                  setIsEditingCost(false)
                }}
                disabled={isUpdating}
                aria-label="Cancelar"
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className={cx(
                'group flex items-center gap-2 rounded-md px-2 py-1',
                'hover:bg-muted/40 cursor-pointer'
              )}
              onClick={() => setIsEditingCost(true)}
              role="button"
              tabIndex={0}
            >
              <p className="text-lg font-semibold">{money}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Editar costo"
                title="Editar"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingCost(true)
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Dientes */}
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-semibold">Dientes:</p>

          {teethIds.length ? (
            <div className="flex flex-wrap gap-2">
              {teethIds.map((id) => (
                <Badge
                  key={id}
                  variant="primary"
                  className="rounded-full px-1 cursor-pointer hover:bg-primary hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    // futuro: toggle/select de diente
                    // setSelectedTooth(id) o algo así
                  }}
                >
                  {id}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-lg font-semibold">—</p>
          )}
        </div>

      </div>

      {/* loading/error docs */}
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

      {/* 2) Documentos */}
      <Accordion type="single" collapsible>
        <AccordionItem value="docs" className="border rounded-md">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">
                Documentos ({documents.length})
              </span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between">
              {DOCUMENT_TYPES.map((d) => renderDocCard(d))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 3) Evidencias */}
      <Accordion type="single" collapsible>
        <AccordionItem value="evidences" className="border rounded-md">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4" />
              <span className="font-semibold">Evidencias</span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            <TreatmentDetailEvidences
              patientId={paciente.id}
              treatmentId={tratamiento?.treatment_id ?? tratamiento?.id}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>


      {/* Modales */}
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

      {/* Alerts flotantes */}
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

  useEffect(() => {
    setTreatmentsState(Array.isArray(tratamientos) ? tratamientos : [])
  }, [tratamientos])

  const many = treatmentsState.length > 1
  const one = treatmentsState[0]

  const totalCost = useMemo(() => {
    return treatmentsState.reduce((acc, t) => acc + Number(t?.total_cost || 0), 0)
  }, [treatmentsState])

  // ✅ para refrescar drawer cuando cambie algo afuera
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

  // ✅ NUEVO: para mantener cantidad sincronizada en el padre
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
  }, [many, one, treatmentsState])

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
        <ReceiptText className="h-5 w-5" />
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
        <History />
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      {!many ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Tratamiento</p>
            <p className="font-semibold">{one?.service_name || 'Tratamiento'}</p>
          </div>
          {TotalAndHistoryButtons}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Paquete de tratamientos</p>
            <p className="font-semibold">Incluye {treatmentsState.length} tratamientos</p>
          </div>
          {TotalAndHistoryButtons}
        </div>
      )}

      <Separator />

      {/* Body */}
      {!many ? (
        <TreatmentDetailItem
          paciente={paciente}
          initialTratamiento={one}
          onCostSaved={onCostSaved}
          onQuantitySaved={onQuantitySaved}
        />
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {treatmentsState.map((t) => {
            const tid = t?.treatment_id ?? t?.id
            const label = t?.service_name || 'Tratamiento'
            const date = toDate(t?.service_date)

            return (
              <AccordionItem
                key={String(tid)}
                value={String(tid)}
                className="border rounded-md px-2"
              >
                <AccordionTrigger className="px-2 hover:no-underline">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-semibold">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      Fecha: {date}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-2 pb-4">
                  <TreatmentDetailItem
                    paciente={paciente}
                    initialTratamiento={t}
                    onCostSaved={onCostSaved}
                    onQuantitySaved={onQuantitySaved}
                  />
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

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
    </div>
  )
}
