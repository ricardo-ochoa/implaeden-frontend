import React from 'react';
import {
  Box,
  Button,
  Modal,
  Typography,
} from '@mui/material';

const ConfirmDeleteModal = ({ open, onClose, title, description, onConfirm }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: '500px',
          width: '90%',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 2,
          boxShadow: 24,
        }}
      >
        <Typography
          id="confirm-delete-title"
          variant="h6"
          sx={{ fontWeight: 'bold', mb: 2 }}
        >
          {title}
        </Typography>
        <Typography
          id="confirm-delete-description"
          variant="body1"
          sx={{ mb: 3 }}
        >
          {description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onConfirm}
            sx={{ fontWeight: 'bold' }}
          >
            Sí, Eliminar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ConfirmDeleteModal;
