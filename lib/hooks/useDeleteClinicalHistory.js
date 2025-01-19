import { useState } from 'react';

const useDeleteClinicalHistory = (fetchClinicalHistories) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteClinicalHistory = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clinical-histories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el historial clínico.');
      }

      fetchClinicalHistories();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error desconocido al eliminar el historial clínico.');
    } finally {
      setLoading(false);
    }
  };

  return { deleteClinicalHistory, loading, error };
};

export default useDeleteClinicalHistory;
