// src/components/payments/PaymentsList.jsx
'use client'

import React from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Box, Card, CardContent, CardActions, Typography,
  useTheme, useMediaQuery,
} from '@mui/material'
import {
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { formatCurrency } from '../../../lib/utils/formatCurrency'

// --- Sub-componente para la tarjeta individual ---
function PaymentCard({ payment, paciente, formatDate, getStatusColor, onView, onDownload, onEmail, onEdit, onDelete }) {
  return (
    <Card sx={{ mb: 2 }} elevation={2}>
      <CardContent>
        {/* Fila de Fecha y Estatus */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography variant="body2">{formatDate(payment.fecha)}</Typography>
          </Box>
          <Chip
            label={payment.estado?.toUpperCase()}
            color={getStatusColor(payment.estado)}
            size="small"
          />
        </Box>
        
        {/* Fila de Montos */}
        <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="body2">Costo: <strong>{formatCurrency(payment?.total_cost)}</strong></Typography>
            <Typography variant="body2">Monto: <strong>{formatCurrency(payment?.monto)}</strong></Typography>
        </Box>
      </CardContent>
      
      {/* Botones de Acción */}
      <CardActions sx={{ justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.02)', py: 0.5 }}>
        <IconButton size="small" onClick={() => onView(payment)}><VisibilityIcon /></IconButton>
        <IconButton size="small" onClick={() => onDownload(payment)}><DownloadIcon /></IconButton>
        <IconButton size="small" onClick={() => onEmail(payment)} disabled={!paciente.email}><EmailIcon /></IconButton>
        <IconButton size="small" onClick={() => onEdit(payment)}><EditIcon /></IconButton>
        <IconButton size="small" onClick={() => onDelete(payment)}><DeleteIcon /></IconButton>
      </CardActions>
    </Card>
  )
}


// --- Componente principal que decide qué vista mostrar ---
export default function PaymentsList(props) {
  const { data = [] } = props

  // Hook para detectar si la pantalla es pequeña (menor a 'md')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Agrupar los pagos por tratamiento (lógica que ya tenías)
  const groupedPayments = data.reduce((acc, pago) => {
    const tratamiento = pago.tratamiento || 'Sin Tratamiento'
    if (!acc[tratamiento]) {
      acc[tratamiento] = []
    }
    acc[tratamiento].push(pago)
    return acc
  }, {})

  // Mensaje si no hay datos
  if (data.length === 0) {
    return (
      <Typography align="center" sx={{ p: 4, color: 'text.secondary' }}>
        No se encontraron pagos.
      </Typography>
    )
  }

  // VISTA MÓVIL (TARJETAS)
  if (isMobile) {
    return (
      <Box>
        {Object.entries(groupedPayments).map(([tratamiento, pagos]) => (
          <Box key={tratamiento} mb={3}>
            <Typography color='primary' variant="body1" component="div" gutterBottom sx={{ 
                fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', 
                pb: 1, mb: 2,
                }}>
              {tratamiento}
            </Typography>
            {pagos.map(p => (
              <PaymentCard key={p.id} payment={p} {...props} />
            ))}
          </Box>
        ))}
      </Box>
    )
  }

  // VISTA ESCRITORIO (TABLA)
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
            <React.Fragment key={tratamiento}>
              <TableRow sx={{ backgroundColor: '#F5F7FB' }}>
                <TableCell colSpan={6}>{ <Typography sx={{ fontWeight: 'bold' }} color='primary'>{tratamiento}</Typography>}</TableCell>
              </TableRow>
              {pagos.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell><CalendarTodayIcon fontSize="small" /> {props.formatDate(p.fecha)}</TableCell>
                  <TableCell>{p.tratamiento}</TableCell>
                  <TableCell align="right"><AttachMoneyIcon fontSize="small" /> {formatCurrency(p?.total_cost)}</TableCell>
                  <TableCell align="right"><AttachMoneyIcon fontSize="small" /> {formatCurrency(p?.monto)}</TableCell>
                  <TableCell><Chip label={p.estado?.toUpperCase()} color={props.getStatusColor(p.estado)} size="small" /></TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => props.onView(p)}><VisibilityIcon /></IconButton>
                    <IconButton onClick={() => props.onDownload(p)}><DownloadIcon /></IconButton>
                    <IconButton onClick={() => props.onEmail(p)} disabled={!props.paciente.email}><EmailIcon /></IconButton>
                    <IconButton onClick={() => props.onEdit(p)}><EditIcon /></IconButton>
                    <IconButton onClick={() => props.onDelete(p)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}