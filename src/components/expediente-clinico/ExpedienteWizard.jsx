'use client'

// components/expediente-clinico/ExpedienteWizard.jsx
// ---------------------------------------------------------------------------
// Captura del expediente clínico odontológico (FO-CD-00003) por pasos.
//
// El formato en papel se llena por partes a lo largo de la consulta, así que
// cada paso guarda contra el servidor al avanzar y el expediente vive como
// 'borrador' hasta que se marca 'completado' en el último paso. Se guarda el
// formulario completo en cada PUT (no hay merge parcial en el backend).
// ---------------------------------------------------------------------------
import * as React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Check, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import api from '../../../lib/api'
import { normalizeExpediente } from './defaults'
import { ESTADOS_EXPEDIENTE, METADATOS_FORMATO } from './constants'

import DatosGeneralesSection from './sections/DatosGeneralesSection'
import MotivoConsultaSection from './sections/MotivoConsultaSection'
import AntecedentesHeredofamiliaresSection from './sections/AntecedentesHeredofamiliaresSection'
import AntecedentesPatologicosSection from './sections/AntecedentesPatologicosSection'
import MedicamentosAlergiasSection from './sections/MedicamentosAlergiasSection'
import AntecedentesNoPatologicosSection from './sections/AntecedentesNoPatologicosSection'
import PadecimientoActualSection from './sections/PadecimientoActualSection'
import AparatosYSistemasSection from './sections/AparatosYSistemasSection'
import ExploracionFisicaSection from './sections/ExploracionFisicaSection'
import OdontogramaSection from './sections/OdontogramaSection'
import EstudiosDiagnosticoSection from './sections/EstudiosDiagnosticoSection'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const PASOS = [
  {
    id: 'datos-generales',
    titulo: 'Datos generales',
    descripcion: 'Identificación del paciente y fecha de la consulta.',
    Component: DatosGeneralesSection,
    // Solo estos campos bloquean el avance; el resto del expediente se puede
    // dejar incompleto y retomar después.
    requeridos: ['nombre', 'edad', 'sexo', 'fechaConsulta'],
  },
  {
    id: 'motivo',
    titulo: 'Motivo de la consulta',
    descripcion: 'Qué trae al paciente a consulta.',
    Component: MotivoConsultaSection,
  },
  {
    id: 'heredofamiliares',
    titulo: 'Antecedentes heredofamiliares',
    descripcion: 'Padecimientos presentes en la familia directa.',
    Component: AntecedentesHeredofamiliaresSection,
  },
  {
    id: 'patologicos',
    titulo: 'Antecedentes patológicos',
    descripcion: 'Antecedentes personales, con tiempo de evolución.',
    Component: AntecedentesPatologicosSection,
  },
  {
    id: 'medicamentos',
    titulo: 'Medicamentos y alergias',
    descripcion: 'Tratamientos en curso y reacciones alérgicas.',
    Component: MedicamentosAlergiasSection,
  },
  {
    id: 'no-patologicos',
    titulo: 'No patológicos y gineco-obstétricos',
    descripcion: 'Tabaquismo, embarazo y periodo menstrual.',
    Component: AntecedentesNoPatologicosSection,
  },
  {
    id: 'padecimiento',
    titulo: 'Padecimiento actual',
    descripcion: 'Evolución del padecimiento y antecedentes bucales.',
    Component: PadecimientoActualSection,
  },
  {
    id: 'aparatos',
    titulo: 'Aparatos y sistemas',
    descripcion: 'Interrogatorio por aparatos.',
    Component: AparatosYSistemasSection,
  },
  {
    id: 'exploracion',
    titulo: 'Exploración física',
    descripcion: 'Signos vitales, cabeza, cavidad oral y cuello.',
    Component: ExploracionFisicaSection,
  },
  {
    id: 'odontograma',
    titulo: 'Odontograma',
    descripcion: 'Estado de las 32 piezas, inicial y final.',
    Component: OdontogramaSection,
  },
  {
    id: 'diagnostico',
    titulo: 'Diagnóstico y seguimiento',
    descripcion: 'Estudios, diagnóstico, próximas citas y firmas.',
    Component: EstudiosDiagnosticoSection,
  },
]

