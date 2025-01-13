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
import { useRouter } from 'next/navigation';

export default function PatientTable({ patients }) {
  const router = useRouter();
  const handleNavigateToDetails = (patientId) => {
    router.push(`/pacientes/${patientId}`);
  };

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
            <TableRow
            key={patient.id}
            hover
            sx={{ cursor: 'pointer' }}
            onClick={() => handleNavigateToDetails(patient.id)}
          >
            <TableCell>
              <Box className="flex items-center gap-3">
                <Avatar
                  src={patient.foto_perfil_url || undefined}
                  alt={`${patient.nombre} ${patient.apellidos}`}
                  sx={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que se dispare el evento del TableRow
                    handleNavigateToDetails(patient.id);
                  }}
                />
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
