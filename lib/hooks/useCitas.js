// lib/hooks/useCitas.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export function useCitas(patientId) {
  const [citas, setCitas]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // 1) Fetch de todas las citas del paciente
  const fetchCitas = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/pacientes/${patientId}/citas`);
      setCitas(
        data.map(c => ({
          id:             c.id,
          appointmentAt:  c.appointment_at,
          serviceId:      c.service_id,
          tratamiento:    c.tratamiento,
          observaciones:  c.observaciones,
          createdAt:      c.created_at,
          updatedAt:      c.updated_at,
        }))
      );
    } catch (err) {
      // 404 lo interpretamos como "sin citas"
      if (err.response?.status === 404) {
        setCitas([]);
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  // 2) Crear nueva cita
  const createCita = useCallback(async newCita => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/pacientes/${patientId}/citas`, newCita);
      await fetchCitas();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId, fetchCitas]);

  // 3) Actualizar cita existente
  const updateCita = useCallback(async edited => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/pacientes/${patientId}/citas/${edited.id}`, edited);
      await fetchCitas();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId, fetchCitas]);

  // 4) Eliminar cita
  const deleteCita = useCallback(async idToDelete => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/pacientes/${patientId}/citas/${idToDelete}`);
      await fetchCitas();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId, fetchCitas]);

  return {
    citas,
    loading,
    error,
    refresh:   fetchCitas,
    createCita,
    updateCita,
    deleteCita,
  };
}
