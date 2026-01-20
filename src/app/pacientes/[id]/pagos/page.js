// app/pacientes/[id]/pagos/page.js
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PatientPaymentsClient from './PatientPaymentsClient'
import SectionTitle from '@/components/SectionTitle'

export default async function Page({ params }) {
  const { id } = params
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL no definida')

  // Reenvía cookies + token para autenticarte en tu API
  const cookieHeader = headers().get('cookie') || ''
  const token = cookies().get('token')?.value
  if (!token) redirect('/login')

  const fetchHeaders = {
    Authorization: `Bearer ${token}`,
    cookie: cookieHeader,
  }

  // Lanza las tres peticiones en paralelo
  const [pRes, pagosRes, tratRes] = await Promise.all([
    fetch(`${baseUrl}/pacientes/${id}`, { cache: 'no-store', headers: fetchHeaders }),
    fetch(`${baseUrl}/pacientes/${id}/pagos`, { cache: 'no-store', headers: fetchHeaders }),
    fetch(`${baseUrl}/pacientes/${id}/tratamientos`, { cache: 'no-store', headers: fetchHeaders }),
  ])

  if (!pRes.ok || !pagosRes.ok || !tratRes.ok) {
    const msgs = []
    if (!pRes.ok) msgs.push(`Paciente ${pRes.status}`)
    if (!pagosRes.ok) msgs.push(`Pagos ${pagosRes.status}`)
    if (!tratRes.ok) msgs.push(`Tratamientos ${tratRes.status}`)
    throw new Error('Error cargando datos → ' + msgs.join(' / '))
  }

  const paciente = await pRes.json()
  const initialPayments = await pagosRes.json()
  const tratamientosData = await tratRes.json()

  // Dale la forma que tu UI espera:
  const initialServicios = (tratamientosData || []).map((t) => ({
    id: t.treatment_id,
    name: t.service_name,
    totalCost: Number(t.total_cost) || 0,
  }))

  // (Opcional / fallback) info de tratamientos para agrupar si la necesitas en front
  const initialTreatments = (tratamientosData || []).map((t) => ({
    treatment_id: t.treatment_id,
    service_name: t.service_name,
    service_date: t.service_date,
    group_id: t.group_id ?? null,
    title: t.title ?? t.group_title ?? null,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title={`Historial de Pagos: ${paciente.nombre} ${paciente.apellidos}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: `${paciente.nombre} ${paciente.apellidos}`, href: `/pacientes/${paciente.id}` },
          { label: 'Pagos' },
        ]}
      />

      <PatientPaymentsClient
        paciente={paciente}
        initialPayments={initialPayments}
        initialServicios={initialServicios}
        initialTreatments={initialTreatments}
      />
    </div>
  )
}
