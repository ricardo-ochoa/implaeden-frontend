// lib/hooks/useTreatmentDocuments.js
import { useState, useEffect, useCallback } from 'react'
import api from '../api'

export default function useTreatmentDocuments(patientId, treatmentId) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const docsBase = useCallback(() => {
    if (!patientId || !treatmentId) return null
    return `/pacientes/${patientId}/tratamientos/${treatmentId}/documentos`
  }, [patientId, treatmentId])

  // ✅ Cargar documentos del tratamiento
  const fetchDocuments = useCallback(async () => {
    const url = docsBase()
    if (!url) return

    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(url)
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Error al cargar los documentos'
      )
    } finally {
      setLoading(false)
    }
  }, [docsBase])

  // ✅ Crear un nuevo documento
  const createDocument = useCallback(
    async (formData) => {
      const url = docsBase()
      if (!url) return

      setLoading(true)
      setError(null)
      try {
        await api.post(url, formData) // POST /api/pacientes/:patientId/tratamientos/:treatmentId/documentos
        await fetchDocuments()
      } catch (err) {
        console.error('Error creating document:', err)
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            'Error al guardar el documento'
        )
      } finally {
        setLoading(false)
      }
    },
    [docsBase, fetchDocuments]
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

  const updateQuantity = useCallback(
    async (newQty) => {
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
        const errorMessage =
          err.response?.data?.error || 'No se pudo actualizar la cantidad.'
        console.error('Error updating quantity:', err)
        setError(errorMessage)
        return false
      } finally {
        setIsUpdating(false)
      }
    },
    [patientId, treatmentId]
  )

  // Eliminar documento (lo dejas igual, porque tu backend lo maneja así)
  const deleteDocument = useCallback(async (docId) => {
  const base = docsBase()
  if (!base || !docId) return

  setError(null)
  try {
    await api.delete(`/pacientes/${patientId}/tratamientos/documentos/${docId}`)
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
    // o si prefieres: await fetchDocuments()
  } catch (err) {
    console.error('Error deleting document:', err)
    setError(
      err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error al eliminar el documento'
    )
  }
}, [docsBase])

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
    updateQuantity,
  }
}
