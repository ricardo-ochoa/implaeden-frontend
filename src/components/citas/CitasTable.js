'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

// shadcn/ui
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// mini helper
const cx = (...classes) => classes.filter(Boolean).join(' ')

// Hook simple para responsive (reemplazo de useMediaQuery)
function useIsMobile(maxWidth = 640) {
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

export default function CitasTable({ citas = [], formatearFechaHora, onEdit, onDelete }) {
  const isMobile = useIsMobile(640) // "sm"

  const sorted = useMemo(() => {
    return [...(citas || [])].sort(
      (a, b) => new Date(b.appointment_at) - new Date(a.appointment_at)
    )
  }, [citas])

  if (!sorted.length) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground">No hay citas registradas aún</p>
      </div>
    )
  }

  // Variante móvil: tarjetas
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {sorted.map((cita, idx) => {
          const numero = sorted.length - idx

          return (
            <Card key={cita.id} className="border">
              <CardContent className="p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">N.º:</span> {numero}
                </div>

                <div className="text-sm">
                  <span className="font-semibold">Fecha y Hora:</span>{' '}
                  {formatearFechaHora?.(cita.appointment_at)}
                </div>

                <div className="text-sm">
                  <span className="font-semibold">Tratamiento:</span>{' '}
                  {cita?.tratamiento || '—'}
                </div>

                <div className="text-sm">
                  <span className="font-semibold">Observaciones:</span>{' '}
                  {cita?.observaciones || '—'}
                </div>

                {/* <div className="text-xs text-muted-foreground">
                  <span className="font-semibold">Registrado:</span>{' '}
                  {formatearFechaHora?.(cita.created_at)}
                </div> */}

                <div className="pt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(cita)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete?.(cita.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Variante escritorio: tabla
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {['N.º', 'Fecha y Hora', 'Tratamiento', 'Observaciones', 'Acciones'].map((h) => (
              <TableHead key={h} className="font-bold">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {sorted.map((cita, idx) => {
            const numero = sorted.length - idx

            return (
              <TableRow key={cita.id}>
                <TableCell className="font-medium">{numero}</TableCell>

                <TableCell>{formatearFechaHora?.(cita.appointment_at)}</TableCell>

                <TableCell>{cita?.tratamiento || '—'}</TableCell>

                <TableCell className="max-w-[220px] truncate">
                  {cita?.observaciones || '—'}
                </TableCell>

                <TableCell>{formatearFechaHora?.(cita.created_at)}</TableCell>

                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(cita)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete?.(cita.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
