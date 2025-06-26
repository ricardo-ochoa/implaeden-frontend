"use client"

import { use, useEffect, useState, useRef } from "react"
import {
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
} from "@mui/material"
import SectionTitle from "@/components/SectionTitle"
import SearchIcon from "@mui/icons-material/Search"
import FilterListIcon from "@mui/icons-material/FilterList"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"
import VisibilityIcon from "@mui/icons-material/Visibility"
import DownloadIcon from "@mui/icons-material/Download"
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGeneratePaymentPDF } from "../../../../../lib/hooks/useGeneratePaymentPDF"
import Image from "next/image"
import { usePayments } from "../../../../../lib/hooks/usePayments"
import {
  PaymentDetailsDialog,
  PaymentFormDialog,
  ConfirmDeleteDialog
} from '@/components/paymentDialogs';
import { PAYMENT_METHODS } from '../../../../../lib/utils/paymentmethods';

export default function PatientPayments({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const pdfRef = useRef(null);
  const generatePDF = useGeneratePaymentPDF();
  const { id } = params
  const [patient, setPatient] = useState(null)
  const [emailAlert, setEmailAlert] = useState({ open: false, success: true, message: '' });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const { payments, loading, error, createPayment, updatePayment, deletePayment } = usePayments(id);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    fecha: new Date().toISOString().split('T')[0],
    patient_service_id: '',
    monto: '',
    estado: 'pendiente',
    metodo_pago: '',
    notas: ''
  });
  const [servicios, setServicios] = useState([]);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios/${id}/tratamientos`)
    .then(r => r.json())
    .then(data => setServicios(data?.map(t => ({
      id: t.treatment_id,
      name: t.service_name,
      totalCost: Number(t.total_cost) || 0
    }))))
}, [id]);

  const handleEditClick = payment => {
    setEditPayment({
      id:                 payment.id,
      fecha:              payment.fecha,
      patient_service_id: payment.patient_service_id,
      monto:              payment.monto,
      estado:             payment.estado,
      metodo_pago:        payment.metodo_pago,
      notas:              payment.notas,
    });
    setOpenEditModal(true);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Pagination state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Modal state
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [openModal, setOpenModal] = useState(false)

  useEffect(() => {
    const fetchPatientAndPayments = async () => {
      try {
        // Lanza ambas peticiones en paralelo
        const [patientRes, paymentsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}/pagos`)
        ])
  
        if (!patientRes.ok) {
          throw new Error(`Error paciente: ${patientRes.status} ${patientRes.statusText}`)
        }
        if (!paymentsRes.ok) {
          throw new Error(`Error pagos: ${paymentsRes.status} ${paymentsRes.statusText}`)
        }
  
        const patientData  = await patientRes.json()
        const paymentsData = await paymentsRes.json()
  
        setPatient(patientData)
  
        // Mapea sólo lo necesario
        const mapped = paymentsData.map(p => ({
          id:              p.id,
          fecha:           p.fecha.split('T')[0],          // "YYYY-MM-DD"
          patient_service_id: p.patient_service_id,
          total_cost:      parseFloat(p.total_cost),
          monto:           parseFloat(p.monto),
          total_pagado:    parseFloat(p.total_pagado),
          saldo_pendiente: parseFloat(p.saldo_pendiente),
          estado:          p.estado,
          numero_factura:  p.numero_factura,
          metodo_pago:     p.metodo_pago,
          notas:           p.notas
        }))

      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      }
    }
  
    if (id) {
      fetchPatientAndPayments()
    }
  }, [id])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value)
    setPage(0)
  }

  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value)
    setPage(0)
  }

  const handleOpenModal = (payment) => {
    setSelectedPayment(payment)
    setOpenModal(true)
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pagado":
        return "success"
      case "pendiente":
        return "warning"
      case "cancelado":
        return "error"
      case "parcial":
        return "info"
      default:
        return "default"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Filter payments based on search term and filters
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment?.tratamiento?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      payment.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.estado.toLowerCase() === statusFilter.toLowerCase()

    let matchesDate = true
    const paymentDate = new Date(payment?.fecha)
    const today = new Date()
    const lastMonth = new Date()
    lastMonth.setMonth(today.getMonth() - 1)

    if (dateFilter === "month") {
      matchesDate = paymentDate >= lastMonth
    } else if (dateFilter === "year") {
      const lastYear = new Date()
      lastYear.setFullYear(today.getFullYear() - 1)
      matchesDate = paymentDate >= lastYear
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  useEffect(() => {
    const formatted = payments.map((p) => ({
      ...p,
      fechaFormateada: new Date(p.fecha).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }));
  }, [payments]);

  // Paginate the filtered payments
  const paginatedPayments = filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // Skeleton loaders
  const tableSkeletons = (
    <TableBody>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8">
      {loading ? (
        <>
          <Skeleton variant="text" width="20%" height={50} />
          <Skeleton variant="text" width="20%" height={20} />
          <Skeleton variant="text" width="50%" height={50} sx={{ marginBottom: 4 }} />
        </>
      ) : (
        <SectionTitle
          title={`Historial de Pagos: ${patient?.nombre || ""} ${patient?.apellidos || ""}`.trim()}
          breadcrumbs={[
            { label: "Pacientes", href: "/pacientes" },
            { label: `${patient?.nombre || ""} ${patient?.apellidos || ""}`.trim(), href: `/pacientes/${id}` },
            { label: "Pagos" },
          ]}
        />
      )}

      <Paper elevation={2} className="mb-6 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="flex">
          <TextField
            label="Buscar por tratamiento"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full md:w-64"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <div className="flex items-center gap-2">
            <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? "primary" : "default"}>
              <FilterListIcon />
            </IconButton>
            <Typography variant="body2" className="text-gray-600">
              {filteredPayments.length} resultados
            </Typography>
          </div>
        </div>
        <Button variant="contained" color="primary" onClick={() => setOpenCreateModal(true)}>
            Nuevo Pago
        </Button>
        </div>

        {showFilters && (
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <FormControl variant="outlined" size="small" className="w-full md:w-48">
              <InputLabel id="status-filter-label">Estado</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Estado"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pagado">Pagado</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="parcial">Parcial</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>

            <FormControl variant="outlined" size="small" className="w-full md:w-48">
              <InputLabel id="date-filter-label">Periodo</InputLabel>
              <Select labelId="date-filter-label" value={dateFilter} onChange={handleDateFilterChange} label="Periodo">
                <MenuItem value="all">Todo el historial</MenuItem>
                <MenuItem value="month">Último mes</MenuItem>
                <MenuItem value="year">Último año</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}

      <TableContainer>
        <Table aria-label="tabla de historial de pagos">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tratamiento</TableCell>
              <TableCell align="right">Costo</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          {loading ? (
            tableSkeletons
          ) : (
            <TableBody>
              {payments.length > 0 ? payments.map(payment => (
                <TableRow key={payment.id} hover>
                  {/* Fecha */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarTodayIcon fontSize="small" className="text-gray-500" />
                      {formatDate(payment.fecha)}
                    </div>
                  </TableCell>

                  {/* Tratamiento */}
                  <TableCell>{payment.tratamiento}</TableCell>

                  {/* Costo total */}
                  <TableCell align="right">{formatCurrency(payment.total_cost)}</TableCell>

                  {/* Monto de este abono */}
                  <TableCell align="right">
                    <div className="flex items-center gap-1 justify-end">
                      <AttachMoneyIcon fontSize="small" className="text-gray-500" />
                      {formatCurrency(payment.monto)}
                    </div>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Chip
                      label={payment.estado.toUpperCase()}
                      color={getStatusColor(payment.estado)}
                      size="small"
                    />
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="right">
                    <div className="flex justify-end gap-1">
                      <IconButton size="small" onClick={() => handleOpenModal(payment)} title="Ver detalles">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Descargar factura" onClick={() => generatePDF(payment, patient)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Enviar por correo"
                        onClick={async () => {
                          try {
                            const pdf = await generatePDF(payment, patient, true);
                            const fd = new FormData();
                            fd.append('pdf', pdf, `Factura_${payment.numero_factura}.pdf`);
                            fd.append('to', patient.email);
                            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email/enviar-factura`, { method:'POST', body:fd });
                            setEmailAlert({ open:true, success:r.ok, message: r.ok ? '✅ Enviado' : '❌ Falló' });
                          } catch {
                            setEmailAlert({ open:true, success:false, message:'❌ Error inesperado' });
                          }
                        }}
                        disabled={!patient?.email}
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditClick(payment)} title="Editar pago">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Eliminar pago"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setConfirmDeleteOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>

                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" className="py-8">
                    {/* … contenido “no hay pagos” … */}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPayments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

    <Snackbar
    open={emailAlert.open}
    autoHideDuration={4000}
    onClose={() => setEmailAlert({ ...emailAlert, open: false })}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
    <Alert
        onClose={() => setEmailAlert({ ...emailAlert, open: false })}
        severity={emailAlert.success ? 'success' : 'error'}
        sx={{ width: '100%' }}
    >
        {emailAlert.message}
    </Alert>
    </Snackbar>

    <PaymentDetailsDialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        payment={selectedPayment}
        onDownload={() => selectedPayment && generatePDF(selectedPayment, patient)}
      />

    <PaymentFormDialog
      open={openCreateModal}
      onClose={() => setOpenCreateModal(false)}
      initialData={null}
      servicios={servicios}
      onSave={async (data) => {
        await createPayment(data)
        setOpenCreateModal(false)
      }}
    />

    <PaymentFormDialog
      open={openEditModal}
      onClose={() => setOpenEditModal(false)}
      initialData={editPayment}
      servicios={servicios}
      onSave={async (data) => {
        await updatePayment(data)
        setOpenEditModal(false)
      }}
    />

      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          await deletePayment(selectedPayment.id);
          setConfirmDeleteOpen(false);
          setOpenModal(false);
        }}
      />

    </div>
  )
}
