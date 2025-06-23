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
  IconButton
} from '@mui/material';
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
            // comprime la imagen
            const compressed = await compressImage(file);
            URL.revokeObjectURL(previewUrl);
            const compressedPreview = URL.createObjectURL(compressed);
            return Object.assign(compressed, { preview: compressedPreview });
          }

          if (file.type === 'application/pdf') {
            return Object.assign(file, { preview: previewUrl });
          }

          if (file.type.startsWith('video/')) {
            // vídeo: no compress, solo preview
            return Object.assign(file, { preview: previewUrl });
          }

          // formato no soportado
          URL.revokeObjectURL(previewUrl);
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
      'image/*': [],
      'application/pdf': [],
      'video/*': [],
    }
  });

  const removeFile = (index) => {
    setFiles(prev => {
      const upd = [...prev];
      const [removed] = upd.splice(index, 1);
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return upd;
    });
  };

  // cleanup de previews al desmontar
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [files]);

  return (
    <>
      <Box sx={{ p:4, border:'2px dashed #ccc', borderRadius:1 }}>
        <div {...getRootProps()} style={{ cursor:'pointer', marginBottom:16 }}>
          <input {...getInputProps()} />
          <Box textAlign="center">
            <UploadIcon fontSize="large" color="action" />
            <Typography variant="h6" sx={{ my:1 }}>
              {isDragActive
                ? 'Suelta los archivos aquí'
                : 'Arrastra o haz clic para seleccionar (PNG, JPG, PDF, MP4...)'}
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
              <ListItem key={idx} sx={{ bgcolor:'#f5f5f5', mb:1, borderRadius:1 }}>
                <Box
                  sx={{
                    width:56, height:56, mr:2, border:'1px solid #ccc',
                    borderRadius:1, overflow:'hidden', cursor:'pointer'
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
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    />
                  ) : file.type === 'application/pdf' ? (
                    <object
                      data={file.preview}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      style={{ pointerEvents:'none' }}
                    />
                  ) : (
                    <video
                      src={file.preview}
                      muted
                      loop
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
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
