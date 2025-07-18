// src/app/pacientes/page.js   ← No pongas "use client" aquí
import { headers, cookies } from 'next/headers'
import { redirect }            from 'next/navigation'
import SectionTitle            from '@/components/SectionTitle'
import PatientManagementClient from './PatientManagementClient'

export default async function PatientDetailPage({ params }) {
  const token = cookies().get('token')?.value
  if (!token) redirect('/login')

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  const cookieHeader = headers().get('cookie') || ''
  const res = await fetch(`${baseUrl}/pacientes`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Error cargando pacientes (${res.status})`)
  const patients = await res.json()

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle isHome title="Pacientes" />
      <PatientManagementClient initialData={patients} />
    </div>
  )
}
