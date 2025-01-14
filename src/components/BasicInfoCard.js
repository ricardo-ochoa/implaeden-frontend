'use client';

import React, { useState } from 'react';
import { Card, CardContent, Typography, Avatar, Box, Snackbar, Alert, Button } from '@mui/material';
import { format, parseISO, differenceInYears } from 'date-fns';

export default function BasicInfoCard({ patient }) {
  // Parsear la fecha de nacimiento y calcular la edad
  const fechaNacimiento = parseISO(patient.fecha_nacimiento);
  const edad = differenceInYears(new Date(), fechaNacimiento);
  const fechaFormateada = format(fechaNacimiento, 'dd/MM/yyyy');

  // Estado para el Alert
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Función para copiar al portapapeles
  const handleCopyToClipboard = (value) => {
    navigator.clipboard.writeText(value).then(() => {
      setSnackbarMessage(`${value} se ha copiado`);
      setSnackbarOpen(true);
    });
  };

  // Información para mapeo
  const patientDetails = [
    { label: 'Fecha de nacimiento', value: fechaFormateada },
    { label: 'Edad', value: `${edad} años` },
    {
      label: 'Teléfono',
      value: patient.telefono,
      onClick: () => handleCopyToClipboard(patient.telefono),
    },
    {
      label: 'Email',
      value: patient.email,
      onClick: () => handleCopyToClipboard(patient.email),
    },
    { label: 'Dirección', value: patient.direccion },
  ];

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: '10px',
        padding: '0px',
        backgroundColor:"#F5F7FB",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: {xs: "column", md: "row"},
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box
          sx={{
            flexBasis: { xs: '100%', md: '100%' },
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Avatar
            src={patient.foto_perfil_url}
            alt={`${patient.nombre} ${patient.apellidos}`}
            sx={{
              width: 100,
              height: 100,
              boxShadow: `
                0 0 0 2px #FFFFFF, /* Borde blanco */
                0 0 0 5px #B2C6FB   /* Borde azul */
              `,
            }}
          />
          <Button
            variant="outlined"
            color="info"
            size="small"
            sx={{
              fontWeight: 550,
              textTransform: 'none',
            }}
            onClick={() => {
              console.log('Editar información');
              // Aquí puedes agregar la lógica para la edición
            }}
          >
            Editar
          </Button>
        </Box>

        {/* Información del paciente */}
        <Box
          sx={{
            flexBasis: { xs: '100%', md: '100%' }, // 3 columnas en desktop, 100% en mobile
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {`${patient.nombre} ${patient.apellidos}`}
          </Typography>
          {patientDetails.map((detail, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {detail.label}:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  cursor: detail.onClick ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease, color 0.2s ease',
                  '&:hover': detail.onClick
                    ? {
                        transform: 'scale(1.1)',
                        color: '#0D50A0',
                      }
                    : undefined,
                }}
                onClick={detail.onClick}
              >
                {detail.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Snackbar para el feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}
