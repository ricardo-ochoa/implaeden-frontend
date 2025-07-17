// lib/hooks/useClinicalHistories.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api'; // Axios instance with JWT

export default function useClinicalHistories(patientId) {
  const [clinicalRecords, setClinicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClinicalHistories = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/clinical-histories/${patientId}`);
      // data expected as array
      setClinicalRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching clinical histories:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar historiales clínicos');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const addClinicalHistory = useCallback(async (recordDate, files) => {
    if (!patientId) throw new Error('Falta patientId');
    if (!recordDate) throw new Error('La fecha es obligatoria');
    if (!files || files.length === 0) throw new Error('Debes subir al menos un archivo');

    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('record_date', recordDate);
      files.forEach((f) => form.append('files', f));

      // Axios handles multipart automatically
      const response = await api.post(
        `/clinical-histories/${patientId}`,
        form
      );

      // Assuming API returns the created record or nothing
      // Refetch full list
      await fetchClinicalHistories();
      return response.data;
    } catch (err) {
      console.error('Error adding clinical history:', err);
      const msg = err.response?.data?.message || err.message || 'Error al agregar historial clínico';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [patientId, fetchClinicalHistories]);

  useEffect(() => {
    fetchClinicalHistories();
  }, [fetchClinicalHistories]);

  return {
    clinicalRecords,
    loading,
    error,
    fetchClinicalHistories,
    addClinicalHistory,
  };
}
