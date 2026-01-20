'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { PAYMENT_METHODS } from '../../lib/utils/paymentmethods'
import { formatDate } from '../../lib/utils/formatDate'
import { formatCurrency } from '../../lib/utils/formatCurrency'

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const cx = (...classes) => classes.filter(Boolean).join(' ')

function statusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'finalizado':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
    case 'abono':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
    case 'reembolsado':
      return 'bg-sky-100 text-sky-800 hover:bg-sky-100'
    case 'cancelado':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    default:
      return 'bg-slate-100 text-slate-800 hover:bg-slate-100'
  }
}

/** =========================
 *  PaymentDetailsDialog
 *  ========================= */
export function PaymentDetailsDialog({ open, onClose, payment, onDownload }) {
  if (!payment) return null

  const metodoLabel =
    PAYMENT_METHODS.find((m) => m.value === payment.metodo_pago)?.label ||
    payment.metodo_pago

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose?.()
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-primary">Detalles del Pago</DialogTitle>
            <Badge className={cx('uppercase', statusBadgeClass(payment.estado))}>
              {payment.estado?.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground font-semibold mb-1">
              Fecha
            </div>
            <div className="text-sm">{formatDate(payment.fecha)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-semibold mb-1">
              Monto
            </div>
            <div className="text-sm">{formatCurrency(payment.monto)} mxn</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-semibold mb-1">
              Tratamiento
            </div>
            <div className="text-sm">{payment.tratamiento}</div>
          </div>

          {payment.numero_factura ? (
            <div>
              <div className="text-xs text-muted-foreground font-semibold mb-1">
                Número de Factura
              </div>
              <div className="text-sm">{payment.numero_factura}</div>
            </div>
          ) : null}

          {payment.metodo_pago ? (
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground font-semibold mb-1">
                Método de Pago
              </div>
              <div className="text-sm">{metodoLabel}</div>
            </div>
          ) : null}

          {payment.notas ? (
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground font-semibold mb-1">
                Notas
              </div>
              <div className="text-sm whitespace-pre-wrap">{payment.notas}</div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onDownload}>
            Descargar
          </Button>
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** =========================
 *  PaymentFormDialog
 *  ========================= */
export function PaymentFormDialog({
  open,
  onClose,
  initialData,
  servicios = [],
  onSave,
  lockedServiceId,
  lockedServiceLabel,
  hideTreatmentSelect = false,
}) {
  const [form, setForm] = useState({
    id: initialData?.id || null,
    // seguimos guardando como YYYY-MM-DD
    fecha: initialData?.fecha ? initialData.fecha.split('T')[0] : '',
    patient_service_id: initialData?.patient_service_id || '',
    monto: initialData?.monto || '',
    estado: initialData?.estado || 'abono',
    metodo_pago: initialData?.metodo_pago || '',
    notas: initialData?.notas || '',
  })

  const [errors, setErrors] = useState({})
  const [calendarOpen, setCalendarOpen] = useState(false)

  // ✅ filtro rápido: mostrar solo pendientes/abono (oculta pagados/cancelados)
  const [onlyPending, setOnlyPending] = useState(true)

  // helper: Date -> YYYY-MM-DD
  const toYMD = (date) => {
    if (!date) return ''
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // helper: YYYY-MM-DD -> Date
  const fromYMD = (ymd) => {
    if (!ymd) return undefined
    const [y, m, d] = ymd.split('-').map(Number)
    if (!y || !m || !d) return undefined
    return new Date(y, m - 1, d)
  }

  // ✅ date state para Calendar
  const selectedDate = useMemo(() => fromYMD(form.fecha), [form.fecha])

  useEffect(() => {
    if (!open) return
    setErrors({})

    const fixedId = lockedServiceId ? String(lockedServiceId) : ''

    if (initialData) {
      setForm({
        id: initialData.id,
        fecha: initialData.fecha?.split('T')?.[0] || '',
        patient_service_id: fixedId || String(initialData.patient_service_id || ''),
        monto: initialData.monto ?? '',
        estado: initialData.estado || 'abono',
        metodo_pago: initialData.metodo_pago || '',
        notas: initialData.notas || '',
      })
    } else {
      setForm({
        id: null,
        fecha: '',
        patient_service_id: fixedId || '',
        monto: '',
        estado: 'abono',
        metodo_pago: '',
        notas: '',
      })
    }

    setCalendarOpen(false)
  }, [initialData, open, lockedServiceId])

  const validate = () => {
    const next = {}

    if (!form.fecha) next.fecha = 'La fecha es obligatoria.'

    if (!lockedServiceId && !form.patient_service_id) {
      next.patient_service_id = 'El tratamiento es obligatorio.'
    }

    if (form.monto === '' || Number(form.monto) <= 0) {
      next.monto = 'El monto debe ser mayor a 0.'
    }
    if (!form.estado) next.estado = 'El estatus es obligatorio.'
    if (!form.metodo_pago) next.metodo_pago = 'El método de pago es obligatorio.'
    if (!form.notas) next.notas = 'Las notas son obligatorias.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const isFormValid = useMemo(() => {
    return Boolean(
      form.fecha &&
        (lockedServiceId || form.patient_service_id) &&
        form.monto !== '' &&
        form.estado &&
        form.metodo_pago &&
        form.notas
    )
  }, [form, lockedServiceId])

  // ✅ orden + chips visuales
  const orderedServicios = useMemo(() => {
    const norm = (v) => (v == null ? '' : String(v))

    const estadoAuto = (s) => {
      const ev = (s?.estadoVisual || '').toLowerCase()
      if (ev) return ev

      // fallback si todavía no mandas estadoVisual desde el padre
      const saldo = Number(s?.saldoPendiente ?? s?.saldo_pendiente ?? 0)
      const pagado = Number(s?.totalPagado ?? s?.total_pagado ?? 0)
      const status = (s?.estado || s?.status || '').toLowerCase()

      if (status === 'cancelado') return 'cancelado'
      if (status === 'reembolsado') return 'reembolsado'
      if (saldo <= 0 && (pagado > 0 || Number(s?.totalCost ?? s?.total_cost ?? 0) > 0))
        return 'pagado'
      if (pagado > 0) return 'abono'
      return 'pendiente'
    }

    const rank = (s) => {
      switch (estadoAuto(s)) {
        case 'pendiente':
          return 1
        case 'abono':
          return 2
        case 'pagado':
          return 3
        case 'cancelado':
          return 4
        case 'reembolsado':
          return 5
        default:
          return 99
      }
    }

    const sorted = [...(servicios || [])].sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb

      const ta = a.lastPaymentAt ? new Date(a.lastPaymentAt).getTime() : 0
      const tb = b.lastPaymentAt ? new Date(b.lastPaymentAt).getTime() : 0
      if (tb !== ta) return tb - ta

      return norm(a.name).localeCompare(norm(b.name), 'es')
    })

    return sorted.map((s) => {
      const totalCost = Number(s.totalCost ?? s.total_cost ?? 0)
      const totalPagado = Number(s.totalPagado ?? s.total_pagado ?? 0)
      const saldoPendiente =
        s.saldoPendiente != null
          ? Number(s.saldoPendiente)
          : s.saldo_pendiente != null
          ? Number(s.saldo_pendiente)
          : totalCost - totalPagado

      const estado = estadoAuto({ ...s, totalCost, totalPagado, saldoPendiente })

      return { ...s, totalCost, totalPagado, saldoPendiente, __estado: estado }
    })
  }, [servicios])

  const visibleServicios = useMemo(() => {
    if (lockedServiceId || hideTreatmentSelect) return orderedServicios
    if (!onlyPending) return orderedServicios
    return orderedServicios.filter(
      (s) => s.__estado === 'pendiente' || s.__estado === 'abono'
    )
  }, [orderedServicios, onlyPending, lockedServiceId, hideTreatmentSelect])

  const servicioLabel = useMemo(() => {
    if (lockedServiceLabel) return lockedServiceLabel

    const s = orderedServicios.find(
      (x) => String(x.id) === String(form.patient_service_id)
    )
    return s ? `${s.name} — ${s.totalCost}` : ''
  }, [orderedServicios, form.patient_service_id, lockedServiceLabel])

  // helper mini para chips
  const tagInfo = (estado) => {
    const e = (estado || '').toLowerCase()
    if (e === 'pagado')
      return { text: 'PAGADO', cls: 'bg-emerald-100 text-emerald-800' }
    if (e === 'abono')
      return { text: 'ABONO', cls: 'bg-amber-100 text-amber-800' }
    if (e === 'pendiente')
      return { text: 'PENDIENTE', cls: 'bg-blue-100 text-blue-800' }
    if (e === 'cancelado')
      return { text: 'CANCELADO', cls: 'bg-slate-100 text-slate-800' }
    if (e === 'reembolsado')
      return { text: 'REEMBOLSADO', cls: 'bg-slate-100 text-slate-800' }
    return { text: (estado || '—').toUpperCase(), cls: 'bg-slate-100 text-slate-800' }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose?.()
      }}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-bold">
            {initialData ? 'Editar Pago' : 'Nuevo Pago'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* ✅ Fecha con Calendar */}
          <div className="space-y-1.5">
            <Label>Fecha</Label>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cx(
                    'w-full justify-start text-left font-normal',
                    !form.fecha && 'text-muted-foreground',
                    errors.fecha &&
                      'border-destructive focus-visible:ring-destructive'
                  )}
                >
                  {form.fecha ? form.fecha : 'Selecciona una fecha'}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    const ymd = toYMD(d)
                    setForm((s) => ({ ...s, fecha: ymd }))

                    setErrors((prev) => {
                      if (!prev.fecha) return prev
                      const copy = { ...prev }
                      delete copy.fecha
                      return copy
                    })

                    setCalendarOpen(false)
                  }}
                  className="rounded-md border shadow-sm"
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>

            {errors.fecha ? (
              <p className="text-xs text-destructive">{errors.fecha}</p>
            ) : null}
          </div>

          {/* ✅ Tratamiento */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Tratamiento</Label>

              {/* toggle (solo si hay select) */}
              {!(lockedServiceId || hideTreatmentSelect) ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                  onClick={() => setOnlyPending((v) => !v)}
                  title="Mostrar/ocultar tratamientos ya pagados"
                >
                  {onlyPending ? 'Ver todos' : 'Solo pendientes'}
                </button>
              ) : null}
            </div>

            {(lockedServiceId || hideTreatmentSelect) ? (
              <Input value={servicioLabel || '—'} disabled />
            ) : (
              <>
                <Select
                  value={String(form.patient_service_id || '')}
                  onValueChange={(v) => {
                    setForm((s) => ({ ...s, patient_service_id: v }))
                    setErrors((prev) => {
                      if (!prev.patient_service_id) return prev
                      const copy = { ...prev }
                      delete copy.patient_service_id
                      return copy
                    })
                  }}
                >
                  <SelectTrigger
                    className={
                      errors.patient_service_id
                        ? 'border-destructive focus:ring-destructive'
                        : ''
                    }
                  >
                    <SelectValue placeholder="Selecciona tratamiento" />
                  </SelectTrigger>

                  <SelectContent>
                    {visibleServicios.map((s) => {
                      const saldo = Number(s.saldoPendiente ?? 0)
                      const total = Number(s.totalCost ?? 0)
                      const pagado = Number(s.totalPagado ?? 0)
                      const { text, cls } = tagInfo(s.__estado)

                      // opcional: bloquear cancelado/reembolsado
                      const disabled =
                        s.__estado === 'cancelado' || s.__estado === 'reembolsado'

                      return (
                        <SelectItem
                          key={s.id}
                          value={String(s.id)}
                          disabled={disabled}
                        >
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="min-w-0">
                              <div className="truncate text-left">{s.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Total: {total} · Pagado: {pagado} · Saldo a pagar: {saldo}
                              </div>
                            </div>

                            <span
                              className={cx(
                                'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                                cls
                              )}
                            >
                              {text}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                {servicioLabel ? (
                  <div className="text-xs text-muted-foreground">
                    {servicioLabel}
                  </div>
                ) : null}

                {errors.patient_service_id ? (
                  <p className="text-xs text-destructive">
                    {errors.patient_service_id}
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* Monto */}
          <div className="grid gap-2">
            <Label>Monto mxn</Label>
            <Input
              type="number"
              value={form.monto}
              onChange={(e) => {
                setForm((s) => ({ ...s, monto: e.target.value }))
                setErrors((prev) => {
                  if (!prev.monto) return prev
                  const copy = { ...prev }
                  delete copy.monto
                  return copy
                })
              }}
              className={
                errors.monto
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />
            {errors.monto ? (
              <p className="text-xs text-destructive">{errors.monto}</p>
            ) : null}
          </div>

          {/* Estatus */}
          <div className="grid gap-2">
            <Label>Estatus de pago</Label>
            <Select
              value={form.estado}
              onValueChange={(v) => {
                setForm((s) => ({ ...s, estado: v }))
                setErrors((prev) => {
                  if (!prev.estado) return prev
                  const copy = { ...prev }
                  delete copy.estado
                  return copy
                })
              }}
            >
              <SelectTrigger
                className={
                  errors.estado
                    ? 'border-destructive focus:ring-destructive'
                    : ''
                }
              >
                <SelectValue placeholder="Selecciona estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="abono">Abono</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="reembolsado">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado ? (
              <p className="text-xs text-destructive">{errors.estado}</p>
            ) : null}
          </div>

          {/* Método */}
          <div className="grid gap-2">
            <Label>Método de Pago</Label>
            <Select
              value={form.metodo_pago}
              onValueChange={(v) => {
                setForm((s) => ({ ...s, metodo_pago: v }))
                setErrors((prev) => {
                  if (!prev.metodo_pago) return prev
                  const copy = { ...prev }
                  delete copy.metodo_pago
                  return copy
                })
              }}
            >
              <SelectTrigger
                className={
                  errors.metodo_pago
                    ? 'border-destructive focus:ring-destructive'
                    : ''
                }
              >
                <SelectValue placeholder="Selecciona método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta_credito">Tarjeta de crédito</SelectItem>
                <SelectItem value="tarjeta_debito">Tarjeta de débito</SelectItem>
                <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
              </SelectContent>
            </Select>
            {errors.metodo_pago ? (
              <p className="text-xs text-destructive">{errors.metodo_pago}</p>
            ) : null}
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <Label>Notas</Label>
            <Textarea
              rows={3}
              value={form.notas}
              onChange={(e) => {
                setForm((s) => ({ ...s, notas: e.target.value }))
                setErrors((prev) => {
                  if (!prev.notas) return prev
                  const copy = { ...prev }
                  delete copy.notas
                  return copy
                })
              }}
              className={
                errors.notas
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
              placeholder="Notas…"
            />
            {errors.notas ? (
              <p className="text-xs text-destructive">{errors.notas}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={!isFormValid}
            onClick={async () => {
              const ok = validate()
              if (!ok) return

              const payload = {
                ...form,
                patient_service_id: String(
                  lockedServiceId || form.patient_service_id
                ),
              }

              await onSave?.(payload)
              onClose?.()
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


/** =========================
 *  ConfirmDeleteDialog
 *  ========================= */
export function ConfirmDeleteDialog({ open, onClose, onConfirm }) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose?.()
      }}
    >
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-bold">
            Confirmar eliminación
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="text-sm text-muted-foreground">
          ¿Estás seguro de eliminar este pago?
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onConfirm?.()}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
