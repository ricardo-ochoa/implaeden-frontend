// src/components/UpdateStatusModal.jsx
'use client'

import React from 'react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const statusOptions = ['Por Iniciar', 'En proceso', 'Terminado']

export default function UpdateStatusModal({
  open,
  onClose,
  treatment, // lo dejo por compat, por si lo necesitas para algo (no se usa aquí)
  newStatus,
  setNewStatus,
  onSave,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Cambiar estado del tratamiento</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={newStatus || ''} onValueChange={(v) => setNewStatus?.(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!newStatus}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
