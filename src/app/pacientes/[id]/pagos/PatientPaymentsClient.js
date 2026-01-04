'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '../../../../../lib/api'
import { usePayments } from '../../../../../lib/hooks/usePayments'
import { useGeneratePaymentPDF } from '../../../../../lib/hooks/useGeneratePaymentPDF'
import {
  Paper,
  TablePagination,
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
  useMediaQuery,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material'
import {
  PaymentDetailsDialog,
  PaymentFormDialog,
  ConfirmDeleteDialog,
} from '@/components/paymentDialogs'
import { useTheme } from '@mui/material/styles';
import { formatDate } from '../../../../../lib/utils/formatDate'
// import PaymentsTable from '@/components/payments/PaymentsTable'
import PaymentsList from '@/components/payments/PaymentsList'
import theme from '@/theme'

export default function PatientPaymentsClient(
  {paciente, initialPayments, initialServicios}
) {
  const { id: pacienteId } = useParams()
  const router = useRouter()
  const generatePDF = useGeneratePaymentPDF()
  const [localPayments, setLocalPayments] = useState(initialPayments);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


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

    useEffect(() => {
    if (!pagosLoading) {
      setLocalPayments(payments);
    }
  }, [payments, pagosLoading]);

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
      await updatePayment(data); 
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
  const filtered = localPayments.filter(p => {
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

  return (
    <div>
      {/* Buscador & Nuevo */}
      <Paper className="mb-6 p-4" elevation={2}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            <TextField
              label="Buscar por tratamiento"
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
          <Button fullWidth={isMobile} variant="contained" onClick={()=>setOpenCreateModal(true)}>
            Nuevo Pago
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
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
        {/* <PaymentsTable
          data={paginated}
          paciente={paciente}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          onView={(p) => { setSelectedPayment(p); setDetailsOpen(true) }}
          onDownload={(p) => generatePDF(p, paciente)}
          onEmail={(p) => handleSendEmail(p)}
          onEdit={p => { setEditPayment(p); setOpenEditModal(true) }}
          onDelete={(p) => { setSelectedPayment(p); setConfirmDeleteOpen(true) }}
        /> */}

        <PaymentsList
          data={paginated}
          paciente={paciente}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          onView={(p) => { setSelectedPayment(p); setDetailsOpen(true) }}
          onDownload={(p) => generatePDF(p, paciente)}
          onEmail={(p) => handleSendEmail(p)}
          onEdit={p => { setEditPayment(p); setOpenEditModal(true) }}
          onDelete={(p) => { setSelectedPayment(p); setConfirmDeleteOpen(true) }}
        />

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
        servicios={initialServicios}
        onSave={handleCreate}
      />

      <PaymentFormDialog
        open={openEditModal}
        onClose={()=>setOpenEditModal(false)}
        initialData={editPayment}
        servicios={initialServicios}
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
