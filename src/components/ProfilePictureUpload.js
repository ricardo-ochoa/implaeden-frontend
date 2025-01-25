import React, { useState } from 'react';
import { Box, Button, Avatar, IconButton, Typography, CircularProgress, Alert } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import imageCompression from 'browser-image-compression';

export default function ProfilePictureUpload({ onChange, currentImage, isEdit }) {
  const [preview, setPreview] = useState(currentImage ?? null);
  const [showBtn, setShowBtn] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false); // Para controlar el estado de compresión
  const [alertMessage, setAlertMessage] = useState(''); // Controlar el mensaje del Alert

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    setShowBtn(true);

    if (file) {
      if (file.size / 1024 / 1024 > 1) { // Si el archivo es mayor a 1 MB
        setAlertMessage('Ajustando imagen...');
        setIsCompressing(true);
      }

      try {
        // Opciones para la compresión
        const options = {
          maxSizeMB: 1, // Tamaño máximo en MB
          maxWidthOrHeight: 1920, // Máxima resolución
          useWebWorker: true, // Usar Web Workers
        };

        // Comprimir la imagen si es necesario
        const compressedFile = await imageCompression(file, options);

        // Crear una previsualización con el archivo comprimido
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result); // Previsualizar la imagen comprimida
        };
        reader.readAsDataURL(compressedFile);

        // Notificar al formulario con el archivo comprimido
        onChange(compressedFile);

        // Limpiar el mensaje de alerta
        setAlertMessage('');
      } catch (error) {
        console.error('Error al comprimir la imagen:', error);
        setAlertMessage('Ocurrió un error al comprimir la imagen. Intenta nuevamente.');
      } finally {
        setIsCompressing(false); // Finalizar el estado de compresión
      }
    } else {
      setPreview(null);
      onChange(null); // Si no hay archivo, notificar null
    }
  };

  const handleDeleteImage = () => {
    setPreview(null); // Elimina la previsualización
    onChange(null); // Notificar al formulario que no hay imagen
    setShowBtn(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 2,
        position: 'relative', // Para que el botón se posicione relativo al contenedor
      }}
    >
      {/* Mostrar CircularProgress mientras se comprime */}
      {isCompressing ? (
          <CircularProgress
            size={24}
            sx={{ mt: 1 }}
          />
        ): (
          <>
          <Avatar
          src={preview || undefined}
          alt="Vista previa de la imagen de perfil"
          sx={{
            width: 100,
            height: 100,
            boxShadow: `
              0 0 0 2px #F5F7FB,
              0 0 0 5px #B2C6FB
            `,
            mb: 1,
          }}
        />
      {(showBtn && currentImage && isEdit) && (
        <IconButton
          size="small"
          color="warning"
          onClick={handleDeleteImage}
          sx={{
            position: 'absolute',
            top: 60,
            right: 120,
            backgroundColor: '#ffffff',
            zIndex: 1,
            '&:hover': {
              backgroundColor: '#f2f2f2',
              color: 'red',
            },
          }}
        >
          <DeleteForeverOutlinedIcon />
        </IconButton>
      )}
                
                </>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>

      {alertMessage ? (
          <Alert
            severity={isCompressing ? 'info' : 'error'}
            sx={{ mt: 2 }}
          >
            {alertMessage}
          </Alert>
        ):(
        <Button
          variant="contained"
          color="info"
          size="small"
          component="label"
          startIcon={<CloudUpload />}
          title="Subir una nueva imagen"
        >
          {isEdit ? 'Cambiar' : 'Agregar imagen'}
          <input
            type="file"
            hidden
            onChange={handleFileChange}
            accept="image/*"
          />
        </Button>
        )}

      </Box>
    </Box>
  );
}
