'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Alert, Box } from '@mui/material';
import SectionTitle from '@/components/SectionTitle';
import BasicInfoCard from '@/components/BasicInfoCard';

export default function PatientDetail({ params: paramsPromise }) {
  const params = use(paramsPromise); // Desenrolla el Promise de `params`
  const { id } = params; // Ahora puedes acceder a `id` de forma segura
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`);
  
        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
        }
  
        const data = await response.json();
        setPatient(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPatient();
  }, [id]);
  

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8">
      <SectionTitle
        title={`Detalle del Paciente: ${patient.nombre} ${patient.apellidos}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: `${patient.nombre} ${patient.apellidos}` },
        ]}
      />

      <Box className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BasicInfoCard patient={patient} />
        {/* Agrega aquí las otras cards: Historial, Tratamientos, Pagos y Compras, Citas */}
      </Box>
    </div>
  );
}
