// lib/hooks/usePayments.js
import { useState, useEffect, useCallback } from 'react'
import api from '../api'

export function usePayments(patientId) {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const mapPayment = (p) => ({
    id:                 p.id,
    fecha:              p.fecha.split('T')[0],
    tratamiento:        p.tratamiento   ?? 'Sin servicio',
    patient_service_id: p.patient_service_id,
    total_cost:         p.total_cost    != null ? parseFloat(p.total_cost) : 0,
    monto:              parseFloat(p.monto),
    total_pagado:       parseFloat(p.total_pagado),
    saldo_pendiente:    parseFloat(p.saldo_pendiente),
    metodo_pago:        p.metodo_pago   ?? '—',
    estado:             p.estado        ?? '—',
    numero_factura:     p.numero_factura,
    notas:              p.notas,
    created_at:         p.created_at,
    updated_at:         p.updated_at,
  })

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/pacientes/${patientId}/pagos`)
      setPayments(data.map(mapPayment))
    } catch (err) {
      // Si la ruta no existe (404), interpretamos como "sin pagos aún"
      if (err.response?.status === 404) {
        setPayments([])
      } else {
        const msg = err.response?.data?.message || err.message
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (patientId) fetchPayments()
  }, [patientId, fetchPayments])

  const createPayment = useCallback(
    async (newPayment) => {
      await api.post(`/pacientes/${patientId}/pagos`, newPayment)
      await fetchPayments()
    },
    [patientId, fetchPayments]
  )

  const updatePayment = useCallback(
    async (edited) => {
      await api.put(`/pacientes/${patientId}/pagos/${edited.id}`, edited)
      await fetchPayments()
    },
    [patientId, fetchPayments]
  )

  const deletePayment = useCallback(
    async (idToDelete) => {
      await api.delete(`/pacientes/${patientId}/pagos/${idToDelete}`)
      await fetchPayments()
    },
    [patientId, fetchPayments]
  )

  return {
    payments,
    loading,
    error,
    refresh:      fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
  }
}
