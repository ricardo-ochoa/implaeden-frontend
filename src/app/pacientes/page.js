// src/app/pacientes/page.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SectionTitle from '@/components/SectionTitle'
import PatientManagementClient from './PatientManagementClient'

export default async function PatientDetailPage({ params }) {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  const res = await fetch(`${baseUrl}/pacientes`, {
    next: { 
      revalidate: 3600 // <-- 1h
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 401) {
    redirect('/login')
  }

  if (!res.ok) {
    throw new Error(`Error cargando pacientes (${res.status})`)
  }

  const patients = await res.json()

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle isHome title="Pacientes" />
      <PatientManagementClient initialData={patients} />
    </div>
  )
}