'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SectionTitle from '@/components/SectionTitle'
import { useCitas } from '../../../../../lib/hooks/useCitas'

export default function CitasClient({ paciente }) {
  // 1) Defino pacienteId antes de usar el hook
  const pacienteId = paciente.id
  const {
    citas,
    loading: loadingCitas,
    error: errorCitas,
    refresh,
    createCita,
  } = useCitas(pacienteId)

  // 2) Estado para el catálogo de servicios
  const [servicios, setServicios] = useState([])

  // 3) Formulario de nueva cita
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    appointment_at: '',
    service_id: '',
    observaciones: '',
  })
  const [mensaje, setMensaje] = useState('')

  // 4) Carga inicial: citas + catálogo de servicios
  useEffect(() => {
    if (!pacienteId) return
    refresh()
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios`)
      .then(r => r.json())
      .then(data => setServicios(data))
      .catch(console.error)
  }, [pacienteId, refresh])

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const handleGuardar = async () => {
    const { appointment_at, service_id } = form
    if (!appointment_at || !service_id) {
      setMensaje('Por favor complete fecha y tratamiento')
      return
    }
    try {
      await createCita(form)
      setMensaje('Cita guardada exitosamente')
      setModalOpen(false)
      setForm({ appointment_at: '', service_id: '', observaciones: '' })
    } catch {
      setMensaje('Error al guardar la cita')
    }
    setTimeout(() => setMensaje(''), 3000)
  }

  const formatearFechaHora = (iso) =>
    new Date(iso).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <Container className="py-8">
      <SectionTitle
        title={`Historial de Citas: ${paciente.nombre} ${paciente.apellidos}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: `${paciente.nombre} ${paciente.apellidos}`, href: `/pacientes/${pacienteId}` },
          { label: 'Citas' },
        ]}
      />

      {mensaje && (
        <Box mb={2}>
          <Alert severity={mensaje.includes('exitosamente') ? 'success' : 'error'}>
            {mensaje}
          </Alert>
        </Box>
      )}

      {errorCitas && (
        <Box mb={2}>
          <Alert severity="error">Error cargando citas: {errorCitas}</Alert>
        </Box>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" mb={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
            >
              Nueva Cita
            </Button>
          </Box>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Historial de Citas ({citas.length})
            </Typography>

            {loadingCitas ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : citas.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No hay citas registradas aún
                </Typography>
              </Box>
            ) : (
              <List>
                {citas.map((cita, idx) => {
                  // Encuentro el servicio en el catálogo
                  const svc = servicios.find(s => s.id === cita.service_id)
                  return (
                    <Box key={cita.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {`Cita #${idx + 1}: ${formatearFechaHora(cita.appointmentAt)}`}
                              </Typography>
                              <Typography
                                variant="body1"
                                color="primary"
                                sx={{ display: 'inline', fontWeight: "bold" }}
                              >
                                {cita.tratamiento}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              {cita.observaciones && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Observaciones:</strong> {cita.observaciones}
                                </Typography>
                              )}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.5, display: 'block' }}
                              >
                                Registrado: {formatearFechaHora(cita.createdAt)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {idx < citas.length - 1 && <Divider />}
                    </Box>
                  )
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Modal para nueva cita */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Registrar Nueva Cita</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              label="Fecha y Hora"
              type="datetime-local"
              value={form.appointment_at}
              onChange={handleChange('appointment_at')}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Tratamiento</InputLabel>
              <Select
                value={form.service_id}
                onChange={handleChange('service_id')}
                label="Tratamiento"
              >
                {servicios.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Observaciones"
              value={form.observaciones}
              onChange={handleChange('observaciones')}
              fullWidth
              margin="normal"
              multiline
              rows={4}
              placeholder="Comentarios adicionales..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar}>
            Guardar Cita
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
