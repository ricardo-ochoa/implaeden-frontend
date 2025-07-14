import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, FormControl, InputLabel,
  Select, MenuItem,
} from '@mui/material'

export default function CitaModal({
  open, onClose, servicios, onSave, initialData = null
}) {
  const [form, setForm] = useState({
    appointment_at: '',
    service_id: '',
    observaciones: '',
  })

  // Helper para formatear la fecha a input datetime-local
  const toLocalDateTime = iso => {
    const dt = new Date(iso)
    const pad = n => String(n).padStart(2, '0')
    const YYYY = dt.getFullYear()
    const MM   = pad(dt.getMonth() + 1)
    const DD   = pad(dt.getDate())
    const hh   = pad(dt.getHours())
    const mm   = pad(dt.getMinutes())
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`
  }

  useEffect(() => {
    if (!open) return

    if (initialData) {
      setForm({
        appointment_at: toLocalDateTime(initialData.appointmentAt),
        service_id:     initialData.serviceId,
        observaciones:  initialData.observaciones || '',
      })
    } else {
      setForm({ appointment_at: '', service_id: '', observaciones: '' })
    }
  }, [open, initialData])

  const handleChange = field => e =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleGuardar = async () => {
    const ok = await onSave(form)
    if (ok) onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle style={{ fontWeight: "bold"}}>
        {initialData ? 'Editar Cita' : 'Registrar Nueva Cita'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            label="Fecha y Hora"
            type="datetime-local"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.appointment_at}
            onChange={handleChange('appointment_at')}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Tratamiento</InputLabel>
            <Select
              value={form.service_id}
              label="Tratamiento"
              onChange={handleChange('service_id')}
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
            fullWidth margin="normal" multiline rows={4}
            value={form.observaciones}
            onChange={handleChange('observaciones')}
            placeholder="Comentarios adicionales..."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleGuardar}>
          {initialData ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
