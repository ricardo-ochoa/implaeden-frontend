/* eslint-disable @next/next/no-img-element */
'use client';
import { use, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import SectionTitle from '@/components/SectionTitle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import 'lightgallery/css/lightgallery.css';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { useRandomAvatar } from '../../../../../lib/hooks/useRandomAvatar';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ShareIcon from '@mui/icons-material/Share';
import ModalServicio from '@/components/ModalServicio';
import usePatientTreatments from '../../../../../lib/hooks/usePatientTreatments';
import TreatmentCard from '@/components/TreatmentCard';


export default function Tratamientos({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const { treatments, loading, fetchPatientTreatments, deleteTreatment } = usePatientTreatments(id);

  const [patient, setPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordFiles, setNewRecordFiles] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);
  const [selectedService, setSelectedService] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const defaultAvatar = useRandomAvatar();

  const handleDeleteRecord = async () => {
    if (!recordToDelete || !recordToDelete.treatment_id) {
      console.error('recordToDelete no está definido o no tiene un treatment_id válido.');
      return;
    }
  
    console.log('Eliminando tratamiento con ID:', recordToDelete.treatment_id);
  
    try {
      await deleteTreatment(recordToDelete.treatment_id);
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
      setSnackbarMessage('Tratamiento eliminado exitosamente.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error al eliminar el tratamiento:', err);
      setSnackbarMessage('Error al eliminar el tratamiento.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`);
        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setPatient(data);
      } catch (err) {
        console.error('Error fetching patient:', err);
      }
    };

    if (id) fetchPatient();
  }, [id]);

  const handleMenuOpen = (event, record) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRecord(record);
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRecord(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewRecordDate('');
    setNewRecordFiles([]);
  };

  const handleSaveRecord = async () => {
    if (!newRecordDate || !selectedService) {
      return;
    }
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios/patient/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: selectedService,
          service_date: newRecordDate,
        }),
      });
  
      if (!response.ok) throw new Error('Error al guardar el tratamiento.');
      setIsModalOpen(false);
      setNewRecordDate('');
      setSelectedService('');
      fetchPatientTreatments();
    } catch (err) {
      console.error('Error al guardar el tratamiento:', err);
    }
  };

  const patientName = `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim();

  const avatarUrl = patient?.foto_perfil_url
    ? `${patient.foto_perfil_url}`
    : defaultAvatar;

  const existRecords = treatments.length > 0;

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8">
      {loading ? (
        <Typography variant="h5" gutterBottom>
          Cargando...
        </Typography>
      ) : (
        <SectionTitle
          title={`${patientName} - Tratamientos`}
          breadcrumbs={[
            { label: 'Pacientes', href: '/pacientes' },
            { label: patientName, href: `/pacientes/${id}` },
            { label: 'Tratamientos', href: `/pacientes/${id}/tratamientos` },
          ]}
        />
      )}

      <Box className="grid gap-4">
        {existRecords ? (
          <Typography variant="h6">Tratamientos registrados:</Typography>
        ) : (
          <Typography variant="h6">No hay tratamientos registrados:</Typography>
        )}

        <Box display="flex" flexWrap="wrap" gap={2}>
          { treatments.map((treatment, index) => (
              <TreatmentCard
              key={treatment.treatment_id}
              treatment={treatment}
              onMenuOpen={handleMenuOpen}
            />
          ))}

          <Button
            sx={{ width: { xs: '100%', md: '40%', lg: 300 } }}
            variant="outlined"
            onClick={() => setIsModalOpen(true)}
            startIcon={<UploadFileIcon />}
          >
            Agregar nuevo tratamiento
          </Button>
        </Box>
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {}}> <ShareIcon sx={{ mr: 1}} color='info'/> Compartir</MenuItem>
        <MenuItem
          onClick={() => {
            setRecordToDelete(menuRecord);
            setIsDeleteModalOpen(true);
            handleMenuClose();
          }}
        >
        <DeleteForeverIcon sx={{ mr: 1}} color='error'/>  Eliminar
        </MenuItem>
      </Menu>

      <ModalServicio
        open={isModalOpen}
        onClose={handleCloseModal}
        title={`Nuevo tratamiento para ${patient?.nombre} :`}
        newRecordDate={newRecordDate}
        setNewRecordDate={setNewRecordDate}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        handleSaveRecord={handleSaveRecord}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        title="Eliminar el tratamiento"
        description="¿Estás seguro de que quieres eliminar este tratamiento? Esta acción no se puede deshacer."
        onConfirm={handleDeleteRecord}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </div>
  );
}
