import React from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import ProfilePictureUpload from './ProfilePictureUpload';

export default function AddPatientModal({ open, onClose, onSave }) {
  const currentYear = new Date().getFullYear(); // Año actual

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      nombre: '',
      apellidos: '',
      telefono: '',
      fecha_nacimiento: '',
      email: '',
      direccion: '',
      foto: null,
    },
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('nombre', data.nombre || '');
    formData.append('apellidos', data.apellidos || '');
    formData.append('telefono', data.telefono || '');
    formData.append('fecha_nacimiento', data.fecha_nacimiento || '');
    formData.append('email', data.email || '');
    formData.append('direccion', data.direccion || '');
  
    // Verifica que data.foto esté pasando correctamente
    if (data.foto) {
      formData.append('foto', data.foto); // Asegúrate de pasar el archivo directamente
    }
  
    console.log("FormData antes de enviar:", formData);
    onSave(formData); // Enviar el FormData
    reset(); // Limpiar el formulario
  };
  
  

  const minDate = `${currentYear - 100}-01-01`; // Fecha mínima hace 100 años
  const maxDate = `${currentYear - 1}-12-31`; // Fecha máxima hasta el año pasado

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
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Agregar nuevo paciente
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="foto"
          control={control}
          render={({ field }) => (
            <ProfilePictureUpload
              onChange={(file) => field.onChange(file)}
            />
          )}
        />

          <Controller
            name="nombre"
            control={control}
            rules={{
              required: 'El nombre es obligatorio.',
              pattern: {
                value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/,
                message: 'El nombre solo puede contener letras y espacios.',
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
                value: /^[0-9]+$/,
                message: 'El teléfono solo puede contener números.',
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
                const minDate = new Date(currentYear - 100, 0, 1); // hace 100 años desde ahora
                const maxDate = new Date(currentYear - 1, 11, 31); // el año pasado
                return (
                  selectedDate >= minDate &&
                  selectedDate <= maxDate
                ) || 'La fecha debe estar entre hace 100 años y el año pasado.';
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
{/* 
          <Controller
            name="foto"
            control={control}
            render={({ field }) => (
              <input
                type="file"
                onChange={(e) => field.onChange(e.target.files)}
                accept="image/*"
              />
            )}
          /> */}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!isValid}
            >
              Guardar
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancelar
            </Button>
          </Box>

        </form>
      </Box>
    </Modal>
  );
}
