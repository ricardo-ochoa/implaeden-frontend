'use client';

import { useState, useEffect } from 'react';
import { Typography, CircularProgress, Alert, Snackbar } from '@mui/material';
import { PatientProvider, usePatient } from '@/context/PatientContext';

import PatientTable from '@/components/PatientTable';
import PaginationControl from '@/components/PaginationControl';
import HomeActions from '@/components/HomeActions';
import AddPatientModal from '@/components/AddPatientModal'; // Modal para agregar paciente
import useSavePatient from '../../../lib/hooks/useSavePatient';
import { CheckCircleOutline } from '@mui/icons-material';
import { usePatients } from '../../../lib/hooks/usePatients';

export default function PatientManagement() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal
  const [showAlert, setShowAlert] = useState(false); // Estado para mostrar el alert
  const { savePatient, loading: saving, error: saveError } = useSavePatient();
  const { patients, totalPages, loading, error, refreshPatientsList } = usePatients(page, searchTerm);
  
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
    // Llamar a la función del hook
    await savePatient(formData);
    setIsModalOpen(false); // Cerrar el modal después de guardar
    setShowAlert(true); // Mostrar el alert de éxito

    // Actualizar la lista de pacientes
    refreshPatientsList(); // Llamar a la función de actualización

    // Cerrar el alert después de 3 segundos
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  return (
    <PatientProvider>
      <div>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, marginTop: 4, marginLeft: 4 }}
        >
          Pacientes
        </Typography>

        <main>
          <div className="container mx-auto px-4 py-8">
            <HomeActions
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm} // Actualiza el término de búsqueda
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

        {/* Mostrar alert de éxito */}
        <Snackbar open={showAlert} autoHideDuration={3000}>
          <Alert icon={<CheckCircleOutline fontSize="inherit" />} severity="success">
            Paciente agregado exitosamente.
          </Alert>
        </Snackbar>

        {/* Modal para agregar paciente */}
        <AddPatientModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSavePatient}
        />
      </div>
    </PatientProvider>
  );
}
