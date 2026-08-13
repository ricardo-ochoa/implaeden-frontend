// components/expediente-clinico/constants.js
// ---------------------------------------------------------------------------
// Catálogos del formato físico "HISTORIA CLINICA ODONTOLOGICA" (FO-CD-00003).
// Los `id` de cada renglón son las llaves con las que se guarda el JSON en
// `clinical_records.form_data`, así que NO deben cambiar una vez en producción
// (renombrar un id = perder la respuesta de ese renglón en los expedientes ya
// capturados). Agregar renglones nuevos sí es seguro.
// ---------------------------------------------------------------------------

export const METADATOS_FORMATO = {
  clinicaNombre: 'IMPLAEDÉN – Implantando Sonrisas',
  consultorio: 'Consulta Ochoa Salaya',
  formatoCodigo: 'FO-CD-00003',
  formatoRevision: 'REV:00',
  formatoFecha: '2021-06-15',
}

export const SEXO_OPCIONES = ['Femenino', 'Masculino', 'Otro']

export const ESCOLARIDAD_OPCIONES = [
  'Sin estudios',
  'Primaria',
  'Secundaria',
  'Preparatoria',
  'Licenciatura',
  'Posgrado',
]

// §4 — Antecedentes heredofamiliares. "otros" se captura como texto libre.
export const ANTECEDENTES_HEREDOFAMILIARES = [
  { id: 'diabetesMellitus', label: 'Diabetes Mellitus' },
  { id: 'hipertensionArterial', label: 'Hipertensión Arterial' },
  { id: 'enfermedadCardiaca', label: 'Enfermedad Cardiaca' },
  { id: 'cancer', label: 'Cáncer' },
]

// §5 — Antecedentes personales patológicos: Sí / No / tiempo de evolución.
// El renglón 13 del papel está redactado como uno solo ("extracciones dentales
// o facilidad de sangrado relacionados con tratamiento"); aquí se captura como
// dos renglones porque son dos preguntas distintas y separarlas después
// obligaría a re-capturar. Confirmar con la clínica.
export const ANTECEDENTES_PATOLOGICOS = [
  { id: 'fiebreReumatica', label: 'Fiebre reumática o enfermedad cardioreumática' },
  { id: 'enfermedadesCardiovasculares', label: 'Enfermedades cardiovasculares' },
  { id: 'mareosDesmayos', label: 'Mareos, desmayos o ataques' },
  { id: 'diabetesMellitus', label: 'Diabetes Mellitus' },
  { id: 'hepatitis', label: 'Hepatitis' },
  { id: 'vihSida', label: 'VIH / SIDA' },
  { id: 'artritisReumatismo', label: 'Artritis o reumatismo' },
  { id: 'gastritisUlceras', label: 'Gastritis o úlceras estomacales' },
  { id: 'problemasRenales', label: 'Problemas renales' },
  { id: 'anemia', label: 'Anemia' },
  { id: 'hipertensionArterial', label: 'Hipertensión arterial' },
  { id: 'hipotensionArterial', label: 'Hipotensión arterial' },
  { id: 'extraccionesSangrado', label: 'Extracciones dentales con facilidad de sangrado' },
  { id: 'sangradoPorTratamiento', label: 'Sangrado relacionado con algún tratamiento' },
]

// §11 — Aparatos y sistemas. El texto guía viene impreso en el papel: se muestra
// como ayuda para el odontólogo, no se captura.
export const APARATOS_Y_SISTEMAS = [
  {
    id: 'aparatoCirculatorio',
    label: 'Circulatorio',
    ayuda:
      'Palpitaciones, angor, dolores precordiales, disnea, congestiones viscerales (hepatorrenales); edemas, trastornos vasculares periféricos (extremidades), (cefálicos, auditivos y oculares).',
  },
  {
    id: 'aparatoRespiratorio',
    label: 'Respiratorio',
    ayuda:
      'Tos, expectoración, hemoptisis, dolor torácico, disnea, cianosis, disfonía, estertores perceptibles para el enfermo.',
  },
  {
    id: 'aparatoDigestivo',
    label: 'Digestivo',
    ayuda:
      'Apetito, masticación, salivación, deglución, tránsito esofágico, funciones gástricas: secreción, sensibilidad, motilidad; vaciamiento, hematemesis, funciones intestinales (yeyuno: íleo, colon), sigmoide, recto anal. Defecación, fístulas, hemorroides, funciones hepáticas: bigénica (ictericia, prurito), circulatoria (hipertensión porta, ascitis), vías biliares (cólico), funciones pancreáticas, esteatorrea, cólico pancreático.',
  },
  {
    id: 'aparatoUrinario',
    label: 'Urinario',
    ayuda:
      'Diuresis en 24 horas, ritmo, eliminación, color de orina, dolor renoureteral, piuria, hematuria, funciones vesicales: motilidad, sensibilidad. Uretra: tránsito, secreción.',
  },
  {
    id: 'aparatoNervioso',
    label: 'Nervioso',
    ayuda:
      'Pares craneales: sensibilidad, coordinación, movimientos anormales, atrofias, lenguaje, marcha, motilidad, sueño.',
  },
]

