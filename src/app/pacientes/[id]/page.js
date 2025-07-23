// app/pacientes/[id]/page.js
import { cookies } from 'next/headers'
import { redirect }           from 'next/navigation' 
import SectionTitle           from '@/components/SectionTitle'
import BasicInfoCard          from '@/components/BasicInfoCard'
import GeneralCard            from '@/components/GeneralCard'

export default async function PatientDetailPage({ params }) {
  const { id } = params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const token = cookies().get('token')?.value;
  if (!token) {
    redirect('/login');
  }

  // Trae el paciente usando ISR
  const res = await fetch(`${baseUrl}/pacientes/${id}`, {
    next: { 
      revalidate: 86400 // <-- día
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`No se pudo cargar paciente (${res.status})`);
  
  const patient = await res.json();

  // 6) Define las tarjetas
  const cards = [
    {
      title:       'Historial clínico',
      description: 'Documento con la información médico del paciente.',
      redirect:    `/pacientes/${id}/historial`,
    },
    {
      title:       'Tratamientos',
      description: 'Información y documentos de cada tratamiento.',
      redirect:    `/pacientes/${id}/tratamientos`,
    },
    {
      title:       'Pagos y compras',
      description: 'Historial de pagos de tratamientos.',
      redirect:    `/pacientes/${id}/pagos`,
    },
    {
      title:       'Citas',
      description: 'Fecha e información de cada cita del paciente.',
      redirect:    `/pacientes/${id}/citas`,
    },
  ]

  // 7) Renderiza
  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title={`${patient.nombre} ${patient.apellidos}`.trim()}
        breadcrumbs={[
          { label: 'Pacientes', href: '/pacientes' },
          { label: `${patient.nombre} ${patient.apellidos}`.trim() },
        ]}
      />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <BasicInfoCard patient={patient} />
        </div>
        <div className="md:grid md:grid-cols-2 gap-4">
          {cards.map((card, i) => (
            <GeneralCard
              key={i}
              title={card.title}
              description={card.description}
              redirect={card.redirect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
