// src/lib/hooks/useServices.js
import { useState } from 'react'
import api from '../api'

const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const fetchServices = async () => {
    setLoading(true)
    setError(null)
    try {
      // Llamada GET a /servicios usando tu instancia de Axios
      const { data } = await api.get('/servicios')
      setServices(data)
    } catch (err) {
      // Captura mensaje de error de Axios o fallback a err.message
      const message =
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    services,
    loading,
    error,
    fetchServices,
  }
}

export default useServices
