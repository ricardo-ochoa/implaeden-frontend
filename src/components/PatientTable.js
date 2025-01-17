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
import { useRandomAvatar } from '../../lib/hooks/useRandomAvatar';
import { useMemo } from 'react';

export default function PatientTable({ patients = [] }) {
  const router = useRouter();

  // Generar avatares aleatorios para pacientes que no tienen una foto de perfil
  const randomAvatar = useRandomAvatar(); // Llamar al hook una sola vez
  const patientsWithAvatars = useMemo(() => {
    return patients.map((patient) => ({
      ...patient,
      avatarUrl: patient.foto_perfil_url || randomAvatar,
    }));
  }, [patients, randomAvatar]);

  const handleNavigateToDetails = (patientId) => {
    router.push(`/pacientes/${patientId}`);
  };

  return (
    <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto', marginBottom: 2 }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ backgroundColor: "#F1F1F5", paddingX: "10px" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, padding: '10px' }}>NOMBRE</TableCell>
            <TableCell sx={{ fontWeight: 600, padding: '10px' }}>TELÉFONO</TableCell>
            <TableCell sx={{ fontWeight: 600, padding: '10px' }}>EMAIL</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, padding: '10px' }}>
              HISTORIAL CLÍNICO
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
              <TableCell sx={{ padding: '9px' }}>
                <Box className="flex items-center gap-2">
                  <Avatar
                    src={patient.avatarUrl}
                    alt={`${patient.nombre} ${patient.apellidos}`}
                    sx={{ cursor: 'pointer' }}
                    title={`Ver detalles de ${patient.nombre} ${patient.apellidos}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se dispare el evento del TableRow
                      handleNavigateToDetails(patient.id);
                    }}
                  />
                  <Typography sx={{ fontWeight: 550 }}>
                    {`${patient.nombre} ${patient.apellidos}`}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 550, fontSize: 14, padding: '8px' }}>
                {patient.telefono || 'N/A'}
              </TableCell>
              <TableCell sx={{ padding: '8px' }}>
                {patient.email || 'N/A'}
              </TableCell>
              <TableCell align="right" sx={{ padding: '8px' }}>
                <IconButton
                  size="small"
                  color="default"
                  title={`Ver historial clínico de ${patient.nombre}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que el clic navegue al detalle
                    // Agrega lógica adicional para ver historial clínico
                  }}
                >
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
