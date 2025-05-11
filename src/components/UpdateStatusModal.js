import React from 'react';
import {
  Box,
  Button,
  Modal,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

const statusOptions = ['Por Iniciar', 'En proceso', 'Terminado'];

const UpdateStatusModal = ({
  open,
  onClose,
  treatment,
  newStatus,
  setNewStatus,
  onSave,
}) => {
  return (
    <Modal open={open} onClose={onClose} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: '90%', maxWidth: 400 }}>
        <Typography variant="h6" mb={2}>
          Cambiar estado del tratamiento
        </Typography>
        <FormControl fullWidth>
          <InputLabel id="status-select-label">Estado</InputLabel>
          <Select
            labelId="status-select-label"
            value={newStatus}
            label="Estado"
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} variant="contained" color="primary">Guardar</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UpdateStatusModal;
