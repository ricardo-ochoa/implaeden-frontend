'use client'

// ---------------------------------------------------------------------------
// Historial clínico del paciente: una sola LISTA de items ordenada por fecha,
// con dos tipos que conviven:
//
//   - expediente : el formato FO-CD-00003 capturado en la app (clinical_records)
//   - archivos   : imágenes/PDF escaneados de esa fecha (clinical_histories)
//
// El feature de subir archivos se conserva tal cual; lo nuevo es poder llenar
// el expediente digitalmente en el wizard (/historial/expediente/[recordId]).
// ---------------------------------------------------------------------------

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import api, { fetcher } from '../../../../../lib/api'
import { descargarArchivo, mensajeDeErrorBlob } from '../../../../../lib/utils/descargarArchivo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

// icons
import {
  Download,
  FilePlus2,
  FileText,
  Loader2,
  MoreVertical,
  Paperclip,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import UploadFilesModal from '@/components/UploadFilesModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
// Extensión explícita a propósito: existen FilePreviewModal.js (modal MUI viejo,
// API { file }) y FilePreviewModal.jsx (galería Swiper, API { items }). El
// resolve de webpack prueba .js antes que .jsx, así que el import "pelado"
// traería el equivocado en el build de producción.
import FilePreviewModal from '@/components/FilePreviewModal.jsx'
import { ESTADOS_EXPEDIENTE } from '@/components/expediente-clinico/constants'
import { resumenCompletitud } from '@/components/expediente-clinico/completitud'
import { hoyYMD, normalizeExpediente, resumenExpediente } from '@/components/expediente-clinico/defaults'
import { cn } from '@/lib/utils'

const esPdf = (url) => (url || '').toLowerCase().endsWith('.pdf')
const nombreArchivo = (url) => (url || '').split('/').pop() || 'archivo'

// "2026-08-13" -> "13/08/2026". No se usa lib/utils/formatDate porque construye
// un Date: `new Date('2026-08-13')` se interpreta como UTC y en México (UTC-6)
// termina mostrando el día anterior.
const formatYMD = (ymd) => {
  const [y, m, d] = (ymd || '').split('-')
  return y && m && d ? `${d}/${m}/${y}` : ymd || 'sin fecha'
}

// Las tres opciones del menú abren algo modal (confirmación de borrado, overlay
// de "Generando PDF"). Radix mantiene `pointer-events: none` en el body hasta
// que termina de cerrar el menú, así que la acción se difiere un tick para que
// el modal no nazca sobre una página que no recibe clics.
const diferir = (accion) => (evento) => {
  evento.preventDefault()
  setTimeout(() => accion?.(), 0)
}

export default function PatientHistoryClient({
  patient,
  patientId,
  clinicalRecords: initialHistoryData,
  expedientes: initialExpedientes,
}) {
  const router = useRouter()

  const pid = Number(
    patientId ?? patient?.id ?? patient?.patient_id ?? patient?.paciente_id
  )
  const patientName = `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim() || 'Paciente'

  const {
    data: clinicalRecords,
    error,
    isLoading,
    mutate,
  } = useSWR(pid ? `/clinical-histories/${pid}` : null, fetcher, {
    fallbackData: initialHistoryData,
  })

  const {
    data: expedientes,
    isLoading: isLoadingExpedientes,
    mutate: mutateExpedientes,
  } = useSWR(pid ? `/pacientes/${pid}/expediente` : null, fetcher, {
    fallbackData: initialExpedientes,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null) // { tipo, id, label }
  const [deleteError, setDeleteError] = useState(null)

  const [newDate, setNewDate] = useState('')
  const [newFiles, setNewFiles] = useState([])

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItems, setPreviewItems] = useState([])
  const [previewIndex, setPreviewIndex] = useState(0)

  // Items de la lista: expedientes digitales + archivos agrupados por día,
  // todo mezclado y ordenado de la fecha más reciente a la más antigua.
  const items = useMemo(() => {
    const porFecha = (rec) => (rec?.record_date || '').split('T')[0]

    const archivos = (clinicalRecords || []).reduce((acc, rec) => {
      const day = porFecha(rec)
      if (!day) return acc
      if (!acc[day]) acc[day] = []
      acc[day].push(rec)
      return acc
    }, {})

    const itemsArchivos = Object.entries(archivos).map(([fecha, recs]) => ({
      key: `archivos-${fecha}`,
      tipo: 'archivos',
      fecha,
      recs,
    }))

    const itemsExpedientes = (expedientes || []).map((exp) => ({
      key: `expediente-${exp.id}`,
      tipo: 'expediente',
      fecha: porFecha(exp),
      expediente: exp,
    }))

    return [...itemsExpedientes, ...itemsArchivos].sort((a, b) =>
      (b.fecha || '').localeCompare(a.fecha || '')
    )
  }, [clinicalRecords, expedientes])

  // "Descargar todo" arma un PDF con los expedientes capturados en la app y los
  // archivos escaneados, así que basta con que exista cualquiera de los dos.
  const hayArchivos = (clinicalRecords || []).length > 0
  const hayExpedientes = (expedientes || []).length > 0
  const hayAlgoQueDescargar = hayArchivos || hayExpedientes

  // Abre la galería con todos los archivos de esa fecha, posicionada en el que
  // se tocó, para poder pasar entre ellos sin cerrar y volver a abrir.
  const openPreview = (recs, index) => {
    setPreviewItems(
      recs.map((rec) => ({
        id: rec.id,
        file_url: rec.file_url,
        original_name: nombreArchivo(rec.file_url),
      }))
    )
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  // El PDF lo arma el backend. Sin `fecha` baja el historial completo —los
  // expedientes capturados en la app y los escaneados, intercalados por fecha—;
  // con `fecha`, solo los archivos escaneados de ese día.
  const descargarPdf = async (fecha) => {
    setIsDownloading(true)
    try {
      const { headers } = await descargarArchivo(
        `/clinical-histories/${pid}/pdf${fecha ? `?date=${fecha}` : ''}`,
        fecha ? `expediente-${fecha}.pdf` : 'historial-clinico.pdf'
      )

      // El backend avisa por cabecera qué no pudo meter (formatos que un PDF no
      // admite, archivos que ya no están en el bucket, expedientes ilegibles).
      const omitidos = Number(headers['x-archivos-omitidos'] || 0)
      if (omitidos > 0) {
        toast.warning(
          `PDF descargado, pero ${omitidos} elemento${omitidos === 1 ? '' : 's'} no se pudo incluir. Ver la última página.`
        )
      } else {
        toast.success('PDF descargado')
      }
    } catch (err) {
      console.error(err)
      toast.error(await mensajeDeErrorBlob(err, 'No se pudo generar el PDF'))
    } finally {
      setIsDownloading(false)
    }
  }

  // El expediente capturado en la app se imprime desde su JSON: el backend
  // arma el formato FO-CD-00003 con odontograma incluido.
  const descargarExpedientePdf = async (expedienteId) => {
    setIsDownloading(true)
    try {
      await descargarArchivo(
        `/pacientes/${pid}/expediente/${expedienteId}/pdf`,
        `expediente-clinico-${expedienteId}.pdf`
      )
      toast.success('PDF descargado')
    } catch (err) {
      console.error(err)
      toast.error(await mensajeDeErrorBlob(err, 'No se pudo generar el PDF'))
    } finally {
      setIsDownloading(false)
    }
  }

  // Crea un borrador con los datos generales precargados y abre el wizard.
  const handleCreateExpediente = async () => {
    setIsCreating(true)
    try {
      const { data } = await api.post(`/pacientes/${pid}/expediente`, {
        record_date: hoyYMD(),
        form_data: normalizeExpediente(null, patient),
      })
      await mutateExpedientes()
      router.push(`/pacientes/${pid}/historial/expediente/${data.id}`)
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.error || 'Error creando el expediente')
      setIsCreating(false)
    }
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
      await api.post(`/clinical-histories/${pid}`, form)
      await mutate()
      setModalOpen(false)
      setNewDate('')
      setNewFiles([])
      toast.success('Archivos guardados')
    } catch (err) {
      console.error(err)
      toast.error('Error guardando archivos')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      if (toDelete.tipo === 'expediente') {
        await api.delete(`/pacientes/${pid}/expediente/${toDelete.ids[0]}`)
        await mutateExpedientes()
        toast.success('Expediente eliminado')
      } else {
        // 'archivo' borra uno; 'grupo' borra todos los de esa fecha.
        await Promise.all(
          toDelete.ids.map((id) => api.delete(`/clinical-histories/${id}`))
        )
        await mutate()
        toast.success(toDelete.ids.length > 1 ? 'Archivos eliminados' : 'Archivo eliminado')
      }

      setDeleteOpen(false)
      setToDelete(null)
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error al eliminar.'
      setDeleteError(msg)
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const pedirBorrado = (tipo, ids, label) => {
    setToDelete({ tipo, ids, label })
    setDeleteOpen(true)
  }

  if (!pid) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Falta patientId/patient.id para cargar historial clínico.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading || isLoadingExpedientes) {
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
        <AlertDescription>Error al cargar el historial clínico.</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      {/* Overlay loading (guardando/eliminando/creando) */}
      {(isSaving || isDeleting || isCreating || isDownloading) ? (
        <Dialog open>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader className="sr-only">
              <DialogTitle>Procesando</DialogTitle>
            </DialogHeader>
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isSaving
                  ? 'Guardando…'
                  : isDeleting
                    ? 'Eliminando…'
                    : isDownloading
                      ? 'Generando PDF…'
                      : 'Creando expediente…'}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {deleteError ? (
        <div className="mb-3">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* CTAs */}
      <div className="flex flex-wrap justify-end gap-2">
        {/* Descarga todo el historial escaneado en un solo PDF, cronológico. */}
        <Button
          variant="outline"
          onClick={() => descargarPdf()}
          disabled={!hayAlgoQueDescargar}
          title={
            hayAlgoQueDescargar
              ? 'Descargar el historial completo en un PDF: expedientes y archivos escaneados'
              : 'No hay expedientes ni archivos que descargar'
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar todo
        </Button>

        <Button variant="outline" onClick={() => setModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Subir archivos
        </Button>

        <Button onClick={handleCreateExpediente}>
          <FilePlus2 className="h-4 w-4 mr-2" />
          Nuevo expediente
        </Button>
      </div>

      {/* Lista unificada */}
      {items.length ? (
        <Card className="mt-6 divide-y">
          {items.map((item) =>
            item.tipo === 'expediente' ? (
              <ExpedienteRow
                key={item.key}
                item={item}
                onOpen={() =>
                  router.push(`/pacientes/${pid}/historial/expediente/${item.expediente.id}`)
                }
                onDownload={() => descargarExpedientePdf(item.expediente.id)}
                onDelete={() =>
                  pedirBorrado(
                    'expediente',
                    [item.expediente.id],
                    `el expediente del ${formatYMD(item.fecha)}`
                  )
                }
              />
            ) : (
              <ArchivosRow
                key={item.key}
                item={item}
                onPreview={openPreview}
                onAdd={() => {
                  setNewDate(item.fecha)
                  setModalOpen(true)
                }}
                onDownload={() => descargarPdf(item.fecha)}
                onDeleteGroup={() =>
                  pedirBorrado(
                    'grupo',
                    item.recs.map((r) => r.id),
                    item.recs.length > 1
                      ? `los ${item.recs.length} archivos del ${formatYMD(item.fecha)}`
                      : `el archivo del ${formatYMD(item.fecha)}`
                  )
                }
                onDeleteFile={(rec) =>
                  pedirBorrado('archivo', [rec.id], nombreArchivo(rec.file_url))
                }
              />
            )
          )}
        </Card>
      ) : (
        <div className="mt-6">
          <Alert>
            <AlertTitle>Sin historial</AlertTitle>
            <AlertDescription>
              No hay historial clínico para <span className="font-semibold">{patientName}</span>.
              Crea un expediente digital o sube los archivos escaneados.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Galería: mismo visor que las evidencias de tratamiento (Swiper con
          flechas, paginación y teclado). */}
      <FilePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        items={previewItems}
        startIndex={previewIndex}
        onIndexChange={setPreviewIndex}
      />

      {/* Subida de archivos (feature original, intacto) */}
      <UploadFilesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Subir archivos al historial clínico:"
        newRecordDate={newDate}
        setNewRecordDate={setNewDate}
        setNewRecordFiles={setNewFiles}
        handleSaveRecord={handleSave}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={
          toDelete?.tipo === 'expediente'
            ? 'Eliminar expediente'
            : toDelete?.ids?.length > 1
              ? 'Eliminar archivos'
              : 'Eliminar archivo'
        }
        description={`¿Seguro que quieres eliminar ${toDelete?.label || 'este elemento'}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </>
  )
}

