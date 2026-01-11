'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import useServices from '../../../lib/hooks/useServices'

export default function ServicesPickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onChange,
}) {
  const { services, loading, error, fetchServices } = useServices()
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) fetchServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return services
    return services.filter((s) =>
      `${s.name} ${s.category || ''}`.toLowerCase().includes(query)
    )
  }, [q, services])

  const toggle = (id) => {
    const has = selectedIds.includes(id)
    onChange?.(has ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Tratamientos</DialogTitle>
        </DialogHeader>

        <Input placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />

        <div className="max-h-[320px] overflow-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : error ? (
            <div className="text-sm text-destructive">Error al cargar</div>
          ) : (
            filtered.map((s) => {
              const id = Number(s.id)
              const checked = selectedIds.includes(id)
              return (
                <label
                  key={id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted cursor-pointer"
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(id)} />
                  <div className="leading-tight">
                    <div className="font-medium">{s.name}</div>
                    {s.category ? (
                      <div className="text-xs text-muted-foreground">{s.category}</div>
                    ) : null}
                  </div>
                </label>
              )
            })
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={() => onOpenChange?.(false)}>
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
