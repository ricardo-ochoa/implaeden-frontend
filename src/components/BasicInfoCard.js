'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Avatar, Box, Snackbar, Alert, Button, Skeleton } from '@mui/material';
import { format, parseISO, differenceInYears } from 'date-fns';
import EditPatientModal from './EditPatientModal';
import { useRandomAvatar } from '../../lib/hooks/useRandomAvatar';
import { Edit } from '@mui/icons-material';
import ImageDetailModal from './ImageDetailModal';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function BasicInfoCard({ patient: initialPatient, onPatientUpdate }) {
  const [patient, setPatient] = useState(initialPatient);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialPatient); // Estado para manejar el loading
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const defaultAvatar = useRandomAvatar(); // Genera un avatar aleatorio si no hay imagen


const handleAvatarClick = () => {
  setIsImageModalOpen(true);
};
  // Sincronizar el estado local con los cambios en initialPatient
  useEffect(() => {
    if (initialPatient) {
      setPatient(initialPatient);
      setIsLoading(false);
    }
  }, [initialPatient]);

  const fechaNacimiento = patient?.fecha_nacimiento
    ? parseISO(patient.fecha_nacimiento)
    : null;
  const edad = fechaNacimiento ? differenceInYears(new Date(), fechaNacimiento) : 'N/A';
  const fechaFormateada = fechaNacimiento ? format(fechaNacimiento, 'dd/MM/yyyy') : 'N/A';

  const handleCopyToClipboard = (value) => {
    navigator.clipboard.writeText(value).then(() => {
      setSnackbarMessage(`${value} se ha copiado`);
      setSnackbarOpen(true);
    });
  };

  const patientDetails = [
    { label: 'Fecha de nacimiento', value: fechaFormateada },
    { label: 'Edad', value: `${edad} años` },
    {
      label: 'Teléfono',
      value: patient?.telefono || 'N/A',
      onClick: () => handleCopyToClipboard(patient.telefono),
    },
    {
      label: 'Email',
      value: patient?.email || 'N/A',
      onClick: () => handleCopyToClipboard(patient.email),
    },
    { label: 'Dirección', value: patient?.direccion || 'N/A' },
  ];

  const handleUpdateSuccess = (updatedPatient) => {
    setSnackbarOpen(false);
    setTimeout(() => {
      setPatient((prevPatient) => ({
        ...prevPatient,
        ...updatedPatient,
      }));
      if (onPatientUpdate) {
        onPatientUpdate(updatedPatient); // Notificar al padre
      }
      setSnackbarMessage('Paciente actualizado exitosamente');
      setSnackbarOpen(true);
      setIsModalOpen(false);
    }, 200);
  };  
  

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPatient(initialPatient);
  };

  const avatarUrl = patient?.foto_perfil_url
  ? `${patient.foto_perfil_url}`
  : defaultAvatar;
  
  return (
    <>
      <Card
        elevation={2}
        sx={{
          borderRadius: '10px',
          padding: '0px',
          backgroundColor: '#F5F7FB',
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box
            sx={{
              flexBasis: { xs: '100%', md: '100%' },
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {isLoading ? (
              <Skeleton variant="circular" width={100} height={100} />
            ) : (
                <Avatar
                  src={avatarUrl}
                  alt={`${patient?.nombre} ${patient?.apellidos}`}
                  onClick={handleAvatarClick}
                  sx={{
                    width: 100,
                    height: 100,
                    boxShadow: `
                      0 0 0 2px #F5F7FB,
                      0 0 0 5px #B2C6FB
                    `,
                    cursor: 'pointer',
                  }}
                />
            )}
            <Button
              variant="outlined"
              color="info"
              size="small"
              sx={{
                fontWeight: 550,
                textTransform: 'none',
              }}
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading} // Deshabilitar si está cargando
              startIcon={<Edit />}
            >
              Editar
            </Button>
          </Box>

          <Box
            sx={{
              flexBasis: { xs: '100%', md: '100%' },
            }}
          >
            {isLoading ? (
              <>
                <Skeleton width="60%" height={30} />
                <Skeleton width="80%" height={20} />
                <Skeleton width="50%" height={20} />
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {`${patient?.nombre} ${patient?.apellidos}`}
                </Typography>
                {patientDetails.map((detail, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {detail.label}:
                    </Typography>
                  
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        cursor: detail.onClick ? 'pointer' : 'default',
                        transition: 'transform 0.2s ease, color 0.2s ease',
                        '&:hover': detail.onClick
                          ? {
                              transform: 'scale(1.1)',
                              color: '#0D50A0',
                            }
                          : undefined,
                      }}
                      onClick={detail.onClick}
                    >
                      {
                      detail.onClick && (<ContentCopyIcon size="small" onClick={detail.onClick} sx={{ marginRight: 1, width: "18px"}} />)
                    }
                      {detail.value || 'N/A'}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </Box>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
          >
            <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <EditPatientModal
        open={isModalOpen}
        onClose={handleModalClose}
        patient={patient}
        onSuccess={handleUpdateSuccess}
      />

      <ImageDetailModal
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={avatarUrl}
        altText={`${patient?.nombre} ${patient?.apellidos}`}
      />
    </>
  );
}
