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
          {patients?.map((patient) => (
            <TableRow
              key={patient.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => handleNavigateToDetails(patient.id)}
            >
              <TableCell sx={{ padding: '9px' }}>
                <Box className="flex items-center gap-2">
                  <Avatar
                    src={patient.foto_perfil_url || undefined}
                    alt={`${patient.nombre} ${patient.apellidos}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se dispare el evento del TableRow
                      handleNavigateToDetails(patient.id);
                    }}
                  />
                  <Typography sx={{ fontWeight: 550 }}>{`${patient.nombre} ${patient.apellidos}`}</Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 550, fontSize: 14, padding: '8px' }}>{patient.telefono}</TableCell>
              <TableCell sx={{ padding: '8px' }}>{patient.email}</TableCell>
              <TableCell align="right" sx={{ padding: '8px' }}>
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
