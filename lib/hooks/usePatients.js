// lib/hooks/usePatients.js
import { useState, useEffect, useCallback } from 'react'
import api from '../api'

export const usePatients = (page, searchTerm) => {
  const [patients, setPatients]     = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/pacientes', {
        params: { page, search: searchTerm },
        withCredentials: true,   // <— asegúrate de esto
      })
      setPatients(data.patients ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  return { patients, totalPages, loading, error, refreshPatientsList: fetchPatients }
}
