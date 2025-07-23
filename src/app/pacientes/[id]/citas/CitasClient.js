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
import useSWR from 'swr'
import api, { fetcher } from '../../../../../lib/api'

export default function CitasClient({
  paciente,
  initialServicios = [],
  initialCitas = [],
}) {
  const pacienteId = paciente.id

  // 1. SWR reemplaza a `useCitas` y al estado local `citasLoad`
  const {
    data: citas, // `data` de SWR es ahora nuestra lista de citas
    error: errorCitas,
    isLoading: loadingCitas,
    mutate, // La función para refrescar los datos
  } = useSWR(
    `/pacientes/${pacienteId}/citas`,
    fetcher,
    { fallbackData: initialCitas } // Usa los datos del servidor para la carga inicial
  )

  // El resto de los estados de la UI se mantienen
  const [servicios] = useState(initialServicios) // Los servicios no cambian, un useState simple es suficiente
  const [modalOpen, setModalOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [selectedCita, setSelectedCita] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [citaToDelete, setCitaToDelete] = useState(null)

  const formatearFechaHora = (isoString) => {
    // 1. Verifica si el valor de entrada es nulo o indefinido
    if (!isoString) {
      return 'Fecha no disponible';
    }

    const fecha = new Date(isoString);

    // 2. Verifica si la fecha creada es válida
    if (isNaN(fecha.getTime())) {
      return 'Fecha inválida';
    }

    // 3. Si todo es correcto, formatea la fecha
    return fecha.toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // 2. Simplificamos los handlers para usar `api` y `mutate`
const handleSave = async form => {
  const { appointment_at, service_id } = form;
  if (!appointment_at || !service_id) {
    setMensaje('Por favor complete fecha y tratamiento');
    return false;
  }

  try {
    // --- CORRECCIÓN AQUÍ ---
    const promise = selectedCita
      // La URL de PUT debe incluir el ID del paciente para coincidir con el backend
      ? api.put(`/pacientes/${pacienteId}/citas/${selectedCita.id}`, form)
      // La URL de POST ya era correcta
      : api.post(`/pacientes/${pacienteId}/citas`, form);
    
    await promise;
    
    mutate(); // Refresca los datos con SWR
    
    setMensaje(selectedCita ? 'Cita actualizada exitosamente' : 'Cita creada exitosamente');
    handleCloseModal();
    return true;
  } catch (err) {
    setMensaje('Error guardando la cita');
    return false;
  } finally {
    setTimeout(() => setMensaje(''), 3000);
  }
}

  const handleEdit = cita => {
    setSelectedCita(cita);
    setModalOpen(true);
  }

  const handleRequestDelete = id => {
    const cita = citas.find(c => c.id === id);
    setCitaToDelete(cita);
    setConfirmOpen(true);
  }

const handleConfirmDelete = async () => {
  if (!citaToDelete) return;
  try {
    await api.delete(`/pacientes/${pacienteId}/citas/${citaToDelete.id}`);
    mutate(); // Refresca los datos con SWR
    setMensaje('Cita eliminada exitosamente');
  } catch (err) {
    setMensaje('Error eliminando la cita');
  } finally {
    setTimeout(() => setMensaje(''), 3000);
    setConfirmOpen(false);
  }
};

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCita(null);
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
              citas={citas || []}
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
