// src/app/pacientes/[id]/tratamientos/[treatmentId]/TreatmentDetailClient.js
'use client'

import React, { useMemo, useState } from 'react'

// shadcn/ui
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// icons (lucide)
import {
  Check,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

import UploadFilesModal from '@/components/UploadFilesModal'
import FilePreviewModal from '@/components/FilePreviewModal'
import TreatmentDetailEvidences from '@/components/TreatmentDetailEvidences'

import useTreatmentDocuments from '../../../../../../lib/hooks/useTreatmentDocuments'
import useEmailDocuments from '../../../../../../lib/hooks/useEmailDocuments'
import { formatDate } from '../../../../../../lib/utils/formatDate'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const DOCUMENT_TYPES = [
  { type: 'budget', label: 'Presupuesto' },
  { type: 'start_letter', label: 'Carta inicio' },
  { type: 'end_letter', label: 'Carta fin' },
]

export default function TreatmentDetailClient({
  paciente,
  tratamiento: initialTratamiento,
}) {
  const [tratamiento, setTratamiento] = useState(initialTratamiento)

  // Costo editable
  const [isEditingCost, setIsEditingCost] = useState(false)
  const [editableCost, setEditableCost] = useState(
    initialTratamiento?.total_cost ?? 0
  )
  const [costAlert, setCostAlert] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' | 'error'
  })

  // Documentos (hook)
  const {
    documents = [],
    loading,
    error,
    isUpdating,
    fetchDocuments,
    createDocument,
    deleteDocument,
    updateCost,
  } = useTreatmentDocuments(paciente.id, tratamiento?.treatment_id)

  // Email (hook)
  const { alert: emailAlert, loadingLabels, sendDocuments, closeAlert } =
    useEmailDocuments()

  // UI subida docs
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDocType, setSelectedType] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newFiles, setNewFiles] = useState([])
  const [previewFile, setPreviewFile] = useState(null)

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

  const handleUpdateCost = async () => {
    const success = await updateCost(editableCost)

    if (success) {
      setTratamiento((prev) => ({
        ...prev,
        total_cost: parseFloat(editableCost),
      }))
      setIsEditingCost(false)
      setCostAlert({
        open: true,
        message: 'Costo actualizado exitosamente.',
        severity: 'success',
      })
    } else {
      setCostAlert({
        open: true,
        message: error || 'Ocurrió un error.',
        severity: 'error',
      })
    }
  }

  const renderDocCard = ({ type, label }) => {
    const docs = documents.filter((d) => d.document_type === type)
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
              onClick={() => setIsEditingCost(false)}
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

      {/* Carga / error */}
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

      {/* Documentos */}
      <Accordion type="single" collapsible defaultValue="docs">
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

      {/* evidencias adicionales */}
      <TreatmentDetailEvidences
        patientId={paciente.id}
        treatmentId={tratamiento?.treatment_id}
      />

      {/* Modales (si luego quieres, migramos estos a shadcn Dialog también) */}
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

      {/* Alerts flotantes (reemplazo de Snackbar) */}
      {emailAlert?.open ? (
        <div className="fixed bottom-6 right-6 z-50 w-[320px]">
          <Alert variant={emailAlert.severity === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>
              {emailAlert.severity === 'error' ? 'Error' : 'Listo'}
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{emailAlert.message}</span>
              <Button variant="ghost" size="icon" onClick={closeAlert} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {costAlert.open ? (
        <div className="fixed bottom-24 right-6 z-50 w-[320px]">
          <Alert variant={costAlert.severity === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>
              {costAlert.severity === 'error' ? 'Error' : 'Listo'}
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{costAlert.message}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCostAlert((p) => ({ ...p, open: false }))}
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
