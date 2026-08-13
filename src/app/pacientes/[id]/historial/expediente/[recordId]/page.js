import SectionTitle from '@/components/SectionTitle'
import ExpedienteWizard from '@/components/expediente-clinico/ExpedienteWizard'
import { headers, cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

export default async function ExpedienteClinicoPage({ params }) {
  const { id: patientId, recordId } = params

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('Define NEXT_PUBLIC_API_URL en .env')

  const cookieHeader = headers().get('cookie') || ''
  const token = cookies().get('token')?.value
  if (!token) {
    redirect('/login')
  }

  const authHeaders = {
    ...(cookieHeader && { cookie: cookieHeader }),
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  // Sin caché: el expediente se guarda paso a paso y se vuelve a abrir seguido.
  const fetchOptions = { cache: 'no-store', headers: authHeaders }

  const [pRes, rRes] = await Promise.all([
    fetch(`${baseUrl}/pacientes/${patientId}`, fetchOptions),
    fetch(`${baseUrl}/pacientes/${patientId}/expediente/${recordId}`, fetchOptions),
  ])

  if (!pRes.ok) {
    const errorText = await pRes.text()
    throw new Error(`Error cargando paciente (${pRes.status}): ${errorText}`)
  }

  if (rRes.status === 404) {
    notFound()
  }

  if (!rRes.ok) {
    const errorText = await rRes.text()
    throw new Error(`Error cargando expediente (${rRes.status}): ${errorText}`)
  }

  const patient = await pRes.json()
  const record = await rRes.json()

  const nombrePaciente = `${patient.nombre} ${patient.apellidos}`

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title={`${nombrePaciente} — Expediente clínico`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: nombrePaciente, href: `/pacientes/${patientId}` },
          { label: 'Historial clínico', href: `/pacientes/${patientId}/historial` },
          { label: 'Expediente clínico' },
        ]}
      />

      <ExpedienteWizard patient={patient} patientId={patientId} record={record} />
    </div>
  )
}
