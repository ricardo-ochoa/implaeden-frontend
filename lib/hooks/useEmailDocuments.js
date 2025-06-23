// lib/hooks/useEmailDocuments.js
import { useState } from 'react';

export default function useEmailDocuments() {
  const [alert, setAlert] = useState({
    open: false,
    severity: 'success',
    message: ''
  });
  // Ahora un set de labels cargando
  const [loadingLabels, setLoadingLabels] = useState(new Set());

  const sendDocuments = async ({ to, docs, label, treatmentName, patientName }) => {
    if (!to) {
      setAlert({ open: true, severity: 'error', message: '❌ No hay email del destinatario.' });
      return;
    }
    if (!Array.isArray(docs) || docs.length === 0) {
      setAlert({ open: true, severity: 'error', message: '❌ No hay documentos para enviar.' });
      return;
    }

    // Marca este label como cargando
    setLoadingLabels(labels => new Set(labels).add(label));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/email/enviar-documentos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            documentUrls: docs,
            subject: `[${label}] - ${treatmentName}`,
            body: `Hola ${patientName},\n\nAdjunto tus ${label} del servicio ${treatmentName}.\n\nSaludos, Implaedén®.\n\n`
          }),
        }
      );

      if (res.ok) {
        setAlert({ open: true, severity: 'success', message: '✅ Documentos enviados correctamente.' });
      } else {
        const { error } = await res.json();
        setAlert({
          open: true,
          severity: 'error',
          message: `❌ Error: ${error || 'No se pudo enviar'}`
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({ open: true, severity: 'error', message: '❌ Error inesperado al enviar.' });
    } finally {
      // Desmarca el label
      setLoadingLabels(labels => {
        const copy = new Set(labels);
        copy.delete(label);
        return copy;
      });
    }
  };

  const closeAlert = () => setAlert(a => ({ ...a, open: false }));

  return { alert, loadingLabels, sendDocuments, closeAlert };
}
