'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '../../../../../lib/api'
import { usePayments } from '../../../../../lib/hooks/usePayments'
import { useGeneratePaymentPDF } from '../../../../../lib/hooks/useGeneratePaymentPDF'
import {
  PaymentDetailsDialog,
  PaymentFormDialog,
  ConfirmDeleteDialog,
} from '@/components/paymentDialogs'
import { formatDate } from '../../../../../lib/utils/formatDate'
import PaymentsList from '@/components/payments/PaymentsList'

// shadcn/ui
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

// mini helper (para no depender de cn si no lo tienes)
const cx = (...classes) => classes.filter(Boolean).join(' ')

// Hook simple para responsive (reemplazo de useMediaQuery)
function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia(`(max-width: ${maxWidth - 1}px)`)
    const onChange = () => setIsMobile(mq.matches)
    onChange()

    if (mq.addEventListener) {
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    } else {
      mq.addListener(onChange)
      return () => mq.removeListener(onChange)
    }
  }, [maxWidth])

  return isMobile
}

export default function PatientPaymentsClient({
  paciente,
  initialPayments,
  initialServicios,
}) {
  const { id: pacienteId } = useParams()
  const router = useRouter()
  const generatePDF = useGeneratePaymentPDF()

  const [localPayments, setLocalPayments] = useState(initialPayments || [])
  const isMobile = useIsMobile(768)

  const getStatusColor = (st) => {
    switch ((st || '').toLowerCase()) {
      case 'finalizado':
        return 'success'
      case 'abono':
        return 'warning'
      case 'cancelado':
        return 'error'
      case 'reembolsado':
        return 'default'
      default:
        return 'default'
    }
  }

  // Hook pagos
  const {
    payments,
    loading: pagosLoading,
    error: pagosError,
    createPayment,
    updatePayment,
    deletePayment,
    refresh: fetchPayments,
  } = usePayments(pacienteId)

  useEffect(() => {
    if (!pagosLoading) setLocalPayments(payments || [])
  }, [payments, pagosLoading])

  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editPayment, setEditPayment] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)

  // “Snackbar” reemplazo con Alert flotante
  const [emailAlert, setEmailAlert] = useState({
    open: false,
    success: true,
    message: '',
  })

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  // ✅ Control de apertura de Selects (Radix)
  const [statusOpen, setStatusOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [rowsOpen, setRowsOpen] = useState(false)

  const closeAllSelects = () => {
    setStatusOpen(false)
    setDateOpen(false)
    setRowsOpen(false)
  }

  // ✅ Abrir modales sin choque de portales
  const openCreateSafely = () => {
    closeAllSelects()
    setTimeout(() => setOpenCreateModal(true), 0)
  }

  const openEditSafely = (payment) => {
    closeAllSelects()
    setEditPayment(payment)
    setTimeout(() => setOpenEditModal(true), 0)
  }

  useEffect(() => {
    if (!emailAlert.open) return
    const t = setTimeout(() => {
      setEmailAlert((s) => ({ ...s, open: false }))
    }, 4000)
    return () => clearTimeout(t)
  }, [emailAlert.open])

  // Handlers
  const handleCreate = async (data) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await createPayment(data)
      await fetchPayments()
      setOpenCreateModal(false)
    } catch {
      setActionError('No se pudo crear el pago')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await updatePayment(data)
      await fetchPayments()
      setOpenEditModal(false)
    } catch {
      setActionError('No se pudo actualizar el pago')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPayment) return
    setActionLoading(true)
    setActionError(null)
    try {
      await deletePayment(selectedPayment.id)
      await fetchPayments()
      setConfirmDeleteOpen(false)
      setDetailsOpen(false)
    } catch {
      setActionError('No se pudo eliminar el pago')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendEmail = async (payment) => {
    if (!paciente?.email) return

    setActionLoading(true)
    setEmailAlert({ open: true, success: true, message: 'Enviando…' })

    try {
      const pdf = await generatePDF(payment, paciente, true)
      const fd = new FormData()
      fd.append('pdf', pdf, `Factura_${payment.numero_factura}.pdf`)
      fd.append('to', paciente.email)

      const res = await api.post('/email/enviar-factura', fd)
      const ok = res.status === 200
      setEmailAlert({
        open: true,
        success: ok,
        message: ok ? 'Enviado' : 'Falló',
      })
    } catch {
      setEmailAlert({ open: true, success: false, message: 'Error al enviar' })
    } finally {
      setActionLoading(false)
    }
  }

  // Filtrado y paginación
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return (localPayments || []).filter((p) => {
      const tratamiento = (p.tratamiento || '').toLowerCase()
      const factura = (p.numero_factura || '').toLowerCase()

      const matchesSearch =
        !term || tratamiento.includes(term) || factura.includes(term)

      const matchesStatus =
        statusFilter === 'all' || p.estado === statusFilter

      let matchesDate = true
      if (dateFilter === 'month') {
        const mAgo = new Date()
        mAgo.setMonth(mAgo.getMonth() - 1)
        matchesDate = new Date(p.fecha) >= mAgo
      }
      if (dateFilter === 'year') {
        const yAgo = new Date()
        yAgo.setFullYear(yAgo.getFullYear() - 1)
        matchesDate = new Date(p.fecha) >= yAgo
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [localPayments, searchTerm, statusFilter, dateFilter])

  useEffect(() => {
    setPage(0)
  }, [searchTerm, statusFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const safePage = Math.min(page, totalPages - 1)

  useEffect(() => {
    if (safePage !== page) setPage(safePage)
  }, [safePage, page])

  const paginated = useMemo(() => {
    const start = safePage * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, safePage, rowsPerPage])

  return (
    <div className="relative">
      <Card className="mb-6">
        <CardContent className="p-4">
          {/* Buscador & Nuevo */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="m21 21-4.35-4.35"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <Input
                  className="pl-8 w-[260px]"
                  placeholder="Buscar por tratamiento"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                type="button"
                variant={showFilters ? 'default' : 'outline'}
                size="icon"
                onClick={() => setShowFilters((f) => !f)}
                aria-label="Mostrar filtros"
                title="Filtros"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h16M7 12h10M10 18h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Button>

              <span className="text-sm text-muted-foreground">
                {filtered.length} resultados
              </span>
            </div>

            {/* ✅ aquí el fix */}
            <Button className={cx(isMobile && 'w-full')} onClick={openCreateSafely}>
              Nuevo Pago
            </Button>
          </div>

          {/* Filtros (no desmonta el árbol) */}
          <div className={showFilters ? 'block' : 'hidden'}>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="w-full sm:w-[220px]">
                <label className="block text-xs text-muted-foreground mb-1">
                  Estatus de pago
                </label>

                <Select
                  open={statusOpen}
                  onOpenChange={setStatusOpen}
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="finalizado">Pagado</SelectItem>
                    <SelectItem value="reembolsado">Reembolsado</SelectItem>
                    <SelectItem value="abono">Abono</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-[220px]">
                <label className="block text-xs text-muted-foreground mb-1">
                  Periodo
                </label>

                <Select
                  open={dateOpen}
                  onOpenChange={setDateOpen}
                  value={dateFilter}
                  onValueChange={(v) => setDateFilter(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo</SelectItem>
                    <SelectItem value="month">Último mes</SelectItem>
                    <SelectItem value="year">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Lista de pagos */}
          <PaymentsList
            data={paginated}
            paciente={paciente}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            onView={(p) => {
              closeAllSelects()
              setSelectedPayment(p)
              setTimeout(() => setDetailsOpen(true), 0)
            }}
            onDownload={(p) => generatePDF(p, paciente)}
            onEmail={(p) => handleSendEmail(p)}
            onEdit={(p) => openEditSafely(p)}
            onDelete={(p) => {
              closeAllSelects()
              setSelectedPayment(p)
              setTimeout(() => setConfirmDeleteOpen(true), 0)
            }}
          />

          {/* Paginación */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              Página {safePage + 1} de {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filas:</span>
              <div className="w-[90px]">
                <Select
                  open={rowsOpen}
                  onOpenChange={setRowsOpen}
                  value={String(rowsPerPage)}
                  onValueChange={(v) => {
                    setRowsPerPage(Number(v))
                    setPage(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>

          {/* Errores de acción */}
          {actionError ? (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Alert flotante tipo Snackbar (email) */}
      {emailAlert.open ? (
        <div className="fixed bottom-6 right-6 z-50 w-[280px]">
          <Alert
            className={cx(
              'shadow-lg',
              emailAlert.success
                ? 'border-emerald-500/40'
                : 'border-destructive/40'
            )}
            variant={emailAlert.success ? 'default' : 'destructive'}
          >
            <AlertTitle>{emailAlert.success ? 'OK' : 'Error'}</AlertTitle>
            <AlertDescription>{emailAlert.message}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* Dialogs (siguen igual; si siguen dando conflicto, toca migrarlos a shadcn Dialog) */}
      <PaymentDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        payment={selectedPayment}
        onDownload={() => generatePDF(selectedPayment, paciente)}
      />

      <PaymentFormDialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        initialData={null}
        servicios={initialServicios}
        onSave={handleCreate}
      />

      <PaymentFormDialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        initialData={editPayment}
        servicios={initialServicios}
        onSave={handleUpdate}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
