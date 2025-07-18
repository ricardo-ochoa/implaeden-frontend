// src/lib/hooks/useUpdatePatient.js
import { useState } from 'react'
import api from '../api'

const useUpdatePatient = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const updatePatient = async (id, data) => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        // Si viene la clave 'foto_perfil_url' pero no seleccionado un archivo nuevo, la omitimos
        if (key === 'foto_perfil_url' && !value) return

        // Si es un File/Blob, lo agregamos bajo el campo 'foto'
        if (value instanceof File || value instanceof Blob) {
          formData.append('foto', value)
        } else {
          formData.append(key, value)
        }
      })

      const response = await api.put(
        `/pacientes/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      // Axios devuelve directamente los datos en response.data
      return response.data
    } catch (err) {
      // Extraemos el mensaje de error del servidor o fallback a err.message
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message

      console.error('Error al actualizar el paciente:', message)
      setError(message)
      // Opcional: mostrar alerta si te interesa feedback inmediato
      alert(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    updatePatient,
    loading,
    error,
  }
}

export default useUpdatePatient
