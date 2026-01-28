'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'

import {
  Loader2,
  MessageSquareText,
  CreditCard,
  Paperclip,
  Pencil,
  RefreshCcw,
  X,
  History,
} from 'lucide-react'
import useTreatmentHistory from '../../lib/hooks/useTreatmentHistory'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const toDateTime = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const EVENT_UI = {
  note: {
    label: 'Comentario',
    action: 'Comentario agregado',
    Icon: MessageSquareText,
    badge: 'bg-muted text-foreground border',
  },
  cost_changed: {
    label: 'Costo',
    action: 'Costo cambiado',
    Icon: Pencil,
    badge: 'bg-amber-100 text-amber-950 border border-amber-200',
  },
  evidence_added: {
    label: 'Evidencia',
    action: 'Evidencia agregada',
    Icon: Paperclip,
    badge: 'bg-blue-100 text-blue-900 border border-blue-200',
  },
  evidence_deleted: {
    label: 'Evidencia',
    action: 'Evidencia eliminada',
    Icon: Paperclip,
    badge: 'bg-blue-100 text-blue-900 border border-blue-200',
  },
  document_added: {
    label: 'Documento',
    action: 'Documento agregado',
    Icon: Paperclip,
    badge: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
  },
  document_deleted: {
    label: 'Documento',
    action: 'Documento eliminado',
    Icon: Paperclip,
    badge: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
  },
  payment_created: {
    label: 'Pago',
    action: 'Pago registrado',
    Icon: CreditCard,
    badge: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  },
  payment_updated: {
    label: 'Pago',
    action: 'Pago actualizado',
    Icon: CreditCard,
    badge: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  },
  payment_deleted: {
    label: 'Pago',
    action: 'Pago eliminado',
    Icon: CreditCard,
    badge: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  },
}

const typeUI = (eventType) => {
  return EVENT_UI[eventType] || {
    label: 'Evento',
    action: 'Evento',
    Icon: MessageSquareText,
    badge: 'bg-muted text-foreground border',
  }
}

