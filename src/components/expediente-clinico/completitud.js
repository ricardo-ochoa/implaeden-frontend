// components/expediente-clinico/completitud.js
// ---------------------------------------------------------------------------
// Reglas de "¿este paso ya quedó contestado?".
//
// Viven aquí y no dentro del wizard porque se usan en dos lugares:
//   - el stepper, para marcar en verde los pasos resueltos;
//   - la navegación, para no dejar avanzar desde un paso obligatorio incompleto.
//
// En los pasos obligatorios "contestado" significa respuesta explícita, incluido
// un "No": el formato en papel se firma completo y un renglón en blanco no
// distingue entre "el paciente no lo tiene" y "no se preguntó". En los pasos
// opcionales basta con que haya algo capturado; ahí el check es informativo.
// ---------------------------------------------------------------------------
import {
  ANTECEDENTES_HEREDOFAMILIARES,
  ANTECEDENTES_PATOLOGICOS,
  APARATOS_Y_SISTEMAS,
  DIENTES_FDI,
  EXPLORACION_CAMPOS,
  SIGNOS_VITALES,
} from './constants'

export const conTexto = (valor) => String(valor ?? '').trim() !== ''

// Los toggles guardan true / false / 'na'; null es "sin responder".
export const respondido = (valor) => valor === true || valor === false || valor === 'na'

// --- §2 Datos generales ----------------------------------------------------
export const datosGeneralesCompletos = (v) =>
  conTexto(v?.nombre) && conTexto(v?.edad) && conTexto(v?.sexo) && conTexto(v?.fechaConsulta)

// --- §3 Motivo de la consulta ----------------------------------------------
export const motivoCompleto = (v) => conTexto(v?.motivoConsulta)

// --- §4 Antecedentes heredofamiliares --------------------------------------
// Hay antecedentes si se marcó al menos un padecimiento o se escribió "Otros".
export const hayHeredofamiliares = (v) =>
  ANTECEDENTES_HEREDOFAMILIARES.some((item) => v?.heredofamiliares?.[item.id]?.presente === true) ||
  conTexto(v?.heredofamiliaresOtros)

export const heredofamiliaresCompletos = (v) =>
  hayHeredofamiliares(v) || v?.heredofamiliaresSinAntecedentes === true

// --- §5 Antecedentes patológicos -------------------------------------------
export const patologicosPendientes = (v) =>
  ANTECEDENTES_PATOLOGICOS.filter((item) => !respondido(v?.antecedentesPatologicos?.[item.id]?.presente))

export const patologicosCompletos = (v) => patologicosPendientes(v).length === 0

// --- §6 Medicamentos y alergias --------------------------------------------
// Un "Sí" sin el "¿cuál?" no sirve clínicamente: el dato que importa antes de
// tratar es qué medicamento o a qué es alérgico, no que exista alguno.
const respuestaConDetalle = (campo) =>
  respondido(campo?.presente) && (campo.presente !== true || conTexto(campo?.cual))

export const medicamentosCompletos = (v) =>
  respuestaConDetalle(v?.tomaMedicamento) && respuestaConDetalle(v?.alergicoMedicamento)

// --- §7 y §8 No patológicos y gineco-obstétricos ---------------------------
export const noPatologicosCompletos = (v) => respondido(v?.fuma) && respondido(v?.embarazada)

// --- Pasos opcionales: "tiene algo capturado" ------------------------------
export const padecimientoConDatos = (v) =>
  conTexto(v?.padecimientoActual) || conTexto(v?.padecimientosSistemicosBucalesPrevios)

export const aparatosConDatos = (v) => APARATOS_Y_SISTEMAS.some((a) => conTexto(v?.[a.id]))

export const exploracionConDatos = (v) =>
  SIGNOS_VITALES.some((s) => conTexto(v?.[s.id])) || EXPLORACION_CAMPOS.some((c) => conTexto(v?.[c.id]))

