'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Modal,
  Typography
} from '@mui/material';
import FileUploadComponent from '@/components/FileUploadComponent';

/**
 * Modal especializado para cargar evidencias (fotos/videos).
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onUpload: (files: File[]) => Promise<void>
 */
export default function UploadEvidencesModal({ open, onClose, onUpload }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Cuando se cierra el modal, limpiamos
  useEffect(() => {
    if (!open) {
      setFiles([]);
    }
  }, [open]);

  const handleSave = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      await onUpload(files);
      setFiles([]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box
        sx={{
          maxWidth: 600,
          width: '90%',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 2,
          outline: 'none',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Subir evidencias
        </Typography>

        {/* Le pasamos el accept para imágenes y vídeos */}
        <FileUploadComponent
          accept="image/*,video/*"
          onFileUpload={setFiles}
        />

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!files.length || uploading}
          >
            {uploading ? 'Subiendo…' : 'Subir'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
