'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Alert,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useCitas } from '../../../../../lib/hooks/useCitas'
import CitasTable from '@/components/citas/CitasTable'
import CitaModal from '@/components/citas/CitaModal'

export default function CitasClient({
  paciente,
  initialServicios = [],
  initialCitas = [],
}) {
  const pacienteId = paciente.id
  // hook "verdadero" que refresca en backend
  const {
    citas,
    loading: loadingCitas,
    error: errorCitas,
    refresh,
    createCita,
    updateCita,
    deleteCita,
  } = useCitas(pacienteId)

  // 1️⃣ Estado local que arranca con lo traído en SSR
  const [citasLoad, setCitasLoad] = useState(initialCitas)
  // y lo re‑sincronizamos cuando el hook trae nuevos datos
  useEffect(() => {
    if (!loadingCitas) {
      setCitasLoad(citas)
    }
  }, [citas, loadingCitas])

  const [servicios, setServicios] = useState(initialServicios)
  const [modalOpen, setModalOpen]       = useState(false)
  const [mensaje, setMensaje]           = useState('')
  const [selectedCita, setSelectedCita] = useState(null)
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [citaToDelete, setCitaToDelete] = useState(null)

  const formatearFechaHora = iso =>
    new Date(iso).toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  // Cuando monta, refresca hook y carga servicios si no vienen por props
  useEffect(() => {
    refresh()
    if (!initialServicios.length) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios`)
        .then(r => r.json())
        .then(setServicios)
        .catch(console.error)
    }
  }, [pacienteId, refresh, initialServicios])

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
      // el refresh dispara el hook y el efecto resetea citasLoad
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

  const handleRequestDelete = id => {
    const cita = citasLoad.find(c => c.id === id)
    setCitaToDelete(cita)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!citaToDelete) return
    await deleteCita(citaToDelete.id)
    setMensaje('Cita eliminada exitosamente')
    setTimeout(() => setMensaje(''), 3000)
    setConfirmOpen(false)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedCita(null)
  }

  return (
    <div>
      {mensaje && (
        <Alert
          severity={mensaje.includes('exitosamente') ? 'success' : 'error'}
          sx={{
            position: 'fixed',
            top: theme => theme.spacing(2),
            left: '50%',
            transform: 'translateX(-50%)',
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
              citas={citasLoad}
              servicios={servicios}
              formatearFechaHora={formatearFechaHora}
              onEdit={handleEdit}
              onDelete={handleRequestDelete}
            />
          )}
        </Grid>
      </Grid>

      <CitaModal
        open={modalOpen}
        onClose={handleCloseModal}
        servicios={servicios}
        onSave={handleSave}
        initialData={selectedCita}
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>¿Confirmas eliminar esta cita?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
