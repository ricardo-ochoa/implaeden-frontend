// components/ModalServicio.jsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import useServices from '../../lib/hooks/useServices'

// shadcn/ui
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// calendar shadcn
import { Calendar } from '@/components/ui/calendar'

const pad2 = (n) => String(n).padStart(2, '0')
const formatYYYYMMDD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

function parseYYYYMMDD(value) {
  if (!value) return undefined
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return undefined
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const da = Number(m[3])
  const dt = new Date(y, mo, da)
  if (Number.isNaN(dt.getTime())) return undefined
  return dt
}

export default function ModalServicio({
  open,
  onClose,
  title,
  newRecordDate,
  setNewRecordDate,
  selectedService,
  setSelectedService,
  initialCost,
  setInitialCost,
  handleSaveRecord,
}) {
  const { services, loading, error, fetchServices } = useServices()

  useEffect(() => {
    if (open) fetchServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Calendar control
  const selectedDateObj = useMemo(
    () => parseYYYYMMDD(newRecordDate),
    [newRecordDate]
  )

  const handlePickDate = (date) => {
    if (!date) return
    setNewRecordDate(formatYYYYMMDD(date))
  }

  const isSaveDisabled =
    !newRecordDate || !selectedService || initialCost === '' || Number(initialCost) < 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Fecha (Calendar) */}
          <div className="space-y-2">
            <Label className="font-medium">Fecha de inicio</Label>

            <div className="grid gap-3 items-center">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={handlePickDate}
                  captionLayout="dropdown"
                />
                  {/* 
                <Label className="text-muted-foreground">Seleccionada</Label>
                <Input value={newRecordDate || ''} readOnly placeholder="YYYY-MM-DD" /> */}
              </div>
            </div>
          </div>

          {/* Servicio */}
          <div className="space-y-2">
            <Label className="font-medium">Servicio</Label>

            <Select
              value={selectedService ? String(selectedService) : ''}
              onValueChange={(v) => setSelectedService?.(v)}
              disabled={loading || Boolean(error)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading ? 'Cargando…' : error ? 'Error al cargar' : 'Selecciona un servicio'
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {loading ? (
                  <SelectItem value="__loading" disabled>
                    Cargando…
                  </SelectItem>
                ) : error ? (
                  <SelectItem value="__error" disabled>
                    Error al cargar
                  </SelectItem>
                ) : (
                  services.map((svc) => (
                    <SelectItem key={svc.id} value={String(svc.id)}>
                      <span className="font-semibold">{svc.name}</span>
                      {svc?.category ? (
                        <span className="text-muted-foreground"> — {svc.category}</span>
                      ) : null}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Costo inicial */}
          <div className="space-y-2">
            <Label className="font-medium">Costo inicial (MXN)</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={initialCost}
              onChange={(e) => setInitialCost?.(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="text-destructive" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSaveRecord} disabled={isSaveDisabled}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
