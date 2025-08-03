import React, { useState, useRef } from 'react';
import { Box, Button, Avatar, IconButton, Typography, CircularProgress, Alert, Modal } from '@mui/material';
import { CloudUpload, CameraAlt } from '@mui/icons-material';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import imageCompression from 'browser-image-compression';
import Webcam from 'react-webcam'; // NUEVO: Importar react-webcam

// NUEVO: Función para convertir la imagen de base64 (que nos da react-webcam) a un archivo.
const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};


export default function ProfilePictureUpload({ onChange, currentImage, isEdit }) {
  const [preview, setPreview] = useState(currentImage ?? null);
  const [showBtn, setShowBtn] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // CAMBIO: Ahora solo necesitamos una ref para el componente Webcam
  const webcamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const processFile = async (file) => {
    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }

    if (file.size / 1024 / 1024 > 1) {
      setAlertMessage('Ajustando imagen...');
      setIsCompressing(true);
    } else {
        setAlertMessage('');
    }

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);
      onChange(compressedFile);

      setAlertMessage('');
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      setAlertMessage('Ocurrió un error al procesar la imagen.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setShowBtn(true);
    processFile(file);
  };

  const handleDeleteImage = () => {
    setPreview(null);
    onChange(null);
    setShowBtn(false);
  };

  const handleOpenCamera = () => {
    setCameraOpen(true);
  };
  
  const handleCloseCamera = () => {
    setCameraOpen(false);
  };

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef?.current?.getScreenshot();
      if(imageSrc){
        const capturedFile = dataURLtoFile(imageSrc, 'captured_photo.jpg');
        processFile(capturedFile);
      }
    }
    handleCloseCamera();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 2,
        position: 'relative',
      }}
    >
      {/* (Esta parte del código no cambia) */}
      {isCompressing ? (
        <CircularProgress size={24} sx={{ mt: 1 }} />
      ) : (
        <>
          <Avatar
            src={preview || undefined}
            alt="Vista previa de la imagen de perfil"
            sx={{
              width: 100,
              height: 100,
              boxShadow: '0 0 0 2px #F5F7FB, 0 0 0 5px #B2C6FB',
              mb: 1,
            }}
          />
          {showBtn && currentImage && isEdit && (
            <IconButton
              size="small"
              color="warning"
              onClick={handleDeleteImage}
              sx={{
                position: 'absolute',
                top: 60, right: 120, backgroundColor: '#ffffff', zIndex: 1,
                '&:hover': { backgroundColor: '#f2f2f2', color: 'red' },
              }}
            >
              <DeleteForeverOutlinedIcon />
            </IconButton>
          )}
        </>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        {alertMessage ? (
          <Alert severity={isCompressing ? 'info' : 'error'} sx={{ mt: 2 }}>
            {alertMessage}
          </Alert>
        ) : (
          <>
            <Button
              variant="contained" color="info" size="small"
              component="label" startIcon={<CloudUpload />}
              title="Subir una nueva imagen"
            >
              {isEdit ? 'Cambiar' : 'Subir'}
              <input type="file" hidden onChange={handleFileChange} accept="image/*" />
            </Button>
            <Button
              variant="outlined" color="info" size="small"
              onClick={handleOpenCamera} startIcon={<CameraAlt />}
            >
              Tomar foto
            </Button>
          </>
        )}
      </Box>

      {/* CAMBIO: El Modal ahora contiene el componente Webcam */}
      <Modal open={cameraOpen} onClose={handleCloseCamera}>
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '500px',
            bgcolor: 'background.paper', boxShadow: 24, p: 2, borderRadius: 2,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Tomar Foto
          </Typography>
          
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{ facingMode: "environment" }}
            style={{ borderRadius: '8px' }}
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="secondary" onClick={handleCloseCamera}>
              Cancelar
            </Button>
            <Button variant="contained" color="primary" onClick={handleCapture}>
              Capturar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}