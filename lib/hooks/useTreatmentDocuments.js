import { useState, useEffect } from 'react';

const useTreatmentDocuments = (treatmentId) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const resetStates = () => {
    setError(null);
    setSuccess(null);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    resetStates();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/tratamientos/${treatmentId}/documentos`
      );

      if (!response.ok) {
        throw new Error(`Error al cargar los documentos: ${response.statusText}`);
      }

      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error al cargar documentos:', err);
      setError(`Error al cargar documentos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (document) => {
    resetStates();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/tratamientos/${treatmentId}/documentos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(document),
        }
      );
  
      const newDocument = await response.json();
      setDocuments((prev) => [...prev, newDocument]);
      setSuccess('Documento creado exitosamente.');
    } catch (err) {
      console.error('Error al crear documento:', err);
      setError(`Error al crear documento: ${err.message}`);
    }
  };
  

  const updateDocument = async (id, updatedData) => {
    resetStates();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/documentos/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error(`Error al actualizar el documento: ${response.statusText}`);
      }

      const updatedDocument = await response.json();
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, ...updatedData } : doc))
      );
      setSuccess('Documento actualizado exitosamente.');
    } catch (err) {
      console.error('Error al actualizar documento:', err);
      setError(`Error al actualizar documento: ${err.message}`);
    }
  };

  const deleteDocument = async (id) => {
    resetStates();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/documentos/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(`Error al eliminar el documento: ${response.statusText}`);
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setSuccess('Documento eliminado exitosamente.');
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setError(`Error al eliminar documento: ${err.message}`);
    }
  };

  useEffect(() => {
    if (treatmentId) {
      fetchDocuments();
    } else {
      console.error('El treatmentId no está definido o es inválido.');
    }
  }, [treatmentId]);

  return {
    documents,
    loading,
    error,
    success,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
  };
};

export default useTreatmentDocuments;
