'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, CircularProgress, Alert, Snackbar } from '@mui/material';
import { PatientProvider } from '@/context/PatientContext';
import PatientTable from '@/components/PatientTable';
import PaginationControl from '@/components/PaginationControl';
import HomeActions from '@/components/HomeActions';
import AddPatientModal from '@/components/AddPatientModal'; // Modal para agregar paciente
import useSavePatient from '../../../lib/hooks/useSavePatient';
import { CheckCircleOutline } from '@mui/icons-material';
import { usePatients } from '../../../lib/hooks/usePatients';

export default function PatientManagementClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal
  const [showAlert, setShowAlert] = useState(false);     // Alert de éxito
  const { savePatient, loading: saving, error: saveError } = useSavePatient();
  const { patients, totalPages, loading, error, refreshPatientsList } = usePatients(page, searchTerm);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleAddPatient = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSavePatient = async (formData) => {
    await savePatient(formData);
    setIsModalOpen(false);
    setShowAlert(true);
    refreshPatientsList();
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <PatientProvider>
      <main>
          <HomeActions
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddPatient={handleAddPatient}
          />

          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          {!loading && !error && <PatientTable patients={patients} />}

          <PaginationControl
            page={page}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
      </main>

      <Snackbar open={showAlert} autoHideDuration={3000}>
        <Alert icon={<CheckCircleOutline fontSize="inherit" />} severity="success">
          Paciente agregado exitosamente.
        </Alert>
      </Snackbar>

      <AddPatientModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePatient}
      />
    </PatientProvider>
  );
}
