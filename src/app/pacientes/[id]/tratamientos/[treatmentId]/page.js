// src/app/pacientes/[id]/tratamientos/[treatmentId]/page.js
import TreatmentDetailClient from './TreatmentDetailClient';

// Server Component para detalle de tratamiento con params dinámicos
export default async function Page({ params }) {
  const { id: patientId, treatmentId } = params;
  return <TreatmentDetailClient patientId={patientId} treatmentId={treatmentId} />;
}
