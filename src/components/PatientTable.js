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
      <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto',  marginBottom: 4}}>
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
            {patients.map((patient) => (
              <TableRow key={patient.id} hover sx={{ cursor:"pointer"}}>
                <TableCell>
                  <Box className="flex items-center gap-3">
                    <Avatar>{patient.name[0]}</Avatar>
                    <Typography>{patient.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{patient.phone}</TableCell>
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
