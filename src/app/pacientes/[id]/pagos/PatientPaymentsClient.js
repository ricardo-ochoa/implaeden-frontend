// src/components/PatientPaymentsClient.js
'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Skeleton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from '@mui/material'
import SectionTitle from '@/components/SectionTitle'
import {
  CalendarToday as CalendarTodayIcon,
  AttachMoney   as AttachMoneyIcon,
  Visibility    as VisibilityIcon,
  Download      as DownloadIcon,
  Email         as EmailIcon,
  Edit          as EditIcon,
  Delete        as DeleteIcon,
  Search        as SearchIcon,
  FilterList    as FilterListIcon,
} from '@mui/icons-material'

import {
  PaymentDetailsDialog,
  PaymentFormDialog,
  ConfirmDeleteDialog,
} from '@/components/paymentDialogs'
import { useGeneratePaymentPDF } from '../../../../../lib/hooks/useGeneratePaymentPDF'
import { usePayments } from '../../../../../lib/hooks/usePayments'
import { formatDate } from '../../../../../lib/utils/formatDate'

export default function PatientPaymentsClient({ paciente, pagosData }) {
  const pacienteId = paciente.id || ''
  const generatePDF = useGeneratePaymentPDF()

  // Hooks para CRUD
  const {
     payments,
     loading: hookLoading,
     error: hookError,
     refresh: fetchPayments,
     createPayment,
     updatePayment,
     deletePayment, } = usePayments(pacienteId)

  // Estado local
  // const [payments, setPayments] = useState(pagosData || [])
  const [loading, setLoading]   = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [error, setError]       = useState(null)

  // Modales y alerts
  const [openCreateModal, setOpenCreateModal]     = useState(false)
  const [openEditModal, setOpenEditModal]         = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [detailsOpen, setDetailsOpen]             = useState(false)
  const [editPayment, setEditPayment]             = useState(null)
  const [selectedPayment, setSelectedPayment]     = useState(null)
  const [emailAlert, setEmailAlert]               = useState({ open:false, success:true, message:'' })

  // Filtros, búsqueda y paginación
  const [searchTerm, setSearchTerm]   = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter]     = useState('all')
  const [showFilters, setShowFilters]   = useState(false)
  const [page, setPage]                 = useState(0)
  const [rowsPerPage, setRowsPerPage]   = useState(10)

  // Carga inicial de servicios (para formularios)
  const [servicios, setServicios] = useState([])
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios/${pacienteId}/tratamientos`)
      .then(r => r.json())
      .then(data => setServicios(data.map(t => ({
        id: t.treatment_id,
        name: t.service_name,
        totalCost: Number(t.total_cost)||0
      }))))
  }, [pacienteId])

  const handleSendEmail = async (payment) => {
  if (!paciente.email) return
  setSendingEmail(true)
  try {
    const pdf = await generatePDF(payment, paciente, true)
    const fd = new FormData()
    fd.append('pdf', pdf, `Factura_${payment.numero_factura}.pdf`)
    fd.append('to', paciente.email)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/email/enviar-factura`,
      { method: 'POST', body: fd }
    )
    setEmailAlert({ open: true, success: res.ok, message: res.ok ? 'Enviado' : 'Falló' })
  } catch {
    setEmailAlert({ open: true, success: false, message: 'Error al enviar' })
  } finally {
    setSendingEmail(false)
  }
}


  // Handlers CRUD
  const handleCreate = async (data) => {
    setLoading(true)
    try {
      await createPayment(data)
      // await fetchPayments()    // recarga listados
      setOpenCreateModal(false)
    } catch {
      setError('No se pudo crear el pago')
    } finally {
      setLoading(false)
    }
  }

const handleUpdate = async (data) => {
  setLoading(true)
  try {
    // El hook hace el setPayments internamente
    await updatePayment(data)
    setOpenEditModal(false)
  } catch {
    setError('No se pudo actualizar el pago')
  } finally {
    setLoading(false)
  }
}

