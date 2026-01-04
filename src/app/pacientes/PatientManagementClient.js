"use client";

import { useState } from "react";
import useSWR from "swr";

import { CircularProgress, Alert, Snackbar, Box } from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";
import { PatientProvider } from "@/context/PatientContext";
import PatientTable from "@/components/PatientTable";
import PatientCards from "@/components/PatientCardsv2";
import HomeActions from "@/components/HomeActions";
import AddPatientModal from "@/components/AddPatientModal";

import useSavePatient from "../../../lib/hooks/useSavePatient";
import { fetcher } from "../../../lib/api";
import PaginationControl from "@/components/PaginationControl";

export default function PatientManagementClient({ initialData }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [viewMode, setViewMode] = useState("cards"); // 'table' o 'cards'

  const { savePatient, loading: saving, error: saveError } = useSavePatient();

  const { data, error, isLoading, mutate } = useSWR(
    `/pacientes?page=${page}&search=${searchTerm}`,
    fetcher,
    { fallbackData: page === 1 && !searchTerm ? initialData : undefined }
  );

  const patients = data?.patients ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (_event, value) => setPage(value);

  const handleAddPatient = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSavePatient = async (formData) => {
    const newPatient = await savePatient(formData);
    if (newPatient) {
      setIsModalOpen(false);
      setShowAlert(true);
      mutate();
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  return (
    <PatientProvider>
      <main>
        <HomeActions
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddPatient={handleAddPatient}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {isLoading && <CircularProgress />}
        {error && <Alert severity="error">Error al cargar pacientes.</Alert>}

        {!isLoading && !error && (
          viewMode === "table"
            ? <PatientTable patients={patients} />
            : <PatientCards patients={patients} />
        )}

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
        error={saveError}
      />
    </PatientProvider>
  );
}