function RowShell({ icon, titulo, fecha, badge, resumen, acciones, children }) {
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{titulo}</p>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground">{fecha}</p>
          {resumen ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{resumen}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">{acciones}</div>
      </div>

      {children}
    </div>
  )
}

function ExpedienteRow({ item, onOpen, onDownload, onDelete }) {
  const { expediente } = item
  const estado = ESTADOS_EXPEDIENTE[expediente.status] || ESTADOS_EXPEDIENTE.borrador
  const resumen = resumenExpediente(expediente)

  // Mismas reglas que el stepper del wizard: verde cuando los 11 pasos tienen
  // respuesta, ámbar cuando falta algún obligatorio (los que impiden marcarlo
  // como completado).
  const { contestados, total, obligatoriosPendientes } = resumenCompletitud(expediente.form_data)
  const completoTodo = contestados === total

  return (
    <RowShell
      icon={<FileText className="h-4 w-4" />}
      titulo="Expediente clínico"
      fecha={`Consulta del ${formatYMD(item.fecha)}`}
      badge={
        <>
          <Badge variant={estado.variant}>{estado.label}</Badge>
          <Badge
            variant="outline"
            className={cn(
              'tabular-nums',
              completoTodo && 'border-emerald-500/60 text-emerald-700 dark:text-emerald-400',
              obligatoriosPendientes && 'border-amber-400 text-amber-700 dark:text-amber-400'
            )}
            title={
              obligatoriosPendientes
                ? `${contestados} de ${total} pasos contestados · ${obligatoriosPendientes} obligatorio(s) pendiente(s)`
                : `${contestados} de ${total} pasos contestados`
            }
          >
            {contestados}/{total}
          </Badge>
        </>
      }
      resumen={resumen}
      acciones={
        <>
          <Button type="button" size="sm" onClick={onOpen}>
            <Pencil className="h-4 w-4 mr-2" />
            Abrir
          </Button>
          <MenuAcciones>
            <DropdownMenuItem onSelect={diferir(onDownload)}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={diferir(onDelete)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </MenuAcciones>
        </>
      }
    />
  )
}

// Botón de tres puntos compartido por las dos filas.
function MenuAcciones({ children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" variant="outline" title="Más acciones">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

function ArchivosRow({ item, onPreview, onAdd, onDownload, onDeleteGroup, onDeleteFile }) {
  const { recs } = item
  // Con un solo archivo, el botón de la fila ya lo borra: repetir el ícono
  // sobre la miniatura sería redundante.
  const borrarPorArchivo = recs.length > 1

  return (
    <RowShell
      icon={<Paperclip className="h-4 w-4" />}
      titulo="Expediente clínico"
      // El badge distingue esta fila de la del expediente capturado en la app,
      // que lleva el mismo título pero con estado borrador/completado.
      badge={<Badge variant="outline">Escaneado</Badge>}
      fecha={`${recs.length} archivo${recs.length === 1 ? '' : 's'} · Registro del ${formatYMD(item.fecha)}`}
      acciones={
        <>
          <Button type="button" size="sm" variant="outline" onClick={onAdd}>
            <Upload className="h-4 w-4 mr-2" />
            Agregar
          </Button>
          <MenuAcciones>
            <DropdownMenuItem onSelect={diferir(onDownload)}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={diferir(onDeleteGroup)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {recs.length > 1 ? `Eliminar los ${recs.length} archivos` : 'Eliminar'}
            </DropdownMenuItem>
          </MenuAcciones>
        </>
      }
    >
      <div className="mt-3 flex flex-wrap gap-2 pl-0 sm:pl-12">
        {recs.map((rec, index) => {
          const nombre = nombreArchivo(rec.file_url)

          return (
            <div key={rec.id} className="relative">
              <button
                type="button"
                onClick={() => onPreview(recs, index)}
                className="block h-20 w-20 overflow-hidden rounded-md border transition hover:opacity-90"
                title={nombre}
              >
                {esPdf(rec.file_url) ? (
                  <span className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                    PDF
                  </span>
                ) : (
                  <img
                    src={rec.file_url}
                    alt={nombre}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>

              {borrarPorArchivo ? (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="absolute -right-1.5 -top-1.5 h-6 w-6 rounded-full bg-background shadow-sm hover:text-destructive"
                  onClick={() => onDeleteFile(rec)}
                  title={`Eliminar ${nombre}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </RowShell>
  )
}
