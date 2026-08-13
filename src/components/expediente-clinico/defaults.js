// components/expediente-clinico/defaults.js
// ---------------------------------------------------------------------------
// Forma del JSON que se guarda en `clinical_records.form_data` y utilidades
// para crearlo/normalizarlo.
//
// `normalizeExpediente` mezcla lo guardado con los defaults actuales: así, si
// mañana se agrega un campo al formato, los expedientes viejos siguen abriendo
// sin campos `undefined` (que en React vuelven los inputs no controlados).
// ---------------------------------------------------------------------------
import {
  ANTECEDENTES_HEREDOFAMILIARES,
  ANTECEDENTES_PATOLOGICOS,
  APARATOS_Y_SISTEMAS,
  DIENTES_FDI,
} from './constants'

export const hoyYMD = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return ''
  const nacimiento = new Date(fechaNacimiento)
  if (Number.isNaN(nacimiento.getTime())) return ''

  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1

  return edad >= 0 && edad < 130 ? String(edad) : ''
}

const odontogramaVacio = () => ({
  fecha: '',
  dientes: DIENTES_FDI.reduce((acc, fdi) => {
    acc[fdi] = { estado: 'sano', observaciones: '' }
    return acc
  }, {}),
})

export const createEmptyExpediente = () => ({
  // §2 Datos generales
  nombre: '',
  edad: '',
  sexo: '',
  domicilio: '',
  lugarResidencia: '',
  telefono: '',
  correo: '',
  escolaridad: '',
  ocupacion: '',
  fechaConsulta: hoyYMD(),

  // §3 Motivo de la consulta
  motivoConsulta: '',

  // §4 Antecedentes heredofamiliares
  heredofamiliares: ANTECEDENTES_HEREDOFAMILIARES.reduce((acc, item) => {
    acc[item.id] = { presente: false, parentesco: '' }
    return acc
  }, {}),
  heredofamiliaresOtros: '',

  // §5 Antecedentes personales patológicos (presente: null = sin responder)
  antecedentesPatologicos: ANTECEDENTES_PATOLOGICOS.reduce((acc, item) => {
    acc[item.id] = { presente: null, tiempoEvolucion: '' }
    return acc
  }, {}),

  // §6 Medicamentos y alergias
  tomaMedicamento: { presente: null, cual: '' },
  alergicoMedicamento: { presente: null, cual: '' },
  otrosMedicamentos: '',

  // §7 Antecedentes personales no patológicos
  fuma: null,
  fumaDesdeCuando: '',
  fumaCigarrosPorDia: '',

  // §8 Antecedentes gineco-obstétricos
  embarazada: null,
  mesesGestacion: '',
  problemaPeriodoMenstrual: '',

  // §9 y §10 Padecimientos
  padecimientoActual: '',
  padecimientosSistemicosBucalesPrevios: '',

  // §11 Aparatos y sistemas
  ...APARATOS_Y_SISTEMAS.reduce((acc, aparato) => {
    acc[aparato.id] = ''
    return acc
  }, {}),

  // §12 Habitus exterior
  fc: '',
  fr: '',
  temperatura: '',
  tensionArterial: '',
  glicemia: '',
  pesoActual: '',

  // §13 Cabeza, cavidad oral, cuello
  exploracionCabeza: '',
  exploracionCavidadOral: '',
  exploracionCuello: '',

  // §14 Odontograma
  odontogramaInicial: odontogramaVacio(),
  odontogramaFinal: odontogramaVacio(),

  // §15 Estudios, diagnóstico y seguimiento
  estudiosGabinete: '',
  diagnostico: '',
  fechaPrimeraConsulta: '',
  fechaCitaSubsecuente: '',
  // El odontólogo se elige del catálogo `doctors`; se guarda el id y también
  // nombre/cédula, para que el expediente conserve quién firmó aunque el
  // catálogo cambie después.
  odontologoId: '',
  odontologoNombre: '',
  odontologoCedula: '',
  pacienteConfirma: false,
  pacienteConfirmaFecha: '',
})

// Datos generales precargados desde el módulo de pacientes (§2, nota del spec).
export const prefillDesdePaciente = (patient) => {
  if (!patient) return {}

  const nombre = `${patient.nombre || ''} ${patient.apellidos || ''}`.trim()

  return {
    ...(nombre && { nombre }),
    ...(patient.fecha_nacimiento && { edad: calcularEdad(patient.fecha_nacimiento) }),
    ...(patient.telefono && { telefono: patient.telefono }),
    ...(patient.email && { correo: patient.email }),
    ...(patient.direccion && { domicilio: patient.direccion }),
  }
}

const esObjetoPlano = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

// Mezcla profunda contra los defaults: lo guardado gana, pero nunca deja huecos.
const mergeConDefaults = (base, guardado) => {
  if (!esObjetoPlano(guardado)) return base

  const salida = { ...base }

  Object.keys(base).forEach((key) => {
    const valorGuardado = guardado[key]
    if (valorGuardado === undefined) return

    salida[key] = esObjetoPlano(base[key])
      ? mergeConDefaults(base[key], valorGuardado)
      : valorGuardado
  })

  return salida
}

export const normalizeExpediente = (formData, patient) => {
  const base = { ...createEmptyExpediente(), ...prefillDesdePaciente(patient) }
  return mergeConDefaults(base, formData)
}

// Resumen corto para la lista del historial.
export const resumenExpediente = (record) => {
  const texto = record?.motivo_consulta || record?.diagnostico || ''
  return typeof texto === 'string' ? texto.trim() : ''
}
