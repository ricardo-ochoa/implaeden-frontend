'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus } from 'lucide-react'

export default function EvidencePicker({
  value = [], // File[]
  onChange,
  accept = 'image/*,video/*',
  multiple = true,
  disabled = false,
}) {
  const inputRef = React.useRef(null)
  const files = Array.isArray(value) ? value : []

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files || [])
          onChange?.(picked)
          e.target.value = ''
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="rounded-full h-12 w-12 p-0"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label="Agregar evidencia"
        title="Agregar evidencia"
      >
        <ImagePlus className="h-12 w-12" />
      </Button>

      {files.length > 0 ? (
        <span className="text-sm text-muted-foreground">
          {files.length} archivo{files.length === 1 ? '' : 's'}
        </span>
      ) : null}
    </div>
  )
}
