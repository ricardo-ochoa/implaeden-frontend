'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  History,
  Pen,
  CopyCheck,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

import UploadFilesModal from '@/components/UploadFilesModal'
import FilePreviewModal from '@/components/FilePreviewModal'
import TreatmentPaymentsModal from '@/components/TreatmentPaymentsModal'
import TreatmentHistoryDrawer from '@/components/TreatmentHistoryDrawer'
import UpdateStatusModal from '@/components/UpdateStatusModal'
import useTreatmentDocuments from '../../../../../../lib/hooks/useTreatmentDocuments'
import DiagramaTratamientos from '@/components/tratamientos/DiagramaTratamientos'
import TreatmentsMenu from '@/components/tratamientos/TreatmentsMenu'
import { Box } from '@mui/material'
import formatearFechaHora from '../../../../../../lib/utils/dateFormate'
import TreatmentEvidenceCard from '@/components/TreatmentEvidenceCard'
import useTreatmentStatusModal from '../../../../../../lib/hooks/useTreatmentStatusModal'
import ModalServicio from '@/components/ModalServicio'
import api from '../../../../../../lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, X } from 'lucide-react'
import TreatmentCommentsTimeline from '@/components/tratamientos/TreatmentCommentsTimeline'
import useTreatmentComments from '../../../../../../lib/hooks/useTreatmentComments'
import useTeethCatalog from '../../../../../../lib/hooks/useTeethCatalog'


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

