import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

export default function CitasTable({
  citas,
  formatearFechaHora,
  onEdit,
  onDelete,
}) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (citas.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No hay citas registradas aún
        </Typography>
      </Box>
    )
  }

  // siempre ordena descendente por fecha
  const sorted = [...citas].sort((a, b) =>
    new Date(b.appointmentAt) - new Date(a.appointmentAt)
  )

  // Variante móvil: tarjetas
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map((cita, idx) => {
          const numero = sorted.length - idx
          return (
            <Card key={cita.id} variant="outlined">
              <CardContent sx={{ '& > *:not(:last-child)': { mb: 1 } }}>
                <Typography variant="subtitle2">
                  <strong>N.º:</strong> {numero}
                </Typography>
                <Typography variant="body2">
                  <strong>Fecha y Hora:</strong>{' '}
                  {formatearFechaHora(cita.appointmentAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Tratamiento:</strong> {cita?.tratamiento || '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Observaciones:</strong> {cita.observaciones || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <strong>Registrado:</strong> {formatearFechaHora(cita.createdAt)}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<EditIcon />}
                    size="small"
                    variant="outlined"
                    onClick={() => onEdit(cita)}
                  >
                    Editar
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => onDelete(cita.id)}
                  >
                    Eliminar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>
    )
  }

  // Variante escritorio: tabla
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            {['N.º','Fecha y Hora','Tratamiento','Observaciones','Registrado','Acciones']
              .map(h => (
                <TableCell key={h} sx={{ fontWeight: 'bold' }}>
                  {h}
                </TableCell>
              ))
            }
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((cita, idx) => {
            const numero = sorted.length - idx
            return (
              <TableRow key={cita.id} hover>
                <TableCell>{numero}</TableCell>
                <TableCell>{formatearFechaHora(cita.appointmentAt)}</TableCell>
                <TableCell>{cita?.tratamiento || '—'}</TableCell>
                <TableCell style={{ maxWidth:"200px"}}>{cita.observaciones || '—'}</TableCell>
                <TableCell>{formatearFechaHora(cita.createdAt)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                    variant='outlined'
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => onEdit(cita)}
                    >
                      Editar
                    </Button>
                    <Button
                    variant='outlined'
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => onDelete(cita.id)}
                    >
                      Eliminar
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
