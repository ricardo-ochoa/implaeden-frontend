// app/pacientes/[id]/page.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SectionTitle from "@/components/SectionTitle";
import SmartSummaryAssistant from "@/components/SmartSummaryAssistant";
import PatientDetailClient from "./PatientDetailClient";

export default async function PatientDetailPage({ params }) {
  const { id } = params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const token = cookies().get("token")?.value;
  if (!token) redirect("/login");

  const res = await fetch(`${baseUrl}/pacientes/${id}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) redirect("/login");
  if (!res.ok) throw new Error(`No se pudo cargar paciente (${res.status})`);

  const patient = await res.json();
  const fullName = `${patient?.nombre || ""} ${patient?.apellidos || ""}`.trim();

  const menuCards = [
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
      title: "Historial clínico",
      description: "Documento con la información médica del paciente.",
      redirect: `/pacientes/${id}/historial`,
    },
    {
      title: "Citas",
      description: "Fecha e información de cada cita del paciente.",
      redirect: `/pacientes/${id}/citas`,
    },
  ];

  return (
    <div className="px-8 py-4">
      <SectionTitle
        title={fullName}
        breadcrumbs={[
          { label: "Pacientes", href: "/pacientes" },
          { label: fullName },
        ]}
      />

      <PatientDetailClient
        patient={patient}
        patientId={Number(id)}
        menuCards={menuCards}
      />

      <div className="mt-6">
        <SmartSummaryAssistant patientId={Number(id)} />
      </div>
    </div>
  );
}
