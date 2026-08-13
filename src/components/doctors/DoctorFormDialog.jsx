'use client'

// components/doctors/DoctorFormDialog.jsx
// Alta y edición de médicos del catálogo (/admin/medicos).

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const VACIO = { nombre: '', titulo: '', cedula_profesional: '', activo: true }

export default function DoctorFormDialog({ open, onOpenChange, doctor, onSubmit }) {
  const esEdicion = Boolean(doctor?.id)

  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // Re-sembrar al abrir: el diálogo se reutiliza para alta y edición.
  useEffect(() => {
    if (!open) return

    setError(null)
    setForm(
      doctor
        ? {
            nombre: doctor.nombre || '',
            titulo: doctor.titulo || '',
            cedula_profesional: doctor.cedula_profesional || '',
            activo: doctor.activo === 1 || doctor.activo === true,
          }
        : VACIO
    )
  }, [open, doctor])

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const guardar = async () => {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    if (!form.cedula_profesional.trim()) return setError('La cédula profesional es obligatoria.')

    setGuardando(true)
    setError(null)
    try {
      await onSubmit({
        nombre: form.nombre.trim(),
        titulo: form.titulo.trim(),
        cedula_profesional: form.cedula_profesional.trim(),
        activo: form.activo,
      })
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || 'No se pudo guardar el médico.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !guardando && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar médico' : 'Nuevo médico'}</DialogTitle>
          <DialogDescription>
            Aparecerá en el selector de odontólogo de las firmas del expediente clínico.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doctor-nombre">
              Nombre<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              id="doctor-nombre"
              value={form.nombre}
              disabled={guardando}
              placeholder="DRA. CONSUELO OCHOA SALAYA"
              onChange={(e) => set('nombre')(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doctor-titulo">Título / especialidad</Label>
            <Input
              id="doctor-titulo"
              value={form.titulo}
              disabled={guardando}
              placeholder="CIRUJANO DENTISTA"
              onChange={(e) => set('titulo')(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doctor-cedula">
              Cédula profesional<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              id="doctor-cedula"
              value={form.cedula_profesional}
              disabled={guardando}
              placeholder="1306579"
              onChange={(e) => set('cedula_profesional')(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">No puede repetirse entre médicos.</p>
          </div>

          <div className="flex items-start gap-2 rounded-md border p-3">
            <Checkbox
              id="doctor-activo"
              className="mt-0.5"
              checked={form.activo}
              disabled={guardando}
              onCheckedChange={(v) => set('activo')(v === true)}
            />
            <div className="space-y-0.5">
              <Label htmlFor="doctor-activo" className="text-sm font-medium">
                Activo
              </Label>
              <p className="text-xs text-muted-foreground">
                Solo los médicos activos aparecen en el selector del expediente.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" disabled={guardando} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {esEdicion ? 'Guardar cambios' : 'Crear médico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
