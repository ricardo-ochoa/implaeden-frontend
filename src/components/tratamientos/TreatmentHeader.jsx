'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ToothBadge from '../ToothBadge'

import { Pencil, Check, X, Loader2 } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

const toMoney = (n) => {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(Number(n || 0))
  } catch {
    return `${n || 0}`
  }
}

export default function TreatmentHeader({
  title = 'Tratamiento',
  relatedTeeth = [],
  cost = 0,

  onToothClick,
  editable = false,              // habilita edición
  isUpdating = false,            // loading del update
  onSaveCost,                    // async (newCost:number) => boolean|void
  onCostSaved,                   // (newCost:number) => void (opcional)
}) {
  const teeth = Array.isArray(relatedTeeth) ? relatedTeeth : []

  const [isEditingCost, setIsEditingCost] = React.useState(false)
  const [editableCost, setEditableCost] = React.useState(cost ?? 0)

  // si cambia el cost desde afuera, sincroniza
  React.useEffect(() => {
    if (!isEditingCost) setEditableCost(cost ?? 0)
  }, [cost, isEditingCost])

  const money = React.useMemo(() => toMoney(cost), [cost])

  const handleUpdateCost = async () => {
    const newCost = Number(editableCost)
    if (!Number.isFinite(newCost)) return

    try {
      const res = await onSaveCost?.(newCost)
      // si tu onSaveCost regresa boolean, respétalo; si no regresa nada, asumimos ok
      const ok = typeof res === 'boolean' ? res : true

      if (ok) {
        onCostSaved?.(newCost)
        setIsEditingCost(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xl font-semibold truncate">{title}:</p>

          {teeth.map((t) => (
            <ToothBadge
              key={t}
              onClick={(e) => {
                if (typeof onToothClick !== 'function') return
                e.stopPropagation()
                onToothClick(t)
              }}
              tooth={t}
            />
          ))}
        </div>
      </div>

      {/* ✅ COSTO (editable opcional) */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base text-muted-foreground">Costo:</span>

        {!editable ? (
          <span className="text-2xl font-semibold">{money}</span>
        ) : isEditingCost ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={editableCost}
              onChange={(e) => setEditableCost(e.target.value)}
              disabled={isUpdating}
              className="w-[140px]"
            />

            <Button
              type="button"
              size="icon"
              onClick={handleUpdateCost}
              disabled={isUpdating}
              aria-label="Guardar costo"
              title="Guardar"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setEditableCost(cost ?? 0)
                setIsEditingCost(false)
              }}
              disabled={isUpdating}
              aria-label="Cancelar"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={cx(
              'group flex items-center gap-2 rounded-md px-2 py-1',
              'hover:bg-muted/40 cursor-pointer'
            )}
            onClick={() => setIsEditingCost(true)}
            role="button"
            tabIndex={0}
          >
            <p className="text-2xl font-semibold">{money}</p>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Editar costo"
              title="Editar"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingCost(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
