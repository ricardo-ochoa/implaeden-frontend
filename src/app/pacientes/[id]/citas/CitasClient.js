'use client'

import { useState } from 'react'
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
  IconButton,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SectionTitle from '@/components/SectionTitle'

export default function CitasClient({ paciente }) {
  const pacienteId = paciente.id || ''
  const [citas, setCitas] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [nuevaCita, setNuevaCita] = useState({
    fechaHora: '',
    tratamiento: '',
    notas: '',
  })
  const [mensaje, setMensaje] = useState('')

  const handleInputChange = (field) => (e) => {
    setNuevaCita((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleGuardar = () => {
    if (!nuevaCita.fechaHora || !nuevaCita.tratamiento.trim()) {
      setMensaje('Por favor complete la fecha y el tratamiento')
      return
    }

    const cita = {
      id: Date.now(),
      fechaHora: nuevaCita.fechaHora,
      tratamiento: nuevaCita.tratamiento.trim(),
      notas: nuevaCita.notas.trim(),
      creadoEn: new Date(),
    }

    setCitas((prev) => [cita, ...prev])
    setModalOpen(false)
    setNuevaCita({ fechaHora: '', tratamiento: '', notas: '' })
    setMensaje('Cita guardada exitosamente')
    setTimeout(() => setMensaje(''), 3000)
  }

  const formatearFechaHora = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
        <Box mb={2}>
          <Alert severity={mensaje.includes('exitosamente') ? 'success' : 'error'}>
            {mensaje}
          </Alert>
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

            {citas.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No hay citas registradas aún
                </Typography>
              </Box>
            ) : (
              <List>
                {citas.map((cita, idx) => (
                  <Box key={cita.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="subtitle1" component="span" fontWeight="bold">
                              {cita.tratamiento}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="primary"
                              sx={{ ml: 2, display: 'inline' }}
                            >
                              {formatearFechaHora(cita.fechaHora)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {cita.notas && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Notas:</strong> {cita.notas}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 0.5, display: 'block' }}
                            >
                              Registro de cita: {cita.creadoEn.toLocaleString('es-ES')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {idx < citas.length - 1 && <Divider />}
                  </Box>
                ))}
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
              value={nuevaCita.fechaHora}
              onChange={handleInputChange('fechaHora')}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Tratamiento"
              value={nuevaCita.tratamiento}
              onChange={handleInputChange('tratamiento')}
              fullWidth
              margin="normal"
              required
              placeholder="Ej: Limpieza dental, Consulta general..."
            />
            <TextField
              label="Notas"
              value={nuevaCita.notas}
              onChange={handleInputChange('notas')}
              fullWidth
              margin="normal"
              multiline
              rows={4}
              placeholder="Observaciones adicionales..."
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
    </div>
  )
}
