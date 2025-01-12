'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const usePatients = (page, searchTerm) => {
  const [patients, setPatients] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para obtener la lista de pacientes
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/pacientes?page=${page}&search=${searchTerm}`);
      if (!response.ok) {
        throw new Error('Error al cargar pacientes');
      }
      const data = await response.json();
  
      setPatients(data.patients || []); // Cambié data a data.patients
      setTotalPages(data.totalPages || 1); // Asegúrate de que totalPages esté correcto
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  // Llamar a la función fetchPatients cuando cambian `page` o `searchTerm`
  useEffect(() => {
    fetchPatients();
  }, [page, searchTerm, fetchPatients]);

  // Función para refrescar la lista de pacientes
  const refreshPatientsList = () => {
    fetchPatients();
  };

  return { patients, totalPages, loading, error, refreshPatientsList };
};
