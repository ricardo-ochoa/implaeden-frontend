// components/ModalServicio.js
import React, { useEffect } from 'react'
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import useServices from '../../lib/hooks/useServices'

export default function ModalServicio({
  open,
  onClose,
  title,
  newRecordDate,
  setNewRecordDate,
  selectedService,
  setSelectedService,
  initialCost,
  setInitialCost,
  handleSaveRecord,
}) {
  const { services, loading, error, fetchServices } = useServices()

  useEffect(() => {
    if (open) fetchServices()
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 2,
          maxWidth: 600,
          width: '90%',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>

        {/* Fecha */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Fecha de inicio:
        </Typography>
        <TextField
          type="date"
          fullWidth
          value={newRecordDate}
          onChange={(e) => setNewRecordDate(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Servicio */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Servicio:
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Servicio</InputLabel>
          <Select
            value={selectedService}
            label="Servicio"
            onChange={(e) => setSelectedService(e.target.value)}
            disabled={loading || Boolean(error)}
          >
            {loading && (
              <MenuItem value="" disabled>
                Cargando…
              </MenuItem>
            )}
            {error && (
              <MenuItem value="" disabled>
                Error al cargar
              </MenuItem>
            )}
            {!loading &&
              !error &&
              services.map((svc) => (
                <MenuItem key={svc.id} value={svc.id}>
                  <strong>{svc.name}</strong> — {svc?.category}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {/* Costo inicial */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Costo inicial (MXN):
        </Typography>
        <TextField
          type="number"
          fullWidth
          value={initialCost}
          onChange={(e) => setInitialCost(e.target.value)}
          sx={{ mb: 2 }}
          inputProps={{ min: 0, step: 0.01 }}
        />

        {/* Botones */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} color="error" variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveRecord}
            variant="contained"
            disabled={
              !newRecordDate || !selectedService || initialCost === ''
            }
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}
