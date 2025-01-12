import { useState } from 'react';

const useSavePatient = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const savePatient = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes`, {
        method: 'POST',
        body: data, // Enviar directamente el FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar el paciente');
      }
    } catch (error) {
      console.error('Error al agregar el paciente:', error);
      setError(error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { savePatient, loading, error };
};

export default useSavePatient;
