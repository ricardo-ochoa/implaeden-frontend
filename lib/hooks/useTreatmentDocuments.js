// lib/hooks/useTreatmentDocuments.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api'; // instancia de Axios con interceptor de Authorization

export default function useTreatmentDocuments(treatmentId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Cargar documentos del tratamiento
  const fetchDocuments = useCallback(async () => {
    if (!treatmentId) return;
    setLoading(true);
    setError(null);
    try {
      // GET /api/servicios/tratamientos/:treatmentId/documentos
      const { data } = await api.get(`/servicios/tratamientos/${treatmentId}/documentos`);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  }, [treatmentId]);

  // Crear un nuevo documento
  const createDocument = useCallback(async (formData) => {
    if (!treatmentId) return;
    setLoading(true);
    setError(null);
    try {
      // POST /api/servicios/tratamientos/:treatmentId/documentos
      await api.post(
        `/servicios/tratamientos/${treatmentId}/documentos`,
        formData
      );
      await fetchDocuments();
    } catch (err) {
      console.error('Error creating document:', err);
      setError(err.response?.data?.message || err.message || 'Error al guardar el documento');
    } finally {
      setLoading(false);
    }
  }, [treatmentId, fetchDocuments]);

  // Eliminar documento
  const deleteDocument = useCallback(async (docId) => {
    if (!docId) return;
    setError(null);
    try {
      // DELETE /api/servicios/documentos/:docId
      await api.delete(`/servicios/documentos/${docId}`);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err.response?.data?.message || err.message || 'Error al eliminar el documento');
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    createDocument,
    deleteDocument,
  };
}
