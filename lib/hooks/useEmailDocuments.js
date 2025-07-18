// lib/hooks/useEmailDocuments.js
import { useState } from 'react'
import api from '../api'    // tu instancia de axios

export default function useEmailDocuments() {
  const [alert, setAlert] = useState({
    open: false,
    severity: 'success',
    message: ''
  })
  const [loadingLabels, setLoadingLabels] = useState(new Set())

  const sendDocuments = async ({ to, docs, label, treatmentName, patientName }) => {
    if (!to) {
      setAlert({ open: true, severity: 'error', message: '❌ No hay email del destinatario.' })
      return
    }
    if (!Array.isArray(docs) || docs.length === 0) {
      setAlert({ open: true, severity: 'error', message: '❌ No hay documentos para enviar.' })
      return
    }

    // Marca este label como cargando
    setLoadingLabels(prev => new Set(prev).add(label))

    try {
      const payload = {
        to,
        documentUrls: docs,
        subject: `[${label}] - ${treatmentName}`,
        body: `Hola ${patientName},\n\nAdjunto tus ${label} del servicio ${treatmentName}.\n\nSaludos, Implaedén®.\n\n`
      }

      // Usar axios para incluir Authorization automáticamente
      const res = await api.post('/email/enviar-documentos', payload)

      setAlert({
        open: true,
        severity: 'success',
        message: '✅ Documentos enviados correctamente.'
      })
    } catch (err) {
      console.error('Error enviando documentos:', err)
      // Si axios devolvió un JSON con .data.error o .data.message
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'No se pudo enviar'
      setAlert({
        open: true,
        severity: 'error',
        message: `❌ Error: ${msg}`
      })
    } finally {
      // Desmarca el label
      setLoadingLabels(prev => {
        const copy = new Set(prev)
        copy.delete(label)
        return copy
      })
    }
  }

  const closeAlert = () =>
    setAlert(a => ({
      ...a,
      open: false
    }))

  return { alert, loadingLabels, sendDocuments, closeAlert }
}
