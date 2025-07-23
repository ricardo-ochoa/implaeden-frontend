import { headers, cookies } from 'next/headers'
import CitasClient from './CitasClient'
import SectionTitle from '@/components/SectionTitle'
import { redirect } from 'next/navigation' 

export default async function Page({ params }) {
  const id = params.id; 
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('❌ NEXT_PUBLIC_API_URL no está definida')

  const cookieStore = cookies(); // Primer paso: obtener el almacén
  const token = cookieStore.get('token')?.value; // Segundo paso: obtener el valor

  if (!token) {
    redirect('/login')
  }

  // Opciones de fetch con ISR: cachear por 5 minutos
  const fetchOpts = {
    next: { 
      revalidate: 86400 
    },
    headers: { Authorization: `Bearer ${token}` },
  }

  // Hacemos los fetchs en paralelo
  const [patientRes, citasRes, serviciosRes] = await Promise.all([
    fetch(`${baseUrl}/pacientes/${id}`, fetchOpts),
    fetch(`${baseUrl}/pacientes/${id}/citas`, fetchOpts),
    fetch(`${baseUrl}/servicios`, fetchOpts),
  ])

  // Chequeo de errores (sin cambios)
  if (!patientRes.ok) throw new Error(`Error cargando paciente (${patientRes.status})`)
  // Puedes manejar los errores de citas y servicios de forma más granular si lo necesitas
  
  // Parseo de JSON
  const paciente = await patientRes.json()
  const citasData = citasRes.ok ? await citasRes.json() : []
  const servicios = serviciosRes.ok ? await serviciosRes.json() : []

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
        paciente={paciente}
        initialCitas={citasData}
        initialServicios={servicios}
      />
    </div>
  )
}