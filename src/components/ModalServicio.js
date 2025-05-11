import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import useServices from '../../lib/hooks/useServices';

const ModalServicio = ({
  open,
  onClose,
  title = 'Agregar servicio al paciente:',
  newRecordDate,
  setNewRecordDate,
  selectedService,
  setSelectedService,
  handleSaveRecord,
}) => {
  const { services, loading, error, fetchServices } = useServices();

  useEffect(() => {
    if (open) fetchServices();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90%',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography id="modal-title" variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          {title}
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: '550', mb: 1 }}>
          Fecha de inicio del tratamiento:
        </Typography>
        <TextField
          placeholder="Fecha del registro"
          type="date"
          fullWidth
          value={newRecordDate}
          onChange={(e) => setNewRecordDate(e.target.value)}
          sx={{ marginBottom: 2 }}
        />

        <Typography variant="subtitle2" sx={{ fontWeight: '550', mb: 1 }}>
          Selecciona el servicio:
        </Typography>
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <Select
            labelId="service-select-label"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            disabled={loading || error}
          >
            {loading ? (
              <MenuItem value="" disabled>
                Cargando servicios...
              </MenuItem>
            ) : error ? (
              <MenuItem value="" disabled>
                Error al cargar servicios
              </MenuItem>
            ) : (
              services.map((service) => (
                <MenuItem key={service.id} value={service.id}>
                  <span className='font-bold mr-1'>{service.name}</span> - {service.category}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
          <Button variant="outlined" onClick={onClose} color='error'>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRecord}
            size="large"
            fullWidth
            sx={{ maxWidth: '300px' }}
            disabled={!newRecordDate || !selectedService}
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalServicio;
