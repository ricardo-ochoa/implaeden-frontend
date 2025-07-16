// lib/hooks/usePatients.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../api'; // importa tu instancia de Axios configurada en lib/api.js

export const usePatients = (page, searchTerm) => {
  const [patients, setPatients] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // llamamos a /pacientes?page=…&search=… vía Axios
      const { data } = await api.get('/pacientes', {
        params: {
          page,
          search: searchTerm,
        },
      });

      // suponiendo que tu backend responde:
      // { patients: [...], totalPages: N }
      setPatients(data.patients ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const refreshPatientsList = () => {
    fetchPatients();
  };

  return { patients, totalPages, loading, error, refreshPatientsList };
};
