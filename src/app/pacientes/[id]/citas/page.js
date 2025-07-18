// app/pacientes/[id]/citas/page.js
import { headers, cookies } from 'next/headers'
import CitasClient from './CitasClient'
import SectionTitle from '@/components/SectionTitle'
import { redirect } from 'next/navigation' 

export default async function Page({ params }) {
  const { id } = params
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('❌ NEXT_PUBLIC_API_URL no está definida')

  // 1) Intenta leer Authorization (p.ej. si viene de un middleware)
  const incomingAuth = headers().get('authorization')
  // 2) O, si guardas JWT en cookie 'token', léela
  const tokenCookie = cookies().get('token')?.value
  // 3) Arma tu Bearer
  const bearer = incomingAuth ?? (tokenCookie ? `Bearer ${tokenCookie}` : null)
  if (!bearer) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h2>❌ No estás autenticado</h2>
        <p>No se encontró ni cabecera Authorization ni cookie 'token'.</p>
      </div>
    )
  }

  if (!tokenCookie) {
    // No hay token → redirige al login
    redirect('/login')
  }

  // Cabeceras comunes
  const fetchOpts = {
    cache: 'no-store',
    headers: { Authorization: bearer },
  }

  // 4) Haz los fetchs en paralelo
  const [patientRes, citasRes, serviciosRes] = await Promise.all([
    fetch(`${baseUrl}/pacientes/${id}`,         fetchOpts),
    fetch(`${baseUrl}/pacientes/${id}/citas`,   fetchOpts),
    fetch(`${baseUrl}/servicios`,               fetchOpts),
  ])

  // 5) Chequeo de errores
  if (!patientRes.ok || !citasRes.ok || !serviciosRes.ok) {
    const msg = []
    if (!patientRes.ok)   msg.push(`Paciente: ${patientRes.status}`)
    if (!citasRes.ok)     msg.push(`Citas: ${citasRes.status}`)
    if (!serviciosRes.ok) msg.push(`Servicios: ${serviciosRes.status}`)
    throw new Error('Error auth al cargar datos → ' + msg.join(', '))
  }

  // 6) Parseo
  const paciente    = await patientRes.json()
  const citasData   = await citasRes.json()
  const servicios   = await serviciosRes.json()

  // 7) Renderiza tu Client Component pasándole los props
  return (
        <div className="container mx-auto px-4 py-8">
          <SectionTitle
            title={`Historial de Citas: ${paciente.nombre} ${paciente.apellidos}`}
            breadcrumbs={[
              { label: 'Pacientes', href: '/pacientes' },
              { label: `${paciente.nombre} ${paciente.apellidos}`, href: `/pacientes/${paciente.id}` },
              { label: 'Citas' },
            ]}
          />
    <CitasClient
      paciente         ={paciente}
      initialCitas     ={citasData}
      initialServicios ={servicios}
    />
        </div>
  )
}
