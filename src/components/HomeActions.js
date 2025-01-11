'use client';

import { Box, Button, TextField, useMediaQuery } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function HomeActions({ searchTerm, setSearchTerm, onAddPatient }) {
  const theme = useTheme(); // Obtener el tema para media queries
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detectar pantallas móviles

  return (
    <Box
      className="flex gap-4 mb-6 justify-between"
      sx={{
        flexDirection:'row',
      }}
    >
      <TextField
        fullWidth
        placeholder="Buscar paciente"
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
        onClick={onAddPatient}
      >
        {isMobile ? 'Nuevo' : 'Agregar nuevo paciente'}
      </Button>
    </Box>
  );
}
