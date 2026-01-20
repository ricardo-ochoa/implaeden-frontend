'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '../api'

export default function useTreatmentHistory(patientId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

const refresh = useCallback(
  async ({ patientServiceId = null, patientServiceGroupId = null } = {}) => {
    if (!patientId) return
    setLoading(true)
    setError(null)

    try {
      const params = { limit: 200, offset: 0 }

      if (patientServiceId) params.patient_service_id = Number(patientServiceId)
      if (patientServiceGroupId) params.patient_service_group_id = Number(patientServiceGroupId)

      const res = await api.get(`/pacientes/${patientId}/events`, { params })
      setItems(res?.data?.items || [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  },
  [patientId]
)


  const createEvent = useCallback(
  async ({
    event_type,
    message,
    patient_service_id = null,
    patient_service_group_id = null,
    meta = null,
  }) => {
    if (!patientId) return false
    setSaving(true)
    setError(null)

    try {
      const res = await api.post(`/pacientes/${patientId}/events`, {
        event_type,
        message,
        patient_service_id,
        patient_service_group_id,
        meta,
      })

      // si tu endpoint responde el evento creado:
      setItems((prev) => [res.data, ...(prev || [])])
      return true
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
      return false
    } finally {
      setSaving(false)
    }
  },
  [patientId]
)

  return { items, loading, saving, error, refresh, createEvent }
}
