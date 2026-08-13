// src/app/admin/medicos/page.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DoctorsClient from './DoctorsClient'

export default async function AdminMedicosPage() {
  const token = cookies().get('token')?.value
  if (!token) redirect('/login')

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('Define NEXT_PUBLIC_API_URL en .env')

  // ?todos=1: la pantalla de administración también muestra los dados de baja.
  const res = await fetch(`${baseUrl}/doctors?todos=1`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) redirect('/login')
  if (!res.ok) throw new Error(`Error cargando médicos (${res.status})`)

  const doctors = await res.json()

  return <DoctorsClient initialDoctors={doctors} />
}
