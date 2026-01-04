// app/pacientes/[id]/page.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SectionTitle from "@/components/SectionTitle";
import BasicInfoCard from "@/components/BasicInfoCard";
import GeneralCard from "@/components/GeneralCard";
import SmartSummaryAssistant from "@/components/SmartSummaryAssistant";

export default async function PatientDetailPage({ params }) {
  const { id } = params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const token = cookies().get("token")?.value;
  if (!token) redirect("/login");

  const res = await fetch(`${baseUrl}/pacientes/${id}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) redirect("/login");
  if (!res.ok) throw new Error(`No se pudo cargar paciente (${res.status})`);

  const patient = await res.json();
  const fullName = `${patient?.nombre || ""} ${patient?.apellidos || ""}`.trim();

  const cards = [
    {
      title: "Historial clínico",
      description: "Documento con la información médico del paciente.",
      redirect: `/pacientes/${id}/historial`,
    },
    {
      title: "Tratamientos",
      description: "Información y documentos de cada tratamiento.",
      redirect: `/pacientes/${id}/tratamientos`,
    },
    {
      title: "Pagos y compras",
      description: "Historial de pagos de tratamientos.",
      redirect: `/pacientes/${id}/pagos`,
    },
    {
      title: "Citas",
      description: "Fecha e información de cada cita del paciente.",
      redirect: `/pacientes/${id}/citas`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title={fullName}
        breadcrumbs={[
          { label: "Pacientes", href: "/pacientes" },
          { label: fullName },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Basic info */}
        <div className="space-y-4">
          <BasicInfoCard patient={patient} />
        </div>

        {/* Right: Action cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <GeneralCard
              key={card.redirect}
              title={card.title}
              description={card.description}
              redirect={card.redirect}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SmartSummaryAssistant patientId={Number(id)} />
      </div>
    </div>
  );
}
