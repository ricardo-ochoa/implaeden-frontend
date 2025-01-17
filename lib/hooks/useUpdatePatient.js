import { useState } from 'react';

const useUpdatePatient = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updatePatient = async (id, data) => {
    setLoading(true);
    setError(null);
  
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === 'foto_perfil_url' && !data[key]) {
          // No agregar 'foto_perfil_url' si no se seleccionó una nueva imagen
          return;
        }
  
        if (data[key] instanceof File || data[key] instanceof Blob) {
          formData.append('foto', data[key]); // Cambiar el nombre si es un archivo
        } else {
          formData.append(key, data[key]);
        }
      });
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`, {
        method: 'PUT',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el paciente');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar el paciente:', error);
      setError(error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  

  return { updatePatient, loading, error };
};

export default useUpdatePatient;
