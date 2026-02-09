'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Play, X as XIcon, Trash2 } from 'lucide-react'

// ✅ Reusa tus componentes existentes
import TeethMultiSelect from '@/components/TeethMultiSelect'
import CommentInput from '@/components/CommentInput'
import EvidencePicker from '@/components/tratamientos/EvidencePicker'
import EvidencePreviewGrid from '@/components/EvidencePreviewGrid'

const cx = (...c) => c.filter(Boolean).join(' ')

const VARIANTS = {
  blue: {
    card: 'border-blue-400 bg-blue-50/60',
    title: 'text-blue-700',
    plus: 'text-blue-700',
    plusBg: 'bg-blue-100/70',
  },
  red: {
    card: 'border-red-300 bg-red-50/60',
    title: 'text-red-600',
    plus: 'text-red-600',
    plusBg: 'bg-red-100/70',
  },
  gray: {
    card: 'border-border bg-background',
    title: 'text-foreground',
    plus: 'text-foreground',
    plusBg: 'bg-muted',
  },
}

const formatDateES = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

const isVideo = (m) => {
  const mime = String(m?.mime_type || '')
  if (mime.startsWith('video/')) return true
  const url = String(m?.file_url || m?.url || '')
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url)
}

function RichHtml({ html }) {
  if (!html) return null
  return (
    <div
      className={cx(
        'text-sm leading-relaxed',
        '[&_p]:m-0 [&_strong]:font-semibold',
        '[&_ol]:pl-5 [&_ul]:pl-5 [&_li]:my-1'
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function TeethChip({ id, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-white/70 px-1 py-1">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
        {id}
      </span>
      <span className="text-xs text-foreground">{label}</span>
    </div>
  )
}

function MediaStrip({ media = [], max = 4, variant = 'blue', onClick }) {
  const v = VARIANTS[variant] ?? VARIANTS.blue
  const m = Array.isArray(media) ? media : []
  if (!m.length) return null

  const visible = m.slice(0, max)
  const extra = m.length - visible.length

  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {visible.map((it, idx) => (
        <button
          key={it?.id ?? `${it?.file_url}-${idx}`}
          type="button"
          onClick={() => onClick?.(it, idx)}
          className="relative h-[74px] w-[94px] overflow-hidden rounded-xl bg-muted shadow-sm"
          title={it?.original_name || 'Abrir'}
        >
          {isVideo(it) ? (
            <>
              <video
                src={it?.file_url}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-black/55 p-2">
                  <Play className="h-4 w-4 text-white" />
                </div>
              </div>
            </>
          ) : (
            <img
              src={it?.file_url}
              alt={it?.original_name || 'evidencia'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </button>
      ))}

      {extra > 0 ? (
        <button
          type="button"
          onClick={() => onClick?.(m[visible.length], visible.length)}
          className={cx('relative h-[74px] w-[94px] overflow-hidden rounded-xl shadow-sm', v.plusBg)}
          title="Ver más"
        >
          {!isVideo(visible[visible.length - 1]) ? (
            <img
              src={visible[visible.length - 1]?.file_url}
              alt="more"
              className="h-full w-full object-cover opacity-35 blur-[1px]"
              loading="lazy"
            />
          ) : null}

          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cx('text-4xl font-bold', v.plus)}>{`+${extra}`}</span>
          </div>
        </button>
      ) : null}
    </div>
  )
}

/** ✅ Grid de evidencias existentes (backend) con “marcar para eliminar” */
function ExistingMediaGrid({ media = [], removedIdsSet, onToggleRemove, onPreview }) {
  const m = Array.isArray(media) ? media : []
  if (!m.length) return null

  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground mb-2">Evidencias actuales</p>
      <div className="flex flex-wrap gap-3">
        {m.map((it, idx) => {
          const id = it?.id
          const removed = id != null && removedIdsSet?.has?.(Number(id))
          const url = it?.file_url

          return (
            <div key={id ?? `${url}-${idx}`} className="relative">
              <button
                type="button"
                onClick={() => onPreview?.(it, idx)}
                className={cx(
                  'relative h-[74px] w-[94px] overflow-hidden rounded-xl bg-muted shadow-sm',
                  removed && 'opacity-40'
                )}
                title={it?.original_name || 'Abrir'}
              >
                {isVideo(it) ? (
                  <>
                    <video
                      src={url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-black/55 p-2">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img src={url} alt={it?.original_name || 'evidencia'} className="h-full w-full object-cover" />
                )}

                {removed ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-[11px] text-white font-semibold">Se eliminará</span>
                  </div>
                ) : null}
              </button>

              {id != null ? (
                <button
                  type="button"
                  onClick={() => onToggleRemove?.(Number(id))}
                  className={cx(
                    'absolute -top-2 -right-2 rounded-full p-1 shadow bg-white',
                    removed ? 'text-emerald-700' : 'text-red-600'
                  )}
                  title={removed ? 'Restaurar evidencia' : 'Eliminar evidencia'}
                >
                  {removed ? <XIcon className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const sameArray = (a = [], b = []) =>
  a.length === b.length && a.every((v, i) => v === b[i])

const normalizeIds = (arr) => Array.from(new Set((arr || []).map(Number).filter(Number.isFinite))).sort((a, b) => a - b)

export default function TreatmentCommentCard({
  item,
  treatmentName,
  variant = 'blue',
  toothOptions = [],

  onMediaClick,
  onDelete,

  // ✅ NUEVO
  onUpdate,          // async (payload) => boolean|void
  updating = false,  // estado loading de update
  avatarUrl,
  avatarInitials = 'IE',

  className,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.blue

  const teethMap = React.useMemo(() => {
    const m = new Map()
    ;(toothOptions || []).forEach((t) => {
      if (t?.id == null) return
      m.set(Number(t.id), t.label ?? String(t.id))
    })
    return m
  }, [toothOptions])

  const originalTeeth = React.useMemo(() => normalizeIds(item?.teeth_ids || []), [item?.teeth_ids])
  const originalHtml = String(item?.comment_html || '')
  const originalMedia = Array.isArray(item?.media) ? item.media : []

  const [isEditing, setIsEditing] = React.useState(false)
  const [draftTeeth, setDraftTeeth] = React.useState(originalTeeth)
  const [draftHtml, setDraftHtml] = React.useState(originalHtml)
  const [newFiles, setNewFiles] = React.useState([])
  const [removedMediaIds, setRemovedMediaIds] = React.useState(() => new Set())

  // si cambia el item (o sales de editar), resetea drafts
  React.useEffect(() => {
    if (isEditing) return
    setDraftTeeth(originalTeeth)
    setDraftHtml(originalHtml)
    setNewFiles([])
    setRemovedMediaIds(new Set())
  }, [isEditing, originalTeeth, originalHtml, item?.id])

  const teethChips = originalTeeth.map((id) => ({ id, label: teethMap.get(id) || `Diente ${id}` }))

  const hasChanges = React.useMemo(() => {
    const teethChanged = !sameArray(normalizeIds(draftTeeth), originalTeeth)
    const htmlChanged = String(draftHtml || '') !== originalHtml
    const hasNewFiles = (newFiles?.length ?? 0) > 0
    const hasRemovals = removedMediaIds.size > 0
    return teethChanged || htmlChanged || hasNewFiles || hasRemovals
  }, [draftTeeth, originalTeeth, draftHtml, originalHtml, newFiles, removedMediaIds])

  const canSave = isEditing && !updating && hasChanges && (
    String(draftHtml || '').trim().length > 0 ||
    (newFiles?.length ?? 0) > 0 ||
    (originalMedia.length - removedMediaIds.size) > 0
  )

  const handlePickFiles = (picked) => {
    const all = [...(newFiles || []), ...(picked || [])]
    const seen = new Set()
    const deduped = all.filter((f) => {
      const key = `${f.name}-${f.size}-${f.lastModified}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    setNewFiles(deduped)
  }

  const removeNewFileAt = (index) => {
    setNewFiles((prev) => (prev || []).filter((_, i) => i !== index))
  }

  const toggleRemoveExisting = (id) => {
    setRemovedMediaIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!canSave) return

    const payload = {
      commentId: item?.id,
      commentHtml: draftHtml,
      teethIds: normalizeIds(draftTeeth),
      addFiles: newFiles, // File[]
      removeMediaIds: Array.from(removedMediaIds),
    }

    const ok = await onUpdate?.(payload)

    // si onUpdate no retorna nada, asumimos ok
    if (ok === false) return

    setIsEditing(false)
  }

  return (
    <div className={cx('w-full rounded-2xl border p-5', v.card, className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-sm text-muted-foreground">{formatDateES(item?.created_at)}</p>
          <p className={cx('text-md font-semibold', v.title)}>{treatmentName || 'Tratamiento'}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-xl" title="Opciones">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => setIsEditing(true)}
              disabled={updating}
            >
              Editar
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={() => onDelete?.(item)}
              disabled={updating}
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ========= VIEW MODE ========= */}
      {!isEditing ? (
        <>
          {teethChips.length ? (
            <div className="mt-1 flex flex-wrap gap-3">
              {teethChips.map((t) => (
                <TeethChip key={t.id} id={t.id} label={t.label} />
              ))}
            </div>
          ) : null}

          {item?.comment_html ? (
            <div className="mt-2">
              <RichHtml html={item.comment_html} />
            </div>
          ) : null}

          <MediaStrip
            media={item?.media}
            max={4}
            variant={variant}
            onClick={(m, idx) => onMediaClick?.({ item, media: m, index: idx })}
          />
        </>
      ) : (
        /* ========= EDIT MODE ========= */
        <>
          {/* Teeth */}
          <div className="mt-3 space-y-2">
            <p className="text-sm font-semibold">Dientes</p>
            <TeethMultiSelect
              teeth={draftTeeth}
              teethOptions={toothOptions}
              value={draftTeeth}
              onChange={setDraftTeeth}
              disabled={updating}
              placeholder="Selecciona dientes"
            />
          </div>

          {/* Comment */}
          <div className="mt-3">
            <CommentInput
              value={draftHtml}
              onChange={setDraftHtml}
              avatarUrl={avatarUrl}
              initials={avatarInitials}
              disabled={updating}
            />
          </div>

          {/* Existing media */}
          <ExistingMediaGrid
            media={originalMedia}
            removedIdsSet={removedMediaIds}
            onToggleRemove={toggleRemoveExisting}
            onPreview={(media, index) => onMediaClick?.({ item, media, index })}
          />

          {/* New files */}
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Agregar nuevas evidencias</p>

            <EvidencePreviewGrid
              files={newFiles}
              onRemove={removeNewFileAt}
              disabled={updating}
            />

            <div className="mt-3 flex items-center justify-end gap-3">
              <EvidencePicker
                value={newFiles}
                onChange={handlePickFiles}
                disabled={updating}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updating}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
              >
                {updating ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
