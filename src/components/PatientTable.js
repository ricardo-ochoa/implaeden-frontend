"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import SmartSummaryAssistant from "./SmartSummaryAssistant";
import { useRandomAvatar } from "../../lib/hooks/useRandomAvatar";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { CalendarDays } from "lucide-react";

export default function PatientTable({ patients = [] }) {
  const router = useRouter();

  const randomAvatar = useRandomAvatar();
  const patientsWithAvatars = useMemo(
    () =>
      patients.map((patient) => ({
        ...patient,
        avatarUrl: patient.foto_perfil_url || randomAvatar,
      })),
    [patients, randomAvatar]
  );

  const handleNavigateToDetails = (patientId) => {
    router.push(`/pacientes/${patientId}`);
  };

  const handleNavigateToCitas = (patientId) => {
    router.push(`/pacientes/${patientId}/citas`);
  };

  return (
    <div className="mb-2 overflow-x-auto rounded-xl border bg-card">
      <Table className="min-w-[650px]">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="px-3 py-3 text-xs font-semibold tracking-wide">
              NOMBRE
            </TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold tracking-wide">
              TELÉFONO
            </TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold tracking-wide">
              EMAIL
            </TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold tracking-wide">
              RESUMEN
            </TableHead>
            <TableHead className="px-3 py-3 text-right text-xs font-semibold tracking-wide">
              CITAS
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {patientsWithAvatars.length > 0 ? (
            patientsWithAvatars.map((patient) => {
              const fullName = `${patient.nombre} ${patient.apellidos}`.trim();
              const initials =
                (patient.nombre?.[0] || "") + (patient.apellidos?.[0] || "");

              return (
                <TableRow
                  key={patient.id}
                  onClick={() => handleNavigateToDetails(patient.id)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <TableCell className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToDetails(patient.id);
                        }}
                        className="rounded-full"
                        aria-label={`Abrir perfil de ${fullName}`}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={patient.avatarUrl}
                            alt={fullName}
                          />
                          <AvatarFallback>
                            {initials || "P"}
                          </AvatarFallback>
                        </Avatar>
                      </button>

                      <div className="font-semibold">{fullName}</div>
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-2 font-medium">
                    {patient.telefono || "N/A"}
                  </TableCell>

                  <TableCell className="px-3 py-2 font-medium">
                    {patient.email || "N/A"}
                  </TableCell>

                  <TableCell
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SmartSummaryAssistant
                      patientId={Number(patient.id)}
                      variant="inline"
                    />
                  </TableCell>

                  <TableCell className="px-3 py-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToCitas(patient.id);
                      }}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Ver citas
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="px-3 py-10 text-center">
                <div className="text-sm text-muted-foreground">
                  No se encontró ningún paciente.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
