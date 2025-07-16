// lib/hooks/useTreatmentEvidences.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api'; // instancia de Axios con token en headers

export default function useTreatmentEvidences({ patientId, treatmentId }) {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Carga todas las evidencias protegida con JWT
  const load = useCallback(async () => {
    if (!patientId || !treatmentId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/pacientes/${patientId}/tratamientos/${treatmentId}/evidencias`)
      setEvidences(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching evidences:', err);
      setError(err.response?.data?.message || err.message || 'Error al obtener evidencias');
    } finally {
      setLoading(false);
    }
  }, [patientId, treatmentId]);

  // Subir nuevas evidencias
  const uploadEvidences = useCallback(async (files) => {
    if (!patientId || !treatmentId) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      await api.post(
        `/pacientes/${patientId}/tratamientos/${treatmentId}/evidencias`,
        form
      );
      await load();
    } catch (err) {
      console.error('Error uploading evidences:', err);
      setError(err.response?.data?.message || err.message || 'Error al subir evidencias');
    } finally {
      setLoading(false);
    }
  }, [patientId, treatmentId, load]);

  // Eliminar una evidencia existente
  const deleteEvidence = useCallback(async (evidenceId) => {
    if (!patientId || !treatmentId) return;
    setError(null);
    try {
      await api.delete(
        `/pacientes/${patientId}/tratamientos/${treatmentId}/evidencias/${evidenceId}`
      );
      setEvidences(prev => prev.filter(e => e.id !== evidenceId));
    } catch (err) {
      console.error('Error deleting evidence:', err);
      setError(err.response?.data?.message || err.message || 'Error al eliminar evidencia');
    }
  }, [patientId, treatmentId]);

  // Carga inicial o cuando cambian ids
  useEffect(() => {
    load();
  }, [load]);

  return {
    evidences,
    loading,
    error,
    uploadEvidences,
    deleteEvidence,
    reload: load,
  };
}
