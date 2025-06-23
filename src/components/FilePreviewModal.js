'use client';

import React from 'react';
import { Modal, Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function FilePreviewModal({ open, onClose, file }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '80vw',
          height: '90vh',
          bgcolor: 'black',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Botón de cerrar */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.3)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
            color: '#fff',
          }}
        >
          <CloseIcon />
        </IconButton>

        {file && file.type.startsWith('image/') ? (
          <img
            src={file.preview}
            alt={file.name || 'preview'}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : file ? (
          <object
            data={file.preview}
            type="application/pdf"
            width="96%"
            height="100%"
            style={{ backgroundColor: '#000' }}
          >
            <Typography sx={{ p: 2, color: '#fff' }}>
              No se puede mostrar el PDF.
            </Typography>
          </object>
        ) : null}
      </Box>
    </Modal>
  );
}
