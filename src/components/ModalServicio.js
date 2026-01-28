// components/ModalServicio.jsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'

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

// icons
import { Plus, ReceiptText, X } from 'lucide-react'

// nuevos componentes
import StartDatePicker from '@/components/services/StartDatePicker'
import ServicesPickerDialog from '@/components/services/ServicesPickerDialog'
import useServices from '../../lib/hooks/useServices'

const toMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(n || 0)
  )

/** ✅ id robusto (id / service_id / serviceId / _id / pk) */
const getServiceId = (s) => {
  const v = s?.id ?? s?.service_id ?? s?.serviceId ?? s?._id ?? s?.pk
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Parse robusto para input de dinero:
 * - acepta "1234.5", "1,234.50", "$1,234.50", "1234,50"
 * - devuelve number (o NaN si no se puede)
 */
const parseMoney = (val) => {
  if (val === null || val === undefined) return NaN
  let s = String(val).trim()
  if (!s) return NaN

  s = s.replace(/\s/g, '').replace(/\$/g, '')

  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/,/g, '')
    const n = Number(s)
    return Number.isFinite(n) ? n : NaN
  }

  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(/,/g, '.')
    const n = Number(s)
    return Number.isFinite(n) ? n : NaN
  }

  s = s.replace(/,/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

/** Formato visual sin símbolo: 1,234.50 */
const formatMoneyDisplay = (raw) => {
  const n = parseMoney(raw)
  if (!Number.isFinite(n)) return raw ?? ''
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/** ✅ qty robusto: entero >= 0 (vacío = N/A) */
const parseQty = (val) => {
  if (val === null || val === undefined) return 0
  const s = String(val).trim()
  if (!s) return 0
  if (!/^\d+$/.test(s)) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

/** ✅ normaliza lo que venga del picker a ids numéricos */
const normalizeIdsFromPicker = (value) => {
  const arr = Array.isArray(value) ? value : []
  const ids = arr
    .map((x) => {
      if (x && typeof x === 'object') return getServiceId(x)
      const n = Number(x)
      return Number.isFinite(n) ? n : null
    })
    .filter((n) => n != null)

  return Array.from(new Set(ids))
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

  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedServiceIds, setSelectedServiceIds] = useState([]) // number[]
  const [costById, setCostById] = useState({}) // { [serviceId]: string }
  const [qtyById, setQtyById] = useState({}) // { [serviceId]: string }  ✅ NUEVO
  const [groupTitle, setGroupTitle] = useState('')
  const [focusedCostId, setFocusedCostId] = useState(null)

  useEffect(() => {
    if (open) fetchServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const servicesById = useMemo(() => {
    const map = new Map()
    for (const s of services || []) {
      const sid = getServiceId(s)
      if (sid != null) map.set(sid, s)
    }
    return map
  }, [services])

  const selectedServices = useMemo(() => {
    return (selectedServiceIds || [])
      .map((id) => servicesById.get(Number(id)))
      .filter(Boolean)
  }, [selectedServiceIds, servicesById])

  const isGroup = selectedServiceIds.length > 1

  useEffect(() => {
    if (!open) return
    if (!isGroup) return
    setGroupTitle((prev) => {
      if (String(prev || '').trim()) return prev
      const names = selectedServices.map((s) => s?.name).filter(Boolean)
      if (names.length === 0) return 'Paquete de tratamientos'
      if (names.length <= 3) return names.join(', ')
      return `${names.slice(0, 3).join(', ')} +${names.length - 3}`
    })
  }, [open, isGroup, selectedServices])

  /** ✅ total = suma de "total_cost" (no lo multiplicamos por cantidad porque es costo total del tratamiento) */
  const total = useMemo(() => {
    return (selectedServiceIds || []).reduce((acc, id) => {
      const sid = Number(id)
      const raw = costById[sid] ?? costById[String(sid)] ?? 0
      const v = parseMoney(raw)
      return acc + (Number.isFinite(v) ? v : 0)
    }, 0)
  }, [selectedServiceIds, costById])

  const handleRemoveService = (id) => {
    const sid = Number(id)
    setSelectedServiceIds((prev) => prev.filter((x) => Number(x) !== sid))

    setCostById((prev) => {
      const next = { ...prev }
      delete next[sid]
      delete next[String(sid)]
      return next
    })

    setQtyById((prev) => {
      const next = { ...prev }
      delete next[sid]
      delete next[String(sid)]
      return next
    })

    // compat
    if (setSelectedService && Number(selectedService) === sid) setSelectedService('')
    if (setInitialCost) setInitialCost('')
  }

  const handleChangeCost = (id, value) => {
    const sidNum = Number(id)
    setCostById((prev) => ({ ...prev, [sidNum]: value, [String(sidNum)]: value }))
  }

  const handleBlurCost = (sid) => {
    setFocusedCostId(null)

    const sidNum = Number(sid)
    const raw = costById[sidNum] ?? costById[String(sidNum)] ?? ''
    const n = parseMoney(raw)

    if (!Number.isFinite(n)) {
      handleChangeCost(sidNum, '')
      return
    }

    handleChangeCost(sidNum, n.toFixed(2))
  }

  const handleChangeQty = (id, value) => {
    const sidNum = Number(id)
    // permitimos borrar para que el usuario edite, pero validamos al guardar
    setQtyById((prev) => ({ ...prev, [sidNum]: value, [String(sidNum)]: value }))
  }

  const handleBlurQty = (sid) => {
  const sidNum = Number(sid)
  const raw = qtyById[sidNum] ?? qtyById[String(sidNum)] ?? ''
  const n = parseQty(raw)
  // vacío = N/A → lo dejamos vacío
  if (n === null) {
    handleChangeQty(sidNum, '')
    return
  }
  // inválido o negativo → lo limpiamos
  if (!Number.isFinite(n) || n < 0) {
    handleChangeQty(sidNum, '')
    return
  }
  // normaliza
  handleChangeQty(sidNum, String(n))
}

  // inicializa costos/cantidades para ids seleccionados
  useEffect(() => {
    if (!open) return

    setCostById((prev) => {
      const next = { ...prev }
      for (const id of selectedServiceIds) {
        const kNum = Number(id)
        const kStr = String(kNum)
        if (next[kNum] === undefined && next[kStr] === undefined) {
          next[kNum] = ''
          next[kStr] = ''
        }
      }
      for (const key of Object.keys(next)) {
        const kNum = Number(key)
        if (!selectedServiceIds.some((x) => Number(x) === kNum)) delete next[key]
      }
      return next
    })

    setQtyById((prev) => {
      const next = { ...prev }
      for (const id of selectedServiceIds) {
        const kNum = Number(id)
        const kStr = String(kNum)
        if (next[kNum] === undefined && next[kStr] === undefined) {
          next[kNum] = ''
          next[kStr] = ''
        }
      }
      for (const key of Object.keys(next)) {
        const kNum = Number(key)
        if (!selectedServiceIds.some((x) => Number(x) === kNum)) delete next[key]
      }
      return next
    })
  }, [open, selectedServiceIds])

  // compat con tu implementación anterior (1 servicio + costo)
  useEffect(() => {
    if (!open) return
    const sid = selectedService ? Number(selectedService) : null
    if (sid && Number.isFinite(sid) && !selectedServiceIds.some((x) => Number(x) === sid)) {
      setSelectedServiceIds([sid])
      setCostById((prev) => ({
        ...prev,
        [sid]: initialCost ?? '',
        [String(sid)]: initialCost ?? '',
      }))
      setQtyById((prev) => ({
        ...prev,
        [sid]: prev?.[sid] ?? '1',
        [String(sid)]: prev?.[String(sid)] ?? '1',
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isSaveDisabled = useMemo(() => {
    if (!newRecordDate) return true
    if (selectedServiceIds.length === 0) return true

    // ✅ solo valida mismatch si YA cargaron servicios
    if ((services || []).length > 0 && selectedServices.length !== selectedServiceIds.length) {
      return true
    }

    if (isGroup && !String(groupTitle || '').trim()) return true

    for (const id of selectedServiceIds) {
      const sid = Number(id)

      // costo
      const rawCost = costById[sid] ?? costById[String(sid)]
      if (rawCost === '' || rawCost === null || rawCost === undefined) return true
      const num = parseMoney(rawCost)
      if (!Number.isFinite(num) || num < 0) return true

      // cantidad ✅
      const rawQty = qtyById[sid] ?? qtyById[String(sid)] ?? ''
      const q = parseQty(rawQty)
      // vacío (null) = N/A -> OK
      if (q !== null) {
        if (!Number.isFinite(q) || q < 0) return true
      }
    }

    return false
  }, [
    newRecordDate,
    selectedServiceIds,
    selectedServices,
    services,
    costById,
    qtyById,
    isGroup,
    groupTitle,
  ])

  const handleSave = async () => {
    if (isSaveDisabled) return

    const items = selectedServiceIds.map((id) => {
      const sid = Number(id)
      const rawCost = costById[sid] ?? costById[String(sid)]
      const rawQty = qtyById[sid] ?? qtyById[String(sid)] ?? ''
      const q = parseQty(rawQty) // null = vacío/N/A
      const item = {
        service_id: sid,
        total_cost: parseMoney(rawCost),
      }
      // si el usuario escribió algo (incluye "0"), lo mandamos
      if (q !== null) item.quantity = q
      return item
    })

    if (items.length > 1) {
      await handleSaveRecord?.({
        title: String(groupTitle || '').trim(),
        start_date: newRecordDate,
        items, // items ahora traen quantity
      })
      return
    }

    await handleSaveRecord?.({
      service_id: items[0].service_id,
      service_date: newRecordDate,
      total_cost: items[0].total_cost,
      quantity: items[0].quantity, // ✅ NUEVO
    })
  }

  // ✅ handler para el picker (aquí está la clave)
  const handlePickerChange = (value) => {
    setSelectedServiceIds(normalizeIdsFromPicker(value))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-[760px] sm:w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="font-medium mr-4">Fecha de inicio:</Label>
            <StartDatePicker value={newRecordDate} onChange={setNewRecordDate} />
          </div>

          {isGroup ? (
            <div className="space-y-2">
              <Label className="font-medium">Nombre del paquete</Label>
              <Input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Ej: Implantes + Endodoncia + Profilaxis"
              />
              <p className="text-xs text-muted-foreground">
                El nombre es requerido para guardar.
              </p>
            </div>
          ) : null}

          <div className="border-t pt-5">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">Tratamientos seleccionados</div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-sm font-semibold w-[90px] text-right">Cant.</div>
                <div className="text-sm font-semibold w-[160px] text-right">$ Costo</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {selectedServices.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Aún no agregas tratamientos.
                </div>
              ) : (
                selectedServices.map((svc, idx) => {
                  const sid = getServiceId(svc)
                  if (sid == null) return null

                  const rawCost = costById[sid] ?? costById[String(sid)] ?? ''
                  const rawQty = qtyById[sid] ?? qtyById[String(sid)] ?? ''
                  const isFocused = focusedCostId === sid

                  return (
                    <div
                        key={sid}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveService(sid)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                          aria-label="Quitar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center bg-background text-xs font-semibold">
                          {idx + 1}
                        </span>

                        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium truncate max-w-[220px] sm:max-w-[320px]">
                          {svc.name}
                        </span>

                      </div>

                      {/* ✅ inputs derecha */}
                      <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:items-center sm:gap-3">
                        <div className="w-full sm:w-[90px]">
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="N/A"
                            className="text-right font-mono font-medium rounded-full bg-muted text-foreground"
                            value={rawQty}
                            onChange={(e) => handleChangeQty(sid, e.target.value)}
                            onBlur={() => handleBlurQty(sid)}
                          />
                        </div>

                        <div className="w-full sm:w-[160px]">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="text-right font-mono font-medium rounded-full bg-muted text-foreground"
                            value={isFocused ? rawCost : formatMoneyDisplay(rawCost)}
                            onFocus={() => setFocusedCostId(sid)}
                            onBlur={() => handleBlurCost(sid)}
                            onChange={(e) => handleChangeCost(sid, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPickerOpen(true)}
                disabled={loading || Boolean(error)}
                className="gap-2 rounded-full px-6 w-full md:w-auto hover:scale-[1.02] transition-transform"
              >
                <Plus className="h-4 w-4" />
                Agregar nuevo
              </Button>

              {error ? (
                <div className="mt-2 text-xs text-destructive">
                  Error cargando servicios.
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-base">Total:</div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
                <ReceiptText className="h-5 w-5" />
                <div className="text-lg font-mono font-semibold">{toMoney(total)}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="text-destructive" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              type="button"
              className="gap-2 rounded-full px-6 w-full md:w-auto hover:scale-[1.02] transition-transform"
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              Guardar Tratamiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ServicesPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedIds={selectedServiceIds}
        onChange={handlePickerChange}
      />
    </>
  )
}
