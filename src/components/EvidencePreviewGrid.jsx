'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Play } from 'lucide-react'

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

export default function EvidencePreviewGrid({
  files = [], // File[]
  disabled = false,
  onRemove, // (index) => void
}) {
  const [items, setItems] = React.useState([]) // [{ file, url, kind }]
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)

  // Crear ObjectURLs y limpiarlas al cambiar files / unmount
  React.useEffect(() => {
    const next = (files || []).map((file) => {
      const type = String(file?.type || '')
      const kind = type.startsWith('video/') ? 'video' : 'image'
      return { file, kind, url: URL.createObjectURL(file) }
    })

    setItems(next)

    return () => {
      next.forEach((it) => {
        try {
          URL.revokeObjectURL(it.url)
        } catch {}
      })
    }
  }, [files])

  const active = items[activeIndex]

  if (!files?.length) return null

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Vista previa</p>
        <p className="text-xs text-muted-foreground">{files.length} archivo(s)</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {items.map((it, idx) => (
          <div
            key={`${it.file.name}-${it.file.size}-${it.file.lastModified}-${idx}`}
            className="relative overflow-hidden rounded-xl border bg-muted aspect-square"
          >
            {/* Preview */}
            <button
              type="button"
              className="absolute inset-0 w-full h-full"
              onClick={() => {
                setActiveIndex(idx)
                setOpen(true)
              }}
              disabled={disabled}
              aria-label={`Abrir ${it.file.name}`}
              title="Abrir vista previa"
            >
              {it.kind === 'video' ? (
                <div className="w-full h-full">
                  <video
                    src={it.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-2">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                // Para blob/objectURL, <img> es lo más simple y estable
                <img
                  src={it.url}
                  alt={it.file.name}
                  className="w-full h-full object-cover"
                />
              )}
            </button>

            {/* Remove */}
            {onRemove ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 rounded-full"
                onClick={() => onRemove(idx)}
                disabled={disabled}
                aria-label="Quitar archivo"
                title="Quitar"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Modal preview */}
{/* Modal preview */}
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent
    className="
      w-fit max-w-[90vw]
      p-4 sm:p-6
      overflow-hidden
    "
  >
    <DialogHeader className="max-w-[90vw]">
      <DialogTitle className="truncate">
        {active?.file?.name || 'Vista previa'}
      </DialogTitle>
      {active?.file ? (
        <p className="text-xs text-muted-foreground truncate">
          {active.file.type || '—'} · {formatBytes(active.file.size)}
        </p>
      ) : null}
    </DialogHeader>

    <div className="flex justify-center">
      {active?.kind === 'video' ? (
        <video
          src={active?.url}
          controls
          className="w-auto h-auto max-w-[90vw] max-h-[70vh] rounded-lg bg-black"
        />
      ) : (
        <img
          src={active?.url}
          alt={active?.file?.name || 'preview'}
          className="w-auto h-auto max-w-[90vw] max-h-[70vh] object-contain rounded-lg bg-black/5"
        />
      )}
    </div>
  </DialogContent>
</Dialog>

    </div>
  )
}
