// src/app/pacientes/[id]/tratamientos/[treatmentId]/page.js
import SectionTitle from '@/components/SectionTitle'
import TreatmentDetailClient from './TreatmentDetailClient'
import { headers, cookies } from 'next/headers' 
import { redirect } from 'next/navigation'

export default async function Page({ params }) {
  const { id: patientId, treatmentId } = params
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) {
    throw new Error('Define NEXT_PUBLIC_API_URL en .env')
  }

  // Reenviar cookies y/o Authorization
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

  // 1) Traer paciente y lista de tratamientos en paralelo
  const [pRes, listRes] = await Promise.all([
    fetch(`${baseUrl}/pacientes/${patientId}`, {
      cache: 'no-store',
      headers: authHeaders,
    }),
    fetch(`${baseUrl}/pacientes/${patientId}/tratamientos`, {
      cache: 'no-store',
      headers: authHeaders,
    }),
  ])

  if (!pRes.ok) {
    const txt = await pRes.text()
    throw new Error(`Error cargando paciente (${pRes.status}): ${txt}`)
  }
  if (!listRes.ok) {
    const txt = await listRes.text()
    throw new Error(`Error cargando lista de tratamientos (${listRes.status}): ${txt}`)
  }

  const paciente      = await pRes.json()
  const tratamientos  = await listRes.json()
  // 2) Filtrar el tratamiento que nos interesa
  const treatment = tratamientos.find(
    t => String(t.treatment_id ?? t.id) === String(treatmentId)
  )

  if (!treatment) {
    // Opcionalmente arrojar un 404 customizado
    throw new Error(`Tratamiento ${treatmentId} no encontrado para paciente ${patientId}`)
  }

  return (
    <div className="container mx-auto px-8 py-8">
      <SectionTitle
        title={`${paciente.nombre} ${paciente.apellidos} — ${treatment.service_name}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          {
            label: `${paciente.nombre} ${paciente.apellidos}`,
            href: `/pacientes/${patientId}`,
          },
          {
            label: 'Tratamientos',
            href: `/pacientes/${patientId}/tratamientos`,
          },
          { label: treatment.service_name },
        ]}
      />
      <TreatmentDetailClient
        paciente={paciente}
        tratamiento={treatment}
      />
    </div>
  )
}
