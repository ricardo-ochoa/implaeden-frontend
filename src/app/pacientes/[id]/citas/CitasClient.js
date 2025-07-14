'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Alert,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SectionTitle from '@/components/SectionTitle'
import { useCitas } from '../../../../../lib/hooks/useCitas'
import CitasTable from '@/components/citas/CitasTable'
import CitaModal from '@/components/citas/CitaModal'

export default function CitasClient({ paciente }) {
  const pacienteId = paciente.id
  const {
    citas,
    loading: loadingCitas,
    error: errorCitas,
    refresh,
    createCita,
    updateCita,
    deleteCita,
  } = useCitas(pacienteId)

  const [servicios, setServicios] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [selectedCita, setSelectedCita] = useState(null)

  // Para el diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [citaToDelete, setCitaToDelete] = useState(null)

  const formatearFechaHora = iso =>
    new Date(iso).toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  useEffect(() => {
    if (!pacienteId) return
    refresh()
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios`)
      .then(r => r.json())
      .then(setServicios)
      .catch(console.error)
  }, [pacienteId, refresh])

  const handleSave = async form => {
    const { appointment_at, service_id } = form
    if (!appointment_at || !service_id) {
      setMensaje('Por favor complete fecha y tratamiento')
      return false
    }
    try {
      if (selectedCita) {
        await updateCita({ ...form, id: selectedCita.id })
        setMensaje('Cita actualizada exitosamente')
      } else {
        await createCita(form)
        setMensaje('Cita creada exitosamente')
      }
      return true
    } catch {
      setMensaje('Error guardando la cita')
      return false
    } finally {
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const handleEdit = cita => {
    setSelectedCita(cita)
    setModalOpen(true)
  }

  // En lugar de borrar directamente, abrimos el modal de confirmación
  const handleRequestDelete = id => {
    const cita = citas.find(c => c.id === id)
    setCitaToDelete(cita)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (citaToDelete) {
      await deleteCita(citaToDelete.id)
      setMensaje('Cita eliminada exitosamente')
      setTimeout(() => setMensaje(''), 3000)
    }
    setConfirmOpen(false)
    setCitaToDelete(null)
  }

  const handleCancelDelete = () => {
    setConfirmOpen(false)
    setCitaToDelete(null)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedCita(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title={`Historial de Citas: ${paciente.nombre} ${paciente.apellidos}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: `${paciente.nombre} ${paciente.apellidos}`, href: `/pacientes/${pacienteId}` },
          { label: 'Citas' },
        ]}
      />

      {mensaje && (
        <Alert
          severity={mensaje.includes('exitosamente') ? 'success' : 'error'}
          sx={{
            position: 'fixed',
            top: theme => theme.spacing(2), // un poco de margen desde arriba
            left: '50%',                 // centrar horizontalmente
            transform: 'translateX(-50%)',
            width: 'auto',               // o un máximo: '90%', '400px', etc.
            zIndex: theme => theme.zIndex.snackbar,
          }}
        >
          {mensaje}
        </Alert>
      )}

      {errorCitas && (
        <Alert
          severity="error"
          sx={{
            position: 'fixed',
            top: theme => theme.spacing(10),
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            zIndex: theme => theme.zIndex.snackbar,
          }}
        >
          Error cargando citas: {errorCitas}
        </Alert>
      )}


      <Grid container>
        <Grid item xs={12} sx={{ textAlign: 'right', mb: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalOpen(true)}
          >
            Nueva Cita
          </Button>
        </Grid>

        <Grid item xs={12}>
          {loadingCitas ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <CitasTable
              citas={citas}
              servicios={servicios}
              formatearFechaHora={formatearFechaHora}
              onEdit={handleEdit}
              onDelete={handleRequestDelete}  // ahora abre el confirm
            />
          )}
        </Grid>
      </Grid>

      {/* Modal de crear/editar */}
      <CitaModal
        open={modalOpen}
        onClose={handleCloseModal}
        servicios={servicios}
        onSave={handleSave}
        initialData={selectedCita}
      />

      {/* Confirmación de eliminación */}
      <Dialog open={confirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>
          ¿Estás seguro de eliminar este registro de cita?
        </DialogTitle>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
          >
            Sí, confirmo eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
