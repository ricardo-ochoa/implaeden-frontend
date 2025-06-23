// lib/hooks/useTreatmentEvidences.js
import { useState, useEffect, useCallback } from 'react';

export default function useTreatmentEvidences({ patientId, treatmentId }) {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const base = process.env.NEXT_PUBLIC_API_URL; // ej: http://localhost:4000/api

  const load = useCallback(async () => {
    if (!patientId || !treatmentId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${base}/pacientes/${patientId}/tratamientos/${treatmentId}/evidencias`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEvidences(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [base, patientId, treatmentId]);

  useEffect(() => { load(); }, [load]);

  const uploadEvidences = useCallback(async files => {
    if (!patientId || !treatmentId) return;
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      const res = await fetch(
        `${base}/pacientes/${patientId}/tratamientos/${treatmentId}/evidencias`,
        { method: 'POST', body: form }
      );
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [base, patientId, treatmentId, load]);

  const deleteEvidence = useCallback(async id => {
    try {
      const res = await fetch(
        `${base}/pacientes/${patientId}/tratamientos/${treatmentId}/evidencias/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(await res.text());
      setEvidences(e => e.filter(x => x.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }, [base, patientId, treatmentId]);

  return { evidences, loading, error, uploadEvidences, deleteEvidence, reload: load };
}
