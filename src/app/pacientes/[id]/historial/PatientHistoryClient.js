'use client'

import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import api, { fetcher } from '../../../../../lib/api'
import { useRandomAvatar } from '../../../../../lib/hooks/useRandomAvatar'
import { formatDate } from '../../../../../lib/utils/formatDate'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

// icons
import { Eye, Trash2, Upload, X, Loader2 } from 'lucide-react'

// Tus modales existentes (si aún son MUI, funcionan, pero ideal migrarlos luego)
import UploadFilesModal from '@/components/UploadFilesModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function PatientHistoryClient({
  patient,
  clinicalRecords: initialHistoryData,
}) {
  const defaultAvatar = useRandomAvatar()
  const patientId = patient.id
  const patientName = `${patient.nombre} ${patient.apellidos}`.trim()
  const avatarUrl = patient.foto_perfil_url || defaultAvatar

  const {
    data: clinicalRecords,
    error,
    isLoading,
    mutate,
  } = useSWR(`/clinical-histories/${patientId}`, fetcher, {
    fallbackData: initialHistoryData,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const [newDate, setNewDate] = useState('')
  const [newFiles, setNewFiles] = useState([])

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)

  const groupedRecords = useMemo(() => {
    return (clinicalRecords || []).reduce((acc, rec) => {
      const day = (rec.record_date || '').split('T')[0]
      if (!day) return acc
      if (!acc[day]) acc[day] = []
      acc[day].push(rec)
      return acc
    }, {})
  }, [clinicalRecords])

  const hasRecords = Object.keys(groupedRecords).length > 0

  const openPreview = (rec) => {
    const isPdf = (rec.file_url || '').toLowerCase().endsWith('.pdf')
    const fileName = (rec.file_url || '').split('/').pop() || 'archivo'

    setPreviewFile({
      preview: rec.file_url,
      type: isPdf ? 'application/pdf' : 'image/*',
      name: fileName,
    })
    setPreviewOpen(true)
  }

  const handleSave = async () => {
    if (!newDate || newFiles.length === 0) {
      toast.error('Fecha y archivos obligatorios')
      return
    }

    const form = new FormData()
    form.append('record_date', newDate)
    newFiles.forEach((f) => form.append('files', f))

    setIsSaving(true)
    try {
      await api.post(`/clinical-histories/${patientId}`, form)
      await mutate()
      setModalOpen(false)
      setNewDate('')
      setNewFiles([])
      toast.success('Expediente guardado')
    } catch (err) {
      console.error(err)
      toast.error('Error guardando expediente')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await api.delete(`/clinical-histories/${toDelete.id}`)
      await mutate()
      setDeleteOpen(false)
      setToDelete(null)
      toast.success('Archivo eliminado')
    } catch (err) {
      console.error(err)
      const msg =
        err?.response?.data?.message || 'Error al eliminar el archivo.'
      setDeleteError(msg)
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Error al cargar el historial clínico.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      {/* Overlay loading (guardando/eliminando) */}
      {(isSaving || isDeleting) ? (
        <Dialog open>
          <DialogContent className="sm:max-w-[420px]">
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isSaving ? 'Guardando…' : 'Eliminando…'}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {deleteError ? (
        <div className="mt-3">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* CTA */}
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Agregar historial clínico
        </Button>
      </div>

      {/* Grid de tarjetas */}
      {hasRecords ? (
        <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groupedRecords).map(([date, recs]) => (
            <Card key={date} className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl} alt={patientName} />
                    <AvatarFallback>
                      {(patientName?.[0] || 'P').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Historial clínico: <span className="font-semibold">{formatDate(date)}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 w-100%">
                  {recs.map((rec) => {
                    const isPdf = (rec.file_url || '').toLowerCase().endsWith('.pdf')
                    const fileName = (rec.file_url || '').split('/').pop() || 'archivo'

                    return (
                      <div key={rec.id} className="relative w-100%">
                        <button
                          type="button"
                          onClick={() => openPreview(rec)}
                          className="w-full overflow-hidden rounded-md border hover:opacity-95 transition"
                          title={fileName}
                        >
                          {isPdf ? (
                            <div className="h-[110px] w-full flex items-center justify-center text-xs text-muted-foreground bg-muted">
                              PDF
                            </div>
                          ) : (
                            // thumbnail imagen
                            <img
                              src={rec.file_url}
                              alt={fileName}
                              className="h-[110px] w-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </button>

                        {/* acciones */}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            size="icon"
                            onClick={() => openPreview(rec)}
                            title="Ver"
                          >
                            <Eye />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            onClick={() => {
                              setToDelete(rec)
                              setDeleteOpen(true)
                            }}
                            title="Eliminar"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setModalOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {recs.length ? 'Actualizar' : 'Subir'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <Alert>
            <AlertTitle>Sin historial</AlertTitle>
            <AlertDescription>
              No hay historial clínico para <span className="font-semibold">{patientName}</span>.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-sm font-semibold truncate">
                {previewFile?.name}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="h-[calc(90vh-56px)] w-full">
            {previewFile?.type === 'application/pdf' ? (
              <iframe
                src={previewFile?.preview}
                title={previewFile?.name}
                className="h-full w-full"
              />
            ) : (
              <img
                src={previewFile?.preview}
                alt={previewFile?.name}
                className="h-full w-full object-contain bg-black/5"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload modal (tu componente existente) */}
      <UploadFilesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        newRecordDate={newDate}
        setNewRecordDate={setNewDate}
        setNewRecordFiles={setNewFiles}
        handleSaveRecord={handleSave}
      />

      {/* Confirm delete (tu componente existente) */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar expediente"
        description="¿Seguro que quieres eliminar este archivo?"
        onConfirm={handleDelete}
      />
    </>
  )
}
