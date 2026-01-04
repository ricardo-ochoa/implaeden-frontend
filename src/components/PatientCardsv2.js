"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SmartSummaryAssistant from "@/components/SmartSummaryAssistant";
import { Button } from "@/components/ui/button";
import { useRandomAvatar } from "../../lib/hooks/useRandomAvatar";
import {
  CalendarDays,
  User,
  Phone,
  Mail,
  MessageSquareText,
} from "lucide-react";

export default function PatientCards({ patients = [] }) {
  const router = useRouter();

  const patientsWithAvatars = useMemo(
    () =>
      patients.map((patient) => ({
        ...patient,
        avatarUrl: useRandomAvatar(patient.foto_perfil_url, patient.id),
      })),
    [patients]
  );

  const handleNavigateToCitas = (e, patientId) => {
    e.stopPropagation();
    router.push(`/pacientes/${patientId}/citas`);
  };

  const handleCopyToClipboard = async (e, value) => {
    e.stopPropagation();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${value} se ha copiado`);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  if (patientsWithAvatars.length === 0) {
    return (
      <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-200 p-8 text-center dark:from-slate-950 dark:to-slate-900">
        <User className="mx-auto mb-3 h-14 w-14 opacity-70" />
        <div className="text-lg font-semibold opacity-80">
          No se encontró ningún paciente.
        </div>
        <div className="mt-1 text-sm opacity-70">
          Los pacientes aparecerán aquí cuando los agregues.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {patientsWithAvatars.map((patient) => (
        <div
          key={patient.id}
          onClick={() => router.push(`/pacientes/${patient.id}`)}
          className={[
            "group relative h-[250px] cursor-pointer overflow-hidden rounded-2xl",
            "border-[6px] border-white dark:border-border",
            "transition-all duration-300 ease-out",
            "hover:shadow-2xl hover:shadow-black/40",
            "lg:hover:scale-[1.20] lg:hover:z-20 shadow-md",
          ].join(" ")}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
            style={{ backgroundImage: `url(${patient.avatarUrl})` }}
          />

          {/* overlay azul al hover */}
          <div className="absolute inset-0 bg-[rgba(0,40,105,0.90)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* gradient inferior siempre visible */}
            <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[rgba(0,40,105,1)] via-[rgba(0,40,105,0.35)] to-transparent" />


          {/* content */}
          <div className="relative z-10 flex h-full flex-col justify-end p-4 text-white">
            {/* hover content */}
            <div className="mb-3 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {/* phone */}
              <div
                className="mb-2 flex items-center gap-2 font-semibold transition-transform hover:scale-[1.02]"
                onClick={(e) => handleCopyToClipboard(e, patient.telefono)}
                role="button"
                tabIndex={0}
              >
                <Phone className="h-4 w-4 opacity-80" />
                <span className="text-sm">
                  {patient.telefono || "N/A"}
                </span>
              </div>

              {/* email */}
              <div
                className="mb-3 flex items-center gap-2 font-semibold transition-transform hover:scale-[1.02]"
                onClick={(e) => handleCopyToClipboard(e, patient.email)}
                role="button"
                tabIndex={0}
                title={patient.email || ""}
              >
                <Mail className="h-4 w-4 opacity-80" />
                <span className="min-w-0 truncate text-sm">
                  {patient.email || "N/A"}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full font-bold"
                  onClick={(e) => handleNavigateToCitas(e, patient.id)}
                >
                  <CalendarDays className="w-4" />
                  Ver Citas
                </Button>

                <SmartSummaryAssistant patientId={Number(patient.id)} variant="inline">
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full font-bold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageSquareText className="w-4" />
                    Resumen
                  </Button>
                </SmartSummaryAssistant>
              </div>
            </div>

            {/* name */}
            <div className="text-lg font-bold leading-none drop-shadow-sm">
              {patient.nombre} {patient.apellidos}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
