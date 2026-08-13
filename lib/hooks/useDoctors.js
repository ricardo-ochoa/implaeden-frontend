'use client'

// lib/hooks/useDoctors.js
// Catálogo de médicos de la clínica (GET /doctors). Hoy lo usa el selector de
// "Odontólogo" en las firmas del expediente clínico.

import useSWR from 'swr'
import { fetcher } from '../api'

export default function useDoctors({ incluirInactivos = false } = {}) {
  const { data, error, isLoading } = useSWR(
    incluirInactivos ? '/doctors?todos=1' : '/doctors',
    fetcher,
    { revalidateOnFocus: false }
  )

  const doctors = Array.isArray(data) ? data : []

  // Etiqueta como se lee en el formato impreso.
  const etiquetaDoctor = (doctor) =>
    [doctor?.nombre, doctor?.titulo].filter(Boolean).join(' — ')

  return { doctors, etiquetaDoctor, isLoading, error }
}
