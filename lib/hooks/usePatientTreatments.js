// lib/hooks/usePatientTreatments.js
import { useState, useCallback, useEffect } from 'react';
import api from '../api'; 

export default function usePatientTreatments(patientId) {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const fetchPatientTreatments = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      // Llamada protegida con Bearer token
      const { data } = await api.get(`/pacientes/${patientId}/tratamientos`);
      const mapped = data.map((t) => ({
        treatment_id:   t.treatment_id,
        service_id:     t.service_id,
        service_name:   t.service_name,
        service_date:   t.service_date,
        status:         t.status,
        notes:          t.notes,
        category:       t.service_category,
        total_cost:     t.total_cost != null ? parseFloat(t.total_cost) : 0,
        created_at:     t.created_at,
        updated_at:     t.updated_at,
      }));
      setTreatments(mapped);
    } catch (err) {
      console.error('Error fetching treatments:', err);
      setError(err.response?.data?.message || err.message || 'Error al obtener tratamientos');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const deleteTreatment = useCallback(async (treatmentId) => {
    if (!patientId) return;
    try {
      await api.delete(`/pacientes/${patientId}/tratamientos/${treatmentId}`);
      setTreatments((prev) => prev.filter((t) => t.treatment_id !== treatmentId));
    } catch (err) {
      console.error('Error deleting treatment:', err);
      throw new Error(err.response?.data?.message || err.message || 'Error al eliminar tratamiento');
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientTreatments();
  }, [fetchPatientTreatments]);

  return { treatments, loading, error, fetchPatientTreatments, deleteTreatment };
}
