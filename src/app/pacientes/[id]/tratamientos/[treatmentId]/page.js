// src/app/pacientes/[id]/tratamientos/[treatmentId]/page.js
import SectionTitle from '@/components/SectionTitle'
import TreatmentDetailClient from './TreatmentDetailClient'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page({ params }) {
  const { id: patientId, treatmentId } = params

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('Define NEXT_PUBLIC_API_URL en .env')

  // Reenviar cookies y/o Authorization
  const cookieHeader = headers().get('cookie') || ''
  const token = cookies().get('token')?.value

  if (!token) redirect('/login')

  const authHeaders = {
    ...(cookieHeader && { cookie: cookieHeader }),
    ...(token && { Authorization: `Bearer ${token}` }),
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

  const paciente = await pRes.json()
  const tratamientos = await listRes.json()

  // 2) Encontrar el treatment del URL
  const current = (tratamientos || []).find(
    (t) => String(t?.treatment_id ?? t?.id) === String(treatmentId)
  )

  if (!current) {
    throw new Error(`Tratamiento ${treatmentId} no encontrado para paciente ${patientId}`)
  }

  // 3) Si pertenece a grupo => traer TODOS los del grupo, si no => solo 1
  const groupId = current?.group_id
  const tratamientosParaDetalle = groupId
    ? (tratamientos || []).filter((t) => String(t?.group_id) === String(groupId))
    : [current]

  // (opcional) ordenar dentro del detalle por fecha asc
  tratamientosParaDetalle.sort((a, b) => {
    const da = new Date(a?.service_date || 0).getTime()
    const db = new Date(b?.service_date || 0).getTime()
    return (Number.isFinite(da) ? da : 0) - (Number.isFinite(db) ? db : 0)
  })

  const isGroup = Boolean(groupId)

  const headerTitle = isGroup
    ? `${paciente.nombre} ${paciente.apellidos} — Paquete de tratamientos`
    : `${paciente.nombre} ${paciente.apellidos} — ${current.service_name}`

  return (
    <div className="container mx-auto px-8 py-8">
      <SectionTitle
        title={headerTitle}
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
          { label: isGroup ? 'Paquete' : current.service_name },
        ]}
      />

      <TreatmentDetailClient
        paciente={paciente}
        tratamientos={tratamientosParaDetalle}
        isGroup={isGroup}
        activeTreatmentId={treatmentId}
      />
    </div>
  )
}
