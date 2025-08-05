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
  Button,
} from '@mui/material';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import { useRouter } from 'next/navigation';
import { useRandomAvatar } from '../../lib/hooks/useRandomAvatar';
import { useMemo } from 'react';

export default function PatientTable({ patients = [] }) {
  const router = useRouter();

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
          {/* --- CONDICIÓN PARA LISTA VACÍA --- */}
          {patientsWithAvatars.length > 0 ? (
            patientsWithAvatars.map((patient) => (
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
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditCalendarIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToCitas(patient.id);
                    }}
                  >
                    Ver citas
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Box sx={{ py: 4 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    No se encontró ningún paciente.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}