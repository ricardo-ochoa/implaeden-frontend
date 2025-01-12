'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Description } from '@mui/icons-material';

export default function PatientTable({ patients }) {

  return (
    <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto', marginBottom: 4 }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>NOMBRE</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>TELÉFONO</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>EMAIL</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              HISTORIAL CLÍNICO
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patients?.map((patient) => (
            <TableRow key={patient.id} hover sx={{ cursor: 'pointer' }}>
              <TableCell>
                <Box className="flex items-center gap-3">

                  <Box className="flex items-center gap-3">
                    {/* Mostrar imagen o iniciales */}
                    <Avatar src={patient.foto_perfil_url || undefined}>
                      {!patient.foto_perfil_url && `${patient.nombre[0]}${patient.apellidos[0]}`}
                    </Avatar>
                  </Box>

                  <Typography>{`${patient.nombre} ${patient.apellidos}`}</Typography>
                </Box>
              </TableCell>
              <TableCell>{patient.telefono}</TableCell>
              <TableCell>{patient.email}</TableCell>
              <TableCell align="right">
                <IconButton size="small" color="default">
                  <Description fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
