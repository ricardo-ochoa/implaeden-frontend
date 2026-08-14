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
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Check, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import api from '../../../lib/api'
import { normalizeExpediente } from './defaults'
import { ESTADOS_EXPEDIENTE, METADATOS_FORMATO } from './constants'
import { REGLAS_PASOS } from './completitud'

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

// Qué pinta cada paso. Las reglas de "¿ya está contestado?" y el orden viven en
// completitud.js, porque la lista del historial las usa para su contador sin
// montar el formulario; aquí solo se les agrega lo visual.
//
// `obligatorio` (en completitud.js) bloquea el avance hasta que `completo` se
// cumple; en el resto de los pasos `completo` solo pinta el chip de verde, como
// señal de que hay algo capturado, no de que sea exigible.
const SECCIONES = {
  'datos-generales': {
    descripcion: 'Identificación del paciente y fecha de la consulta.',
    Component: DatosGeneralesSection,
    // `requeridos` alimenta a react-hook-form para pintar el error debajo de
    // cada input; `completo` es la misma regla vista desde el stepper.
    requeridos: ['nombre', 'edad', 'sexo', 'fechaConsulta'],
  },
  motivo: {
    descripcion: 'Qué trae al paciente a consulta.',
    Component: MotivoConsultaSection,
  },
  heredofamiliares: {
    descripcion: 'Padecimientos presentes en la familia directa.',
    Component: AntecedentesHeredofamiliaresSection,
  },
  patologicos: {
    descripcion: 'Antecedentes personales, con tiempo de evolución.',
    Component: AntecedentesPatologicosSection,
  },
  medicamentos: {
    descripcion: 'Tratamientos en curso y reacciones alérgicas.',
    Component: MedicamentosAlergiasSection,
  },
  'no-patologicos': {
    descripcion: 'Tabaquismo, embarazo y periodo menstrual.',
    Component: AntecedentesNoPatologicosSection,
  },
  padecimiento: {
    descripcion: 'Evolución del padecimiento y antecedentes bucales.',
    Component: PadecimientoActualSection,
  },
  aparatos: {
    descripcion: 'Interrogatorio por aparatos.',
    Component: AparatosYSistemasSection,
  },
  exploracion: {
    descripcion: 'Signos vitales, cabeza, cavidad oral y cuello.',
    Component: ExploracionFisicaSection,
  },
  odontograma: {
    descripcion: 'Estado de las 32 piezas, inicial y final.',
    Component: OdontogramaSection,
  },
  diagnostico: {
    descripcion: 'Estudios, diagnóstico, próximas citas y firmas.',
    Component: EstudiosDiagnosticoSection,
  },
}

const PASOS = REGLAS_PASOS.map((regla) => ({ ...regla, ...SECCIONES[regla.id] }))

const mensajeFaltante = (paso, valores) =>
  typeof paso.faltante === 'function' ? paso.faltante(valores) : paso.faltante

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

  const { control, formState, getValues, reset, trigger } = form
  const pasoActual = PASOS[paso]
  const esUltimo = paso === PASOS.length - 1

  // El stepper tiene que reflejar lo capturado mientras se escribe, así que se
  // observa el formulario completo. Solo la sección activa está montada, de modo
  // que el re-render por tecleo se queda en un paso a la vez.
  const valores = useWatch({ control })

  const estados = React.useMemo(
    () => PASOS.map((p) => Boolean(p.completo?.(valores))),
    [valores]
  )

  const contestados = estados.filter(Boolean).length
  const obligatoriosPendientes = PASOS.filter((p, i) => p.obligatorio && !estados[i]).length

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

    // Solo se exige al avanzar: regresar a corregir siempre está permitido, y
    // "Guardar borrador" sigue funcionando con el paso a medias.
    if (destino > paso && pasoActual.obligatorio) {
      // Dos filtros distintos: `trigger` cubre las reglas de cada input (rango
      // de edad, formato) y pinta el error debajo; `completo` cubre lo que no
      // es un campo de texto (un Sí/No sin marcar) y se explica con un toast.
      if (pasoActual.requeridos?.length) {
        const ok = await trigger(pasoActual.requeridos)
        if (!ok) {
          toast.error(mensajeFaltante(pasoActual, getValues()))
          return
        }
      }

      if (!pasoActual.completo(getValues())) {
        toast.error(mensajeFaltante(pasoActual, getValues()))
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
    const actuales = getValues()

    // Un expediente "completado" no puede tener pasos obligatorios en blanco,
    // aunque se haya llegado al final saltando con el stepper hacia atrás.
    const pendiente = PASOS.findIndex((p) => p.obligatorio && !p.completo(actuales))
    if (pendiente !== -1) {
      setPaso(pendiente)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      if (PASOS[pendiente].requeridos?.length) await trigger(PASOS[pendiente].requeridos)
      toast.error(mensajeFaltante(PASOS[pendiente], actuales))
      return
    }

    // Sin huecos, pero las reglas por campo (rango de edad, formato de correo)
    // se validan aparte: se puede llegar aquí sin haber pasado por el paso 1.
    const camposValidos = await trigger(PASOS[0].requeridos)
    if (!camposValidos) {
      setPaso(0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast.error(mensajeFaltante(PASOS[0], actuales))
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

            {/* Stepper: permite saltar a cualquier paso, guardando lo capturado.
                Verde con palomita = ya contestado; asterisco = obligatorio que
                todavía bloquea el avance. */}
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
              {PASOS.map((p, i) => {
                const activo = i === paso
                const anterior = i < paso
                const completo = estados[i]
                const pendienteObligatorio = p.obligatorio && !completo

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
                      activo && 'border-primary bg-primary text-primary-foreground',
                      !activo && completo &&
                        'border-emerald-500/60 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900',
                      !activo && !completo && 'hover:bg-muted',
                      !activo && !completo && anterior && 'text-muted-foreground'
                    )}
                    title={
                      completo
                        ? `${p.titulo} — contestado`
                        : pendienteObligatorio
                          ? `${p.titulo} — obligatorio, pendiente`
                          : p.titulo
                    }
                  >
                    <span className="tabular-nums font-medium">{i + 1}</span>
                    <span className="max-w-[140px] truncate">{p.titulo}</span>

                    {completo ? (
                      <Check
                        className={cn('h-3.5 w-3.5 shrink-0', !activo && 'text-emerald-600 dark:text-emerald-400')}
                        aria-label="Contestado"
                      />
                    ) : pendienteObligatorio ? (
                      <span
                        className={cn('shrink-0 font-semibold', activo ? '' : 'text-destructive')}
                        aria-label="Obligatorio pendiente"
                      >
                        *
                      </span>
                    ) : null}
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
              Paso {paso + 1} de {PASOS.length} · {contestados} contestado
              {contestados === 1 ? '' : 's'}
              {obligatoriosPendientes ? (
                <span className="ml-1 font-medium text-destructive">
                  · {obligatoriosPendientes} obligatorio{obligatoriosPendientes === 1 ? '' : 's'} pendiente
                  {obligatoriosPendientes === 1 ? '' : 's'}
                </span>
              ) : null}
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
