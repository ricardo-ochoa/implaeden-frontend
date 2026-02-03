'use client'

import { useCallback, useMemo, useState } from 'react'
import api from '../api'

const STATUS_OPTIONS = ['Por Iniciar', 'En proceso', 'Terminado']

const normalizeStatus = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase()
  if (!v) return 'Por Iniciar'
  if (v === 'terminado') return 'Terminado'
  if (v === 'en proceso') return 'En proceso'
  if (v === 'por iniciar') return 'Por Iniciar'
  return 'Por Iniciar'
}

const getTreatmentId = (x) => x?.treatment_id ?? x?.id ?? null

export default function useTreatmentStatusModal({
  patientId,
  onAfterSave, // callback opcional para refrescar state/consultas/toasts
} = {}) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const openFor = useCallback((cardOrTreatment) => {
    setTarget(cardOrTreatment || null)
    setNewStatus(
      normalizeStatus(cardOrTreatment?.status ?? cardOrTreatment?.group_status)
    )
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setTarget(null)
    setNewStatus('')
  }, [])

  const save = useCallback(async () => {
    if (!patientId) return { ok: false, error: 'patientId requerido' }
    if (!target || !newStatus) return { ok: false, error: 'Falta target/newStatus' }

    try {
      setSaving(true)

      if (target?.isGroup) {
        const ids = (target?.items || [])
          .map(getTreatmentId)
          .filter(Boolean)

        // Si por alguna razón no trae items, no hacemos nada
        if (!ids.length) {
          setSaving(false)
          return { ok: false, error: 'Grupo sin items' }
        }

        await Promise.all(
          ids.map((id) =>
            api.put(`/pacientes/${patientId}/tratamientos/${id}/status`, {
              status: newStatus,
            })
          )
        )
      } else {
        const id = getTreatmentId(target)
        if (!id) {
          setSaving(false)
          return { ok: false, error: 'Tratamiento sin id' }
        }

        await api.put(`/pacientes/${patientId}/tratamientos/${id}/status`, {
          status: newStatus,
        })
      }

      // hook callback (para refrescar UI)
      await onAfterSave?.({ target, newStatus })

      close()
      return { ok: true }
    } catch (err) {
      console.error(err)
      return { ok: false, error: err }
    } finally {
      setSaving(false)
    }
  }, [patientId, target, newStatus, onAfterSave, close])

  const modalProps = useMemo(
    () => ({
      open,
      onClose: close,
      treatment: target,
      newStatus,
      setNewStatus,
      onSave: save,
      // extra por si lo quieres usar (aunque tu modal actual no lo reciba)
      saving,
      statusOptions: STATUS_OPTIONS,
    }),
    [open, close, target, newStatus, save, saving]
  )

  return {
    // estado
    open,
    target,
    newStatus,
    saving,

    // acciones
    openFor,
    close,
    save,

    // props listas para el modal
    modalProps,
  }
}
