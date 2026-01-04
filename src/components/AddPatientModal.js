"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";

import ProfilePictureUpload from "./ProfilePictureUpload";
import { useRandomAvatar } from "../../lib/hooks/useRandomAvatar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddPatientModal({ open, onClose, onSave, error }) {
  const currentYear = new Date().getFullYear();
  const defaultAvatar = useRandomAvatar();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      nombre: "",
      apellidos: "",
      telefono: "",
      fecha_nacimiento: "",
      email: "",
      direccion: "",
      foto: null,
    },
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append("nombre", data.nombre || "");
    formData.append("apellidos", data.apellidos || "");
    formData.append("telefono", data.telefono || "");
    formData.append("fecha_nacimiento", data.fecha_nacimiento || "");
    formData.append("email", data.email || "");
    formData.append("direccion", data.direccion || "");

    if (data.foto) {
      formData.append("foto", data.foto);
    } else {
      // Nota: FormData "foto" normalmente espera File/Blob.
      // Si tu backend acepta URL string, esto está bien. Si no, quítalo.
      formData.append("foto", defaultAvatar);
    }

    onSave(formData);
    reset();
  };

  const minDate = `${currentYear - 100}-01-01`;
  const maxDate = `${currentYear - 1}-12-31`;

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleCancel() : null)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-center">Agregar nuevo paciente</DialogTitle>
        </DialogHeader>

        {/* Error del backend (opcional) */}
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {String(error)}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Foto */}
          <Controller
            name="foto"
            control={control}
            render={({ field }) => (
              <ProfilePictureUpload
                onChange={(file) => field.onChange(file)}
                currentImage={defaultAvatar}
              />
            )}
          />

          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Controller
              name="nombre"
              control={control}
              rules={{
                required: "El nombre es obligatorio.",
                pattern: {
                  value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/,
                  message: "El nombre solo puede contener letras y espacios.",
                },
              }}
              render={({ field }) => (
                <Input
                  id="nombre"
                  {...field}
                  placeholder="Nombre"
                  className={errors.nombre ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              )}
            />
            {errors.nombre?.message ? (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            ) : null}
          </div>

          {/* Apellidos */}
          <div className="space-y-1.5">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Controller
              name="apellidos"
              control={control}
              rules={{
                required: "Los apellidos son obligatorios.",
                pattern: {
                  value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/,
                  message: "Los apellidos solo pueden contener letras y espacios.",
                },
              }}
              render={({ field }) => (
                <Input
                  id="apellidos"
                  {...field}
                  placeholder="Apellidos"
                  className={errors.apellidos ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              )}
            />
            {errors.apellidos?.message ? (
              <p className="text-xs text-destructive">{errors.apellidos.message}</p>
            ) : null}
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Controller
              name="telefono"
              control={control}
              rules={{
                required: "El teléfono es obligatorio.",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "El teléfono solo puede contener números.",
                },
              }}
              render={({ field }) => (
                <Input
                  id="telefono"
                  {...field}
                  inputMode="numeric"
                  placeholder="Teléfono"
                  className={errors.telefono ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              )}
            />
            {errors.telefono?.message ? (
              <p className="text-xs text-destructive">{errors.telefono.message}</p>
            ) : null}
          </div>

          {/* Fecha nacimiento */}
          <div className="space-y-1.5">
            <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
            <Controller
              name="fecha_nacimiento"
              control={control}
              rules={{
                required: "La fecha de nacimiento es obligatoria.",
                validate: (value) => {
                  const selectedDate = new Date(value);
                  const min = new Date(currentYear - 100, 0, 1);
                  const max = new Date(currentYear - 1, 11, 31);
                  return (
                    (selectedDate >= min && selectedDate <= max) ||
                    "La fecha debe estar entre hace 100 años y el año pasado."
                  );
                },
              }}
              render={({ field }) => (
                <Input
                  id="fecha_nacimiento"
                  {...field}
                  type="date"
                  min={minDate}
                  max={maxDate}
                  className={errors.fecha_nacimiento ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              )}
            />
            {errors.fecha_nacimiento?.message ? (
              <p className="text-xs text-destructive">{errors.fecha_nacimiento.message}</p>
            ) : null}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "El correo electrónico es obligatorio.",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Ingrese un correo electrónico válido.",
                },
              }}
              render={({ field }) => (
                <Input
                  id="email"
                  {...field}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              )}
            />
            {errors.email?.message ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Controller
              name="direccion"
              control={control}
              rules={{
                required: "La dirección es obligatoria.",
              }}
              render={({ field }) => (
                <Input
                  id="direccion"
                  {...field}
                  placeholder="Dirección"
                  className={errors.direccion ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              )}
            />
            {errors.direccion?.message ? (
              <p className="text-xs text-destructive">{errors.direccion.message}</p>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCancel}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
