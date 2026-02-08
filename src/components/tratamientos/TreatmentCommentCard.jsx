'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Play } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

const VARIANTS = {
  blue: {
    card: 'border-blue-400 bg-blue-50/60',
    dot: 'bg-blue-600',
    title: 'text-blue-700',
    plus: 'text-blue-700',
    plusBg: 'bg-blue-100/70',
  },
  red: {
    card: 'border-red-300 bg-red-50/60',
    dot: 'bg-red-500',
    title: 'text-red-600',
    plus: 'text-red-600',
    plusBg: 'bg-red-100/70',
  },
  gray: {
    card: 'border-border bg-background',
    dot: 'bg-muted-foreground',
    title: 'text-foreground',
    plus: 'text-foreground',
    plusBg: 'bg-muted',
  },
}

const formatDateES = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  // "31 ene 2026"
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

const isVideo = (m) => String(m?.mime_type || '').startsWith('video/')

function RichHtml({ html }) {
  // Si quieres sanitizar, aquí puedes meter DOMPurify.
  // Por ahora render directo (como Quill). Ojo con XSS si el HTML viene de usuarios externos.
  if (!html) return null
  return (
    <div
      className={cx(
        'text-sm leading-relaxed',
        // estilos mínimos para HTML de Quill
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
          className={cx(
            'relative h-[74px] w-[94px] overflow-hidden rounded-xl shadow-sm',
            v.plusBg
          )}
          title="Ver más"
        >
          {/* fondo borroso con la última miniatura visible si es imagen */}
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

export default function TreatmentCommentCard({
  item,
  treatmentName,
  variant = 'blue',
  toothOptions = [], // [{id,label}]
  onMediaClick,
  onCopy,
  onDelete,
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

  const teethIds = Array.isArray(item?.teeth_ids) ? item.teeth_ids : []
  const teethChips = teethIds
    .map((id) => Number(id))
    .filter(Number.isFinite)
    .map((id) => ({ id, label: teethMap.get(id) || `Diente ${id}` }))

  return (
    <div
      className={cx(
        'w-full rounded-2xl border p-5',
        v.card,
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-sm text-muted-foreground">{formatDateES(item?.created_at)}</p>
          <p className={cx('text-md font-semibold', v.title)}>
            {treatmentName || 'Tratamiento'}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              title="Opciones"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onCopy?.(item)}
            >
              Copiar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => onDelete?.(item)}
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Teeth chips */}
      {teethChips.length ? (
        <div className="mt-1 flex flex-wrap gap-3">
          {teethChips.map((t) => (
            <TeethChip key={t.id} id={t.id} label={t.label} />
          ))}
        </div>
      ) : null}

      {/* Comment */}
      {item?.comment_html ? (
        <div className="mt-2">
          <RichHtml html={item.comment_html} />
        </div>
      ) : null}

      {/* Media */}
      <MediaStrip
        media={item?.media}
        max={4}
        variant={variant}
        onClick={(m, idx) => onMediaClick?.({ item, media: m, index: idx })}
      />
    </div>
  )
}
