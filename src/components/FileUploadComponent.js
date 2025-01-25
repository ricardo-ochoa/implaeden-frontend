'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Avatar } from '@mui/material';
import { Upload as UploadIcon, Delete as DeleteIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import imageCompression from 'browser-image-compression';

export default function FileUploadComponent({ onFileUpload }) {
  const [files, setFiles] = useState([]);

  const compressImage = async (file) => {
    try {
      const options = {
        maxSizeMB: 1, // Tamaño máximo en MB
        maxWidthOrHeight: 1920, // Máxima resolución
        useWebWorker: true, // Usar Web Workers para optimización
      };
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error al comprimir la imagen:', error);
      return file; // Si falla la compresión, devolver el archivo original
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const compressedFilesPromises = acceptedFiles.map(async (file) => {
        if (file.type.startsWith('image/')) {
          const compressedFile = await compressImage(file);
          return Object.assign(compressedFile, {
            preview: URL.createObjectURL(compressedFile),
          });
        }
        return Object.assign(file, {
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        });
      });

      const compressedFiles = await Promise.all(compressedFilesPromises);
      setFiles((prevFiles) => [...prevFiles, ...compressedFiles]);
      onFileUpload(compressedFiles);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
  });

  const removeFile = (index) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      const removedFile = updatedFiles.splice(index, 1)[0];
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updatedFiles;
    });
  };

  useEffect(() => {
    // Limpiar las URLs creadas cuando el componente se desmonta
    return () =>
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
  }, [files]);

  return (
    <Box className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <div {...getRootProps()} className="cursor-pointer mb-4">
        <input {...getInputProps()} />
        <Box className="text-center">
          <UploadIcon className="text-gray-400 mb-2" style={{ fontSize: 48 }} />
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            {isDragActive
              ? 'Suelta los archivos aquí'
              : 'Arrastra y suelta archivos aquí, o haz clic para seleccionar (PNG, JPG, PDF)'}
          </Typography>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#788BFF', fontWeight: '550' }}
            startIcon={<UploadFileIcon />}
          >
            Seleccionar Archivos
          </Button>
        </Box>
      </div>
      {files.length > 0 && (
        <List className="mt-4">
          {files.map((file, index) => (
            <ListItem key={index} className="bg-gray-100 rounded mb-2 flex items-center">
              {file.type.startsWith('image/') ? (
                <Avatar
                  variant="square"
                  sx={{ width: 56, height: 56 }}
                  src={file.preview}
                  alt={file.name}
                  className="mr-2"
                />
              ) : (
                <Avatar variant="square" className="mr-2" sx={{ width: 56, height: 56 }}>
                  <PdfIcon color="info" />
                </Avatar>
              )}
              <ListItemText
                primary={file.name}
                secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                className="flex-grow"
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete" onClick={() => removeFile(index)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}