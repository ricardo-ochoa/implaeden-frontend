'use client'

import React, { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Loader2, Plus } from 'lucide-react'
import { usePayments } from '../../lib/hooks/usePayments'
import { PaymentFormDialog } from '@/components/paymentDialogs'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const toMoney = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(n || 0))

const toDate = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export default function TreatmentPaymentsModal({
  open,
  onOpenChange,
  patientId,
  card,
}) {
  const {
    payments,
    loading,
    error,
    createPayment,
  } = usePayments(patientId)

  // ✅ modal para agregar pago desde un tratamiento específico
  const [addOpen, setAddOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [saving, setSaving] = useState(false)

  // treatments a mostrar según si es group o single
  const treatmentsInfo = useMemo(() => {
    if (!card) return []

    if (card?.isGroup) {
      const items = Array.isArray(card?.items) ? card.items : []
      return items
        .map((t) => ({
          treatment_id: Number(t?.treatment_id), // ✅ patient_services.id
          service_name: t?.service_name || 'Tratamiento',
          service_date: t?.service_date || null,
          total_cost: Number(t?.total_cost ?? 0),
        }))
        .filter((x) => x.treatment_id)
    }

    return [
      {
        treatment_id: Number(card?.treatment_id),
        service_name: card?.service_name || 'Tratamiento',
        service_date: card?.service_date || null,
        total_cost: Number(card?.total_cost ?? 0),
      },
    ].filter((x) => x.treatment_id)
  }, [card])

  const treatmentIdSet = useMemo(() => {
    return new Set(treatmentsInfo.map((t) => Number(t.treatment_id)).filter(Boolean))
  }, [treatmentsInfo])

  // ✅ filtra pagos solo para este tratamiento / grupo
  const filteredPayments = useMemo(() => {
    if (!treatmentIdSet.size) return []
    return (payments || []).filter((p) =>
      treatmentIdSet.has(Number(p.patient_service_id))
    )
  }, [payments, treatmentIdSet])

  // agrupa pagos por tratamiento
  const paymentsByTreatment = useMemo(() => {
    const m = new Map()
    for (const p of filteredPayments) {
      const tid = Number(p.patient_service_id)
      if (!tid) continue
      if (!m.has(tid)) m.set(tid, [])
      m.get(tid).push(p)
    }
    // orden por fecha desc
    for (const [tid, arr] of m.entries()) {
      arr.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      m.set(tid, arr)
    }
    return m
  }, [filteredPayments])

  // totales del modal
  const totals = useMemo(() => {
    const totalCost = treatmentsInfo.reduce(
      (acc, t) => acc + Number(t.total_cost || 0),
      0
    )
    const paid = filteredPayments.reduce(
      (acc, p) => acc + Number(p.monto || 0),
      0
    )
    const remaining = totalCost - paid
    return { totalCost, paid, remaining }
  }, [treatmentsInfo, filteredPayments])

  const title = card?.isGroup
    ? `Pagos del paquete: ${card?.title || 'Tratamientos'}`
    : `Pagos del tratamiento: ${card?.service_name || 'Tratamiento'}`

  // ✅ opciones "servicios" (solo por si quieres reutilizar dialog en modo normal)
  const serviciosForDialog = useMemo(() => {
    return treatmentsInfo.map((t) => ({
      id: Number(t.treatment_id),
      name: t.service_name,
      totalCost: toMoney(t.total_cost),
    }))
  }, [treatmentsInfo])

  const openAddPayment = (t, costResolved) => {
    setSelectedTreatment({
      treatment_id: Number(t.treatment_id),
      service_name: t.service_name,
      total_cost: Number(costResolved ?? t.total_cost ?? 0),
    })
    setAddOpen(true)
  }

  const closeAddPayment = () => {
    setAddOpen(false)
    setSelectedTreatment(null)
  }

  const handleSavePayment = async (form) => {
    try {
      setSaving(true)

      // ✅ tu backend ya usa /pacientes/:id/pagos
      // ✅ mandamos patient_service_id fijo
      const payload = {
        fecha: form.fecha, // YYYY-MM-DD
        patient_service_id: Number(form.patient_service_id),
        monto: Number(form.monto),
        estado: form.estado,
        metodo_pago: form.metodo_pago,
        notas: form.notas,
        // numero_factura: form.numero_factura ?? null, // si lo agregas en el form
      }

      await createPayment(payload) // ✅ hace POST y refetch interno
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Totales */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outlined">
                Costo total: {toMoney(totals.totalCost)}
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-transparent">
                Pagado: {toMoney(totals.paid)}
              </Badge>
              <Badge
                className={cx(
                  'border',
                  'hover:bg-transparent',
                  totals.remaining > 0
                    ? 'bg-amber-100 text-amber-950 border-amber-200 hover:bg-transparent'
                    : 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-transparent'
                )}
              >
                Restante total: {toMoney(totals.remaining)}
              </Badge>
            </div>
            <Separator />

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando pagos…
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{String(error)}</AlertDescription>
              </Alert>
            ) : null}

            {!loading && !error ? (
              <div className="max-h-[60vh] overflow-auto space-y-3 pr-1">
                {treatmentsInfo.map((t) => {
                  const tid = Number(t.treatment_id)
                  const list = paymentsByTreatment.get(tid) || []

                  // total pagado por tratamiento (sum)
                  const paid = list.reduce(
                    (acc, p) => acc + Number(p.monto || 0),
                    0
                  )

                  // costo (usa el del tratamiento; si viene 0, intenta tomarlo del primer pago)
                  const cost =
                    Number(t.total_cost || 0) ||
                    Number(list?.[0]?.total_cost || 0)

                  const remaining = cost - paid

                  return (
                    <details
                      key={tid}
                      className="rounded-lg border bg-background"
                      open={treatmentsInfo.length === 1}
                    >
                      <summary className="cursor-pointer list-none p-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {t.service_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Fecha: {toDate(t.service_date)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outlined hover:bg-transparent">
                              Costo: {toMoney(cost)}
                            </Badge>
                            <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-transparent">
                              Pagado: {toMoney(paid)}
                            </Badge>
                            <Badge
                              className={cx(
                                'border',
                                remaining > 0
                                  ? 'bg-amber-100 text-amber-950 border-amber-200 hover:bg-transparent'
                                  : 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-transparent'
                              )}
                            >
                              Restante: {toMoney(remaining)}
                            </Badge>
                          </div>
                        </div>
                      </summary>

                      <div className="px-3 pb-3 space-y-3">
                        {list.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Sin pagos registrados.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="text-muted-foreground">
                                <tr className="border-b">
                                  <th className="py-2 text-left font-medium">Fecha</th>
                                  <th className="py-2 text-left font-medium">Método</th>
                                  <th className="py-2 text-left font-medium">Factura</th>
                                  <th className="py-2 text-right font-medium">Monto</th>
                                </tr>
                              </thead>

                              <tbody>
                                {list.map((p, idx) => {
                                  const isLast = idx === list.length - 1

                                  return (
                                    <React.Fragment key={p.id}>
                                      {/* Row principal */}
                                      <tr>
                                        <td className="py-2">{toDate(p.fecha)}</td>
                                        <td className="py-2">{p.metodo_pago || '—'}</td>
                                        <td className="py-2">{p.numero_factura || '—'}</td>
                                        <td className="py-2 text-right">{toMoney(p.monto)}</td>
                                      </tr>

                                      {/* Row de nota debajo */}
                                      {p.notas ? (
                                        <tr className={isLast ? '' : 'border-b'}>
                                          <td colSpan={4} className="pb-3">
                                            <div className="text-xs text-muted-foreground">
                                              <span className="font-medium text-foreground/80">Nota:</span>{' '}
                                              <span className="whitespace-pre-wrap">{p.notas}</span>
                                            </div>
                                          </td>
                                        </tr>
                                      ) : null}
                                    </React.Fragment>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* ✅ Botón por tratamiento */}
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => openAddPayment(t, cost)}
                          >
                            <Plus className="h-4 w-4" />
                            Agregar pago
                          </Button>
                        </div>
                      </div>
                    </details>
                  )
                })}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Modal para agregar pago “atado” al tratamiento seleccionado */}
      <PaymentFormDialog
        open={addOpen}
        onClose={closeAddPayment}
        initialData={null}
        servicios={serviciosForDialog}
        lockedServiceId={selectedTreatment?.treatment_id}
        lockedServiceLabel={
          selectedTreatment
            ? `${selectedTreatment.service_name} — ${toMoney(
                selectedTreatment.total_cost
              )}`
            : ''
        }
        hideTreatmentSelect
        onSave={async (form) => {
          await handleSavePayment(form)
          closeAddPayment()
        }}
      />

      {/* opcional: bloquea UI mientras guarda */}
      {saving ? (
        <div className="fixed inset-0 z-[999] grid place-items-center bg-black/10">
          <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm shadow">
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando pago…
          </div>
        </div>
      ) : null}
    </>
  )
}
