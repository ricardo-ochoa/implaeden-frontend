'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const usePatients = (page, searchTerm) => {
  const [patients, setPatients] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/pacientes?page=${page}&search=${searchTerm}`);
        if (!response.ok) {
          throw new Error('Error al cargar pacientes');
        }
        const data = await response.json();

        // Asegúrate de que `patients` y `totalPages` existan en la respuesta
        setPatients(data || []); // Si la API no devuelve patients, asegura que sea []
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [page, searchTerm]);

  return { patients, totalPages, loading, error };
};