// Un odontograma recién abierto trae las 32 piezas en "sano": eso es el estado
// inicial, no una captura. Solo cuenta si algo se movió de ahí.
const odontogramaTocado = (odontograma) =>
  conTexto(odontograma?.fecha) ||
  DIENTES_FDI.some((fdi) => {
    const pieza = odontograma?.dientes?.[fdi]
    return (pieza?.estado && pieza.estado !== 'sano') || conTexto(pieza?.observaciones)
  })

export const odontogramaConDatos = (v) =>
  odontogramaTocado(v?.odontogramaInicial) || odontogramaTocado(v?.odontogramaFinal)

export const diagnosticoConDatos = (v) =>
  conTexto(v?.diagnostico) ||
  conTexto(v?.estudiosGabinete) ||
  conTexto(v?.odontologoId) ||
  conTexto(v?.fechaCitaSubsecuente)

// ---------------------------------------------------------------------------
// Los 11 pasos, sin nada de React: el wizard les agrega su componente y el
// historial los usa para contar sin montar el formulario. El orden es el mismo
// que el del formato en papel.
// ---------------------------------------------------------------------------
export const REGLAS_PASOS = [
  {
    id: 'datos-generales',
    titulo: 'Datos generales',
    obligatorio: true,
    completo: datosGeneralesCompletos,
    faltante: 'Faltan campos obligatorios en "Datos generales"',
  },
  {
    id: 'motivo',
    titulo: 'Motivo de la consulta',
    obligatorio: true,
    completo: motivoCompleto,
    faltante: 'Escribe el motivo de la consulta o usa "Revisión general"',
  },
  {
    id: 'heredofamiliares',
    titulo: 'Antecedentes heredofamiliares',
    obligatorio: true,
    completo: heredofamiliaresCompletos,
    faltante: 'Marca los antecedentes familiares o "No hay antecedentes"',
  },
  {
    id: 'patologicos',
    titulo: 'Antecedentes patológicos',
    obligatorio: true,
    completo: patologicosCompletos,
    // El mensaje se arma con el conteo real: con 14 renglones, saber cuántos
    // faltan ahorra buscarlos a ojo.
    faltante: (v) => `Faltan ${patologicosPendientes(v).length} padecimiento(s) por responder (Sí o No)`,
  },
  {
    id: 'medicamentos',
    titulo: 'Medicamentos y alergias',
    obligatorio: true,
    completo: medicamentosCompletos,
    faltante: 'Responde Sí o No en medicamentos y alergias, y especifica cuál si la respuesta es Sí',
  },
  {
    id: 'no-patologicos',
    titulo: 'No patológicos y gineco-obstétricos',
    obligatorio: true,
    completo: noPatologicosCompletos,
    faltante: 'Responde "¿Fuma?" y "¿Está embarazada?" (o marca "No aplica")',
  },
  { id: 'padecimiento', titulo: 'Padecimiento actual', completo: padecimientoConDatos },
  { id: 'aparatos', titulo: 'Aparatos y sistemas', completo: aparatosConDatos },
  { id: 'exploracion', titulo: 'Exploración física', completo: exploracionConDatos },
  { id: 'odontograma', titulo: 'Odontograma', completo: odontogramaConDatos },
  { id: 'diagnostico', titulo: 'Diagnóstico y seguimiento', completo: diagnosticoConDatos },
]

export const TOTAL_PASOS = REGLAS_PASOS.length

// Conteo para la lista del historial: cuántos pasos tienen respuesta y cuántos
// obligatorios siguen bloqueando que el expediente pueda darse por completado.
export const resumenCompletitud = (formData) => {
  const valores = formData || {}
  const contestados = REGLAS_PASOS.filter((p) => p.completo(valores)).length
  const obligatoriosPendientes = REGLAS_PASOS.filter((p) => p.obligatorio && !p.completo(valores)).length

  return { contestados, total: TOTAL_PASOS, obligatoriosPendientes }
}
