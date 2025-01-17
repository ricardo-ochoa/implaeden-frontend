import React, { useEffect } from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import ProfilePictureUpload from './ProfilePictureUpload';
import useUpdatePatient from '../../lib/hooks/useUpdatePatient';

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

  const onSubmit = async (data) => {
    try {
      const normalizedData = {
        ...data,
        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento).toISOString().split('T')[0]
          : null,
        foto_perfil_url: data.foto_perfil_url || null,
      };
  
      await updatePatient(patient.id, normalizedData);
      onSuccess(normalizedData); // Notifica al componente padre
      onClose(); // Cierra el modal
    } catch (err) {
      console.error('Error al actualizar los datos:', err);
    }
  };   

  const minDate = `${currentYear - 100}-01-01`;
  const maxDate = `${currentYear - 1}-12-31`;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
          Editar Paciente
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="foto_perfil_url"
            control={control}
            render={({ field }) => (
              <ProfilePictureUpload
                onChange={(file) => field.onChange(file)}
                currentImage={patient?.foto_perfil_url}
              />
            )}
          />

          <Controller
            name="nombre"
            control={control}
            rules={{
                required: 'Este campo es obligatorio.',
                pattern: {
                  value: /^[A-Za-z ]+$/,
                  message: 'Solo se permiten letras y espacios.',
                },
              }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nombre"
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

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
              <TextField
                {...field}
                fullWidth
                label="Apellidos"
                error={!!errors.apellidos}
                helperText={errors.apellidos?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

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
              <TextField
                {...field}
                fullWidth
                label="Teléfono"
                error={!!errors.telefono}
                helperText={errors.telefono?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Controller
            name="fecha_nacimiento"
            control={control}
            rules={{
              required: 'La fecha de nacimiento es obligatoria.',
              validate: (value) => {
                const selectedDate = new Date(value);
                const min = new Date(minDate);
                const max = new Date(maxDate);
                return (
                  selectedDate >= min &&
                  selectedDate <= max
                ) || `La fecha debe estar entre ${minDate} y ${maxDate}.`;
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: minDate,
                  max: maxDate,
                }}
                label="Fecha de Nacimiento"
                error={!!errors.fecha_nacimiento}
                helperText={errors.fecha_nacimiento?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

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
              <TextField
                {...field}
                fullWidth
                type="email"
                label="Correo Electrónico"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Controller
            name="direccion"
            control={control}
            rules={{
              required: 'La dirección es obligatoria.',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Dirección"
                error={!!errors.direccion}
                helperText={errors.direccion?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
            fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={!isValid || loading}
            >
              Guardar
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
}
