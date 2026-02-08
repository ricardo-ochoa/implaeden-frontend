'use client'

import { useCallback, useState } from 'react'
import api from '@/lib/api'

const getId = (x) => x?.treatment_id ?? x?.id ?? null

export default function useUpdateTreatment({ patientId, onAfterSave } = {}) {
  const [isUpdating, setIsUpdating] = useState(false)

  const patchTreatment = useCallback(
    async (treatmentId, patch) => {
      if (!patientId) return { ok: false, error: 'patientId requerido' }
      if (!treatmentId) return { ok: false, error: 'treatmentId requerido' }

      try {
        setIsUpdating(true)
        await api.patch(`/pacientes/${patientId}/tratamientos/${treatmentId}`, patch)
        await onAfterSave?.({ treatmentId, patch })
        return { ok: true }
      } catch (err) {
        console.error(err)
        return { ok: false, error: err }
      } finally {
        setIsUpdating(false)
      }
    },
    [patientId, onAfterSave]
  )

  // ✅ aplica el mismo patch a single o a todos los items del group
  const patchCard = useCallback(
    async (card, patch) => {
      if (!card) return { ok: false, error: 'card requerido' }

      if (card?.isGroup) {
        const ids = (card?.items || []).map(getId).filter(Boolean)
        await Promise.all(ids.map((id) => patchTreatment(id, patch)))
        return { ok: true }
      }

      const id = getId(card)
      return patchTreatment(id, patch)
    },
    [patchTreatment]
  )

  return { patchTreatment, patchCard, isUpdating }
}