export default function TreatmentDetailClient({ paciente, tratamientos = [] }) {
  const router = useRouter()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [paymentsOpen, setPaymentsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editDate, setEditDate] = useState('')
  const [editSelectedService, setEditSelectedService] = useState('')
  const [editInitialCost, setEditInitialCost] = useState('')
  const [editTeethIds, setEditTeethIds] = useState([])
  const [editInitialData, setEditInitialData] = useState(null)
  const [editScope, setEditScope] = useState('single')
  const [successAlert, setSuccessAlert] = useState({
  open: false,
  title: '',
  description: '',
})
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerItems, setViewerItems] = useState([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [commentUpdating, setCommentUpdating] = useState(false)

const updateComment = async ({
  commentId,
  commentHtml,
  teethIds = [],
  addFiles = [],
  removeMediaIds = [],
}) => {
  const pid = paciente?.id
  const tid = selectedTreatmentId // (ya lo tienes calculado abajo en tu componente)
  const cid = commentId

  if (!pid || !tid || !cid) return false

  try {
    setCommentUpdating(true)

    const fd = new FormData()

    // ✅ Archivos nuevos (DEBEN ser File/Blob)
    const filesArr = Array.isArray(addFiles) ? addFiles : []
    filesArr.forEach((f) => {
      const file = f?.file ?? f // por si tu UI manda {file: File}
      if (file instanceof File || file instanceof Blob) {
        fd.append('file', file) // 👈 EXACTO "file" para Multer
      }
    })

    // ✅ Campos (solo si vienen)
    if (commentHtml !== undefined) fd.append('comment_html', String(commentHtml ?? ''))
    if (teethIds !== undefined) fd.append('teeth_ids', JSON.stringify(teethIds ?? []))
    if (removeMediaIds !== undefined)
      fd.append('remove_media_ids', JSON.stringify(removeMediaIds ?? []))

    await api.patch(`/pacientes/${pid}/tratamientos/${tid}/comentarios/${cid}`, fd)
    // ⚠️ NO pongas headers Content-Type manualmente (axios pone el boundary)

    await fetchComments?.()
    bumpEvents?.()
    showSuccess?.('Comentario actualizado', 'Se guardaron los cambios correctamente.')
    return true
  } catch (e) {
    console.error(e)
    return false
  } finally {
    setCommentUpdating(false)
  }
}



const { teethMap, toothOptions: allToothOptions } = useTeethCatalog()

const openEditModal = (scope = 'single') => {
  if (!selectedTreatment) return

  setEditScope(scope)

  // ✅ GROUP solo si many Y scope === 'group'
  if (many && scope === 'group') {
    const items = (treatmentsState || []).map((it) => ({
      treatment_id: it.treatment_id ?? it.id,
      service_id: it.service_id,
      total_cost: it.total_cost,
      service_date: it.service_date,
      teeth_ids: it.teeth_ids ?? [],
      quantity: it.quantity ?? 0,
      status: it.status ?? 'Por Iniciar',
      notes: it.notes ?? null,
    }))

    setEditInitialData({
      mode: 'group',
      title: card?.title || 'Paquete de tratamientos',
      start_date: treatmentsState?.[0]?.group_start_date || items?.[0]?.service_date || '',
      items,
    })

    setEditDate(treatmentsState?.[0]?.group_start_date || '')
    setEditOpen(true)
    return
  }

  // ✅ SINGLE
  const tid = selectedTreatment?.treatment_id ?? selectedTreatment?.id
  setEditInitialData({
    mode: 'single',
    treatment_id: tid,
    service_id: selectedTreatment?.service_id,
    service_date: selectedTreatment?.service_date,
    total_cost: selectedTreatment?.total_cost,
    teeth_ids: selectedTreatment?.teeth_ids ?? [],
    quantity: selectedTreatment?.quantity ?? 0,
    status: selectedTreatment?.status ?? 'Por Iniciar',
    notes: selectedTreatment?.notes ?? null,
  })

  setEditDate(selectedTreatment?.service_date || '')
  setEditSelectedService(String(selectedTreatment?.service_id || ''))
  setEditInitialCost(String(selectedTreatment?.total_cost ?? ''))
  setEditTeethIds(selectedTreatment?.teeth_ids ?? [])
  setEditOpen(true)
}

const showSuccess = (title, description) => {
  setSuccessAlert({ open: true, title, description })

  // auto-hide
  window.clearTimeout(showSuccess._t)
  showSuccess._t = window.setTimeout(() => {
    setSuccessAlert((s) => ({ ...s, open: false }))
  }, 3500)
}

const closeEditModal = () => {
  setEditOpen(false)
  setEditInitialData(null)
}

  const [treatmentsState, setTreatmentsState] = useState(() =>
    Array.isArray(tratamientos) ? tratamientos : []
  )

const { openFor, modalProps } = useTreatmentStatusModal({
  patientId: paciente?.id,
  onAfterSave: async ({ target, newStatus }) => {
    // ✅ update local inmediato (optimista)
    setTreatmentsState((prev) => {
      const isGroup = Boolean(target?.isGroup)

      if (isGroup) {
        const ids = new Set(
          (target?.items || [])
            .map((x) => Number(x?.treatment_id ?? x?.id))
            .filter(Boolean)
        )

        return prev.map((t) => {
          const tid = Number(t?.treatment_id ?? t?.id)
          if (!ids.has(tid)) return t
          return { ...t, status: newStatus, group_status: newStatus }
        })
      }

      const tid = Number(target?.treatment_id ?? target?.id)
      return prev.map((t) => {
        const id = Number(t?.treatment_id ?? t?.id)
        if (id !== tid) return t
        return { ...t, status: newStatus }
      })
    })

    // ✅ esto asegura que si el back recalculó group_status, lo veas ya
    await refreshCurrentTreatments()

    bumpEvents?.()
    showSuccess?.("Estatus actualizado", `Nuevo estatus: ${newStatus}`)
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

  const {
  comments,
  loading: commentsLoading,
  saving: commentsSaving,
  createComment,
  deleteComment,
  fetchComments,
} = useTreatmentComments(paciente?.id, selectedTreatment?.treatment_id)

const relatedTeethOptions = useMemo(() => {
  return (relatedTeeth || []).map((id) => ({
    id: Number(id),
    label: teethMap.get(Number(id)) || `Diente ${id}`,
  }))
}, [relatedTeeth, teethMap])

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


const refreshCurrentTreatments = async () => {
  if (!paciente?.id) return

  const { data } = await api.get(`/pacientes/${paciente.id}/tratamientos`)
  const all = Array.isArray(data) ? data : []

  // si estás viendo un grupo, vuelve a setear solo ese grupo
  const currentGroupId =
    Number(selectedTreatment?.group_id ?? card?.group_id ?? 0) || null

  if (currentGroupId) {
    setTreatmentsState(all.filter((t) => Number(t.group_id) === currentGroupId))
    return
  }

  // si es single, deja solo el treatment seleccionado
  const tid = Number(selectedTreatmentId ?? 0) || null
  if (tid) {
    setTreatmentsState(
      all.filter((t) => Number(t?.treatment_id ?? t?.id) === tid)
    )
    return
  }

  setTreatmentsState(all)
}



const normalizeStatusLocal = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase()
  if (!v) return 'Por Iniciar'
  if (v === 'terminado') return 'Terminado'
  if (v === 'en proceso') return 'En proceso'
  if (v === 'por iniciar') return 'Por Iniciar'
  return 'Por Iniciar'
}

const derivedGroupStatus = useMemo(() => {
  const statuses = (treatmentsState || [])
    .map((t) => normalizeStatusLocal(t?.status))
    .filter(Boolean)

  if (!statuses.length) return 'Por Iniciar'
  const allDone = statuses.every((s) => s === 'Terminado')
  const anyInProgress = statuses.some((s) => s === 'En proceso')
  return allDone ? 'Terminado' : anyInProgress ? 'En proceso' : 'Por Iniciar'
}, [treatmentsState])

useEffect(() => {
  if (selectedTreatment?.treatment_id) fetchComments?.()
}, [selectedTreatment?.treatment_id, fetchComments])

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
          status: normalizeStatusLocal(one?.status), // ✅
          group_status: normalizeStatusLocal(one?.group_status), // opcional
        }
      : null
  }

  const first = treatmentsState?.[0] || {}
  return {
    isGroup: true,
    title: first?.group_title || 'Paquete de tratamientos',
    group_id: Number(first?.group_id ?? null) || null,
    group_start_date: first?.group_start_date ?? first?.service_date ?? null,
    items: treatmentsState,
    status: derivedGroupStatus,
    group_status: derivedGroupStatus,
  }
}, [many, treatmentsState, derivedGroupStatus])


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
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openEditModal('single')
        }}
        title="Editar tratamiento"
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

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setDeleteOpen(true)}
        title="Eliminar tratamiento"
        className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
      >
        <Trash2 />
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

  const sameArray = (a = [], b = []) =>
  a.length === b.length && a.every((v, i) => v === b[i])

