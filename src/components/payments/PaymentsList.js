'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '../../../lib/utils/formatCurrency'

// shadcn/ui
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// lucide icons (recomendado con shadcn)
import {
  CalendarDays,
  DollarSign,
  Eye,
  Download,
  Mail,
  Pencil,
  Trash2,
} from 'lucide-react'

// helper classnames mini
const cx = (...classes) => classes.filter(Boolean).join(' ')

// Hook simple para responsive (reemplazo de MUI useMediaQuery)
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

// Badge variants (ajusta según tu theme)
// OJO: tu getStatusColor devuelve success/warning/error/default.
// Aquí mapeamos a clases.
const statusBadgeClass = (statusKey) => {
  switch ((statusKey || '').toLowerCase()) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
    case 'warning':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
    case 'error':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    default:
      return 'bg-slate-100 text-slate-800 hover:bg-slate-100'
  }
}

// --- Sub-componente para la tarjeta individual (mobile) ---
function PaymentCard({
  payment,
  paciente,
  formatDate,
  getStatusColor,
  onView,
  onDownload,
  onEmail,
  onEdit,
  onDelete,
}) {
  const statusKey = getStatusColor(payment.estado)

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        {/* Fecha + Estatus */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span className="text-foreground">{formatDate(payment.fecha)}</span>
          </div>

          <Badge className={cx('uppercase', statusBadgeClass(statusKey))}>
            {payment.estado?.toUpperCase()}
          </Badge>
        </div>

        {/* Montos */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <div>
            Costo: <span className="font-semibold">{formatCurrency(payment?.total_cost)}</span>
          </div>
          <div>
            Monto: <span className="font-semibold">{formatCurrency(payment?.monto)}</span>
          </div>
        </div>
      </CardContent>

      {/* Acciones */}
      <CardFooter className="px-3 py-2 bg-muted/30 flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => onView(payment)} aria-label="Ver">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDownload(payment)} aria-label="Descargar">
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEmail(payment)}
          disabled={!paciente?.email}
          aria-label="Enviar por email"
          title={!paciente?.email ? 'El paciente no tiene email' : 'Enviar por email'}
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(payment)} aria-label="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(payment)} aria-label="Eliminar">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function PaymentsList(props) {
  const { data = [] } = props
  const isMobile = useIsMobile(768)

  const groupedPayments = useMemo(() => {
    return (data || []).reduce((acc, pago) => {
      const tratamiento = pago.tratamiento || 'Sin Tratamiento'
      if (!acc[tratamiento]) acc[tratamiento] = []
      acc[tratamiento].push(pago)
      return acc
    }, {})
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No se encontraron pagos.
      </div>
    )
  }

  // VISTA MÓVIL (TARJETAS)
  if (isMobile) {
    return (
      <div>
        {Object.entries(groupedPayments).map(([tratamiento, pagos]) => (
          <div key={tratamiento} className="mb-6">
            <div className="mb-3 pb-2 border-b">
              <div className="font-semibold text-primary">{tratamiento}</div>
            </div>

            {pagos.map((p) => (
              <PaymentCard key={p.id} payment={p} {...props} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  // VISTA ESCRITORIO (TABLA)
  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tratamiento</TableHead>
            <TableHead className="text-right">Costo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Object.entries(groupedPayments).map(([tratamiento, pagos]) => (
            <React.Fragment key={tratamiento}>
              <TableRow className="bg-muted/40">
                <TableCell colSpan={6} className="font-semibold text-primary">
                  {tratamiento}
                </TableCell>
              </TableRow>

              {pagos.map((p) => {
                const statusKey = props.getStatusColor(p.estado)

                return (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>{props.formatDate(p.fecha)}</span>
                      </div>
                    </TableCell>

                    <TableCell>{p.tratamiento}</TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(p?.total_cost)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(p?.monto)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <Badge className={cx('uppercase', statusBadgeClass(statusKey))}>
                        {p.estado?.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => props.onView(p)} aria-label="Ver">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => props.onDownload(p)} aria-label="Descargar">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => props.onEmail(p)}
                          disabled={!props?.paciente?.email}
                          aria-label="Enviar por email"
                          title={!props?.paciente?.email ? 'El paciente no tiene email' : 'Enviar por email'}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => props.onEdit(p)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => props.onDelete(p)} aria-label="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
