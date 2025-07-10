// lib/hooks/usePatientTreatments.js
import { useState, useEffect } from 'react';

const usePatientTreatments = (patientId) => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchPatientTreatments = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/tratamientos`);
      if (!res.ok) throw new Error('Error al obtener tratamientos');
      const data = await res.json();

      console.log('raw treatments:', data);

      const mapped = data.map((t) => ({
        treatment_id: t.treatment_id ?? t.id,
        service_id:   t.service_id,
        service_name: t.service_name,
        service_date: t.service_date,
        status:       t.status,
        notes:        t.notes,
        category:        t.service_category,
        // Aquí usamos initial_cost (o el campo real que te devuelva tu API)
        total_cost:  t.total_cost != null
                       ? parseFloat(t.total_cost)
                       : 0,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }));

      setTreatments(mapped);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTreatment = async (treatmentId) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/servicios/tratamientos/${treatmentId}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Error al eliminar tratamiento');
    }
    setTreatments(prev => prev.filter(t => t.treatment_id !== treatmentId));
  };

  useEffect(() => {
    fetchPatientTreatments();
  }, [patientId]);

  return { treatments, loading, error, fetchPatientTreatments, deleteTreatment };
};

export default usePatientTreatments;
