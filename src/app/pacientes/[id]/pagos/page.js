"use client"

import { use, useEffect, useState, useRef } from "react"
import {
  Box,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import ReceiptIcon from "@mui/icons-material/Receipt"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"
import VisibilityIcon from "@mui/icons-material/Visibility"
import PrintIcon from "@mui/icons-material/Print"
import DownloadIcon from "@mui/icons-material/Download"
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGeneratePaymentPDF } from "../../../../../lib/hooks/useGeneratePaymentPDF"
import Image from "next/image"

export default function PatientPayments({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const pdfRef = useRef(null);
//   const downloadPDF = usePDFDownload(pdfRef);
    const generatePDF = useGeneratePaymentPDF();
  const { id } = params
  const [patient, setPatient] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formattedPayments, setFormattedPayments] = useState([]);
  const [emailAlert, setEmailAlert] = useState({ open: false, success: true, message: '' });
  const [editMode, setEditMode] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editPayment, setEditPayment] = useState(null);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tratamiento: '',
    monto: '',
    estado: 'pendiente',
    metodo_pago: '',
    notas: ''
  });
  const [servicios, setServicios] = useState([]);


  console.log(payments)
  console.log(formattedPayments)
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios`)
      .then(res => res.json())
      .then(data => setServicios(data))
      .catch(err => console.error('Error al obtener tratamientos:', err));
  }, []);
  
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
      setLoading(true)
      try {
        // Fetch patient data
        const patientResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`)
        if (!patientResponse.ok) {
          throw new Error(`Error en la respuesta: ${patientResponse.status} ${patientResponse.statusText}`)
        }
        const patientData = await patientResponse.json()
        setPatient(patientData)

        // Fetch payment data
        const paymentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}/pagos`)
        if (!paymentsResponse.ok) {
          throw new Error(`Error en la respuesta: ${paymentsResponse.status} ${paymentsResponse.statusText}`)
        }
        const paymentsData = await paymentsResponse.json()
        setPayments(paymentsData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
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

  const handleCloseModal = () => {
    setOpenModal(false)
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
      payment.tratamiento.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    setFormattedPayments(formatted);
  }, [payments]);

  // Paginate the filtered payments
  const paginatedPayments = filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const toLocalDateString = (fechaIso) => {
    const date = new Date(fechaIso);
    const timezoneOffset = date.getTimezoneOffset() * 60000; // minutos a ms
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
  };
  

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
                <TableCell>Monto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            {loading ? (
              tableSkeletons
            ) : (
              <TableBody>
                {paginatedPayments.length > 0 ? (
                  paginatedPayments.map((payment) => (
                    <TableRow key={payment.id} hover>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <CalendarTodayIcon fontSize="small" className="text-gray-500" />
                                {formatDate(payment.fecha)}
                            </div>
                        </TableCell>
                      <TableCell>{payment.tratamiento}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AttachMoneyIcon fontSize="small" className="text-gray-500" />
                          {formatCurrency(payment.monto)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip label={payment.estado.toUpperCase()} color={getStatusColor(payment.estado)} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-1">
                          <IconButton size="small" onClick={() => handleOpenModal(payment)} title="Ver detalles">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          {/* {payment.estado === "pagado" && ( */}
                            <>
                              {/* <IconButton size="small" title="Imprimir recibo">
                                <PrintIcon fontSize="small" />
                              </IconButton> */}
                            <IconButton size="small" title="Descargar factura" onClick={() => generatePDF(payment, patient)}>
                                <DownloadIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                                size="small"
                                title="Enviar por correo"
                                onClick={async () => {
                                    if (!payment || !patient) {
                                    setEmailAlert({ open: true, success: false, message: 'Falta información del paciente o del pago.' });
                                    return;
                                    }

                                    try {
                                    const pdfBlob = await generatePDF(payment, patient, true);
                                    const formData = new FormData();
                                    formData.append('pdf', pdfBlob, `Factura_${payment.numero_factura || 'pago'}.pdf`);
                                    formData.append('to', patient.email);

                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email/enviar-factura`, {
                                        method: 'POST',
                                        body: formData,
                                    });

                                    if (res.ok) {
                                        setEmailAlert({ open: true, success: true, message: '✅ Correo enviado correctamente.' });
                                    } else {
                                        const data = await res.json();
                                        setEmailAlert({ open: true, success: false, message: `❌ Error: ${data?.error || 'No se pudo enviar el correo'}` });
                                    }
                                    } catch (error) {
                                    console.error(error);
                                    setEmailAlert({ open: true, success: false, message: '❌ Error inesperado al enviar el correo.' });
                                    }
                                }}
                                disabled={!payment || !patient?.email}
                                >
                                <EmailIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => {
                            const fechaISO = new Date(payment.fecha).toISOString().slice(0, 10);
                            setEditPayment({
                                ...payment,
                                fecha: payment.fecha,
                              });                              
                            setOpenEditModal(true);
                            }} title="Editar pago">
                            <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => setConfirmDeleteOpen(true)} title="Eliminar pago">
                                <DeleteIcon fontSize="small" />
                            </IconButton>

                            </>
                          {/* )} */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" className="py-8">
                      <Box className="flex flex-col items-center gap-2">
                        <ReceiptIcon fontSize="large" className="text-gray-400" />
                        <Typography variant="h6" className="text-gray-500">
                          No se encontraron pagos
                        </Typography>
                        <Typography variant="body2" className="text-gray-400">
                          {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                            ? "Intenta con otros filtros de búsqueda"
                            : "Este paciente aún no tiene pagos registrados"}
                        </Typography>
                      </Box>
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

      {/* Modal de detalles de pago */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        {selectedPayment && (
          <>
            <span ref={pdfRef}>
                <div className="p-4">
                    <Image
                        src="../../../../logo.svg"
                        alt="Implaeden Logo"
                        width={150}
                        height={40}
                        className="object-contain"
                    />
                </div>
                <DialogTitle>
                <div className="flex justify-between items-center">
                    <Typography variant="h6" fontWeight={600}>Detalles del Pago</Typography>
                    <Chip label={selectedPayment.estado.toUpperCase()} color={getStatusColor(selectedPayment.estado)} size="small" />
                </div>
                </DialogTitle>
                <DialogContent dividers>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <Typography variant="subtitle2" color="textSecondary">
                        Fecha
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {formatDate(selectedPayment?.fecha)}
                    </Typography>
                    </div>

                    <div>
                    <Typography variant="subtitle2" color="textSecondary">
                        Monto
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {formatCurrency(selectedPayment.monto)}
                    </Typography>
                    </div>

                    <div>
                    <Typography variant="subtitle2" color="textSecondary">
                        Tratamiento
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {selectedPayment.tratamiento}
                    </Typography>
                    </div>

                    {selectedPayment.numero_factura && (
                    <div>
                        <Typography variant="subtitle2" color="textSecondary">
                        Número de Factura
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                        {selectedPayment.numero_factura}
                        </Typography>
                    </div>
                    )}

                    {selectedPayment.metodo_pago && (
                    <div>
                        <Typography variant="subtitle2" color="textSecondary">
                        Método de Pago
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                        {selectedPayment.metodo_pago}
                        </Typography>
                    </div>
                    )}

                    {selectedPayment.notas && (
                    <div className="col-span-2">
                        <Typography variant="subtitle2" color="textSecondary">
                        Notas
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                        {selectedPayment.notas}
                        </Typography>
                    </div>
                    )}
                </div>
                </DialogContent>
            </span>
            <DialogActions>

              {/* {selectedPayment.estado === "pagado" && (
                <>
                  <Button startIcon={<PrintIcon />} onClick={handleCloseModal}>
                    Imprimir
                  </Button>
                  <Button startIcon={<DownloadIcon />} onClick={() => selectedPayment && generatePDF(selectedPayment, patient)}>
                    Descargar
                </Button>
                </>
              )} */}
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => selectedPayment && generatePDF(selectedPayment, patient)}>
                    Descargar
                </Button>
              <Button variant="contained" onClick={handleCloseModal}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth>
    
    <DialogTitle style={{ fontWeight: 600}}>Nueva Factura de Pago</DialogTitle>
    <DialogContent dividers>
        <div className="grid grid-cols-1 gap-4">
        <TextField label="Fecha" type="date" value={newPayment?.fecha}
            onChange={(e) => setNewPayment({ ...newPayment, fecha: e.target.value })} fullWidth />

        <FormControl fullWidth>
            <InputLabel>Tratamiento</InputLabel>
            <Select
            value={newPayment.tratamiento}
            label="Tratamiento"
            onChange={(e) => setNewPayment({ ...newPayment, tratamiento: e.target.value })}
            >
            {servicios.map((servicio) => (
                <MenuItem key={servicio.id} value={servicio.name}>{servicio.name}</MenuItem>
            ))}
            </Select>
        </FormControl>

        <TextField label="Monto ($ MXN)" type="number" value={newPayment.monto}
            onChange={(e) => setNewPayment({ ...newPayment, monto: e.target.value })} fullWidth />

        <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select value={newPayment.estado} label="Estado"
            onChange={(e) => setNewPayment({ ...newPayment, estado: e.target.value })}>
            <MenuItem value="pagado">Pagado</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="parcial">Parcial</MenuItem>
            <MenuItem value="cancelado">Cancelado</MenuItem>
            </Select>
        </FormControl>

        <FormControl fullWidth>
            <InputLabel>Método de Pago</InputLabel>
            <Select value={newPayment.metodo_pago} label="Método de Pago"
            onChange={(e) => setNewPayment({ ...newPayment, metodo_pago: e.target.value })}>
            <MenuItem value="Tarjeta de crédito">Tarjeta de crédito</MenuItem>
            <MenuItem value="Tarjeta de débito">Tarjeta de débito</MenuItem>
            <MenuItem value="Efectivo">Efectivo</MenuItem>
            <MenuItem value="Transferencia bancaria">Transferencia bancaria</MenuItem>
            </Select>
        </FormControl>

        <TextField label="Notas" value={newPayment.notas}
            onChange={(e) => setNewPayment({ ...newPayment, notas: e.target.value })} fullWidth multiline />
        </div>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setOpenCreateModal(false)}>Cancelar</Button>
        <Button variant="contained" onClick={async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}/pagos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPayment)
        });
        if (!res.ok) throw new Error('Error al guardar el pago');
        const created = await res.json();
        setPayments((prev) => [...prev, { ...newPayment, id: created.id }]);
        setOpenCreateModal(false);
      } catch (err) {
        alert(err.message);
      }
    }}>Guardar</Button>

    </DialogActions>
    </Dialog>

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

    <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
    <DialogTitle>Confirmar eliminación</DialogTitle>
    <DialogContent>¿Estás seguro de eliminar este recibo de pago?</DialogContent>
    <DialogActions>
        <Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
        <Button color="error" onClick={async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}/pagos/${selectedPayment.id}`, {
            method: 'DELETE'
            });
            if (!res.ok) throw new Error('No se pudo eliminar el pago.');
            setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
            setConfirmDeleteOpen(false);
            setOpenModal(false);
        } catch (err) {
            alert(err.message);
        }
        }}>Eliminar</Button>
    </DialogActions>
    </Dialog>

    <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
  <DialogTitle style={{ fontWeight: 600 }}>Editar Factura de Pago</DialogTitle>
  <DialogContent dividers>
    <div className="grid grid-cols-1 gap-4">
      <TextField
        label="Fecha"
        type="date"
        value={editPayment?.fecha || ''}
        onChange={(e) => setEditPayment({ ...editPayment, fecha: e.target.value })}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel>Tratamiento</InputLabel>
        <Select
          value={editPayment?.tratamiento || ''}
          label="Tratamiento"
          onChange={(e) => setEditPayment({ ...editPayment, tratamiento: e.target.value })}
        >
          {servicios.map((servicio) => (
            <MenuItem key={servicio.id} value={servicio.name}>{servicio.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Monto ($ MXN)"
        type="number"
        value={editPayment?.monto || ''}
        onChange={(e) => setEditPayment({ ...editPayment, monto: e.target.value })}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel>Estado</InputLabel>
        <Select
          value={editPayment?.estado || ''}
          label="Estado"
          onChange={(e) => setEditPayment({ ...editPayment, estado: e.target.value })}
        >
          <MenuItem value="pagado">Pagado</MenuItem>
          <MenuItem value="pendiente">Pendiente</MenuItem>
          <MenuItem value="parcial">Parcial</MenuItem>
          <MenuItem value="cancelado">Cancelado</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel>Método de Pago</InputLabel>
        <Select
          value={editPayment?.metodo_pago || ''}
          label="Método de Pago"
          onChange={(e) => setEditPayment({ ...editPayment, metodo_pago: e.target.value })}
        >
          <MenuItem value="Tarjeta de crédito">Tarjeta de crédito</MenuItem>
          <MenuItem value="Tarjeta de débito">Tarjeta de débito</MenuItem>
          <MenuItem value="Efectivo">Efectivo</MenuItem>
          <MenuItem value="Transferencia bancaria">Transferencia bancaria</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Notas"
        value={editPayment?.notas || ''}
        onChange={(e) => setEditPayment({ ...editPayment, notas: e.target.value })}
        fullWidth
        multiline
      />
    </div>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenEditModal(false)}>Cancelar</Button>
    <Button variant="contained" onClick={async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}/pagos/${editPayment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editPayment)
        });
        if (!res.ok) throw new Error('Error al actualizar el pago.');
        setPayments((prev) =>
            prev.map((p) =>
                p.id === editPayment.id
                ? editPayment
                : p
            )
          );
          setSelectedPayment(editPayment);          
        setOpenEditModal(false);
      } catch (err) {
        alert(err.message);
      }
    }}>Guardar</Button>
  </DialogActions>
</Dialog>

    </div>
  )
}
