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
    const url = `${process.env.NEXT_PUBLIC_API_URL}/servicios/tratamientos/${treatmentId}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al eliminar tratamiento');
    }
  
    setTreatments(prev => prev.filter(t => t.treatment_id !== treatmentId));
  };  

  useEffect(() => {
    fetchPatientTreatments();
  }, [patientId]);

  return { treatments, loading, error, fetchPatientTreatments, deleteTreatment };
};

export default usePatientTreatments;