export default function TreatmentHistoryDrawer({
  open,
  onOpenChange,
  patientId,
  card,
  refreshKey = 0,
}) {
  const { items, loading, saving, error, refresh, createEvent } =
    useTreatmentHistory(patientId)

  // ✅ IDs base
  const singleServiceId = useMemo(() => {
    return Number(card?.treatment_id ?? card?.id) || null
  }, [card])

  // ✅ groupId aunque sea 1 solo tratamiento
  const groupId = useMemo(() => {
    return (
      Number(card?.group_id) ||
      Number(card?.items?.[0]?.group_id) ||
      null
    )
  }, [card])

  const isGroupContext = Boolean(groupId) // ✅ si existe group_id => siempre podemos traer por grupo

  // ✅ lista de tratamientos (para mapear nombre cuando event trae patient_service_id)
  const treatmentsInfo = useMemo(() => {
    if (!card) return []

    if (Array.isArray(card?.items) && card.items.length) {
      return card.items
        .map((t) => ({
          patient_service_id: Number(t?.treatment_id ?? t?.id),
          service_name: t?.service_name || 'Tratamiento',
        }))
        .filter((x) => x.patient_service_id)
    }

    // caso single
    return singleServiceId
      ? [
          {
            patient_service_id: singleServiceId,
            service_name: card?.service_name || 'Tratamiento',
          },
        ]
      : []
  }, [card, singleServiceId])

  // ✅ al abrir drawer: si hay groupId, SIEMPRE refresca por grupo (aunque sea 1)
  useEffect(() => {
    if (!open) return

    if (isGroupContext) {
      refresh({ patientServiceGroupId: groupId })
      return
    }

    if (singleServiceId) {
      refresh({ patientServiceId: singleServiceId })
    }
  }, [open, refreshKey, isGroupContext, groupId, singleServiceId, refresh])

  // ✅ target: '' => general | id => tratamiento específico (solo útil si hay 2+)
  const [target, setTarget] = useState('')
  const [note, setNote] = useState('')

  const title = isGroupContext
    ? `Historial de los tratamientos: ${card?.title || 'Tratamientos'}`
    : `Historial del tratamiento: ${card?.service_name || 'Tratamiento'}`

  // ✅ FILTRO CORRECTO:
  // - si hay groupId: muestra
  //   a) eventos generales del grupo (patient_service_group_id = groupId)
  //   b) eventos de cualquiera de los tratamientos del grupo (patient_service_id IN ids)
  // - si no hay groupId: filtra solo por treatmentId
  const filteredItems = useMemo(() => {
    if (!card) return []

    const list = items || []

    if (isGroupContext) {
      const ids = new Set(treatmentsInfo.map((t) => Number(t.patient_service_id)))
      return list.filter((ev) => {
        const evGid = ev?.patient_service_group_id
          ? Number(ev.patient_service_group_id)
          : null
        const evSid = ev?.patient_service_id ? Number(ev.patient_service_id) : null

        // ✅ general del grupo
        if (evGid && evGid === Number(groupId)) return true

        // ✅ evento ligado a un treatment del grupo
        if (evSid && ids.has(evSid)) return true

        return false
      })
    }

    if (!singleServiceId) return []
    return list.filter((ev) => Number(ev?.patient_service_id) === Number(singleServiceId))
  }, [items, card, isGroupContext, groupId, treatmentsInfo, singleServiceId])

  const handleAdd = async () => {
    const trimmed = note.trim()
    if (!trimmed) return

    const isGeneral = isGroupContext && !target

    const ok = await createEvent({
      event_type: 'note',
      message: trimmed,
      patient_service_id: target ? Number(target) : null,
      patient_service_group_id: isGeneral ? Number(groupId) : null,
      meta: null,
    })

    if (ok) setNote('')
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className={cx(
          'fixed inset-y-0 right-0 left-auto mt-0 h-screen w-[820px] max-w-[92vw]',
          'rounded-none border-l bg-background p-0'
        )}
      >
        <DrawerHeader className="border-b p-4">
          <DrawerTitle className="flex items-center gap-2">
            <History />
            {title}
          </DrawerTitle>

          <DrawerDescription>
            Registra notas de visita y visualiza eventos (pagos, evidencias, cambios de costo).
          </DrawerDescription>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">Eventos: {filteredItems?.length || 0}</Badge>
          </div>
        </DrawerHeader>

        <div className="flex h-[calc(100vh-120px)] flex-col">
          <div className="space-y-2 p-4">
            {/* ✅ Solo muestra selector si hay 2+ tratamientos */}
            {isGroupContext && treatmentsInfo.length > 1 ? (
              <div className="flex items-center gap-2">
                <label className="w-[110px] text-xs text-muted-foreground">
                  Asignar a:
                </label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  disabled={saving}
                >
                  <option value="">Anotación general</option>
                  {treatmentsInfo.map((t) => (
                    <option key={t.patient_service_id} value={t.patient_service_id}>
                      {t.service_name} (ID: {t.patient_service_id})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Escribe una nota de la visita (progreso, indicaciones, etc.)"
                disabled={saving}
              />
              <Button onClick={handleAdd} disabled={saving || !note.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                className="gap-2"
                onClick={() => {
                  if (isGroupContext) return refresh({ patientServiceGroupId: groupId })
                  if (singleServiceId) return refresh({ patientServiceId: singleServiceId })
                  refresh()
                }}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Actualizar
              </Button>

              <DrawerClose asChild>
                <Button variant="ghost" size="icon" aria-label="Cerrar">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>

          <Separator />

          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando historial…
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive" className="mb-3">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{String(error)}</AlertDescription>
              </Alert>
            ) : null}

            {!loading && !error && (filteredItems?.length || 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay eventos registrados.</p>
            ) : null}

            <div className="space-y-3">
              {(filteredItems || []).map((ev) => {
                const eventType = ev?.event_type || 'note'
                const ui = typeUI(eventType)
                const Icon = ui.Icon

                const sid = ev?.patient_service_id ? Number(ev.patient_service_id) : null

                const tName = sid
                  ? treatmentsInfo.find((t) => Number(t.patient_service_id) === sid)?.service_name
                  : null

                const isGeneral = !sid && ev?.patient_service_group_id

                return (
                  <div key={ev?.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{ui.label}</span>
                          <span className={cx('rounded-full px-2 py-0.5 text-xs', ui.badge)}>
                            {ui.action}
                          </span>
                        </div>

                        {tName ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Tratamiento:{' '}
                            <span className="font-medium text-foreground/80">{tName}</span>
                            {sid ? ` · ID: ${sid}` : null}
                          </p>
                        ) : isGeneral ? (
                          <p className="mt-1 text-xs text-muted-foreground">Paquete / General</p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">—</p>
                        )}
                      </div>

                      <div className="whitespace-nowrap text-xs text-muted-foreground">
                        {toDateTime(ev?.created_at)}
                      </div>
                    </div>

                    {ev?.message ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm">{ev.message}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <DrawerFooter className="border-t p-4">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cerrar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
