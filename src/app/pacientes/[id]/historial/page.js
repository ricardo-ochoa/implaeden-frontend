import SectionTitle from '@/components/SectionTitle'
import PatientHistoryClient from './PatientHistoryClient'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PatientHistoryPage({ params }) {
  const { id: patientId } = params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error('Define NEXT_PUBLIC_API_URL en .env')

  const cookieHeader = headers().get('cookie') || ''
  const token = cookies().get('token')?.value
  if (!token) {
    redirect('/login')
  }

  const authHeaders = {
    ...(cookieHeader && { cookie: cookieHeader }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const revalidationOptions = {
    next: { 
      revalidate: 600 // Cachea los datos por 10 minutos
    }, 
    headers: authHeaders 
  };

  const [pRes, hRes] = await Promise.all([
    fetch(`${baseUrl}/pacientes/${patientId}`, revalidationOptions),
    fetch(`${baseUrl}/clinical-histories/${patientId}`, revalidationOptions).catch(() => null),
  ]);

  if (!pRes.ok) {
    const errorText = await pRes.text();
    throw new Error(`Error cargando paciente (${pRes.status}): ${errorText}`);
  }
  
  const patient = await pRes.json();
  
  // --- LÓGICA CORREGIDA ---
  let clinicalRecords = []; // 1. Declara la variable vacía

  if (hRes && hRes.ok) {
    // 2. Lee el cuerpo de la respuesta UNA SOLA VEZ
    clinicalRecords = await hRes.json();
  } else if (hRes && hRes.status !== 404) {
    // Maneja otros errores para la petición del historial
    const errorText = await hRes.text();
    throw new Error(`Error cargando historial (${hRes.status}): ${errorText}`);
  }
  // Si hRes es null o es un 404, clinicalRecords simplemente se queda como un array vacío.

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