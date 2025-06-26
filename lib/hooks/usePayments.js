// lib/hooks/usePayments.js
import { useState, useEffect, useCallback } from 'react';

export function usePayments(patientId) {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/pagos`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPayments(data.map(p => ({ 
        id: p.id,
        fecha: p.fecha.split('T')[0],
        tratamiento: p.tratamiento,
        patient_service_id: p.patient_service_id,
        total_cost: parseFloat(p.total_cost),
        monto:              parseFloat(p.monto),
        total_pagado:       parseFloat(p.total_pagado),
        saldo_pendiente:    parseFloat(p.saldo_pendiente),
        estado:             p.estado,
        numero_factura:     p.numero_factura,
        metodo_pago:        p.metodo_pago,
        notas:              p.notas,
      })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchPayments();
  }, [patientId, fetchPayments]);

  // 1) Crear
  const createPayment = useCallback(
    async (newPayment) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/pagos`,
        { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newPayment) }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const created = await res.json();
      setPayments(prev => [...prev, {
        id: created.id,
        fecha: created.fecha.split('T')[0],
        tratamiento: created.tratamiento,
        total_cost: parseFloat(created.total_cost),
        monto: parseFloat(created.monto),
        total_pagado: parseFloat(created.total_pagado),
        saldo_pendiente: parseFloat(created.saldo_pendiente),
        estado: created.estado,
        numero_factura: created.numero_factura,
        metodo_pago: created.metodo_pago,
        notas: created.notas,
      }]);
    },
    [patientId]
  );

  // 2) Actualizar
// lib/hooks/usePayments.js
const updatePayment = useCallback(
    async (edited) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/pagos/${edited.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(edited),
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
  
      // Aquí fusionamos el objeto editado con el original
      setPayments(prev =>
        prev.map(p =>
          p.id === edited.id
            ? { ...p, ...edited }
            : p
        )
      );
    },
    [patientId]
  );  

  // 3) Eliminar
  const deletePayment = useCallback(
    async (idToDelete) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pacientes/${patientId}/pagos/${idToDelete}`,
        { method:'DELETE' }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setPayments(prev => prev.filter(p => p.id !== idToDelete));
    },
    [patientId]
  );

  return {
    payments,
    loading,
    error,
    refresh: fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
  };
}
