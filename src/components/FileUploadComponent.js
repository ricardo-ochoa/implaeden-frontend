'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import FilePreviewModal from './FilePreviewModal'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

// icons (lucide)
import { Upload, Trash2, FileText, Image as ImageIcon, Video } from 'lucide-react'

export default function FileUploadComponent({ onFileUpload }) {
  const [files, setFiles] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)

  const compressImage = async (file) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      return await imageCompression(file, options)
    } catch {
      return file
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const processed = await Promise.all(
        acceptedFiles.map(async (file) => {
          const previewUrl = URL.createObjectURL(file)

          // imágenes: comprimir + regenerar preview
          if (file.type.startsWith('image/')) {
            const compressed = await compressImage(file)
            URL.revokeObjectURL(previewUrl)
            const compressedPreview = URL.createObjectURL(compressed)
            return Object.assign(compressed, { preview: compressedPreview })
          }

          // pdf/video: solo preview
          if (file.type === 'application/pdf' || file.type.startsWith('video/')) {
            return Object.assign(file, { preview: previewUrl })
          }

          // no soportado
          URL.revokeObjectURL(previewUrl)
          return null
        })
      )

      const valid = processed.filter(Boolean)
      setFiles((prev) => [...prev, ...valid])
      onFileUpload?.(valid)
    },
    [onFileUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'video/*': [],
    },
  })

  const removeFile = (index) => {
    setFiles((prev) => {
      const upd = [...prev]
      const [removed] = upd.splice(index, 1)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return upd
    })
  }

  // cleanup previews al desmontar
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f?.preview) URL.revokeObjectURL(f.preview)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 👈 solo un cleanup final

  const prettySize = useMemo(() => {
    return (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }, [])

  const FileThumb = ({ file }) => {
    const common = 'h-14 w-14 rounded-md border bg-muted overflow-hidden'
    if (file.type.startsWith('image/')) {
      return (
        <div className={common}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.preview}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      )
    }
    if (file.type === 'application/pdf') {
      return (
        <div className={`${common} flex items-center justify-center`}>
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
      )
    }
    if (file.type.startsWith('video/')) {
      return (
        <div className={common}>
          <video
            src={file.preview}
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        </div>
      )
    }
    return (
      <div className={`${common} flex items-center justify-center`}>
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  const TypeIcon = ({ file }) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />
    return <Upload className="h-4 w-4" />
  }

  return (
    <>
      <Card className="p-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={[
            'rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30',
          ].join(' ')}
        >
          <input {...getInputProps()} />

          <div className="mx-auto flex max-w-md flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isDragActive
                ? 'Suelta los archivos aquí'
                : 'Arrastra o haz clic para seleccionar (PNG, JPG, PDF, MP4...)'}
            </p>
            <p className="text-xs text-muted-foreground">
              Imágenes se comprimen automáticamente (hasta ~1MB).
            </p>

            <Button type="button" className="mt-2">
              Seleccionar Archivos
            </Button>
          </div>
        </div>

        {/* Lista */}
        {files.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 text-sm text-muted-foreground">
              {files.length} archivo(s) seleccionado(s)
            </div>

            <ScrollArea className="h-[280px] pr-2">
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${idx}`}
                    className="flex items-center gap-3 rounded-lg border bg-background p-2"
                  >
                    <button
                      type="button"
                      className="shrink-0"
                      onClick={() => {
                        setPreviewFile(file)
                        setPreviewOpen(true)
                      }}
                      title="Ver archivo"
                    >
                      <FileThumb file={file} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          <TypeIcon file={file} />
                        </span>
                        <p className="truncate text-sm font-medium">{file.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {prettySize(file.size)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeFile(idx)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </Card>

      {/* Preview Modal (lo dejas igual) */}
      <FilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
      />
    </>
  )
}