const normalizeIds = (arr) => {
  const a = Array.isArray(arr) ? arr : []
  // normaliza + quita duplicados + ordena (evita “cambios” falsos)
  return Array.from(new Set(a)).sort()
}

// dentro del componente:
const onSelectedTeethChange = React.useCallback((next) => {
  const normalized = normalizeIds(next)
  setSelectedTeeth((prev) => {
    const prevNorm = normalizeIds(prev)
    return sameArray(prevNorm, normalized) ? prev : normalized
  })
}, [])

const cleanUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

const ymdToIsoLocalMidnight = (ymd) => {
  if (!ymd) return ymd
  if (String(ymd).includes('T')) return ymd
  const d = new Date(`${ymd}T00:00:00`)
  return Number.isNaN(d.getTime()) ? ymd : d.toISOString()
}

const handleUpdateRecord = async (payload) => {
  try {
    const isGroup =
      Boolean(payload?.isGroup) ||
      Boolean(payload?.group_id) ||
      (payload?.items?.length > 1)

    // ✅ GROUP
    if (isGroup) {
      const groupStartIso = ymdToIsoLocalMidnight(
        payload?.group_start_date ?? payload?.start_date
      )
      const groupTitle = payload?.title ?? null
      const groupTeeth = payload?.group_teeth_ids ?? null

      await Promise.all(
        (payload.items || []).map((it) =>
          api.patch(
            `/pacientes/${paciente.id}/tratamientos/${it.treatment_id}`,
            cleanUndefined({
              group_start_date: groupStartIso,
              ...(groupTitle ? { group_title: groupTitle } : {}),
              ...(groupTeeth ? { group_teeth_ids: groupTeeth } : {}),

              total_cost: it.total_cost,
              quantity: it.quantity ?? 0,
              teeth_ids: it.teeth_ids ?? [],
              notes: it.notes ?? null,
            })
          )
        )
      )

      await refreshCurrentTreatments()
      showSuccess(
        'Tratamiento actualizado correctamente',
        'Los cambios se guardaron y se reflejan inmediatamente.'
      )

      closeEditModal()
      bumpEvents?.()
      return true

    }

    // ✅ SINGLE: tomar datos desde items[0]
    const it = payload?.items?.[0] ?? {}
    const tid =
      payload?.single_treatment_id ??
      payload?.treatment_id ??
      it?.treatment_id ??
      editInitialData?.treatment_id

    const serviceDateIso = ymdToIsoLocalMidnight(
      payload?.service_date ?? it?.service_date
    )

    await api.patch(
      `/pacientes/${paciente.id}/tratamientos/${tid}`,
      cleanUndefined({
        service_id: payload?.service_id ?? it?.service_id,
        service_date: serviceDateIso,
        total_cost: payload?.total_cost ?? it?.total_cost,
        quantity: payload?.quantity ?? it?.quantity ?? 0,
        teeth_ids: payload?.teeth_ids ?? it?.teeth_ids ?? [],
        notes: payload?.notes ?? it?.notes,
      })
    )
    await refreshCurrentTreatments()

    showSuccess(
      'Paquete actualizado correctamente',
      'Los cambios se guardaron y se reflejan inmediatamente.'
    )

    closeEditModal()
    bumpEvents?.()
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const modalInitialTreatment = useMemo(() => {
  if (many && editScope === 'group') {
    const first = treatmentsState?.[0] || {}
    return {
      isGroup: true,
      group_id: Number(first?.group_id ?? card?.group_id ?? null) || null,
      group_title: first?.group_title || null,
      group_start_date: first?.group_start_date ?? null,
      title: first?.group_title || card?.title || 'Paquete de tratamientos',
      items: treatmentsState,
    }
  }
  // ✅ editar SOLO el seleccionado
  return selectedTreatment
}, [many, editScope, treatmentsState, selectedTreatment, card?.title, card?.group_id])

// Elimina el tratamiento SELECCIONADO. El backend borra en cascada sus pagos,
// evidencias y comentarios. Muestra loading, feedback de éxito y redirige al
// listado de tratamientos del paciente.
const handleDeleteTreatment = async () => {
  const tid = selectedTreatment?.treatment_id ?? selectedTreatment?.id
  if (!paciente?.id || !tid) return
  try {
    setDeleting(true)
    await api.delete(`/pacientes/${paciente.id}/tratamientos/${tid}`)
    setDeleteOpen(false)
    showSuccess('Tratamiento eliminado', 'El tratamiento se eliminó correctamente.')
    // breve pausa para que se vea la confirmación antes de navegar
    setTimeout(() => {
      router.push(`/pacientes/${paciente.id}/tratamientos`)
    }, 900)
  } catch (e) {
    console.error(e)
    setDeleting(false)
    showSuccess('No se pudo eliminar', 'Ocurrió un error al eliminar el tratamiento. Intenta de nuevo.')
  }
}

const treatmentsById = useMemo(() => {
  const m = {}
  ;(treatmentsState || []).forEach((t) => {
    const tid = Number(t?.treatment_id ?? t?.id)
    if (!tid) return
    m[tid] = {
      name: t?.service_name || 'Tratamiento',
      status: t?.status,
    }
  })
  return m
}, [treatmentsState])



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

          <DiagramaTratamientos 
          activeIds={selectedTeeth}
          onActiveIdsChange={setSelectedTeeth}
          />
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
            <div>
              <TreatmentEvidenceCard
                title={selectedTreatment?.service_name || 'Tratamiento'}
                treatment={selectedTreatment}
                patientId={paciente?.id}
                date={treatmentsState?.[0]?.group_start_date}
                relatedTeeth={relatedTeeth}
                cost={Number(selectedTreatment?.total_cost || 0)}
                teeth={relatedTeeth}
                teethOptions={relatedTeethOptions}
                selectedTeeth={selectedTeeth}
                onSelectedTeethChange={setSelectedTeeth}
                comment={comment}
                onCommentChange={setComment}
                files={files}
                onFilesChange={setFiles}
                avatarUrl="/perfil.png"
                avatarInitials="IE"
                costUpdating={isUpdatingSelectedCost}
                onSaveCost={async (newCost) => {
                  const ok = await updateSelectedCost(newCost)
                  if (ok) {
                    onCostSaved?.(selectedTreatmentId, newCost)
                    return true
                  }
                  return false
                }}
                submitting={commentsSaving}
                onSubmit={async ({ selectedTeeth, comment, files }) => {
                  await createComment({
                    commentHtml: comment,
                    teethIds: selectedTeeth,
                    files,
                  })

                  // ✅ limpia draft
                  setSelectedTeeth([])
                  setComment('')
                  setFiles([])

                  // opcional: bump para refrescar drawer/otros
                  bumpEvents?.()
                }}
              />
              {commentsLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Cargando comentarios…</div>
              ) : (
                <TreatmentCommentsTimeline
                  items={comments}
                  treatmentsById={treatmentsById}
                  toothOptions={allToothOptions}
                  onDelete={(item) => deleteComment(item.id)}
                  onMediaClick={({ item, media, index }) => {
                    setViewerItems(Array.isArray(item?.media) ? item.media : [])
                    setViewerIndex(Number(index) || 0)
                    setViewerOpen(true)
                  }}
                  onUpdate={updateComment}
                  updating={commentUpdating}
                  avatarUrl="/perfil.png"
                  avatarInitials="IE"
                />
              )}
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

      {/* Confirmación de eliminación de tratamiento */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(v) => {
          if (!deleting) setDeleteOpen(v)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar este tratamiento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas eliminar el tratamiento{' '}
              <span className="font-semibold text-foreground">
                {selectedTreatment?.service_name || 'Tratamiento'}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-foreground">
                {`${paciente?.nombre || ''} ${paciente?.apellidos || ''}`.trim() || 'este paciente'}
              </span>
              ?
              <br />
              Esta acción no se puede deshacer y elimina sus evidencias y comentarios.
              <br />
              <span className="font-medium">Los pagos se conservan</span> como registro histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteTreatment()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ModalServicio
        open={editOpen}
        onClose={closeEditModal}
        title={many && editScope === 'group' ? 'Editar paquete' : 'Editar tratamiento'}
        newRecordDate={editDate}
        setNewRecordDate={setEditDate}
        selectedService={editSelectedService}
        setSelectedService={setEditSelectedService}
        initialCost={editInitialCost}
        setInitialCost={setEditInitialCost}
        teethIds={editTeethIds}
        setTeethIds={setEditTeethIds}
        mode="edit"
        initialTreatment={modalInitialTreatment}
        focusServiceId={selectedTreatment?.service_id}
        handleUpdateRecord={handleUpdateRecord}
      />

      {successAlert.open ? (
        <Alert
          className={cx(
            'border-emerald-200 bg-emerald-50 text-emerald-950',
            'flex items-start gap-3'
          )}
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <AlertTitle className="text-emerald-900">
              {successAlert.title}
            </AlertTitle>
            <AlertDescription className="text-emerald-800">
              {successAlert.description}
            </AlertDescription>
          </div>

          <button
            type="button"
            onClick={() => setSuccessAlert((s) => ({ ...s, open: false }))}
            className="rounded-md p-1 hover:bg-emerald-100 transition"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="h-4 w-4 text-emerald-700" />
          </button>
        </Alert>
      ) : null}

      <FilePreviewModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        items={viewerItems}
        startIndex={viewerIndex}
        onIndexChange={setViewerIndex}
      />
    </div>
  )
}
