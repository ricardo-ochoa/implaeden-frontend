'use client';

import { useState } from 'react';
import { Typography, CircularProgress, Alert } from '@mui/material';
import { usePatients } from '../../lib/hooks/usePatients';
import PatientTable from '@/components/PatientTable';
import PaginationControl from '@/components/PaginationControl';
import HomeActions from '@/components/HomeActions';
import AddPatientModal from '@/components/AddPatientModal'; // Modal para agregar paciente
import useSavePatient from '../../lib/hooks/useSavePatient';

export default function PatientManagement() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal
  const { patients, totalPages, loading, error } = usePatients(page, searchTerm);
  const { savePatient, loading: saving, error: saveError } = useSavePatient(); 

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleAddPatient = () => {
    setIsModalOpen(true); // Abrir el modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Cerrar el modal
  };

  const handleSavePatient = async (formData) => {
    await savePatient(formData); // Llamar a la función del hook
    setIsModalOpen(false); // Cerrar el modal después de guardar
  };
  
  return (
    <div className="min-h-screen">
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 600, marginTop: 4, marginLeft: 4 }}
      >
        Pacientes
      </Typography>

      <main>
        <div className="container mx-auto max-w-screen-lg px-4 py-8">
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
        </div>
      </main>

      <AddPatientModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePatient}
      />
    </div>
  );
}
