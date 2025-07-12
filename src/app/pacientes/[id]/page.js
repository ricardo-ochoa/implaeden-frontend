'use client';

import { use, useEffect, useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import SectionTitle from '@/components/SectionTitle';
import BasicInfoCard from '@/components/BasicInfoCard';
import GeneralCard from '@/components/GeneralCard';

export default function PatientDetail({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
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
        console.error('Error fetching patient:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  const handlePatientUpdate = async (updatedData) => {
    let updatedPatient = {};
  
    if (updatedData instanceof FormData) {
      updatedData.forEach((value, key) => {
        updatedPatient[key] = value instanceof File ? value : value.toString();
      });
    } else {
      updatedPatient = updatedData;
    }
  
    if (!updatedPatient || !updatedPatient.nombre) {
      console.error('Invalid update data received');
      return;
    }
  
    // Asegurar que se mantenga la imagen previa si no se envió una nueva ni se eliminó
    updatedPatient.foto_perfil_url = updatedPatient.foto_perfil_url ?? patient.foto_perfil_url;
  
    // Actualizar el estado del paciente
    setPatient((prevPatient) => ({
      ...prevPatient,
      ...updatedPatient,
    }));
  };
  

  const skeletonCards = new Array(4).fill(null).map((_, index) => (
    <Box key={index} sx={{ width: '100%', padding: '0px' }}>
      <Skeleton variant="rectangular" height={180} sx={{ borderRadius: '8px' }} />
    </Box>
  ));

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <>
        <Skeleton variant="text" width="20%" height={50} />
        <Skeleton variant="text" width="20%" height={20} />
        <Skeleton variant="text" width="50%" height={50} sx={{ marginBottom: 4 }} />
        </>
      ) : (
        <SectionTitle
          title={`${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim()}
          breadcrumbs={[
            { label: 'Pacientes', href: '/pacientes' },
            { label: `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim() },
          ]}
        />
      )}

      <Box className="grid md:grid-cols-2 gap-4">
        <Box className="grid md:grid-cols-1 lg:grid-cols-1">
          {loading ? (
            <Skeleton variant="rectangular" height={380} sx={{ borderRadius: '8px' }} />
          ) : (
            <BasicInfoCard 
              patient={patient} 
              onPatientUpdate={handlePatientUpdate}
            />
          )}
        </Box>

        <Box className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {loading ? skeletonCards : (
            <>
              {[
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
              ].map((card, index) => (
                <GeneralCard
                  key={index}
                  title={card.title}
                  description={card.description}
                  redirect={card.redirect}
                />
              ))}
            </>
          )}
        </Box>
      </Box>
    </div>
  );
}
