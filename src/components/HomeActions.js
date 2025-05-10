'use client';

import React from 'react';
import { Box, Button, TextField, useMediaQuery } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function HomeActions({ searchTerm, setSearchTerm, onAddPatient }) {
  const theme = useTheme(); // Asegúrate de que ThemeProvider está envolviendo la app
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detectar pantallas móviles

  return (
    <Box
      className="flex gap-4 mb-6 justify-between"
      sx={{
        flexDirection: 'row',
      }}
    >
      <TextField
        fullWidth
        placeholder="Buscar por nombre, teléfono o email"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-white max-w-[500px]"
      />
      <Button
        variant="contained"
        startIcon={<Add />}
        className="whitespace-nowrap max-w-[240px]"
        style={{fontWeight: 550}}
        onClick={onAddPatient}
      >
        {isMobile ? 'Nuevo' : 'Agregar nuevo paciente'}
      </Button>
    </Box>
  );
}
