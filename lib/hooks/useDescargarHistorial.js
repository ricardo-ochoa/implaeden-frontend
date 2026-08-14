'use client'

// lib/hooks/useDescargarHistorial.js
// ---------------------------------------------------------------------------
// Descarga el historial clínico de un paciente como un solo PDF.
//
// Lo usan dos pantallas —la ficha del paciente y la sección de historial—, así
// que el manejo de la cabecera de omitidos y los mensajes viven aquí y no en
// cada una: si el backend cambia lo que reporta, se toca un solo lugar.
//
// Sin `fecha` baja todo (expedientes capturados en la app + escaneados,
// intercalados por fecha); con `fecha`, solo los escaneados de ese día.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { toast } from 'sonner'

import { descargarArchivo, mensajeDeErrorBlob } from '../utils/descargarArchivo'

export function useDescargarHistorial(patientId) {
  const [descargando, setDescargando] = useState(false)

  const descargar = async (fecha) => {
    if (!patientId) return false

    setDescargando(true)
    try {
      const { headers } = await descargarArchivo(
        `/clinical-histories/${patientId}/pdf${fecha ? `?date=${fecha}` : ''}`,
        fecha ? `expediente-${fecha}.pdf` : 'historial-clinico.pdf'
      )

      // El backend avisa por cabecera qué no pudo meter (formatos que un PDF no
      // admite, archivos que ya no están en el bucket, expedientes ilegibles).
      const omitidos = Number(headers['x-archivos-omitidos'] || 0)
      if (omitidos > 0) {
        toast.warning(
          `PDF descargado, pero ${omitidos} elemento${omitidos === 1 ? '' : 's'} no se pudo incluir. Ver la última página.`
        )
      } else {
        toast.success('PDF descargado')
      }

      return true
    } catch (err) {
      console.error(err)
      const mensaje = await mensajeDeErrorBlob(err, 'No se pudo generar el PDF')

      // "No hay nada que descargar" no es una falla: desde la ficha del
      // paciente no se sabe de antemano si el historial está vacío.
      if (err?.response?.status === 404) toast.info(mensaje)
      else toast.error(mensaje)

      return false
    } finally {
      setDescargando(false)
    }
  }

  return { descargando, descargar }
}
