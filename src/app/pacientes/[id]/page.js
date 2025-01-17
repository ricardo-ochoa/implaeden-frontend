'use client';

import { use, useEffect, useState } from 'react';
import { CircularProgress, Alert, Box } from '@mui/material';
import SectionTitle from '@/components/SectionTitle';
import BasicInfoCard from '@/components/BasicInfoCard';
import GeneralCard from '@/components/GeneralCard';

export default function PatientDetail({ params: paramsPromise }) {
  const params = use(paramsPromise); // Desenrolla el Promise de `params`
  const { id } = params; // Ahora puedes acceder a `id` de forma segura
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

  const cards = [
    {
      title: 'Historial clínico',
      description: 'Documento con la información médico del paciente.',
      redirect: `/pacientes/${id}/historial`,
    },
    {
      title: 'Tratamientos',
      description: 'Información y documentos de cada tratamiento.',
      redirect: `/pacientes/${id}/tratamientos`,
    },
    {
      title: 'Pagos y compras',
      description: 'Historial de pagos de tratamientos.',
      redirect: `/pacientes/${id}/pagos`,
    },
    {
      title: 'Citas',
      description: 'Fecha e información de cada cita del paciente.',
      redirect: `/pacientes/${id}/citas`,
    },
  ];

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8">
      <SectionTitle
        title={`${patient.nombre} ${patient.apellidos}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: `${patient.nombre} ${patient.apellidos}` },
        ]}
      />
      <Box className="grid md:grid-cols-2 gap-4">
        <Box className="grid md:grid-cols-1 lg:grid-cols-1">
            <BasicInfoCard patient={patient} />
        </Box>

      <Box className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">

        {cards.map((card, index) => (
          <GeneralCard
            key={index}
            title={card.title}
            description={card.description}
            redirect={card.redirect}
          />
        ))}
      </Box>
      </Box>
    </div>
  );
}
