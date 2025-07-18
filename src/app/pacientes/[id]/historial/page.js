// app/pacientes/[id]/historial/page.js
import SectionTitle from '@/components/SectionTitle'
import PatientHistoryClient from './PatientHistoryClient'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation' 

export default async function PatientHistoryPage({ params }) {
  const { id: patientId } = params
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('Define NEXT_PUBLIC_API_URL en .env')

  // Reenviar cookies y token para autenticación
  const cookieHeader = headers().get('cookie') || ''
  const token = cookies().get('token')?.value
  const authHeaders = {
    ...(cookieHeader && { cookie: cookieHeader }),
    ...(token && { Authorization: `Bearer ${token}` }),
  }
  if (!token) {
    // No hay token → redirige al login
    redirect('/login')
  }

  // Fetch paciente e historial clínico en paralelo
  const [pRes, hRes] = await Promise.all([
    fetch(`${baseUrl}/pacientes/${patientId}`, { cache: 'no-store', headers: authHeaders }),
    fetch(`${baseUrl}/clinical-histories/${patientId}`, { cache: 'no-store', headers: authHeaders }).catch(() => null),
  ])

  if (!pRes.ok) {
    const errorText = await pRes.text()
    throw new Error(`Error cargando paciente (${pRes.status}): ${errorText}`)
  }
  const patient = await pRes.json()

  let clinicalRecords = []
  if (hRes && hRes.ok) {
    clinicalRecords = await hRes.json()
  } else if (hRes && hRes.status !== 404) {
    const errorText = await hRes.text()
    throw new Error(`Error cargando historial (${hRes.status}): ${errorText}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title={`${patient.nombre} ${patient.apellidos} — Historial clínico`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: `${patient.nombre} ${patient.apellidos}`, href: `/pacientes/${patientId}` },
          { label: 'Historial clínico' },
        ]}
      />
      <PatientHistoryClient patient={patient} clinicalRecords={clinicalRecords} />
    </div>
  )
}