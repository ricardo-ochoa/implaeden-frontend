"use client";

import { useState } from "react";
import Image from "next/image";

// formateo de fechas helper
function formatDate(dateString) {
  if (!dateString) return "Sin fecha";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "Sin fecha";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Construimos los items de resumen a partir del JSON del backend
function buildSummaryItems(summary) {
  if (!summary) return [];

  const { patient, lastService, nextAppointment, lastPayment } = summary;
  const items = [];

  if (patient) {
    items.push({
      label: "Nombre del paciente",
      value: `${patient.nombre || ""} ${patient.apellidos || ""}`.trim(),
    });
  }

  if (lastService) {
    const fecha = lastService.service_date
      ? formatDate(lastService.service_date)
      : "Sin fecha";

    const costo =
      typeof lastService.total_cost === "number"
        ? `$${lastService.total_cost.toFixed(2)}`
        : null;

    const partes = [];
    if (lastService.service_name) partes.push(lastService.service_name);
    if (lastService.status) partes.push(`(${lastService.status})`);
    if (fecha) partes.push(`el ${fecha}`);
    if (costo) partes.push(`costo: ${costo}`);

    items.push({
      label: "Último servicio realizado",
      value: partes.join(" "),
    });
  } else {
    items.push({
      label: "Último servicio realizado",
      value: "No hay servicios registrados.",
    });
  }

  if (nextAppointment) {
    const fecha = nextAppointment.appointment_at
      ? formatDateTime(nextAppointment.appointment_at)
      : "Sin fecha";

    const partes = [];
    partes.push(fecha);
    if (nextAppointment.service_name) {
      partes.push(`para ${nextAppointment.service_name}`);
    }

    items.push({
      label: "Próxima cita",
      value: partes.join(" "),
    });
  } else {
    items.push({
      label: "Próxima cita",
      value: "No hay una cita programada.",
    });
  }

  if (lastPayment) {
    const fecha = lastPayment.fecha
      ? formatDate(lastPayment.fecha)
      : "Sin fecha";

    const monto =
      typeof lastPayment.monto === "number"
        ? `$${lastPayment.monto.toFixed(2)}`
        : null;

    const partes = [];
    partes.push(fecha);
    if (monto) partes.push(`monto: ${monto}`);
    if (lastPayment.payment_method) {
      partes.push(`(${lastPayment.payment_method})`);
    }
    if (lastPayment.payment_status) {
      partes.push(`estado: ${lastPayment.payment_status}`);
    }

    items.push({
      label: "Último pago",
      value: partes.join(" "),
    });
  } else {
    items.push({
      label: "Último pago",
      value: "No hay pagos registrados.",
    });
  }

  // NOTA: ya no incluimos número de evidencias aquí

  return items;
}

export default function SmartSummaryAssistant({ patientId }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const handleClick = async () => {
    try {
      setOpen(true);
      setLoading(true);
      setError(null);
      setSummary(null);

      const res = await fetch("/api/patient-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: Number(patientId) }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al obtener resumen");
      }

      setSummary(json);
    } catch (err) {
      console.error("Error en SmartSummaryAssistant:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const summaryItems = summary ? buildSummaryItems(summary) : [];

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-blue-50 text-white shadow-lg flex items-center justify-center hover:scale-105 hover:bg-blue-100 disabled:bg-slate-700 transition-transform transition-colors"
        aria-label="Ver resumen inteligente del paciente"
      >
        {loading ? (
          <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Image
            src="/icons/search.svg"
            alt="Resumen inteligente"
            width={34}
            height={34}
            className="opacity-90"
          />
        )}
      </button>

      {/* Panel / modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
          <div
            className="absolute inset-0 bg-black/30 pointer-events-auto"
            onClick={handleClose}
          />

          <div className="relative m-4 w-full max-w-sm pointer-events-auto">
            <div className="rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-sm">
                    <Image
                      src="/favicon.png"
                      alt="Resumen inteligente"
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Resumen inteligente
                    </p>
                    <p className="text-xs text-gray-500">
                      Estado actual del paciente
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="px-4 py-3 max-h-80 overflow-y-auto text-sm">
                {loading && (
                  <p className="text-gray-500">
                    Generando resumen… esto puede tomar unos segundos.
                  </p>
                )}

                {error && !loading && (
                  <p className="text-red-600">{error}</p>
                )}

                {summaryItems.length > 0 && !loading && !error && (
                  <ul className="space-y-3">
                    {summaryItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex gap-3 items-start rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                        <div>
                          {item.label && (
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {item.label}
                            </p>
                          )}
                          <p className="text-sm text-slate-900">
                            {item.value}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {!loading && !error && !summary && (
                  <p className="text-gray-500">
                    Haz clic en el botón flotante para generar un resumen.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
