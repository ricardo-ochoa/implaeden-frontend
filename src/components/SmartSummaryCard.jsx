"use client";

import { useState } from "react";

export default function SmartSummaryCard({ patientId }) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnswer(null);

      const res = await fetch("/api/clinic-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: Number(patientId) }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al obtener resumen");
      }

      setAnswer(json.answer || "No se recibió respuesta de la IA.");
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-1">
        Resumen inteligente
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Obtén un resumen rápido del estado actual del paciente:
        última atención, próxima cita, pagos y evidencias.
      </p>

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? "Generando resumen..." : "Ver resumen inteligente"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {answer && (
        <div className="mt-3 text-sm text-gray-800 whitespace-pre-line">
          {answer}
        </div>
      )}
    </div>
  );
}
