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

  // Limpiar al cerrar
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
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '90%',
          maxWidth: 1200,
          height: '80vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header fijo */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            Subir evidencias
          </Typography>
        </Box>

        {/* Contenido scrollable */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
          }}
        >
          <FileUploadComponent
            accept="image/*,video/*"
            onFileUpload={(newFiles) => {
              // newFiles es un array de File: los acumulamos
              setFiles(prev => [...prev, ...newFiles]);
            }}
            />
        </Box>

        {/* Footer fijo */}
        <Box
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
          }}
        >
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
