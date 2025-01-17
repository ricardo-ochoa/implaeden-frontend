import React, { useState } from 'react';
import { Box, Button, Avatar } from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';

export default function ProfilePictureUpload({ onChange, currentImage }) {
  const [preview, setPreview] = useState(currentImage ?? null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result); // Previsualizar la imagen
      };
      reader.readAsDataURL(file);
      onChange(file); // Notificar al formulario
    } else {
      setPreview(null);
      onChange(null); // Si no hay archivo, notificar null
    }
  };

  const handleDeleteImage = () => {
    setPreview(null); // Elimina la previsualización
    onChange(null); // Notificar al formulario que no hay imagen
  };  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
      <Avatar
        src={preview || undefined}
        alt="Vista previa de la imagen de perfil"
        sx={{ width: 100, height: 100, mb: 1 }}
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          color="error"
          startIcon={<Delete />}
          onClick={handleDeleteImage}
          title="Eliminar imagen actual"
        >
          Quitar
        </Button>
        <Button
          variant="contained"
          size="small"
          component="label"
          startIcon={<CloudUpload />}
          title="Subir una nueva imagen"
        >
          Cambiar
          <input
            type="file"
            hidden
            onChange={handleFileChange}
            accept="image/*"
          />
        </Button>
      </Box>
    </Box>
  );
}
