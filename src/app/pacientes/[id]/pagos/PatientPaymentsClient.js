'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '../../../../../lib/api'
import { usePayments } from '../../../../../lib/hooks/usePayments'
import { useGeneratePaymentPDF } from '../../../../../lib/hooks/useGeneratePaymentPDF'
import SectionTitle from '@/components/SectionTitle'
import {
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Skeleton,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import {
  PaymentDetailsDialog,
  PaymentFormDialog,
  ConfirmDeleteDialog,
} from '@/components/paymentDialogs'
import { formatDate } from '../../../../../lib/utils/formatDate'

export default function PatientPaymentsClient() {
  const { id: pacienteId } = useParams()
  const router = useRouter()
  const generatePDF = useGeneratePaymentPDF()

  // Estado paciente
  const [paciente, setPaciente] = useState(null)
  const [pLoading, setPLoading] = useState(true)
  const [pError, setPError]     = useState(null)
  
  useEffect(() => {
    if (!pacienteId) return
    setPLoading(true)
    api.get(`/pacientes/${pacienteId}`)
      .then(res => setPaciente(res.data))
      .catch(err => {
        if (err.response?.status === 401) {
          router.push('/login')
        } else {
          setPError(err.response?.data?.message || err.message)
        }
      })
      .finally(() => setPLoading(false))
  }, [pacienteId, router])

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

  // Servicios para formularios
  const [servicios, setServicios]   = useState([])
  const [servLoading, setServLoading] = useState(true)
  const [servError,   setServError]   = useState(null)

  useEffect(() => {
    if (!pacienteId) return
    setServLoading(true)
    api.get(`/pacientes/${pacienteId}/tratamientos`)
      .then(res => {
        setServicios(
          res.data.map(t => ({
            id:        t.treatment_id,
            name:      t.service_name,
            totalCost: Number(t.total_cost) || 0,
          }))
        )
      })
      .catch(err => {
        if (err.response?.status === 401) {
          router.push('/login')
        } else {
          setServError(err.response?.data?.message || err.message)
        }
      })
      .finally(() => setServLoading(false))
  }, [pacienteId, router])

  // UI state
  const [searchTerm, setSearchTerm]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter]     = useState('all')
  const [showFilters, setShowFilters]   = useState(false)
  const [page, setPage]                 = useState(0)
  const [rowsPerPage, setRowsPerPage]   = useState(10)

  const [openCreateModal, setOpenCreateModal]     = useState(false)
  const [openEditModal, setOpenEditModal]         = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [detailsOpen, setDetailsOpen]             = useState(false)
  const [editPayment, setEditPayment]             = useState(null)
  const [selectedPayment, setSelectedPayment]     = useState(null)
  const [emailAlert, setEmailAlert]               = useState({ open: false, success: true, message: '' })

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError]     = useState(null)

  // Handlers
  const handleCreate = async data => {
    setActionLoading(true)
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

  const handleUpdate = async data => {
    setActionLoading(true)
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

  const handleSendEmail = async payment => {
    if (!paciente?.email) return
    setActionLoading(true)
    setEmailAlert({ open: true, success: actionLoading, message:'Enviando' })
    try {
      const pdf = await generatePDF(payment, paciente, true)
      const fd = new FormData()
      fd.append('pdf', pdf, `Factura_${payment.numero_factura}.pdf`)
      fd.append('to', paciente.email)
      const res = await api.post('/email/enviar-factura', fd)
      setEmailAlert({ open: true, success: res.status===200, message: res.status===200 ? 'Enviado' : 'Falló' })
    } catch {
      setEmailAlert({ open: true, success: false, message: 'Error al enviar' })
    } finally {
      setActionLoading(false)
    }
  }

  // Filtrado y paginación
  const filtered = payments.filter(p => {
    const matchesSearch = p.tratamiento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.numero_factura.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter==='all' || p.estado===statusFilter
    let matchesDate = true
    if (dateFilter==='month') {
      const mAgo = new Date(); mAgo.setMonth(mAgo.getMonth()-1)
      matchesDate = new Date(p.fecha)>=mAgo
    }
    if (dateFilter==='year') {
      const yAgo = new Date(); yAgo.setFullYear(yAgo.getFullYear()-1)
      matchesDate = new Date(p.fecha)>=yAgo
    }
    return matchesSearch && matchesStatus && matchesDate
  })
  const paginated = filtered.slice(page*rowsPerPage, page*rowsPerPage+rowsPerPage)

  // Loading & Errors
  if (pLoading || pagosLoading || servLoading) {
    return <Dialog open><DialogContent sx={{textAlign:'center',p:4}}><CircularProgress/></DialogContent></Dialog>
  }
  if (pError)    return <Alert severity="error">Error paciente: {pError}</Alert>
  if (pagosError) return <Alert severity="error">Error pagos: {pagosError}</Alert>
  if (servError)  return <Alert severity="error">Error servicios: {servError}</Alert>

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

      {/* Buscador & Nuevo */}
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
              <Select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(0)}} label="Estatus de pago">
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="finalizado">Pagado</MenuItem>
                <MenuItem value="reembolsado">Reembolsado</MenuItem>
                <MenuItem value="abono">Abono</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Periodo</InputLabel>
              <Select value={dateFilter} onChange={e=>{setDateFilter(e.target.value);setPage(0)}} label="Periodo">
                <MenuItem value="all">Todo</MenuItem>
                <MenuItem value="month">Último mes</MenuItem>
                <MenuItem value="year">Último año</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}

        {/* Tabla de pagos */}
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
              {paginated.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell><CalendarTodayIcon fontSize="small"/> {formatDate(p.fecha)}</TableCell>
                  <TableCell>{p.tratamiento}</TableCell>
                  <TableCell align="right"><AttachMoneyIcon fontSize="small"/> {p.total_cost.toFixed(2)}</TableCell>
                  <TableCell align="right"><AttachMoneyIcon fontSize="small"/> {p.monto.toFixed(2)}</TableCell>
                  <TableCell><Chip label={p?.estado?.toUpperCase()} color={getStatusColor(p?.estado)} size="small"/></TableCell>
                  <TableCell align="right">
                    <IconButton onClick={()=>{setSelectedPayment(p);setDetailsOpen(true)}}><VisibilityIcon/></IconButton>
                    <IconButton onClick={()=>generatePDF(p,paciente)}><DownloadIcon/></IconButton>
                    <IconButton onClick={()=>handleSendEmail(p)} disabled={!paciente.email}><EmailIcon/></IconButton>
                    <IconButton onClick={()=>{setEditPayment(p);setOpenEditModal(true)}}><EditIcon/></IconButton>
                    <IconButton onClick={()=>{setSelectedPayment(p);setConfirmDeleteOpen(true)}}><DeleteIcon/></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length===0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay pagos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_,newPage)=>setPage(newPage)}
          onRowsPerPageChange={e=>{setRowsPerPage(+e.target.value);setPage(0)}}
          rowsPerPageOptions={[5,10,25]}
        />
      </Paper>

      {/* Alert y Dialogs */}
      <Snackbar open={emailAlert.open} autoHideDuration={4000} onClose={()=>setEmailAlert({...emailAlert,open:false})}>
        <Alert severity={emailAlert.success?'success':'error'}>{emailAlert.message}</Alert>
      </Snackbar>

      <PaymentDetailsDialog
        open={detailsOpen}
        onClose={()=>setDetailsOpen(false)}
        payment={selectedPayment}
        onDownload={()=>generatePDF(selectedPayment,paciente)}
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
        onClose={()=>setOpenEditModal(false)}
        initialData={editPayment}
        servicios={servicios}
        onSave={handleUpdate}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onClose={()=>setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
