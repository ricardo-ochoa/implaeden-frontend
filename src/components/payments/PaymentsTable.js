// src/components/payments/PaymentsTable.jsx
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material'
import {
  CalendarToday as CalendarTodayIcon,
  AttachMoney    as AttachMoneyIcon,
  Visibility     as VisibilityIcon,
  Download       as DownloadIcon,
  Email          as EmailIcon,
  Edit           as EditIcon,
  Delete         as DeleteIcon,
} from '@mui/icons-material'
import { formatCurrency } from '../../../lib/utils/formatCurrency'

export default function PaymentsTable({
  data = [],                // array de pagos paginados
  paciente = {},            // para chequear paciente.email
  formatDate,               // función para dar formato a la fecha
  getStatusColor,           // función para color de estatus
  onView,                   // callback al ver detalles
  onDownload,               // callback al descargar PDF
  onEmail,                  // callback al enviar por email
  onEdit,                   // callback al editar
  onDelete,                 // callback al eliminar
}) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Tratamiento</TableCell>
            <TableCell align="right">Costo</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell>Estatus</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(p => (
            <TableRow key={p.id} hover>
              <TableCell>
                <CalendarTodayIcon fontSize="small" />{' '}
                {formatDate(p.fecha)}
              </TableCell>
              <TableCell>{p.tratamiento}</TableCell>
              <TableCell align="right">
                <AttachMoneyIcon fontSize="small" />{' '}
                {formatCurrency(p?.total_cost)}
              </TableCell>
              <TableCell align="right">
                <AttachMoneyIcon fontSize="small" />{' '}
                {formatCurrency(p?.monto)}
              </TableCell>
              <TableCell>
                <Chip
                  label={p.estado?.toUpperCase()}
                  color={getStatusColor(p.estado)}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onView(p)}>
                  <VisibilityIcon />
                </IconButton>
                <IconButton onClick={() => onDownload(p)}>
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  onClick={() => onEmail(p)}
                  disabled={!paciente.email}
                >
                  <EmailIcon />
                </IconButton>
                <IconButton onClick={() => onEdit(p)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => onDelete(p)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No hay pagos
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
