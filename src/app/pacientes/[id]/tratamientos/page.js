// src/app/pacientes/[id]/tratamientos/page.js
import SectionTitle from '@/components/SectionTitle'
import TratamientosClient from './TratamientosClient'
import { redirect } from 'next/navigation' 
import { headers, cookies } from 'next/headers'

export default async function Page({ params }) {
  const { id } = params
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('❌ Define NEXT_PUBLIC_API_URL en tu .env')

  // 1) Reenviar cookie y/o Authorization
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

  // 2) Fetch en paralelo
  const [pRes, tRes] = await Promise.all([
    fetch(`${baseUrl}/pacientes/${id}`,       { cache: 'no-store', headers: authHeaders }),
    fetch(`${baseUrl}/pacientes/${id}/tratamientos`, { cache: 'no-store', headers: authHeaders }),
  ])

  // 3) Manejo de errores
  if (!pRes.ok) {
    const txt = await pRes.text()
    throw new Error(`Error cargando paciente (${pRes.status}): ${txt}`)
  }
  if (tRes && !tRes.ok && tRes.status !== 404) {
    const txt = await tRes.text()
    throw new Error(`Error cargando tratamientos (${tRes.status}): ${txt}`)
  }

  // 4) Parseo de JSON
  const paciente = await pRes.json()
  const initialTratamientos = tRes.ok ? await tRes.json() : []

  return (
    <div className="container mx-auto px-8 py-8">
      <SectionTitle
        title={`Tratamientos — ${paciente.nombre} ${paciente.apellidos}`}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: `${paciente.nombre} ${paciente.apellidos}`, href: `/pacientes/${paciente.id}` },
          { label: 'Tratamientos' },
        ]}
      />
      <TratamientosClient
        paciente={paciente}
        initialTratamientos={initialTratamientos}
      />
    </div>
  )
}
