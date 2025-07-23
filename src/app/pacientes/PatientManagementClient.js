'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, CircularProgress, Alert, Snackbar } from '@mui/material';
import { PatientProvider } from '@/context/PatientContext';
import PatientTable from '@/components/PatientTable';
import PaginationControl from '@/components/PaginationControl';
import HomeActions from '@/components/HomeActions';
import AddPatientModal from '@/components/AddPatientModal';
import useSavePatient from '../../../lib/hooks/useSavePatient';
import { CheckCircleOutline } from '@mui/icons-material';
import useSWR from 'swr'; // 1. Imports Faltantes
import { fetcher } from '../../../lib/api'; 

// 2. Recibir `initialData` como prop
export default function PatientManagementClient({ initialData }) { 
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  const { savePatient, loading: saving, error: saveError } = useSavePatient();
  
  const { 
    data, 
    error, 
    isLoading, 
    mutate 
  } = useSWR(
    `/pacientes?page=${page}&search=${searchTerm}`,
    fetcher,
    { 
      // Usa los datos iniciales del servidor para la primera carga
      fallbackData: (page === 1 && !searchTerm) ? initialData : undefined 
    }
  );

  // 3. Derivar datos de SWR
  const patients = data?.patients ?? [];
  const totalPages = data?.totalPages ?? 1;

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
    const newPatient = await savePatient(formData);
    if (newPatient) {
      setIsModalOpen(false);
      setShowAlert(true);
      mutate(); // 4. Usar mutate para refrescar
      setTimeout(() => setShowAlert(false), 3000);
    }
    // Se eliminó la llamada a refreshPatientsList() que ya no existe
  };

  return (
    <PatientProvider>
      <main>
          <HomeActions
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddPatient={handleAddPatient}
          />

          {isLoading && <CircularProgress />}
          {error && <Alert severity="error">Error al cargar pacientes.</Alert>}
          
          {/* Usamos las variables `isLoading` y `error` de SWR */}
          {!isLoading && !error && <PatientTable patients={patients} />}

          <PaginationControl
            page={page}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
      </main>

      {/* Snackbar y Modal sin cambios */}
      <Snackbar open={showAlert} autoHideDuration={3000}>
        <Alert icon={<CheckCircleOutline fontSize="inherit" />} severity="success">
          Paciente agregado exitosamente.
        </Alert>
      </Snackbar>

      <AddPatientModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePatient}
        error={saveError} // Puedes pasar el error de guardado al modal
      />
    </PatientProvider>
  );
}