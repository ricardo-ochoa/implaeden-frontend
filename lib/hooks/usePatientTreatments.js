// lib/hooks/usePatientTreatments.js
import { useState, useCallback, useEffect } from "react";
import api from "../api";

const normalizeStatus = (raw) => {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return "Por Iniciar";
  if (v === "terminado") return "Terminado";
  if (v === "en proceso") return "En proceso";
  if (v === "por iniciar") return "Por Iniciar";
  return "Por Iniciar";
};

export default function usePatientTreatments(patientId) {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPatientTreatments = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get(`/pacientes/${patientId}/tratamientos`);

      const mapped = (data || []).map((t) => ({
        treatment_id: t.treatment_id,
        service_id: t.service_id,
        service_name: t.service_name,
        service_date: t.service_date,
        status: normalizeStatus(t.status),
        notes: t.notes,
        quantity: t.quantity,
        category: t.service_category,
        total_cost: t.total_cost != null ? parseFloat(t.total_cost) : 0,
        group_id: t.group_id ?? null,
        group_title: t.group_title ?? null,
        group_start_date: t.group_start_date ?? null,
        group_status: t.group_status ?? null,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }));

      setTreatments(mapped);
    } catch (err) {
      console.error("Error fetching treatments:", err);
      setError(
        err.response?.data?.message || err.message || "Error al obtener tratamientos"
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const deleteTreatment = useCallback(
    async (treatmentId) => {
      if (!patientId) return;
      try {
        await api.delete(`/pacientes/${patientId}/tratamientos/${treatmentId}`);
        setTreatments((prev) => prev.filter((t) => t.treatment_id !== treatmentId));
      } catch (err) {
        console.error("Error deleting treatment:", err);
        throw new Error(
          err.response?.data?.message || err.message || "Error al eliminar tratamiento"
        );
      }
    },
    [patientId]
  );

  useEffect(() => {
    fetchPatientTreatments();
  }, [fetchPatientTreatments]);

  return { treatments, loading, error, fetchPatientTreatments, deleteTreatment };
}
