import { useState, useEffect, useCallback } from 'react';

export function useCitas(patientId) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener todas las citas del paciente
  const fetchCitas = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/citas`
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setCitas(
        data.map(c => ({
          id: c.id,
          appointmentAt: c.appointment_at,
          serviceId: c.service_id,
          tratamiento: c.tratamiento,
          observaciones: c.observaciones,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }))
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  // Crear nueva cita
  const createCita = useCallback(
    async newCita => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/citas`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCita),
          }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        await fetchCitas();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [patientId, fetchCitas]
  );

  // Actualizar cita existente
  const updateCita = useCallback(
    async edited => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/citas/${edited.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(edited),
          }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        await fetchCitas();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [patientId, fetchCitas]
  );

  // Eliminar cita
  const deleteCita = useCallback(
    async idToDelete => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/citas/${idToDelete}`,
          { method: 'DELETE' }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        await fetchCitas();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [patientId, fetchCitas]
  );

  return {
    citas,
    loading,
    error,
    refresh: fetchCitas,
    createCita,
    updateCita,
    deleteCita,
  };
}
