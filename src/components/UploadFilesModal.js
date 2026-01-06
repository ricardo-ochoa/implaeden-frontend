'use client'

import React, { useEffect, useMemo, useState } from 'react'
import FileUploadComponent from '@/components/FileUploadComponent'

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// helper: Date -> "YYYY-MM-DD"
const toYMD = (d) => {
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// helper: "YYYY-MM-DD" -> Date
const fromYMD = (s) => {
  if (!s) return undefined
  const [y, m, d] = s.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function UploadFilesModal({
  open,
  onClose,
  title = 'Nuevo historial clínico:',
  newRecordDate,
  setNewRecordDate,
  setNewRecordFiles,
  handleSaveRecord,
}) {
  const [filesUploaded, setFilesUploaded] = useState([])

  const isSaveDisabled = !newRecordDate || filesUploaded.length === 0

  // previews (opcional)
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    if (!open) return

    // cuando abre, no reseteo por default para no borrar lo que ya tengas
    // si quieres resetear siempre al abrir, dímelo
  }, [open])

  useEffect(() => {
    if (filesUploaded.length === 0) {
      setPreviews([])
      return
    }

    const newPreviews = filesUploaded.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }))

    setPreviews(newPreviews)

    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [filesUploaded])

  const handleFiles = (files) => {
    setFilesUploaded(files)
    setNewRecordFiles(files)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fecha */}
          <div className="space-y-2">
            <Label className="font-medium">Fecha de registro:</Label>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {newRecordDate ? newRecordDate : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="p-0 w-auto" align="start">
                <Calendar
                  mode="single"
                  selected={fromYMD(newRecordDate)}
                  onSelect={(d) => {
                    if (!d) return
                    setNewRecordDate(toYMD(d))
                  }}
                  className="rounded-md border shadow-sm"
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
          </div>


          {/* Subida */}
          <div className="space-y-2">
            <FileUploadComponent onFileUpload={handleFiles} />
          </div>

          {/* Previews (opcional, pero útil) */}
          {previews.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Archivos seleccionados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {previews.map((p) => {
                  const isPdf = (p.type || '').toLowerCase().includes('pdf')
                  const isImage = (p.type || '').toLowerCase().startsWith('image/')

                  return (
                    <div
                      key={p.url}
                      className="rounded-md border overflow-hidden bg-muted/30"
                      title={p.name}
                    >
                      <div className="px-3 py-2 border-b">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                      </div>

                      <div className="h-[120px] w-full flex items-center justify-center">
                        {isImage ? (
                          <img
                            src={p.url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : isPdf ? (
                          <div className="text-xs text-muted-foreground">PDF</div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Archivo</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            onClick={handleSaveRecord}
            disabled={isSaveDisabled}
            className="w-full sm:w-auto sm:min-w-[220px]"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
