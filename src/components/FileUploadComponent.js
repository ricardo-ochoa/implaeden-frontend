'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton,
  Modal
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Upload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import imageCompression from 'browser-image-compression';
import FilePreviewModal from './FilePreviewModal';

export default function FileUploadComponent({ onFileUpload }) {
  const [files, setFiles] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const compressImage = async (file) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      return await imageCompression(file, options);
    } catch {
      return file;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const processed = await Promise.all(
        acceptedFiles.map(async (file) => {
          const previewUrl = URL.createObjectURL(file);
          if (file.type.startsWith('image/')) {
            const compressed = await compressImage(file);
            URL.revokeObjectURL(previewUrl);
            const compressedPreview = URL.createObjectURL(compressed);
            return Object.assign(compressed, { preview: compressedPreview });
          } else if (file.type === 'application/pdf') {
            return Object.assign(file, { preview: previewUrl });
          }
          return null;
        })
      );
      const valid = processed.filter(Boolean);
      setFiles(prev => [...prev, ...valid]);
      onFileUpload(valid);
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
    setFiles(prev => {
      const upd = [...prev];
      const [removed] = upd.splice(index, 1);
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return upd;
    });
  };

  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });
    };
  }, []);
  

  return (
    <>
      <Box className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <div {...getRootProps()} className="cursor-pointer mb-4">
          <input {...getInputProps()} />
          <Box textAlign="center">
            <UploadIcon fontSize="large" color="action" />
            <Typography variant="h6" sx={{ my: 1 }}>
              {isDragActive
                ? 'Suelta los archivos aquí'
                : 'Arrastra o haz clic para seleccionar (PNG, JPG, PDF)'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              sx={{ backgroundColor: '#788BFF', fontWeight: 550 }}
            >
              Seleccionar Archivos
            </Button>
          </Box>
        </div>

        {files.length > 0 && (
          <List>
            {files.map((file, idx) => (
              <ListItem
                key={idx}
                className="bg-gray-100 rounded mb-2 flex items-center"
              >
                {/* thumbnail area */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    mr: 2,
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setPreviewFile(file);
                    setPreviewOpen(true);
                  }}
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <object
                      data={file.preview}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </Box>

                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />

                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removeFile(idx)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Preview Modal */}
      <FilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
      />
    </>
  );
}
