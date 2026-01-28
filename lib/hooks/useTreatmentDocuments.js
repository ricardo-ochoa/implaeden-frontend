// lib/hooks/useTreatmentDocuments.js
import { useState, useEffect, useCallback } from 'react'
import api from '../api' // instancia de Axios con interceptor de Authorization

export default function useTreatmentDocuments(patientId, treatmentId) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Cargar documentos del tratamiento
  const fetchDocuments = useCallback(async () => {
    if (!treatmentId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(
        `/servicios/tratamientos/${treatmentId}/documentos`
      )
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Error al cargar los documentos'
      )
    } finally {
      setLoading(false)
    }
  }, [treatmentId])

  // Crear un nuevo documento
  const createDocument = useCallback(
    async (formData) => {
      if (!treatmentId) return
      setLoading(true)
      setError(null)
      try {
        // POST /api/servicios/tratamientos/:treatmentId/documentos
        await api.post(`/servicios/tratamientos/${treatmentId}/documentos`, formData)
        await fetchDocuments()
      } catch (err) {
        console.error('Error creating document:', err)
        setError(
          err.response?.data?.message ||
            err.message ||
            'Error al guardar el documento'
        )
      } finally {
        setLoading(false)
      }
    },
    [treatmentId, fetchDocuments]
  )

  const updateCost = useCallback(
    async (newCost) => {
      if (!patientId || !treatmentId) {
        setError('Falta el ID del paciente o del tratamiento.')
        return false
      }

      setIsUpdating(true)
      setError(null)
      try {
        await api.patch(`/pacientes/${patientId}/tratamientos/${treatmentId}`, {
          total_cost: parseFloat(newCost),
        })
        return true
      } catch (err) {
        const errorMessage =
          err.response?.data?.error || 'No se pudo actualizar el costo.'
        console.error('Error updating cost:', err)
        setError(errorMessage)
        return false
      } finally {
        setIsUpdating(false)
      }
    },
    [patientId, treatmentId]
  )

  const updateQuantity = useCallback(async (newQty) => {
  if (!patientId || !treatmentId) {
    setError('Falta el ID del paciente o del tratamiento.')
    return false
  }

  setIsUpdating(true)
  setError(null)
  try {
    const q = Number(newQty)
    const qty = Number.isFinite(q) ? Math.trunc(q) : NaN
    if (!Number.isFinite(qty) || qty < 1) {
      setError('Cantidad inválida (entero >= 1).')
      return false
    }

    await api.patch(`/pacientes/${patientId}/tratamientos/${treatmentId}`, {
      quantity: qty,
    })
    return true
  } catch (err) {
    const errorMessage = err.response?.data?.error || 'No se pudo actualizar la cantidad.'
    console.error('Error updating quantity:', err)
    setError(errorMessage)
    return false
  } finally {
    setIsUpdating(false)
  }
}, [patientId, treatmentId])

  // Eliminar documento
  const deleteDocument = useCallback(async (docId) => {
    if (!docId) return
    setError(null)
    try {
      // DELETE /api/servicios/documentos/:docId
      await api.delete(`/servicios/documentos/${docId}`)
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
    } catch (err) {
      console.error('Error deleting document:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Error al eliminar el documento'
      )
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    isUpdating,
    error,
    fetchDocuments,
    createDocument,
    deleteDocument,
    updateCost,
    updateQuantity, // ✅ export
  }
}
