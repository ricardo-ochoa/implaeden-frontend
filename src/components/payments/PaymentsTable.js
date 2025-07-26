// src/components/payments/PaymentsTable.jsx
'use client'

import React from 'react'
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
  data = [],
  paciente = {},
  formatDate,
  getStatusColor,
  onView,
  onDownload,
  onEmail,
  onEdit,
  onDelete,
}) {

  // 1. Agrupar los pagos por el nombre del tratamiento
  const groupedPayments = data.reduce((acc, pago) => {
    const tratamiento = pago.tratamiento || 'Sin Tratamiento' // Agrupa los que no tengan
    if (!acc[tratamiento]) {
      acc[tratamiento] = [] // Si no existe el grupo, lo crea
    }
    acc[tratamiento].push(pago) // Agrega el pago al grupo correspondiente
    return acc
  }, {})

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
          {Object.entries(groupedPayments).map(([tratamiento, pagos]) => (
            // 2. Usar React.Fragment para cada grupo de tratamiento
            <React.Fragment key={tratamiento}>
              {/* 3. Fila de encabezado para el grupo */}
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                <TableCell colSpan={6} sx={{ fontWeight: 'bold' }}>
                  {tratamiento}
                </TableCell>
              </TableRow>

              {/* 4. Mapear los pagos dentro de este grupo */}
              {pagos.map(p => (
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
            </React.Fragment>
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