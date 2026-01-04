// src/components/EditPatientModal.jsx
'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import ProfilePictureUpload from './ProfilePictureUpload';
import useUpdatePatient from '../../lib/hooks/useUpdatePatient';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function EditPatientModal({ open, onClose, patient, onSuccess }) {
  const currentYear = new Date().getFullYear();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      nombre: '',
      apellidos: '',
      telefono: '',
      fecha_nacimiento: '',
      email: '',
      direccion: '',
      foto_perfil_url: null,
    },
  });

  const { updatePatient, loading, error } = useUpdatePatient();

  useEffect(() => {
    if (patient) {
      reset({
        nombre: patient.nombre || '',
        apellidos: patient.apellidos || '',
        telefono: patient.telefono || '',
        fecha_nacimiento: patient.fecha_nacimiento
          ? new Date(patient.fecha_nacimiento).toISOString().split('T')[0]
          : '',
        email: patient.email || '',
        direccion: patient.direccion || '',
        foto_perfil_url: patient.foto_perfil_url || null,
      });
    }
  }, [patient, reset]);

  const minDate = `${currentYear - 100}-01-01`;
  const maxDate = `${currentYear - 1}-12-31`;

  const min = parseISO(minDate);
  const max = parseISO(maxDate);

  const onSubmit = async (data) => {
    try {
      const normalizedData = {
        ...data,
        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento).toISOString().split('T')[0]
          : null,
        eliminarFoto: data.foto_perfil_url === null ? 'true' : 'false',
      };

      await updatePatient(patient.id, normalizedData);
      onSuccess(normalizedData);
      onClose();
    } catch (err) {
      console.error('Error al actualizar los datos:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-center">Editar Paciente</DialogTitle>
          <DialogDescription className="text-center">
            Actualiza la información del paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Foto */}
          <Controller
            name="foto_perfil_url"
            control={control}
            render={({ field }) => (
              <ProfilePictureUpload
                onChange={(file) => field.onChange(file)}
                currentImage={patient?.foto_perfil_url}
                isEdit
              />
            )}
          />

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Controller
              name="nombre"
              control={control}
              rules={{
                required: 'Este campo es obligatorio.',
                pattern: {
                  value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/,
                  message: 'Solo se permiten letras y espacios.',
                },
              }}
              render={({ field }) => (
                <Input id="nombre" {...field} placeholder="Nombre" aria-invalid={!!errors.nombre} />
              )}
            />
            {errors.nombre?.message && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Controller
              name="apellidos"
              control={control}
              rules={{
                required: 'Los apellidos son obligatorios.',
                pattern: {
                  value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/,
                  message: 'Los apellidos solo pueden contener letras y espacios.',
                },
              }}
              render={({ field }) => (
                <Input id="apellidos" {...field} placeholder="Apellidos" aria-invalid={!!errors.apellidos} />
              )}
            />
            {errors.apellidos?.message && (
              <p className="text-sm text-destructive">{errors.apellidos.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Controller
              name="telefono"
              control={control}
              rules={{
                required: 'El teléfono es obligatorio.',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'El teléfono debe tener exactamente 10 dígitos.',
                },
              }}
              render={({ field }) => (
                <Input
                  id="telefono"
                  {...field}
                  inputMode="numeric"
                  placeholder="10 dígitos"
                  aria-invalid={!!errors.telefono}
                />
              )}
            />
            {errors.telefono?.message && (
              <p className="text-sm text-destructive">{errors.telefono.message}</p>
            )}
          </div>

          {/* ✅ Fecha Nacimiento con Calendar dropdown (Month & Year) */}
          <div className="space-y-2">
            <Label>Fecha de Nacimiento</Label>

            <Controller
              name="fecha_nacimiento"
              control={control}
              rules={{
                required: 'La fecha de nacimiento es obligatoria.',
                validate: (value) => {
                  if (!value) return 'La fecha de nacimiento es obligatoria.';
                  const selectedDate = new Date(value);
                  return (
                    (selectedDate >= min && selectedDate <= max) ||
                    `La fecha debe estar entre ${minDate} y ${maxDate}.`
                  );
                },
              }}
              render={({ field }) => {
                const selected = field.value ? parseISO(field.value) : undefined;

                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground',
                          errors.fecha_nacimiento && 'border-destructive'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(selected, 'dd/MM/yyyy') : 'Selecciona una fecha'}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selected}
                        defaultMonth={selected || max}
                        onSelect={(date) => {
                          if (!date) return;
                          field.onChange(format(date, 'yyyy-MM-dd'));
                        }}
                        captionLayout="dropdown"   // ✅ como tu ejemplo
                        fromDate={min}             // ✅ limita dropdown years
                        toDate={max}               // ✅ limita dropdown years
                        disabled={(date) => date < min || date > max}
                        initialFocus
                        className="rounded-lg border border-border shadow-sm"
                      />
                    </PopoverContent>
                  </Popover>
                );
              }}
            />

            {errors.fecha_nacimiento?.message && (
              <p className="text-sm text-destructive">{errors.fecha_nacimiento.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Controller
              name="email"
              control={control}
              rules={{
                required: 'El correo electrónico es obligatorio.',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Ingrese un correo electrónico válido.',
                },
              }}
              render={({ field }) => (
                <Input
                  id="email"
                  type="email"
                  {...field}
                  placeholder="correo@dominio.com"
                  aria-invalid={!!errors.email}
                />
              )}
            />
            {errors.email?.message && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Controller
              name="direccion"
              control={control}
              rules={{ required: 'La dirección es obligatoria.' }}
              render={({ field }) => (
                <Input
                  id="direccion"
                  {...field}
                  placeholder="Calle, número, colonia..."
                  aria-invalid={!!errors.direccion}
                />
              )}
            />
            {errors.direccion?.message && (
              <p className="text-sm text-destructive">{errors.direccion.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || loading} className="min-w-[140px]">
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
