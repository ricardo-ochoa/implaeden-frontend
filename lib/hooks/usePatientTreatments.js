import { useState, useEffect } from 'react';

const usePatientTreatments = (patientId) => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPatientTreatments = async () => {
    if (!patientId) return;
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/tratamientos`);
      if (!response.ok) throw new Error('Error al obtener tratamientos');
      const data = await response.json();
      setTreatments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTreatment = async (treatmentId) => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/servicios/tratamientos/${treatmentId}`;
      console.log('URL para eliminar tratamiento:', url);
  
      const response = await fetch(url, {
        method: 'DELETE',
      });
  
      // Verificar si la respuesta es JSON o HTML
      const contentType = response.headers.get('Content-Type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorResponse = await response.json();
          throw new Error(errorResponse.error || 'Error al eliminar el tratamiento');
        } else {
          const textResponse = await response.text();
          throw new Error('Error inesperado: el servidor devolvió HTML en lugar de JSON.');
        }
      }
      setTreatments((prev) => prev.filter((treatment) => treatment.treatment_id !== treatmentId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientTreatments();
  }, [patientId]);

  return { treatments, loading, error, fetchPatientTreatments, deleteTreatment };
};

export default usePatientTreatments;
