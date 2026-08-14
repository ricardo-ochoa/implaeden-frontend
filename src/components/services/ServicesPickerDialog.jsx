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
      {/* Más ancho que el resto de los diálogos: la lista va en varias columnas
          para ver el catálogo completo sin tanto scroll. */}
      <DialogContent className="sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle>Tratamientos</DialogTitle>
        </DialogHeader>

        <Input placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />

        <div className="max-h-[55vh] overflow-auto pr-1">
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : error ? (
            <div className="text-sm text-destructive">Error al cargar</div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Ningún tratamiento coincide con “{q}”.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => {
                const id = Number(s.id)
                const checked = selectedIds.includes(id)
                return (
                  <label
                    key={id}
                    // El borde separa visualmente las columnas: sin él, a tres
                    // columnas los nombres largos que envuelven se confunden
                    // con el de al lado.
                    className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-2.5 py-2 transition ${
                      checked ? 'border-primary bg-muted' : 'hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      className="mt-0.5 shrink-0"
                      checked={checked}
                      onCheckedChange={() => toggle(id)}
                    />
                    <div className="min-w-0 leading-tight">
                      <div className="text-sm font-medium">{s.name}</div>
                      {s.category ? (
                        <div className="text-xs text-muted-foreground">{s.category}</div>
                      ) : null}
                    </div>
                  </label>
                )
              })}
            </div>
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
