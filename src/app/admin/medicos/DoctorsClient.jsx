'use client'

// src/app/admin/medicos/DoctorsClient.jsx
// ---------------------------------------------------------------------------
// Catálogo de médicos de la clínica. Lo que se da de alta aquí es lo que
// aparece en el selector de "Odontólogo" de las firmas del expediente clínico.
//
// Dos formas de retirar a un médico:
//   - Dar de baja (activo = 0): desaparece del selector pero los expedientes
//     que firmó siguen mostrando su nombre. Es lo normal.
//   - Eliminar: solo para altas equivocadas. El backend lo rechaza si algún
//     expediente ya lo tiene como firmante.
// ---------------------------------------------------------------------------

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { BadgeCheck, Loader2, Pencil, Plus, Search, Trash2, UserRoundX, X } from 'lucide-react'

import api, { fetcher } from '../../../../lib/api'
import SectionTitle from '@/components/SectionTitle'
import DoctorFormDialog from '@/components/doctors/DoctorFormDialog'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const normalizar = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const esActivo = (doctor) => doctor?.activo === 1 || doctor?.activo === true

export default function DoctorsClient({ initialDoctors = [] }) {
  const {
    data: doctors,
    isLoading,
    error,
    mutate,
  } = useSWR('/doctors?todos=1', fetcher, {
    fallbackData: Array.isArray(initialDoctors) ? initialDoctors : [],
  })

  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState(null)

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const listados = useMemo(() => {
    const q = normalizar(query)
    if (!q) return doctors || []

    return (doctors || []).filter((d) =>
      [d.nombre, d.titulo, d.cedula_profesional].some((campo) => normalizar(campo).includes(q))
    )
  }, [doctors, query])

  const activos = (doctors || []).filter(esActivo).length

  const abrirNuevo = () => {
    setEditando(null)
    setFormOpen(true)
  }

  const abrirEdicion = (doctor) => {
    setEditando(doctor)
    setFormOpen(true)
  }

  // El diálogo espera que esto lance si falla, para poder mostrar el error.
  const guardar = async (datos) => {
    if (editando?.id) {
      await api.put(`/doctors/${editando.id}`, datos)
      toast.success('Médico actualizado')
    } else {
      await api.post('/doctors', datos)
      toast.success('Médico creado')
    }
    await mutate()
  }

  const alternarActivo = async (doctor) => {
    const activar = !esActivo(doctor)
    try {
      await api.put(`/doctors/${doctor.id}`, { activo: activar })
      await mutate()
      toast.success(activar ? 'Médico reactivado' : 'Médico dado de baja')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.error || 'No se pudo cambiar el estado')
    }
  }

  const eliminar = async () => {
    if (!aEliminar) return

    setEliminando(true)
    try {
      await api.delete(`/doctors/${aEliminar.id}`)
      await mutate()
      setAEliminar(null)
      toast.success('Médico eliminado')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.error || 'No se pudo eliminar el médico')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle
        title="Médicos"
        breadcrumbs={[{ label: 'Administración' }, { label: 'Médicos' }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o cédula"
            className="pl-9 pr-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <Button onClick={abrirNuevo}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo médico
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {activos} médico{activos === 1 ? '' : 's'} activo{activos === 1 ? '' : 's'} de{' '}
        {(doctors || []).length}. Solo los activos aparecen en el selector del expediente clínico.
      </p>

      {error ? (
        <div className="mt-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No se pudo cargar el catálogo de médicos.</AlertDescription>
          </Alert>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : listados.length ? (
        <Card className="mt-4 divide-y">
          {listados.map((doctor) => {
            const activo = esActivo(doctor)

            return (
              <div key={doctor.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{doctor.nombre}</p>
                    {activo ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Dado de baja</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[doctor.titulo, doctor.cedula_profesional ? `Céd. prof. ${doctor.cedula_profesional}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => abrirEdicion(doctor)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => alternarActivo(doctor)}
                    title={activo ? 'Dar de baja' : 'Reactivar'}
                  >
                    {activo ? (
                      <UserRoundX className="h-4 w-4" />
                    ) : (
                      <BadgeCheck className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setAEliminar(doctor)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </Card>
      ) : (
        <div className="mt-6">
          <Alert>
            <AlertTitle>{query ? 'Sin resultados' : 'Sin médicos'}</AlertTitle>
            <AlertDescription>
              {query
                ? `Ningún médico coincide con "${query}".`
                : 'Da de alta al primer médico para poder firmar expedientes.'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <DoctorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        doctor={editando}
        onSubmit={guardar}
      />

      <AlertDialog open={Boolean(aEliminar)} onOpenChange={(v) => !v && setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar médico</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <span className="font-semibold">{aEliminar?.nombre}</span> del catálogo.
              Esta acción no se puede deshacer. Si ya firmó algún expediente, dale de baja en lugar
              de eliminarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                eliminar()
              }}
              disabled={eliminando}
            >
              {eliminando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
