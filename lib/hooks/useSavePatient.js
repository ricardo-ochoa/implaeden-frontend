// src/lib/hooks/useSavePatient.js
import { useState } from 'react'
import api from '../api'


const useSavePatient = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const savePatient = async (formData) => {
    setLoading(true)
    setError(null)

    try {
      // POST a /pacientes con FormData
      const response = await api.post(
        '/pacientes',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      // Devolver los datos creados, si necesitas utilizarlos
      return response.data
    } catch (err) {
      // Extrae mensaje de error del servidor o fallback a err.message
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message

      console.error('Error al agregar el paciente:', message)
      setError(message)
      alert(message)
      // Re-lanza para que el componente pueda reaccionar si lo desea
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    savePatient,
    loading,
    error,
  }
}

export default useSavePatient
