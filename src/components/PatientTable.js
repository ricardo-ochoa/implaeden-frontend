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
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import { useRouter } from 'next/navigation';
import { useRandomAvatar } from '../../lib/hooks/useRandomAvatar';
import { useMemo } from 'react';

export default function PatientTable({ patients = [] }) {
  const router = useRouter();

  // Generar avatares aleatorios
  const randomAvatar = useRandomAvatar();
  const patientsWithAvatars = useMemo(
    () =>
      patients.map((patient) => ({
        ...patient,
        avatarUrl: patient.foto_perfil_url || randomAvatar,
      })),
    [patients, randomAvatar]
  );

  const handleNavigateToDetails = (patientId) => {
    router.push(`/pacientes/${patientId}`);
  };

  const handleNavigateToCitas = (patientId) => {
    router.push(`/pacientes/${patientId}/citas`);
  };

  return (
    <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto', mb: 2 }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ backgroundColor: "#F1F1F5", px: 1 }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, p: '10px' }}>NOMBRE</TableCell>
            <TableCell sx={{ fontWeight: 600, p: '10px' }}>TELÉFONO</TableCell>
            <TableCell sx={{ fontWeight: 600, p: '10px' }}>EMAIL</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, p: '10px' }}>
              CITAS
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patientsWithAvatars.map((patient) => (
            <TableRow
              key={patient.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => handleNavigateToDetails(patient.id)}
            >
              <TableCell sx={{ p: '9px' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar
                    src={patient.avatarUrl}
                    alt={`${patient.nombre} ${patient.apellidos}`}
                    sx={{ cursor: 'pointer' }}
                    title={`Ver detalles de ${patient.nombre} ${patient.apellidos}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToDetails(patient.id);
                    }}
                  />
                  <Typography sx={{ fontWeight: 550 }}>
                    {`${patient.nombre} ${patient.apellidos}`}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ typography: 'body1', fontWeight: 550, p: '8px' }}>
                {patient.telefono || 'N/A'}
              </TableCell>
              <TableCell sx={{ p: '8px', typography: 'body1', fontWeight: 550 }}>
                {patient.email || 'N/A'}
              </TableCell>
              <TableCell align="right" sx={{ p: '8px' }}>
                <IconButton
                  size="small"
                  color="default"
                  title={`Ver historial de citas de ${patient.nombre}`}
                  onClick={(e) => {
                    e.stopPropagation(); // no dispare onClick del row
                    handleNavigateToCitas(patient.id);
                  }}
                >
                  <EditCalendarIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