export default function ExpedienteWizard({ patient, patientId, record, onSaved }) {
  const [paso, setPaso] = React.useState(0)
  const [guardando, setGuardando] = React.useState(false)
  const [status, setStatus] = React.useState(record?.status || 'borrador')
  const chipsRef = React.useRef([])

  // Con 11 pasos el stepper no cabe a lo ancho: al cambiar de paso hay que
  // traer el chip activo a la vista o se pierde la referencia de dónde vas.
  React.useEffect(() => {
    chipsRef.current[paso]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [paso])

  const form = useForm({
    defaultValues: normalizeExpediente(record?.form_data, patient),
    mode: 'onBlur',
  })

  const { formState, getValues, reset, trigger } = form
  const pasoActual = PASOS[paso]
  const esUltimo = paso === PASOS.length - 1

  const guardar = React.useCallback(
    async ({ nuevoStatus, mensaje } = {}) => {
      const values = getValues()

      // El backend exige YYYY-MM-DD; `record.record_date` llega como fecha ISO
      // completa desde MySQL, así que se recorta antes de usarlo de respaldo.
      const fechaRespaldo = String(record?.record_date || '').split('T')[0]

      const payload = {
        record_date: values.fechaConsulta || fechaRespaldo || undefined,
        form_data: values,
        ...(nuevoStatus && { status: nuevoStatus }),
      }

      setGuardando(true)
      try {
        await api.put(`/pacientes/${patientId}/expediente/${record.id}`, payload)
        // Re-sembrar el formulario con lo guardado deja isDirty en false sin
        // perder lo capturado.
        reset(values)
        if (nuevoStatus) setStatus(nuevoStatus)
        if (mensaje) toast.success(mensaje)
        onSaved?.()
        return true
      } catch (err) {
        console.error(err)
        toast.error(err?.response?.data?.error || 'Error al guardar el expediente')
        return false
      } finally {
        setGuardando(false)
      }
    },
    [getValues, onSaved, patientId, record, reset]
  )

  const irA = async (destino) => {
    if (destino === paso) return

    // Al salir de un paso con campos obligatorios, se validan antes de avanzar.
    if (destino > paso && pasoActual.requeridos?.length) {
      const ok = await trigger(pasoActual.requeridos)
      if (!ok) {
        toast.error('Faltan campos obligatorios en este paso')
        return
      }
    }

    if (formState.isDirty) {
      const guardado = await guardar()
      if (!guardado) return
    }

    setPaso(destino)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const marcarCompletado = async () => {
    const ok = await trigger(PASOS[0].requeridos)
    if (!ok) {
      setPaso(0)
      toast.error('Faltan campos obligatorios en "Datos generales"')
      return
    }
    await guardar({ nuevoStatus: 'completado', mensaje: 'Expediente marcado como completado' })
  }

  const estadoBadge = ESTADOS_EXPEDIENTE[status] || ESTADOS_EXPEDIENTE.borrador
  const Seccion = pasoActual.Component

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader className="gap-4 border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {METADATOS_FORMATO.formatoCodigo} · {METADATOS_FORMATO.formatoRevision}
                </p>
                <h2 className="text-lg font-semibold">{pasoActual.titulo}</h2>
                <p className="text-sm text-muted-foreground">{pasoActual.descripcion}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                {formState.isDirty ? (
                  <span className="text-xs text-muted-foreground">Cambios sin guardar</span>
                ) : null}
              </div>
            </div>

            {/* Stepper: permite saltar a cualquier paso, guardando lo capturado. */}
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
              {PASOS.map((p, i) => {
                const activo = i === paso
                const anterior = i < paso

                return (
                  <button
                    key={p.id}
                    type="button"
                    ref={(el) => {
                      chipsRef.current[i] = el
                    }}
                    onClick={() => irA(i)}
                    disabled={guardando}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition',
                      activo
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-muted',
                      anterior && !activo && 'text-muted-foreground'
                    )}
                    title={p.titulo}
                  >
                    <span className="tabular-nums font-medium">{i + 1}</span>
                    <span className="max-w-[140px] truncate">{p.titulo}</span>
                  </button>
                )
              })}
            </div>
          </CardHeader>

          <CardContent className="py-6">
            <Seccion readOnly={false} />
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            <div className="text-xs text-muted-foreground">
              Paso {paso + 1} de {PASOS.length}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={paso === 0 || guardando}
                onClick={() => irA(paso - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={guardando}
                onClick={() => guardar({ mensaje: 'Borrador guardado' })}
              >
                {guardando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar borrador
              </Button>

              {esUltimo ? (
                <Button type="button" disabled={guardando} onClick={marcarCompletado}>
                  <Check className="mr-2 h-4 w-4" />
                  Guardar y completar
                </Button>
              ) : (
                <Button type="button" disabled={guardando} onClick={() => irA(paso + 1)}>
                  Siguiente
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  )
}
