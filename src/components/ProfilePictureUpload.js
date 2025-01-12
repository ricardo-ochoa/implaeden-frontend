import React, { useState } from 'react';
import { Box, Button, Avatar } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export default function ProfilePictureUpload({ onChange }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result); // Para previsualizar la imagen
      };
      reader.readAsDataURL(file);
      onChange(file); // Aquí se pasa el archivo al formulario
    } else {
      setPreview(null);
      onChange(null); // Si no hay archivo, pasar null
    }
  };  
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
      <Avatar
        src={preview || undefined}
        sx={{ width: 100, height: 100, mb: 1 }}
      />
      <Button
        variant="contained"
        size='small'
        component="label"
        startIcon={<CloudUpload />}
      >
        Foto de perfil
        <input
          type="file"
          hidden
          onChange={handleFileChange}
          accept="image/*"
        />
      </Button>
    </Box>
  );
}
