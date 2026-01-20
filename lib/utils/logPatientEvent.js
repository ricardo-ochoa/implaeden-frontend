// utils/logPatientEvent.js
const db = require('../config/db')

/**
 * Helper puro para registrar eventos del paciente desde cualquier módulo.
 *
 * Reglas:
 * - Debe existir patientId
 * - Debe existir eventType (código: 'note', 'evidence_added', etc.)
 * - Debe existir message
 * - Si no mandas patientServiceGroupId pero sí patientServiceId, autocompleta group_id desde patient_services
 * - Inserta en patient_treatment_events:
 *    patient_id, patient_service_id, patient_service_group_id, event_type, message, meta, created_by, created_at
 */
async function logPatientEvent({
  patientId,
  patientServiceId = null,
  patientServiceGroupId = null,
  eventType = 'note',
  message,
  meta = null,
  createdBy = null,
}) {
  if (!patientId) throw new Error('logPatientEvent: patientId requerido')
  if (!eventType) throw new Error('logPatientEvent: eventType requerido')
  if (!message || !String(message).trim())
    throw new Error('logPatientEvent: message requerido')

  const pid = Number(patientId)
  if (!pid || Number.isNaN(pid))
    throw new Error('logPatientEvent: patientId inválido')

  const sid = patientServiceId ? Number(patientServiceId) : null
  const createdByNum = createdBy ? Number(createdBy) : null

  // meta a JSON string o null
  const metaJson =
    meta === null || meta === undefined
      ? null
      : typeof meta === 'string'
      ? meta
      : JSON.stringify(meta)

  // ✅ Resolver group_id si no viene y sí hay serviceId
  let resolvedGroupId = patientServiceGroupId ? Number(patientServiceGroupId) : null

  if (!resolvedGroupId && sid) {
    const [[ps]] = await db.query(
      `SELECT group_id FROM patient_services WHERE id = ? LIMIT 1`,
      [sid]
    )
    resolvedGroupId = ps?.group_id ? Number(ps.group_id) : null
  }

  const insertSql = `
    INSERT INTO patient_treatment_events
      (patient_id, patient_service_id, patient_service_group_id, event_type, message, meta, created_by, created_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, NOW())
  `

  const [ins] = await db.query(insertSql, [
    pid,
    sid,
    resolvedGroupId,
    String(eventType),
    String(message),
    metaJson,
    createdByNum,
  ])

  return {
    id: ins?.insertId,
    patient_service_group_id: resolvedGroupId,
  }
}

module.exports = { logPatientEvent }