// §12 — Habitus exterior / signos vitales.
export const SIGNOS_VITALES = [
  { id: 'fc', label: 'FC', unidad: 'lpm', tipo: 'number', placeholder: '72' },
  { id: 'fr', label: 'FR', unidad: 'rpm', tipo: 'number', placeholder: '16' },
  { id: 'temperatura', label: 'Temperatura', unidad: '°C', tipo: 'number', step: '0.1', placeholder: '36.5' },
  { id: 'tensionArterial', label: 'Tensión arterial', unidad: 'mmHg', tipo: 'text', placeholder: '120/80' },
  { id: 'glicemia', label: 'Glicemia', unidad: 'mg/dL', tipo: 'number', placeholder: '90' },
  { id: 'pesoActual', label: 'Peso actual', unidad: 'kg', tipo: 'number', step: '0.1', placeholder: '70' },
]

// §13 — Exploración de cabeza, cavidad oral y cuello.
export const EXPLORACION_CAMPOS = [
  { id: 'exploracionCabeza', label: 'Cabeza' },
  { id: 'exploracionCavidadOral', label: 'Cavidad oral' },
  { id: 'exploracionCuello', label: 'Cuello' },
]

// -------------------------------------------------------------------------
// §14 — Odontograma (MVP: un estado por pieza completa, no por cara).
// Los `id` se guardan en el JSON; los colores son clases de Tailwind para que
// el diagrama y la leyenda siempre usen la misma paleta.
// -------------------------------------------------------------------------
export const ESTADOS_DIENTE = [
  { id: 'sano', label: 'Sano', color: 'bg-background', borde: 'border-muted-foreground/40', texto: 'text-foreground' },
  { id: 'caries', label: 'Caries', color: 'bg-red-500', borde: 'border-red-600', texto: 'text-white' },
  { id: 'obturado', label: 'Obturado', color: 'bg-blue-500', borde: 'border-blue-600', texto: 'text-white' },
  { id: 'corona', label: 'Corona', color: 'bg-amber-400', borde: 'border-amber-500', texto: 'text-amber-950' },
  { id: 'endodoncia', label: 'Endodoncia', color: 'bg-purple-500', borde: 'border-purple-600', texto: 'text-white' },
  { id: 'implante', label: 'Implante', color: 'bg-teal-500', borde: 'border-teal-600', texto: 'text-white' },
  { id: 'sellante', label: 'Sellante', color: 'bg-lime-400', borde: 'border-lime-500', texto: 'text-lime-950' },
  { id: 'fractura', label: 'Fractura', color: 'bg-orange-500', borde: 'border-orange-600', texto: 'text-white' },
  { id: 'extraccion_indicada', label: 'Extracción indicada', color: 'bg-pink-500', borde: 'border-pink-600', texto: 'text-white' },
  { id: 'ausente', label: 'Ausente', color: 'bg-neutral-700', borde: 'border-neutral-800', texto: 'text-white' },
]

export const ESTADO_DIENTE_POR_ID = ESTADOS_DIENTE.reduce((acc, estado) => {
  acc[estado.id] = estado
  return acc
}, {})

// Notación FDI tal como aparece impresa en el formato: dos filas, cada una
// partida en dos cuadrantes.
export const CUADRANTES_FDI = {
  superiorDerecho: [18, 17, 16, 15, 14, 13, 12, 11],
  superiorIzquierdo: [21, 22, 23, 24, 25, 26, 27, 28],
  inferiorDerecho: [48, 47, 46, 45, 44, 43, 42, 41],
  inferiorIzquierdo: [31, 32, 33, 34, 35, 36, 37, 38],
}

export const DIENTES_FDI = [
  ...CUADRANTES_FDI.superiorDerecho,
  ...CUADRANTES_FDI.superiorIzquierdo,
  ...CUADRANTES_FDI.inferiorDerecho,
  ...CUADRANTES_FDI.inferiorIzquierdo,
]

export const ESTADOS_EXPEDIENTE = {
  borrador: { label: 'Borrador', variant: 'secondary' },
  completado: { label: 'Completado', variant: 'default' },
}
