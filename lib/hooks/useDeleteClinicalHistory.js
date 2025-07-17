// hooks/useDeleteClinicalHistory.js
import { useState, useCallback } from 'react';
import api from '../api';

const useDeleteClinicalHistory = (fetchClinicalHistories) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteClinicalHistory = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      // Llamada DELETE a /clinical-histories/{id}
      await api.delete(`/clinical-histories/${id}`);

      // Refrescar la lista tras eliminar
      await fetchClinicalHistories();
    } catch (err) {
      console.error('Error al eliminar el historial clínico:', err);

      // Axios mete el mensaje en err.response.data.message
      const message =
        err.response?.data?.message ||
        err.message ||
        'Error desconocido al eliminar el historial clínico.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchClinicalHistories]);

  return { deleteClinicalHistory, loading, error };
};

export default useDeleteClinicalHistory;
