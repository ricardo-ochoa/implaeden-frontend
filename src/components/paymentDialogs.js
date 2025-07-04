// components/paymentDialogs.js

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { PAYMENT_METHODS } from '../../lib/utils/paymentmethods';

export function PaymentDetailsDialog({
  open,
  onClose,
  payment,
  onDownload,
}) {
  if (!payment) return null;

  const metodoLabel = PAYMENT_METHODS.find(m => m.value === payment.metodo_pago)
  ?.label
  || payment.metodo_pago;

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pagado":
        return "success";   // verde
      case "pendiente":
        return "warning";   // amarillo/naranja
      case "parcial":
        return "info";      // azul claro
      case "cancelado":
        return "error";     // rojo
      default:
        return "default";   // gris
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Grid container justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={"bold"} color='primary'>Detalles del Pago</Typography>
          <Chip
            label={payment.estado.toUpperCase()}
            color={getStatusColor(payment.estado)}
            size="small"
        />
        </Grid>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" fontWeight={"bold"}>Fecha</Typography>
            <Typography>
              <CalendarTodayIcon fontSize="small"/> {payment.fecha}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" fontWeight={"bold"}>Monto</Typography>
            <Typography>
              <AttachMoneyIcon fontSize="small" /> {payment.monto} mxn
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" fontWeight={"bold"}>Tratamiento</Typography>
            <Typography>{payment.tratamiento}</Typography>
          </Grid>
          {payment.numero_factura && (
            <Grid item xs={6}>
              <Typography variant="subtitle2" fontWeight={"bold"}>Número de Factura</Typography>
              <Typography>{payment.numero_factura}</Typography>
            </Grid>
          )}
          {payment.metodo_pago && (
            <Grid item xs={6}>
              <Typography variant="subtitle2" fontWeight={"bold"}>Método de Pago</Typography>
              <Typography>{metodoLabel}</Typography>
            </Grid>
          )}
          {payment.notas && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={"bold"}>Notas</Typography>
              <Typography>{payment.notas}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDownload}>Descargar</Button>
        <Button onClick={onClose} variant="contained">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export function PaymentFormDialog({
  open,
  onClose,
  initialData,
  servicios,
  onSave,
}) {
  const [form, setForm] = useState(initialData || {
    fecha: '',
    patient_service_id: '',
    monto: '',
    estado: 'pendiente',
    metodo_pago: '',
    notas: '',
  });

  useEffect(() => {
    setForm(initialData || {
      fecha: '',
      patient_service_id: '',
      monto: '',
      estado: 'pendiente',
      metodo_pago: '',
      notas: '',
    });
  }, [initialData]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={"bold"}>{initialData ? 'Editar Pago' : 'Nuevo Pago'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={handleChange('fecha')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tratamiento</InputLabel>
              <Select
                value={form.patient_service_id}
                onChange={handleChange('patient_service_id')}
                label="Tratamiento"
              >
                {servicios.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} — {s.totalCost}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Monto"
              type="number"
              value={form.monto}
              onChange={handleChange('monto')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={form.estado}
                onChange={handleChange('estado')}
                label="Estado"
              >
                <MenuItem value="pagado">Pagado</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="parcial">Parcial</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Método de Pago</InputLabel>
            <Select
                value={form.metodo_pago}
                onChange={handleChange('metodo_pago')}
                label="Método de Pago"
            >
                <MenuItem value="Efectivo">Efectivo</MenuItem>
                <MenuItem value="tarjeta_credito">Tarjeta de crédito</MenuItem>
                <MenuItem value="tarjeta_debito">Tarjeta de débito</MenuItem>
                <MenuItem value="transferencia">Transferencia bancaria</MenuItem>
            </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Notas"
              multiline
              rows={3}
              value={form.notas}
              onChange={handleChange('notas')}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(form)} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={"bold"}>Confirmar eliminación</DialogTitle>
      <DialogContent dividers>
        <Typography>¿Estás seguro de eliminar este pago?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onConfirm} color="error">
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
