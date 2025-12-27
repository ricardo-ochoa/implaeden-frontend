"use client";

import { useState } from "react";

export function useClinicAI() {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);

  const ask = async (question) => {
    try {
      setLoading(true);
      setError(null);
      setAnswer(null);
      setRawData(null);

      const res = await fetch("/api/clinic-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error en el asistente");
      }

      setAnswer(json.answer || null);
      setRawData(json.rawData || null);
    } catch (err) {
      console.error("Error en useClinicAI.ask:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return { ask, loading, answer, rawData, error };
}
