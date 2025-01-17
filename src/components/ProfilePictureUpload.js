import React, { useState } from 'react';
import { Box, Button, Avatar, IconButton } from '@mui/material';
import { CloudUpload, Delete, DeleteOutline } from '@mui/icons-material';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';

export default function ProfilePictureUpload({ onChange, currentImage, isEdit }) {
  const [preview, setPreview] = useState(currentImage ?? null);
  const [showBtn, setShowBtn] = useState(true);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setShowBtn(true)
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
    setShowBtn(false)
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
      mb: 1
    }}
  />
  {
    (showBtn && currentImage && isEdit) && (
    <IconButton
      size="small"
      color='warning'
      onClick={handleDeleteImage}
      sx={{
        position: 'absolute',
        top: 60,
        right: 120,
        backgroundColor: "#ffffff",
        zIndex: 1,
        '&:hover': {
          backgroundColor: "#f2f2f2",
          color: "red",
        },
      }}
    >
      <DeleteForeverOutlinedIcon />
    </IconButton>
    )
  }
  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
    <Button
    variant="contained"
    color="info"
    size="small"
    component="label"
    startIcon={<CloudUpload />}
    title="Subir una nueva imagen"
  >
    {isEdit ? "Cambiar" : "Agregar imagen"}
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
