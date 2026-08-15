"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import BasicInfoCard from "@/components/BasicInfoCard";
import { Card, CardContent } from "@/components/ui/card";

const TratamientosClient = dynamic(() => import("./tratamientos/TratamientosClient"), {
  ssr: false,
  loading: () => <PanelLoading />,
});
const PatientPaymentsClient = dynamic(() => import("./pagos/PatientPaymentsClient"), {
  ssr: false,
  loading: () => <PanelLoading />,
});
const PatientHistoryClient = dynamic(() => import("./historial/PatientHistoryClient"), {
  ssr: false,
  loading: () => <PanelLoading />,
});
const CitasClient = dynamic(() => import("./citas/CitasClient"), {
  ssr: false,
  loading: () => <PanelLoading />,
});
const PatientFiscalClient = dynamic(() => import("./fiscal/PatientFiscalClient"), {
  ssr: false,
  loading: () => <PanelLoading />,
});

function PanelLoading() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      <div className="h-4 w-80 bg-muted rounded animate-pulse" />
      <div className="h-32 w-full bg-muted rounded animate-pulse" />
    </div>
  );
}

const pickTitle = (v = "") => String(v || "").toLowerCase();

/** ✅ tailwind lg = 1024px (mobile: max-width 1023px) */
function useIsMobileLg() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setIsMobile(mq.matches);

    onChange(); // set initial
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return isMobile;
}

export default function PatientDetailClient({ patient, patientId, menuCards = [] }) {
  const isMobile = useIsMobileLg();

  const defaultMenu = menuCards?.[0]?.title || "Tratamientos";
  const [activeMenu, setActiveMenu] = useState(defaultMenu);

  const content = useMemo(() => {
    const t = pickTitle(activeMenu);

    if (t.includes("trat")) return <TratamientosClient paciente={{ id: patientId }} />;
    if (t.includes("pago") || t.includes("compra"))
      return <PatientPaymentsClient paciente={{ id: patientId }} />;
    if (t.includes("historial"))
      return (
        <PatientHistoryClient
          patient={patient}
          patientId={patientId}
          clinicalRecords={[]}
        />
      );
    if (t.includes("cita")) return <CitasClient patientId={patientId} paciente={patient} />;
    if (t.includes("fiscal") || t.includes("factur"))
      return <PatientFiscalClient patientId={patientId} patient={patient} />;

    return <TratamientosClient paciente={{ id: patientId }} />;
  }, [activeMenu, patientId, patient]);

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      {/* LEFT */}
      <div className="w-full lg:max-w-sm shrink-0">
        <BasicInfoCard
          patient={patient}
          patientId={patientId}
          menuCards={menuCards}
          activeMenu={isMobile ? "" : activeMenu}
          onMenuSelect={isMobile ? undefined : setActiveMenu}
        />
      </div>

      {/* RIGHT (solo desktop) */}
      {!isMobile ? (
        <div className="flex-1 min-w-0">
          <Card className="border-border bg-card">
            <CardContent className="p-5">{content}</CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
