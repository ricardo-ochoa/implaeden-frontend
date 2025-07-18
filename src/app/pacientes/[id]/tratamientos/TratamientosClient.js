// src/app/pacientes/[id]/tratamientos/TratamientosClient.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import 'lightgallery/css/lightgallery.css';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ModalServicio from '@/components/ModalServicio';
import TreatmentCard from '@/components/TreatmentCard';
import UpdateStatusModal from '@/components/UpdateStatusModal';
import { useRandomAvatar } from '../../../../../lib/hooks/useRandomAvatar';
import usePatientTreatments from '../../../../../lib/hooks/usePatientTreatments';
import api from '../../../../../lib/api'; // import axios client

export default function TratamientosClient({ paciente }) {
  const router = useRouter();
  const { treatments, loading, fetchPatientTreatments, deleteTreatment } = usePatientTreatments(paciente.id);
  const [patient, setPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordFiles, setNewRecordFiles] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [initialCost, setInitialCost] = useState('');

  const defaultAvatar = useRandomAvatar();

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        // Usamos axios y api client para incluir token
        const { data } = await api.get(`/pacientes/${paciente.id}`);
        setPatient(data);
      } catch (err) {
        console.error('Error fetching patient:', err);
      }
    };
    if (paciente.id) fetchPatient();
  }, [paciente]);

  const handleDeleteRecord = async () => {
    if (!recordToDelete?.treatment_id) return;
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

  const handleMenuOpen = (event, record) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRecord(record);
  };
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
    if (!newRecordDate || !selectedService) return;
    try {
      await api.post(`/servicios/patient/${paciente.id}`, {
        service_id: selectedService,
        service_date: newRecordDate,
        total_cost: initialCost,
      });
      setIsModalOpen(false);
      setNewRecordDate('');
      setSelectedService('');
      setInitialCost('');
      fetchPatientTreatments();
    } catch (err) {
      console.error('Error al guardar el tratamiento:', err);
    }
  };

  const handleStatusClick = (treatment) => {
    setSelectedTreatment(treatment);
    setNewStatus(treatment.status || '');
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedTreatment?.treatment_id || !newStatus) return;
    try {
      await api.put(`/servicios/tratamientos/${selectedTreatment.treatment_id}/status`, { status: newStatus });
      setStatusModalOpen(false);
      setSelectedTreatment(null);
      fetchPatientTreatments();
      setSnackbarMessage('Estado actualizado correctamente.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setSnackbarMessage('Error al actualizar el estado.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const existRecords = treatments.length > 0;
  const handleCardClick = (treatmentId) => router.push(`/pacientes/${paciente.id}/tratamientos/${treatmentId}`);

  return (
    <div>
      <Box className="">
        {existRecords ? (
          <div className='flex w-full justify-between flex-wrap mb-8'>
          <Typography variant="h6">Tratamientos registrados:</Typography>
          <Button
            sx={{ width: { xs: '100%', md: '40%', lg: 300 }, mt:  { xs: 2, lg: 0 } }}
            variant="outlined"
            onClick={() => setIsModalOpen(true)}
            startIcon={<UploadFileIcon />}
          >
            Agregar nuevo tratamiento
          </Button>
          </div>
        ) : (
          <Typography variant="h6">No hay tratamientos registrados:</Typography>
        )}

        <Box display="flex" flexWrap="wrap" gap={2}>
          { treatments.map((treatment, index) => (
            <TreatmentCard
              key={treatment.treatment_id}
              treatment={treatment}
              onMenuOpen={handleMenuOpen}
              onClick={() => handleCardClick(treatment.treatment_id)}
              onStatusClick={handleStatusClick}
            />
          ))}

        </Box>
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
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
        initialCost={initialCost}  
        setInitialCost={setInitialCost}
        handleSaveRecord={handleSaveRecord}
        newRecordFiles={newRecordFiles}
        setNewRecordFiles={setNewRecordFiles}
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

      <UpdateStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        treatment={selectedTreatment}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        onSave={handleSaveStatus}
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