const handleDelete = async () => {
  if (!selectedPayment) return
  setLoading(true)
  try {
    await deletePayment(selectedPayment.id)
    setConfirmDeleteOpen(false)
    setDetailsOpen(false)
  } catch {
    setError('No se pudo eliminar el pago')
  } finally {
    setLoading(false)
  }
}


  // Formatea moneda y fecha
  const formatCurrency = amt =>
    new Intl.NumberFormat('es-MX', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amt)


  const getStatusColor = st => {
    switch(st.toLowerCase()){
      case 'finalizado':   return 'success'
      case 'abono':return 'warning'
      case 'cancelado':return 'error'
      case 'reembolsado':  return 'default'
      default:         return 'default'
    }
  }

  // Filtrado y paginación
  const filtered = payments.filter(p=>{
    const matchesSearch = p?.tratamiento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p?.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter==='all' || p?.estado===statusFilter
    let matchesDate = true
    if(dateFilter==='month'){
      const mAgo=new Date();mAgo.setMonth(mAgo.getMonth()-1)
      matchesDate = new Date(p.fecha)>=mAgo
    }
    if(dateFilter==='year'){
      const yAgo=new Date();yAgo.setFullYear(yAgo.getFullYear()-1)
      matchesDate = new Date(p.fecha)>=yAgo
    }
    return matchesSearch && matchesStatus && matchesDate
  })
  const paginated = filtered.slice(page*rowsPerPage, page*rowsPerPage+rowsPerPage)

  console.log(paginated)

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title={`Historial de Pagos: ${paciente.nombre} ${paciente.apellidos}`}
        breadcrumbs={[
          { label:'Pacientes', href:'/pacientes' },
          { label:`${paciente.nombre} ${paciente.apellidos}`, href:`/pacientes/${pacienteId}` },
          { label:'Pagos' }
        ]}
      />

      {/* Buscador y botón Nuevo */}
      <Paper className="mb-6 p-4" elevation={2}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            <TextField
              label="Buscar"
              size="small"
              value={searchTerm}
              onChange={e=>{setSearchTerm(e.target.value);setPage(0)}}
              InputProps={{ startAdornment:<InputAdornment position="start"><SearchIcon/></InputAdornment> }}
            />
            <IconButton onClick={()=>setShowFilters(f=>!f)} color={showFilters?'primary':'default'}>
              <FilterListIcon/>
            </IconButton>
            <Typography>{filtered.length} resultados</Typography>
          </div>
          <Button variant="contained" onClick={()=>setOpenCreateModal(true)}>
            Nuevo Pago
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mb-4">
            <FormControl size="small">
              <InputLabel>Estatus de pago</InputLabel>
              <Select
                value={statusFilter}
                onChange={e=>{setStatusFilter(e.target.value);setPage(0)}}
                label="Estatus de pago"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="finalizado">Pagado</MenuItem>
                <MenuItem value="reembolsado">Reembolsado</MenuItem>
                <MenuItem value="abono">Abono</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Periodo</InputLabel>
              <Select
                value={dateFilter}
                onChange={e=>{setDateFilter(e.target.value);setPage(0)}}
                label="Periodo"
              >
                <MenuItem value="all">Todo</MenuItem>
                <MenuItem value="month">Último mes</MenuItem>
                <MenuItem value="year">Último año</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}

        {/* Tabla */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tratamiento</TableCell>
                <TableCell align="right">Costo</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Estatus de pago</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              { loading
                ? Array.from({length:5}).map((_,i)=>(
                    <TableRow key={i}>
                      {Array.from({length:6}).map((__,j)=>
                        <TableCell key={j}><Skeleton/></TableCell>
                      )}
                    </TableRow>
                  ))
                : paginated.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarTodayIcon fontSize="small"/>
                        {formatDate(p.fecha)}
                      </div>
                    </TableCell>
                    <TableCell>{p.tratamiento}</TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end">
                        <AttachMoneyIcon fontSize="small" />
                        {formatCurrency(p.total_cost)}
                        </div></TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end">
                        <AttachMoneyIcon fontSize="small" />
                        {formatCurrency(p.monto)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip label={p.estado.toUpperCase()} color={getStatusColor(p.estado)} size="small"/>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-1">
                        <IconButton onClick={()=>{setSelectedPayment(p);setDetailsOpen(true)}}>
                          <VisibilityIcon fontSize="small"/>
                        </IconButton>
                        <IconButton onClick={()=>generatePDF(p,paciente)}>
                          <DownloadIcon fontSize="small"/>
                        </IconButton>
                        <IconButton onClick={() => handleSendEmail(p)} disabled={!paciente.email}>
                          <EmailIcon fontSize="small"/>
                        </IconButton>
                        <IconButton onClick={()=>{ setEditPayment(p); setOpenEditModal(true) }}>
                          <EditIcon fontSize="small"/>
                        </IconButton>
                        <IconButton onClick={()=>{ setSelectedPayment(p); setConfirmDeleteOpen(true) }}>
                          <DeleteIcon fontSize="small"/>
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
              { !loading && paginated.length===0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" className="py-8">
                    No hay pagos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5,10,25]}
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_,np)=>setPage(np)}
          onRowsPerPageChange={e=>{ setRowsPerPage(+e.target.value); setPage(0) }}
        />
      </Paper>

      {/* Snackbar email */}
      <Snackbar
        open={emailAlert.open}
        autoHideDuration={4000}
        onClose={()=>setEmailAlert({...emailAlert,open:false})}
      >
        <Alert severity={emailAlert.success?'success':'error'}>
          {emailAlert.message}
        </Alert>
      </Snackbar>

      {/* Dialogs */}
      <PaymentDetailsDialog
        open={detailsOpen}
        onClose={()=>setDetailsOpen(false)}
        payment={selectedPayment}
        onDownload={()=>selectedPayment&&generatePDF(selectedPayment,paciente)}
      />
      <PaymentFormDialog
        open={openCreateModal}
        onClose={()=>setOpenCreateModal(false)}
        initialData={null}
        servicios={servicios}
        onSave={handleCreate}
      />
      <PaymentFormDialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        initialData={editPayment}
        servicios={servicios}
        onSave={async (formData) => {
          await handleUpdate(formData)
          setOpenEditModal(false)
        }}
      />
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onClose={()=>setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <Dialog open={sendingEmail} PaperProps={{ sx: { p: 2, textAlign: 'center' } }}>
        <DialogTitle>Enviando email…</DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>

    </div>
  )
}
