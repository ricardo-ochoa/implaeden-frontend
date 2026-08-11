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

// components
import StartDatePicker from '@/components/services/StartDatePicker'
import ServicesPickerDialog from '@/components/services/ServicesPickerDialog'
import DiagramaTratamientos from '@/components/tratamientos/DiagramaTratamientos'
import useServices from '../../lib/hooks/useServices'

const toMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(n || 0)
  )

// El costo que se captura INCLUYE IVA. Desglosamos 16% incluido:
//   subtotal = total / 1.16 ; iva = total − subtotal
const IVA_RATE = 0.16
const ivaBreakdown = (total) => {
  const t = Number(total)
  if (!Number.isFinite(t) || t <= 0) return { subtotal: 0, iva: 0, total: 0 }
  const subtotal = t / (1 + IVA_RATE)
  return { subtotal, iva: t - subtotal, total: t }
}

/** ✅ id robusto (id / service_id / serviceId / _id / pk) */
const getServiceId = (s) => {
  const v = s?.id ?? s?.service_id ?? s?.serviceId ?? s?._id
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Parse robusto para input de dinero:
 * - acepta "1234.5", "1,234.50", "$1,234.50", "1234,50"
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

const uniq = (arr) => Array.from(new Set(arr || []))

const teethPrettyFromIds = (ids = []) => {
  const nums = (ids || [])
    .map((x) => String(x).replace(/^_/, ''))
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
  return nums.map(String)
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
  savedDate,
  teethIds = [],
  setTeethIds,
  mode = 'create',
  initialTreatment = null,
  handleUpdateRecord,
  focusServiceId = null,
}) {
  const { services, loading, error, fetchServices } = useServices()

  const [pickerOpen, setPickerOpen] = useState(false)

  const [selectedServiceIds, setSelectedServiceIds] = useState([]) // number[]
  const [costById, setCostById] = useState({}) // { [serviceId]: string }
  const [groupTitle, setGroupTitle] = useState('')
  const [focusedCostId, setFocusedCostId] = useState(null)

  const [teethByServiceId, setTeethByServiceId] = useState({}) // { [sid:number]: string[] }
  const [activeServiceId, setActiveServiceId] = useState(null) // sid que estás editando en el diagrama
  const [treatmentIdByServiceId, setTreatmentIdByServiceId] = useState({}) // { [sid]: treatment_id }

  useEffect(() => {
    if (open) fetchServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const getTreatmentId = (x) => Number(x?.treatment_id ?? x?.id ?? null)
const getServiceIdFromItem = (x) => Number(x?.service_id ?? x?.serviceId ?? x?.service?.id ?? null)
const normTeethArray = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((t) => normalizeToothId(t))
    .filter(Boolean)

    const toYMD = (v) => {
  const m = String(v ?? '').match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

useEffect(() => {
  if (!open) return
  if (mode !== 'edit') return
  if (!initialTreatment) return

  const isGroupEdit = Boolean(initialTreatment?.isGroup) || Array.isArray(initialTreatment?.items)
  const items = isGroupEdit
    ? (Array.isArray(initialTreatment?.items) ? initialTreatment.items : [])
    : [initialTreatment]

  // ✅ fecha inicial
  const initialDate =
    (isGroupEdit ? initialTreatment?.group_start_date : initialTreatment?.service_date) ||
    items?.[0]?.service_date ||
    ''

  setNewRecordDate?.(toYMD(initialDate))

  // ✅ título de grupo (solo display/edición si luego haces endpoint para groups)
  if (isGroupEdit) {
    setGroupTitle(String(initialTreatment?.group_title || initialTreatment?.title || 'Paquete de tratamientos'))
  }

  const nextIds = []
  const nextCost = {}
  const nextTeeth = {}
  const nextMap = {}

  for (const it of items) {
    const sid = getServiceIdFromItem(it)
    const tid = getTreatmentId(it)
    if (!Number.isFinite(sid) || !Number.isFinite(tid)) continue

    nextIds.push(sid)
    nextMap[sid] = tid

    const c = it?.total_cost ?? 0
    nextCost[sid] = String(Number(c || 0).toFixed(2))
    nextCost[String(sid)] = String(Number(c || 0).toFixed(2))

    nextTeeth[sid] = normTeethArray(it?.teeth_ids)
  }

  const uniqIds = Array.from(new Set(nextIds))
  setSelectedServiceIds(uniqIds)
  setTreatmentIdByServiceId(nextMap)
  setCostById(nextCost)
  setTeethByServiceId(nextTeeth)

  const focus = Number(focusServiceId)
const initialActive =
  Number.isFinite(focus) && uniqIds.includes(focus)
    ? focus
    : (uniqIds.length ? uniqIds[0] : null)

setActiveServiceId(initialActive)

  // compat (si alguien usa selectedService/initialCost con single)
  if (!isGroupEdit && uniqIds.length === 1) {
    setSelectedService?.(uniqIds[0])
    setInitialCost?.(nextCost[uniqIds[0]] ?? '')
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, mode, initialTreatment, focusServiceId])

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

  /** ✅ total = suma de costos */
  const total = useMemo(() => {
    return (selectedServiceIds || []).reduce((acc, id) => {
      const sid = Number(id)
      const raw = costById[sid] ?? costById[String(sid)] ?? 0
      const v = parseMoney(raw)
      return acc + (Number.isFinite(v) ? v : 0)
    }, 0)
  }, [selectedServiceIds, costById])

  // ✅ unión de dientes (para mantener coloreado todo)
  const allTeethIds = useMemo(() => {
    const all = []
    for (const sid of selectedServiceIds) {
      const k = Number(sid)
      const ids = teethByServiceId?.[k] || []
      all.push(...ids)
    }
    return uniq(all)
  }, [selectedServiceIds, teethByServiceId])

  // ✅ dientes del tratamiento activo (para resaltar)
  const currentTeethIds = useMemo(() => {
    const sid = activeServiceId ? Number(activeServiceId) : null
    if (!sid || !Number.isFinite(sid)) return []
    return teethByServiceId?.[sid] || []
  }, [activeServiceId, teethByServiceId])

  const activeServiceName = useMemo(() => {
    if (!activeServiceId) return ''
    const svc = servicesById.get(Number(activeServiceId))
    return svc?.name || ''
  }, [activeServiceId, servicesById])

  // ✅ opcional: sincroniza hacia parent como “union” (compat)
  useEffect(() => {
    if (!open) return
    setTeethIds?.(allTeethIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTeethIds, open])

  const handleRemoveService = (id) => {
    const sid = Number(id)

    setSelectedServiceIds((prev) => {
    const next = prev.filter((x) => Number(x) !== sid)

      setActiveServiceId((cur) => {
        if (Number(cur) !== sid) return cur
        return next.length ? Number(next[0]) : null
      })

      return next
    })
    
    setCostById((prev) => {
      const next = { ...prev }
      delete next[sid]
      delete next[String(sid)]
      return next
    })

    setTeethByServiceId((prev) => {
      const next = { ...prev }
      delete next[sid]
      delete next[String(sid)]
      return next
    })

    // si el que quitaste era el activo, mueve el foco
    // setActiveServiceId((prev) => {
    //   if (Number(prev) !== sid) return prev
    //   const nextId =
    //     selectedServiceIds.filter((x) => Number(x) !== sid).map(Number)[0] ?? null
    //   return nextId
    // })

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

  // ✅ init costs + teeth por id seleccionado
  useEffect(() => {
    if (!open) return

    // costs
    setCostById((prev) => {
      const next = { ...prev }
      for (const id of selectedServiceIds) {
        const k = Number(id)
        const ks = String(k)
        if (next[k] === undefined && next[ks] === undefined) {
          next[k] = ''
          next[ks] = ''
        }
      }
      for (const key of Object.keys(next)) {
        const kNum = Number(key)
        if (!selectedServiceIds.some((x) => Number(x) === kNum)) delete next[key]
      }
      return next
    })

    // teeth
    setTeethByServiceId((prev) => {
      const next = { ...prev }
      for (const id of selectedServiceIds) {
        const k = Number(id)
        if (!Array.isArray(next[k])) next[k] = []
      }
      for (const key of Object.keys(next)) {
        const kNum = Number(key)
        if (!selectedServiceIds.some((x) => Number(x) === kNum)) delete next[key]
      }
      return next
    })

    // foco inicial
    setActiveServiceId((prev) => {
      if (prev && selectedServiceIds.some((x) => Number(x) === Number(prev))) return prev
      return selectedServiceIds.length ? Number(selectedServiceIds[0]) : null
    })
  }, [open, selectedServiceIds])

  // compat con tu implementación anterior (1 servicio + costo + teethIds global)
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

      // si venías del modo anterior, aplica teethIds global a este 1 servicio (solo si no hay ya)
      const legacyTeeth = Array.isArray(teethIds) ? teethIds : []
      if (legacyTeeth.length) {
        setTeethByServiceId((prev) => {
          const next = { ...prev }
          if (!Array.isArray(next[sid]) || next[sid].length === 0) {
            next[sid] = uniq(legacyTeeth)
          }
          return next
        })
      }

      setActiveServiceId(sid)
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
      const rawCost = costById[sid] ?? costById[String(sid)]
      if (rawCost === '' || rawCost === null || rawCost === undefined) return true
      const num = parseMoney(rawCost)
      if (!Number.isFinite(num) || num < 0) return true
    }

    return false
  }, [
    newRecordDate,
    selectedServiceIds,
    selectedServices,
    services,
    costById,
    isGroup,
    groupTitle,
  ])

  // ModalServicio.jsx (arriba, junto a helpers)
const normalizeToothId = (id) => {
  const s = String(id ?? '').trim()
  const n = s.replace(/^_/, '')
  if (!/^\d+$/.test(n)) return null
  return `_${n}`
}


  // ✅ click en diente -> toggle SOLO dentro del tratamiento activo
const handleToothClick = (toothId) => {
  const tid = normalizeToothId(toothId)
  if (!tid) return

  let sid = activeServiceId ? Number(activeServiceId) : null
  if (!sid && selectedServiceIds.length) {
    sid = Number(selectedServiceIds[0])
    setActiveServiceId(sid)
  }
  if (!sid) return

  setTeethByServiceId((prev) => {
    const current = Array.isArray(prev?.[sid]) ? prev[sid] : []
    const has = current.includes(tid)
    const nextForService = has ? current.filter((x) => x !== tid) : [...current, tid]
    return { ...prev, [sid]: Array.from(new Set(nextForService)) }
  })
}

  const clearCurrentServiceTeeth = () => {
    const sid = activeServiceId ? Number(activeServiceId) : null
    if (!sid) return
    setTeethByServiceId((prev) => ({ ...prev, [sid]: [] }))
  }
const toothNum = (id) => {
  const n = Number(String(id ?? '').replace(/^_/, ''))
  return Number.isFinite(n) ? n : null
}

const handleSave = async () => {
  if (isSaveDisabled) return

  const isEditingGroup =
    mode === 'edit' && (Boolean(initialTreatment?.isGroup) || selectedServiceIds.length > 1)

  const items = selectedServiceIds.map((id) => {
    const sid = Number(id)
    const rawCost = costById[sid] ?? costById[String(sid)]
    const tSvg = teethByServiceId?.[sid] || []
    const tNums = tSvg.map(toothNum).filter((n) => n != null)

    return {
      treatment_id: treatmentIdByServiceId?.[sid] ?? null,
      service_id: sid,
      total_cost: parseMoney(rawCost),
      teeth_ids: tNums,
      quantity: tNums.length,

      // ✅ SOLO single/create usan service_date
      ...(isEditingGroup ? {} : { service_date: newRecordDate }),
    }
  })

  const unionNums = allTeethIds.map(toothNum).filter((n) => n != null)
  const isGroupNow = items.length > 1

  if (mode === 'edit') {
    await handleUpdateRecord?.({
      isGroup: isGroupNow,
      group_id: initialTreatment?.group_id ?? null,
      title: String(groupTitle || '').trim(),

      // ✅ esta fecha es la del grupo
      group_start_date: newRecordDate, // YYYY-MM-DD desde el picker

      group_teeth_ids: unionNums,
      items,
      single_treatment_id: !isGroupNow ? (items?.[0]?.treatment_id ?? null) : null,
    })
    return
  }

  // CREATE (tu lógica original)
  if (isGroupNow) {
    await handleSaveRecord?.({
      title: String(groupTitle || '').trim(),
      group_start_date: newRecordDate,
      group_teeth_ids: unionNums,
      items,
    })
    return
  }

  await handleSaveRecord?.({
    service_id: items[0].service_id,
    service_date: newRecordDate,
    total_cost: items[0].total_cost,
    quantity: items[0].quantity,
    teeth_ids: items[0].teeth_ids,
  })
}


  const handlePickerChange = (value) => {
    const ids = normalizeIdsFromPicker(value)
    setSelectedServiceIds(ids)
    // foco a lo primero si no hay
    if (ids.length) setActiveServiceId(Number(ids[ids.length - 1]))
  }

  const currentPretty = useMemo(
    () => teethPrettyFromIds(currentTeethIds),
    [currentTeethIds]
  )

  const sameArray = (a = [], b = []) =>
  a.length === b.length && a.every((v, i) => v === b[i])

const normalizeIds = (arr) => {
  const a = Array.isArray(arr) ? arr : []
  // normaliza + quita duplicados + ordena (evita “cambios” falsos)
  return Array.from(new Set(a)).sort()
}

// dentro del componente:
const onSelectedTeethChange = React.useCallback((next) => {
  const normalized = normalizeIds(next)
  setSelectedTeeth((prev) => {
    const prevNorm = normalizeIds(prev)
    return sameArray(prevNorm, normalized) ? prev : normalized
  })
}, [])

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-[980px] sm:w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-6">
            {/* ✅ DIAGRAMA */}
            <div className="shrink-0 self-start md:sticky md:top-2 space-y-3">
              <DiagramaTratamientos
                src="/tratamientos/diagrama.svg"
                currentIds={currentTeethIds}
                manual
                onToothClick={handleToothClick}
              />

              <div className="rounded-2xl bg-muted p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      Asignando dientes a:{' '}
                      <span className="font-mono">
                        {activeServiceName || '—'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total seleccionados (todos):{' '}
                      <span className="font-mono">{allTeethIds.length}</span>
                      {' · '}
                      En este tratamiento:{' '}
                      <span className="font-mono">{currentTeethIds.length}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-full"
                    onClick={clearCurrentServiceTeeth}
                    disabled={!activeServiceId || currentTeethIds.length === 0}
                    title="Quita los dientes SOLO del tratamiento activo"
                  >
                    Limpiar
                  </Button>
                </div>

                {currentPretty.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentPretty.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-background px-3 py-1 text-xs font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Selecciona un tratamiento (en la lista) y luego marca dientes en el diagrama.
                    Si un servicio no necesita dientes (ej. profilaxis), déjalo vacío.
                  </p>
                )}
              </div>
            </div>

            {/* ✅ FORMULARIO */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-medium mr-4">Fecha de inicio:</Label>
                <StartDatePicker value={newRecordDate} onChange={setNewRecordDate} allowManual />
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
                    <div className="text-sm font-semibold w-[90px] text-right">
                      Cant.
                    </div>
                    <div className="text-sm font-semibold w-[160px] text-right">
                      $ Costo
                    </div>
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
                      const isFocused = focusedCostId === sid

                      const serviceTeeth = teethByServiceId?.[sid] || []
                      const qty = serviceTeeth.length
                      const pretty = teethPrettyFromIds(serviceTeeth)
                      const isActive = Number(activeServiceId) === sid

                      return (
                        <div
                          key={sid}
                          className={`flex flex-col gap-2 rounded-2xl p-2 cursor-pointer hover:bg-muted/50 ${
                            isActive ? 'bg-indigo-50/60 ring-1 ring-indigo-200' : ''
                          }`}
                          onClick={() => setActiveServiceId(sid)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (mode === 'edit') return
                                  handleRemoveService(sid)
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                                aria-label="Quitar"
                              >
                                <X className="h-4 w-4" />
                              </button>

                              {/* <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center bg-background text-xs font-semibold">
                                {idx + 1}
                              </span> */}

                              <button
                                type="button"
                                onClick={() => setActiveServiceId(sid)}
                                className="min-w-0 text-left"
                                title="Selecciona este tratamiento para asignar dientes en el diagrama"
                              >
                                <div className="rounded-full bg-white px-3 py-1 text-sm font-medium truncate max-w-[220px] sm:max-w-[320px]">
                                  {svc.name}
                                </div>

                                <div className="mt-1 text-xs text-muted-foreground truncate max-w-[280px]">
                                  {pretty.length ? `Dientes: ${pretty.join(', ')}` : 'Sin dientes'}
                                </div>
                              </button>
                            </div>

                            <Button
                              type="button"
                              variant={isActive ? 'default' : 'outline'}
                              className="h-5 rounded-full"
                              onClick={() => setActiveServiceId(sid)}
                            >
                              {isActive ? 'Editando' : 'Asignar dientes'}
                            </Button>
                          </div>

                          {/* ✅ derecha: cantidad derivada + costo */}
                          <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:items-center sm:justify-end sm:gap-3">
                            <div className="w-full sm:w-[90px]">
                              <Input
                                readOnly
                                className="text-right font-mono font-medium rounded-full bg-muted text-foreground opacity-90"
                                value={qty ? String(qty) : '—'}
                                title="Cantidad = número de dientes seleccionados para este tratamiento"
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
                              {(() => {
                                const c = parseMoney(rawCost)
                                if (!Number.isFinite(c) || c <= 0) return null
                                const { subtotal, iva } = ivaBreakdown(c)
                                return (
                                  <div
                                    className="mt-1 pr-3 text-right text-[11px] leading-tight text-muted-foreground"
                                    title="El costo incluye IVA (16%)"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div>Sin IVA: {toMoney(subtotal)}</div>
                                    <div>IVA 16%: {toMoney(iva)}</div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="mt-5">
                  {mode !== 'edit' ? (
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
                  ) : null}

                  {error ? (
                    <div className="mt-2 text-xs text-destructive">
                      Error cargando servicios.
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 border-t pt-4 space-y-2">
                  {/* Desglose de IVA (16% incluido en el total) */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal (sin IVA)</span>
                    <span className="font-mono">{toMoney(ivaBreakdown(total).subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>IVA (16%)</span>
                    <span className="font-mono">{toMoney(ivaBreakdown(total).iva)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold">Total (IVA incluido):</div>
                    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
                      <ReceiptText className="h-5 w-5" />
                      <div className="text-lg font-mono font-semibold">{toMoney(total)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  onClick={onClose}
                >
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {mode !== 'edit' ? (
        <ServicesPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          selectedIds={selectedServiceIds}
          onChange={handlePickerChange}
        />
      ) : null}
    </>
  )
}
