// Página propia de "Datos fiscales". En escritorio el panel se muestra dentro
// del perfil; en móvil, BasicInfoCard navega a esta ruta.
import SectionTitle from '@/components/SectionTitle'
import PatientFiscalClient from './PatientFiscalClient'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PatientFiscalPage({ params }) {
  const { id: patientId } = params

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('Define NEXT_PUBLIC_API_URL en .env')

  const cookieHeader = headers().get('cookie') || ''
  const token = cookies().get('token')?.value
  if (!token) redirect('/login')

  const res = await fetch(`${baseUrl}/pacientes/${patientId}`, {
    cache: 'no-store',
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 401) redirect('/login')
  if (!res.ok) throw new Error(`Error cargando paciente (${res.status})`)

  const patient = await res.json()
  const nombre = `${patient.nombre || ''} ${patient.apellidos || ''}`.trim()

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title={`${nombre} — Datos fiscales`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: nombre, href: `/pacientes/${patientId}` },
          { label: 'Datos fiscales' },
        ]}
      />

      <PatientFiscalClient patientId={Number(patientId)} patient={patient} />
    </div>
  )
}
