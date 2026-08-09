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

const cx = (...classes) => classes.filter(Boolean).join(' ')

// Estados -> etiqueta + clases (Tailwind). Ajusta a tu design system si quieres.
const STATUS = {
  scheduled: { label: 'Programada', cls: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmada', cls: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Completada', cls: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelada', cls: 'bg-red-100 text-red-800' },
  no_show:   { label: 'No asistió', cls: 'bg-amber-100 text-amber-800' },
}
const Badge = ({ cls, children }) => (
  <span className={cx('inline-block rounded-full px-2 py-0.5 text-xs font-medium', cls)}>{children}</span>
)
const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.scheduled
  return <Badge cls={s.cls}>{s.label}</Badge>
}
const SOURCE = {
  'clinic-app': { label: 'App', cls: 'bg-indigo-100 text-indigo-800' },
  confirmafy:   { label: 'Confirmafy', cls: 'bg-teal-100 text-teal-800' },
  manual:       { label: 'Manual', cls: 'bg-slate-100 text-slate-700' },
}
const SourceBadge = ({ source }) => {
  const s = SOURCE[source] || SOURCE.manual
  return <Badge cls={s.cls}>{s.label}</Badge>
}

function useIsMobile(maxWidth = 640) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(`(max-width: ${maxWidth - 1}px)`)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange)
    return () => (mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange))
  }, [maxWidth])
  return isMobile
}

/**
 * Tabla de citas (respaldadas por Google Calendar).
 * Nueva forma: { eventId, start, treatment, status, source, observations }.
 * Las acciones (editar/eliminar) solo aparecen si se pasan onEdit/onDelete (Fase 2).
 */
export default function CitasTable({ citas = [], formatearFechaHora, onEdit, onDelete, onRowClick }) {
  const isMobile = useIsMobile(640)
  const hasActions = Boolean(onEdit || onDelete)

  // Respeta el orden que llega del padre (próximas asc / anteriores desc).
  const sorted = useMemo(() => (Array.isArray(citas) ? citas : []), [citas])

  if (!sorted.length) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground">No hay citas registradas aún</p>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {sorted.map((cita, idx) => (
          <Card key={cita.eventId} onClick={() => onRowClick?.(cita)} className={cx("border", onRowClick && "cursor-pointer hover:bg-muted/40")}>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm"><span className="font-semibold">N.º:</span> {idx + 1}</div>
              <div className="text-sm"><span className="font-semibold">Fecha y Hora:</span> {formatearFechaHora?.(cita.start)}</div>
              <div className="text-sm"><span className="font-semibold">Tratamiento:</span> {cita?.treatment || '—'}</div>
              <div className="text-sm flex items-center gap-2"><span className="font-semibold">Estado:</span> <StatusBadge status={cita.status} /></div>
              <div className="text-sm flex items-center gap-2"><span className="font-semibold">Origen:</span> <SourceBadge source={cita.source} /></div>
              <div className="text-sm"><span className="font-semibold">Observaciones:</span> {cita?.observations || '—'}</div>
              {hasActions && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {onEdit && <Button type="button" variant="outline" size="sm" onClick={() => onEdit(cita)}><Pencil className="h-4 w-4 mr-2" />Editar</Button>}
                  {onDelete && <Button type="button" variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => onDelete(cita.eventId)}><Trash2 className="h-4 w-4 mr-2" />Eliminar</Button>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const headers = ['N.º', 'Fecha y Hora', 'Tratamiento', 'Estado', 'Origen', 'Observaciones']
  if (hasActions) headers.push('Acciones')

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => <TableHead key={h} className="font-bold">{h}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((cita, idx) => (
            <TableRow key={cita.eventId} onClick={() => onRowClick?.(cita)} className={onRowClick ? "cursor-pointer hover:bg-muted/40" : undefined}>
              <TableCell className="font-medium">{idx + 1}</TableCell>
              <TableCell>{formatearFechaHora?.(cita.start)}</TableCell>
              <TableCell>{cita?.treatment || '—'}</TableCell>
              <TableCell><StatusBadge status={cita.status} /></TableCell>
              <TableCell><SourceBadge source={cita.source} /></TableCell>
              <TableCell className="max-w-[220px] truncate">{cita?.observations || '—'}</TableCell>
              {hasActions && (
                <TableCell>
                  <div className="flex gap-2">
                    {onEdit && <Button type="button" variant="outline" size="sm" onClick={() => onEdit(cita)}><Pencil className="h-4 w-4 mr-2" />Editar</Button>}
                    {onDelete && <Button type="button" variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => onDelete(cita.eventId)}><Trash2 className="h-4 w-4 mr-2" />Eliminar</Button>}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
