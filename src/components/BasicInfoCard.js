'use client';

import { Card, CardContent, Typography, Avatar, Box } from '@mui/material';

export default function BasicInfoCard({ patient }) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box className="flex items-center gap-4">
          <Avatar src={patient.foto_perfil_url} alt={`${patient.nombre} ${patient.apellidos}`} />
          <Typography variant="h6">{`${patient.nombre} ${patient.apellidos}`}</Typography>
        </Box>
        <Typography variant="body2">Teléfono: {patient.telefono}</Typography>
        <Typography variant="body2">Email: {patient.email}</Typography>
        <Typography variant="body2">Dirección: {patient.direccion}</Typography>
        {/* Agrega más campos según tu necesidad */}
      </CardContent>
    </Card>
  );
}
